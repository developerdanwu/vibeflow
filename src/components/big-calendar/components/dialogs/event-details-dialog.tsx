"use client";

import { format, parseISO } from "date-fns";
import { Calendar, Clock, Text, User } from "lucide-react";
import { useState } from "react";
import { EditEventDialog } from "@/components/big-calendar/components/dialogs/edit-event-dialog";
import { useDeleteEvent } from "@/components/big-calendar/hooks/use-delete-event";
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
import type { Id } from "../../../../../convex/_generated/dataModel";

interface IProps {
	event: IEvent;
	children: React.ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
	const startDate = parseISO(event.startDate);
	const endDate = parseISO(event.endDate);
	const { deleteEvent } = useDeleteEvent();
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		if (!event.convexId) {
			console.error("Cannot delete event without convexId");
			return;
		}

		if (!window.confirm("Are you sure you want to delete this event?")) {
			return;
		}

		setIsDeleting(true);
		try {
			await deleteEvent(event.convexId as Id<"events">);
		} catch (error) {
			console.error("Failed to delete event:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog>
			<DialogTrigger
				className={"w-full"}
				onClick={(e) => {
					e.stopPropagation();
				}}
			>
				{children}
			</DialogTrigger>
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

				<DialogFooter className="gap-2 sm:gap-0">
					<Button
						type="button"
						variant="destructive"
						onClick={handleDelete}
						disabled={isDeleting || !event.convexId}
					>
						{isDeleting ? "Deleting..." : "Delete"}
					</Button>
					<EditEventDialog event={event}>
						<Button type="button" variant="outline">
							Edit
						</Button>
					</EditEventDialog>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
