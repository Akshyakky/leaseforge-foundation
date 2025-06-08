// src/pages/contractReceipt/ContractReceiptForm.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
  Receipt,
  Building,
  Users,
  DollarSign,
  Calendar,
  Calculator,
  AlertCircle,
  CheckCircle,
  Info,
  RotateCcw,
  PlusCircle,
  Send,
  CreditCard,
  Banknote,
} from "lucide-react";
import { leaseReceiptService } from "@/services/contractReceiptService";
import { contractInvoiceService } from "@/services/contractInvoiceService";
import { customerService } from "@/services/customerService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { currencyService } from "@/services/currencyService";
import { accountService } from "@/services/accountService";
import { bankService } from "@/services/bankService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { useAppSelector } from "@/lib/hooks";
import { format, addDays } from "date-fns";
import { ContractReceipt, ReceiptCreateRequest, ReceiptUpdateRequest, InvoiceAllocation, PAYMENT_TYPE, PAYMENT_STATUS, ALLOCATION_MODE } from "@/types/contractReceiptTypes";

// Enhanced schema for receipt form validation
const invoiceAllocationSchema = z.object({
  LeaseInvoiceID: z.number().min(1, "Invoice is required"),
  AllocationAmount: z.coerce.number().min(0.01, "Allocation amount must be greater than 0"),
  Notes: z.string().optional(),
});

const receiptSchema = z.object({
  ReceiptNo: z.string().optional(),
  CustomerID: z.string().min(1, "Customer is required"),
  CompanyID: z.string().min(1, "Company is required"),
  FiscalYearID: z.string().min(1, "Fiscal year is required"),
  ReceivedAmount: z.coerce.number().min(0.01, "Received amount must be greater than 0"),
  ReceiptDate: z.date().default(() => new Date()),
  PaymentType: z.string().min(1, "Payment type is required"),
  PaymentStatus: z.string().default(PAYMENT_STATUS.RECEIVED),
  CurrencyID: z.string().optional(),
  ExchangeRate: z.coerce.number().min(0.0001, "Exchange rate must be greater than 0").default(1),
  BankID: z.string().optional(),
  BankAccountNo: z.string().optional(),
  ChequeNo: z.string().optional(),
  ChequeDate: z.date().optional().nullable(),
  TransactionReference: z.string().optional(),
  DepositedBankID: z.string().optional(),
  DepositDate: z.date().optional().nullable(),
  ClearanceDate: z.date().optional().nullable(),
  IsAdvancePayment: z.boolean().default(false),
  SecurityDepositAmount: z.coerce.number().min(0).optional().default(0),
  PenaltyAmount: z.coerce.number().min(0).optional().default(0),
  DiscountAmount: z.coerce.number().min(0).optional().default(0),
  ReceivedByUserID: z.string().optional(),
  AccountID: z.string().optional(),
  Notes: z.string().optional(),

  // Allocation settings
  AllocationMode: z.string().default(ALLOCATION_MODE.SINGLE),
  LeaseInvoiceID: z.string().optional(),

  // Auto-posting options
  AutoPost: z.boolean().default(false),
  PostingDate: z.date().optional().nullable(),
  DebitAccountID: z.string().optional(),
  CreditAccountID: z.string().optional(),
  PostingNarration: z.string().optional(),
  PostingReference: z.string().optional(),

  // Multiple allocations
  invoiceAllocations: z.array(invoiceAllocationSchema).optional(),
});

type ReceiptFormValues = z.infer<typeof receiptSchema>;

const ContractReceiptForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [receipt, setReceipt] = useState<ContractReceipt | null>(null);

  // Reference data
  const [customers, setCustomers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [availableInvoices, setAvailableInvoices] = useState<any[]>([]);

  // UI state
  const [showAutoPostOptions, setShowAutoPostOptions] = useState(false);
  const [showChequeFields, setShowChequeFields] = useState(false);
  const [showBankFields, setShowBankFields] = useState(false);
  const [showDepositFields, setShowDepositFields] = useState(false);

  // Initialize form
  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      ReceiptNo: "",
      CustomerID: "",
      CompanyID: "",
      FiscalYearID: "",
      ReceivedAmount: 0,
      ReceiptDate: new Date(),
      PaymentType: PAYMENT_TYPE.CASH,
      PaymentStatus: PAYMENT_STATUS.RECEIVED,
      CurrencyID: "",
      ExchangeRate: 1,
      IsAdvancePayment: false,
      SecurityDepositAmount: 0,
      PenaltyAmount: 0,
      DiscountAmount: 0,
      AllocationMode: ALLOCATION_MODE.SINGLE,
      AutoPost: false,
      invoiceAllocations: [],
    },
  });

  // Setup field arrays
  const invoiceAllocationsFieldArray = useFieldArray({
    control: form.control,
    name: "invoiceAllocations",
  });

  // Calculate totals
  const calculateTotals = () => {
    const formValues = form.getValues();
    const receivedAmount = formValues.ReceivedAmount || 0;
    const securityDepositAmount = formValues.SecurityDepositAmount || 0;
    const penaltyAmount = formValues.PenaltyAmount || 0;
    const discountAmount = formValues.DiscountAmount || 0;

    const netAmount = receivedAmount + securityDepositAmount + penaltyAmount - discountAmount;

    let totalAllocated = 0;
    if (formValues.invoiceAllocations && formValues.invoiceAllocations.length > 0) {
      totalAllocated = formValues.invoiceAllocations.reduce((sum, allocation) => sum + (allocation.AllocationAmount || 0), 0);
    }

    const unallocatedAmount = Math.max(0, netAmount - totalAllocated);

    return {
      receivedAmount,
      securityDepositAmount,
      penaltyAmount,
      discountAmount,
      netAmount,
      totalAllocated,
      unallocatedAmount,
    };
  };

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        await fetchReferenceData();

        if (isEdit && id) {
          const receiptData = await leaseReceiptService.getReceiptById(parseInt(id));

          if (receiptData.receipt) {
            setReceipt(receiptData.receipt);
            populateFormWithReceiptData(receiptData.receipt);
          } else {
            toast.error("Receipt not found");
            navigate("/receipts");
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
  }, [id, isEdit, navigate, form]);

  // Fetch reference data
  const fetchReferenceData = async () => {
    try {
      const [customersData, companiesData, fiscalYearsData, currenciesData, accountsData, banksData, usersData] = await Promise.all([
        customerService.getAllCustomers(),
        companyService.getCompaniesForDropdown(true),
        fiscalYearService.getFiscalYearsForDropdown({ filterIsActive: true }),
        currencyService.getAllCurrencies(),
        accountService.getAllAccounts(),
        bankService.getAllBanks(),
        // userService.getAllUsers(), // Assuming this exists
        Promise.resolve([]), // Placeholder for users
      ]);

      setCustomers(customersData);
      setCompanies(companiesData);
      setFiscalYears(fiscalYearsData);
      setCurrencies(currenciesData);
      setAccounts(accountsData.filter((acc) => acc.IsActive && acc.IsPostable));
      setBanks(banksData);
      setUsers(usersData);

      // Set default values
      if (companiesData.length > 0) {
        const defaultCompany = companiesData[0];
        form.setValue("CompanyID", defaultCompany.CompanyID.toString());
      }

      if (fiscalYearsData.length > 0) {
        const activeFY = fiscalYearsData.find((fy) => fy.IsActive) || fiscalYearsData[0];
        form.setValue("FiscalYearID", activeFY.FiscalYearID.toString());
      }

      if (currenciesData.length > 0) {
        const defaultCurrency = currenciesData.find((c) => c.IsDefault) || currenciesData[0];
        form.setValue("CurrencyID", defaultCurrency.CurrencyID.toString());
      }
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Error loading reference data");
    }
  };

  // Populate form with existing receipt data
  const populateFormWithReceiptData = (receiptData: ContractReceipt) => {
    const formattedReceipt = {
      ...receiptData,
      ReceiptDate: receiptData.ReceiptDate ? new Date(receiptData.ReceiptDate) : new Date(),
      ChequeDate: receiptData.ChequeDate ? new Date(receiptData.ChequeDate) : null,
      DepositDate: receiptData.DepositDate ? new Date(receiptData.DepositDate) : null,
      ClearanceDate: receiptData.ClearanceDate ? new Date(receiptData.ClearanceDate) : null,
      CustomerID: receiptData.CustomerID?.toString() || "",
      CompanyID: receiptData.CompanyID?.toString() || "",
      FiscalYearID: receiptData.FiscalYearID?.toString() || "",
      CurrencyID: receiptData.CurrencyID?.toString() || "",
      BankID: receiptData.BankID?.toString() || "",
      DepositedBankID: receiptData.DepositedBankID?.toString() || "",
      ReceivedByUserID: receiptData.ReceivedByUserID?.toString() || "",
      AccountID: receiptData.AccountID?.toString() || "",
      LeaseInvoiceID: receiptData.LeaseInvoiceID?.toString() || "",
    };

    form.reset(formattedReceipt);

    // Set UI states based on payment type
    updatePaymentTypeFields(receiptData.PaymentType);
  };

  // Fetch available invoices when customer changes
  const fetchAvailableInvoices = async (customerId: string) => {
    if (!customerId) {
      setAvailableInvoices([]);
      return;
    }

    try {
      const invoices = await contractInvoiceService.searchInvoices({
        FilterCustomerID: parseInt(customerId),
        FilterInvoiceStatus: "Active", // Only active invoices
      });

      // Filter invoices with balance > 0
      const unpaidInvoices = invoices.filter((inv) => inv.BalanceAmount > 0);
      setAvailableInvoices(unpaidInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Error loading available invoices");
    }
  };

  // Update payment type specific fields
  const updatePaymentTypeFields = (paymentType: string) => {
    setShowChequeFields(paymentType === PAYMENT_TYPE.CHEQUE);
    setShowBankFields(paymentType === PAYMENT_TYPE.BANK_TRANSFER || paymentType === PAYMENT_TYPE.ONLINE);

    // Auto set deposit requirements
    const requiresDeposit = paymentType === PAYMENT_TYPE.CHEQUE || paymentType === PAYMENT_TYPE.CASH;
    setShowDepositFields(requiresDeposit);

    if (paymentType === PAYMENT_TYPE.BANK_TRANSFER || paymentType === PAYMENT_TYPE.ONLINE) {
      form.setValue("PaymentStatus", PAYMENT_STATUS.CLEARED);
    } else {
      form.setValue("PaymentStatus", PAYMENT_STATUS.RECEIVED);
    }
  };

  // Auto-calculation effects
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (!name) return;

      // Update payment type fields when payment type changes
      if (name === "PaymentType") {
        updatePaymentTypeFields(value.PaymentType || "");
      }

      // Fetch invoices when customer changes
      if (name === "CustomerID") {
        const customerId = value.CustomerID;
        if (customerId) {
          fetchAvailableInvoices(customerId);
        }
      }

      // Auto-populate posting date when auto-post is enabled
      if (name === "AutoPost" && value.AutoPost) {
        if (!form.getValues("PostingDate")) {
          form.setValue("PostingDate", form.getValues("ReceiptDate"));
        }
        setShowAutoPostOptions(true);
      } else if (name === "AutoPost" && !value.AutoPost) {
        setShowAutoPostOptions(false);
      }

      // Auto-calculate allocation when single invoice mode
      if (name === "LeaseInvoiceID" && value.AllocationMode === ALLOCATION_MODE.SINGLE) {
        const invoiceId = parseInt(value.LeaseInvoiceID || "0");
        if (invoiceId > 0) {
          const invoice = availableInvoices.find((inv) => inv.LeaseInvoiceID === invoiceId);
          if (invoice) {
            const receivedAmount = form.getValues("ReceivedAmount") || 0;
            const allocationAmount = Math.min(receivedAmount, invoice.BalanceAmount);

            // Clear existing allocations and add single allocation
            form.setValue("invoiceAllocations", [
              {
                LeaseInvoiceID: invoiceId,
                AllocationAmount: allocationAmount,
                Notes: `Payment against invoice ${invoice.InvoiceNo}`,
              },
            ]);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, availableInvoices]);

  // Add new invoice allocation
  const addInvoiceAllocation = () => {
    const totals = calculateTotals();
    const suggestedAmount = Math.min(totals.unallocatedAmount, 0);

    invoiceAllocationsFieldArray.append({
      LeaseInvoiceID: 0,
      AllocationAmount: suggestedAmount,
      Notes: "",
    });
  };

  // Handle form submission
  const onSubmit = async (data: ReceiptFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    // Validate totals
    const totals = calculateTotals();
    if (data.AllocationMode === ALLOCATION_MODE.MULTIPLE && totals.totalAllocated > totals.netAmount) {
      toast.error("Total allocation cannot exceed net received amount");
      return;
    }

    setLoading(true);

    try {
      // Prepare invoice allocations
      let invoiceAllocations: InvoiceAllocation[] = [];

      if (data.AllocationMode === ALLOCATION_MODE.SINGLE && data.LeaseInvoiceID) {
        invoiceAllocations = [
          {
            LeaseInvoiceID: parseInt(data.LeaseInvoiceID),
            AllocationAmount: totals.netAmount,
            Notes: data.Notes || "",
          },
        ];
      } else if (data.AllocationMode === ALLOCATION_MODE.MULTIPLE && data.invoiceAllocations) {
        invoiceAllocations = data.invoiceAllocations
          .filter((allocation) => allocation.LeaseInvoiceID > 0 && allocation.AllocationAmount > 0)
          .map((allocation) => ({
            LeaseInvoiceID: allocation.LeaseInvoiceID,
            AllocationAmount: allocation.AllocationAmount,
            Notes: allocation.Notes,
          }));
      }

      if (isEdit && receipt) {
        // Update existing receipt
        const updateRequest: ReceiptUpdateRequest = {
          LeaseReceiptID: receipt.LeaseReceiptID,
          ReceiptNo: data.ReceiptNo,
          ReceiptDate: data.ReceiptDate,
          PaymentType: data.PaymentType,
          PaymentStatus: data.PaymentStatus,
          ReceivedAmount: data.ReceivedAmount,
          CurrencyID: data.CurrencyID ? parseInt(data.CurrencyID) : undefined,
          ExchangeRate: data.ExchangeRate,
          BankID: data.BankID ? parseInt(data.BankID) : undefined,
          BankAccountNo: data.BankAccountNo,
          ChequeNo: data.ChequeNo,
          ChequeDate: data.ChequeDate,
          TransactionReference: data.TransactionReference,
          DepositedBankID: data.DepositedBankID ? parseInt(data.DepositedBankID) : undefined,
          DepositDate: data.DepositDate,
          ClearanceDate: data.ClearanceDate,
          IsAdvancePayment: data.IsAdvancePayment,
          SecurityDepositAmount: data.SecurityDepositAmount,
          PenaltyAmount: data.PenaltyAmount,
          DiscountAmount: data.DiscountAmount,
          ReceivedByUserID: data.ReceivedByUserID ? parseInt(data.ReceivedByUserID) : undefined,
          AccountID: data.AccountID ? parseInt(data.AccountID) : undefined,
          Notes: data.Notes,
        };

        const response = await leaseReceiptService.updateReceipt(updateRequest);

        if (response.Status === 1) {
          toast.success("Receipt updated successfully");
          navigate(`/receipts/${receipt.LeaseReceiptID}`);
        } else {
          toast.error(response.Message || "Failed to update receipt");
        }
      } else {
        // Create new receipt
        const createRequest: ReceiptCreateRequest = {
          CustomerID: parseInt(data.CustomerID),
          CompanyID: parseInt(data.CompanyID),
          FiscalYearID: parseInt(data.FiscalYearID),
          ReceivedAmount: data.ReceivedAmount,
          ReceiptDate: data.ReceiptDate,
          ReceiptNo: data.ReceiptNo,
          PaymentType: data.PaymentType,
          PaymentStatus: data.PaymentStatus,
          CurrencyID: data.CurrencyID ? parseInt(data.CurrencyID) : undefined,
          ExchangeRate: data.ExchangeRate,
          BankID: data.BankID ? parseInt(data.BankID) : undefined,
          BankAccountNo: data.BankAccountNo,
          ChequeNo: data.ChequeNo,
          ChequeDate: data.ChequeDate,
          TransactionReference: data.TransactionReference,
          DepositedBankID: data.DepositedBankID ? parseInt(data.DepositedBankID) : undefined,
          DepositDate: data.DepositDate,
          ClearanceDate: data.ClearanceDate,
          IsAdvancePayment: data.IsAdvancePayment,
          SecurityDepositAmount: data.SecurityDepositAmount,
          PenaltyAmount: data.PenaltyAmount,
          DiscountAmount: data.DiscountAmount,
          ReceivedByUserID: data.ReceivedByUserID ? parseInt(data.ReceivedByUserID) : undefined,
          AccountID: data.AccountID ? parseInt(data.AccountID) : undefined,
          Notes: data.Notes,
          AllocationMode: data.AllocationMode as any,
          InvoiceAllocations: invoiceAllocations,
          AutoPost: data.AutoPost,
          PostingDate: data.PostingDate,
          DebitAccountID: data.DebitAccountID ? parseInt(data.DebitAccountID) : undefined,
          CreditAccountID: data.CreditAccountID ? parseInt(data.CreditAccountID) : undefined,
          PostingNarration: data.PostingNarration,
          PostingReference: data.PostingReference,
        };

        const response = await leaseReceiptService.createReceipt(createRequest);

        if (response.Status === 1 && response.NewReceiptID) {
          toast.success("Receipt created successfully");
          navigate(`/receipts/${response.NewReceiptID}`);
        } else {
          toast.error(response.Message || "Failed to create receipt");
        }
      }
    } catch (error) {
      console.error("Error saving receipt:", error);
      toast.error("Failed to save receipt");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    if (isEdit && receipt) {
      form.reset();
    } else {
      form.reset({
        ReceiptNo: "",
        CustomerID: "",
        CompanyID: companies.length > 0 ? companies[0].CompanyID.toString() : "",
        FiscalYearID: fiscalYears.length > 0 ? fiscalYears[0].FiscalYearID.toString() : "",
        ReceivedAmount: 0,
        ReceiptDate: new Date(),
        PaymentType: PAYMENT_TYPE.CASH,
        PaymentStatus: PAYMENT_STATUS.RECEIVED,
        CurrencyID: currencies.length > 0 ? currencies[0].CurrencyID.toString() : "",
        ExchangeRate: 1,
        IsAdvancePayment: false,
        SecurityDepositAmount: 0,
        PenaltyAmount: 0,
        DiscountAmount: 0,
        AllocationMode: ALLOCATION_MODE.SINGLE,
        AutoPost: false,
        invoiceAllocations: [],
      });
    }
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "0.00";
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Get invoice details
  const getInvoiceDetails = (invoiceId: number) => {
    return availableInvoices.find((inv) => inv.LeaseInvoiceID === invoiceId);
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/receipts")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Receipt" : "Create Receipt"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Receipt Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Receipt Information
              </CardTitle>
              <CardDescription>Enter the basic receipt details and customer information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  form={form}
                  name="ReceiptNo"
                  label="Receipt Number"
                  placeholder="Auto-generated if left empty"
                  description="Leave blank for auto-generated receipt number"
                />
                <FormField form={form} name="ReceiptDate" label="Receipt Date" type="date" required description="Date when payment was received" />
                <FormField
                  form={form}
                  name="PaymentStatus"
                  label="Payment Status"
                  type="select"
                  options={Object.values(PAYMENT_STATUS).map((status) => ({
                    label: status,
                    value: status,
                  }))}
                  placeholder="Select status"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="CompanyID"
                  label="Company"
                  type="select"
                  options={companies.map((company) => ({
                    label: company.CompanyName,
                    value: company.CompanyID.toString(),
                  }))}
                  placeholder="Select company"
                  required
                  description="Company receiving the payment"
                />
                <FormField
                  form={form}
                  name="FiscalYearID"
                  label="Fiscal Year"
                  type="select"
                  options={fiscalYears.map((fy) => ({
                    label: fy.FYDescription,
                    value: fy.FiscalYearID.toString(),
                  }))}
                  placeholder="Select fiscal year"
                  required
                  description="Fiscal year for the receipt"
                />
              </div>

              <FormField
                form={form}
                name="CustomerID"
                label="Customer"
                type="select"
                options={customers.map((customer) => ({
                  label: customer.CustomerFullName,
                  value: customer.CustomerID.toString(),
                }))}
                placeholder="Select customer"
                required
                description="Customer making the payment"
              />
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Details
              </CardTitle>
              <CardDescription>Configure payment method and amounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField form={form} name="ReceivedAmount" label="Received Amount" type="number" step="0.01" placeholder="0.00" required description="Primary amount received" />
                <FormField
                  form={form}
                  name="PaymentType"
                  label="Payment Type"
                  type="select"
                  options={Object.values(PAYMENT_TYPE).map((type) => ({
                    label: type,
                    value: type,
                  }))}
                  placeholder="Select payment type"
                  required
                />
                <FormField
                  form={form}
                  name="CurrencyID"
                  label="Currency"
                  type="select"
                  options={currencies.map((currency) => ({
                    label: `${currency.CurrencyCode} - ${currency.CurrencyName}`,
                    value: currency.CurrencyID.toString(),
                  }))}
                  placeholder="Select currency"
                  description="Payment currency"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField form={form} name="SecurityDepositAmount" label="Security Deposit" type="number" step="0.01" placeholder="0.00" description="Security deposit amount" />
                <FormField form={form} name="PenaltyAmount" label="Penalty Amount" type="number" step="0.01" placeholder="0.00" description="Penalty charges included" />
                <FormField form={form} name="DiscountAmount" label="Discount Amount" type="number" step="0.01" placeholder="0.00" description="Discount given" />
              </div>

              {/* Cheque Details */}
              {showChequeFields && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">Cheque Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField form={form} name="ChequeNo" label="Cheque Number" placeholder="Enter cheque number" required={showChequeFields} />
                    <FormField form={form} name="ChequeDate" label="Cheque Date" type="date" required={showChequeFields} />
                    <FormField
                      form={form}
                      name="BankID"
                      label="Cheque Bank"
                      type="select"
                      options={banks.map((bank) => ({
                        label: bank.BankName,
                        value: bank.BankID.toString(),
                      }))}
                      placeholder="Select bank"
                    />
                  </div>
                </div>
              )}

              {/* Bank Transfer Details */}
              {showBankFields && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">Bank Transfer Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField form={form} name="TransactionReference" label="Transaction Reference" placeholder="Enter reference number" />
                    <FormField
                      form={form}
                      name="BankID"
                      label="Source Bank"
                      type="select"
                      options={banks.map((bank) => ({
                        label: bank.BankName,
                        value: bank.BankID.toString(),
                      }))}
                      placeholder="Select source bank"
                    />
                  </div>
                  <FormField form={form} name="BankAccountNo" label="Account Number" placeholder="Enter account number" />
                </div>
              )}

              {/* Deposit Information */}
              {showDepositFields && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">Deposit Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      form={form}
                      name="DepositedBankID"
                      label="Deposit Bank"
                      type="select"
                      options={banks.map((bank) => ({
                        label: bank.BankName,
                        value: bank.BankID.toString(),
                      }))}
                      placeholder="Select deposit bank"
                      description="Bank where payment will be deposited"
                    />
                    <FormField form={form} name="DepositDate" label="Deposit Date" type="date" description="Date when payment was deposited" />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="is-advance" checked={form.watch("IsAdvancePayment")} onCheckedChange={(checked) => form.setValue("IsAdvancePayment", checked as boolean)} />
                  <Label htmlFor="is-advance">Advance Payment</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receipt Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Receipt Summary
              </CardTitle>
              <CardDescription>Live calculation of receipt totals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Received Amount</span>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(totals.receivedAmount)}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Additional Amounts</span>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(totals.securityDepositAmount + totals.penaltyAmount - totals.discountAmount)}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-muted-foreground">Net Amount</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.netAmount)}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Unallocated</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(totals.unallocatedAmount)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Allocation */}
          {!form.watch("IsAdvancePayment") && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      Invoice Allocation
                    </CardTitle>
                    <CardDescription>Allocate payment to outstanding invoices</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  form={form}
                  name="AllocationMode"
                  label="Allocation Mode"
                  type="select"
                  options={[
                    { label: "Single Invoice", value: ALLOCATION_MODE.SINGLE },
                    { label: "Multiple Invoices", value: ALLOCATION_MODE.MULTIPLE },
                  ]}
                  placeholder="Select allocation mode"
                />

                {form.watch("AllocationMode") === ALLOCATION_MODE.SINGLE && (
                  <FormField
                    form={form}
                    name="LeaseInvoiceID"
                    label="Select Invoice"
                    type="select"
                    options={availableInvoices.map((invoice) => ({
                      label: `${invoice.InvoiceNo} - ${formatCurrency(invoice.BalanceAmount)} outstanding`,
                      value: invoice.LeaseInvoiceID.toString(),
                    }))}
                    placeholder="Select invoice to allocate payment"
                    description="Choose the invoice to allocate this payment against"
                  />
                )}

                {form.watch("AllocationMode") === ALLOCATION_MODE.MULTIPLE && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Invoice Allocations</h4>
                      <Button type="button" onClick={addInvoiceAllocation} disabled={totals.unallocatedAmount <= 0}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Allocation
                      </Button>
                    </div>

                    {invoiceAllocationsFieldArray.fields.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                        <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground mb-4">No allocations have been added yet.</p>
                        <Button type="button" variant="outline" onClick={addInvoiceAllocation}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Your First Allocation
                        </Button>
                      </div>
                    ) : (
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice</TableHead>
                              <TableHead>Outstanding</TableHead>
                              <TableHead>Allocation</TableHead>
                              <TableHead>Notes</TableHead>
                              <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoiceAllocationsFieldArray.fields.map((field, index) => {
                              const invoiceId = form.watch(`invoiceAllocations.${index}.LeaseInvoiceID`);
                              const invoiceDetails = getInvoiceDetails(invoiceId);

                              return (
                                <TableRow key={field.id}>
                                  <TableCell>
                                    <FormField
                                      form={form}
                                      name={`invoiceAllocations.${index}.LeaseInvoiceID`}
                                      label=""
                                      type="select"
                                      options={availableInvoices.map((invoice) => ({
                                        label: invoice.InvoiceNo,
                                        value: invoice.LeaseInvoiceID,
                                      }))}
                                      placeholder="Select invoice"
                                    />
                                  </TableCell>
                                  <TableCell>{invoiceDetails ? formatCurrency(invoiceDetails.BalanceAmount) : "—"}</TableCell>
                                  <TableCell>
                                    <FormField form={form} name={`invoiceAllocations.${index}.AllocationAmount`} label="" type="number" step="0.01" placeholder="0.00" />
                                  </TableCell>
                                  <TableCell>
                                    <FormField form={form} name={`invoiceAllocations.${index}.Notes`} label="" placeholder="Optional notes" />
                                  </TableCell>
                                  <TableCell>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => invoiceAllocationsFieldArray.remove(index)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {totals.totalAllocated > 0 && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Total Allocated:</span>
                          <span className="text-lg font-bold">{formatCurrency(totals.totalAllocated)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Remaining to Allocate:</span>
                          <span className={`text-lg font-bold ${totals.unallocatedAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(totals.unallocatedAmount)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Auto-posting Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Posting Configuration
              </CardTitle>
              <CardDescription>Configure automatic posting to general ledger</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-post"
                    checked={form.watch("AutoPost")}
                    onCheckedChange={(checked) => {
                      form.setValue("AutoPost", checked as boolean);
                      setShowAutoPostOptions(checked as boolean);
                    }}
                  />
                  <Label htmlFor="auto-post">Auto-post to general ledger</Label>
                </div>
              </div>

              {showAutoPostOptions && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">Auto-Posting Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField form={form} name="PostingDate" label="Posting Date" type="date" description="Date for posting entries" />
                    <FormField form={form} name="PostingReference" label="Posting Reference" placeholder="Enter reference" description="Reference for posting entries" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      form={form}
                      name="DebitAccountID"
                      label="Debit Account"
                      type="select"
                      options={accounts
                        .filter((acc) => acc.AccountCode.startsWith("1"))
                        .map((account) => ({
                          label: `${account.AccountCode} - ${account.AccountName}`,
                          value: account.AccountID.toString(),
                        }))}
                      placeholder="Select debit account"
                      description="Account to debit (typically Cash/Bank account)"
                    />
                    <FormField
                      form={form}
                      name="CreditAccountID"
                      label="Credit Account"
                      type="select"
                      options={accounts
                        .filter((acc) => acc.AccountCode.startsWith("1"))
                        .map((account) => ({
                          label: `${account.AccountCode} - ${account.AccountName}`,
                          value: account.AccountID.toString(),
                        }))}
                      placeholder="Select credit account"
                      description="Account to credit (typically Accounts Receivable)"
                    />
                  </div>
                  <FormField
                    form={form}
                    name="PostingNarration"
                    label="Posting Narration"
                    type="textarea"
                    placeholder="Enter posting narration"
                    description="Description for the posting entries"
                  />
                </div>
              )}

              <FormField form={form} name="Notes" label="Receipt Notes" type="textarea" placeholder="Enter receipt notes" description="Additional notes about this receipt" />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <Card>
            <CardFooter className="flex justify-between pt-6">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => navigate("/receipts")} disabled={loading}>
                  Cancel
                </Button>
                <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEdit ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEdit ? "Update Receipt" : "Create Receipt"}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default ContractReceiptForm;
