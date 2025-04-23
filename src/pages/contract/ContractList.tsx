// src/pages/contract/ContractList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Search, Plus, Filter, Calendar, User, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { contractService, Contract } from "@/services/contractService";
import { customerService } from "@/services/customerService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ContractList: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  // Filters
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Contract status options
  const contractStatusOptions = ["Draft", "Pending", "Active", "Expired", "Cancelled", "Completed", "Terminated"];

  // Fetch data on component mount
  useEffect(() => {
    fetchContracts();
    fetchCustomers();
  }, []);

  // Fetch all contracts
  const fetchContracts = async (search?: string, filters?: any) => {
    try {
      setLoading(true);
      const contractsData = await contractService.searchContracts({
        searchText: search,
        customerID: filters?.customerID,
        contractStatus: filters?.contractStatus,
        fromDate: filters?.fromDate,
        toDate: filters?.toDate,
      });
      setContracts(contractsData);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers for filter dropdown
  const fetchCustomers = async () => {
    try {
      const customersData = await customerService.getAllCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  // Apply filters
  const applyFilters = () => {
    const filters = {
      customerID: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
      contractStatus: selectedStatus || undefined,
      fromDate: fromDate,
      toDate: toDate,
    };
    fetchContracts(searchTerm, filters);
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
  }, [selectedCustomerId, selectedStatus, fromDate, toDate]);

  // Navigation handlers
  const handleAddContract = () => {
    navigate("/contracts/new");
  };

  const handleEditContract = (contractId: number) => {
    navigate(`/contracts/edit/${contractId}`);
  };

  const handleViewContract = (contractId: number) => {
    navigate(`/contracts/${contractId}`);
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
      case "Active":
        return "default";
      case "Draft":
        return "secondary";
      case "Pending":
        return "outline";
      case "Completed":
        return "default";
      case "Expired":
      case "Cancelled":
      case "Terminated":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Contract Management</h1>
        <Button onClick={handleAddContract}>
          <Plus className="mr-2 h-4 w-4" />
          New Contract
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Contracts</CardTitle>
          <CardDescription>Manage rental and property contracts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search contracts..." className="pl-9" onChange={handleSearchChange} />
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

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Statuses</SelectItem>
                {contractStatusOptions.map((status) => (
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

              {(fromDate || toDate || selectedCustomerId || selectedStatus) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFromDate(null);
                    setToDate(null);
                    setSelectedCustomerId("");
                    setSelectedStatus("");
                  }}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedCustomerId || selectedStatus || fromDate || toDate ? "No contracts found matching your criteria." : "No contracts have been created yet."}
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
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div>{contract.CustomerName}</div>
                            {contract.JointCustomerName && <div className="text-sm text-muted-foreground">Joint: {contract.JointCustomerName}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(contract.TransactionDate)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(contract.GrandTotal)}</div>
                        {contract.AdditionalCharges > 0 && <div className="text-sm text-muted-foreground">(+{formatCurrency(contract.AdditionalCharges)} additional charges)</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(contract.ContractStatus)}>{contract.ContractStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          <FileText className="h-3 w-3 mr-1" />
                          {contract.UnitCount || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewContract(contract.ContractID)}>View details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditContract(contract.ContractID)}>Edit</DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem disabled className="font-medium text-muted-foreground">
                              Change Status
                            </DropdownMenuItem>

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

      {/* Confirmation Dialog */}
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
