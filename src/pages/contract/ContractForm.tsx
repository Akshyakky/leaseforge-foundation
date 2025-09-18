// src/pages/contract/ContractForm.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
  FileText,
  Building,
  HandCoins,
  Calendar,
  Calculator,
  CheckCircle,
  Info,
  RotateCcw,
  PlusCircle,
  Edit2,
  Download,
  Lock,
  Shield,
  Mail,
  Send,
  Settings,
} from "lucide-react";
import { contractService, Contract } from "@/services/contractService";
import { customerService } from "@/services/customerService";
import { unitService } from "@/services/unitService";
import { additionalChargesService } from "@/services/additionalChargesService";
import { docTypeService } from "@/services/docTypeService";
import { taxService, Tax } from "@/services/taxService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { useAppSelector } from "@/lib/hooks";
import { differenceInDays, differenceInMonths, differenceInYears, format } from "date-fns";
import { AttachmentThumbnail } from "@/components/attachments/AttachmentThumbnail";
import { AttachmentPreview } from "@/components/attachments/AttachmentPreview";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { FileTypeIcon } from "@/components/attachments/FileTypeIcon";

// Import Email components
import { EmailSendDialog } from "@/pages/email/EmailSendDialog";
import { useEmailIntegration } from "@/hooks/useEmailIntegration";

// Enhanced schema for contract form validation
const contractUnitSchema = z.object({
  ContractUnitID: z.number().optional(),
  UnitID: z.string().min(1, "Unit is required"),
  FromDate: z.date({ required_error: "From date is required" }),
  ToDate: z.date({ required_error: "To date is required" }),
  FitoutFromDate: z.date().optional().nullable(),
  FitoutToDate: z.date().optional().nullable(),
  CommencementDate: z.date().optional().nullable(),
  ContractDays: z.number().optional().nullable(),
  ContractMonths: z.number().optional().nullable(),
  ContractYears: z.number().optional().nullable(),
  RentPerMonth: z.coerce.number().min(0, "Monthly rent must be 0 or greater"),
  RentPerYear: z.coerce.number().min(0, "Yearly rent must be 0 or greater"),
  NoOfInstallments: z.coerce.number().min(1, "Number of installments must be at least 1").optional().nullable(),
  RentFreePeriodFrom: z.date().optional().nullable(),
  RentFreePeriodTo: z.date().optional().nullable(),
  RentFreeAmount: z.coerce.number().min(0).optional().nullable(),
  TaxID: z.string().optional(),
  TaxPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
  TaxAmount: z.coerce.number().min(0).optional().nullable(),
  TotalAmount: z.coerce.number().min(0, "Total amount must be 0 or greater"),
});

const contractChargeSchema = z.object({
  ContractAdditionalChargeID: z.number().optional(),
  AdditionalChargesID: z.string().min(1, "Charge is required"),
  Amount: z.coerce.number().min(0, "Amount must be 0 or greater"),
  TaxID: z.string().optional(),
  TaxPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
  TaxAmount: z.coerce.number().min(0).optional().nullable(),
  TotalAmount: z.coerce.number().min(0, "Total amount must be 0 or greater"),
});

const contractAttachmentSchema = z.object({
  ContractAttachmentID: z.number().optional(),
  DocTypeID: z.string().min(1, "Document type is required"),
  DocumentName: z.string().min(1, "Document name is required"),
  DocIssueDate: z.date().optional().nullable(),
  DocExpiryDate: z.date().optional().nullable(),
  DocumentDescription: z.string().optional(),
  file: z.any().optional(),
});

const contractSchema = z.object({
  ContractNo: z.string().optional(),
  ContractStatus: z.string().default("Draft"),
  CustomerID: z.string().min(1, "Customer is required"),
  JointCustomerID: z.string().optional(),
  TransactionDate: z.date().default(() => new Date()),
  Remarks: z.string().optional(),
  units: z.array(contractUnitSchema).min(1, "At least one unit is required"),
  additionalCharges: z.array(contractChargeSchema).optional(),
  attachments: z.array(contractAttachmentSchema).optional(),
  // Email notification settings
  sendEmailNotification: z.boolean().default(false),
  emailRecipients: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string(),
        type: z.enum(["to", "cc", "bcc"]),
      })
    )
    .optional(),
});

type ContractFormValues = z.infer<typeof contractSchema>;

