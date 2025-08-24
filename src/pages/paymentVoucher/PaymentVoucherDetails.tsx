// src/pages/paymentVoucher/PaymentVoucherDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { paymentVoucherService } from "@/services/paymentVoucherService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Trash2,
  Receipt,
  Calendar,
  CreditCard,
  FileText,
  Download,
  RotateCcw,
  Send,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  HandCoins,
  Building,
  Network,
  ChevronDown,
  Lock,
  Shield,
  AlertTriangle,
  Loader2,
  Edit2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { PaymentVoucher, PaymentVoucherLine, PaymentVoucherAttachment, PaymentStatus, PaymentType, ApprovalAction, ApprovalStatus } from "@/types/paymentVoucherTypes";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AttachmentPreview } from "@/components/attachments/AttachmentPreview";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { AttachmentThumbnail } from "@/components/attachments/AttachmentThumbnail";
import { FileTypeIcon } from "@/components/attachments/FileTypeIcon";

// PDF Report Components
import { PdfPreviewModal, PdfActionButtons } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";
import { useAppSelector } from "@/lib/hooks";

const PaymentVoucherDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [voucher, setVoucher] = useState<PaymentVoucher | null>(null);
  const [lines, setLines] = useState<PaymentVoucherLine[]>([]);
  const [attachments, setAttachments] = useState<PaymentVoucherAttachment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [reversalDialogOpen, setReversalDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);

  // PDF generation state
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const paymentVoucherPdfReport = useGenericPdfReport();

  // Attachment-related state
  const [previewAttachment, setPreviewAttachment] = useState<PaymentVoucherAttachment | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialAttachmentId, setInitialAttachmentId] = useState<number | undefined>(undefined);

  // Form states
  const [approvalAction, setApprovalAction] = useState<ApprovalAction>(ApprovalAction.APPROVE);
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [reversalReason, setReversalReason] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Loading states for actions
  const [actionLoading, setActionLoading] = useState(false);

  // Payment status options
  const paymentStatusOptions = ["Draft", "Pending", "Paid", "Rejected", "Cancelled", "Reversed"];

  // Check if user is manager
  const isManager = user?.role === "admin" || user?.role === "manager";

  // Check if voucher can be edited
  const canEditVoucher = voucher && voucher.PaymentStatus !== "Paid" && voucher.PaymentStatus !== "Reversed";
  const isPaid = voucher?.PaymentStatus === "Paid";
  const isReversed = voucher?.PaymentStatus === "Reversed" || voucher?.IsReversed;

  useEffect(() => {
    const fetchVoucherData = async () => {
      if (!id) {
        navigate("/payment-vouchers");
        return;
      }

      try {
        setLoading(true);
        const voucherData = await paymentVoucherService.getPaymentVoucherByNumber(id);

        if (voucherData.voucher) {
          setVoucher(voucherData.voucher);
          setLines(voucherData.lines);
          setAttachments(voucherData.attachments);
        } else {
          toast.error("Payment voucher not found");
          navigate("/payment-vouchers");
        }
      } catch (error) {
        console.error("Error fetching voucher:", error);
        toast.error("Failed to load payment voucher data");
        navigate("/payment-vouchers");
      } finally {
        setLoading(false);
      }
    };

    fetchVoucherData();
  }, [id, navigate]);

  // PDF Generation Handlers
  const handleGeneratePaymentVoucherSlip = async () => {
    if (!voucher) return;

    const response = await paymentVoucherPdfReport.generateReport(
      "payment-voucher-slip",
      { VoucherNo: voucher.VoucherNo, CompanyID: voucher.CompanyID },
      {
        orientation: "Portrait",
        download: true,
        showToast: true,
        filename: `Payment_Voucher_Slip_${voucher.VoucherNo}_${new Date().toISOString().split("T")[0]}.pdf`,
      }
    );

    if (response.success) {
      toast.success("Payment voucher slip generated successfully");
    }
  };

  const handlePreviewPaymentVoucherSlip = async () => {
    if (!voucher) return;

    setShowPdfPreview(true);
    const response = await paymentVoucherPdfReport.generateReport(
      "payment-voucher-slip",
      { VoucherNo: voucher.VoucherNo, CompanyID: voucher.CompanyID },
      {
        orientation: "Portrait",
        download: false,
        showToast: false,
      }
    );

    if (!response.success) {
      toast.error("Failed to generate payment voucher slip preview");
    }
  };

  // Approval handlers
  const openApprovalDialog = (action: "approve" | "reject" | "reset") => {
    if (action === "approve") {
      setApprovalAction(ApprovalAction.APPROVE);
    } else if (action === "reject") {
      setApprovalAction(ApprovalAction.REJECT);
    }
    setApprovalComments("");
    setRejectionReason("");
    setApprovalDialogOpen(true);
  };

  const closeApprovalDialog = () => {
    setApprovalDialogOpen(false);
    setApprovalComments("");
    setRejectionReason("");
  };

  const handleApprovalAction = async () => {
    if (!voucher || !isManager) return;

    if (approvalAction === ApprovalAction.REJECT && !rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    setActionLoading(true);

    try {
      const comments = approvalAction === ApprovalAction.APPROVE ? approvalComments : rejectionReason;
      const response = await paymentVoucherService.approveOrRejectPaymentVoucher(voucher.VoucherNo, voucher.CompanyID, approvalAction, comments.trim() || undefined);

      if (response.success) {
        // Refresh voucher data
        const voucherData = await paymentVoucherService.getPaymentVoucherByNumber(voucher.VoucherNo);
        if (voucherData.voucher) {
          setVoucher(voucherData.voucher);
        }

        const actionText = approvalAction === ApprovalAction.APPROVE ? "approved" : "rejected";
        toast.success(`Payment voucher ${actionText} successfully`);
      } else {
        toast.error(response.message || `Failed to ${approvalAction.toLowerCase()} payment voucher`);
      }
    } catch (error) {
      console.error(`Error ${approvalAction}ing voucher:`, error);
      toast.error(`Failed to ${approvalAction.toLowerCase()} payment voucher`);
    } finally {
      setActionLoading(false);
      closeApprovalDialog();
    }
  };

  // Reset approval status
  const handleResetApproval = async () => {
    if (!voucher || !isManager) return;

    setActionLoading(true);

    try {
      const response = await paymentVoucherService.resetPaymentVoucherApprovalStatus(voucher.VoucherNo, voucher.CompanyID);

      if (response.success) {
        // Refresh voucher data
        const voucherData = await paymentVoucherService.getPaymentVoucherByNumber(voucher.VoucherNo);
        if (voucherData.voucher) {
          setVoucher(voucherData.voucher);
        }

        toast.success("Payment voucher approval status reset successfully");
      } else {
        toast.error(response.message || "Failed to reset approval status");
      }
    } catch (error) {
      console.error("Error resetting approval:", error);
      toast.error("Failed to reset approval status");
    } finally {
      setActionLoading(false);
    }
  };

  // Attachment handlers
  const openAttachmentPreview = (attachment: PaymentVoucherAttachment) => {
    setPreviewAttachment(attachment);
    setPreviewOpen(true);
  };

  const openAttachmentGallery = (attachmentId?: number) => {
    setInitialAttachmentId(attachmentId);
    setGalleryOpen(true);
  };

  // Action handlers
  const handleEdit = () => {
    if (!voucher) return;

    if (!canEditVoucher) {
      toast.error("Cannot edit paid or reversed vouchers. Please reverse the payment first if changes are needed.");
      return;
    }

    navigate(`/payment-vouchers/edit/${voucher.VoucherNo}`);
  };

  const openDeleteDialog = () => {
    if (!canEditVoucher) {
      toast.error("Cannot delete paid or reversed vouchers. Please reverse the payment first if deletion is needed.");
      return;
    }
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!voucher) return;

    try {
      const response = await paymentVoucherService.deletePaymentVoucher(voucher.VoucherNo, voucher.CompanyID);

      if (response.success) {
        toast.success("Payment voucher deleted successfully");
        navigate("/payment-vouchers");
      } else {
        toast.error(response.message || "Failed to delete payment voucher");
      }
    } catch (error) {
      console.error("Error deleting voucher:", error);
      toast.error("Failed to delete payment voucher");
    } finally {
      closeDeleteDialog();
    }
  };

  const openStatusChangeDialog = (status: string) => {
    if (!canEditVoucher) {
      toast.error("Cannot change status of paid or reversed vouchers.");
      return;
    }
    setSelectedStatus(status);
    setStatusChangeDialogOpen(true);
  };

  const closeStatusChangeDialog = () => {
    setStatusChangeDialogOpen(false);
    setSelectedStatus("");
  };

  const handleStatusChange = async () => {
    if (!voucher || !selectedStatus) return;

    try {
      // Note: This would need a status change method in the service
      toast.info("Status change functionality needs to be implemented in the service");
      setVoucher({
        ...voucher,
        PaymentStatus: selectedStatus as PaymentStatus,
      });
    } catch (error) {
      console.error("Error changing voucher status:", error);
      toast.error("Failed to change voucher status");
    } finally {
      closeStatusChangeDialog();
    }
  };

  const handleSubmitForApproval = async () => {
    if (!voucher) return;

    setActionLoading(true);
    try {
      const result = await paymentVoucherService.submitPaymentVoucherForApproval(voucher.VoucherNo, voucher.CompanyID);
      if (result.success) {
        // Refresh voucher data
        const voucherData = await paymentVoucherService.getPaymentVoucherByNumber(voucher.VoucherNo);
        if (voucherData.voucher) {
          setVoucher(voucherData.voucher);
        }

        toast.success("Payment voucher submitted for approval successfully");
      } else {
        toast.error(result.message || "Failed to submit payment voucher");
      }
    } catch (error) {
      console.error("Error submitting voucher:", error);
      toast.error("Failed to submit payment voucher");
    } finally {
      setActionLoading(false);
      setSubmitDialogOpen(false);
    }
  };

  const handleReversal = async () => {
    if (!voucher || !reversalReason.trim()) {
      toast.error("Reversal reason is required");
      return;
    }

    setActionLoading(true);
    try {
      const result = await paymentVoucherService.reversePaymentVoucher(voucher.VoucherNo, voucher.CompanyID, reversalReason.trim());

      if (result.success) {
        // Refresh voucher data
        const voucherData = await paymentVoucherService.getPaymentVoucherByNumber(voucher.VoucherNo);
        if (voucherData.voucher) {
          setVoucher(voucherData.voucher);
        }

        toast.success("Payment voucher reversed successfully");
        if (result.reversalVoucherNo) {
          toast.info(`Reversal voucher created: ${result.reversalVoucherNo}`);
        }
      } else {
        toast.error(result.message || "Failed to reverse payment voucher");
      }
    } catch (error) {
      console.error("Error reversing voucher:", error);
      toast.error("Failed to reverse payment voucher");
    } finally {
      setActionLoading(false);
      setReversalDialogOpen(false);
      setReversalReason("");
    }
  };

  const handleCopyVoucherNo = () => {
    if (voucher?.VoucherNo) {
      navigator.clipboard.writeText(voucher.VoucherNo);
      toast.success("Voucher number copied to clipboard");
    }
  };

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "Not specified";
    try {
      return format(new Date(date), "dd MMM yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format currency
  const formatCurrency = (amount?: number, currencyCode?: string) => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: {
        variant: "secondary" as const,
        icon: FileText,
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      },
      Pending: {
        variant: "default" as const,
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      Paid: {
        variant: "default" as const,
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      },
      Rejected: {
        variant: "destructive" as const,
        icon: XCircle,
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      },
      Cancelled: {
        variant: "secondary" as const,
        icon: XCircle,
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      },
      Reversed: {
        variant: "secondary" as const,
        icon: RotateCcw,
        className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Render approval status badge
  const renderApprovalBadge = (status: string) => {
    const approvalConfig = {
      Pending: {
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      Approved: {
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      },
      Rejected: {
        icon: XCircle,
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      },
    };

    const config = approvalConfig[status as keyof typeof approvalConfig] || approvalConfig.Pending;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Render payment type badge
  const renderPaymentTypeBadge = (paymentType: string) => {
    const paymentTypeConfig = {
      Cash: {
        icon: HandCoins,
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
      },
      Cheque: {
        icon: FileText,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      },
      "Bank Transfer": {
        icon: Building,
        className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      },
      Online: {
        icon: CreditCard,
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
      },
      "Wire Transfer": {
        icon: Building,
        className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
      },
      "Credit Card": {
        icon: CreditCard,
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
      },
      "Debit Card": {
        icon: CreditCard,
        className: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800",
      },
    };

    const config = paymentTypeConfig[paymentType as keyof typeof paymentTypeConfig] || paymentTypeConfig.Cash;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {paymentType}
      </Badge>
    );
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getApprovalIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return CheckCircle;
      case "Rejected":
        return XCircle;
      case "Pending":
        return Clock;
      default:
        return AlertTriangle;
    }
  };

  // Calculate totals
  const totalDebits = lines.reduce((sum, line) => sum + (line.DebitAmount || 0), 0);

  // Determine available actions based on status
  const canEdit = canEditVoucher;
  const canDelete = canEditVoucher;
  const canSubmit = voucher?.PaymentStatus === "Draft";
  const canApprove = voucher?.PaymentStatus === "Pending" && isManager;
  const canReverse = voucher?.PaymentStatus === "Paid" && !voucher?.IsReversed;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl">Payment voucher not found</h2>
        <Button className="mt-4" onClick={() => navigate("/payment-vouchers")}>
          Back to payment vouchers
        </Button>
      </div>
    );
  }

  const ApprovalIcon = getApprovalIcon(voucher.ApprovalStatus || "Pending");

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => navigate("/payment-vouchers")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold">Payment Voucher {voucher.VoucherNo}</h1>
            <div className="ml-2 flex items-center gap-2">
              <Badge variant="outline" className="cursor-pointer" onClick={handleCopyVoucherNo}>
                <Copy className="h-3 w-3 mr-1" />
                {voucher.VoucherNo}
              </Badge>
              {renderStatusBadge(voucher.PaymentStatus || "Draft")}
              {voucher.RequiresApproval && (
                <Badge className={getApprovalStatusColor(voucher.ApprovalStatus || "Pending")}>
                  <ApprovalIcon className="h-3 w-3 mr-1" />
                  {voucher.ApprovalStatus || "Pending"}
                </Badge>
              )}
              {(isPaid || isReversed) && (
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                  <Lock className="h-3 w-3 mr-1" />
                  Protected
                </Badge>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            {/* PDF Generation Actions */}
            <div className="flex space-x-2 mr-2">
              <PdfActionButtons
                onDownload={handleGeneratePaymentVoucherSlip}
                onPreview={handlePreviewPaymentVoucherSlip}
                isLoading={paymentVoucherPdfReport.isLoading}
                downloadLabel="Download Payment Slip"
                previewLabel="Preview Payment Slip"
                variant="outline"
                size="default"
              />
            </div>

            {/* Approval Actions - Manager Only */}
            {isManager && voucher.RequiresApproval && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Approval Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {voucher.ApprovalStatus === "Pending" && (
                    <>
                      <DropdownMenuItem onClick={() => openApprovalDialog("approve")}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600 dark:text-green-500" />
                        Approve Voucher
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openApprovalDialog("reject")}>
                        <XCircle className="mr-2 h-4 w-4 text-red-600 dark:text-red-500" />
                        Reject Voucher
                      </DropdownMenuItem>
                    </>
                  )}
                  {voucher.ApprovalStatus !== "Pending" && (
                    <DropdownMenuItem onClick={handleResetApproval}>
                      <RotateCcw className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-500" />
                      Reset Approval
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!canEditVoucher}>
                  Change Status
                  <ChevronDown className="ml-2 h-4 w-4" />
                  {!canEditVoucher && <Lock className="ml-1 h-3 w-3" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {paymentStatusOptions
                  .filter((status) => status !== voucher.PaymentStatus)
                  .map((status) => (
                    <DropdownMenuItem key={status} onClick={() => openStatusChangeDialog(status)}>
                      Set as {status}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {canEdit ? (
              <Button variant="outline" onClick={handleEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" disabled onClick={handleEdit}>
                    <Lock className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Paid or reversed vouchers cannot be edited. Reverse the payment first if changes are needed.</p>
                </TooltipContent>
              </Tooltip>
            )}

            {canSubmit && (
              <Button onClick={() => setSubmitDialogOpen(true)}>
                <Send className="mr-2 h-4 w-4" />
                Submit for Approval
              </Button>
            )}

            {canReverse && (
              <Button variant="outline" onClick={() => setReversalDialogOpen(true)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reverse
              </Button>
            )}

            {canDelete ? (
              <Button variant="destructive" onClick={openDeleteDialog}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="destructive" disabled onClick={openDeleteDialog}>
                    <Lock className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Paid or reversed vouchers cannot be deleted. Reverse the payment first if deletion is needed.</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Approval Status Alert */}
        {voucher.RequiresApproval && (
          <Alert
            className={`border-l-4 ${
              voucher.ApprovalStatus === "Approved"
                ? "border-l-green-500 bg-green-50 dark:bg-green-900/20"
                : voucher.ApprovalStatus === "Rejected"
                ? "border-l-red-500 bg-red-50 dark:bg-red-900/20"
                : "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
            }`}
          >
            <ApprovalIcon className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Approval Status: {voucher.ApprovalStatus || "Pending"}</div>
              {voucher.ApprovalStatus === "Approved" && voucher.ApprovedByName && (
                <div className="text-sm text-muted-foreground mt-1">
                  Approved by {voucher.ApprovedByName} on {formatDate(voucher.ApprovedOn)}
                  {voucher.ApprovalComments && <div className="mt-1">Comments: {voucher.ApprovalComments}</div>}
                  <div className="mt-2 text-green-700 dark:text-green-400 font-medium flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    This voucher is ready for payment processing.
                  </div>
                </div>
              )}
              {voucher.ApprovalStatus === "Rejected" && voucher.RejectedByName && (
                <div className="text-sm text-muted-foreground mt-1">
                  Rejected by {voucher.RejectedByName} on {formatDate(voucher.RejectedOn)}
                  {voucher.RejectionReason && <div className="mt-1 text-red-700 dark:text-red-400">Reason: {voucher.RejectionReason}</div>}
                </div>
              )}
              {(!voucher.ApprovalStatus || voucher.ApprovalStatus === "Pending") && (
                <div className="text-sm text-muted-foreground mt-1">This voucher is awaiting approval from a manager.</div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Reversal Status Alert */}
        {voucher.IsReversed && (
          <Alert className="border-l-4 border-l-purple-500 bg-purple-50 dark:bg-purple-900/20">
            <RotateCcw className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">This payment voucher has been reversed</div>
              <div className="text-sm text-muted-foreground mt-1">
                {voucher.ReversedBy && (
                  <>
                    Reversed by {voucher.ReversedBy} on {formatDate(voucher.ReversedOn)}
                    {voucher.ReversalReason && <div className="mt-1">Reason: {voucher.ReversalReason}</div>}
                  </>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-[300px]">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="lines">Lines ({lines.length})</TabsTrigger>
            <TabsTrigger value="attachments">Attachments ({attachments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="mr-2 h-5 w-5 text-muted-foreground" />
                  Voucher Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Voucher Number</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-mono">{voucher.VoucherNo}</p>
                        <Button variant="ghost" size="sm" onClick={handleCopyVoucherNo}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Voucher Type</h3>
                      <p className="text-base">{voucher.VoucherType}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Transaction Date</h3>
                      <p className="text-base">{formatDate(voucher.TransactionDate)}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Posting Date</h3>
                      <p className="text-base">{formatDate(voucher.PostingDate)}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                      <div>{renderStatusBadge(voucher.PaymentStatus || "Draft")}</div>
                    </div>

                    {voucher.RequiresApproval && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Approval Status</h3>
                        <div>{renderApprovalBadge(voucher.ApprovalStatus || "Pending")}</div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Company</h3>
                      <p className="text-base font-medium">{voucher.CompanyName}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Fiscal Year</h3>
                      <p className="text-base">{voucher.FYDescription}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Currency</h3>
                      <p className="text-base">{voucher.CurrencyName}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Exchange Rate</h3>
                      <p className="text-base">{voucher.ExchangeRate || 1}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Payment Details</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Payment Type</h3>
                        {renderPaymentTypeBadge(voucher.PaymentType)}
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Payment Account</h3>
                        <p className="text-base">{voucher.PaymentAccountName || "—"}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
                        <p className="text-lg font-bold">{formatCurrency(voucher.TotalAmount, voucher.CurrencyName)}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Supplier</h3>
                        <p className="text-base">{voucher.SupplierName || "—"}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Paid To</h3>
                        <p className="text-base">{voucher.PaidTo || "—"}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Reference No</h3>
                        <p className="text-base">{voucher.RefNo || "—"}</p>
                      </div>
                    </div>
                  </div>

                  {voucher.PaymentType === PaymentType.CHEQUE && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Cheque Details</h3>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Cheque Number</h3>
                            <p className="text-base">{voucher.ChequeNo || "—"}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Cheque Date</h3>
                            <p className="text-base">{voucher.ChequeDate ? formatDate(voucher.ChequeDate) : "—"}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {(voucher.PaymentType === PaymentType.CHEQUE || voucher.PaymentType === PaymentType.BANK_TRANSFER) && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Bank Details</h3>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Bank</h3>
                          <p className="text-base">{voucher.BankName || "—"}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {(voucher.Description || voucher.Narration) && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      {voucher.Description && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                          <p className="text-base mt-1 bg-muted/20 dark:bg-muted/10 p-3 rounded-lg">{voucher.Description}</p>
                        </div>
                      )}
                      {voucher.Narration && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Narration</h3>
                          <p className="text-base mt-1 bg-muted/20 dark:bg-muted/10 p-3 rounded-lg">{voucher.Narration}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Cost Centers */}
                {(voucher.CostCenter1Name || voucher.CostCenter2Name || voucher.CostCenter3Name || voucher.CostCenter4Name) && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Network className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Cost Centers</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {voucher.CostCenter1Name && (
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Level 1:</span>
                            <p className="text-sm">{voucher.CostCenter1Name}</p>
                          </div>
                        )}
                        {voucher.CostCenter2Name && (
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Level 2:</span>
                            <p className="text-sm">{voucher.CostCenter2Name}</p>
                          </div>
                        )}
                        {voucher.CostCenter3Name && (
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Level 3:</span>
                            <p className="text-sm">{voucher.CostCenter3Name}</p>
                          </div>
                        )}
                        {voucher.CostCenter4Name && (
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Level 4:</span>
                            <p className="text-sm">{voucher.CostCenter4Name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Created By</div>
                    <div>
                      {voucher.CreatedBy} {voucher.CreatedOn && <span>on {formatDate(voucher.CreatedOn)}</span>}
                    </div>
                  </div>
                  {voucher.UpdatedBy && (
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Last Updated By</div>
                      <div>
                        {voucher.UpdatedBy} {voucher.UpdatedOn && <span>on {formatDate(voucher.UpdatedOn)}</span>}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lines" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <HandCoins className="mr-2 h-5 w-5 text-muted-foreground" />
                  Voucher Lines
                </CardTitle>
                {canEditVoucher ? (
                  <Button variant="outline" size="sm" disabled>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Line
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" disabled>
                        <Lock className="mr-2 h-4 w-4" />
                        Add Line
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cannot modify paid or reversed vouchers</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardHeader>
              <CardContent>
                {lines.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Cost Centers</TableHead>
                          <TableHead>Customer/Supplier</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lines.map((line, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{line.AccountName}</div>
                                <div className="text-sm text-muted-foreground">{line.AccountCode}</div>
                              </div>
                            </TableCell>
                            <TableCell>{line.LineDescription || "—"}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(line.DebitAmount, voucher.CurrencyName)}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {line.CostCenter1Name && <div className="text-xs">CC1: {line.CostCenter1Name}</div>}
                                {line.CostCenter2Name && <div className="text-xs">CC2: {line.CostCenter2Name}</div>}
                                {line.CostCenter3Name && <div className="text-xs">CC3: {line.CostCenter3Name}</div>}
                                {line.CostCenter4Name && <div className="text-xs">CC4: {line.CostCenter4Name}</div>}
                                {!line.CostCenter1Name && !line.CostCenter2Name && !line.CostCenter3Name && !line.CostCenter4Name && "—"}
                              </div>
                            </TableCell>
                            <TableCell>
                              {line.CustomerFullName && <div>Customer: {line.CustomerFullName}</div>}
                              {line.SupplierName && <div>Supplier: {line.SupplierName}</div>}
                              {!line.CustomerFullName && !line.SupplierName && "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold bg-muted/20 dark:bg-muted/10">
                          <TableCell colSpan={2}>Total</TableCell>
                          <TableCell className="text-right">{formatCurrency(totalDebits, voucher.CurrencyName)}</TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No lines have been added to this voucher.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                  Supporting Documents
                </CardTitle>
                {canEditVoucher ? (
                  <Button variant="outline" size="sm" disabled>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Document
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" disabled>
                        <Lock className="mr-2 h-4 w-4" />
                        Add Document
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cannot modify paid or reversed vouchers</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardHeader>
              <CardContent>
                {attachments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900/20 rounded-md">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No documents have been attached to this voucher.</p>
                    {canEditVoucher ? (
                      <Button variant="outline" disabled>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Document
                      </Button>
                    ) : (
                      <Button variant="outline" disabled>
                        <Lock className="mr-2 h-4 w-4" />
                        Protected
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end mb-4">
                      <Button variant="outline" onClick={() => openAttachmentGallery()}>
                        <FileText className="mr-2 h-4 w-4" />
                        View All Documents
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {attachments.map((attachment) => (
                        <Card key={attachment.PostingAttachmentID} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <AttachmentThumbnail
                                fileUrl={attachment.fileUrl}
                                fileName={attachment.DocumentName || "Document"}
                                fileType={attachment.FileContentType}
                                onClick={() => attachment.fileUrl && openAttachmentPreview(attachment)}
                              />
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center">
                                  <span className="font-medium">{attachment.DocumentName}</span>
                                  {attachment.DocTypeName && (
                                    <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400">
                                      {attachment.DocTypeName}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm space-y-1">
                                  {attachment.UploadedDate && (
                                    <div className="flex items-center text-muted-foreground">
                                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                      Uploaded: {formatDate(attachment.UploadedDate)}
                                    </div>
                                  )}
                                  {attachment.DocumentDescription && <div className="text-muted-foreground mt-1">{attachment.DocumentDescription}</div>}
                                </div>

                                {attachment.fileUrl && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Button variant="outline" size="sm" onClick={() => openAttachmentGallery(attachment.PostingAttachmentID)} className="h-8 px-3">
                                      <FileTypeIcon fileName={attachment.DocumentName || "Document"} fileType={attachment.FileContentType} size={14} className="mr-1.5" />
                                      Preview
                                    </Button>
                                    <a
                                      href={attachment.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download={attachment.DocumentName}
                                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                                    >
                                      <Download className="h-3.5 w-3.5 mr-1.5" />
                                      Download
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* PDF Preview Modal */}
        <PdfPreviewModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          pdfBlob={paymentVoucherPdfReport.data}
          title={`Payment Voucher Slip - ${voucher.VoucherNo}`}
          isLoading={paymentVoucherPdfReport.isLoading}
          error={paymentVoucherPdfReport.error}
          onDownload={() => paymentVoucherPdfReport.downloadCurrentPdf(`Payment_Voucher_Slip_${voucher.VoucherNo}.pdf`)}
          onRefresh={handlePreviewPaymentVoucherSlip}
        />

        {/* Approval Dialog */}
        <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{approvalAction === ApprovalAction.APPROVE ? "Approve Payment Voucher" : "Reject Payment Voucher"}</DialogTitle>
              <DialogDescription>
                {approvalAction === ApprovalAction.APPROVE
                  ? "Approve this payment voucher to allow payment processing. Note: Once approved, the voucher will be ready for payment."
                  : "Reject this payment voucher with a reason."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {approvalAction === ApprovalAction.APPROVE && (
                <div className="space-y-2">
                  <Label htmlFor="approvalComments">Approval Comments (Optional)</Label>
                  <Textarea
                    id="approvalComments"
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    placeholder="Enter any comments about the approval"
                    rows={3}
                  />
                </div>
              )}
              {approvalAction === ApprovalAction.REJECT && (
                <div className="space-y-2">
                  <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                  <Textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter the reason for rejection"
                    rows={3}
                    required
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeApprovalDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleApprovalAction}
                disabled={actionLoading || (approvalAction === ApprovalAction.REJECT && !rejectionReason.trim())}
                variant={approvalAction === ApprovalAction.REJECT ? "destructive" : "default"}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {approvalAction === ApprovalAction.APPROVE && <CheckCircle className="mr-2 h-4 w-4" />}
                    {approvalAction === ApprovalAction.REJECT && <XCircle className="mr-2 h-4 w-4" />}
                    {approvalAction === ApprovalAction.APPROVE ? "Approve" : "Reject"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={handleDelete}
          title="Delete Payment Voucher"
          description={`Are you sure you want to delete payment voucher "${voucher.VoucherNo}"? This action cannot be undone.`}
          cancelText="Cancel"
          confirmText="Delete"
          type="danger"
        />

        {/* Status Change Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={statusChangeDialogOpen}
          onClose={closeStatusChangeDialog}
          onConfirm={handleStatusChange}
          title="Change Payment Voucher Status"
          description={`Are you sure you want to change the status of payment voucher "${voucher.VoucherNo}" to "${selectedStatus}"?`}
          cancelText="Cancel"
          confirmText="Change Status"
          type="warning"
        />

        {/* Submit for Approval Dialog */}
        <ConfirmationDialog
          isOpen={submitDialogOpen}
          onClose={() => setSubmitDialogOpen(false)}
          onConfirm={handleSubmitForApproval}
          title="Submit for Approval"
          description={`Are you sure you want to submit payment voucher "${voucher.VoucherNo}" for approval?`}
          confirmText="Submit"
          cancelText="Cancel"
          type="info"
        />

        {/* Reversal Dialog */}
        <Dialog open={reversalDialogOpen} onOpenChange={setReversalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reverse Payment Voucher</DialogTitle>
              <DialogDescription>Are you sure you want to reverse payment voucher "{voucher.VoucherNo}"? This will create a reversal entry.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reversal-reason">Reversal Reason *</Label>
                <Textarea id="reversal-reason" placeholder="Enter reason for reversal" value={reversalReason} onChange={(e) => setReversalReason(e.target.value)} required />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReversalDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleReversal} disabled={actionLoading || !reversalReason.trim()} variant="destructive">
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reverse
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Attachment Preview Dialog */}
        {previewAttachment && (
          <AttachmentPreview
            isOpen={previewOpen}
            onClose={() => setPreviewOpen(false)}
            fileUrl={previewAttachment.fileUrl}
            fileName={previewAttachment.DocumentName || "Document"}
            fileType={previewAttachment.FileContentType}
            fileSize={previewAttachment.FileSize}
            uploadDate={previewAttachment.UploadedDate}
            uploadedBy={previewAttachment.UploadedByUserName}
            description={previewAttachment.DocumentDescription}
            documentType={previewAttachment.DocTypeName}
          />
        )}

        {/* Attachment Gallery Dialog */}
        {attachments.length > 0 && (
          <AttachmentGallery isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} attachments={attachments} initialAttachmentId={initialAttachmentId} />
        )}
      </div>
    </TooltipProvider>
  );
};

export default PaymentVoucherDetails;
