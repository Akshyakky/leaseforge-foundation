// src/pages/leaseRevenuePosting/LeaseRevenuePostingDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { leaseRevenuePostingService } from "@/services/leaseRevenuePostingService";
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
} from "lucide-react";
import { toast } from "sonner";
import { LeaseTransactionDetails, PostedLeaseRevenueTransaction, ReversalRequest } from "@/types/leaseRevenuePostingTypes";
import { format } from "date-fns";

export const LeaseRevenuePostingDetails = () => {
  const { type, id, postingId } = useParams<{ type: string; id: string; postingId: string }>();
  const navigate = useNavigate();

  // State variables
  const [transactionDetails, setTransactionDetails] = useState<LeaseTransactionDetails | null>(null);
  const [postingDetails, setPostingDetails] = useState<PostedLeaseRevenueTransaction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [reversalDialogOpen, setReversalDialogOpen] = useState(false);
  const [postingDialogOpen, setPostingDialogOpen] = useState(false);

  // Form states
  const [reversalReason, setReversalReason] = useState("");

  // Loading states for actions
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        if (postingId) {
          // Fetch posting details (for posted transactions)
          // This would need to be implemented in the service
          // For now, we'll show a placeholder
          setError("Posting details view not yet implemented");
        } else if (type && id) {
          // Fetch transaction details (for unposted transactions)
          const details = await leaseRevenuePostingService.getTransactionDetails(type as "Invoice" | "Receipt", parseInt(id));

          if (details) {
            setTransactionDetails(details);
          } else {
            setError("Transaction not found");
            toast.error("Transaction not found");
          }
        } else {
          setError("Invalid parameters");
        }
      } catch (err) {
        console.error("Error fetching details:", err);
        setError("Failed to load transaction details");
        toast.error("Failed to load transaction details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [type, id, postingId]);

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
  const renderStatusBadge = (isPosted: boolean, isReversed?: boolean) => {
    if (isReversed) {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          <XCircle className="w-3 h-3 mr-1" />
          Reversed
        </Badge>
      );
    }

    if (isPosted) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Posted
        </Badge>
      );
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
      Invoice: { className: "bg-blue-100 text-blue-800" },
      Receipt: { className: "bg-green-100 text-green-800" },
    };

    const config = typeConfig[transactionType as keyof typeof typeConfig] || typeConfig.Invoice;

    return (
      <Badge variant="outline" className={config.className}>
        <Receipt className="w-3 h-3 mr-1" />
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

  const handlePrint = () => {
    window.print();
  };

  const handlePostTransaction = () => {
    // Navigate back to main list with this transaction selected for posting
    navigate("/lease-revenue-posting", {
      state: {
        selectedTransaction: `${transactionDetails?.TransactionType}-${transactionDetails?.TransactionID}`,
      },
    });
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
        setReversalDialogOpen(false);
        setReversalReason("");
        // Refresh details or navigate back
        navigate("/lease-revenue-posting");
      }
    } catch (err) {
      console.error("Error reversing transaction:", err);
      toast.error("Failed to reverse transaction");
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

  if (error || (!transactionDetails && !postingDetails)) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-red-500 mb-4">{error || "Transaction not found"}</p>
            <Button onClick={() => navigate("/lease-revenue-posting")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lease Revenue Posting
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine available actions based on status
  const canPost = transactionDetails && !transactionDetails.IsPosted;
  const canReverse = postingDetails && !postingDetails.IsReversed;

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Lease Revenue Transaction Details</CardTitle>
            <CardDescription>View transaction information and posting status</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/lease-revenue-posting")}>
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

      {/* Transaction Information */}
      {transactionDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Information</CardTitle>
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
                    <h2 className="text-2xl font-bold">{transactionDetails.TransactionNo}</h2>
                    <Button variant="ghost" size="sm" onClick={handleCopyTransactionNo}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderTransactionTypeBadge(transactionDetails.TransactionType)}
                    {renderStatusBadge(transactionDetails.IsPosted)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Transaction Date:</span>
                    <span>{formatDate(transactionDetails.TransactionDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Property:</span>
                    <span>{transactionDetails.PropertyName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Unit:</span>
                    <span>{transactionDetails.UnitNo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Amount:</span>
                    <span className="text-lg font-semibold">{formatCurrency(transactionDetails.TotalAmount, transactionDetails.CurrencyName)}</span>
                  </div>
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
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Due Date:</span>
                    <span>{formatDate(transactionDetails.DueDate)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <span>{transactionDetails.InvoiceStatus}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Currency:</span>
                    <span>{transactionDetails.CurrencyName}</span>
                  </div>
                  {transactionDetails.ExchangeRate && (
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Exchange Rate:</span>
                      <span>{transactionDetails.ExchangeRate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer and Property Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Customer & Property Details</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Customer:</span>
                    <span>{transactionDetails.CustomerName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Property:</span>
                    <span>{transactionDetails.PropertyName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Unit No:</span>
                    <span>{transactionDetails.UnitNo}</span>
                  </div>
                  {transactionDetails.ContractNo && (
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Contract No:</span>
                      <span>{transactionDetails.ContractNo}</span>
                    </div>
                  )}
                  {transactionDetails.LeaseStartDate && (
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Lease Start:</span>
                      <span>{formatDate(transactionDetails.LeaseStartDate)}</span>
                    </div>
                  )}
                  {transactionDetails.LeaseEndDate && (
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Lease End:</span>
                      <span>{formatDate(transactionDetails.LeaseEndDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Amount Breakdown */}
            <Separator className="my-6" />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Amount Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Sub Total:</span>
                  <div className="text-lg font-semibold">{formatCurrency(transactionDetails.SubTotal, transactionDetails.CurrencyName)}</div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Tax Amount:</span>
                  <div className="text-lg font-semibold">{formatCurrency(transactionDetails.TaxAmount, transactionDetails.CurrencyName)}</div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Total Amount:</span>
                  <div className="text-xl font-bold text-primary">{formatCurrency(transactionDetails.TotalAmount, transactionDetails.CurrencyName)}</div>
                </div>
              </div>

              {transactionDetails.TransactionType === "Invoice" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Paid Amount:</span>
                    <div className="text-lg font-semibold text-green-600">{formatCurrency(transactionDetails.PaidAmount, transactionDetails.CurrencyName)}</div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Balance Amount:</span>
                    <div className="text-lg font-semibold text-red-600">{formatCurrency(transactionDetails.BalanceAmount, transactionDetails.CurrencyName)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Period Information */}
            {(transactionDetails.PeriodFromDate || transactionDetails.PeriodToDate) && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Period Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">Period From:</span>
                      <div>{formatDate(transactionDetails.PeriodFromDate)}</div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">Period To:</span>
                      <div>{formatDate(transactionDetails.PeriodToDate)}</div>
                    </div>
                    {transactionDetails.RentPerMonth && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">Monthly Rent:</span>
                        <div className="text-lg font-semibold">{formatCurrency(transactionDetails.RentPerMonth, transactionDetails.CurrencyName)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Posting Status */}
      <Card>
        <CardHeader>
          <CardTitle>Posting Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Posting Status:</span>
              </div>
              {transactionDetails && renderStatusBadge(transactionDetails.IsPosted)}
            </div>
            {canPost && (
              <Button onClick={handlePostTransaction}>
                <Send className="mr-2 h-4 w-4" />
                Post Transaction
              </Button>
            )}
          </div>

          {!transactionDetails?.IsPosted && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  This transaction has not been posted to the general ledger yet. Use the "Post Transaction" button to create the necessary accounting entries.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                <span>{transactionDetails?.CreatedBy || "—"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium text-muted-foreground">Created On:</span>
                <span>{formatDate(transactionDetails?.CreatedOn)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium text-muted-foreground">Updated By:</span>
                <span>{transactionDetails?.UpdatedBy || "—"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium text-muted-foreground">Updated On:</span>
                <span>{transactionDetails?.UpdatedOn ? formatDate(transactionDetails.UpdatedOn) : "—"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="flex flex-wrap justify-center gap-2 pt-6">
          {canPost && (
            <Button onClick={handlePostTransaction}>
              <Send className="mr-2 h-4 w-4" />
              Post to General Ledger
            </Button>
          )}
          {canReverse && (
            <Button variant="outline" onClick={() => setReversalDialogOpen(true)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reverse Posting
            </Button>
          )}
        </CardContent>
      </Card>

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
                  Reverse Transaction
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaseRevenuePostingDetails;
