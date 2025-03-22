import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormField } from "@/components/forms/FormField";
import FileUploadField from "@/components/forms/FileUploadField";
import { CustomerAttachment, DocType } from "@/types/customerTypes";
import { useTranslation } from "react-i18next";

interface AttachmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  form: UseFormReturn<any>;
  editingAttachment: CustomerAttachment | null;
  documentTypes: DocType[];
}

const AttachmentDialog: React.FC<AttachmentDialogProps> = ({ open, onClose, onSubmit, form, editingAttachment, documentTypes }) => {
  const { t } = useTranslation();

  // Determine if we're editing an existing attachment with a file
  const hasExistingFile = Boolean(editingAttachment?.FileContent);

  // Generate a preview URL for existing files
  const filePreviewUrl = editingAttachment?.fileUrl;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingAttachment ? t("customer.editAttachment") : t("customer.addAttachment")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              form={form}
              name="DocTypeID"
              label={t("customer.fields.docType")}
              type="select"
              options={documentTypes.map((type) => ({
                label: type.Description,
                value: type.DocTypeID.toString(),
              }))}
              placeholder={t("common.select", { item: t("customer.fields.docType") })}
              required
            />

            <FormField form={form} name="DocumentName" label={t("customer.fields.docName")} placeholder={t("common.enter", { item: t("customer.fields.docName") })} required />

            <FileUploadField
              form={form}
              name="file"
              label={t("customer.fields.fileUpload")}
              description={hasExistingFile ? t("customer.fileUpload.replace") : undefined}
              placeholder={t("customer.fileUpload.browse")}
              helperText={t("customer.fields.maxFileSize", { size: "10MB" })}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
              maxSize={10 * 1024 * 1024} // 10MB
              showPreview={true}
              previewUrl={filePreviewUrl}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                form={form}
                name="DocIssueDate"
                label={t("customer.fields.issueDate")}
                type="date"
                placeholder={t("common.select", { item: t("customer.fields.issueDate") })}
              />

              <FormField
                form={form}
                name="DocExpiryDate"
                label={t("customer.fields.expiryDate")}
                type="date"
                placeholder={t("common.select", { item: t("customer.fields.expiryDate") })}
              />
            </div>

            <FormField form={form} name="Remark" label={t("common.remarks")} placeholder={t("common.enter", { item: t("common.remarks") })} type="textarea" />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">{editingAttachment ? t("common.update") : t("common.add")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AttachmentDialog;
