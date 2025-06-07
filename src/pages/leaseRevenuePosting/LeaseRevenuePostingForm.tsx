import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Send, AlertCircle, Calculator, Building, Receipt, CheckCircle, DollarSign, Calendar, Filter, RefreshCw } from "lucide-react";
import { leaseRevenuePostingService } from "@/services/leaseRevenuePostingService";
import { accountService } from "@/services/accountService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { currencyService } from "@/services/currencyService";
import { propertyService } from "@/services/propertyService";
import { customerService } from "@/services/customerService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { LeaseRevenueTransaction, SelectedTransaction, PostingRequest, LeaseRevenueFilters } from "@/types/leaseRevenuePostingTypes";
import { Account } from "@/types/accountTypes";
import { Company } from "@/services/companyService";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Currency } from "@/services/currencyService";
import { format } from "date-fns";

// Schema for the posting form
const postingSchema = z.object({
  postingDate: z.date({ required_error: "Posting date is required" }),
  debitAccountId: z.string().min(1, "Debit account is required"),
  creditAccountId: z.string().min(1, "Credit account is required"),
  narration: z.string().optional(),
  referenceNo: z.string().optional(),
  exchangeRate: z.coerce.number().min(0.0001, "Exchange rate must be greater than 0").optional(),
  companyId: z.string().min(1, "Company is required"),
  fiscalYearId: z.string().min(1, "Fiscal year is required"),
  currencyId: z.string().optional(),
});

type PostingFormValues = z.infer<typeof postingSchema>;

const LeaseRevenuePostingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactions, setTransactions] = useState<LeaseRevenueTransaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());

  // Reference data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Filter states
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Initialize form
  const form = useForm<PostingFormValues>({
    resolver: zodResolver(postingSchema),
    defaultValues: {
      postingDate: new Date(),
      debitAccountId: "",
      creditAccountId: "",
      narration: "",
      referenceNo: "",
      exchangeRate: 1,
      companyId: "",
      fiscalYearId: "",
      currencyId: "",
    },
  });

  // Initialize and fetch data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        await fetchReferenceData();

        // Check if there's a pre-selected transaction from navigation state
        const selectedTransaction = location.state?.selectedTransaction;
        if (selectedTransaction) {
          setSelectedTransactions(new Set([selectedTransaction]));
        }
      } catch (error) {
        console.error("Error initializing form:", error);
        toast.error("Error loading form data");
      } finally {
        setInitialLoading(false);
      }
    };

    initializeForm();
  }, [location.state]);

  // Fetch transactions when filters change
  useEffect(() => {
    if (selectedCompanyId && selectedFiscalYearId) {
      handleFilterChange();
    }
  }, [selectedCompanyId, selectedFiscalYearId]);

  // Fetch reference data
  const fetchReferenceData = async () => {
    try {
      const [accountsData, companiesData, fiscalYearsData, currenciesData, propertiesData, customersData] = await Promise.all([
        accountService.getAllAccounts(),
        companyService.getCompaniesForDropdown(true),
        fiscalYearService.getFiscalYearsForDropdown({ filterIsActive: true }),
        currencyService.getAllCurrencies(),
        propertyService.getAllProperties(),
        customerService.getAllCustomers(),
      ]);

      setAccounts(accountsData.filter((account) => account.IsActive && account.IsPostable));
      setCompanies(companiesData);
      setFiscalYears(fiscalYearsData);
      setCurrencies(currenciesData);
      setProperties(propertiesData);
      setCustomers(customersData);

      // Set default company and fiscal year if available
      if (companiesData.length > 0) {
        const defaultCompany = companiesData[0];
        setSelectedCompanyId(defaultCompany.CompanyID.toString());
        form.setValue("companyId", defaultCompany.CompanyID.toString());
      }

      if (fiscalYearsData.length > 0) {
        const activeFY = fiscalYearsData.find((fy) => fy.IsActive) || fiscalYearsData[0];
        setSelectedFiscalYearId(activeFY.FiscalYearID.toString());
        form.setValue("fiscalYearId", activeFY.FiscalYearID.toString());
      }

      if (currenciesData.length > 0) {
        const defaultCurrency = currenciesData.find((c) => c.IsDefault) || currenciesData[0];
        form.setValue("currencyId", defaultCurrency.CurrencyID.toString());
      }
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Error loading reference data");
    }
  };

  // Fetch unposted transactions
  const fetchTransactions = async (filters?: LeaseRevenueFilters) => {
    try {
      setTransactionsLoading(true);
      const data = await leaseRevenuePostingService.getUnpostedTransactions(filters || {});
      setTransactions(data);
      // Clear selection when transactions change
      setSelectedTransactions(new Set());
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = () => {
    const filters: LeaseRevenueFilters = {
      CompanyID: selectedCompanyId ? parseInt(selectedCompanyId) : undefined,
      FiscalYearID: selectedFiscalYearId ? parseInt(selectedFiscalYearId) : undefined,
      PropertyID: selectedPropertyId ? parseInt(selectedPropertyId) : undefined,
      CustomerID: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
    };

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key as keyof LeaseRevenueFilters] === undefined) {
        delete filters[key as keyof LeaseRevenueFilters];
      }
    });

    fetchTransactions(filters);
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedPropertyId("");
    setSelectedCustomerId("");
    handleFilterChange();
  };

  // Selection handlers
  const handleSelectTransaction = (transactionKey: string, checked: boolean) => {
    const newSelection = new Set(selectedTransactions);
    if (checked) {
      newSelection.add(transactionKey);
    } else {
      newSelection.delete(transactionKey);
    }
    setSelectedTransactions(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = transactions.map((t) => `${t.TransactionType}-${t.TransactionID}`);
      setSelectedTransactions(new Set(allKeys));
    } else {
      setSelectedTransactions(new Set());
    }
  };

  // Submit handler
  const onSubmit = async (data: PostingFormValues) => {
    if (selectedTransactions.size === 0) {
      toast.error("Please select at least one transaction to post");
      return;
    }

    setLoading(true);
    try {
      // Prepare selected transactions
      const selectedTxns: SelectedTransaction[] = Array.from(selectedTransactions).map((key) => {
        const [type, id] = key.split("-");
        const transaction = transactions.find((t) => t.TransactionType === type && t.TransactionID.toString() === id);

        return {
          TransactionType: type as "Invoice" | "Receipt",
          TransactionID: parseInt(id),
          PostingAmount: transaction?.PostingAmount || 0,
          DebitAccountID: parseInt(data.debitAccountId),
          CreditAccountID: parseInt(data.creditAccountId),
          Narration: data.narration || transaction?.BalanceNarration || "",
        };
      });

      // Validate transactions before posting
      const validation = await leaseRevenuePostingService.validateTransactions(selectedTxns, data.postingDate, parseInt(data.companyId), parseInt(data.fiscalYearId));

      if (!validation.IsValid) {
        validation.Errors.forEach((error) => toast.error(error));
        setLoading(false);
        return;
      }

      if (validation.Warnings.length > 0) {
        validation.Warnings.forEach((warning) => toast.warning(warning));
      }

      // Prepare posting request
      const postingRequest: PostingRequest = {
        PostingDate: data.postingDate,
        DebitAccountID: parseInt(data.debitAccountId),
        CreditAccountID: parseInt(data.creditAccountId),
        Narration: data.narration,
        ReferenceNo: data.referenceNo,
        ExchangeRate: data.exchangeRate || 1.0,
        CompanyID: parseInt(data.companyId),
        FiscalYearID: parseInt(data.fiscalYearId),
        SelectedTransactions: selectedTxns,
      };

      const result = await leaseRevenuePostingService.postSelectedTransactions(postingRequest);

      if (result.success) {
        toast.success(`Posted ${result.PostedCount} transactions successfully`);
        if (result.FailedCount && result.FailedCount > 0) {
          toast.warning(`${result.FailedCount} transactions failed to post`);
        }
        navigate("/lease-revenue-posting");
      }
    } catch (error) {
      console.error("Error posting transactions:", error);
      toast.error("Failed to post transactions");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const selectedTransactionsList = Array.from(selectedTransactions)
    .map((key) => {
      const [type, id] = key.split("-");
      return transactions.find((t) => t.TransactionType === type && t.TransactionID.toString() === id);
    })
    .filter(Boolean) as LeaseRevenueTransaction[];

  const totalSelectedAmount = selectedTransactionsList.reduce((sum, t) => sum + t.PostingAmount, 0);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Cancel handler
  const handleCancel = () => {
    navigate("/lease-revenue-posting");
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/lease-revenue-posting")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Post Lease Revenue Transactions</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Posting Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Posting Configuration
              </CardTitle>
              <CardDescription>Configure the posting parameters for selected transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="companyId"
                  label="Company"
                  type="select"
                  options={companies.map((company) => ({
                    label: company.CompanyName,
                    value: company.CompanyID.toString(),
                  }))}
                  placeholder="Select company"
                  required
                  description="Company for the posting"
                  onChange={(value) => {
                    setSelectedCompanyId(value);
                  }}
                />
                <FormField
                  form={form}
                  name="fiscalYearId"
                  label="Fiscal Year"
                  type="select"
                  options={fiscalYears.map((fy) => ({
                    label: fy.FYDescription,
                    value: fy.FiscalYearID.toString(),
                  }))}
                  placeholder="Select fiscal year"
                  required
                  description="Fiscal year for the posting"
                  onChange={(value) => {
                    setSelectedFiscalYearId(value);
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField form={form} name="postingDate" label="Posting Date" type="date" required description="Date for the posting entries" />
                <FormField form={form} name="exchangeRate" label="Exchange Rate" type="number" step="0.0001" placeholder="1.0000" description="Exchange rate to base currency" />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="debitAccountId"
                  label="Debit Account"
                  type="select"
                  options={accounts
                    .filter((acc) => acc.AccountCode.startsWith("1")) // Asset accounts
                    .map((account) => ({
                      label: `${account.AccountCode} - ${account.AccountName}`,
                      value: account.AccountID.toString(),
                    }))}
                  placeholder="Select debit account"
                  required
                  description="Account to debit (typically Accounts Receivable)"
                />
                <FormField
                  form={form}
                  name="creditAccountId"
                  label="Credit Account"
                  type="select"
                  options={accounts
                    .filter((acc) => acc.AccountCode.startsWith("4")) // Revenue accounts
                    .map((account) => ({
                      label: `${account.AccountCode} - ${account.AccountName}`,
                      value: account.AccountID.toString(),
                    }))}
                  placeholder="Select credit account"
                  required
                  description="Account to credit (typically Revenue account)"
                />
              </div>

              <FormField form={form} name="narration" label="Narration" type="textarea" placeholder="Enter posting narration" description="Description for the posting entries" />

              <FormField form={form} name="referenceNo" label="Reference Number" placeholder="Enter reference number" description="Optional reference for the posting" />
            </CardContent>
          </Card>

          {/* Transaction Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Transaction Filters
              </CardTitle>
              <CardDescription>Filter transactions to find specific items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Property</label>
                  <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Properties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Properties</SelectItem>
                      {properties.map((property) => (
                        <SelectItem key={property.PropertyID} value={property.PropertyID.toString()}>
                          {property.PropertyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Customer</label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Customers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Customers</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.CustomerID} value={customer.CustomerID.toString()}>
                          {customer.CustomerFullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <Button type="button" variant="outline" onClick={handleFilterChange} disabled={transactionsLoading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Selection */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Select Transactions to Post</CardTitle>
                  <CardDescription>Choose the transactions you want to post to the general ledger</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {selectedTransactions.size} of {transactions.length} selected
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {formatCurrency(totalSelectedAmount)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="mx-auto h-12 w-12 mb-4" />
                  <p>No unposted transactions found.</p>
                  <p className="text-sm">Try adjusting your filters or check back later.</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox checked={selectedTransactions.size === transactions.length && transactions.length > 0} onCheckedChange={handleSelectAll} />
                        </TableHead>
                        <TableHead>Transaction</TableHead>
                        <TableHead>Property/Unit</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => {
                        const transactionKey = `${transaction.TransactionType}-${transaction.TransactionID}`;
                        return (
                          <TableRow key={transactionKey}>
                            <TableCell>
                              <Checkbox
                                checked={selectedTransactions.has(transactionKey)}
                                onCheckedChange={(checked) => handleSelectTransaction(transactionKey, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{transaction.TransactionNo}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {transaction.TransactionType}
                                </Badge>
                                <Calendar className="h-3 w-3" />
                                {format(new Date(transaction.TransactionDate), "MMM dd, yyyy")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{transaction.Property}</div>
                              <div className="text-sm text-muted-foreground">Unit: {transaction.UnitNo}</div>
                            </TableCell>
                            <TableCell>
                              <div>{transaction.CustomerName}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {format(new Date(transaction.StartDate), "MMM dd")} - {format(new Date(transaction.EndDate), "MMM dd, yyyy")}
                              </div>
                              <div className="text-xs text-muted-foreground">{transaction.TotalLeaseDays} days</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium">{formatCurrency(transaction.PostingAmount)}</div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Selection Summary */}
              {selectedTransactions.size > 0 && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Selection Summary:</span>
                      </div>
                      <div className="text-sm">
                        Transactions: <span className="font-mono">{selectedTransactions.size}</span>
                      </div>
                      <div className="text-sm">
                        Total Amount: <span className="font-mono">{formatCurrency(totalSelectedAmount)}</span>
                      </div>
                    </div>
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Ready to Post
                    </Badge>
                  </div>

                  {/* Validation Summary */}
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-sm text-blue-800">
                      <div className="font-medium mb-1">Pre-posting Validation:</div>
                      <ul className="text-xs space-y-1">
                        <li>• Debit and credit accounts must be different</li>
                        <li>• All transactions will use the same posting date</li>
                        <li>• Posting will create journal entries in the selected fiscal year</li>
                        {selectedTransactions.size > 10 && <li className="text-orange-600">• Large batch posting ({selectedTransactions.size} transactions) may take longer</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <Card>
            <CardContent className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              <div className="flex gap-2">
                {selectedTransactions.size > 0 && (
                  <Button type="button" variant="outline" onClick={() => setSelectedTransactions(new Set())} disabled={loading}>
                    Clear Selection
                  </Button>
                )}
                <Button type="submit" disabled={loading || selectedTransactions.size === 0 || !form.watch("debitAccountId") || !form.watch("creditAccountId")}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Post {selectedTransactions.size} Transaction{selectedTransactions.size !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default LeaseRevenuePostingForm;
