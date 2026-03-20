import React, { createContext, useContext, useMemo } from 'react';
import { Text, View } from 'react-native';
import { cn } from '@/utils';
import { FieldValues, FieldPath, UseFormReturn, FieldError } from '@/hooks/useForm';

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  control: UseFormReturn<TFieldValues>['control'];
};

type FormItemContextValue = {
  id: string;
};

type ControllerRenderProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  value: any;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  ref: (instance: any) => void;
  name: TName;
};

type ControllerFieldState = {
  invalid: boolean;
  isTouched: boolean;
  isDirty: boolean;
  error?: FieldError;
};

const FormFieldContext = createContext<FormFieldContextValue>({} as FormFieldContextValue);
const FormItemContext = createContext<FormItemContextValue>({} as FormItemContextValue);

const useFormField = () => {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;
  const error = fieldContext.control._formState.errors[fieldContext.name];

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    error,
  };
};

export type FormProps<TFieldValues extends FieldValues = FieldValues> = {
  children: React.ReactNode;
  className?: string;
} & Omit<UseFormReturn<TFieldValues>, 'register' | 'handleSubmit' | 'formState'>;

export function Form<TFieldValues extends FieldValues = FieldValues>({
  children,
  className,
  ...formMethods
}: FormProps<TFieldValues>) {
  return <View className={cn('w-full', className)}>{children}</View>;
}

export type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  control: UseFormReturn<TFieldValues>['control'];
  name: TName;
  render: (props: {
    field: ControllerRenderProps<TFieldValues, TName>;
    fieldState: ControllerFieldState;
  }) => React.ReactElement;
};

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ control, name, render }: FormFieldProps<TFieldValues, TName>) {
  const fieldRegistration = control.register(name);
  const error = control._formState.errors[name];
  const isTouched = control._formState.touchedFields[name] ?? false;
  const isDirty = control._formState.dirtyFields[name] ?? false;

  const field: ControllerRenderProps<TFieldValues, TName> = {
    ...fieldRegistration,
    name,
  };

  const fieldState: ControllerFieldState = {
    invalid: !!error,
    isTouched,
    isDirty,
    error,
  };

  return (
    <FormFieldContext.Provider value={{ name, control }}>
      {render({ field, fieldState })}
    </FormFieldContext.Provider>
  );
}

export type FormItemProps = {
  children: React.ReactNode;
  className?: string;
};

export const FormItem = React.forwardRef<View, FormItemProps>(({ className, children }, ref) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <View ref={ref} className={cn('mb-4 w-full', className)}>
        {children}
      </View>
    </FormItemContext.Provider>
  );
});

FormItem.displayName = 'FormItem';

export type FormLabelProps = {
  children: React.ReactNode;
  className?: string;
  required?: boolean;
};

export const FormLabel = React.forwardRef<Text, FormLabelProps>(
  ({ className, children, required }, ref) => {
    const { formItemId } = useFormField();

    return (
      <Text
        ref={ref}
        nativeID={formItemId}
        className={cn('mb-1.5 font-sans-medium text-base text-foreground', className)}>
        {children}
        {required && <Text className="ml-1 text-error">*</Text>}
      </Text>
    );
  }
);

FormLabel.displayName = 'FormLabel';

export type FormControlProps = {
  children: React.ReactElement;
};

export const FormControl = React.forwardRef<View, FormControlProps>(({ children }, ref) => {
  const { formItemId, formDescriptionId, formMessageId } = useFormField();

  return React.cloneElement(children, {
    ...(children.props as Record<string, any>),
    nativeID: formItemId,
    'aria-describedby': formDescriptionId,
    'aria-invalid': formMessageId,
  } as any);
});

FormControl.displayName = 'FormControl';

export type FormDescriptionProps = {
  children: React.ReactNode;
  className?: string;
};

export const FormDescription = React.forwardRef<Text, FormDescriptionProps>(
  ({ className, children }, ref) => {
    const { formDescriptionId } = useFormField();

    return (
      <Text
        ref={ref}
        nativeID={formDescriptionId}
        className={cn('mt-1.5 text-sm text-neutrals100', className)}>
        {children}
      </Text>
    );
  }
);

FormDescription.displayName = 'FormDescription';

export type FormMessageProps = {
  children?: React.ReactNode;
  className?: string;
};

export const FormMessage = React.forwardRef<Text, FormMessageProps>(
  ({ className, children }, ref) => {
    const { formMessageId, error } = useFormField();

    const body = error?.message ?? children;

    if (!body) {
      return null;
    }

    return (
      <Text
        ref={ref}
        nativeID={formMessageId}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className={cn('mt-1.5 font-sans-medium text-sm text-error', className)}>
        {body}
      </Text>
    );
  }
);

FormMessage.displayName = 'FormMessage';

export type FormSubmitButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};
