import { Link } from "@tanstack/react-router";
import type { Speaker } from "content-collections";
import { MapPin } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface SpeakerCardProps {
	speaker: Speaker;
	featured?: boolean;
}

export default function SpeakerCard({
	speaker,
	featured = false,
}: SpeakerCardProps) {
	return (
		<Link to={`/speakers/${speaker.slug}`} className="group relative block">
			<Card
				className={`card-hover relative overflow-hidden border-border/50 bg-card ${featured ? "aspect-square" : "aspect-square"}hover:border-copper/50`}
			>
				{/* Headshot */}
				<div className="absolute inset-0">
					<img
						src={`/${speaker.headshot}`}
						alt={speaker.name}
						className="h-full w-full object-cover"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/50 to-transparent" />
				</div>

				{/* Content overlay */}
				<CardContent className="absolute right-0 bottom-0 left-0 z-10 p-6">
					<div className="space-y-2">
						{/* Specialty tag */}
						<span className="inline-block rounded-full border border-copper/30 bg-copper/20 px-3 py-1 font-medium text-copper-light text-xs uppercase tracking-wider">
							{speaker.specialty}
						</span>

						{/* Name */}
						<h3 className="font-display font-semibold text-2xl text-cream transition-colors group-hover:text-gold">
							{speaker.name}
						</h3>

						{/* Title & Restaurant */}
						<p className="font-body text-cream/70 text-lg">{speaker.title}</p>

						{/* Location */}
						<div className="flex items-center gap-2 text-cream/50 text-sm">
							<MapPin className="h-3.5 w-3.5" />
							<span>
								{speaker.restaurant}, {speaker.location}
							</span>
						</div>
					</div>
				</CardContent>

				{/* Decorative corner accent */}
				<div className="absolute top-0 right-0 h-20 w-20 overflow-hidden">
					<div className="absolute top-0 right-0 h-28 w-28 translate-x-14 -translate-y-14 rotate-45 transform bg-gradient-to-bl from-copper/20 to-transparent" />
				</div>
			</Card>
		</Link>
	);
}
