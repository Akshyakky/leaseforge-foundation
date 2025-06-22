// src/pages/leaseRevenuePosting/LeaseRevenuePostingForm.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Loader2,
  Send,
  AlertCircle,
  Calculator,
  Building,
  Receipt,
  CheckCircle,
  DollarSign,
  Calendar,
  Filter,
  RefreshCw,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Info,
  Eye,
  AlertTriangle,
  XCircle,
  Users,
  Home,
  Building2,
  FileText,
} from "lucide-react";

// Services and types
import { leaseRevenuePostingService } from "@/services/leaseRevenuePostingService";
import { accountService } from "@/services/accountService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { currencyService } from "@/services/currencyService";
import { propertyService } from "@/services/propertyService";
import { customerService } from "@/services/customerService";

import {
  LeaseRevenueTransaction,
  SelectedTransaction,
  PostingRequest,
  LeaseRevenueFilters,
  Account,
  Company,
  FiscalYear,
  Currency,
  ValidationResponse,
} from "@/types/leaseRevenuePostingTypes";

// Form components and utilities
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAppSelector } from "@/lib/hooks";

// Enhanced schema for posting form validation
const postingSchema = z
  .object({
    postingDate: z.date({ required_error: "Posting date is required" }),
    debitAccountId: z.string().min(1, "Debit account is required"),
    creditAccountId: z.string().min(1, "Credit account is required"),
    narration: z.string().optional(),
    referenceNo: z.string().optional(),
    exchangeRate: z.coerce.number().min(0.0001, "Exchange rate must be greater than 0").default(1),
    companyId: z.string().min(1, "Company is required"),
    fiscalYearId: z.string().min(1, "Fiscal year is required"),
    currencyId: z.string().optional(),
  })
  .refine((data) => data.debitAccountId !== data.creditAccountId, {
    message: "Debit and credit accounts must be different",
    path: ["creditAccountId"],
  });

type PostingFormValues = z.infer<typeof postingSchema>;

