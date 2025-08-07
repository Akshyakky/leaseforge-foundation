// src/pages/leaseRevenuePosting/LeaseRevenuePostingDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  ArrowLeft,
  Receipt,
  Calendar,
  Building,
  FileText,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  User,
  HandCoins,
  Send,
  RotateCcw,
  Printer,
  Home,
  CreditCard,
  Loader2,
  RefreshCw,
  Download,
  Eye,
  AlertTriangle,
  Shield,
  Lock,
  UserCheck,
  Building2,
  Tag,
  Info,
} from "lucide-react";

// Services and types
import { leaseRevenuePostingService } from "@/services/leaseRevenuePostingService";
import {
  LeaseTransactionDetails,
  PostedLeaseRevenueTransaction,
  ReversalRequest,
  ApprovalRequest,
  ApprovalAction,
  ApprovalStatus,
  PostingStatus,
} from "@/types/leaseRevenuePostingTypes";

// Utilities
import { toast } from "sonner";
import { format } from "date-fns";
import { useAppSelector } from "@/lib/hooks";

// PDF components
import { PdfPreviewModal, PdfActionButtons } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";

interface LeaseRevenuePostingDetailsProps {}

const LeaseRevenuePostingDetails: React.FC<LeaseRevenuePostingDetailsProps> = () => {
  const { type, id, postingId } = useParams<{ type: string; id: string; postingId: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [transactionDetails, setTransactionDetails] = useState<LeaseTransactionDetails | null>(null);
  const [postingDetails, setPostingDetails] = useState<PostedLeaseRevenueTransaction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Dialog states
  const [reversalDialogOpen, setReversalDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [postingConfirmDialogOpen, setPostingConfirmDialogOpen] = useState(false);

  // Form states
  const [reversalReason, setReversalReason] = useState("");
  const [approvalComments, setApprovalComments] = useState("");
  const [approvalAction, setApprovalAction] = useState<ApprovalAction | null>(null);

  // PDF generation state
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const transactionPdfReport = useGenericPdfReport();

  // Check if user is manager
  const isManager = user?.role === "admin" || user?.role === "manager";

  // Determine transaction display properties
  const isUnpostedTransaction = type && id && !postingId;
  const isPostedTransaction = postingId;

  useEffect(() => {
    const fetchDetails = async () => {
      if (!type || !id) {
        toast.error("Invalid transaction parameters");
        navigate("/lease-revenue-posting");
        return;
      }

      setLoading(true);
      try {
        if (isUnpostedTransaction) {
          // Fetch unposted transaction details
          const details = await leaseRevenuePostingService.getTransactionDetails(type as "Invoice" | "Receipt", parseInt(id));

          if (details) {
            setTransactionDetails(details);
          } else {
            toast.error("Transaction not found");
            navigate("/lease-revenue-posting");
          }
        } else if (isPostedTransaction && postingId) {
          // For posted transactions, we would need a specific service method
          // Since this isn't implemented yet, we'll show an appropriate message
          toast.info("Posting details view is under development");
          navigate("/lease-revenue-posting");
        }
      } catch (error) {
        console.error("Error fetching transaction details:", error);
        toast.error("Failed to load transaction details");
        navigate("/lease-revenue-posting");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [type, id, postingId, navigate, isUnpostedTransaction, isPostedTransaction]);

  // Refresh transaction data
  const refreshTransactionData = async () => {
    if (!type || !id) return;

    try {
      const details = await leaseRevenuePostingService.getTransactionDetails(type as "Invoice" | "Receipt", parseInt(id));

      if (details) {
        setTransactionDetails(details);
      }
    } catch (error) {
      console.error("Error refreshing transaction data:", error);
      toast.error("Failed to refresh transaction data");
    }
  };

  // PDF Generation Handlers
  const handleGenerateTransactionReport = async () => {
    if (!transactionDetails) return;

    const response = await transactionPdfReport.generateReport(
      "lease-transaction-details",
      {
        TransactionType: transactionDetails.TransactionType,
        TransactionID: transactionDetails.TransactionID,
      },
      {
        orientation: "Portrait",
        download: true,
        showToast: true,
        filename: `Lease_Transaction_${transactionDetails.TransactionNo}_${new Date().toISOString().split("T")[0]}.pdf`,
      }
    );

    if (response.success) {
      toast.success("Transaction report generated successfully");
    }
  };

  const handlePreviewTransactionReport = async () => {
    if (!transactionDetails) return;

    setShowPdfPreview(true);
    const response = await transactionPdfReport.generateReport(
      "lease-transaction-details",
      {
        TransactionType: transactionDetails.TransactionType,
        TransactionID: transactionDetails.TransactionID,
      },
      {
        orientation: "Portrait",
        download: false,
        showToast: false,
      }
    );

    if (!response.success) {
      toast.error("Failed to generate transaction report preview");
    }
  };

  // Format date for display
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format currency
  const formatCurrency = (amount: number | undefined, currencyCode?: string) => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "AED",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Render status badge
  const renderStatusBadge = (isPosted: boolean, isReversed?: boolean, approvalStatus?: ApprovalStatus) => {
    if (isReversed) {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          <XCircle className="w-3 h-3 mr-1" />
          Reversed
        </Badge>
      );
    }

    if (isPosted) {
      if (approvalStatus === ApprovalStatus.APPROVED) {
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Posted & Approved
          </Badge>
        );
      } else if (approvalStatus === ApprovalStatus.PENDING) {
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Posted - Pending Approval
          </Badge>
        );
      } else if (approvalStatus === ApprovalStatus.REJECTED) {
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Posted - Rejected
          </Badge>
        );
      } else {
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Posted
          </Badge>
        );
      }
    }

    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Unposted
      </Badge>
    );
  };

  // Render transaction type badge
  const renderTransactionTypeBadge = (transactionType: string) => {
    const typeConfig = {
      Invoice: { className: "bg-blue-100 text-blue-800", icon: FileText },
      Receipt: { className: "bg-green-100 text-green-800", icon: Receipt },
    };

    const config = typeConfig[transactionType as keyof typeof typeConfig] || typeConfig.Invoice;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {transactionType}
      </Badge>
    );
  };

  // Action handlers
  const handleCopyTransactionNo = () => {
    if (transactionDetails?.TransactionNo) {
      navigator.clipboard.writeText(transactionDetails.TransactionNo);
      toast.success("Transaction number copied to clipboard");
    }
  };

  const handlePostTransaction = () => {
    setPostingConfirmDialogOpen(true);
  };

  const executePostTransaction = () => {
    // Navigate back to main list with this transaction selected for posting
    navigate("/lease-revenue-posting", {
      state: {
        selectedTransaction: `${transactionDetails?.TransactionType}-${transactionDetails?.TransactionID}`,
        autoOpenPostingDialog: true,
      },
    });
  };

  const openReversalDialog = () => {
    setReversalReason("");
    setReversalDialogOpen(true);
  };

  const closeReversalDialog = () => {
    setReversalDialogOpen(false);
    setReversalReason("");
  };

  const handleReversal = async () => {
    if (!postingDetails || !reversalReason.trim()) {
      toast.error("Reversal reason is required");
      return;
    }

    setActionLoading(true);
    try {
      const reversalRequest: ReversalRequest = {
        PostingID: postingDetails.PostingID,
        ReversalReason: reversalReason.trim(),
      };

      const result = await leaseRevenuePostingService.reverseTransaction(reversalRequest);

      if (result.success) {
        toast.success("Transaction reversed successfully");
        closeReversalDialog();
        await refreshTransactionData();
      } else {
        toast.error(result.message || "Failed to reverse transaction");
      }
    } catch (error) {
      console.error("Error reversing transaction:", error);
      toast.error("Failed to reverse transaction");
    } finally {
      setActionLoading(false);
    }
  };

  const openApprovalDialog = (action: ApprovalAction) => {
    setApprovalAction(action);
    setApprovalComments("");
    setApprovalDialogOpen(true);
  };

  const closeApprovalDialog = () => {
    setApprovalDialogOpen(false);
    setApprovalComments("");
    setApprovalAction(null);
  };

  const handleApprovalAction = async () => {
    if (!postingDetails || !approvalAction || !isManager) return;

    if (approvalAction === ApprovalAction.REJECT && !approvalComments.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    setActionLoading(true);
    try {
      const approvalRequest: ApprovalRequest = {
        PostingID: postingDetails.PostingID,
        ApprovalAction: approvalAction,
        ApprovalComments: approvalComments.trim(),
        RejectionReason: approvalAction === ApprovalAction.REJECT ? approvalComments.trim() : undefined,
      };

      const result = await leaseRevenuePostingService.approveOrRejectPosting(approvalRequest);

      if (result.success) {
        toast.success(`Transaction ${approvalAction.toLowerCase()}d successfully`);
        closeApprovalDialog();
        await refreshTransactionData();
      } else {
        toast.error(result.message || `Failed to ${approvalAction.toLowerCase()} transaction`);
      }
    } catch (error) {
      console.error(`Error ${approvalAction.toLowerCase()}ing transaction:`, error);
      toast.error(`Failed to ${approvalAction.toLowerCase()} transaction`);
    } finally {
      setActionLoading(false);
    }
  };

  // Determine available actions
  const canPost = transactionDetails && !transactionDetails.IsPosted;
  const canReverse = postingDetails && !postingDetails.IsReversed && isManager;
  const canApprove = postingDetails && postingDetails.ApprovalStatus === ApprovalStatus.PENDING && isManager;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!transactionDetails && !postingDetails) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl">Transaction not found</h2>
        <Button className="mt-4" onClick={() => navigate("/lease-revenue-posting")}>
          Back to Lease Revenue Posting
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => navigate("/lease-revenue-posting")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold">Lease Revenue Transaction - {transactionDetails?.TransactionNo}</h1>
            <div className="ml-2 flex items-center gap-2">
              {transactionDetails && renderTransactionTypeBadge(transactionDetails.TransactionType)}
              {transactionDetails && renderStatusBadge(transactionDetails.IsPosted)}
            </div>
          </div>
          <div className="flex space-x-2">
            {/* PDF Generation Actions */}
            {transactionDetails && (
              <div className="flex space-x-2 mr-2">
                <PdfActionButtons
                  onDownload={handleGenerateTransactionReport}
                  onPreview={handlePreviewTransactionReport}
                  isLoading={transactionPdfReport.isLoading}
                  downloadLabel="Download Transaction Report"
                  previewLabel="Preview Transaction Report"
                  variant="outline"
                  size="default"
                />
              </div>
            )}

            {/* Action Buttons */}
            {canPost && (
              <Button onClick={handlePostTransaction}>
                <Send className="mr-2 h-4 w-4" />
                Post Transaction
              </Button>
            )}

            {canApprove && (
              <>
                <Button variant="outline" onClick={() => openApprovalDialog(ApprovalAction.APPROVE)}>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Approve
                </Button>
                <Button variant="outline" onClick={() => openApprovalDialog(ApprovalAction.REJECT)}>
                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                  Reject
                </Button>
              </>
            )}

            {canReverse && (
              <Button variant="destructive" onClick={openReversalDialog}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reverse
              </Button>
            )}

            <Button variant="outline" onClick={refreshTransactionData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Transaction Status Alert */}
        {transactionDetails && (
          <Alert className={`border-l-4 ${transactionDetails.IsPosted ? "border-l-green-500 bg-green-50" : "border-l-yellow-500 bg-yellow-50"}`}>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Transaction Status: {transactionDetails.IsPosted ? "Posted" : "Unposted"}</div>
              {!transactionDetails.IsPosted && (
                <div className="text-sm text-muted-foreground mt-1">
                  This transaction has not been posted to the general ledger yet. Use the "Post Transaction" button to create the necessary accounting entries.
                </div>
              )}
              {transactionDetails.IsPosted && <div className="text-sm text-muted-foreground mt-1">This transaction has been successfully posted to the general ledger.</div>}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-[400px]">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="amounts">Amounts</TabsTrigger>
            <TabsTrigger value="period">Period</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                  Transaction Information
                </CardTitle>
                <CardDescription>View comprehensive transaction details and related information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {transactionDetails && (
                  <>
                    {/* Transaction Header */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Receipt className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold">{transactionDetails.TransactionNo}</h2>
                            <Button variant="ghost" size="sm" onClick={handleCopyTransactionNo}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {transactionDetails.TransactionType} • {formatDate(transactionDetails.TransactionDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{formatCurrency(transactionDetails.TotalAmount, transactionDetails.CurrencyName)}</div>
                        <p className="text-sm text-muted-foreground">{transactionDetails.CurrencyName}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Basic Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Transaction Details</h3>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Transaction No:</span>
                            <span className="font-mono">{transactionDetails.TransactionNo}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Transaction Type:</span>
                            {renderTransactionTypeBadge(transactionDetails.TransactionType)}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Transaction Date:</span>
                            <span>{formatDate(transactionDetails.TransactionDate)}</span>
                          </div>
                          {transactionDetails.DueDate && (
                            <div className="grid grid-cols-2 gap-2">
                              <span className="text-sm font-medium text-muted-foreground">Due Date:</span>
                              <span>{formatDate(transactionDetails.DueDate)}</span>
                            </div>
                          )}
                          {transactionDetails.InvoiceStatus && (
                            <div className="grid grid-cols-2 gap-2">
                              <span className="text-sm font-medium text-muted-foreground">Status:</span>
                              <Badge variant="outline">{transactionDetails.InvoiceStatus}</Badge>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Posting Status:</span>
                            {renderStatusBadge(transactionDetails.IsPosted)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Customer & Property</h3>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Customer:</span>
                            <span className="font-medium">{transactionDetails.CustomerName}</span>
                          </div>
                          {transactionDetails.PropertyName && (
                            <div className="grid grid-cols-2 gap-2">
                              <span className="text-sm font-medium text-muted-foreground">Property:</span>
                              <span>{transactionDetails.PropertyName}</span>
                            </div>
                          )}
                          {transactionDetails.UnitNo && (
                            <div className="grid grid-cols-2 gap-2">
                              <span className="text-sm font-medium text-muted-foreground">Unit:</span>
                              <span>{transactionDetails.UnitNo}</span>
                            </div>
                          )}
                          {transactionDetails.ContractNo && (
                            <div className="grid grid-cols-2 gap-2">
                              <span className="text-sm font-medium text-muted-foreground">Contract:</span>
                              <span className="font-mono">{transactionDetails.ContractNo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Currency Information */}
                    {transactionDetails.CurrencyName && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Currency Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <span className="text-sm font-medium text-muted-foreground">Currency:</span>
                              <div className="font-medium">{transactionDetails.CurrencyName}</div>
                            </div>
                            {transactionDetails.ExchangeRate && (
                              <div className="space-y-2">
                                <span className="text-sm font-medium text-muted-foreground">Exchange Rate:</span>
                                <div className="font-medium">{transactionDetails.ExchangeRate}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="amounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HandCoins className="mr-2 h-5 w-5 text-muted-foreground" />
                  Amount Details
                </CardTitle>
                <CardDescription>Comprehensive breakdown of transaction amounts</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionDetails && (
                  <div className="space-y-6">
                    {/* Primary Amounts */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="p-4">
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-muted-foreground">Sub Total</span>
                          <div className="text-2xl font-bold">{formatCurrency(transactionDetails.SubTotal, transactionDetails.CurrencyName)}</div>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-muted-foreground">Tax Amount</span>
                          <div className="text-2xl font-bold text-orange-600">{formatCurrency(transactionDetails.TaxAmount, transactionDetails.CurrencyName)}</div>
                        </div>
                      </Card>
                      <Card className="p-4 bg-primary/5 border-primary/20">
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-muted-foreground">Total Amount</span>
                          <div className="text-2xl font-bold text-primary">{formatCurrency(transactionDetails.TotalAmount, transactionDetails.CurrencyName)}</div>
                        </div>
                      </Card>
                    </div>

                    {/* Discount Information */}
                    {transactionDetails.DiscountAmount && transactionDetails.DiscountAmount > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Discount Information</h3>
                          <Card className="p-4">
                            <div className="space-y-2">
                              <span className="text-sm font-medium text-muted-foreground">Discount Amount</span>
                              <div className="text-xl font-bold text-green-600">{formatCurrency(transactionDetails.DiscountAmount, transactionDetails.CurrencyName)}</div>
                            </div>
                          </Card>
                        </div>
                      </>
                    )}

                    {/* Payment Information (for Invoices) */}
                    {transactionDetails.TransactionType === "Invoice" && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Payment Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="p-4">
                              <div className="space-y-2">
                                <span className="text-sm font-medium text-muted-foreground">Paid Amount</span>
                                <div className="text-xl font-bold text-green-600">{formatCurrency(transactionDetails.PaidAmount, transactionDetails.CurrencyName)}</div>
                              </div>
                            </Card>
                            <Card className="p-4">
                              <div className="space-y-2">
                                <span className="text-sm font-medium text-muted-foreground">Balance Amount</span>
                                <div className="text-xl font-bold text-red-600">{formatCurrency(transactionDetails.BalanceAmount, transactionDetails.CurrencyName)}</div>
                              </div>
                            </Card>
                          </div>

                          {/* Payment Status Indicator */}
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Payment Status:</span>
                              <Badge
                                variant={transactionDetails.BalanceAmount === 0 ? "default" : "destructive"}
                                className={transactionDetails.BalanceAmount === 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              >
                                {transactionDetails.BalanceAmount === 0 ? "Fully Paid" : "Outstanding"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Rental Information */}
                    {transactionDetails.RentPerMonth && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Rental Information</h3>
                          <Card className="p-4">
                            <div className="space-y-2">
                              <span className="text-sm font-medium text-muted-foreground">Monthly Rent</span>
                              <div className="text-xl font-bold">{formatCurrency(transactionDetails.RentPerMonth, transactionDetails.CurrencyName)}</div>
                            </div>
                          </Card>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="period" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
                  Period Information
                </CardTitle>
                <CardDescription>Transaction and lease period details</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionDetails && (
                  <div className="space-y-6">
                    {/* Transaction Period */}
                    {(transactionDetails.PeriodFromDate || transactionDetails.PeriodToDate) && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Transaction Period</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="p-4">
                            <div className="space-y-2">
                              <span className="text-sm font-medium text-muted-foreground">Period From</span>
                              <div className="text-lg font-semibold">{formatDate(transactionDetails.PeriodFromDate)}</div>
                            </div>
                          </Card>
                          <Card className="p-4">
                            <div className="space-y-2">
                              <span className="text-sm font-medium text-muted-foreground">Period To</span>
                              <div className="text-lg font-semibold">{formatDate(transactionDetails.PeriodToDate)}</div>
                            </div>
                          </Card>
                        </div>
                      </div>
                    )}

                    {/* Lease Period */}
                    {(transactionDetails.LeaseStartDate || transactionDetails.LeaseEndDate) && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Lease Period</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="p-4">
                              <div className="space-y-2">
                                <span className="text-sm font-medium text-muted-foreground">Lease Start</span>
                                <div className="text-lg font-semibold">{formatDate(transactionDetails.LeaseStartDate)}</div>
                              </div>
                            </Card>
                            <Card className="p-4">
                              <div className="space-y-2">
                                <span className="text-sm font-medium text-muted-foreground">Lease End</span>
                                <div className="text-lg font-semibold">{formatDate(transactionDetails.LeaseEndDate)}</div>
                              </div>
                            </Card>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Additional Date Information */}
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Additional Dates</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Transaction Date:</span>
                            <span>{formatDate(transactionDetails.TransactionDate)}</span>
                          </div>
                          {transactionDetails.DueDate && (
                            <div className="grid grid-cols-2 gap-2">
                              <span className="text-sm font-medium text-muted-foreground">Due Date:</span>
                              <span>{formatDate(transactionDetails.DueDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-muted-foreground" />
                  Audit Information
                </CardTitle>
                <CardDescription>Transaction creation and modification history</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionDetails && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Creation Information */}
                      <Card className="p-4">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Creation Details</h3>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <span className="text-sm font-medium text-muted-foreground">Created By:</span>
                              <span>{transactionDetails.CreatedBy || "—"}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <span className="text-sm font-medium text-muted-foreground">Created On:</span>
                              <span>{formatDate(transactionDetails.CreatedOn)}</span>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Modification Information */}
                      <Card className="p-4">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Last Modification</h3>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <span className="text-sm font-medium text-muted-foreground">Updated By:</span>
                              <span>{transactionDetails.UpdatedBy || "—"}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <span className="text-sm font-medium text-muted-foreground">Updated On:</span>
                              <span>{transactionDetails.UpdatedOn ? formatDate(transactionDetails.UpdatedOn) : "—"}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Record Status */}
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Record Status</h3>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Status:</span>
                          <Badge variant="outline">{transactionDetails.RecordStatus === 1 ? "Active" : "Inactive"}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* PDF Preview Modal */}
        {transactionDetails && (
          <PdfPreviewModal
            isOpen={showPdfPreview}
            onClose={() => setShowPdfPreview(false)}
            pdfBlob={transactionPdfReport.data}
            title={`Transaction Report - ${transactionDetails.TransactionNo}`}
            isLoading={transactionPdfReport.isLoading}
            error={transactionPdfReport.error}
            onDownload={() => transactionPdfReport.downloadCurrentPdf(`Transaction_${transactionDetails.TransactionNo}.pdf`)}
            onRefresh={handlePreviewTransactionReport}
          />
        )}

        {/* Posting Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={postingConfirmDialogOpen}
          onClose={() => setPostingConfirmDialogOpen(false)}
          onConfirm={executePostTransaction}
          title="Post Transaction"
          description="Are you sure you want to proceed to post this transaction? You will be redirected to the posting interface."
          cancelText="Cancel"
          confirmText="Proceed to Post"
          type="warning"
        />

        {/* Reversal Dialog */}
        <Dialog open={reversalDialogOpen} onOpenChange={setReversalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reverse Posted Transaction</DialogTitle>
              <DialogDescription>Are you sure you want to reverse this posting? This will create offsetting journal entries.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reversal-reason">Reversal Reason *</Label>
                <Textarea
                  id="reversal-reason"
                  placeholder="Enter reason for reversal"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeReversalDialog} disabled={actionLoading}>
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
                    Reverse Transaction
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approval Dialog */}
        <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{approvalAction === ApprovalAction.APPROVE ? "Approve" : "Reject"} Transaction</DialogTitle>
              <DialogDescription>
                {approvalAction === ApprovalAction.APPROVE
                  ? "Are you sure you want to approve this posting?"
                  : "Are you sure you want to reject this posting? Please provide a reason."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="approval-comments">{approvalAction === ApprovalAction.APPROVE ? "Comments (Optional)" : "Rejection Reason *"}</Label>
                <Textarea
                  id="approval-comments"
                  placeholder={approvalAction === ApprovalAction.APPROVE ? "Enter approval comments" : "Enter reason for rejection"}
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows={3}
                  required={approvalAction === ApprovalAction.REJECT}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeApprovalDialog} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleApprovalAction}
                disabled={actionLoading || (approvalAction === ApprovalAction.REJECT && !approvalComments.trim())}
                variant={approvalAction === ApprovalAction.APPROVE ? "default" : "destructive"}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {approvalAction === ApprovalAction.APPROVE ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                    {approvalAction === ApprovalAction.APPROVE ? "Approve" : "Reject"} Transaction
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default LeaseRevenuePostingDetails;
