// src/components/pdf/PdfReportComponents.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Download, Eye, FileText, Loader2, AlertCircle, ExternalLink, RefreshCw, Calendar, User, Building, Hash } from "lucide-react";
import { useGenericPdfReport } from "@/hooks/usePdfReports";

// ==================== UTILITY COMPONENTS ====================

/**
 * PDF Preview Modal Component
 * Displays PDF content in a modal dialog with download and print options
 */
interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBlob: Blob | null;
  title: string;
  isLoading?: boolean;
  error?: string | null;
  onDownload?: () => void;
  onRefresh?: () => void;
}

export function PdfPreviewModal({ isOpen, onClose, pdfBlob, title, isLoading = false, error = null, onDownload, onRefresh }: PdfPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPdfUrl(null);
    }
  }, [pdfBlob]);

  const handlePrint = useCallback(() => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  }, [pdfUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Generating PDF preview...</span>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {onRefresh && (
                  <Button variant="outline" size="sm" onClick={onRefresh} className="ml-2">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {pdfUrl && !isLoading && !error && <iframe src={pdfUrl} className="w-full h-full border rounded-md" style={{ minHeight: "60vh" }} title={title} />}
        </div>

        <DialogFooter className="flex-shrink-0">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {pdfUrl && (
              <>
                <Button variant="outline" onClick={handlePrint}>
                  Print
                </Button>
                <Button variant="outline" onClick={() => window.open(pdfUrl, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
                {onDownload && (
                  <Button onClick={onDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * PDF Action Buttons Component
 * Provides consistent download and preview buttons for PDF operations
 */
interface PdfActionButtonsProps {
  onDownload: () => void;
  onPreview: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  downloadLabel?: string;
  previewLabel?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

export function PdfActionButtons({
  onDownload,
  onPreview,
  isLoading = false,
  disabled = false,
  downloadLabel = "Download PDF",
  previewLabel = "Preview",
  variant = "default",
  size = "default",
}: PdfActionButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size={size} onClick={onPreview} disabled={disabled || isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
        {previewLabel}
      </Button>
      <Button variant={variant} size={size} onClick={onDownload} disabled={disabled || isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
        {downloadLabel}
      </Button>
    </div>
  );
}

// ==================== GENERIC COMPONENTS ====================

/**
 * Generic PDF Report Component
 * Can be used for any report type with custom parameters
 */
interface GenericPdfReportProps {
  reportType: string;
  parameters?: Record<string, any>;
  title: string;
  description?: string;
  orientation?: "Portrait" | "Landscape";
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function GenericPdfReport({ reportType, parameters = {}, title, description, orientation = "Portrait", className = "", onSuccess, onError }: GenericPdfReportProps) {
  const [showPreview, setShowPreview] = useState(false);
  const genericPdf = useGenericPdfReport();

  const handleDownload = useCallback(async () => {
    const response = await genericPdf.generateReport(reportType, parameters, { orientation, download: true });

    if (response.success) {
      onSuccess?.();
    } else {
      onError?.(response.error || "Failed to generate report");
    }
  }, [genericPdf, reportType, parameters, orientation, onSuccess, onError]);

  const handlePreview = useCallback(async () => {
    setShowPreview(true);
    const response = await genericPdf.generateReport(reportType, parameters, { orientation, download: false });

    if (!response.success) {
      onError?.(response.error || "Failed to preview report");
    }
  }, [genericPdf, reportType, parameters, orientation, onError]);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {genericPdf.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{genericPdf.error}</AlertDescription>
              </Alert>
            )}

            <PdfActionButtons
              onDownload={handleDownload}
              onPreview={handlePreview}
              isLoading={genericPdf.isLoading}
              downloadLabel={`Download ${title}`}
              previewLabel={`Preview ${title}`}
            />
          </div>
        </CardContent>
      </Card>

      <PdfPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        pdfBlob={genericPdf.data}
        title={title}
        isLoading={genericPdf.isLoading}
        error={genericPdf.error}
        onDownload={() => genericPdf.downloadCurrentPdf(`${reportType.replace("-", "_")}.pdf`)}
        onRefresh={handlePreview}
      />
    </div>
  );
}
