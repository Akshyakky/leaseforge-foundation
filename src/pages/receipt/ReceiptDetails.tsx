// src/pages/receipt/ReceiptDetails.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  Printer,
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
  Banknote,
  RefreshCw,
} from "lucide-react";
import { receiptService, LeaseReceipt, PaymentType, PaymentStatus } from "@/services/receiptService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";

interface ReceiptDetailsProps {}

const ReceiptDetails: React.FC<ReceiptDetailsProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State variables
  const [receipt, setReceipt] = useState<LeaseReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Payment status options for status changes
  const paymentStatusOptions = Object.values(PaymentStatus);

  // Fetch receipt data
  useEffect(() => {
    if (id) {
      fetchReceiptDetails();
    }
  }, [id]);

  const fetchReceiptDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const receiptData = await receiptService.getReceiptById(parseInt(id));

      if (receiptData) {
        setReceipt(receiptData);
      } else {
        toast.error("Receipt not found");
        navigate("/receipts");
      }
    } catch (error) {
      console.error("Error fetching receipt details:", error);
      toast.error("Failed to load receipt details");
      navigate("/receipts");
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers
  const handleBack = () => {
    navigate("/receipts");
  };

  const handleEdit = () => {
    if (receipt) {
      navigate(`/receipts/edit/${receipt.LeaseReceiptID}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.info("Download functionality will be implemented");
  };

  // Delete handlers
  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!receipt) return;

    try {
      setActionLoading(true);
      const response = await receiptService.deleteReceipt(receipt.LeaseReceiptID);

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
    if (!receipt || !selectedStatus) return;

    try {
      setActionLoading(true);
      const response = await receiptService.updateReceipt({
        receipt: {
          LeaseReceiptID: receipt.LeaseReceiptID,
          PaymentStatus: selectedStatus,
        },
      });

      if (response.Status === 1) {
        setReceipt({ ...receipt, PaymentStatus: selectedStatus });
        toast.success(`Receipt status changed to ${selectedStatus}`);
      } else {
        toast.error(response.Message || "Failed to change receipt status");
      }
    } catch (error) {
      console.error("Error changing receipt status:", error);
      toast.error("Failed to change receipt status");
    } finally {
      setActionLoading(false);
      closeStatusChangeDialog();
    }
  };

  // Post to GL handlers
  const openPostDialog = () => {
    setIsPostDialogOpen(true);
  };

  const closePostDialog = () => {
    setIsPostDialogOpen(false);
  };

  const handlePostToGL = async () => {
    if (!receipt) return;

    try {
      setActionLoading(true);
      const response = await receiptService.postReceiptToGL({
        LeaseReceiptID: receipt.LeaseReceiptID,
      });

      if (response.Status === 1) {
        toast.success("Receipt posted to GL successfully");
        // Refresh receipt data
        fetchReceiptDetails();
      } else {
        toast.error(response.Message || "Failed to post receipt to GL");
      }
    } catch (error) {
      console.error("Error posting receipt to GL:", error);
      toast.error("Failed to post receipt to GL");
    } finally {
      setActionLoading(false);
      closePostDialog();
    }
  };

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
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
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case PaymentStatus.CLEARED:
        return "default";
      case PaymentStatus.RECEIVED:
        return "secondary";
      case PaymentStatus.PENDING:
        return "outline";
      case PaymentStatus.DEPOSITED:
        return "default";
      case PaymentStatus.BOUNCED:
        return "destructive";
      case PaymentStatus.CANCELLED:
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get payment type color
  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case PaymentType.CASH:
        return "default";
      case PaymentType.CHEQUE:
        return "secondary";
      case PaymentType.BANK_TRANSFER:
        return "outline";
      case PaymentType.CREDIT_CARD:
        return "default";
      default:
        return "outline";
    }
  };

  // Get status icon
  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case PaymentStatus.CLEARED:
        return <CheckCircle className="h-4 w-4" />;
      case PaymentStatus.BOUNCED:
        return <AlertTriangle className="h-4 w-4" />;
      case PaymentStatus.PENDING:
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
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
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Receipt Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">The requested receipt could not be found.</p>
            <div className="flex justify-center mt-4">
              <Button onClick={handleBack}>Back to Receipts</Button>
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
            <h1 className="text-2xl font-semibold">Receipt Details</h1>
            <p className="text-muted-foreground">{receipt.ReceiptNo}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant={getPaymentStatusColor(receipt.PaymentStatus)} className="flex items-center gap-1">
            {getPaymentStatusIcon(receipt.PaymentStatus)}
            {receipt.PaymentStatus}
          </Badge>

          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>

          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>

          <Button variant="outline" size="sm" onClick={handleEdit} disabled={receipt.IsPosted}>
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
              <DropdownMenuItem disabled className="font-medium text-muted-foreground">
                Change Status
              </DropdownMenuItem>

              {paymentStatusOptions
                .filter((status) => status !== receipt.PaymentStatus)
                .map((status) => (
                  <DropdownMenuItem key={status} onClick={() => openStatusChangeDialog(status)}>
                    Set as {status}
                  </DropdownMenuItem>
                ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={openPostDialog} disabled={receipt.IsPosted}>
                <DollarSign className="h-4 w-4 mr-2" />
                Post to GL
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem className="text-red-500" onClick={openDeleteDialog} disabled={receipt.IsPosted}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Payment Status Warning for Bounced/Cancelled */}
      {(receipt.PaymentStatus === PaymentStatus.BOUNCED || receipt.PaymentStatus === PaymentStatus.CANCELLED) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">This payment has been {receipt.PaymentStatus.toLowerCase()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Receipt Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Receipt Information</CardTitle>
              <CardDescription>Basic receipt details and payment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Receipt Number</label>
                  <p className="text-lg font-semibold">{receipt.ReceiptNo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Receipt Date</label>
                  <p>{formatDate(receipt.ReceiptDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Type</label>
                  <Badge variant={getPaymentTypeColor(receipt.PaymentType)} className="flex items-center gap-1 w-fit">
                    {receipt.PaymentType}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                  <Badge variant={getPaymentStatusColor(receipt.PaymentStatus)} className="flex items-center gap-1 w-fit">
                    {getPaymentStatusIcon(receipt.PaymentStatus)}
                    {receipt.PaymentStatus}
                  </Badge>
                </div>
              </div>

              {receipt.IsAdvancePayment && (
                <>
                  <Separator />
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Receipt className="h-5 w-5" />
                    <span className="font-medium">This is an advance payment</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Customer and Invoice Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer & Invoice Details</CardTitle>
              <CardDescription>Associated customer and invoice information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Customer</label>
                    <p className="font-medium">{receipt.CustomerFullName}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Invoice</label>
                    {receipt.InvoiceNo ? <p className="font-medium">{receipt.InvoiceNo}</p> : <p className="text-muted-foreground">No specific invoice</p>}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Company</label>
                    <p className="font-medium">{receipt.CompanyName}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fiscal Year</label>
                    <p className="font-medium">{receipt.FYDescription}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          {(receipt.PaymentType === PaymentType.CHEQUE || receipt.PaymentType === PaymentType.BANK_TRANSFER) && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>{receipt.PaymentType === PaymentType.CHEQUE ? "Cheque information" : "Bank transfer details"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {receipt.PaymentType === PaymentType.CHEQUE && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cheque Number</label>
                      <p className="font-medium">{receipt.ChequeNo || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cheque Date</label>
                      <p>{formatDate(receipt.ChequeDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Bank</label>
                      <p className="font-medium">{receipt.BankName || "N/A"}</p>
                    </div>
                    {receipt.DepositDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Deposit Date</label>
                        <p>{formatDate(receipt.DepositDate)}</p>
                      </div>
                    )}
                    {receipt.ClearanceDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Clearance Date</label>
                        <p>{formatDate(receipt.ClearanceDate)}</p>
                      </div>
                    )}
                  </div>
                )}

                {receipt.PaymentType === PaymentType.BANK_TRANSFER && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Transaction Reference</label>
                      <p className="font-medium">{receipt.TransactionReference || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Bank</label>
                      <p className="font-medium">{receipt.BankName || "N/A"}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {receipt.Notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Additional information and comments</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{receipt.Notes}</p>
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
                  <span className="text-muted-foreground">Received Amount</span>
                  <span className="font-semibold text-lg">{formatCurrency(receipt.ReceivedAmount)}</span>
                </div>

                {receipt.SecurityDepositAmount && receipt.SecurityDepositAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Security Deposit</span>
                    <span className="font-medium">{formatCurrency(receipt.SecurityDepositAmount)}</span>
                  </div>
                )}

                {receipt.PenaltyAmount && receipt.PenaltyAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Penalty</span>
                    <span className="font-medium">{formatCurrency(receipt.PenaltyAmount)}</span>
                  </div>
                )}

                {receipt.DiscountAmount && receipt.DiscountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-{formatCurrency(receipt.DiscountAmount)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount</span>
                  <span>{formatCurrency(receipt.ReceivedAmount + (receipt.SecurityDepositAmount || 0) + (receipt.PenaltyAmount || 0) - (receipt.DiscountAmount || 0))}</span>
                </div>
              </div>

              {receipt.CurrencyName && receipt.ExchangeRate && receipt.ExchangeRate !== 1 && (
                <>
                  <Separator />
                  <div className="text-sm text-muted-foreground">
                    <p>Currency: {receipt.CurrencyName}</p>
                    <p>Exchange Rate: {receipt.ExchangeRate}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Posting Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Posting Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">GL Posting</span>
                  {receipt.IsPosted ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Posted
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </div>

                {receipt.PostingID && (
                  <div className="text-sm text-muted-foreground">
                    <p>Posting ID: {receipt.PostingID}</p>
                  </div>
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
              {!receipt.IsPosted && (
                <Button variant="outline" className="w-full justify-start" onClick={openPostDialog}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Post to GL
                </Button>
              )}

              {receipt.InvoiceNo && (
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/invoices/${receipt.LeaseInvoiceID}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Invoice
                </Button>
              )}

              <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/receipts?customerId=${receipt.CustomerID}`)}>
                <User className="h-4 w-4 mr-2" />
                View Customer Receipts
              </Button>

              {receipt.PaymentType === PaymentType.CHEQUE && receipt.PaymentStatus === PaymentStatus.DEPOSITED && (
                <Button variant="outline" className="w-full justify-start" onClick={() => openStatusChangeDialog(PaymentStatus.CLEARED)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Cleared
                </Button>
              )}

              {receipt.PaymentType === PaymentType.CHEQUE && receipt.PaymentStatus === PaymentStatus.RECEIVED && (
                <Button variant="outline" className="w-full justify-start" onClick={() => openStatusChangeDialog(PaymentStatus.DEPOSITED)}>
                  <Banknote className="h-4 w-4 mr-2" />
                  Mark as Deposited
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Receipt"
        description={`Are you sure you want to delete receipt "${receipt.ReceiptNo}"? This action cannot be undone.`}
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
        title="Change Receipt Status"
        description={`Are you sure you want to change the status of receipt "${receipt.ReceiptNo}" to "${selectedStatus}"?`}
        cancelText="Cancel"
        confirmText="Change Status"
        type="warning"
        loading={actionLoading}
      />

      {/* Post to GL Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isPostDialogOpen}
        onClose={closePostDialog}
        onConfirm={handlePostToGL}
        title="Post Receipt to GL"
        description={`Are you sure you want to post receipt "${receipt.ReceiptNo}" to the General Ledger? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Post to GL"
        type="warning"
        loading={actionLoading}
      />
    </div>
  );
};

export default ReceiptDetails;
