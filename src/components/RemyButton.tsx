import { ChefHat, ChevronRight } from "lucide-react";
import { showRemyAssistant } from "./RemyAssistant";

export default function RemyButton() {
	return (
		<button
			onClick={() => showRemyAssistant.setState(true)}
			className="flex w-full items-center justify-between rounded-lg bg-linear-to-r from-orange-500 to-red-600 px-4 py-2.5 text-white transition-opacity hover:opacity-90"
			aria-label="Open Remy Assistant"
		>
			<div className="flex items-center gap-2">
				<ChefHat size={24} />
				<span className="text-sm">Remy</span>
			</div>
			<ChevronRight className="h-4 w-4" />
		</button>
	);
}
