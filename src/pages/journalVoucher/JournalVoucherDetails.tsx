// src/pages/journalVoucher/JournalVoucherDetails.tsx - Corrected according to types and service
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Receipt,
  Calendar,
  Building2,
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Send,
  Printer,
  Copy,
  AlertCircle,
  AlertTriangle,
  User,
  HandCoins,
  Network,
  CreditCard,
  Building,
  ChevronDown,
  Loader2,
  Lock,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAppSelector } from "@/lib/hooks";

// PDF Report Components
import { PdfPreviewModal, PdfActionButtons } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";

// Attachment components
import { AttachmentPreview } from "@/components/attachments/AttachmentPreview";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { AttachmentThumbnail } from "@/components/attachments/AttachmentThumbnail";
import { FileTypeIcon } from "@/components/attachments/FileTypeIcon";
import { ApprovalAction, JournalVoucher, JournalVoucherAttachment, JournalVoucherLine } from "@/types/journalVoucherTypes";
import { journalVoucherService } from "@/services/journalVoucherService";

const JournalVoucherDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [voucher, setVoucher] = useState<JournalVoucher | null>(null);
  const [lines, setLines] = useState<JournalVoucherLine[]>([]);
  const [attachments, setAttachments] = useState<JournalVoucherAttachment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isReversalDialogOpen, setIsReversalDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  // PDF generation state
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const journalVoucherPdfReport = useGenericPdfReport();

  // Approval-related state
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | "reset">("approve");
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);

  // Reversal state
  const [reversalReason, setReversalReason] = useState("");

  // Attachment-related state
  const [previewAttachment, setPreviewAttachment] = useState<JournalVoucherAttachment | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialAttachmentId, setInitialAttachmentId] = useState<number | undefined>(undefined);

  // Loading states for actions
  const [actionLoading, setActionLoading] = useState(false);

  // Check if user is manager
  const isManager = user?.role === "admin" || user?.role === "manager";

  // Check if voucher can be edited
  const canEditVoucher = voucher && journalVoucherService.canEditVoucher(voucher);
  const isApproved = voucher?.ApprovalStatus === "Approved";
  const isPosted = voucher?.PostingStatus === "Posted";

  useEffect(() => {
    const fetchVoucherDetails = async () => {
      if (!id) {
        navigate("/journal-vouchers");
        return;
      }

      try {
        setLoading(true);
        const data = await journalVoucherService.getJournalVoucherByNumber(id);

        if (data.voucher) {
          setVoucher(data.voucher);
          setLines(data.lines);
          setAttachments(data.attachments);
        } else {
          toast.error("Journal voucher not found");
          navigate("/journal-vouchers");
        }
      } catch (error) {
        console.error("Error fetching voucher:", error);
        toast.error("Failed to load journal voucher data");
        navigate("/journal-vouchers");
      } finally {
        setLoading(false);
      }
    };

    fetchVoucherDetails();
  }, [id, navigate]);

  // PDF Generation Handlers
  const handleGenerateJournalVoucherSlip = async () => {
    if (!voucher) return;

    const response = await journalVoucherPdfReport.generateReport(
      "journal-voucher-slip",
      { VoucherNo: voucher.VoucherNo, CompanyID: voucher.CompanyID },
      {
        orientation: "Portrait",
        download: true,
        showToast: true,
        filename: `Journal_Voucher_Slip_${voucher.VoucherNo}_${new Date().toISOString().split("T")[0]}.pdf`,
      }
    );

    if (response.success) {
      toast.success("Journal voucher slip generated successfully");
    }
  };

  const handlePreviewJournalVoucherSlip = async () => {
    if (!voucher) return;

    setShowPdfPreview(true);
    const response = await journalVoucherPdfReport.generateReport(
      "journal-voucher-slip",
      { VoucherNo: voucher.VoucherNo, CompanyID: voucher.CompanyID },
      {
        orientation: "Portrait",
        download: false,
        showToast: false,
      }
    );

    if (!response.success) {
      toast.error("Failed to generate journal voucher slip preview");
    }
  };

  // Approval handlers
  const openApprovalDialog = (action: "approve" | "reject" | "reset") => {
    setApprovalAction(action);
    setApprovalComments("");
    setRejectionReason("");
    setIsApprovalDialogOpen(true);
  };

  const closeApprovalDialog = () => {
    setIsApprovalDialogOpen(false);
    setApprovalComments("");
    setRejectionReason("");
  };

  const handleApprovalAction = async () => {
    if (!voucher || !isManager) return;

    if (approvalAction === "reject" && !rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    setApprovalLoading(true);

    try {
      let response;

      switch (approvalAction) {
        case "approve":
          response = await journalVoucherService.approveOrRejectJournalVoucher(voucher.VoucherNo, voucher.CompanyID, ApprovalAction.APPROVE, approvalComments.trim() || undefined);
          break;
        case "reject":
          response = await journalVoucherService.approveOrRejectJournalVoucher(voucher.VoucherNo, voucher.CompanyID, ApprovalAction.REJECT, rejectionReason.trim());
          break;
        case "reset":
          response = await journalVoucherService.resetJournalVoucherApprovalStatus(voucher.VoucherNo, voucher.CompanyID);
          break;
        default:
          return;
      }

      if (response.success) {
        // Refresh voucher data
        const data = await journalVoucherService.getJournalVoucherByNumber(voucher.VoucherNo);
        if (data.voucher) {
          setVoucher(data.voucher);
        }

        const actionText = approvalAction === "approve" ? "approved" : approvalAction === "reject" ? "rejected" : "reset";
        toast.success(`Journal voucher ${actionText} successfully`);
      } else {
        toast.error(response.message || `Failed to ${approvalAction} journal voucher`);
      }
    } catch (error) {
      console.error(`Error ${approvalAction}ing voucher:`, error);
      toast.error(`Failed to ${approvalAction} journal voucher`);
    } finally {
      setApprovalLoading(false);
      closeApprovalDialog();
    }
  };

  // Attachment handlers
  const openAttachmentPreview = (attachment: JournalVoucherAttachment) => {
    setPreviewAttachment(attachment);
    setPreviewOpen(true);
  };

  const openAttachmentGallery = (attachmentId?: number) => {
    setInitialAttachmentId(attachmentId);
    setGalleryOpen(true);
  };

  const handleEdit = () => {
    if (!voucher) return;

    if (!canEditVoucher) {
      toast.error("Cannot edit posted or approved vouchers. Please reset approval status first if necessary.");
      return;
    }

    navigate(`/journal-vouchers/edit/${voucher.VoucherNo}`);
  };

  const openDeleteDialog = () => {
    if (!canEditVoucher) {
      toast.error("Cannot delete posted or approved vouchers. Please reset approval status first if necessary.");
      return;
    }
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!voucher) return;

    try {
      setActionLoading(true);
      const response = await journalVoucherService.deleteJournalVoucher(voucher.VoucherNo, voucher.CompanyID);

      if (response.success) {
        toast.success("Journal voucher deleted successfully");
        navigate("/journal-vouchers");
      } else {
        toast.error(response.message || "Failed to delete journal voucher");
      }
    } catch (error) {
      console.error("Error deleting voucher:", error);
      toast.error("Failed to delete journal voucher");
    } finally {
      setActionLoading(false);
      closeDeleteDialog();
    }
  };

  const handleSubmitForApproval = async () => {
    if (!voucher) return;

    try {
      setActionLoading(true);
      const response = await journalVoucherService.submitJournalVoucherForApproval(voucher.VoucherNo, voucher.CompanyID);

      if (response.success) {
        // Refresh voucher data
        const data = await journalVoucherService.getJournalVoucherByNumber(voucher.VoucherNo);
        if (data.voucher) {
          setVoucher(data.voucher);
        }
        toast.success("Journal voucher submitted for approval successfully");
      } else {
        toast.error(response.message || "Failed to submit journal voucher for approval");
      }
    } catch (error) {
      console.error("Error submitting voucher:", error);
      toast.error("Failed to submit journal voucher for approval");
    } finally {
      setActionLoading(false);
      setIsSubmitDialogOpen(false);
    }
  };

  const handleReversal = async () => {
    if (!voucher || !reversalReason.trim()) {
      toast.error("Reversal reason is required");
      return;
    }

    try {
      setActionLoading(true);
      const response = await journalVoucherService.reverseJournalVoucher(voucher.VoucherNo, voucher.CompanyID, reversalReason.trim());

      if (response.success) {
        // Refresh voucher data
        const data = await journalVoucherService.getJournalVoucherByNumber(voucher.VoucherNo);
        if (data.voucher) {
          setVoucher(data.voucher);
        }

        toast.success("Journal voucher reversed successfully");
        if (response.reversalVoucherNo) {
          toast.info(`Reversal voucher created: ${response.reversalVoucherNo}`);
        }
      } else {
        toast.error(response.message || "Failed to reverse journal voucher");
      }
    } catch (error) {
      console.error("Error reversing voucher:", error);
      toast.error("Failed to reverse journal voucher");
    } finally {
      setActionLoading(false);
      setIsReversalDialogOpen(false);
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
      currency: "AED", //currencyCode ||
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: { variant: "secondary" as const, icon: FileText, className: "bg-gray-100 text-gray-800" },
      Pending: { variant: "default" as const, icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      Posted: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" },
      Rejected: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800" },
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
      Pending: { icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      Approved: { icon: CheckCircle, className: "bg-green-100 text-green-800" },
      Rejected: { icon: XCircle, className: "bg-red-100 text-red-800" },
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

  // Render journal type badge
  const renderJournalTypeBadge = (journalType: string) => {
    const typeConfig = {
      General: { className: "bg-blue-100 text-blue-800" },
      Adjusting: { className: "bg-orange-100 text-orange-800" },
      Closing: { className: "bg-purple-100 text-purple-800" },
      Reversing: { className: "bg-red-100 text-red-800" },
    };

    const config = typeConfig[journalType as keyof typeof typeConfig] || typeConfig.General;

    return (
      <Badge variant="outline" className={config.className}>
        <Receipt className="w-3 h-3 mr-1" />
        {journalType}
      </Badge>
    );
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
  const totalCredits = lines.reduce((sum, line) => sum + (line.CreditAmount || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) <= 0.01;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl">Journal voucher not found</h2>
        <Button className="mt-4" onClick={() => navigate("/journal-vouchers")}>
          Back to journal vouchers
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
            <Button variant="outline" size="icon" onClick={() => navigate("/journal-vouchers")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold">Journal Voucher {voucher.VoucherNo}</h1>
            <div className="ml-2 flex items-center gap-2">
              <Badge variant="secondary">{renderStatusBadge(voucher.PostingStatus || "Draft")}</Badge>
              {voucher.RequiresApproval && (
                <Badge
                  className={`${
                    voucher.ApprovalStatus === "Approved"
                      ? "bg-green-100 text-green-800"
                      : voucher.ApprovalStatus === "Rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  <ApprovalIcon className="h-3 w-3 mr-1" />
                  {voucher.ApprovalStatus}
                </Badge>
              )}
              {isApproved && (
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800">
                  <Lock className="h-3 w-3 mr-1" />
                  Protected
                </Badge>
              )}
              {voucher.IsReversed && (
                <Badge variant="outline" className="bg-red-50 border-red-200 text-red-800">
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
                onDownload={handleGenerateJournalVoucherSlip}
                onPreview={handlePreviewJournalVoucherSlip}
                isLoading={journalVoucherPdfReport.isLoading}
                downloadLabel="Download Journal Slip"
                previewLabel="Preview Journal Slip"
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
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        Approve Voucher
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openApprovalDialog("reject")}>
                        <XCircle className="mr-2 h-4 w-4 text-red-600" />
                        Reject Voucher
                      </DropdownMenuItem>
                    </>
                  )}
                  {voucher.ApprovalStatus !== "Pending" && (
                    <DropdownMenuItem onClick={() => openApprovalDialog("reset")}>
                      <RotateCcw className="mr-2 h-4 w-4 text-blue-600" />
                      Reset Approval
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Submit for Approval */}
            {voucher.PostingStatus === "Draft" && voucher.RequiresApproval && (
              <Button variant="outline" onClick={() => setIsSubmitDialogOpen(true)}>
                <Send className="mr-2 h-4 w-4" />
                Submit for Approval
              </Button>
            )}

            {canEditVoucher ? (
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
                  <p>Posted or approved vouchers cannot be edited. Reset approval status first if changes are needed.</p>
                </TooltipContent>
              </Tooltip>
            )}

            {journalVoucherService.canReverseVoucher(voucher) && (
              <Button variant="outline" onClick={() => setIsReversalDialogOpen(true)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reverse
              </Button>
            )}

            {canEditVoucher ? (
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
                  <p>Posted or approved vouchers cannot be deleted. Reset approval status first if deletion is needed.</p>
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
                ? "border-l-green-500 bg-green-50"
                : voucher.ApprovalStatus === "Rejected"
                ? "border-l-red-500 bg-red-50"
                : "border-l-yellow-500 bg-yellow-50"
            }`}
          >
            <ApprovalIcon className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Approval Status: {voucher.ApprovalStatus}</div>
              {voucher.ApprovalStatus === "Approved" && voucher.ApprovedByName && (
                <div className="text-sm text-muted-foreground mt-1">
                  Approved by {voucher.ApprovedByName} on {formatDate(voucher.ApprovedOn)}
                  {voucher.ApprovalComments && <div className="mt-1">Comments: {voucher.ApprovalComments}</div>}
                  <div className="mt-2 text-green-700 font-medium flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    This voucher is protected from modifications until approval is reset.
                  </div>
                </div>
              )}
              {voucher.ApprovalStatus === "Rejected" && voucher.RejectedByName && (
                <div className="text-sm text-muted-foreground mt-1">
                  Rejected by {voucher.RejectedByName} on {formatDate(voucher.RejectedOn)}
                  {voucher.RejectionReason && <div className="mt-1 text-red-700">Reason: {voucher.RejectionReason}</div>}
                </div>
              )}
              {voucher.ApprovalStatus === "Pending" && <div className="text-sm text-muted-foreground mt-1">This voucher is awaiting approval from a manager.</div>}
            </AlertDescription>
          </Alert>
        )}

        {/* Reversal Alert */}
        {voucher.IsReversed && (
          <Alert className="border-l-4 border-l-red-500 bg-red-50">
            <RotateCcw className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">This voucher has been reversed</div>
              {voucher.ReversalReason && <div className="text-sm text-muted-foreground mt-1">Reason: {voucher.ReversalReason}</div>}
              {voucher.ReversedBy && (
                <div className="text-sm text-muted-foreground mt-1">
                  Reversed by {voucher.ReversedBy} on {formatDate(voucher.ReversedOn)}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Voucher Information */}
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
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <div className="mt-1">{renderStatusBadge(voucher.PostingStatus || "Draft")}</div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Transaction Date</h3>
                  <p className="text-base">{formatDate(voucher.TransactionDate)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Posting Date</h3>
                  <p className="text-base">{formatDate(voucher.PostingDate)}</p>
                </div>

                {voucher.RequiresApproval && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Approval Status</h3>
                    <div className="mt-1">{renderApprovalBadge(voucher.ApprovalStatus || "Pending")}</div>
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

                {voucher.JournalType && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Journal Type</h3>
                    <div className="mt-1">{renderJournalTypeBadge(voucher.JournalType)}</div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Debits</h3>
                <p className="text-base font-medium">{formatCurrency(totalDebits, voucher.CurrencyName)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Credits</h3>
                <p className="text-base font-medium">{formatCurrency(totalCredits, voucher.CurrencyName)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Balance Status</h3>
                <div className="flex items-center gap-2">
                  {isBalanced ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Balanced
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Unbalanced
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Journal Details */}
            {(voucher.Description || voucher.Narration || voucher.PaidTo || voucher.RefNo || voucher.InvoiceNo || voucher.ChequeNo) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Journal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {voucher.SupplierName && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Supplier</h4>
                        <p className="text-base">{voucher.SupplierName}</p>
                      </div>
                    )}
                    {voucher.PaidTo && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Paid To</h4>
                        <p className="text-base">{voucher.PaidTo}</p>
                      </div>
                    )}
                    {voucher.RefNo && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Reference No</h4>
                        <p className="text-base">{voucher.RefNo}</p>
                      </div>
                    )}
                    {voucher.InvoiceNo && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Invoice No</h4>
                        <p className="text-base">{voucher.InvoiceNo}</p>
                      </div>
                    )}
                    {voucher.ChequeNo && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Cheque No</h4>
                        <p className="text-base">{voucher.ChequeNo}</p>
                      </div>
                    )}
                    {voucher.ChequeDate && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Cheque Date</h4>
                        <p className="text-base">{formatDate(voucher.ChequeDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {(voucher.Description || voucher.Narration) && (
              <>
                <Separator />
                <div className="space-y-4">
                  {voucher.Description && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                      <p className="text-base mt-1 bg-muted/20 p-3 rounded-lg">{voucher.Description}</p>
                    </div>
                  )}
                  {voucher.Narration && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Narration</h3>
                      <p className="text-base mt-1 bg-muted/20 p-3 rounded-lg">{voucher.Narration}</p>
                    </div>
                  )}
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

        {/* Journal Lines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
              Journal Lines
            </CardTitle>
            <CardDescription>Debit and credit entries for this transaction</CardDescription>
          </CardHeader>
          <CardContent>
            {lines.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead>Additional Info</TableHead>
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
                          <div>{line.LineDescription || "—"}</div>
                          {line.LineInvoiceNo && <div className="text-sm text-muted-foreground">Invoice: {line.LineInvoiceNo}</div>}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {line.DebitAmount && line.DebitAmount > 0 ? formatCurrency(line.DebitAmount, voucher.CurrencyName) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {line.CreditAmount && line.CreditAmount > 0 ? formatCurrency(line.CreditAmount, voucher.CurrencyName) : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {line.CustomerFullName && <div>Customer: {line.CustomerFullName}</div>}
                            {line.LineSupplierName && <div>Supplier: {line.LineSupplierName}</div>}
                            {line.LineTRN && <div>TRN: {line.LineTRN}</div>}
                            {line.LineCity && <div>City: {line.LineCity}</div>}
                            {!line.CustomerFullName && !line.LineSupplierName && !line.LineTRN && !line.LineCity && "—"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="font-semibold bg-muted/20">
                      <TableCell colSpan={2}>
                        <div className="flex items-center gap-2">
                          Total
                          {!isBalanced && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Unbalanced: {formatCurrency(Math.abs(totalDebits - totalCredits), voucher.CurrencyName)}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(totalDebits, voucher.CurrencyName)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalCredits, voucher.CurrencyName)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No journal lines found for this voucher.</div>
            )}
          </CardContent>
        </Card>

        {/* Attachments */}
        {attachments.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                Voucher Documents
              </CardTitle>
              <Button variant="outline" onClick={() => openAttachmentGallery()}>
                <FileText className="mr-2 h-4 w-4" />
                View All Documents
              </Button>
            </CardHeader>
            <CardContent>
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
                            {attachment.DocTypeName && <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100">{attachment.DocTypeName}</Badge>}
                          </div>
                          <div className="text-sm space-y-1">
                            {attachment.DocumentDescription && <div className="text-muted-foreground">{attachment.DocumentDescription}</div>}
                            {attachment.UploadedDate && (
                              <div className="flex items-center text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                Uploaded: {formatDate(attachment.UploadedDate)}
                              </div>
                            )}
                            {attachment.UploadedByUserName && <div className="text-muted-foreground">By: {attachment.UploadedByUserName}</div>}
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
            </CardContent>
          </Card>
        )}

        {/* PDF Preview Modal */}
        <PdfPreviewModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          pdfBlob={journalVoucherPdfReport.data}
          title={`Journal Voucher Slip - ${voucher.VoucherNo}`}
          isLoading={journalVoucherPdfReport.isLoading}
          error={journalVoucherPdfReport.error}
          onDownload={() => journalVoucherPdfReport.downloadCurrentPdf(`Journal_Voucher_Slip_${voucher.VoucherNo}.pdf`)}
          onRefresh={handlePreviewJournalVoucherSlip}
        />

        {/* Approval Dialog */}
        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {approvalAction === "approve" ? "Approve Journal Voucher" : approvalAction === "reject" ? "Reject Journal Voucher" : "Reset Approval Status"}
              </DialogTitle>
              <DialogDescription>
                {approvalAction === "approve"
                  ? "Approve this journal voucher. Note: Once approved, the voucher will be protected from modifications."
                  : approvalAction === "reject"
                  ? "Reject this journal voucher with a reason."
                  : "Reset the approval status to pending."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {approvalAction === "approve" && (
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
              {approvalAction === "reject" && (
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
              {approvalAction === "reset" && (
                <div className="text-sm text-muted-foreground">This will reset the approval status to "Pending" and clear any previous approval or rejection details.</div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeApprovalDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleApprovalAction}
                disabled={approvalLoading || (approvalAction === "reject" && !rejectionReason.trim())}
                variant={approvalAction === "reject" ? "destructive" : "default"}
              >
                {approvalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {approvalAction === "approve" && <CheckCircle className="mr-2 h-4 w-4" />}
                    {approvalAction === "reject" && <XCircle className="mr-2 h-4 w-4" />}
                    {approvalAction === "reset" && <RotateCcw className="mr-2 h-4 w-4" />}
                    {approvalAction === "approve" ? "Approve" : approvalAction === "reject" ? "Reject" : "Reset"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog for Delete */}
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={handleDelete}
          title="Delete Journal Voucher"
          description={`Are you sure you want to delete journal voucher "${voucher.VoucherNo}"? This action cannot be undone.`}
          cancelText="Cancel"
          confirmText="Delete"
          type="danger"
        />

        {/* Confirmation Dialog for Submit for Approval */}
        <ConfirmationDialog
          isOpen={isSubmitDialogOpen}
          onClose={() => setIsSubmitDialogOpen(false)}
          onConfirm={handleSubmitForApproval}
          title="Submit for Approval"
          description={`Are you sure you want to submit journal voucher "${voucher.VoucherNo}" for approval?`}
          cancelText="Cancel"
          confirmText="Submit"
          type="warning"
        />

        {/* Reversal Dialog */}
        <Dialog open={isReversalDialogOpen} onOpenChange={setIsReversalDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reverse Journal Voucher</DialogTitle>
              <DialogDescription>Are you sure you want to reverse journal voucher "{voucher.VoucherNo}"? This will create a reversal entry.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reversalReason">Reversal Reason *</Label>
                <Textarea
                  id="reversalReason"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="Enter the reason for reversal"
                  rows={3}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReversalDialogOpen(false)}>
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

export default JournalVoucherDetails;