// Interface for filter state
interface FilterState {
  selectedPropertyId: string;
  selectedCustomerId: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Interface for posting statistics
interface PostingStatistics {
  totalTransactions: number;
  selectedTransactions: number;
  totalAmount: number;
  selectedAmount: number;
  invoiceCount: number;
  receiptCount: number;
}

const LeaseRevenuePostingForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);

  // Data state
  const [transactions, setTransactions] = useState<LeaseRevenueTransaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);

  // Reference data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    selectedPropertyId: "",
    selectedCustomerId: "",
    dateFrom: undefined,
    dateTo: undefined,
  });

  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  // Initialize form with proper validation
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

  // Initialize component
  useEffect(() => {
    const initializeForm = async () => {
      try {
        setInitialLoading(true);
        await fetchReferenceData();

        // Handle pre-selected transaction from navigation state
        const selectedTransaction = location.state?.selectedTransaction;
        const autoOpenPostingDialog = location.state?.autoOpenPostingDialog;

        if (selectedTransaction) {
          setSelectedTransactions(new Set([selectedTransaction]));
        }

        if (autoOpenPostingDialog) {
          toast.info("Configure posting details for the selected transaction");
        }
      } catch (error) {
        console.error("Error initializing form:", error);
        toast.error("Failed to load form data");
      } finally {
        setInitialLoading(false);
      }
    };

    initializeForm();
  }, [location.state]);

  // Fetch transactions when required filters are set
  useEffect(() => {
    const companyId = form.watch("companyId");
    const fiscalYearId = form.watch("fiscalYearId");

    if (companyId && fiscalYearId) {
      handleFilterChange();
    }
  }, [form.watch("companyId"), form.watch("fiscalYearId")]);

  // Auto-validate when selection or posting details change
  useEffect(() => {
    if (selectedTransactions.size > 0) {
      handleValidation();
    } else {
      setValidationResult(null);
    }
  }, [selectedTransactions, form.watch("postingDate"), form.watch("debitAccountId"), form.watch("creditAccountId")]);

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

      // Set default values
      if (companiesData.length > 0) {
        const defaultCompany = companiesData[0];
        form.setValue("companyId", defaultCompany.CompanyID.toString());
      }

      if (fiscalYearsData.length > 0) {
        const activeFY = fiscalYearsData.find((fy) => fy.IsActive) || fiscalYearsData[0];
        form.setValue("fiscalYearId", activeFY.FiscalYearID.toString());
      }

      if (currenciesData.length > 0) {
        const defaultCurrency = currenciesData.find((c) => c.IsDefault) || currenciesData[0];
        form.setValue("currencyId", defaultCurrency.CurrencyID.toString());
      }

      // Set default accounts if available
      const receivableAccount = accountsData.find(
        (acc) => acc.IsActive && acc.IsPostable && acc.AccountCode.startsWith("1") && acc.AccountName.toLowerCase().includes("receivable")
      );
      if (receivableAccount) {
        form.setValue("debitAccountId", receivableAccount.AccountID.toString());
      }

      const revenueAccount = accountsData.find((acc) => acc.IsActive && acc.IsPostable && acc.AccountCode.startsWith("4") && acc.AccountName.toLowerCase().includes("revenue"));
      if (revenueAccount) {
        form.setValue("creditAccountId", revenueAccount.AccountID.toString());
      }
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Failed to load reference data");
    }
  };

  // Fetch unposted transactions
  const fetchTransactions = async () => {
    const companyId = form.getValues("companyId");
    const fiscalYearId = form.getValues("fiscalYearId");

    if (!companyId || !fiscalYearId) {
      return;
    }

    try {
      setTransactionsLoading(true);

      const apiFilters: LeaseRevenueFilters = {
        CompanyID: parseInt(companyId),
        FiscalYearID: parseInt(fiscalYearId),
        PropertyID: filters.selectedPropertyId ? parseInt(filters.selectedPropertyId) : undefined,
        CustomerID: filters.selectedCustomerId ? parseInt(filters.selectedCustomerId) : undefined,
        PeriodFromDate: filters.dateFrom,
        PeriodToDate: filters.dateTo,
        ShowUnpostedOnly: true,
      };

      const data = await leaseRevenuePostingService.getUnpostedTransactions(apiFilters);
      setTransactions(data);

      // Clear invalid selections
      const validKeys = data.map((t) => `${t.TransactionType}-${t.TransactionID}`);
      const newSelection = new Set(Array.from(selectedTransactions).filter((key) => validKeys.includes(key)));
      setSelectedTransactions(newSelection);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = useCallback(() => {
    fetchTransactions();
  }, [filters, form.watch("companyId"), form.watch("fiscalYearId")]);

  // Clear filters
  const clearFilters = () => {
    setFilters({
      selectedPropertyId: "",
      selectedCustomerId: "",
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  // Handle validation
  const handleValidation = async () => {
    if (selectedTransactions.size === 0) {
      setValidationResult(null);
      return;
    }

    try {
      setValidationLoading(true);

      const formData = form.getValues();
      const selectedTxns = getSelectedTransactionObjects();

      if (selectedTxns.length === 0 || !formData.postingDate || !formData.companyId || !formData.fiscalYearId) {
        return;
      }

      const validation = await leaseRevenuePostingService.validateTransactions(selectedTxns, formData.postingDate, parseInt(formData.companyId), parseInt(formData.fiscalYearId));

      setValidationResult(validation);
    } catch (error) {
      console.error("Error validating transactions:", error);
      setValidationResult({
        IsValid: false,
        Errors: ["Failed to validate transactions"],
        Warnings: [],
      });
    } finally {
      setValidationLoading(false);
    }
  };

  // Get selected transaction objects
  const getSelectedTransactionObjects = (): SelectedTransaction[] => {
    return Array.from(selectedTransactions).map((key) => {
      const [type, id] = key.split("-");
      const transaction = transactions.find((t) => t.TransactionType === type && t.TransactionID.toString() === id);

      if (!transaction) {
        throw new Error(`Transaction not found: ${key}`);
      }

      const formData = form.getValues();

      return {
        TransactionType: type as "Invoice" | "Receipt",
        TransactionID: parseInt(id),
        PostingAmount: transaction.PostingAmount,
        DebitAccountID: parseInt(formData.debitAccountId),
        CreditAccountID: parseInt(formData.creditAccountId),
        Narration: formData.narration || transaction.BalanceNarration || "",
      };
    });
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

  // Form submission
  const onSubmit = async (data: PostingFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    if (selectedTransactions.size === 0) {
      toast.error("Please select at least one transaction to post");
      return;
    }

    if (validationResult && !validationResult.IsValid) {
      toast.error("Please resolve validation errors before posting");
      return;
    }

    setLoading(true);
    try {
      const selectedTxns = getSelectedTransactionObjects();

      const postingRequest: PostingRequest = {
        PostingDate: data.postingDate,
        DebitAccountID: parseInt(data.debitAccountId),
        CreditAccountID: parseInt(data.creditAccountId),
        Narration: data.narration,
        ReferenceNo: data.referenceNo,
        ExchangeRate: data.exchangeRate,
        CurrencyID: data.currencyId ? parseInt(data.currencyId) : undefined,
        CompanyID: parseInt(data.companyId),
        FiscalYearID: parseInt(data.fiscalYearId),
        SelectedTransactions: selectedTxns,
      };

      const result = await leaseRevenuePostingService.postSelectedTransactions(postingRequest);

      if (result.success) {
        toast.success(`Successfully posted ${result.PostedCount || selectedTxns.length} transactions`);

        if (result.FailedCount && result.FailedCount > 0) {
          toast.warning(`${result.FailedCount} transactions failed to post`);
        }

        navigate("/lease-revenue-posting");
      } else {
        toast.error(result.message || "Failed to post transactions");
      }
    } catch (error) {
      console.error("Error posting transactions:", error);
      toast.error("Failed to post transactions");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    form.reset({
      postingDate: new Date(),
      debitAccountId: "",
      creditAccountId: "",
      narration: "",
      referenceNo: "",
      exchangeRate: 1,
      companyId: form.getValues("companyId"),
      fiscalYearId: form.getValues("fiscalYearId"),
      currencyId: form.getValues("currencyId"),
    });
    setSelectedTransactions(new Set());
    setValidationResult(null);
  };

  // Calculate statistics
  const calculateStatistics = (): PostingStatistics => {
    const selectedTxnList = Array.from(selectedTransactions)
      .map((key) => {
        const [type, id] = key.split("-");
        return transactions.find((t) => t.TransactionType === type && t.TransactionID.toString() === id);
      })
      .filter(Boolean) as LeaseRevenueTransaction[];

    return {
      totalTransactions: transactions.length,
      selectedTransactions: selectedTransactions.size,
      totalAmount: transactions.reduce((sum, t) => sum + t.PostingAmount, 0),
      selectedAmount: selectedTxnList.reduce((sum, t) => sum + t.PostingAmount, 0),
      invoiceCount: selectedTxnList.filter((t) => t.TransactionType === "Invoice").length,
      receiptCount: selectedTxnList.filter((t) => t.TransactionType === "Receipt").length,
    };
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date for display
  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  // Render transaction type badge
  const renderTransactionTypeBadge = (transactionType: string) => {
    const config = {
      Invoice: { className: "bg-blue-100 text-blue-800", icon: Receipt },
      Receipt: { className: "bg-green-100 text-green-800", icon: DollarSign },
    };

    const typeConfig = config[transactionType as keyof typeof config] || config.Invoice;
    const Icon = typeConfig.icon;

    return (
      <Badge variant="outline" className={typeConfig.className}>
        <Icon className="w-3 h-3 mr-1" />
        {transactionType}
      </Badge>
    );
  };

  const stats = calculateStatistics();

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
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
                  <Building className="h-5 w-5 text-primary" />
                  Posting Configuration
                </CardTitle>
                <CardDescription>Configure the posting parameters and account mappings for selected transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company and Fiscal Year */}
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
                    description="Company for the posting entries"
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
                    description="Fiscal year for the posting entries"
                  />
                </div>

                {/* Posting Details */}
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField form={form} name="postingDate" label="Posting Date" type="date" required description="Date for the journal entries" />
                  <FormField form={form} name="exchangeRate" label="Exchange Rate" type="number" step="0.0001" placeholder="1.0000" description="Exchange rate to base currency" />
                </div>

                {/* Account Mapping */}
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Account Mapping</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      form={form}
                      name="debitAccountId"
                      label="Debit Account"
                      type="select"
                      options={accounts
                        .filter((acc) => acc.AccountCode.startsWith("1"))
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
                        .filter((acc) => acc.AccountCode.startsWith("4"))
                        .map((account) => ({
                          label: `${account.AccountCode} - ${account.AccountName}`,
                          value: account.AccountID.toString(),
                        }))}
                      placeholder="Select credit account"
                      required
                      description="Account to credit (typically Revenue account)"
                    />
                  </div>
                </div>

                {/* Additional Details */}
                <Separator />
                <div className="space-y-4">
                  <FormField
                    form={form}
                    name="narration"
                    label="Narration"
                    type="textarea"
                    placeholder="Enter posting narration"
                    description="Description for the journal entries"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField form={form} name="referenceNo" label="Reference Number" placeholder="Enter reference number" description="Optional reference for the posting" />
                    {currencies.length > 0 && (
                      <FormField
                        form={form}
                        name="currencyId"
                        label="Currency"
                        type="select"
                        options={currencies.map((currency) => ({
                          label: `${currency.CurrencyCode} - ${currency.CurrencyName}`,
                          value: currency.CurrencyID.toString(),
                        }))}
                        placeholder="Select currency"
                        description="Transaction currency"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Filters */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-primary" />
                      Transaction Filters
                    </CardTitle>
                    <CardDescription>Filter transactions to find specific items for posting</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
                      <Filter className="mr-2 h-4 w-4" />
                      {showAdvancedFilters ? "Hide" : "Show"} Advanced
                    </Button>
                    <Button type="button" variant="outline" onClick={handleFilterChange} disabled={transactionsLoading}>
                      {transactionsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Basic Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Property</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={filters.selectedPropertyId}
                        onChange={(e) => setFilters((prev) => ({ ...prev, selectedPropertyId: e.target.value }))}
                      >
                        <option value="">All Properties</option>
                        {properties.map((property) => (
                          <option key={property.PropertyID} value={property.PropertyID.toString()}>
                            {property.PropertyName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Customer</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={filters.selectedCustomerId}
                        onChange={(e) => setFilters((prev) => ({ ...prev, selectedCustomerId: e.target.value }))}
                      >
                        <option value="">All Customers</option>
                        {customers.map((customer) => (
                          <option key={customer.CustomerID} value={customer.CustomerID.toString()}>
                            {customer.CustomerFullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Advanced Filters */}
                  {showAdvancedFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Period From</label>
                        <input
                          type="date"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          value={filters.dateFrom ? format(filters.dateFrom, "yyyy-MM-dd") : ""}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              dateFrom: e.target.value ? new Date(e.target.value) : undefined,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Period To</label>
                        <input
                          type="date"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          value={filters.dateTo ? format(filters.dateTo, "yyyy-MM-dd") : ""}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              dateTo: e.target.value ? new Date(e.target.value) : undefined,
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Filter Actions */}
                  <div className="flex items-center gap-2">
                    <Button type="button" onClick={handleFilterChange} disabled={transactionsLoading}>
                      Apply Filters
                    </Button>
                    <Button type="button" variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Posting Summary
                </CardTitle>
                <CardDescription>Overview of transactions and amounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Available</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(stats.totalAmount)}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-muted-foreground">Selected</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{stats.selectedTransactions}</div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(stats.selectedAmount)}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-muted-foreground">Invoices</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{stats.invoiceCount}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-muted-foreground">Receipts</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{stats.receiptCount}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation Results */}
            {validationResult && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      {validationResult.IsValid ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                      Validation Results
                    </CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowValidationDetails(!showValidationDetails)}>
                      {showValidationDetails ? "Hide" : "Show"} Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Validation Status */}
                    <Alert className={validationResult.IsValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                      <AlertDescription>
                        <div className="font-medium">{validationResult.IsValid ? "Validation Passed" : "Validation Failed"}</div>
                        <div className="text-sm mt-1">
                          {validationResult.IsValid ? "All selected transactions are ready for posting." : "Please resolve the following issues before posting."}
                        </div>
                      </AlertDescription>
                    </Alert>

                    {/* Validation Details */}
                    {showValidationDetails && (
                      <div className="space-y-4">
                        {validationResult.Errors.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-red-600">Errors</h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {validationResult.Errors.map((error, index) => (
                                <li key={index} className="text-sm text-red-600">
                                  {error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {validationResult.Warnings.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-yellow-600">Warnings</h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {validationResult.Warnings.map((warning, index) => (
                                <li key={index} className="text-sm text-yellow-600">
                                  {warning}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction Selection */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-primary" />
                      Select Transactions
                    </CardTitle>
                    <CardDescription>Choose the transactions you want to post to the general ledger</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {stats.selectedTransactions} of {stats.totalTransactions} selected
                    </div>
                    {stats.selectedAmount > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(stats.selectedAmount)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No unposted transactions found.</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your filters or check back later.</p>
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={selectedTransactions.size === transactions.length && transactions.length > 0}
                              onCheckedChange={handleSelectAll}
                              aria-label="Select all transactions"
                            />
                          </TableHead>
                          <TableHead>Transaction</TableHead>
                          <TableHead>Property/Unit</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => {
                          const transactionKey = `${transaction.TransactionType}-${transaction.TransactionID}`;
                          const isSelected = selectedTransactions.has(transactionKey);

                          return (
                            <TableRow key={transactionKey} className={isSelected ? "bg-accent/50" : ""}>
                              <TableCell>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleSelectTransaction(transactionKey, checked as boolean)}
                                  aria-label={`Select transaction ${transaction.TransactionNo}`}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{transaction.TransactionNo}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  {renderTransactionTypeBadge(transaction.TransactionType)}
                                  <Calendar className="h-3 w-3 ml-2" />
                                  {formatDate(transaction.TransactionDate)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{transaction.Property}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Home className="h-3 w-3" />
                                  Unit: {transaction.UnitNo}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                  <span>{transaction.CustomerName}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {formatDate(transaction.StartDate)} - {formatDate(transaction.EndDate)}
                                </div>
                                <div className="text-xs text-muted-foreground">{transaction.TotalLeaseDays} days</div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="font-medium">{formatCurrency(transaction.PostingAmount)}</div>
                                {transaction.BalanceAmount !== transaction.PostingAmount && (
                                  <div className="text-xs text-muted-foreground">Balance: {formatCurrency(transaction.BalanceAmount)}</div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => navigate(`/lease-revenue-posting/details/${transaction.TransactionType}/${transaction.TransactionID}`)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View transaction details</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Form Actions */}
            <Card>
              <CardFooter className="flex justify-between pt-6">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => navigate("/lease-revenue-posting")} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
                <div className="flex gap-2">
                  {selectedTransactions.size > 0 && (
                    <Button type="button" variant="outline" onClick={() => setSelectedTransactions(new Set())} disabled={loading}>
                      Clear Selection
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      selectedTransactions.size === 0 ||
                      !form.watch("debitAccountId") ||
                      !form.watch("creditAccountId") ||
                      (validationResult && !validationResult.IsValid)
                    }
                  >
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
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </TooltipProvider>
  );
};

export default LeaseRevenuePostingForm;
