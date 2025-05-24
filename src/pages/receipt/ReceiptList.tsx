// src/pages/receipt/ReceiptList.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Search, Plus, Calendar, User, FileText, AlertTriangle, CheckCircle, Clock, DollarSign, Receipt, Eye } from "lucide-react";
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
import _ from "lodash";
import { useNavigate } from "react-router-dom";

const ReceiptList: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [receipts, setReceipts] = useState<LeaseReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<LeaseReceipt | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Reference data
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  // Filters
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Payment type and status options
  const paymentTypeOptions = Object.values(PaymentType);
  const paymentStatusOptions = Object.values(PaymentStatus);

  // Fetch data on component mount
  useEffect(() => {
    fetchReceipts();
    fetchReferenceData();
  }, []);

  // Fetch all receipts
  const fetchReceipts = async (search?: string, filters?: any) => {
    try {
      setLoading(true);
      let receiptsData: LeaseReceipt[] = [];

      if (activeTab === "unposted") {
        const unpostedReceipts = await receiptService.getUnpostedReceipts();
        receiptsData = unpostedReceipts as unknown as LeaseReceipt[];
      } else if (activeTab === "advance") {
        receiptsData = await receiptService.getAdvancePaymentReceipts();
      } else if (activeTab === "bounced") {
        receiptsData = await receiptService.getBouncedReceipts();
      } else if (activeTab === "pending-clearance") {
        receiptsData = await receiptService.getReceiptsPendingClearance();
      } else {
        receiptsData = await receiptService.searchReceipts({
          searchText: search,
          filterCustomerID: filters?.customerID,
          filterInvoiceID: filters?.invoiceID,
          filterPaymentType: filters?.paymentType,
          filterPaymentStatus: filters?.paymentStatus,
          filterFromDate: filters?.fromDate,
          filterToDate: filters?.toDate,
        });
      }

      // Apply additional tab filtering if needed
      if (activeTab === "cash") {
        receiptsData = receiptsData.filter((receipt) => receipt.PaymentType === PaymentType.CASH);
      } else if (activeTab === "cheque") {
        receiptsData = receiptsData.filter((receipt) => receipt.PaymentType === PaymentType.CHEQUE);
      } else if (activeTab === "bank-transfer") {
        receiptsData = receiptsData.filter((receipt) => receipt.PaymentType === PaymentType.BANK_TRANSFER);
      }

      setReceipts(receiptsData);
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
  }, [selectedCustomerId, selectedInvoiceId, selectedPaymentType, selectedPaymentStatus, fromDate, toDate, activeTab]);

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

  // Delete receipt handlers
  const openDeleteDialog = (receipt: LeaseReceipt) => {
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
  const openPostDialog = (receipt: LeaseReceipt) => {
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
        setReceipts(receipts.map((r) => (r.LeaseReceiptID === selectedReceipt.LeaseReceiptID ? { ...r, IsPosted: true, PostingID: response.PostingID } : r)));
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

  // Get payment status icon
  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case PaymentStatus.CLEARED:
        return <CheckCircle className="h-3 w-3" />;
      case PaymentStatus.BOUNCED:
        return <AlertTriangle className="h-3 w-3" />;
      case PaymentStatus.PENDING:
        return <Clock className="h-3 w-3" />;
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
      pendingClearance: receipts.filter((r) => r.PaymentType === PaymentType.CHEQUE && !r.ClearanceDate && r.PaymentStatus !== PaymentStatus.BOUNCED).length,
    };
  };

  const tabCounts = getTabCounts();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Receipt Management</h1>
        <Button onClick={handleAddReceipt}>
          <Plus className="mr-2 h-4 w-4" />
          New Receipt
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Receipts</CardTitle>
          <CardDescription>Manage payment receipts and collections</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-8 w-full mb-6">
              <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
              <TabsTrigger value="cash">Cash ({tabCounts.cash})</TabsTrigger>
              <TabsTrigger value="cheque">Cheque ({tabCounts.cheque})</TabsTrigger>
              <TabsTrigger value="bank-transfer">Transfer ({tabCounts.bankTransfer})</TabsTrigger>
              <TabsTrigger value="unposted">Unposted ({tabCounts.unposted})</TabsTrigger>
              <TabsTrigger value="advance">Advance ({tabCounts.advance})</TabsTrigger>
              <TabsTrigger value="bounced">Bounced ({tabCounts.bounced})</TabsTrigger>
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

              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 border-dashed">
                      <Calendar className="mr-2 h-4 w-4" />
                      {fromDate ? fromDate.toLocaleDateString() : "From Date"}
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
                      {toDate ? toDate.toLocaleDateString() : "To Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePicker value={toDate} onChange={setToDate} placeholder="To Date" disabled={(date) => (fromDate ? date < fromDate : false)} />
                  </PopoverContent>
                </Popover>

                {(fromDate || toDate || selectedCustomerId || selectedInvoiceId || selectedPaymentType || selectedPaymentStatus) && (
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
                          <th className="text-left p-4 font-medium">Receipt #</th>
                          <th className="text-left p-4 font-medium">Customer</th>
                          <th className="text-left p-4 font-medium">Invoice</th>
                          <th className="text-left p-4 font-medium">Payment Type</th>
                          <th className="text-left p-4 font-medium">Receipt Date</th>
                          <th className="text-left p-4 font-medium">Amount</th>
                          <th className="text-left p-4 font-medium">Status</th>
                          <th className="text-left p-4 font-medium">Posted</th>
                          <th className="text-left p-4 font-medium w-[100px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receipts.map((receipt, index) => (
                          <tr key={receipt.LeaseReceiptID} className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}>
                            <td className="p-4">
                              <div className="font-medium">{receipt.ReceiptNo}</div>
                              {receipt.IsAdvancePayment && (
                                <div className="text-xs text-blue-600 flex items-center mt-1">
                                  <Receipt className="h-3 w-3 mr-1" />
                                  Advance Payment
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                <div>{receipt.CustomerFullName}</div>
                              </div>
                            </td>
                            <td className="p-4">
                              {receipt.InvoiceNo ? <div className="font-medium">{receipt.InvoiceNo}</div> : <span className="text-muted-foreground">N/A</span>}
                            </td>
                            <td className="p-4">
                              <Badge variant={getPaymentTypeColor(receipt.PaymentType)} className="flex items-center gap-1 w-fit">
                                {receipt.PaymentType}
                              </Badge>
                              {receipt.ChequeNo && <div className="text-xs text-muted-foreground mt-1">Cheque: {receipt.ChequeNo}</div>}
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
                            </td>
                            <td className="p-4">
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
                                  <DropdownMenuItem onClick={() => handleEditReceipt(receipt.LeaseReceiptID)} disabled={receipt.IsPosted}>
                                    Edit
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem onClick={() => openPostDialog(receipt)} disabled={receipt.IsPosted}>
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Post to GL
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(receipt)} disabled={receipt.IsPosted}>
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
    </div>
  );
};

export default ReceiptList;
