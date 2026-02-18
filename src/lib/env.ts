import z from "zod";

export const ZEnvSchema = z.object({
	VITE_CONVEX_URL: z.string(),
	VITE_GOOGLE_CALENDAR_CLIENT_ID: z.string(),
	VITE_LINEAR_CLIENT_ID: z.string(),
	VITE_WORKOS_CLIENT_ID: z.string(),
	VITE_WORKOS_REDIRECT_URI: z.string(),
});

export type TEnv = z.infer<typeof ZEnvSchema>;
