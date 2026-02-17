import { ConvexError } from "convex/values";

type ConvexErrorData = { code?: string; message?: string };

/**
 * Returns a user-facing error message from a Convex mutation/query/action error.
 * Prefers ConvexError.data.message, then Error.message, then fallback.
 */
export function getConvexErrorMessage(
	error: unknown,
	fallback: string,
): string {
	if (error instanceof ConvexError) {
		const data = error.data as ConvexErrorData | undefined;
		if (data?.message && typeof data.message === "string") {
			return data.message;
		}
	}
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return fallback;
}
