
import React, { useEffect, useState } from 'react';
import { useForm, UseFormProps, FieldValues, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { FormField, FieldProps } from './FormField';
import { Loader2, Save } from 'lucide-react';
import { debounce } from 'lodash';
import { notifySuccess, notifyInfo } from '@/lib/notification';

export interface AutosaveFormProps<TFieldValues extends FieldValues> {
  fields: (FieldProps<TFieldValues> & {
    hidden?: boolean;
  })[];
  schema?: z.ZodType<any, any>;
  onSubmit: SubmitHandler<TFieldValues>;
  defaultValues?: UseFormProps<TFieldValues>['defaultValues'];
  isLoading?: boolean;
  submitText?: string;
  autosaveDelay?: number;
  autosaveEnabled?: boolean;
  localStorageKey?: string;
  successMessage?: string;
  className?: string;
  formClassName?: string;
}

export function AutosaveForm<TFieldValues extends FieldValues>({
  fields,
  schema,
  onSubmit,
  defaultValues,
  isLoading = false,
  submitText,
  autosaveDelay = 1000,
  autosaveEnabled = true,
  localStorageKey,
  successMessage = 'Saved successfully',
  className,
  formClassName,
}: AutosaveFormProps<TFieldValues>) {
  const { t } = useTranslation();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize form with stored values or defaults
  const getInitialValues = () => {
    if (localStorageKey) {
      const storedData = localStorage.getItem(localStorageKey);
      if (storedData) {
        try {
          return JSON.parse(storedData);
        } catch (e) {
          console.error('Error parsing stored form data', e);
        }
      }
    }
    return defaultValues;
  };
  
  const form = useForm<TFieldValues>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: getInitialValues(),
  });
  
  // Set up autosave functionality
  useEffect(() => {
    if (!autosaveEnabled) return;
    
    const subscription = form.watch((data) => {
      debouncedSave(data as TFieldValues);
      
      // Save to localStorage if key is provided
      if (localStorageKey) {
        localStorage.setItem(localStorageKey, JSON.stringify(data));
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch, autosaveEnabled]);
  
  // Create debounced save function
  const debouncedSave = debounce(async (data: TFieldValues) => {
    if (form.formState.isDirty) {
      try {
        setIsSaving(true);
        await onSubmit(data);
        setLastSaved(new Date());
        notifyInfo('Draft saved automatically');
      } catch (error) {
        console.error('Autosave error:', error);
      } finally {
        setIsSaving(false);
      }
    }
  }, autosaveDelay);
  
  const handleSubmit = async (data: TFieldValues) => {
    try {
      await onSubmit(data);
      notifySuccess(successMessage);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };
  
  const formattedLastSaved = lastSaved
    ? new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      }).format(lastSaved)
    : null;

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
          </div>
          <div className="flex justify-between items-center mt-6">
            {autosaveEnabled && (
              <div className="text-sm text-muted-foreground flex items-center">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    {t('form.saving', 'Saving...')}
                  </>
                ) : formattedLastSaved ? (
                  <>
                    <Save className="mr-2 h-3 w-3" />
                    {t('form.lastSaved', 'Last saved at {{time}}', { time: formattedLastSaved })}
                  </>
                ) : (
                  t('form.autosaveEnabled', 'Autosave enabled')
                )}
              </div>
            )}
            <Button type="submit" disabled={isLoading || isSaving}>
              {(isLoading || isSaving) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitText || t('common.save')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
