# Prompt: Adopt Notion-style event schema (date-only for all-day, timezone for timed)

Use this prompt with OpenCode (or another agent) to implement the change.

---

## Goal

Change event storage and API to a **Notion-style** design so that:

1. **All-day events** use **date-only** fields (`start_date`, `end_date` as YYYY-MM-DD). "Which day" is explicit and timezone-agnostic — no wrong-day display when the user changes timezone.
2. **Timed events** store an **explicit timezone** (IANA, e.g. `"America/Los_Angeles"`) with date and time. Enables correct display in any viewer timezone and future Google Calendar sync (Google uses date-only for all-day and datetime+timezone for timed).

Keep **numeric** `startDate` / `endDate` (UTC ms) for existing indexes and range queries; derive them from the new fields when the client sends the new shape.

---

## Current state

- **Convex:** `events` table has `startDate`, `endDate` (numbers, ms since epoch), `allDay` (boolean). No date-only or timezone fields.
- **Frontend:** Quick-add and edit flows build a `Date` in local time and send `getTime()`. Calendar route maps Convex events to `IEvent` with `startDate`/`endDate` as ISO strings. `IEvent` does not include `allDay` or timezone.
- **Problem:** All-day events are stored as start/end of day in creator's local time, so they show on the wrong calendar day when the user views in another timezone.

---

## Target design (Notion-style)

### All-day events

- **Request shape:** Send `start_date` and `end_date` as **date-only strings** (YYYY-MM-DD). No time, no timezone.
- **Storage:** Store `start_date` and `end_date` (optional strings) on the event. Derive `startDate`/`endDate` (numbers) as UTC day boundaries (e.g. `Date.UTC(y, m, d, 0, 0, 0, 0)`) for indexing and `getEventsByDateRange`.
- **Display:** "Which day" comes directly from `start_date`/`end_date` — no conversion. Use these when filtering/placing events in month/week/day/agenda views.

### Timed events

