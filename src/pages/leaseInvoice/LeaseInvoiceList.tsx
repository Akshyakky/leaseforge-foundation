// src/pages/leaseInvoice/LeaseInvoiceList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  MoreHorizontal,
  Search,
  Plus,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Building,
  HandCoins,
  Send,
  RotateCcw,
  Ban,
  Receipt,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { leaseInvoiceGenerationService } from "@/services/leaseInvoiceGenerationService";
import { accountService } from "@/services/accountService";
import { debounce } from "lodash";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  GeneratedLeaseInvoice,
  LeaseInvoiceFilters,
  InvoicePostingRequest,
  InvoiceReversalRequest,
  InvoiceCancellationRequest,
  INVOICE_STATUSES,
  INVOICE_TYPES,
} from "@/types/leaseInvoiceGenerationTypes";
import { Account } from "@/types/accountTypes";

const LeaseInvoiceList = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState<GeneratedLeaseInvoice[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<GeneratedLeaseInvoice | null>(null);

  // Dialog states
  const [postingDialogOpen, setPostingDialogOpen] = useState(false);
  const [reversalDialogOpen, setReversalDialogOpen] = useState(false);
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [reversalReason, setReversalReason] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");

  // Posting form states
  const [postingData, setPostingData] = useState({
    postingDate: new Date(),
    debitAccountId: "",
    creditAccountId: "",
    narration: "",
    referenceNo: "",
  });

  // Filter states
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Invoice type and status options
  const invoiceTypes = Object.values(INVOICE_TYPES);
  const invoiceStatuses = Object.values(INVOICE_STATUSES);

  // Fetch data on component mount
  useEffect(() => {
    fetchInvoices();
    fetchAccounts();
  }, []);

  // Fetch accounts for posting
  const fetchAccounts = async () => {
    try {
      const accountsData = await accountService.getAllAccounts();
      setAccounts(accountsData.filter((acc) => acc.IsActive && acc.IsPostable));
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load accounts");
    }
  };

  // Fetch invoices with filters
  const fetchInvoices = async (filters?: LeaseInvoiceFilters) => {
    try {
      setLoading(true);
      const invoicesData = await leaseInvoiceGenerationService.getGeneratedInvoices(filters || {});
      setInvoices(invoicesData);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      handleFilterChange();
    }
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle filter changes
  const handleFilterChange = () => {
    const filters: LeaseInvoiceFilters = {
      PropertyID: selectedPropertyId ? parseInt(selectedPropertyId) : undefined,
      CustomerID: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
      InvoiceType: selectedInvoiceType as any,
      DueDateFrom: dateFrom,
      DueDateTo: dateTo,
      TransactionDate: undefined, // Add if needed
    };

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key as keyof LeaseInvoiceFilters] === undefined) {
        delete filters[key as keyof LeaseInvoiceFilters];
      }
    });

    fetchInvoices(filters);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedPropertyId("");
    setSelectedCustomerId("");
    setSelectedInvoiceType("");
    setSelectedStatus("");
    setDateFrom(undefined);
    setDateTo(undefined);
    fetchInvoices();
  };

  // Navigation handlers
  const handleGenerateInvoice = () => {
    navigate("/lease-invoices/generate");
  };

  const handleViewInvoice = (invoice: GeneratedLeaseInvoice) => {
    navigate(`/lease-invoices/${invoice.LeaseInvoiceID}`);
  };

  const handleEditInvoice = (invoice: GeneratedLeaseInvoice) => {
    navigate(`/lease-invoices/edit/${invoice.LeaseInvoiceID}`);
  };

  // Posting handlers
  const handlePostInvoice = (invoice: GeneratedLeaseInvoice) => {
    setSelectedInvoice(invoice);
    setPostingData({
      postingDate: new Date(),
      debitAccountId: "",
      creditAccountId: "",
      narration: `Lease Invoice - ${invoice.InvoiceNo}`,
      referenceNo: invoice.InvoiceNo,
    });
    setPostingDialogOpen(true);
  };

  const executePosting = async () => {
    if (!selectedInvoice) return;

    setActionLoading(true);
    try {
      const postingRequest: InvoicePostingRequest = {
        LeaseInvoiceID: selectedInvoice.LeaseInvoiceID,
        PostingDate: postingData.postingDate,
        DebitAccountID: parseInt(postingData.debitAccountId),
        CreditAccountID: parseInt(postingData.creditAccountId),
        PostingNarration: postingData.narration,
        ReferenceNo: postingData.referenceNo,
      };

      const result = await leaseInvoiceGenerationService.postInvoiceToAccounting(postingRequest);

      if (result.success) {
        toast.success("Invoice posted successfully");
        setPostingDialogOpen(false);
        fetchInvoices();
      }
    } catch (error) {
      console.error("Error posting invoice:", error);
      toast.error("Failed to post invoice");
    } finally {
      setActionLoading(false);
    }
  };

  // Reversal handlers
  const handleReverseInvoice = (invoice: GeneratedLeaseInvoice) => {
    setSelectedInvoice(invoice);
    setReversalReason("");
    setReversalDialogOpen(true);
  };

  const executeReversal = async () => {
    if (!selectedInvoice || !reversalReason.trim()) {
      toast.error("Reversal reason is required");
      return;
    }

    setActionLoading(true);
    try {
      const reversalRequest: InvoiceReversalRequest = {
        LeaseInvoiceID: selectedInvoice.LeaseInvoiceID,
        ReversalReason: reversalReason.trim(),
      };

      const result = await leaseInvoiceGenerationService.reversePostedInvoice(reversalRequest);

      if (result.success) {
        toast.success("Invoice reversed successfully");
        setReversalDialogOpen(false);
        setReversalReason("");
        fetchInvoices();
      }
    } catch (error) {
      console.error("Error reversing invoice:", error);
      toast.error("Failed to reverse invoice");
    } finally {
      setActionLoading(false);
    }
  };

  // Cancellation handlers
  const handleCancelInvoice = (invoice: GeneratedLeaseInvoice) => {
    setSelectedInvoice(invoice);
    setCancellationReason("");
    setCancellationDialogOpen(true);
  };

  const executeCancellation = async () => {
    if (!selectedInvoice || !cancellationReason.trim()) {
      toast.error("Cancellation reason is required");
      return;
    }

    setActionLoading(true);
    try {
      const cancellationRequest: InvoiceCancellationRequest = {
        LeaseInvoiceID: selectedInvoice.LeaseInvoiceID,
        CancelReason: cancellationReason.trim(),
      };

      const result = await leaseInvoiceGenerationService.cancelInvoice(cancellationRequest);

      if (result.success) {
        toast.success("Invoice cancelled successfully");
        setCancellationDialogOpen(false);
        setCancellationReason("");
        fetchInvoices();
      }
    } catch (error) {
      console.error("Error cancelling invoice:", error);
      toast.error("Failed to cancel invoice");
    } finally {
      setActionLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string, postingStatus: string) => {
    const getStatusConfig = (status: string, postingStatus: string) => {
      if (status === "Cancelled") {
        return { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800" };
      }
      if (postingStatus === "Posted") {
        return { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" };
      }
      if (status === "Active") {
        return { variant: "default" as const, icon: Receipt, className: "bg-blue-100 text-blue-800" };
      }
      return { variant: "secondary" as const, icon: Clock, className: "bg-yellow-100 text-yellow-800" };
    };

    const config = getStatusConfig(status, postingStatus);
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {postingStatus === "Posted" ? "Posted" : status}
      </Badge>
    );
  };

  // Calculate statistics
  const stats = {
    total: invoices.length,
    active: invoices.filter((i) => i.InvoiceStatus === "Active").length,
    posted: invoices.filter((i) => i.PostingStatus === "Posted").length,
    cancelled: invoices.filter((i) => i.InvoiceStatus === "Cancelled").length,
    totalAmount: invoices.reduce((sum, i) => sum + (i.TotalAmount || 0), 0),
    paidAmount: invoices.reduce((sum, i) => sum + (i.PaidAmount || 0), 0),
    balanceAmount: invoices.reduce((sum, i) => sum + (i.BalanceAmount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Lease Invoice Management</h1>
          <p className="text-muted-foreground">Generate and manage lease invoices</p>
        </div>
        <Button onClick={handleGenerateInvoice}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Invoice
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Lease Invoices</CardTitle>
          <CardDescription>View and manage all generated lease invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total</span>
                </div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Active</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Posted</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.posted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-muted-foreground">Cancelled</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <HandCoins className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                </div>
                <div className="text-lg font-bold text-blue-600">{formatCurrency(stats.totalAmount)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <HandCoins className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Paid Amount</span>
                </div>
                <div className="text-lg font-bold text-green-600">{formatCurrency(stats.paidAmount)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <HandCoins className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-muted-foreground">Balance</span>
                </div>
                <div className="text-lg font-bold text-orange-600">{formatCurrency(stats.balanceAmount)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search invoices..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <Select
                value={selectedInvoiceType || "all"}
                onValueChange={(value) => {
                  setSelectedInvoiceType(value === "all" ? "" : value);
                  setTimeout(handleFilterChange, 100);
                }}
              >
                <SelectTrigger className="w-[160px] flex-shrink-0">
                  <SelectValue placeholder="Invoice Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {invoiceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedStatus || "all"}
                onValueChange={(value) => {
                  setSelectedStatus(value === "all" ? "" : value);
                  setTimeout(handleFilterChange, 100);
                }}
              >
                <SelectTrigger className="w-[160px] flex-shrink-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {invoiceStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex-shrink-0">
                <DatePicker
                  value={dateFrom}
                  onChange={(date) => {
                    setDateFrom(date);
                    setTimeout(handleFilterChange, 100);
                  }}
                  placeholder="From date"
                />
              </div>

              <div className="flex-shrink-0">
                <DatePicker
                  value={dateTo}
                  onChange={(date) => {
                    setDateTo(date);
                    setTimeout(handleFilterChange, 100);
                  }}
                  placeholder="To date"
                />
              </div>

              <Button variant="outline" onClick={clearFilters} className="flex-shrink-0 whitespace-nowrap">
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Invoices Table */}
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No invoices found.</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property/Unit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.LeaseInvoiceID}>
                      <TableCell>
                        <div className="font-medium">{invoice.InvoiceNo}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(invoice.InvoiceDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{invoice.Tenant}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{invoice.Property}</div>
                        <div className="text-sm text-muted-foreground">Unit: {invoice.UnitNo}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {invoice.InvoiceType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(invoice.DueDate)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(invoice.TotalAmount)}</div>
                        {invoice.TaxAmount > 0 && <div className="text-sm text-muted-foreground">Tax: {formatCurrency(invoice.TaxAmount)}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(invoice.BalanceAmount)}</div>
                      </TableCell>
                      <TableCell>{renderStatusBadge(invoice.InvoiceStatus, invoice.PostingStatus)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {invoice.InvoiceStatus === "Active" && (
                              <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {invoice.PostingStatus === "Unposted" && invoice.InvoiceStatus === "Active" && (
                              <DropdownMenuItem onClick={() => handlePostInvoice(invoice)}>
                                <Send className="mr-2 h-4 w-4" />
                                Post to Accounting
                              </DropdownMenuItem>
                            )}

                            {invoice.PostingStatus === "Posted" && (
                              <DropdownMenuItem onClick={() => handleReverseInvoice(invoice)} className="text-orange-600">
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reverse Posting
                              </DropdownMenuItem>
                            )}

                            {invoice.InvoiceStatus === "Active" && invoice.PaidAmount === 0 && (
                              <DropdownMenuItem onClick={() => handleCancelInvoice(invoice)} className="text-red-500">
                                <Ban className="mr-2 h-4 w-4" />
                                Cancel Invoice
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Posting Dialog */}
      <Dialog open={postingDialogOpen} onOpenChange={setPostingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post Invoice to Accounting</DialogTitle>
            <DialogDescription>Configure posting details for invoice {selectedInvoice?.InvoiceNo}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="posting-date">Posting Date</Label>
                <DatePicker value={postingData.postingDate} onChange={(date) => date && setPostingData({ ...postingData, postingDate: date })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference-no">Reference Number</Label>
                <Input
                  id="reference-no"
                  value={postingData.referenceNo}
                  onChange={(e) => setPostingData({ ...postingData, referenceNo: e.target.value })}
                  placeholder="Enter reference number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Debit Account (Accounts Receivable)</Label>
                <Select value={postingData.debitAccountId} onValueChange={(value) => setPostingData({ ...postingData, debitAccountId: value })}>
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
              <div className="space-y-2">
                <Label>Credit Account (Revenue)</Label>
                <Select value={postingData.creditAccountId} onValueChange={(value) => setPostingData({ ...postingData, creditAccountId: value })}>
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

            <div className="space-y-2">
              <Label htmlFor="narration">Narration</Label>
              <textarea
                id="narration"
                className="w-full mt-1 p-2 border rounded-md"
                placeholder="Enter posting narration"
                value={postingData.narration}
                onChange={(e) => setPostingData({ ...postingData, narration: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostingDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={executePosting} disabled={actionLoading || !postingData.debitAccountId || !postingData.creditAccountId}>
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
            <DialogTitle>Reverse Invoice Posting</DialogTitle>
            <DialogDescription>Are you sure you want to reverse the posting for invoice {selectedInvoice?.InvoiceNo}?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reversal-reason">Reversal Reason *</Label>
              <textarea
                id="reversal-reason"
                className="w-full mt-1 p-2 border rounded-md"
                placeholder="Enter reason for reversal"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReversalDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={executeReversal} disabled={actionLoading || !reversalReason.trim()} variant="destructive">
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

      {/* Cancellation Dialog */}
      <Dialog open={cancellationDialogOpen} onOpenChange={setCancellationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Invoice</DialogTitle>
            <DialogDescription>Are you sure you want to cancel invoice {selectedInvoice?.InvoiceNo}? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancellation-reason">Cancellation Reason *</Label>
              <textarea
                id="cancellation-reason"
                className="w-full mt-1 p-2 border rounded-md"
                placeholder="Enter reason for cancellation"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancellationDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={executeCancellation} disabled={actionLoading || !cancellationReason.trim()} variant="destructive">
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Cancel Invoice
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaseInvoiceList;
