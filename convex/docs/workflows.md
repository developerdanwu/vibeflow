# Durable workflows (@convex-dev/workflow)

Google Calendar sync uses the **workflow component** (`@convex-dev/workflow`) so each sync run is a durable workflow with a run ID. The workflow component is the source of truth for run status; we do not use a custom `calendarSyncRuns` table.

## Setup

- **Config:** `convex/convex.config.ts` registers the workflow component via `app.use(workflow)`.
- **Manager:** `convex/workflow.ts` exports the `WorkflowManager` instance using `components.workflow`.
- **Sync workflow:** `convex/googleCalendar/syncWorkflow.ts` defines the sync workflow and start mutations.

## Sync workflow

- **Definition:** `syncCalendarWorkflow` runs the existing `syncCalendar` internal action as a single step. Workflow state stays small (no event payloads in workflow state).
- **Starting a sync:** Use `startSyncWorkflow` (auth) or `startSyncWorkflowInternal` (internal). Each starts the workflow with `workflow.start(..., { startAsync: true })`, then sets `externalCalendars.latestSyncWorkflowRunId` so the FE can subscribe to run status.
- **Callers:** `syncMyCalendars`, the Google webhook (`http.ts`), and `runFallbackSync` start the workflow via `startSyncWorkflowInternal` instead of calling `syncCalendar` directly. The `syncCalendar` action is now only invoked from inside the workflow step.
- **Failure:** `handleSyncWorkflowOnComplete` (onComplete) sets `externalCalendars.lastSyncErrorMessage` when the run fails.

## Run status for the frontend

- Calendars query (`getMyGoogleConnection`) returns `latestSyncWorkflowRunId` and `lastSyncErrorMessage` per external calendar.
- `getSyncWorkflowStatus(workflowId)` (auth query) returns the workflow run status for a given run ID; it only returns status if the run ID belongs to one of the current user’s calendars.
- FE subscribes to `getSyncWorkflowStatus` with the calendar’s `latestSyncWorkflowRunId` to show in-progress / completed / failed.

## Linear issues sync

- **Same workflow component** as Google Calendar; run ID and optional error live on `taskConnections` (one per user).
- **Workflow:** `convex/taskProviders/linear/syncWorkflow.ts` defines `syncLinearIssuesWorkflow` (one step = `syncLinearIssues` internal action), `startSyncWorkflow` (auth), `startSyncWorkflowInternal` (internal), and `handleSyncWorkflowOnComplete` to set `lastSyncErrorMessage` on failure.
- **Entry point:** `fetchMyIssues` (auth action) starts the workflow via `startSyncWorkflowInternal` and returns; it no longer runs the sync inline.
- **No webhook or cron** for Linear; FE (title bar, task sidebar, inbox sidebar) calls `fetchMyIssues()` to start a sync.
- **FE status:** `getMyLinearConnection` returns `latestSyncWorkflowRunId` and `lastSyncErrorMessage`; `getLinearSyncWorkflowStatus(workflowId)` (auth) returns workflow status for the current user’s connection. Title bar tooltip shows Tasks (Linear) status (Syncing… / Synced / Failed).

## Best practices

- Keep workflow step args and return values small (IDs, `pageToken`, counts). Do not store full event arrays in workflow state.
- Run ID is set when **starting** the workflow (in the start mutation), not inside the workflow.
- Use the workflow component’s run-status API; avoid duplicating run state in app tables.
