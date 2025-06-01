// src/pages/paymentVoucher/PaymentVoucherForm.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2, Loader2, Save, XCircle, Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { paymentVoucherService, PaymentVoucher, PaymentVoucherLine, PaymentVoucherAttachment, PaymentType, PaymentStatus } from "@/services/paymentVoucherService";
import { Company } from "@/types/customerTypes";
import { Supplier } from "@/types/supplierTypes";
import { accountService, companyService, costCenterService, Currency, currencyService, fiscalYearService, supplierService, bankService } from "@/services";
import { taxService, Tax } from "@/services/taxService";
import { Account } from "@/types/accountTypes";
import { CostCenter1, CostCenter2, CostCenter3, CostCenter4 } from "@/types/costCenterTypes";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { AttachmentThumbnail } from "@/components/attachments/AttachmentThumbnail";
import { Bank } from "@/types/bankTypes";

// Define the Zod schema for a single Payment Line
const paymentLineSchema = z.object({
  PostingID: z.number().optional(),
  Line_No: z.number().optional(),
  AccountID: z.number().min(1, "Account is required."),
  Description: z.string().max(500, "Description cannot exceed 500 characters.").optional(),
  DebitAmount: z.number().min(0, "Debit amount cannot be negative.").default(0),
  CreditAmount: z.number().min(0, "Credit amount cannot be negative.").default(0),
  TaxID: z.number().nullable().optional(),
  TaxPercentage: z.number().nullable().optional(),
  TaxAmount: z.number().nullable().optional(),
  BaseAmount: z.number().nullable().optional(),
  CostCenter1ID: z.number().nullable().optional(),
  CostCenter2ID: z.number().nullable().optional(),
  CostCenter3ID: z.number().nullable().optional(),
  CostCenter4ID: z.number().nullable().optional(),
});

// Define the Zod schema for attachments
const attachmentSchema = z.object({
  PostingAttachmentID: z.number().optional(),
  DocTypeID: z.number().min(1, "Document type is required."),
  DocumentName: z.string().min(1, "Document name is required."),
  DocumentDescription: z.string().optional(),
  IsRequired: z.boolean().default(false),
  DisplayOrder: z.number().default(0),
  file: z.any().optional(), // File object
  fileUrl: z.string().optional(), // For display in edit mode
});

// Define the Zod schema for the entire Payment Voucher form
const paymentVoucherFormSchema = z.object({
  // Header Information
  VoucherNo: z.string().max(50, "Voucher No. cannot exceed 50 characters.").optional(),
  TransactionDate: z.date({ required_error: "Transaction Date is required." }),
  PostingDate: z.date({ required_error: "Posting Date is required." }),
  CompanyID: z.number().min(1, "Company is required."),
  FiscalYearID: z.number().min(1, "Fiscal Year is required."),
  SupplierID: z.number().min(1, "Supplier is required."),
  PaymentType: z.nativeEnum(PaymentType, { required_error: "Payment Type is required." }),
  PaymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.DRAFT),
  TotalAmount: z.number().min(0.01, "Total amount must be greater than 0."),
  CurrencyID: z.number().min(1, "Currency is required."),
  ExchangeRate: z.number().min(0.0001, "Exchange Rate must be greater than 0.").default(1.0),
  BaseCurrencyAmount: z.number().optional(),

  // Bank/Cheque Details
  BankID: z.number().optional(),
  BankAccountNo: z.string().max(50).optional(),
  ChequeNo: z.string().max(50).optional(),
  ChequeDate: z.date().optional(),
  TransactionReference: z.string().max(100).optional(),

  // GL Account Details
  BankAccountID: z.number().min(1, "Bank/Cash Account is required."),
  PayableAccountID: z.number().optional(),

  // Description and Notes
  Description: z.string().max(500, "Description cannot exceed 500 characters.").optional(),
  Narration: z.string().max(1000, "Narration cannot exceed 1000 characters.").optional(),
  InternalNotes: z.string().max(1000, "Internal Notes cannot exceed 1000 characters.").optional(),

  // Cost Center Information
  CostCenter1ID: z.number().optional(),
  CostCenter2ID: z.number().optional(),
  CostCenter3ID: z.number().optional(),
  CostCenter4ID: z.number().optional(),

  // Tax Information
  TaxID: z.number().optional(),
  TaxPercentage: z.number().optional(),
  TaxAmount: z.number().optional(),
  IsTaxInclusive: z.boolean().default(false),
  BaseAmount: z.number().optional(),

  // Reference Information
  ReferenceType: z.string().max(50).optional(),
  ReferenceID: z.number().optional(),
  ReferenceNo: z.string().max(50).optional(),

  // Additional Parameters
  AutoPostToGL: z.boolean().default(false),
  IsRecurring: z.boolean().default(false),
  RecurrencePattern: z.string().max(50).optional(),

  // Child Records
  PaymentLines: z.array(paymentLineSchema).optional(),
  Attachments: z.array(attachmentSchema).optional(),
});

