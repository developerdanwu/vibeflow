# Planning with Agent and Sub-Agent Usage in Mind

**When this applies:** Creating plans for multi-step or multi-file work that may be executed by different agents (e.g. Convex-backend vs Frontend-ui) or split across sessions.

## Why assign agents in plans

Plans that list tasks without saying **who** does them lead to one agent touching files it shouldn’t, or to unclear handoffs. Assigning each task to an agent (and grouping work into sub-tasks per agent) makes dependencies clear, allows parallel work where possible, and keeps scope boundaries (e.g. `convex/` vs `src/`) respected.

## Wrong: plan as a flat task list

```markdown
## Plan
1. Add schema field
2. Add Convex query and mutation
3. Add pagination in googleCalendar.ts
4. Add dropdown on Settings page
```

**Why it fails:** No owner per step. An executor might do all four and edit both `convex/` and `src/`, or skip steps that “feel” out of scope. Dependencies and order are implicit.

## Correct: plan with agent and sub-task assignment

```markdown
## Execution order
- **Convex-backend** Sub-task A first (schema + API).
- Then **Convex-backend** Sub-task B and **Frontend-ui** Sub-task C in parallel (both depend only on A).

## Convex-backend agent
### Sub-task A: Schema and API (run first)
- Files: convex/schema.ts, convex/users.ts
- Add field; add internal query for sync; add public query + mutation for frontend.

### Sub-task B: Sync logic (run after A)
- Files: convex/googleCalendar.ts
- Depends on: A. Use internal query from A; add pagination and time range.

## Frontend-ui agent
### Sub-task C: Settings UI (run after A)
- Files: src/routes/.../settings/calendars/index.tsx
- Depends on: A. Call public query and mutation from A.
```

**Why it works:** Each sub-task has an owner, a file list, and explicit dependencies. Backend can do A then B; frontend can do C once A exists. B and C can be done in parallel by different agents.

## What to include in each sub-task

- **Owner:** Which agent (e.g. Convex-backend, Frontend-ui) owns the work.
- **Scope:** Exact files or modules to change.
- **Depends on:** Other sub-tasks that must be done first (so execution order is clear).
- **Handoff:** For the next agent (e.g. “Frontend will call `api.users.getUserPreferences` and `api.users.updateUserPreferences`; contract is …”).
- **Verification:** How to confirm the sub-task is done (e.g. `pnpm check`, manual test).

## Where to put plans

**Do not create or save plan files in `docs/`.** The `docs/` folder is for project documentation (planning rules, specs, references), not for individual plan artifacts. When creating or updating a plan, use the tool’s plan output (e.g. Cursor’s plan) or `.cursor/plans/` if saving to the repo. This has been a repeated mistake; follow this rule so plans stay out of `docs/`.

## Summary

Think about which agent (or sub-agent) will run each part of the plan. Assign owners, list dependencies, and define handoffs so plans are executable and scope is respected.
