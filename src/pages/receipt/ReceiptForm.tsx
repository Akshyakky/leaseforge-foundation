// src/pages/receipt/ReceiptForm.tsx - Updated for stored procedure alignment
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, RotateCcw, Calculator, Receipt, AlertCircle } from "lucide-react";
import { receiptService, LeaseReceipt, PaymentType, PaymentStatus } from "@/services/receiptService";
import { customerService } from "@/services/customerService";
import { invoiceService } from "@/services/invoiceService";
import { companyService } from "@/services/companyService";
import { currencyService } from "@/services/currencyService";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "@/lib/hooks";
import { PAYMENT_TYPE_CONFIG } from "@/types/receiptTypes";

// Enhanced schema with conditional validation based on payment type
const receiptSchema = z
  .object({
    ReceiptNo: z.string().optional(),
    ReceiptDate: z.date().default(() => new Date()),
    LeaseInvoiceID: z.string().optional(),
    CustomerID: z.string().min(1, "Customer is required"),
    CompanyID: z.string().min(1, "Company is required"),
    FiscalYearID: z.string().min(1, "Fiscal year is required"),
    PaymentType: z.string().min(1, "Payment type is required"),
    PaymentStatus: z.string().default(PaymentStatus.RECEIVED),
    ReceivedAmount: z.number().min(0.01, "Amount must be greater than 0"),
    CurrencyID: z.string().optional(),
    ExchangeRate: z.number().min(0, "Exchange rate must be positive").default(1),
    BankID: z.string().optional(),
    BankAccountNo: z.string().optional(),
    ChequeNo: z.string().optional(),
    ChequeDate: z.date().optional().nullable(),
    TransactionReference: z.string().optional(),
    DepositedBankID: z.string().optional(),
    DepositDate: z.date().optional().nullable(),
    ClearanceDate: z.date().optional().nullable(),
    IsAdvancePayment: z.boolean().default(false),
    SecurityDepositAmount: z.number().min(0, "Security deposit must be positive").default(0),
    PenaltyAmount: z.number().min(0, "Penalty amount must be positive").default(0),
    DiscountAmount: z.number().min(0, "Discount amount must be positive").default(0),
    ReceivedByUserID: z.string().optional(),
    AccountID: z.string().optional(),
    Notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validate cheque-specific fields
      if (data.PaymentType === PaymentType.CHEQUE) {
        return data.ChequeNo && data.ChequeNo.trim().length > 0;
      }
      return true;
    },
    {
      message: "Cheque number is required for cheque payments",
      path: ["ChequeNo"],
    }
  )
  .refine(
    (data) => {
      // Validate bank transfer reference
      if (data.PaymentType === PaymentType.BANK_TRANSFER) {
        return data.TransactionReference && data.TransactionReference.trim().length > 0;
      }
      return true;
    },
    {
      message: "Transaction reference is required for bank transfers",
      path: ["TransactionReference"],
    }
  )
  .refine(
    (data) => {
      // Validate advance payment logic
      if (data.IsAdvancePayment && data.LeaseInvoiceID && data.LeaseInvoiceID !== "0") {
        return false;
      }
      return true;
    },
    {
      message: "Advance payments cannot be linked to a specific invoice",
      path: ["LeaseInvoiceID"],
    }
  );

type ReceiptFormValues = z.infer<typeof receiptSchema>;

interface ReceiptFormProps {}

