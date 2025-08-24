// src/pages/pettyCash/PettyCashForm.tsx - Enhanced with approval protection and improved UI
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  Calculator,
  Building,
  Network,
  Lock,
  Shield,
  CheckCircle,
  RotateCcw,
  PlusCircle,
  Edit2,
  Download,
  HandCoins,
  Receipt,
} from "lucide-react";
import { pettyCashService } from "@/services/pettyCashService";
import { accountService } from "@/services/accountService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { currencyService } from "@/services/currencyService";
import { bankService } from "@/services/bankService";
import { customerService } from "@/services/customerService";
import { supplierService } from "@/services/supplierService";
import { taxService } from "@/services/taxService";
import { docTypeService } from "@/services/docTypeService";
import { costCenterService } from "@/services/costCenterService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { PettyCashVoucher, TransactionType, VoucherStatus, ApprovalStatus } from "@/types/pettyCashTypes";
import { Account } from "@/types/accountTypes";
import { Company } from "@/services/companyService";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Currency } from "@/services/currencyService";
import { Bank } from "@/types/bankTypes";
import { Tax } from "@/services/taxService";
import { DocType } from "@/services/docTypeService";
import { CostCenter1, CostCenter2, CostCenter3, CostCenter4 } from "@/types/costCenterTypes";
import { useAppSelector } from "@/lib/hooks";
import { format } from "date-fns";
import { AttachmentThumbnail } from "@/components/attachments/AttachmentThumbnail";
import { AttachmentPreview } from "@/components/attachments/AttachmentPreview";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { FileTypeIcon } from "@/components/attachments/FileTypeIcon";
import { Switch } from "@/components/ui/switch";

// Enhanced schema with better validation
const voucherLineSchema = z
  .object({
    accountId: z.string().min(1, "Account is required"),
    transactionType: z.enum(["Debit", "Credit"], { required_error: "Transaction type is required" }),
    debitAmount: z.coerce.number().min(0).optional(),
    creditAmount: z.coerce.number().min(0).optional(),
    description: z.string().optional(),
    customerId: z.string().optional(),
    supplierId: z.string().optional(),
    taxId: z.string().optional(),
    taxPercentage: z.coerce.number().min(0).max(100).optional(),
    lineTaxAmount: z.coerce.number().min(0).optional(),
    // Line-level cost centers
    lineCostCenter1Id: z.string().optional(),
    lineCostCenter2Id: z.string().optional(),
    lineCostCenter3Id: z.string().optional(),
    lineCostCenter4Id: z.string().optional(),
  })
  .refine(
    (data) => {
      const debit = data.debitAmount || 0;
      const credit = data.creditAmount || 0;
      return debit > 0 !== credit > 0; // XOR: exactly one should be greater than 0
    },
    {
      message: "Each line must have either a debit amount or credit amount, but not both",
      path: ["debitAmount"],
    }
  );

const attachmentSchema = z.object({
  PettyCashAttachmentID: z.number().optional(),
  docTypeId: z.string().min(1, "Document type is required"),
  documentName: z.string().min(1, "Document name is required"),
  documentDescription: z.string().optional(),
  isRequired: z.boolean().optional(),
  displayOrder: z.number().optional(),
  file: z.any().optional(),
});

const pettyCashVoucherSchema = z.object({
  voucherNo: z.string().optional(),
  voucherType: z.string().default("Petty Cash"),
  transactionDate: z.date({ required_error: "Transaction date is required" }),
  postingDate: z.date().optional(),
  companyId: z.string().min(1, "Company is required"),
  fiscalYearId: z.string().min(1, "Fiscal year is required"),
  currencyId: z.string().min(1, "Currency is required"),
  exchangeRate: z.coerce.number().min(0.0001, "Exchange rate must be greater than 0").default(1),
  description: z.string().optional(),
  narration: z.string().optional(),
  paidTo: z.string().optional(),
  invoiceNo: z.string().optional(),
  refNo: z.string().optional(),
  chequeNo: z.string().optional(),
  chequeDate: z.date().optional(),
  bankId: z.string().optional(),
  taxId: z.string().optional(),
  isTaxInclusive: z.boolean().default(false),
  // Voucher-level cost centers
  costCenter1Id: z.string().optional(),
  costCenter2Id: z.string().optional(),
  costCenter3Id: z.string().optional(),
  costCenter4Id: z.string().optional(),
  lines: z.array(voucherLineSchema).min(1, "At least one voucher line is required"),
  attachments: z.array(attachmentSchema).optional(),
});

type PettyCashVoucherFormValues = z.infer<typeof pettyCashVoucherSchema>;

