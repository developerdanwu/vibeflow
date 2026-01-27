import { Store } from "@tanstack/store";
import { ChefHat, Croissant, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import type { ConferenceChatMessages } from "@/lib/conference-ai-hook";
import { useConferenceChat } from "@/lib/conference-ai-hook";

function Messages({ messages }: { messages: ConferenceChatMessages }) {
	const messagesContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (messagesContainerRef.current) {
			messagesContainerRef.current.scrollTop =
				messagesContainerRef.current.scrollHeight;
		}
	}, [messages]);

	if (!messages.length) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-cream/60 text-sm">
				<div className="relative mb-4">
					<ChefHat className="h-12 w-12 animate-pulse text-copper/60" />
					<Croissant className="absolute -right-1 -bottom-1 h-6 w-6 text-gold/60" />
				</div>
				<p className="text-center font-display font-medium text-cream/80 text-lg">
					Bonjour! I'm Remy 👨‍🍳
				</p>
				<p className="mt-2 max-w-[220px] text-center text-cream/40 text-xs">
					Your culinary guide to Haute Pâtisserie 2026. Ask about speakers,
					sessions, or pastry techniques!
				</p>
			</div>
		);
	}

	return (
		<div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
			{messages.map(({ id, role, parts }) => (
				<div
					key={id}
					className={`py-3 ${
						role === "assistant"
							? "bg-gradient-to-r from-copper/5 via-gold/5 to-copper/5"
							: "bg-transparent"
					}`}
				>
					{parts.map((part, index) => {
						if (part.type === "text" && part.content) {
							return (
								<div key={index} className="flex items-start gap-3 px-4">
									{role === "assistant" ? (
										<div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-copper via-copper-dark to-gold font-bold text-charcoal text-xs shadow-copper/20 shadow-lg">
											👨‍🍳
										</div>
									) : (
										<div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border/50 bg-charcoal-light font-medium text-cream text-xs">
											You
										</div>
									)}
									<div className="prose dark:prose-invert prose-sm min-w-0 max-w-none flex-1 prose-headings:text-cream prose-p:text-cream prose-strong:text-gold text-cream">
										<Streamdown>{part.content}</Streamdown>
									</div>
								</div>
							);
						}
						return null;
					})}
				</div>
			))}
		</div>
	);
}

interface RemyAssistantProps {
	speakerSlug?: string;
	talkSlug?: string;
	contextTitle?: string;
}

// Export store for header control
export const showRemyAssistant = new Store(false);

export default function RemyAssistant({
	speakerSlug,
	talkSlug,
	contextTitle,
}: RemyAssistantProps) {
	const [isOpen, setIsOpen] = useState(false);
	const { messages, sendMessage, isLoading } = useConferenceChat(
		speakerSlug,
		talkSlug,
	);
	const [input, setInput] = useState("");

	// Sync with store for header control
	useEffect(() => {
		return showRemyAssistant.subscribe(() => {
			setIsOpen(showRemyAssistant.state);
		});
	}, []);

	const handleToggle = () => {
		const newState = !isOpen;
		setIsOpen(newState);
		showRemyAssistant.setState(() => newState);
	};

	const handleSend = () => {
		if (input.trim()) {
			sendMessage(input);
			setInput("");
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed top-36 right-4 z-[100] flex h-[520px] w-[400px] flex-col overflow-hidden rounded-2xl border border-copper/20 bg-gradient-to-b from-charcoal/98 via-charcoal/95 to-charcoal-light/98 shadow-2xl backdrop-blur-xl">
			{/* Decorative top gradient */}
			<div className="pointer-events-none absolute top-0 right-0 left-0 h-32 bg-gradient-to-b from-copper/10 via-gold/5 to-transparent" />

			{/* Header */}
			<div className="relative flex items-center justify-between border-copper/10 border-b p-4">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 rotate-3 items-center justify-center rounded-xl bg-gradient-to-br from-copper via-copper-dark to-gold shadow-copper/30 shadow-lg transition-transform hover:rotate-0">
						<span className="text-lg">👨‍🍳</span>
					</div>
					<div>
						<h3 className="font-bold font-display text-base text-cream tracking-tight">
							Remy
						</h3>
						{contextTitle && (
							<p className="max-w-[220px] truncate text-copper/70 text-xs">
								🥐 {contextTitle}
							</p>
						)}
					</div>
				</div>
				<button
					onClick={handleToggle}
					className="rounded-xl p-2 text-cream/50 transition-colors hover:bg-white/5 hover:text-cream"
				>
					<X className="h-5 w-5" />
				</button>
			</div>

			{/* Messages */}
			<Messages messages={messages} />

			{/* Loading indicator */}
			{isLoading && (
				<div className="border-copper/10 border-t px-4 py-3">
					<div className="flex items-center gap-2 text-copper/80 text-xs">
						<div className="flex gap-1">
							<span className="h-2 w-2 animate-bounce rounded-full bg-copper [animation-delay:-0.3s]"></span>
							<span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:-0.15s]"></span>
							<span className="h-2 w-2 animate-bounce rounded-full bg-copper-light"></span>
						</div>
						<span className="font-medium">Crafting a response...</span>
					</div>
				</div>
			)}

			{/* Input */}
			<div className="relative border-copper/10 border-t bg-charcoal/50 p-4">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleSend();
					}}
				>
					<div className="relative">
						<textarea
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="Ask about speakers, sessions, techniques..."
							disabled={isLoading}
							className="w-full resize-none overflow-hidden rounded-xl border border-copper/20 bg-charcoal-light/50 py-3 pr-12 pl-4 text-cream text-sm placeholder-cream/30 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-copper/40 disabled:opacity-50"
							rows={1}
							style={{ minHeight: "48px", maxHeight: "100px" }}
							onInput={(e) => {
								const target = e.target as HTMLTextAreaElement;
								target.style.height = "auto";
								target.style.height = Math.min(target.scrollHeight, 100) + "px";
							}}
							onKeyDown={(e) => {
								if (
									e.key === "Enter" &&
									!e.shiftKey &&
									input.trim() &&
									!isLoading
								) {
									e.preventDefault();
									handleSend();
								}
							}}
						/>
						<button
							type="submit"
							disabled={!input.trim() || isLoading}
							className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg bg-gradient-to-r from-copper to-copper-dark p-2 text-charcoal transition-all hover:shadow-copper/20 hover:shadow-lg disabled:bg-gray-600 disabled:from-gray-600 disabled:to-gray-600 disabled:opacity-30"
						>
							<Send className="h-4 w-4" />
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
