import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { selectPlatform } from "@/lib/tauri";
import { cn } from "@/lib/utils";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const SIDEBAR_WIDTH = "3.5rem";
const SIDEBAR_WIDTH_EXPANDED = "16rem";

type SidebarContextProps = {
	isMobile: boolean;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
	const context = React.useContext(SidebarContext);
	if (!context) {
		throw new Error("useSidebar must be used within a SidebarProvider.");
	}

	return context;
}

function SidebarProvider({
	className,
	style,
	children,
	titleBar,
	...props
}: React.ComponentProps<"div"> & {
	titleBar?: React.ReactNode;
}) {
	const isMobile = useIsMobile();

	const contextValue = React.useMemo<SidebarContextProps>(
		() => ({
			isMobile,
		}),
		[isMobile],
	);

	return (
		<SidebarContext.Provider value={contextValue}>
			<div className="flex h-svh flex-col">
				{titleBar}
				<div
					data-slot="sidebar-wrapper"
					style={
						{
							"--sidebar-width-icon": SIDEBAR_WIDTH,
							...style,
						} as React.CSSProperties
					}
					className={cn(
						"group/sidebar-wrapper flex min-h-0 w-full flex-1 flex-row overflow-hidden bg-sidebar",
						className,
					)}
					{...props}
				>
					{children}
				</div>
			</div>
		</SidebarContext.Provider>
	);
}

function Sidebar({
	side = "left",
	variant = "icon",
	className,
	children,
	...props
}: React.ComponentProps<"div"> & {
	side?: "left" | "right";
	variant?: "icon" | "expanded";
}) {
	const isExpanded = variant === "expanded";
	const widthStyle = isExpanded
		? ({ "--sidebar-width": SIDEBAR_WIDTH_EXPANDED } as React.CSSProperties)
		: undefined;
	const widthClass = isExpanded
		? "w-(--sidebar-width)"
		: "w-(--sidebar-width-icon)";

	return (
		<div
			className="group peer hidden text-sidebar-foreground md:block"
			data-side={side}
			data-slot="sidebar"
		>
			<div
				data-slot="sidebar-gap"
				className={cn(
					"relative bg-transparent",
					widthClass,
					"group-data-[side=right]:rotate-180",
				)}
				style={widthStyle}
			/>
			<div
				data-slot="sidebar-container"
				className={cn(
					selectPlatform({
						web: "fixed inset-y-0 hidden h-[calc(100svh-80px)] md:flex",
						tauri: "fixed top-[30px] bottom-0 hidden md:flex",
					}),
					widthClass,
					"left-0 border-sidebar-border",
					className,
				)}
				style={widthStyle}
				{...props}
			>
				<div
					data-sidebar="sidebar"
					data-slot="sidebar-inner"
					data-variant={variant}
					className="group/sidebar flex size-full flex-col bg-sidebar"
				>
					{children}
				</div>
			</div>
		</div>
	);
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
	return (
		<main
			data-slot="sidebar-inset"
			className={cn(
				"min-h-0 min-w-0 flex-1 overflow-auto",
				selectPlatform({
					tauri:
						"relative mr-2 mb-2 flex flex-col rounded-lg border bg-background shadow-xs",
					web: "relative my-2 mr-2 flex flex-col rounded-lg border bg-background shadow-xs",
				}),
				className,
			)}
			{...props}
		/>
	);
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-header"
			data-sidebar="header"
			className={cn(
				"flex w-full flex-col gap-2 p-2 group-data-[variant=expanded]/sidebar:items-start",
				className,
			)}
			{...props}
		/>
	);
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-footer"
			data-sidebar="footer"
			className={cn(
				"flex flex-col items-center justify-center gap-2 p-2",
				className,
			)}
			{...props}
		/>
	);
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-content"
			data-sidebar="content"
			className={cn(
				"no-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-auto",
				className,
			)}
			{...props}
		/>
	);
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-group"
			data-sidebar="group"
			className={cn("flex w-full min-w-0 flex-col gap-1 p-2", className)}
			{...props}
		/>
	);
}

function SidebarGroupLabel({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-group-label"
			data-sidebar="group-label"
			className={cn(
				"px-2 py-1.5 font-medium text-sidebar-foreground text-xs",
				className,
			)}
			{...props}
		/>
	);
}

function SidebarGroupContent({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-group-content"
			data-sidebar="group-content"
			className={cn("flex w-full min-w-0 flex-col gap-0", className)}
			{...props}
		/>
	);
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
	return (
		<ul
			data-slot="sidebar-menu"
			data-sidebar="menu"
			className={cn("flex w-full min-w-0 flex-col gap-0", className)}
			{...props}
		/>
	);
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
	return (
		<li
			data-slot="sidebar-menu-item"
			data-sidebar="menu-item"
			className={cn(
				"group/menu-item relative flex items-center justify-center group-data-[variant=expanded]/sidebar:justify-start",
				className,
			)}
			{...props}
		/>
	);
}

const sidebarMenuButtonVariants = cva(
	"peer/menu-button group/menu-button flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground group-data-[variant=expanded]/sidebar:justify-start [&>span:last-child]:truncate group-data-[variant=icon]/sidebar:[&>span:last-child]:hidden [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
				outline:
					"bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
			},
			size: {
				default: "h-8 text-sm",
				sm: "h-7 text-xs",
				lg: "h-12 text-sm",
			},
		},
		defaultVariants: {
			isActive: false,
			variant: "default",
			size: "default",
		},
	},
);

function SidebarMenuButton({
	render,
	isActive = false,
	variant = "default",
	size = "default",
	tooltip,
	className,
	...props
}: useRender.ComponentProps<"button"> &
	React.ComponentProps<"button"> & {
		isActive?: boolean;
		tooltip?: string | React.ComponentProps<typeof TooltipContent>;
	} & VariantProps<typeof sidebarMenuButtonVariants>) {
	const { isMobile } = useSidebar();
	const comp = useRender({
		defaultTagName: "button",
		props: mergeProps<"button">(
			{
				className: cn(sidebarMenuButtonVariants({ variant, size }), className),
			},
			props,
		),
		render: !tooltip ? render : TooltipTrigger,
		state: {
			slot: "sidebar-menu-button",
			sidebar: "menu-button",
			size,
			active: isActive,
		},
	});

	if (!tooltip) {
		return comp;
	}

	if (typeof tooltip === "string") {
		tooltip = {
			children: tooltip,
		};
	}

	return (
		<Tooltip>
			{comp}
			<TooltipContent
				side="right"
				align="center"
				hidden={isMobile}
				{...tooltip}
			/>
		</Tooltip>
	);
}

export {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	useSidebar,
};
