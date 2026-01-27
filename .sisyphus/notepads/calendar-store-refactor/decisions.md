# Decisions - Calendar Store Refactor

## Architectural Choices
(Subagents: APPEND decisions here after each task)

## [2026-01-25] Initial Decisions
- Export both `useCalendar` hook AND `calendarStore` instance for initialization compatibility
- CalendarProvider becomes minimal wrapper for initialization only
- Use `store.send({ type: "...", payload })` pattern (explicit, consistent)
- One commit per logical component group (10 commits total)
