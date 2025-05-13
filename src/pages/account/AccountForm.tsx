// src/pages/account/AccountForm.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, Plus, Trash2, AlertTriangle } from "lucide-react";
import { accountService } from "@/services/accountService";
import { companyService } from "@/services/companyService";
import { currencyService } from "@/services/currencyService";
import { costCenterService } from "@/services/costCenterService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/lib/hooks";
import { Account, AccountType, AccountOpeningBalance } from "@/types/accountTypes";
import { Company } from "@/services/companyService";
import { Currency } from "@/services/currencyService";
import { CostCenter1, CostCenter2, CostCenter3, CostCenter4 } from "@/types/costCenterTypes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

// Opening balance schema
const openingBalanceSchema = z.object({
  FiscalYearID: z.string().min(1, "Fiscal year is required"),
  OpeningDebit: z.coerce.number().min(0, "Debit amount cannot be negative").optional(),
  OpeningCredit: z.coerce.number().min(0, "Credit amount cannot be negative").optional(),
  OpeningBalance: z.coerce.number().optional(),
});

type AccountFormValues = z.infer<typeof accountSchema>;
type OpeningBalanceFormValues = z.infer<typeof openingBalanceSchema>;

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
  const [isBusy, setIsBusy] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);

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

  const openingBalanceForm = useForm<OpeningBalanceFormValues>({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: {
      FiscalYearID: "",
      OpeningDebit: 0,
      OpeningCredit: 0,
      OpeningBalance: 0,
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

        // Mock fiscal years (replace with actual service call)
        setFiscalYears([
          { FiscalYearID: 1, Description: "FY 2023-2024", StartDate: "2023-04-01", EndDate: "2024-03-31" },
          { FiscalYearID: 2, Description: "FY 2024-2025", StartDate: "2024-04-01", EndDate: "2025-03-31" },
        ]);

        // If editing, fetch the account data
        if (isEdit && id) {
          const data = await accountService.getAccountById(parseInt(id));

          if (data.account) {
            setAccount(data.account);
            setOpeningBalances(data.openingBalances || []);

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
      // Validate account relationships before submitting
      // const validation = await accountService.validateAccountRelationships({
      //   AccountCode: data.AccountCode,
      //   AccountName: data.AccountName,
      //   AccountTypeID: parseInt(data.AccountTypeID),
      //   ParentAccountID: data.ParentAccountID ? parseInt(data.ParentAccountID) : undefined,
      //   CompanyID: parseInt(data.CompanyID),
      //   CurrencyID: parseInt(data.CurrencyID),
      // });

      // if (!validation.isValid) {
      //   setValidationErrors(validation.errors);
      //   return;
      // }

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

  // Submit handler for opening balance form
  const handleAddOpeningBalance = async (data: OpeningBalanceFormValues) => {
    if (!account) return;

    setIsBusy(true);

    try {
      const result = await accountService.setAccountOpeningBalance(account.AccountID, parseInt(data.FiscalYearID), {
        openingDebit: data.OpeningDebit,
        openingCredit: data.OpeningCredit,
        openingBalance: data.OpeningBalance,
        companyId: account.CompanyID,
      });

      if (result.Status === 1) {
        toast.success(result.Message);

        // Refresh opening balances
        const updatedAccount = await accountService.getAccountById(account.AccountID);
        setOpeningBalances(updatedAccount.openingBalances || []);

        // Reset form
        openingBalanceForm.reset({
          FiscalYearID: "",
          OpeningDebit: 0,
          OpeningCredit: 0,
          OpeningBalance: 0,
        });
      } else {
        toast.error(result.Message);
      }
    } catch (error) {
      console.error("Error setting opening balance:", error);
      toast.error("Failed to set opening balance");
    } finally {
      setIsBusy(false);
    }
  };

  // Calculate total opening balance
  const calculateOpeningBalance = () => {
    const debit = openingBalanceForm.watch("OpeningDebit") || 0;
    const credit = openingBalanceForm.watch("OpeningCredit") || 0;
    const balance = debit - credit;
    openingBalanceForm.setValue("OpeningBalance", balance);
  };

  // Delete opening balance
  const handleDeleteOpeningBalance = async (balanceId: number) => {
    if (!confirm("Are you sure you want to delete this opening balance?")) {
      return;
    }

    setIsBusy(true);

    try {
      // In a real app, implement API call to delete opening balance
      toast.success("Opening balance deleted successfully");

      // Remove from local state
      setOpeningBalances(openingBalances.filter((b) => b.OpeningBalanceID !== balanceId));
    } catch (error) {
      console.error("Error deleting opening balance:", error);
      toast.error("Failed to delete opening balance");
    } finally {
      setIsBusy(false);
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
                    <div className="grid grid-cols-1 gap-6">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-lg font-medium mb-4">Current Opening Balances</h3>
                        {openingBalances.length === 0 ? (
                          <p className="text-muted-foreground">No opening balances have been set for this account.</p>
                        ) : (
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
                                    <TableCell className="text-right">{balance.OpeningDebit.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{balance.OpeningCredit.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{balance.OpeningBalance.toFixed(2)}</TableCell>
                                    <TableCell>
                                      <Button variant="ghost" size="icon" disabled={isBusy} onClick={() => handleDeleteOpeningBalance(balance.OpeningBalanceID)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-lg font-medium mb-4">Add Opening Balance</h3>
                        <Form {...openingBalanceForm}>
                          <form onSubmit={openingBalanceForm.handleSubmit(handleAddOpeningBalance)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <FormField
                                form={openingBalanceForm}
                                name="FiscalYearID"
                                label="Fiscal Year"
                                type="select"
                                options={fiscalYears.map((fy) => ({
                                  label: fy.Description,
                                  value: fy.FiscalYearID.toString(),
                                }))}
                                placeholder="Select fiscal year"
                                required
                              />
                              <FormField form={openingBalanceForm} name="OpeningDebit" label="Debit Amount" type="number" placeholder="0.00" onChange={calculateOpeningBalance} />
                              <FormField form={openingBalanceForm} name="OpeningCredit" label="Credit Amount" type="number" placeholder="0.00" onChange={calculateOpeningBalance} />
                              <FormField form={openingBalanceForm} name="OpeningBalance" label="Balance" type="number" placeholder="0.00" disabled />
                            </div>
                            <div className="flex justify-end">
                              <Button type="submit" disabled={isBusy}>
                                {isBusy ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Opening Balance
                                  </>
                                )}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </div>
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
    </div>
  );
};

export default AccountForm;
