import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Edit2, Trash2, FileText, Download, Eye } from "lucide-react";
import { CustomerAttachment } from "@/types/customerTypes";
import { useTranslation } from "react-i18next";

interface AttachmentCardProps {
  attachment: CustomerAttachment;
  onEdit: (attachment: CustomerAttachment) => void;
  onDelete: (attachmentId: number) => void;
  onView?: (attachment: CustomerAttachment) => void;
  onDownload?: (attachment: CustomerAttachment) => void;
}

const AttachmentCard: React.FC<AttachmentCardProps> = ({ attachment, onEdit, onDelete, onView, onDownload }) => {
  const { t } = useTranslation();

  const getTimeUntilExpiry = (expiryDate?: Date | string) => {
    if (!expiryDate) return null;

    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { days: Math.abs(diffDays), expired: true };
    return { days: diffDays, expired: false };
  };

  const expiry = attachment.DocExpiryDate ? getTimeUntilExpiry(attachment.DocExpiryDate) : null;

  // Determine if we have file content
  const hasFileContent = Boolean(attachment.FileContent);

  // Get appropriate icon based on file type
  const getFileIcon = () => {
    const fileType = attachment.FileContentType || "";

    if (fileType.includes("image")) return "image";
    if (fileType.includes("pdf")) return "pdf";
    if (fileType.includes("word") || fileType.includes("document")) return "word";
    if (fileType.includes("excel") || fileType.includes("sheet")) return "excel";
    return "file";
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";

    const sizes = ["B", "KB", "MB", "GB"];
    if (bytes === 0) return "0 B";

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    if (i === 0) return `${bytes} ${sizes[i]}`;

    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="font-medium">{attachment.DocumentName}</span>
              {attachment.DocTypeName && <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100">{attachment.DocTypeName}</Badge>}
            </div>

            {hasFileContent && (
              <div className="flex items-center text-sm text-muted-foreground">
                <FileText className="h-3.5 w-3.5 mr-1" />
                <span>{formatFileSize(attachment.FileSize)}</span>
              </div>
            )}

            <div className="text-sm space-y-1">
              {attachment.DocIssueDate && (
                <div className="text-muted-foreground flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {t("customer.fields.issueDate")}: {format(new Date(attachment.DocIssueDate), "PPP")}
                </div>
              )}

              {attachment.DocExpiryDate && (
                <div className={`flex items-center ${expiry?.expired ? "text-red-500" : "text-muted-foreground"}`}>
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {t("customer.fields.expiryDate")}: {format(new Date(attachment.DocExpiryDate), "PPP")}
                  {expiry && (
                    <span className="ml-2">
                      {expiry.expired ? (
                        <Badge variant="destructive" className="text-xs">
                          {t("customer.messages.expired", { days: expiry.days })}
                        </Badge>
                      ) : expiry.days <= 30 ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 text-xs">
                          {t("customer.messages.expiresIn", { days: expiry.days })}
                        </Badge>
                      ) : null}
                    </span>
                  )}
                </div>
              )}

              {attachment.Remark && <div className="text-muted-foreground">{attachment.Remark}</div>}
            </div>
          </div>

          <div className="flex space-x-1">
            {hasFileContent && onView && (
              <Button variant="ghost" size="icon" onClick={() => onView(attachment)} title={t("common.view")}>
                <Eye className="h-4 w-4" />
              </Button>
            )}

            {hasFileContent && onDownload && (
              <Button variant="ghost" size="icon" onClick={() => onDownload(attachment)} title={t("common.download")}>
                <Download className="h-4 w-4" />
              </Button>
            )}

            <Button variant="ghost" size="icon" onClick={() => onEdit(attachment)} title={t("common.edit")}>
              <Edit2 className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(attachment.CustomerAttachmentID)} title={t("common.delete")}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttachmentCard;
