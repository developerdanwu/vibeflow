import { format } from "date-fns";
import type z from "zod";

/**
 * Creates a TanStack Router search middleware that persists specified fields
 * to localStorage and restores them on navigation.
 *
 * Requires the schema to use `.optional()` on persisted fields (no `.default()`),
 * so that `matchRoutesLightweight` doesn't pre-fill defaults before the middleware runs.
 *
 * Priority: explicit search params > localStorage > defaults
 */
export function localStorageSearchMiddleware<T extends Record<string, unknown>>(
	schema: z.ZodObject<any>,
	defaults: Partial<NoInfer<T>>,
	persistKeys: Partial<Record<keyof NoInfer<T> & string, string>>,
): (ctx: { search: T; next: (s: T) => T }) => T {
	return ({ search, next }) => {
		const nextSearch = next(search);

		for (const [field, storageKey] of Object.entries(persistKeys)) {
			const value = nextSearch[field];
			if (value != null) {
				localStorage.setItem(
					storageKey as string,
					serializeValue(value),
				);
			}
		}

		const stored: Record<string, unknown> = {};
		for (const [field, storageKey] of Object.entries(persistKeys)) {
			const raw = localStorage.getItem(storageKey as string);
			if (raw != null) {
				const result = schema.shape[field]?.safeParse(raw);
				if (result?.success) {
					stored[field] = result.data;
				}
			}
		}

		return schema.parse({
			...defaults,
			...stored,
			...nextSearch,
		}) as T;
	};
}

/** Dates are stored as YYYY-MM-DD using local date components (timezone-agnostic). */
function serializeValue(value: unknown): string {
	if (value instanceof Date) {
		return format(value, "yyyy-MM-dd");
	}
	return String(value);
}
