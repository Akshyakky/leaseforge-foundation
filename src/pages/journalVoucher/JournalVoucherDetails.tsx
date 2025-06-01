import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { journalVoucherService } from "@/services/journalVoucherService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Receipt,
  Calendar,
  Building2,
  FileText,
  Download,
  Eye,
  Check,
  X,
  RotateCcw,
  Send,
  Printer,
  Copy,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  User,
  DollarSign,
  Network,
  CreditCard,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { JournalVoucher, JournalVoucherLine, JournalVoucherAttachment, JournalStatus, JournalType, ApprovalAction } from "@/types/journalVoucherTypes";
import { format } from "date-fns";

export const JournalVoucherDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State variables
  const [voucher, setVoucher] = useState<JournalVoucher | null>(null);
  const [lines, setLines] = useState<JournalVoucherLine[]>([]);
  const [attachments, setAttachments] = useState<JournalVoucherAttachment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [reversalDialogOpen, setReversalDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  // Form states
  const [approvalAction, setApprovalAction] = useState<ApprovalAction>(ApprovalAction.APPROVE);
  const [approvalComments, setApprovalComments] = useState("");
  const [reversalReason, setReversalReason] = useState("");

  // Loading states for actions
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchVoucherData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const voucherData = await journalVoucherService.getJournalVoucherByNumber(id);

        if (voucherData.voucher) {
          setVoucher(voucherData.voucher);
          setLines(voucherData.lines);
          setAttachments(voucherData.attachments);
        } else {
          setError("Journal voucher not found");
          toast.error("Journal voucher not found");
        }
      } catch (err) {
        console.error("Error fetching voucher:", err);
        setError("Failed to load journal voucher details");
        toast.error("Failed to load journal voucher details");
      } finally {
        setLoading(false);
      }
    };

    fetchVoucherData();
  }, [id]);

  // Format date for display
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "PPP");
  };

  // Format currency
  const formatCurrency = (amount: number | undefined, currencyCode?: string) => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD", //currencyCode ||
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

  // Action handlers
  const handleEdit = () => {
    if (voucher) {
      navigate(`/journal-vouchers/edit/${voucher.VoucherNo}`);
    }
  };

  const handleDelete = async () => {
    if (!voucher) return;

    setActionLoading(true);
    try {
      const result = await journalVoucherService.deleteJournalVoucher(voucher.VoucherNo, voucher.CompanyID);
      if (result.success) {
        toast.success(result.message || "Journal voucher deleted successfully");
        navigate("/journal-vouchers");
      } else {
        toast.error(result.message || "Failed to delete journal voucher");
      }
    } catch (err) {
      console.error("Error deleting voucher:", err);
      toast.error("Failed to delete journal voucher");
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!voucher) return;

    setActionLoading(true);
    try {
      const result = await journalVoucherService.submitJournalVoucherForApproval(voucher.VoucherNo, voucher.CompanyID);
      if (result.success) {
        toast.success(result.message || "Journal voucher submitted for approval");
        window.location.reload();
      } else {
        toast.error(result.message || "Failed to submit journal voucher");
      }
    } catch (err) {
      console.error("Error submitting voucher:", err);
      toast.error("Failed to submit journal voucher");
    } finally {
      setActionLoading(false);
      setSubmitDialogOpen(false);
    }
  };

  const handleApprovalAction = async () => {
    if (!voucher) return;

    setActionLoading(true);
    try {
      const result = await journalVoucherService.approveOrRejectJournalVoucher(voucher.VoucherNo, voucher.CompanyID, approvalAction, approvalComments.trim() || undefined);

      if (result.success) {
        toast.success(result.message || `Journal voucher ${approvalAction.toLowerCase()}d successfully`);
        window.location.reload();
      } else {
        toast.error(result.message || `Failed to ${approvalAction.toLowerCase()} journal voucher`);
      }
    } catch (err) {
      console.error("Error processing approval:", err);
      toast.error(`Failed to ${approvalAction.toLowerCase()} journal voucher`);
    } finally {
      setActionLoading(false);
      setApprovalDialogOpen(false);
      setApprovalComments("");
    }
  };

  const handleReversal = async () => {
    if (!voucher || !reversalReason.trim()) {
      toast.error("Reversal reason is required");
      return;
    }

    setActionLoading(true);
    try {
      const result = await journalVoucherService.reverseJournalVoucher(voucher.VoucherNo, voucher.CompanyID, reversalReason.trim());

      if (result.success) {
        toast.success(result.message || "Journal voucher reversed successfully");
        if (result.reversalVoucherNo) {
          toast.info(`Reversal voucher created: ${result.reversalVoucherNo}`);
        }
        window.location.reload();
      } else {
        toast.error(result.message || "Failed to reverse journal voucher");
      }
    } catch (err) {
      console.error("Error reversing voucher:", err);
      toast.error("Failed to reverse journal voucher");
    } finally {
      setActionLoading(false);
      setReversalDialogOpen(false);
      setReversalReason("");
    }
  };

  const handleDownloadAttachment = (attachment: JournalVoucherAttachment) => {
    if (attachment.fileUrl) {
      const link = document.createElement("a");
      link.href = attachment.fileUrl;
      link.download = attachment.DocumentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error("File not available for download");
    }
  };

  const handleViewAttachment = (attachment: JournalVoucherAttachment) => {
    if (attachment.fileUrl) {
      window.open(attachment.fileUrl, "_blank");
    } else {
      toast.error("File not available for viewing");
    }
  };

  const handleCopyVoucherNo = () => {
    if (voucher?.VoucherNo) {
      navigator.clipboard.writeText(voucher.VoucherNo);
      toast.success("Voucher number copied to clipboard");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate totals
  const totalDebits = lines.reduce((sum, line) => sum + (line.DebitAmount || 0), 0);
  const totalCredits = lines.reduce((sum, line) => sum + (line.CreditAmount || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) <= 0.01;

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

  if (error || !voucher) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-red-500 mb-4">{error || "Journal voucher not found"}</p>
            <Button onClick={() => navigate("/journal-vouchers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Journal Vouchers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine available actions based on status
  const canEdit = voucher.PostingStatus === "Draft" || voucher.PostingStatus === "Pending";
  const canDelete = voucher.PostingStatus === "Draft" || voucher.PostingStatus === "Pending";
  const canSubmit = voucher.PostingStatus === "Draft";
  const canApprove = voucher.PostingStatus === "Pending";
  const canReverse = voucher.PostingStatus === "Posted" && !voucher.IsReversed;

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Journal Voucher Details</CardTitle>
            <CardDescription>View and manage journal voucher information</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/journal-vouchers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {canEdit && (
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Voucher Information */}
      <Card>
        <CardHeader>
          <CardTitle>Voucher Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex items-center justify-center md:justify-start">
              <div className="h-24 w-24 bg-primary/10 rounded-lg flex items-center justify-center">
                <Receipt className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{voucher.VoucherNo}</h2>
                  <Button variant="ghost" size="sm" onClick={handleCopyVoucherNo}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {renderStatusBadge(voucher.PostingStatus || "Draft")}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Transaction Date:</span>
                  <span>{formatDate(voucher.TransactionDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Company:</span>
                  <span>{voucher.CompanyName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Amount:</span>
                  <span className="text-lg font-semibold">{formatCurrency(totalDebits, voucher.CurrencyName)}</span>
                </div>
                {voucher.JournalType && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Journal Type:</span>
                    {renderJournalTypeBadge(voucher.JournalType)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Voucher No:</span>
                  <span className="font-mono">{voucher.VoucherNo}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Voucher Type:</span>
                  <span>{voucher.VoucherType}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Transaction Date:</span>
                  <span>{formatDate(voucher.TransactionDate)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Posting Date:</span>
                  <span>{formatDate(voucher.PostingDate)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Company:</span>
                  <span>{voucher.CompanyName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Fiscal Year:</span>
                  <span>{voucher.FYDescription}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Currency:</span>
                  <span>{voucher.CurrencyName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Exchange Rate:</span>
                  <span>{voucher.ExchangeRate || 1}</span>
                </div>
              </div>
            </div>

            {/* Journal Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Journal Details</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Journal Type:</span>
                  {voucher.JournalType && renderJournalTypeBadge(voucher.JournalType)}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Supplier:</span>
                  <span>{voucher.SupplierName || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Paid To:</span>
                  <span>{voucher.PaidTo || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Reference No:</span>
                  <span>{voucher.RefNo || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Invoice No:</span>
                  <span>{voucher.InvoiceNo || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Cheque No:</span>
                  <span>{voucher.ChequeNo || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Cheque Date:</span>
                  <span>{voucher.ChequeDate ? formatDate(voucher.ChequeDate) : "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Status:</span>
                  {renderStatusBadge(voucher.PostingStatus || "Draft")}
                </div>
              </div>
            </div>
          </div>

          {/* Description and Narration */}
          {(voucher.Description || voucher.Narration) && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                {voucher.Description && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Description</h3>
                    <p className="text-sm bg-muted/20 p-3 rounded-lg">{voucher.Description}</p>
                  </div>
                )}
                {voucher.Narration && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Narration</h3>
                    <p className="text-sm bg-muted/20 p-3 rounded-lg">{voucher.Narration}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Cost Centers */}
          {(voucher.CostCenter1Name || voucher.CostCenter2Name || voucher.CostCenter3Name || voucher.CostCenter4Name) && (
            <>
              <Separator className="my-6" />
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

          {/* Reference Information */}
          {(voucher.ReferenceType || voucher.ReferenceNo) && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Reference Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {voucher.ReferenceType && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Reference Type:</span>
                      <p className="text-sm">{voucher.ReferenceType}</p>
                    </div>
                  )}
                  {voucher.ReferenceID && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Reference ID:</span>
                      <p className="text-sm">{voucher.ReferenceID}</p>
                    </div>
                  )}
                  {voucher.ReferenceNo && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Reference Number:</span>
                      <p className="text-sm">{voucher.ReferenceNo}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Journal Lines */}
      <Card>
        <CardHeader>
          <CardTitle>Journal Lines</CardTitle>
          <CardDescription>Debit and credit entries for this transaction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
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
                    <TableCell>
                      <div>{line.LineDescription || "—"}</div>
                      {line.LineInvoiceNo && <div className="text-sm text-muted-foreground">Invoice: {line.LineInvoiceNo}</div>}
                      {line.LineTRN && <div className="text-sm text-muted-foreground">TRN: {line.LineTRN}</div>}
                      {line.LineCity && <div className="text-sm text-muted-foreground">City: {line.LineCity}</div>}
                    </TableCell>
                    <TableCell className="text-right">{line.DebitAmount > 0 ? formatCurrency(line.DebitAmount, voucher.CurrencyName) : "—"}</TableCell>
                    <TableCell className="text-right">{line.CreditAmount > 0 ? formatCurrency(line.CreditAmount, voucher.CurrencyName) : "—"}</TableCell>
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
                      {line.LineSupplierName && <div>Supplier: {line.LineSupplierName}</div>}
                      {!line.CustomerFullName && !line.LineSupplierName && "—"}
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
                          Unbalanced
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(totalDebits, voucher.CurrencyName)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalCredits, voucher.CurrencyName)}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      {attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
            <CardDescription>Supporting documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attachments.map((attachment, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{attachment.DocumentName}</span>
                    </div>
                    {attachment.IsRequired && (
                      <Badge variant="secondary" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">{attachment.DocTypeName}</div>
                    {attachment.DocumentDescription && <div className="text-xs text-muted-foreground">{attachment.DocumentDescription}</div>}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewAttachment(attachment)} disabled={!attachment.fileUrl}>
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadAttachment(attachment)} disabled={!attachment.fileUrl}>
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Information */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium text-muted-foreground">Created By:</span>
                <span>{voucher.CreatedBy || "—"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium text-muted-foreground">Created On:</span>
                <span>{formatDate(voucher.CreatedOn)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium text-muted-foreground">Updated By:</span>
                <span>{voucher.UpdatedBy || "—"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium text-muted-foreground">Updated On:</span>
                <span>{voucher.UpdatedOn ? formatDate(voucher.UpdatedOn) : "—"}</span>
              </div>
            </div>
            <div className="space-y-3">
              {voucher.ApprovedBy && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Approved By:</span>
                    <span>{voucher.ApprovedByUserName || `User ${voucher.ApprovedBy}`}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Approved On:</span>
                    <span>{formatDate(voucher.ApprovedOn)}</span>
                  </div>
                </>
              )}
              {voucher.IsReversed && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Reversed By:</span>
                    <span>{voucher.ReversedByUserName || `User ${voucher.ReversedBy}`}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Reversed On:</span>
                    <span>{formatDate(voucher.ReversedOn)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Reversal Reason:</span>
                    <span>{voucher.ReversalReason || "—"}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="flex flex-wrap justify-center gap-2 pt-6">
          {canSubmit && (
            <Button onClick={() => setSubmitDialogOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              Submit for Approval
            </Button>
          )}
          {canApprove && (
            <>
              <Button
                onClick={() => {
                  setApprovalAction(ApprovalAction.APPROVE);
                  setApprovalDialogOpen(true);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setApprovalAction(ApprovalAction.REJECT);
                  setApprovalDialogOpen(true);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
          {canReverse && (
            <Button variant="outline" onClick={() => setReversalDialogOpen(true)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reverse
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Journal Voucher"
        description={`Are you sure you want to delete journal voucher "${voucher.VoucherNo}"? This action cannot be undone.`}
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
        description={`Are you sure you want to submit journal voucher "${voucher.VoucherNo}" for approval?`}
        confirmText="Submit"
        cancelText="Cancel"
        type="info"
      />

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{approvalAction === ApprovalAction.APPROVE ? "Approve Journal Voucher" : "Reject Journal Voucher"}</DialogTitle>
            <DialogDescription>
              {approvalAction === ApprovalAction.APPROVE
                ? `Are you sure you want to approve journal voucher "${voucher.VoucherNo}"?`
                : `Are you sure you want to reject journal voucher "${voucher.VoucherNo}"?`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approval-comments">Comments</Label>
              <Textarea id="approval-comments" placeholder="Enter approval comments (optional)" value={approvalComments} onChange={(e) => setApprovalComments(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprovalAction}
              disabled={actionLoading}
              className={approvalAction === ApprovalAction.APPROVE ? "bg-green-600 hover:bg-green-700" : ""}
              variant={approvalAction === ApprovalAction.REJECT ? "destructive" : "default"}
            >
              {actionLoading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {approvalAction === ApprovalAction.APPROVE ? <Check className="mr-2 h-4 w-4" /> : <X className="mr-2 h-4 w-4" />}
                  {approvalAction}
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
            <DialogTitle>Reverse Journal Voucher</DialogTitle>
            <DialogDescription>Are you sure you want to reverse journal voucher "{voucher.VoucherNo}"? This will create a reversal entry.</DialogDescription>
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
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
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
    </div>
  );
};

export default JournalVoucherDetails;
