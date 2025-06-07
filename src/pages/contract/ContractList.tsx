// src/pages/contract/ContractList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MoreHorizontal,
  Search,
  Plus,
  FileText,
  Building,
  Users,
  DollarSign,
  Calendar,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { contractService, Contract } from "@/services/contractService";
import { customerService } from "@/services/customerService";
import { debounce } from "lodash";
import { toast } from "sonner";
import { format } from "date-fns";

const ContractList: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filter states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Contract status options
  const contractStatusOptions = ["Draft", "Pending", "Active", "Expired", "Cancelled", "Completed", "Terminated"];

  // Fetch data on component mount
  useEffect(() => {
    fetchContracts();
    fetchCustomers();
  }, []);

  // Fetch customers for filter dropdown
  const fetchCustomers = async () => {
    try {
      const customersData = await customerService.getAllCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    }
  };

  // Fetch all contracts with filters
  const fetchContracts = async (filters?: { searchText?: string; customerID?: number; contractStatus?: string; fromDate?: Date; toDate?: Date }) => {
    try {
      setLoading(true);
      const contractsData = await contractService.searchContracts(filters || {});
      setContracts(contractsData);
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
    const filters = {
      searchText: searchTerm || undefined,
      customerID: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
      contractStatus: selectedStatus || undefined,
      fromDate: dateFrom,
      toDate: dateTo,
    };

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    fetchContracts(filters);
  };

  // Handle filter dropdown changes
  const handleCustomerChange = (value: string) => {
    setSelectedCustomerId(value === "all" ? "" : value);
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
    setSelectedCustomerId("");
    setSelectedStatus("");
    setDateFrom(undefined);
    setDateTo(undefined);
    fetchContracts();
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

  const handleRenewContract = (contract: Contract) => {
    // Redirect to contract details where renewal can be handled
    navigate(`/contracts/${contract.ContractID}`);
  };

  // Delete contract handlers
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
      const response = await contractService.deleteContract(selectedContract.ContractID);

      if (response.Status === 1) {
        setContracts(contracts.filter((c) => c.ContractID !== selectedContract.ContractID));
        toast.success("Contract deleted successfully");
      } else {
        toast.error(response.Message || "Failed to delete contract");
      }
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast.error("Failed to delete contract");
    } finally {
      closeDeleteDialog();
    }
  };

  // Change contract status
  const handleChangeStatus = async (contract: Contract, newStatus: string) => {
    try {
      const response = await contractService.changeContractStatus(contract.ContractID, newStatus);

      if (response.Status === 1) {
        // Update contract in the list
        setContracts(contracts.map((c) => (c.ContractID === contract.ContractID ? { ...c, ContractStatus: newStatus } : c)));
        toast.success(`Contract status changed to ${newStatus}`);
      } else {
        toast.error(response.Message || "Failed to change contract status");
      }
    } catch (error) {
      console.error("Error changing contract status:", error);
      toast.error("Failed to change contract status");
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: { variant: "secondary" as const, icon: FileText, className: "bg-gray-100 text-gray-800" },
      Pending: { variant: "default" as const, icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      Active: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" },
      Completed: { variant: "default" as const, icon: CheckCircle, className: "bg-blue-100 text-blue-800" },
      Expired: { variant: "destructive" as const, icon: AlertCircle, className: "bg-orange-100 text-orange-800" },
      Cancelled: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800" },
      Terminated: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800" },
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

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate summary statistics
  const stats = {
    total: contracts.length,
    draft: contracts.filter((c) => c.ContractStatus === "Draft").length,
    pending: contracts.filter((c) => c.ContractStatus === "Pending").length,
    active: contracts.filter((c) => c.ContractStatus === "Active").length,
    completed: contracts.filter((c) => c.ContractStatus === "Completed").length,
    expired: contracts.filter((c) => c.ContractStatus === "Expired").length,
    cancelled: contracts.filter((c) => c.ContractStatus === "Cancelled" || c.ContractStatus === "Terminated").length,
    totalValue: contracts.reduce((sum, c) => sum + (c.GrandTotal || 0), 0),
    totalUnits: contracts.reduce((sum, c) => sum + (c.UnitCount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Contract Management</h1>
          <p className="text-muted-foreground">Manage rental and property contracts</p>
        </div>
        <Button onClick={handleAddContract}>
          <Plus className="mr-2 h-4 w-4" />
          New Contract
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Contracts</CardTitle>
          <CardDescription>View and manage all rental contracts</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total</span>
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
                  <span className="text-sm text-muted-foreground">Active</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Completed</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-muted-foreground">Expired</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">{stats.expired}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-muted-foreground">Terminated</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Total Value</span>
                </div>
                <div className="text-lg font-bold text-blue-600">{formatCurrency(stats.totalValue)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search contracts..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex items-center gap-3 overflow-x-auto">
              <Select value={selectedCustomerId || "all"} onValueChange={handleCustomerChange}>
                <SelectTrigger className="w-[200px] flex-shrink-0">
                  <SelectValue placeholder="Filter by customer" />
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

              <Select value={selectedStatus || "all"} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[160px] flex-shrink-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {contractStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex-shrink-0">
                <DatePicker value={dateFrom} onChange={handleDateFromChange} placeholder="From date" />
              </div>

              <div className="flex-shrink-0">
                <DatePicker value={dateTo} onChange={handleDateToChange} placeholder="To date" />
              </div>

              <Button variant="outline" onClick={clearFilters} className="flex-shrink-0 whitespace-nowrap">
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
              {searchTerm || selectedCustomerId || selectedStatus || dateFrom || dateTo
                ? "No contracts found matching your criteria."
                : "No contracts found. Create your first contract to get started."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Contract #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.ContractID}>
                      <TableCell>
                        <div className="font-medium">{contract.ContractNo}</div>
                        <div className="text-sm text-muted-foreground">ID: {contract.ContractID}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{contract.CustomerName}</div>
                            {contract.JointCustomerName && <div className="text-sm text-muted-foreground">Joint: {contract.JointCustomerName}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(contract.TransactionDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(contract.GrandTotal)}</div>
                        {contract.AdditionalCharges > 0 && <div className="text-sm text-muted-foreground">Base: {formatCurrency(contract.TotalAmount)}</div>}
                        {contract.AdditionalCharges > 0 && <div className="text-sm text-muted-foreground">Additional: {formatCurrency(contract.AdditionalCharges)}</div>}
                      </TableCell>
                      <TableCell>{renderStatusBadge(contract.ContractStatus)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className="font-normal">
                            {contract.UnitCount || 0} units
                          </Badge>
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
                            <DropdownMenuItem onClick={() => handleEditContract(contract)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {(contract.ContractStatus === "Active" || contract.ContractStatus === "Completed" || contract.ContractStatus === "Expired") && (
                              <DropdownMenuItem onClick={() => handleRenewContract(contract)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Renew
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuLabel className="font-medium text-muted-foreground">Change Status</DropdownMenuLabel>

                            {contractStatusOptions
                              .filter((status) => status !== contract.ContractStatus)
                              .map((status) => (
                                <DropdownMenuItem key={status} onClick={() => handleChangeStatus(contract, status)}>
                                  Set as {status}
                                </DropdownMenuItem>
                              ))}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-red-500"
                              onClick={() => openDeleteDialog(contract)}
                              disabled={contract.ContractStatus === "Active" || contract.ContractStatus === "Completed"}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteContract}
        title="Delete Contract"
        description={
          selectedContract
            ? `Are you sure you want to delete contract "${selectedContract.ContractNo}"? This action cannot be undone.`
            : "Are you sure you want to delete this contract?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default ContractList;
