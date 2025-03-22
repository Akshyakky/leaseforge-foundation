import React, { useRef, useState } from "react";
import { useController, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormControl, FormDescription, FormField as UIFormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Upload, File, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  helperText?: string;
  accept?: string;
  required?: boolean;
  disabled?: boolean;
  maxSize?: number; // In bytes
  showPreview?: boolean;
  previewUrl?: string;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  form,
  name,
  label,
  description,
  placeholder = "Upload a file",
  helperText,
  accept,
  required = false,
  disabled = false,
  maxSize,
  showPreview = true,
  previewUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(previewUrl);
  const [error, setError] = useState<string | null>(null);

  const {
    field: { onChange, value, ...fieldProps },
    fieldState: { error: fieldError },
  } = useController({
    name,
    control: form.control,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) {
      onChange(undefined);
      setPreview(undefined);
      return;
    }

    // Check file size if maxSize is provided
    if (maxSize && file.size > maxSize) {
      setError(`File size exceeds the maximum allowed size (${formatFileSize(maxSize)})`);
      onChange(undefined);
      setPreview(undefined);
      return;
    }

    // Create preview for supported file types
    if (showPreview && isFilePreviewable(file)) {
      const fileUrl = URL.createObjectURL(file);
      setPreview(fileUrl);
    } else {
      setPreview(undefined);
    }

    onChange(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    onChange(undefined);
    setPreview(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isFilePreviewable = (file: File) => {
    return file.type.startsWith("image/");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIconByType = (file: File) => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("application/pdf")) return "pdf";
    if (file.type.includes("spreadsheet") || file.type.includes("excel")) return "excel";
    if (file.type.includes("document") || file.type.includes("word")) return "word";
    return "file";
  };

  return (
    <FormItem>
      {label && <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>{label}</FormLabel>}
      <FormControl>
        <div className="space-y-2">
          {/* Hidden file input */}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={accept} disabled={disabled} className="hidden" {...fieldProps} />

          {/* Custom button for file selection */}
          <div className="flex items-center">
            <Button type="button" variant="outline" onClick={handleButtonClick} disabled={disabled} className="mr-2">
              <Upload className="h-4 w-4 mr-2" />
              {placeholder}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="icon" onClick={clearFile} className="h-8 w-8" disabled={disabled}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Show selected file */}
          {value && (
            <div className="flex items-center p-2 border rounded-md bg-muted/30">
              <File className="h-5 w-5 mr-2 text-muted-foreground" />
              <div className="flex-1 truncate">
                <span className="text-sm">{value.name}</span>
                <div className="text-xs text-muted-foreground">{formatFileSize(value.size)}</div>
              </div>
            </div>
          )}

          {/* Show file preview if enabled and available */}
          {showPreview && preview && (
            <div className="mt-2 border rounded-md overflow-hidden max-w-md">
              <img src={preview} alt="Preview" className="max-w-full h-auto" />
            </div>
          )}
        </div>
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      {helperText && <p className="text-xs text-muted-foreground mt-1">{helperText}</p>}
      {(fieldError || error) && <FormMessage>{fieldError?.message || error}</FormMessage>}
    </FormItem>
  );
};

export default FileUploadField;
