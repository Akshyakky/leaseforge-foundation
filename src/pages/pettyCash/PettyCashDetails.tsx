// src/pages/pettyCash/PettyCashDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { pettyCashService } from "@/services/pettyCashService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Receipt,
  Calendar,
  FileText,
  Download,
  RotateCcw,
  Send,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  Loader2,
  Lock,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { PettyCashVoucher, PettyCashVoucherLine, PettyCashAttachment, VoucherStatus, ApprovalStatus, ApprovalAction, TransactionType } from "@/types/pettyCashTypes";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AttachmentPreview } from "@/components/attachments/AttachmentPreview";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { AttachmentThumbnail } from "@/components/attachments/AttachmentThumbnail";
import { FileTypeIcon } from "@/components/attachments/FileTypeIcon";

// PDF Report Components
import { PdfPreviewModal, PdfActionButtons } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";
import { useAppSelector } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const PettyCashDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [voucher, setVoucher] = useState<PettyCashVoucher | null>(null);
  const [lines, setLines] = useState<PettyCashVoucherLine[]>([]);
  const [attachments, setAttachments] = useState<PettyCashAttachment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [reversalDialogOpen, setReversalDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [resetApprovalDialogOpen, setResetApprovalDialogOpen] = useState(false);

  // PDF generation state
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const pettyCashPdfReport = useGenericPdfReport();

  // Form states
  const [approvalAction, setApprovalAction] = useState<ApprovalAction>(ApprovalAction.APPROVE);
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [reversalReason, setReversalReason] = useState("");

  // Loading states for actions
  const [actionLoading, setActionLoading] = useState(false);

  // Attachment-related state
  const [previewAttachment, setPreviewAttachment] = useState<PettyCashAttachment | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialAttachmentId, setInitialAttachmentId] = useState<number | undefined>(undefined);

  // Check if user is manager
  const isManager = user?.role === "admin" || user?.role === "manager";

  // Check if voucher can be edited
  const canEditVoucher = voucher && (voucher.PostingStatus === VoucherStatus.DRAFT || voucher.PostingStatus === VoucherStatus.PENDING);
  const isApproved = voucher?.ApprovalStatus === ApprovalStatus.APPROVED;
  const isPosted = voucher?.PostingStatus === VoucherStatus.POSTED;

  useEffect(() => {
    const fetchVoucherData = async () => {
      if (!id) {
        navigate("/petty-cash");
        return;
      }

      setLoading(true);
      try {
        const voucherData = await pettyCashService.getVoucherByNumber(id);

        if (voucherData.voucher) {
          setVoucher(voucherData.voucher);
          setLines(voucherData.lines);
          setAttachments(voucherData.attachments);
        } else {
          setError("Voucher not found");
          toast.error("Voucher not found");
          navigate("/petty-cash");
        }
      } catch (err) {
        console.error("Error fetching voucher:", err);
        setError("Failed to load voucher details");
        toast.error("Failed to load voucher details");
        navigate("/petty-cash");
      } finally {
        setLoading(false);
      }
    };

    fetchVoucherData();
  }, [id, navigate]);

  // PDF Generation Handlers
  const handleGeneratePettyCashSlip = async () => {
    if (!voucher) return;

    const response = await pettyCashPdfReport.generateReport(
      "petty-cash-slip",
      { VoucherNo: voucher.VoucherNo },
      {
        orientation: "Portrait",
        download: true,
        showToast: true,
        filename: `Petty_Cash_Slip_${voucher.VoucherNo}_${new Date().toISOString().split("T")[0]}.pdf`,
      }
    );

    if (response.success) {
      toast.success("Petty cash slip generated successfully");
    }
  };

  const handlePreviewPettyCashSlip = async () => {
    if (!voucher) return;

    setShowPdfPreview(true);
    const response = await pettyCashPdfReport.generateReport(
      "petty-cash-slip",
      { VoucherNo: voucher.VoucherNo },
      {
        orientation: "Portrait",
        download: false,
        showToast: false,
      }
    );

    if (!response.success) {
      toast.error("Failed to generate petty cash slip preview");
    }
  };

  // Attachment handlers
  const openAttachmentPreview = (attachment: PettyCashAttachment) => {
    setPreviewAttachment(attachment);
    setPreviewOpen(true);
  };

  const openAttachmentGallery = (attachmentId?: number) => {
    setInitialAttachmentId(attachmentId);
    setGalleryOpen(true);
  };

  // Format date for display
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format currency
  const formatCurrency = (amount?: number, currencyCode?: string) => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED", //currencyCode ||
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      [VoucherStatus.DRAFT]: {
        variant: "secondary" as const,
        icon: FileText,
        className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
      },
      [VoucherStatus.PENDING]: {
        variant: "default" as const,
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      [VoucherStatus.POSTED]: {
        variant: "default" as const,
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      },
      [VoucherStatus.REJECTED]: {
        variant: "destructive" as const,
        icon: XCircle,
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      },
      [VoucherStatus.REVERSED]: {
        variant: "secondary" as const,
        icon: XCircle,
        className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[VoucherStatus.DRAFT];
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
      [ApprovalStatus.PENDING]: {
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      [ApprovalStatus.APPROVED]: {
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      },
      [ApprovalStatus.REJECTED]: {
        icon: XCircle,
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      },
    };

    const config = approvalConfig[status as keyof typeof approvalConfig] || approvalConfig[ApprovalStatus.PENDING];
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getApprovalIcon = (status: string) => {
    switch (status) {
      case ApprovalStatus.APPROVED:
        return CheckCircle;
      case ApprovalStatus.REJECTED:
        return XCircle;
      case ApprovalStatus.PENDING:
        return Clock;
      default:
        return AlertTriangle;
    }
  };

  // Action handlers
  const handleEdit = () => {
    if (!voucher) return;

    if (!canEditVoucher) {
      toast.error("Cannot edit posted or reversed vouchers.");
      return;
    }

    navigate(`/petty-cash/edit/${voucher.VoucherNo}`);
  };

  const openDeleteDialog = () => {
    if (!canEditVoucher) {
      toast.error("Cannot delete posted or reversed vouchers.");
      return;
    }
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!voucher) return;

    setActionLoading(true);
    try {
      const result = await pettyCashService.deleteVoucher(voucher.VoucherNo, voucher.CompanyID);
      if (result.success) {
        toast.success("Voucher deleted successfully");
        navigate("/petty-cash");
      } else {
        toast.error(result.message || "Failed to delete voucher");
      }
    } catch (err) {
      console.error("Error deleting voucher:", err);
      toast.error("Failed to delete voucher");
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!voucher) return;

    setActionLoading(true);
    try {
      const result = await pettyCashService.submitForApproval(voucher.VoucherNo, voucher.CompanyID);
      if (result.success) {
        toast.success("Voucher submitted for approval successfully");
        // Refresh voucher data
        const voucherData = await pettyCashService.getVoucherByNumber(voucher.VoucherNo);
        if (voucherData.voucher) {
          setVoucher(voucherData.voucher);
        }
      } else {
        toast.error(result.message || "Failed to submit voucher for approval");
      }
    } catch (err) {
      console.error("Error submitting voucher:", err);
      toast.error("Failed to submit voucher for approval");
    } finally {
      setActionLoading(false);
      setSubmitDialogOpen(false);
    }
  };

  // Approval handlers
  const openApprovalDialog = (action: "approve" | "reject") => {
    setApprovalAction(action === "approve" ? ApprovalAction.APPROVE : ApprovalAction.REJECT);
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
      const result = await pettyCashService.approveOrRejectVoucher(voucher.VoucherNo, voucher.CompanyID, approvalAction, comments.trim() || undefined);

      if (result.success) {
        // Refresh voucher data
        const voucherData = await pettyCashService.getVoucherByNumber(voucher.VoucherNo);
        if (voucherData.voucher) {
          setVoucher(voucherData.voucher);
        }

        const actionText = approvalAction === ApprovalAction.APPROVE ? "approved" : "rejected";
        toast.success(`Voucher ${actionText} successfully`);
      } else {
        toast.error(result.message || `Failed to ${approvalAction.toLowerCase()} voucher`);
      }
    } catch (err) {
      console.error("Error processing approval:", err);
      toast.error(`Failed to ${approvalAction.toLowerCase()} voucher`);
    } finally {
      setActionLoading(false);
      closeApprovalDialog();
    }
  };

  const handleResetApproval = async () => {
    if (!voucher || !isManager) return;

    setActionLoading(true);
    try {
      const result = await pettyCashService.resetApprovalStatus(voucher.VoucherNo, voucher.CompanyID);

      if (result.success) {
        // Refresh voucher data
        const voucherData = await pettyCashService.getVoucherByNumber(voucher.VoucherNo);
        if (voucherData.voucher) {
          setVoucher(voucherData.voucher);
        }

        toast.success("Approval status reset successfully");
      } else {
        toast.error(result.message || "Failed to reset approval status");
      }
    } catch (err) {
      console.error("Error resetting approval:", err);
      toast.error("Failed to reset approval status");
    } finally {
      setActionLoading(false);
      setResetApprovalDialogOpen(false);
    }
  };

  const handleReversal = async () => {
    if (!voucher || !reversalReason.trim()) {
      toast.error("Reversal reason is required");
      return;
    }

    setActionLoading(true);
    try {
      const result = await pettyCashService.reverseVoucher(voucher.VoucherNo, voucher.CompanyID, reversalReason.trim());

      if (result.success) {
        toast.success("Voucher reversed successfully");
        if (result.reversalVoucherNo) {
          toast.info(`Reversal voucher created: ${result.reversalVoucherNo}`);
        }
        // Refresh voucher data
        const voucherData = await pettyCashService.getVoucherByNumber(voucher.VoucherNo);
        if (voucherData.voucher) {
          setVoucher(voucherData.voucher);
        }
      } else {
        toast.error(result.message || "Failed to reverse voucher");
      }
    } catch (err) {
      console.error("Error reversing voucher:", err);
      toast.error("Failed to reverse voucher");
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

  // Calculate totals
  const totalDebits = lines.reduce((sum, line) => sum + (line.DebitAmount || 0), 0);
  const totalCredits = lines.reduce((sum, line) => sum + (line.CreditAmount || 0), 0);

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
        <h2 className="text-xl">{error || "Voucher not found"}</h2>
        <Button className="mt-4" onClick={() => navigate("/petty-cash")}>
          Back to vouchers
        </Button>
      </div>
    );
  }

  // Determine available actions based on status
  const canSubmit = voucher.PostingStatus === VoucherStatus.DRAFT;
  const canApprove = isManager && voucher.PostingStatus === VoucherStatus.PENDING && voucher.ApprovalStatus === ApprovalStatus.PENDING;
  const canReverse = isManager && voucher.PostingStatus === VoucherStatus.POSTED && !voucher.IsReversed;
  const canDelete = canEditVoucher;

  const ApprovalIcon = getApprovalIcon(voucher.ApprovalStatus || ApprovalStatus.PENDING);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => navigate("/petty-cash")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold">Petty Cash Voucher {voucher.VoucherNo}</h1>
            <div className="ml-2 flex items-center gap-2">
              <Badge variant="outline" className="cursor-pointer" onClick={handleCopyVoucherNo}>
                <Copy className="h-3 w-3 mr-1" />
                {voucher.VoucherNo}
              </Badge>
              {renderStatusBadge(voucher.PostingStatus || VoucherStatus.DRAFT)}
              {voucher.RequiresApproval && (
                <Badge
                  className={cn(
                    voucher.ApprovalStatus === ApprovalStatus.APPROVED
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : voucher.ApprovalStatus === ApprovalStatus.REJECTED
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  )}
                >
                  <ApprovalIcon className="h-3 w-3 mr-1" />
                  {voucher.ApprovalStatus}
                </Badge>
              )}
              {isPosted && !voucher.IsReversed && (
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                  <Shield className="h-3 w-3 mr-1" />
                  Posted
                </Badge>
              )}
              {voucher.IsReversed && (
                <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reversed
                </Badge>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            {/* PDF Generation Actions */}
            <div className="flex space-x-2 mr-2">
              <PdfActionButtons
                onDownload={handleGeneratePettyCashSlip}
                onPreview={handlePreviewPettyCashSlip}
                isLoading={pettyCashPdfReport.isLoading}
                downloadLabel="Download Voucher Slip"
                previewLabel="Preview Voucher Slip"
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
                  {voucher.ApprovalStatus === ApprovalStatus.PENDING && (
                    <>
                      <DropdownMenuItem onClick={() => openApprovalDialog("approve")}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                        Approve Voucher
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openApprovalDialog("reject")}>
                        <XCircle className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
                        Reject Voucher
                      </DropdownMenuItem>
                    </>
                  )}
                  {voucher.ApprovalStatus !== ApprovalStatus.PENDING && (
                    <DropdownMenuItem onClick={() => setResetApprovalDialogOpen(true)}>
                      <RotateCcw className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                      Reset Approval
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {canEditVoucher ? (
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
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
                  <p>Cannot edit posted or reversed vouchers.</p>
                </TooltipContent>
              </Tooltip>
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
                  <p>Cannot delete posted or reversed vouchers.</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Approval Status Alert */}
        {voucher.RequiresApproval && (
          <Alert
            className={cn(
              "border-l-4",
              voucher.ApprovalStatus === ApprovalStatus.APPROVED
                ? "border-l-green-500 bg-green-50 dark:bg-green-900/20"
                : voucher.ApprovalStatus === ApprovalStatus.REJECTED
                ? "border-l-red-500 bg-red-50 dark:bg-red-900/20"
                : "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
            )}
          >
            <ApprovalIcon className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Approval Status: {voucher.ApprovalStatus}</div>
              {voucher.ApprovalStatus === ApprovalStatus.APPROVED && voucher.ApprovedBy && (
                <div className="text-sm text-muted-foreground mt-1">
                  Approved by {voucher.ApprovedByName || `User ${voucher.ApprovedBy}`} on {formatDate(voucher.ApprovedOn)}
                  {voucher.ApprovalComments && <div className="mt-1">Comments: {voucher.ApprovalComments}</div>}
                </div>
              )}
              {voucher.ApprovalStatus === ApprovalStatus.REJECTED && voucher.RejectedBy && (
                <div className="text-sm text-muted-foreground mt-1">
                  Rejected by {voucher.RejectedByName || `User ${voucher.RejectedBy}`} on {formatDate(voucher.RejectedOn)}
                  {voucher.RejectionReason && <div className="mt-1 text-red-700 dark:text-red-400">Reason: {voucher.RejectionReason}</div>}
                </div>
              )}
              {voucher.ApprovalStatus === ApprovalStatus.PENDING && <div className="text-sm text-muted-foreground mt-1">This voucher is awaiting approval from a manager.</div>}
            </AlertDescription>
          </Alert>
        )}

        {/* Reversal Status Alert */}
        {voucher.IsReversed && (
          <Alert className="border-l-4 border-l-purple-500 bg-purple-50 dark:bg-purple-900/20">
            <RotateCcw className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">This voucher has been reversed</div>
              {voucher.ReversedBy && (
                <div className="text-sm text-muted-foreground mt-1">
                  Reversed by {voucher.ReversedBy || `User ${voucher.ReversedBy}`} on {formatDate(voucher.ReversedOn)}
                  {voucher.ReversalReason && <div className="mt-1">Reason: {voucher.ReversalReason}</div>}
                </div>
              )}
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
                      <p className="text-base">{voucher.VoucherType || "Petty Cash"}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                      <div className="mt-1">{renderStatusBadge(voucher.PostingStatus || VoucherStatus.DRAFT)}</div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Transaction Date</h3>
                      <p className="text-base">{formatDate(voucher.TransactionDate)}</p>
                    </div>

                    {voucher.PostingDate && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Posting Date</h3>
                        <p className="text-base">{formatDate(voucher.PostingDate)}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Company</h3>
                      <p className="text-base font-medium">{voucher.CompanyName || `Company ${voucher.CompanyID}`}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Fiscal Year</h3>
                      <p className="text-base">{voucher.FYDescription || `FY ${voucher.FiscalYearID}`}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Currency</h3>
                      <p className="text-base">{voucher.CurrencyName || "USD"}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Exchange Rate</h3>
                      <p className="text-base">{voucher.ExchangeRate || 1}</p>
                    </div>

                    {voucher.RequiresApproval && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Approval Status</h3>
                        <div className="mt-1">{renderApprovalBadge(voucher.ApprovalStatus || ApprovalStatus.PENDING)}</div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                      <p className="text-base">{voucher.Description || "—"}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Paid To</h3>
                      <p className="text-base">{voucher.PaidTo || "—"}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Invoice Number</h3>
                      <p className="text-base">{voucher.InvoiceNo || "—"}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Reference Number</h3>
                      <p className="text-base">{voucher.RefNo || "—"}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Cheque Number</h3>
                      <p className="text-base">{voucher.ChequeNo || "—"}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Cheque Date</h3>
                      <p className="text-base">{voucher.ChequeDate ? formatDate(voucher.ChequeDate) : "—"}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Bank</h3>
                      <p className="text-base">{voucher.BankName || "—"}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
                      <p className="text-lg font-bold">{formatCurrency(totalDebits, voucher.CurrencyName)}</p>
                    </div>
                  </div>
                </div>

                {voucher.Narration && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Narration</h3>
                      <p className="text-base mt-1 bg-muted/50 p-3 rounded-lg">{voucher.Narration}</p>
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
                  <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                  Voucher Lines
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Total: {formatCurrency(totalDebits, voucher.CurrencyName)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {lines.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
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
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(line.TransactionType === TransactionType.DEBIT ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400")}
                              >
                                {line.TransactionType}
                              </Badge>
                            </TableCell>
                            <TableCell>{line.LineDescription || "—"}</TableCell>
                            <TableCell className="text-right font-medium">
                              {line.DebitAmount && line.DebitAmount > 0 ? formatCurrency(line.DebitAmount, voucher.CurrencyName) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {line.CreditAmount && line.CreditAmount > 0 ? formatCurrency(line.CreditAmount, voucher.CurrencyName) : "—"}
                            </TableCell>
                            <TableCell>
                              {line.CustomerFullName && <div className="text-sm">Customer: {line.CustomerFullName}</div>}
                              {line.SupplierName && <div className="text-sm">Supplier: {line.SupplierName}</div>}
                              {!line.CustomerFullName && !line.SupplierName && "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Totals Row */}
                        <TableRow className="font-semibold bg-muted/50 border-t-2">
                          <TableCell colSpan={3}>Total</TableCell>
                          <TableCell className="text-right">{formatCurrency(totalDebits, voucher.CurrencyName)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(totalCredits, voucher.CurrencyName)}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No voucher lines found.</div>
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
              </CardHeader>
              <CardContent>
                {attachments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-muted/10 rounded-md">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No documents have been attached to this voucher.</p>
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
                                  {attachment.IsRequired && (
                                    <Badge variant="secondary" className="ml-2">
                                      Required
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

        {/* Action Buttons */}
        <Card>
          <CardContent className="flex flex-wrap justify-center gap-2 pt-6">
            {canSubmit && (
              <Button onClick={() => setSubmitDialogOpen(true)}>
                <Send className="mr-2 h-4 w-4" />
                Submit for Approval
              </Button>
            )}
            {canReverse && (
              <Button variant="outline" onClick={() => setReversalDialogOpen(true)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reverse Voucher
              </Button>
            )}
          </CardContent>
        </Card>

        {/* PDF Preview Modal */}
        <PdfPreviewModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          pdfBlob={pettyCashPdfReport.data}
          title={`Petty Cash Voucher Slip - ${voucher.VoucherNo}`}
          isLoading={pettyCashPdfReport.isLoading}
          error={pettyCashPdfReport.error}
          onDownload={() => pettyCashPdfReport.downloadCurrentPdf(`Petty_Cash_Slip_${voucher.VoucherNo}.pdf`)}
          onRefresh={handlePreviewPettyCashSlip}
        />

        {/* Approval Dialog */}
        <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{approvalAction === ApprovalAction.APPROVE ? "Approve Voucher" : "Reject Voucher"}</DialogTitle>
              <DialogDescription>{approvalAction === ApprovalAction.APPROVE ? "Approve this voucher to allow posting." : "Reject this voucher with a reason."}</DialogDescription>
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

        {/* Reset Approval Dialog */}
        <ConfirmationDialog
          isOpen={resetApprovalDialogOpen}
          onClose={() => setResetApprovalDialogOpen(false)}
          onConfirm={handleResetApproval}
          title="Reset Approval Status"
          description={`Are you sure you want to reset the approval status of voucher "${voucher.VoucherNo}" to pending?`}
          cancelText="Cancel"
          confirmText="Reset"
          type="warning"
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title="Delete Voucher"
          description={`Are you sure you want to delete voucher "${voucher.VoucherNo}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />

        {/* Submit for Approval Dialog */}
        <ConfirmationDialog
          isOpen={submitDialogOpen}
          onClose={() => setSubmitDialogOpen(false)}
          onConfirm={handleSubmitForApproval}
          title="Submit for Approval"
          description={`Are you sure you want to submit voucher "${voucher.VoucherNo}" for approval?`}
          confirmText="Submit"
          cancelText="Cancel"
          type="info"
        />

        {/* Reversal Dialog */}
        <Dialog open={reversalDialogOpen} onOpenChange={setReversalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reverse Voucher</DialogTitle>
              <DialogDescription>Are you sure you want to reverse voucher "{voucher.VoucherNo}"? This will create a reversal entry.</DialogDescription>
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

export default PettyCashDetails;
