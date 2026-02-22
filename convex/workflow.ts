import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "./_generated/api";

/**
 * Workflow manager for durable workflows (e.g. Google Calendar sync).
 * See convex/docs/workflows.md and the sync calendar workflow in googleCalendar/syncWorkflow.ts.
 */
export const workflow = new WorkflowManager(components.workflow);
