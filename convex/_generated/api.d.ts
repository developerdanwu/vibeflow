/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as calendars_mutations from "../calendars/mutations.js";
import type * as calendars_queries from "../calendars/queries.js";
import type * as crons from "../crons.js";
import type * as events_mutations from "../events/mutations.js";
import type * as events_queries from "../events/queries.js";
import type * as googleCalendar_actionsNode from "../googleCalendar/actionsNode.js";
import type * as googleCalendar_http from "../googleCalendar/http.js";
import type * as googleCalendar_mutations from "../googleCalendar/mutations.js";
import type * as googleCalendar_queries from "../googleCalendar/queries.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as taskProviders_linear_actionsNode from "../taskProviders/linear/actionsNode.js";
import type * as taskProviders_linear_mutations from "../taskProviders/linear/mutations.js";
import type * as taskProviders_linear_queries from "../taskProviders/linear/queries.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "calendars/mutations": typeof calendars_mutations;
  "calendars/queries": typeof calendars_queries;
  crons: typeof crons;
  "events/mutations": typeof events_mutations;
  "events/queries": typeof events_queries;
  "googleCalendar/actionsNode": typeof googleCalendar_actionsNode;
  "googleCalendar/http": typeof googleCalendar_http;
  "googleCalendar/mutations": typeof googleCalendar_mutations;
  "googleCalendar/queries": typeof googleCalendar_queries;
  helpers: typeof helpers;
  http: typeof http;
  "taskProviders/linear/actionsNode": typeof taskProviders_linear_actionsNode;
  "taskProviders/linear/mutations": typeof taskProviders_linear_mutations;
  "taskProviders/linear/queries": typeof taskProviders_linear_queries;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  workOSAuthKit: {
    lib: {
      enqueueWebhookEvent: FunctionReference<
        "mutation",
        "internal",
        {
          apiKey: string;
          event: string;
          eventId: string;
          eventTypes?: Array<string>;
          logLevel?: "DEBUG";
          onEventHandle?: string;
          updatedAt?: string;
        },
        any
      >;
      getAuthUser: FunctionReference<
        "query",
        "internal",
        { id: string },
        {
          createdAt: string;
          email: string;
          emailVerified: boolean;
          externalId?: null | string;
          firstName?: null | string;
          id: string;
          lastName?: null | string;
          lastSignInAt?: null | string;
          locale?: null | string;
          metadata: Record<string, any>;
          profilePictureUrl?: null | string;
          updatedAt: string;
        } | null
      >;
    };
  };
};
