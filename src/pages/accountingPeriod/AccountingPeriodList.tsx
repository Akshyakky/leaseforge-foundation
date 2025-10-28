// src/pages/accountingPeriod/AccountingPeriodList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Plus, Filter, Lock, Unlock, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { accountingPeriodService } from "@/services/accountingPeriodService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { companyService } from "@/services/companyService";
import { AccountingPeriod } from "@/types/accountingPeriodTypes";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Company } from "@/services/companyService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isWithinInterval } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const AccountingPeriodList = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<AccountingPeriod | null>(null);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isReopenDialogOpen, setIsReopenDialogOpen] = useState(false);
  const [closingComments, setClosingComments] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("");
  const [selectedIsOpen, setSelectedIsOpen] = useState<string>("");
  const [currentPeriod, setCurrentPeriod] = useState<AccountingPeriod | null>(null);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchCompanies(), fetchFiscalYears()]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const companiesData = await companyService.getCompaniesForDropdown(true);
      setCompanies(companiesData);

      if (companiesData.length > 0 && !selectedCompanyId) {
        const defaultCompany = companiesData[0];
        setSelectedCompanyId(defaultCompany.CompanyID.toString());
        await fetchPeriodsAndStatistics(defaultCompany.CompanyID.toString());
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchFiscalYears = async () => {
    try {
      const fiscalYearsData = await fiscalYearService.getAllFiscalYears({
        filterIsActive: true,
      });
      setFiscalYears(fiscalYearsData);
    } catch (error) {
      console.error("Error fetching fiscal years:", error);
    }
  };

  const fetchPeriodsAndStatistics = async (companyId?: string, fiscalYearId?: string) => {
    try {
      setLoading(true);

      const searchParams: any = {};
      if (companyId) searchParams.filterCompanyID = parseInt(companyId);
      if (fiscalYearId) searchParams.filterFiscalYearID = parseInt(fiscalYearId);
      if (selectedIsOpen) {
        searchParams.filterIsOpen = selectedIsOpen === "open";
        searchParams.filterIsClosed = selectedIsOpen === "closed";
      }
      if (searchTerm) searchParams.searchText = searchTerm;

      const periodsData = await accountingPeriodService.getAllPeriods(searchParams);
      setPeriods(periodsData);

      if (companyId) {
        const current = await accountingPeriodService.getCurrentOpenPeriod(parseInt(companyId));
        setCurrentPeriod(current);

        const stats = await accountingPeriodService.getPeriodStatistics(parseInt(companyId), fiscalYearId ? parseInt(fiscalYearId) : undefined);
        setStatistics(stats);
      }
    } catch (error) {
      console.error("Error fetching periods:", error);
      toast.error("Failed to load accounting periods");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce(() => {
    fetchPeriodsAndStatistics(selectedCompanyId, selectedFiscalYearId);
  }, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    debouncedSearch();
  };

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value);
    setSelectedFiscalYearId("");
    fetchPeriodsAndStatistics(value);
  };

  const handleFiscalYearChange = (value: string) => {
    setSelectedFiscalYearId(value);
    fetchPeriodsAndStatistics(selectedCompanyId, value);
  };

  const handleStatusChange = (value: string) => {
    setSelectedIsOpen(value);
    debouncedSearch();
  };

  const handleGeneratePeriods = async () => {
    if (!selectedFiscalYearId) {
      toast.error("Please select a fiscal year first");
      return;
    }

    if (!selectedCompanyId) {
      toast.error("Please select a company first");
      return;
    }

    try {
      const exists = await accountingPeriodService.periodsExistForFiscalYear(parseInt(selectedFiscalYearId));

      if (exists) {
        toast.error("Periods already exist for this fiscal year");
        return;
      }

      const result = await accountingPeriodService.createPeriodsForFiscalYear(parseInt(selectedFiscalYearId), parseInt(selectedCompanyId));

      if (result.Status === 1) {
        toast.success(result.Message);
        fetchPeriodsAndStatistics(selectedCompanyId, selectedFiscalYearId);
      } else {
        toast.error(result.Message);
      }
    } catch (error) {
      console.error("Error generating periods:", error);
      toast.error("Failed to generate periods");
    }
  };

  const handleViewPeriod = (periodId: number) => {
    navigate(`/accounting-periods/${periodId}`);
  };

  const openCloseDialog = (period: AccountingPeriod) => {
    setSelectedPeriod(period);
    setClosingComments("");
    setIsCloseDialogOpen(true);
  };

  const closeCloseDialog = () => {
    setIsCloseDialogOpen(false);
    setSelectedPeriod(null);
    setClosingComments("");
  };

  const handleClosePeriod = async () => {
    if (!selectedPeriod) return;

    try {
      const validation = await accountingPeriodService.validatePeriodClosure(selectedPeriod.PeriodID);

      if (!validation.canClose) {
        toast.error(validation.validationMessages.join(", "));
        return;
      }

      const result = await accountingPeriodService.closePeriod(selectedPeriod.PeriodID, closingComments);

      if (result.Status === 1) {
        setPeriods(periods.map((p) => (p.PeriodID === selectedPeriod.PeriodID ? { ...p, IsClosed: true, IsOpen: false } : p)));
        toast.success(result.Message);
        fetchPeriodsAndStatistics(selectedCompanyId, selectedFiscalYearId);
      } else {
        toast.error(result.Message);
      }
    } catch (error) {
      console.error("Error closing period:", error);
      toast.error("Failed to close period");
    } finally {
      closeCloseDialog();
    }
  };

  const openReopenDialog = (period: AccountingPeriod) => {
    setSelectedPeriod(period);
    setIsReopenDialogOpen(true);
  };

  const closeReopenDialog = () => {
    setIsReopenDialogOpen(false);
    setSelectedPeriod(null);
  };

  const handleReopenPeriod = async () => {
    if (!selectedPeriod) return;

    try {
      const result = await accountingPeriodService.reopenPeriod(selectedPeriod.PeriodID);

      if (result.Status === 1) {
        setPeriods(periods.map((p) => (p.PeriodID === selectedPeriod.PeriodID ? { ...p, IsClosed: false, IsOpen: true } : p)));
        toast.success(result.Message);
        fetchPeriodsAndStatistics(selectedCompanyId, selectedFiscalYearId);
      } else {
        toast.error(result.Message);
      }
    } catch (error) {
      console.error("Error reopening period:", error);
      toast.error("Failed to reopen period");
    } finally {
      closeReopenDialog();
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedFiscalYearId("");
    setSelectedIsOpen("");
    if (selectedCompanyId) {
      fetchPeriodsAndStatistics(selectedCompanyId);
    }
  };

  const isCurrentPeriod = (period: AccountingPeriod) => {
    const now = new Date();
    const startDate = new Date(period.StartDate);
    const endDate = new Date(period.EndDate);
    return isWithinInterval(now, { start: startDate, end: endDate });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Accounting Periods</h1>
        <Button onClick={handleGeneratePeriods} disabled={!selectedFiscalYearId}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Periods
        </Button>
      </div>

      {currentPeriod && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Current Open Period: <strong>{currentPeriod.PeriodName}</strong> ({format(new Date(currentPeriod.StartDate), "MMM dd")} -{" "}
            {format(new Date(currentPeriod.EndDate), "MMM dd, yyyy")})
          </AlertDescription>
        </Alert>
      )}

      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{statistics.totalPeriods}</div>
                <div className="text-sm text-muted-foreground">Total Periods</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{statistics.openPeriods}</div>
                <div className="text-sm text-muted-foreground">Open Periods</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">{statistics.closedPeriods}</div>
                <div className="text-sm text-muted-foreground">Closed Periods</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Period Management</CardTitle>
          <CardDescription>Manage monthly accounting periods and closures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search periods..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.CompanyID} value={company.CompanyID.toString()}>
                      {company.CompanyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedFiscalYearId} onValueChange={handleFiscalYearChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Fiscal Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Fiscal Years</SelectItem>
                  {fiscalYears
                    .filter((fy) => !selectedCompanyId || fy.CompanyID.toString() === selectedCompanyId)
                    .map((fy) => (
                      <SelectItem key={fy.FiscalYearID} value={fy.FiscalYearID.toString()}>
                        {fy.FYCode} - {fy.FYDescription}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={selectedIsOpen} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Status</SelectItem>
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
          ) : periods.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {selectedFiscalYearId ? "No periods found for this fiscal year. Click 'Generate Periods' to create them." : "Select a fiscal year to view or generate periods."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Period</TableHead>
                    <TableHead className="w-[150px]">Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Fiscal Year</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((period) => (
                    <TableRow key={period.PeriodID} className={cn(isCurrentPeriod(period) && "bg-blue-50 dark:bg-blue-950/30")}>
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="font-mono">
                          P{period.PeriodNumber.toString().padStart(2, "0")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{period.PeriodCode}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {period.PeriodName}
                          {isCurrentPeriod(period) && (
                            <Badge variant="default" className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                              Current
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{period.FYCode}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                          {format(new Date(period.StartDate), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                          {format(new Date(period.EndDate), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {period.IsClosed ? (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-800">
                            <Lock className="h-3 w-3 mr-1" />
                            Closed
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/50 dark:text-green-200 dark:hover:bg-green-900/50 border-green-200 dark:border-green-800"
                          >
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
                            <DropdownMenuItem onClick={() => handleViewPeriod(period.PeriodID)}>View details</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!period.IsClosed ? (
                              <DropdownMenuItem onClick={() => openCloseDialog(period)}>
                                <Lock className="mr-2 h-4 w-4" />
                                Close Period
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => openReopenDialog(period)}>
                                <Unlock className="mr-2 h-4 w-4" />
                                Reopen Period
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

      <ConfirmationDialog
        isOpen={isCloseDialogOpen}
        onClose={closeCloseDialog}
        onConfirm={handleClosePeriod}
        title="Close Accounting Period"
        description={
          selectedPeriod ? (
            <div className="space-y-4">
              <p>
                Are you sure you want to close period <strong>{selectedPeriod.PeriodName}</strong>? This will prevent new transactions from being posted to this period.
              </p>
              <div className="space-y-2">
                <Label htmlFor="closing-comments">Closing Comments (Optional)</Label>
                <Textarea
                  id="closing-comments"
                  placeholder="Enter any comments about this period closure..."
                  value={closingComments}
                  onChange={(e) => setClosingComments(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          ) : (
            "Are you sure you want to close this period?"
          )
        }
        cancelText="Cancel"
        confirmText="Close Period"
        type="warning"
      />

      <ConfirmationDialog
        isOpen={isReopenDialogOpen}
        onClose={closeReopenDialog}
        onConfirm={handleReopenPeriod}
        title="Reopen Accounting Period"
        description={
          selectedPeriod
            ? `Are you sure you want to reopen period "${selectedPeriod.PeriodName}"? This will allow transactions to be posted to this period again. Ensure no future periods are closed before reopening this period.`
            : "Are you sure you want to reopen this period?"
        }
        cancelText="Cancel"
        confirmText="Reopen Period"
        type="info"
      />
    </div>
  );
};

export default AccountingPeriodList;
