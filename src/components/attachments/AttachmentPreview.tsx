import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { FileTypeIcon } from "./FileTypeIcon";

interface AttachmentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl?: string;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  uploadDate?: Date | string;
  uploadedBy?: string;
  description?: string;
  documentType?: string;
  issueDate?: Date | string;
  expiryDate?: Date | string;
  // NEW: Add a prop to control whether to render the dialog wrapper
  showDialogWrapper?: boolean;
}

export const AttachmentPreview = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType,
  fileSize,
  uploadDate,
  uploadedBy,
  description,
  documentType,
  issueDate,
  expiryDate,
  showDialogWrapper = true, // Default to true for backward compatibility
}: AttachmentPreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);

  // Determine file extension
  const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";

  // Determine if it's an image type
  const isImage = fileType?.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(fileExtension);

  // Determine if it's a PDF
  const isPdf = fileType === "application/pdf" || fileExtension === "pdf";

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
  };

  // Format file size to readable format
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown size";

    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Format date for display
  const formatDate = (date?: Date | string): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Extract the main content into a reusable component
  const PreviewContent = () => (
    <>
      <div className="flex flex-1 gap-4 h-[70vh]">
        {/* Main preview panel */}
        <div className="flex-1 overflow-auto min-h-[400px] flex items-center justify-center bg-gray-50 rounded-md relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {fileUrl ? (
            <>
              {isImage && <img src={fileUrl} alt={fileName} className="max-w-full max-h-[60vh] object-contain" onLoad={handleLoad} onError={handleError} />}

              {isPdf && <iframe src={`${fileUrl}#toolbar=0`} className="w-full h-full" onLoad={handleLoad} onError={handleError} title={fileName} />}

              {!isImage && !isPdf && (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <FileTypeIcon fileName={fileName} fileType={fileType} size={64} className="text-gray-400 mb-4" />
                  <p className="text-lg font-medium mb-2">Preview not available</p>
                  <p className="text-sm text-muted-foreground mb-4">This file type cannot be previewed directly in the browser.</p>
                  <Button asChild>
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" download={fileName}>
                      <Download className="mr-2 h-4 w-4" />
                      Download File
                    </a>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <FileTypeIcon fileName={fileName} fileType={fileType} size={64} className="text-gray-400 mb-4" />
              <p className="text-lg font-medium">No preview available</p>
              <p className="text-sm text-muted-foreground">The file URL is not available or the file has not been uploaded yet.</p>
            </div>
          )}
        </div>

        {/* File info panel */}
        <div className="w-64 border-l pl-4 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">File Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">File Name:</span>
                  <p className="font-medium truncate">{fileName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium">{fileType || `${fileExtension.toUpperCase()} File`}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Size:</span>
                  <p className="font-medium">{formatFileSize(fileSize)}</p>
                </div>
                {uploadDate && (
                  <div>
                    <span className="text-muted-foreground">Uploaded on:</span>
                    <p className="font-medium">{formatDate(uploadDate)}</p>
                  </div>
                )}
                {uploadedBy && (
                  <div>
                    <span className="text-muted-foreground">Uploaded by:</span>
                    <p className="font-medium">{uploadedBy}</p>
                  </div>
                )}
              </div>
            </div>

            {documentType && (
              <div>
                <h3 className="text-sm font-medium mb-2">Document Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Document Type:</span>
                    <p className="font-medium">{documentType}</p>
                  </div>
                  {issueDate && (
                    <div>
                      <span className="text-muted-foreground">Issue Date:</span>
                      <p className="font-medium">{formatDate(issueDate)}</p>
                    </div>
                  )}
                  {expiryDate && (
                    <div>
                      <span className="text-muted-foreground">Expiry Date:</span>
                      <p className="font-medium">{formatDate(expiryDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {description && (
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm">{description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Only show footer when wrapped in dialog */}
      {showDialogWrapper && (
        <DialogFooter>
          {fileUrl && (
            <Button asChild>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" download={fileName}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          )}
        </DialogFooter>
      )}
    </>
  );

  // Conditionally render with or without dialog wrapper
  if (showDialogWrapper) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="truncate max-w-[90%]">{fileName}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <PreviewContent />
        </DialogContent>
      </Dialog>
    );
  }

  // Return just the content without dialog wrapper
  return <PreviewContent />;
};
