// src/pages/receipt/ReceiptList.tsx - Updated for enhanced stored procedure functionality
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Loader2,
  MoreHorizontal,
  Search,
  Plus,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  HandCoins,
  Receipt,
  Eye,
  RefreshCw,
  Undo2,
  AlertCircle,
} from "lucide-react";
import { receiptService, LeaseReceipt, PaymentType, PaymentStatus } from "@/services/receiptService";
import { customerService } from "@/services/customerService";
import { invoiceService } from "@/services/invoiceService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import _ from "lodash";

interface ReceiptWithInvoiceInfo extends LeaseReceipt {
  InvoiceBalance?: number;
  CustomerName?: string;
  canReverse?: boolean;
  hasInvoice?: boolean;
}

const ReceiptList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [receipts, setReceipts] = useState<ReceiptWithInvoiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptWithInvoiceInfo | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isReverseDialogOpen, setIsReverseDialogOpen] = useState(false);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [reversalReason, setReversalReason] = useState<string>("");
  const [bulkActions, setBulkActions] = useState<number[]>([]);

  // Reference data
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  // Filters
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("");
  const [selectedPostingStatus, setSelectedPostingStatus] = useState<string>("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Payment type and status options
  const paymentTypeOptions = Object.values(PaymentType);
  const paymentStatusOptions = Object.values(PaymentStatus);
  const postingStatusOptions = [
    { value: "true", label: "Posted" },
    { value: "false", label: "Unposted" },
  ];

  // Initialize filters from URL params
  useEffect(() => {
    const customerId = searchParams.get("customerId");
    const invoiceId = searchParams.get("invoiceId");

    if (customerId) {
      setSelectedCustomerId(customerId);
      setActiveTab("customer");
    }

    if (invoiceId) {
      setSelectedInvoiceId(invoiceId);
      setActiveTab("invoice");
    }
  }, [searchParams]);

  // Fetch data on component mount
  useEffect(() => {
    fetchReceipts();
    fetchReferenceData();
  }, []);

  // Fetch all receipts with enhanced information
  const fetchReceipts = async (search?: string, filters?: any) => {
    try {
      setLoading(true);
      let receiptsData: LeaseReceipt[] = [];

      // Apply tab-specific filtering
      switch (activeTab) {
        case "unposted":
          receiptsData = await receiptService.getUnpostedReceipts();
          break;
        case "advance":
          receiptsData = await receiptService.getAdvancePaymentReceipts();
          break;
        case "bounced":
          receiptsData = await receiptService.getBouncedReceipts();
          break;
        case "pending-clearance":
          receiptsData = await receiptService.getReceiptsPendingClearance();
          break;
        case "reversed":
          receiptsData = await receiptService.getReceiptsByPaymentStatus(PaymentStatus.REVERSED);
          break;
        case "cash":
          receiptsData = await receiptService.getCashReceipts();
          break;
        case "cheque":
          receiptsData = await receiptService.getChequeReceipts();
          break;
        case "bank-transfer":
          receiptsData = await receiptService.getBankTransferReceipts();
          break;
        default:
          receiptsData = await receiptService.searchReceipts({
            searchText: search,
            filterCustomerID: filters?.customerID,
            filterInvoiceID: filters?.invoiceID,
            filterPaymentType: filters?.paymentType,
            filterPaymentStatus: filters?.paymentStatus,
            filterFromDate: filters?.fromDate,
            filterToDate: filters?.toDate,
            filterIsPosted: filters?.isPosted,
          });
      }

      // Enhance receipts with additional information
      const enhancedReceipts = await Promise.all(
        receiptsData.map(async (receipt) => {
          try {
            const enhanced: ReceiptWithInvoiceInfo = {
              ...receipt,
              canReverse: receipt.IsPosted && receipt.PaymentStatus !== PaymentStatus.REVERSED,
              hasInvoice: !!receipt.LeaseInvoiceID,
              CustomerName: receipt.CustomerFullName,
            };

            // Get invoice information if available
            if (receipt.LeaseInvoiceID) {
              try {
                const invoice = await invoiceService.getInvoiceById(receipt.LeaseInvoiceID);
                if (invoice) {
                  enhanced.InvoiceBalance = invoice.BalanceAmount;
                }
              } catch (error) {
                console.warn(`Could not fetch invoice details for receipt ${receipt.LeaseReceiptID}`);
              }
            }

            return enhanced;
          } catch (error) {
            console.error(`Error enhancing receipt ${receipt.LeaseReceiptID}:`, error);
            return {
              ...receipt,
              canReverse: false,
              hasInvoice: false,
            } as ReceiptWithInvoiceInfo;
          }
        })
      );

      setReceipts(enhancedReceipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      toast.error("Failed to load receipts");
    } finally {
      setLoading(false);
    }
  };

  // Fetch reference data
  const fetchReferenceData = async () => {
    try {
      const [customersData, invoicesData] = await Promise.all([customerService.getAllCustomers(), invoiceService.getAllInvoices()]);
      setCustomers(customersData);
      setInvoices(invoicesData);
    } catch (error) {
      console.error("Error fetching reference data:", error);
    }
  };

  // Apply filters
  const applyFilters = () => {
    const filters = {
      customerID: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
      invoiceID: selectedInvoiceId ? parseInt(selectedInvoiceId) : undefined,
      paymentType: selectedPaymentType || undefined,
      paymentStatus: selectedPaymentStatus || undefined,
      fromDate: fromDate,
      toDate: toDate,
      isPosted: selectedPostingStatus ? selectedPostingStatus === "true" : undefined,
    };
    fetchReceipts(searchTerm, filters);
  };

  // Debounced search function
  const debouncedSearch = _.debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      setSearchTerm(value);
      applyFilters();
    }
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Handle filter changes
  useEffect(() => {
    applyFilters();
  }, [selectedCustomerId, selectedInvoiceId, selectedPaymentType, selectedPaymentStatus, selectedPostingStatus, fromDate, toDate, activeTab]);

  // Navigation handlers
  const handleAddReceipt = () => {
    navigate("/receipts/new");
  };

  const handleEditReceipt = (receiptId: number) => {
    navigate(`/receipts/edit/${receiptId}`);
  };

  const handleViewReceipt = (receiptId: number) => {
    navigate(`/receipts/${receiptId}`);
  };

  const handleViewInvoice = (invoiceId: number) => {
    navigate(`/invoices/${invoiceId}`);
  };

  // Delete receipt handlers
  const openDeleteDialog = (receipt: ReceiptWithInvoiceInfo) => {
    setSelectedReceipt(receipt);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedReceipt(null);
  };

  const handleDeleteReceipt = async () => {
    if (!selectedReceipt) return;

    try {
      setActionLoading(true);
      const response = await receiptService.deleteReceipt(selectedReceipt.LeaseReceiptID);

      if (response.Status === 1) {
        setReceipts(receipts.filter((r) => r.LeaseReceiptID !== selectedReceipt.LeaseReceiptID));
        toast.success("Receipt deleted successfully");
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

  // Post to GL handlers
  const openPostDialog = (receipt: ReceiptWithInvoiceInfo) => {
    setSelectedReceipt(receipt);
    setIsPostDialogOpen(true);
  };

  const closePostDialog = () => {
    setIsPostDialogOpen(false);
    setSelectedReceipt(null);
  };

  const handlePostToGL = async () => {
    if (!selectedReceipt) return;

    try {
      setActionLoading(true);
      const response = await receiptService.postReceiptToGL({
        LeaseReceiptID: selectedReceipt.LeaseReceiptID,
      });

      if (response.Status === 1) {
        // Update receipt in list
        setReceipts(receipts.map((r) => (r.LeaseReceiptID === selectedReceipt.LeaseReceiptID ? { ...r, IsPosted: true, PostingID: response.MainPostingID } : r)));
        toast.success("Receipt posted to GL successfully");
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

  // GL Reversal handlers
  const openReverseDialog = (receipt: ReceiptWithInvoiceInfo) => {
    setSelectedReceipt(receipt);
    setReversalReason("");
    setIsReverseDialogOpen(true);
  };

  const closeReverseDialog = () => {
    setIsReverseDialogOpen(false);
    setSelectedReceipt(null);
    setReversalReason("");
  };

  const handleReverseGLPosting = async () => {
    if (!selectedReceipt || !reversalReason.trim()) {
      toast.error("Reversal reason is required");
      return;
    }

    try {
      setActionLoading(true);
      const response = await receiptService.reverseReceiptGLPosting({
        LeaseReceiptID: selectedReceipt.LeaseReceiptID,
        ReversalReason: reversalReason.trim(),
      });

      if (response.Status === 1) {
        // Update receipt in list
        setReceipts(
          receipts.map((r) =>
            r.LeaseReceiptID === selectedReceipt.LeaseReceiptID ? { ...r, IsPosted: false, PaymentStatus: PaymentStatus.REVERSED, PostingID: undefined, canReverse: false } : r
          )
        );
        toast.success("Receipt GL posting reversed successfully");
      } else {
        toast.error(response.Message || "Failed to reverse receipt GL posting");
      }
    } catch (error) {
      console.error("Error reversing receipt GL posting:", error);
      toast.error("Failed to reverse receipt GL posting");
    } finally {
      setActionLoading(false);
      closeReverseDialog();
    }
  };

  // Status change handlers
  const openStatusChangeDialog = (receipt: ReceiptWithInvoiceInfo, status: string) => {
    setSelectedReceipt(receipt);
    setSelectedStatus(status);
    setIsStatusChangeDialogOpen(true);
  };

  const closeStatusChangeDialog = () => {
    setIsStatusChangeDialogOpen(false);
    setSelectedReceipt(null);
    setSelectedStatus("");
  };

  const handleStatusChange = async () => {
    if (!selectedReceipt || !selectedStatus) return;

    try {
      setActionLoading(true);
      const response = await receiptService.updateReceipt({
        receipt: {
          LeaseReceiptID: selectedReceipt.LeaseReceiptID,
          PaymentStatus: selectedStatus,
        },
      });

      if (response.Status === 1) {
        setReceipts(receipts.map((r) => (r.LeaseReceiptID === selectedReceipt.LeaseReceiptID ? { ...r, PaymentStatus: selectedStatus } : r)));
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

  // Bulk operations
  const handleBulkPost = async () => {
    if (bulkActions.length === 0) return;

    try {
      setActionLoading(true);
      const promises = bulkActions.map(async (receiptId) => {
        try {
          return await receiptService.postReceiptToGL({ LeaseReceiptID: receiptId });
        } catch (error) {
          console.error(`Failed to post receipt ${receiptId}:`, error);
          return { Status: 0, Message: `Failed to post receipt ${receiptId}` };
        }
      });

      const results = await Promise.all(promises);
      const successful = results.filter((r) => r.Status === 1).length;
      const failed = results.length - successful;

      if (successful > 0) {
        toast.success(`${successful} receipts posted successfully${failed > 0 ? `, ${failed} failed` : ""}`);
        applyFilters(); // Refresh the list
      } else {
        toast.error("Failed to post any receipts");
      }

      setBulkActions([]);
    } catch (error) {
      console.error("Error in bulk posting:", error);
      toast.error("Failed to perform bulk posting");
    } finally {
      setActionLoading(false);
    }
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
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case PaymentStatus.CLEARED:
        return "default";
      case PaymentStatus.RECEIVED:
        return "secondary";
      case PaymentStatus.PENDING:
      case PaymentStatus.PENDING_CLEARANCE:
        return "outline";
      case PaymentStatus.DEPOSITED:
        return "default";
      case PaymentStatus.BOUNCED:
      case PaymentStatus.CANCELLED:
        return "destructive";
      case PaymentStatus.REVERSED:
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

  // Get payment status icon
  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case PaymentStatus.CLEARED:
        return <CheckCircle className="h-3 w-3" />;
      case PaymentStatus.BOUNCED:
      case PaymentStatus.CANCELLED:
        return <AlertTriangle className="h-3 w-3" />;
      case PaymentStatus.PENDING:
      case PaymentStatus.PENDING_CLEARANCE:
        return <Clock className="h-3 w-3" />;
      case PaymentStatus.REVERSED:
        return <Undo2 className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  // Get tab counts
  const getTabCounts = () => {
    return {
      all: receipts.length,
      cash: receipts.filter((r) => r.PaymentType === PaymentType.CASH).length,
      cheque: receipts.filter((r) => r.PaymentType === PaymentType.CHEQUE).length,
      bankTransfer: receipts.filter((r) => r.PaymentType === PaymentType.BANK_TRANSFER).length,
      unposted: receipts.filter((r) => !r.IsPosted).length,
      advance: receipts.filter((r) => r.IsAdvancePayment).length,
      bounced: receipts.filter((r) => r.PaymentStatus === PaymentStatus.BOUNCED).length,
      reversed: receipts.filter((r) => r.PaymentStatus === PaymentStatus.REVERSED).length,
      pendingClearance: receipts.filter(
        (r) => r.PaymentType === PaymentType.CHEQUE && !r.ClearanceDate && r.PaymentStatus !== PaymentStatus.BOUNCED && r.PaymentStatus !== PaymentStatus.REVERSED
      ).length,
    };
  };

  const tabCounts = getTabCounts();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Receipt Management</h1>
          <p className="text-muted-foreground">Manage payment receipts and GL postings</p>
        </div>
        <div className="flex space-x-2">
          {bulkActions.length > 0 && (
            <Button variant="outline" onClick={handleBulkPost} disabled={actionLoading}>
              <HandCoins className="mr-2 h-4 w-4" />
              Post Selected ({bulkActions.length})
            </Button>
          )}
          <Button variant="outline" onClick={() => fetchReceipts()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleAddReceipt}>
            <Plus className="mr-2 h-4 w-4" />
            New Receipt
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Receipts</CardTitle>
          <CardDescription>Manage payment receipts, GL postings, and reversals</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-9 w-full mb-6">
              <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
              <TabsTrigger value="cash">Cash ({tabCounts.cash})</TabsTrigger>
              <TabsTrigger value="cheque">Cheque ({tabCounts.cheque})</TabsTrigger>
              <TabsTrigger value="bank-transfer">Transfer ({tabCounts.bankTransfer})</TabsTrigger>
              <TabsTrigger value="unposted">Unposted ({tabCounts.unposted})</TabsTrigger>
              <TabsTrigger value="advance">Advance ({tabCounts.advance})</TabsTrigger>
              <TabsTrigger value="bounced">Bounced ({tabCounts.bounced})</TabsTrigger>
              <TabsTrigger value="reversed">Reversed ({tabCounts.reversed})</TabsTrigger>
              <TabsTrigger value="pending-clearance">Pending ({tabCounts.pendingClearance})</TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder="Search receipts..." className="pl-9" onChange={handleSearchChange} />
              </div>

              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.CustomerID} value={customer.CustomerID.toString()}>
                      {customer.CustomerFullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Invoices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Invoices</SelectItem>
                  {invoices.map((invoice) => (
                    <SelectItem key={invoice.LeaseInvoiceID} value={invoice.LeaseInvoiceID.toString()}>
                      {invoice.InvoiceNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPaymentType} onValueChange={setSelectedPaymentType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Payment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Types</SelectItem>
                  {paymentTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Statuses</SelectItem>
                  {paymentStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPostingStatus} onValueChange={setSelectedPostingStatus}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="GL Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All</SelectItem>
                  {postingStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 border-dashed">
                      <Calendar className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "PP") : "From Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePicker value={fromDate} onChange={setFromDate} placeholder="From Date" />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 border-dashed">
                      <Calendar className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "PP") : "To Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePicker value={toDate} onChange={setToDate} placeholder="To Date" disabled={(date) => (fromDate ? date < fromDate : false)} />
                  </PopoverContent>
                </Popover>

                {(fromDate || toDate || selectedCustomerId || selectedInvoiceId || selectedPaymentType || selectedPaymentStatus || selectedPostingStatus) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFromDate(null);
                      setToDate(null);
                      setSelectedCustomerId("");
                      setSelectedInvoiceId("");
                      setSelectedPaymentType("");
                      setSelectedPaymentStatus("");
                      setSelectedPostingStatus("");
                    }}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            </div>

            <TabsContent value={activeTab}>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {searchTerm || selectedCustomerId || selectedInvoiceId || selectedPaymentType || fromDate || toDate
                    ? "No receipts found matching your criteria."
                    : "No receipts have been created yet."}
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left p-4 font-medium w-8">
                            <input
                              type="checkbox"
                              checked={bulkActions.length === receipts.filter((r) => !r.IsPosted).length && receipts.filter((r) => !r.IsPosted).length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBulkActions(receipts.filter((r) => !r.IsPosted).map((r) => r.LeaseReceiptID));
                                } else {
                                  setBulkActions([]);
                                }
                              }}
                            />
                          </th>
                          <th className="text-left p-4 font-medium">Receipt #</th>
                          <th className="text-left p-4 font-medium">Customer</th>
                          <th className="text-left p-4 font-medium">Invoice</th>
                          <th className="text-left p-4 font-medium">Payment Type</th>
                          <th className="text-left p-4 font-medium">Receipt Date</th>
                          <th className="text-left p-4 font-medium">Amount</th>
                          <th className="text-left p-4 font-medium">Status</th>
                          <th className="text-left p-4 font-medium">GL Status</th>
                          <th className="text-left p-4 font-medium w-[100px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receipts.map((receipt, index) => (
                          <tr key={receipt.LeaseReceiptID} className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}>
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={bulkActions.includes(receipt.LeaseReceiptID)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBulkActions([...bulkActions, receipt.LeaseReceiptID]);
                                  } else {
                                    setBulkActions(bulkActions.filter((id) => id !== receipt.LeaseReceiptID));
                                  }
                                }}
                                disabled={receipt.IsPosted}
                              />
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                <div className="font-medium">{receipt.ReceiptNo}</div>
                                {receipt.IsAdvancePayment && (
                                  <div className="text-xs text-blue-600 flex items-center">
                                    <Receipt className="h-3 w-3 mr-1" />
                                    Advance Payment
                                  </div>
                                )}
                                {receipt.PaymentStatus === PaymentStatus.REVERSED && (
                                  <div className="text-xs text-red-600 flex items-center">
                                    <Undo2 className="h-3 w-3 mr-1" />
                                    GL Reversed
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                <div>{receipt.CustomerFullName}</div>
                              </div>
                            </td>
                            <td className="p-4">
                              {receipt.InvoiceNo ? (
                                <div className="space-y-1">
                                  <div className="font-medium">{receipt.InvoiceNo}</div>
                                  {receipt.InvoiceBalance !== undefined && <div className="text-xs text-muted-foreground">Balance: {formatCurrency(receipt.InvoiceBalance)}</div>}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No Invoice</span>
                              )}
                            </td>
                            <td className="p-4">
                              <Badge variant={getPaymentTypeColor(receipt.PaymentType)} className="flex items-center gap-1 w-fit">
                                {receipt.PaymentType}
                              </Badge>
                              {receipt.ChequeNo && <div className="text-xs text-muted-foreground mt-1">Cheque: {receipt.ChequeNo}</div>}
                              {receipt.TransactionReference && receipt.PaymentType === PaymentType.BANK_TRANSFER && (
                                <div className="text-xs text-muted-foreground mt-1">Ref: {receipt.TransactionReference}</div>
                              )}
                            </td>
                            <td className="p-4">{formatDate(receipt.ReceiptDate)}</td>
                            <td className="p-4">
                              <div className="font-medium">{formatCurrency(receipt.ReceivedAmount)}</div>
                              {receipt.CurrencyName && receipt.CurrencyName !== "USD" && <div className="text-xs text-muted-foreground">{receipt.CurrencyName}</div>}
                            </td>
                            <td className="p-4">
                              <Badge variant={getPaymentStatusColor(receipt.PaymentStatus)} className="flex items-center gap-1 w-fit">
                                {getPaymentStatusIcon(receipt.PaymentStatus)}
                                {receipt.PaymentStatus}
                              </Badge>
                              {receipt.ClearanceDate && <div className="text-xs text-muted-foreground mt-1">Cleared: {formatDate(receipt.ClearanceDate)}</div>}
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                {receipt.IsPosted ? (
                                  <Badge variant="default" className="flex items-center gap-1 w-fit">
                                    <CheckCircle className="h-3 w-3" />
                                    Posted
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                    <Clock className="h-3 w-3" />
                                    Pending
                                  </Badge>
                                )}
                                {receipt.PostingID && <div className="text-xs text-muted-foreground">ID: {receipt.PostingID}</div>}
                              </div>
                            </td>
                            <td className="p-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewReceipt(receipt.LeaseReceiptID)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEditReceipt(receipt.LeaseReceiptID)}
                                    disabled={receipt.IsPosted || receipt.PaymentStatus === PaymentStatus.REVERSED}
                                  >
                                    Edit
                                  </DropdownMenuItem>

                                  {receipt.hasInvoice && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleViewInvoice(receipt.LeaseInvoiceID!)}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        View Invoice
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem onClick={() => openPostDialog(receipt)} disabled={receipt.IsPosted || receipt.PaymentStatus === PaymentStatus.REVERSED}>
                                    <HandCoins className="h-4 w-4 mr-2" />
                                    Post to GL
                                  </DropdownMenuItem>

                                  <DropdownMenuItem onClick={() => openReverseDialog(receipt)} disabled={!receipt.canReverse}>
                                    <Undo2 className="h-4 w-4 mr-2" />
                                    Reverse GL Posting
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem disabled className="font-medium text-muted-foreground">
                                    Change Status
                                  </DropdownMenuItem>

                                  {paymentStatusOptions
                                    .filter((status) => status !== receipt.PaymentStatus && status !== PaymentStatus.REVERSED)
                                    .map((status) => (
                                      <DropdownMenuItem
                                        key={status}
                                        onClick={() => openStatusChangeDialog(receipt, status)}
                                        disabled={receipt.PaymentStatus === PaymentStatus.REVERSED}
                                      >
                                        Set as {status}
                                      </DropdownMenuItem>
                                    ))}

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    className="text-red-500"
                                    onClick={() => openDeleteDialog(receipt)}
                                    disabled={receipt.IsPosted || receipt.PaymentStatus === PaymentStatus.REVERSED}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteReceipt}
        title="Delete Receipt"
        description={
          selectedReceipt
            ? `Are you sure you want to delete receipt "${selectedReceipt.ReceiptNo}"? This action cannot be undone.`
            : "Are you sure you want to delete this receipt?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
        loading={actionLoading}
      />

      {/* Post to GL Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isPostDialogOpen}
        onClose={closePostDialog}
        onConfirm={handlePostToGL}
        title="Post Receipt to GL"
        description={
          selectedReceipt
            ? `Are you sure you want to post receipt "${selectedReceipt.ReceiptNo}" to the General Ledger? This action cannot be undone.`
            : "Are you sure you want to post this receipt to GL?"
        }
        cancelText="Cancel"
        confirmText="Post to GL"
        type="warning"
        loading={actionLoading}
      />

      {/* Reverse GL Posting Dialog */}
      <ConfirmationDialog
        isOpen={isReverseDialogOpen}
        onClose={closeReverseDialog}
        onConfirm={handleReverseGLPosting}
        title="Reverse GL Posting"
        description={
          <div className="space-y-4">
            <p>Are you sure you want to reverse the GL posting for receipt "{selectedReceipt?.ReceiptNo}"? This action cannot be undone.</p>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>This will create reversal entries in the General Ledger and update the invoice payment amounts.</AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="reversalReason">Reversal Reason *</Label>
              <Textarea
                id="reversalReason"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="Enter reason for reversal..."
                className="min-h-[80px]"
              />
            </div>
          </div>
        }
        cancelText="Cancel"
        confirmText="Reverse Posting"
        type="danger"
        loading={actionLoading}
      />

      {/* Status Change Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isStatusChangeDialogOpen}
        onClose={closeStatusChangeDialog}
        onConfirm={handleStatusChange}
        title="Change Receipt Status"
        description={
          selectedReceipt && selectedStatus
            ? `Are you sure you want to change the status of receipt "${selectedReceipt.ReceiptNo}" to "${selectedStatus}"?`
            : "Are you sure you want to change the receipt status?"
        }
        cancelText="Cancel"
        confirmText="Change Status"
        type="warning"
        loading={actionLoading}
      />
    </div>
  );
};

export default ReceiptList;
