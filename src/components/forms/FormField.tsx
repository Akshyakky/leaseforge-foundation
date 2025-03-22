import React from "react";
import { useTranslation } from "react-i18next";
import { FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField as ShadcnFormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { UseFormReturn, FieldValues, Path, FieldPathValue } from "react-hook-form";

export interface SelectOption {
  label: string;
  value: string;
}

export interface FileUploadConfig {
  maxSize?: number;
  acceptedFileTypes?: string;
  onUpload?: (file: File) => void;
  onRemove?: () => void;
  isUploading?: boolean;
  uploadSuccess?: boolean;
  uploadError?: string | null;
}

export interface FieldProps<TFieldValues extends FieldValues = FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> {
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  defaultValue?: FieldPathValue<TFieldValues, TName>;
  type?: string;
  autoComplete?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  options?: SelectOption[];
  fileConfig?: FileUploadConfig;
  render?: (props: { field: any; fieldState: any }) => React.ReactNode;
}

export function FormField<TFieldValues extends FieldValues = FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  name,
  label,
  description,
  placeholder,
  defaultValue,
  type = "text",
  autoComplete,
  className,
  disabled,
  required,
  options,
  fileConfig,
  render,
  form,
}: FieldProps<TFieldValues, TName> & { form: UseFormReturn<TFieldValues> }) {
  const { t } = useTranslation();

  return (
    <ShadcnFormField
      control={form.control}
      name={name}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
          )}
          {render ? (
            render({ field, fieldState })
          ) : (
            <FormControl>
              {type === "textarea" ? (
                <Textarea {...field} placeholder={placeholder} disabled={disabled} className={fieldState.error ? "border-destructive" : ""} />
              ) : type === "select" && options ? (
                <Select disabled={disabled} onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <SelectTrigger className={fieldState.error ? "border-destructive" : ""}>
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : type === "file" ? (
                <FileUpload
                  uploadedFile={field.value}
                  onUpload={(file) => {
                    field.onChange(file);
                    if (fileConfig?.onUpload) fileConfig.onUpload(file);
                  }}
                  onRemove={() => {
                    field.onChange(null);
                    if (fileConfig?.onRemove) fileConfig.onRemove();
                  }}
                  isUploading={fileConfig?.isUploading}
                  uploadSuccess={fileConfig?.uploadSuccess}
                  uploadError={fileConfig?.uploadError}
                  maxSize={fileConfig?.maxSize}
                  acceptedFileTypes={fileConfig?.acceptedFileTypes}
                  disabled={disabled}
                  className={fieldState.error ? "border-destructive" : ""}
                />
              ) : (
                <Input {...field} type={type} placeholder={placeholder} autoComplete={autoComplete} disabled={disabled} className={fieldState.error ? "border-destructive" : ""} />
              )}
            </FormControl>
          )}
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
