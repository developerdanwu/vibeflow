import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@workos-inc/authkit-react";
import {
	Authenticated,
	AuthLoading,
	Unauthenticated,
	useQuery,
} from "convex/react";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import { CalendarAgendaView } from "@/components/big-calendar/components/agenda-view/calendar-agenda-view";
import { DndProviderWrapper } from "@/components/big-calendar/components/dnd/dnd-provider";
import { CalendarHeader } from "@/components/big-calendar/components/header/calendar-header";
import { CalendarMonthView } from "@/components/big-calendar/components/month-view/calendar-month-view";
import { CalendarDayView } from "@/components/big-calendar/components/week-and-day-view/calendar-day-view";
import { CalendarWeekView } from "@/components/big-calendar/components/week-and-day-view/calendar-week-view";
import { CalendarYearView } from "@/components/big-calendar/components/year-view/calendar-year-view";
import { CalendarProvider } from "@/components/big-calendar/contexts/calendar-context";
import type { IEvent, IUser } from "@/components/big-calendar/interfaces";
import { calendarStore } from "@/components/big-calendar/store/calendarStore";
import type { TEventColor } from "@/components/big-calendar/types";
import { api } from "../../convex/_generated/api";
import "@/styles/calendar.css";

const calendarSearchSchema = z.object({
	view: z.enum(["month", "week", "day", "year", "agenda"]).default("month"),
	date: z.string().optional(),
});

export const Route = createFileRoute("/calendar")({
	validateSearch: calendarSearchSchema,
	component: CalendarRoute,
});

function parseUrlDate(dateStr: string | undefined): Date {
	if (!dateStr) return new Date();
	const parsed = new Date(dateStr);
	return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function hashStringToNumber(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash);
}

const validColors: TEventColor[] = [
	"blue",
	"red",
	"green",
	"yellow",
	"purple",
	"orange",
	"gray",
];

function CalendarRoute() {
	return (
		<>
			<AuthLoading>
				<LoadingState message="Loading..." />
			</AuthLoading>
			<Unauthenticated>
				<SignInPrompt />
			</Unauthenticated>
			<Authenticated>
				<CalendarContent />
			</Authenticated>
		</>
	);
}

function LoadingState({ message }: { message: string }) {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				<p className="text-muted-foreground">{message}</p>
			</div>
		</div>
	);
}

function SignInPrompt() {
	const { signIn } = useAuth();

	return (
		<div className="min-h-screen bg-background flex items-center justify-center">
			<div className="max-w-md mx-auto text-center p-8">
				<h1 className="text-3xl font-bold mb-4">Welcome to VibeFlow</h1>
				<p className="text-muted-foreground mb-8">
					Sign in to access your personal calendar and manage your events.
				</p>
				<button
					type="button"
					onClick={() => signIn()}
					className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold transition-all hover:bg-primary/90"
				>
					Sign In to Continue
				</button>
			</div>
		</div>
	);
}

