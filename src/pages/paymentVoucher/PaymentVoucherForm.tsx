// src/pages/paymentVoucher/PaymentVoucherForm.tsx - Enhanced with Advanced Features
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
  Upload,
  FileText,
  AlertCircle,
  Calculator,
  Building,
  Network,
  CreditCard,
  Receipt,
  HandCoins,
  Users,
  CheckCircle,
  Info,
  RotateCcw,
  PlusCircle,
  Edit2,
  Download,
  Lock,
  Shield,
  Calendar,
} from "lucide-react";
import { paymentVoucherService } from "@/services/paymentVoucherService";
import { accountService } from "@/services/accountService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { currencyService } from "@/services/currencyService";
import { bankService } from "@/services/bankService";
import { supplierService } from "@/services/supplierService";
import { taxService } from "@/services/taxService";
import { docTypeService } from "@/services/docTypeService";
import { costCenterService } from "@/services/costCenterService";
import { customerService } from "@/services/customerService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { useAppSelector } from "@/lib/hooks";
import { format } from "date-fns";
import { PaymentVoucher, PaymentVoucherLine, PaymentVoucherAttachment, PaymentType, PaymentStatus, TransactionType } from "@/types/paymentVoucherTypes";
import { Account } from "@/types/accountTypes";
import { Company } from "@/services/companyService";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Currency } from "@/services/currencyService";
import { Bank } from "@/types/bankTypes";
import { Tax } from "@/services/taxService";
import { DocType } from "@/services/docTypeService";
import { CostCenter1, CostCenter2, CostCenter3, CostCenter4 } from "@/types/costCenterTypes";
import { Supplier } from "@/types/supplierTypes";
import { AttachmentThumbnail } from "@/components/attachments/AttachmentThumbnail";
import { AttachmentPreview } from "@/components/attachments/AttachmentPreview";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { FileTypeIcon } from "@/components/attachments/FileTypeIcon";

