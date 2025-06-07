import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Plus, FileText, Calendar, Building, DollarSign, Users, TrendingUp, Eye, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { contractService } from "@/services/leaseContractService";
import { customerService } from "@/services/customerService";
import { Contract, ContractSearchParams, ContractSummaryReport, ContractStatus } from "@/types/leaseContractTypes";
import { debounce } from "lodash";
import { toast } from "sonner";
import { format } from "date-fns";
import { Customer } from "@/types/customerTypes";

const LeaseContractList = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [summaryReport, setSummaryReport] = useState<ContractSummaryReport | null>(null);

  // Filter states
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("");
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);

  // Fetch data on component mount
  useEffect(() => {
    fetchContracts();
    fetchCustomers();
    fetchSummaryReport();
  }, []);

  // Fetch customers for filter dropdown
  const fetchCustomers = async () => {
    try {
      const customersData = await customerService.getAllCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  // Fetch summary report
  const fetchSummaryReport = async () => {
    try {
      const report = await contractService.getContractSummaryReport();
      setSummaryReport(report);
    } catch (error) {
      console.error("Error fetching summary report:", error);
    }
  };

  // Fetch contracts with filters
  const fetchContracts = async (searchParams?: ContractSearchParams) => {
    try {
      setLoading(true);
      const params: ContractSearchParams = {
        pageNumber: currentPage,
        pageSize,
        searchText: searchTerm || undefined,
        statusFilter: selectedStatusFilter || undefined,
        customerFilter: selectedCustomerFilter ? parseInt(selectedCustomerFilter) : undefined,
        dateFrom: dateFrom,
        dateTo: dateTo,
        ...searchParams,
      };

      // Remove undefined values
      Object.keys(params).forEach((key) => {
        if (params[key as keyof ContractSearchParams] === undefined) {
          delete params[key as keyof ContractSearchParams];
        }
      });

      const result = await contractService.getAllContracts(params);
      setContracts(result.contracts);
      setTotalRecords(result.totalRecords);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      setCurrentPage(1);
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
    setCurrentPage(1);
    fetchContracts();
  };

  // Handle filter dropdown changes
  const handleStatusChange = (value: string) => {
    setSelectedStatusFilter(value === "all" ? "" : value);
    setTimeout(handleFilterChange, 100);
  };

  const handleCustomerChange = (value: string) => {
    setSelectedCustomerFilter(value === "all" ? "" : value);
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
    setSelectedStatusFilter("");
    setSelectedCustomerFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(1);
    fetchContracts();
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchContracts({ pageNumber: page });
  };

  // Navigation handlers
  const handleAddContract = () => {
    navigate("/contracts/new");
  };

  const handleEditContract = (contract: Contract) => {
    navigate(`/contracts/edit/${contract.ContractID}`);
  };

  const handleViewContract = (contract: Contract) => {
    navigate(`/contracts/${contract.ContractID}`);
  };

  // Delete confirmation handlers
  const openDeleteDialog = (contract: Contract) => {
    setSelectedContract(contract);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedContract(null);
  };

  const handleDeleteContract = async () => {
    if (!selectedContract) return;

    try {
      const result = await contractService.deleteContract(selectedContract.ContractID);

      if (result.success) {
        setContracts(contracts.filter((c) => c.ContractID !== selectedContract.ContractID));
        setTotalRecords((prev) => prev - 1);
        toast.success(result.message);
        fetchSummaryReport(); // Refresh summary
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast.error("Failed to delete contract");
    } finally {
      closeDeleteDialog();
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      [ContractStatus.DRAFT]: { className: "bg-gray-100 text-gray-800" },
      [ContractStatus.ACTIVE]: { className: "bg-green-100 text-green-800" },
      [ContractStatus.APPROVED]: { className: "bg-blue-100 text-blue-800" },
      [ContractStatus.EXPIRED]: { className: "bg-red-100 text-red-800" },
      [ContractStatus.TERMINATED]: { className: "bg-orange-100 text-orange-800" },
      [ContractStatus.CANCELLED]: { className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[ContractStatus.DRAFT];

    return (
      <Badge variant="outline" className={config.className}>
        {status}
      </Badge>
    );
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return contractService.formatAmount(amount);
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  // Calculate pagination info
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Lease Contract Management</h1>
          <p className="text-muted-foreground">Manage lease contracts and rental agreements</p>
        </div>
        <Button onClick={handleAddContract}>
          <Plus className="mr-2 h-4 w-4" />
          New Contract
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Lease Contracts</CardTitle>
          <CardDescription>View and manage all lease contracts</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Statistics */}
          {summaryReport && (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Contracts</span>
                  </div>
                  <div className="text-2xl font-bold">{summaryReport.TotalContracts}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">Active</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{summaryReport.ActiveContracts}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-muted-foreground">Draft</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-600">{summaryReport.DraftContracts}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-muted-foreground">Expired</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{summaryReport.ExpiredContracts}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-muted-foreground">Total Value</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600">{formatCurrency(summaryReport.TotalContractValue)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-muted-foreground">Average Value</span>
                  </div>
                  <div className="text-lg font-bold text-purple-600">{formatCurrency(summaryReport.AverageContractValue)}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search contracts..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedStatusFilter || "all"} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {contractService.getContractStatuses().map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCustomerFilter || "all"} onValueChange={handleCustomerChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.CustomerID} value={customer.CustomerID.toString()}>
                      {customer.CustomerFullName}
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

          {/* Contracts Table */}
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedStatusFilter || selectedCustomerFilter || dateFrom || dateTo
                ? "No contracts found matching your criteria."
                : "No lease contracts found. Create your first contract to get started."}
            </div>
          ) : (
            <>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Contract No</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Transaction Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Grand Total</TableHead>
                      <TableHead>Units/Charges</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.ContractID}>
                        <TableCell>
                          <div className="font-medium">{contract.ContractNo}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{contract.CustomerFullName}</div>
                            {contract.CustomerNo && <div className="text-sm text-muted-foreground">{contract.CustomerNo}</div>}
                            {contract.JointCustomerName && <div className="text-sm text-blue-600">Joint: {contract.JointCustomerName}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(contract.TransactionDate)}
                          </div>
                        </TableCell>
                        <TableCell>{renderStatusBadge(contract.ContractStatus)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(contract.TotalAmount)}</div>
                          {contract.AdditionalCharges > 0 && <div className="text-sm text-muted-foreground">+{formatCurrency(contract.AdditionalCharges)} charges</div>}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-green-600">{formatCurrency(contract.GrandTotal)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            {contract.UnitCount && contract.UnitCount > 0 && (
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {contract.UnitCount} units
                              </div>
                            )}
                            {contract.ChargeCount && contract.ChargeCount > 0 && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {contract.ChargeCount} charges
                              </div>
                            )}
                            {contract.AttachmentCount && contract.AttachmentCount > 0 && (
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {contract.AttachmentCount} docs
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {contract.CreatedBy && <div>{contract.CreatedBy}</div>}
                            {contract.CreatedOn && <div className="text-muted-foreground">{formatDate(contract.CreatedOn)}</div>}
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
                              <DropdownMenuItem onClick={() => handleViewContract(contract)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View details
                              </DropdownMenuItem>
                              {(contract.ContractStatus === ContractStatus.DRAFT || contract.ContractStatus === ContractStatus.APPROVED) && (
                                <DropdownMenuItem onClick={() => handleEditContract(contract)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {(contract.ContractStatus === ContractStatus.DRAFT || contract.ContractStatus === ContractStatus.APPROVED) && (
                                <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(contract)}>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startRecord} to {endRecord} of {totalRecords} contracts
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => handlePageChange(pageNum)}>
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteContract}
        title="Delete Contract"
        description={
          selectedContract
            ? `Are you sure you want to delete contract "${selectedContract.ContractNo}"? This will also delete all associated units, charges, and attachments. This action cannot be undone.`
            : "Are you sure you want to delete this contract?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default LeaseContractList;
