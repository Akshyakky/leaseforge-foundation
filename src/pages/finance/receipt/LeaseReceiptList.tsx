// src/pages/finance/receipt/LeaseReceiptList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Search, Plus, Filter, Calendar, User, FileText, Receipt, DollarSign, Building, CheckCircle, CreditCard } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { leaseReceiptService } from "@/services/leaseReceiptService";
import { customerService } from "@/services/customerService";
import { contractService } from "@/services/contractService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LeaseReceipt } from "@/types/leaseReceiptTypes";

const LeaseReceiptList: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [receipts, setReceipts] = useState<LeaseReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<LeaseReceipt | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  // Filters
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [isCleared, setIsCleared] = useState<boolean | null>(null);

  // Receipt status options
  const receiptStatusOptions = ["Draft", "Validated", "Posted", "Cleared", "Cancelled"];

  // Payment method options
  const paymentMethodOptions = ["Cash", "Cheque", "Bank Transfer", "Credit Card", "Debit Card", "Others"];

  // Fetch data on component mount
  useEffect(() => {
    fetchReceipts();
    fetchReferenceData();
  }, []);

  // Fetch all receipts
  const fetchReceipts = async (search?: string, filters?: any) => {
    try {
      setLoading(true);
      const receiptsData = await leaseReceiptService.searchReceipts({
        searchText: search,
        customerID: filters?.customerID,
        contractID: filters?.contractID,
        receiptStatus: filters?.receiptStatus,
        fromDate: filters?.fromDate,
        toDate: filters?.toDate,
        isCleared: filters?.isCleared,
        paymentMethod: filters?.paymentMethod,
      });
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
      const [customersData, contractsData] = await Promise.all([customerService.getAllCustomers(), contractService.getAllContracts()]);
      setCustomers(customersData);
      setContracts(contractsData);
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Failed to load reference data");
    }
  };

  // Apply filters
  const applyFilters = () => {
    const filters = {
      customerID: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
      contractID: selectedContractId ? parseInt(selectedContractId) : undefined,
      receiptStatus: selectedStatus || undefined,
      paymentMethod: selectedPaymentMethod || undefined,
      fromDate: fromDate,
      toDate: toDate,
      isCleared: isCleared,
    };
    fetchReceipts(searchTerm, filters);
  };

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
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
  }, [selectedCustomerId, selectedContractId, selectedStatus, selectedPaymentMethod, fromDate, toDate, isCleared]);

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
      const response = await leaseReceiptService.deleteReceipt(selectedReceipt.ReceiptID);

      if (response.Status === 1) {
        setReceipts(receipts.filter((r) => r.ReceiptID !== selectedReceipt.ReceiptID));
        toast.success("Receipt deleted successfully");
      } else {
        toast.error(response.Message || "Failed to delete receipt");
      }
    } catch (error) {
      console.error("Error deleting receipt:", error);
      toast.error("Failed to delete receipt");
    } finally {
      closeDeleteDialog();
    }
  };

  // Change receipt status
  const handleChangeStatus = async (receipt: LeaseReceipt, newStatus: string) => {
    try {
      const response = await leaseReceiptService.changeReceiptStatus(receipt.ReceiptID, newStatus);

      if (response.Status === 1) {
        // Update receipt in the list
        setReceipts(receipts.map((r) => (r.ReceiptID === receipt.ReceiptID ? { ...r, ReceiptStatus: newStatus } : r)));
        toast.success(`Receipt status changed to ${newStatus}`);
      } else {
        toast.error(response.Message || "Failed to change receipt status");
      }
    } catch (error) {
      console.error("Error changing receipt status:", error);
      toast.error("Failed to change receipt status");
    }
  };

  // Toggle clearing status
  const handleToggleClearingStatus = async (receipt: LeaseReceipt) => {
    try {
      const newClearedStatus = !receipt.IsCleared;
      const clearingDate = newClearedStatus ? new Date() : undefined;

      const response = await leaseReceiptService.markChequeStatus(receipt.ReceiptID, newClearedStatus, clearingDate);

      if (response.Status === 1) {
        // Update receipt in the list
        setReceipts(
          receipts.map((r) =>
            r.ReceiptID === receipt.ReceiptID
              ? {
                  ...r,
                  IsCleared: newClearedStatus,
                  ClearingDate: newClearedStatus ? clearingDate : undefined,
                }
              : r
          )
        );

        toast.success(newClearedStatus ? "Receipt marked as cleared" : "Receipt marked as uncleared");
      } else {
        toast.error(response.Message || "Failed to update clearing status");
      }
    } catch (error) {
      console.error("Error updating clearing status:", error);
      toast.error("Failed to update clearing status");
    }
  };

  // Handle post to financial system
  const handlePostToFinancialSystem = async (receipt: LeaseReceipt) => {
    try {
      const response = await leaseReceiptService.postToFinancialSystem(receipt.ReceiptID);

      if (response.Status === 1) {
        // Update receipt in the list
        setReceipts(
          receipts.map((r) =>
            r.ReceiptID === receipt.ReceiptID
              ? {
                  ...r,
                  PostingID: response.PostingID,
                  PostingStatus: "Posted",
                  ReceiptStatus: "Posted",
                }
              : r
          )
        );

        toast.success("Receipt posted to financial system successfully");
      } else {
        toast.error(response.Message || "Failed to post receipt to financial system");
      }
    } catch (error) {
      console.error("Error posting receipt to financial system:", error);
      toast.error("Failed to post receipt to financial system");
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
    if (amount === undefined || amount === null) return "N/A";
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Get status color for badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Cleared":
        return "default";
      case "Draft":
        return "secondary";
      case "Validated":
      case "Posted":
        return "outline";
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "Cash":
        return <DollarSign className="h-4 w-4 mr-2" />;
      case "Cheque":
        return <FileText className="h-4 w-4 mr-2" />;
      case "Bank Transfer":
        return <Building className="h-4 w-4 mr-2" />;
      case "Credit Card":
      case "Debit Card":
        return <CreditCard className="h-4 w-4 mr-2" />;
      default:
        return <Receipt className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Payment Receipt Management</h1>
        <Button onClick={handleAddReceipt}>
          <Plus className="mr-2 h-4 w-4" />
          New Receipt
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Payment Receipts</CardTitle>
          <CardDescription>Manage payment receipts for contracts and invoices</CardDescription>
        </CardHeader>
        <CardContent>
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

            <Select value={selectedContractId} onValueChange={setSelectedContractId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Contracts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Contracts</SelectItem>
                {contracts.map((contract) => (
                  <SelectItem key={contract.ContractID} value={contract.ContractID.toString()}>
                    {contract.ContractNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Statuses</SelectItem>
                {receiptStatusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Payment Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Payment Methods</SelectItem>
                {paymentMethodOptions.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
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
            </div>

            <Button variant="outline" size="sm" onClick={() => setIsCleared(isCleared === true ? null : true)}>
              {isCleared === true ? "✓ Cleared Only" : "Cleared Only"}
            </Button>

            <Button variant="outline" size="sm" onClick={() => setIsCleared(isCleared === false ? null : false)}>
              {isCleared === false ? "✓ Uncleared Only" : "Uncleared Only"}
            </Button>

            {(fromDate || toDate || selectedCustomerId || selectedContractId || selectedStatus || selectedPaymentMethod || isCleared !== null) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFromDate(null);
                  setToDate(null);
                  setSelectedCustomerId("");
                  setSelectedContractId("");
                  setSelectedStatus("");
                  setSelectedPaymentMethod("");
                  setIsCleared(null);
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : receipts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedCustomerId || selectedContractId || selectedStatus || selectedPaymentMethod || fromDate || toDate || isCleared !== null
                ? "No receipts found matching your criteria."
                : "No receipts have been created yet."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Receipt #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contract</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => (
                    <TableRow key={receipt.ReceiptID}>
                      <TableCell>
                        <div className="font-medium">{receipt.ReceiptNo}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>{receipt.CustomerFullName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>{receipt.ContractNo}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getPaymentMethodIcon(receipt.PaymentMethod)}
                          <div>
                            {receipt.PaymentMethod}
                            {receipt.PaymentReference && <div className="text-xs text-muted-foreground">Ref: {receipt.PaymentReference}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Receipt: {formatDate(receipt.ReceiptDate)}</div>
                          {receipt.PaymentDate && <div className="text-xs text-muted-foreground">Payment: {formatDate(receipt.PaymentDate)}</div>}
                          {receipt.IsCleared && receipt.ClearingDate && <div className="text-xs text-green-600">Cleared: {formatDate(receipt.ClearingDate)}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(receipt.ReceiptAmount)}</div>
                        {receipt.PaymentMethod === "Cheque" && (
                          <div className="text-xs text-muted-foreground">
                            {receipt.BankName} - {receipt.ChequeNo}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={getStatusColor(receipt.ReceiptStatus)}>{receipt.ReceiptStatus}</Badge>
                          {receipt.IsCleared ? (
                            <Badge variant="default" className="bg-green-500">
                              Cleared
                            </Badge>
                          ) : (
                            receipt.PaymentMethod === "Cheque" && <Badge variant="outline">Uncleared</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewReceipt(receipt.ReceiptID)}>View details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditReceipt(receipt.ReceiptID)} disabled={receipt.ReceiptStatus !== "Draft"}>
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem disabled className="font-medium text-muted-foreground">
                              Change Status
                            </DropdownMenuItem>

                            {receiptStatusOptions
                              .filter((status) => status !== receipt.ReceiptStatus)
                              .map((status) => (
                                <DropdownMenuItem key={status} onClick={() => handleChangeStatus(receipt, status)}>
                                  Set as {status}
                                </DropdownMenuItem>
                              ))}

                            <DropdownMenuSeparator />

                            {receipt.PaymentMethod === "Cheque" && (
                              <DropdownMenuItem onClick={() => handleToggleClearingStatus(receipt)}>{receipt.IsCleared ? "Mark as Uncleared" : "Mark as Cleared"}</DropdownMenuItem>
                            )}

                            {receipt.ReceiptStatus === "Validated" && !receipt.PostingID && (
                              <DropdownMenuItem onClick={() => handlePostToFinancialSystem(receipt)}>Post to Financial System</DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(receipt)} disabled={receipt.ReceiptStatus !== "Draft"}>
                              Delete
                            </DropdownMenuItem>
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

      {/* Confirmation Dialog for Delete */}
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
      />
    </div>
  );
};

export default LeaseReceiptList;
