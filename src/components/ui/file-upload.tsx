import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, CheckCircle, AlertCircle } from "lucide-react";

export interface FileUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onUpload?: (file: File) => void;
  onRemove?: () => void;
  uploadedFile?: File | null;
  isUploading?: boolean;
  uploadSuccess?: boolean;
  uploadError?: string | null;
  maxSize?: number; // in MB
  acceptedFileTypes?: string; // e.g. "image/*,application/pdf"
  className?: string;
}

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      className,
      onUpload,
      onRemove,
      uploadedFile,
      isUploading = false,
      uploadSuccess = false,
      uploadError = null,
      maxSize = 5, // Default 5MB
      acceptedFileTypes,
      ...props
    },
    ref
  ) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const maxSizeBytes = maxSize * 1024 * 1024;

    const handleButtonClick = () => {
      fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Check file size
      if (file.size > maxSizeBytes) {
        alert(`File size exceeds maximum limit of ${maxSize}MB`);
        return;
      }

      if (onUpload) {
        onUpload(file);
      }

      // Reset the input value so the same file can be uploaded again if needed
      e.target.value = "";
    };

    return (
      <div
        className={cn(
          "relative flex flex-col items-center border-2 border-dashed border-input rounded-md p-6 transition-colors",
          isUploading && "opacity-70",
          !uploadedFile && "hover:border-primary/50 hover:bg-background/50 cursor-pointer",
          uploadError && "border-destructive",
          uploadSuccess && "border-success",
          className
        )}
        onClick={!uploadedFile ? handleButtonClick : undefined}
      >
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept={acceptedFileTypes} disabled={isUploading} {...props} />

        {!uploadedFile && !isUploading && !uploadSuccess && !uploadError && (
          <div className="flex flex-col items-center text-center">
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="mb-1 font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mb-2">
              {acceptedFileTypes ? `Supported formats: ${acceptedFileTypes.replace(/\./g, "").toUpperCase()}` : "All file formats supported"}
            </p>
            <p className="text-xs text-muted-foreground">Max file size: {maxSize}MB</p>
          </div>
        )}

        {isUploading && (
          <div className="flex flex-col items-center">
            <div className="animate-pulse">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
          </div>
        )}

        {uploadedFile && !isUploading && !uploadError && (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <div className="text-sm">
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="ml-auto p-1 h-auto"
              onClick={(e) => {
                e.stopPropagation();
                if (onRemove) onRemove();
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
          </div>
        )}

        {uploadSuccess && !uploadedFile && (
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="h-6 w-6" />
            <span>File uploaded successfully</span>
          </div>
        )}

        {uploadError && (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-6 w-6" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";

export { FileUpload };
