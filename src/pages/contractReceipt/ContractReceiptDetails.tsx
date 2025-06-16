// src/pages/contractReceipt/ContractReceiptDetails.tsx - Updated with PDF Integration
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { leaseReceiptService } from "@/services/contractReceiptService";
import { accountService } from "@/services/accountService";
import { bankService } from "@/services/bankService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormField } from "@/components/forms/FormField";
import { Form } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Receipt,
  Calendar,
  Building2,
  FileText,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  User,
  DollarSign,
  Send,
  RotateCcw,
  Printer,
  Building,
  Home,
  CreditCard,
  Edit2,
  Trash2,
  AlertCircle,
  Users,
  Eye,
  Download,
  RefreshCw,
  Settings,
  History,
  Loader2,
  Banknote,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ContractReceipt, ReceiptPosting, ReceiptPostingRequest, PostingReversalRequest, PAYMENT_TYPE, PAYMENT_STATUS } from "@/types/contractReceiptTypes";
import { Account } from "@/types/accountTypes";
import { Bank } from "@/types/bankTypes";

// PDF Report Components
import { PdfPreviewModal, PdfActionButtons } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";

// Status change schema
const statusChangeSchema = z.object({
  newStatus: z.string().min(1, "Status is required"),
  clearanceDate: z.date().optional(),
});

// Posting schema
const postingSchema = z.object({
  postingDate: z.date({ required_error: "Posting date is required" }),
  debitAccountId: z.string().min(1, "Debit account is required"),
  creditAccountId: z.string().min(1, "Credit account is required"),
  narration: z.string().optional(),
  exchangeRate: z.coerce.number().min(0.0001, "Exchange rate must be greater than 0").optional(),
});

// Deposit schema
const depositSchema = z.object({
  depositDate: z.date({ required_error: "Deposit date is required" }),
  depositBankId: z.string().min(1, "Deposit bank is required"),
});

type StatusChangeFormValues = z.infer<typeof statusChangeSchema>;
type PostingFormValues = z.infer<typeof postingSchema>;
type DepositFormValues = z.infer<typeof depositSchema>;

