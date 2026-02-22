import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ColorPickerCompact from "@/components/ui/color-picker-compact";
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
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { dialogStore } from "@/lib/dialog-store";
import { selectPlatform } from "@/lib/tauri";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings/calendars/")({
	component: CalendarsSettings,
});

const DEFAULT_CALENDAR_HEX = "#3B82F6";

const SYNC_FROM_OPTIONS: Array<{ value: string; label: string }> = [
	{ value: "1", label: "Last month" },
	{ value: "3", label: "Last 3 months" },
	{ value: "6", label: "Last 6 months" },
	{ value: "12", label: "Last year" },
	{ value: "24", label: "Last 2 years" },
];

function getSyncFromOption(
	value: number | undefined | null,
): { value: string; label: string } {
	const n = value ?? 1;
	return (
		SYNC_FROM_OPTIONS.find((o) => o.value === String(n)) ?? SYNC_FROM_OPTIONS[0]
	);
}

/** Legacy name → hex for backward compatibility when loading calendar for edit. */
const LEGACY_NAME_TO_HEX: Record<string, string> = {
	blue: "#3B82F6",
	green: "#22C55E",
	red: "#EF4444",
	yellow: "#EAB308",
	purple: "#A855F7",
	orange: "#F97316",
	gray: "#6B7280",
};

function calendarColorToHex(value: string): string {
	if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
		return value;
	}
	return LEGACY_NAME_TO_HEX[value.toLowerCase()] ?? DEFAULT_CALENDAR_HEX;
}

const GOOGLE_SCOPES =
	"https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";

