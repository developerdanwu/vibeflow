"use client";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { withForm } from "@/components/ui/form";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Separator } from "@/components/ui/separator";
import { useCalendar } from "@/routes/_authenticated/calendar/-components/calendar/contexts/calendar-context";
import type { Id } from "@convex/_generated/dataModel";
import { eventFormOptions } from "./form-options";
import { RelatedTasksSection } from "./related-tasks-section";

/**
 * Event-kind body (description + related tasks).
 * Uses TanStack Form withForm for typed form composition (see https://tanstack.com/form/latest/docs/framework/react/guides/form-composition#breaking-big-forms-into-smaller-pieces).
 */
export const EventFormBodySection = withForm({
	...eventFormOptions,
	props: {
		eventIdForLinks: undefined as Id<"events"> | undefined,
		isLoadingRelatedTasks: false,
	},
	render: function EventFormBodyRender({
		form,
		eventIdForLinks,
		isLoadingRelatedTasks,
	}) {
		const [, calendarStore] = useCalendar();
		return (
			<>
				<Separator />
				<form.AppField
					name="description"
					listeners={{
						onMount: ({ value }: { value: unknown }) => {
							calendarStore.trigger.setNewEventDescription({
								description: typeof value === "string" ? value : "",
							});
						},
						onChange: ({ value }: { value: unknown }) => {
							calendarStore.trigger.setNewEventDescription({
								description: typeof value === "string" ? value : "",
							});
						},
					}}
				>
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel
									className="sr-only"
									htmlFor={`${field.name}-rich-text-editor`}
								>
									Description
								</FieldLabel>
								<RichTextEditor
									id={`${field.name}-rich-text-editor`}
									name={field.name}
									className="min-h-24 resize-none rounded-none hover:bg-transparent focus:bg-transparent focus-visible:bg-transparent"
									variant="ghost"
									value={
										typeof field.state.value === "string"
											? field.state.value
											: ""
									}
									onBlur={field.handleBlur}
									onChange={(value) => field.handleChange(value)}
									aria-invalid={isInvalid}
									placeholder="Add a description..."
								/>
								{isInvalid && (
									<FieldError
										errors={
											field.state.meta.errors as
												| ({ message?: string } | undefined)[]
												| undefined
										}
									/>
								)}
							</Field>
						);
					}}
				</form.AppField>
				<Separator />
				<RelatedTasksSection
					form={form}
					eventIdForLinks={eventIdForLinks}
					variant="event"
					isLoadingRelatedTasks={isLoadingRelatedTasks}
				/>
			</>
		);
	},
});
