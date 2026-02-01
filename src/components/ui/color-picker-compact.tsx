"use client";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { HexColorPicker } from "react-colorful";

interface ColorPickerCompactProps {
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

const PRESET_COLORS = [
	{ name: "blue", hex: "#3B82F6" },
	{ name: "green", hex: "#22C55E" },
	{ name: "red", hex: "#EF4444" },
	{ name: "yellow", hex: "#EAB308" },
	{ name: "purple", hex: "#A855F7" },
	{ name: "orange", hex: "#F97316" },
	{ name: "gray", hex: "#6B7280" },
] as const;

export default function ColorPickerCompact({
	value,
	onChange,
	className,
}: ColorPickerCompactProps) {
	const [isOpen, setIsOpen] = useState(false);

	const handlePresetClick = (hex: string) => {
		onChange(hex);
		setIsOpen(false);
	};

	const handleCustomColorChange = (newColor: string) => {
		onChange(newColor);
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger>
				<button
					type="button"
					className={cn(
						"flex items-center justify-center gap-1 rounded-sm px-1 py-1 transition-colors hover:bg-accent",
						className,
					)}
				>
					<div
						className="size-4 rounded-full border border-border/50"
						style={{ backgroundColor: value }}
					/>
					<ChevronDown className="size-3 text-muted-foreground" />
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-2" align="start">
				<div className="flex items-center gap-1.5">
					{PRESET_COLORS.map((color) => (
						<button
							type="button"
							key={color.name}
							onClick={() => handlePresetClick(color.hex)}
							className={cn(
								"size-5 rounded-full border border-transparent transition-all hover:scale-110",
								value === color.hex &&
									"ring-2 ring-foreground ring-offset-1 ring-offset-background",
							)}
							style={{ backgroundColor: color.hex }}
							title={color.name}
						/>
					))}
					<Popover>
						<PopoverTrigger>
							<button
								type="button"
								className="flex size-5 items-center justify-center rounded-full border border-border border-dashed transition-all hover:scale-110 hover:border-foreground"
								title="Custom color"
							>
								<Plus className="size-3 text-muted-foreground" />
							</button>
						</PopoverTrigger>
						<PopoverContent backdrop side="right" className="w-auto p-2">
							<HexColorPicker
								className="aspect-square! h-[160px]! w-[160px]!"
								color={value}
								onChange={handleCustomColorChange}
							/>
						</PopoverContent>
					</Popover>
				</div>
			</PopoverContent>
		</Popover>
	);
}