// Enhanced schema for payment vouchers with better validation
const voucherLineSchema = z.object({
  PostingLineID: z.number().optional(),
  accountId: z.string().min(1, "Account is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().optional(),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  taxPercentage: z.coerce.number().min(0).max(100).optional(),
  taxAmount: z.coerce.number().min(0).optional(),
  // Line-level cost centers
  lineCostCenter1Id: z.string().optional(),
  lineCostCenter2Id: z.string().optional(),
  lineCostCenter3Id: z.string().optional(),
  lineCostCenter4Id: z.string().optional(),
});

const attachmentSchema = z.object({
  PostingAttachmentID: z.number().optional(),
  docTypeId: z.string().min(1, "Document type is required"),
  documentName: z.string().min(1, "Document name is required"),
  documentDescription: z.string().optional(),
  isRequired: z.boolean().optional(),
  displayOrder: z.number().optional(),
  file: z.any().optional(),
});

const paymentVoucherSchema = z
  .object({
    voucherNo: z.string().optional(),
    transactionDate: z.date({ required_error: "Transaction date is required" }),
    postingDate: z.date().optional(),
    companyId: z.string().min(1, "Company is required"),
    fiscalYearId: z.string().min(1, "Fiscal year is required"),
    currencyId: z.string().min(1, "Currency is required"),
    exchangeRate: z.coerce.number().min(0.0001, "Exchange rate must be greater than 0").optional(),
    description: z.string().optional(),
    narration: z.string().optional(),

    // Payment specific fields
    paymentType: z.nativeEnum(PaymentType, { required_error: "Payment type is required" }),
    paymentAccountId: z.string().min(1, "Payment account is required"),
    supplierId: z.string().optional(),
    paidTo: z.string().optional(),
    refNo: z.string().optional(),
    totalAmount: z.coerce.number().min(0.01, "Total amount must be greater than 0"),

    // Cheque details (conditional)
    chequeNo: z.string().optional(),
    chequeDate: z.date().optional(),
    bankId: z.string().optional(),

    // Tax fields
    taxId: z.string().optional(),
    isTaxInclusive: z.boolean().optional(),

    // Voucher-level cost centers
    costCenter1Id: z.string().optional(),
    costCenter2Id: z.string().optional(),
    costCenter3Id: z.string().optional(),
    costCenter4Id: z.string().optional(),
    copyCostCenters: z.boolean().optional(),

    lines: z.array(voucherLineSchema).min(1, "At least one voucher line is required"),
    attachments: z.array(attachmentSchema).optional(),
  })
  .refine(
    (data) => {
      // Conditional validation for cheque payments
      if (data.paymentType === PaymentType.CHEQUE) {
        return data.chequeNo && data.chequeDate && data.bankId;
      }
      return true;
    },
    {
      message: "Cheque number, date, and bank are required for cheque payments",
      path: ["chequeNo"],
    }
  )
  .refine(
    (data) => {
      // Conditional validation for bank transfers
      if (data.paymentType === PaymentType.BANK_TRANSFER) {
        return data.bankId;
      }
      return true;
    },
    {
      message: "Bank is required for bank transfer payments",
      path: ["bankId"],
    }
  );

type PaymentVoucherFormValues = z.infer<typeof paymentVoucherSchema>;

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

const PaymentVoucherForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [voucher, setVoucher] = useState<PaymentVoucher | null>(null);

  // Reference data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [suppliers, setSuppliers] = useState<Pick<Supplier, "SupplierID" | "SupplierNo" | "SupplierName">[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);

  // Cost center data
  const [costCenters1, setCostCenters1] = useState<CostCenter1[]>([]);
  const [costCenters2, setCostCenters2] = useState<CostCenter2[]>([]);
  const [costCenters3, setCostCenters3] = useState<CostCenter3[]>([]);
  const [costCenters4, setCostCenters4] = useState<CostCenter4[]>([]);

  // Attachment management state
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [editingAttachment, setEditingAttachment] = useState<any>(null);
  const [previewAttachment, setPreviewAttachment] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialAttachmentId, setInitialAttachmentId] = useState<number | undefined>(undefined);
  const [isDocTypeDialogOpen, setIsDocTypeDialogOpen] = useState(false);

  // Check if editing is allowed
  const canEditVoucher = !voucher || (voucher.PaymentStatus !== "Paid" && voucher.PaymentStatus !== "Reversed" && !voucher.IsReversed);
  const isPaidOrReversed = voucher?.PaymentStatus === "Paid" || voucher?.PaymentStatus === "Reversed" || voucher?.IsReversed;

  // Initialize form
  const form = useForm<PaymentVoucherFormValues>({
    resolver: zodResolver(paymentVoucherSchema),
    defaultValues: {
      voucherNo: "",
      transactionDate: new Date(),
      companyId: "",
      fiscalYearId: "",
      currencyId: "",
      exchangeRate: 1,
      description: "",
      narration: "",
      paymentType: PaymentType.CASH,
      paymentAccountId: "",
      supplierId: "",
      paidTo: "",
      refNo: "",
      totalAmount: 0,
      chequeNo: "",
      bankId: "",
      taxId: "",
      isTaxInclusive: false,
      costCenter1Id: "",
      costCenter2Id: "",
      costCenter3Id: "",
      costCenter4Id: "",
      copyCostCenters: false,
      lines: [{ accountId: "", amount: 0, description: "" }],
      attachments: [],
    },
  });

  // Setup field arrays
  const linesFieldArray = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const attachmentsFieldArray = useFieldArray({
    control: form.control,
    name: "attachments",
  });

  // Calculate totals
  const calculateTotals = () => {
    const formValues = form.getValues();
    let lineTotal = 0;

    const roundToTwo = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    if (formValues.lines && formValues.lines.length > 0) {
      lineTotal = formValues.lines.reduce((sum, line) => {
        const amount = line.amount || 0;
        return roundToTwo(sum + amount);
      }, 0);
    }

    return {
      lineTotal: roundToTwo(lineTotal),
      totalAmount: formValues.totalAmount || 0,
      difference: Math.abs(roundToTwo(lineTotal) - (formValues.totalAmount || 0)),
    };
  };

  // Initialize and fetch data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        await fetchReferenceData();

        if (isEdit && id) {
          const voucherData = await paymentVoucherService.getPaymentVoucherForEdit(id);

          if (voucherData.voucher) {
            setVoucher(voucherData.voucher);

            // Check if voucher is paid/reversed and prevent editing
            if (voucherData.voucher.PaymentStatus === "Paid" || voucherData.voucher.PaymentStatus === "Reversed" || voucherData.voucher.IsReversed) {
              toast.error("This payment voucher has been paid or reversed and cannot be edited. Please reverse the payment first if changes are needed.");
              navigate(`/payment-vouchers/${voucherData.voucher.VoucherNo}`);
              return;
            }

            const formattedVoucher = {
              voucherNo: voucherData.voucher.VoucherNo,
              transactionDate: new Date(voucherData.voucher.TransactionDate),
              postingDate: voucherData.voucher.PostingDate ? new Date(voucherData.voucher.PostingDate) : undefined,
              companyId: voucherData.voucher.CompanyID.toString(),
              fiscalYearId: voucherData.voucher.FiscalYearID.toString(),
              currencyId: voucherData.voucher.CurrencyID.toString(),
              exchangeRate: voucherData.voucher.ExchangeRate || 1,
              description: voucherData.voucher.Description || "",
              narration: voucherData.voucher.Narration || "",
              paymentType: voucherData.voucher.PaymentType,
              paymentAccountId: voucherData.voucher.PaymentAccountID.toString(),
              supplierId: voucherData.voucher.SupplierID?.toString() || "",
              paidTo: voucherData.voucher.PaidTo || "",
              refNo: voucherData.voucher.RefNo || "",
              totalAmount: voucherData.voucher.TotalAmount,
              chequeNo: voucherData.voucher.ChequeNo || "",
              chequeDate: voucherData.voucher.ChequeDate ? new Date(voucherData.voucher.ChequeDate) : undefined,
              bankId: voucherData.voucher.BankID?.toString() || "",
              taxId: voucherData.voucher.TaxID?.toString() || "",
              isTaxInclusive: voucherData.voucher.IsTaxInclusive || false,
              costCenter1Id: voucherData.voucher.CostCenter1ID?.toString() || "",
              costCenter2Id: voucherData.voucher.CostCenter2ID?.toString() || "",
              costCenter3Id: voucherData.voucher.CostCenter3ID?.toString() || "",
              costCenter4Id: voucherData.voucher.CostCenter4ID?.toString() || "",
              copyCostCenters: false,
            };

            const formattedLines = voucherData.lines.map((line) => ({
              PostingLineID: line.PostingID,
              accountId: line.AccountID.toString(),
              amount: line.DebitAmount || 0,
              description: line.LineDescription || "",
              customerId: line.CustomerID?.toString() || "",
              supplierId: line.LineSupplierID?.toString() || "",
              taxPercentage: line.TaxPercentage || 0,
              taxAmount: line.LineTaxAmount || 0,
              lineCostCenter1Id: line.LineCostCenter1ID?.toString() || "",
              lineCostCenter2Id: line.LineCostCenter2ID?.toString() || "",
              lineCostCenter3Id: line.LineCostCenter3ID?.toString() || "",
              lineCostCenter4Id: line.LineCostCenter4ID?.toString() || "",
            }));

            const formattedAttachments = voucherData.attachments.map((attachment) => ({
              PostingAttachmentID: attachment.PostingAttachmentID,
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
            toast.error("Payment voucher not found");
            navigate("/payment-vouchers");
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
      const [accountsData, companiesData, fiscalYearsData, currenciesData, banksData, suppliersData, customersData, taxesData, docTypesData, costCenters1Data] = await Promise.all([
        accountService.getAllAccounts(),
        companyService.getCompaniesForDropdown(true),
        fiscalYearService.getFiscalYearsForDropdown({ filterIsActive: true }),
        currencyService.getCurrenciesForDropdown(),
        bankService.getAllBanks(),
        supplierService.getSuppliersForDropdown(true),
        customerService.getAllCustomers(),
        taxService.getAllTaxes(),
        docTypeService.getAllDocTypes(),
        costCenterService.getCostCentersByLevel(1),
      ]);

      setAccounts(accountsData.filter((account) => account.IsActive && account.IsPostable));
      setCompanies(companiesData);
      setFiscalYears(fiscalYearsData);
      setCurrencies(currenciesData);
      setBanks(banksData.filter((bank) => bank.IsActive));
      setSuppliers(suppliersData);
      setCustomers(customersData);
      setTaxes(taxesData);
      setDocTypes(docTypesData);
      setCostCenters1(costCenters1Data as CostCenter1[]);
      setTimeout(() => {
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

  // Watch for cost center hierarchy changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
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
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Auto-calculation effects
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (!name) return;

      const roundToTwo = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

      // Copy cost centers to lines when copyCostCenters is enabled
      if (name === "copyCostCenters" && value.copyCostCenters) {
        const lines = form.getValues("lines");
        const costCenter1Id = form.getValues("costCenter1Id");
        const costCenter2Id = form.getValues("costCenter2Id");
        const costCenter3Id = form.getValues("costCenter3Id");
        const costCenter4Id = form.getValues("costCenter4Id");

        lines.forEach((_, index) => {
          if (costCenter1Id) form.setValue(`lines.${index}.lineCostCenter1Id`, costCenter1Id);
          if (costCenter2Id) form.setValue(`lines.${index}.lineCostCenter2Id`, costCenter2Id);
          if (costCenter3Id) form.setValue(`lines.${index}.lineCostCenter3Id`, costCenter3Id);
          if (costCenter4Id) form.setValue(`lines.${index}.lineCostCenter4Id`, costCenter4Id);
        });
      }

      // Auto-calculate tax amount for lines
      if (name.includes("taxPercentage") && name.includes("lines.")) {
        const index = parseInt(name.split(".")[1]);
        const lines = form.getValues("lines");

        if (lines && lines[index]) {
          const amount = lines[index].amount || 0;
          const taxPercentage = lines[index].taxPercentage || 0;
          const taxAmount = roundToTwo((amount * taxPercentage) / 100);
          form.setValue(`lines.${index}.taxAmount`, taxAmount);
        }
      }

      // Auto-calculate tax when amount changes
      if (name.includes("amount") && name.includes("lines.") && !name.includes("taxAmount")) {
        const index = parseInt(name.split(".")[1]);
        const lines = form.getValues("lines");

        if (lines && lines[index]) {
          const amount = lines[index].amount || 0;
          const taxPercentage = lines[index].taxPercentage || 0;
          if (taxPercentage > 0) {
            const taxAmount = roundToTwo((amount * taxPercentage) / 100);
            form.setValue(`lines.${index}.taxAmount`, taxAmount);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Add new items
  const addVoucherLine = () => {
    if (!canEditVoucher) {
      toast.error("Cannot modify paid or reversed vouchers.");
      return;
    }

    linesFieldArray.append({
      accountId: "",
      amount: 0,
      description: "",
      customerId: "",
      supplierId: "",
      taxPercentage: 0,
      taxAmount: 0,
      lineCostCenter1Id: "",
      lineCostCenter2Id: "",
      lineCostCenter3Id: "",
      lineCostCenter4Id: "",
    });
  };

  // Attachment management functions
  const openAttachmentDialog = (attachment?: any) => {
    if (!canEditVoucher) {
      toast.error("Cannot modify paid or reversed vouchers.");
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
      const index = attachmentsFieldArray.fields.findIndex((field) => field.id === editingAttachment.id);
      if (index !== -1) {
        attachmentsFieldArray.update(index, attachmentData);
      }
    } else {
      attachmentsFieldArray.append(attachmentData);
    }
    closeAttachmentDialog();
  };

  const removeAttachment = (index: number) => {
    if (!canEditVoucher) {
      toast.error("Cannot modify paid or reversed vouchers.");
      return;
    }
    attachmentsFieldArray.remove(index);
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

  // Submit handler for the voucher form
  const onSubmit = async (data: PaymentVoucherFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    if (!canEditVoucher) {
      toast.error("Cannot save changes to paid or reversed vouchers.");
      return;
    }

    setLoading(true);

    try {
      const totals = calculateTotals();

      // Validate that total amount equals sum of line amounts
      if (totals.difference > 0.01) {
        toast.error("Total amount must equal the sum of line amounts");
        setLoading(false);
        return;
      }

      const voucherData = {
        voucher: {
          VoucherNo: data.voucherNo,
          TransactionDate: data.transactionDate,
          PostingDate: data.postingDate || data.transactionDate,
          CompanyID: parseInt(data.companyId),
          FiscalYearID: parseInt(data.fiscalYearId),
          CurrencyID: parseInt(data.currencyId),
          ExchangeRate: data.exchangeRate || 1,
          Description: data.description?.trim() || undefined,
          Narration: data.narration?.trim() || undefined,
          PaymentType: data.paymentType,
          PaymentAccountID: parseInt(data.paymentAccountId),
          SupplierID: data.supplierId ? parseInt(data.supplierId) : undefined,
          PaidTo: data.paidTo?.trim() || undefined,
          RefNo: data.refNo?.trim() || undefined,
          TotalAmount: data.totalAmount,
          ChequeNo: data.chequeNo?.trim() || undefined,
          ChequeDate: data.chequeDate || undefined,
          BankID: data.bankId ? parseInt(data.bankId) : undefined,
          TaxID: data.taxId ? parseInt(data.taxId) : undefined,
          IsTaxInclusive: data.isTaxInclusive || false,
          PaymentStatus: PaymentStatus.DRAFT,
          CostCenter1ID: data.costCenter1Id ? parseInt(data.costCenter1Id) : undefined,
          CostCenter2ID: data.costCenter2Id ? parseInt(data.costCenter2Id) : undefined,
          CostCenter3ID: data.costCenter3Id ? parseInt(data.costCenter3Id) : undefined,
          CostCenter4ID: data.costCenter4Id ? parseInt(data.costCenter4Id) : undefined,
        },
        lines: data.lines.map((line) => ({
          PostingLineID: line.PostingLineID,
          AccountID: parseInt(line.accountId),
          TransactionType: TransactionType.DEBIT,
          DebitAmount: line.amount,
          CreditAmount: 0,
          BaseAmount: line.amount,
          TaxPercentage: line.taxPercentage || 0,
          LineTaxAmount: line.taxAmount || 0,
          LineDescription: line.description?.trim() || undefined,
          CustomerID: line.customerId ? parseInt(line.customerId) : undefined,
          LineSupplierID: line.supplierId ? parseInt(line.supplierId) : undefined,
          LineCostCenter1ID: line.lineCostCenter1Id ? parseInt(line.lineCostCenter1Id) : undefined,
          LineCostCenter2ID: line.lineCostCenter2Id ? parseInt(line.lineCostCenter2Id) : undefined,
          LineCostCenter3ID: line.lineCostCenter3Id ? parseInt(line.lineCostCenter3Id) : undefined,
          LineCostCenter4ID: line.lineCostCenter4Id ? parseInt(line.lineCostCenter4Id) : undefined,
        })),
        attachments:
          data.attachments?.map((attachment) => ({
            PostingAttachmentID: attachment.PostingAttachmentID,
            DocTypeID: parseInt(attachment.docTypeId),
            DocumentName: attachment.documentName.trim(),
            DocumentDescription: attachment.documentDescription?.trim() || undefined,
            IsRequired: attachment.isRequired || false,
            DisplayOrder: attachment.displayOrder || 0,
            file: attachment.file,
          })) || [],
      };

      if (isEdit && voucher) {
        const response = await paymentVoucherService.updatePaymentVoucher({
          voucherNo: voucher.VoucherNo,
          ...voucherData,
        });

        if (response.success) {
          toast.success("Payment voucher updated successfully");
          navigate(`/payment-vouchers/${voucher.VoucherNo}`);
        } else {
          toast.error(response.message || "Failed to update payment voucher");
        }
      } else {
        const response = await paymentVoucherService.createPaymentVoucher(voucherData);

        if (response.success && response.voucherNo) {
          toast.success("Payment voucher created successfully");
          navigate(`/payment-vouchers/${response.voucherNo}`);
        } else {
          toast.error(response.message || "Failed to create payment voucher");
        }
      }
    } catch (error) {
      console.error("Error saving voucher:", error);
      toast.error("Failed to save payment voucher");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    if (!canEditVoucher) {
      toast.error("Cannot reset paid or reversed vouchers.");
      return;
    }

    if (isEdit && voucher) {
      form.reset();
    } else {
      form.reset({
        voucherNo: "",
        transactionDate: new Date(),
        companyId: "",
        fiscalYearId: "",
        currencyId: "",
        exchangeRate: 1,
        description: "",
        narration: "",
        paymentType: PaymentType.CASH,
        paymentAccountId: "",
        supplierId: "",
        paidTo: "",
        refNo: "",
        totalAmount: 0,
        chequeNo: "",
        bankId: "",
        taxId: "",
        isTaxInclusive: false,
        costCenter1Id: "",
        costCenter2Id: "",
        costCenter3Id: "",
        costCenter4Id: "",
        copyCostCenters: false,
        lines: [{ accountId: "", amount: 0, description: "" }],
        attachments: [],
      });
    }
  };

  // Format date for display
  const formatDate = (date?: Date | null) => {
    if (!date) return "";
    try {
      return format(date, "dd MMM yyyy");
    } catch (error) {
      return "";
    }
  };

  // Find account details
  const getAccountDetails = (accountId: string) => {
    if (!accountId) return null;
    return accounts.find((account) => account.AccountID === parseInt(accountId));
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { lineTotal, totalAmount, difference } = calculateTotals();
  const attachmentList = form.watch("attachments") || [];
  const paymentType = form.watch("paymentType");

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/payment-vouchers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">{isEdit ? "Edit Payment Voucher" : "Create Payment Voucher"}</h1>
          {isPaidOrReversed && (
            <Badge variant="outline" className="bg-red-50 border-red-200 text-red-800">
              <Lock className="h-3 w-3 mr-1" />
              Paid/Reversed - Protected from Editing
            </Badge>
          )}
        </div>

        {/* Payment Status Warning Alert */}
        {isPaidOrReversed && (
          <Alert className="border-l-4 border-l-red-500 bg-red-50">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Payment Voucher Editing Restricted</div>
              <div className="text-sm text-muted-foreground mt-1">
                This payment voucher has been paid or reversed and is protected from modifications. To make changes, the payment must first be reversed from the voucher details
                page.
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Voucher Information */}
            <Card className={isPaidOrReversed ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Voucher Information
                  {isPaidOrReversed && <Lock className="h-4 w-4 text-red-500" />}
                </CardTitle>
                <CardDescription>Enter the basic voucher details and transaction information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    form={form}
                    name="voucherNo"
                    label="Voucher Number"
                    placeholder={isEdit ? "Voucher number (cannot be changed)" : "Auto-generated if left empty"}
                    description={isEdit ? "Voucher number cannot be modified in edit mode" : "Leave blank for auto-generated voucher number"}
                    disabled={isEdit}
                    className={isEdit ? "bg-muted" : ""}
                  />
                  <FormField form={form} name="transactionDate" label="Transaction Date" type="date" required description="Date of the transaction" disabled={!canEditVoucher} />
                  <FormField
                    form={form}
                    name="postingDate"
                    label="Posting Date"
                    type="date"
                    description="Date for posting (defaults to transaction date)"
                    disabled={!canEditVoucher}
                  />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    form={form}
                    name="description"
                    label="Description"
                    placeholder="Enter voucher description"
                    description="Brief description of the voucher"
                    disabled={!canEditVoucher}
                  />
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
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card className={isPaidOrReversed ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Details
                  {isPaidOrReversed && <Lock className="h-4 w-4 text-red-500" />}
                </CardTitle>
                <CardDescription>Configure payment specific information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    form={form}
                    name="paymentType"
                    label="Payment Type"
                    type="select"
                    options={paymentVoucherService.getPaymentTypes().map((type) => ({
                      label: type.label,
                      value: type.value,
                    }))}
                    placeholder="Select payment type"
                    required
                    description="Method of payment"
                    disabled={!canEditVoucher}
                  />
                  <FormField
                    form={form}
                    name="paymentAccountId"
                    label="Payment Account"
                    type="select"
                    options={accounts.map((account) => ({
                      label: `${account.AccountCode} - ${account.AccountName}`,
                      value: account.AccountID.toString(),
                    }))}
                    placeholder="Select payment account"
                    required
                    description="Account to credit (bank/cash account)"
                    disabled={!canEditVoucher}
                  />
                  <FormField
                    form={form}
                    name="totalAmount"
                    label="Total Amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    description="Total payment amount"
                    disabled={!canEditVoucher}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    form={form}
                    name="supplierId"
                    label="Supplier"
                    type="select"
                    options={suppliers.map((supplier) => ({
                      label: `${supplier.SupplierNo} - ${supplier.SupplierName}`,
                      value: supplier.SupplierID.toString(),
                    }))}
                    placeholder="Select supplier"
                    description="Supplier to pay"
                    disabled={!canEditVoucher}
                  />
                  <FormField form={form} name="paidTo" label="Paid To" placeholder="Enter payee name" description="Name of the person/entity paid" disabled={!canEditVoucher} />
                </div>

                <FormField
                  form={form}
                  name="refNo"
                  label="Reference Number"
                  placeholder="Enter reference number"
                  description="External reference number"
                  disabled={!canEditVoucher}
                />

                {/* Conditional fields based on payment type */}
                {(paymentType === PaymentType.CHEQUE || paymentType === PaymentType.BANK_TRANSFER) && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        {paymentType === PaymentType.CHEQUE ? "Cheque Details" : "Bank Transfer Details"}
                      </h3>
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
                          required={paymentType === PaymentType.CHEQUE || paymentType === PaymentType.BANK_TRANSFER}
                          description="Bank for this payment"
                          disabled={!canEditVoucher}
                        />
                        {paymentType === PaymentType.CHEQUE && (
                          <>
                            <FormField
                              form={form}
                              name="chequeNo"
                              label="Cheque Number"
                              placeholder="Enter cheque number"
                              required={paymentType === PaymentType.CHEQUE}
                              description="Cheque number"
                              disabled={!canEditVoucher}
                            />
                            <FormField
                              form={form}
                              name="chequeDate"
                              label="Cheque Date"
                              type="date"
                              required={paymentType === PaymentType.CHEQUE}
                              description="Date on the cheque"
                              disabled={!canEditVoucher}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Payment Summary
                </CardTitle>
                <CardDescription>Live calculation of payment totals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <HandCoins className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Total Amount</span>
                    </div>
                    <div className="text-2xl font-bold">{totalAmount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Payment amount</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Line Total</span>
                    </div>
                    <div className="text-2xl font-bold">{lineTotal.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{linesFieldArray.fields.length} lines</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {difference <= 0.01 ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                      <span className="text-sm font-medium text-muted-foreground">Difference</span>
                    </div>
                    <div className={`text-2xl font-bold ${difference <= 0.01 ? "text-green-600" : "text-red-600"}`}>{difference.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{difference <= 0.01 ? "Balanced" : "Out of balance"}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Attachments</span>
                    </div>
                    <div className="text-2xl font-bold">{attachmentsFieldArray.fields.length}</div>
                    <div className="text-sm text-muted-foreground">Documents</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Center Section */}
            <Card className={isPaidOrReversed ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-primary" />
                  Cost Centers
                  {isPaidOrReversed && <Lock className="h-4 w-4 text-red-500" />}
                </CardTitle>
                <CardDescription>
                  Configure cost center allocation
                  <Badge variant="secondary" className="ml-2">
                    Voucher Level
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                <FormField
                  form={form}
                  name="copyCostCenters"
                  label="Copy Cost Centers to Lines"
                  type="switch"
                  description="Automatically copy voucher-level cost centers to all lines"
                  disabled={!canEditVoucher}
                />
              </CardContent>
            </Card>

            {/* Tax Information */}
            <Card className={isPaidOrReversed ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Tax Information
                  {isPaidOrReversed && <Lock className="h-4 w-4 text-red-500" />}
                </CardTitle>
                <CardDescription>Configure tax settings</CardDescription>
              </CardHeader>
              <CardContent>
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
                  <FormField form={form} name="isTaxInclusive" label="Tax Inclusive" type="switch" description="Whether amounts include tax" disabled={!canEditVoucher} />
                </div>
              </CardContent>
            </Card>

            {/* Voucher Lines */}
            <Card className={isPaidOrReversed ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <HandCoins className="h-5 w-5 text-primary" />
                      Voucher Lines
                      {isPaidOrReversed && <Lock className="h-4 w-4 text-red-500" />}
                    </CardTitle>
                    <CardDescription>Add debit entries with optional line-level cost centers</CardDescription>
                  </div>
                  <Button type="button" onClick={addVoucherLine} disabled={!canEditVoucher}>
                    {canEditVoucher ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                    Add Line
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {linesFieldArray.fields.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <HandCoins className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No voucher lines have been added yet.</p>
                    <Button type="button" variant="outline" onClick={addVoucherLine} disabled={!canEditVoucher}>
                      {canEditVoucher ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                      Add Your First Line
                    </Button>
                  </div>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {linesFieldArray.fields.map((field, index) => {
                      const accountId = form.watch(`lines.${index}.accountId`);
                      const accountDetails = getAccountDetails(accountId);

                      return (
                        <AccordionItem key={field.id} value={`line-${index}`} className="border rounded-lg mb-4">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-3">
                                <HandCoins className="h-5 w-5 text-muted-foreground" />
                                <div className="text-left">
                                  <div className="font-medium">{accountDetails ? `${accountDetails.AccountCode} - ${accountDetails.AccountName}` : `Line ${index + 1}`}</div>
                                  <div className="text-sm text-muted-foreground">{form.watch(`lines.${index}.description`) || "No description"}</div>
                                </div>
                              </div>
                              <div className="font-medium">{form.watch(`lines.${index}.amount`) ? form.watch(`lines.${index}.amount`).toLocaleString() : "0"}</div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-6">
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => linesFieldArray.remove(index)}
                                  disabled={!canEditVoucher || linesFieldArray.fields.length === 1}
                                >
                                  {canEditVoucher ? <Trash2 className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                                  Remove Line
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <FormField
                                  form={form}
                                  name={`lines.${index}.amount`}
                                  label="Amount"
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  required
                                  disabled={!canEditVoucher}
                                />
                              </div>

                              <FormField form={form} name={`lines.${index}.description`} label="Line Description" placeholder="Enter line description" disabled={!canEditVoucher} />

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
                                  disabled={!canEditVoucher}
                                />
                                <FormField
                                  form={form}
                                  name={`lines.${index}.supplierId`}
                                  label="Line Supplier"
                                  type="select"
                                  options={suppliers.map((supplier) => ({
                                    label: `${supplier.SupplierNo} - ${supplier.SupplierName}`,
                                    value: supplier.SupplierID.toString(),
                                  }))}
                                  placeholder="Select supplier (optional)"
                                  disabled={!canEditVoucher}
                                />
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <Receipt className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium">Tax Information</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <FormField
                                    form={form}
                                    name={`lines.${index}.taxPercentage`}
                                    label="Tax Percentage"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    disabled={!canEditVoucher}
                                  />
                                  <FormField form={form} name={`lines.${index}.taxAmount`} label="Tax Amount" type="number" step="0.01" disabled description="Auto-calculated" />
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <Network className="h-4 w-4 text-purple-500" />
                                  <span className="font-medium">Line-Level Cost Centers</span>
                                  <Badge variant="outline" className="text-xs">
                                    Overrides voucher level
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
                                    disabled={!canEditVoucher}
                                  />
                                  <FormField
                                    form={form}
                                    name={`lines.${index}.lineCostCenter2Id`}
                                    label="Level 2"
                                    type="select"
                                    options={costCenters2.map((cc) => ({
                                      label: cc.Description,
                                      value: cc.CostCenter2ID.toString(),
                                    }))}
                                    placeholder="Select level 2"
                                    disabled={!canEditVoucher}
                                  />
                                  <FormField
                                    form={form}
                                    name={`lines.${index}.lineCostCenter3Id`}
                                    label="Level 3"
                                    type="select"
                                    options={costCenters3.map((cc) => ({
                                      label: cc.Description,
                                      value: cc.CostCenter3ID.toString(),
                                    }))}
                                    placeholder="Select level 3"
                                    disabled={!canEditVoucher}
                                  />
                                  <FormField
                                    form={form}
                                    name={`lines.${index}.lineCostCenter4Id`}
                                    label="Level 4"
                                    type="select"
                                    options={costCenters4.map((cc) => ({
                                      label: cc.Description,
                                      value: cc.CostCenter4ID.toString(),
                                    }))}
                                    placeholder="Select level 4"
                                    disabled={!canEditVoucher}
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

                {/* Balance Summary */}
                {linesFieldArray.fields.length > 0 && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Balance Summary:</span>
                        </div>
                        <div className="text-sm">
                          Total Amount: <span className="font-mono">{totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="text-sm">
                          Line Total: <span className="font-mono">{lineTotal.toFixed(2)}</span>
                        </div>
                        <div className="text-sm">
                          Difference: <span className={`font-mono ${difference > 0.01 ? "text-red-600" : "text-green-600"}`}>{difference.toFixed(2)}</span>
                        </div>
                      </div>
                      {difference > 0.01 && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Out of Balance
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card className={isPaidOrReversed ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Supporting Documents
                      {isPaidOrReversed && <Lock className="h-4 w-4 text-red-500" />}
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
                                      <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => removeAttachment(index)} disabled={!canEditVoucher}>
                                        {canEditVoucher ? <Trash2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                      </Button>
                                    </div>
                                  </div>

                                  {docType && <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{docType.Description}</Badge>}

                                  <div className="text-sm space-y-1">
                                    {attachment.documentDescription && <div className="text-muted-foreground mt-1">{attachment.documentDescription}</div>}
                                    {attachment.isRequired && (
                                      <Badge variant="secondary" className="text-xs">
                                        Required
                                      </Badge>
                                    )}
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
                  <Button type="button" variant="outline" onClick={() => navigate("/payment-vouchers")} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset} disabled={loading || !canEditVoucher}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
                <Button type="submit" disabled={loading || linesFieldArray.fields.length === 0 || difference > 0.01 || !canEditVoucher}>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData((prev) => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Required Document</Label>
              <div className="flex items-center space-x-2 pt-3">
                <input type="checkbox" checked={formData.isRequired} onChange={(e) => setFormData((prev) => ({ ...prev, isRequired: e.target.checked }))} className="rounded" />
                <span className="text-sm">Mark as required</span>
              </div>
            </div>
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

export default PaymentVoucherForm;
