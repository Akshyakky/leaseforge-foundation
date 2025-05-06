import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { AttachmentPreview } from "./AttachmentPreview";
import { CustomerAttachment } from "@/types/customerTypes";

interface AttachmentGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: CustomerAttachment[];
  initialAttachmentId?: number;
}

export const AttachmentGallery: React.FC<AttachmentGalleryProps> = ({ isOpen, onClose, attachments, initialAttachmentId }) => {
  // Find the initial index based on the initial attachment ID
  const initialIndex = initialAttachmentId ? attachments.findIndex((a) => a.CustomerAttachmentID === initialAttachmentId) : 0;

  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

  if (!attachments.length) {
    return null;
  }

  const currentAttachment = attachments[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : attachments.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex < attachments.length - 1 ? prevIndex + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      goToPrevious();
    } else if (e.key === "ArrowRight") {
      goToNext();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden" onKeyDown={handleKeyDown} tabIndex={0}>
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center">
            <DialogTitle className="truncate max-w-[400px]">{currentAttachment.DocumentName || "Document"}</DialogTitle>
            <span className="ml-2 text-sm text-muted-foreground">
              {currentIndex + 1} of {attachments.length}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="relative">
          {/* Navigation buttons */}
          {attachments.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 rounded-full h-10 w-10"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 rounded-full h-10 w-10" onClick={goToNext}>
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* The actual attachment preview */}
          <div className="h-[calc(90vh-120px)]">
            <AttachmentPreview
              isOpen={true}
              onClose={() => {}} // No-op since we handle closing in the gallery
              fileUrl={currentAttachment.fileUrl}
              fileName={currentAttachment.DocumentName || "Document"}
              fileType={currentAttachment.FileContentType}
              fileSize={currentAttachment.FileSize}
              uploadDate={currentAttachment.CreatedOn}
              uploadedBy={currentAttachment.CreatedBy}
              description={currentAttachment.Remark}
              documentType={currentAttachment.DocTypeName}
              issueDate={currentAttachment.DocIssueDate}
              expiryDate={currentAttachment.DocExpiryDate}
            />
          </div>
        </div>

        {/* Thumbnail navigation at the bottom */}
        {attachments.length > 1 && (
          <div className="flex overflow-x-auto p-2 border-t gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={attachment.CustomerAttachmentID}
                className={`w-16 h-16 flex-shrink-0 cursor-pointer rounded overflow-hidden border-2 ${index === currentIndex ? "border-primary" : "border-transparent"}`}
                onClick={() => setCurrentIndex(index)}
              >
                {attachment.fileUrl && attachment.FileContentType?.startsWith("image/") ? (
                  <img src={attachment.fileUrl} alt={attachment.DocumentName || "Document"} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-xs truncate p-1 text-center">{attachment.DocumentName?.split(".")[0] || "Doc"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
