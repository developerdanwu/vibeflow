import { Link } from "@tanstack/react-router";
import type { Talk } from "content-collections";
import { Clock, User } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface TalkCardProps {
	talk: Talk;
	featured?: boolean;
}

export default function TalkCard({ talk, featured = false }: TalkCardProps) {
	return (
		<Link to={`/talks/${talk.slug}`} className="group relative block">
			<Card
				className={`card-hover relative overflow-hidden border-border/50 bg-card ${featured ? "aspect-[16/10]" : "aspect-[16/9]"}hover:border-gold/50`}
			>
				{/* Image */}
				<div className="absolute inset-0">
					<img
						src={`/${talk.image}`}
						alt={talk.title}
						className="h-full w-full object-cover"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-transparent" />
				</div>

				{/* Content overlay */}
				<CardContent className="absolute right-0 bottom-0 left-0 z-10 p-6">
					<div className="space-y-3">
						{/* Topics */}
						<div className="flex flex-wrap gap-2">
							{talk.topics.slice(0, 2).map((topic) => (
								<span
									key={topic}
									className="rounded-full border border-gold/30 bg-gold/15 px-2.5 py-0.5 font-medium text-gold text-xs uppercase tracking-wide"
								>
									{topic}
								</span>
							))}
						</div>

						{/* Title */}
						<h3 className="font-display font-semibold text-cream text-xl leading-tight transition-colors group-hover:text-gold">
							{talk.title}
						</h3>

						{/* Speaker & Duration */}
						<div className="flex items-center gap-4 text-cream/60 text-sm">
							<div className="flex items-center gap-1.5">
								<User className="h-3.5 w-3.5" />
								<span>{talk.speaker}</span>
							</div>
							<div className="flex items-center gap-1.5">
								<Clock className="h-3.5 w-3.5" />
								<span>{talk.duration}</span>
							</div>
						</div>
					</div>
				</CardContent>

				{/* Decorative accent */}
				<div className="absolute top-4 right-4">
					<div className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 bg-gold/10">
						<span className="font-display text-gold/60 text-xs">✦</span>
					</div>
				</div>
			</Card>
		</Link>
	);
}
