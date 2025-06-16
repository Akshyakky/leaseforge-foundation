// src/pages/invoice/InvoiceDetails.tsx - Enhanced with PDF Generation
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  Printer,
  Send,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  User,
  Building,
  Calendar,
  CreditCard,
  Receipt,
  Eye,
  Plus,
  History,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { invoiceService, LeaseInvoice } from "@/services/invoiceService";
import { receiptService, LeaseReceipt, PaymentStatus } from "@/services/receiptService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { format } from "date-fns";

// PDF Generation Components and Hooks
import { PdfPreviewModal, PdfActionButtons } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";

const InvoiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State variables
  const [invoice, setInvoice] = useState<LeaseInvoice | null>(null);
  const [receipts, setReceipts] = useState<LeaseReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // PDF Generation State
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const invoicePdfReport = useGenericPdfReport();

  // Invoice status and type options
  const invoiceStatusOptions = ["Draft", "Pending", "Sent", "Partial", "Paid", "Overdue", "Cancelled"];

  // Fetch invoice data and related receipts
  useEffect(() => {
    if (id) {
      fetchInvoiceDetails();
      fetchInvoiceReceipts();
    }
  }, [id]);

  const fetchInvoiceDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const invoiceData = await invoiceService.getInvoiceById(parseInt(id));

      if (invoiceData) {
        setInvoice(invoiceData);
      } else {
        toast.error("Invoice not found");
        navigate("/invoices");
      }
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      toast.error("Failed to load invoice details");
      navigate("/invoices");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceReceipts = async () => {
    if (!id) return;

    try {
      setReceiptsLoading(true);
      const receiptsData = await receiptService.getReceiptsByInvoice(parseInt(id));
      setReceipts(receiptsData);
    } catch (error) {
      console.error("Error fetching invoice receipts:", error);
    } finally {
      setReceiptsLoading(false);
    }
  };

  // PDF Generation Handlers
  const handleGenerateInvoiceSlip = async () => {
    if (!invoice) return;

    const response = await invoicePdfReport.generateReport(
      "invoice-slip",
      { InvoiceId: invoice.LeaseInvoiceID },
      {
        orientation: "Portrait",
        download: true,
        showToast: true,
        filename: `Invoice_${invoice.InvoiceNo}_${new Date().toISOString().split("T")[0]}.pdf`,
      }
    );

    if (response.success) {
      toast.success("Invoice slip generated successfully");
    }
  };

  const handlePreviewInvoiceSlip = async () => {
    if (!invoice) return;

    setShowPdfPreview(true);
    const response = await invoicePdfReport.generateReport(
      "invoice-slip",
      { InvoiceId: invoice.LeaseInvoiceID },
      {
        orientation: "Portrait",
        download: false,
        showToast: false,
      }
    );

    if (!response.success) {
      toast.error("Failed to generate invoice slip preview");
    }
  };

  // Navigation handlers
  const handleBack = () => {
    navigate("/invoices");
  };

  const handleEdit = () => {
    if (invoice) {
      navigate(`/invoices/edit/${invoice.LeaseInvoiceID}`);
    }
  };

  const handleSend = () => {
    toast.info("Send functionality will be implemented");
  };

  // Delete handlers
  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!invoice) return;

    try {
      setActionLoading(true);
      const response = await invoiceService.deleteInvoice(invoice.LeaseInvoiceID);

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
      closeDeleteDialog();
    }
  };

  // Status change handlers
  const openStatusChangeDialog = (status: string) => {
    setSelectedStatus(status);
    setIsStatusChangeDialogOpen(true);
  };

  const closeStatusChangeDialog = () => {
    setIsStatusChangeDialogOpen(false);
    setSelectedStatus("");
  };

  const handleStatusChange = async () => {
    if (!invoice || !selectedStatus) return;

    try {
      setActionLoading(true);
      const response = await invoiceService.changeInvoiceStatus(invoice.LeaseInvoiceID, selectedStatus);

      if (response.Status === 1) {
        setInvoice({ ...invoice, InvoiceStatus: selectedStatus });
        toast.success(`Invoice status changed to ${selectedStatus}`);
      } else {
        toast.error(response.Message || "Failed to change invoice status");
      }
    } catch (error) {
      console.error("Error changing invoice status:", error);
      toast.error("Failed to change invoice status");
    } finally {
      setActionLoading(false);
      closeStatusChangeDialog();
    }
  };

  // Post to GL handler
  const handlePostToGL = async () => {
    if (!invoice) return;

    try {
      setActionLoading(true);
      const response = await invoiceService.postInvoiceToGL(invoice.LeaseInvoiceID);

      if (response.Status === 1) {
        toast.success("Invoice posted to GL successfully");
        // Refresh invoice data
        fetchInvoiceDetails();
      } else {
        toast.error(response.Message || "Failed to post invoice to GL");
      }
    } catch (error) {
      console.error("Error posting invoice to GL:", error);
      toast.error("Failed to post invoice to GL");
    } finally {
      setActionLoading(false);
    }
  };

  // Receipt handlers
  const handleCreateReceipt = () => {
    if (invoice) {
      navigate(`/receipts/new?invoiceId=${invoice.LeaseInvoiceID}`);
    }
  };

  const handleViewReceipt = (receiptId: number) => {
    navigate(`/receipts/${receiptId}`);
  };

  const handleRefreshReceipts = () => {
    fetchInvoiceReceipts();
    fetchInvoiceDetails(); // Also refresh invoice to get updated amounts
  };

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "dd MMM yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "0.00";
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Get status color for badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "default";
      case "Draft":
        return "secondary";
      case "Pending":
      case "Sent":
        return "outline";
      case "Partial":
        return "default";
      case "Overdue":
        return "destructive";
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid":
        return <CheckCircle className="h-4 w-4" />;
      case "Overdue":
        return <AlertTriangle className="h-4 w-4" />;
      case "Partial":
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get receipt status color
  const getReceiptStatusColor = (status: string) => {
    switch (status) {
      case PaymentStatus.CLEARED:
        return "default";
      case PaymentStatus.RECEIVED:
        return "secondary";
      case PaymentStatus.DEPOSITED:
        return "outline";
      case PaymentStatus.BOUNCED:
      case PaymentStatus.CANCELLED:
      case PaymentStatus.REVERSED:
        return "destructive";
      default:
        return "outline";
    }
  };

  // Calculate payment summary
  const getPaymentSummary = () => {
    const validReceipts = receipts.filter(
      (r) => r.PaymentStatus !== PaymentStatus.CANCELLED && r.PaymentStatus !== PaymentStatus.BOUNCED && r.PaymentStatus !== PaymentStatus.REVERSED
    );

    const totalPaid = validReceipts.reduce((sum, receipt) => sum + receipt.ReceivedAmount, 0);
    const pendingReceipts = receipts.filter((r) => r.PaymentStatus === PaymentStatus.RECEIVED || r.PaymentStatus === PaymentStatus.DEPOSITED);
    const pendingAmount = pendingReceipts.reduce((sum, receipt) => sum + receipt.ReceivedAmount, 0);

    return {
      totalPaid,
      pendingAmount,
      receiptCount: validReceipts.length,
      pendingCount: pendingReceipts.length,
    };
  };

  const paymentSummary = getPaymentSummary();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Invoice Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">The requested invoice could not be found.</p>
            <div className="flex justify-center mt-4">
              <Button onClick={handleBack}>Back to Invoices</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Invoice Details</h1>
            <p className="text-muted-foreground">{invoice.InvoiceNo}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant={getStatusColor(invoice.InvoiceStatus)} className="flex items-center gap-1">
            {getStatusIcon(invoice.InvoiceStatus)}
            {invoice.InvoiceStatus}
          </Badge>

          {/* PDF Generation Actions */}
          <div className="flex space-x-2">
            <PdfActionButtons
              onDownload={handleGenerateInvoiceSlip}
              onPreview={handlePreviewInvoiceSlip}
              isLoading={invoicePdfReport.isLoading}
              downloadLabel="Download Invoice"
              previewLabel="Preview Invoice"
              variant="outline"
              size="default"
            />
          </div>

          <Button variant="outline" size="sm" onClick={handleEdit} disabled={invoice.InvoiceStatus === "Paid"}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSend}>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem disabled className="font-medium text-muted-foreground">
                Change Status
              </DropdownMenuItem>

              {invoiceStatusOptions
                .filter((status) => status !== invoice.InvoiceStatus)
                .map((status) => (
                  <DropdownMenuItem key={status} onClick={() => openStatusChangeDialog(status)}>
                    Set as {status}
                  </DropdownMenuItem>
                ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handlePostToGL} disabled={invoice.InvoiceStatus === "Draft" || invoice.InvoiceStatus === "Cancelled"}>
                <DollarSign className="h-4 w-4 mr-2" />
                Post to GL
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem className="text-red-500" onClick={openDeleteDialog} disabled={invoice.InvoiceStatus === "Paid" || invoice.PaidAmount > 0}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Overdue Warning */}
      {invoice.OverdueDays && invoice.OverdueDays > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">This invoice is {invoice.OverdueDays} days overdue</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
              <CardDescription>Basic invoice details and dates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                  <p className="text-lg font-semibold">{invoice.InvoiceNo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Invoice Type</label>
                  <p>{invoice.InvoiceType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Invoice Date</label>
                  <p>{formatDate(invoice.InvoiceDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                  <p className={invoice.OverdueDays && invoice.OverdueDays > 0 ? "text-red-600 font-medium" : ""}>{formatDate(invoice.DueDate)}</p>
                </div>
              </div>

              {(invoice.PeriodFromDate || invoice.PeriodToDate) && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Billing Period</label>
                    <p>
                      {formatDate(invoice.PeriodFromDate)} - {formatDate(invoice.PeriodToDate)}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Customer and Contract Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer & Contract Details</CardTitle>
              <CardDescription>Associated customer and contract information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Customer</label>
                    <p className="font-medium">{invoice.CustomerFullName}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contract</label>
                    <p className="font-medium">{invoice.ContractNo}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Property & Unit</label>
                    <p className="font-medium">{invoice.PropertyName}</p>
                    <p className="text-sm text-muted-foreground">{invoice.UnitNo}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Company</label>
                    <p className="font-medium">{invoice.CompanyName}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <Receipt className="h-5 w-5 mr-2" />
                    Payment History
                  </CardTitle>
                  <CardDescription>Receipts and payments against this invoice</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleRefreshReceipts} disabled={receiptsLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${receiptsLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCreateReceipt} disabled={invoice.BalanceAmount <= 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Receipt
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {receiptsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payments recorded for this invoice</p>
                  <Button variant="outline" className="mt-4" onClick={handleCreateReceipt}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record First Payment
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Payment Summary */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Total Receipts</div>
                      <div className="text-lg font-semibold">{paymentSummary.receiptCount}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Amount Paid</div>
                      <div className="text-lg font-semibold text-green-600">{formatCurrency(paymentSummary.totalPaid)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Pending</div>
                      <div className="text-lg font-semibold text-orange-600">{formatCurrency(paymentSummary.pendingAmount)}</div>
                    </div>
                  </div>

                  {/* Receipts Table */}
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Receipt #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receipts.map((receipt) => (
                          <TableRow key={receipt.LeaseReceiptID}>
                            <TableCell>
                              <div className="font-medium">{receipt.ReceiptNo}</div>
                              {receipt.IsAdvancePayment && <div className="text-xs text-blue-600">Advance</div>}
                            </TableCell>
                            <TableCell>{formatDate(receipt.ReceiptDate)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{receipt.PaymentType}</Badge>
                              {receipt.ChequeNo && <div className="text-xs text-muted-foreground mt-1">Cheque: {receipt.ChequeNo}</div>}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{formatCurrency(receipt.ReceivedAmount)}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getReceiptStatusColor(receipt.PaymentStatus)}>{receipt.PaymentStatus}</Badge>
                              {receipt.PaymentStatus === PaymentStatus.REVERSED && <div className="text-xs text-red-600 mt-1">GL Reversed</div>}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => handleViewReceipt(receipt.LeaseReceiptID)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {(invoice.Notes || invoice.InternalNotes) && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Additional information and comments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.Notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Customer Notes</label>
                    <p className="mt-1 text-sm leading-relaxed">{invoice.Notes}</p>
                  </div>
                )}
                {invoice.InternalNotes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Internal Notes</label>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{invoice.InternalNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Financial Summary Sidebar */}
        <div className="space-y-6">
          {/* Amount Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(invoice.SubTotal)}</span>
                </div>

                {invoice.TaxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{formatCurrency(invoice.TaxAmount)}</span>
                  </div>
                )}

                {invoice.DiscountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-{formatCurrency(invoice.DiscountAmount)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount</span>
                  <span>{formatCurrency(invoice.TotalAmount)}</span>
                </div>

                {invoice.PaidAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Paid Amount</span>
                    <span className="font-medium">{formatCurrency(invoice.PaidAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-semibold">
                  <span className={invoice.BalanceAmount > 0 ? "text-red-600" : "text-green-600"}>Balance Due</span>
                  <span className={invoice.BalanceAmount > 0 ? "text-red-600" : "text-green-600"}>{formatCurrency(invoice.BalanceAmount)}</span>
                </div>
              </div>

              {invoice.CurrencyName && invoice.ExchangeRate && invoice.ExchangeRate !== 1 && (
                <>
                  <Separator />
                  <div className="text-sm text-muted-foreground">
                    <p>Currency: {invoice.CurrencyName}</p>
                    <p>Exchange Rate: {invoice.ExchangeRate}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={getStatusColor(invoice.InvoiceStatus)} className="flex items-center gap-1">
                    {getStatusIcon(invoice.InvoiceStatus)}
                    {invoice.InvoiceStatus}
                  </Badge>
                </div>

                {invoice.InvoiceStatus === "Partial" && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${((invoice.PaidAmount / invoice.TotalAmount) * 100).toFixed(1)}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">{((invoice.PaidAmount / invoice.TotalAmount) * 100).toFixed(1)}% Paid</p>
                  </div>
                )}

                {invoice.OverdueDays && invoice.OverdueDays > 0 && <div className="text-red-600 text-sm font-medium">{invoice.OverdueDays} days overdue</div>}

                {/* Payment Summary */}
                {receipts.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Receipts</span>
                        <span>{paymentSummary.receiptCount}</span>
                      </div>
                      {paymentSummary.pendingCount > 0 && (
                        <div className="flex justify-between text-orange-600">
                          <span>Pending Clearance</span>
                          <span>{paymentSummary.pendingCount}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleCreateReceipt} disabled={invoice.BalanceAmount <= 0}>
                <Receipt className="h-4 w-4 mr-2" />
                Record Payment
              </Button>

              <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/receipts?invoiceId=${invoice.LeaseInvoiceID}`)}>
                <History className="h-4 w-4 mr-2" />
                View Payment History
              </Button>

              <Button variant="outline" className="w-full justify-start" onClick={handleSend}>
                <Send className="h-4 w-4 mr-2" />
                Send to Customer
              </Button>

              <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/invoices?customerId=${invoice.CustomerID}`)}>
                <User className="h-4 w-4 mr-2" />
                View Customer Invoices
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        pdfBlob={invoicePdfReport.data}
        title={`Invoice - ${invoice.InvoiceNo}`}
        isLoading={invoicePdfReport.isLoading}
        error={invoicePdfReport.error}
        onDownload={() => invoicePdfReport.downloadCurrentPdf(`Invoice_${invoice.InvoiceNo}.pdf`)}
        onRefresh={handlePreviewInvoiceSlip}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice "${invoice.InvoiceNo}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
        loading={actionLoading}
      />

      {/* Status Change Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isStatusChangeDialogOpen}
        onClose={closeStatusChangeDialog}
        onConfirm={handleStatusChange}
        title="Change Invoice Status"
        description={`Are you sure you want to change the status of invoice "${invoice.InvoiceNo}" to "${selectedStatus}"?`}
        cancelText="Cancel"
        confirmText="Change Status"
        type="warning"
        loading={actionLoading}
      />
    </div>
  );
};

export default InvoiceDetails;
