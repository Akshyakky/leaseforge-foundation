import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Plus, Calendar, FileText, CheckCircle, XCircle, BarChart3, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { paymentTermsService } from "@/services/paymentTermsService";
import { PaymentTermsStatistics } from "@/types/paymentTermsTypes";
import type { PaymentTerms } from "@/types/paymentTermsTypes";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PaymentTerms = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentTerm, setSelectedPaymentTerm] = useState<PaymentTerms | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [statistics, setStatistics] = useState<PaymentTermsStatistics | null>(null);
  const [activeTab, setActiveTab] = useState("list");

  // Fetch payment terms on component mount
  useEffect(() => {
    fetchPaymentTerms();
    fetchStatistics();
  }, []);

  // Fetch all payment terms
  const fetchPaymentTerms = async (search?: string, isActive?: boolean) => {
    try {
      setLoading(true);
      let termsData: PaymentTerms[];

      if (search || isActive !== undefined) {
        // If search term or filter is provided, use search endpoint
        termsData = await paymentTermsService.searchPaymentTerms({
          searchText: search || "",
          isActive: isActive,
        });
      } else {
        // Otherwise fetch all payment terms
        termsData = await paymentTermsService.getAllPaymentTerms();
      }

      setPaymentTerms(termsData);
    } catch (error) {
      console.error("Error fetching payment terms:", error);
      toast.error("Failed to load payment terms");
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics for dashboard
  const fetchStatistics = async () => {
    try {
      const stats = await paymentTermsService.getPaymentTermsStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      const isActiveFilter = activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined;
      fetchPaymentTerms(value, isActiveFilter);
    }
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
    const isActive = value === "active" ? true : value === "inactive" ? false : undefined;
    fetchPaymentTerms(searchTerm, isActive);
  };

  // Navigation handlers
  const handleAddPaymentTerm = () => {
    navigate("/payment-terms/new");
  };

  const handleEditPaymentTerm = (paymentTermId: number) => {
    navigate(`/payment-terms/edit/${paymentTermId}`);
  };

  const handleViewPaymentTerm = (paymentTermId: number) => {
    navigate(`/payment-terms/${paymentTermId}`);
  };

  // Status toggle handler
  const handleToggleStatus = async (paymentTerm: PaymentTerms) => {
    try {
      const result = await paymentTermsService.togglePaymentTermStatus(paymentTerm.PaymentTermID, !paymentTerm.IsActive);

      if (result.success) {
        toast.success(result.message);
        // Update local state
        setPaymentTerms((prev) => prev.map((term) => (term.PaymentTermID === paymentTerm.PaymentTermID ? { ...term, IsActive: !term.IsActive } : term)));
        // Refresh statistics
        fetchStatistics();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error toggling payment term status:", error);
      toast.error("Failed to update payment term status");
    }
  };

  // Delete confirmation handlers
  const openDeleteDialog = (paymentTerm: PaymentTerms) => {
    setSelectedPaymentTerm(paymentTerm);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedPaymentTerm(null);
  };

  const handleDeletePaymentTerm = async () => {
    if (!selectedPaymentTerm) return;

    try {
      const result = await paymentTermsService.deletePaymentTerm(selectedPaymentTerm.PaymentTermID);

      if (result.success) {
        setPaymentTerms((prev) => prev.filter((term) => term.PaymentTermID !== selectedPaymentTerm.PaymentTermID));
        toast.success(result.message);
        fetchStatistics(); // Refresh statistics
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting payment term:", error);
      toast.error("Failed to delete payment term");
    } finally {
      closeDeleteDialog();
    }
  };

  // Duplicate handler
  const handleDuplicatePaymentTerm = async (paymentTerm: PaymentTerms) => {
    try {
      const newTermCode = `${paymentTerm.TermCode}_COPY`;
      const newTermName = `${paymentTerm.TermName} (Copy)`;

      const result = await paymentTermsService.duplicatePaymentTerm(paymentTerm.PaymentTermID, newTermCode, newTermName);

      if (result.success) {
        toast.success("Payment term duplicated successfully");
        fetchPaymentTerms(); // Refresh the list
        fetchStatistics(); // Refresh statistics
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error duplicating payment term:", error);
      toast.error("Failed to duplicate payment term");
    }
  };

  // Render status badge
  const renderStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-50 text-green-700" : ""}>
        {isActive ? (
          <>
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </>
        ) : (
          <>
            <XCircle className="mr-1 h-3 w-3" />
            Inactive
          </>
        )}
      </Badge>
    );
  };

  // Render days count with formatting
  const renderDaysCount = (daysCount?: number) => {
    if (daysCount === undefined || daysCount === null) {
      return <span className="text-muted-foreground">No specific days</span>;
    }

    if (daysCount === 0) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          <Calendar className="mr-1 h-3 w-3" />
          Immediate
        </Badge>
      );
    }

    let badgeClass = "bg-gray-50 text-gray-700";
    if (daysCount <= 7) badgeClass = "bg-green-50 text-green-700";
    else if (daysCount <= 30) badgeClass = "bg-yellow-50 text-yellow-700";
    else if (daysCount <= 60) badgeClass = "bg-orange-50 text-orange-700";
    else badgeClass = "bg-red-50 text-red-700";

    return (
      <Badge variant="outline" className={badgeClass}>
        <Calendar className="mr-1 h-3 w-3" />
        {daysCount} {daysCount === 1 ? "day" : "days"}
      </Badge>
    );
  };

  // Filter payment terms based on current filter
  const getFilteredPaymentTerms = () => {
    if (activeFilter === "all") return paymentTerms;
    if (activeFilter === "active") return paymentTerms.filter((term) => term.IsActive);
    if (activeFilter === "inactive") return paymentTerms.filter((term) => !term.IsActive);
    return paymentTerms;
  };

  const filteredPaymentTerms = getFilteredPaymentTerms();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Payment Terms</h1>
        <Button onClick={handleAddPaymentTerm}>
          <Plus className="mr-2 h-4 w-4" />
          Add Payment Term
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Payment Terms List</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Payment Terms Management</CardTitle>
              <CardDescription>Manage payment terms and conditions for your business</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-6 gap-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="text" placeholder="Search payment terms..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={activeFilter} onValueChange={handleFilterChange}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Total Terms</span>
                    </div>
                    <div className="text-2xl font-bold">{statistics?.TotalTerms || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Active Terms</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{statistics?.ActiveTerms || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-muted-foreground">Avg Days</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{statistics?.AverageDaysCount?.toFixed(0) || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-muted-foreground">Recent</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{statistics?.RecentlyCreated || 0}</div>
                  </CardContent>
                </Card>
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredPaymentTerms.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {searchTerm || activeFilter !== "all" ? "No payment terms found matching your criteria." : "No payment terms found."}
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Term Code</TableHead>
                        <TableHead>Term Name</TableHead>
                        <TableHead>Days Count</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPaymentTerms.map((term) => (
                        <TableRow key={term.PaymentTermID}>
                          <TableCell>
                            <div className="font-medium">{term.TermCode}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{term.TermName}</div>
                          </TableCell>
                          <TableCell>{renderDaysCount(term.DaysCount)}</TableCell>
                          <TableCell>
                            <div className="max-w-[300px] truncate">{term.Description || <span className="text-muted-foreground">No description</span>}</div>
                          </TableCell>
                          <TableCell>{renderStatusBadge(term.IsActive)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {term.CreatedBy && <div>{term.CreatedBy}</div>}
                              {term.CreatedOn && <div className="text-muted-foreground">{new Date(term.CreatedOn).toLocaleDateString()}</div>}
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
                                <DropdownMenuItem onClick={() => handleViewPaymentTerm(term.PaymentTermID)}>View details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditPaymentTerm(term.PaymentTermID)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicatePaymentTerm(term)}>Duplicate</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleStatus(term)}>{term.IsActive ? "Deactivate" : "Activate"}</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(term)}>
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
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Payment Terms Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Payment Terms</span>
                    <span className="font-bold">{statistics?.TotalTerms || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Terms</span>
                    <span className="font-bold text-green-600">{statistics?.ActiveTerms || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Inactive Terms</span>
                    <span className="font-bold text-red-600">{statistics?.InactiveTerms || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Terms with Days Specified</span>
                    <span className="font-bold">{statistics?.TermsWithDays || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Days Count</span>
                    <span className="font-bold">{statistics?.AverageDaysCount?.toFixed(1) || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Recently Created (30 days)</span>
                    <span className="font-bold text-blue-600">{statistics?.RecentlyCreated || 0}</span>
                  </div>
                  {statistics?.MostUsedTerm && (
                    <div className="p-3 border rounded-md bg-muted/20">
                      <div className="font-medium">Most Used Term</div>
                      <div className="text-sm text-muted-foreground">
                        {statistics.MostUsedTerm.TermName} ({statistics.MostUsedTerm.TermCode})
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeletePaymentTerm}
        title="Delete Payment Term"
        description={
          selectedPaymentTerm
            ? `Are you sure you want to delete the payment term "${selectedPaymentTerm.TermName}" (${selectedPaymentTerm.TermCode})? This action cannot be undone.`
            : "Are you sure you want to delete this payment term?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default PaymentTerms;
