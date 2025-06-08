// src/pages/contractInvoice/ContractInvoiceDetails.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { contractInvoiceService } from "@/services/contractInvoiceService";
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
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ContractInvoice, InvoicePayment, InvoicePosting, InvoicePostingRequest, InvoicePaymentRequest, PostingReversalRequest } from "@/types/contractInvoiceTypes";

export const ContractInvoiceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State variables
  const [invoice, setInvoice] = useState<ContractInvoice | null>(null);
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [postings, setPostings] = useState<InvoicePosting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [postingDialogOpen, setPostingDialogOpen] = useState(false);
  const [reversalDialogOpen, setReversalDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form states
  const [newStatus, setNewStatus] = useState<string>("");
  const [reversalReason, setReversalReason] = useState("");
  const [selectedPosting, setSelectedPosting] = useState<InvoicePosting | null>(null);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    paymentAmount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Cash",
    paymentReference: "",
    notes: "",
  });

  // Posting form state
  const [postingForm, setPostingForm] = useState({
    postingDate: new Date().toISOString().split("T")[0],
    debitAccountId: "",
    creditAccountId: "",
    narration: "",
    exchangeRate: 1,
  });

  // Loading states for actions
  const [actionLoading, setActionLoading] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState("details");

  // Mock reference data
  const accounts = [
    { AccountID: 1, AccountCode: "1200", AccountName: "Accounts Receivable" },
    { AccountID: 2, AccountCode: "4100", AccountName: "Rental Revenue" },
    { AccountID: 3, AccountCode: "4200", AccountName: "Service Revenue" },
  ];

  const paymentMethods = ["Cash", "Cheque", "Bank Transfer", "Credit Card", "Online"];
  const invoiceStatusOptions = ["Draft", "Pending", "Approved", "Active", "Paid", "Cancelled", "Voided"];

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!id) {
        navigate("/invoices");
        return;
      }

      setLoading(true);
      try {
        const data = await contractInvoiceService.getInvoiceById(parseInt(id));

        if (data.invoice) {
          setInvoice(data.invoice);
          setPayments(data.payments || []);
          setPostings(data.postings || []);

          // Set payment form default amount
          setPaymentForm((prev) => ({
            ...prev,
            paymentAmount: data.invoice.BalanceAmount || 0,
          }));
        } else {
          setError("Invoice not found");
          toast.error("Invoice not found");
        }
      } catch (err) {
        console.error("Error fetching invoice details:", err);
        setError("Failed to load invoice details");
        toast.error("Failed to load invoice details");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [id, navigate]);

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
  const renderStatusBadge = (status: string, isPosted?: boolean, isOverdue?: boolean) => {
    const statusConfig = {
      Draft: { variant: "secondary" as const, icon: FileText, className: "bg-gray-100 text-gray-800" },
      Pending: { variant: "default" as const, icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      Approved: { variant: "default" as const, icon: CheckCircle, className: "bg-blue-100 text-blue-800" },
      Active: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" },
      Paid: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" },
      Cancelled: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800" },
      Voided: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Draft;
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
        {isOverdue && (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        )}
      </div>
    );
  };

  // Action handlers
  const handleCopyInvoiceNo = () => {
    if (invoice?.InvoiceNo) {
      navigator.clipboard.writeText(invoice.InvoiceNo);
      toast.success("Invoice number copied to clipboard");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    if (invoice) {
      navigate(`/invoices/edit/${invoice.LeaseInvoiceID}`);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;

    setActionLoading(true);
    try {
      const response = await contractInvoiceService.deleteInvoice(invoice.LeaseInvoiceID);

      if (response.Status === 1) {
        toast.success("Invoice deleted successfully");
        navigate("/invoices");
      } else {
        toast.error(response.Message || "Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleStatusChange = async () => {
    if (!invoice || !newStatus) return;

    setActionLoading(true);
    try {
      const response = await contractInvoiceService.changeInvoiceStatus(invoice.LeaseInvoiceID, newStatus);

      if (response.Status === 1) {
        setInvoice({ ...invoice, InvoiceStatus: newStatus });
        toast.success(`Invoice status changed to ${newStatus}`);
        setStatusChangeDialogOpen(false);
        setNewStatus("");
      } else {
        toast.error(response.Message || "Failed to change invoice status");
      }
    } catch (error) {
      console.error("Error changing invoice status:", error);
      toast.error("Failed to change invoice status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!invoice || paymentForm.paymentAmount <= 0) return;

    setActionLoading(true);
    try {
      const paymentRequest: InvoicePaymentRequest = {
        LeaseInvoiceID: invoice.LeaseInvoiceID,
        PaymentAmount: paymentForm.paymentAmount,
        PaymentDate: paymentForm.paymentDate,
        PaymentMethod: paymentForm.paymentMethod,
        PaymentReference: paymentForm.paymentReference,
        Notes: paymentForm.notes,
      };

      const response = await contractInvoiceService.recordPayment(paymentRequest);

      if (response.Status === 1) {
        // Update invoice amounts
        const newPaidAmount = invoice.PaidAmount + paymentForm.paymentAmount;
        const newBalanceAmount = invoice.BalanceAmount - paymentForm.paymentAmount;
        const newStatus = newBalanceAmount <= 0 ? "Paid" : invoice.InvoiceStatus;

        setInvoice({
          ...invoice,
          PaidAmount: newPaidAmount,
          BalanceAmount: newBalanceAmount,
          InvoiceStatus: newStatus,
        });

        // Add new payment to list
        const newPayment: InvoicePayment = {
          LeaseReceiptID: Math.random(), // Mock ID
          ReceiptNo: response.ReceiptNo || `REC-${Date.now()}`,
          ReceiptDate: paymentForm.paymentDate,
          ReceivedAmount: paymentForm.paymentAmount,
          PaymentType: paymentForm.paymentMethod,
          PaymentStatus: "Cleared",
          TransactionReference: paymentForm.paymentReference,
          Notes: paymentForm.notes,
        };
        setPayments([newPayment, ...payments]);

        toast.success("Payment recorded successfully");
        setPaymentDialogOpen(false);

        // Reset payment form
        setPaymentForm({
          paymentAmount: newBalanceAmount,
          paymentDate: new Date().toISOString().split("T")[0],
          paymentMethod: "Cash",
          paymentReference: "",
          notes: "",
        });
      } else {
        toast.error(response.Message || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostInvoice = async () => {
    if (!invoice || !postingForm.debitAccountId || !postingForm.creditAccountId) return;

    setActionLoading(true);
    try {
      const postingRequest: InvoicePostingRequest = {
        LeaseInvoiceID: invoice.LeaseInvoiceID,
        PostingDate: postingForm.postingDate,
        DebitAccountID: parseInt(postingForm.debitAccountId),
        CreditAccountID: parseInt(postingForm.creditAccountId),
        PostingNarration: postingForm.narration,
        ExchangeRate: postingForm.exchangeRate,
      };

      const response = await contractInvoiceService.postSingleInvoice(postingRequest);

      if (response.Status === 1) {
        setInvoice({ ...invoice, IsPosted: true });

        // Add new posting entries
        const debitPosting: InvoicePosting = {
          PostingID: Math.random(),
          VoucherNo: response.VoucherNo || `VOL-${Date.now()}`,
          PostingDate: postingForm.postingDate,
          TransactionType: "Debit",
          DebitAmount: invoice.TotalAmount,
          CreditAmount: 0,
          Description: postingForm.narration || `Invoice ${invoice.InvoiceNo}`,
          Narration: postingForm.narration || "",
          AccountCode: accounts.find((a) => a.AccountID.toString() === postingForm.debitAccountId)?.AccountCode || "",
          AccountName: accounts.find((a) => a.AccountID.toString() === postingForm.debitAccountId)?.AccountName || "",
          IsReversed: false,
        };

        const creditPosting: InvoicePosting = {
          PostingID: Math.random(),
          VoucherNo: response.VoucherNo || `VOL-${Date.now()}`,
          PostingDate: postingForm.postingDate,
          TransactionType: "Credit",
          DebitAmount: 0,
          CreditAmount: invoice.TotalAmount,
          Description: postingForm.narration || `Invoice ${invoice.InvoiceNo}`,
          Narration: postingForm.narration || "",
          AccountCode: accounts.find((a) => a.AccountID.toString() === postingForm.creditAccountId)?.AccountCode || "",
          AccountName: accounts.find((a) => a.AccountID.toString() === postingForm.creditAccountId)?.AccountName || "",
          IsReversed: false,
        };

        setPostings([debitPosting, creditPosting, ...postings]);

        toast.success("Invoice posted successfully");
        setPostingDialogOpen(false);

        // Reset posting form
        setPostingForm({
          postingDate: new Date().toISOString().split("T")[0],
          debitAccountId: "",
          creditAccountId: "",
          narration: "",
          exchangeRate: 1,
        });
      } else {
        toast.error(response.Message || "Failed to post invoice");
      }
    } catch (error) {
      console.error("Error posting invoice:", error);
      toast.error("Failed to post invoice");
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

      const response = await contractInvoiceService.reverseInvoicePosting(reversalRequest);

      if (response.Status === 1) {
        // Update postings to show reversal
        setPostings(postings.map((p) => (p.VoucherNo === selectedPosting.VoucherNo ? { ...p, IsReversed: true, ReversalReason: reversalReason } : p)));

        if (invoice) {
          setInvoice({ ...invoice, IsPosted: false });
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
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded-md w-3/4 mx-auto"></div>
            <div className="h-64 bg-gray-200 rounded-md w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-red-500 mb-4">{error || "Invoice not found"}</p>
            <Button onClick={() => navigate("/invoices")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Contract Invoices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine available actions based on status
  const canEdit = !invoice.IsPosted && invoice.InvoiceStatus !== "Paid";
  const canDelete = !invoice.IsPosted && invoice.InvoiceStatus !== "Paid";
  const canPost = !invoice.IsPosted && (invoice.InvoiceStatus === "Approved" || invoice.InvoiceStatus === "Active");
  const canRecordPayment = invoice.BalanceAmount > 0;
  const canReverse = invoice.IsPosted && postings.some((p) => !p.IsReversed);

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Invoice Details</CardTitle>
            <CardDescription>View and manage invoice information</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/invoices")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Invoice Header Information */}
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
                  <h2 className="text-2xl font-bold">{invoice.InvoiceNo}</h2>
                  <Button variant="ghost" size="sm" onClick={handleCopyInvoiceNo}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">{renderStatusBadge(invoice.InvoiceStatus, invoice.IsPosted, invoice.IsOverdue)}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Invoice Date:</span>
                  <span>{formatDate(invoice.InvoiceDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Due Date:</span>
                  <span>{formatDate(invoice.DueDate)}</span>
                  {invoice.IsOverdue && (
                    <Badge variant="destructive" className="ml-2">
                      {invoice.DaysOverdue} days overdue
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Total Amount:</span>
                  <span className="text-lg font-semibold">{formatCurrency(invoice.TotalAmount, invoice.CurrencyCode)}</span>
                </div>
                {invoice.BalanceAmount > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="font-medium">Outstanding:</span>
                    <span className="text-lg font-semibold text-red-600">{formatCurrency(invoice.BalanceAmount, invoice.CurrencyCode)}</span>
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
            {canRecordPayment && (
              <Button variant="outline" onClick={() => setPaymentDialogOpen(true)}>
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            )}
            {invoice.InvoiceStatus !== "Paid" && (
              <Button
                variant="outline"
                onClick={() => {
                  setNewStatus("");
                  setStatusChangeDialogOpen(true);
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Change Status
              </Button>
            )}
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">
            <FileText className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="mr-2 h-4 w-4" />
            Payments ({payments.length})
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
            {/* Invoice Information */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Invoice No:</span>
                  <span className="font-mono">{invoice.InvoiceNo}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Invoice Type:</span>
                  <Badge variant="outline">{invoice.InvoiceType}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Invoice Date:</span>
                  <span>{formatDate(invoice.InvoiceDate)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Due Date:</span>
                  <span>{formatDate(invoice.DueDate)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Currency:</span>
                  <span>{invoice.CurrencyCode}</span>
                </div>
                {invoice.ExchangeRate && invoice.ExchangeRate !== 1 && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Exchange Rate:</span>
                    <span>{invoice.ExchangeRate}</span>
                  </div>
                )}
                {invoice.PeriodFromDate && invoice.PeriodToDate && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Period From:</span>
                      <span>{formatDate(invoice.PeriodFromDate)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Period To:</span>
                      <span>{formatDate(invoice.PeriodToDate)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Customer & Contract Details */}
            <Card>
              <CardHeader>
                <CardTitle>Customer & Contract Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Customer:</span>
                  <span className="font-medium">{invoice.CustomerName}</span>
                </div>
                {invoice.CustomerNo && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Customer No:</span>
                    <span>{invoice.CustomerNo}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Contract:</span>
                  <span>{invoice.ContractNo}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Property:</span>
                  <span>{invoice.PropertyName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Unit:</span>
                  <span>{invoice.UnitNo}</span>
                </div>
                {invoice.UnitStatus && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Unit Status:</span>
                    <Badge variant="outline">{invoice.UnitStatus}</Badge>
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
                  <span className="text-sm font-medium text-muted-foreground">Sub Total:</span>
                  <div className="text-lg font-semibold">{formatCurrency(invoice.SubTotal, invoice.CurrencyCode)}</div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Tax Amount:</span>
                  <div className="text-lg font-semibold">{formatCurrency(invoice.TaxAmount, invoice.CurrencyCode)}</div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Discount:</span>
                  <div className="text-lg font-semibold">{formatCurrency(invoice.DiscountAmount, invoice.CurrencyCode)}</div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Total Amount:</span>
                  <div className="text-xl font-bold text-primary">{formatCurrency(invoice.TotalAmount, invoice.CurrencyCode)}</div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Paid Amount:</span>
                  <div className="text-lg font-semibold text-green-600">{formatCurrency(invoice.PaidAmount, invoice.CurrencyCode)}</div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Balance Amount:</span>
                  <div className={`text-lg font-semibold ${invoice.BalanceAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatCurrency(invoice.BalanceAmount, invoice.CurrencyCode)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {(invoice.Notes || invoice.InternalNotes) && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.Notes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Customer Notes:</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">{invoice.Notes}</p>
                  </div>
                )}
                {invoice.InternalNotes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Internal Notes:</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">{invoice.InternalNotes}</p>
                  </div>
                )}
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
                    <span>{invoice.CreatedBy || "—"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Created On:</span>
                    <span>{formatDate(invoice.CreatedOn)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Updated By:</span>
                    <span>{invoice.UpdatedBy || "—"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Updated On:</span>
                    <span>{invoice.UpdatedOn ? formatDate(invoice.UpdatedOn) : "—"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payment History</CardTitle>
              {canRecordPayment && (
                <Button onClick={() => setPaymentDialogOpen(true)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                  <p>No payments have been recorded for this invoice.</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt No</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.LeaseReceiptID}>
                          <TableCell className="font-medium">{payment.ReceiptNo}</TableCell>
                          <TableCell>{formatDate(payment.ReceiptDate)}</TableCell>
                          <TableCell>{formatCurrency(payment.ReceivedAmount, invoice.CurrencyCode)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.PaymentType}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={payment.PaymentStatus === "Cleared" ? "default" : "secondary"}>{payment.PaymentStatus}</Badge>
                          </TableCell>
                          <TableCell>{payment.TransactionReference || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
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
                  <p>This invoice has not been posted to the general ledger yet.</p>
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
                          <TableCell>{formatCurrency(posting.DebitAmount, invoice.CurrencyCode)}</TableCell>
                          <TableCell>{formatCurrency(posting.CreditAmount, invoice.CurrencyCode)}</TableCell>
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
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Invoice Created</div>
                    <div className="text-sm text-muted-foreground">
                      Invoice {invoice.InvoiceNo} was created by {invoice.CreatedBy}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{formatDate(invoice.CreatedOn)}</div>
                  </div>
                </div>

                {invoice.IsPosted && (
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Send className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Posted to General Ledger</div>
                      <div className="text-sm text-muted-foreground">Invoice was posted to the general ledger</div>
                    </div>
                  </div>
                )}

                {payments.map((payment, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Payment Received</div>
                      <div className="text-sm text-muted-foreground">
                        Payment of {formatCurrency(payment.ReceivedAmount, invoice.CurrencyCode)} received via {payment.PaymentType}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{formatDate(payment.ReceiptDate)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Change Dialog */}
      <Dialog open={statusChangeDialogOpen} onOpenChange={setStatusChangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Invoice Status</DialogTitle>
            <DialogDescription>Select the new status for invoice {invoice.InvoiceNo}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {invoiceStatusOptions
                    .filter((status) => status !== invoice.InvoiceStatus)
                    .map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusChangeDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={actionLoading || !newStatus}>
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
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for invoice {invoice.InvoiceNo}
              <br />
              Outstanding balance: {formatCurrency(invoice.BalanceAmount, invoice.CurrencyCode)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-amount">Payment Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                value={paymentForm.paymentAmount}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentAmount: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter payment amount"
              />
            </div>
            <div>
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input id="payment-date" type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))} />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentForm.paymentMethod} onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, paymentMethod: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment-reference">Reference Number</Label>
              <Input
                id="payment-reference"
                value={paymentForm.paymentReference}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentReference: e.target.value }))}
                placeholder="Check number, transaction ID, etc."
              />
            </div>
            <div>
              <Label htmlFor="payment-notes">Notes</Label>
              <Textarea
                id="payment-notes"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={actionLoading || paymentForm.paymentAmount <= 0}>
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Record Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Posting Dialog */}
      <Dialog open={postingDialogOpen} onOpenChange={setPostingDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Post Invoice to General Ledger</DialogTitle>
            <DialogDescription>
              Configure posting details for invoice {invoice.InvoiceNo}
              <br />
              Amount: {formatCurrency(invoice.TotalAmount, invoice.CurrencyCode)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="posting-date">Posting Date</Label>
                <Input id="posting-date" type="date" value={postingForm.postingDate} onChange={(e) => setPostingForm((prev) => ({ ...prev, postingDate: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="exchange-rate">Exchange Rate</Label>
                <Input
                  id="exchange-rate"
                  type="number"
                  step="0.0001"
                  value={postingForm.exchangeRate}
                  onChange={(e) => setPostingForm((prev) => ({ ...prev, exchangeRate: parseFloat(e.target.value) || 1 }))}
                  placeholder="1.0000"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Debit Account</Label>
                <Select value={postingForm.debitAccountId} onValueChange={(value) => setPostingForm((prev) => ({ ...prev, debitAccountId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select debit account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((acc) => acc.AccountCode.startsWith("1"))
                      .map((account) => (
                        <SelectItem key={account.AccountID} value={account.AccountID.toString()}>
                          {account.AccountCode} - {account.AccountName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Credit Account</Label>
                <Select value={postingForm.creditAccountId} onValueChange={(value) => setPostingForm((prev) => ({ ...prev, creditAccountId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select credit account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((acc) => acc.AccountCode.startsWith("4"))
                      .map((account) => (
                        <SelectItem key={account.AccountID} value={account.AccountID.toString()}>
                          {account.AccountCode} - {account.AccountName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="posting-narration">Narration</Label>
              <Textarea
                id="posting-narration"
                value={postingForm.narration}
                onChange={(e) => setPostingForm((prev) => ({ ...prev, narration: e.target.value }))}
                placeholder="Enter posting narration"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostingDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handlePostInvoice} disabled={actionLoading || !postingForm.debitAccountId || !postingForm.creditAccountId}>
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Post Invoice
                </>
              )}
            </Button>
          </DialogFooter>
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
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice "${invoice.InvoiceNo}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default ContractInvoiceDetails;