// Unit Information Display Component
const UnitInformationCard = ({ unitDetails }: { unitDetails: any }) => {
  if (!unitDetails) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Building className="h-5 w-5 text-blue-600" />
        <span className="font-medium text-blue-900">Unit Information</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Property:</span>
          <div className="font-medium">{unitDetails.PropertyName}</div>
        </div>
        <div>
          <span className="text-gray-600">Type:</span>
          <div className="font-medium">{unitDetails.UnitTypeName}</div>
        </div>
        <div>
          <span className="text-gray-600">Area:</span>
          <div className="font-medium">{unitDetails.TotalAreaSqft ? `${unitDetails.TotalAreaSqft.toLocaleString()} sqft` : "Not specified"}</div>
        </div>
        <div>
          <span className="text-gray-600">Status:</span>
          <div className="font-medium">
            <Badge variant={unitDetails.UnitStatus === "Available" ? "default" : "secondary"}>{unitDetails.UnitStatus}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

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

const ContractForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [contract, setContract] = useState<Contract | null>(null);

  // Reference data
  const [customers, setCustomers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);

  // Attachment management state
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [editingAttachment, setEditingAttachment] = useState<any>(null);
  const [previewAttachment, setPreviewAttachment] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialAttachmentId, setInitialAttachmentId] = useState<number | undefined>(undefined);
  const [isDocTypeDialogOpen, setIsDocTypeDialogOpen] = useState(false);

  // Email integration states
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);

  // Check if editing is allowed
  const canEditContract = !contract || contract.ApprovalStatus !== "Approved";
  const isApproved = contract?.ApprovalStatus === "Approved";

  // Initialize email integration hook
  const emailIntegration = useEmailIntegration({
    entityType: "contract",
    entityId: contract?.ContractID || 0,
  });

  // Initialize form
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      ContractNo: "",
      ContractStatus: "Draft",
      CustomerID: "",
      JointCustomerID: "",
      TransactionDate: new Date(),
      Remarks: "",
      units: [],
      additionalCharges: [],
      attachments: [],
      sendEmailNotification: false,
      emailRecipients: [],
    },
  });

  // Setup field arrays
  const unitsFieldArray = useFieldArray({
    control: form.control,
    name: "units",
  });

  const chargesFieldArray = useFieldArray({
    control: form.control,
    name: "additionalCharges",
  });

  const attachmentsFieldArray = useFieldArray({
    control: form.control,
    name: "attachments",
  });

  // Calculate totals
  const calculateTotals = () => {
    const formValues = form.getValues();
    let unitTotal = 0;
    let chargesTotal = 0;

    const roundToTwo = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    if (formValues.units && formValues.units.length > 0) {
      unitTotal = formValues.units.reduce((sum, unit) => {
        const amount = unit.TotalAmount || 0;
        return roundToTwo(sum + amount);
      }, 0);
    }

    if (formValues.additionalCharges && formValues.additionalCharges.length > 0) {
      chargesTotal = formValues.additionalCharges.reduce((sum, charge) => {
        const amount = charge.TotalAmount || 0;
        return roundToTwo(sum + amount);
      }, 0);
    }

    return {
      unitTotal: roundToTwo(unitTotal),
      chargesTotal: roundToTwo(chargesTotal),
      grandTotal: roundToTwo(unitTotal + chargesTotal),
    };
  };

  // Generate default email recipients based on contract data
  const getDefaultEmailRecipients = () => {
    const formValues = form.getValues();
    const recipients = [];

    if (formValues.CustomerID) {
      const customer = customers.find((c) => c.CustomerID.toString() === formValues.CustomerID);
      if (customer && customer.Email) {
        recipients.push({
          email: customer.Email,
          name: customer.CustomerFullName,
          type: "to" as const,
        });
      }
    }

    if (formValues.JointCustomerID) {
      const jointCustomer = customers.find((c) => c.CustomerID.toString() === formValues.JointCustomerID);
      if (jointCustomer && jointCustomer.Email) {
        recipients.push({
          email: jointCustomer.Email,
          name: jointCustomer.CustomerFullName,
          type: "to" as const,
        });
      }
    }

    return recipients;
  };

  // Helper function to validate unit availability for the selected period
  // const validateUnitAvailability = async (unitId: string, fromDate: Date, toDate: Date, excludeContractId?: number) => {
  //   try {
  //     // This would typically call an API to check for overlapping contracts
  //     const overlappingContracts = await contractService.checkUnitAvailability({
  //       unitId: parseInt(unitId),
  //       fromDate,
  //       toDate,
  //       excludeContractId,
  //     });

  //     if (overlappingContracts && overlappingContracts.length > 0) {
  //       const conflictDetails = overlappingContracts
  //         .map((contract) => `Contract ${contract.ContractNo} (${format(new Date(contract.FromDate), "dd MMM yyyy")} - ${format(new Date(contract.ToDate), "dd MMM yyyy")})`)
  //         .join(", ");

  //       toast.error(`Unit is not available for the selected period. Conflicts with: ${conflictDetails}`);
  //       return false;
  //     }

  //     return true;
  //   } catch (error) {
  //     console.error("Error checking unit availability:", error);
  //     toast.warning("Could not verify unit availability. Please check manually.");
  //     return true; // Allow to proceed with warning
  //   }
  // };

  // Enhanced unit display helper
  const getEnhancedUnitDisplay = (unitId: string, index: number) => {
    const unitDetails = getUnitDetails(unitId);
    const fromDate = form.watch(`units.${index}.FromDate`);
    const toDate = form.watch(`units.${index}.ToDate`);
    const totalAmount = form.watch(`units.${index}.TotalAmount`);
    const contractDays = form.watch(`units.${index}.ContractDays`);

    return {
      title: unitDetails ? `${unitDetails.UnitNo} - ${unitDetails.PropertyName}` : `Unit ${index + 1}`,
      subtitle: unitDetails ? `${unitDetails.UnitTypeName} • ${unitDetails.UnitCategoryName}` : "",
      period: fromDate && toDate ? `${formatDate(fromDate)} - ${formatDate(toDate)}` : "Period not set",
      duration: contractDays ? `${contractDays} days` : "",
      amount: totalAmount ? totalAmount.toLocaleString() : "0",
      status: unitDetails?.UnitStatus || "Unknown",
    };
  };

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        await fetchReferenceData();

        if (isEdit && id) {
          const contractData = await contractService.getContractById(parseInt(id));

          if (contractData.contract) {
            setContract(contractData.contract);

            // Check if contract is approved and prevent editing
            if (contractData.contract.ApprovalStatus === "Approved") {
              toast.error("This contract has been approved and cannot be edited. Please reset approval status first if changes are needed.");
              navigate(`/contracts/${contractData.contract.ContractID}`);
              return;
            }

            const formattedContract = {
              ...contractData.contract,
              TransactionDate: contractData.contract.TransactionDate ? new Date(contractData.contract.TransactionDate) : new Date(),
              CustomerID: contractData.contract.CustomerID?.toString() || "",
              JointCustomerID: contractData.contract.JointCustomerID?.toString() || "",
            };

            const formattedUnits = contractData.units.map((unit) => ({
              ...unit,
              UnitID: unit.UnitID?.toString() || "",
              FromDate: unit.FromDate ? new Date(unit.FromDate) : new Date(),
              ToDate: unit.ToDate ? new Date(unit.ToDate) : new Date(),
              FitoutFromDate: unit.FitoutFromDate ? new Date(unit.FitoutFromDate) : null,
              FitoutToDate: unit.FitoutToDate ? new Date(unit.FitoutToDate) : null,
              CommencementDate: unit.CommencementDate ? new Date(unit.CommencementDate) : null,
              RentFreePeriodFrom: unit.RentFreePeriodFrom ? new Date(unit.RentFreePeriodFrom) : null,
              RentFreePeriodTo: unit.RentFreePeriodTo ? new Date(unit.RentFreePeriodTo) : null,
            }));

            const formattedCharges = contractData.additionalCharges.map((charge) => ({
              ...charge,
              AdditionalChargesID: charge.AdditionalChargesID?.toString() || "",
            }));

            const formattedAttachments = contractData.attachments.map((attachment) => ({
              ...attachment,
              DocTypeID: attachment.DocTypeID?.toString() || "",
              DocIssueDate: attachment.DocIssueDate ? new Date(attachment.DocIssueDate) : null,
              DocExpiryDate: attachment.DocExpiryDate ? new Date(attachment.DocExpiryDate) : null,
            }));

            form.reset({
              ...formattedContract,
              units: formattedUnits,
              additionalCharges: formattedCharges,
              attachments: formattedAttachments,
              sendEmailNotification: false,
              emailRecipients: [],
            });
          } else {
            toast.error("Contract not found");
            navigate("/contracts");
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

  // Load email templates when component mounts
  useEffect(() => {
    emailIntegration.loadEmailTemplates("Contract");
  }, [emailIntegration]);

  // Auto-update email recipients when customers change
  useEffect(() => {
    if (form.watch("sendEmailNotification")) {
      const recipients = getDefaultEmailRecipients();
      form.setValue("emailRecipients", recipients);
    }
  }, [form.watch("CustomerID"), form.watch("JointCustomerID"), customers]);

  // Fetch reference data
  const fetchReferenceData = async () => {
    try {
      const [customersData, unitsData, chargesData, docTypesData, taxesData] = await Promise.all([
        customerService.getAllCustomers(),
        unitService.getAllUnits(),
        additionalChargesService.getAllCharges(),
        docTypeService.getAllDocTypes(),
        taxService.getAllTaxes(),
      ]);

      setCustomers(customersData);
      setUnits(unitsData);
      setCharges(chargesData);
      setDocTypes(docTypesData);
      setTaxes(taxesData);
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Error loading reference data");
    }
  };

  // Enhanced Unit Selection Logic
  useEffect(() => {
    const handleEnhancedUnitChange = async (unitId: string, index: number) => {
      if (!unitId || unitId === "0") {
        // Clear unit-related fields when no unit is selected
        form.setValue(`units.${index}.RentPerMonth`, 0);
        form.setValue(`units.${index}.RentPerYear`, 0);
        form.setValue(`units.${index}.NoOfInstallments`, 12);
        return;
      }

      try {
        // Find unit details from existing data or fetch from API
        let unitDetails = units.find((u) => u.UnitID.toString() === unitId);

        if (!unitDetails) {
          // Fetch unit details if not in current list
          const { unit } = await unitService.getUnitById(parseInt(unitId));
          unitDetails = unit;
        }

        if (unitDetails) {
          // Get current values to preserve user changes
          const currentValues = form.getValues(`units.${index}`);

          // Create updated unit data object
          const updatedUnitData = {
            ...currentValues,
            UnitID: unitId,
          };

          // Auto-populate rental information from unit master data
          if (unitDetails.PerMonth && unitDetails.PerMonth > 0) {
            updatedUnitData.RentPerMonth = unitDetails.PerMonth;

            // Calculate yearly rent based on installments
            const installments = unitDetails.NoOfInstallmentLease || 12;
            updatedUnitData.NoOfInstallments = installments;
            updatedUnitData.RentPerYear = parseFloat((unitDetails.PerMonth * installments).toFixed(2));
          } else if (unitDetails.PerYear && unitDetails.PerYear > 0) {
            updatedUnitData.RentPerYear = unitDetails.PerYear;

            // Calculate monthly rent based on installments
            const installments = unitDetails.NoOfInstallmentLease || 12;
            updatedUnitData.NoOfInstallments = installments;
            updatedUnitData.RentPerMonth = parseFloat((unitDetails.PerYear / installments).toFixed(2));
          }

          // Set default contract period if not already set
          if (!currentValues.FromDate || !currentValues.ToDate) {
            const today = new Date();
            const oneYearLater = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

            updatedUnitData.FromDate = today;
            updatedUnitData.ToDate = oneYearLater;

            // Calculate contract duration
            updatedUnitData.ContractDays = differenceInDays(oneYearLater, today);
            updatedUnitData.ContractMonths = differenceInMonths(oneYearLater, today);
            updatedUnitData.ContractYears = differenceInYears(oneYearLater, today);
          }

          // Apply all updates at once to prevent multiple re-renders
          Object.entries(updatedUnitData).forEach(([key, value]) => {
            if (key !== "UnitID") {
              // UnitID is already set
              form.setValue(`units.${index}.${key}` as any, value, { shouldValidate: false });
            }
          });

          // Trigger tax calculation if applicable
          const taxId = form.getValues(`units.${index}.TaxID`);
          if (taxId && taxId !== "0") {
            const selectedTax = taxes.find((tax) => tax.TaxID.toString() === taxId);
            if (selectedTax && updatedUnitData.RentPerYear) {
              const taxAmount = parseFloat(((updatedUnitData.RentPerYear * selectedTax.TaxRate) / 100).toFixed(2));
              form.setValue(`units.${index}.TaxAmount`, taxAmount, { shouldValidate: false });
              form.setValue(`units.${index}.TotalAmount`, parseFloat((updatedUnitData.RentPerYear + taxAmount).toFixed(2)), { shouldValidate: false });
            }
          } else {
            // No tax applied
            form.setValue(`units.${index}.TaxAmount`, 0, { shouldValidate: false });
            form.setValue(`units.${index}.TotalAmount`, updatedUnitData.RentPerYear || 0, { shouldValidate: false });
          }

          // Show success notification
          toast.success(`Unit details loaded: ${unitDetails.UnitNo} - ${unitDetails.PropertyName}`);
        } else {
          toast.error("Unit details not found");
        }
      } catch (error) {
        console.error("Error fetching unit details:", error);
        toast.error("Failed to load unit details. Please try again.");
      }
    };

    const subscription = form.watch((value, { name, type }) => {
      if (name && name.includes(".UnitID") && type === "change") {
        const index = parseInt(name.split(".")[1]);
        const unitId = form.getValues(`units.${index}.UnitID`);

        if (unitId && unitId !== "0") {
          handleEnhancedUnitChange(unitId, index);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, units, taxes]);

  // Enhanced contract duration calculations with validation
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (!name || type !== "change") return;

      // Handle contract duration calculations
      if ((name.includes("FromDate") || name.includes("ToDate")) && name.includes("units.")) {
        const index = parseInt(name.split(".")[1]);
        const units = form.getValues("units");

        if (units && units[index]) {
          const fromDate = units[index].FromDate;
          const toDate = units[index].ToDate;

          if (fromDate && toDate) {
            // Validate date range
            if (toDate <= fromDate) {
              toast.error("End date must be after start date");
              return;
            }

            // Calculate duration
            const totalDays = differenceInDays(toDate, fromDate);
            const totalMonths = differenceInMonths(toDate, fromDate);
            const totalYears = differenceInYears(toDate, fromDate);

            // Update duration fields
            form.setValue(`units.${index}.ContractDays`, totalDays, { shouldValidate: false });
            form.setValue(`units.${index}.ContractMonths`, totalMonths, { shouldValidate: false });
            form.setValue(`units.${index}.ContractYears`, totalYears, { shouldValidate: false });

            // Provide user feedback for contract duration
            if (totalDays > 0) {
              let durationText = "";
              if (totalYears > 0) {
                durationText += `${totalYears} year${totalYears > 1 ? "s" : ""}`;
              }
              if (totalMonths % 12 > 0) {
                if (durationText) durationText += ", ";
                durationText += `${totalMonths % 12} month${totalMonths % 12 > 1 ? "s" : ""}`;
              }
              if (totalDays % 30 > 0 && totalYears === 0) {
                if (durationText) durationText += ", ";
                durationText += `${totalDays % 30} day${totalDays % 30 > 1 ? "s" : ""}`;
              }

              console.log(`Contract duration calculated: ${durationText} (${totalDays} total days)`);
            }
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Enhanced rent calculation with better validation
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (!name || type !== "change") return;

      const roundToTwo = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

      const getTaxDetails = (taxId: string) => {
        if (!taxId || taxId === "0") return null;
        return taxes.find((tax) => tax.TaxID.toString() === taxId);
      };

      // Handle monthly rent changes
      if (name.includes("RentPerMonth") && name.includes("units.")) {
        const index = parseInt(name.split(".")[1]);
        const units = form.getValues("units");

        if (units && units[index]) {
          const monthlyRent = units[index].RentPerMonth || 0;
          const installments = units[index].NoOfInstallments || 12;

          if (monthlyRent > 0) {
            const yearlyRent = roundToTwo(monthlyRent * installments);
            form.setValue(`units.${index}.RentPerYear`, yearlyRent, { shouldValidate: false });

            // Recalculate tax and total
            const taxId = units[index].TaxID;
            if (taxId && taxId !== "0") {
              const selectedTax = getTaxDetails(taxId);
              if (selectedTax) {
                const taxAmount = roundToTwo((yearlyRent * selectedTax.TaxRate) / 100);
                form.setValue(`units.${index}.TaxAmount`, taxAmount, { shouldValidate: false });
                form.setValue(`units.${index}.TotalAmount`, roundToTwo(yearlyRent + taxAmount), { shouldValidate: false });
              }
            } else {
              form.setValue(`units.${index}.TaxAmount`, 0, { shouldValidate: false });
              form.setValue(`units.${index}.TotalAmount`, yearlyRent, { shouldValidate: false });
            }
          }
        }
      }

      // Handle installment changes
      if (name.includes("NoOfInstallments") && name.includes("units.")) {
        const index = parseInt(name.split(".")[1]);
        const units = form.getValues("units");

        if (units && units[index]) {
          const monthlyRent = units[index].RentPerMonth || 0;
          const installments = units[index].NoOfInstallments || 12;

          // Validate installments
          if (installments < 1 || installments > 52) {
            toast.error("Number of installments should be between 1 and 52");
            return;
          }

          if (monthlyRent > 0) {
            const yearlyRent = roundToTwo(monthlyRent * installments);
            form.setValue(`units.${index}.RentPerYear`, yearlyRent, { shouldValidate: false });

            // Recalculate tax and total
            const taxId = units[index].TaxID;
            if (taxId && taxId !== "0") {
              const selectedTax = getTaxDetails(taxId);
              if (selectedTax) {
                const taxAmount = roundToTwo((yearlyRent * selectedTax.TaxRate) / 100);
                form.setValue(`units.${index}.TaxAmount`, taxAmount, { shouldValidate: false });
                form.setValue(`units.${index}.TotalAmount`, roundToTwo(yearlyRent + taxAmount), { shouldValidate: false });
              }
            } else {
              form.setValue(`units.${index}.TaxAmount`, 0, { shouldValidate: false });
              form.setValue(`units.${index}.TotalAmount`, yearlyRent, { shouldValidate: false });
            }
          }
        }
      }

      // Handle tax changes for units
      if (name.includes("TaxID") && name.includes("units.")) {
        const index = parseInt(name.split(".")[1]);
        const units = form.getValues("units");

        if (units && units[index]) {
          const taxId = units[index].TaxID;
          const rentPerYear = units[index].RentPerYear || 0;

          if (taxId && taxId !== "0") {
            const selectedTax = getTaxDetails(taxId);
            if (selectedTax) {
              form.setValue(`units.${index}.TaxPercentage`, selectedTax.TaxRate);
              const taxAmount = roundToTwo((rentPerYear * selectedTax.TaxRate) / 100);
              form.setValue(`units.${index}.TaxAmount`, taxAmount);
              form.setValue(`units.${index}.TotalAmount`, roundToTwo(rentPerYear + taxAmount));
            }
          } else {
            // No tax selected
            form.setValue(`units.${index}.TaxPercentage`, 0);
            form.setValue(`units.${index}.TaxAmount`, 0);
            form.setValue(`units.${index}.TotalAmount`, rentPerYear);
          }
        }
      }

      // Handle direct yearly rent changes for units
      if (name.includes("RentPerYear") && name.includes("units.") && !name.includes("RentPerMonth")) {
        const index = parseInt(name.split(".")[1]);
        const units = form.getValues("units");

        if (units && units[index]) {
          const rentPerYear = units[index].RentPerYear || 0;
          const taxId = units[index].TaxID;

          if (taxId && taxId !== "0") {
            const selectedTax = getTaxDetails(taxId);
            if (selectedTax) {
              const taxAmount = roundToTwo((rentPerYear * selectedTax.TaxRate) / 100);
              form.setValue(`units.${index}.TaxAmount`, taxAmount);
              form.setValue(`units.${index}.TotalAmount`, roundToTwo(rentPerYear + taxAmount));
            }
          } else {
            form.setValue(`units.${index}.TaxAmount`, 0);
            form.setValue(`units.${index}.TotalAmount`, rentPerYear);
          }
        }
      }

      // Handle tax changes for additional charges
      if (name.includes("TaxID") && name.includes("additionalCharges.")) {
        const index = parseInt(name.split(".")[1]);
        const charges = form.getValues("additionalCharges");

        if (charges && charges[index] !== undefined) {
          const taxId = charges[index].TaxID;
          const amount = Number(charges[index].Amount) || 0;

          if (taxId && taxId !== "0" && taxId !== "") {
            const selectedTax = getTaxDetails(taxId);
            if (selectedTax) {
              const taxRate = Number(selectedTax.TaxRate) || 0;
              form.setValue(`additionalCharges.${index}.TaxPercentage`, taxRate);
              const taxAmount = roundToTwo((amount * taxRate) / 100);
              form.setValue(`additionalCharges.${index}.TaxAmount`, taxAmount);
              form.setValue(`additionalCharges.${index}.TotalAmount`, roundToTwo(amount + taxAmount));
            }
          } else {
            // No tax selected or tax is "0"
            form.setValue(`additionalCharges.${index}.TaxPercentage`, 0);
            form.setValue(`additionalCharges.${index}.TaxAmount`, 0);
            form.setValue(`additionalCharges.${index}.TotalAmount`, amount);
          }
        }
      }

      // Handle amount changes for additional charges
      if (name.includes("Amount") && name.includes("additionalCharges.") && !name.includes("TaxAmount") && !name.includes("TotalAmount")) {
        const index = parseInt(name.split(".")[1]);
        const charges = form.getValues("additionalCharges");

        if (charges && charges[index] !== undefined) {
          const amount = Number(charges[index].Amount) || 0;
          const taxId = charges[index].TaxID;

          if (taxId && taxId !== "0" && taxId !== "") {
            const selectedTax = getTaxDetails(taxId);
            if (selectedTax) {
              const taxRate = Number(selectedTax.TaxRate) || 0;
              form.setValue(`additionalCharges.${index}.TaxPercentage`, taxRate);
              const taxAmount = roundToTwo((amount * taxRate) / 100);
              form.setValue(`additionalCharges.${index}.TaxAmount`, taxAmount);
              form.setValue(`additionalCharges.${index}.TotalAmount`, roundToTwo(amount + taxAmount));
            }
          } else {
            form.setValue(`additionalCharges.${index}.TaxPercentage`, 0);
            form.setValue(`additionalCharges.${index}.TaxAmount`, 0);
            form.setValue(`additionalCharges.${index}.TotalAmount`, amount);
          }
        }
      }

      // Handle additional charge selection (AdditionalChargesID changes)
      if (name.includes("AdditionalChargesID") && name.includes("additionalCharges.")) {
        const index = parseInt(name.split(".")[1]);
        const charges = form.getValues("additionalCharges");

        if (charges && charges[index] !== undefined) {
          const amount = Number(charges[index].Amount) || 0;
          const taxId = charges[index].TaxID;

          // Recalculate when charge type changes
          if (amount > 0) {
            if (taxId && taxId !== "0" && taxId !== "") {
              const selectedTax = getTaxDetails(taxId);
              if (selectedTax) {
                const taxRate = Number(selectedTax.TaxRate) || 0;
                form.setValue(`additionalCharges.${index}.TaxPercentage`, taxRate);
                const taxAmount = roundToTwo((amount * taxRate) / 100);
                form.setValue(`additionalCharges.${index}.TaxAmount`, taxAmount);
                form.setValue(`additionalCharges.${index}.TotalAmount`, roundToTwo(amount + taxAmount));
              }
            } else {
              form.setValue(`additionalCharges.${index}.TaxPercentage`, 0);
              form.setValue(`additionalCharges.${index}.TaxAmount`, 0);
              form.setValue(`additionalCharges.${index}.TotalAmount`, amount);
            }
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, taxes]);

  // Add new items
  const addUnit = () => {
    if (!canEditContract) {
      toast.error("Cannot modify approved contracts.");
      return;
    }

    const fromDate = new Date();
    const toDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    const totalDays = differenceInDays(toDate, fromDate);
    const totalMonths = differenceInMonths(toDate, fromDate);
    const totalYears = differenceInYears(toDate, fromDate);

    unitsFieldArray.append({
      UnitID: "",
      FromDate: fromDate,
      ToDate: toDate,
      RentPerMonth: 0,
      RentPerYear: 0,
      TotalAmount: 0,
      ContractDays: totalDays,
      ContractMonths: totalMonths,
      ContractYears: totalYears,
      NoOfInstallments: 12,
    });
  };

  const addCharge = () => {
    if (!canEditContract) {
      toast.error("Cannot modify approved contracts.");
      return;
    }

    chargesFieldArray.append({
      AdditionalChargesID: "",
      Amount: 0,
      TaxPercentage: 0,
      TaxAmount: 0,
      TotalAmount: 0,
    });
  };

  // Email handlers
  const handleSendTestEmail = () => {
    setIsEmailDialogOpen(true);
  };

  const handleEmailSent = async (result: any) => {
    if (result.success) {
      toast.success("Email sent successfully");
    }
  };

  // Attachment management functions
  const openAttachmentDialog = (attachment?: any) => {
    if (!canEditContract) {
      toast.error("Cannot modify approved contracts.");
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
    if (!canEditContract) {
      toast.error("Cannot modify approved contracts.");
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
  const onSubmit = async (data: ContractFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    if (!canEditContract) {
      toast.error("Cannot save changes to approved contracts.");
      return;
    }

    setLoading(true);

    try {
      const totals = calculateTotals();

      const contractData = {
        contract: {
          ContractNo: data.ContractNo,
          ContractStatus: data.ContractStatus,
          CompanyID: user.currentCompanyId ? parseInt(user.currentCompanyId) : 1, // Add CompanyID
          CustomerID: parseInt(data.CustomerID),
          JointCustomerID: data.JointCustomerID ? parseInt(data.JointCustomerID) : undefined,
          TransactionDate: data.TransactionDate,
          TotalAmount: totals.unitTotal,
          AdditionalCharges: totals.chargesTotal,
          GrandTotal: totals.grandTotal,
          Remarks: data.Remarks,
        },
        units: data.units?.map((unit) => ({
          ContractUnitID: unit.ContractUnitID,
          UnitID: parseInt(unit.UnitID),
          FromDate: unit.FromDate,
          ToDate: unit.ToDate,
          FitoutFromDate: unit.FitoutFromDate,
          FitoutToDate: unit.FitoutToDate,
          CommencementDate: unit.CommencementDate,
          ContractDays: unit.ContractDays,
          ContractMonths: unit.ContractMonths,
          ContractYears: unit.ContractYears,
          RentPerMonth: unit.RentPerMonth,
          RentPerYear: unit.RentPerYear,
          NoOfInstallments: unit.NoOfInstallments,
          RentFreePeriodFrom: unit.RentFreePeriodFrom,
          RentFreePeriodTo: unit.RentFreePeriodTo,
          RentFreeAmount: unit.RentFreeAmount,
          TaxID: unit.TaxID ? parseInt(unit.TaxID) : undefined,
          TaxPercentage: unit.TaxPercentage,
          TaxAmount: unit.TaxAmount,
          TotalAmount: unit.TotalAmount,
        })),
        additionalCharges: data.additionalCharges?.map((charge) => ({
          ContractAdditionalChargeID: charge.ContractAdditionalChargeID,
          AdditionalChargesID: parseInt(charge.AdditionalChargesID),
          Amount: charge.Amount,
          TaxID: charge.TaxID ? parseInt(charge.TaxID) : undefined,
          TaxPercentage: charge.TaxPercentage,
          TaxAmount: charge.TaxAmount,
          TotalAmount: charge.TotalAmount,
        })),
        attachments: data.attachments?.map((attachment) => ({
          ContractAttachmentID: attachment.ContractAttachmentID,
          DocTypeID: parseInt(attachment.DocTypeID),
          DocumentName: attachment.DocumentName,
          DocIssueDate: attachment.DocIssueDate,
          DocExpiryDate: attachment.DocExpiryDate,
          DocumentDescription: attachment.DocumentDescription,
          file: attachment.file,
        })),
      };

      let contractId: number;
      let isNewContract = false;

      if (isEdit && contract) {
        const response = await contractService.updateContract({
          ...contractData,
          contract: {
            ...contractData.contract,
            ContractID: contract.ContractID,
          },
        });

        if (response.Status === 1) {
          contractId = contract.ContractID;
          toast.success("Contract updated successfully");
        } else {
          toast.error(response.Message || "Failed to update contract");
          return;
        }
      } else {
        const response = await contractService.createContract(contractData);

        if (response.Status === 1 && response.NewContractID) {
          contractId = response.NewContractID;
          isNewContract = true;
          toast.success("Contract created successfully");
        } else {
          toast.error(response.Message || "Failed to create contract");
          return;
        }
      }

      // Send email notification if enabled
      if (data.sendEmailNotification && data.emailRecipients && data.emailRecipients.length > 0) {
        try {
          const contractVariables = emailIntegration.generateContractVariables(contractData.contract, {
            customerEmail: data.emailRecipients.find((r) => r.type === "to")?.email,
            isNewContract,
            contractId,
          });

          const triggerEvent = isNewContract ? "contract_created" : "contract_updated";

          // Filter recipients to ensure all required properties are present
          const validRecipients = data.emailRecipients.filter((recipient) => recipient.email && recipient.name && recipient.type) as Array<{
            email: string;
            name: string;
            type: "to" | "cc" | "bcc";
          }>;

          await emailIntegration.sendAutomatedEmail(triggerEvent, contractVariables, validRecipients);

          toast.success("Contract saved and email notifications sent successfully");
        } catch (emailError) {
          console.error("Error sending email notification:", emailError);
          toast.warning("Contract saved successfully, but email notification failed");
        }
      }

      navigate(`/contracts/${contractId}`);
    } catch (error) {
      console.error("Error saving contract:", error);
      toast.error("Failed to save contract");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    if (!canEditContract) {
      toast.error("Cannot reset approved contracts.");
      return;
    }

    if (isEdit && contract) {
      form.reset();
    } else {
      form.reset({
        ContractNo: "",
        ContractStatus: "Draft",
        CustomerID: "",
        JointCustomerID: "",
        TransactionDate: new Date(),
        Remarks: "",
        units: [],
        additionalCharges: [],
        attachments: [],
        sendEmailNotification: false,
        emailRecipients: [],
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

  // Find unit details
  const getUnitDetails = (unitId: string) => {
    if (!unitId) return null;
    return units.find((unit) => unit.UnitID === parseInt(unitId));
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { unitTotal, chargesTotal, grandTotal } = calculateTotals();
  const attachmentList = form.watch("attachments") || [];
  const sendEmailNotification = form.watch("sendEmailNotification");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/contracts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{isEdit ? "Edit Contract" : "Create Contract"}</h1>
            {user?.currentCompanyName && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  <Building className="mr-1 h-3 w-3" />
                  {user.currentCompanyName}
                </Badge>
              </div>
            )}
          </div>
        </div>
        {isApproved && (
          <Badge variant="outline" className="bg-red-50 border-red-200 text-red-800">
            <Lock className="h-3 w-3 mr-1" />
            Approved - Protected from Editing
          </Badge>
        )}
      </div>

      {/* Approval Warning Alert */}
      {isApproved && (
        <Alert className="border-l-4 border-l-red-500 bg-red-50">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Contract Editing Restricted</div>
            <div className="text-sm text-muted-foreground mt-1">
              This contract has been approved and is protected from modifications. To make changes, a manager must first reset the approval status from the contract details page.
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Contract Information */}
          <Card className={isApproved ? "opacity-60" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Contract Information
                {isApproved && <Lock className="h-4 w-4 text-red-500" />}
              </CardTitle>
              <CardDescription>Enter the basic contract details and customer information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  form={form}
                  name="ContractNo"
                  label="Contract Number"
                  placeholder={isEdit ? "Contract number (cannot be changed)" : "Auto-generated if left empty"}
                  description={isEdit ? "Contract number cannot be modified in edit mode" : "Leave blank for auto-generated contract number"}
                  disabled={isEdit}
                  className={isEdit ? "bg-muted" : ""}
                />
                <FormField
                  form={form}
                  name="ContractStatus"
                  label="Contract Status"
                  type="select"
                  options={[
                    { label: "Draft", value: "Draft" },
                    { label: "Pending", value: "Pending" },
                    { label: "Active", value: "Active" },
                    { label: "Expired", value: "Expired" },
                    { label: "Cancelled", value: "Cancelled" },
                    { label: "Completed", value: "Completed" },
                    { label: "Terminated", value: "Terminated" },
                  ]}
                  placeholder="Select status"
                  required
                  disabled={!canEditContract}
                />
                <FormField form={form} name="TransactionDate" label="Transaction Date" type="date" required description="Date of contract creation" disabled={!canEditContract} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="CustomerID"
                  label="Primary Customer"
                  type="select"
                  options={customers.map((customer) => ({
                    label: customer.CustomerFullName,
                    value: customer.CustomerID.toString(),
                  }))}
                  placeholder="Select primary customer"
                  required
                  description="Main customer for this contract"
                  disabled={!canEditContract}
                />
                <FormField
                  form={form}
                  name="JointCustomerID"
                  label="Joint Customer"
                  type="select"
                  options={customers
                    .filter((c) => c.CustomerID.toString() !== form.getValues("CustomerID"))
                    .map((customer) => ({
                      label: customer.CustomerFullName,
                      value: customer.CustomerID.toString(),
                    }))}
                  placeholder="Select joint customer (optional)"
                  description="Optional joint customer for shared contracts"
                  disabled={!canEditContract}
                />
              </div>

              <FormField
                form={form}
                name="Remarks"
                label="Contract Remarks"
                type="textarea"
                placeholder="Enter contract remarks or additional notes"
                description="Additional notes about this contract"
                disabled={!canEditContract}
              />
            </CardContent>
          </Card>

          {/* Email Notification Settings */}
          <Card className={isApproved ? "opacity-60" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Notifications
                {isApproved && <Lock className="h-4 w-4 text-red-500" />}
              </CardTitle>
              <CardDescription>Configure email notifications for this contract</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendEmailNotification"
                  checked={sendEmailNotification}
                  onCheckedChange={(checked) => {
                    form.setValue("sendEmailNotification", !!checked);
                    if (checked) {
                      const recipients = getDefaultEmailRecipients();
                      form.setValue("emailRecipients", recipients);
                    }
                  }}
                  disabled={!canEditContract}
                />
                <Label htmlFor="sendEmailNotification" className="text-sm font-medium">
                  Send email notification when contract is {isEdit ? "updated" : "created"}
                </Label>
              </div>

              {sendEmailNotification && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                  <div className="text-sm text-muted-foreground">
                    Email notifications will be sent automatically to the selected recipients when the contract is {isEdit ? "updated" : "created"}.
                  </div>

                  <div className="space-y-2">
                    <Label>Email Recipients</Label>
                    <div className="space-y-2">
                      {form.watch("emailRecipients")?.map((recipient, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <Badge variant="outline">{recipient.type.toUpperCase()}</Badge>
                          <span className="font-medium">{recipient.name}</span>
                          <span className="text-muted-foreground">({recipient.email})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleSendTestEmail} disabled={!canEditContract}>
                      <Send className="mr-2 h-4 w-4" />
                      Preview Email Template
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowEmailSettings(!showEmailSettings)} disabled={!canEditContract}>
                      <Settings className="mr-2 h-4 w-4" />
                      Advanced Settings
                    </Button>
                  </div>

                  {showEmailSettings && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="font-medium">Email Template Configuration</div>
                          <div className="text-sm">• For new contracts: "contract_created" template will be used</div>
                          <div className="text-sm">• For updates: "contract_updated" template will be used</div>
                          <div className="text-sm">• All contract details including units, charges, and totals will be included</div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contract Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Contract Summary
              </CardTitle>
              <CardDescription>Live calculation of contract totals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Units Total</span>
                  </div>
                  <div className="text-2xl font-bold">{unitTotal.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{unitsFieldArray.fields.length} units</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <HandCoins className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Additional Charges</span>
                  </div>
                  <div className="text-2xl font-bold">{chargesTotal.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{chargesFieldArray.fields.length} charges</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-muted-foreground">Grand Total</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{grandTotal.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Final amount</div>
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

          {/* Contract Units with Enhanced Display */}
          <Card className={isApproved ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    Contract Units
                    {isApproved && <Lock className="h-4 w-4 text-red-500" />}
                  </CardTitle>
                  <CardDescription>Add rental units to this contract with detailed terms</CardDescription>
                </div>
                <Button type="button" onClick={addUnit} disabled={!canEditContract}>
                  {canEditContract ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                  Add Unit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {unitsFieldArray.fields.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No units have been added to this contract yet.</p>
                  <Button type="button" variant="outline" onClick={addUnit} disabled={!canEditContract}>
                    {canEditContract ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                    Add Your First Unit
                  </Button>
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {unitsFieldArray.fields.map((field, index) => {
                    const unitId = form.watch(`units.${index}.UnitID`);
                    const unitDetails = getUnitDetails(unitId);
                    const displayInfo = getEnhancedUnitDisplay(unitId, index);

                    return (
                      <AccordionItem key={field.id} value={`unit-${index}`} className="border rounded-lg mb-4">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <Building className="h-5 w-5 text-muted-foreground" />
                              <div className="text-left">
                                <div className="font-medium">{displayInfo.title}</div>
                                <div className="text-sm text-muted-foreground">{displayInfo.subtitle}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-muted-foreground">
                                <div>{displayInfo.period}</div>
                                {displayInfo.duration && <div className="text-xs">{displayInfo.duration}</div>}
                              </div>
                              <div className="font-medium">{displayInfo.amount}</div>
                              {unitDetails && <Badge variant={unitDetails.UnitStatus === "Available" ? "default" : "secondary"}>{displayInfo.status}</Badge>}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-6">
                            <div className="flex justify-end">
                              <Button type="button" variant="destructive" size="sm" onClick={() => unitsFieldArray.remove(index)} disabled={!canEditContract}>
                                {canEditContract ? <Trash2 className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                                Remove Unit
                              </Button>
                            </div>

                            <FormField
                              form={form}
                              name={`units.${index}.UnitID`}
                              label="Select Unit"
                              type="select"
                              options={units.map((unit) => ({
                                label: `${unit.UnitNo} - ${unit.PropertyName} (${unit.UnitTypeName})`,
                                value: unit.UnitID.toString(),
                              }))}
                              placeholder="Choose a unit"
                              required
                              disabled={!canEditContract}
                            />

                            {/* Unit Information Card */}
                            {unitDetails && <UnitInformationCard unitDetails={unitDetails} />}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                form={form}
                                name={`units.${index}.FromDate`}
                                label="From Date"
                                type="date"
                                required
                                description="Contract start date"
                                disabled={!canEditContract}
                              />
                              <FormField
                                form={form}
                                name={`units.${index}.ToDate`}
                                label="To Date"
                                type="date"
                                required
                                description="Contract end date"
                                disabled={!canEditContract}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                form={form}
                                name={`units.${index}.FitoutFromDate`}
                                label="Fitout From Date"
                                type="date"
                                description="Optional fitout start date"
                                disabled={!canEditContract}
                              />
                              <FormField
                                form={form}
                                name={`units.${index}.FitoutToDate`}
                                label="Fitout To Date"
                                type="date"
                                description="Optional fitout end date"
                                disabled={!canEditContract}
                              />
                            </div>

                            <FormField
                              form={form}
                              name={`units.${index}.CommencementDate`}
                              label="Commencement Date"
                              type="date"
                              description="Date when occupancy begins"
                              disabled={!canEditContract}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <FormField form={form} name={`units.${index}.ContractDays`} label="Contract Days" type="number" disabled description="Auto-calculated from dates" />
                              <FormField
                                form={form}
                                name={`units.${index}.ContractMonths`}
                                label="Contract Months"
                                type="number"
                                disabled
                                description="Auto-calculated from dates"
                              />
                              <FormField form={form} name={`units.${index}.ContractYears`} label="Contract Years" type="number" disabled description="Auto-calculated from dates" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                form={form}
                                name={`units.${index}.RentPerMonth`}
                                label="Monthly Rent"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                required
                                description="Auto-populated from unit master data"
                                disabled={!canEditContract}
                              />
                              <FormField
                                form={form}
                                name={`units.${index}.RentPerYear`}
                                label="Yearly Rent"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                required
                                description="Auto-calculated from monthly rent × installments"
                                disabled={!canEditContract}
                              />
                            </div>

                            <FormField
                              form={form}
                              name={`units.${index}.NoOfInstallments`}
                              label="Number of Installments"
                              type="number"
                              placeholder="12"
                              description="Payment frequency per year (1-52)"
                              disabled={!canEditContract}
                            />

                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">Rent-Free Period (Optional)</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField form={form} name={`units.${index}.RentFreePeriodFrom`} label="Rent-Free From" type="date" disabled={!canEditContract} />
                                <FormField form={form} name={`units.${index}.RentFreePeriodTo`} label="Rent-Free To" type="date" disabled={!canEditContract} />
                              </div>
                              <FormField
                                form={form}
                                name={`units.${index}.RentFreeAmount`}
                                label="Rent-Free Amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                disabled={!canEditContract}
                              />
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <HandCoins className="h-4 w-4 text-green-500" />
                                <span className="font-medium">Tax Information</span>
                              </div>
                              <FormField
                                form={form}
                                name={`units.${index}.TaxID`}
                                label="Applicable Tax"
                                type="select"
                                options={[
                                  { label: "No Tax", value: "0" },
                                  ...taxes.map((tax) => ({
                                    label: `${tax.TaxName} (${tax.TaxCode}) - ${tax.IsExemptOrZero ? "Exempt" : `${tax.TaxRate}%`}`,
                                    value: tax.TaxID.toString(),
                                  })),
                                ]}
                                placeholder="Select applicable tax"
                                disabled={!canEditContract}
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                  form={form}
                                  name={`units.${index}.TaxPercentage`}
                                  label="Tax Rate (%)"
                                  type="number"
                                  step="0.01"
                                  disabled
                                  description="Auto-filled from selected tax"
                                />
                                <FormField form={form} name={`units.${index}.TaxAmount`} label="Tax Amount" type="number" step="0.01" disabled description="Auto-calculated" />
                              </div>
                            </div>

                            <FormField
                              form={form}
                              name={`units.${index}.TotalAmount`}
                              label="Total Amount"
                              type="number"
                              step="0.01"
                              disabled
                              description="Rent + Tax (auto-calculated)"
                              className="bg-muted/50"
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </CardContent>
          </Card>

          {/* Additional Charges with edit restrictions */}
          <Card className={isApproved ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <HandCoins className="h-5 w-5 text-primary" />
                    Additional Charges
                    {isApproved && <Lock className="h-4 w-4 text-red-500" />}
                  </CardTitle>
                  <CardDescription>Add extra charges like maintenance, parking, utilities, etc.</CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={addCharge} disabled={!canEditContract}>
                  {canEditContract ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                  Add Charge
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {chargesFieldArray.fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <HandCoins className="mx-auto h-8 w-8 mb-4 text-muted-foreground/50" />
                  <p>No additional charges have been added yet.</p>
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {chargesFieldArray.fields.map((field, index) => {
                    const chargeId = form.watch(`additionalCharges.${index}.AdditionalChargesID`);
                    const chargeDetails = chargeId ? charges.find((c) => c.ChargesID.toString() === chargeId) : null;

                    return (
                      <AccordionItem key={field.id} value={`charge-${index}`} className="border rounded-lg mb-4">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <HandCoins className="h-5 w-5 text-muted-foreground" />
                              <div className="text-left">
                                <div className="font-medium">{chargeDetails ? chargeDetails.ChargesName : `Charge ${index + 1}`}</div>
                                <div className="text-sm text-muted-foreground">{chargeDetails && chargeDetails.ChargesCategoryName}</div>
                              </div>
                            </div>
                            <div className="font-medium">
                              {form.watch(`additionalCharges.${index}.TotalAmount`) ? form.watch(`additionalCharges.${index}.TotalAmount`).toLocaleString() : "0"}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-6">
                            <div className="flex justify-end">
                              <Button type="button" variant="destructive" size="sm" onClick={() => chargesFieldArray.remove(index)} disabled={!canEditContract}>
                                {canEditContract ? <Trash2 className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                                Remove Charge
                              </Button>
                            </div>

                            <FormField
                              form={form}
                              name={`additionalCharges.${index}.AdditionalChargesID`}
                              label="Select Charge"
                              type="select"
                              options={charges.map((charge) => ({
                                label: `${charge.ChargesName} - ${charge.ChargesCategoryName}`,
                                value: charge.ChargesID.toString(),
                              }))}
                              placeholder="Choose a charge type"
                              required
                              disabled={!canEditContract}
                            />

                            <FormField
                              form={form}
                              name={`additionalCharges.${index}.Amount`}
                              label="Charge Amount"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              required
                              disabled={!canEditContract}
                            />

                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <HandCoins className="h-4 w-4 text-green-500" />
                                <span className="font-medium">Tax Information</span>
                              </div>
                              <FormField
                                form={form}
                                name={`additionalCharges.${index}.TaxID`}
                                label="Applicable Tax"
                                type="select"
                                options={[
                                  { label: "No Tax", value: "0" },
                                  ...taxes.map((tax) => ({
                                    label: `${tax.TaxName} (${tax.TaxCode}) - ${tax.IsExemptOrZero ? "Exempt" : `${tax.TaxRate}%`}`,
                                    value: tax.TaxID.toString(),
                                  })),
                                ]}
                                placeholder="Select applicable tax"
                                disabled={!canEditContract}
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                  form={form}
                                  name={`additionalCharges.${index}.TaxPercentage`}
                                  label="Tax Rate (%)"
                                  type="number"
                                  step="0.01"
                                  disabled
                                  description="Auto-filled from selected tax"
                                />
                                <FormField
                                  form={form}
                                  name={`additionalCharges.${index}.TaxAmount`}
                                  label="Tax Amount"
                                  type="number"
                                  step="0.01"
                                  disabled
                                  description="Auto-calculated"
                                />
                              </div>
                            </div>

                            <FormField
                              form={form}
                              name={`additionalCharges.${index}.TotalAmount`}
                              label="Total Amount"
                              type="number"
                              step="0.01"
                              disabled
                              description="Amount + Tax (auto-calculated)"
                              className="bg-muted/50"
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </CardContent>
          </Card>

          {/* Attachments with edit restrictions */}
          <Card className={isApproved ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Contract Documents
                    {isApproved && <Lock className="h-4 w-4 text-red-500" />}
                  </CardTitle>
                  <CardDescription>Upload supporting documents and files for this contract</CardDescription>
                </div>
                <Button type="button" onClick={() => openAttachmentDialog()} disabled={!canEditContract}>
                  {canEditContract ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                  Add Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {attachmentList.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No documents have been attached yet.</p>
                  <Button type="button" variant="outline" onClick={() => openAttachmentDialog()} disabled={!canEditContract}>
                    {canEditContract ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
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
                                    <Button type="button" variant="ghost" size="sm" onClick={() => openAttachmentDialog({ ...attachment, index })} disabled={!canEditContract}>
                                      {canEditContract ? <Edit2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => removeAttachment(index)} disabled={!canEditContract}>
                                      {canEditContract ? <Trash2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </div>

                                {docType && <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{docType.Description}</Badge>}

                                <div className="text-sm space-y-1">
                                  {attachment.DocIssueDate && (
                                    <div className="flex items-center text-muted-foreground">
                                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                      Issue date: {formatDate(attachment.DocIssueDate)}
                                    </div>
                                  )}
                                  {attachment.DocExpiryDate && (
                                    <div className="flex items-center text-muted-foreground">
                                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                      Expiry date: {formatDate(attachment.DocExpiryDate)}
                                    </div>
                                  )}
                                  {attachment.DocumentDescription && <div className="text-muted-foreground mt-1">{attachment.DocumentDescription}</div>}
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
                <Button type="button" variant="outline" onClick={() => navigate("/contracts")} disabled={loading}>
                  Cancel
                </Button>
                <Button type="button" variant="outline" onClick={handleReset} disabled={loading || !canEditContract}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
              <div className="flex gap-2">
                {sendEmailNotification && (
                  <Alert className="p-2 inline-flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="text-sm">Email notifications will be sent</span>
                  </Alert>
                )}
                <Button type="submit" disabled={loading || unitsFieldArray.fields.length === 0 || !canEditContract}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEdit ? "Update Contract" : "Create Contract"}
                      {sendEmailNotification && " & Send Email"}
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>

      {/* Email Send Dialog for Preview */}
      <EmailSendDialog
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        entityType="contract"
        entityId={0}
        entityData={form.getValues()}
        defaultRecipients={getDefaultEmailRecipients()}
        triggerEvent={isEdit ? "contract_updated" : "contract_created"}
        onEmailSent={handleEmailSent}
      />

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
          issueDate={previewAttachment.DocIssueDate}
          expiryDate={previewAttachment.DocExpiryDate}
        />
      )}

      {/* Attachment Gallery Dialog */}
      {attachmentList.length > 0 && (
        <AttachmentGallery
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          attachments={attachmentList.map((attachment, index) => ({
            ...attachment,
            PostingAttachmentID: index,
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
    DocIssueDate: null as Date | null,
    DocExpiryDate: null as Date | null,
    file: null as File | null,
  });

  useEffect(() => {
    if (editingAttachment) {
      setFormData({
        DocTypeID: editingAttachment.DocTypeID || "",
        DocumentName: editingAttachment.DocumentName || "",
        DocumentDescription: editingAttachment.DocumentDescription || "",
        DocIssueDate: editingAttachment.DocIssueDate || null,
        DocExpiryDate: editingAttachment.DocExpiryDate || null,
        file: editingAttachment.file || null,
      });
    } else {
      setFormData({
        DocTypeID: "",
        DocumentName: "",
        DocumentDescription: "",
        DocIssueDate: null,
        DocExpiryDate: null,
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={formData.DocIssueDate ? format(formData.DocIssueDate, "yyyy-MM-dd") : ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    DocIssueDate: e.target.value ? new Date(e.target.value) : null,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.DocExpiryDate ? format(formData.DocExpiryDate, "yyyy-MM-dd") : ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    DocExpiryDate: e.target.value ? new Date(e.target.value) : null,
                  }))
                }
              />
            </div>
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

export default ContractForm;
