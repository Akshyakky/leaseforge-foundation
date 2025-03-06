
import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface StepperStep {
  id: string;
  title: string;
}

interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  className,
}) => {
  return (
    <div className={cn("flex w-full", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isClickable = index <= currentStep + 1 && onStepClick;
        
        return (
          <React.Fragment key={step.id}>
            <div 
              className={cn(
                "flex flex-col items-center flex-1",
                isClickable ? "cursor-pointer" : "cursor-default"
              )}
              onClick={() => isClickable && onStepClick(index)}
            >
              <div 
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                  isCompleted ? "bg-primary border-primary text-primary-foreground" : 
                  isCurrent ? "border-primary text-primary" : 
                  "border-muted-foreground text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <div 
                className={cn(
                  "mt-2 text-sm font-medium text-center",
                  isCompleted || isCurrent ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.title}
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex-1 flex items-center max-w-[100px]">
                <div 
                  className={cn(
                    "h-[2px] w-full",
                    index < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                ></div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
