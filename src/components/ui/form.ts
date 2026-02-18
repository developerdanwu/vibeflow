import {
	ColorField,
	DateField,
	SelectField,
	SubmitButton,
	SwitchField,
	TextareaField,
	TextField,
	TimeField,
} from "@/components/ui/form-components";
import {
	createFormHook,
	createFormHookContexts,
} from "@tanstack/react-form";

const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

export { useFieldContext, useFormContext };

export const { useAppForm, withForm, withFieldGroup, useTypedAppFormContext } =
	createFormHook({
		fieldContext,
		formContext,
		fieldComponents: {
			ColorField,
			DateField,
			SelectField,
			SwitchField,
			TextareaField,
			TextField,
			TimeField,
		},
		formComponents: {
			SubmitButton,
		},
	});
