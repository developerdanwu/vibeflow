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
			<section className="relative min-h-[80vh] flex items-center justify-center px-6 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
				<div className="max-w-5xl mx-auto text-center">
					<h1 className="text-5xl md:text-7xl font-bold mb-6">VibeFlow</h1>
					<p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
						Flow Through Your Day - Manage your time effectively with smart
						calendar management, time blocking, and productivity insights.
					</p>

					<div className="flex flex-wrap justify-center gap-4 mb-12">
						<Link
							to="/calendar"
							className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold transition-all hover:bg-primary/90"
						>
							<Calendar className="w-5 h-5" />
							Open Calendar
							<ArrowRight className="w-5 h-5" />
						</Link>
						<button
							type="button"
							className="inline-flex items-center gap-2 px-8 py-4 rounded-lg border-2 border-primary/50 font-semibold transition-all hover:bg-primary/10"
						>
							Learn More
						</button>
					</div>
				</div>
			</section>

			<section className="py-20 px-6 bg-surface">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Everything You Need to Stay Productive
						</h2>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
							Powerful features to help you manage your time, focus on what
							matters, and achieve your goals.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						<div className="p-6 rounded-lg bg-card border">
							<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
								<Calendar className="w-6 h-6 text-primary" />
							</div>
							<h3 className="text-xl font-semibold mb-2">Smart Calendar</h3>
							<p className="text-muted-foreground">
								Seamlessly integrate with Google Calendar and manage all your
								events in one place.
							</p>
						</div>

						<div className="p-6 rounded-lg bg-card border">
							<div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
								<Clock className="w-6 h-6 text-secondary" />
							</div>
							<h3 className="text-xl font-semibold mb-2">Time Blocking</h3>
							<p className="text-muted-foreground">
								Block time for deep work and protect your focus with
								customizable time blocks.
							</p>
						</div>

						<div className="p-6 rounded-lg bg-card border">
							<div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
								<Target className="w-6 h-6 text-accent" />
							</div>
							<h3 className="text-xl font-semibold mb-2">Task Management</h3>
							<p className="text-muted-foreground">
								Convert tasks to calendar events and track your progress
								effortlessly.
							</p>
						</div>

						<div className="p-6 rounded-lg bg-card border">
							<div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
								<BarChart3 className="w-6 h-6 text-success" />
							</div>
							<h3 className="text-xl font-semibold mb-2">Analytics</h3>
							<p className="text-muted-foreground">
								Gain insights into how you spend your time and improve your
								productivity.
							</p>
						</div>

						<div className="p-6 rounded-lg bg-card border">
							<div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mb-4">
								<CheckCircle className="w-6 h-6 text-warning" />
							</div>
							<h3 className="text-xl font-semibold mb-2">Real-time Sync</h3>
							<p className="text-muted-foreground">
								Changes sync instantly across all your devices with real-time
								updates.
							</p>
						</div>

						<div className="p-6 rounded-lg bg-card border">
							<div className="w-12 h-12 rounded-lg bg-danger/10 flex items-center justify-center mb-4">
								<Target className="w-6 h-6 text-danger" />
							</div>
							<h3 className="text-xl font-semibold mb-2">Focus Mode</h3>
							<p className="text-muted-foreground">
								Minimize distractions and stay focused with Do Not Disturb
								settings.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="py-20 px-6">
				<div className="max-w-4xl mx-auto text-center">
					<div className="p-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Ready to Take Control of Your Time?
						</h2>
						<p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
							Start managing your calendar effectively and boost your
							productivity today.
						</p>
						<Link
							to="/calendar"
							className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold transition-all hover:bg-primary/90"
						>
							Get Started
							<ArrowRight className="w-5 h-5" />
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
