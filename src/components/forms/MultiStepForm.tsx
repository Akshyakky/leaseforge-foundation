
import React, { useState } from 'react';
import { useForm, FieldValues, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { FormField, FieldProps } from './FormField';
import { Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Stepper, StepperStep } from './Stepper';
import { notifySuccess, notifyError } from '@/lib/notification';

export interface FormStep<TFieldValues extends FieldValues> {
  id: string;
  title: string;
  description?: string;
  fields: (FieldProps<TFieldValues> & {
    hidden?: boolean;
  })[];
  validationSchema?: z.ZodType<any, any>;
}

export interface MultiStepFormProps<TFieldValues extends FieldValues> {
  steps: FormStep<TFieldValues>[];
  defaultValues?: Record<string, any>;
  onSubmit: SubmitHandler<TFieldValues>;
  isLoading?: boolean;
  successMessage?: string;
  errorMessage?: string;
  submitButtonText?: string;
  className?: string;
}

export function MultiStepForm<TFieldValues extends FieldValues>({
  steps,
  defaultValues = {},
  onSubmit,
  isLoading = false,
  successMessage = 'Form submitted successfully',
  errorMessage = 'Failed to submit form',
  submitButtonText = 'Submit',
  className,
}: MultiStepFormProps<TFieldValues>) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>(defaultValues);
  
  // Combine all validation schemas
  const currentSchema = steps[currentStep]?.validationSchema;
  
  const form = useForm<TFieldValues>({
    resolver: currentSchema ? zodResolver(currentSchema) : undefined,
    defaultValues: formData as any,
  });
  
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  
  const handleNext = async (data: TFieldValues) => {
    // Merge the new data with the existing form data
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);
    
    if (isLastStep) {
      try {
        await onSubmit(updatedFormData as TFieldValues);
        notifySuccess(successMessage);
        // Reset form after successful submission
        form.reset();
        setFormData(defaultValues);
        setCurrentStep(0);
      } catch (error) {
        console.error('Form submission error:', error);
        notifyError(errorMessage);
      }
    } else {
      // Move to next step
      setCurrentStep(current => current + 1);
      // Reset validation state for next step
      setTimeout(() => {
        form.reset(updatedFormData as any);
      }, 0);
    }
  };
  
  const handlePrevious = () => {
    setCurrentStep(current => Math.max(0, current - 1));
  };
  
  const handleStepClick = (stepIndex: number) => {
    // Only allow navigating to completed steps or the current step + 1
    if (stepIndex <= currentStep + 1) {
      // Save current step data before navigating
      const currentData = form.getValues();
      setFormData({...formData, ...currentData});
      setCurrentStep(stepIndex);
    }
  };
  
  const currentStepData = steps[currentStep];
  
  if (!currentStepData) {
    return null;
  }
  
  return (
    <div className={className}>
      <Stepper 
        currentStep={currentStep} 
        steps={steps.map(step => ({ id: step.id, title: step.title }))}
        onStepClick={handleStepClick}
      />
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
          {currentStepData.description && (
            <CardDescription>{currentStepData.description}</CardDescription>
          )}
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleNext)}>
            <CardContent className="space-y-4">
              {currentStepData.fields
                .filter(field => !field.hidden)
                .map((field) => (
                  <FormField 
                    key={String(field.name)}
                    form={form}
                    {...field}
                  />
                ))}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstStep || isLoading}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t('common.previous', 'Previous')}
              </Button>
              
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLastStep ? submitButtonText : (
                  <>
                    {t('common.next', 'Next')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
