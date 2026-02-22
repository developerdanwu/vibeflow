import { ConvexError } from "convex/values";

/** Application error codes thrown from Convex functions. */
export const ErrorCode = {
	NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
	USER_NOT_FOUND: "USER_NOT_FOUND",
	NOT_FOUND: "NOT_FOUND",
	NOT_AUTHORIZED: "NOT_AUTHORIZED",
	BAD_REQUEST: "BAD_REQUEST",
	FORBIDDEN: "FORBIDDEN",
	EVENT_NOT_FOUND: "EVENT_NOT_FOUND",
	CALENDAR_NOT_FOUND: "CALENDAR_NOT_FOUND",
	CONNECTION_NOT_FOUND: "CONNECTION_NOT_FOUND",
	OAUTH_NOT_CONFIGURED: "OAUTH_NOT_CONFIGURED",
	INVALID_STATE: "INVALID_STATE",
	CANNOT_DELETE_DEFAULT_CALENDAR: "CANNOT_DELETE_DEFAULT_CALENDAR",
	EVENT_CANNOT_BE_EDITED: "EVENT_CANNOT_BE_EDITED",
	TOKEN_REFRESH_FAILED: "TOKEN_REFRESH_FAILED",
	NO_REFRESH_TOKEN: "NO_REFRESH_TOKEN",
	WEBHOOK_URL_NOT_SET: "WEBHOOK_URL_NOT_SET",
	EXTERNAL_CALENDAR_NOT_FOUND: "EXTERNAL_CALENDAR_NOT_FOUND",
	GOOGLE_INSERT_NO_EVENT_ID: "GOOGLE_INSERT_NO_EVENT_ID",
	LINEAR_CONNECTION_NOT_FOUND: "LINEAR_CONNECTION_NOT_FOUND",
	LINEAR_NOT_CONNECTED: "LINEAR_NOT_CONNECTED",
	LINEAR_VIEWER_LOAD_FAILED: "LINEAR_VIEWER_LOAD_FAILED",
	LINEAR_TOKEN_EXCHANGE_FAILED: "LINEAR_TOKEN_EXCHANGE_FAILED",
	LINEAR_TOKEN_REFRESH_FAILED: "LINEAR_TOKEN_REFRESH_FAILED",
	WORKOS_CODE_EXCHANGE_FAILED: "WORKOS_CODE_EXCHANGE_FAILED",
	INTERNAL: "INTERNAL",
} as const;

export type AppErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Serializable shape for ConvexError (must satisfy Convex Value). */
export type AppErrorData = {
	code: AppErrorCode;
	message?: string;
};

/**
 * Throws a ConvexError with the given code and optional message.
 * Use this so the client receives structured error.data (code, message).
 */
export function throwConvexError(code: AppErrorCode, message?: string): never {
	throw new ConvexError<AppErrorData>({
		code,
		...(message ? { message } : {}),
	});
}
