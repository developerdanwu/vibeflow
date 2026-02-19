# Calendar Event Patterns

## Event Time Display in Popover

**When this applies:** Displaying event times in the event popover for editing.

### ❌ Wrong
```tsx
function getTimes(event: TEvent, startDate: Date, rawEndDate: Date) {
	const startTimeStr = event.startTime; // UTC time string from Google Calendar
	const endTimeStr = event.endTime;
	if (!event.allDay && startTimeStr && endTimeStr) {
		const [startHour, startMin] = startTimeStr.split(":").map(Number);
		return {
			startTime: new Time(startHour, startMin), // Uses UTC time directly
		};
	}
	// ...
}
```

### ✅ Correct
```tsx
function getTimes(event: TEvent, startDate: Date, rawEndDate: Date) {
	if (!event.allDay) {
		// Derive times from Date objects (already in local timezone from parseISO)
		return {
			startTime: new Time(startDate.getHours(), startDate.getMinutes()),
			endTime: new Time(rawEndDate.getHours(), rawEndDate.getMinutes()),
		};
	}
	// ...
}
```

**Why:** `event.startTime`/`event.endTime` strings are stored in UTC (from Google Calendar imports), but Date objects from `parseISO(event.startDate)` are already converted to local timezone. Always derive times from Date objects to match calendar display.

## Date Serialization for Storage and Search Params

**When this applies:** Persisting calendar dates (the "current day" the user is viewing) in localStorage, sessionStorage, or URL search params.

Calendar dates represent a **day**, not an instant in time. Storing them as ISO datetime strings introduces timezone issues.

### `new Date("YYYY-MM-DD")` parses as UTC, not local

```ts
// In UTC+11 (Sydney):
new Date("2026-02-23")          // Feb 23 00:00 UTC = Feb 23 11:00 local ✓
// In UTC-8 (Los Angeles):
new Date("2026-02-23")          // Feb 23 00:00 UTC = Feb 22 16:00 local ✗ (wrong day!)

// Safe: construct with local date components
new Date(2026, 1, 23)           // Feb 23 00:00 local (always correct)
```

### ❌ Wrong — store as ISO datetime
```ts
sessionStorage.setItem("date", date.toISOString());     // "2026-02-22T13:00:00.000Z"
sessionStorage.setItem("date", String(date));            // locale-dependent, unreliable
```

### ✅ Correct — store as YYYY-MM-DD, parse as local midnight
```ts
// Store using local date components
import { format } from "date-fns";
sessionStorage.setItem("date", format(date, "yyyy-MM-dd")); // "2026-02-23"

// Restore: parse YYYY-MM-DD as local midnight (NOT new Date("YYYY-MM-DD"))
const raw = sessionStorage.getItem("date"); // "2026-02-23"
// Option A — date-fns (parses as local midnight)
import { parse } from "date-fns";
const restored = parse(raw, "yyyy-MM-dd", new Date());
// Option B — manual (no extra import)
const [y, m, d] = raw.split("-").map(Number);
const restored = new Date(y, m - 1, d);
```

### `z.coerce.date()` has the same trap

`z.coerce.date()` calls `new Date(input)`, so date-only strings are parsed as UTC. Use `z.preprocess` to intercept YYYY-MM-DD strings:

```ts
const localDateSchema = z
  .preprocess((val) => {
    if (val instanceof Date) return val;
    if (typeof val === "string") {
      const m = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) return new Date(+m[1], +m[2] - 1, +m[3]); // local midnight
    }
    return val;
  }, z.coerce.date())
  .transform((d) => startOfDay(d));
```

### Search param storage strategy (Tauri + browser)

| Field | Storage | Why |
|-------|---------|-----|
| `view`, `dayRange` | localStorage | User preferences — persist across restarts |
| `date` | sessionStorage | Navigation position — persist within session, reset on restart |

Store dates as `YYYY-MM-DD` in both. In Tauri, sessionStorage is cleared on app quit (webview lifecycle), so the date resets to "today" on next launch — matching native calendar app behavior.
