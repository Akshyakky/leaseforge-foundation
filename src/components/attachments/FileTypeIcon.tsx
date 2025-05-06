import React from "react";
import { FileText, FileImage, FileSpreadsheet, FileCode, FileArchive, FileAudio, FileVideo, File, FileType2 } from "lucide-react";

interface FileTypeIconProps {
  fileName: string;
  fileType?: string;
  size?: number;
  className?: string;
}

export const FileTypeIcon: React.FC<FileTypeIconProps> = ({ fileName, fileType, size = 16, className = "" }) => {
  // Get file extension
  const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";

  // Determine icon based on file type or extension
  const getIcon = () => {
    // Check by mime type first
    if (fileType) {
      if (fileType.startsWith("image/")) {
        return <FileImage size={size} className={className} />;
      }
      if (fileType === "application/pdf") {
        return <FileType2 size={size} className={className} />;
      }
      if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType === "application/vnd.ms-excel") {
        return <FileSpreadsheet size={size} className={className} />;
      }
      if (fileType.includes("audio")) {
        return <FileAudio size={size} className={className} />;
      }
      if (fileType.includes("video")) {
        return <FileVideo size={size} className={className} />;
      }
      if (fileType.includes("zip") || fileType.includes("compress") || fileType.includes("tar") || fileType.includes("rar")) {
        return <FileArchive size={size} className={className} />;
      }
      if (fileType.includes("html") || fileType.includes("javascript") || fileType.includes("css") || fileType.includes("json")) {
        return <FileCode size={size} className={className} />;
      }
    }

    // Check by extension if mime type is not definitive
    switch (fileExtension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
      case "webp":
        return <FileImage size={size} className={className} />;
      case "pdf":
        return <FileType2 size={size} className={className} />;
      case "xls":
      case "xlsx":
      case "csv":
        return <FileSpreadsheet size={size} className={className} />;
      case "doc":
      case "docx":
      case "txt":
      case "rtf":
        return <FileText size={size} className={className} />;
      case "mp3":
      case "wav":
      case "ogg":
        return <FileAudio size={size} className={className} />;
      case "mp4":
      case "mov":
      case "avi":
      case "webm":
        return <FileVideo size={size} className={className} />;
      case "zip":
      case "rar":
      case "tar":
      case "7z":
        return <FileArchive size={size} className={className} />;
      case "html":
      case "js":
      case "css":
      case "json":
      case "ts":
      case "tsx":
      case "jsx":
        return <FileCode size={size} className={className} />;
      default:
        return <File size={size} className={className} />;
    }
  };

  return getIcon();
};
