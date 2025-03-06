
import React from 'react';
import { useForm, UseFormProps, FieldValues, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { FormField, FieldProps } from './FormField';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface FormBuilderProps<TFieldValues extends FieldValues> {
  fields: (FieldProps<TFieldValues> & {
    hidden?: boolean;
  })[];
  schema?: z.ZodType<any, any>;
  onSubmit: SubmitHandler<TFieldValues>;
  defaultValues?: UseFormProps<TFieldValues>['defaultValues'];
  isLoading?: boolean;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  successMessage?: string;
  errorMessage?: string;
  className?: string;
  formClassName?: string;
  optimistic?: boolean;
  children?: React.ReactNode;
}

export function FormBuilder<TFieldValues extends FieldValues>({
  fields,
  schema,
  onSubmit,
  defaultValues,
  isLoading = false,
  submitText,
  cancelText,
  onCancel,
  successMessage,
  errorMessage,
  className,
  formClassName,
  optimistic = false,
  children,
}: FormBuilderProps<TFieldValues>) {
  const { t } = useTranslation();
  const form = useForm<TFieldValues>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
  });
  
  const handleSubmit = async (data: TFieldValues) => {
    try {
      // If optimistic is true, show success message before calling onSubmit
      if (optimistic && successMessage) {
        toast.success(successMessage);
      }
      
      await onSubmit(data);
      
      // If not optimistic, show success message after onSubmit succeeds
      if (!optimistic && successMessage) {
        toast.success(successMessage);
      }
      
      // Fixed: Use reset with an object that matches TFieldValues instead of AsyncDefaultValues
      if (!optimistic) {
        // We need to use as TFieldValues to avoid the type error
        // since defaultValues could be a function that returns a Promise
        form.reset(defaultValues as TFieldValues);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(errorMessage || t('common.error'));
    }
  };

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className={formClassName}>
          <div className="space-y-4">
            {fields
              .filter(field => !field.hidden)
              .map((field) => (
                <FormField
                  key={String(field.name)}
                  form={form}
                  {...field}
                />
              ))}
            {children}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                {cancelText || t('common.cancel')}
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitText || t('common.save')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
