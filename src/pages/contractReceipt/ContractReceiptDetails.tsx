// src/pages/contractReceipt/ContractReceiptDetails.tsx - Comprehensive Receipt Details with Approval System
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  Building,
  Users,
  CreditCard,
  Banknote,
  Download,
  Eye,
  Shield,
  Lock,
  RotateCcw,
  AlertTriangle,
  Receipt,
  MapPin,
  Phone,
  Mail,
  Hash,
  RefreshCw,
  History,
  ChevronDown,
  Plus,
  Minus,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Form } from "@/components/ui/form";
import { leaseReceiptService } from "@/services/contractReceiptService";
import { FormField } from "@/components/forms/FormField";
import { accountService } from "@/services/accountService";
import { toast } from "sonner";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks";
import {
  ContractReceipt,
  ReceiptPosting,
  ReceiptPostingRequest,
  ReceiptApprovalRequest,
  ReceiptRejectionRequest,
  PAYMENT_TYPE,
  PAYMENT_STATUS,
  APPROVAL_STATUS,
} from "@/types/contractReceiptTypes";
import { PdfPreviewModal } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";

// Posting schema
const postingSchema = z.object({
  postingDate: z.date({ required_error: "Posting date is required" }),
  debitAccountId: z.string().min(1, "Debit account is required"),
  creditAccountId: z.string().min(1, "Credit account is required"),
  narration: z.string().optional(),
  exchangeRate: z.coerce.number().min(0.0001, "Exchange rate must be greater than 0").optional(),
});

// Approval schema
const approvalSchema = z.object({
  comments: z.string().optional(),
});

// Rejection schema
const rejectionSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required"),
});

type PostingFormValues = z.infer<typeof postingSchema>;
type ApprovalFormValues = z.infer<typeof approvalSchema>;
type RejectionFormValues = z.infer<typeof rejectionSchema>;

const ContractReceiptDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [receipt, setReceipt] = useState<ContractReceipt | null>(null);
  const [postings, setPostings] = useState<ReceiptPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Reference data
  const [accounts, setAccounts] = useState<any[]>([]);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [postingDialogOpen, setPostingDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);

  // Status change state
  const [newStatus, setNewStatus] = useState<string>("");

  // Active tab
  const [activeTab, setActiveTab] = useState("details");

  // PDF functionality
  const [showReceiptPdfPreview, setShowReceiptPdfPreview] = useState(false);
  const receiptPdf = useGenericPdfReport();

  // Form instances
  const postingForm = useForm<PostingFormValues>({
    resolver: zodResolver(postingSchema),
    defaultValues: {
      postingDate: new Date(),
      exchangeRate: 1,
    },
  });

  const approvalForm = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalSchema),
  });

  const rejectionForm = useForm<RejectionFormValues>({
    resolver: zodResolver(rejectionSchema),
  });

  // Payment status options
  const paymentStatusOptions = Object.values(PAYMENT_STATUS);

  // Check if user is manager
  const isManager = user?.role === "admin" || user?.role === "manager";

  // Initialize data on component mount
  useEffect(() => {
    if (id) {
      initializeData();
    }
  }, [id]);

  // Initialize component data
  const initializeData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchReceiptDetails(), fetchAccounts()]);
    } catch (error) {
      console.error("Error initializing data:", error);
      toast.error("Failed to load receipt details");
    } finally {
      setLoading(false);
    }
  };

  // Fetch receipt details
  const fetchReceiptDetails = async () => {
    if (!id) return;

    try {
      const receiptId = parseInt(id);
      const { receipt: receiptData, postings: postingsData } = await leaseReceiptService.getReceiptById(receiptId);

      if (receiptData) {
        setReceipt(receiptData);
        setPostings(postingsData);
      } else {
        toast.error("Receipt not found");
        navigate("/receipts");
      }
    } catch (error) {
      console.error("Error fetching receipt details:", error);
      toast.error("Failed to load receipt details");
      navigate("/receipts");
    }
  };

  // Fetch accounts
  const fetchAccounts = async () => {
    try {
      const accountsData = await accountService.getAllAccounts();
      setAccounts(accountsData.filter((acc) => acc.IsActive && acc.IsPostable));
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchReceiptDetails();
      toast.success("Receipt details refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh receipt details");
    } finally {
      setRefreshing(false);
    }
  };

  // Check if receipt can be edited
  const canEditReceipt = (receipt: ContractReceipt | null) => {
    if (!receipt) return false;
    return receipt.ApprovalStatus !== APPROVAL_STATUS.APPROVED;
  };

  // Check if receipt can be posted
  const canPostReceipt = (receipt: ContractReceipt | null) => {
    if (!receipt) return false;
    return !receipt.IsPosted && receipt.ApprovalStatus === APPROVAL_STATUS.APPROVED;
  };

  // Navigation handlers
  const handleBackToList = () => {
    navigate("/receipts");
  };

  const handleEditReceipt = () => {
    if (!receipt || !canEditReceipt(receipt)) {
      toast.error("Cannot edit approved receipts. Please reset approval status first if changes are needed.");
      return;
    }
    navigate(`/receipts/edit/${receipt.LeaseReceiptID}`);
  };

  // Approval handlers
  const handleApproveReceipt = async (data: ApprovalFormValues) => {
    if (!receipt || !isManager) return;

    try {
      setActionLoading(true);
      const approvalRequest: ReceiptApprovalRequest = {
        LeaseReceiptID: receipt.LeaseReceiptID,
        Comments: data.comments,
      };

      const response = await leaseReceiptService.approveReceipt(approvalRequest);

      if (response.Status === 1) {
        setReceipt({ ...receipt, ApprovalStatus: APPROVAL_STATUS.APPROVED });
        toast.success("Receipt approved successfully");
        setApprovalDialogOpen(false);
        approvalForm.reset();
      } else {
        toast.error(response.Message || "Failed to approve receipt");
      }
    } catch (error) {
      console.error("Error approving receipt:", error);
      toast.error("Failed to approve receipt");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReceipt = async (data: RejectionFormValues) => {
    if (!receipt || !isManager) return;

    try {
      setActionLoading(true);
      const rejectionRequest: ReceiptRejectionRequest = {
        LeaseReceiptID: receipt.LeaseReceiptID,
        RejectionReason: data.rejectionReason,
      };

      const response = await leaseReceiptService.rejectReceipt(rejectionRequest);

      if (response.Status === 1) {
        setReceipt({ ...receipt, ApprovalStatus: APPROVAL_STATUS.REJECTED });
        toast.success("Receipt rejected successfully");
        setRejectionDialogOpen(false);
        rejectionForm.reset();
      } else {
        toast.error(response.Message || "Failed to reject receipt");
      }
    } catch (error) {
      console.error("Error rejecting receipt:", error);
      toast.error("Failed to reject receipt");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetApprovalStatus = async () => {
    if (!receipt || !isManager) return;

    try {
      setActionLoading(true);
      const response = await leaseReceiptService.resetReceiptApprovalStatus(receipt.LeaseReceiptID);

      if (response.Status === 1) {
        setReceipt({ ...receipt, ApprovalStatus: APPROVAL_STATUS.PENDING });
        toast.success("Approval status reset successfully");
      } else {
        toast.error(response.Message || "Failed to reset approval status");
      }
    } catch (error) {
      console.error("Error resetting approval status:", error);
      toast.error("Failed to reset approval status");
    } finally {
      setActionLoading(false);
    }
  };

  // Status change handlers
  const openStatusChangeDialog = (status: string) => {
    if (!receipt || !canEditReceipt(receipt)) {
      toast.error("Cannot change status of approved receipts. Please reset approval status first if changes are needed.");
      return;
    }
    setNewStatus(status);
    setStatusChangeDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!receipt || !newStatus) return;

    try {
      setActionLoading(true);
      const clearanceDate = newStatus === PAYMENT_STATUS.CLEARED ? new Date() : undefined;
      const response = await leaseReceiptService.changeReceiptStatus(receipt.LeaseReceiptID, newStatus, clearanceDate);

      if (response.Status === 1) {
        setReceipt({
          ...receipt,
          PaymentStatus: newStatus,
          ClearanceDate: clearanceDate,
        });
        toast.success(`Receipt status changed to ${newStatus}`);
        setStatusChangeDialogOpen(false);
        setNewStatus("");
      } else {
        toast.error(response.Message || "Failed to change receipt status");
      }
    } catch (error) {
      console.error("Error changing receipt status:", error);
      toast.error("Failed to change receipt status");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete handlers
  const handleDeleteReceipt = async () => {
    if (!receipt) return;

    if (!canEditReceipt(receipt)) {
      toast.error("Cannot delete approved receipts. Please reset approval status first if deletion is needed.");
      return;
    }

    try {
      setActionLoading(true);
      const response = await leaseReceiptService.deleteReceipt(receipt.LeaseReceiptID);

      if (response.Status === 1) {
        toast.success("Receipt deleted successfully");
        navigate("/receipts");
      } else {
        toast.error(response.Message || "Failed to delete receipt");
      }
    } catch (error) {
      console.error("Error deleting receipt:", error);
      toast.error("Failed to delete receipt");
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  // Posting handlers
  const handlePostReceipt = async (data: PostingFormValues) => {
    if (!receipt) return;

    try {
      setActionLoading(true);
      const postingRequest: ReceiptPostingRequest = {
        LeaseReceiptID: receipt.LeaseReceiptID,
        PostingDate: data.postingDate,
        DebitAccountID: parseInt(data.debitAccountId),
        CreditAccountID: parseInt(data.creditAccountId),
        PostingNarration: data.narration,
        ExchangeRate: data.exchangeRate,
      };

      const response = await leaseReceiptService.postSingleReceipt(postingRequest);

      if (response.Status === 1) {
        setReceipt({ ...receipt, IsPosted: true });
        await fetchReceiptDetails(); // Refresh to get posting details
        toast.success("Receipt posted successfully");
        setPostingDialogOpen(false);
        postingForm.reset();
      } else {
        toast.error(response.Message || "Failed to post receipt");
      }
    } catch (error) {
      console.error("Error posting receipt:", error);
      toast.error("Failed to post receipt");
    } finally {
      setActionLoading(false);
    }
  };

  // PDF functionality
  const handleGenerateReceiptPdf = async () => {
    if (!receipt) return;

    const response = await receiptPdf.generateReport(
      "receipt-slip",
      { LeaseReceiptID: receipt.LeaseReceiptID },
      {
        orientation: "Portrait",
        download: true,
        showToast: true,
        filename: `Receipt_${receipt.ReceiptNo}_${new Date().toISOString().split("T")[0]}.pdf`,
      }
    );

    if (response.success) {
      toast.success("Receipt PDF generated successfully");
    }
  };

  const handlePreviewReceiptPdf = async () => {
    if (!receipt) return;

    setShowReceiptPdfPreview(true);

    const response = await receiptPdf.generateReport(
      "receipt-slip",
      { LeaseReceiptID: receipt.LeaseReceiptID },
      {
        orientation: "Portrait",
        download: false,
        showToast: false,
      }
    );

    if (!response.success) {
      toast.error("Failed to generate receipt preview");
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      [PAYMENT_STATUS.RECEIVED]: { variant: "default" as const, icon: Clock, className: "bg-blue-100 text-blue-800" },
      [PAYMENT_STATUS.DEPOSITED]: { variant: "default" as const, icon: Banknote, className: "bg-purple-100 text-purple-800" },
      [PAYMENT_STATUS.CLEARED]: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" },
      [PAYMENT_STATUS.BOUNCED]: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800" },
      [PAYMENT_STATUS.CANCELLED]: { variant: "secondary" as const, icon: XCircle, className: "bg-gray-100 text-gray-800" },
      [PAYMENT_STATUS.PENDING]: { variant: "secondary" as const, icon: Clock, className: "bg-yellow-100 text-yellow-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[PAYMENT_STATUS.RECEIVED];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-4 h-4 mr-2" />
        {status}
      </Badge>
    );
  };

  // Render approval status badge
  const renderApprovalBadge = (status: string) => {
    const approvalConfig = {
      [APPROVAL_STATUS.PENDING]: { icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      [APPROVAL_STATUS.APPROVED]: { icon: CheckCircle, className: "bg-green-100 text-green-800" },
      [APPROVAL_STATUS.REJECTED]: { icon: XCircle, className: "bg-red-100 text-red-800" },
      [APPROVAL_STATUS.NOT_REQUIRED]: { icon: CheckCircle, className: "bg-gray-100 text-gray-800" },
    };

    const config = approvalConfig[status as keyof typeof approvalConfig] || approvalConfig[APPROVAL_STATUS.PENDING];
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-4 h-4 mr-2" />
        {status}
      </Badge>
    );
  };

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "PPP");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Receipt Not Found</h3>
        <p className="text-muted-foreground mb-4">The receipt you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={handleBackToList}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Receipts
        </Button>
      </div>
    );
  }

  const isApproved = receipt.ApprovalStatus === APPROVAL_STATUS.APPROVED;
  const canEdit = canEditReceipt(receipt);
  const canPost = canPostReceipt(receipt);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBackToList}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Receipts
            </Button>
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                Receipt {receipt.ReceiptNo}
                {isApproved && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Lock className="h-5 w-5 text-green-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Protected - Approved receipts cannot be modified</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </h1>
              <p className="text-muted-foreground">
                Received on {formatDate(receipt.ReceiptDate)} • Amount: {formatCurrency(receipt.ReceivedAmount)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button variant="outline" onClick={handlePreviewReceiptPdf} disabled={receiptPdf.isLoading}>
              {receiptPdf.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
              Preview PDF
            </Button>
            <Button variant="outline" onClick={handleGenerateReceiptPdf} disabled={receiptPdf.isLoading}>
              {receiptPdf.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download PDF
            </Button>
            {canEdit && (
              <Button onClick={handleEditReceipt}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Receipt
              </Button>
            )}
          </div>
        </div>

        {/* Status Alerts */}
        {receipt.ApprovalStatus === APPROVAL_STATUS.REJECTED && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>This receipt has been rejected. {receipt.RejectionReason && `Reason: ${receipt.RejectionReason}`}</AlertDescription>
          </Alert>
        )}

        {receipt.ApprovalStatus === APPROVAL_STATUS.PENDING && receipt.RequiresApproval && isManager && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>This receipt is pending approval and requires manager authorization.</AlertDescription>
          </Alert>
        )}

        {receipt.PaymentStatus === PAYMENT_STATUS.BOUNCED && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>This payment has bounced and requires attention.</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Approval Actions */}
          {isManager && receipt.RequiresApproval && receipt.ApprovalStatus === APPROVAL_STATUS.PENDING && (
            <>
              <Button onClick={() => setApprovalDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Receipt
              </Button>
              <Button variant="destructive" onClick={() => setRejectionDialogOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Receipt
              </Button>
            </>
          )}

          {/* Reset Approval */}
          {isManager && receipt.ApprovalStatus !== APPROVAL_STATUS.PENDING && (
            <Button variant="outline" onClick={handleResetApprovalStatus} disabled={actionLoading}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Approval
            </Button>
          )}

          {/* Posting Action */}
          {canPost && (
            <Button onClick={() => setPostingDialogOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              Post to GL
            </Button>
          )}

          {/* Status Change Actions */}
          {canEdit && (
            <div className="flex gap-2">
              {paymentStatusOptions
                .filter((status) => status !== receipt.PaymentStatus)
                .slice(0, 3)
                .map((status) => (
                  <Button key={status} variant="outline" onClick={() => openStatusChangeDialog(status)}>
                    Set as {status}
                  </Button>
                ))}
              {paymentStatusOptions.filter((status) => status !== receipt.PaymentStatus).length > 3 && (
                <Button variant="outline" className="px-2">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Delete Action */}
          {canEdit && receipt.PaymentStatus !== PAYMENT_STATUS.BOUNCED && (
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Receipt Details</TabsTrigger>
            <TabsTrigger value="posting">Posting & GL</TabsTrigger>
            <TabsTrigger value="history">History & Audit</TabsTrigger>
            <TabsTrigger value="documents">Related Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Receipt Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Status Cards */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {renderStatusBadge(receipt.PaymentStatus)}
                    {receipt.IsPosted && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Posted to GL
                      </Badge>
                    )}
                    {receipt.RequiresDeposit && !receipt.DepositDate && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Pending Deposit
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Approval Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {receipt.RequiresApproval ? (
                      <div className="flex items-center gap-2">
                        {renderApprovalBadge(receipt.ApprovalStatus)}
                        {isApproved && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Shield className="h-4 w-4 text-green-600" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Protected from modifications</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50">
                        No Approval Required
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Amount Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Received Amount:</span>
                      <span className="font-medium">{formatCurrency(receipt.ReceivedAmount)}</span>
                    </div>
                    {receipt.SecurityDepositAmount && receipt.SecurityDepositAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Security Deposit:</span>
                        <span className="font-medium">{formatCurrency(receipt.SecurityDepositAmount)}</span>
                      </div>
                    )}
                    {receipt.PenaltyAmount && receipt.PenaltyAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Penalty:</span>
                        <span className="font-medium text-red-600">{formatCurrency(receipt.PenaltyAmount)}</span>
                      </div>
                    )}
                    {receipt.DiscountAmount && receipt.DiscountAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Discount:</span>
                        <span className="font-medium text-green-600">-{formatCurrency(receipt.DiscountAmount)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Receipt Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Receipt Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Receipt No</Label>
                      <p className="font-medium">{receipt.ReceiptNo}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Receipt Date</Label>
                      <p className="font-medium">{formatDate(receipt.ReceiptDate)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Payment Type</Label>
                      <Badge variant="outline">{receipt.PaymentType}</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Currency</Label>
                      <p className="font-medium">{receipt.CurrencyCode || "USD"}</p>
                    </div>
                  </div>

                  {receipt.ExchangeRate && receipt.ExchangeRate !== 1 && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Exchange Rate</Label>
                      <p className="font-medium">{receipt.ExchangeRate}</p>
                    </div>
                  )}

                  {receipt.IsAdvancePayment && (
                    <Alert>
                      <CreditCard className="h-4 w-4" />
                      <AlertDescription>This is an advance payment.</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Customer Name</Label>
                    <p className="font-medium">{receipt.CustomerName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Customer No</Label>
                    <p className="font-medium">{receipt.CustomerNo}</p>
                  </div>
                  {receipt.CustomerTaxNo && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Tax No</Label>
                      <p className="font-medium">{receipt.CustomerTaxNo}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {receipt.PaymentType === PAYMENT_TYPE.CHEQUE && (
                      <>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Cheque Number</Label>
                          <p className="font-medium">{receipt.ChequeNo || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Cheque Date</Label>
                          <p className="font-medium">{formatDate(receipt.ChequeDate)}</p>
                        </div>
                      </>
                    )}

                    {receipt.PaymentType === PAYMENT_TYPE.BANK_TRANSFER && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Transaction Reference</Label>
                        <p className="font-medium">{receipt.TransactionReference || "N/A"}</p>
                      </div>
                    )}

                    {receipt.BankName && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Bank</Label>
                        <p className="font-medium">{receipt.BankName}</p>
                      </div>
                    )}

                    {receipt.BankAccountNo && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Account Number</Label>
                        <p className="font-medium">{receipt.BankAccountNo}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {receipt.DepositDate && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Deposit Date</Label>
                        <p className="font-medium">{formatDate(receipt.DepositDate)}</p>
                      </div>
                    )}

                    {receipt.DepositBankName && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Deposited to Bank</Label>
                        <p className="font-medium">{receipt.DepositBankName}</p>
                      </div>
                    )}

                    {receipt.ClearanceDate && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Clearance Date</Label>
                        <p className="font-medium">{formatDate(receipt.ClearanceDate)}</p>
                      </div>
                    )}

                    {receipt.ReceivedByUser && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Received By</Label>
                        <p className="font-medium">{receipt.ReceivedByUser}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property & Contract Information */}
            {(receipt.PropertyName || receipt.UnitNo || receipt.ContractNo) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Property & Contract Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {receipt.PropertyName && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Property</Label>
                        <p className="font-medium">{receipt.PropertyName}</p>
                      </div>
                    )}
                    {receipt.UnitNo && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Unit Number</Label>
                        <p className="font-medium">{receipt.UnitNo}</p>
                      </div>
                    )}
                    {receipt.ContractNo && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Contract Number</Label>
                        <p className="font-medium">{receipt.ContractNo}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Invoice */}
            {receipt.InvoiceNo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Related Invoice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Invoice Number</Label>
                      <p className="font-medium">{receipt.InvoiceNo}</p>
                    </div>
                    {receipt.InvoiceDate && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Invoice Date</Label>
                        <p className="font-medium">{formatDate(receipt.InvoiceDate)}</p>
                      </div>
                    )}
                    {receipt.InvoiceAmount && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Invoice Amount</Label>
                        <p className="font-medium">{formatCurrency(receipt.InvoiceAmount)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {receipt.Notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{receipt.Notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="posting" className="space-y-6">
            {/* Posting Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  General Ledger Posting
                </CardTitle>
              </CardHeader>
              <CardContent>
                {receipt.IsPosted ? (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>This receipt has been posted to the general ledger.</AlertDescription>
                    </Alert>

                    {postings.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Posting Entries</h4>
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Account</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Credit</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {postings.map((posting, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{posting.AccountCode}</div>
                                      <div className="text-sm text-muted-foreground">{posting.AccountName}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{posting.Description}</TableCell>
                                  <TableCell className="text-right">{posting.DebitAmount > 0 && formatCurrency(posting.DebitAmount)}</TableCell>
                                  <TableCell className="text-right">{posting.CreditAmount > 0 && formatCurrency(posting.CreditAmount)}</TableCell>
                                  <TableCell>
                                    {posting.IsReversed ? (
                                      <Badge variant="destructive">Reversed</Badge>
                                    ) : (
                                      <Badge variant="default" className="bg-green-100 text-green-800">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Posted
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        This receipt has not been posted to the general ledger yet.
                        {!canPost && receipt.ApprovalStatus !== APPROVAL_STATUS.APPROVED && " Approval is required before posting."}
                      </AlertDescription>
                    </Alert>

                    {canPost && (
                      <Button onClick={() => setPostingDialogOpen(true)}>
                        <Send className="mr-2 h-4 w-4" />
                        Post to General Ledger
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Audit Trail */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-2 border-muted pl-4 space-y-4">
                    {receipt.CreatedOn && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Receipt Created</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(receipt.CreatedOn)} by {receipt.CreatedBy || "System"}
                          </p>
                        </div>
                      </div>
                    )}

                    {receipt.UpdatedOn && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Receipt Updated</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(receipt.UpdatedOn)} by {receipt.UpdatedBy || "System"}
                          </p>
                        </div>
                      </div>
                    )}

                    {receipt.ApprovalStatus === APPROVAL_STATUS.APPROVED && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Receipt Approved</p>
                          <p className="text-sm text-muted-foreground">Manager approval completed</p>
                        </div>
                      </div>
                    )}

                    {receipt.ApprovalStatus === APPROVAL_STATUS.REJECTED && receipt.RejectedOn && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Receipt Rejected</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(receipt.RejectedOn)} by {receipt.RejectedBy || "System"}
                          </p>
                          {receipt.RejectionReason && <p className="text-sm text-red-600 mt-1">Reason: {receipt.RejectionReason}</p>}
                        </div>
                      </div>
                    )}

                    {receipt.IsPosted && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Posted to General Ledger</p>
                          <p className="text-sm text-muted-foreground">Financial entries recorded</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Company</Label>
                    <p className="font-medium">{receipt.CompanyName || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Fiscal Year</Label>
                    <p className="font-medium">{receipt.FiscalYear || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Receipt ID</Label>
                    <p className="font-medium">{receipt.LeaseReceiptID}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Record Status</Label>
                    <Badge variant="outline">{receipt.RecordStatus === 1 ? "Active" : "Inactive"}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            {/* Related Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Related Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Receipt className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium">Receipt Document</p>
                        <p className="text-sm text-muted-foreground">Official receipt for payment received</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handlePreviewReceiptPdf}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleGenerateReceiptPdf}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>

                  {receipt.InvoiceNo && (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="font-medium">Related Invoice: {receipt.InvoiceNo}</p>
                          <p className="text-sm text-muted-foreground">Invoice for which payment was received</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/invoices/${receipt.LeaseInvoiceID}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Invoice
                      </Button>
                    </div>
                  )}

                  {postings.length > 0 && (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Hash className="h-8 w-8 text-purple-600" />
                        <div>
                          <p className="font-medium">Journal Voucher</p>
                          <p className="text-sm text-muted-foreground">General ledger posting entries</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        <Download className="mr-2 h-4 w-4" />
                        Export Voucher
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* PDF Preview Modal */}
        <PdfPreviewModal
          isOpen={showReceiptPdfPreview}
          onClose={() => setShowReceiptPdfPreview(false)}
          pdfBlob={receiptPdf.data}
          title={`Receipt ${receipt.ReceiptNo}`}
          isLoading={receiptPdf.isLoading}
          error={receiptPdf.error}
          onDownload={() => receiptPdf.downloadCurrentPdf(`Receipt_${receipt.ReceiptNo}.pdf`)}
          onRefresh={handlePreviewReceiptPdf}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteReceipt}
          title="Delete Receipt"
          description={`Are you sure you want to delete receipt "${receipt.ReceiptNo}"? This action cannot be undone.`}
          cancelText="Cancel"
          confirmText="Delete"
          type="danger"
          loading={actionLoading}
        />

        {/* Status Change Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={statusChangeDialogOpen}
          onClose={() => setStatusChangeDialogOpen(false)}
          onConfirm={handleStatusChange}
          title="Change Receipt Status"
          description={`Are you sure you want to change the status of receipt "${receipt.ReceiptNo}" to "${newStatus}"?`}
          cancelText="Cancel"
          confirmText="Change Status"
          type="warning"
          loading={actionLoading}
        />

        {/* Approval Dialog */}
        <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Approve Receipt</DialogTitle>
              <DialogDescription>
                Approve receipt {receipt.ReceiptNo} for {formatCurrency(receipt.ReceivedAmount)}. Once approved, the receipt will be protected from modifications.
              </DialogDescription>
            </DialogHeader>
            <Form {...approvalForm}>
              <form onSubmit={approvalForm.handleSubmit(handleApproveReceipt)} className="space-y-4">
                <FormField
                  form={approvalForm}
                  name="comments"
                  label="Approval Comments (Optional)"
                  type="textarea"
                  placeholder="Enter any comments about the approval"
                  description="Optional comments for the approval"
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setApprovalDialogOpen(false)} disabled={actionLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
                    {actionLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Receipt
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reject Receipt</DialogTitle>
              <DialogDescription>Reject receipt {receipt.ReceiptNo} and provide a reason for rejection.</DialogDescription>
            </DialogHeader>
            <Form {...rejectionForm}>
              <form onSubmit={rejectionForm.handleSubmit(handleRejectReceipt)} className="space-y-4">
                <FormField
                  form={rejectionForm}
                  name="rejectionReason"
                  label="Rejection Reason *"
                  type="textarea"
                  placeholder="Enter the reason for rejection"
                  required
                  description="Explain why this receipt is being rejected"
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setRejectionDialogOpen(false)} disabled={actionLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive" disabled={actionLoading}>
                    {actionLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Receipt
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Posting Dialog */}
        <Dialog open={postingDialogOpen} onOpenChange={setPostingDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Post Receipt to General Ledger</DialogTitle>
              <DialogDescription>
                Post receipt {receipt.ReceiptNo} to the general ledger
                <br />
                Amount: {formatCurrency(receipt.ReceivedAmount)}
              </DialogDescription>
            </DialogHeader>
            <Form {...postingForm}>
              <form onSubmit={postingForm.handleSubmit(handlePostReceipt)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField form={postingForm} name="postingDate" label="Posting Date" type="date" required description="Date for the posting entries" />
                  <FormField
                    form={postingForm}
                    name="exchangeRate"
                    label="Exchange Rate"
                    type="number"
                    step="0.0001"
                    placeholder="1.0000"
                    description="Exchange rate to base currency"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    form={postingForm}
                    name="debitAccountId"
                    label="Debit Account"
                    type="select"
                    options={accounts
                      .filter((acc) => acc.AccountCode.startsWith("1"))
                      .map((account) => ({
                        label: `${account.AccountCode} - ${account.AccountName}`,
                        value: account.AccountID.toString(),
                      }))}
                    placeholder="Select debit account"
                    required
                    description="Account to debit (typically Cash/Bank account)"
                  />
                  <FormField
                    form={postingForm}
                    name="creditAccountId"
                    label="Credit Account"
                    type="select"
                    options={accounts
                      .filter((acc) => acc.AccountCode.startsWith("1"))
                      .map((account) => ({
                        label: `${account.AccountCode} - ${account.AccountName}`,
                        value: account.AccountID.toString(),
                      }))}
                    placeholder="Select credit account"
                    required
                    description="Account to credit (typically Accounts Receivable)"
                  />
                </div>
                <FormField
                  form={postingForm}
                  name="narration"
                  label="Narration"
                  type="textarea"
                  placeholder="Enter posting narration"
                  description="Description for the posting entries"
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setPostingDialogOpen(false)} disabled={actionLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={actionLoading}>
                    {actionLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Post to General Ledger
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default ContractReceiptDetails;
