"use client";

import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cva, type VariantProps } from "class-variance-authority";
import {
	Bold,
	CheckSquare,
	Heading1,
	Heading2,
	Italic,
	List,
	ListOrdered,
	RemoveFormatting,
	Strikethrough,
	Underline as UnderlineIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const richTextEditorVariants = cva(
	"field-sizing-content prose prose-sm flex min-h-16 w-full max-w-none cursor-text rounded-lg border border-input bg-transparent text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:disabled:bg-input/80 [&_.ProseMirror]:min-h-[1.5rem] [&_.ProseMirror]:cursor-text [&_.ProseMirror]:break-words [&_.ProseMirror]:outline-none [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_em]:italic [&_.ProseMirror_ol]:ml-4 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_strong]:font-semibold [&_.ProseMirror_ul]:ml-4 [&_.ProseMirror_ul]:list-disc",
	{
		variants: {
			variant: {
				default: "",
				ghost:
					"border-0 bg-transparent focus-visible:border-0 focus-visible:bg-accent/50 focus-visible:ring-0 dark:bg-transparent",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

interface RichTextEditorProps
	extends Omit<
		React.ComponentPropsWithoutRef<"div">,
		"onChange" | "onBlur" | "value"
	> {
	value?: string; // HTML string
	onChange?: (value: string) => void;
	onBlur?: () => void;
	placeholder?: string;
	variant?: VariantProps<typeof richTextEditorVariants>["variant"];
	disabled?: boolean;
	"aria-invalid"?: boolean;
	id?: string;
	name?: string;
}

function RichTextEditor({
	value = "",
	onChange,
	onBlur,
	placeholder = "",
	variant = "default",
	className,
	disabled = false,
	"aria-invalid": ariaInvalid,
	id,
	name,
	...props
}: RichTextEditorProps) {
	const editorWrapperRef = useRef<HTMLDivElement>(null);
	const [editorState, setEditorState] = useState({
		bold: false,
		italic: false,
		underline: false,
		strike: false,
		heading1: false,
		heading2: false,
		bulletList: false,
		orderedList: false,
		taskList: false,
	});

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				// Disable hard breaks since we want proper wrapping
				hardBreak: false,
			}),
			Underline,
			TaskList,
			TaskItem.configure({
				nested: true,
			}),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: "text-primary underline",
				},
			}),
			Placeholder.configure({
				placeholder,
			}),
		],
		content: value,
		editable: !disabled,
		onUpdate: ({ editor }) => {
			const html = editor.getHTML();
			onChange?.(html);
			// Update toolbar state
			setEditorState({
				bold: editor.isActive("bold"),
				italic: editor.isActive("italic"),
				underline: editor.isActive("underline"),
				strike: editor.isActive("strike"),
				heading1: editor.isActive("heading", { level: 1 }),
				heading2: editor.isActive("heading", { level: 2 }),
				bulletList: editor.isActive("bulletList"),
				orderedList: editor.isActive("orderedList"),
				taskList: editor.isActive("taskList"),
			});
		},
		onSelectionUpdate: ({ editor }) => {
			// Update toolbar state on selection change
			setEditorState({
				bold: editor.isActive("bold"),
				italic: editor.isActive("italic"),
				underline: editor.isActive("underline"),
				strike: editor.isActive("strike"),
				heading1: editor.isActive("heading", { level: 1 }),
				heading2: editor.isActive("heading", { level: 2 }),
				bulletList: editor.isActive("bulletList"),
				orderedList: editor.isActive("orderedList"),
				taskList: editor.isActive("taskList"),
			});
		},
		onBlur: () => {
			onBlur?.();
		},
		editorProps: {
			attributes: {
				class: "outline-none",
			},
		},
	});

	// Update editor content when value prop changes (but not from internal updates)
	useEffect(() => {
		if (editor && value !== editor.getHTML()) {
			editor.commands.setContent(value, { emitUpdate: false });
		}
	}, [value, editor]);

	// Update placeholder when prop changes
	useEffect(() => {
		if (editor) {
			const extension = editor.extensionManager.extensions.find(
				(ext) => ext.name === "placeholder",
			);
			if (extension) {
				extension.options.placeholder = placeholder;
			}
		}
	}, [placeholder, editor]);

	// Initialize editor state
	useEffect(() => {
		if (editor) {
			setEditorState({
				bold: editor.isActive("bold"),
				italic: editor.isActive("italic"),
				underline: editor.isActive("underline"),
				strike: editor.isActive("strike"),
				heading1: editor.isActive("heading", { level: 1 }),
				heading2: editor.isActive("heading", { level: 2 }),
				bulletList: editor.isActive("bulletList"),
				orderedList: editor.isActive("orderedList"),
				taskList: editor.isActive("taskList"),
			});
		}
	}, [editor]);

	if (!editor) {
		return null;
	}

	return (
		<div
			data-slot="rich-text-editor"
			className={cn("flex flex-col", className)}
			aria-invalid={ariaInvalid}
			id={id}
			{...props}
		>
			{/* Toolbar */}

			{/* Editor Content */}
			<div
				ref={editorWrapperRef}
				className={cn(richTextEditorVariants({ variant }), "flex-1")}
				onClick={(e) => {
					// Focus editor when clicking on empty space
					// TipTap will handle cursor placement automatically
					if (editor && !editor.isFocused) {
						editor.commands.focus("end");
					}
				}}
			>
				<EditorContent className="px-2 py-1.5" editor={editor} />
			</div>
			<div className="flex items-center gap-1 px-2 py-1.5">
				<Toggle
					pressed={editorState.bold}
					onPressedChange={() => editor?.chain().focus().toggleBold().run()}
					size="xs"
					aria-label="Bold"
				>
					<Bold />
				</Toggle>
				<Toggle
					pressed={editorState.italic}
					onPressedChange={() => editor?.chain().focus().toggleItalic().run()}
					size="xs"
					aria-label="Italic"
				>
					<Italic />
				</Toggle>
				<Toggle
					pressed={editorState.underline}
					onPressedChange={() =>
						editor?.chain().focus().toggleUnderline().run()
					}
					size="xs"
					aria-label="Underline"
				>
					<UnderlineIcon />
				</Toggle>
				<Toggle
					pressed={editorState.strike}
					onPressedChange={() => editor?.chain().focus().toggleStrike().run()}
					size="xs"
					aria-label="Strikethrough"
				>
					<Strikethrough />
				</Toggle>
				<Separator orientation="vertical" />
				<Toggle
					pressed={editorState.heading1}
					onPressedChange={() =>
						editor?.chain().focus().toggleHeading({ level: 1 }).run()
					}
					size="xs"
					aria-label="Heading 1"
				>
					<Heading1 />
				</Toggle>
				<Toggle
					pressed={editorState.heading2}
					onPressedChange={() =>
						editor?.chain().focus().toggleHeading({ level: 2 }).run()
					}
					size="xs"
					aria-label="Heading 2"
				>
					<Heading2 />
				</Toggle>
				<Separator orientation="vertical" />
				<Toggle
					pressed={editorState.bulletList}
					onPressedChange={() =>
						editor?.chain().focus().toggleBulletList().run()
					}
					size="xs"
					aria-label="Bullet List"
				>
					<List />
				</Toggle>
				<Toggle
					pressed={editorState.orderedList}
					onPressedChange={() =>
						editor?.chain().focus().toggleOrderedList().run()
					}
					size="xs"
					aria-label="Numbered List"
				>
					<ListOrdered />
				</Toggle>
				<Toggle
					pressed={editorState.taskList}
					onPressedChange={() => editor?.chain().focus().toggleTaskList().run()}
					size="xs"
					aria-label="Task List"
				>
					<CheckSquare />
				</Toggle>
				<Separator orientation="vertical" />
				<Toggle
					pressed={false}
					onPressedChange={() =>
						editor?.chain().focus().clearNodes().unsetAllMarks().run()
					}
					size="xs"
					aria-label="Clear Formatting"
				>
					<RemoveFormatting />
				</Toggle>
			</div>
		</div>
	);
}

export { RichTextEditor };
