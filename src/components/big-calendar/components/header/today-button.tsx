import { useNavigate } from "@tanstack/react-router";
import { formatDate } from "date-fns";

export function TodayButton() {
	const navigate = useNavigate();

	const today = new Date();
	const handleClick = () =>
		navigate({ to: "/calendar", search: (prev) => ({ ...prev, date: today }) });

	return (
		<button
			className="flex size-14 flex-col items-start overflow-hidden rounded-lg border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
			onClick={handleClick}
		>
			<p className="flex h-6 w-full items-center justify-center bg-primary text-center font-semibold text-primary-foreground text-xs">
				{formatDate(today, "MMM").toUpperCase()}
			</p>
			<p className="flex w-full items-center justify-center font-bold text-lg">
				{today.getDate()}
			</p>
		</button>
	);
}
