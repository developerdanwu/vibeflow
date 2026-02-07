import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings/calendars")({
	component: CalendarsSettings,
});

const CALENDAR_COLORS = [
	"blue",
	"red",
	"green",
	"yellow",
	"purple",
	"orange",
	"gray",
] as const;

const colorSwatchClass: Record<(typeof CALENDAR_COLORS)[number], string> = {
	blue: "bg-blue-500",
	red: "bg-red-500",
	green: "bg-green-500",
	yellow: "bg-yellow-500",
	purple: "bg-purple-500",
	orange: "bg-orange-500",
	gray: "bg-neutral-500",
};

function CalendarsSettings() {
	const { data: calendars, isLoading } = useQuery(
		convexQuery(api.calendars.getUserCalendars),
	);

	const createCalendarFn = useConvexMutation(api.calendars.createCalendar);
	const { mutateAsync: createCalendar, isPending: isCreating } = useMutation({
		mutationFn: createCalendarFn,
		onSuccess: () => {
			toast.success("Calendar created");
			setAddOpen(false);
			setAddName("");
			setAddColor("blue");
			setAddDefault(false);
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const updateCalendarFn = useConvexMutation(api.calendars.updateCalendar);
	const { mutateAsync: updateCalendar, isPending: isUpdating } = useMutation({
		mutationFn: updateCalendarFn,
		onSuccess: () => {
			toast.success("Calendar updated");
			setEditOpen(false);
			setEditingId(null);
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const deleteCalendarFn = useConvexMutation(api.calendars.deleteCalendar);
	const { mutateAsync: deleteCalendar, isPending: isDeleting } = useMutation({
		mutationFn: deleteCalendarFn,
		onSuccess: () => {
			toast.success("Calendar deleted");
			setDeleteOpen(false);
			setDeletingId(null);
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const [addOpen, setAddOpen] = useState(false);
	const [addName, setAddName] = useState("");
	const [addColor, setAddColor] =
		useState<(typeof CALENDAR_COLORS)[number]>("blue");
	const [addDefault, setAddDefault] = useState(false);

	const [editOpen, setEditOpen] = useState(false);
	const [editingId, setEditingId] = useState<Id<"calendars"> | null>(null);
	const [editName, setEditName] = useState("");
	const [editColor, setEditColor] =
		useState<(typeof CALENDAR_COLORS)[number]>("blue");
	const [editDefault, setEditDefault] = useState(false);

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<Id<"calendars"> | null>(null);

	const openEdit = (id: Id<"calendars">) => {
		const cal = calendars?.find((c) => c._id === id);
		if (!cal) return;
		setEditingId(id);
		setEditName(cal.name);
		setEditColor(
			CALENDAR_COLORS.includes(cal.color as (typeof CALENDAR_COLORS)[number])
				? (cal.color as (typeof CALENDAR_COLORS)[number])
				: "blue",
		);
		setEditDefault(cal.isDefault);
		setEditOpen(true);
	};

	const openDelete = (id: Id<"calendars">) => {
		setDeletingId(id);
		setDeleteOpen(true);
	};

	const handleAddSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const name = addName.trim();
		if (!name) {
			toast.error("Name is required");
			return;
		}
		await createCalendar({ name, color: addColor, isDefault: addDefault });
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingId) return;
		const name = editName.trim();
		if (!name) {
			toast.error("Name is required");
			return;
		}
		await updateCalendar({
			id: editingId,
			name,
			color: editColor,
			isDefault: editDefault,
		});
	};

	const handleDeleteConfirm = async () => {
		if (!deletingId) return;
		await deleteCalendar({ id: deletingId });
	};

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">Calendars</h1>
					<p className="text-muted-foreground text-sm">
						Manage your calendars and set a default.
					</p>
				</div>
				<Button onClick={() => setAddOpen(true)}>Add calendar</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Your calendars</CardTitle>
					<CardDescription>
						Events can be assigned to a calendar. One calendar can be set as
						default for new events.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<p className="text-muted-foreground text-sm">Loading…</p>
					) : !calendars?.length ? (
						<p className="text-muted-foreground text-sm">
							No calendars yet. Add one above.
						</p>
					) : (
						<ul className="flex flex-col gap-2">
							{calendars.map((cal) => (
								<li
									key={cal._id}
									className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3"
								>
									<div className="flex min-w-0 items-center gap-3">
										<div
											className={cn(
												"size-4 shrink-0 rounded-full",
												colorSwatchClass[
													CALENDAR_COLORS.includes(
														cal.color as (typeof CALENDAR_COLORS)[number],
													)
														? (cal.color as (typeof CALENDAR_COLORS)[number])
														: "blue"
												],
											)}
										/>
										<span className="truncate font-medium">{cal.name}</span>
										{cal.isDefault && (
											<Badge variant="secondary" className="shrink-0">
												Default
											</Badge>
										)}
									</div>
									<div className="flex shrink-0 gap-1">
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => openEdit(cal._id)}
											aria-label="Edit calendar"
										>
											<Pencil className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => openDelete(cal._id)}
											disabled={cal.isDefault}
											aria-label="Delete calendar"
											title={
												cal.isDefault
													? "Cannot delete the default calendar"
													: "Delete calendar"
											}
										>
											<Trash2 className="size-4 text-destructive" />
										</Button>
									</div>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>

			{/* Add calendar dialog */}
			<Dialog open={addOpen} onOpenChange={setAddOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Add calendar</DialogTitle>
						<DialogDescription>
							Create a new calendar. You can assign events to it and set it as
							default.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
						<div className="grid gap-2">
							<Label htmlFor="add-name">Name</Label>
							<Input
								id="add-name"
								value={addName}
								onChange={(e) => setAddName(e.target.value)}
								placeholder="e.g. Work"
							/>
						</div>
						<div className="grid gap-2">
							<Label>Color</Label>
							<Select
								value={addColor}
								onValueChange={(v) =>
									setAddColor(v as (typeof CALENDAR_COLORS)[number])
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{CALENDAR_COLORS.map((c) => (
										<SelectItem key={c} value={c}>
											<span className="capitalize">{c}</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center gap-2">
							<Switch checked={addDefault} onCheckedChange={setAddDefault} />
							<Label>Default calendar</Label>
						</div>
						<DialogFooter showCloseButton>
							<Button type="submit" disabled={isCreating}>
								{isCreating ? "Creating…" : "Create"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Edit calendar dialog */}
			<Dialog open={editOpen} onOpenChange={setEditOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Edit calendar</DialogTitle>
						<DialogDescription>
							Change the name, color, or default setting.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
						<div className="grid gap-2">
							<Label htmlFor="edit-name">Name</Label>
							<Input
								id="edit-name"
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								placeholder="e.g. Work"
							/>
						</div>
						<div className="grid gap-2">
							<Label>Color</Label>
							<Select
								value={editColor}
								onValueChange={(v) =>
									setEditColor(v as (typeof CALENDAR_COLORS)[number])
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{CALENDAR_COLORS.map((c) => (
										<SelectItem key={c} value={c}>
											<span className="capitalize">{c}</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center gap-2">
							<Switch checked={editDefault} onCheckedChange={setEditDefault} />
							<Label>Default calendar</Label>
						</div>
						<DialogFooter showCloseButton>
							<Button type="submit" disabled={isUpdating}>
								{isUpdating ? "Saving…" : "Save"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete confirm dialog */}
			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Delete calendar</DialogTitle>
						<DialogDescription>
							Are you sure? Events in this calendar will be unassigned but not
							deleted. You cannot delete the default calendar.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter showCloseButton>
						<Button
							variant="destructive"
							onClick={handleDeleteConfirm}
							disabled={isDeleting}
						>
							{isDeleting ? "Deleting…" : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
