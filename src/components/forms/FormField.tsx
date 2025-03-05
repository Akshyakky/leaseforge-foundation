
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField as ShadcnFormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn, FieldValues, Path, FieldPathValue } from 'react-hook-form';

export interface FieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
> {
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  defaultValue?: FieldPathValue<TFieldValues, TName>;
  type?: string;
  autoComplete?: string;
  className?: string;
  render?: (props: { field: any; fieldState: any }) => React.ReactNode;
}

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
>({
  name,
  label,
  description,
  placeholder,
  defaultValue,
  type = 'text',
  autoComplete,
  className,
  render,
  form
}: FieldProps<TFieldValues, TName> & { form: UseFormReturn<TFieldValues> }) {
  const { t } = useTranslation();

  return (
    <ShadcnFormField
      control={form.control}
      name={name}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          {render ? (
            render({ field, fieldState })
          ) : (
            <FormControl>
              <Input
                {...field}
                type={type}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className={fieldState.error ? "border-destructive" : ""}
              />
            </FormControl>
          )}
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