export const ContractReceiptDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State variables
  const [receipt, setReceipt] = useState<ContractReceipt | null>(null);
  const [postings, setPostings] = useState<ReceiptPosting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

  // Dialog states
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [postingDialogOpen, setPostingDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [reversalDialogOpen, setReversalDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form states
  const [reversalReason, setReversalReason] = useState("");
  const [selectedPosting, setSelectedPosting] = useState<ReceiptPosting | null>(null);

  // Loading states for actions
  const [actionLoading, setActionLoading] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState("details");

  // PDF generation state
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const receiptPdfReport = useGenericPdfReport();

  const paymentStatusOptions = Object.values(PAYMENT_STATUS);

  // Form instances
  const statusChangeForm = useForm<StatusChangeFormValues>({
    resolver: zodResolver(statusChangeSchema),
  });

  const postingForm = useForm<PostingFormValues>({
    resolver: zodResolver(postingSchema),
    defaultValues: {
      postingDate: new Date(),
      exchangeRate: 1,
    },
  });

  const depositForm = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      depositDate: new Date(),
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        navigate("/receipts");
        return;
      }

      setLoading(true);
      try {
        // Fetch receipt details
        const data = await leaseReceiptService.getReceiptById(parseInt(id));
        if (data.receipt) {
          setReceipt(data.receipt);
          setPostings(data.postings);
        } else {
          setError("Receipt not found");
          toast.error("Receipt not found");
        }

        // Fetch accounts and banks
        const [accountsData, banksData] = await Promise.all([accountService.getAllAccounts(), bankService.getAllBanks()]);
        setAccounts(accountsData);
        setBanks(banksData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // PDF Generation Handlers
  const handleGenerateReceiptSlip = async () => {
    if (!receipt) return;

    const response = await receiptPdfReport.generateReport(
      "receipt-slip",
      { LeaseReceiptId: receipt.LeaseReceiptID },
      {
        orientation: "Portrait",
        download: true,
        showToast: true,
        filename: `Receipt_Slip_${receipt.ReceiptNo}_${new Date().toISOString().split("T")[0]}.pdf`,
      }
    );

    if (response.success) {
      toast.success("Receipt slip generated successfully");
    }
  };

  const handlePreviewReceiptSlip = async () => {
    if (!receipt) return;

    setShowPdfPreview(true);
    const response = await receiptPdfReport.generateReport(
      "receipt-slip",
      { LeaseReceiptId: receipt.LeaseReceiptID },
      {
        orientation: "Portrait",
        download: false,
        showToast: false,
      }
    );

    if (!response.success) {
      toast.error("Failed to generate receipt slip preview");
    }
  };

  // Format date for display
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format currency
  const formatCurrency = (amount: number | undefined, currencyCode?: string) => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Render status badge
  const renderStatusBadge = (status: string, isPosted?: boolean) => {
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
      <div className="flex items-center gap-2">
        <Badge variant={config.variant} className={config.className}>
          <Icon className="w-3 h-3 mr-1" />
          {status}
        </Badge>
        {isPosted && (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Posted
          </Badge>
        )}
      </div>
    );
  };

  // Action handlers
  const handleCopyReceiptNo = () => {
    if (receipt?.ReceiptNo) {
      navigator.clipboard.writeText(receipt.ReceiptNo);
      toast.success("Receipt number copied to clipboard");
    }
  };

  const handleEdit = () => {
    if (receipt) {
      navigate(`/receipts/edit/${receipt.LeaseReceiptID}`);
    }
  };

  const handleDelete = async () => {
    if (!receipt) return;

    setActionLoading(true);
    try {
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

  const handleStatusChange = async (data: StatusChangeFormValues) => {
    if (!receipt) return;

    setActionLoading(true);
    try {
      const response = await leaseReceiptService.changeReceiptStatus(receipt.LeaseReceiptID, data.newStatus, data.clearanceDate);

      if (response.Status === 1) {
        setReceipt({
          ...receipt,
          PaymentStatus: data.newStatus,
          ClearanceDate: data.clearanceDate,
        });
        toast.success(`Receipt status changed to ${data.newStatus}`);
        setStatusChangeDialogOpen(false);
        statusChangeForm.reset();
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

  const handlePostReceipt = async (data: PostingFormValues) => {
    if (!receipt) return;

    setActionLoading(true);
    try {
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

        // Add new posting entries (mock data - in real app, would refetch from server)
        const newPostings: ReceiptPosting[] = [
          {
            PostingID: Math.random(),
            VoucherNo: response.VoucherNo || `VOL-${Date.now()}`,
            PostingDate: data.postingDate,
            TransactionType: "Debit",
            DebitAmount: receipt.ReceivedAmount,
            CreditAmount: 0,
            Description: data.narration || `Receipt ${receipt.ReceiptNo}`,
            Narration: data.narration || "",
            AccountCode: accounts.find((a) => a.AccountID.toString() === data.debitAccountId)?.AccountCode || "",
            AccountName: accounts.find((a) => a.AccountID.toString() === data.debitAccountId)?.AccountName || "",
            IsReversed: false,
          },
          {
            PostingID: Math.random(),
            VoucherNo: response.VoucherNo || `VOL-${Date.now()}`,
            PostingDate: data.postingDate,
            TransactionType: "Credit",
            DebitAmount: 0,
            CreditAmount: receipt.ReceivedAmount,
            Description: data.narration || `Receipt ${receipt.ReceiptNo}`,
            Narration: data.narration || "",
            AccountCode: accounts.find((a) => a.AccountID.toString() === data.creditAccountId)?.AccountCode || "",
            AccountName: accounts.find((a) => a.AccountID.toString() === data.creditAccountId)?.AccountName || "",
            IsReversed: false,
          },
        ];

        setPostings([...newPostings, ...postings]);

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

  const handleMarkDeposited = async (data: DepositFormValues) => {
    if (!receipt) return;

    setActionLoading(true);
    try {
      const response = await leaseReceiptService.changeReceiptStatus(receipt.LeaseReceiptID, PAYMENT_STATUS.DEPOSITED, data.depositDate);

      if (response.Status === 1) {
        setReceipt({
          ...receipt,
          PaymentStatus: PAYMENT_STATUS.DEPOSITED,
          DepositDate: data.depositDate,
          DepositedBankID: parseInt(data.depositBankId),
        });
        toast.success("Receipt marked as deposited");
        setDepositDialogOpen(false);
        depositForm.reset();
      } else {
        toast.error(response.Message || "Failed to mark receipt as deposited");
      }
    } catch (error) {
      console.error("Error marking receipt as deposited:", error);
      toast.error("Failed to mark receipt as deposited");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReversePosting = async () => {
    if (!selectedPosting || !reversalReason.trim()) {
      toast.error("Reversal reason is required");
      return;
    }

    setActionLoading(true);
    try {
      const reversalRequest: PostingReversalRequest = {
        PostingID: selectedPosting.PostingID,
        ReversalReason: reversalReason.trim(),
      };

      const response = await leaseReceiptService.reverseReceiptPosting(reversalRequest);

      if (response.Status === 1) {
        // Update postings to show reversal
        setPostings(postings.map((p) => (p.VoucherNo === selectedPosting.VoucherNo ? { ...p, IsReversed: true, ReversalReason: reversalReason } : p)));

        if (receipt) {
          setReceipt({ ...receipt, IsPosted: false });
        }

        toast.success("Posting reversed successfully");
        setReversalDialogOpen(false);
        setReversalReason("");
        setSelectedPosting(null);
      } else {
        toast.error(response.Message || "Failed to reverse posting");
      }
    } catch (error) {
      console.error("Error reversing posting:", error);
      toast.error("Failed to reverse posting");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container p-4">
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-red-500 mb-4">{error || "Receipt not found"}</p>
            <Button onClick={() => navigate("/receipts")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Contract Receipts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine available actions based on status
  const canEdit = !receipt.IsPosted && receipt.PaymentStatus !== PAYMENT_STATUS.BOUNCED;
  const canDelete = !receipt.IsPosted && receipt.PaymentStatus !== PAYMENT_STATUS.BOUNCED;
  const canPost = !receipt.IsPosted && (receipt.PaymentStatus === PAYMENT_STATUS.RECEIVED || receipt.PaymentStatus === PAYMENT_STATUS.CLEARED);
  const canMarkDeposited = receipt.PaymentType === PAYMENT_TYPE.CASH || receipt.PaymentType === PAYMENT_TYPE.CHEQUE;
  const canReverse = receipt.IsPosted && postings.some((p) => !p.IsReversed);

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Receipt Details</CardTitle>
            <CardDescription>View and manage receipt information</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/receipts")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {/* PDF Generation Actions */}
            <div className="flex space-x-2">
              <PdfActionButtons
                onDownload={handleGenerateReceiptSlip}
                onPreview={handlePreviewReceiptSlip}
                isLoading={receiptPdfReport.isLoading}
                downloadLabel="Download Receipt Slip"
                previewLabel="Preview Receipt Slip"
                variant="outline"
                size="default"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Receipt Header Information */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex items-center justify-center md:justify-start">
              <div className="h-24 w-24 bg-primary/10 rounded-lg flex items-center justify-center">
                <Receipt className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{receipt.ReceiptNo}</h2>
                  <Button variant="ghost" size="sm" onClick={handleCopyReceiptNo}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">{renderStatusBadge(receipt.PaymentStatus, receipt.IsPosted)}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Receipt Date:</span>
                  <span>{formatDate(receipt.ReceiptDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Customer:</span>
                  <span>{receipt.CustomerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Amount:</span>
                  <span className="text-lg font-semibold">{formatCurrency(receipt.ReceivedAmount, receipt.CurrencyCode)}</span>
                </div>
                {receipt.IsAdvancePayment && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      Advance Payment
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button onClick={handleEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {canPost && (
              <Button onClick={() => setPostingDialogOpen(true)}>
                <Send className="mr-2 h-4 w-4" />
                Post to GL
              </Button>
            )}
            {canMarkDeposited && !receipt.DepositDate && (
              <Button variant="outline" onClick={() => setDepositDialogOpen(true)}>
                <Banknote className="mr-2 h-4 w-4" />
                Mark Deposited
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                statusChangeForm.reset();
                setStatusChangeDialogOpen(true);
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              Change Status
            </Button>
            {canDelete && (
              <Button variant="outline" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">
            <FileText className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="postings">
            <History className="mr-2 h-4 w-4" />
            Postings ({postings.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Receipt Information */}
            <Card>
              <CardHeader>
                <CardTitle>Receipt Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Receipt No:</span>
                  <span className="font-mono">{receipt.ReceiptNo}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Receipt Date:</span>
                  <span>{formatDate(receipt.ReceiptDate)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Payment Type:</span>
                  <Badge variant="outline">{receipt.PaymentType}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Payment Status:</span>
                  {renderStatusBadge(receipt.PaymentStatus)}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Currency:</span>
                  <span>{receipt.CurrencyCode}</span>
                </div>
                {receipt.ExchangeRate && receipt.ExchangeRate !== 1 && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Exchange Rate:</span>
                    <span>{receipt.ExchangeRate}</span>
                  </div>
                )}
                {receipt.InvoiceNo && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Invoice No:</span>
                    <span>{receipt.InvoiceNo}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer & Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Customer & Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Customer:</span>
                  <span className="font-medium">{receipt.CustomerName}</span>
                </div>
                {receipt.CustomerNo && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Customer No:</span>
                    <span>{receipt.CustomerNo}</span>
                  </div>
                )}
                {receipt.PropertyName && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Property:</span>
                    <span>{receipt.PropertyName}</span>
                  </div>
                )}
                {receipt.UnitNo && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Unit:</span>
                    <span>{receipt.UnitNo}</span>
                  </div>
                )}
                {receipt.ContractNo && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Contract:</span>
                    <span>{receipt.ContractNo}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Amount Breakdown */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Amount Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Received Amount:</span>
                  <div className="text-xl font-bold text-primary">{formatCurrency(receipt.ReceivedAmount, receipt.CurrencyCode)}</div>
                </div>
                {receipt.SecurityDepositAmount && receipt.SecurityDepositAmount > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Security Deposit:</span>
                    <div className="text-lg font-semibold">{formatCurrency(receipt.SecurityDepositAmount, receipt.CurrencyCode)}</div>
                  </div>
                )}
                {receipt.PenaltyAmount && receipt.PenaltyAmount > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Penalty Amount:</span>
                    <div className="text-lg font-semibold">{formatCurrency(receipt.PenaltyAmount, receipt.CurrencyCode)}</div>
                  </div>
                )}
                {receipt.DiscountAmount && receipt.DiscountAmount > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Discount:</span>
                    <div className="text-lg font-semibold">{formatCurrency(receipt.DiscountAmount, receipt.CurrencyCode)}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Details */}
          {(receipt.PaymentType === PAYMENT_TYPE.CHEQUE || receipt.PaymentType === PAYMENT_TYPE.BANK_TRANSFER) && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Payment Method Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {receipt.PaymentType === PAYMENT_TYPE.CHEQUE && (
                    <>
                      {receipt.ChequeNo && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-muted-foreground">Cheque Number:</span>
                          <div className="font-mono">{receipt.ChequeNo}</div>
                        </div>
                      )}
                      {receipt.ChequeDate && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-muted-foreground">Cheque Date:</span>
                          <div>{formatDate(receipt.ChequeDate)}</div>
                        </div>
                      )}
                    </>
                  )}
                  {receipt.PaymentType === PAYMENT_TYPE.BANK_TRANSFER && receipt.TransactionReference && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">Transaction Reference:</span>
                      <div className="font-mono">{receipt.TransactionReference}</div>
                    </div>
                  )}
                  {receipt.BankName && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">Bank:</span>
                      <div>{receipt.BankName}</div>
                    </div>
                  )}
                  {receipt.BankAccountNo && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">Account Number:</span>
                      <div className="font-mono">{receipt.BankAccountNo}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deposit Information */}
          {(receipt.DepositDate || receipt.ClearanceDate) && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Deposit & Clearance Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {receipt.DepositDate && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">Deposit Date:</span>
                      <div>{formatDate(receipt.DepositDate)}</div>
                    </div>
                  )}
                  {receipt.DepositBankName && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">Deposit Bank:</span>
                      <div>{receipt.DepositBankName}</div>
                    </div>
                  )}
                  {receipt.ClearanceDate && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">Clearance Date:</span>
                      <div>{formatDate(receipt.ClearanceDate)}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {receipt.Notes && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm bg-muted/50 p-3 rounded-md">{receipt.Notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Audit Information */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Audit Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Created By:</span>
                    <span>{receipt.CreatedBy || "—"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Created On:</span>
                    <span>{formatDate(receipt.CreatedOn)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Updated By:</span>
                    <span>{receipt.UpdatedBy || "—"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Updated On:</span>
                    <span>{receipt.UpdatedOn ? formatDate(receipt.UpdatedOn) : "—"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Postings Tab */}
        <TabsContent value="postings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Posting Entries</CardTitle>
              {canPost && (
                <Button onClick={() => setPostingDialogOpen(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  Post to GL
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {postings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                  <p>This receipt has not been posted to the general ledger yet.</p>
                  {canPost && (
                    <Button className="mt-4" onClick={() => setPostingDialogOpen(true)}>
                      <Send className="mr-2 h-4 w-4" />
                      Post Now
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Voucher No</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Debit</TableHead>
                        <TableHead>Credit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {postings.map((posting) => (
                        <TableRow key={posting.PostingID}>
                          <TableCell className="font-medium">{posting.VoucherNo}</TableCell>
                          <TableCell>{formatDate(posting.PostingDate)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{posting.AccountCode}</div>
                              <div className="text-sm text-muted-foreground">{posting.AccountName}</div>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(posting.DebitAmount, receipt.CurrencyCode)}</TableCell>
                          <TableCell>{formatCurrency(posting.CreditAmount, receipt.CurrencyCode)}</TableCell>
                          <TableCell>{posting.IsReversed ? <Badge variant="destructive">Reversed</Badge> : <Badge variant="default">Posted</Badge>}</TableCell>
                          <TableCell>
                            {!posting.IsReversed && canReverse && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPosting(posting);
                                  setReversalDialogOpen(true);
                                }}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Receipt Created</div>
                    <div className="text-sm text-muted-foreground">
                      Receipt {receipt.ReceiptNo} was created by {receipt.CreatedBy}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{formatDate(receipt.CreatedOn)}</div>
                  </div>
                </div>

                {receipt.DepositDate && (
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Banknote className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Payment Deposited</div>
                      <div className="text-sm text-muted-foreground">Payment was deposited to bank</div>
                      <div className="text-xs text-muted-foreground mt-1">{formatDate(receipt.DepositDate)}</div>
                    </div>
                  </div>
                )}

                {receipt.ClearanceDate && (
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Payment Cleared</div>
                      <div className="text-sm text-muted-foreground">Payment was cleared by bank</div>
                      <div className="text-xs text-muted-foreground mt-1">{formatDate(receipt.ClearanceDate)}</div>
                    </div>
                  </div>
                )}

                {receipt.IsPosted && (
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Send className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Posted to General Ledger</div>
                      <div className="text-sm text-muted-foreground">Receipt was posted to the general ledger</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        pdfBlob={receiptPdfReport.data}
        title={`Receipt Slip - ${receipt.ReceiptNo}`}
        isLoading={receiptPdfReport.isLoading}
        error={receiptPdfReport.error}
        onDownload={() => receiptPdfReport.downloadCurrentPdf(`Receipt_Slip_${receipt.ReceiptNo}.pdf`)}
        onRefresh={handlePreviewReceiptSlip}
      />

      {/* Status Change Dialog */}
      <Dialog open={statusChangeDialogOpen} onOpenChange={setStatusChangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Receipt Status</DialogTitle>
            <DialogDescription>Select the new status for receipt {receipt.ReceiptNo}</DialogDescription>
          </DialogHeader>
          <Form {...statusChangeForm}>
            <form onSubmit={statusChangeForm.handleSubmit(handleStatusChange)} className="space-y-4">
              <FormField
                form={statusChangeForm}
                name="newStatus"
                label="New Status"
                type="select"
                options={paymentStatusOptions
                  .filter((status) => status !== receipt.PaymentStatus)
                  .map((status) => ({
                    label: status,
                    value: status,
                  }))}
                placeholder="Select new status"
                required
              />
              {statusChangeForm.watch("newStatus") === PAYMENT_STATUS.CLEARED && (
                <FormField form={statusChangeForm} name="clearanceDate" label="Clearance Date" type="date" description="Date when payment was cleared" />
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setStatusChangeDialogOpen(false)} disabled={actionLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    "Change Status"
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
              Configure posting details for receipt {receipt.ReceiptNo}
              <br />
              Amount: {formatCurrency(receipt.ReceivedAmount, receipt.CurrencyCode)}
            </DialogDescription>
          </DialogHeader>
          <Form {...postingForm}>
            <form onSubmit={postingForm.handleSubmit(handlePostReceipt)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField form={postingForm} name="postingDate" label="Posting Date" type="date" required description="Date for posting entries" />
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
                      Post Receipt
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Deposited</DialogTitle>
            <DialogDescription>Mark receipt {receipt.ReceiptNo} as deposited to bank</DialogDescription>
          </DialogHeader>
          <Form {...depositForm}>
            <form onSubmit={depositForm.handleSubmit(handleMarkDeposited)} className="space-y-4">
              <FormField form={depositForm} name="depositDate" label="Deposit Date" type="date" required description="Date when payment was deposited" />
              <FormField
                form={depositForm}
                name="depositBankId"
                label="Deposit Bank"
                type="select"
                options={banks.map((bank) => ({
                  label: bank.BankName,
                  value: bank.BankID.toString(),
                }))}
                placeholder="Select deposit bank"
                required
                description="Bank where payment was deposited"
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDepositDialogOpen(false)} disabled={actionLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Banknote className="mr-2 h-4 w-4" />
                      Mark as Deposited
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reversal Dialog */}
      <Dialog open={reversalDialogOpen} onOpenChange={setReversalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reverse Posting</DialogTitle>
            <DialogDescription>
              Are you sure you want to reverse the posting for voucher {selectedPosting?.VoucherNo}? This will create offsetting journal entries.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reversal-reason">Reversal Reason *</Label>
              <Textarea id="reversal-reason" placeholder="Enter reason for reversal" value={reversalReason} onChange={(e) => setReversalReason(e.target.value)} required />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReversalDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleReversePosting} disabled={actionLoading || !reversalReason.trim()} variant="destructive">
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reverse Posting
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Receipt"
        description={`Are you sure you want to delete receipt "${receipt.ReceiptNo}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default ContractReceiptDetails;
