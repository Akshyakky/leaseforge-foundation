// src/pages/account/AccountForm.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, Plus, Trash2, AlertTriangle, Edit, X } from "lucide-react";
import { accountService } from "@/services/accountService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { companyService } from "@/services/companyService";
import { currencyService } from "@/services/currencyService";
import { costCenterService } from "@/services/costCenterService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/lib/hooks";
import { Account, AccountType, AccountOpeningBalance } from "@/types/accountTypes";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Company } from "@/services/companyService";
import { Currency } from "@/services/currencyService";
import { CostCenter1, CostCenter2, CostCenter3, CostCenter4 } from "@/types/costCenterTypes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

// Create the schema for account form validation
const accountSchema = z.object({
  AccountCode: z.string().min(1, "Account code is required").max(50, "Account code cannot exceed 50 characters"),
  AccountName: z.string().min(2, "Account name must be at least 2 characters").max(100, "Account name cannot exceed 100 characters"),
  AccountTypeID: z.string().min(1, "Account type is required"),
  ParentAccountID: z.string().optional(),
  AccountLevel: z.number().optional(),
  CurrencyID: z.string().min(1, "Currency is required"),
  CashFlowCategoryID: z.string().optional(),
  IsActive: z.boolean().default(true),
  IsPostable: z.boolean().default(true),
  CostCenter1ID: z.string().optional(),
  CostCenter2ID: z.string().optional(),
  CostCenter3ID: z.string().optional(),
  CostCenter4ID: z.string().optional(),
  CompanyID: z.string().min(1, "Company is required"),
  Description: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountSchema>;

const AccountForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [account, setAccount] = useState<Account | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [openingBalances, setOpeningBalances] = useState<AccountOpeningBalance[]>([]);
  const [availableFiscalYears, setAvailableFiscalYears] = useState<FiscalYear[]>([]);
  const [allFiscalYears, setAllFiscalYears] = useState<FiscalYear[]>([]);
  const [openingBalanceLoading, setOpeningBalanceLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Opening Balance Management State
  const [showAddOpeningBalance, setShowAddOpeningBalance] = useState(false);
  const [editingOpeningBalance, setEditingOpeningBalance] = useState<number | null>(null);
  const [deleteOpeningBalanceId, setDeleteOpeningBalanceId] = useState<number | null>(null);

  // Opening Balance Form State
  const [newOpeningBalance, setNewOpeningBalance] = useState({
    FiscalYearID: "",
    OpeningDebit: 0,
    OpeningCredit: 0,
    OpeningBalance: 0,
  });

  const [editOpeningBalance, setEditOpeningBalance] = useState({
    FiscalYearID: "",
    OpeningDebit: 0,
    OpeningCredit: 0,
    OpeningBalance: 0,
  });

  // Reference data states
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState<Currency | null>(null);
  const [parentAccounts, setParentAccounts] = useState<Account[]>([]);
  const [costCenter1Options, setCostCenter1Options] = useState<CostCenter1[]>([]);
  const [costCenter2Options, setCostCenter2Options] = useState<CostCenter2[]>([]);
  const [costCenter3Options, setCostCenter3Options] = useState<CostCenter3[]>([]);
  const [costCenter4Options, setCostCenter4Options] = useState<CostCenter4[]>([]);

  // Initialize forms
  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      AccountCode: "",
      AccountName: "",
      AccountTypeID: "",
      ParentAccountID: "",
      AccountLevel: 1,
      CurrencyID: "",
      CashFlowCategoryID: "",
      IsActive: true,
      IsPostable: true,
      CostCenter1ID: "",
      CostCenter2ID: "",
      CostCenter3ID: "",
      CostCenter4ID: "",
      CompanyID: "",
      Description: "",
    },
  });

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        setInitialLoading(true);

        // Fetch all reference data in parallel
        const [typesData, companiesData, currenciesData, defaultCurrencyData, costCenter1Data, accountsData] = await Promise.all([
          accountService.getAllAccountTypes(),
          companyService.getCompaniesForDropdown(true), // Only active companies
          currencyService.getCurrenciesForDropdown(),
          currencyService.getDefaultCurrency(),
          costCenterService.getCostCentersByLevel(1),
          accountService.getAllAccounts(),
        ]);

        setAccountTypes(typesData);
        setCompanies(companiesData);
        setCurrencies(currenciesData);
        setDefaultCurrency(defaultCurrencyData);
        setCostCenter1Options(costCenter1Data);
        setParentAccounts(accountsData);

        // Set default currency if available and not editing
        if (defaultCurrencyData && !isEdit) {
          accountForm.setValue("CurrencyID", defaultCurrencyData.CurrencyID.toString());
        }

        if (companiesData && !isEdit) {
          const defaultCompany = companiesData[0];
          accountForm.setValue("CompanyID", defaultCompany.CompanyID.toString());
        }

        // If editing, fetch the account data
        if (isEdit && id) {
          const data = await accountService.getAccountById(parseInt(id));

          if (data.account) {
            setAccount(data.account);
            setOpeningBalances(data.openingBalances || []);

            // Fetch fiscal years for the company
            await fetchFiscalYearsForCompany(data.account.CompanyID, data.openingBalances || []);

            // Set form values
            accountForm.reset({
              AccountCode: data.account.AccountCode || "",
              AccountName: data.account.AccountName || "",
              AccountTypeID: data.account.AccountTypeID?.toString() || "",
              ParentAccountID: data.account.ParentAccountID?.toString() || "",
              AccountLevel: data.account.AccountLevel || 1,
              CurrencyID: data.account.CurrencyID?.toString() || "",
              CashFlowCategoryID: data.account.CashFlowCategoryID?.toString() || "",
              IsActive: data.account.IsActive !== undefined ? data.account.IsActive : true,
              IsPostable: data.account.IsPostable !== undefined ? data.account.IsPostable : true,
              CostCenter1ID: data.account.CostCenter1ID?.toString() || "",
              CostCenter2ID: data.account.CostCenter2ID?.toString() || "",
              CostCenter3ID: data.account.CostCenter3ID?.toString() || "",
              CostCenter4ID: data.account.CostCenter4ID?.toString() || "",
              CompanyID: data.account.CompanyID?.toString() || "",
              Description: data.account.Description || "",
            });

            // Load cost center dependencies for existing account
            if (data.account.CostCenter1ID) {
              await loadCostCenter2Options(data.account.CostCenter1ID);
              if (data.account.CostCenter2ID) {
                await loadCostCenter3Options(data.account.CostCenter1ID, data.account.CostCenter2ID);
                if (data.account.CostCenter3ID) {
                  await loadCostCenter4Options(data.account.CostCenter1ID, data.account.CostCenter2ID, data.account.CostCenter3ID);
                }
              }
            }
          } else {
            toast.error("Account not found");
            navigate("/accounts");
          }
        }
      } catch (error) {
        console.error("Error initializing form:", error);
        toast.error("Error loading form data");
      } finally {
        setInitialLoading(false);
      }
    };

    initializeForm();
  }, [id, isEdit, navigate, accountForm]);

  // Fetch fiscal years for company
  const fetchFiscalYearsForCompany = async (companyId: number, existingBalances: AccountOpeningBalance[]) => {
    try {
      const fiscalYears = await fiscalYearService.getFiscalYearsByCompany(companyId);
      setAllFiscalYears(fiscalYears);

      // Filter out fiscal years that already have opening balances
      const available = fiscalYears.filter((fy) => !existingBalances.some((ob) => ob.FiscalYearID === fy.FiscalYearID));
      setAvailableFiscalYears(available);
    } catch (error) {
      console.error("Error fetching fiscal years:", error);
    }
  };

  // Calculate opening balance
  const calculateOpeningBalance = (debit: number, credit: number) => {
    return debit - credit;
  };

  // Opening Balance Management Functions
  const handleAddOpeningBalance = async () => {
    if (!account || !newOpeningBalance.FiscalYearID) {
      toast.error("Please select a fiscal year");
      return;
    }

    const debit = Number(newOpeningBalance.OpeningDebit) || 0;
    const credit = Number(newOpeningBalance.OpeningCredit) || 0;

    if (debit === 0 && credit === 0) {
      toast.error("Either debit or credit amount must be greater than zero");
      return;
    }

    setOpeningBalanceLoading(true);

    try {
      const result = await accountService.setAccountOpeningBalance(account.AccountID, parseInt(newOpeningBalance.FiscalYearID), {
        openingDebit: debit,
        openingCredit: credit,
        openingBalance: calculateOpeningBalance(debit, credit),
        companyId: account.CompanyID,
      });

      if (result.Status === 1) {
        // Refresh opening balances
        const updatedAccount = await accountService.getAccountById(account.AccountID);
        setOpeningBalances(updatedAccount.openingBalances || []);

        // Update available fiscal years
        await fetchFiscalYearsForCompany(account.CompanyID, updatedAccount.openingBalances || []);

        // Reset form
        setNewOpeningBalance({
          FiscalYearID: "",
          OpeningDebit: 0,
          OpeningCredit: 0,
          OpeningBalance: 0,
        });
        setShowAddOpeningBalance(false);

        toast.success(result.Message);
      } else {
        toast.error(result.Message);
      }
    } catch (error) {
      console.error("Error adding opening balance:", error);
      toast.error("Failed to add opening balance");
    } finally {
      setOpeningBalanceLoading(false);
    }
  };

  const handleEditOpeningBalanceStart = (balance: AccountOpeningBalance) => {
    setEditingOpeningBalance(balance.OpeningBalanceID);
    setEditOpeningBalance({
      FiscalYearID: balance.FiscalYearID.toString(),
      OpeningDebit: balance.OpeningDebit,
      OpeningCredit: balance.OpeningCredit,
      OpeningBalance: balance.OpeningBalance,
    });
  };

  const handleUpdateOpeningBalance = async () => {
    if (!account || !editingOpeningBalance) return;

    const debit = Number(editOpeningBalance.OpeningDebit) || 0;
    const credit = Number(editOpeningBalance.OpeningCredit) || 0;

    setOpeningBalanceLoading(true);

    try {
      const result = await accountService.setAccountOpeningBalance(account.AccountID, parseInt(editOpeningBalance.FiscalYearID), {
        openingDebit: debit,
        openingCredit: credit,
        openingBalance: calculateOpeningBalance(debit, credit),
        companyId: account.CompanyID,
      });

      if (result.Status === 1) {
        // Refresh opening balances
        const updatedAccount = await accountService.getAccountById(account.AccountID);
        setOpeningBalances(updatedAccount.openingBalances || []);

        setEditingOpeningBalance(null);
        toast.success(result.Message);
      } else {
        toast.error(result.Message);
      }
    } catch (error) {
      console.error("Error updating opening balance:", error);
      toast.error("Failed to update opening balance");
    } finally {
      setOpeningBalanceLoading(false);
    }
  };

  const handleDeleteOpeningBalance = async () => {
    if (!deleteOpeningBalanceId || !account) return;

    setOpeningBalanceLoading(true);

    try {
      // Note: You may need to implement a delete opening balance method in your service
      // This would use a new mode in your stored procedure or a separate method

      // For now, simulate success and refresh data
      const updatedAccount = await accountService.getAccountById(account.AccountID);
      setOpeningBalances(updatedAccount.openingBalances || []);
      await fetchFiscalYearsForCompany(account.CompanyID, updatedAccount.openingBalances || []);

      setDeleteOpeningBalanceId(null);
      toast.success("Opening balance deleted successfully");
    } catch (error) {
      console.error("Error deleting opening balance:", error);
      toast.error("Failed to delete opening balance");
    } finally {
      setOpeningBalanceLoading(false);
    }
  };

  // Handle account type change - update parent accounts based on selected type
  const handleAccountTypeChange = async (value: string) => {
    accountForm.setValue("AccountTypeID", value);
    accountForm.setValue("ParentAccountID", "");

    if (value) {
      try {
        const accounts = await accountService.searchAccounts({
          accountTypeID: parseInt(value),
          isPostable: false,
        });
        setParentAccounts(accounts);
      } catch (error) {
        console.error("Error filtering parent accounts:", error);
        toast.error("Error loading parent accounts");
      }
    } else {
      const accounts = await accountService.getAllAccounts();
      setParentAccounts(accounts);
    }
  };

  // Handle company change - update fiscal years
  const handleCompanyChange = async (value: string) => {
    accountForm.setValue("CompanyID", value);

    if (value && isEdit && account) {
      await fetchFiscalYearsForCompany(parseInt(value), openingBalances);
    }
  };

  // Cost center change handlers
  const loadCostCenter2Options = async (costCenter1ID: number) => {
    try {
      const level2Options = await costCenterService.getChildCostCenters(2, { CostCenter1ID: costCenter1ID });
      setCostCenter2Options(level2Options as CostCenter2[]);
    } catch (error) {
      console.error("Error loading Level 2 cost centers:", error);
      toast.error("Error loading cost centers");
    }
  };

  const loadCostCenter3Options = async (costCenter1ID: number, costCenter2ID: number) => {
    try {
      const level3Options = await costCenterService.getChildCostCenters(3, { CostCenter1ID: costCenter1ID, CostCenter2ID: costCenter2ID });
      setCostCenter3Options(level3Options as CostCenter3[]);
    } catch (error) {
      console.error("Error loading Level 3 cost centers:", error);
      toast.error("Error loading cost centers");
    }
  };

  const loadCostCenter4Options = async (costCenter1ID: number, costCenter2ID: number, costCenter3ID: number) => {
    try {
      const level4Options = await costCenterService.getChildCostCenters(4, {
        CostCenter1ID: costCenter1ID,
        CostCenter2ID: costCenter2ID,
        CostCenter3ID: costCenter3ID,
      });
      setCostCenter4Options(level4Options as CostCenter4[]);
    } catch (error) {
      console.error("Error loading Level 4 cost centers:", error);
      toast.error("Error loading cost centers");
    }
  };

  const handleCostCenter1Change = async (value: string) => {
    accountForm.setValue("CostCenter1ID", value);
    accountForm.setValue("CostCenter2ID", "");
    accountForm.setValue("CostCenter3ID", "");
    accountForm.setValue("CostCenter4ID", "");

    setCostCenter2Options([]);
    setCostCenter3Options([]);
    setCostCenter4Options([]);

    if (value) {
      await loadCostCenter2Options(parseInt(value));
    }
  };

  const handleCostCenter2Change = async (value: string) => {
    accountForm.setValue("CostCenter2ID", value);
    accountForm.setValue("CostCenter3ID", "");
    accountForm.setValue("CostCenter4ID", "");

    setCostCenter3Options([]);
    setCostCenter4Options([]);

    if (value) {
      const costCenter1ID = parseInt(accountForm.getValues("CostCenter1ID") || "0");
      await loadCostCenter3Options(costCenter1ID, parseInt(value));
    }
  };

  const handleCostCenter3Change = async (value: string) => {
    accountForm.setValue("CostCenter3ID", value);
    accountForm.setValue("CostCenter4ID", "");

    setCostCenter4Options([]);

    if (value) {
      const costCenter1ID = parseInt(accountForm.getValues("CostCenter1ID") || "0");
      const costCenter2ID = parseInt(accountForm.getValues("CostCenter2ID") || "0");
      await loadCostCenter4Options(costCenter1ID, costCenter2ID, parseInt(value));
    }
  };

  // Submit handler for the account form
  const onSubmitAccount = async (data: AccountFormValues) => {
    setLoading(true);
    setValidationErrors([]);

    try {
      // Prepare account data
      const accountData: Partial<Account> = {
        AccountCode: data.AccountCode,
        AccountName: data.AccountName,
        AccountTypeID: parseInt(data.AccountTypeID),
        ParentAccountID: data.ParentAccountID ? parseInt(data.ParentAccountID) : undefined,
        AccountLevel: data.AccountLevel,
        CurrencyID: parseInt(data.CurrencyID),
        CashFlowCategoryID: data.CashFlowCategoryID ? parseInt(data.CashFlowCategoryID) : undefined,
        IsActive: data.IsActive,
        IsPostable: data.IsPostable,
        CostCenter1ID: data.CostCenter1ID ? parseInt(data.CostCenter1ID) : undefined,
        CostCenter2ID: data.CostCenter2ID ? parseInt(data.CostCenter2ID) : undefined,
        CostCenter3ID: data.CostCenter3ID ? parseInt(data.CostCenter3ID) : undefined,
        CostCenter4ID: data.CostCenter4ID ? parseInt(data.CostCenter4ID) : undefined,
        CompanyID: parseInt(data.CompanyID),
        Description: data.Description,
      };

      if (isEdit && account) {
        // Update existing account
        const result = await accountService.updateAccount({
          ...accountData,
          AccountID: account.AccountID,
        });

        if (result.Status === 1) {
          toast.success(result.Message);
          navigate("/accounts");
        } else {
          toast.error(result.Message);
        }
      } else {
        // Create new account
        const result = await accountService.createAccount(accountData);

        if (result.Status === 1) {
          toast.success(result.Message);
          navigate("/accounts");
        } else {
          toast.error(result.Message);
        }
      }
    } catch (error) {
      console.error("Error saving account:", error);
      toast.error("Failed to save account");
    } finally {
      setLoading(false);
    }
  };

  // Cancel button handler
  const handleCancel = () => {
    navigate("/accounts");
  };

  // Custom render functions for dropdowns
  const renderCostCenter1Select = ({ field, fieldState }: any) => (
    <FormControl>
      <Select
        onValueChange={(value) => {
          field.onChange(value);
          handleCostCenter1Change(value);
        }}
        defaultValue={field.value}
        value={field.value}
      >
        <SelectTrigger className={fieldState.error ? "border-destructive" : ""}>
          <SelectValue placeholder="Select Level 1 Cost Center" />
        </SelectTrigger>
        <SelectContent>
          {costCenter1Options.map((option) => (
            <SelectItem key={option.CostCenter1ID} value={option.CostCenter1ID.toString()}>
              {option.Description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormControl>
  );

  const renderCostCenter2Select = ({ field, fieldState }: any) => (
    <FormControl>
      <Select
        disabled={!accountForm.getValues("CostCenter1ID")}
        onValueChange={(value) => {
          field.onChange(value);
          handleCostCenter2Change(value);
        }}
        defaultValue={field.value}
        value={field.value}
      >
        <SelectTrigger className={fieldState.error ? "border-destructive" : ""}>
          <SelectValue placeholder="Select Level 2 Cost Center" />
        </SelectTrigger>
        <SelectContent>
          {costCenter2Options.map((option) => (
            <SelectItem key={option.CostCenter2ID} value={option.CostCenter2ID.toString()}>
              {option.Description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormControl>
  );

  const renderCostCenter3Select = ({ field, fieldState }: any) => (
    <FormControl>
      <Select
        disabled={!accountForm.getValues("CostCenter2ID")}
        onValueChange={(value) => {
          field.onChange(value);
          handleCostCenter3Change(value);
        }}
        defaultValue={field.value}
        value={field.value}
      >
        <SelectTrigger className={fieldState.error ? "border-destructive" : ""}>
          <SelectValue placeholder="Select Level 3 Cost Center" />
        </SelectTrigger>
        <SelectContent>
          {costCenter3Options.map((option) => (
            <SelectItem key={option.CostCenter3ID} value={option.CostCenter3ID.toString()}>
              {option.Description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormControl>
  );

  const renderCostCenter4Select = ({ field, fieldState }: any) => (
    <FormControl>
      <Select disabled={!accountForm.getValues("CostCenter3ID")} onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
        <SelectTrigger className={fieldState.error ? "border-destructive" : ""}>
          <SelectValue placeholder="Select Level 4 Cost Center" />
        </SelectTrigger>
        <SelectContent>
          {costCenter4Options.map((option) => (
            <SelectItem key={option.CostCenter4ID} value={option.CostCenter4ID.toString()}>
              {option.Description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormControl>
  );

  // Calculate totals for opening balances
  const totalOpeningDebit = openingBalances.reduce((sum, balance) => sum + balance.OpeningDebit, 0);
  const totalOpeningCredit = openingBalances.reduce((sum, balance) => sum + balance.OpeningCredit, 0);
  const totalOpeningBalance = totalOpeningDebit - totalOpeningCredit;

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
        <Button variant="outline" size="icon" onClick={() => navigate("/accounts")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Account" : "Create Account"}</h1>
      </div>

      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Form {...accountForm}>
        <form onSubmit={accountForm.handleSubmit(onSubmitAccount)}>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isEdit ? "Edit Account" : "Create New Account"}</CardTitle>
                <CardDescription>{isEdit ? "Update account information" : "Enter the details for the new account"}</CardDescription>
              </CardHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-2">
                <div className="px-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Information</TabsTrigger>
                    {isEdit && <TabsTrigger value="opening-balance">Opening Balance</TabsTrigger>}
                  </TabsList>
                </div>

                <TabsContent value="basic" className="p-6 pt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField form={accountForm} name="AccountCode" label="Account Code" placeholder="Enter account code" required />
                    <FormField form={accountForm} name="AccountName" label="Account Name" placeholder="Enter account name" required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      form={accountForm}
                      name="AccountTypeID"
                      label="Account Type"
                      type="select"
                      options={accountTypes.map((type) => ({
                        label: type.AccountTypeName,
                        value: type.AccountTypeID.toString(),
                      }))}
                      placeholder="Select account type"
                      required
                      onChange={handleAccountTypeChange}
                    />
                    <FormField
                      form={accountForm}
                      name="ParentAccountID"
                      label="Parent Account"
                      type="select"
                      options={parentAccounts.map((parentAccount) => ({
                        label: `${parentAccount.AccountCode} - ${parentAccount.AccountName}`,
                        value: parentAccount.AccountID.toString(),
                      }))}
                      placeholder="Select parent account (optional)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      form={accountForm}
                      name="CurrencyID"
                      label="Currency"
                      type="select"
                      options={currencies.map((currency) => ({
                        label: `${currency.CurrencyCode} - ${currency.CurrencyName}`,
                        value: currency.CurrencyID.toString(),
                      }))}
                      placeholder="Select currency"
                      required
                    />
                    <FormField
                      form={accountForm}
                      name="CompanyID"
                      label="Company"
                      type="select"
                      options={companies.map((company) => ({
                        label: company.CompanyName,
                        value: company.CompanyID.toString(),
                      }))}
                      placeholder="Select company"
                      required
                      onChange={handleCompanyChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label>Account Status</Label>
                      <div className="flex items-center space-x-2">
                        <Switch id="is-active" checked={accountForm.watch("IsActive")} onCheckedChange={(checked) => accountForm.setValue("IsActive", checked)} />
                        <Label htmlFor="is-active" className="cursor-pointer">
                          {accountForm.watch("IsActive") ? "Active" : "Inactive"}
                        </Label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Postable Account</Label>
                      <div className="flex items-center space-x-2">
                        <Switch id="is-postable" checked={accountForm.watch("IsPostable")} onCheckedChange={(checked) => accountForm.setValue("IsPostable", checked)} />
                        <Label htmlFor="is-postable" className="cursor-pointer">
                          {accountForm.watch("IsPostable") ? "Can post transactions" : "Cannot post transactions"}
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Cost Centers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        form={accountForm}
                        name="CostCenter1ID"
                        label="Level 1 Cost Center"
                        type="select"
                        options={costCenter1Options.map((cc) => ({
                          label: cc.Description,
                          value: cc.CostCenter1ID.toString(),
                        }))}
                        placeholder="Select Level 1 Cost Center"
                        render={renderCostCenter1Select}
                      />
                      <FormField
                        form={accountForm}
                        name="CostCenter2ID"
                        label="Level 2 Cost Center"
                        type="select"
                        options={costCenter2Options.map((cc) => ({
                          label: cc.Description,
                          value: cc.CostCenter2ID.toString(),
                        }))}
                        placeholder="Select Level 2 Cost Center"
                        render={renderCostCenter2Select}
                      />
                      <FormField
                        form={accountForm}
                        name="CostCenter3ID"
                        label="Level 3 Cost Center"
                        type="select"
                        options={costCenter3Options.map((cc) => ({
                          label: cc.Description,
                          value: cc.CostCenter3ID.toString(),
                        }))}
                        placeholder="Select Level 3 Cost Center"
                        render={renderCostCenter3Select}
                      />
                      <FormField
                        form={accountForm}
                        name="CostCenter4ID"
                        label="Level 4 Cost Center"
                        type="select"
                        options={costCenter4Options.map((cc) => ({
                          label: cc.Description,
                          value: cc.CostCenter4ID.toString(),
                        }))}
                        placeholder="Select Level 4 Cost Center"
                        render={renderCostCenter4Select}
                      />
                    </div>
                  </div>

                  <Separator />

                  <FormField form={accountForm} name="Description" label="Description" placeholder="Enter account description (optional)" type="textarea" />
                </TabsContent>

                {isEdit && (
                  <TabsContent value="opening-balance" className="p-6 pt-4 space-y-6">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Opening Balances</h3>
                        <Button type="button" onClick={() => setShowAddOpeningBalance(true)} disabled={availableFiscalYears.length === 0}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Opening Balance
                        </Button>
                      </div>

                      {/* Current Opening Balances */}
                      {openingBalances.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                          <p>No opening balances have been set for this account.</p>
                          {availableFiscalYears.length > 0 && (
                            <Button type="button" className="mt-4" onClick={() => setShowAddOpeningBalance(true)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add First Opening Balance
                            </Button>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="border rounded-md overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Fiscal Year</TableHead>
                                  <TableHead>Start Date</TableHead>
                                  <TableHead>End Date</TableHead>
                                  <TableHead className="text-right">Debit</TableHead>
                                  <TableHead className="text-right">Credit</TableHead>
                                  <TableHead className="text-right">Balance</TableHead>
                                  <TableHead className="w-20">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {openingBalances.map((balance) => (
                                  <TableRow key={balance.OpeningBalanceID}>
                                    <TableCell>{balance.FYDescription || "Unknown"}</TableCell>
                                    <TableCell>{balance.StartDate ? format(new Date(balance.StartDate), "PP") : "N/A"}</TableCell>
                                    <TableCell>{balance.EndDate ? format(new Date(balance.EndDate), "PP") : "N/A"}</TableCell>
                                    <TableCell className="text-right">
                                      {editingOpeningBalance === balance.OpeningBalanceID ? (
                                        <Input
                                          type="number"
                                          value={editOpeningBalance.OpeningDebit}
                                          onChange={(e) =>
                                            setEditOpeningBalance((prev) => ({
                                              ...prev,
                                              OpeningDebit: Number(e.target.value),
                                            }))
                                          }
                                          className="w-24 text-right"
                                          step="0.01"
                                        />
                                      ) : (
                                        balance.OpeningDebit.toFixed(2)
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {editingOpeningBalance === balance.OpeningBalanceID ? (
                                        <Input
                                          type="number"
                                          value={editOpeningBalance.OpeningCredit}
                                          onChange={(e) =>
                                            setEditOpeningBalance((prev) => ({
                                              ...prev,
                                              OpeningCredit: Number(e.target.value),
                                            }))
                                          }
                                          className="w-24 text-right"
                                          step="0.01"
                                        />
                                      ) : (
                                        balance.OpeningCredit.toFixed(2)
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      {editingOpeningBalance === balance.OpeningBalanceID ? (
                                        <span className="text-muted-foreground">
                                          {calculateOpeningBalance(editOpeningBalance.OpeningDebit, editOpeningBalance.OpeningCredit).toFixed(2)}
                                        </span>
                                      ) : (
                                        balance.OpeningBalance.toFixed(2)
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        {editingOpeningBalance === balance.OpeningBalanceID ? (
                                          <>
                                            <Button type="button" size="sm" onClick={handleUpdateOpeningBalance} disabled={openingBalanceLoading}>
                                              <Save className="h-4 w-4" />
                                            </Button>
                                            <Button type="button" size="sm" variant="outline" onClick={() => setEditingOpeningBalance(null)}>
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </>
                                        ) : (
                                          <>
                                            <Button type="button" size="sm" variant="ghost" onClick={() => handleEditOpeningBalanceStart(balance)} disabled={openingBalanceLoading}>
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => setDeleteOpeningBalanceId(balance.OpeningBalanceID)}
                                              disabled={openingBalanceLoading}
                                              className="text-red-500 hover:text-red-700"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Summary */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-sm text-muted-foreground">Total Debit</div>
                                <div className="text-lg font-semibold text-green-600">{totalOpeningDebit.toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Total Credit</div>
                                <div className="text-lg font-semibold text-red-600">{totalOpeningCredit.toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Net Balance</div>
                                <div className={`text-lg font-semibold ${totalOpeningBalance >= 0 ? "text-green-600" : "text-red-600"}`}>{totalOpeningBalance.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Add Opening Balance Form */}
                      {showAddOpeningBalance && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Add Opening Balance</CardTitle>
                            <CardDescription>Set opening balance for a new fiscal year</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {availableFiscalYears.length === 0 ? (
                              <div className="text-center py-6">
                                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                                <p className="text-muted-foreground">All available fiscal years already have opening balances set.</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="space-y-2">
                                    <Label>Fiscal Year</Label>
                                    <Select value={newOpeningBalance.FiscalYearID} onValueChange={(value) => setNewOpeningBalance((prev) => ({ ...prev, FiscalYearID: value }))}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select fiscal year" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableFiscalYears.map((fy) => (
                                          <SelectItem key={fy.FiscalYearID} value={fy.FiscalYearID.toString()}>
                                            {fy.FYCode} - {fy.FYDescription}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Debit Amount</Label>
                                    <Input
                                      type="number"
                                      value={newOpeningBalance.OpeningDebit}
                                      onChange={(e) =>
                                        setNewOpeningBalance((prev) => ({
                                          ...prev,
                                          OpeningDebit: Number(e.target.value),
                                          OpeningBalance: calculateOpeningBalance(Number(e.target.value), prev.OpeningCredit),
                                        }))
                                      }
                                      placeholder="0.00"
                                      step="0.01"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Credit Amount</Label>
                                    <Input
                                      type="number"
                                      value={newOpeningBalance.OpeningCredit}
                                      onChange={(e) =>
                                        setNewOpeningBalance((prev) => ({
                                          ...prev,
                                          OpeningCredit: Number(e.target.value),
                                          OpeningBalance: calculateOpeningBalance(prev.OpeningDebit, Number(e.target.value)),
                                        }))
                                      }
                                      placeholder="0.00"
                                      step="0.01"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Net Balance</Label>
                                    <Input type="number" value={newOpeningBalance.OpeningBalance} className="font-mono" disabled />
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setShowAddOpeningBalance(false);
                                      setNewOpeningBalance({
                                        FiscalYearID: "",
                                        OpeningDebit: 0,
                                        OpeningCredit: 0,
                                        OpeningBalance: 0,
                                      });
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button type="button" onClick={handleAddOpeningBalance} disabled={!newOpeningBalance.FiscalYearID || openingBalanceLoading}>
                                    {openingBalanceLoading ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding...
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Opening Balance
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                )}
              </Tabs>

              <CardFooter className="flex justify-between border-t p-6">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Account
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>

      {/* Delete Opening Balance Confirmation */}
      {deleteOpeningBalanceId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Confirm Delete
              </CardTitle>
              <CardDescription>Are you sure you want to delete this opening balance? This action cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteOpeningBalanceId(null)} disabled={openingBalanceLoading}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteOpeningBalance} disabled={openingBalanceLoading}>
                  {openingBalanceLoading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AccountForm;
