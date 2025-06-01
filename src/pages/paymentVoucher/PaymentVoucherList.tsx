import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Plus, Receipt, FileText, CheckCircle, Clock, XCircle, Eye, Edit, Trash2, Calendar, CreditCard, Building } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { paymentVoucherService } from "@/services/paymentVoucherService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { supplierService } from "@/services/supplierService";
import { PaymentVoucher, PaymentStatus, PaymentType, PaymentSearchFilters } from "@/types/paymentVoucherTypes";
import { Company } from "@/services/companyService";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Supplier } from "@/types/supplierTypes";
import { debounce } from "lodash";
import { toast } from "sonner";
import { format } from "date-fns";

const PaymentVoucherList = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [suppliers, setSuppliers] = useState<Pick<Supplier, "SupplierID" | "SupplierNo" | "SupplierName">[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<PaymentVoucher | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filter states
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>("");
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
      const [companiesData, fiscalYearsData, suppliersData] = await Promise.all([
        companyService.getCompaniesForDropdown(true),
        fiscalYearService.getFiscalYearsForDropdown({ filterIsActive: true }),
        supplierService.getSuppliersForDropdown(true),
      ]);

      setCompanies(companiesData);
      setFiscalYears(fiscalYearsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Failed to load reference data");
    }
  };

  // Fetch vouchers with filters
  const fetchVouchers = async (filters?: PaymentSearchFilters) => {
    try {
      setLoading(true);
      let vouchersData: PaymentVoucher[];

      if (filters) {
        vouchersData = await paymentVoucherService.searchPaymentVouchers(filters);
      } else {
        vouchersData = await paymentVoucherService.getAllPaymentVouchers();
      }

      setVouchers(vouchersData);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      toast.error("Failed to load payment vouchers");
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
    const filters: PaymentSearchFilters = {
      searchText: searchTerm || undefined,
      companyId: selectedCompanyId ? parseInt(selectedCompanyId) : undefined,
      fiscalYearId: selectedFiscalYearId ? parseInt(selectedFiscalYearId) : undefined,
      status: (selectedStatus as PaymentStatus) || undefined,
      supplierId: selectedSupplierId ? parseInt(selectedSupplierId) : undefined,
      paymentType: (selectedPaymentType as PaymentType) || undefined,
      dateFrom: dateFrom,
      dateTo: dateTo,
    };

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key as keyof PaymentSearchFilters] === undefined) {
        delete filters[key as keyof PaymentSearchFilters];
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

  const handleSupplierChange = (value: string) => {
    setSelectedSupplierId(value === "all" ? "" : value);
    setTimeout(handleFilterChange, 100);
  };

  const handlePaymentTypeChange = (value: string) => {
    setSelectedPaymentType(value === "all" ? "" : value);
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
    setSelectedSupplierId("");
    setSelectedPaymentType("");
    setDateFrom(undefined);
    setDateTo(undefined);
    fetchVouchers();
  };

  // Navigation handlers
  const handleAddVoucher = () => {
    navigate("/payment-vouchers/new");
  };

  const handleEditVoucher = (voucher: PaymentVoucher) => {
    navigate(`/payment-vouchers/edit/${voucher.VoucherNo}`);
  };

  const handleViewVoucher = (voucher: PaymentVoucher) => {
    navigate(`/payment-vouchers/${voucher.VoucherNo}`);
  };

  // Delete confirmation handlers
  const openDeleteDialog = (voucher: PaymentVoucher) => {
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
      const result = await paymentVoucherService.deletePaymentVoucher(selectedVoucher.VoucherNo, selectedVoucher.CompanyID);

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
      Paid: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" },
      Rejected: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800" },
      Cancelled: { variant: "secondary" as const, icon: XCircle, className: "bg-orange-100 text-orange-800" },
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

  // Render payment type badge
  const renderPaymentTypeBadge = (paymentType: string) => {
    const paymentTypeConfig = {
      Cash: { icon: Receipt, className: "bg-green-100 text-green-800" },
      Cheque: { icon: FileText, className: "bg-blue-100 text-blue-800" },
      "Bank Transfer": { icon: Building, className: "bg-purple-100 text-purple-800" },
      Online: { icon: CreditCard, className: "bg-orange-100 text-orange-800" },
      "Wire Transfer": { icon: Building, className: "bg-indigo-100 text-indigo-800" },
      "Credit Card": { icon: CreditCard, className: "bg-red-100 text-red-800" },
      "Debit Card": { icon: CreditCard, className: "bg-teal-100 text-teal-800" },
    };

    const config = paymentTypeConfig[paymentType as keyof typeof paymentTypeConfig] || paymentTypeConfig.Cash;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {paymentType}
      </Badge>
    );
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

  // Calculate summary statistics
  const stats = {
    total: vouchers.length,
    draft: vouchers.filter((v) => v.PaymentStatus === "Draft").length,
    pending: vouchers.filter((v) => v.PaymentStatus === "Pending").length,
    paid: vouchers.filter((v) => v.PaymentStatus === "Paid").length,
    totalAmount: vouchers.reduce((sum, v) => sum + (v.TotalAmount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Payment Voucher Management</h1>
          <p className="text-muted-foreground">Manage payment vouchers and supplier payments</p>
        </div>
        <Button onClick={handleAddVoucher}>
          <Plus className="mr-2 h-4 w-4" />
          New Payment Voucher
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Payment Vouchers</CardTitle>
          <CardDescription>View and manage all payment vouchers</CardDescription>
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
                  <span className="text-sm text-muted-foreground">Paid</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
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
          <div className="flex flex-col gap-4 mb-6">
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
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Reversed">Reversed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedSupplierId || "all"} onValueChange={handleSupplierChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.SupplierID} value={supplier.SupplierID.toString()}>
                      {supplier.SupplierName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPaymentType || "all"} onValueChange={handlePaymentTypeChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Payment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {paymentVoucherService.getPaymentTypes().map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
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
              {searchTerm || selectedCompanyId || selectedFiscalYearId || selectedStatus || selectedSupplierId || selectedPaymentType || dateFrom || dateTo
                ? "No vouchers found matching your criteria."
                : "No payment vouchers found. Create your first voucher to get started."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Voucher No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Payment Type</TableHead>
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
                        <div>{voucher.SupplierName || voucher.PaidTo || "—"}</div>
                        {voucher.RefNo && <div className="text-sm text-muted-foreground">Ref: {voucher.RefNo}</div>}
                      </TableCell>
                      <TableCell>
                        {renderPaymentTypeBadge(voucher.PaymentType)}
                        {voucher.ChequeNo && <div className="text-sm text-muted-foreground mt-1">Cheque: {voucher.ChequeNo}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(voucher.TotalAmount, voucher.CurrencyName)}</div>
                        <div className="text-sm text-muted-foreground">{voucher.CurrencyName}</div>
                      </TableCell>
                      <TableCell>{renderStatusBadge(voucher.PaymentStatus || "Draft")}</TableCell>
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
                            {(voucher.PaymentStatus === "Draft" || voucher.PaymentStatus === "Pending") && (
                              <DropdownMenuItem onClick={() => handleEditVoucher(voucher)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {(voucher.PaymentStatus === "Draft" || voucher.PaymentStatus === "Pending") && (
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
        title="Delete Payment Voucher"
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

export default PaymentVoucherList;
