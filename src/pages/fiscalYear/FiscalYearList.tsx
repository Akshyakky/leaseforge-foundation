// src/pages/fiscalYear/FiscalYearList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Plus, Filter, CheckCircle, XCircle, Calendar, Lock, Unlock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fiscalYearService } from "@/services/fiscalYearService";
import { companyService } from "@/services/companyService";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Company } from "@/services/companyService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const FiscalYearList = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<FiscalYear | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<"close" | "open">("close");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedIsActive, setSelectedIsActive] = useState<string>("");
  const [selectedIsClosed, setSelectedIsClosed] = useState<string>("");

  // Fetch fiscal years and companies on component mount
  useEffect(() => {
    fetchFiscalYears();
    fetchCompanies();
  }, []);

  // Fetch all fiscal years
  const fetchFiscalYears = async (search?: string, companyId?: string, isActive?: boolean, isClosed?: boolean) => {
    try {
      setLoading(true);
      const searchParams: any = {};

      if (search) searchParams.searchText = search;
      if (companyId) searchParams.filterCompanyID = parseInt(companyId);
      if (isActive !== undefined) searchParams.filterIsActive = isActive;
      if (isClosed !== undefined) searchParams.filterIsClosed = isClosed;

      const fiscalYearsData = Object.keys(searchParams).length > 0 ? await fiscalYearService.searchFiscalYears(searchParams) : await fiscalYearService.getAllFiscalYears();

      setFiscalYears(fiscalYearsData);
    } catch (error) {
      console.error("Error fetching fiscal years:", error);
      toast.error("Failed to load fiscal years");
    } finally {
      setLoading(false);
    }
  };

  // Fetch companies for filtering
  const fetchCompanies = async () => {
    try {
      const companiesData = await companyService.getCompaniesForDropdown(true);
      setCompanies(companiesData);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce(() => {
    const isActive = selectedIsActive === "" ? undefined : selectedIsActive === "active";
    const isClosed = selectedIsClosed === "" ? undefined : selectedIsClosed === "closed";
    fetchFiscalYears(searchTerm, selectedCompanyId, isActive, isClosed);
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    debouncedSearch();
  };

  // Handle company filter change
  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value);
    debouncedSearch();
  };

  // Handle active status filter change
  const handleActiveChange = (value: string) => {
    setSelectedIsActive(value);
    debouncedSearch();
  };

  // Handle closed status filter change
  const handleClosedChange = (value: string) => {
    setSelectedIsClosed(value);
    debouncedSearch();
  };

  // Navigation handlers
  const handleAddFiscalYear = () => {
    navigate("/fiscal-years/new");
  };

  const handleEditFiscalYear = (fiscalYearId: number) => {
    navigate(`/fiscal-years/edit/${fiscalYearId}`);
  };

  const handleViewFiscalYear = (fiscalYearId: number) => {
    navigate(`/fiscal-years/${fiscalYearId}`);
  };

  // Delete confirmation handlers
  const openDeleteDialog = (fiscalYear: FiscalYear) => {
    setSelectedFiscalYear(fiscalYear);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedFiscalYear(null);
  };

  const handleDeleteFiscalYear = async () => {
    if (!selectedFiscalYear) return;

    try {
      const result = await fiscalYearService.deleteFiscalYear(selectedFiscalYear.FiscalYearID);

      if (result.Status === 1) {
        setFiscalYears(fiscalYears.filter((fy) => fy.FiscalYearID !== selectedFiscalYear.FiscalYearID));
        toast.success(result.Message);
      } else {
        toast.error(result.Message);
      }
    } catch (error) {
      console.error("Error deleting fiscal year:", error);
      toast.error("Failed to delete fiscal year");
    } finally {
      closeDeleteDialog();
    }
  };

  // Status change handlers
  const openStatusDialog = (fiscalYear: FiscalYear, action: "close" | "open") => {
    setSelectedFiscalYear(fiscalYear);
    setStatusAction(action);
    setIsStatusDialogOpen(true);
  };

  const closeStatusDialog = () => {
    setIsStatusDialogOpen(false);
    setSelectedFiscalYear(null);
  };

  const handleStatusChange = async () => {
    if (!selectedFiscalYear) return;

    try {
      const result = await fiscalYearService.setFiscalYearClosedStatus(selectedFiscalYear.FiscalYearID, statusAction === "close");

      if (result.Status === 1) {
        // Update local state
        setFiscalYears(fiscalYears.map((fy) => (fy.FiscalYearID === selectedFiscalYear.FiscalYearID ? { ...fy, IsClosed: statusAction === "close" } : fy)));
        toast.success(result.Message);
      } else {
        toast.error(result.Message);
      }
    } catch (error) {
      console.error("Error changing fiscal year status:", error);
      toast.error("Failed to change fiscal year status");
    } finally {
      closeStatusDialog();
    }
  };

  // Toggle active status
  const handleToggleActive = async (fiscalYear: FiscalYear) => {
    try {
      const result = await fiscalYearService.toggleFiscalYearStatus(fiscalYear.FiscalYearID, !fiscalYear.IsActive);

      if (result.Status === 1) {
        // Update local state
        setFiscalYears(fiscalYears.map((fy) => (fy.FiscalYearID === fiscalYear.FiscalYearID ? { ...fy, IsActive: !fy.IsActive } : fy)));
        toast.success(result.Message);
      } else {
        toast.error(result.Message);
      }
    } catch (error) {
      console.error("Error toggling fiscal year status:", error);
      toast.error("Failed to toggle fiscal year status");
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCompanyId("");
    setSelectedIsActive("");
    setSelectedIsClosed("");
    fetchFiscalYears();
  };

  // Get current fiscal year for a company
  const handleViewCurrent = async (companyId: number) => {
    try {
      const currentFY = await fiscalYearService.getCurrentFiscalYear(companyId);
      if (currentFY) {
        navigate(`/fiscal-years/${currentFY.FiscalYearID}`);
      } else {
        toast.info("No current active fiscal year found for this company");
      }
    } catch (error) {
      console.error("Error fetching current fiscal year:", error);
      toast.error("Failed to fetch current fiscal year");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Fiscal Years</h1>
        <Button onClick={handleAddFiscalYear}>
          <Plus className="mr-2 h-4 w-4" />
          Add Fiscal Year
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Fiscal Year Management</CardTitle>
          <CardDescription>Manage your organization's fiscal years and periods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search fiscal years..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.CompanyID} value={company.CompanyID.toString()}>
                      {company.CompanyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedIsActive} onValueChange={handleActiveChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedIsClosed} onValueChange={handleClosedChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Periods</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="ghost" onClick={resetFilters} className="h-9">
                <Filter className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : fiscalYears.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedCompanyId || selectedIsActive || selectedIsClosed
                ? "No fiscal years found matching your criteria."
                : "No fiscal years found. Create your first fiscal year."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Code</TableHead>
                    <TableHead className="w-[200px]">Description</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fiscalYears.map((fiscalYear) => (
                    <TableRow key={fiscalYear.FiscalYearID}>
                      <TableCell className="font-medium">{fiscalYear.FYCode}</TableCell>
                      <TableCell>{fiscalYear.FYDescription}</TableCell>
                      <TableCell>{fiscalYear.CompanyName || "Unknown"}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {format(new Date(fiscalYear.StartDate), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {format(new Date(fiscalYear.EndDate), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {fiscalYear.IsActive ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {fiscalYear.IsClosed ? (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                            <Lock className="h-3 w-3 mr-1" />
                            Closed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            <Unlock className="h-3 w-3 mr-1" />
                            Open
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewFiscalYear(fiscalYear.FiscalYearID)}>View details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditFiscalYear(fiscalYear.FiscalYearID)}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleActive(fiscalYear)}>{fiscalYear.IsActive ? "Deactivate" : "Activate"}</DropdownMenuItem>
                            {!fiscalYear.IsClosed ? (
                              <DropdownMenuItem onClick={() => openStatusDialog(fiscalYear, "close")}>
                                <Lock className="mr-2 h-4 w-4" />
                                Close Period
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => openStatusDialog(fiscalYear, "open")}>
                                <Unlock className="mr-2 h-4 w-4" />
                                Reopen Period
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleViewCurrent(fiscalYear.CompanyID)}>View Current FY</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(fiscalYear)} disabled={fiscalYear.IsClosed}>
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
        onConfirm={handleDeleteFiscalYear}
        title="Delete Fiscal Year"
        description={
          selectedFiscalYear
            ? `Are you sure you want to delete the fiscal year "${selectedFiscalYear.FYDescription}"? This action cannot be undone and may affect related transactions.`
            : "Are you sure you want to delete this fiscal year?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />

      {/* Status Change Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isStatusDialogOpen}
        onClose={closeStatusDialog}
        onConfirm={handleStatusChange}
        title={statusAction === "close" ? "Close Fiscal Year" : "Reopen Fiscal Year"}
        description={
          selectedFiscalYear
            ? statusAction === "close"
              ? `Are you sure you want to close the fiscal year "${selectedFiscalYear.FYDescription}"? This will prevent new transactions from being posted to this period.`
              : `Are you sure you want to reopen the fiscal year "${selectedFiscalYear.FYDescription}"? This will allow transactions to be posted to this period again.`
            : "Are you sure you want to change the fiscal year status?"
        }
        cancelText="Cancel"
        confirmText={statusAction === "close" ? "Close Period" : "Reopen Period"}
        type={statusAction === "close" ? "warning" : "info"}
      />
    </div>
  );
};

export default FiscalYearList;
