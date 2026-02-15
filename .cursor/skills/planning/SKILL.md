---
name: planning
description: Produces multi-step plans with agent assignment, execution order, and per-sub-task scope, dependencies, handoffs, and verification. Use when creating or refining a plan for multi-step or multi-file work, when the user asks for a plan, or when work may be split across Convex-backend and Frontend-ui agents or sessions.
---

# Planning (agent-assigned plans)

Ensures plans follow the repo’s planning rules so the right agent owns each part and dependencies are explicit.

## When to use

- Creating a plan for **multi-step** or **multi-file** work.
- User asks for a “plan”, “migration plan”, “implementation plan”, or “breakdown”.
- Work touches both `convex/` and `src/` or may be split across sessions or agents.

Do **not** use for single-file fixes, trivial changes, or when the user only wants a short answer.

## Required reading

Before writing the plan, **read** [docs/planning.md](docs/planning.md) (project root: `docs/planning.md`). It defines why agent assignment matters, what to include per sub-task, and wrong vs correct structure.

**Do not create or save plan files in `docs/`.** Use the tool’s plan output or `.cursor/plans/` if saving to the repo. `docs/` is for project documentation only, not plan artifacts.

## Plan structure

Output plans with:

1. **Execution order**  
   Which sub-tasks run first, then which can run in parallel. Name the agent(s) and sub-task IDs (e.g. “Convex-backend Sub-task A first; then Convex-backend B and Frontend-ui C in parallel”).

2. **One section per agent**  
   Group sub-tasks by owner (e.g. “## Convex-backend agent”, “## Frontend-ui agent”). Use agent names that match the repo (e.g. Convex-backend, Frontend-ui).

3. **Per sub-task, include all five:**
   - **Owner:** Which agent owns it.
   - **Scope:** Exact files or modules to change.
   - **Depends on:** Other sub-tasks that must be done first (or “None”).
   - **Handoff:** What the next agent or step needs (e.g. API contract, “No frontend changes”).
   - **Verification:** How to confirm done (e.g. `pnpm check`, manual test).

4. **Optional summary table**  
   Sub-task ID | Owner | Scope | Purpose (one line).

## Agent names and scope (this repo)

- **Convex-backend:** Owns `convex/` only (schema, queries, mutations, actions, http, crons). See `.cursor/agents/convex-backend.md` if present.
- **Frontend-ui:** Owns `src/` only (routes, components, hooks, lib). See `.cursor/agents/frontend-ui.md` if present.

If the work is only in one area (e.g. only `convex/`), all sub-tasks still need Owner, Scope, Depends on, Handoff, Verification; execution order remains explicit.

## Checklist before finalizing

- [ ] Read `docs/planning.md`.
- [ ] Execution order is stated (what runs first, what can run in parallel).
- [ ] Every sub-task has an **Owner**.
- [ ] Every sub-task has **Scope** (files/modules).
- [ ] Every sub-task has **Depends on** (other sub-tasks or “None”).
- [ ] Every sub-task has **Handoff** (for next agent or “None”).
- [ ] Every sub-task has **Verification** (how to confirm done).
- [ ] No flat task list without owners (that’s the “wrong” pattern in planning.md).
- [ ] Plan is not written to `docs/` (use tool plan output or `.cursor/plans/`).

## Wrong vs correct (short)

**Wrong:** “1. Add schema. 2. Add mutation. 3. Add UI.” (no owner, no deps, no handoff, no verification.)

**Correct:** Execution order → sections per agent → each sub-task has Owner, Scope, Depends on, Handoff, Verification.
