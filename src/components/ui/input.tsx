import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
	"w-full min-w-0 rounded-lg border border-input bg-transparent outline-none transition-colors file:inline-flex file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:disabled:bg-input/80",
	{
		variants: {
			variant: {
				default: "",
				ghost:
					"border-0 bg-transparent hover:bg-accent/50 focus-visible:border-0 focus-visible:bg-accent/50 focus-visible:ring-0 dark:bg-transparent",
			},
			size: {
				default: "h-8 px-2.5 py-1 text-base file:h-6 file:text-sm md:text-sm",
				xs: "h-6 rounded-[min(var(--radius-md),10px)] px-2 py-0.5 text-xs file:h-4 file:text-xs",
				"2xs":
					"h-5 rounded-[min(var(--radius-md),8px)] px-1.5 py-0.5 text-2xs file:h-3.5 file:text-2xs",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Input({
	className,
	type,
	variant = "default",
	size = "default",
	...props
}: Omit<InputPrimitive.Props, "size" | "variant"> &
	VariantProps<typeof inputVariants>) {
	return (
		<InputPrimitive
			type={type}
			data-slot="input"
			className={cn(inputVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Input };
