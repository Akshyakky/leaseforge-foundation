import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DatePickerProps {
  value?: Date;
  onChange?: (date?: Date) => void;
  placeholder?: string;
  disabled?: boolean | ((date: Date) => boolean);
  className?: string;
  format?: string;
}

export function DatePicker({ value, onChange, placeholder = "Select date", disabled = false, className, format: dateFormat = "PPP" }: DatePickerProps) {
  // Handle the different types of disabled
  const buttonDisabled = typeof disabled === "boolean" ? disabled : false;
  const dateDisabled = typeof disabled === "function" ? disabled : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground", className)} disabled={buttonDisabled}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, dateFormat) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} disabled={dateDisabled} initialFocus className="p-3" />
      </PopoverContent>
    </Popover>
  );
}