// Create document type dialog component
const CreateDocTypeDialog = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (docType: any) => void }) => {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!description.trim()) {
        toast.error("Description is required");
        return;
      }

      const newTypeId = await docTypeService.createDocType({
        Description: description,
      });

      if (newTypeId) {
        const newDocType = {
          DocTypeID: newTypeId,
          Description: description,
        };
        onSave(newDocType);
        setDescription("");
        onClose();
        toast.success(`Document type "${description}" created successfully`);
      }
    } catch (error) {
      console.error("Error creating document type:", error);
      toast.error("Failed to create document type");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Document Type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="docTypeDescription">Description</Label>
              <Input id="docTypeDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter document type description" required />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const PettyCashForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

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
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);

  // Cost center data
  const [costCenters1, setCostCenters1] = useState<CostCenter1[]>([]);
  const [costCenters2, setCostCenters2] = useState<CostCenter2[]>([]);
  const [costCenters3, setCostCenters3] = useState<CostCenter3[]>([]);
  const [costCenters4, setCostCenters4] = useState<CostCenter4[]>([]);

  const [lineCostCenters2, setLineCostCenters2] = useState<{ [key: number]: CostCenter2[] }>({});
  const [lineCostCenters3, setLineCostCenters3] = useState<{ [key: number]: CostCenter3[] }>({});
  const [lineCostCenters4, setLineCostCenters4] = useState<{ [key: number]: CostCenter4[] }>({});

  // Attachment management state
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [editingAttachment, setEditingAttachment] = useState<any>(null);
  const [previewAttachment, setPreviewAttachment] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialAttachmentId, setInitialAttachmentId] = useState<number | undefined>(undefined);
  const [isDocTypeDialogOpen, setIsDocTypeDialogOpen] = useState(false);

  // Check if editing is allowed
  const canEditVoucher = !voucher || (voucher.PostingStatus !== VoucherStatus.POSTED && voucher.PostingStatus !== VoucherStatus.REVERSED);
  const isPosted = voucher?.PostingStatus === VoucherStatus.POSTED;
  const isApproved = voucher?.ApprovalStatus === ApprovalStatus.APPROVED;

  // Initialize form
  const form = useForm<PettyCashVoucherFormValues>({
    resolver: zodResolver(pettyCashVoucherSchema),
    defaultValues: {
      voucherNo: "",
      voucherType: "Petty Cash",
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
      lines: [{ accountId: "", transactionType: TransactionType.DEBIT, debitAmount: 0, creditAmount: 0 }],
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

            // Check if voucher can be edited
            if (voucherData.voucher.PostingStatus === VoucherStatus.POSTED || voucherData.voucher.PostingStatus === VoucherStatus.REVERSED) {
              toast.error("This voucher has been posted/reversed and cannot be edited.");
              navigate(`/petty-cash/${voucherData.voucher.VoucherNo}`);
              return;
            }

            // Set form values including cost centers
            const formattedVoucher = {
              voucherNo: voucherData.voucher.VoucherNo,
              voucherType: voucherData.voucher.VoucherType || "Petty Cash",
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
            };

            const formattedLines = voucherData.lines.map((line) => ({
              accountId: line.AccountID.toString(),
              transactionType: line.TransactionType,
              debitAmount: line.DebitAmount || 0,
              creditAmount: line.CreditAmount || 0,
              description: line.LineDescription || "",
              customerId: line.CustomerID?.toString() || "",
              supplierId: line.SupplierID?.toString() || "",
              taxId: line.TaxID?.toString() || "",
              lineTaxAmount: line.LineTaxAmount || 0,
              // Line-level cost centers
              lineCostCenter1Id: line.LineCostCenter1ID?.toString() || "",
              lineCostCenter2Id: line.LineCostCenter2ID?.toString() || "",
              lineCostCenter3Id: line.LineCostCenter3ID?.toString() || "",
              lineCostCenter4Id: line.LineCostCenter4ID?.toString() || "",
            }));

            const formattedAttachments = voucherData.attachments.map((attachment) => ({
              PettyCashAttachmentID: attachment.PostingAttachmentID,
              docTypeId: attachment.DocTypeID.toString(),
              documentName: attachment.DocumentName,
              documentDescription: attachment.DocumentDescription || "",
              isRequired: attachment.IsRequired || false,
              displayOrder: attachment.DisplayOrder || 0,
            }));

            form.reset({
              ...formattedVoucher,
              lines: formattedLines,
              attachments: formattedAttachments,
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
      const [accountsData, companiesData, fiscalYearsData, currenciesData, banksData, customersData, suppliersData, taxesData, docTypesData, costCenters1Data] = await Promise.all([
        accountService.getAllAccounts(),
        companyService.getCompaniesForDropdown(true),
        fiscalYearService.getFiscalYearsForDropdown({ filterIsActive: true }),
        currencyService.getCurrenciesForDropdown(),
        bankService.getAllBanks(),
        customerService.getAllCustomers(),
        supplierService.getAllSuppliers(),
        taxService.getAllTaxes(),
        docTypeService.getAllDocTypes(),
        costCenterService.getCostCentersByLevel(1),
      ]);

      setAccounts(accountsData.filter((account) => account.IsActive && account.IsPostable));
      setCompanies(companiesData);
      setFiscalYears(fiscalYearsData);
      setCurrencies(currenciesData);
      setBanks(banksData.filter((bank) => bank.IsActive));
      setCustomers(customersData);
      setSuppliers(suppliersData);
      setTaxes(taxesData);
      setDocTypes(docTypesData);
      setCostCenters1(costCenters1Data as CostCenter1[]);
      setTimeout(() => {
        if (!isEdit) {
          if (companiesData && !isEdit) {
            const defaultCompany = companiesData[0];
            form.setValue("companyId", defaultCompany.CompanyID.toString());
          }
          if (currenciesData && !isEdit) {
            const defaultCurrency = currenciesData[0];
            form.setValue("currencyId", defaultCurrency.CurrencyID.toString());
          }
          if (fiscalYearsData && !isEdit) {
            const defaultFiscalYear = fiscalYearsData[0];
            form.setValue("fiscalYearId", defaultFiscalYear.FiscalYearID.toString());
          }
        }
      }, 0);
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

  // Watch for cost center hierarchy changes and auto-calculations
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (!name) return;

      const roundToTwo = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

      // Handle VOUCHER-LEVEL cost center hierarchy changes
      if (name === "costCenter1Id" && value.costCenter1Id) {
        const costCenter1Id = parseInt(value.costCenter1Id);
        loadChildCostCenters(2, { CostCenter1ID: costCenter1Id });
        form.setValue("costCenter2Id", "");
        form.setValue("costCenter3Id", "");
        form.setValue("costCenter4Id", "");
        setCostCenters3([]);
        setCostCenters4([]);
      } else if (name === "costCenter2Id" && value.costCenter2Id) {
        const costCenter1Id = parseInt(value.costCenter1Id || "0");
        const costCenter2Id = parseInt(value.costCenter2Id);
        loadChildCostCenters(3, { CostCenter1ID: costCenter1Id, CostCenter2ID: costCenter2Id });
        form.setValue("costCenter3Id", "");
        form.setValue("costCenter4Id", "");
        setCostCenters4([]);
      } else if (name === "costCenter3Id" && value.costCenter3Id) {
        const costCenter1Id = parseInt(value.costCenter1Id || "0");
        const costCenter2Id = parseInt(value.costCenter2Id || "0");
        const costCenter3Id = parseInt(value.costCenter3Id);
        loadChildCostCenters(4, { CostCenter1ID: costCenter1Id, CostCenter2ID: costCenter2Id, CostCenter3ID: costCenter3Id });
        form.setValue("costCenter4Id", "");
      }

      // Handle LINE-LEVEL cost center hierarchy changes
      if (name.includes("lines.") && name.includes("lineCostCenter")) {
        const match = name.match(/lines\.(\d+)\.lineCostCenter(\d)Id/);
        if (match) {
          const lineIndex = parseInt(match[1]);
          const costCenterLevel = parseInt(match[2]);

          const lines = form.getValues("lines");
          if (lines && lines[lineIndex]) {
            const line = lines[lineIndex];

            if (costCenterLevel === 1 && line.lineCostCenter1Id) {
              // Load level 2 cost centers for this line
              loadLineCostCenters(lineIndex, 2, {
                CostCenter1ID: parseInt(line.lineCostCenter1Id),
              });
              // Clear dependent fields
              form.setValue(`lines.${lineIndex}.lineCostCenter2Id`, "");
              form.setValue(`lines.${lineIndex}.lineCostCenter3Id`, "");
              form.setValue(`lines.${lineIndex}.lineCostCenter4Id`, "");
              // Clear dependent options
              setLineCostCenters3((prev) => ({ ...prev, [lineIndex]: [] }));
              setLineCostCenters4((prev) => ({ ...prev, [lineIndex]: [] }));
            } else if (costCenterLevel === 2 && line.lineCostCenter2Id) {
              // Load level 3 cost centers for this line
              loadLineCostCenters(lineIndex, 3, {
                CostCenter1ID: parseInt(line.lineCostCenter1Id || "0"),
                CostCenter2ID: parseInt(line.lineCostCenter2Id),
              });
              // Clear dependent fields
              form.setValue(`lines.${lineIndex}.lineCostCenter3Id`, "");
              form.setValue(`lines.${lineIndex}.lineCostCenter4Id`, "");
              // Clear dependent options
              setLineCostCenters4((prev) => ({ ...prev, [lineIndex]: [] }));
            } else if (costCenterLevel === 3 && line.lineCostCenter3Id) {
              // Load level 4 cost centers for this line
              loadLineCostCenters(lineIndex, 4, {
                CostCenter1ID: parseInt(line.lineCostCenter1Id || "0"),
                CostCenter2ID: parseInt(line.lineCostCenter2Id || "0"),
                CostCenter3ID: parseInt(line.lineCostCenter3Id),
              });
              // Clear dependent field
              form.setValue(`lines.${lineIndex}.lineCostCenter4Id`, "");
            }
          }
        }
      }

      // Handle transaction type changes for voucher lines
      if (name.includes("transactionType") && name.includes("lines.")) {
        const index = parseInt(name.split(".")[1]);
        const lines = form.getValues("lines");

        if (lines && lines[index]) {
          const transactionType = lines[index].transactionType;

          // Clear opposite amount when type changes
          if (transactionType === TransactionType.DEBIT) {
            form.setValue(`lines.${index}.creditAmount`, 0);
          } else {
            form.setValue(`lines.${index}.debitAmount`, 0);
          }
        }
      }

      if (name.includes("taxId") && name.includes("lines.")) {
        const index = parseInt(name.split(".")[1]);
        const lines = form.getValues("lines");

        if (lines && lines[index]) {
          const selectedTaxId = lines[index].taxId;

          if (selectedTaxId) {
            const selectedTax = taxes.find((t) => t.TaxID.toString() === selectedTaxId);
            if (selectedTax) {
              const debitAmount = lines[index].debitAmount || 0;
              const creditAmount = lines[index].creditAmount || 0;
              const amount = debitAmount || creditAmount;
              const taxRate = selectedTax.TaxRate || 0;

              const taxAmount = roundToTwo((amount * taxRate) / 100);
              form.setValue(`lines.${index}.lineTaxAmount`, taxAmount);
            }
          } else {
            form.setValue(`lines.${index}.lineTaxAmount`, 0);
          }
        }
      }

      // Auto-calculate tax when amounts change
      if ((name.includes("debitAmount") || name.includes("creditAmount")) && name.includes("lines.")) {
        const index = parseInt(name.split(".")[1]);
        const lines = form.getValues("lines");

        if (lines && lines[index]) {
          const selectedTaxId = lines[index].taxId;

          if (selectedTaxId) {
            const selectedTax = taxes.find((t) => t.TaxID.toString() === selectedTaxId);
            if (selectedTax) {
              const debitAmount = lines[index].debitAmount || 0;
              const creditAmount = lines[index].creditAmount || 0;
              const amount = debitAmount || creditAmount;
              const taxRate = selectedTax.TaxRate || 0;

              const taxAmount = roundToTwo((amount * taxRate) / 100);
              form.setValue(`lines.${index}.lineTaxAmount`, taxAmount);
            }
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, taxes, costCenters1]);

  const loadLineCostCenters = async (
    lineIndex: number,
    level: number,
    parentIds: {
      CostCenter1ID?: number;
      CostCenter2ID?: number;
      CostCenter3ID?: number;
    }
  ) => {
    try {
      const childCostCenters = await costCenterService.getCostCentersByLevel(level, parentIds);

      switch (level) {
        case 2:
          setLineCostCenters2((prev) => ({
            ...prev,
            [lineIndex]: childCostCenters as CostCenter2[],
          }));
          break;
        case 3:
          setLineCostCenters3((prev) => ({
            ...prev,
            [lineIndex]: childCostCenters as CostCenter3[],
          }));
          break;
        case 4:
          setLineCostCenters4((prev) => ({
            ...prev,
            [lineIndex]: childCostCenters as CostCenter4[],
          }));
          break;
      }
    } catch (error) {
      console.error(`Error loading line cost centers level ${level}:`, error);
    }
  };
  // Calculate totals
  const calculateTotals = () => {
    const formValues = form.getValues();
    let totalDebits = 0;
    let totalCredits = 0;

    if (formValues.lines && formValues.lines.length > 0) {
      totalDebits = formValues.lines.reduce((sum, line) => {
        const amount = parseFloat(String(line.debitAmount || 0));
        return sum + amount;
      }, 0);

      totalCredits = formValues.lines.reduce((sum, line) => {
        const amount = parseFloat(String(line.creditAmount || 0));
        return sum + amount;
      }, 0);
    }

    // Round only the final values
    const roundToTwo = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    return {
      totalDebits: roundToTwo(totalDebits),
      totalCredits: roundToTwo(totalCredits),
      difference: roundToTwo(totalDebits - totalCredits),
    };
  };

  const applyVoucherCostCentersToLines = async () => {
    if (!canEditVoucher) {
      toast.error("Cannot modify posted or reversed vouchers.");
      return;
    }

    const voucherCC1 = form.getValues("costCenter1Id");
    const voucherCC2 = form.getValues("costCenter2Id");
    const voucherCC3 = form.getValues("costCenter3Id");
    const voucherCC4 = form.getValues("costCenter4Id");

    if (!voucherCC1) {
      toast.error("Please select at least Cost Center Level 1 before applying");
      return;
    }

    const lines = form.getValues("lines");

    // Apply to all lines
    for (let i = 0; i < lines.length; i++) {
      // Set Level 1
      form.setValue(`lines.${i}.lineCostCenter1Id`, voucherCC1);

      // Load Level 2 options if Level 1 is set
      if (voucherCC1) {
        await loadLineCostCenters(i, 2, {
          CostCenter1ID: parseInt(voucherCC1),
        });

        // Set Level 2 if available
        if (voucherCC2) {
          form.setValue(`lines.${i}.lineCostCenter2Id`, voucherCC2);

          // Load Level 3 options if Level 2 is set
          await loadLineCostCenters(i, 3, {
            CostCenter1ID: parseInt(voucherCC1),
            CostCenter2ID: parseInt(voucherCC2),
          });

          // Set Level 3 if available
          if (voucherCC3) {
            form.setValue(`lines.${i}.lineCostCenter3Id`, voucherCC3);

            // Load Level 4 options if Level 3 is set
            await loadLineCostCenters(i, 4, {
              CostCenter1ID: parseInt(voucherCC1),
              CostCenter2ID: parseInt(voucherCC2),
              CostCenter3ID: parseInt(voucherCC3),
            });

            // Set Level 4 if available
            if (voucherCC4) {
              form.setValue(`lines.${i}.lineCostCenter4Id`, voucherCC4);
            }
          } else {
            // Clear Level 3 and 4 if not set at voucher level
            form.setValue(`lines.${i}.lineCostCenter3Id`, "");
            form.setValue(`lines.${i}.lineCostCenter4Id`, "");
            setLineCostCenters3((prev) => ({ ...prev, [i]: [] }));
            setLineCostCenters4((prev) => ({ ...prev, [i]: [] }));
          }
        } else {
          // Clear Level 2, 3, and 4 if not set at voucher level
          form.setValue(`lines.${i}.lineCostCenter2Id`, "");
          form.setValue(`lines.${i}.lineCostCenter3Id`, "");
          form.setValue(`lines.${i}.lineCostCenter4Id`, "");
          setLineCostCenters2((prev) => ({ ...prev, [i]: [] }));
          setLineCostCenters3((prev) => ({ ...prev, [i]: [] }));
          setLineCostCenters4((prev) => ({ ...prev, [i]: [] }));
        }
      }
    }

    toast.success(`Cost centers applied to ${lines.length} line${lines.length > 1 ? "s" : ""}`);
  };

  // Submit handler for the voucher form
  const onSubmit = async (data: PettyCashVoucherFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    if (!canEditVoucher) {
      toast.error("Cannot save changes to posted or reversed vouchers.");
      return;
    }

    setLoading(true);

    try {
      const { totalDebits, totalCredits, difference } = calculateTotals();

      // Validate that debits equal credits
      if (Math.abs(difference) > 0.01) {
        toast.error("Total debits must equal total credits");
        setLoading(false);
        return;
      }

      // Prepare voucher data with cost centers
      const voucherData = {
        VoucherNo: data.voucherNo,
        VoucherType: data.voucherType,
        TransactionDate: data.transactionDate,
        PostingDate: data.postingDate || data.transactionDate,
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
        ChequeDate: data.chequeDate || undefined,
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
      const linesData = data.lines.map((line) => {
        const selectedTax = line.taxId ? taxes.find((t) => t.TaxID.toString() === line.taxId) : null;
        const debitAmount = line.debitAmount || 0;
        const creditAmount = line.creditAmount || 0;
        const totalAmount = debitAmount || creditAmount;
        const taxAmount = line.lineTaxAmount || 0;

        // Calculate BaseAmount based on tax inclusivity and presence of tax
        let baseAmount: number;

        if (!selectedTax || taxAmount === 0) {
          // No tax case: BaseAmount = Total Amount
          baseAmount = totalAmount;
        } else if (data.isTaxInclusive) {
          // Tax inclusive: BaseAmount = Total Amount - Tax Amount
          baseAmount = totalAmount - taxAmount;
        } else {
          // Tax exclusive: BaseAmount = Total Amount - Tax Amount
          // (The total amount entered should be the base, tax is added on top)
          baseAmount = totalAmount - taxAmount;
        }

        return {
          AccountID: parseInt(line.accountId),
          TransactionType: line.transactionType as TransactionType,
          DebitAmount: debitAmount,
          CreditAmount: creditAmount,
          BaseAmount: Math.round(baseAmount * 100) / 100, // Round to 2 decimal places
          TaxID: line.taxId ? parseInt(line.taxId) : undefined,
          TaxPercentage: selectedTax ? selectedTax.TaxRate : undefined,
          LineTaxAmount: taxAmount,
          LineDescription: line.description?.trim() || undefined,
          CustomerID: line.customerId ? parseInt(line.customerId) : undefined,
          SupplierID: line.supplierId ? parseInt(line.supplierId) : undefined,
          // Line-level cost centers
          LineCostCenter1ID: line.lineCostCenter1Id ? parseInt(line.lineCostCenter1Id) : undefined,
          LineCostCenter2ID: line.lineCostCenter2Id ? parseInt(line.lineCostCenter2Id) : undefined,
          LineCostCenter3ID: line.lineCostCenter3Id ? parseInt(line.lineCostCenter3Id) : undefined,
          LineCostCenter4ID: line.lineCostCenter4Id ? parseInt(line.lineCostCenter4Id) : undefined,
        };
      });

      // Prepare attachments data
      const attachmentsData =
        data.attachments?.map((attachment) => ({
          PostingAttachmentID: attachment.PettyCashAttachmentID,
          DocTypeID: parseInt(attachment.docTypeId),
          DocumentName: attachment.documentName.trim(),
          DocumentDescription: attachment.documentDescription?.trim() || undefined,
          IsRequired: attachment.isRequired || false,
          DisplayOrder: attachment.displayOrder || 0,
          file: attachment.file,
        })) || [];

      const requestData = {
        voucher: voucherData,
        lines: linesData,
        attachments: attachmentsData,
      };

      if (isEdit && voucher) {
        // Update existing voucher
        const result = await pettyCashService.updateVoucher({
          ...requestData,
          voucherNo: voucher.VoucherNo,
        });

        if (result.success) {
          toast.success("Voucher updated successfully");
          navigate(`/petty-cash/${voucher.VoucherNo}`);
        } else {
          toast.error(result.message || "Failed to update voucher");
        }
      } else {
        // Create new voucher
        const result = await pettyCashService.createVoucher(requestData);

        if (result.success && result.voucherNo) {
          toast.success("Voucher created successfully");
          navigate(`/petty-cash/${result.voucherNo}`);
        } else {
          toast.error(result.message || "Failed to create voucher");
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
    if (!canEditVoucher) {
      toast.error("Cannot modify posted or reversed vouchers.");
      return;
    }

    appendLine({
      accountId: "",
      transactionType: TransactionType.DEBIT,
      debitAmount: 0,
      creditAmount: 0,
    });
  };

  // Remove voucher line
  const removeVoucherLine = (index: number) => {
    if (!canEditVoucher) {
      toast.error("Cannot modify posted or reversed vouchers.");
      return;
    }

    if (lineFields.length > 1) {
      removeLine(index);
    }
  };

  // Attachment management functions
  const openAttachmentDialog = (attachment?: any) => {
    if (!canEditVoucher) {
      toast.error("Cannot modify posted or reversed vouchers.");
      return;
    }

    if (attachment) {
      setEditingAttachment(attachment);
    } else {
      setEditingAttachment(null);
    }
    setAttachmentDialogOpen(true);
  };

  const closeAttachmentDialog = () => {
    setAttachmentDialogOpen(false);
    setEditingAttachment(null);
  };

  const addAttachment = (attachmentData: any) => {
    if (editingAttachment) {
      // Update existing attachment
      const index = attachmentFields.findIndex((field) => field.id === editingAttachment.id);
      if (index !== -1) {
        form.setValue(`attachments.${index}`, attachmentData);
      }
    } else {
      // Add new attachment
      appendAttachment(attachmentData);
    }
    closeAttachmentDialog();
  };

  const removeAttachmentItem = (index: number) => {
    if (!canEditVoucher) {
      toast.error("Cannot modify posted or reversed vouchers.");
      return;
    }
    removeAttachment(index);
  };

  const openAttachmentPreview = (attachment: any) => {
    setPreviewAttachment(attachment);
    setPreviewOpen(true);
  };

  const openAttachmentGallery = (attachmentId?: number) => {
    setInitialAttachmentId(attachmentId);
    setGalleryOpen(true);
  };

  const handleSaveDocType = (newDocType: any) => {
    setDocTypes([...docTypes, newDocType]);
  };

  // Reset form
  const handleReset = () => {
    if (!canEditVoucher) {
      toast.error("Cannot reset posted or reversed vouchers.");
      return;
    }

    if (isEdit && voucher) {
      // Reset to original values
      window.location.reload();
    } else {
      form.reset({
        voucherNo: "",
        voucherType: "Petty Cash",
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
        lines: [{ accountId: "", transactionType: TransactionType.DEBIT, debitAmount: 0, creditAmount: 0 }],
        attachments: [],
      });
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { totalDebits, totalCredits, difference } = calculateTotals();
  const attachmentList = form.watch("attachments") || [];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/petty-cash")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">{isEdit ? "Edit Petty Cash Voucher" : "Create Petty Cash Voucher"}</h1>
          {(isPosted || isApproved) && (
            <Badge variant="outline" className="bg-red-50 border-red-200 text-red-800">
              <Lock className="h-3 w-3 mr-1" />
              {isPosted ? "Posted" : "Approved"} - Protected from Editing
            </Badge>
          )}
        </div>

        {/* Protection Warning Alert */}
        {(isPosted || isApproved) && (
          <Alert className="border-l-4 border-l-red-500 bg-red-50">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Voucher Editing Restricted</div>
              <div className="text-sm text-muted-foreground mt-1">
                This voucher has been {isPosted ? "posted" : "approved"} and is protected from modifications.
                {isPosted ? " Posted vouchers cannot be edited." : " Please reset approval status first if changes are needed."}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Information */}
            <Card className={!canEditVoucher ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Voucher Information
                  {!canEditVoucher && <Lock className="h-4 w-4 text-red-500" />}
                </CardTitle>
                <CardDescription>Enter the basic voucher details and company information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    form={form}
                    name="voucherNo"
                    label="Voucher Number"
                    placeholder={isEdit ? "Voucher number (cannot be changed)" : "Auto-generated if left empty"}
                    description={isEdit ? "Voucher number cannot be modified in edit mode" : "Leave blank for auto-generated voucher number"}
                    disabled={isEdit || !canEditVoucher}
                    className={isEdit ? "bg-muted" : ""}
                  />
                  <FormField form={form} name="voucherType" label="Voucher Type" placeholder="Petty Cash" disabled description="Type of voucher" />
                  <FormField form={form} name="transactionDate" label="Transaction Date" type="date" required description="Date of the transaction" disabled={!canEditVoucher} />
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
                    disabled={!canEditVoucher}
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
                    disabled={!canEditVoucher}
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
                    disabled={!canEditVoucher}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    form={form}
                    name="description"
                    label="Description"
                    placeholder="Enter voucher description"
                    description="Brief description of the voucher"
                    disabled={!canEditVoucher}
                  />
                  <FormField form={form} name="paidTo" label="Paid To" placeholder="Enter payee name" description="Name of the person/entity paid" disabled={!canEditVoucher} />
                  <FormField
                    form={form}
                    name="exchangeRate"
                    label="Exchange Rate"
                    type="number"
                    step="0.0001"
                    placeholder="1.0000"
                    description="Exchange rate to base currency"
                    disabled={!canEditVoucher}
                  />
                </div>

                <FormField
                  form={form}
                  name="narration"
                  label="Narration"
                  type="textarea"
                  placeholder="Enter detailed narration"
                  description="Detailed description or notes"
                  disabled={!canEditVoucher}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    form={form}
                    name="invoiceNo"
                    label="Invoice Number"
                    placeholder="Enter invoice number"
                    description="Related invoice number"
                    disabled={!canEditVoucher}
                  />
                  <FormField
                    form={form}
                    name="refNo"
                    label="Reference Number"
                    placeholder="Enter reference number"
                    description="External reference number"
                    disabled={!canEditVoucher}
                  />
                  <FormField
                    form={form}
                    name="postingDate"
                    label="Posting Date"
                    type="date"
                    description="Date for posting (defaults to transaction date)"
                    disabled={!canEditVoucher}
                  />
                </div>

                {/* Cost Center Section */}
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Network className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Cost Centers</h3>
                      <Badge variant="secondary">Voucher Level</Badge>
                    </div>
                    {lineFields.length > 0 && (
                      <Button type="button" variant="outline" size="sm" onClick={applyVoucherCostCentersToLines} disabled={!canEditVoucher || !form.watch("costCenter1Id")}>
                        <Network className="h-4 w-4 mr-2" />
                        Apply to All Lines
                      </Button>
                    )}
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
                      disabled={!canEditVoucher}
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
                      disabled={!form.watch("costCenter1Id") || !canEditVoucher}
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
                      disabled={!form.watch("costCenter2Id") || !canEditVoucher}
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
                      disabled={!form.watch("costCenter3Id") || !canEditVoucher}
                    />
                  </div>
                  {lineFields.length > 0 && form.watch("costCenter1Id") && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        Click "Apply to All Lines" to copy these cost centers to all voucher lines. Lines can still have their own cost centers that override these defaults.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Bank and Cheque Details */}
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Bank & Payment Details</h3>
                  </div>
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
                      disabled={!canEditVoucher}
                    />
                    <FormField
                      form={form}
                      name="chequeNo"
                      label="Cheque Number"
                      placeholder="Enter cheque number"
                      description="Cheque number if applicable"
                      disabled={!canEditVoucher}
                    />
                    <FormField form={form} name="chequeDate" label="Cheque Date" type="date" description="Date on the cheque" disabled={!canEditVoucher} />
                  </div>
                </div>

                {/* Tax Information */}
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <HandCoins className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Tax Information</h3>
                  </div>
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
                      disabled={!canEditVoucher}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="isTaxInclusive" className="text-sm font-medium">
                        Tax Inclusive
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isTaxInclusive"
                          checked={form.watch("isTaxInclusive")}
                          onCheckedChange={(checked) => form.setValue("isTaxInclusive", checked)}
                          disabled={!canEditVoucher}
                        />
                        <Label htmlFor="isTaxInclusive" className="text-sm text-muted-foreground cursor-pointer">
                          {form.watch("isTaxInclusive") ? "Tax is included in amounts" : "Tax is excluded from amounts"}
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">Whether the entered amounts already include tax</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Voucher Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Voucher Summary
                </CardTitle>
                <CardDescription>Live calculation of voucher totals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <HandCoins className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-muted-foreground">Total Debits</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">{totalDebits.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      {lineFields.filter((_, i) => form.watch(`lines.${i}.transactionType`) === TransactionType.DEBIT).length} debit entries
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <HandCoins className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-muted-foreground">Total Credits</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{totalCredits.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      {lineFields.filter((_, i) => form.watch(`lines.${i}.transactionType`) === TransactionType.CREDIT).length} credit entries
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {Math.abs(difference) > 0.01 ? <AlertCircle className="h-4 w-4 text-red-600" /> : <CheckCircle className="h-4 w-4 text-green-600" />}
                      <span className="text-sm font-medium text-muted-foreground">Difference</span>
                    </div>
                    <div className={`text-2xl font-bold ${Math.abs(difference) > 0.01 ? "text-red-600" : "text-green-600"}`}>{difference.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{Math.abs(difference) > 0.01 ? "Out of balance" : "Balanced"}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Attachments</span>
                    </div>
                    <div className="text-2xl font-bold">{attachmentFields.length}</div>
                    <div className="text-sm text-muted-foreground">Documents</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Voucher Lines */}
            <Card className={!canEditVoucher ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Voucher Lines
                      {!canEditVoucher && <Lock className="h-4 w-4 text-red-500" />}
                    </CardTitle>
                    <CardDescription>Add debit and credit entries with optional line-level cost centers</CardDescription>
                  </div>
                  <Button type="button" onClick={addVoucherLine} disabled={!canEditVoucher}>
                    {canEditVoucher ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                    Add Line
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {lineFields.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No voucher lines have been added yet.</p>
                    <Button type="button" variant="outline" onClick={addVoucherLine} disabled={!canEditVoucher}>
                      {canEditVoucher ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                      Add Your First Line
                    </Button>
                  </div>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {lineFields.map((field, index) => {
                      const accountId = form.watch(`lines.${index}.accountId`);
                      const accountDetails = accounts.find((acc) => acc.AccountID.toString() === accountId);
                      const transactionType = form.watch(`lines.${index}.transactionType`);
                      const debitAmount = form.watch(`lines.${index}.debitAmount`) || 0;
                      const creditAmount = form.watch(`lines.${index}.creditAmount`) || 0;

                      return (
                        <AccordionItem key={field.id} value={`line-${index}`} className="border rounded-lg mb-4">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-3">
                                <div className={`h-3 w-3 rounded-full ${transactionType === TransactionType.DEBIT ? "bg-red-500" : "bg-green-500"}`} />
                                <div className="text-left">
                                  <div className="font-medium">{accountDetails ? `${accountDetails.AccountCode} - ${accountDetails.AccountName}` : `Line ${index + 1}`}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {transactionType} • {debitAmount > 0 ? debitAmount.toLocaleString() : creditAmount.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <Badge variant={transactionType === TransactionType.DEBIT ? "destructive" : "default"}>{transactionType}</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-6">
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeVoucherLine(index)}
                                  disabled={lineFields.length === 1 || !canEditVoucher}
                                >
                                  {canEditVoucher ? <Trash2 className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                                  Remove Line
                                </Button>
                              </div>

                              <FormField
                                form={form}
                                name={`lines.${index}.accountId`}
                                label="Account"
                                type="select"
                                options={accounts.map((account) => ({
                                  label: `${account.AccountCode} - ${account.AccountName}`,
                                  value: account.AccountID.toString(),
                                }))}
                                placeholder="Select account"
                                required
                                disabled={!canEditVoucher}
                              />

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField
                                  form={form}
                                  name={`lines.${index}.transactionType`}
                                  label="Transaction Type"
                                  type="select"
                                  options={[
                                    { label: "Debit", value: TransactionType.DEBIT },
                                    { label: "Credit", value: TransactionType.CREDIT },
                                  ]}
                                  required
                                  disabled={!canEditVoucher}
                                />
                                <FormField
                                  form={form}
                                  name={`lines.${index}.debitAmount`}
                                  label="Debit Amount"
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  disabled={form.watch(`lines.${index}.transactionType`) !== TransactionType.DEBIT || !canEditVoucher}
                                />
                                <FormField
                                  form={form}
                                  name={`lines.${index}.creditAmount`}
                                  label="Credit Amount"
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  disabled={form.watch(`lines.${index}.transactionType`) !== TransactionType.CREDIT || !canEditVoucher}
                                />
                              </div>

                              <FormField
                                form={form}
                                name={`lines.${index}.description`}
                                label="Line Description"
                                placeholder="Enter description for this line"
                                description="Optional description for this line item"
                                disabled={!canEditVoucher}
                              />

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                  form={form}
                                  name={`lines.${index}.customerId`}
                                  label="Customer"
                                  type="select"
                                  options={customers.map((customer) => ({
                                    label: customer.CustomerFullName,
                                    value: customer.CustomerID.toString(),
                                  }))}
                                  placeholder="Select customer (optional)"
                                  description="Optional customer assignment"
                                  disabled={!canEditVoucher}
                                />
                                <FormField
                                  form={form}
                                  name={`lines.${index}.supplierId`}
                                  label="Supplier"
                                  type="select"
                                  options={suppliers.map((supplier) => ({
                                    label: supplier.SupplierName,
                                    value: supplier.SupplierID.toString(),
                                  }))}
                                  placeholder="Select supplier (optional)"
                                  description="Optional supplier assignment"
                                  disabled={!canEditVoucher}
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                  form={form}
                                  name={`lines.${index}.taxId`}
                                  label="Tax"
                                  type="select"
                                  options={[
                                    { label: "No Tax", value: "0" },
                                    ...taxes.map((tax) => ({
                                      label: `${tax.TaxCode} - ${tax.TaxName} (${tax.TaxRate}%)`,
                                      value: tax.TaxID.toString(),
                                    })),
                                  ]}
                                  placeholder="Select tax (optional)"
                                  description="Select applicable tax from tax master"
                                  disabled={!canEditVoucher}
                                />
                                <FormField
                                  form={form}
                                  name={`lines.${index}.lineTaxAmount`}
                                  label="Tax Amount"
                                  type="number"
                                  step="0.01"
                                  disabled
                                  description="Auto-calculated based on selected tax"
                                />
                              </div>

                              {/* Line-level Cost Centers */}
                              <Separator />
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <Network className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">Line-Level Cost Centers</span>
                                  <Badge variant="outline" className="text-xs">
                                    Override Voucher Level
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <FormField
                                    form={form}
                                    name={`lines.${index}.lineCostCenter1Id`}
                                    label="Level 1"
                                    type="select"
                                    options={costCenters1.map((cc) => ({
                                      label: cc.Description,
                                      value: cc.CostCenter1ID.toString(),
                                    }))}
                                    placeholder="Select level 1"
                                    className="text-sm"
                                    disabled={!canEditVoucher}
                                  />
                                  <FormField
                                    form={form}
                                    name={`lines.${index}.lineCostCenter2Id`}
                                    label="Level 2"
                                    type="select"
                                    options={(lineCostCenters2[index] || []).map((cc) => ({
                                      label: cc.Description,
                                      value: cc.CostCenter2ID.toString(),
                                    }))}
                                    placeholder="Select level 2"
                                    className="text-sm"
                                    disabled={!form.watch(`lines.${index}.lineCostCenter1Id`) || !canEditVoucher}
                                  />
                                  <FormField
                                    form={form}
                                    name={`lines.${index}.lineCostCenter3Id`}
                                    label="Level 3"
                                    type="select"
                                    options={(lineCostCenters3[index] || []).map((cc) => ({
                                      label: cc.Description,
                                      value: cc.CostCenter3ID.toString(),
                                    }))}
                                    placeholder="Select level 3"
                                    className="text-sm"
                                    disabled={!form.watch(`lines.${index}.lineCostCenter2Id`) || !canEditVoucher}
                                  />
                                  <FormField
                                    form={form}
                                    name={`lines.${index}.lineCostCenter4Id`}
                                    label="Level 4"
                                    type="select"
                                    options={(lineCostCenters4[index] || []).map((cc) => ({
                                      label: cc.Description,
                                      value: cc.CostCenter4ID.toString(),
                                    }))}
                                    placeholder="Select level 4"
                                    className="text-sm"
                                    disabled={!form.watch(`lines.${index}.lineCostCenter3Id`) || !canEditVoucher}
                                  />
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card className={!canEditVoucher ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Supporting Documents
                      {!canEditVoucher && <Lock className="h-4 w-4 text-red-500" />}
                    </CardTitle>
                    <CardDescription>Upload supporting documents and files for this voucher</CardDescription>
                  </div>
                  <Button type="button" onClick={() => openAttachmentDialog()} disabled={!canEditVoucher}>
                    {canEditVoucher ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                    Add Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {attachmentList.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No documents have been attached yet.</p>
                    <Button type="button" variant="outline" onClick={() => openAttachmentDialog()} disabled={!canEditVoucher}>
                      {canEditVoucher ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                      Add Your First Document
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end mb-4">
                      <Button type="button" variant="outline" onClick={() => openAttachmentGallery()}>
                        <FileText className="mr-2 h-4 w-4" />
                        View All Documents
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {attachmentList.map((attachment, index) => {
                        const docType = docTypes.find((dt) => dt.DocTypeID.toString() === attachment.docTypeId);

                        return (
                          <Card key={index} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                <AttachmentThumbnail
                                  fileUrl={attachment.file?.url}
                                  fileName={attachment.documentName || "Document"}
                                  fileType={attachment.file?.type}
                                  onClick={() => attachment.file?.url && openAttachmentPreview(attachment)}
                                />
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{attachment.documentName}</span>
                                    <div className="flex items-center gap-2">
                                      <Button type="button" variant="ghost" size="sm" onClick={() => openAttachmentDialog({ ...attachment, index })} disabled={!canEditVoucher}>
                                        {canEditVoucher ? <Edit2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500"
                                        onClick={() => removeAttachmentItem(index)}
                                        disabled={!canEditVoucher}
                                      >
                                        {canEditVoucher ? <Trash2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                      </Button>
                                    </div>
                                  </div>

                                  {docType && <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{docType.Description}</Badge>}

                                  {attachment.isRequired && (
                                    <Badge variant="secondary" className="text-xs">
                                      Required
                                    </Badge>
                                  )}

                                  <div className="text-sm space-y-1">
                                    {attachment.documentDescription && <div className="text-muted-foreground mt-1">{attachment.documentDescription}</div>}
                                  </div>

                                  {attachment.file?.url && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <Button type="button" variant="outline" size="sm" onClick={() => openAttachmentGallery(index)} className="h-8 px-3">
                                        <FileTypeIcon fileName={attachment.documentName || "Document"} fileType={attachment.file?.type} size={14} className="mr-1.5" />
                                        Preview
                                      </Button>
                                      {attachment.file?.url && (
                                        <a
                                          href={attachment.file?.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          download={attachment.documentName}
                                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                                        >
                                          <Download className="h-3.5 w-3.5 mr-1.5" />
                                          Download
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Form Actions */}
            <Card>
              <CardFooter className="flex justify-between pt-6">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => navigate("/petty-cash")} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset} disabled={loading || !canEditVoucher}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
                <Button type="submit" disabled={loading || lineFields.length === 0 || Math.abs(difference) > 0.01 || !canEditVoucher}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEdit ? "Update Voucher" : "Create Voucher"}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>

        {/* Attachment Dialog */}
        <AttachmentDialog
          isOpen={attachmentDialogOpen}
          onClose={closeAttachmentDialog}
          onSave={addAttachment}
          editingAttachment={editingAttachment}
          docTypes={docTypes}
          onCreateDocType={() => setIsDocTypeDialogOpen(true)}
        />

        {/* Attachment Preview Dialog */}
        {previewAttachment && (
          <AttachmentPreview
            isOpen={previewOpen}
            onClose={() => setPreviewOpen(false)}
            fileUrl={previewAttachment.fileUrl}
            fileName={previewAttachment.documentName || "Document"}
            fileType={previewAttachment.file?.type}
            fileSize={previewAttachment.file?.size}
            description={previewAttachment.documentDescription}
            documentType={docTypes.find((dt) => dt.DocTypeID.toString() === previewAttachment.docTypeId)?.Description}
          />
        )}

        {/* Attachment Gallery Dialog */}
        {attachmentList.length > 0 && (
          <AttachmentGallery
            isOpen={galleryOpen}
            onClose={() => setGalleryOpen(false)}
            attachments={attachmentList.map((attachment, index) => ({
              ...attachment,
              PostingAttachmentID: index, // Use index as ID for gallery compatibility
              fileUrl: attachment.file?.url,
              FileContentType: attachment.file?.type,
              FileSize: attachment.file?.size,
            }))}
            initialAttachmentId={initialAttachmentId}
          />
        )}

        {/* Create Document Type Dialog */}
        <CreateDocTypeDialog isOpen={isDocTypeDialogOpen} onClose={() => setIsDocTypeDialogOpen(false)} onSave={handleSaveDocType} />
      </div>
    </TooltipProvider>
  );
};

// Attachment Dialog Component
const AttachmentDialog = ({
  isOpen,
  onClose,
  onSave,
  editingAttachment,
  docTypes,
  onCreateDocType,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (attachment: any) => void;
  editingAttachment: any;
  docTypes: any[];
  onCreateDocType: () => void;
}) => {
  const [formData, setFormData] = useState({
    docTypeId: "",
    documentName: "",
    documentDescription: "",
    isRequired: false,
    displayOrder: 0,
    file: null as File | null,
  });

  useEffect(() => {
    if (editingAttachment) {
      setFormData({
        docTypeId: editingAttachment.docTypeId || "",
        documentName: editingAttachment.documentName || "",
        documentDescription: editingAttachment.documentDescription || "",
        isRequired: editingAttachment.isRequired || false,
        displayOrder: editingAttachment.displayOrder || 0,
        file: editingAttachment.file || null,
      });
    } else {
      setFormData({
        docTypeId: "",
        documentName: "",
        documentDescription: "",
        isRequired: false,
        displayOrder: 0,
        file: null,
      });
    }
  }, [editingAttachment, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        file,
        documentName: prev.documentName || file.name,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.docTypeId || !formData.documentName) {
      toast.error("Please fill in all required fields");
      return;
    }

    const attachmentData = {
      ...formData,
      fileUrl: formData.file ? URL.createObjectURL(formData.file) : editingAttachment?.fileUrl,
    };

    onSave(attachmentData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editingAttachment ? "Edit Document" : "Add Document"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Document Type *</Label>
              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={onCreateDocType}>
                <PlusCircle className="mr-1 h-3.5 w-3.5" />
                Create New
              </Button>
            </div>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.docTypeId}
              onChange={(e) => setFormData((prev) => ({ ...prev, docTypeId: e.target.value }))}
              required
            >
              <option value="">Select document type</option>
              {docTypes.map((type) => (
                <option key={type.DocTypeID} value={type.DocTypeID.toString()}>
                  {type.Description}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Document Name *</Label>
            <Input value={formData.documentName} onChange={(e) => setFormData((prev) => ({ ...prev, documentName: e.target.value }))} placeholder="Enter document name" required />
          </div>

          <div className="space-y-2">
            <Label>Upload File</Label>
            <Input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileChange} />
            {editingAttachment?.fileUrl && !formData.file && (
              <div className="text-sm text-muted-foreground">
                Current file:{" "}
                <a href={editingAttachment.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  View existing file
                </a>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.documentDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, documentDescription: e.target.value }))}
              placeholder="Enter document description"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRequired"
              checked={formData.isRequired}
              onChange={(e) => setFormData((prev) => ({ ...prev, isRequired: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isRequired">Required Document</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{editingAttachment ? "Update" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PettyCashForm;