function CalendarContent() {
	const navigate = useNavigate();
	const { view, date: dateParam } = Route.useSearch();
	const { user } = useAuth();

	const currentUser: IUser | null = user
		? {
				id: user.id,
				name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User",
				picturePath: user.profilePictureUrl ?? null,
			}
		: null;

	const users: IUser[] = currentUser ? [currentUser] : [];

	const convexEvents = useQuery(api.events.getEventsByUser);

	const initialDate = useMemo(() => parseUrlDate(dateParam), [dateParam]);

	useEffect(() => {
		calendarStore.send({ type: "setSelectedDate", date: initialDate });
	}, [initialDate]);

	const events: IEvent[] = useMemo(() => {
		if (!convexEvents || !currentUser) return [];
		return convexEvents.map((event) => ({
			id: hashStringToNumber(event._id),
			convexId: event._id,
			title: event.title,
			description: event.description ?? "",
			startDate: new Date(event.startDate).toISOString(),
			endDate: new Date(event.endDate).toISOString(),
			color: (validColors.includes(event.color as TEventColor)
				? event.color
				: "blue") as TEventColor,
			user: currentUser,
		}));
	}, [convexEvents, currentUser]);

	const singleDayEvents = useMemo(() => {
		return events.filter((event) => {
			const start = new Date(event.startDate);
			const end = new Date(event.endDate);
			const duration = end.getTime() - start.getTime();
			return duration < 24 * 60 * 60 * 1000;
		});
	}, [events]);

	const multiDayEvents = useMemo(() => {
		return events.filter((event) => {
			const start = new Date(event.startDate);
			const end = new Date(event.endDate);
			const duration = end.getTime() - start.getTime();
			return duration >= 24 * 60 * 60 * 1000;
		});
	}, [events]);

	const handleViewChange = (
		newView: "month" | "week" | "day" | "year" | "agenda",
	) => {
		navigate({
			to: "/calendar",
			search: { view: newView, date: dateParam },
			replace: true,
		});
	};

	const renderCalendarView = () => {
		switch (view) {
			case "day":
				return (
					<CalendarDayView
						singleDayEvents={singleDayEvents}
						multiDayEvents={multiDayEvents}
					/>
				);
			case "week":
				return (
					<CalendarWeekView
						singleDayEvents={singleDayEvents}
						multiDayEvents={multiDayEvents}
					/>
				);
			case "year":
				return <CalendarYearView allEvents={events} />;
			case "agenda":
				return (
					<CalendarAgendaView
						singleDayEvents={singleDayEvents}
						multiDayEvents={multiDayEvents}
					/>
				);
			case "month":
			default:
				return (
					<CalendarMonthView
						singleDayEvents={singleDayEvents}
						multiDayEvents={multiDayEvents}
					/>
				);
		}
	};

	const isLoading = convexEvents === undefined;

	return (
		<div className="min-h-screen bg-background calendar-container">
			<CalendarProvider users={users} events={events}>
				<DndProviderWrapper>
					<div className="container mx-auto p-6">
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-4">
								<h1 className="text-3xl font-bold">Calendar</h1>
								{currentUser && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										{currentUser.picturePath && (
											<img
												src={currentUser.picturePath}
												alt={currentUser.name}
												className="w-6 h-6 rounded-full"
											/>
										)}
										<span>{currentUser.name}</span>
									</div>
								)}
							</div>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => handleViewChange("day")}
									className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
										view === "day"
											? "bg-primary text-primary-foreground"
											: "bg-secondary/20 hover:bg-secondary/30"
									}`}
								>
									Day
								</button>
								<button
									type="button"
									onClick={() => handleViewChange("week")}
									className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
										view === "week"
											? "bg-primary text-primary-foreground"
											: "bg-secondary/20 hover:bg-secondary/30"
									}`}
								>
									Week
								</button>
								<button
									type="button"
									onClick={() => handleViewChange("month")}
									className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
										view === "month"
											? "bg-primary text-primary-foreground"
											: "bg-secondary/20 hover:bg-secondary/30"
									}`}
								>
									Month
								</button>
								<button
									type="button"
									onClick={() => handleViewChange("year")}
									className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
										view === "year"
											? "bg-primary text-primary-foreground"
											: "bg-secondary/20 hover:bg-secondary/30"
									}`}
								>
									Year
								</button>
								<button
									type="button"
									onClick={() => handleViewChange("agenda")}
									className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
										view === "agenda"
											? "bg-primary text-primary-foreground"
											: "bg-secondary/20 hover:bg-secondary/30"
									}`}
								>
									Agenda
								</button>
							</div>
						</div>
						<CalendarHeader view={view} events={events} />
						<div className="mt-6 border rounded-lg p-4 bg-card">
							{isLoading ? (
								<div className="flex items-center justify-center h-96">
									<div className="flex flex-col items-center gap-4">
										<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
										<p className="text-muted-foreground">Loading events...</p>
									</div>
								</div>
							) : (
								renderCalendarView()
							)}
						</div>
					</div>
				</DndProviderWrapper>
			</CalendarProvider>
		</div>
	);
}
