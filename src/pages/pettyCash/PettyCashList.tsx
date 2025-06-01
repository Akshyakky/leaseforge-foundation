import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Plus, Receipt, FileText, CheckCircle, Clock, XCircle, Eye, Edit, Trash2, Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { pettyCashService } from "@/services/pettyCashService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { PettyCashVoucher, VoucherStatus, PettyCashSearchFilters } from "@/types/pettyCashTypes";
import { Company } from "@/services/companyService";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { debounce } from "lodash";
import { toast } from "sonner";
import { format } from "date-fns";

const PettyCashList = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [vouchers, setVouchers] = useState<PettyCashVoucher[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<PettyCashVoucher | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filter states
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Fetch data on component mount
  useEffect(() => {
    fetchVouchers();
    fetchReferenceData();
  }, []);

  // Fetch reference data
  const fetchReferenceData = async () => {
    try {
      const [companiesData, fiscalYearsData] = await Promise.all([
        companyService.getCompaniesForDropdown(true),
        fiscalYearService.getFiscalYearsForDropdown({ filterIsActive: true }),
      ]);

      setCompanies(companiesData);
      setFiscalYears(fiscalYearsData);
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Failed to load reference data");
    }
  };

  // Fetch vouchers with filters
  const fetchVouchers = async (filters?: PettyCashSearchFilters) => {
    try {
      setLoading(true);
      let vouchersData: PettyCashVoucher[];

      if (filters) {
        vouchersData = await pettyCashService.searchVouchers(filters);
      } else {
        vouchersData = await pettyCashService.getAllVouchers();
      }

      setVouchers(vouchersData);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      toast.error("Failed to load petty cash vouchers");
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
    const filters: PettyCashSearchFilters = {
      searchText: searchTerm || undefined,
      companyId: selectedCompanyId ? parseInt(selectedCompanyId) : undefined,
      fiscalYearId: selectedFiscalYearId ? parseInt(selectedFiscalYearId) : undefined,
      status: (selectedStatus as VoucherStatus) || undefined,
      dateFrom: dateFrom,
      dateTo: dateTo,
    };

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key as keyof PettyCashSearchFilters] === undefined) {
        delete filters[key as keyof PettyCashSearchFilters];
      }
    });

    fetchVouchers(filters);
  };

  // Handle filter dropdown changes
  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value === "all" ? "" : value);
    setTimeout(handleFilterChange, 100);
  };

  const handleFiscalYearChange = (value: string) => {
    setSelectedFiscalYearId(value === "all" ? "" : value);
    setTimeout(handleFilterChange, 100);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value === "all" ? "" : value);
    setTimeout(handleFilterChange, 100);
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    setTimeout(handleFilterChange, 100);
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    setTimeout(handleFilterChange, 100);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCompanyId("");
    setSelectedFiscalYearId("");
    setSelectedStatus("");
    setDateFrom(undefined);
    setDateTo(undefined);
    fetchVouchers();
  };

  // Navigation handlers
  const handleAddVoucher = () => {
    navigate("/petty-cash/new");
  };

  const handleEditVoucher = (voucher: PettyCashVoucher) => {
    navigate(`/petty-cash/edit/${voucher.VoucherNo}`);
  };

  const handleViewVoucher = (voucher: PettyCashVoucher) => {
    navigate(`/petty-cash/${voucher.VoucherNo}`);
  };

  // Delete confirmation handlers
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
      const result = await pettyCashService.deleteVoucher(selectedVoucher.VoucherNo, selectedVoucher.CompanyID);

      if (result.success) {
        setVouchers(vouchers.filter((v) => v.VoucherNo !== selectedVoucher.VoucherNo));
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting voucher:", error);
      toast.error("Failed to delete voucher");
    } finally {
      closeDeleteDialog();
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: { variant: "secondary" as const, icon: FileText, className: "bg-gray-100 text-gray-800" },
      Pending: { variant: "default" as const, icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      Posted: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" },
      Rejected: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800" },
      Reversed: { variant: "secondary" as const, icon: XCircle, className: "bg-purple-100 text-purple-800" },
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

  // Format currency
  const formatCurrency = (amount: number | undefined, currencyCode?: string) => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD", // ||currencyCode
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate summary statistics
  const stats = {
    total: vouchers.length,
    draft: vouchers.filter((v) => v.PostingStatus === "Draft").length,
    pending: vouchers.filter((v) => v.PostingStatus === "Pending").length,
    posted: vouchers.filter((v) => v.PostingStatus === "Posted").length,
    totalAmount: vouchers.reduce((sum, v) => sum + (v.TotalDebit || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Petty Cash Management</h1>
          <p className="text-muted-foreground">Manage petty cash vouchers and expenses</p>
        </div>
        <Button onClick={handleAddVoucher}>
          <Plus className="mr-2 h-4 w-4" />
          New Voucher
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Petty Cash Vouchers</CardTitle>
          <CardDescription>View and manage all petty cash vouchers</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Vouchers</span>
                </div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-muted-foreground">Draft</span>
                </div>
                <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
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
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                </div>
                <div className="text-lg font-bold text-blue-600">{formatCurrency(stats.totalAmount)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search vouchers..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedCompanyId || "all"} onValueChange={handleCompanyChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.CompanyID} value={company.CompanyID.toString()}>
                      {company.CompanyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedFiscalYearId || "all"} onValueChange={handleFiscalYearChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Fiscal year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {fiscalYears.map((fy) => (
                    <SelectItem key={fy.FiscalYearID} value={fy.FiscalYearID.toString()}>
                      {fy.FYDescription}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus || "all"} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Posted">Posted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Reversed">Reversed</SelectItem>
                </SelectContent>
              </Select>

              <DatePicker value={dateFrom} onChange={handleDateFromChange} placeholder="From date" />

              <DatePicker value={dateTo} onChange={handleDateToChange} placeholder="To date" />

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Vouchers Table */}
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedCompanyId || selectedFiscalYearId || selectedStatus || dateFrom || dateTo
                ? "No vouchers found matching your criteria."
                : "No petty cash vouchers found. Create your first voucher to get started."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Voucher No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.map((voucher) => (
                    <TableRow key={voucher.VoucherNo}>
                      <TableCell>
                        <div className="font-medium">{voucher.VoucherNo}</div>
                        <div className="text-sm text-muted-foreground">{voucher.VoucherType}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(voucher.TransactionDate), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{voucher.CompanyName || `Company ${voucher.CompanyID}`}</div>
                        <div className="text-sm text-muted-foreground">{voucher.FYDescription}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">{voucher.Description || voucher.Narration || "—"}</div>
                        {voucher.PaidTo && <div className="text-sm text-muted-foreground">Paid to: {voucher.PaidTo}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(voucher.TotalDebit, voucher.CurrencyName)}</div>
                        <div className="text-sm text-muted-foreground">{voucher.CurrencyName}</div>
                      </TableCell>
                      <TableCell>{renderStatusBadge(voucher.PostingStatus || "Draft")}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {voucher.CreatedBy && <div>{voucher.CreatedBy}</div>}
                          {voucher.CreatedOn && <div className="text-muted-foreground">{format(new Date(voucher.CreatedOn), "MMM dd, yyyy")}</div>}
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
                            <DropdownMenuItem onClick={() => handleViewVoucher(voucher)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View details
                            </DropdownMenuItem>
                            {(voucher.PostingStatus === "Draft" || voucher.PostingStatus === "Pending") && (
                              <DropdownMenuItem onClick={() => handleEditVoucher(voucher)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {(voucher.PostingStatus === "Draft" || voucher.PostingStatus === "Pending") && (
                              <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(voucher)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
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

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteVoucher}
        title="Delete Petty Cash Voucher"
        description={
          selectedVoucher
            ? `Are you sure you want to delete voucher "${selectedVoucher.VoucherNo}"? This action cannot be undone.`
            : "Are you sure you want to delete this voucher?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default PettyCashList;
