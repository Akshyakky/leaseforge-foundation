// src/pages/journalVoucher/JournalVoucherForm.tsx - Corrected according to types and service
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
  Receipt,
  CreditCard,
  Users,
  HandCoins,
  Calendar,
  Info,
  RotateCcw,
  PlusCircle,
  Edit2,
  Download,
  Lock,
  Shield,
  Eye,
  CheckCircle,
} from "lucide-react";
import { accountService } from "@/services/accountService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { currencyService } from "@/services/currencyService";
import { supplierService } from "@/services/supplierService";
import { customerService } from "@/services/customerService";
import { taxService, Tax } from "@/services/taxService";
import { docTypeService } from "@/services/docTypeService";
import { costCenterService } from "@/services/costCenterService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { useAppSelector } from "@/lib/hooks";
import { format } from "date-fns";
import { AttachmentThumbnail } from "@/components/attachments/AttachmentThumbnail";
import { AttachmentPreview } from "@/components/attachments/AttachmentPreview";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { FileTypeIcon } from "@/components/attachments/FileTypeIcon";
import { JournalStatus, JournalType, JournalVoucher, TransactionType } from "@/types/journalVoucherTypes";
import { journalVoucherService } from "@/services/journalVoucherService";

// Enhanced schema for journal voucher form validation
const journalLineSchema = z.object({
  PostingID: z.number().optional(),
  AccountID: z.string().min(1, "Account is required"),
  TransactionType: z.nativeEnum(TransactionType, { required_error: "Transaction type is required" }),
  DebitAmount: z.coerce.number().min(0).optional(),
  CreditAmount: z.coerce.number().min(0).optional(),
  BaseAmount: z.coerce.number().min(0).optional(),
  TaxPercentage: z.coerce.number().min(0).max(100).optional(),
  LineTaxAmount: z.coerce.number().min(0).optional(),
  LineDescription: z.string().optional(),
  CustomerID: z.string().optional(),
  LineSupplierID: z.string().optional(),
  LineInvoiceNo: z.string().optional(),
  LineInvoiceDate: z.date().optional().nullable(),
  LineTRN: z.string().optional(),
  LineCity: z.string().optional(),
  LineCostCenter1ID: z.string().optional(),
  LineCostCenter2ID: z.string().optional(),
  LineCostCenter3ID: z.string().optional(),
  LineCostCenter4ID: z.string().optional(),
});

const attachmentSchema = z.object({
  PostingAttachmentID: z.number().optional(),
  DocTypeID: z.string().min(1, "Document type is required"),
  DocumentName: z.string().min(1, "Document name is required"),
  DocumentDescription: z.string().optional(),
  IsRequired: z.boolean().optional(),
  DisplayOrder: z.number().optional(),
  file: z.any().optional(),
});

const journalVoucherSchema = z.object({
  VoucherNo: z.string().optional(),
  VoucherType: z.string().optional(),
  TransactionDate: z.date({ required_error: "Transaction date is required" }),
  PostingDate: z.date().optional().nullable(),
  CompanyID: z.string().min(1, "Company is required"),
  FiscalYearID: z.string().min(1, "Fiscal year is required"),
  CurrencyID: z.string().min(1, "Currency is required"),
  ExchangeRate: z.coerce.number().min(0.0001, "Exchange rate must be greater than 0").optional(),
  Description: z.string().optional(),
  Narration: z.string().optional(),

  // Journal specific fields
  JournalType: z.nativeEnum(JournalType, { required_error: "Journal type is required" }),
  ChequeNo: z.string().optional(),
  ChequeDate: z.date().optional().nullable(),
  InvoiceNo: z.string().optional(),
  InvoiceDate: z.date().optional().nullable(),
  PaidTo: z.string().optional(),
  RefNo: z.string().optional(),
  SupplierID: z.string().optional(),
  TaxRegNo: z.string().optional(),
  City: z.string().optional(),

  // Tax fields
  TaxID: z.string().optional(),
  IsTaxInclusive: z.boolean().optional(),

  // Cost centers
  CostCenter1ID: z.string().optional(),
  CostCenter2ID: z.string().optional(),
  CostCenter3ID: z.string().optional(),
  CostCenter4ID: z.string().optional(),
  CopyCostCenters: z.boolean().optional(),

  // Reference information
  ReferenceType: z.string().optional(),
  ReferenceID: z.string().optional(),
  ReferenceNo: z.string().optional(),

  lines: z.array(journalLineSchema).min(1, "At least one journal line is required"),
  attachments: z.array(attachmentSchema).optional(),
});

type JournalVoucherFormValues = z.infer<typeof journalVoucherSchema>;

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

const JournalVoucherForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [voucher, setVoucher] = useState<JournalVoucher | null>(null);

  // Reference data
  const [accounts, setAccounts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [costCenters1, setCostCenters1] = useState<any[]>([]);
  const [costCenters2, setCostCenters2] = useState<any[]>([]);
  const [costCenters3, setCostCenters3] = useState<any[]>([]);
  const [costCenters4, setCostCenters4] = useState<any[]>([]);

  // Attachment management state
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [editingAttachment, setEditingAttachment] = useState<any>(null);
  const [previewAttachment, setPreviewAttachment] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialAttachmentId, setInitialAttachmentId] = useState<number | undefined>(undefined);
  const [isDocTypeDialogOpen, setIsDocTypeDialogOpen] = useState(false);

  // Check if editing is allowed
  const canEditVoucher = !voucher || journalVoucherService.canEditVoucher(voucher);
  const isApproved = voucher?.ApprovalStatus === "Approved";
  const isPosted = voucher?.PostingStatus === "Posted";

  // Initialize form
  const form = useForm<JournalVoucherFormValues>({
    resolver: zodResolver(journalVoucherSchema),
    defaultValues: {
      VoucherNo: "",
      VoucherType: "JV",
      TransactionDate: new Date(),
      PostingDate: null,
      CompanyID: "",
      FiscalYearID: "",
      CurrencyID: "",
      ExchangeRate: 1,
      Description: "",
      Narration: "",
      JournalType: JournalType.GENERAL,
      ChequeNo: "",
      ChequeDate: null,
      InvoiceNo: "",
      InvoiceDate: null,
      PaidTo: "",
      RefNo: "",
      SupplierID: "",
      TaxRegNo: "",
      City: "",
      TaxID: "",
      IsTaxInclusive: false,
      CostCenter1ID: "",
      CostCenter2ID: "",
      CostCenter3ID: "",
      CostCenter4ID: "",
      CopyCostCenters: false,
      ReferenceType: "",
      ReferenceID: "",
      ReferenceNo: "",
      lines: [],
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
    let totalDebits = 0;
    let totalCredits = 0;

    const roundToTwo = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    if (formValues.lines && formValues.lines.length > 0) {
      totalDebits = formValues.lines.reduce((sum, line) => {
        const amount = line.TransactionType === TransactionType.DEBIT ? line.DebitAmount || 0 : 0;
        return roundToTwo(sum + amount);
      }, 0);

      totalCredits = formValues.lines.reduce((sum, line) => {
        const amount = line.TransactionType === TransactionType.CREDIT ? line.CreditAmount || 0 : 0;
        return roundToTwo(sum + amount);
      }, 0);
    }

    return {
      totalDebits: roundToTwo(totalDebits),
      totalCredits: roundToTwo(totalCredits),
      difference: roundToTwo(totalDebits - totalCredits),
      isBalanced: Math.abs(totalDebits - totalCredits) <= 0.01,
    };
  };

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        await fetchReferenceData();

        if (isEdit && id) {
          const voucherData = await journalVoucherService.getJournalVoucherForEdit(id);

          if (voucherData.voucher) {
            setVoucher(voucherData.voucher);

            // Check if voucher is approved/posted and prevent editing
            if (!journalVoucherService.canEditVoucher(voucherData.voucher)) {
              toast.error("This voucher has been posted or approved and cannot be edited. Please reset approval status first if changes are needed.");
              navigate(`/journal-vouchers/${voucherData.voucher.VoucherNo}`);
              return;
            }

            const formattedVoucher = {
              ...voucherData.voucher,
              TransactionDate: voucherData.voucher.TransactionDate ? new Date(voucherData.voucher.TransactionDate) : new Date(),
              PostingDate: voucherData.voucher.PostingDate ? new Date(voucherData.voucher.PostingDate) : null,
              ChequeDate: voucherData.voucher.ChequeDate ? new Date(voucherData.voucher.ChequeDate) : null,
              InvoiceDate: voucherData.voucher.InvoiceDate ? new Date(voucherData.voucher.InvoiceDate) : null,
              CompanyID: voucherData.voucher.CompanyID?.toString() || "",
              FiscalYearID: voucherData.voucher.FiscalYearID?.toString() || "",
              CurrencyID: voucherData.voucher.CurrencyID?.toString() || "",
              SupplierID: voucherData.voucher.SupplierID?.toString() || "",
              TaxID: voucherData.voucher.TaxID?.toString() || "",
              CostCenter1ID: voucherData.voucher.CostCenter1ID?.toString() || "",
              CostCenter2ID: voucherData.voucher.CostCenter2ID?.toString() || "",
              CostCenter3ID: voucherData.voucher.CostCenter3ID?.toString() || "",
              CostCenter4ID: voucherData.voucher.CostCenter4ID?.toString() || "",
              ReferenceID: voucherData.voucher.ReferenceID?.toString() || "",
            };

            const formattedLines = voucherData.lines.map((line) => ({
              ...line,
              AccountID: line.AccountID?.toString() || "",
              CustomerID: line.CustomerID?.toString() || "",
              LineSupplierID: line.LineSupplierID?.toString() || "",
              LineInvoiceDate: line.LineInvoiceDate ? new Date(line.LineInvoiceDate) : null,
              LineCostCenter1ID: line.LineCostCenter1ID?.toString() || "",
              LineCostCenter2ID: line.LineCostCenter2ID?.toString() || "",
              LineCostCenter3ID: line.LineCostCenter3ID?.toString() || "",
              LineCostCenter4ID: line.LineCostCenter4ID?.toString() || "",
            }));

            const formattedAttachments = voucherData.attachments.map((attachment) => ({
              ...attachment,
              DocTypeID: attachment.DocTypeID?.toString() || "",
            }));

            form.reset({
              ...formattedVoucher,
              lines: formattedLines,
              attachments: formattedAttachments,
            });
          } else {
            toast.error("Journal voucher not found");
            navigate("/journal-vouchers");
          }
        } else {
          // Only add a default line if there are no lines already
          const currentLines = form.getValues("lines");
          if (!currentLines || currentLines.length === 0) {
            // Initialize with one default line for new vouchers
            form.setValue("lines", [
              {
                AccountID: "",
                TransactionType: TransactionType.DEBIT,
                DebitAmount: 0,
                CreditAmount: 0,
                BaseAmount: 0,
                TaxPercentage: 0,
                LineTaxAmount: 0,
                LineDescription: "",
                CustomerID: "",
                LineSupplierID: "",
                LineInvoiceNo: "",
                LineInvoiceDate: null,
                LineTRN: "",
                LineCity: "",
                LineCostCenter1ID: "",
                LineCostCenter2ID: "",
                LineCostCenter3ID: "",
                LineCostCenter4ID: "",
              },
            ]);
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
  }, [id, isEdit, navigate]);

  // Fetch reference data
  const fetchReferenceData = async () => {
    try {
      const [accountsData, companiesData, fiscalYearsData, currenciesData, suppliersData, customersData, taxesData, docTypesData, costCenters1Data] = await Promise.all([
        accountService.getAllAccounts(),
        companyService.getCompaniesForDropdown?.(true) || [],
        fiscalYearService.getFiscalYearsForDropdown?.({ filterIsActive: true }) || [],
        currencyService.getCurrenciesForDropdown?.() || [],
        supplierService.getSuppliersForDropdown?.(true) || [],
        customerService.getAllCustomers(),
        taxService.getAllTaxes(),
        docTypeService.getAllDocTypes(),
        costCenterService.getCostCentersByLevel?.(1) || [],
      ]);

      setAccounts(accountsData.filter((account) => account.IsActive && account.IsPostable));
      setCompanies(companiesData || []);
      setFiscalYears(fiscalYearsData || []);
      setCurrencies(currenciesData || []);
      setSuppliers(suppliersData || []);
      setCustomers(customersData || []);
      setTaxes(taxesData);
      setDocTypes(docTypesData);
      setCostCenters1(costCenters1Data || []);
      setTimeout(() => {
        if (companiesData && !isEdit) {
          const defaultCompany = companiesData[0];
          form.setValue("CompanyID", defaultCompany.CompanyID.toString());
        }
        if (currenciesData && !isEdit) {
          const defaultCurrency = currenciesData[0];
          form.setValue("CurrencyID", defaultCurrency.CurrencyID.toString());
        }
        if (fiscalYearsData && !isEdit) {
          const defaultFiscalYear = fiscalYearsData[0];
          form.setValue("FiscalYearID", defaultFiscalYear.FiscalYearID.toString());
        }
      }, 0);
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Error loading reference data");
    }
  };

  // Auto-calculation effects
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (!name) return;

      const roundToTwo = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

      // Handle transaction type changes to set amounts
      if (name.includes("TransactionType") && name.includes("lines.")) {
        const index = parseInt(name.split(".")[1]);
        const lines = form.getValues("lines");

        if (lines && lines[index]) {
          const transactionType = lines[index].TransactionType;
          const currentDebit = lines[index].DebitAmount || 0;
          const currentCredit = lines[index].CreditAmount || 0;

          if (transactionType === TransactionType.DEBIT) {
            // If switching to debit, move credit amount to debit
            if (currentCredit > 0) {
              form.setValue(`lines.${index}.DebitAmount`, currentCredit);
              form.setValue(`lines.${index}.CreditAmount`, 0);
            }
          } else if (transactionType === TransactionType.CREDIT) {
            // If switching to credit, move debit amount to credit
            if (currentDebit > 0) {
              form.setValue(`lines.${index}.CreditAmount`, currentDebit);
              form.setValue(`lines.${index}.DebitAmount`, 0);
            }
          }
        }
      }

      // Handle amount changes
      if ((name.includes("DebitAmount") || name.includes("CreditAmount")) && name.includes("lines.")) {
        const index = parseInt(name.split(".")[1]);
        const lines = form.getValues("lines");

        if (lines && lines[index]) {
          const isDebitField = name.includes("DebitAmount");
          const amount = isDebitField ? lines[index].DebitAmount || 0 : lines[index].CreditAmount || 0;

          // Clear the opposite field
          if (isDebitField && amount > 0) {
            form.setValue(`lines.${index}.CreditAmount`, 0);
            form.setValue(`lines.${index}.TransactionType`, TransactionType.DEBIT);
          } else if (!isDebitField && amount > 0) {
            form.setValue(`lines.${index}.DebitAmount`, 0);
            form.setValue(`lines.${index}.TransactionType`, TransactionType.CREDIT);
          }

          // Set base amount
          form.setValue(`lines.${index}.BaseAmount`, amount);

          // Calculate tax if tax percentage is set
          const taxPercentage = lines[index].TaxPercentage || 0;
          if (taxPercentage > 0) {
            const taxAmount = roundToTwo((amount * taxPercentage) / 100);
            form.setValue(`lines.${index}.LineTaxAmount`, taxAmount);
          }
        }
      }

      // Handle tax percentage changes
      if (name.includes("TaxPercentage") && name.includes("lines.")) {
        const index = parseInt(name.split(".")[1]);
        const lines = form.getValues("lines");

        if (lines && lines[index]) {
          const taxPercentage = lines[index].TaxPercentage || 0;
          const baseAmount = lines[index].BaseAmount || 0;

          if (taxPercentage > 0 && baseAmount > 0) {
            const taxAmount = roundToTwo((baseAmount * taxPercentage) / 100);
            form.setValue(`lines.${index}.LineTaxAmount`, taxAmount);
          } else {
            form.setValue(`lines.${index}.LineTaxAmount`, 0);
          }
        }
      }

      // Copy cost centers to lines if enabled
      if (name === "CopyCostCenters" && value.CopyCostCenters) {
        const costCenter1 = form.getValues("CostCenter1ID");
        const costCenter2 = form.getValues("CostCenter2ID");
        const costCenter3 = form.getValues("CostCenter3ID");
        const costCenter4 = form.getValues("CostCenter4ID");
        const lines = form.getValues("lines");

        lines.forEach((_, index) => {
          if (costCenter1) form.setValue(`lines.${index}.LineCostCenter1ID`, costCenter1);
          if (costCenter2) form.setValue(`lines.${index}.LineCostCenter2ID`, costCenter2);
          if (costCenter3) form.setValue(`lines.${index}.LineCostCenter3ID`, costCenter3);
          if (costCenter4) form.setValue(`lines.${index}.LineCostCenter4ID`, costCenter4);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [form, taxes]);

  // Add new items
  const addLine = () => {
    if (!canEditVoucher) {
      toast.error("Cannot modify posted or approved vouchers.");
      return;
    }

    linesFieldArray.append({
      AccountID: "",
      TransactionType: TransactionType.DEBIT,
      DebitAmount: 0,
      CreditAmount: 0,
      BaseAmount: 0,
    });
  };

  // Attachment management functions
  const openAttachmentDialog = (attachment?: any) => {
    if (!canEditVoucher) {
      toast.error("Cannot modify posted or approved vouchers.");
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
      const index = attachmentsFieldArray.fields.findIndex((field) => field.id === editingAttachment.id);
      if (index !== -1) {
        attachmentsFieldArray.update(index, attachmentData);
      }
    } else {
      // Add new attachment
      attachmentsFieldArray.append(attachmentData);
    }
    closeAttachmentDialog();
  };

  const removeAttachment = (index: number) => {
    if (!canEditVoucher) {
      toast.error("Cannot modify posted or approved vouchers.");
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

  // Handle form submission
  const onSubmit = async (data: JournalVoucherFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    if (!canEditVoucher) {
      toast.error("Cannot save changes to posted or approved vouchers.");
      return;
    }

    setLoading(true);

    try {
      const totals = calculateTotals();

      if (!totals.isBalanced) {
        toast.error("Journal entry must be balanced (debits must equal credits)");
        setLoading(false);
        return;
      }

      const voucherData = {
        voucher: {
          VoucherNo: data.VoucherNo,
          VoucherType: data.VoucherType,
          TransactionDate: data.TransactionDate,
          PostingDate: data.PostingDate,
          CompanyID: parseInt(data.CompanyID),
          FiscalYearID: parseInt(data.FiscalYearID),
          CurrencyID: parseInt(data.CurrencyID),
          ExchangeRate: data.ExchangeRate,
          Description: data.Description,
          Narration: data.Narration,
          JournalType: data.JournalType,
          ChequeNo: data.ChequeNo,
          ChequeDate: data.ChequeDate,
          InvoiceNo: data.InvoiceNo,
          InvoiceDate: data.InvoiceDate,
          PaidTo: data.PaidTo,
          RefNo: data.RefNo,
          SupplierID: data.SupplierID ? parseInt(data.SupplierID) : undefined,
          TaxRegNo: data.TaxRegNo,
          City: data.City,
          TaxID: data.TaxID ? parseInt(data.TaxID) : undefined,
          IsTaxInclusive: data.IsTaxInclusive,
          CostCenter1ID: data.CostCenter1ID ? parseInt(data.CostCenter1ID) : undefined,
          CostCenter2ID: data.CostCenter2ID ? parseInt(data.CostCenter2ID) : undefined,
          CostCenter3ID: data.CostCenter3ID ? parseInt(data.CostCenter3ID) : undefined,
          CostCenter4ID: data.CostCenter4ID ? parseInt(data.CostCenter4ID) : undefined,
          CopyCostCenters: data.CopyCostCenters,
          ReferenceType: data.ReferenceType,
          ReferenceID: data.ReferenceID ? parseInt(data.ReferenceID) : undefined,
          ReferenceNo: data.ReferenceNo,
          PostingStatus: JournalStatus.DRAFT,
        },
        lines: data.lines?.map((line) => ({
          PostingID: line.PostingID,
          AccountID: parseInt(line.AccountID),
          TransactionType: line.TransactionType,
          DebitAmount: line.TransactionType === TransactionType.DEBIT ? line.DebitAmount : 0,
          CreditAmount: line.TransactionType === TransactionType.CREDIT ? line.CreditAmount : 0,
          BaseAmount: line.BaseAmount,
          TaxPercentage: line.TaxPercentage,
          LineTaxAmount: line.LineTaxAmount,
          LineDescription: line.LineDescription,
          CustomerID: line.CustomerID ? parseInt(line.CustomerID) : undefined,
          LineSupplierID: line.LineSupplierID ? parseInt(line.LineSupplierID) : undefined,
          LineInvoiceNo: line.LineInvoiceNo,
          LineInvoiceDate: line.LineInvoiceDate,
          LineTRN: line.LineTRN,
          LineCity: line.LineCity,
          LineCostCenter1ID: line.LineCostCenter1ID ? parseInt(line.LineCostCenter1ID) : undefined,
          LineCostCenter2ID: line.LineCostCenter2ID ? parseInt(line.LineCostCenter2ID) : undefined,
          LineCostCenter3ID: line.LineCostCenter3ID ? parseInt(line.LineCostCenter3ID) : undefined,
          LineCostCenter4ID: line.LineCostCenter4ID ? parseInt(line.LineCostCenter4ID) : undefined,
        })),
        attachments: data.attachments?.map((attachment) => ({
          PostingAttachmentID: attachment.PostingAttachmentID,
          DocTypeID: parseInt(attachment.DocTypeID),
          DocumentName: attachment.DocumentName,
          DocumentDescription: attachment.DocumentDescription,
          IsRequired: attachment.IsRequired,
          DisplayOrder: attachment.DisplayOrder,
          file: attachment.file,
        })),
      };

      if (isEdit && voucher) {
        const response = await journalVoucherService.updateJournalVoucher({
          voucherNo: voucher.VoucherNo,
          ...voucherData,
        });

        if (response.success) {
          toast.success("Journal voucher updated successfully");
          navigate(`/journal-vouchers/${voucher.VoucherNo}`);
        } else {
          toast.error(response.message || "Failed to update journal voucher");
        }
      } else {
        const response = await journalVoucherService.createJournalVoucher(voucherData);

        if (response.success && response.voucherNo) {
          toast.success("Journal voucher created successfully");
          navigate(`/journal-vouchers/${response.voucherNo}`);
        } else {
          toast.error(response.message || "Failed to create journal voucher");
        }
      }
    } catch (error) {
      console.error("Error saving journal voucher:", error);
      toast.error("Failed to save journal voucher");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    if (!canEditVoucher) {
      toast.error("Cannot reset posted or approved vouchers.");
      return;
    }

    if (isEdit && voucher) {
      form.reset();
    } else {
      form.reset({
        VoucherNo: "",
        VoucherType: "JV",
        TransactionDate: new Date(),
        PostingDate: null,
        CompanyID: "",
        FiscalYearID: "",
        CurrencyID: "",
        ExchangeRate: 1,
        Description: "",
        Narration: "",
        JournalType: JournalType.GENERAL,
        lines: [],
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

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { totalDebits, totalCredits, difference, isBalanced } = calculateTotals();
  const attachmentList = form.watch("attachments") || [];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/journal-vouchers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">{isEdit ? "Edit Journal Voucher" : "Create Journal Voucher"}</h1>
          {(isApproved || isPosted) && (
            <Badge variant="outline" className="bg-red-50 border-red-200 text-red-800">
              <Lock className="h-3 w-3 mr-1" />
              {isPosted ? "Posted" : "Approved"} - Protected from Editing
            </Badge>
          )}
        </div>

        {/* Approval/Posted Warning Alert */}
        {(isApproved || isPosted) && (
          <Alert className="border-l-4 border-l-red-500 bg-red-50">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Journal Voucher Editing Restricted</div>
              <div className="text-sm text-muted-foreground mt-1">
                This journal voucher has been {isPosted ? "posted" : "approved"} and is protected from modifications. To make changes, a manager must first reset the{" "}
                {isPosted ? "posting" : "approval"} status from the voucher details page.
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Voucher Information */}
            <Card className={isApproved || isPosted ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Voucher Information
                  {(isApproved || isPosted) && <Lock className="h-4 w-4 text-red-500" />}
                </CardTitle>
                <CardDescription>Enter the basic voucher details and transaction information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    form={form}
                    name="VoucherNo"
                    label="Voucher Number"
                    placeholder={isEdit ? "Voucher number (cannot be changed)" : "Auto-generated if left empty"}
                    description={isEdit ? "Voucher number cannot be modified in edit mode" : "Leave blank for auto-generated voucher number"}
                    disabled={isEdit} // Always disabled in edit mode
                    className={isEdit ? "bg-muted" : ""}
                  />
                  <FormField form={form} name="VoucherType" label="Voucher Type" placeholder="JV" description="Journal voucher type" disabled={!canEditVoucher} />
                  <FormField
                    form={form}
                    name="JournalType"
                    label="Journal Type"
                    type="select"
                    options={journalVoucherService.getJournalTypeOptions().map((type) => ({
                      label: type.label,
                      value: type.value,
                    }))}
                    placeholder="Select journal type"
                    required
                    disabled={!canEditVoucher}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField form={form} name="TransactionDate" label="Transaction Date" type="date" required description="Date of the transaction" disabled={!canEditVoucher} />
                  <FormField form={form} name="PostingDate" label="Posting Date" type="date" description="Date for posting (optional)" disabled={!canEditVoucher} />
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
                    description="Company for this voucher"
                    disabled={!canEditVoucher}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    description="Fiscal year for this voucher"
                    disabled={!canEditVoucher}
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
                    required
                    description="Currency for this voucher"
                    disabled={!canEditVoucher}
                  />
                  <FormField
                    form={form}
                    name="ExchangeRate"
                    label="Exchange Rate"
                    type="number"
                    step="0.0001"
                    placeholder="1.0000"
                    description="Exchange rate to base currency"
                    disabled={!canEditVoucher}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    form={form}
                    name="Description"
                    label="Description"
                    placeholder="Enter voucher description"
                    description="Brief description of the voucher"
                    disabled={!canEditVoucher}
                  />
                  <FormField
                    form={form}
                    name="Narration"
                    label="Narration"
                    type="textarea"
                    placeholder="Enter detailed narration"
                    description="Detailed description or notes"
                    disabled={!canEditVoucher}
                  />
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
                      <Plus className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-muted-foreground">Total Debits</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{totalDebits.toLocaleString()}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <HandCoins className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-muted-foreground">Total Credits</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">{totalCredits.toLocaleString()}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Difference</span>
                    </div>
                    <div className={`text-2xl font-bold ${Math.abs(difference) <= 0.01 ? "text-green-600" : "text-red-600"}`}>{difference.toLocaleString()}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {isBalanced ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                      <span className="text-sm font-medium text-muted-foreground">Status</span>
                    </div>
                    <div className={`text-lg font-bold ${isBalanced ? "text-green-600" : "text-red-600"}`}>{isBalanced ? "Balanced" : "Unbalanced"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Journal Details */}
            <Card className={isApproved || isPosted ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Journal Details
                  {(isApproved || isPosted) && <Lock className="h-4 w-4 text-red-500" />}
                </CardTitle>
                <CardDescription>Configure journal-specific information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    form={form}
                    name="SupplierID"
                    label="Supplier"
                    type="select"
                    options={suppliers.map((supplier) => ({
                      label: `${supplier.SupplierNo || ""} - ${supplier.SupplierName}`,
                      value: supplier.SupplierID.toString(),
                    }))}
                    placeholder="Select supplier"
                    description="Related supplier (optional)"
                    disabled={!canEditVoucher}
                  />
                  <FormField form={form} name="PaidTo" label="Paid To" placeholder="Enter payee name" description="Name of the person/entity" disabled={!canEditVoucher} />
                  <FormField
                    form={form}
                    name="RefNo"
                    label="Reference Number"
                    placeholder="Enter reference number"
                    description="External reference number"
                    disabled={!canEditVoucher}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    form={form}
                    name="InvoiceNo"
                    label="Invoice Number"
                    placeholder="Enter invoice number"
                    description="Related invoice number"
                    disabled={!canEditVoucher}
                  />
                  <FormField form={form} name="InvoiceDate" label="Invoice Date" type="date" description="Date of the invoice" disabled={!canEditVoucher} />
                  <FormField
                    form={form}
                    name="ChequeNo"
                    label="Cheque Number"
                    placeholder="Enter cheque number"
                    description="Cheque number if applicable"
                    disabled={!canEditVoucher}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField form={form} name="ChequeDate" label="Cheque Date" type="date" description="Date on the cheque" disabled={!canEditVoucher} />
                  <FormField
                    form={form}
                    name="TaxRegNo"
                    label="Tax Registration No"
                    placeholder="Enter tax registration number"
                    description="Tax registration number"
                    disabled={!canEditVoucher}
                  />
                  <FormField form={form} name="City" label="City" placeholder="Enter city" description="City for the transaction" disabled={!canEditVoucher} />
                </div>
              </CardContent>
            </Card>

            {/* Reference Information */}
            <Card className={isApproved || isPosted ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle>Reference Information</CardTitle>
                <CardDescription>Optional reference details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    form={form}
                    name="ReferenceType"
                    label="Reference Type"
                    placeholder="Enter reference type"
                    description="Type of reference"
                    disabled={!canEditVoucher}
                  />
                  <FormField form={form} name="ReferenceID" label="Reference ID" placeholder="Enter reference ID" description="Reference identifier" disabled={!canEditVoucher} />
                  <FormField
                    form={form}
                    name="ReferenceNo"
                    label="Reference Number"
                    placeholder="Enter reference number"
                    description="Reference number"
                    disabled={!canEditVoucher}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cost Center Section */}
            <Card className={isApproved || isPosted ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-primary" />
                  Cost Centers
                  {(isApproved || isPosted) && <Lock className="h-4 w-4 text-red-500" />}
                </CardTitle>
                <CardDescription>
                  Configure cost center allocation
                  <Badge variant="secondary" className="ml-2">
                    Voucher Level
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                  <FormField
                    form={form}
                    name="CostCenter1ID"
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
                    name="CostCenter2ID"
                    label="Cost Center Level 2"
                    type="select"
                    options={costCenters2.map((cc) => ({
                      label: cc.Description,
                      value: cc.CostCenter2ID.toString(),
                    }))}
                    placeholder="Select level 2"
                    description="Secondary cost center"
                    disabled={!form.watch("CostCenter1ID") || !canEditVoucher}
                  />
                  <FormField
                    form={form}
                    name="CostCenter3ID"
                    label="Cost Center Level 3"
                    type="select"
                    options={costCenters3.map((cc) => ({
                      label: cc.Description,
                      value: cc.CostCenter3ID.toString(),
                    }))}
                    placeholder="Select level 3"
                    description="Tertiary cost center"
                    disabled={!form.watch("CostCenter2ID") || !canEditVoucher}
                  />
                  <FormField
                    form={form}
                    name="CostCenter4ID"
                    label="Cost Center Level 4"
                    type="select"
                    options={costCenters4.map((cc) => ({
                      label: cc.Description,
                      value: cc.CostCenter4ID.toString(),
                    }))}
                    placeholder="Select level 4"
                    description="Quaternary cost center"
                    disabled={!form.watch("CostCenter3ID") || !canEditVoucher}
                  />
                </div>
                <FormField
                  form={form}
                  name="CopyCostCenters"
                  label="Copy Cost Centers to Lines"
                  type="switch"
                  description="Automatically apply these cost centers to all lines"
                  disabled={!canEditVoucher}
                />
              </CardContent>
            </Card>

            {/* Tax Information */}
            <Card className={isApproved || isPosted ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle>Tax Information</CardTitle>
                <CardDescription>Configure tax settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    form={form}
                    name="TaxID"
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
                  <FormField form={form} name="IsTaxInclusive" label="Tax Inclusive" type="switch" description="Whether amounts include tax" disabled={!canEditVoucher} />
                </div>
              </CardContent>
            </Card>

            {/* Journal Lines */}
            <Card className={isApproved || isPosted ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Journal Lines
                      {(isApproved || isPosted) && <Lock className="h-4 w-4 text-red-500" />}
                    </CardTitle>
                    <CardDescription>Add debit and credit entries with detailed information</CardDescription>
                  </div>
                  <Button type="button" onClick={addLine} disabled={!canEditVoucher}>
                    {canEditVoucher ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                    Add Line
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {linesFieldArray.fields.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No journal lines have been added yet.</p>
                    <Button type="button" variant="outline" onClick={addLine} disabled={!canEditVoucher}>
                      {canEditVoucher ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                      Add Your First Line
                    </Button>
                  </div>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {linesFieldArray.fields.map((field, index) => {
                      const accountId = form.watch(`lines.${index}.AccountID`);
                      const accountDetails = accounts.find((acc) => acc.AccountID.toString() === accountId);
                      const transactionType = form.watch(`lines.${index}.TransactionType`);
                      const amount = transactionType === TransactionType.DEBIT ? form.watch(`lines.${index}.DebitAmount`) : form.watch(`lines.${index}.CreditAmount`);

                      return (
                        <AccordionItem key={field.id} value={`line-${index}`} className="border rounded-lg mb-4">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-muted-foreground" />
                                <div className="text-left">
                                  <div className="font-medium">{accountDetails ? `${accountDetails.AccountCode} - ${accountDetails.AccountName}` : `Line ${index + 1}`}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {transactionType} • {form.watch(`lines.${index}.LineDescription`) || "No description"}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div className={`font-medium ${transactionType === TransactionType.DEBIT ? "text-green-600" : "text-red-600"}`}>
                                  {transactionType === TransactionType.DEBIT ? "Dr." : "Cr."} {amount ? amount.toLocaleString() : "0"}
                                </div>
                              </div>
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
                                  name={`lines.${index}.AccountID`}
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
                                  name={`lines.${index}.TransactionType`}
                                  label="Transaction Type"
                                  type="select"
                                  options={[
                                    { label: "Debit", value: TransactionType.DEBIT },
                                    { label: "Credit", value: TransactionType.CREDIT },
                                  ]}
                                  required
                                  disabled={!canEditVoucher}
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                  form={form}
                                  name={`lines.${index}.DebitAmount`}
                                  label="Debit Amount"
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  disabled={!canEditVoucher || transactionType !== TransactionType.DEBIT}
                                />
                                <FormField
                                  form={form}
                                  name={`lines.${index}.CreditAmount`}
                                  label="Credit Amount"
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  disabled={!canEditVoucher || transactionType !== TransactionType.CREDIT}
                                />
                              </div>

                              <FormField
                                form={form}
                                name={`lines.${index}.LineDescription`}
                                label="Line Description"
                                placeholder="Enter description for this line"
                                disabled={!canEditVoucher}
                              />

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                  form={form}
                                  name={`lines.${index}.CustomerID`}
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
                                  name={`lines.${index}.LineSupplierID`}
                                  label="Supplier"
                                  type="select"
                                  options={suppliers.map((supplier) => ({
                                    label: supplier.SupplierName,
                                    value: supplier.SupplierID.toString(),
                                  }))}
                                  placeholder="Select supplier (optional)"
                                  disabled={!canEditVoucher}
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                  form={form}
                                  name={`lines.${index}.LineInvoiceNo`}
                                  label="Invoice Number"
                                  placeholder="Line-specific invoice number"
                                  disabled={!canEditVoucher}
                                />
                                <FormField form={form} name={`lines.${index}.LineInvoiceDate`} label="Invoice Date" type="date" disabled={!canEditVoucher} />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField form={form} name={`lines.${index}.LineTRN`} label="TRN" placeholder="Tax registration number" disabled={!canEditVoucher} />
                                <FormField form={form} name={`lines.${index}.LineCity`} label="City" placeholder="City for this line" disabled={!canEditVoucher} />
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <HandCoins className="h-4 w-4 text-green-500" />
                                  <span className="font-medium">Tax Information</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <FormField
                                    form={form}
                                    name={`lines.${index}.TaxPercentage`}
                                    label="Tax Percentage"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    disabled={!canEditVoucher}
                                  />
                                  <FormField
                                    form={form}
                                    name={`lines.${index}.LineTaxAmount`}
                                    label="Tax Amount"
                                    type="number"
                                    step="0.01"
                                    disabled
                                    description="Auto-calculated"
                                  />
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <Network className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium">Line-Level Cost Centers</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                  <FormField
                                    form={form}
                                    name={`lines.${index}.LineCostCenter1ID`}
                                    label="Level 1"
                                    type="select"
                                    options={costCenters1.map((cc) => ({
                                      label: cc.Description,
                                      value: cc.CostCenter1ID.toString(),
                                    }))}
                                    placeholder="CC Level 1"
                                    disabled={!canEditVoucher}
                                  />
                                  <FormField
                                    form={form}
                                    name={`lines.${index}.LineCostCenter2ID`}
                                    label="Level 2"
                                    type="select"
                                    options={costCenters2.map((cc) => ({
                                      label: cc.Description,
                                      value: cc.CostCenter2ID.toString(),
                                    }))}
                                    placeholder="CC Level 2"
                                    disabled={!canEditVoucher}
                                  />
                                  <FormField
                                    form={form}
                                    name={`lines.${index}.LineCostCenter3ID`}
                                    label="Level 3"
                                    type="select"
                                    options={costCenters3.map((cc) => ({
                                      label: cc.Description,
                                      value: cc.CostCenter3ID.toString(),
                                    }))}
                                    placeholder="CC Level 3"
                                    disabled={!canEditVoucher}
                                  />
                                  <FormField
                                    form={form}
                                    name={`lines.${index}.LineCostCenter4ID`}
                                    label="Level 4"
                                    type="select"
                                    options={costCenters4.map((cc) => ({
                                      label: cc.Description,
                                      value: cc.CostCenter4ID.toString(),
                                    }))}
                                    placeholder="CC Level 4"
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
                          Debits: <span className="font-mono text-green-600">{totalDebits.toFixed(2)}</span>
                        </div>
                        <div className="text-sm">
                          Credits: <span className="font-mono text-red-600">{totalCredits.toFixed(2)}</span>
                        </div>
                        <div className="text-sm">
                          Difference: <span className={`font-mono ${Math.abs(difference) > 0.01 ? "text-red-600" : "text-green-600"}`}>{difference.toFixed(2)}</span>
                        </div>
                      </div>
                      {Math.abs(difference) > 0.01 ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Out of Balance
                        </Badge>
                      ) : (
                        <Badge className="flex items-center gap-1 bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3" />
                          Balanced
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card className={isApproved || isPosted ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Voucher Documents
                      {(isApproved || isPosted) && <Lock className="h-4 w-4 text-red-500" />}
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
                        const docType = docTypes.find((dt) => dt.DocTypeID.toString() === attachment.DocTypeID);

                        return (
                          <Card key={index} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                <AttachmentThumbnail
                                  fileUrl={attachment.file?.url}
                                  fileName={attachment.DocumentName || "Document"}
                                  fileType={attachment.file?.type}
                                  onClick={() => attachment.file?.url && openAttachmentPreview(attachment)}
                                />
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{attachment.DocumentName}</span>
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
                                    {attachment.DocumentDescription && <div className="text-muted-foreground mt-1">{attachment.DocumentDescription}</div>}
                                    {attachment.IsRequired && (
                                      <Badge variant="secondary" className="text-xs">
                                        Required
                                      </Badge>
                                    )}
                                  </div>

                                  {attachment.file?.url && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <Button type="button" variant="outline" size="sm" onClick={() => openAttachmentGallery(index)} className="h-8 px-3">
                                        <FileTypeIcon fileName={attachment.DocumentName || "Document"} fileType={attachment.file?.type} size={14} className="mr-1.5" />
                                        Preview
                                      </Button>
                                      {attachment.file?.url && (
                                        <a
                                          href={attachment.file?.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          download={attachment.DocumentName}
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
                  <Button type="button" variant="outline" onClick={() => navigate("/journal-vouchers")} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset} disabled={loading || !canEditVoucher}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
                <Button type="submit" disabled={loading || linesFieldArray.fields.length === 0 || !isBalanced || !canEditVoucher}>
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
            fileName={previewAttachment.DocumentName || "Document"}
            fileType={previewAttachment.file?.type}
            fileSize={previewAttachment.file?.size}
            description={previewAttachment.DocumentDescription}
            documentType={docTypes.find((dt) => dt.DocTypeID.toString() === previewAttachment.DocTypeID)?.Description}
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
    DocTypeID: "",
    DocumentName: "",
    DocumentDescription: "",
    IsRequired: false,
    DisplayOrder: 0,
    file: null as File | null,
  });

  useEffect(() => {
    if (editingAttachment) {
      setFormData({
        DocTypeID: editingAttachment.DocTypeID || "",
        DocumentName: editingAttachment.DocumentName || "",
        DocumentDescription: editingAttachment.DocumentDescription || "",
        IsRequired: editingAttachment.IsRequired || false,
        DisplayOrder: editingAttachment.DisplayOrder || 0,
        file: editingAttachment.file || null,
      });
    } else {
      setFormData({
        DocTypeID: "",
        DocumentName: "",
        DocumentDescription: "",
        IsRequired: false,
        DisplayOrder: 0,
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
        DocumentName: prev.DocumentName || file.name,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.DocTypeID || !formData.DocumentName) {
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
              value={formData.DocTypeID}
              onChange={(e) => setFormData((prev) => ({ ...prev, DocTypeID: e.target.value }))}
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
            <Input value={formData.DocumentName} onChange={(e) => setFormData((prev) => ({ ...prev, DocumentName: e.target.value }))} placeholder="Enter document name" required />
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
              value={formData.DocumentDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, DocumentDescription: e.target.value }))}
              placeholder="Enter document description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Required Document</Label>
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked={formData.IsRequired} onChange={(e) => setFormData((prev) => ({ ...prev, IsRequired: e.target.checked }))} className="h-4 w-4" />
                <span className="text-sm">Mark as required</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.DisplayOrder}
                onChange={(e) => setFormData((prev) => ({ ...prev, DisplayOrder: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
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

export default JournalVoucherForm;