const ReceiptForm: React.FC<ReceiptFormProps> = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [receipt, setReceipt] = useState<LeaseReceipt | null>(null);
  const [formError, setFormError] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Reference data
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Payment type options
  const paymentTypeOptions = Object.values(PaymentType);
  const paymentStatusOptions = Object.values(PaymentStatus);

  // Initialize form
  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    mode: "onChange",
    defaultValues: {
      ReceiptNo: "",
      ReceiptDate: new Date(),
      LeaseInvoiceID: "",
      CustomerID: "",
      CompanyID: "",
      FiscalYearID: "",
      PaymentType: PaymentType.CASH,
      PaymentStatus: PaymentStatus.RECEIVED,
      ReceivedAmount: 0,
      CurrencyID: "",
      ExchangeRate: 1,
      BankID: "",
      BankAccountNo: "",
      ChequeNo: "",
      ChequeDate: null,
      TransactionReference: "",
      DepositedBankID: "",
      DepositDate: null,
      ClearanceDate: null,
      IsAdvancePayment: false,
      SecurityDepositAmount: 0,
      PenaltyAmount: 0,
      DiscountAmount: 0,
      ReceivedByUserID: "",
      AccountID: "",
      Notes: "",
    },
  });

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        setValidationErrors([]);

        // Fetch reference data in parallel
        const [customersData, invoicesData, companiesData, currenciesData] = await Promise.all([
          customerService.getAllCustomers(),
          invoiceService.getAllInvoices(),
          companyService.getAllCompanies(),
          currencyService.getAllCurrencies(),
        ]);

        setCustomers(customersData);
        setInvoices(invoicesData);
        setCompanies(companiesData);
        setCurrencies(currenciesData);

        // Mock fiscal years, banks, and accounts (replace with actual service calls)
        setFiscalYears([
          { FiscalYearID: 1, FYDescription: "2024-2025" },
          { FiscalYearID: 2, FYDescription: "2023-2024" },
        ]);

        setBanks([
          { BankID: 1, BankName: "First National Bank" },
          { BankID: 2, BankName: "City Bank" },
          { BankID: 3, BankName: "Commercial Bank" },
        ]);

        setAccounts([
          { AccountID: 1, AccountName: "Cash Account", AccountCode: "1001" },
          { AccountID: 2, AccountName: "Checking Account - FNB", AccountCode: "1002" },
          { AccountID: 3, AccountName: "Savings Account - City Bank", AccountCode: "1003" },
        ]);

        // Set default values
        const defaultCompany = companiesData.find((c) => c.IsActive); // c.IsDefault ||
        const defaultCurrency = currenciesData.find((c) => c.IsDefault);
        const defaultAccount = accounts.find((a) => a.AccountName.toLowerCase().includes("cash"));

        if (defaultCompany) {
          form.setValue("CompanyID", defaultCompany.CompanyID.toString());
        }

        if (defaultCurrency) {
          form.setValue("CurrencyID", defaultCurrency.CurrencyID.toString());
        }

        if (defaultAccount) {
          form.setValue("AccountID", defaultAccount.AccountID.toString());
        }

        // Set default fiscal year
        if (fiscalYears.length > 0) {
          form.setValue("FiscalYearID", fiscalYears[0].FiscalYearID.toString());
        }

        // If editing, fetch the receipt data
        if (isEdit && id) {
          const receiptData = await receiptService.getReceiptById(parseInt(id));

          if (receiptData) {
            setReceipt(receiptData);

            // Check if receipt can be edited
            if (receiptData.IsPosted || receiptData.PaymentStatus === PaymentStatus.REVERSED) {
              setValidationErrors([`Cannot edit ${receiptData.IsPosted ? "posted" : "reversed"} receipt`]);
            }

            // Format data for form
            const formattedReceipt = {
              ...receiptData,
              ReceiptDate: receiptData.ReceiptDate ? new Date(receiptData.ReceiptDate) : new Date(),
              ChequeDate: receiptData.ChequeDate ? new Date(receiptData.ChequeDate) : null,
              DepositDate: receiptData.DepositDate ? new Date(receiptData.DepositDate) : null,
              ClearanceDate: receiptData.ClearanceDate ? new Date(receiptData.ClearanceDate) : null,
              LeaseInvoiceID: receiptData.LeaseInvoiceID?.toString() || "",
              CustomerID: receiptData.CustomerID?.toString() || "",
              CompanyID: receiptData.CompanyID?.toString() || "",
              FiscalYearID: receiptData.FiscalYearID?.toString() || "",
              CurrencyID: receiptData.CurrencyID?.toString() || "",
              BankID: receiptData.BankID?.toString() || "",
              DepositedBankID: receiptData.DepositedBankID?.toString() || "",
              ReceivedByUserID: receiptData.ReceivedByUserID?.toString() || "",
              AccountID: receiptData.AccountID?.toString() || "",
            };

            // Set form values
            form.reset(formattedReceipt);
          } else {
            toast.error("Receipt not found");
            navigate("/receipts");
          }
        }
      } catch (error) {
        console.error("Error initializing form:", error);
        toast.error("Error loading form data");
        setFormError("Failed to load form data. Please refresh the page.");
      } finally {
        setInitialLoading(false);
      }
    };

    initializeForm();
  }, [id, isEdit, navigate, form]);

  // Effect to handle conditional field requirements and auto-calculations
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Auto-fill customer when invoice is selected
      if (name && name.includes("LeaseInvoiceID")) {
        const invoiceId = form.getValues("LeaseInvoiceID");
        if (invoiceId && invoiceId !== "0") {
          const selectedInvoice = invoices.find((inv) => inv.LeaseInvoiceID.toString() === invoiceId);
          if (selectedInvoice) {
            form.setValue("CustomerID", selectedInvoice.CustomerID.toString());
            // Suggest the balance amount for non-edit mode
            if (!isEdit && selectedInvoice.BalanceAmount > 0) {
              form.setValue("ReceivedAmount", selectedInvoice.BalanceAmount);
            }
            // Clear advance payment flag when invoice is selected
            form.setValue("IsAdvancePayment", false);
          }
        }
      }

      // Handle advance payment logic
      if (name && name.includes("IsAdvancePayment")) {
        const isAdvance = form.getValues("IsAdvancePayment");
        if (isAdvance) {
          form.setValue("LeaseInvoiceID", "");
        }
      }

      // Handle payment type changes - clear related fields
      if (name && name.includes("PaymentType")) {
        const paymentType = form.getValues("PaymentType") as PaymentType;
        const config = PAYMENT_TYPE_CONFIG[paymentType];

        if (!config.requiresChequeDetails) {
          form.setValue("ChequeNo", "");
          form.setValue("ChequeDate", null);
        }

        if (!config.requiresTransactionRef) {
          form.setValue("TransactionReference", "");
        }

        if (!config.requiresBank) {
          form.setValue("BankID", "");
        }
      }

      // Set received by user to current user if not set
      if (name && name.includes("CustomerID") && !form.getValues("ReceivedByUserID") && user?.userID) {
        form.setValue("ReceivedByUserID", user.userID.toString());
      }
    });

    return () => subscription.unsubscribe();
  }, [form, invoices, isEdit, user]);

  // Handle form submission
  const onSubmit = async (data: ReceiptFormValues) => {
    setFormError("");
    setValidationErrors([]);

    if (!user) {
      setFormError("User information not available");
      toast.error("User information not available");
      return;
    }

    setLoading(true);

    try {
      // Prepare receipt data according to stored procedure requirements
      const receiptData = {
        receipt: {
          ReceiptNo: data.ReceiptNo || undefined, // Let stored procedure auto-generate if empty
          ReceiptDate: data.ReceiptDate,
          LeaseInvoiceID: data.LeaseInvoiceID && data.LeaseInvoiceID !== "0" ? parseInt(data.LeaseInvoiceID) : undefined,
          CustomerID: parseInt(data.CustomerID),
          CompanyID: parseInt(data.CompanyID),
          FiscalYearID: parseInt(data.FiscalYearID),
          PaymentType: data.PaymentType,
          PaymentStatus: data.PaymentStatus,
          ReceivedAmount: data.ReceivedAmount,
          CurrencyID: data.CurrencyID && data.CurrencyID !== "0" ? parseInt(data.CurrencyID) : undefined,
          ExchangeRate: data.ExchangeRate,
          BankID: data.BankID && data.BankID !== "0" ? parseInt(data.BankID) : undefined,
          BankAccountNo: data.BankAccountNo,
          ChequeNo: data.ChequeNo,
          ChequeDate: data.ChequeDate,
          TransactionReference: data.TransactionReference,
          DepositedBankID: data.DepositedBankID && data.DepositedBankID !== "0" ? parseInt(data.DepositedBankID) : undefined,
          DepositDate: data.DepositDate,
          ClearanceDate: data.ClearanceDate,
          IsAdvancePayment: data.IsAdvancePayment,
          SecurityDepositAmount: data.SecurityDepositAmount,
          PenaltyAmount: data.PenaltyAmount,
          DiscountAmount: data.DiscountAmount,
          ReceivedByUserID: data.ReceivedByUserID && data.ReceivedByUserID !== "0" ? parseInt(data.ReceivedByUserID) : undefined,
          AccountID: data.AccountID && data.AccountID !== "0" ? parseInt(data.AccountID) : undefined,
          Notes: data.Notes,
        },
      };

      if (isEdit && receipt) {
        // Update existing receipt
        const response = await receiptService.updateReceipt({
          receipt: {
            ...receiptData.receipt,
            LeaseReceiptID: receipt.LeaseReceiptID,
          },
        });

        if (response.Status === 1) {
          toast.success("Receipt updated successfully");
          navigate(`/receipts/${receipt.LeaseReceiptID}`);
        } else {
          setFormError(response.Message || "Failed to update receipt");
          toast.error(response.Message || "Failed to update receipt");
        }
      } else {
        // Create new receipt
        const response = await receiptService.createReceipt(receiptData);

        if (response.Status === 1 && response.NewReceiptID) {
          toast.success("Receipt created successfully");
          navigate(`/receipts/${response.NewReceiptID}`);
        } else {
          setFormError(response.Message || "Failed to create receipt");
          toast.error(response.Message || "Failed to create receipt");
        }
      }
    } catch (error) {
      console.error("Error saving receipt:", error);
      const errorMessage = "Failed to save receipt";
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle form errors
  const onError = (errors: any) => {
    console.log("Form validation errors:", errors);
    const errorMessages = Object.values(errors)
      .map((error: any) => error.message)
      .filter(Boolean);
    setValidationErrors(errorMessages);
    setFormError("Please fix the validation errors before submitting");
    toast.error("Please fix the validation errors before submitting");
  };

  // Reset form
  const handleReset = () => {
    setFormError("");
    setValidationErrors([]);
    if (isEdit && receipt) {
      form.reset();
    } else {
      form.reset({
        ReceiptNo: "",
        ReceiptDate: new Date(),
        LeaseInvoiceID: "",
        CustomerID: "",
        CompanyID: "",
        FiscalYearID: "",
        PaymentType: PaymentType.CASH,
        PaymentStatus: PaymentStatus.RECEIVED,
        ReceivedAmount: 0,
        CurrencyID: "",
        ExchangeRate: 1,
        BankID: "",
        BankAccountNo: "",
        ChequeNo: "",
        ChequeDate: null,
        TransactionReference: "",
        DepositedBankID: "",
        DepositDate: null,
        ClearanceDate: null,
        IsAdvancePayment: false,
        SecurityDepositAmount: 0,
        PenaltyAmount: 0,
        DiscountAmount: 0,
        ReceivedByUserID: "",
        AccountID: "",
        Notes: "",
      });
    }
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "0.00";
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Get filtered invoices for customer
  const getFilteredInvoices = () => {
    const customerId = form.watch("CustomerID");
    if (!customerId) return [];

    return invoices.filter(
      (invoice) => invoice.CustomerID.toString() === customerId && invoice.BalanceAmount > 0 // Only show invoices with outstanding balance
    );
  };

  const watchedPaymentType = form.watch("PaymentType");
  const watchedIsAdvancePayment = form.watch("IsAdvancePayment");
  const watchedReceivedAmount = form.watch("ReceivedAmount");
  const watchedCustomerId = form.watch("CustomerID");

  // Get payment type configuration
  const paymentTypeConfig = PAYMENT_TYPE_CONFIG[watchedPaymentType as PaymentType] || PAYMENT_TYPE_CONFIG[PaymentType.CASH];

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
        <Button variant="outline" size="icon" onClick={() => navigate("/receipts")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Receipt" : "Create Receipt"}</h1>
        {receipt && (
          <Badge variant="outline" className="ml-4">
            {receipt.ReceiptNo}
          </Badge>
        )}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Form Error */}
      {formError && !validationErrors.length && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onError)}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{isEdit ? "Edit Receipt" : "Create New Receipt"}</CardTitle>
                <CardDescription>
                  {isEdit ? "Update receipt information" : "Enter receipt details"}
                  {!isEdit && " - Receipt number will be auto-generated if left empty"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="ReceiptNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receipt No.</FormLabel>
                        <FormControl>
                          <Input placeholder="Auto-generated if left empty" {...field} />
                        </FormControl>
                        <FormDescription>Optional. Leave blank for auto-generated receipt number.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ReceiptDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Receipt Date *</FormLabel>
                        <FormControl>
                          <DatePicker value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Customer and Company */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="CustomerID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.CustomerID} value={customer.CustomerID.toString()}>
                                {customer.CustomerFullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="CompanyID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a company" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companies.map((company) => (
                              <SelectItem key={company.CompanyID} value={company.CompanyID.toString()}>
                                {company.CompanyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Fiscal Year and Cash/Bank Account */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="FiscalYearID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fiscal Year *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fiscal year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {fiscalYears.map((fy) => (
                              <SelectItem key={fy.FiscalYearID} value={fy.FiscalYearID.toString()}>
                                {fy.FYDescription}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="AccountID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cash/Bank Account</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem key={account.AccountID} value={account.AccountID.toString()}>
                                {account.AccountName} ({account.AccountCode})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Account where the payment will be deposited</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Invoice Selection and Advance Payment */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="IsAdvancePayment"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Advance Payment</FormLabel>
                          <FormDescription>Check this if the payment is an advance payment not against a specific invoice.</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {!watchedIsAdvancePayment && (
                    <FormField
                      control={form.control}
                      name="LeaseInvoiceID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange} disabled={!watchedCustomerId}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an invoice" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">No Specific Invoice</SelectItem>
                              {getFilteredInvoices().map((invoice) => (
                                <SelectItem key={invoice.LeaseInvoiceID} value={invoice.LeaseInvoiceID.toString()}>
                                  {invoice.InvoiceNo} - Balance: {formatCurrency(invoice.BalanceAmount)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Select the invoice this payment is for, or leave unspecified</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <Separator />

                {/* Payment Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Payment Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="PaymentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Type *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentTypeOptions.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="PaymentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Status *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentStatusOptions
                                .filter((status) => status !== PaymentStatus.REVERSED) // Don't allow setting as reversed
                                .map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ReceivedAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Received Amount *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Conditional Payment Details */}
                {paymentTypeConfig.requiresChequeDetails && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Cheque Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="ChequeNo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cheque Number *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter cheque number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="ChequeDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Cheque Date</FormLabel>
                              <FormControl>
                                <DatePicker value={field.value} onChange={field.onChange} placeholder="Select cheque date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="BankID"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank {paymentTypeConfig.requiresBank ? "*" : ""}</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select bank" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {banks.map((bank) => (
                                    <SelectItem key={bank.BankID} value={bank.BankID.toString()}>
                                      {bank.BankName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </>
                )}

                {paymentTypeConfig.requiresTransactionRef && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">{watchedPaymentType === PaymentType.BANK_TRANSFER ? "Bank Transfer Details" : "Transaction Details"}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="TransactionReference"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Transaction Reference *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter transaction reference" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {paymentTypeConfig.requiresBank && (
                          <FormField
                            control={form.control}
                            name="BankID"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bank *</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select bank" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {banks.map((bank) => (
                                      <SelectItem key={bank.BankID} value={bank.BankID.toString()}>
                                        {bank.BankName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Currency Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Currency Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="CurrencyID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencies.map((currency) => (
                                <SelectItem key={currency.CurrencyID} value={currency.CurrencyID.toString()}>
                                  {currency.CurrencyName} ({currency.CurrencyCode})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ExchangeRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exchange Rate</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.0001" placeholder="1.0000" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 1)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Additional Amounts */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Additional Amounts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="SecurityDepositAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Security Deposit</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="PenaltyAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Penalty Amount</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="DiscountAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Amount</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="Notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter any additional notes" className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Receipt Summary */}
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Calculator className="mr-2 h-5 w-5" />
                      Receipt Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Received Amount</div>
                      <div className="text-xl font-bold">{formatCurrency(watchedReceivedAmount)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Payment Type</div>
                      <Badge variant="outline" className="mt-1">
                        {watchedPaymentType}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Payment Method</div>
                      <div className="text-lg font-semibold">{watchedIsAdvancePayment ? "Advance Payment" : "Invoice Payment"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Total Amount</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(watchedReceivedAmount + form.watch("SecurityDepositAmount") + form.watch("PenaltyAmount") - form.watch("DiscountAmount"))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => navigate("/receipts")} disabled={loading}>
                  Cancel
                </Button>
                <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
              <Button type="submit" disabled={loading || !form.formState.isValid}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEdit ? "Update Receipt" : "Create Receipt"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ReceiptForm;
