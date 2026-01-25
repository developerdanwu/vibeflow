"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { useId } from "react";
import type { TimeValue } from "react-aria-components";
import { useForm } from "react-hook-form";
import {
	quickAddEventSchema,
	type TQuickAddEventFormData,
} from "@/components/big-calendar/schemas";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { TimeInput } from "@/components/ui/time-input";
import { useDisclosure } from "@/hooks/use-disclosure";
import { cn } from "@/lib/utils";
import { api } from "../../../../../convex/_generated/api";

interface IProps {
	className?: string;
	date: Date;
}

export function QuickAddEventPopover({ className, date }: IProps) {
	const formId = useId();
	const titleId = useId();

	const { isOpen, onClose, onToggle } = useDisclosure();
	const createEvent = useMutation(api.events.createEvent);

	const form = useForm<TQuickAddEventFormData>({
		resolver: zodResolver(quickAddEventSchema),
		defaultValues: {
			title: "",
			description: "",
		},
	});

	const onSubmit = async (values: TQuickAddEventFormData) => {
		try {
			const startDateTime = new Date(date);
			startDateTime.setHours(
				values.startTime.hour,
				values.startTime.minute,
				0,
				0,
			);

			const endDateTime = new Date(date);
			endDateTime.setHours(values.endTime.hour, values.endTime.minute, 0, 0);

			await createEvent({
				title: values.title,
				description: values.description || "",
				startDate: startDateTime.getTime(),
				endDate: endDateTime.getTime(),
				color: "blue",
				allDay: false,
			});

			onClose();
			form.reset();
		} catch (error) {
			console.error("Failed to create event:", error);
		}
	};

	return (
		<Popover open={isOpen} onOpenChange={onToggle}>
			<PopoverTrigger
				className={cn(
					"mx-1 flex h-6.5 w-[calc(100%-8px)] cursor-pointer select-none items-center gap-1.5 truncate whitespace-nowrap rounded-md border border-dashed border-muted-foreground/30 bg-muted/50 px-2 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
					className,
				)}
			>
				<Plus className="size-3.5" />
				<span className="truncate">Add event</span>
			</PopoverTrigger>

			<PopoverContent className="w-80" side="right" align="start">
				<PopoverHeader>
					<PopoverTitle>Quick Add Event</PopoverTitle>
				</PopoverHeader>

				<Form {...form}>
					<form
						id={formId}
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid gap-3"
					>
						<FormField
							control={form.control}
							name="title"
							render={({ field, fieldState }) => (
								<FormItem>
									<FormLabel htmlFor={titleId}>Title</FormLabel>
									<FormControl>
										<Input
											id={titleId}
											placeholder="Event title"
											data-invalid={fieldState.invalid}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex items-start gap-2">
							<FormField
								control={form.control}
								name="startTime"
								render={({ field, fieldState }) => (
									<FormItem className="flex-1">
										<FormLabel>Start Time</FormLabel>
										<FormControl>
											<TimeInput
												value={field.value as TimeValue}
												onChange={field.onChange}
												hourCycle={12}
												data-invalid={fieldState.invalid}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="endTime"
								render={({ field, fieldState }) => (
									<FormItem className="flex-1">
										<FormLabel>End Time</FormLabel>
										<FormControl>
											<TimeInput
												value={field.value as TimeValue}
												onChange={field.onChange}
												hourCycle={12}
												data-invalid={fieldState.invalid}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="description"
							render={({ field, fieldState }) => (
								<FormItem>
									<FormLabel>Description (optional)</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											value={field.value || ""}
											placeholder="Add a description..."
											data-invalid={fieldState.invalid}
											className="min-h-[60px]"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end gap-2 pt-2">
							<Button type="button" variant="outline" onClick={onClose}>
								Cancel
							</Button>
							<Button type="submit">Create</Button>
						</div>
					</form>
				</Form>
			</PopoverContent>
		</Popover>
	);
}
