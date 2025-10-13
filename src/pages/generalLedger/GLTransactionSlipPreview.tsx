// src/components/generalLedger/GLTransactionSlipPreview.tsx
import React, { useState, useEffect } from "react";
import { PdfPreviewModal } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";
import { toast } from "sonner";

interface GLTransactionSlipPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    VoucherNo: string;
    VoucherType: string;
    CompanyID: number;
    TransactionID?: number;
    PostingID: number;
    ReferenceType?: string;
    ReferenceNo?: string;
  };
}

/**
 * Maps voucher types to their corresponding report types
 */
const getReportTypeForVoucher = (voucherType: string): { reportType: string; label: string } | null => {
  const typeMap: Record<string, { reportType: string; label: string }> = {
    "Journal Voucher": { reportType: "journal-voucher-slip", label: "Journal Voucher Slip" },
    "Payment Voucher": { reportType: "payment-voucher-slip", label: "Payment Voucher Slip" },
    "Receipt Voucher": { reportType: "receipt-slip", label: "Receipt Slip" },
    "Petty Cash": { reportType: "petty-cash-slip", label: "Petty Cash Slip" },
    Invoice: { reportType: "invoice-slip", label: "Invoice Slip" },
    "Lease Transaction": { reportType: "lease-transaction-details", label: "Lease Transaction Details" },
  };

  return typeMap[voucherType] || null;
};

/**
 * Builds parameters for the PDF report based on transaction type
 */
const buildReportParameters = (transaction: GLTransactionSlipPreviewProps["transaction"], reportType: string): Record<string, any> => {
  switch (reportType) {
    case "journal-voucher-slip":
    case "payment-voucher-slip":
    case "petty-cash-slip":
      return {
        VoucherNo: transaction.VoucherNo,
        CompanyID: transaction.CompanyID,
      };

    case "receipt-slip":
      return {
        LeaseReceiptID: transaction.TransactionID || transaction.PostingID,
      };

    case "invoice-slip":
      return {
        LeaseInvoiceID: transaction.TransactionID || transaction.PostingID,
      };

    case "lease-transaction-details":
      return {
        TransactionType: transaction.ReferenceType || "Lease",
        TransactionID: transaction.TransactionID || transaction.PostingID,
      };

    default:
      return {
        VoucherNo: transaction.VoucherNo,
        CompanyID: transaction.CompanyID,
      };
  }
};

export function GLTransactionSlipPreview({ isOpen, onClose, transaction }: GLTransactionSlipPreviewProps) {
  const pdfReport = useGenericPdfReport();
  const [reportConfig, setReportConfig] = useState<{ reportType: string; label: string } | null>(null);

  useEffect(() => {
    if (isOpen && transaction) {
      const config = getReportTypeForVoucher(transaction.VoucherType);

      if (!config) {
        toast.error(`Preview not available for voucher type: ${transaction.VoucherType}`);
        onClose();
        return;
      }

      setReportConfig(config);
      generatePreview(config.reportType);
    }
  }, [isOpen, transaction]);

  const generatePreview = async (reportType: string) => {
    const parameters = buildReportParameters(transaction, reportType);

    const response = await pdfReport.generateReport(reportType, parameters, {
      orientation: "Portrait",
      download: false,
    });

    if (!response.success) {
      toast.error(response.error || "Failed to generate preview");
    }
  };

  const handleDownload = () => {
    if (!reportConfig) return;

    const filename = `${reportConfig.label.replace(/\s+/g, "_")}_${transaction.VoucherNo}_${new Date().toISOString().split("T")[0]}.pdf`;

    if (pdfReport.data) {
      pdfReport.downloadCurrentPdf(filename);
    }
  };

  const handleRefresh = () => {
    if (reportConfig) {
      generatePreview(reportConfig.reportType);
    }
  };

  if (!reportConfig) {
    return null;
  }

  return (
    <PdfPreviewModal
      isOpen={isOpen}
      onClose={onClose}
      pdfBlob={pdfReport.data}
      title={`${reportConfig.label} - ${transaction.VoucherNo}`}
      isLoading={pdfReport.isLoading}
      error={pdfReport.error}
      onDownload={handleDownload}
      onRefresh={handleRefresh}
    />
  );
}
