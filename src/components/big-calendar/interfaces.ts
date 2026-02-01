import type { TEventColor } from "@/components/big-calendar/types";

export interface IUser {
	id: string;
	name: string;
	picturePath: string | null;
}

export interface IEvent {
	id: string;
	convexId?: string;
	startDate: string;
	endDate: string;
	title: string;
	color: TEventColor;
	description: string;
	user: IUser;
}

export interface ICalendarCell {
	day: number;
	currentMonth: boolean;
	date: Date;
}
