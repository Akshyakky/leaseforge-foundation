// src/pages/pettyCash/PettyCashDetails.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/data-display/DataTable";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { pettyCashService } from "@/services/pettyCashService";
import { PettyCashVoucher, PettyCashVoucherPostingLine } from "@/types/pettyCashTypes";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { DescriptionItem } from "@/components/data-display/DescriptionItem";

export const PettyCashDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // 'id' will now be the VoucherNo
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [voucher, setVoucher] = useState<PettyCashVoucher | null>(null);
  const [postingLines, setPostingLines] = useState<PettyCashVoucherPostingLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPostConfirm, setShowPostConfirm] = useState(false);
  const [showReverseConfirm, setShowReverseConfirm] = useState(false);
  const [reversalReason, setReversalReason] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // The 'id' param from the URL is now the VoucherNo string
  const voucherNo = id;

  useEffect(() => {
    if (voucherNo) {
      fetchPettyCashDetails(voucherNo);
    }
  }, [voucherNo]); // Depend on voucherNo

  const fetchPettyCashDetails = async (VoucherNo: string) => {
    // Changed parameter to VoucherNo
    setIsLoading(true);
    try {
      const data = await pettyCashService.getPettyCashVoucherByVoucherNo(VoucherNo); // Call the updated service method
      if (data.voucher) {
        setVoucher(data.voucher);
        setPostingLines(data.postingLines);
      } else {
        toast.error(t("pettyCash.voucherNotFound"));
        navigate("/petty-cash"); // Redirect if not found
      }
    } catch (error) {
      console.error("Failed to fetch petty cash voucher details:", error);
      toast.error(t("pettyCash.errorFetchingDetails"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!voucher?.VoucherNo) {
      // Check for VoucherNo
      toast.error(t("pettyCash.voucherNoMissing"));
      return;
    }
    setIsProcessingAction(true);
    try {
      const response = await pettyCashService.deletePettyCashVoucher(voucher.VoucherNo); // Pass VoucherNo
      if (response.Status === 1) {
        toast.success(t("pettyCash.deleteSuccess"));
        navigate("/petty-cash");
      } else {
        toast.error(response.Message || t("pettyCash.deleteError"));
      }
    } catch (error) {
      console.error("Failed to delete petty cash voucher:", error);
      toast.error(t("pettyCash.deleteError"));
    } finally {
      setIsProcessingAction(false);
      setShowDeleteConfirm(false);
    }
  };

  const handlePost = async () => {
    if (!voucher?.VoucherNo) {
      // Check for VoucherNo
      toast.error(t("pettyCash.voucherNoMissing"));
      return;
    }
    setIsProcessingAction(true);
    try {
      const response = await pettyCashService.postPettyCashVoucher(voucher.VoucherNo); // Pass VoucherNo
      if (response.Status === 1) {
        toast.success(t("pettyCash.postSuccess"));
        fetchPettyCashDetails(voucher.VoucherNo); // Refresh data using VoucherNo
      } else {
        toast.error(response.Message || t("pettyCash.postError"));
      }
    } catch (error) {
      console.error("Failed to post petty cash voucher:", error);
      toast.error(t("pettyCash.postError"));
    } finally {
      setIsProcessingAction(false);
      setShowPostConfirm(false);
    }
  };

  const handleReverse = async () => {
    if (!voucher?.VoucherNo) {
      // Check for VoucherNo
      toast.error(t("pettyCash.voucherNoMissing"));
      return;
    }
    if (!reversalReason.trim()) {
      toast.error(t("pettyCash.reversalReasonRequired"));
      return;
    }
    setIsProcessingAction(true);
    try {
      const response = await pettyCashService.reversePettyCashVoucher({ VoucherNo: voucher.VoucherNo, reversalReason }); // Pass VoucherNo
      if (response.Status === 1) {
        toast.success(t("pettyCash.reverseSuccess"));
        fetchPettyCashDetails(voucher.VoucherNo); // Refresh data using VoucherNo
      } else {
        toast.error(response.Message || t("pettyCash.reverseError"));
      }
    } catch (error) {
      console.error("Failed to reverse petty cash voucher:", error);
      toast.error(t("pettyCash.reverseError"));
    } finally {
      setIsProcessingAction(false);
      setShowReverseConfirm(false);
      setReversalReason("");
    }
  };

  const postingLinesColumns: Column<PettyCashVoucherPostingLine>[] = [
    {
      header: t("pettyCash.accountName"),
      accessorKey: "AccountName",
    },
    {
      header: t("pettyCash.accountCode"),
      accessorKey: "AccountCode",
    },
    {
      header: t("pettyCash.transactionType"),
      accessorKey: "TransactionType",
    },
    {
      header: t("pettyCash.debitAmount"),
      accessorKey: "DebitAmount",
      cell: ({ row }) => <div className="text-right">{row.DebitAmount?.toFixed(2) || "0.00"}</div>, // Simplified, as DebitAmount is already 0 if not debit
    },
    {
      header: t("pettyCash.creditAmount"),
      accessorKey: "CreditAmount",
      cell: ({ row }) => <div className="text-right">{row.CreditAmount?.toFixed(2) || "0.00"}</div>, // Simplified, as CreditAmount is already 0 if not credit
    },
    {
      header: t("pettyCash.costCenter1"),
      accessorKey: "CostCenter1Name",
      cell: ({ row }) => row.CostCenter1Name || "-",
    },
    {
      header: t("pettyCash.costCenter2"),
      accessorKey: "CostCenter2Name",
      cell: ({ row }) => row.CostCenter2Name || "-",
    },
    {
      header: t("pettyCash.costCenter3"),
      accessorKey: "CostCenter3Name",
      cell: ({ row }) => row.CostCenter3Name || "-",
    },
    {
      header: t("pettyCash.costCenter4"),
      accessorKey: "CostCenter4Name",
      cell: ({ row }) => row.CostCenter4Name || "-",
    },
    {
      header: t("pettyCash.lineDescription"), // Added for line-specific description
      accessorKey: "LineDescription",
      cell: ({ row }) => row.LineDescription || voucher?.Description || "-", // Fallback to header description
    },
    {
      header: t("pettyCash.lineNarration"), // Added for line-specific narration
      accessorKey: "LineNarration",
      cell: ({ row }) => row.LineNarration || voucher?.Narration || "-", // Fallback to header narration
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!voucher) {
    return <div className="text-center">{t("pettyCash.voucherNotFound")}</div>;
  }

  // Determine badge variant based on PostingStatus
  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case "Posted":
        return "default"; // Often a primary color for posted
      case "Draft":
        return "secondary"; // For items in draft
      case "Reversed":
        return "destructive"; // For reversed/cancelled items
      default:
        return "outline"; // Default or unknown status
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">
            {t("pettyCash.detailsTitle")} - {voucher.VoucherNo}
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/petty-cash/edit/${voucher.VoucherNo}`)} // Pass VoucherNo for editing
              disabled={voucher.PostingStatus !== "Draft" || isProcessingAction} // Only Draft can be edited
            >
              {t("common.edit")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPostConfirm(true)}
              disabled={voucher.PostingStatus !== "Draft" || isProcessingAction} // Only Draft can be posted
            >
              {t("common.post")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowReverseConfirm(true)}
              disabled={voucher.PostingStatus !== "Posted" || isProcessingAction} // Only Posted can be reversed
            >
              {t("common.reverse")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={voucher.PostingStatus !== "Draft" || isProcessingAction} // Only Draft can be deleted
            >
              {t("common.delete")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DescriptionItem label={t("pettyCash.voucherNo")} value={voucher.VoucherNo} />
            <DescriptionItem label={t("pettyCash.transactionDate")} value={voucher.TransactionDate ? format(new Date(voucher.TransactionDate), "PPP") : "-"} />
            <DescriptionItem label={t("pettyCash.postingDate")} value={voucher.PostingDate ? format(new Date(voucher.PostingDate), "PPP") : "-"} />
            <DescriptionItem label={t("pettyCash.company")} value={voucher.CompanyName} />
            <DescriptionItem label={t("pettyCash.fiscalYear")} value={voucher.FYDescription} />
            {/* Display TotalAmount now as it's the sum of debits/credits */}
            <DescriptionItem label={t("pettyCash.totalAmount")} value={`${voucher.TotalAmount?.toFixed(2)} ${voucher.CurrencyName || ""}`} />
            <DescriptionItem label={t("pettyCash.currency")} value={voucher.CurrencyName} />
            <DescriptionItem label={t("pettyCash.exchangeRate")} value={voucher.ExchangeRate?.toFixed(4)} />
            {/* Removed ExpenseAccount, ReceivedBy, ExpenseCategory as they are not top-level properties on the voucher anymore */}
            {/* <DescriptionItem label={t("pettyCash.expenseAccount")} value={voucher.ExpenseAccount} />
            <DescriptionItem label={t("pettyCash.receivedBy")} value={voucher.ReceivedBy} />
            <DescriptionItem label={t("pettyCash.expenseCategory")} value={voucher.ExpenseCategory} /> */}
            <DescriptionItem label={t("pettyCash.receiptNo")} value={voucher.ReceiptNo} />
            <DescriptionItem label={t("pettyCash.postingStatus")} value={<Badge variant={getStatusBadgeVariant(voucher.PostingStatus)}>{voucher.PostingStatus}</Badge>} />
            <DescriptionItem label={t("pettyCash.description")} value={voucher.Description} className="col-span-full" />
            <DescriptionItem label={t("pettyCash.narration")} value={voucher.Narration} className="col-span-full" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("pettyCash.postingLines")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={postingLinesColumns} data={postingLines} />
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t("pettyCash.confirmDeleteTitle")}
        description={t("pettyCash.confirmDeleteDescription", { voucherNo: voucher.VoucherNo })}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        loading={isProcessingAction}
      />

      <ConfirmationDialog
        isOpen={showPostConfirm}
        onClose={() => setShowPostConfirm(false)}
        onConfirm={handlePost}
        title={t("pettyCash.confirmPostTitle")}
        description={t("pettyCash.confirmPostDescription", { voucherNo: voucher.VoucherNo })}
        confirmText={t("common.post")}
        cancelText={t("common.cancel")}
        loading={isProcessingAction}
      />

      <ConfirmationDialog
        isOpen={showReverseConfirm}
        onClose={() => setShowReverseConfirm(false)}
        onConfirm={handleReverse}
        title={t("pettyCash.confirmReverseTitle")}
        description={
          <div className="space-y-4">
            <p>{t("pettyCash.confirmReverseDescription", { voucherNo: voucher.VoucherNo })}</p>
            <div>
              <label htmlFor="reversalReason" className="block text-sm font-medium text-gray-700">
                {t("pettyCash.reversalReason")}
              </label>
              <textarea
                id="reversalReason"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder={t("pettyCash.reversalReasonPlaceholder")}
              ></textarea>
            </div>
          </div>
        }
        confirmText={t("common.reverse")}
        cancelText={t("common.cancel")}
        loading={isProcessingAction}
      />
    </div>
  );
};

export default PettyCashDetails;
