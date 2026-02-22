# Plan: Task events support both scheduled and related task links

**Goal:** Task events (`eventKind === "task"`) support both **scheduled** and **related** task links; no schema change.

---

## Mermaid: event (task) → links → external tasks

```mermaid
flowchart LR
  subgraph event
    E[events<br/>eventKind: "task"]
  end
  subgraph links
    L1[eventTaskLinks<br/>linkType: "scheduled"]
    L2[eventTaskLinks<br/>linkType: "related"]
  end
  subgraph external
    T[taskItems / Linear]
  end
  E --> L1
  E --> L2
  L1 --> T
  L2 --> T
```

- **events**: row with `eventKind: "task"`.
- **eventTaskLinks**: rows with same `eventId`; `linkType` is `"scheduled"` or `"related"`; each has `externalTaskId`, `url`, `provider: "linear"`.
- **taskItems**: Linear tasks keyed by `externalTaskId` (same provider).

---

## 1. Backend: createEvent

**File:** `convex/events/mutations.ts`

- **Remove the eventKind guard** so related links are inserted for task events too: delete the `if (eventKind !== "task")` condition (lines 96–111) and always run the relatedTaskLinks insert loop (using `args.relatedTaskLinks ?? []`).
- **Deduplicate across both types:** when inserting related links, skip any `externalTaskId` that was already added in `scheduledTaskLinks` (e.g. pass `seenScheduled` into the related loop, or build a combined set and skip duplicates). This keeps the same external task from being both scheduled and related for the same event.

---

## 2. Backend: Tests

**File:** `convex/events/mutations.test.ts`

- **New test:** Create an event with `eventKind: "task"` and both `scheduledTaskLinks` and `relatedTaskLinks`; assert that `eventTaskLinks` contains exactly the expected rows (one per link) with correct `linkType` ("scheduled" vs "related").
- **Optional:** Test that the same `externalTaskId` in both arrays does not create duplicate links (backend dedupe: only one link per externalTaskId; or document that scheduled wins and related is skipped for that id).

---

## 3. Frontend: Form schema and default values

**File:** `src/routes/_authenticated/calendar/-components/event-popover/form-options.ts`

- Add **scheduledTaskLinks** to the form schema (same shape as relatedTaskLinks: `array of { externalTaskId, url }`), default `[]`.
- Add **scheduledTaskLinks** to `GetCreateDefaultValuesInput` and to `getCreateDefaultValues` so create/edit can seed both arrays.

---

## 4. Frontend: Submit (create/update) for task events

**File:** `src/routes/_authenticated/calendar/-components/event-popover/event-popover.tsx`

- **Submit:** For `eventKind === "task"`, pass both `scheduledTaskLinks` and `relatedTaskLinks` from form values to `createEvent` and `updateEvent` (instead of forcing `relatedTaskLinks` to `[]` and using one array for scheduled only). For `eventKind === "event"`, keep current behavior: only `relatedTaskLinks`, `scheduledTaskLinks` empty.
- **Payload construction:** Replace the single `taskLinks` + ternary with two distinct form fields: `values.scheduledTaskLinks` and `values.relatedTaskLinks`; for task send both, for event send `scheduledTaskLinks: []` and `relatedTaskLinks: values.relatedTaskLinks`.

---

## 5. Frontend: Edit initial values (task events)

**File:** `src/routes/_authenticated/calendar/-components/event-popover/event-popover.tsx`

- **Edit mode:** Where initial values are built from `getLinksByEventId` (e.g. in the edit popover content), for **task** events set:
  - `scheduledTaskLinks` = links with `linkType === "scheduled"` mapped to `{ externalTaskId, url }`
  - `relatedTaskLinks` = links with `linkType === "related"` mapped to `{ externalTaskId, url }`
- For **event** events keep current behavior: only `relatedTaskLinks` from links with `linkType === "related"`; `scheduledTaskLinks` = `[]`.
- Pass both into `getCreateDefaultValues` (or equivalent) so the form starts with both sections populated for task events.

---

## 6. Frontend: UI for task events (both sections)

**File:** `src/routes/_authenticated/calendar/-components/event-popover/event-popover.tsx`

- When `eventKind === "task"`, show **two** task-link sections:
  - **Scheduled tasks** bound to form field `scheduledTaskLinks`.
  - **Related tasks** bound to form field `relatedTaskLinks`.
- Reuse `RelatedTasksSection` (or equivalent) for both: one instance with a prop like `fieldName="scheduledTaskLinks"` and label "Scheduled tasks", one with `fieldName="relatedTaskLinks"` and label "Related tasks". If the component currently assumes a single field name, add an optional `fieldName` (default `"relatedTaskLinks"`) and use it for the bound field and for the section label (or pass label as prop).

**File:** `src/routes/_authenticated/calendar/-components/event-popover/related-tasks-section.tsx`

- Support an optional **field name** prop (e.g. `fieldName: "relatedTaskLinks" | "scheduledTaskLinks"`) and **label** (or derive label from variant + field: e.g. scheduled vs related). Use that field for the array and for the section heading so the same component can render either "Scheduled tasks" or "Related tasks" with the correct form field.

---

## Summary checklist

| # | Area        | File(s) | Action |
|---|-------------|---------|--------|
| 1 | Backend     | `convex/events/mutations.ts` | Remove eventKind guard for relatedTaskLinks; dedupe by externalTaskId across scheduled + related. |
| 2 | Backend     | `convex/events/mutations.test.ts` | Add test: task event with both link types stored correctly. |
| 3 | Frontend    | `form-options.ts` | Add scheduledTaskLinks to schema and default values. |
| 4 | Frontend    | `event-popover.tsx` | Submit: for task send both scheduledTaskLinks and relatedTaskLinks. |
| 5 | Frontend    | `event-popover.tsx` | Edit initial values: for task set both from getLinksByEventId by linkType. |
| 6 | Frontend    | `event-popover.tsx` + `related-tasks-section.tsx` | For task, show two sections (Scheduled + Related); support field name + label in RelatedTasksSection. |
