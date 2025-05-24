// src/pages/pettyCash/PettyCashList.tsx
import React, { useState, useEffect } from "react";
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
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<string>("");
  const [selectedPostingStatus, setSelectedPostingStatus] = useState<string>("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchVouchers();
  }, []);

  // Fetch all vouchers
  const fetchVouchers = async (search?: string, filters?: PettyCashSearchParams) => {
    try {
      setLoading(true);
      let vouchersData: PettyCashVoucher[] = [];

      if (activeTab === "posted") {
        vouchersData = await pettyCashService.searchPettyCashVouchers({ filterPostingStatus: "Posted" });
      } else if (activeTab === "unposted") {
        vouchersData = await pettyCashService.searchPettyCashVouchers({ filterPostingStatus: "Unposted" });
      } else {
        vouchersData = await pettyCashService.searchPettyCashVouchers({
          searchText: search,
          filterExpenseCategory: filters?.filterExpenseCategory,
          filterPostingStatus: filters?.filterPostingStatus,
          filterFromDate: filters?.filterFromDate,
          filterToDate: filters?.filterToDate,
        });
      }

      setVouchers(vouchersData);
    } catch (error) {
      console.error("Error fetching petty cash vouchers:", error);
      toast.error("Failed to load petty cash vouchers");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    const filters: PettyCashSearchParams = {
      filterExpenseCategory: selectedExpenseCategory || undefined,
      filterPostingStatus: selectedPostingStatus || undefined,
      filterFromDate: fromDate,
      filterToDate: toDate,
    };
    fetchVouchers(searchTerm, filters);
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
  }, [selectedExpenseCategory, selectedPostingStatus, fromDate, toDate, activeTab]);

  // Navigation handlers
  const handleAddVoucher = () => {
    navigate("/petty-cash/new");
  };

  const handleEditVoucher = (postingId: number) => {
    navigate(`/petty-cash/edit/${postingId}`);
  };

  const handleViewVoucher = (postingId: number) => {
    navigate(`/petty-cash/${postingId}`);
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
    if (!selectedVoucher) return;

    try {
      setActionLoading(true);
      const response = await pettyCashService.deletePettyCashVoucher(selectedVoucher.PostingID);

      if (response.Status === 1) {
        setVouchers(vouchers.filter((v) => v.PostingID !== selectedVoucher.PostingID));
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
    if (!selectedVoucher) return;

    try {
      setActionLoading(true);
      const response = await pettyCashService.postPettyCashVoucher(selectedVoucher.PostingID);

      if (response.Status === 1) {
        // Update voucher in list
        setVouchers(vouchers.map((v) => (v.PostingID === selectedVoucher.PostingID ? { ...v, PostingStatus: "Posted" } : v)));
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
    if (!selectedVoucher) return;

    try {
      setActionLoading(true);
      const response = await pettyCashService.reversePettyCashVoucher({
        PostingID: selectedVoucher.PostingID,
        reversalReason: "Reversal requested",
      });

      if (response.Status === 1) {
        // Refresh the list
        fetchVouchers();
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
  const getPostingStatusColor = (status: string) => {
    switch (status) {
      case "Posted":
        return "default";
      case "Unposted":
        return "secondary";
      case "Reversed":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get posting status icon
  const getPostingStatusIcon = (status: string) => {
    switch (status) {
      case "Posted":
        return <CheckCircle className="h-3 w-3" />;
      case "Unposted":
        return <Clock className="h-3 w-3" />;
      case "Reversed":
        return <RefreshCw className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  // Get tab counts
  const getTabCounts = () => {
    return {
      all: vouchers.length,
      posted: vouchers.filter((v) => v.PostingStatus === "Posted").length,
      unposted: vouchers.filter((v) => v.PostingStatus === "Unposted").length,
    };
  };

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
              <TabsTrigger value="unposted">Unposted ({tabCounts.unposted})</TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder="Search vouchers..." className="pl-9" onChange={handleSearchChange} />
              </div>

              <Select value={selectedExpenseCategory} onValueChange={setSelectedExpenseCategory}>
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
              </Select>

              <Select value={selectedPostingStatus} onValueChange={setSelectedPostingStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Posting Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Statuses</SelectItem>
                  <SelectItem value="Posted">Posted</SelectItem>
                  <SelectItem value="Unposted">Unposted</SelectItem>
                  <SelectItem value="Reversed">Reversed</SelectItem>
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

                {(fromDate || toDate || selectedExpenseCategory || selectedPostingStatus) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFromDate(null);
                      setToDate(null);
                      setSelectedExpenseCategory("");
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
              ) : vouchers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {searchTerm || selectedExpenseCategory || selectedPostingStatus || fromDate || toDate
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
                          <th className="text-left p-4 font-medium">Category</th>
                          <th className="text-left p-4 font-medium">Received By</th>
                          <th className="text-left p-4 font-medium">Status</th>
                          <th className="text-left p-4 font-medium">Description</th>
                          <th className="text-left p-4 font-medium w-[100px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vouchers.map((voucher, index) => (
                          <tr key={voucher.PostingID} className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}>
                            <td className="p-4">
                              <div className="font-medium">{voucher.VoucherNo}</div>
                              {voucher.ReceiptNo && <div className="text-xs text-muted-foreground">Receipt: {voucher.ReceiptNo}</div>}
                            </td>
                            <td className="p-4">{formatDate(voucher.TransactionDate)}</td>
                            <td className="p-4">{formatDate(voucher.PostingDate)}</td>
                            <td className="p-4">
                              <div className="font-medium">{formatCurrency(voucher.Amount)}</div>
                              {voucher.CurrencyName && voucher.CurrencyName !== "USD" && <div className="text-xs text-muted-foreground">{voucher.CurrencyName}</div>}
                            </td>
                            <td className="p-4">{voucher.ExpenseCategory || "N/A"}</td>
                            <td className="p-4">{voucher.ReceivedBy || "N/A"}</td>
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
                                  <DropdownMenuItem onClick={() => handleViewVoucher(voucher.PostingID)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditVoucher(voucher.PostingID)} disabled={voucher.PostingStatus === "Posted"}>
                                    Edit
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem onClick={() => openPostDialog(voucher)} disabled={voucher.PostingStatus === "Posted"}>
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Post to GL
                                  </DropdownMenuItem>

                                  {voucher.PostingStatus === "Posted" && (
                                    <DropdownMenuItem onClick={() => openReverseDialog(voucher)}>
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Reverse
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(voucher)} disabled={voucher.PostingStatus === "Posted"}>
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
