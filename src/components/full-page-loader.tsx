import { Loader2 } from "lucide-react";

export function FullPageLoader() {
	return (
		<div className="flex h-screen w-screen items-center justify-center">
			<Loader2 className="size-8 animate-spin text-muted-foreground" />
		</div>
	);
}
