"use client";

import type { IEvent } from "@/components/big-calendar/interfaces";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { dialogStore } from "@/lib/dialog-store";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, Text, User } from "lucide-react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

interface IProps {
	event: IEvent;
	children: React.ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
	const startDate = parseISO(event.startDate);
	const endDate = parseISO(event.endDate);
	const { mutate: deleteEvent, isPending } = useMutation({
		mutationFn: useConvexMutation(api.events.deleteEvent),
	});

	const handleDelete = () => {
		if (!event.convexId) {
			console.error("Cannot delete event without convexId");
			return;
		}

		dialogStore.send({
			type: "openConfirmDialog",
			title: "Delete Event",
			description:
				"Are you sure you want to delete this event? This action cannot be undone.",
			confirmText: "Delete",
			cancelText: "Cancel",
			onConfirm: () => {
				deleteEvent(
					{ id: event.convexId as Id<"events"> },
					{
						onError: (error) => {
							console.error("Failed to delete event:", error);
						},
					},
				);
			},
		});
	};

	return (
		<Dialog>
			<DialogTrigger
				className={"w-full"}
				onClick={(e) => {
					e.stopPropagation();
				}}
				render={(props) => {
					return <div {...props}>{children}</div>;
				}}
			/>

			<DialogContent overlayProps={{ onClick: (e) => e.stopPropagation() }}>
				<DialogHeader>
					<DialogTitle>{event.title}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="flex items-start gap-2">
						<User className="mt-1 size-4 shrink-0" />
						<div>
							<p className="font-medium text-sm">Responsible</p>
							<p className="text-muted-foreground text-sm">{event.user.name}</p>
						</div>
					</div>

					<div className="flex items-start gap-2">
						<Calendar className="mt-1 size-4 shrink-0" />
						<div>
							<p className="font-medium text-sm">Start Date</p>
							<p className="text-muted-foreground text-sm">
								{format(startDate, "MMM d, yyyy h:mm a")}
							</p>
						</div>
					</div>

					<div className="flex items-start gap-2">
						<Clock className="mt-1 size-4 shrink-0" />
						<div>
							<p className="font-medium text-sm">End Date</p>
							<p className="text-muted-foreground text-sm">
								{format(endDate, "MMM d, yyyy h:mm a")}
							</p>
						</div>
					</div>

					<div className="flex items-start gap-2">
						<Text className="mt-1 size-4 shrink-0" />
						<div>
							<p className="font-medium text-sm">Description</p>
							<p className="text-muted-foreground text-sm">
								{event.description}
							</p>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="destructive"
						onClick={handleDelete}
						disabled={isPending || !event.convexId}
					>
						{isPending ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
