import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FunctionArgs } from "convex/server";
import { toast } from "sonner";

export type CreateEventPayload = FunctionArgs<
	typeof api.events.mutations.createEvent
>;

/** Calendar UI reads from getEventsByDateRange, not getEventsByUser. */
const dateRangeQueryKeyPrefix = convexQuery(
	api.events.queries.getEventsByDateRange,
	{ startTimestamp: 0, endTimestamp: 0 },
).queryKey.slice(0, 2);

const TEMP_ID_PREFIX = "temp-";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function addEventToCache(
	prev: unknown,
	tempDoc: Record<string, unknown>,
): unknown {
	if (!Array.isArray(prev)) {
		return prev;
	}
	return [...prev, tempDoc];
}

/** Replace a doc in the cache (by temp id or real id) with the server doc. */
function replaceInCacheWithServerDoc(
	prev: unknown,
	replaceId: string,
	serverDoc: Record<string, unknown>,
): unknown {
	if (!Array.isArray(prev)) {
		return prev;
	}
	return prev.map((doc: Record<string, unknown>) =>
		doc._id === replaceId ? serverDoc : doc,
	);
}

function buildTempDoc(
	payload: CreateEventPayload,
	userId: Id<"users">,
	tempId: string,
): Record<string, unknown> {
	let startTimestamp: number;
	let endTimestamp: number;
	if (payload.startTimestamp != null && payload.endTimestamp != null) {
		startTimestamp = payload.startTimestamp;
		endTimestamp = payload.endTimestamp;
	} else if (payload.allDay && payload.startDateStr && payload.endDateStr) {
		startTimestamp = new Date(payload.startDateStr + "T00:00:00Z").getTime();
		endTimestamp = new Date(payload.endDateStr + "T00:00:00Z").getTime();
	} else {
		startTimestamp = 0;
		endTimestamp = 0;
	}
	return {
		_id: tempId,
		_creationTime: Date.now(),
		...payload,
		startTimestamp,
		endTimestamp,
		userId,
	};
}

/** Event overlaps cached range when using same buffer as getEventsByDateRange. */
function eventOverlapsRange(
	eventStart: number,
	eventEnd: number,
	rangeStart: number,
	rangeEnd: number,
): boolean {
	const bufferedStart = rangeStart - ONE_DAY_MS;
	const bufferedEnd = rangeEnd + ONE_DAY_MS;
	return eventStart <= bufferedEnd && eventEnd >= bufferedStart;
}

/**
 * useMutation for api.events.mutations.createEvent with optimistic update of the
 * getEventsByDateRange query cache (used by the calendar). Use this instead of
 * raw useConvexMutation so the new event appears in the UI immediately.
 */
export function useCreateEventMutation() {
	const queryClient = useQueryClient();
	const createEventFn = useConvexMutation(api.events.mutations.createEvent);

	const mutation = useMutation({
		mutationFn: createEventFn,
		onMutate: async (payload) => {
			await queryClient.cancelQueries({ queryKey: dateRangeQueryKeyPrefix });
			const tempId = `${TEMP_ID_PREFIX}${Date.now()}`;
			const allDateRangeEntries = queryClient.getQueriesData({
				queryKey: dateRangeQueryKeyPrefix,
			});
			let userId: Id<"users"> | undefined;
			for (const [_key, data] of allDateRangeEntries) {
				if (Array.isArray(data) && data.length > 0) {
					userId = (data[0] as Record<string, unknown>).userId as
						| Id<"users">
						| undefined;
					break;
				}
			}
			if (userId === undefined) {
				toast.success("Event created");
				return {
					previousDataByKey: [] as Array<readonly [readonly unknown[], unknown]>,
				};
			}
			const tempDoc = buildTempDoc(payload, userId, tempId);
			const eventStart = tempDoc.startTimestamp as number;
			const eventEnd = tempDoc.endTimestamp as number;
			const previousDataByKey: Array<readonly [readonly unknown[], unknown]> =
				[];
			for (const [queryKey, data] of allDateRangeEntries) {
				if (!Array.isArray(data)) {
					continue;
				}
				const args = (queryKey as readonly unknown[])[2] as
					| { startTimestamp: number; endTimestamp: number }
					| undefined;
				if (
					!args ||
					typeof args.startTimestamp !== "number" ||
					typeof args.endTimestamp !== "number"
				) {
					continue;
				}
				if (
					!eventOverlapsRange(
						eventStart,
						eventEnd,
						args.startTimestamp,
						args.endTimestamp,
					)
				) {
					continue;
				}
				previousDataByKey.push([queryKey, data]);
				queryClient.setQueryData(
					[...queryKey] as unknown[],
					addEventToCache(data, tempDoc),
				);
			}
			toast.success("Event created");
			return { previousDataByKey, tempId };
		},
		onSuccess: (serverEvent, _payload, context) => {
			const tempId = context?.tempId;
			if (typeof tempId !== "string") {
				return;
			}
			const allDateRangeEntries = queryClient.getQueriesData({
				queryKey: dateRangeQueryKeyPrefix,
			});
			for (const [queryKey, data] of allDateRangeEntries) {
				if (!Array.isArray(data)) {
					continue;
				}
				const hasTemp = data.some(
					(doc: Record<string, unknown>) => doc._id === tempId,
				);
				if (!hasTemp) {
					continue;
				}
				queryClient.setQueryData(
					[...queryKey] as unknown[],
					replaceInCacheWithServerDoc(data, tempId, serverEvent as Record<string, unknown>),
				);
			}
		},
		onError: (_err, _payload, context) => {
			const entries = context?.previousDataByKey;
			if (Array.isArray(entries)) {
				for (const [queryKey, data] of entries) {
					queryClient.setQueryData([...queryKey] as unknown[], data);
				}
			}
			toast.error("Failed to create event");
		},
	});

	return mutation;
}
