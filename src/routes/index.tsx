import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	BarChart3,
	Calendar,
	CheckCircle,
	Clock,
	Target,
} from "lucide-react";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	return (
		<div className="min-h-screen">
			<section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-6">
				<div className="mx-auto max-w-5xl text-center">
					<h1 className="mb-6 font-bold text-5xl md:text-7xl">VibeFlow</h1>
					<p className="mx-auto mb-8 max-w-3xl text-muted-foreground text-xl md:text-2xl">
						Flow Through Your Day - Manage your time effectively with smart
						calendar management, time blocking, and productivity insights.
					</p>

					<div className="mb-12 flex flex-wrap justify-center gap-4">
						<Link
							to="/calendar"
							className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
						>
							<Calendar className="h-5 w-5" />
							Open Calendar
							<ArrowRight className="h-5 w-5" />
						</Link>
						<button
							type="button"
							className="inline-flex items-center gap-2 rounded-lg border-2 border-primary/50 px-8 py-4 font-semibold transition-all hover:bg-primary/10"
						>
							Learn More
						</button>
					</div>
				</div>
			</section>

			<section className="bg-surface px-6 py-20">
				<div className="mx-auto max-w-7xl">
					<div className="mb-16 text-center">
						<h2 className="mb-4 font-bold text-3xl md:text-4xl">
							Everything You Need to Stay Productive
						</h2>
						<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
							Powerful features to help you manage your time, focus on what
							matters, and achieve your goals.
						</p>
					</div>

					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
						<div className="rounded-lg border bg-card p-6">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
								<Calendar className="h-6 w-6 text-primary" />
							</div>
							<h3 className="mb-2 font-semibold text-xl">Smart Calendar</h3>
							<p className="text-muted-foreground">
								Seamlessly integrate with Google Calendar and manage all your
								events in one place.
							</p>
						</div>

						<div className="rounded-lg border bg-card p-6">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
								<Clock className="h-6 w-6 text-secondary" />
							</div>
							<h3 className="mb-2 font-semibold text-xl">Time Blocking</h3>
							<p className="text-muted-foreground">
								Block time for deep work and protect your focus with
								customizable time blocks.
							</p>
						</div>

						<div className="rounded-lg border bg-card p-6">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
								<Target className="h-6 w-6 text-accent" />
							</div>
							<h3 className="mb-2 font-semibold text-xl">Task Management</h3>
							<p className="text-muted-foreground">
								Convert tasks to calendar events and track your progress
								effortlessly.
							</p>
						</div>

						<div className="rounded-lg border bg-card p-6">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
								<BarChart3 className="h-6 w-6 text-success" />
							</div>
							<h3 className="mb-2 font-semibold text-xl">Analytics</h3>
							<p className="text-muted-foreground">
								Gain insights into how you spend your time and improve your
								productivity.
							</p>
						</div>

						<div className="rounded-lg border bg-card p-6">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
								<CheckCircle className="h-6 w-6 text-warning" />
							</div>
							<h3 className="mb-2 font-semibold text-xl">Real-time Sync</h3>
							<p className="text-muted-foreground">
								Changes sync instantly across all your devices with real-time
								updates.
							</p>
						</div>

						<div className="rounded-lg border bg-card p-6">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-danger/10">
								<Target className="h-6 w-6 text-danger" />
							</div>
							<h3 className="mb-2 font-semibold text-xl">Focus Mode</h3>
							<p className="text-muted-foreground">
								Minimize distractions and stay focused with Do Not Disturb
								settings.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="px-6 py-20">
				<div className="mx-auto max-w-4xl text-center">
					<div className="rounded-2xl border bg-gradient-to-br from-primary/20 to-secondary/20 p-12">
						<h2 className="mb-4 font-bold text-3xl md:text-4xl">
							Ready to Take Control of Your Time?
						</h2>
						<p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
							Start managing your calendar effectively and boost your
							productivity today.
						</p>
						<Link
							to="/calendar"
							className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
						>
							Get Started
							<ArrowRight className="h-5 w-5" />
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
