// src/pages/pettyCash/PettyCashList.tsx
import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Search, Plus, Calendar, DollarSign, FileText, Eye, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { pettyCashService, PettyCashVoucher, PettyCashSearchParams } from "@/services/pettyCashService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import _ from "lodash";
import { useNavigate } from "react-router-dom";

const PettyCashList: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [vouchers, setVouchers] = useState<PettyCashVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<PettyCashVoucher | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isReverseDialogOpen, setIsReverseDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Filters
  // Removed selectedExpenseCategory as it's no longer a direct filter in SP search.
  // Instead, the SP now has filterAccountID. You'll need to decide how to map categories to accounts.
  // For now, I'm removing it to align with the SP, but you might want to reintroduce a way to filter by account.
  const [selectedPostingStatus, setSelectedPostingStatus] = useState<string>("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Fetch all vouchers - now uses PettyCashSearchParams correctly
  const fetchVouchers = useCallback(
    async (search?: string, filters?: PettyCashSearchParams) => {
      try {
        setLoading(true);
        let vouchersData: PettyCashVoucher[] = [];

        const searchParams: PettyCashSearchParams = {
          searchText: search,
          filterPostingStatus: filters?.filterPostingStatus,
          filterFromDate: filters?.filterFromDate,
          filterToDate: filters?.filterToDate,
          filterCompanyID: filters?.filterCompanyID, // Add if you plan to filter by Company
          filterFiscalYearID: filters?.filterFiscalYearID, // Add if you plan to filter by Fiscal Year
          filterAccountID: filters?.filterAccountID, // Add if you plan to filter by Account ID
        };

        if (activeTab === "posted") {
          searchParams.filterPostingStatus = "Posted";
        } else if (activeTab === "unposted") {
          searchParams.filterPostingStatus = "Draft"; // Changed 'Unposted' to 'Draft' to match SP
        } else {
          // For 'all' tab, include all status unless specifically filtered by user
          if (selectedPostingStatus && selectedPostingStatus !== "0") {
            searchParams.filterPostingStatus = selectedPostingStatus;
          } else {
            searchParams.filterPostingStatus = undefined; // Do not send a status filter for 'all' unless user selected one
          }
        }

        // If a specific search term is provided, ensure it's passed regardless of tab
        if (search) {
          searchParams.searchText = search;
        }

        vouchersData = await pettyCashService.searchPettyCashVouchers(searchParams);
        setVouchers(vouchersData);
      } catch (error) {
        console.error("Error fetching petty cash vouchers:", error);
        toast.error("Failed to load petty cash vouchers");
      } finally {
        setLoading(false);
      }
    },
    [activeTab, selectedPostingStatus, fromDate, toDate]
  ); // Added dependencies for useCallback

  // Apply filters
  const applyFilters = useCallback(() => {
    const filters: PettyCashSearchParams = {
      // Removed filterExpenseCategory
      filterPostingStatus: selectedPostingStatus === "0" ? undefined : selectedPostingStatus,
      filterFromDate: fromDate,
      filterToDate: toDate,
      // Add other filters here as needed, e.g., filterCompanyID, filterFiscalYearID, filterAccountID
    };
    fetchVouchers(searchTerm, filters);
  }, [searchTerm, selectedPostingStatus, fromDate, toDate, fetchVouchers]);

  // Debounced search function
  const debouncedSearch = _.debounce((value: string) => {
    setSearchTerm(value); // Update searchTerm immediately
    applyFilters(); // Apply filters which will trigger fetchVouchers
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  // Handle filter changes (trigger applyFilters)
  useEffect(() => {
    applyFilters();
  }, [applyFilters]); // Dependency on applyFilters

  // Navigation handlers
  const handleAddVoucher = () => {
    navigate("/petty-cash/new");
  };

  const handleEditVoucher = (voucherNo: string) => {
    // Changed to voucherNo
    navigate(`/petty-cash/edit/${voucherNo}`);
  };

  const handleViewVoucher = (voucherNo: string) => {
    // Changed to voucherNo
    navigate(`/petty-cash/${voucherNo}`);
  };

  // Delete voucher handlers
  const openDeleteDialog = (voucher: PettyCashVoucher) => {
    setSelectedVoucher(voucher);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedVoucher(null);
  };

  const handleDeleteVoucher = async () => {
    if (!selectedVoucher?.VoucherNo) {
      // Check for VoucherNo
      toast.error("Voucher number is missing for deletion.");
      return;
    }

    try {
      setActionLoading(true);
      const response = await pettyCashService.deletePettyCashVoucher(selectedVoucher.VoucherNo); // Pass VoucherNo

      if (response.Status === 1) {
        setVouchers(vouchers.filter((v) => v.VoucherNo !== selectedVoucher.VoucherNo)); // Filter by VoucherNo
        toast.success("Petty cash voucher deleted successfully");
      } else {
        toast.error(response.Message || "Failed to delete petty cash voucher");
      }
    } catch (error) {
      console.error("Error deleting petty cash voucher:", error);
      toast.error("Failed to delete petty cash voucher");
    } finally {
      setActionLoading(false);
      closeDeleteDialog();
    }
  };

  // Post to GL handlers
  const openPostDialog = (voucher: PettyCashVoucher) => {
    setSelectedVoucher(voucher);
    setIsPostDialogOpen(true);
  };

  const closePostDialog = () => {
    setIsPostDialogOpen(false);
    setSelectedVoucher(null);
  };

  const handlePostToGL = async () => {
    if (!selectedVoucher?.VoucherNo) {
      // Check for VoucherNo
      toast.error("Voucher number is missing for posting.");
      return;
    }

    try {
      setActionLoading(true);
      const response = await pettyCashService.postPettyCashVoucher(selectedVoucher.VoucherNo); // Pass VoucherNo

      if (response.Status === 1) {
        // Update voucher in list
        setVouchers(vouchers.map((v) => (v.VoucherNo === selectedVoucher.VoucherNo ? { ...v, PostingStatus: "Posted" } : v)));
        toast.success("Petty cash voucher posted successfully");
      } else {
        toast.error(response.Message || "Failed to post petty cash voucher");
      }
    } catch (error) {
      console.error("Error posting petty cash voucher:", error);
      toast.error("Failed to post petty cash voucher");
    } finally {
      setActionLoading(false);
      closePostDialog();
    }
  };

  // Reverse voucher handlers
  const openReverseDialog = (voucher: PettyCashVoucher) => {
    setSelectedVoucher(voucher);
    setIsReverseDialogOpen(true);
  };

  const closeReverseDialog = () => {
    setIsReverseDialogOpen(false);
    setSelectedVoucher(null);
  };

  const handleReverseVoucher = async () => {
    if (!selectedVoucher?.VoucherNo) {
      // Check for VoucherNo
      toast.error("Voucher number is missing for reversal.");
      return;
    }

    try {
      setActionLoading(true);
      const response = await pettyCashService.reversePettyCashVoucher({
        VoucherNo: selectedVoucher.VoucherNo, // Pass VoucherNo
        reversalReason: "Reversal requested by user from Petty Cash List", // Provide a more descriptive reason
      });

      if (response.Status === 1) {
        // Refresh the list to show the new reversal entry and updated status
        fetchVouchers(); // Re-fetch all vouchers after a successful reversal
        toast.success("Petty cash voucher reversed successfully");
      } else {
        toast.error(response.Message || "Failed to reverse petty cash voucher");
      }
    } catch (error) {
      console.error("Error reversing petty cash voucher:", error);
      toast.error("Failed to reverse petty cash voucher");
    } finally {
      setActionLoading(false);
      closeReverseDialog();
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

  // Get posting status color
  const getPostingStatusColor = (status?: string) => {
    // Status can be undefined
    switch (status) {
      case "Posted":
        return "default";
      case "Draft": // Assuming 'Unposted' is now 'Draft' based on SP default
        return "secondary";
      case "Reversed":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get posting status icon
  const getPostingStatusIcon = (status?: string) => {
    // Status can be undefined
    switch (status) {
      case "Posted":
        return <CheckCircle className="h-3 w-3" />;
      case "Draft": // Assuming 'Unposted' is now 'Draft' based on SP default
        return <Clock className="h-3 w-3" />;
      case "Reversed":
        return <RefreshCw className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  // Get tab counts
  const getTabCounts = useCallback(() => {
    return {
      all: vouchers.length,
      posted: vouchers.filter((v) => v.PostingStatus === "Posted").length,
      unposted: vouchers.filter((v) => v.PostingStatus === "Draft").length, // Adjusted to 'Draft'
    };
  }, [vouchers]);

  const tabCounts = getTabCounts();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Petty Cash Management</h1>
        <Button onClick={handleAddVoucher}>
          <Plus className="mr-2 h-4 w-4" />
          New Petty Cash Voucher
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Petty Cash Vouchers</CardTitle>
          <CardDescription>Manage petty cash transactions and vouchers</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full mb-6">
              <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
              <TabsTrigger value="posted">Posted ({tabCounts.posted})</TabsTrigger>
              <TabsTrigger value="unposted">Draft ({tabCounts.unposted})</TabsTrigger> {/* Adjusted tab name */}
            </TabsList>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder="Search vouchers..." className="pl-9" onChange={handleSearchChange} />
              </div>

              {/* Removed Expense Category filter, as it's not directly supported by SP's search params */}
              {/* If you need this, you'll have to adjust your SP or fetch all and filter client-side. */}
              {/* <Select value={selectedExpenseCategory} onValueChange={setSelectedExpenseCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Expense Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Categories</SelectItem>
                  <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select> */}

              <Select value={selectedPostingStatus} onValueChange={setSelectedPostingStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Posting Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Statuses</SelectItem>
                  <SelectItem value="Posted">Posted</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem> {/* Changed 'Unposted' to 'Draft' */}
                  <SelectItem value="Reversed">Reversed</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 border-dashed">
                      <Calendar className="mr-2 h-4 w-4" />
                      {fromDate ? formatDate(fromDate) : "From Date"}
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
                      {toDate ? formatDate(toDate) : "To Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePicker value={toDate} onChange={setToDate} placeholder="To Date" disabled={(date) => (fromDate ? date < fromDate : false)} />
                  </PopoverContent>
                </Popover>

                {(fromDate || toDate || selectedPostingStatus !== "0") && ( // Check for selectedPostingStatus value
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFromDate(null);
                      setToDate(null);
                      setSelectedPostingStatus("0"); // Reset to "0" for all statuses
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
              ) : vouchers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {searchTerm || selectedPostingStatus !== "0" || fromDate || toDate
                    ? "No petty cash vouchers found matching your criteria."
                    : "No petty cash vouchers have been created yet."}
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left p-4 font-medium">Voucher #</th>
                          <th className="text-left p-4 font-medium">Transaction Date</th>
                          <th className="text-left p-4 font-medium">Posting Date</th>
                          <th className="text-left p-4 font-medium">Amount</th>
                          {/* Removed Category and Received By columns as they are no longer direct properties of PettyCashVoucher */}
                          {/* <th className="text-left p-4 font-medium">Category</th> */}
                          {/* <th className="text-left p-4 font-medium">Received By</th> */}
                          <th className="text-left p-4 font-medium">Status</th>
                          <th className="text-left p-4 font-medium">Description</th>
                          <th className="text-left p-4 font-medium w-[100px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vouchers.map((voucher, index) => (
                          <tr key={voucher.VoucherNo} className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}>
                            {/* Changed key to VoucherNo */}
                            <td className="p-4">
                              <div className="font-medium">{voucher.VoucherNo}</div>
                              {voucher.ReceiptNo && <div className="text-xs text-muted-foreground">Receipt: {voucher.ReceiptNo}</div>}
                            </td>
                            <td className="p-4">{formatDate(voucher.TransactionDate)}</td>
                            <td className="p-4">{formatDate(voucher.PostingDate)}</td>
                            <td className="p-4">
                              <div className="font-medium">{formatCurrency(voucher.TotalAmount)}</div> {/* Use TotalAmount */}
                              {voucher.CurrencyName && voucher.CurrencyName !== "USD" && <div className="text-xs text-muted-foreground">{voucher.CurrencyName}</div>}
                            </td>
                            {/* Removed Category and Received By display */}
                            {/* <td className="p-4">{voucher.ExpenseCategory || "N/A"}</td> */}
                            {/* <td className="p-4">{voucher.ReceivedBy || "N/A"}</td> */}
                            <td className="p-4">
                              <Badge variant={getPostingStatusColor(voucher.PostingStatus)} className="flex items-center gap-1 w-fit">
                                {getPostingStatusIcon(voucher.PostingStatus)}
                                {voucher.PostingStatus}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="max-w-xs truncate" title={voucher.Description}>
                                {voucher.Description || "N/A"}
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
                                  <DropdownMenuItem onClick={() => handleViewVoucher(voucher.VoucherNo!)}>
                                    {" "}
                                    {/* Pass VoucherNo */}
                                    <Eye className="h-4 w-4 mr-2" />
                                    View details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEditVoucher(voucher.VoucherNo!)}
                                    disabled={voucher.PostingStatus === "Posted" || voucher.PostingStatus === "Reversed"}
                                  >
                                    {" "}
                                    {/* Pass VoucherNo, disable if Reversed */}
                                    Edit
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem onClick={() => openPostDialog(voucher)} disabled={voucher.PostingStatus === "Posted" || voucher.PostingStatus === "Reversed"}>
                                    {" "}
                                    {/* Disable if Reversed */}
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Post to GL
                                  </DropdownMenuItem>

                                  {voucher.PostingStatus === "Posted" && ( // Only show reverse if status is 'Posted'
                                    <DropdownMenuItem onClick={() => openReverseDialog(voucher)}>
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Reverse
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    className="text-red-500"
                                    onClick={() => openDeleteDialog(voucher)}
                                    disabled={voucher.PostingStatus === "Posted" || voucher.PostingStatus === "Reversed"}
                                  >
                                    {" "}
                                    {/* Disable if Posted or Reversed */}
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
        onConfirm={handleDeleteVoucher}
        title="Delete Petty Cash Voucher"
        description={
          selectedVoucher
            ? `Are you sure you want to delete voucher "${selectedVoucher.VoucherNo}"? This action cannot be undone.`
            : "Are you sure you want to delete this petty cash voucher?"
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
        title="Post Petty Cash Voucher to GL"
        description={
          selectedVoucher
            ? `Are you sure you want to post voucher "${selectedVoucher.VoucherNo}" to the General Ledger? This action cannot be undone.`
            : "Are you sure you want to post this petty cash voucher to GL?"
        }
        cancelText="Cancel"
        confirmText="Post to GL"
        type="warning"
        loading={actionLoading}
      />

      {/* Reverse Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isReverseDialogOpen}
        onClose={closeReverseDialog}
        onConfirm={handleReverseVoucher}
        title="Reverse Petty Cash Voucher"
        description={
          selectedVoucher
            ? `Are you sure you want to reverse voucher "${selectedVoucher.VoucherNo}"? This will create a reversal entry.`
            : "Are you sure you want to reverse this petty cash voucher?"
        }
        cancelText="Cancel"
        confirmText="Reverse"
        type="warning"
        loading={actionLoading}
      />
    </div>
  );
};

export default PettyCashList;