function CalendarsSettings() {
	const { env, user } = useRouteContext({ from: "/_authenticated" });
	const { data: calendars, isLoading } = useQuery(
		convexQuery(api.calendars.queries.getUserCalendars),
	);
	const { data: googleConnection } = useQuery(
		convexQuery(api.googleCalendar.queries.getMyGoogleConnection),
	);
	const { data: userPreferences } = useQuery(
		convexQuery(api.users.queries.getUserPreferences),
	);
	const syncMyCalendars = useAction(
		api.googleCalendar.actionsNode.syncMyCalendars,
	);
	const updateUserPreferencesFn = useConvexMutation(
		api.users.mutations.updateUserPreferences,
	);
	const { mutate: updateSyncFromMonths } = useMutation({
		mutationFn: updateUserPreferencesFn,
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const [syncLoading, setSyncLoading] = useState(false);
	const clientId = env.VITE_GOOGLE_CALENDAR_CLIENT_ID;
	const redirectUri = `${env.VITE_WEB_ORIGIN}/oauth/google-callback`;
	const encodedState = btoa(
		JSON.stringify({
			redirectUri,
			userId: user._id,
			returnTo: selectPlatform({
				web: `${env.VITE_WEB_ORIGIN}/settings/calendars`,
				tauri: `${env.VITE_TAURI_ORIGIN}/settings/calendars`,
			}),
		}),
	);
	const authUrl =
		clientId && redirectUri
			? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(GOOGLE_SCOPES)}&state=${encodeURIComponent(encodedState)}&access_type=offline&prompt=consent`
			: null;

	const handleConnectGoogle = () => {
		if (authUrl) {
			void selectPlatform({
				tauri: async () => {
					const { openUrl } = await import("@tauri-apps/plugin-opener");
					await openUrl(authUrl);
				},
				web: () => {
					window.location.href = authUrl;
				},
			})();
		}
	};

	const handleSyncNow = async () => {
		setSyncLoading(true);
		try {
			await syncMyCalendars();
			toast.success("Google calendars synced");
		} catch (err) {
			toast.error(getConvexErrorMessage(err, "Sync failed"));
		} finally {
			setSyncLoading(false);
		}
	};

	const createCalendarFn = useConvexMutation(
		api.calendars.mutations.createCalendar,
	);
	const { mutateAsync: createCalendar, isPending: isCreating } = useMutation({
		mutationFn: createCalendarFn,
		onSuccess: () => {
			toast.success("Calendar created");
			setAddOpen(false);
			setAddName("");
			setAddColor(DEFAULT_CALENDAR_HEX);
			setAddDefault(false);
		},
		onError: (err) => {
			toast.error(getConvexErrorMessage(err, "Failed to create calendar"));
		},
	});

	const updateCalendarFn = useConvexMutation(
		api.calendars.mutations.updateCalendar,
	);
	const { mutateAsync: updateCalendar, isPending: isUpdating } = useMutation({
		mutationFn: updateCalendarFn,
		onSuccess: () => {
			toast.success("Calendar updated");
			setEditOpen(false);
			setEditingId(null);
		},
		onError: (err) => {
			toast.error(getConvexErrorMessage(err, "Failed to update calendar"));
		},
	});

	const deleteCalendarFn = useConvexMutation(
		api.calendars.mutations.deleteCalendar,
	);
	const { mutateAsync: deleteCalendar } = useMutation({
		mutationFn: deleteCalendarFn,
		onSuccess: () => {
			toast.success("Calendar deleted");
		},
		onError: (err) => {
			toast.error(getConvexErrorMessage(err, "Failed to delete calendar"));
		},
	});

	const removeMyGoogleConnectionFn = useConvexMutation(
		api.googleCalendar.mutations.removeMyGoogleConnection,
	);
	const { mutate: disconnectGoogle, isPending: isDisconnecting } = useMutation({
		mutationFn: removeMyGoogleConnectionFn,
		onSuccess: () => {
			toast.success("Google Calendar disconnected");
			setDisconnectOpen(false);
			setRemoveSyncedEvents(false);
			setRemoveLinkedCalendars(false);
		},
		onError: (err) => {
			toast.error(
				getConvexErrorMessage(err, "Failed to disconnect Google Calendar"),
			);
		},
	});

	const [addOpen, setAddOpen] = useState(false);
	const [addName, setAddName] = useState("");
	const [addColor, setAddColor] = useState(DEFAULT_CALENDAR_HEX);
	const [addDefault, setAddDefault] = useState(false);

	const [editOpen, setEditOpen] = useState(false);
	const [editingId, setEditingId] = useState<Id<"calendars"> | null>(null);
	const [editName, setEditName] = useState("");
	const [editColor, setEditColor] = useState(DEFAULT_CALENDAR_HEX);
	const [editDefault, setEditDefault] = useState(false);

	const [disconnectOpen, setDisconnectOpen] = useState(false);
	const [removeSyncedEvents, setRemoveSyncedEvents] = useState(false);
	const [removeLinkedCalendars, setRemoveLinkedCalendars] = useState(false);

	const openEdit = (id: Id<"calendars">) => {
		const cal = calendars?.find((c) => c._id === id);
		if (!cal) return;
		setEditingId(id);
		setEditName(cal.name);
		setEditColor(calendarColorToHex(cal.color));
		setEditDefault(cal.isDefault);
		setEditOpen(true);
	};

	const openDelete = (id: Id<"calendars">) => {
		dialogStore.send({
			type: "openConfirmDialog",
			title: "Delete calendar",
			description:
				"Are you sure? Events in this calendar will be unassigned but not deleted. You cannot delete the default calendar.",
			confirmText: "Delete",
			onConfirm: async () => {
				await deleteCalendar({ id });
			},
		});
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

			{/* Google Calendar card */}
			<Card>
				<CardHeader>
					<CardTitle>Google Calendar</CardTitle>
					<CardDescription>
						Connect your Google account to sync events and show them on your
						calendar.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{googleConnection ? (
						<>
							<div className="flex flex-wrap items-center gap-2">
								<span className="text-muted-foreground text-sm">Connected</span>
								<Button
									variant="secondary"
									size="sm"
									onClick={handleSyncNow}
									disabled={syncLoading}
								>
									{syncLoading ? "Syncing…" : "Sync now"}
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setDisconnectOpen(true)}
									disabled={isDisconnecting}
								>
									Disconnect
								</Button>
							</div>
							<div className="grid gap-2">
								<Label>Sync events from</Label>
								<Combobox
									items={[...SYNC_FROM_OPTIONS]}
									value={getSyncFromOption(
										userPreferences?.calendarSyncFromMonths,
									)}
									onValueChange={(option) => {
										if (option) {
											updateSyncFromMonths({
												calendarSyncFromMonths: Number(option.value) as
													1 | 3 | 6 | 12 | 24,
											});
										}
									}}
									itemToStringValue={(item) => item.value}
									itemToStringLabel={(item) => item.label}
									isItemEqualToValue={(a, b) => a.value === b.value}
								>
									<ComboboxTrigger
										render={
											<Button variant="outline" size="sm" className="w-[180px]">
												{getSyncFromOption(
													userPreferences?.calendarSyncFromMonths,
												).label}
											</Button>
										}
									/>
									<ComboboxContent width="min" className="min-w-[180px]">
										<ComboboxInput
											showFocusRing={false}
											placeholder="Sync range"
											showTrigger={false}
										/>
										<ComboboxEmpty>No option found</ComboboxEmpty>
										<ComboboxList>
											{(option) => (
												<ComboboxItem
													key={option.value}
													value={option}
												>
													{option.label}
												</ComboboxItem>
											)}
										</ComboboxList>
									</ComboboxContent>
								</Combobox>
								<p className="text-muted-foreground text-xs">
									Only affects the next full sync; incremental syncs stay in
									sync automatically.
								</p>
							</div>
							{googleConnection.googleCalendars.length > 0 ? (
								<ul className="flex flex-col gap-2">
									{googleConnection.googleCalendars.map((gc) => (
										<li
											key={gc._id}
											className="flex min-w-0 items-center gap-3 rounded-lg border bg-card px-4 py-3"
										>
											<div
												className="size-4 shrink-0 rounded-full"
												style={{
													backgroundColor: calendarColorToHex(
														gc.color ?? DEFAULT_CALENDAR_HEX,
													),
												}}
											/>
											<span className="truncate font-medium">{gc.name}</span>
										</li>
									))}
								</ul>
							) : (
								<p className="text-muted-foreground text-sm">
									No Google calendars synced yet. Click Sync now to fetch them.
								</p>
							)}
						</>
					) : (
						<div className="space-y-2">
							<Button
								onClick={handleConnectGoogle}
								disabled={!authUrl}
								title={
									!clientId
										? "Configure VITE_GOOGLE_CALENDAR_CLIENT_ID to connect"
										: undefined
								}
							>
								Connect Google Calendar
							</Button>
							{!clientId && (
								<p className="text-muted-foreground text-sm">
									Configure VITE_GOOGLE_CALENDAR_CLIENT_ID to connect.
								</p>
							)}
						</div>
					)}
				</CardContent>
			</Card>

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
											className="size-4 shrink-0 rounded-full"
											style={{
												backgroundColor: calendarColorToHex(cal.color),
											}}
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
							<ColorPickerCompact
								value={addColor}
								onChange={setAddColor}
							/>
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
							<ColorPickerCompact
								value={editColor}
								onChange={setEditColor}
							/>
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

			{/* Disconnect Google Calendar confirm dialog */}
			<Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Disconnect Google Calendar</DialogTitle>
						<DialogDescription>
							Stop syncing with this Google account. Your calendars and events
							will remain unless you choose to remove synced events below.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-3 py-2">
						<div className="flex items-center gap-2">
							<Switch
								id="remove-synced-events"
								checked={removeSyncedEvents}
								onCheckedChange={setRemoveSyncedEvents}
							/>
							<Label htmlFor="remove-synced-events" className="cursor-pointer">
								Also remove all events synced from this Google account
							</Label>
						</div>
						<div className="flex items-center gap-2">
							<Switch
								id="remove-linked-calendars"
								checked={removeLinkedCalendars}
								onCheckedChange={setRemoveLinkedCalendars}
							/>
							<Label
								htmlFor="remove-linked-calendars"
								className="cursor-pointer"
							>
								Also remove calendars linked to this Google account
							</Label>
						</div>
					</div>
					<DialogFooter showCloseButton>
						<Button
							variant={
								removeSyncedEvents || removeLinkedCalendars
									? "destructive"
									: "default"
							}
							onClick={() =>
								disconnectGoogle({
									removeSyncedEvents: removeSyncedEvents || undefined,
									removeLinkedCalendars: removeLinkedCalendars || undefined,
								})
							}
							disabled={isDisconnecting}
						>
							{isDisconnecting ? "Disconnecting…" : "Disconnect"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
