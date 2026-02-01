"use client";

import { useFieldContext, useFormContext } from "@/components/ui/form";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import ColorPickerCompact from "@/components/ui/color-picker-compact";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SingleDayPicker } from "@/components/ui/single-day-picker";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TimeInput } from "@/components/ui/time-input";
import type { TimeValue } from "react-aria-components";
import type { Time } from "@internationalized/date";

// --- Field components (use useFieldContext) ---

export function TextField({
	label,
	placeholder,
	description,
}: {
	label: string;
	placeholder?: string;
	description?: string;
}) {
	const field = useFieldContext<string>();
	const isInvalid =
		field.state.meta.isTouched && !field.state.meta.isValid;
	return (
		<Field data-invalid={isInvalid}>
			<FieldLabel htmlFor={field.name}>{label}</FieldLabel>
			<Input
				id={field.name}
				name={field.name}
				value={field.state.value}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				aria-invalid={isInvalid}
				placeholder={placeholder}
				autoComplete="off"
			/>
			{description && <FieldDescription>{description}</FieldDescription>}
			{isInvalid && <FieldError errors={field.state.meta.errors} />}
		</Field>
	);
}

export function TextareaField({
	label,
	placeholder,
	description,
	rows,
}: {
	label: string;
	placeholder?: string;
	description?: string;
	rows?: number;
}) {
	const field = useFieldContext<string>();
	const isInvalid =
		field.state.meta.isTouched && !field.state.meta.isValid;
	return (
		<Field data-invalid={isInvalid}>
			<FieldLabel htmlFor={`${field.name}-textarea`}>{label}</FieldLabel>
			<Textarea
				id={`${field.name}-textarea`}
				name={field.name}
				value={field.state.value ?? ""}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				aria-invalid={isInvalid}
				placeholder={placeholder}
				rows={rows}
			/>
			{description && <FieldDescription>{description}</FieldDescription>}
			{isInvalid && <FieldError errors={field.state.meta.errors} />}
		</Field>
	);
}

export function SelectField({
	label,
	placeholder,
	options,
	children,
}: {
	label: string;
	placeholder?: string;
	options?: { value: string; label: React.ReactNode }[];
	children?: React.ReactNode;
}) {
	const field = useFieldContext<string>();
	const isInvalid =
		field.state.meta.isTouched && !field.state.meta.isValid;
	return (
		<Field data-invalid={isInvalid}>
			<FieldLabel htmlFor={`${field.name}-select`}>{label}</FieldLabel>
			<Select
				value={field.state.value}
				onValueChange={(value) => field.handleChange(value)}
			>
				<SelectTrigger id={`${field.name}-select`} aria-invalid={isInvalid}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent position="item-aligned">
					{options?.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
					{children}
				</SelectContent>
			</Select>
			{isInvalid && <FieldError errors={field.state.meta.errors} />}
		</Field>
	);
}

export function SwitchField({
	label,
	description,
}: {
	label: string;
	description?: string;
}) {
	const field = useFieldContext<boolean>();
	const isInvalid =
		field.state.meta.isTouched && !field.state.meta.isValid;
	return (
		<Field orientation="horizontal" data-invalid={isInvalid}>
			<div className="flex flex-1 flex-col gap-0.5">
				<FieldLabel htmlFor={`${field.name}-switch`}>{label}</FieldLabel>
				{description && (
					<FieldDescription>{description}</FieldDescription>
				)}
				{isInvalid && <FieldError errors={field.state.meta.errors} />}
			</div>
			<Switch
				id={`${field.name}-switch`}
				name={field.name}
				checked={field.state.value}
				onCheckedChange={field.handleChange}
				aria-invalid={isInvalid}
			/>
		</Field>
	);
}

export function DateField({
	label,
	placeholder,
}: {
	label: string;
	placeholder?: string;
}) {
	const field = useFieldContext<Date | undefined>();
	const isInvalid =
		field.state.meta.isTouched && !field.state.meta.isValid;
	return (
		<Field data-invalid={isInvalid}>
			<FieldLabel htmlFor={`${field.name}-picker`}>{label}</FieldLabel>
			<SingleDayPicker
				id={`${field.name}-picker`}
				value={field.state.value}
				onSelect={(date) => field.handleChange(date)}
				placeholder={placeholder ?? "Select a date"}
				data-invalid={isInvalid}
			/>
			{isInvalid && <FieldError errors={field.state.meta.errors} />}
		</Field>
	);
}

export function TimeField({ label }: { label: string }) {
	const field = useFieldContext<Time | TimeValue | undefined>();
	const isInvalid =
		field.state.meta.isTouched && !field.state.meta.isValid;
	const value = field.state.value;
	return (
		<Field data-invalid={isInvalid}>
			<FieldLabel htmlFor={`${field.name}-input`}>{label}</FieldLabel>
			<TimeInput
				id={`${field.name}-input`}
				value={value}
				onChange={(v) => {
					if (v != null) field.handleChange(v as Time);
				}}
				hourCycle={12}
				data-invalid={isInvalid}
			/>
			{isInvalid && <FieldError errors={field.state.meta.errors} />}
		</Field>
	);
}

export function ColorField({
	label,
	defaultHex = "#3B82F6",
}: {
	label: string;
	defaultHex?: string;
}) {
	const field = useFieldContext<string>();
	const isInvalid =
		field.state.meta.isTouched && !field.state.meta.isValid;
	return (
		<Field data-invalid={isInvalid}>
			<FieldLabel htmlFor={`${field.name}-color`}>{label}</FieldLabel>
			<ColorPickerCompact
				value={field.state.value ?? defaultHex}
				onChange={field.handleChange}
			/>
			{isInvalid && <FieldError errors={field.state.meta.errors} />}
		</Field>
	);
}

// --- Form component (use useFormContext) ---

export function SubmitButton({
	label,
	variant,
	className,
}: {
	label: string;
	variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
	className?: string;
}) {
	const form = useFormContext();
	return (
		<form.Subscribe selector={(state) => state.isSubmitting}>
			{(isSubmitting) => (
				<Button
					type="submit"
					disabled={isSubmitting}
					variant={variant}
					className={className}
				>
					{isSubmitting ? "Submitting..." : label}
				</Button>
			)}
		</form.Subscribe>
	);
}