type PaymentVoucherFormValues = z.infer<typeof paymentVoucherFormSchema>;

export const PaymentVoucherForm: React.FC = () => {
  const { voucherNo } = useParams<{ voucherNo: string }>();
  const navigate = useNavigate();

  const isEditMode = !!voucherNo;
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lookup data states
  const [companies, setCompanies] = useState<Company[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [costCenters1, setCostCenters1] = useState<CostCenter1[]>([]);
  const [costCenters2, setCostCenters2] = useState<CostCenter2[]>([]);
  const [costCenters3, setCostCenters3] = useState<CostCenter3[]>([]);
  const [costCenters4, setCostCenters4] = useState<CostCenter4[]>([]);

  const form = useForm<PaymentVoucherFormValues>({
    resolver: zodResolver(paymentVoucherFormSchema),
    defaultValues: {
      TransactionDate: new Date(),
      PostingDate: new Date(),
      PaymentType: PaymentType.CASH,
      PaymentStatus: PaymentStatus.DRAFT,
      ExchangeRate: 1.0,
      IsTaxInclusive: false,
      AutoPostToGL: false,
      IsRecurring: false,
      PaymentLines: [],
      Attachments: [],
    },
  });

  const {
    fields: paymentLineFields,
    append: appendPaymentLine,
    remove: removePaymentLine,
  } = useFieldArray({
    control: form.control,
    name: "PaymentLines",
  });

  const {
    fields: attachmentFields,
    append: appendAttachment,
    remove: removeAttachment,
  } = useFieldArray({
    control: form.control,
    name: "Attachments",
  });

  // Watch specific fields for conditional logic
  const paymentType = form.watch("PaymentType");
  const selectedSupplier = form.watch("SupplierID");
  const currencyId = form.watch("CurrencyID");
  const exchangeRate = form.watch("ExchangeRate");
  const totalAmount = form.watch("TotalAmount");

  // Calculate base currency amount
  useEffect(() => {
    if (totalAmount && exchangeRate) {
      form.setValue("BaseCurrencyAmount", totalAmount * exchangeRate);
    }
  }, [totalAmount, exchangeRate, form]);

  // Fetch initial data (lookups and existing voucher in edit mode)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Fetch lookup data in parallel
        const [companiesData, suppliersData, fiscalYearsData, currenciesData, accountsData, banksData, taxesData, cc1Data, cc2Data, cc3Data, cc4Data] = await Promise.all([
          companyService.getAllCompanies(),
          supplierService.getAllSuppliers(),
          fiscalYearService.getFiscalYearsForDropdown(),
          currencyService.getAllCurrencies(),
          accountService.getAllAccounts(),
          bankService.getAllBanks(),
          taxService.getAllTaxes(),
          costCenterService.getCostCentersByLevel(1),
          costCenterService.getCostCentersByLevel(2),
          costCenterService.getCostCentersByLevel(3),
          costCenterService.getCostCentersByLevel(4),
        ]);

        setCompanies(companiesData);
        setSuppliers(suppliersData);
        setFiscalYears(fiscalYearsData);
        setCurrencies(currenciesData);
        setAccounts(accountsData);
        setBanks(banksData);
        setTaxes(taxesData);
        setCostCenters1(cc1Data);
        setCostCenters2(cc2Data as CostCenter2[]);
        setCostCenters3(cc3Data as CostCenter3[]);
        setCostCenters4(cc4Data as CostCenter4[]);

        // Set default currency if not in edit mode
        const defaultCurrency = currenciesData.find((c) => c.IsDefault);
        if (!isEditMode && defaultCurrency) {
          form.setValue("CurrencyID", defaultCurrency.CurrencyID);
        }

        if (isEditMode && voucherNo) {
          // Fetch existing voucher data
          const voucherDetails = await paymentVoucherService.getPaymentVoucherByVoucherNo(voucherNo);
          if (voucherDetails.voucher) {
            const voucher = voucherDetails.voucher;
            const lines = voucherDetails.lines;
            const attachments = voucherDetails.attachments;

            form.reset({
              VoucherNo: voucher.VoucherNo,
              TransactionDate: voucher.TransactionDate ? new Date(voucher.TransactionDate) : new Date(),
              PostingDate: voucher.PostingDate ? new Date(voucher.PostingDate) : new Date(),
              CompanyID: voucher.CompanyID,
              FiscalYearID: voucher.FiscalYearID,
              SupplierID: voucher.SupplierID,
              PaymentType: voucher.PaymentType as PaymentType,
              PaymentStatus: voucher.PaymentStatus as PaymentStatus,
              TotalAmount: voucher.TotalAmount,
              CurrencyID: voucher.CurrencyID,
              ExchangeRate: voucher.ExchangeRate,
              BaseCurrencyAmount: voucher.BaseCurrencyAmount,
              BankID: voucher.BankID,
              BankAccountNo: voucher.BankAccountNo,
              ChequeNo: voucher.ChequeNo,
              ChequeDate: voucher.ChequeDate ? new Date(voucher.ChequeDate) : undefined,
              TransactionReference: voucher.TransactionReference,
              BankAccountID: voucher.BankAccountID,
              PayableAccountID: voucher.PayableAccountID,
              Description: voucher.Description,
              Narration: voucher.Narration,
              InternalNotes: voucher.InternalNotes,
              CostCenter1ID: voucher.CostCenter1ID,
              CostCenter2ID: voucher.CostCenter2ID,
              CostCenter3ID: voucher.CostCenter3ID,
              CostCenter4ID: voucher.CostCenter4ID,
              TaxID: voucher.TaxID,
              TaxPercentage: voucher.TaxPercentage,
              TaxAmount: voucher.TaxAmount,
              IsTaxInclusive: voucher.IsTaxInclusive,
              BaseAmount: voucher.BaseAmount,
              ReferenceType: voucher.ReferenceType,
              ReferenceID: voucher.ReferenceID,
              ReferenceNo: voucher.ReferenceNo,
              AutoPostToGL: voucher.AutoPostToGL,
              IsRecurring: voucher.IsRecurring,
              RecurrencePattern: voucher.RecurrencePattern,
              PaymentLines: lines.map((line) => ({
                PostingID: line.PostingID,
                Line_No: line.Line_No,
                AccountID: line.AccountID,
                Description: line.Description,
                DebitAmount: line.DebitAmount,
                CreditAmount: line.CreditAmount,
                TaxID: line.TaxID,
                TaxPercentage: line.TaxPercentage,
                TaxAmount: line.TaxAmount,
                BaseAmount: line.BaseAmount,
                CostCenter1ID: line.CostCenter1ID,
                CostCenter2ID: line.CostCenter2ID,
                CostCenter3ID: line.CostCenter3ID,
                CostCenter4ID: line.CostCenter4ID,
              })),
              Attachments: attachments.map((attachment) => ({
                PostingAttachmentID: attachment.PostingAttachmentID,
                DocTypeID: attachment.DocTypeID,
                DocumentName: attachment.DocumentName,
                DocumentDescription: attachment.DocumentDescription,
                IsRequired: attachment.IsRequired,
                DisplayOrder: attachment.DisplayOrder,
                fileUrl: attachment.fileUrl,
              })),
            });

            // Disable form if not in Draft or Pending status
            if (voucher.PaymentStatus !== PaymentStatus.DRAFT && voucher.PaymentStatus !== PaymentStatus.PENDING) {
              toast.error("This payment voucher cannot be edited in its current status.");
            }
          } else {
            toast.error("Payment voucher not found");
            navigate("/payment-vouchers");
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load form data");
        navigate("/payment-vouchers");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [voucherNo, isEditMode, form, navigate]);

  // Handle file upload for attachments
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic validation
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error("File size cannot exceed 10MB");
        return;
      }

      appendAttachment({
        DocTypeID: 1, // Default document type
        DocumentName: file.name,
        DocumentDescription: "",
        IsRequired: false,
        DisplayOrder: attachmentFields.length,
        file: file,
      });
    }
  };

  const onSubmit = async (values: PaymentVoucherFormValues) => {
    setIsSubmitting(true);
    try {
      // Validate payment type specific requirements
      if (values.PaymentType === PaymentType.CHEQUE) {
        if (!values.ChequeNo || !values.BankID) {
          toast.error("Cheque number and bank are required for cheque payments");
          return;
        }
      }

      if (values.PaymentType === PaymentType.BANK_TRANSFER) {
        if (!values.BankID || !values.TransactionReference) {
          toast.error("Bank and transaction reference are required for bank transfers");
          return;
        }
      }

      const voucherData: Partial<PaymentVoucher> = {
        VoucherNo: values.VoucherNo,
        TransactionDate: values.TransactionDate,
        PostingDate: values.PostingDate,
        CompanyID: values.CompanyID,
        FiscalYearID: values.FiscalYearID,
        SupplierID: values.SupplierID,
        PaymentType: values.PaymentType,
        PaymentStatus: values.PaymentStatus,
        TotalAmount: values.TotalAmount,
        CurrencyID: values.CurrencyID,
        ExchangeRate: values.ExchangeRate,
        BaseCurrencyAmount: values.BaseCurrencyAmount,
        BankID: values.BankID,
        BankAccountNo: values.BankAccountNo,
        ChequeNo: values.ChequeNo,
        ChequeDate: values.ChequeDate,
        TransactionReference: values.TransactionReference,
        BankAccountID: values.BankAccountID,
        PayableAccountID: values.PayableAccountID,
        Description: values.Description,
        Narration: values.Narration,
        InternalNotes: values.InternalNotes,
        CostCenter1ID: values.CostCenter1ID,
        CostCenter2ID: values.CostCenter2ID,
        CostCenter3ID: values.CostCenter3ID,
        CostCenter4ID: values.CostCenter4ID,
        TaxID: values.TaxID,
        TaxPercentage: values.TaxPercentage,
        TaxAmount: values.TaxAmount,
        IsTaxInclusive: values.IsTaxInclusive,
        BaseAmount: values.BaseAmount,
        ReferenceType: values.ReferenceType,
        ReferenceID: values.ReferenceID,
        ReferenceNo: values.ReferenceNo,
        AutoPostToGL: values.AutoPostToGL,
        IsRecurring: values.IsRecurring,
        RecurrencePattern: values.RecurrencePattern,
      };

      const mappedPaymentLines: Partial<PaymentVoucherLine>[] =
        values.PaymentLines?.map((line, index) => ({
          PostingID: line.PostingID,
          Line_No: line.Line_No || index + 1,
          AccountID: line.AccountID,
          Description: line.Description,
          DebitAmount: line.DebitAmount,
          CreditAmount: line.CreditAmount,
          TaxID: line.TaxID,
          TaxPercentage: line.TaxPercentage,
          TaxAmount: line.TaxAmount,
          BaseAmount: line.BaseAmount,
          CostCenter1ID: line.CostCenter1ID,
          CostCenter2ID: line.CostCenter2ID,
          CostCenter3ID: line.CostCenter3ID,
          CostCenter4ID: line.CostCenter4ID,
        })) || [];

      const mappedAttachments: Partial<PaymentVoucherAttachment>[] =
        values.Attachments?.map((attachment) => ({
          PostingAttachmentID: attachment.PostingAttachmentID,
          DocTypeID: attachment.DocTypeID,
          DocumentName: attachment.DocumentName,
          DocumentDescription: attachment.DocumentDescription,
          IsRequired: attachment.IsRequired,
          DisplayOrder: attachment.DisplayOrder,
          file: attachment.file,
        })) || [];

      if (isEditMode) {
        const updateRequest = {
          voucher: { ...voucherData, VoucherNo: voucherNo! },
          paymentLines: mappedPaymentLines,
          attachments: mappedAttachments,
        };
        const response = await paymentVoucherService.updatePaymentVoucher(updateRequest);
        if (response.Status === 1) {
          toast.success("Payment voucher updated successfully");
          navigate(`/payment-vouchers/${voucherNo}`);
        } else {
          toast.error(response.Message || "Failed to update payment voucher");
        }
      } else {
        const createRequest = {
          voucher: voucherData,
          paymentLines: mappedPaymentLines,
          attachments: mappedAttachments,
        };
        const response = await paymentVoucherService.createPaymentVoucher(createRequest);
        if (response.Status === 1) {
          toast.success("Payment voucher created successfully");
          navigate(`/payment-vouchers/${response.VoucherNo}`);
        } else {
          toast.error(response.Message || "Failed to create payment voucher");
        }
      }
    } catch (error) {
      console.error("Error submitting payment voucher:", error);
      toast.error("Failed to save payment voucher");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const canEdit = !isEditMode || form.watch("PaymentStatus") === PaymentStatus.DRAFT || form.watch("PaymentStatus") === PaymentStatus.PENDING;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{isEditMode ? "Edit Payment Voucher" : "New Payment Voucher"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs defaultValue="header" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="header">Header Details</TabsTrigger>
                  <TabsTrigger value="lines">Payment Lines ({paymentLineFields.length})</TabsTrigger>
                  <TabsTrigger value="attachments">Attachments ({attachmentFields.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="header" className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="VoucherNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voucher Number</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isEditMode || !canEdit} value={field.value || ""} placeholder="Auto-generated" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="TransactionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transaction Date</FormLabel>
                          <div>
                            <DatePicker value={field.value} onChange={field.onChange} disabled={!canEdit} />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="PostingDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Posting Date</FormLabel>
                          <div>
                            <DatePicker value={field.value} onChange={field.onChange} disabled={!canEdit} />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="CompanyID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()} disabled={!canEdit}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Company" />
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
                      name="FiscalYearID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fiscal Year</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()} disabled={!canEdit}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Fiscal Year" />
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
                      name="SupplierID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()} disabled={!canEdit}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Supplier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {suppliers.map((supplier) => (
                                <SelectItem key={supplier.SupplierID} value={supplier.SupplierID.toString()}>
                                  {supplier.SupplierName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Payment Information */}
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="PaymentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!canEdit}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Payment Type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(PaymentType).map((type) => (
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
                      name="TotalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Amount</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} disabled={!canEdit} />
                          </FormControl>
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
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()} disabled={!canEdit}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencies.map((currency) => (
                                <SelectItem key={currency.CurrencyID} value={currency.CurrencyID.toString()}>
                                  {currency.CurrencyName}
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
                            <Input type="number" step="0.0001" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)} disabled={!canEdit} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="BankAccountID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank/Cash Account</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()} disabled={!canEdit}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accounts
                                //.filter((acc) => acc.AccountType === "Bank" || acc.AccountType === "Cash")
                                .map((account) => (
                                  <SelectItem key={account.AccountID} value={account.AccountID.toString()}>
                                    {account.AccountCode} - {account.AccountName}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Bank/Cheque Details - Show based on payment type */}
                  {(paymentType === PaymentType.CHEQUE || paymentType === PaymentType.BANK_TRANSFER) && (
                    <>
                      <Separator />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="BankID"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank {paymentType === PaymentType.CHEQUE ? "*" : ""}</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()} disabled={!canEdit}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Bank" />
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
                        {paymentType === PaymentType.CHEQUE && (
                          <>
                            <FormField
                              control={form.control}
                              name="ChequeNo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cheque Number *</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ""} disabled={!canEdit} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="ChequeDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cheque Date</FormLabel>
                                  <div>
                                    <DatePicker value={field.value} onChange={field.onChange} disabled={!canEdit} />
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                        {paymentType === PaymentType.BANK_TRANSFER && (
                          <FormField
                            control={form.control}
                            name="TransactionReference"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Transaction Reference *</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} disabled={!canEdit} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <FormField
                          control={form.control}
                          name="BankAccountNo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank Account Number</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} disabled={!canEdit} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}

                  {/* Description and Notes */}
                  <Separator />
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="Description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""} disabled={!canEdit} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="Narration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Narration</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""} disabled={!canEdit} />
                          </FormControl>
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
                            <Textarea {...field} value={field.value || ""} disabled={!canEdit} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Reference Information */}
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="ReferenceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""} disabled={!canEdit}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Reference Type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Invoice">Invoice</SelectItem>
                              <SelectItem value="Advance">Advance</SelectItem>
                              <SelectItem value="Expense">Expense</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ReferenceNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference Number</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} disabled={!canEdit} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ReferenceID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference ID</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)} value={field.value || ""} disabled={!canEdit} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Additional Options */}
                  <Separator />
                  <div className="flex flex-wrap gap-6">
                    <FormField
                      control={form.control}
                      name="AutoPostToGL"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!canEdit} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Auto Post to GL</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="IsRecurring"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!canEdit} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Recurring Payment</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="lines" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Payment Lines</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        appendPaymentLine({
                          AccountID: 0,
                          Description: "",
                          DebitAmount: 0,
                          CreditAmount: 0,
                        })
                      }
                      disabled={!canEdit}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Line
                    </Button>
                  </div>

                  {paymentLineFields.map((field, index) => (
                    <Card key={field.id} className="p-4 relative">
                      <div className="absolute top-2 right-2">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removePaymentLine(index)} disabled={!canEdit}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`PaymentLines.${index}.AccountID`}
                          render={({ field: lineField }) => (
                            <FormItem>
                              <FormLabel>Account</FormLabel>
                              <Select onValueChange={(value) => lineField.onChange(parseInt(value))} value={lineField.value?.toString()} disabled={!canEdit}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Account" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {accounts.map((account) => (
                                    <SelectItem key={account.AccountID} value={account.AccountID.toString()}>
                                      {account.AccountCode} - {account.AccountName}
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
                          name={`PaymentLines.${index}.DebitAmount`}
                          render={({ field: lineField }) => (
                            <FormItem>
                              <FormLabel>Debit Amount</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...lineField} onChange={(e) => lineField.onChange(parseFloat(e.target.value) || 0)} disabled={!canEdit} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`PaymentLines.${index}.CreditAmount`}
                          render={({ field: lineField }) => (
                            <FormItem>
                              <FormLabel>Credit Amount</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...lineField} onChange={(e) => lineField.onChange(parseFloat(e.target.value) || 0)} disabled={!canEdit} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`PaymentLines.${index}.Description`}
                          render={({ field: lineField }) => (
                            <FormItem className="md:col-span-2 lg:col-span-3">
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input {...lineField} value={lineField.value || ""} disabled={!canEdit} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Card>
                  ))}

                  {paymentLineFields.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No payment lines added. The system will create default entries based on the payment information.</div>
                  )}
                </TabsContent>

                <TabsContent value="attachments" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Attachments</h3>
                    <div>
                      <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif" disabled={!canEdit} />
                      <Button type="button" variant="outline" onClick={() => document.getElementById("file-upload")?.click()} disabled={!canEdit}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                      </Button>
                    </div>
                  </div>

                  {attachmentFields.map((field, index) => (
                    <Card key={field.id} className="p-4 relative">
                      <div className="absolute top-2 right-2">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeAttachment(index)} disabled={!canEdit}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <AttachmentThumbnail fileName={field.DocumentName || "Document"} fileType={(field as any).file?.type} fileUrl={(field as any).fileUrl} />
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`Attachments.${index}.DocumentName`}
                            render={({ field: attachField }) => (
                              <FormItem>
                                <FormLabel>Document Name</FormLabel>
                                <FormControl>
                                  <Input {...attachField} value={attachField.value || ""} disabled={!canEdit} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`Attachments.${index}.DocumentDescription`}
                            render={({ field: attachField }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Input {...attachField} value={attachField.value || ""} disabled={!canEdit} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}

                  {attachmentFields.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No attachments uploaded. Click "Upload File" to add supporting documents.</div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => navigate("/payment-vouchers")} disabled={isSubmitting}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !canEdit}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? "Update Payment Voucher" : "Create Payment Voucher"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentVoucherForm;
