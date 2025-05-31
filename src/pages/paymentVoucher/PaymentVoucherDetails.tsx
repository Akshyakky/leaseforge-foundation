// src/pages/paymentVoucher/PaymentVoucherDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { paymentVoucherService, PaymentVoucher, PaymentVoucherLine, PaymentVoucherAttachment, PaymentStatus, PaymentType } from "@/services/paymentVoucherService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, FileText, Building, DollarSign, Calendar, Check, Clock, X, AlertTriangle, Download, CreditCard, Plus, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { AttachmentPreview } from "@/components/attachments/AttachmentPreview";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { AttachmentThumbnail } from "@/components/attachments/AttachmentThumbnail";
import { FileTypeIcon } from "@/components/attachments/FileTypeIcon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const PaymentVoucherDetails = () => {
  const { voucherNo } = useParams<{ voucherNo: string }>();
  const navigate = useNavigate();
  const [paymentVoucher, setPaymentVoucher] = useState<PaymentVoucher | null>(null);
  const [paymentLines, setPaymentLines] = useState<PaymentVoucherLine[]>([]);
  const [attachments, setAttachments] = useState<PaymentVoucherAttachment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [previewAttachment, setPreviewAttachment] = useState<PaymentVoucherAttachment | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialAttachmentId, setInitialAttachmentId] = useState<number | undefined>(undefined);

  const openAttachmentPreview = (attachment: PaymentVoucherAttachment) => {
    setPreviewAttachment(attachment);
    setPreviewOpen(true);
  };

  const openAttachmentGallery = (attachmentId?: number) => {
    setInitialAttachmentId(attachmentId);
    setGalleryOpen(true);
  };

  useEffect(() => {
    const fetchPaymentVoucherData = async () => {
      if (!voucherNo) return;

      setLoading(true);
      try {
        const data = await paymentVoucherService.getPaymentVoucherByVoucherNo(voucherNo);

        if (data.voucher) {
          setPaymentVoucher(data.voucher);
          setPaymentLines(data.lines || []);
          setAttachments(data.attachments || []);
        } else {
          setError("Payment voucher not found");
          toast.error("Payment voucher not found");
        }
      } catch (err) {
        console.error("Error fetching payment voucher:", err);
        setError("Failed to load payment voucher details");
        toast.error("Failed to load payment voucher details");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentVoucherData();
  }, [voucherNo]);

  const handleDelete = async () => {
    if (!paymentVoucher) return;

    try {
      setActionLoading(true);
      const result = await paymentVoucherService.deletePaymentVoucher(paymentVoucher.VoucherNo);
      if (result.Status === 1) {
        toast.success(result.Message || "Payment voucher deleted successfully");
        navigate("/payment-vouchers");
      } else {
        toast.error(result.Message || "Failed to delete payment voucher");
      }
    } catch (err) {
      console.error("Error deleting payment voucher:", err);
      toast.error("Failed to delete payment voucher");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!paymentVoucher) return;

    try {
      setActionLoading(true);
      const result = await paymentVoucherService.approvePaymentVoucher({ VoucherNo: paymentVoucher.VoucherNo });
      if (result.Status === 1) {
        toast.success(result.Message || "Payment voucher approved successfully");
        // Refresh the data
        const updatedData = await paymentVoucherService.getPaymentVoucherByVoucherNo(paymentVoucher.VoucherNo);
        if (updatedData.voucher) {
          setPaymentVoucher(updatedData.voucher);
        }
      } else {
        toast.error(result.Message || "Failed to approve payment voucher");
      }
    } catch (err) {
      console.error("Error approving payment voucher:", err);
      toast.error("Failed to approve payment voucher");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostToGL = async () => {
    if (!paymentVoucher) return;

    try {
      setActionLoading(true);
      const result = await paymentVoucherService.postPaymentVoucherToGL({ VoucherNo: paymentVoucher.VoucherNo });
      if (result.Status === 1) {
        toast.success(result.Message || "Payment voucher posted to GL successfully");
        // Refresh the data
        const updatedData = await paymentVoucherService.getPaymentVoucherByVoucherNo(paymentVoucher.VoucherNo);
        if (updatedData.voucher) {
          setPaymentVoucher(updatedData.voucher);
        }
      } else {
        toast.error(result.Message || "Failed to post payment voucher to GL");
      }
    } catch (err) {
      console.error("Error posting payment voucher to GL:", err);
      toast.error("Failed to post payment voucher to GL");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReverse = async () => {
    if (!paymentVoucher) return;

    try {
      setActionLoading(true);
      const result = await paymentVoucherService.reversePaymentVoucher({ VoucherNo: paymentVoucher.VoucherNo });
      if (result.Status === 1) {
        toast.success(result.Message || "Payment voucher reversed successfully");
        // Refresh the data
        const updatedData = await paymentVoucherService.getPaymentVoucherByVoucherNo(paymentVoucher.VoucherNo);
        if (updatedData.voucher) {
          setPaymentVoucher(updatedData.voucher);
        }
      } else {
        toast.error(result.Message || "Failed to reverse payment voucher");
      }
    } catch (err) {
      console.error("Error reversing payment voucher:", err);
      toast.error("Failed to reverse payment voucher");
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

  if (error || !paymentVoucher) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-red-500 mb-4">{error || "Payment voucher not found"}</p>
            <Button onClick={() => navigate("/payment-vouchers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payment Vouchers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "PPP");
  };

  // Format currency amount for display
  const formatCurrency = (amount: number, currencyCode?: string) => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));

    const sign = amount < 0 ? "-" : "";
    const currency = currencyCode || "";

    return `${sign}${currency} ${formatted}`;
  };

  // Render payment status badge
  const renderPaymentStatus = (status: string) => {
    const statusConfig = {
      [PaymentStatus.DRAFT]: { color: "bg-gray-50 text-gray-700", icon: FileText },
      [PaymentStatus.PENDING]: { color: "bg-yellow-50 text-yellow-700", icon: Clock },
      [PaymentStatus.APPROVED]: { color: "bg-blue-50 text-blue-700", icon: Check },
      [PaymentStatus.POSTED]: { color: "bg-green-50 text-green-700", icon: Check },
      [PaymentStatus.CANCELLED]: { color: "bg-red-50 text-red-700", icon: X },
    };

    const config = statusConfig[status as PaymentStatus] || statusConfig[PaymentStatus.DRAFT];
    const IconComponent = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <IconComponent className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  };

  // Render payment type badge
  const renderPaymentType = (paymentType: string) => {
    const typeConfig = {
      [PaymentType.CASH]: { color: "bg-emerald-50 text-emerald-700", icon: DollarSign },
      [PaymentType.CHEQUE]: { color: "bg-purple-50 text-purple-700", icon: FileText },
      [PaymentType.BANK_TRANSFER]: { color: "bg-blue-50 text-blue-700", icon: CreditCard },
      [PaymentType.CREDIT_CARD]: { color: "bg-orange-50 text-orange-700", icon: CreditCard },
      [PaymentType.ONLINE_PAYMENT]: { color: "bg-indigo-50 text-indigo-700", icon: CreditCard },
    };

    const config = typeConfig[paymentType as PaymentType] || typeConfig[PaymentType.CASH];
    const IconComponent = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <IconComponent className="mr-1 h-3 w-3" />
        {paymentType}
      </Badge>
    );
  };

  // Check if voucher can be edited/deleted
  const canEdit = paymentVoucher.PaymentStatus === PaymentStatus.DRAFT || paymentVoucher.PaymentStatus === PaymentStatus.PENDING;
  const canDelete = paymentVoucher.PaymentStatus === PaymentStatus.DRAFT || paymentVoucher.PaymentStatus === PaymentStatus.PENDING;
  const canApprove = paymentVoucher.PaymentStatus === PaymentStatus.PENDING;
  const canPost = paymentVoucher.PaymentStatus === PaymentStatus.APPROVED;
  const canReverse = paymentVoucher.PaymentStatus === PaymentStatus.POSTED;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Payment Voucher Details</CardTitle>
            <CardDescription>View and manage payment voucher information</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/payment-vouchers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {canEdit && (
              <Button variant="outline" onClick={() => navigate(`/payment-vouchers/edit/${paymentVoucher.VoucherNo}`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {canApprove && (
              <Button variant="default" onClick={handleApprove} disabled={actionLoading}>
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
            )}
            {canPost && (
              <Button variant="default" onClick={handlePostToGL} disabled={actionLoading}>
                <CreditCard className="mr-2 h-4 w-4" />
                Post to GL
              </Button>
            )}
            {canReverse && (
              <Button variant="outline" onClick={handleReverse} disabled={actionLoading}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Reverse
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={actionLoading}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex items-center justify-center md:justify-start">
              <div className="p-6 bg-blue-50 rounded-full">
                <FileText className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <h2 className="text-2xl font-bold">{paymentVoucher.VoucherNo}</h2>
                <div className="flex gap-2">
                  {renderPaymentStatus(paymentVoucher.PaymentStatus)}
                  {renderPaymentType(paymentVoucher.PaymentType)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-lg">{formatCurrency(paymentVoucher.TotalAmount, paymentVoucher.CurrencyName)}</span>
                </div>
                {paymentVoucher.SupplierName && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{paymentVoucher.SupplierName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Transaction Date: {formatDate(paymentVoucher.TransactionDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>Company: {paymentVoucher.CompanyName}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Basic Details</TabsTrigger>
              <TabsTrigger value="payment">Payment Information</TabsTrigger>
              <TabsTrigger value="lines">Lines ({paymentLines.length})</TabsTrigger>
              <TabsTrigger value="attachments">Attachments ({attachments.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Voucher Number:</span>
                      <span>{paymentVoucher.VoucherNo}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Transaction Date:</span>
                      <span>{formatDate(paymentVoucher.TransactionDate)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Posting Date:</span>
                      <span>{formatDate(paymentVoucher.PostingDate)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Company:</span>
                      <span>{paymentVoucher.CompanyName || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Fiscal Year:</span>
                      <span>{paymentVoucher.FYDescription || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Supplier:</span>
                      <span>{paymentVoucher.SupplierName || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Payment Type:</span>
                      <span>{paymentVoucher.PaymentType}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Status:</span>
                      <span>{paymentVoucher.PaymentStatus}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Amount Information</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Total Amount:</span>
                      <span className="font-medium">{formatCurrency(paymentVoucher.TotalAmount, paymentVoucher.CurrencyName)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Currency:</span>
                      <span>{paymentVoucher.CurrencyName || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Exchange Rate:</span>
                      <span>{paymentVoucher.ExchangeRate || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Base Currency Amount:</span>
                      <span>{paymentVoucher.BaseCurrencyAmount ? formatCurrency(paymentVoucher.BaseCurrencyAmount) : "—"}</span>
                    </div>
                    {paymentVoucher.TaxAmount && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm font-medium text-muted-foreground">Tax Amount:</span>
                          <span>{formatCurrency(paymentVoucher.TaxAmount)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm font-medium text-muted-foreground">Base Amount:</span>
                          <span>{paymentVoucher.BaseAmount ? formatCurrency(paymentVoucher.BaseAmount) : "—"}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Reference Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Reference Type:</span>
                    <span>{paymentVoucher.ReferenceType || "—"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Reference Number:</span>
                    <span>{paymentVoucher.ReferenceNo || "—"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Reference ID:</span>
                    <span>{paymentVoucher.ReferenceID || "—"}</span>
                  </div>
                </div>
              </div>

              {(paymentVoucher.Description || paymentVoucher.Narration || paymentVoucher.InternalNotes) && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Notes and Description</h3>
                  {paymentVoucher.Description && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-1">Description:</h4>
                      <p className="p-3 bg-gray-50 rounded-md">{paymentVoucher.Description}</p>
                    </div>
                  )}
                  {paymentVoucher.Narration && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-1">Narration:</h4>
                      <p className="p-3 bg-gray-50 rounded-md">{paymentVoucher.Narration}</p>
                    </div>
                  )}
                  {paymentVoucher.InternalNotes && (
                    <div>
                      <h4 className="font-medium mb-1">Internal Notes:</h4>
                      <p className="p-3 bg-gray-50 rounded-md">{paymentVoucher.InternalNotes}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Audit Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Created By:</span>
                    <span>{paymentVoucher.CreatedBy || "—"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Created On:</span>
                    <span>{formatDate(paymentVoucher.CreatedOn)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Updated By:</span>
                    <span>{paymentVoucher.UpdatedBy || "—"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Updated On:</span>
                    <span>{paymentVoucher.UpdatedOn ? formatDate(paymentVoucher.UpdatedOn) : "—"}</span>
                  </div>
                  {paymentVoucher.ApprovedBy && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Approved By:</span>
                        <span>{paymentVoucher.ApprovedByUserName || paymentVoucher.ApprovedBy}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Approved On:</span>
                        <span>{formatDate(paymentVoucher.ApprovedOn)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="payment" className="mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Payment Details</h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Payment Type:</span>
                        <span>{paymentVoucher.PaymentType}</span>
                      </div>
                      {paymentVoucher.BankName && (
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm font-medium text-muted-foreground">Bank:</span>
                          <span>{paymentVoucher.BankName}</span>
                        </div>
                      )}
                      {paymentVoucher.BankAccountNo && (
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm font-medium text-muted-foreground">Account Number:</span>
                          <span>{paymentVoucher.BankAccountNo}</span>
                        </div>
                      )}
                      {paymentVoucher.TransactionReference && (
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm font-medium text-muted-foreground">Transaction Reference:</span>
                          <span>{paymentVoucher.TransactionReference}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {(paymentVoucher.ChequeNo || paymentVoucher.ChequeDate) && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Cheque Details</h3>
                      <div className="space-y-2">
                        {paymentVoucher.ChequeNo && (
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Cheque Number:</span>
                            <span>{paymentVoucher.ChequeNo}</span>
                          </div>
                        )}
                        {paymentVoucher.ChequeDate && (
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Cheque Date:</span>
                            <span>{formatDate(paymentVoucher.ChequeDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">GL Account Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentVoucher.BankAccountName && (
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Bank Account (Credit):</span>
                        <span>{paymentVoucher.BankAccountName}</span>
                      </div>
                    )}
                    {paymentVoucher.PayableAccountName && (
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Payable Account (Debit):</span>
                        <span>{paymentVoucher.PayableAccountName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="lines" className="mt-6">
              {paymentLines.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
                  <p className="text-muted-foreground mb-4">No payment lines associated with this voucher.</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Line</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead>Tax</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentLines.map((line, index) => (
                        <TableRow key={line.PostingID || index}>
                          <TableCell>{line.Line_No || index + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium">{line.AccountCode}</div>
                            <div className="text-sm text-muted-foreground">{line.AccountName}</div>
                          </TableCell>
                          <TableCell>{line.Description}</TableCell>
                          <TableCell className="text-right">{line.DebitAmount > 0 ? formatCurrency(line.DebitAmount) : "—"}</TableCell>
                          <TableCell className="text-right">{line.CreditAmount > 0 ? formatCurrency(line.CreditAmount) : "—"}</TableCell>
                          <TableCell>
                            {line.TaxName ? (
                              <div>
                                <div className="font-medium">{line.TaxName}</div>
                                {line.TaxAmount > 0 && <div className="text-sm text-muted-foreground">{formatCurrency(line.TaxAmount)}</div>}
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            <TabsContent value="attachments" className="mt-6">
              {attachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
                  <p className="text-muted-foreground mb-4">No attachments associated with this voucher.</p>
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
                                {attachment.DocTypeName && <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100">{attachment.DocTypeName}</Badge>}
                              </div>
                              <div className="text-sm space-y-1">
                                {attachment.DocumentDescription && <div className="text-muted-foreground">{attachment.DocumentDescription}</div>}
                                {attachment.FileSize && <div className="text-muted-foreground">Size: {(attachment.FileSize / 1024 / 1024).toFixed(2)} MB</div>}
                              </div>

                              {/* Document preview and download buttons */}
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Payment Voucher"
        description={`Are you sure you want to delete payment voucher "${paymentVoucher.VoucherNo}"? This action cannot be undone and will remove all data associated with this voucher.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Attachment Preview Dialog */}
      {previewAttachment && (
        <AttachmentPreview
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          fileUrl={previewAttachment.fileUrl}
          fileName={previewAttachment.DocumentName || "Document"}
          fileType={previewAttachment.FileContentType}
          fileSize={previewAttachment.FileSize}
          uploadDate={previewAttachment.CreatedOn}
          uploadedBy={previewAttachment.CreatedBy}
          description={previewAttachment.DocumentDescription}
          documentType={previewAttachment.DocTypeName}
        />
      )}

      {/* Attachment Gallery Dialog */}
      {attachments.length > 0 && (
        <AttachmentGallery isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} attachments={attachments} initialAttachmentId={initialAttachmentId} />
      )}
    </div>
  );
};

export default PaymentVoucherDetails;
