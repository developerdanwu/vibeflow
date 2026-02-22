/**
 * Maps event color hex to CVA variant name for palette colors; returns "custom" for other hexes.
 * Used by event blocks to support both palette (Tailwind) and any custom hex (inline style).
 */
import type React from "react";

const PALETTE_HEX_TO_NAME: Record<string, string> = {
	"#3B82F6": "blue",
	"#22C55E": "green",
	"#EF4444": "red",
	"#EAB308": "yellow",
	"#A855F7": "purple",
	"#F97316": "orange",
	"#6B7280": "gray",
};

function normalizeHex(hex: string): string {
	const h = hex.trim();
	return h.startsWith("#") ? h.toUpperCase() : `#${h.toUpperCase()}`;
}

export type EventColorVariantResult =
	| { variant: string; style?: undefined }
	| { variant: "custom"; style: React.CSSProperties }
	| { variant: "custom-dot"; style: React.CSSProperties };

/** Returns black or white for contrast on the given hex background. */
function getContrastColor(hex: string): string {
	const n = hex.replace("#", "");
	const r = Number.parseInt(n.slice(0, 2), 16) / 255;
	const g = Number.parseInt(n.slice(2, 4), 16) / 255;
	const b = Number.parseInt(n.slice(4, 6), 16) / 255;
	const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
	return luminance > 0.5 ? "#171717" : "#fafafa";
}

export function getEventColorVariant(
	hex: string,
	badgeVariant: "dot" | "colored" | "mixed",
): EventColorVariantResult {
	const normalized = normalizeHex(hex);
	const name = PALETTE_HEX_TO_NAME[normalized];
	if (name) {
		const variant = badgeVariant === "dot" ? `${name}-dot` : name;
		return { variant };
	}
	const textColor = getContrastColor(hex);
	const isDot = badgeVariant === "dot";
	return {
		variant: isDot ? "custom-dot" : "custom",
		style: isDot
			? ({ ["--event-dot-custom"]: hex } as React.CSSProperties)
			: {
					backgroundColor: `${hex}20`,
					borderColor: hex,
					color: textColor,
				},
	};
}

/** For year-view and other small dots: returns Tailwind class for palette colors or style for custom. */
export function getEventDotClassOrStyle(hex: string): {
	className?: string;
	style?: React.CSSProperties;
} {
	const normalized = normalizeHex(hex);
	const name = PALETTE_HEX_TO_NAME[normalized];
	if (name) {
		const dotClass: Record<string, string> = {
			blue: "bg-blue-600",
			green: "bg-green-600",
			red: "bg-red-600",
			yellow: "bg-yellow-600",
			purple: "bg-purple-600",
			orange: "bg-orange-600",
			gray: "bg-neutral-600",
		};
		return { className: dotClass[name] ?? "bg-blue-600" };
	}
	return { style: { backgroundColor: hex } };
}
