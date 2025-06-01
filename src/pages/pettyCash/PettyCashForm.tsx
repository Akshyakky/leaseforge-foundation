import React, { useEffect, useState } from "react";
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
import { ArrowLeft, Loader2, Save, Plus, Trash2, Upload, FileText, AlertCircle, Calculator, Building, Network } from "lucide-react";
import { pettyCashService } from "@/services/pettyCashService";
import { accountService } from "@/services/accountService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { currencyService } from "@/services/currencyService";
import { bankService } from "@/services/bankService";
import { supplierService } from "@/services/supplierService";
import { taxService } from "@/services/taxService";
import { docTypeService } from "@/services/docTypeService";
import { costCenterService } from "@/services/costCenterService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { PettyCashVoucher, PettyCashVoucherLine, PettyCashAttachment, TransactionType } from "@/types/pettyCashTypes";
import { Account } from "@/types/accountTypes";
import { Company } from "@/services/companyService";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Currency } from "@/services/currencyService";
import { Bank } from "@/types/bankTypes";
import { Tax } from "@/services/taxService";
import { DocType } from "@/services/docTypeService";
import { CostCenter1, CostCenter2, CostCenter3, CostCenter4 } from "@/types/costCenterTypes";

// Enhanced schema with cost centers
const voucherLineSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  transactionType: z.enum(["Debit", "Credit"], { required_error: "Transaction type is required" }),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().optional(),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  taxPercentage: z.coerce.number().min(0).max(100).optional(),
  // Line-level cost centers
  lineCostCenter1Id: z.string().optional(),
  lineCostCenter2Id: z.string().optional(),
  lineCostCenter3Id: z.string().optional(),
  lineCostCenter4Id: z.string().optional(),
});

const attachmentSchema = z.object({
  docTypeId: z.string().min(1, "Document type is required"),
  documentName: z.string().min(1, "Document name is required"),
  documentDescription: z.string().optional(),
  isRequired: z.boolean().optional(),
  file: z.any().optional(),
});

const pettyCashVoucherSchema = z.object({
  voucherNo: z.string().optional(),
  transactionDate: z.date({ required_error: "Transaction date is required" }),
  postingDate: z.date().optional(),
  companyId: z.string().min(1, "Company is required"),
  fiscalYearId: z.string().min(1, "Fiscal year is required"),
  currencyId: z.string().min(1, "Currency is required"),
  exchangeRate: z.coerce.number().min(0.0001, "Exchange rate must be greater than 0").optional(),
  description: z.string().optional(),
  narration: z.string().optional(),
  paidTo: z.string().optional(),
  invoiceNo: z.string().optional(),
  refNo: z.string().optional(),
  chequeNo: z.string().optional(),
  chequeDate: z.date().optional(),
  bankId: z.string().optional(),
  taxId: z.string().optional(),
  isTaxInclusive: z.boolean().optional(),
  // Voucher-level cost centers
  costCenter1Id: z.string().optional(),
  costCenter2Id: z.string().optional(),
  costCenter3Id: z.string().optional(),
  costCenter4Id: z.string().optional(),
  lines: z.array(voucherLineSchema).min(1, "At least one voucher line is required"),
  attachments: z.array(attachmentSchema).optional(),
});

type PettyCashVoucherFormValues = z.infer<typeof pettyCashVoucherSchema>;

const PettyCashForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [voucher, setVoucher] = useState<PettyCashVoucher | null>(null);

  // Reference data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);

  // Cost center data
  const [costCenters1, setCostCenters1] = useState<CostCenter1[]>([]);
  const [costCenters2, setCostCenters2] = useState<CostCenter2[]>([]);
  const [costCenters3, setCostCenters3] = useState<CostCenter3[]>([]);
  const [costCenters4, setCostCenters4] = useState<CostCenter4[]>([]);

  // Initialize form
  const form = useForm<PettyCashVoucherFormValues>({
    resolver: zodResolver(pettyCashVoucherSchema),
    defaultValues: {
      voucherNo: "",
      transactionDate: new Date(),
      companyId: "",
      fiscalYearId: "",
      currencyId: "",
      exchangeRate: 1,
      description: "",
      narration: "",
      paidTo: "",
      invoiceNo: "",
      refNo: "",
      chequeNo: "",
      bankId: "",
      taxId: "",
      isTaxInclusive: false,
      costCenter1Id: "",
      costCenter2Id: "",
      costCenter3Id: "",
      costCenter4Id: "",
      lines: [{ accountId: "", transactionType: "Debit" as TransactionType, amount: 0 }],
      attachments: [],
    },
  });

  // Field arrays for dynamic sections
  const {
    fields: lineFields,
    append: appendLine,
    remove: removeLine,
  } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const {
    fields: attachmentFields,
    append: appendAttachment,
    remove: removeAttachment,
  } = useFieldArray({
    control: form.control,
    name: "attachments",
  });

  // Initialize and fetch data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        await fetchReferenceData();

        // If editing, fetch the voucher data
        if (isEdit && id) {
          const voucherData = await pettyCashService.getVoucherForEdit(id);

          if (voucherData.voucher) {
            setVoucher(voucherData.voucher);

            // Set form values including cost centers
            form.reset({
              voucherNo: voucherData.voucher.VoucherNo,
              transactionDate: new Date(voucherData.voucher.TransactionDate),
              postingDate: voucherData.voucher.PostingDate ? new Date(voucherData.voucher.PostingDate) : undefined,
              companyId: voucherData.voucher.CompanyID.toString(),
              fiscalYearId: voucherData.voucher.FiscalYearID.toString(),
              currencyId: voucherData.voucher.CurrencyID.toString(),
              exchangeRate: voucherData.voucher.ExchangeRate || 1,
              description: voucherData.voucher.Description || "",
              narration: voucherData.voucher.Narration || "",
              paidTo: voucherData.voucher.PaidTo || "",
              invoiceNo: voucherData.voucher.InvoiceNo || "",
              refNo: voucherData.voucher.RefNo || "",
              chequeNo: voucherData.voucher.ChequeNo || "",
              chequeDate: voucherData.voucher.ChequeDate ? new Date(voucherData.voucher.ChequeDate) : undefined,
              bankId: voucherData.voucher.BankID?.toString() || "",
              taxId: voucherData.voucher.TaxID?.toString() || "",
              isTaxInclusive: voucherData.voucher.IsTaxInclusive || false,
              // Cost centers
              costCenter1Id: voucherData.voucher.CostCenter1ID?.toString() || "",
              costCenter2Id: voucherData.voucher.CostCenter2ID?.toString() || "",
              costCenter3Id: voucherData.voucher.CostCenter3ID?.toString() || "",
              costCenter4Id: voucherData.voucher.CostCenter4ID?.toString() || "",
              lines: voucherData.lines.map((line) => ({
                accountId: line.AccountID.toString(),
                transactionType: line.TransactionType,
                amount: line.TransactionType === "Debit" ? line.DebitAmount : line.CreditAmount,
                description: line.LineDescription || "",
                customerId: line.CustomerID?.toString() || "",
                supplierId: line.SupplierID?.toString() || "",
                taxPercentage: line.TaxPercentage || undefined,
                // Line-level cost centers
                lineCostCenter1Id: line.LineCostCenter1ID?.toString() || "",
                lineCostCenter2Id: line.LineCostCenter2ID?.toString() || "",
                lineCostCenter3Id: line.LineCostCenter3ID?.toString() || "",
                lineCostCenter4Id: line.LineCostCenter4ID?.toString() || "",
              })),
              attachments: voucherData.attachments.map((attachment) => ({
                docTypeId: attachment.DocTypeID.toString(),
                documentName: attachment.DocumentName,
                documentDescription: attachment.DocumentDescription || "",
                isRequired: attachment.IsRequired || false,
              })),
            });
          } else {
            toast.error("Voucher not found");
            navigate("/petty-cash");
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

  // Fetch reference data including cost centers
  const fetchReferenceData = async () => {
    try {
      const [accountsData, companiesData, fiscalYearsData, currenciesData, banksData, taxesData, docTypesData, costCenters1Data] = await Promise.all([
        accountService.getAllAccounts(),
        companyService.getCompaniesForDropdown(true),
        fiscalYearService.getFiscalYearsForDropdown({ filterIsActive: true }),
        currencyService.getCurrenciesForDropdown(),
        bankService.getAllBanks(),
        taxService.getAllTaxes(),
        docTypeService.getAllDocTypes(),
        costCenterService.getCostCentersByLevel(1),
      ]);

      setAccounts(accountsData.filter((account) => account.IsActive && account.IsPostable));
      setCompanies(companiesData);
      setFiscalYears(fiscalYearsData);
      setCurrencies(currenciesData);
      setBanks(banksData.filter((bank) => bank.IsActive));
      setTaxes(taxesData);
      setDocTypes(docTypesData);
      setCostCenters1(costCenters1Data as CostCenter1[]);
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Error loading reference data");
    }
  };

  // Load child cost centers when parent changes
  const loadChildCostCenters = async (level: number, parentIds: { CostCenter1ID?: number; CostCenter2ID?: number; CostCenter3ID?: number }) => {
    try {
      const childCostCenters = await costCenterService.getCostCentersByLevel(level, parentIds);

      switch (level) {
        case 2:
          setCostCenters2(childCostCenters as CostCenter2[]);
          break;
        case 3:
          setCostCenters3(childCostCenters as CostCenter3[]);
          break;
        case 4:
          setCostCenters4(childCostCenters as CostCenter4[]);
          break;
      }
    } catch (error) {
      console.error(`Error loading cost centers level ${level}:`, error);
    }
  };

  // Watch for cost center hierarchy changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "costCenter1Id" && value.costCenter1Id) {
        const costCenter1Id = parseInt(value.costCenter1Id);
        loadChildCostCenters(2, { CostCenter1ID: costCenter1Id });
        // Reset child selections
        form.setValue("costCenter2Id", "");
        form.setValue("costCenter3Id", "");
        form.setValue("costCenter4Id", "");
        setCostCenters3([]);
        setCostCenters4([]);
      } else if (name === "costCenter2Id" && value.costCenter2Id) {
        const costCenter1Id = parseInt(value.costCenter1Id || "0");
        const costCenter2Id = parseInt(value.costCenter2Id);
        loadChildCostCenters(3, { CostCenter1ID: costCenter1Id, CostCenter2ID: costCenter2Id });
        // Reset child selections
        form.setValue("costCenter3Id", "");
        form.setValue("costCenter4Id", "");
        setCostCenters4([]);
      } else if (name === "costCenter3Id" && value.costCenter3Id) {
        const costCenter1Id = parseInt(value.costCenter1Id || "0");
        const costCenter2Id = parseInt(value.costCenter2Id || "0");
        const costCenter3Id = parseInt(value.costCenter3Id);
        loadChildCostCenters(4, { CostCenter1ID: costCenter1Id, CostCenter2ID: costCenter2Id, CostCenter3ID: costCenter3Id });
        // Reset child selections
        form.setValue("costCenter4Id", "");
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Submit handler for the voucher form
  const onSubmit = async (data: PettyCashVoucherFormValues) => {
    setLoading(true);

    try {
      // Validate that debits equal credits
      const totalDebits = data.lines.filter((line) => line.transactionType === "Debit").reduce((sum, line) => sum + line.amount, 0);
      const totalCredits = data.lines.filter((line) => line.transactionType === "Credit").reduce((sum, line) => sum + line.amount, 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        toast.error("Total debits must equal total credits");
        setLoading(false);
        return;
      }

      // Prepare voucher data with cost centers
      const voucherData = {
        VoucherNo: data.voucherNo,
        TransactionDate: data.transactionDate.toISOString(),
        PostingDate: data.postingDate?.toISOString() || data.transactionDate.toISOString(),
        CompanyID: parseInt(data.companyId),
        FiscalYearID: parseInt(data.fiscalYearId),
        CurrencyID: parseInt(data.currencyId),
        ExchangeRate: data.exchangeRate || 1,
        Description: data.description?.trim() || undefined,
        Narration: data.narration?.trim() || undefined,
        PaidTo: data.paidTo?.trim() || undefined,
        InvoiceNo: data.invoiceNo?.trim() || undefined,
        RefNo: data.refNo?.trim() || undefined,
        ChequeNo: data.chequeNo?.trim() || undefined,
        ChequeDate: data.chequeDate?.toISOString() || undefined,
        BankID: data.bankId ? parseInt(data.bankId) : undefined,
        TaxID: data.taxId ? parseInt(data.taxId) : undefined,
        IsTaxInclusive: data.isTaxInclusive || false,
        // Voucher-level cost centers
        CostCenter1ID: data.costCenter1Id ? parseInt(data.costCenter1Id) : undefined,
        CostCenter2ID: data.costCenter2Id ? parseInt(data.costCenter2Id) : undefined,
        CostCenter3ID: data.costCenter3Id ? parseInt(data.costCenter3Id) : undefined,
        CostCenter4ID: data.costCenter4Id ? parseInt(data.costCenter4Id) : undefined,
      };

      // Prepare lines data with line-level cost centers
      const linesData = data.lines.map((line) => ({
        AccountID: parseInt(line.accountId),
        TransactionType: line.transactionType as TransactionType,
        DebitAmount: line.transactionType === "Debit" ? line.amount : 0,
        CreditAmount: line.transactionType === "Credit" ? line.amount : 0,
        BaseAmount: line.amount,
        TaxPercentage: line.taxPercentage || 0,
        LineTaxAmount: line.taxPercentage ? (line.amount * line.taxPercentage) / 100 : 0,
        LineDescription: line.description?.trim() || undefined,
        CustomerID: line.customerId ? parseInt(line.customerId) : undefined,
        SupplierID: line.supplierId ? parseInt(line.supplierId) : undefined,
        // Line-level cost centers (these override voucher-level if specified)
        LineCostCenter1ID: line.lineCostCenter1Id ? parseInt(line.lineCostCenter1Id) : undefined,
        LineCostCenter2ID: line.lineCostCenter2Id ? parseInt(line.lineCostCenter2Id) : undefined,
        LineCostCenter3ID: line.lineCostCenter3Id ? parseInt(line.lineCostCenter3Id) : undefined,
        LineCostCenter4ID: line.lineCostCenter4Id ? parseInt(line.lineCostCenter4Id) : undefined,
      }));

      // Prepare attachments data
      const attachmentsData =
        data.attachments?.map((attachment) => ({
          DocTypeID: parseInt(attachment.docTypeId),
          DocumentName: attachment.documentName.trim(),
          DocumentDescription: attachment.documentDescription?.trim() || undefined,
          IsRequired: attachment.isRequired || false,
          file: attachment.file,
        })) || [];

      if (isEdit && voucher) {
        // Update existing voucher
        const result = await pettyCashService.updateVoucher({
          voucherNo: voucher.VoucherNo,
          voucher: voucherData,
          lines: linesData,
          attachments: attachmentsData,
        });

        if (result.success) {
          toast.success(result.message);
          navigate("/petty-cash");
        } else {
          toast.error(result.message);
        }
      } else {
        // Create new voucher
        const result = await pettyCashService.createVoucher({
          voucher: voucherData,
          lines: linesData,
          attachments: attachmentsData,
        });

        if (result.success) {
          toast.success(result.message);
          navigate("/petty-cash");
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error("Error saving voucher:", error);
      toast.error("Failed to save voucher");
    } finally {
      setLoading(false);
    }
  };

  // Add new voucher line
  const addVoucherLine = () => {
    appendLine({ accountId: "", transactionType: "Debit", amount: 0 });
  };

  // Remove voucher line
  const removeVoucherLine = (index: number) => {
    if (lineFields.length > 1) {
      removeLine(index);
    }
  };

  // Add new attachment
  const addAttachment = () => {
    appendAttachment({ docTypeId: "", documentName: "", isRequired: false });
  };

  // Remove attachment
  const removeAttachmentItem = (index: number) => {
    removeAttachment(index);
  };

  // Handle file upload
  const handleFileUpload = (index: number, file: File | null) => {
    if (file) {
      form.setValue(`attachments.${index}.file`, file);
      if (!form.getValues(`attachments.${index}.documentName`)) {
        form.setValue(`attachments.${index}.documentName`, file.name);
      }
    }
  };

  // Calculate totals
  const lines = form.watch("lines");
  const totalDebits = lines.filter((line) => line.transactionType === "Debit").reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const totalCredits = lines.filter((line) => line.transactionType === "Credit").reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const difference = totalDebits - totalCredits;

  // Cancel button handler
  const handleCancel = () => {
    navigate("/petty-cash");
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
        <Button variant="outline" size="icon" onClick={() => navigate("/petty-cash")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Petty Cash Voucher" : "Create Petty Cash Voucher"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle>Voucher Information</CardTitle>
              <CardDescription>Enter the basic voucher details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField form={form} name="voucherNo" label="Voucher Number" placeholder="Auto-generated" disabled={isEdit} description="Unique voucher number" />
                <FormField form={form} name="transactionDate" label="Transaction Date" type="date" required description="Date of the transaction" />
                <FormField form={form} name="postingDate" label="Posting Date" type="date" description="Date for posting (defaults to transaction date)" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  description="Company for this voucher"
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
                  description="Fiscal year for this voucher"
                />
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
                  required
                  description="Currency for this voucher"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField form={form} name="description" label="Description" placeholder="Enter voucher description" description="Brief description of the voucher" />
                <FormField form={form} name="paidTo" label="Paid To" placeholder="Enter payee name" description="Name of the person/entity paid" />
              </div>

              <FormField form={form} name="narration" label="Narration" type="textarea" placeholder="Enter detailed narration" description="Detailed description or notes" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField form={form} name="invoiceNo" label="Invoice Number" placeholder="Enter invoice number" description="Related invoice number" />
                <FormField form={form} name="refNo" label="Reference Number" placeholder="Enter reference number" description="External reference number" />
                <FormField form={form} name="exchangeRate" label="Exchange Rate" type="number" step="0.0001" placeholder="1.0000" description="Exchange rate to base currency" />
              </div>

              {/* Cost Center Section */}
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Cost Centers</h3>
                  <Badge variant="secondary">Voucher Level</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <FormField
                    form={form}
                    name="costCenter1Id"
                    label="Cost Center Level 1"
                    type="select"
                    options={costCenters1.map((cc) => ({
                      label: cc.Description,
                      value: cc.CostCenter1ID.toString(),
                    }))}
                    placeholder="Select level 1"
                    description="Primary cost center"
                  />
                  <FormField
                    form={form}
                    name="costCenter2Id"
                    label="Cost Center Level 2"
                    type="select"
                    options={costCenters2.map((cc) => ({
                      label: cc.Description,
                      value: cc.CostCenter2ID.toString(),
                    }))}
                    placeholder="Select level 2"
                    description="Secondary cost center"
                    disabled={!form.watch("costCenter1Id")}
                  />
                  <FormField
                    form={form}
                    name="costCenter3Id"
                    label="Cost Center Level 3"
                    type="select"
                    options={costCenters3.map((cc) => ({
                      label: cc.Description,
                      value: cc.CostCenter3ID.toString(),
                    }))}
                    placeholder="Select level 3"
                    description="Tertiary cost center"
                    disabled={!form.watch("costCenter2Id")}
                  />
                  <FormField
                    form={form}
                    name="costCenter4Id"
                    label="Cost Center Level 4"
                    type="select"
                    options={costCenters4.map((cc) => ({
                      label: cc.Description,
                      value: cc.CostCenter4ID.toString(),
                    }))}
                    placeholder="Select level 4"
                    description="Quaternary cost center"
                    disabled={!form.watch("costCenter3Id")}
                  />
                </div>
              </div>

              {/* Bank and Cheque Details */}
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  form={form}
                  name="bankId"
                  label="Bank"
                  type="select"
                  options={banks.map((bank) => ({
                    label: bank.BankName,
                    value: bank.BankID.toString(),
                  }))}
                  placeholder="Select bank"
                  description="Bank for cheque payments"
                />
                <FormField form={form} name="chequeNo" label="Cheque Number" placeholder="Enter cheque number" description="Cheque number if applicable" />
                <FormField form={form} name="chequeDate" label="Cheque Date" type="date" description="Date on the cheque" />
              </div>

              {/* Tax Information */}
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="taxId"
                  label="Tax"
                  type="select"
                  options={taxes.map((tax) => ({
                    label: `${tax.TaxCode} - ${tax.TaxName} (${tax.TaxRate}%)`,
                    value: tax.TaxID.toString(),
                  }))}
                  placeholder="Select tax"
                  description="Applicable tax"
                />
                <FormField form={form} name="isTaxInclusive" label="Tax Inclusive" type="switch" description="Whether amounts include tax" />
              </div>
            </CardContent>
          </Card>

          {/* Voucher Lines */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Voucher Lines</CardTitle>
                  <CardDescription>Add debit and credit entries with optional line-level cost centers</CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={addVoucherLine}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Line
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Account</TableHead>
                      <TableHead className="w-[100px]">Type</TableHead>
                      <TableHead className="w-[120px]">Amount</TableHead>
                      <TableHead className="w-[150px]">Description</TableHead>
                      <TableHead className="w-[150px]">Cost Centers</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineFields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <FormField
                            form={form}
                            name={`lines.${index}.accountId`}
                            type="select"
                            options={accounts.map((account) => ({
                              label: `${account.AccountCode} - ${account.AccountName}`,
                              value: account.AccountID.toString(),
                            }))}
                            placeholder="Select account"
                            className="min-w-[180px]"
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            form={form}
                            name={`lines.${index}.transactionType`}
                            type="select"
                            options={[
                              { label: "Debit", value: "Debit" },
                              { label: "Credit", value: "Credit" },
                            ]}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField form={form} name={`lines.${index}.amount`} type="number" step="0.01" placeholder="0.00" className="w-[100px]" />
                        </TableCell>
                        <TableCell>
                          <FormField form={form} name={`lines.${index}.description`} placeholder="Line description" className="min-w-[130px]" />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <FormField
                              form={form}
                              name={`lines.${index}.lineCostCenter1Id`}
                              type="select"
                              options={costCenters1.map((cc) => ({
                                label: cc.Description,
                                value: cc.CostCenter1ID.toString(),
                              }))}
                              placeholder="CC Level 1"
                              className="min-w-[130px] text-xs"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeVoucherLine(index)} disabled={lineFields.length === 1}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Balance Summary */}
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Balance Summary:</span>
                    </div>
                    <div className="text-sm">
                      Debits: <span className="font-mono">{totalDebits.toFixed(2)}</span>
                    </div>
                    <div className="text-sm">
                      Credits: <span className="font-mono">{totalCredits.toFixed(2)}</span>
                    </div>
                    <div className="text-sm">
                      Difference: <span className={`font-mono ${Math.abs(difference) > 0.01 ? "text-red-600" : "text-green-600"}`}>{difference.toFixed(2)}</span>
                    </div>
                  </div>
                  {Math.abs(difference) > 0.01 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Out of Balance
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Attachments</CardTitle>
                  <CardDescription>Upload supporting documents</CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={addAttachment}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Attachment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {attachmentFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4" />
                  <p>No attachments added. Click "Add Attachment" to upload documents.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attachmentFields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormField
                          form={form}
                          name={`attachments.${index}.docTypeId`}
                          label="Document Type"
                          type="select"
                          options={docTypes.map((docType) => ({
                            label: docType.Description,
                            value: docType.DocTypeID.toString(),
                          }))}
                          placeholder="Select document type"
                        />
                        <FormField form={form} name={`attachments.${index}.documentName`} label="Document Name" placeholder="Enter document name" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormField form={form} name={`attachments.${index}.documentDescription`} label="Description" placeholder="Enter description" />
                        <FormField form={form} name={`attachments.${index}.isRequired`} label="Required" type="switch" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input type="file" id={`file-${index}`} className="hidden" onChange={(e) => handleFileUpload(index, e.target.files?.[0] || null)} />
                          <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`file-${index}`)?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            Choose File
                          </Button>
                          {form.watch(`attachments.${index}.file`) && (
                            <span className="text-sm text-muted-foreground">{(form.watch(`attachments.${index}.file`) as File)?.name}</span>
                          )}
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachmentItem(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <Card>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || Math.abs(difference) > 0.01}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Voucher
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

export default PettyCashForm;
