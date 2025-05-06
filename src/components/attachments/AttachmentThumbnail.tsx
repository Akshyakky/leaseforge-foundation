import React, { useState } from "react";
import { FileTypeIcon } from "./FileTypeIcon";

interface AttachmentThumbnailProps {
  fileUrl?: string;
  fileName: string;
  fileType?: string;
  className?: string;
  onClick?: () => void;
}

export const AttachmentThumbnail: React.FC<AttachmentThumbnailProps> = ({ fileUrl, fileName, fileType, className = "", onClick }) => {
  const [isImageError, setIsImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Determine file extension
  const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";

  // Determine if it's an image type
  const isImage = (fileType?.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(fileExtension)) && !isImageError;

  // Determine if it's a PDF
  const isPdf = fileType === "application/pdf" || fileExtension === "pdf";

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsImageError(true);
    setIsLoading(false);
  };

  return (
    <div className={`relative w-16 h-16 rounded border flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer ${className}`} onClick={onClick}>
      {isLoading && isImage && fileUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {isImage && fileUrl ? (
        <img src={fileUrl} alt={fileName} className="w-full h-full object-cover" onLoad={handleImageLoad} onError={handleImageError} />
      ) : isPdf && fileUrl ? (
        <div className="w-full h-full flex items-center justify-center bg-red-50">
          <FileTypeIcon fileName={fileName} fileType={fileType} size={32} className="text-red-500" />
        </div>
      ) : (
        <FileTypeIcon fileName={fileName} fileType={fileType} size={28} />
      )}
    </div>
  );
};
