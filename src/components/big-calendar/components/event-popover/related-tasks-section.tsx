"use client";

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
import { withForm } from "@/components/ui/form";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, ExternalLink, Link2, Unlink } from "lucide-react";
import { eventFormOptions } from "./form-options";

export type LinearTaskItem = {
	_id: string;
	externalTaskId: string;
	title: string;
	identifier?: string;
	url: string;
};

export type LinkedTaskLink = {
	externalTaskId: string;
	url: string;
	linkType?: string;
};

/**
 * Related Linear tasks: always stored in form field relatedTaskLinks (array).
 * Uses withForm so the parent passes the same form instance (no context).
 * Create: form is source of truth; submit passes relatedTaskLinks to createEvent.
 * Edit: seed form from Convex when links load; submit passes task links via updateEvent.
 * Uses TanStack Form array field (mode="array") for relatedTaskLinks.
 */
export const RelatedTasksSection = withForm({
	...eventFormOptions,
	props: {
		eventIdForLinks: undefined as Id<"events"> | undefined,
		variant: "task" as "event" | "task",
	},
	render: function RelatedTasksSectionRender({ form, variant }) {
		const { data: taskItems = [], isLoading: isTaskItemsLoading } = useQuery({
			...convexQuery(api.taskProviders.linear.queries.getMyTaskItems),
			enabled: true,
		});

		const isTaskVariant = variant === "task";
		const sectionLabel = isTaskVariant ? "Scheduled tasks" : "Related tasks";

		return (
			<div
				className={cn(
					"space-y-2 px-2 py-2",
					isTaskVariant && "min-h-[140px] space-y-3 py-3",
					!isTaskVariant && "bg-muted/30",
				)}
			>
				<div className="flex items-center gap-1">
					<ClipboardCheck className="size-4 text-muted-foreground" />
					<span
						className={cn(
							"text-sm",
							isTaskVariant ? "font-semibold text-foreground" : "font-medium",
						)}
					>
						{sectionLabel}
					</span>
				</div>
				<form.AppField name="relatedTaskLinks" mode="array">
					{(field) => {
						const links = (field.state.value ?? []) as Array<{
							externalTaskId: string;
							url: string;
						}>;
						const availableItems = taskItems.filter(
							(t) => !links.some((l) => l.externalTaskId === t.externalTaskId),
						);
						return (
							<>
								{links.length > 0 ? (
									<ul
										className={cn("space-y-1.5", isTaskVariant && "space-y-2")}
									>
										{links.map((link) => {
											const task = taskItems.find(
												(t) => t.externalTaskId === link.externalTaskId,
											);
											const label =
												task?.identifier ?? task?.title ?? link.externalTaskId;
											return (
												<li
													key={link.externalTaskId}
													className={cn(
														"flex items-center gap-2 border bg-background",
														isTaskVariant
															? "rounded-lg px-3 py-2 shadow-sm"
															: "rounded-md px-2 py-1.5",
													)}
												>
													<span
														className={cn(
															"min-w-0 flex-1 truncate text-sm",
															isTaskVariant && "text-foreground",
														)}
													>
														{label}
													</span>
													<Tooltip>
														<TooltipTrigger
															render={
																<Button
																	variant="ghost"
																	size="icon-sm"
																	aria-label="Open in Linear"
																	className="shrink-0"
																	render={
																		// biome-ignore lint/a11y/useAnchorContent: content provided by Button children
																		<a
																			href={link.url}
																			target="_blank"
																			rel="noopener noreferrer"
																		/>
																	}
																>
																	<ExternalLink className="size-3.5" />
																</Button>
															}
														/>
														<TooltipContent>Open in Linear</TooltipContent>
													</Tooltip>
													<Tooltip>
														<TooltipTrigger
															render={
																<Button
																	type="button"
																	variant="ghost"
																	size="icon-sm"
																	aria-label="Remove task"
																	className="shrink-0"
																	onClick={() =>
																		field.handleChange(
																			links.filter(
																				(l) =>
																					l.externalTaskId !==
																					link.externalTaskId,
																			),
																		)
																	}
																>
																	<Unlink className="size-3.5" />
																</Button>
															}
														/>
														<TooltipContent>Remove task</TooltipContent>
													</Tooltip>
												</li>
											);
										})}
									</ul>
								) : (
									<p className="text-muted-foreground text-sm">
										No tasks linked yet
									</p>
								)}
								{!isTaskItemsLoading && taskItems.length === 0 && (
									<p className="text-muted-foreground text-xs">
										Connect Linear in Settings and refresh to see tasks.
									</p>
								)}
								<div>
									<Combobox<LinearTaskItem | null>
										items={availableItems}
										value={null}
										onValueChange={(task) => {
											if (!task) return;
											if (
												links.some(
													(l) => l.externalTaskId === task.externalTaskId,
												)
											) {
												return;
											}
											field.pushValue({
												externalTaskId: task.externalTaskId,
												url: task.url,
											});
										}}
										itemToStringValue={(item) =>
											item ? item.externalTaskId : ""
										}
										itemToStringLabel={(item) =>
											item
												? item.identifier
													? `${item.identifier}: ${item.title}`
													: item.title
												: ""
										}
										isItemEqualToValue={(item, value) =>
											item != null && typeof value === "string"
												? item.externalTaskId === value
												: item != null &&
														value != null &&
														typeof value === "object" &&
														"externalTaskId" in value
													? item.externalTaskId === value.externalTaskId
													: false
										}
									>
										<ComboboxTrigger
											render={
												<Button
													type="button"
													variant={isTaskVariant ? "default" : "outline"}
													size="xs"
													startIcon={<Link2 className="size-4" />}
												>
													Link task
												</Button>
											}
										/>
										<ComboboxContent width="min">
											<ComboboxInput
												showFocusRing={false}
												placeholder="Search tasks..."
												showTrigger={false}
											/>
											<ComboboxEmpty>No tasks to link</ComboboxEmpty>
											<ComboboxList>
												{(task) =>
													task ? (
														<ComboboxItem
															key={task.externalTaskId}
															value={task}
														>
															{task.identifier
																? `${task.identifier}: ${task.title}`
																: task.title}
														</ComboboxItem>
													) : null
												}
											</ComboboxList>
										</ComboboxContent>
									</Combobox>
								</div>
							</>
						);
					}}
				</form.AppField>
			</div>
		);
	},
});
