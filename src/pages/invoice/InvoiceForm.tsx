// src/pages/invoice/InvoiceForm.tsx - Updated for stored procedure alignment
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, RotateCcw, Calculator, AlertCircle, CheckCircle } from "lucide-react";
import { invoiceService, LeaseInvoice } from "@/services/invoiceService";
import { customerService } from "@/services/customerService";
import { contractService } from "@/services/contractService";
import { companyService } from "@/services/companyService";
import { currencyService } from "@/services/currencyService";
import { taxService } from "@/services/taxService";
import { toast } from "sonner";
import { useAppSelector } from "@/lib/hooks";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { format, addDays } from "date-fns";
import { INVOICE_STATUS, INVOICE_TYPE, RECURRENCE_PATTERN } from "@/types/invoiceTypes";

// Updated schema to match stored procedure requirements
const invoiceSchema = z
  .object({
    InvoiceNo: z.string().optional(),
    InvoiceDate: z.date().default(() => new Date()),
    DueDate: z.date({
      required_error: "Due date is required",
    }),
    ContractID: z.string().min(1, "Contract is required"),
    ContractUnitID: z.string().min(1, "Contract unit is required"),
    CustomerID: z.string().min(1, "Customer is required"),
    CompanyID: z.string().min(1, "Company is required"),
    FiscalYearID: z.string().optional(),
    InvoiceType: z.string().min(1, "Invoice type is required"),
    InvoiceStatus: z.string().default("Draft"),
    PeriodFromDate: z.date().optional().nullable(),
    PeriodToDate: z.date().optional().nullable(),
    SubTotal: z.number().min(0, "Subtotal must be positive"),
    TaxAmount: z.number().min(0, "Tax amount must be positive").default(0),
    DiscountAmount: z.number().min(0, "Discount amount must be positive").default(0),
    TotalAmount: z.number().min(0, "Total amount must be positive"),
    PaidAmount: z.number().min(0, "Paid amount must be positive").default(0),
    BalanceAmount: z.number().min(0, "Balance amount must be positive"),
    CurrencyID: z.string().optional(),
    ExchangeRate: z.number().min(0, "Exchange rate must be positive").default(1),
    PaymentTermID: z.string().optional(),
    SalesPersonID: z.string().optional(),
    TaxID: z.string().optional(),
    IsRecurring: z.boolean().default(false),
    RecurrencePattern: z.string().optional(),
    NextInvoiceDate: z.date().optional().nullable(),
    Notes: z.string().optional(),
    InternalNotes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.PeriodFromDate && data.PeriodToDate) {
        return data.PeriodToDate >= data.PeriodFromDate;
      }
      return true;
    },
    {
      message: "Period To Date must be after Period From Date",
      path: ["PeriodToDate"],
    }
  )
  .refine(
    (data) => {
      if (data.IsRecurring) {
        return data.RecurrencePattern && data.NextInvoiceDate;
      }
      return true;
    },
    {
      message: "Recurrence pattern and next invoice date are required for recurring invoices",
      path: ["RecurrencePattern"],
    }
  );

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const InvoiceForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [invoice, setInvoice] = useState<LeaseInvoice | null>(null);
  const [formError, setFormError] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Reference data
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractUnits, setContractUnits] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<any[]>([]);

  // Available options based on stored procedure
  const invoiceTypeOptions = Object.values(INVOICE_TYPE);
  const invoiceStatusOptions = Object.values(INVOICE_STATUS);
  const recurrencePatternOptions = Object.values(RECURRENCE_PATTERN);

  // Initialize form
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    mode: "onChange",
    defaultValues: {
      InvoiceNo: "",
      InvoiceDate: new Date(),
      DueDate: addDays(new Date(), 30),
      ContractID: "",
      ContractUnitID: "",
      CustomerID: "",
      CompanyID: "",
      FiscalYearID: "1",
      InvoiceType: INVOICE_TYPE.REGULAR,
      InvoiceStatus: INVOICE_STATUS.DRAFT,
      PeriodFromDate: null,
      PeriodToDate: null,
      SubTotal: 0,
      TaxAmount: 0,
      DiscountAmount: 0,
      TotalAmount: 0,
      PaidAmount: 0,
      BalanceAmount: 0,
      CurrencyID: "",
      ExchangeRate: 1,
      PaymentTermID: "",
      SalesPersonID: "",
      TaxID: "",
      IsRecurring: false,
      RecurrencePattern: "",
      NextInvoiceDate: null,
      Notes: "",
      InternalNotes: "",
    },
  });

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        setValidationErrors([]);

        // Fetch reference data in parallel
        const [customersData, contractsData, companiesData, currenciesData, taxesData] = await Promise.all([
          customerService.getAllCustomers(),
          contractService.getAllContracts(),
          companyService.getAllCompanies(),
          currencyService.getAllCurrencies(),
          taxService.getAllTaxes(),
        ]);

        setCustomers(customersData);
        setContracts(contractsData);
        setCompanies(companiesData);
        setCurrencies(currenciesData);
        setTaxes(taxesData);

        // Mock payment terms data (add proper service call when available)
        setPaymentTerms([
          { PaymentTermID: 1, TermName: "Net 30", DaysCount: 30 },
          { PaymentTermID: 2, TermName: "Net 15", DaysCount: 15 },
          { PaymentTermID: 3, TermName: "Net 60", DaysCount: 60 },
          { PaymentTermID: 4, TermName: "Due on Receipt", DaysCount: 0 },
        ]);

        // Set default company and currency if available
        const defaultCompany = companiesData.find((c) => c.IsActive); //c.IsDefault ||
        const defaultCurrency = currenciesData.find((c) => c.IsDefault);

        if (defaultCompany) {
          form.setValue("CompanyID", defaultCompany.CompanyID.toString());
        }

        if (defaultCurrency) {
          form.setValue("CurrencyID", defaultCurrency.CurrencyID.toString());
        }

        // If editing, fetch the invoice data
        if (isEdit && id) {
          const invoiceData = await invoiceService.getInvoiceById(parseInt(id));

          if (invoiceData) {
            setInvoice(invoiceData);

            // Check if invoice can be edited
            if (invoiceData.InvoiceStatus === "Paid" || invoiceData.InvoiceStatus === "Cancelled") {
              setValidationErrors([`Cannot edit invoice with status "${invoiceData.InvoiceStatus}"`]);
            }

            // Format data for form
            const formattedInvoice = {
              ...invoiceData,
              InvoiceDate: invoiceData.InvoiceDate ? new Date(invoiceData.InvoiceDate) : new Date(),
              DueDate: invoiceData.DueDate ? new Date(invoiceData.DueDate) : addDays(new Date(), 30),
              PeriodFromDate: invoiceData.PeriodFromDate ? new Date(invoiceData.PeriodFromDate) : null,
              PeriodToDate: invoiceData.PeriodToDate ? new Date(invoiceData.PeriodToDate) : null,
              NextInvoiceDate: invoiceData.NextInvoiceDate ? new Date(invoiceData.NextInvoiceDate) : null,
              ContractID: invoiceData.ContractID?.toString() || "",
              ContractUnitID: invoiceData.ContractUnitID?.toString() || "",
              CustomerID: invoiceData.CustomerID?.toString() || "",
              CompanyID: invoiceData.CompanyID?.toString() || "",
              FiscalYearID: invoiceData.FiscalYearID?.toString() || "1",
              CurrencyID: invoiceData.CurrencyID?.toString() || "",
              PaymentTermID: invoiceData.PaymentTermID?.toString() || "",
              SalesPersonID: invoiceData.SalesPersonID?.toString() || "",
              TaxID: invoiceData.TaxID?.toString() || "",
            };

            // Set form values
            form.reset(formattedInvoice);

            // Load contract units for the selected contract
            if (invoiceData.ContractID) {
              await loadContractUnits(invoiceData.ContractID);
            }
          } else {
            toast.error("Invoice not found");
            navigate("/invoices");
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

  // Effect to auto-calculate totals and handle dependencies
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Auto-calculate total amount when subtotal, tax, or discount changes
      if (name && (name.includes("SubTotal") || name.includes("TaxAmount") || name.includes("DiscountAmount"))) {
        const subTotal = form.getValues("SubTotal") || 0;
        const taxAmount = form.getValues("TaxAmount") || 0;
        const discountAmount = form.getValues("DiscountAmount") || 0;
        const totalAmount = subTotal + taxAmount - discountAmount;
        const paidAmount = form.getValues("PaidAmount") || 0;

        form.setValue("TotalAmount", Math.max(0, totalAmount));
        form.setValue("BalanceAmount", Math.max(0, totalAmount - paidAmount));
      }

      // Auto-calculate balance amount when total or paid amount changes
      if (name && (name.includes("TotalAmount") || name.includes("PaidAmount"))) {
        const totalAmount = form.getValues("TotalAmount") || 0;
        const paidAmount = form.getValues("PaidAmount") || 0;
        form.setValue("BalanceAmount", Math.max(0, totalAmount - paidAmount));
      }

      // Auto-calculate tax amount when tax is selected
      if (name && name.includes("TaxID")) {
        const taxId = form.getValues("TaxID");
        if (taxId && taxId !== "0") {
          const selectedTax = taxes.find((tax) => tax.TaxID.toString() === taxId);
          if (selectedTax) {
            const subTotal = form.getValues("SubTotal") || 0;
            const taxAmount = (subTotal * selectedTax.TaxRate) / 100;
            form.setValue("TaxAmount", taxAmount);
          }
        } else {
          form.setValue("TaxAmount", 0);
        }
      }

      // Auto-calculate tax amount when subtotal changes and tax is selected
      if (name && name.includes("SubTotal")) {
        const taxId = form.getValues("TaxID");
        if (taxId && taxId !== "0") {
          const selectedTax = taxes.find((tax) => tax.TaxID.toString() === taxId);
          if (selectedTax) {
            const subTotal = form.getValues("SubTotal") || 0;
            const taxAmount = (subTotal * selectedTax.TaxRate) / 100;
            form.setValue("TaxAmount", taxAmount);
          }
        }
      }

      // Load contract units and set customer when contract is selected
      if (name && name.includes("ContractID")) {
        const contractId = form.getValues("ContractID");
        if (contractId && contractId !== "0") {
          loadContractUnits(parseInt(contractId));
          // Auto-set customer from contract
          const selectedContract = contracts.find((c) => c.ContractID.toString() === contractId);
          if (selectedContract) {
            form.setValue("CustomerID", selectedContract.CustomerID.toString());
          }
        } else {
          setContractUnits([]);
          form.setValue("ContractUnitID", "");
        }
      }

      // Auto-calculate due date when payment terms change
      if (name && name.includes("PaymentTermID")) {
        const paymentTermId = form.getValues("PaymentTermID");
        const invoiceDate = form.getValues("InvoiceDate");

        if (paymentTermId && paymentTermId !== "0" && invoiceDate) {
          const selectedTerm = paymentTerms.find((term) => term.PaymentTermID.toString() === paymentTermId);
          if (selectedTerm) {
            const dueDate = addDays(invoiceDate, selectedTerm.DaysCount);
            form.setValue("DueDate", dueDate);
          }
        }
      }

      // Handle recurring invoice fields
      if (name && name.includes("IsRecurring")) {
        const isRecurring = form.getValues("IsRecurring");
        if (!isRecurring) {
          form.setValue("RecurrencePattern", "");
          form.setValue("NextInvoiceDate", null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, taxes, contracts, paymentTerms]);

  // Load contract units for selected contract
  const loadContractUnits = async (contractId: number) => {
    try {
      const contractData = await contractService.getContractById(contractId);
      if (contractData.units) {
        setContractUnits(contractData.units);
        // Auto-select first unit if only one exists
        if (contractData.units.length === 1) {
          form.setValue("ContractUnitID", contractData.units[0].ContractUnitID.toString());
        }
      }
    } catch (error) {
      console.error("Error loading contract units:", error);
      toast.error("Failed to load contract units");
    }
  };

  // Handle form submission
  const onSubmit = async (data: InvoiceFormValues) => {
    setFormError("");
    setValidationErrors([]);

    if (!user) {
      setFormError("User information not available");
      toast.error("User information not available");
      return;
    }

    setLoading(true);

    try {
      // Prepare invoice data according to stored procedure requirements
      const invoiceData = {
        invoice: {
          InvoiceNo: data.InvoiceNo || undefined, // Let stored procedure auto-generate if empty
          InvoiceDate: data.InvoiceDate,
          DueDate: data.DueDate,
          ContractID: parseInt(data.ContractID),
          ContractUnitID: parseInt(data.ContractUnitID),
          CustomerID: parseInt(data.CustomerID),
          CompanyID: parseInt(data.CompanyID),
          FiscalYearID: data.FiscalYearID ? parseInt(data.FiscalYearID) : undefined,
          InvoiceType: data.InvoiceType,
          InvoiceStatus: data.InvoiceStatus,
          PeriodFromDate: data.PeriodFromDate,
          PeriodToDate: data.PeriodToDate,
          SubTotal: data.SubTotal,
          TaxAmount: data.TaxAmount,
          DiscountAmount: data.DiscountAmount,
          TotalAmount: data.TotalAmount,
          PaidAmount: data.PaidAmount,
          BalanceAmount: data.BalanceAmount,
          CurrencyID: data.CurrencyID && data.CurrencyID !== "0" ? parseInt(data.CurrencyID) : undefined,
          ExchangeRate: data.ExchangeRate,
          PaymentTermID: data.PaymentTermID && data.PaymentTermID !== "0" ? parseInt(data.PaymentTermID) : undefined,
          SalesPersonID: data.SalesPersonID && data.SalesPersonID !== "0" ? parseInt(data.SalesPersonID) : undefined,
          TaxID: data.TaxID && data.TaxID !== "0" ? parseInt(data.TaxID) : undefined,
          IsRecurring: data.IsRecurring,
          RecurrencePattern: data.RecurrencePattern || undefined,
          NextInvoiceDate: data.NextInvoiceDate,
          Notes: data.Notes,
          InternalNotes: data.InternalNotes,
        },
      };

      if (isEdit && invoice) {
        // Update existing invoice
        const response = await invoiceService.updateInvoice({
          invoice: {
            ...invoiceData.invoice,
            LeaseInvoiceID: invoice.LeaseInvoiceID,
          },
        });

        if (response.Status === 1) {
          toast.success("Invoice updated successfully");
          navigate(`/invoices/${invoice.LeaseInvoiceID}`);
        } else {
          setFormError(response.Message || "Failed to update invoice");
          toast.error(response.Message || "Failed to update invoice");
        }
      } else {
        // Create new invoice
        const response = await invoiceService.createInvoice(invoiceData);

        if (response.Status === 1 && response.NewInvoiceID) {
          toast.success("Invoice created successfully");
          navigate(`/invoices/${response.NewInvoiceID}`);
        } else {
          setFormError(response.Message || "Failed to create invoice");
          toast.error(response.Message || "Failed to create invoice");
        }
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      const errorMessage = "Failed to save invoice";
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
    if (isEdit && invoice) {
      form.reset();
    } else {
      form.reset({
        InvoiceNo: "",
        InvoiceDate: new Date(),
        DueDate: addDays(new Date(), 30),
        ContractID: "",
        ContractUnitID: "",
        CustomerID: "",
        CompanyID: "",
        FiscalYearID: "1",
        InvoiceType: INVOICE_TYPE.REGULAR,
        InvoiceStatus: INVOICE_STATUS.DRAFT,
        PeriodFromDate: null,
        PeriodToDate: null,
        SubTotal: 0,
        TaxAmount: 0,
        DiscountAmount: 0,
        TotalAmount: 0,
        PaidAmount: 0,
        BalanceAmount: 0,
        CurrencyID: "",
        ExchangeRate: 1,
        PaymentTermID: "",
        SalesPersonID: "",
        TaxID: "",
        IsRecurring: false,
        RecurrencePattern: "",
        NextInvoiceDate: null,
        Notes: "",
        InternalNotes: "",
      });
    }
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "0.00";
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
        <Button variant="outline" size="icon" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Invoice" : "Create Invoice"}</h1>
        {invoice && (
          <Badge variant="outline" className="ml-4">
            {invoice.InvoiceNo}
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
                <CardTitle>{isEdit ? "Edit Invoice" : "Create New Invoice"}</CardTitle>
                <CardDescription>
                  {isEdit ? "Update invoice information" : "Enter invoice details"}
                  {!isEdit && " - Invoice number will be auto-generated if left empty"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="InvoiceNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice No.</FormLabel>
                        <FormControl>
                          <Input placeholder="Auto-generated if left empty" {...field} />
                        </FormControl>
                        <FormDescription>Optional. Leave blank for auto-generated invoice number.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="InvoiceStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {invoiceStatusOptions.map((status) => (
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
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="InvoiceDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Invoice Date *</FormLabel>
                        <FormControl>
                          <DatePicker value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="DueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date *</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            disabled={(date) => {
                              const invoiceDate = form.watch("InvoiceDate");
                              return invoiceDate ? date < invoiceDate : false;
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contract and Customer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="ContractID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a contract" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contracts.map((contract) => (
                              <SelectItem key={contract.ContractID} value={contract.ContractID.toString()}>
                                {contract.ContractNo} - {contract.CustomerName}
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
                    name="ContractUnitID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Unit *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={!form.watch("ContractID")}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contractUnits.map((unit) => (
                              <SelectItem key={unit.ContractUnitID} value={unit.ContractUnitID.toString()}>
                                {unit.UnitNo} - {unit.PropertyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                {/* Company and Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <FormField
                    control={form.control}
                    name="InvoiceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Type *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select invoice type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {invoiceTypeOptions.map((type) => (
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
                </div>

                <Separator />

                {/* Billing Period */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Billing Period</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="PeriodFromDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Period From</FormLabel>
                          <FormControl>
                            <DatePicker value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="PeriodToDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Period To</FormLabel>
                          <FormControl>
                            <DatePicker
                              value={field.value}
                              onChange={field.onChange}
                              disabled={(date) => {
                                const fromDate = form.watch("PeriodFromDate");
                                return fromDate ? date < fromDate : false;
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Amount Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Amount Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="SubTotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subtotal *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="TaxID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select tax" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">No Tax</SelectItem>
                              {taxes.map((tax) => (
                                <SelectItem key={tax.TaxID} value={tax.TaxID.toString()}>
                                  {tax.TaxName} ({tax.TaxRate}%)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="TaxAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Amount</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} disabled />
                          </FormControl>
                          <FormDescription>Calculated automatically based on selected tax</FormDescription>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="TotalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Amount</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} disabled className="font-semibold" />
                          </FormControl>
                          <FormDescription>Calculated automatically</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="PaidAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Paid Amount</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="BalanceAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Balance Amount</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} disabled className="font-semibold" />
                          </FormControl>
                          <FormDescription>Calculated automatically</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Payment and Currency */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Payment & Currency</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="PaymentTermID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Terms</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment terms" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">No Payment Terms</SelectItem>
                              {paymentTerms.map((term) => (
                                <SelectItem key={term.PaymentTermID} value={term.PaymentTermID.toString()}>
                                  {term.TermName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Will auto-calculate due date</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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

                <Separator />

                {/* Recurring Invoice */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="IsRecurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Recurring Invoice</FormLabel>
                          <FormDescription>Enable automatic recurring billing for this invoice</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("IsRecurring") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6 border-l-2 border-muted">
                      <FormField
                        control={form.control}
                        name="RecurrencePattern"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recurrence Pattern *</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select pattern" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {recurrencePatternOptions.map((pattern) => (
                                  <SelectItem key={pattern} value={pattern}>
                                    {pattern}
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
                        name="NextInvoiceDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Next Invoice Date *</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                disabled={(date) => {
                                  const invoiceDate = form.watch("InvoiceDate");
                                  return invoiceDate ? date <= invoiceDate : false;
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Notes */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="Notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter notes for the customer" className="min-h-[100px]" {...field} />
                        </FormControl>
                        <FormDescription>These notes will be visible to the customer</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="InternalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Internal Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter internal notes (not visible to customer)" className="min-h-[100px]" {...field} />
                        </FormControl>
                        <FormDescription>These notes are for internal use only and will not be visible to the customer.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Invoice Summary */}
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Calculator className="mr-2 h-5 w-5" />
                      Invoice Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Subtotal</div>
                      <div className="text-xl font-bold">{formatCurrency(form.watch("SubTotal"))}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Tax Amount</div>
                      <div className="text-xl font-bold">{formatCurrency(form.watch("TaxAmount"))}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Total Amount</div>
                      <div className="text-2xl font-bold">{formatCurrency(form.watch("TotalAmount"))}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Balance Due</div>
                      <div className={`text-2xl font-bold ${form.watch("BalanceAmount") > 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(form.watch("BalanceAmount"))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => navigate("/invoices")} disabled={loading}>
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
                    {isEdit ? "Update Invoice" : "Create Invoice"}
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

export default InvoiceForm;