- **Request shape:** Send `start_date`, `start_time`, `end_date`, `end_time` (times like "09:00"), and `time_zone` (IANA, e.g. `"Asia/Hong_Kong"`).
- **Storage:** Store `time_zone` (optional string). Derive `startDate`/`endDate` (numbers) by interpreting (date + time) in that timezone and converting to UTC ms.
- **Display:** Use stored `time_zone` when formatting times (e.g. show "9:00 AM HKT" or convert to viewer's local time). Keep using numeric `startDate`/`endDate` for range queries and for "which day" in the viewer's context if you prefer, or derive "which day" from the event's timezone for consistency.

---

## What to change

### 1. Convex schema (`convex/schema.ts`)

- Add optional fields to `events`:
  - `start_date: v.optional(v.string())` — YYYY-MM-DD for all-day (and for timed, if you want one source of truth).
  - `end_date: v.optional(v.string())` — YYYY-MM-DD.
  - `start_time: v.optional(v.string())` — e.g. "09:00" for timed.
  - `end_time: v.optional(v.string())` — e.g. "10:00".
  - `time_zone: v.optional(v.string())` — IANA timezone for timed events.
- Keep `startDate`, `endDate` (numbers) and `allDay` (boolean). They remain the canonical range for indexing and queries; backend derives them from the new fields when provided.

### 2. Convex mutations (`convex/events.ts`)

- **createEvent:** Accept the new shape:
  - If client sends `start_date` / `end_date` (and `allDay: true`): validate YYYY-MM-DD, compute `startDate`/`endDate` as UTC day boundaries, store `start_date`/`end_date`. Do not require numeric `startDate`/`endDate` when these are provided.
  - If client sends `start_date`, `start_time`, `end_date`, `end_time`, `time_zone` (and `allDay: false`): parse (date + time) in that timezone, convert to UTC, set `startDate`/`endDate`; store `start_date`, `end_date`, `start_time`, `end_time`, `time_zone`.
  - For backward compatibility, still accept numeric `startDate`/`endDate` when the new fields are not provided (e.g. existing clients or migration).
- **updateEvent:** Accept the same optional new fields; when present, recompute `startDate`/`endDate` and update stored strings/timezone.
- Validation: for all-day, require `start_date`/`end_date` and that start_date <= end_date. For timed, require the full set and that start < end in that timezone.

### 3. Frontend types (`src/components/big-calendar/interfaces.ts`)

- Add to `IEvent`: `allDay: boolean`; `start_date?: string`; `end_date?: string`; `start_time?: string`; `end_time?: string`; `time_zone?: string`.
- Keep `startDate`/`endDate` as strings (ISO or derived) for backward compatibility with code that uses `parseISO(event.startDate)` for timed events and for range checks, unless you migrate all consumers to the new fields first.

### 4. Calendar route mapping (`src/routes/_authenticated/calendar.tsx`)

- When mapping Convex events to `IEvent`, include `allDay`, `start_date`, `end_date`, `start_time`, `end_time`, `time_zone` from the Convex document.
- Keep populating `startDate`/`endDate` from the Convex numeric fields (e.g. `new Date(event.startDate).toISOString()`) so existing display logic that uses `parseISO(event.startDate)` continues to work for timed events until you migrate it.

### 5. Quick-add submit (`src/components/big-calendar/components/month-view/quick-add-event-popover.tsx`)

- **All-day:** Instead of sending numeric `startDate`/`endDate` from `getTime()`, send `start_date` and `end_date` as YYYY-MM-DD (e.g. from `format(values.startDate, "yyyy-MM-dd")` and same for end). Omit time and timezone.
- **Timed:** Send `start_date`, `start_time`, `end_date`, `end_time` (format time as "HH:mm"), and `time_zone`. Get browser timezone with `Intl.DateTimeFormat().resolvedOptions().timeZone` (e.g. `"America/Los_Angeles"`). Backend will derive and store numeric `startDate`/`endDate` and the new fields.

### 6. Display logic (all-day "which day")

- Add a helper (e.g. in `src/components/big-calendar/helpers.ts`): `getEventStartCalendarDate(event)`, `getEventEndCalendarDate(event)`.
  - For **all-day** events: if `event.start_date` exists, parse it as a local date at midnight (e.g. `new Date(event.start_date + "T00:00:00")` or parse YYYY-MM-DD and build start-of-day in a consistent way). Use that for "which day" in filters and placement. Same for end_date.
  - For **timed** events: keep using `parseISO(event.startDate)` / `parseISO(event.endDate)` (or the numeric-derived ISO strings) for "which day" in the viewer's timezone, or derive from event's `time_zone` if you want "event's calendar day."
- Replace direct `parseISO(event.startDate)` / `startOfDay(parseISO(...))` in **filtering and placement** code (e.g. `client-container.tsx`, `month-event-badge.tsx`, week/year/agenda views) with the helper when the semantic is "which calendar day does this event occupy." Use the helper only where "which day" is needed; leave timed event block position and time display (e.g. "9:00 AM") using the existing instant-based logic.

### 7. Edit event flow

- If there is an edit-event dialog or hook that updates start/end, have it send the same Notion-style shape (date-only for all-day, date+time+timezone for timed) and include `allDay`. Ensure `use-update-event` (or the mutation caller) sends the new fields when present so the backend can recompute `startDate`/`endDate`.

### 8. Backward compatibility and migration

- Existing events in the DB have only numeric `startDate`/`endDate` and `allDay`. They do not have `start_date`/`end_date`/`time_zone`. Display logic should handle both: if `event.start_date` (and optionally `event.allDay`) is set, use date-only logic for "which day"; otherwise fall back to current behavior (parseISO(event.startDate) etc.). So old events keep working until re-saved or migrated.
- Optional: add a one-off migration script that, for each event with `allDay === true`, sets `start_date`/`end_date` from the existing `startDate`/`endDate` (e.g. format the UTC date as YYYY-MM-DD). For timed events, you could leave `time_zone` null (meaning "use viewer timezone") unless you have a way to infer original timezone.

---

## Files to touch (summary)

- `convex/schema.ts` — add optional `start_date`, `end_date`, `start_time`, `end_time`, `time_zone`.
- `convex/events.ts` — createEvent/updateEvent: accept new shape, derive numeric start/end, validate.
- `src/components/big-calendar/interfaces.ts` — add `allDay`, `start_date`, `end_date`, `start_time`, `end_time`, `time_zone` to IEvent.
- `src/routes/_authenticated/calendar.tsx` — map new fields from Convex to IEvent.
- `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx` — send Notion-style payload (date-only for all-day, date+time+timezone for timed).
- `src/components/big-calendar/helpers.ts` — add getEventStartCalendarDate / getEventEndCalendarDate; use date-only for all-day when present.
- `src/components/big-calendar/components/client-container.tsx` — use helper for filtering by day/month/week when event has date-only.
- `src/components/big-calendar/components/month-view/month-event-badge.tsx` — use helper for itemStart/itemEnd and "which day" when event has date-only.
- Other views (week, day, year, agenda, multi-day rows) that decide "which day" — use helper where the semantic is calendar day; keep instant-based logic for timed block position and time display.
- Edit event flow (dialog/hook/use-update-event) — send new shape when updating; ensure backend receives and stores new fields.

---

## References

- AGENTS.md and src/docs/ui.md for project conventions.
- Convex schema and events API: convex/schema.ts, convex/events.ts.
- Notion-style request shape: all-day = daterange with start_date, end_date (YYYY-MM-DD); timed = datetimerange with start_date, start_time, end_date, end_time, time_zone (IANA).
