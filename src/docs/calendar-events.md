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
