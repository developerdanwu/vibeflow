"use client";

import { useCreateEventMutation } from "@/components/big-calendar/hooks/use-create-event-mutation";
import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
} from "@/components/ui/combobox";
import { DayPicker } from "@/components/ui/day-picker";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TimeInput } from "@/components/ui/time-input";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Time } from "@internationalized/date";
import { useQuery } from "@tanstack/react-query";
import { set, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export type TaskItemForSchedule = {
	_id: string;
	externalTaskId: string;
	title: string;
	identifier?: string;
	url: string;
};

type ScheduleTaskDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	task: TaskItemForSchedule | null;
};

export function ScheduleTaskDialog({
	open,
	onOpenChange,
	task,
}: ScheduleTaskDialogProps) {
	const [startDate, setStartDate] = useState<Date>(() =>
		startOfDay(new Date()),
	);
	const [startTime, setStartTime] = useState<Time>(() => new Time(9, 0));
	const [endTime, setEndTime] = useState<Time>(() => new Time(10, 0));
	const [title, setTitle] = useState("");
	const [calendarId, setCalendarId] = useState<Id<"calendars"> | undefined>(
		undefined,
	);

	const { data: calendars } = useQuery(
		convexQuery(api.calendars.queries.getAllUserCalendars),
	);
	const defaultCalendar = calendars?.find((cal) => cal.isDefault);

	const { mutateAsync: createEvent } = useCreateEventMutation();

	const resetForm = useCallback(() => {
		const now = new Date();
		setStartDate(startOfDay(now));
		setStartTime(new Time(9, 0));
		setEndTime(new Time(10, 0));
		setTitle(task?.title ?? "");
		setCalendarId(defaultCalendar?.id);
	}, [task?.title, defaultCalendar?.id]);

	useEffect(() => {
		if (open && task) {
			setTitle(task.title);
			setStartDate(startOfDay(new Date()));
			setStartTime(new Time(9, 0));
			setEndTime(new Time(10, 0));
			if (defaultCalendar) {
				setCalendarId(defaultCalendar.id);
			}
		}
	}, [open, task, defaultCalendar]);

	useEffect(() => {
		if (calendars && defaultCalendar && calendarId === undefined) {
			setCalendarId(defaultCalendar.id);
		}
	}, [calendars, defaultCalendar, calendarId]);

	const handleOpenChange = useCallback(
		(next: boolean) => {
			if (!next) {
				resetForm();
			}
			onOpenChange(next);
		},
		[onOpenChange, resetForm],
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!task) return;
		try {
			const startDateTime = set(startDate, {
				hours: startTime.hour,
				minutes: startTime.minute,
				seconds: 0,
				milliseconds: 0,
			});
			const endDateTime = set(startDate, {
				hours: endTime.hour,
				minutes: endTime.minute,
				seconds: 0,
				milliseconds: 0,
			});
			await createEvent({
				title: title.trim() || task.title,
				description: "",
				allDay: false,
				startTimestamp: startDateTime.getTime(),
				endTimestamp: endDateTime.getTime(),
				calendarId,
				externalTaskProvider: "linear",
				externalTaskId: task.externalTaskId,
				externalTaskUrl: task.url,
			});
			onOpenChange(false);
			resetForm();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to schedule");
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Schedule task</DialogTitle>
					<DialogDescription>
						Add this Linear issue to your calendar.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<Field>
						<FieldLabel>Title</FieldLabel>
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={task?.title}
						/>
					</Field>
					<Field>
						<FieldLabel>Date</FieldLabel>
						<DayPicker
							date={startDate}
							setDate={(d) => d && setStartDate(d)}
							dateFormat="EEE, MMM d"
							buttonProps={{ size: "sm" }}
						/>
					</Field>
					<div className="grid grid-cols-2 gap-4">
						<Field>
							<FieldLabel>Start time</FieldLabel>
							<TimeInput
								value={startTime}
								onChange={(t) => {
									if (!t) return;
									const time =
										t instanceof Time
											? t
											: new Time(
													(t as { hour: number; minute: number }).hour,
													(t as { hour: number; minute: number }).minute,
												);
									setStartTime(time);
								}}
								size="xs"
							/>
						</Field>
						<Field>
							<FieldLabel>End time</FieldLabel>
							<TimeInput
								value={endTime}
								onChange={(t) => {
									if (!t) return;
									const time =
										t instanceof Time
											? t
											: new Time(
													(t as { hour: number; minute: number }).hour,
													(t as { hour: number; minute: number }).minute,
												);
									setEndTime(time);
								}}
								size="xs"
							/>
						</Field>
					</div>
					<Field>
						<FieldLabel>Calendar</FieldLabel>
						<Combobox
							items={calendars ?? []}
							value={calendars?.find((cal) => cal.id === calendarId) ?? null}
							onValueChange={(value) => {
								setCalendarId(
									value === null ? undefined : (value.id as Id<"calendars">),
								);
							}}
							itemToStringValue={(item) => item.id}
							itemToStringLabel={(item) => item.name}
							isItemEqualToValue={(item, value) => item.id === value.id}
						>
							<ComboboxTrigger
								render={
									<Button
										startIcon={<CalendarIcon />}
										variant="outline"
										size="sm"
									>
										{calendars?.find((cal) => cal.id === calendarId) ? (
											<div className="flex items-center gap-2">
												<div
													className="h-3 w-3 shrink-0 rounded-full"
													style={{
														backgroundColor: calendars?.find(
															(cal) => cal.id === calendarId,
														)?.color,
													}}
												/>
												<span>
													{
														calendars?.find((cal) => cal.id === calendarId)
															?.name
													}
												</span>
												{calendars?.find((cal) => cal.id === calendarId)
													?.isGoogle && (
													<span className="text-muted-foreground text-xs">
														Google
													</span>
												)}
											</div>
										) : (
											<span className="text-muted-foreground">
												Select calendar
											</span>
										)}
									</Button>
								}
							/>
							<ComboboxContent width="min">
								<ComboboxInput
									showFocusRing={false}
									placeholder="Type calendar name"
									showTrigger={false}
								/>
								<ComboboxEmpty>No calendars found</ComboboxEmpty>
								<ComboboxList>
									{(calendar) => (
										<ComboboxItem key={calendar.id} value={calendar}>
											<div className="flex items-center gap-2">
												<div
													className="h-3 w-3 shrink-0 rounded-full"
													style={{ backgroundColor: calendar.color }}
												/>
												<span className="flex-1">{calendar.name}</span>
												{calendar.isGoogle && (
													<span className="text-muted-foreground text-xs">
														Google
													</span>
												)}
											</div>
										</ComboboxItem>
									)}
								</ComboboxList>
							</ComboboxContent>
						</Combobox>
					</Field>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit">Schedule</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
