// src/pages/termination/TerminationForm.tsx - Enhanced with Email Integration and Auto-Calculation
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Loader2,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  FileText,
  Calculator,
  Calendar,
  Upload,
  Percent,
  PlusCircle,
  X,
  Lock,
  Shield,
  HandCoins,
  Mail,
  Send,
  Settings,
  Info,
} from "lucide-react";
import { terminationService, ContractTermination } from "@/services/terminationService";
import { contractService } from "@/services/contractService";
import { docTypeService } from "@/services/docTypeService";
import { toast } from "sonner";
import { useAppSelector } from "@/lib/hooks";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField as CustomFormField } from "@/components/forms/FormField";
import { format, differenceInDays, differenceInCalendarDays } from "date-fns";

// Import Email components
import { EmailSendDialog } from "@/pages/email/EmailSendDialog";
import { useEmailIntegration } from "@/hooks/useEmailIntegration";
import { taxService } from "@/services/taxService";

// Create Document Type Dialog
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
          <DialogDescription>Add a new document type to use in the system</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="docTypeDescription" className="text-sm font-medium">
                Description
              </label>
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

// Enhanced schema for termination form validation with email settings
const terminationSchema = z.object({
  TerminationNo: z.string().optional(),
  ContractID: z.string().min(1, "Contract is required"),
  TerminationDate: z.date().default(() => new Date()),
  NoticeDate: z.date().optional().nullable(),
  EffectiveDate: z.date({
    required_error: "Effective date is required",
  }),
  VacatingDate: z.date().optional().nullable(),
  MoveOutDate: z.date().optional().nullable(),
  KeyReturnDate: z.date().optional().nullable(),
  StayPeriodDays: z.number().optional().nullable(),
  StayPeriodAmount: z.number().optional().nullable(),
  TerminationReason: z.string().optional(),
  TerminationStatus: z.string().default("Draft"),
  SecurityDepositAmount: z
    .number({
      required_error: "Security deposit amount is required",
    })
    .min(0),
  AdjustAmount: z.number().optional().nullable(),
  Notes: z.string().optional(),

  deductions: z
    .array(
      z.object({
        TerminationDeductionID: z.number().optional(),
        DeductionID: z.number().optional().nullable(),
        DeductionName: z.string().min(1, "Deduction name is required"),
        DeductionDescription: z.string().optional(),
        DeductionAmount: z
          .number({
            required_error: "Deduction amount is required",
          })
          .min(0),
        TaxID: z.number().optional().nullable(),
        TaxCode: z.string().optional(),
        TaxName: z.string().optional(),
        TaxPercentage: z.number().optional().nullable(),
        TaxAmount: z.number().optional().nullable(),
        TotalAmount: z
          .number({
            required_error: "Total amount is required",
          })
          .min(0),
      })
    )
    .optional(),

  attachments: z
    .array(
      z.object({
        TerminationAttachmentID: z.number().optional(),
        DocTypeID: z.string().min(1, "Document type is required"),
        DocumentName: z.string().min(1, "Document name is required"),
        DocIssueDate: z.date().optional().nullable(),
        DocExpiryDate: z.date().optional().nullable(),
        Remarks: z.string().optional(),
        file: z.any().optional(),
      })
    )
    .optional(),

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

type TerminationFormValues = z.infer<typeof terminationSchema>;

const TerminationForm: React.FC = () => {
  const { id, contractId } = useParams<{ id: string; contractId: string }>();
  const isEdit = !!id;
  const isNewFromContract = !!contractId;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit || isNewFromContract);
  const [termination, setTermination] = useState<ContractTermination | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [contractDetails, setContractDetails] = useState<any>(null);

  // Reference data
  const [contracts, setContracts] = useState<any[]>([]);
  const [deductions, setDeductions] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);

  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<{ [key: number]: string }>({});

  // Dialog states
  const [isDocTypeDialogOpen, setIsDocTypeDialogOpen] = useState(false);

  // Email integration states
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);

  // Check if editing is allowed
  const canEditTermination = !termination || termination.ApprovalStatus !== "Approved";
  const isApproved = termination?.ApprovalStatus === "Approved";

  // Initialize email integration hook
  const emailIntegration = useEmailIntegration({
    entityType: "termination",
    entityId: termination?.TerminationID || 0,
  });

  // Initialize form
  const form = useForm<TerminationFormValues>({
    resolver: zodResolver(terminationSchema),
    defaultValues: {
      TerminationNo: "",
      ContractID: contractId || "",
      TerminationDate: new Date(),
      NoticeDate: null,
      EffectiveDate: new Date(),
      VacatingDate: null,
      MoveOutDate: null,
      KeyReturnDate: null,
      StayPeriodDays: null,
      StayPeriodAmount: null,
      TerminationReason: "",
      TerminationStatus: "Draft",
      SecurityDepositAmount: 0,
      AdjustAmount: null,
      Notes: "",
      deductions: [],
      attachments: [],
      sendEmailNotification: false,
      emailRecipients: [],
    },
  });

  // Setup field arrays for deductions and attachments
  const deductionsFieldArray = useFieldArray({
    control: form.control,
    name: "deductions",
  });

  const attachmentsFieldArray = useFieldArray({
    control: form.control,
    name: "attachments",
  });

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Fetch reference data in parallel
        const [contractsData, deductionsData, docTypesData, taxesData] = await Promise.all([
          contractService.getAllContracts(),
          terminationService.getAvailableDeductions(),
          docTypeService.getAllDocTypes(),
          taxService.getAllTaxes(),
        ]);

        setContracts(contractsData);
        setDeductions(deductionsData);
        setDocTypes(docTypesData);
        setTaxes(taxesData);

        // If editing, fetch the termination data
        if (isEdit && id) {
          const terminationData = await terminationService.getTerminationById(parseInt(id));

          if (terminationData.termination) {
            setTermination(terminationData.termination);

            // Check if termination is approved and prevent editing
            if (terminationData.termination.ApprovalStatus === "Approved") {
              toast.error("This termination has been approved and cannot be edited. Please reset approval status first if changes are needed.");
              navigate(`/terminations/${terminationData.termination.TerminationID}`);
              return;
            }

            // Format data for form
            const formattedTermination = {
              ...terminationData.termination,
              ContractID: terminationData.termination.ContractID.toString(),
              TerminationDate: terminationData.termination.TerminationDate ? new Date(terminationData.termination.TerminationDate) : new Date(),
              NoticeDate: terminationData.termination.NoticeDate ? new Date(terminationData.termination.NoticeDate) : null,
              EffectiveDate: terminationData.termination.EffectiveDate ? new Date(terminationData.termination.EffectiveDate) : new Date(),
              VacatingDate: terminationData.termination.VacatingDate ? new Date(terminationData.termination.VacatingDate) : null,
              MoveOutDate: terminationData.termination.MoveOutDate ? new Date(terminationData.termination.MoveOutDate) : null,
              KeyReturnDate: terminationData.termination.KeyReturnDate ? new Date(terminationData.termination.KeyReturnDate) : null,
            };

            // Format deductions
            const formattedDeductions = terminationData.deductions.map((deduction: any) => ({
              ...deduction,
              DeductionID: deduction.DeductionID || null,
            }));

            // Format attachments
            const formattedAttachments = terminationData.attachments.map((attachment: any) => ({
              ...attachment,
              DocTypeID: attachment.DocTypeID.toString(),
              DocIssueDate: attachment.DocIssueDate ? new Date(attachment.DocIssueDate) : null,
              DocExpiryDate: attachment.DocExpiryDate ? new Date(attachment.DocExpiryDate) : null,
            }));

            // Set form values
            form.reset({
              ...formattedTermination,
              deductions: formattedDeductions,
              attachments: formattedAttachments,
              sendEmailNotification: false,
              emailRecipients: [],
            });

            // Get contract details
            fetchContractDetails(terminationData.termination.ContractID);
          } else {
            toast.error("Termination not found");
            navigate("/terminations");
          }
        }
        // If creating from contract, get contract details
        else if (isNewFromContract && contractId) {
          form.setValue("ContractID", contractId);
          fetchContractDetails(parseInt(contractId));
        }
      } catch (error) {
        console.error("Error initializing form:", error);
        toast.error("Error loading form data");
      } finally {
        setInitialLoading(false);
      }
    };

    initializeForm();
  }, [id, contractId, isEdit, isNewFromContract, navigate, form]);

  // Load email templates when component mounts
  useEffect(() => {
    emailIntegration.loadEmailTemplates("Termination");
  }, [emailIntegration]);

  // Auto-update email recipients when contract changes
  useEffect(() => {
    if (form.watch("sendEmailNotification") && contractDetails) {
      const recipients = getDefaultEmailRecipients();
      form.setValue("emailRecipients", recipients);
    }
  }, [form.watch("ContractID"), contractDetails, form.watch("sendEmailNotification")]);

  // Enhanced date-based auto-calculation effect
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type !== "change" || !name) return;

      // Auto-calculate stay period when vacating date or effective date changes
      if ((name === "VacatingDate" || name === "EffectiveDate") && canEditTermination) {
        const vacatingDate = form.getValues("VacatingDate");
        const effectiveDate = form.getValues("EffectiveDate");

        if (vacatingDate && effectiveDate) {
          // Calculate stay period in days
          const stayPeriodDays = differenceInCalendarDays(vacatingDate, effectiveDate);

          if (stayPeriodDays >= 0) {
            form.setValue("StayPeriodDays", stayPeriodDays, { shouldValidate: false });

            // Auto-calculate stay period amount based on contract daily rate
            if (contractDetails && contractDetails.GrandTotal) {
              // Assume monthly rent is total contract value divided by contract months
              // This is a simplified calculation - adjust based on your business logic
              const monthlyRent = contractDetails.GrandTotal / 12; // Assuming 1-year contract
              const dailyRate = monthlyRent / 30; // Approximate daily rate
              const stayPeriodAmount = Math.round(dailyRate * stayPeriodDays * 100) / 100;

              form.setValue("StayPeriodAmount", stayPeriodAmount, { shouldValidate: false });

              toast.success(`Stay period calculated: ${stayPeriodDays} days (${stayPeriodAmount.toFixed(2)} amount)`);
            }
          } else if (stayPeriodDays < 0) {
            // Reset values if vacating date is before effective date
            form.setValue("StayPeriodDays", 0, { shouldValidate: false });
            form.setValue("StayPeriodAmount", 0, { shouldValidate: false });
            toast.warning("Vacating date should be after effective date");
          }
        }
      }

      // Auto-set move out date when vacating date changes (typically same day or next day)
      if (name === "VacatingDate" && canEditTermination) {
        const vacatingDate = form.getValues("VacatingDate");
        const currentMoveOutDate = form.getValues("MoveOutDate");

        if (vacatingDate && !currentMoveOutDate) {
          // Set move out date to same as vacating date by default
          form.setValue("MoveOutDate", vacatingDate, { shouldValidate: false });
        }
      }

      // Auto-calculate key return date (typically 1-3 days after move out)
      if (name === "MoveOutDate" && canEditTermination) {
        const moveOutDate = form.getValues("MoveOutDate");
        const currentKeyReturnDate = form.getValues("KeyReturnDate");

        if (moveOutDate && !currentKeyReturnDate) {
          // Set key return date to 2 days after move out by default
          const keyReturnDate = new Date(moveOutDate);
          keyReturnDate.setDate(keyReturnDate.getDate() + 2);
          form.setValue("KeyReturnDate", keyReturnDate, { shouldValidate: false });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, canEditTermination, contractDetails]);

  // Effect to auto-calculate tax and total amount when deduction amount changes
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type !== "change" || !name) return;

      // Auto-calculate deduction total amount based on amount and tax
      if ((name.includes("DeductionAmount") || name.includes("TaxPercentage") || name.includes("TaxID")) && name.includes("deductions")) {
        const index = parseInt(name.split(".")[1]);
        const deductions = form.getValues("deductions");
        if (deductions && deductions[index]) {
          const amount = deductions[index].DeductionAmount || 0;

          // If TaxID is present, use the tax rate from the selected tax
          if (deductions[index].TaxID) {
            const selectedTax = taxes.find((tax) => tax.TaxID === deductions[index].TaxID);
            if (selectedTax) {
              const taxRate = selectedTax.TaxRate;
              const taxAmount = (amount * taxRate) / 100;

              form.setValue(`deductions.${index}.TaxPercentage`, taxRate, { shouldValidate: false });
              form.setValue(`deductions.${index}.TaxAmount`, taxAmount, { shouldValidate: false });
              form.setValue(`deductions.${index}.TotalAmount`, amount + taxAmount, { shouldValidate: false });
              form.setValue(`deductions.${index}.TaxCode`, selectedTax.TaxCode, { shouldValidate: false });
              form.setValue(`deductions.${index}.TaxName`, selectedTax.TaxName, { shouldValidate: false });
            }
          } else {
            // Fallback to manual tax percentage if no TaxID
            const taxPercent = deductions[index].TaxPercentage || 0;
            const taxAmount = (amount * taxPercent) / 100;
            form.setValue(`deductions.${index}.TaxAmount`, taxAmount, { shouldValidate: false });
            form.setValue(`deductions.${index}.TotalAmount`, amount + taxAmount, { shouldValidate: false });
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, taxes]);

  // Fetch contract details
  const fetchContractDetails = async (contractId: number) => {
    try {
      const data = await contractService.getContractById(contractId);
      setContractDetails(data.contract);

      // Auto-populate security deposit amount from contract if available
      if (data.contract && data.additionalCharges.find((charge) => charge.AdditionalChargesID === 1) && !form.getValues("SecurityDepositAmount")) {
        form.setValue("SecurityDepositAmount", data.additionalCharges.find((charge) => charge.AdditionalChargesID === 1)?.Amount || 0);
      }
    } catch (error) {
      console.error("Error fetching contract details:", error);
    }
  };

  // Generate default email recipients based on contract data
  const getDefaultEmailRecipients = () => {
    if (!contractDetails) return [];

    const recipients = [];

    // Add primary customer
    if (contractDetails.CustomerEmail) {
      recipients.push({
        email: contractDetails.CustomerEmail,
        name: contractDetails.CustomerName,
        type: "to" as const,
      });
    }

    // Add joint customer if available
    if (contractDetails.JointCustomerEmail) {
      recipients.push({
        email: contractDetails.JointCustomerEmail,
        name: contractDetails.JointCustomerName || "Joint Customer",
        type: "to" as const,
      });
    }

    return recipients;
  };

  // Calculate totals
  const calculateTotals = () => {
    const formValues = form.getValues();
    let totalDeductions = 0;

    // Calculate deductions total
    if (formValues.deductions && formValues.deductions.length > 0) {
      totalDeductions = formValues.deductions.reduce((sum, deduction) => sum + (deduction.TotalAmount || 0), 0);
    }

    return {
      totalDeductions,
    };
  };

  // Add a new deduction to the termination
  const addDeduction = () => {
    if (!canEditTermination) {
      toast.error("Cannot modify approved terminations.");
      return;
    }

    deductionsFieldArray.append({
      DeductionName: "",
      DeductionAmount: 0,
      TaxID: null,
      TaxPercentage: 0,
      TaxAmount: 0,
      TotalAmount: 0,
    });

    // Switch to deductions tab
    setActiveTab("deductions");
  };

  // Add a new attachment to the termination
  const addAttachment = () => {
    if (!canEditTermination) {
      toast.error("Cannot modify approved terminations.");
      return;
    }

    attachmentsFieldArray.append({
      DocTypeID: "",
      DocumentName: "",
      DocIssueDate: new Date(),
      DocExpiryDate: null,
      Remarks: "",
    });

    // Switch to attachments tab
    setActiveTab("attachments");
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

  // Handle document type creation
  const handleSaveDocType = (newDocType: any) => {
    setDocTypes([...docTypes, newDocType]);
    toast.success(`Document type "${newDocType.Description}" created successfully`);
  };

  // Handle file upload
  const handleFileUpload = (file: File, index: number) => {
    setIsUploading(true);
    setUploadError(null);

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10MB limit");
      setIsUploading(false);
      return;
    }

    // Create a preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrls((prev) => ({ ...prev, [index]: url }));

    setIsUploading(false);
    setUploadSuccess(true);

    // Auto-set document name if it's empty
    if (!form.getValues(`attachments.${index}.DocumentName`)) {
      form.setValue(`attachments.${index}.DocumentName`, file.name);
    }

    // Reset success status after a moment
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  // Handle file removal
  const handleFileRemove = (index: number) => {
    // Clean up any preview URL
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
      setPreviewUrls((prev) => {
        const newPreviewUrls = { ...prev };
        delete newPreviewUrls[index];
        return newPreviewUrls;
      });
    }

    form.setValue(`attachments.${index}.file`, undefined);
    setUploadSuccess(false);
    setUploadError(null);
  };

  // Handle form submission with email integration
  const onSubmit = async (data: TerminationFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    if (!canEditTermination) {
      toast.error("Cannot save changes to approved terminations.");
      return;
    }

    setLoading(true);

    try {
      // Calculate totals
      const totals = calculateTotals();

      // Prepare termination data
      const terminationData = {
        termination: {
          TerminationNo: data.TerminationNo,
          ContractID: parseInt(data.ContractID),
          TerminationDate: data.TerminationDate,
          NoticeDate: data.NoticeDate,
          EffectiveDate: data.EffectiveDate,
          VacatingDate: data.VacatingDate,
          MoveOutDate: data.MoveOutDate,
          KeyReturnDate: data.KeyReturnDate,
          StayPeriodDays: data.StayPeriodDays,
          StayPeriodAmount: data.StayPeriodAmount,
          TerminationReason: data.TerminationReason,
          TerminationStatus: data.TerminationStatus,
          TotalDeductions: totals.totalDeductions,
          SecurityDepositAmount: data.SecurityDepositAmount,
          AdjustAmount: data.AdjustAmount,
          Notes: data.Notes,
        },
        deductions: data.deductions?.map((deduction) => ({
          TerminationDeductionID: deduction.TerminationDeductionID,
          DeductionID: deduction.DeductionID,
          DeductionName: deduction.DeductionName,
          DeductionDescription: deduction.DeductionDescription,
          DeductionAmount: deduction.DeductionAmount,
          TaxID: deduction.TaxID,
          TaxCode: deduction.TaxCode,
          TaxName: deduction.TaxName,
          TaxPercentage: deduction.TaxPercentage,
          TaxAmount: deduction.TaxAmount,
          TotalAmount: deduction.TotalAmount,
        })),
        attachments: data.attachments?.map((attachment) => ({
          TerminationAttachmentID: attachment.TerminationAttachmentID,
          DocTypeID: parseInt(attachment.DocTypeID),
          DocumentName: attachment.DocumentName,
          DocIssueDate: attachment.DocIssueDate,
          DocExpiryDate: attachment.DocExpiryDate,
          Remarks: attachment.Remarks,
          file: attachment.file,
        })),
      };

      let terminationId: number;
      let isNewTermination = false;

      if (isEdit && termination) {
        // Update existing termination
        const response = await terminationService.updateTermination({
          ...terminationData,
          termination: {
            ...terminationData.termination,
            TerminationID: termination.TerminationID,
          },
        });

        if (response.Status === 1) {
          terminationId = termination.TerminationID;
          toast.success("Termination updated successfully");
        } else {
          toast.error(response.Message || "Failed to update termination");
          return;
        }
      } else {
        // Create new termination
        const response = await terminationService.createTermination(terminationData);

        if (response.Status === 1 && response.NewTerminationID) {
          terminationId = response.NewTerminationID;
          isNewTermination = true;
          toast.success("Termination created successfully");
        } else {
          toast.error(response.Message || "Failed to create termination");
          return;
        }
      }

      // Send email notification if enabled
      if (data.sendEmailNotification && data.emailRecipients && data.emailRecipients.length > 0) {
        try {
          const terminationVariables = emailIntegration.generateTerminationVariables(terminationData.termination, {
            customerEmail: data.emailRecipients.find((r) => r.type === "to")?.email,
            isNewTermination,
            terminationId,
            contractDetails,
          });

          const triggerEvent = isNewTermination ? "termination_created" : "termination_updated";

          // Filter recipients to ensure all required properties are present
          const validRecipients = data.emailRecipients.filter((recipient) => recipient.email && recipient.name && recipient.type) as Array<{
            email: string;
            name: string;
            type: "to" | "cc" | "bcc";
          }>;

          await emailIntegration.sendAutomatedEmail(triggerEvent, terminationVariables, validRecipients);

          toast.success("Termination saved and email notifications sent successfully");
        } catch (emailError) {
          console.error("Error sending email notification:", emailError);
          toast.warning("Termination saved successfully, but email notification failed");
        }
      }

      navigate(`/terminations/${terminationId}`);
    } catch (error) {
      console.error("Error saving termination:", error);
      toast.error("Failed to save termination");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    if (!canEditTermination) {
      toast.error("Cannot reset approved terminations.");
      return;
    }

    if (isEdit && termination) {
      form.reset();
    } else {
      form.reset({
        TerminationNo: "",
        ContractID: contractId || "",
        TerminationDate: new Date(),
        NoticeDate: null,
        EffectiveDate: new Date(),
        VacatingDate: null,
        MoveOutDate: null,
        KeyReturnDate: null,
        StayPeriodDays: null,
        StayPeriodAmount: null,
        TerminationReason: "",
        TerminationStatus: "Draft",
        SecurityDepositAmount: 0,
        AdjustAmount: null,
        Notes: "",
        deductions: [],
        attachments: [],
        sendEmailNotification: false,
        emailRecipients: [],
      });
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    navigate(contractId ? `/contracts/${contractId}` : "/terminations");
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      form.setValue(`attachments.${index}.file`, file);
      handleFileUpload(file, index);
    }
  };

  // Handle deduction selection
  const handleDeductionSelect = (deductionId: number, index: number) => {
    const selectedDeduction = deductions.find((d) => d.DeductionID === deductionId);

    if (selectedDeduction) {
      form.setValue(`deductions.${index}.DeductionID`, deductionId);
      form.setValue(`deductions.${index}.DeductionName`, selectedDeduction.DeductionName);
      form.setValue(`deductions.${index}.DeductionDescription`, selectedDeduction.DeductionDescription || "");

      // If deduction has default values, set them
      if (selectedDeduction.DeductionValue) {
        form.setValue(`deductions.${index}.DeductionAmount`, selectedDeduction.DeductionValue);
      }

      // Recalculate totals based on tax
      const amount = form.getValues(`deductions.${index}.DeductionAmount`) || 0;
      const taxId = form.getValues(`deductions.${index}.TaxID`);

      if (taxId) {
        const selectedTax = taxes.find((tax) => tax.TaxID === taxId);
        if (selectedTax) {
          const taxRate = selectedTax.TaxRate;
          const taxAmount = (amount * taxRate) / 100;

          form.setValue(`deductions.${index}.TaxPercentage`, taxRate);
          form.setValue(`deductions.${index}.TaxAmount`, taxAmount);
          form.setValue(`deductions.${index}.TotalAmount`, amount + taxAmount);
        }
      } else {
        const taxPercent = form.getValues(`deductions.${index}.TaxPercentage`) || 0;
        const taxAmount = (amount * taxPercent) / 100;
        form.setValue(`deductions.${index}.TaxAmount`, taxAmount);
        form.setValue(`deductions.${index}.TotalAmount`, amount + taxAmount);
      }
    }
  };

  // Handle tax selection
  const handleTaxSelect = (taxId: string, index: number) => {
    const taxIdNum = parseInt(taxId);
    if (taxIdNum === 0) {
      // Clear tax
      form.setValue(`deductions.${index}.TaxCode`, "");
      form.setValue(`deductions.${index}.TaxName`, "");
      form.setValue(`deductions.${index}.TaxPercentage`, 0);

      // Recalculate with zero tax
      const amount = form.getValues(`deductions.${index}.DeductionAmount`) || 0;
      form.setValue(`deductions.${index}.TaxAmount`, 0);
      form.setValue(`deductions.${index}.TotalAmount`, amount);

      return;
    }

    const selectedTax = taxes.find((tax) => tax.TaxID === taxIdNum);
    if (selectedTax) {
      form.setValue(`deductions.${index}.TaxCode`, selectedTax.TaxCode);
      form.setValue(`deductions.${index}.TaxName`, selectedTax.TaxName);
      form.setValue(`deductions.${index}.TaxPercentage`, selectedTax.TaxRate);

      // Recalculate tax amount and total
      const amount = form.getValues(`deductions.${index}.DeductionAmount`) || 0;
      const taxAmount = (amount * selectedTax.TaxRate) / 100;
      form.setValue(`deductions.${index}.TaxAmount`, taxAmount);
      form.setValue(`deductions.${index}.TotalAmount`, amount + taxAmount);
    }
  };

  // Calculate figures function with enhanced logic
  const calculateFigures = () => {
    const securityDeposit = form.getValues("SecurityDepositAmount") || 0;
    const totalDeductions = calculateTotals().totalDeductions;
    const adjustment = form.getValues("AdjustAmount") || 0;
    const stayPeriodAmount = form.getValues("StayPeriodAmount") || 0;

    // Calculate refund or credit note
    let refundAmount = 0;
    let creditNoteAmount = 0;

    // Include stay period amount as additional income/adjustment
    const balance = securityDeposit + stayPeriodAmount - totalDeductions - adjustment;

    if (balance > 0) {
      refundAmount = balance;
    } else {
      creditNoteAmount = Math.abs(balance);
    }

    return {
      securityDeposit,
      totalDeductions,
      adjustment,
      stayPeriodAmount,
      refundAmount,
      creditNoteAmount,
    };
  };

  // Manual recalculation trigger
  const handleRecalculateAll = () => {
    // Trigger all auto-calculations manually
    const vacatingDate = form.getValues("VacatingDate");
    const effectiveDate = form.getValues("EffectiveDate");

    if (vacatingDate && effectiveDate) {
      const stayPeriodDays = differenceInCalendarDays(vacatingDate, effectiveDate);

      if (stayPeriodDays >= 0) {
        form.setValue("StayPeriodDays", stayPeriodDays);

        if (contractDetails && contractDetails.GrandTotal) {
          const monthlyRent = contractDetails.GrandTotal / 12;
          const dailyRate = monthlyRent / 30;
          const stayPeriodAmount = Math.round(dailyRate * stayPeriodDays * 100) / 100;

          form.setValue("StayPeriodAmount", stayPeriodAmount);
        }
      }
    }

    toast.success("All calculations have been refreshed");
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const figures = calculateFigures();
  const sendEmailNotification = form.watch("sendEmailNotification");

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Termination" : "Create Termination"}</h1>
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
            <div className="font-medium">Termination Editing Restricted</div>
            <div className="text-sm text-muted-foreground mt-1">
              This termination has been approved and is protected from modifications. To make changes, a manager must first reset the approval status from the termination details
              page.
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-[500px]">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="deductions">Deductions ({deductionsFieldArray.fields.length})</TabsTrigger>
                <TabsTrigger value="attachments">Documents ({attachmentsFieldArray.fields.length})</TabsTrigger>
                <TabsTrigger value="email">Email Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card className={isApproved ? "opacity-60" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {isEdit ? "Edit Termination" : "Create New Termination"}
                      {isApproved && <Lock className="h-4 w-4 text-red-500" />}
                    </CardTitle>
                    <CardDescription>{isEdit ? "Update termination information" : "Enter termination details"}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="TerminationNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Termination No.</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={isEdit ? "Termination number (cannot be changed)" : "Auto-generated if left empty"}
                                {...field}
                                disabled={isEdit || !canEditTermination}
                                className={isEdit ? "bg-muted" : ""}
                              />
                            </FormControl>
                            <FormDescription>
                              {isEdit ? "Termination number cannot be modified in edit mode" : "Optional. Leave blank for auto-generated termination number."}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="TerminationStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange} disabled={!canEditTermination}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="ContractID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              fetchContractDetails(parseInt(value));
                            }}
                            disabled={isNewFromContract || !canEditTermination}
                          >
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
                          {contractDetails && (
                            <div className="mt-2 text-sm p-2 bg-muted rounded-md">
                              <div>
                                <span className="font-medium">Customer:</span> {contractDetails.CustomerName}
                              </div>
                              <div>
                                <span className="font-medium">Status:</span> {contractDetails.ContractStatus}
                              </div>
                              <div>
                                <span className="font-medium">Total Value:</span> {contractDetails.GrandTotal?.toLocaleString()}
                              </div>
                              {contractDetails.CustomerEmail && (
                                <div>
                                  <span className="font-medium">Customer Email:</span> {contractDetails.CustomerEmail}
                                </div>
                              )}
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="TerminationDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Termination Date</FormLabel>
                            <FormControl>
                              <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} readOnly={!canEditTermination} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="NoticeDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Notice Date</FormLabel>
                            <FormControl>
                              <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} readOnly={!canEditTermination} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="EffectiveDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Effective Date</FormLabel>
                            <FormControl>
                              <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} readOnly={!canEditTermination} />
                            </FormControl>
                            <FormDescription>When the termination becomes effective</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="VacatingDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Vacating Date</FormLabel>
                            <FormControl>
                              <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} readOnly={!canEditTermination} />
                            </FormControl>
                            <FormDescription>When the tenant will vacate the property</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="MoveOutDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Move Out Date</FormLabel>
                            <FormControl>
                              <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} readOnly={!canEditTermination} />
                            </FormControl>
                            <FormDescription>When the tenant will physically move out</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="KeyReturnDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Key Return Date</FormLabel>
                            <FormControl>
                              <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} readOnly={!canEditTermination} />
                            </FormControl>
                            <FormDescription>When keys will be returned</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="StayPeriodDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stay Period (Days)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                disabled={!canEditTermination}
                                className="bg-muted/50"
                              />
                            </FormControl>
                            <FormDescription>Calculated from effective date to vacating date</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="StayPeriodAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stay Period Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                disabled={!canEditTermination}
                                className="bg-muted/50"
                              />
                            </FormControl>
                            <FormDescription>Calculated based on daily rate and stay period days</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="TerminationReason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Termination Reason</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter reason for termination" className="min-h-[100px]" {...field} disabled={!canEditTermination} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="SecurityDepositAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Security Deposit Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                disabled={!canEditTermination}
                              />
                            </FormControl>
                            <FormDescription>The amount of security deposit to be refunded or deducted</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="AdjustAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adjustment Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                disabled={!canEditTermination}
                              />
                            </FormControl>
                            <FormDescription>Additional adjustments to apply</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="Notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter additional notes" className="min-h-[100px]" {...field} disabled={!canEditTermination} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          Termination Summary
                          <Button type="button" variant="outline" size="sm" onClick={handleRecalculateAll} disabled={!canEditTermination}>
                            <Calculator className="mr-2 h-4 w-4" />
                            Recalculate All
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Security Deposit</div>
                          <div className="text-2xl font-bold">{figures.securityDeposit.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Stay Period Amount</div>
                          <div className="text-2xl font-bold text-blue-600">+{figures.stayPeriodAmount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Total Deductions</div>
                          <div className="text-2xl font-bold text-red-600">-{figures.totalDeductions.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Adjustment</div>
                          <div className="text-2xl font-bold">-{figures.adjustment.toLocaleString()}</div>
                        </div>
                        <div className="col-span-2 border-t pt-4">
                          {figures.refundAmount > 0 ? (
                            <>
                              <div className="text-sm font-medium text-muted-foreground">Refund Amount</div>
                              <div className="text-3xl font-bold text-green-600">{figures.refundAmount.toLocaleString()}</div>
                            </>
                          ) : (
                            <>
                              <div className="text-sm font-medium text-muted-foreground">Credit Note Amount</div>
                              <div className="text-3xl font-bold text-red-600">{figures.creditNoteAmount.toLocaleString()}</div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deductions">
                <Card className={isApproved ? "opacity-60" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Deductions
                        {isApproved && <Lock className="h-4 w-4 text-red-500" />}
                      </CardTitle>
                      <CardDescription>Add deduction items to this termination</CardDescription>
                    </div>
                    <Button type="button" onClick={addDeduction} disabled={!canEditTermination}>
                      {canEditTermination ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                      Add Deduction
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {deductionsFieldArray.fields.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No deductions have been added yet. Click "Add Deduction" to add one.</div>
                    ) : (
                      <Accordion type="multiple" className="w-full">
                        {deductionsFieldArray.fields.map((field, index) => (
                          <AccordionItem key={field.id} value={`item-${index}`} className="border rounded-lg mb-4">
                            <AccordionTrigger className="px-4">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center">
                                  <HandCoins className="h-5 w-5 mr-2 text-muted-foreground" />
                                  <span className="font-medium">{form.watch(`deductions.${index}.DeductionName`) || `Deduction ${index + 1}`}</span>
                                </div>
                                <div className="font-medium">
                                  {form.watch(`deductions.${index}.TotalAmount`) ? form.watch(`deductions.${index}.TotalAmount`).toLocaleString() : "0"}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4">
                                <div className="flex justify-end">
                                  <Button type="button" variant="destructive" size="sm" onClick={() => deductionsFieldArray.remove(index)} disabled={!canEditTermination}>
                                    {canEditTermination ? <Trash2 className="h-4 w-4 mr-1" /> : <Lock className="h-4 w-4 mr-1" />}
                                    Remove Deduction
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <FormLabel>Choose from available deductions</FormLabel>
                                    <Select onValueChange={(value) => handleDeductionSelect(parseInt(value), index)} disabled={!canEditTermination}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a deduction" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {deductions.map((deduction) => (
                                          <SelectItem key={deduction.DeductionID} value={deduction.DeductionID.toString()}>
                                            {deduction.DeductionName} {deduction.DeductionValue && `(${deduction.DeductionValue})`}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>Select from predefined deductions or enter custom details below</FormDescription>
                                  </div>

                                  <FormField
                                    control={form.control}
                                    name={`deductions.${index}.DeductionName`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Deduction Name</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Enter deduction name" {...field} disabled={!canEditTermination} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <FormField
                                  control={form.control}
                                  name={`deductions.${index}.DeductionDescription`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Description</FormLabel>
                                      <FormControl>
                                        <Textarea placeholder="Enter description" {...field} disabled={!canEditTermination} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`deductions.${index}.DeductionAmount`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Deduction Amount</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="0.00"
                                          {...field}
                                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                          disabled={!canEditTermination}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                {/* Tax selection */}
                                <div className="space-y-2">
                                  <FormLabel>Tax Selection</FormLabel>
                                  <Select
                                    value={form.watch(`deductions.${index}.TaxID`) ? form.watch(`deductions.${index}.TaxID`).toString() : "0"}
                                    onValueChange={(value) => handleTaxSelect(value, index)}
                                    disabled={!canEditTermination}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select Tax" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="0">No Tax</SelectItem>
                                      {taxes.map((tax) => (
                                        <SelectItem key={tax.TaxID} value={tax.TaxID.toString()}>
                                          {tax.TaxName} ({tax.TaxCode}) - {tax.TaxRate}%
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    {form.watch(`deductions.${index}.TaxID`) ? (
                                      <div className="flex items-center mt-1">
                                        <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                                        <span>
                                          Using: {form.watch(`deductions.${index}.TaxName`)} ({form.watch(`deductions.${index}.TaxCode`)})
                                        </span>
                                      </div>
                                    ) : (
                                      "Select a tax or use manual rate"
                                    )}
                                  </FormDescription>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name={`deductions.${index}.TaxPercentage`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Tax Percentage (%)</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            placeholder="0.00"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                            disabled={!!form.watch(`deductions.${index}.TaxID`) || !canEditTermination}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name={`deductions.${index}.TaxAmount`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Tax Amount</FormLabel>
                                        <FormControl>
                                          <Input type="number" placeholder="0.00" {...field} disabled />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <FormField
                                  control={form.control}
                                  name={`deductions.${index}.TotalAmount`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Total Amount</FormLabel>
                                      <FormControl>
                                        <Input type="number" placeholder="0.00" {...field} disabled />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}

                        <div className="flex justify-between py-4 px-4 border-t">
                          <span className="font-bold text-lg">Total Deductions:</span>
                          <span className="font-bold text-lg">{figures.totalDeductions.toLocaleString()}</span>
                        </div>
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attachments">
                <Card className={isApproved ? "opacity-60" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Documents
                        {isApproved && <Lock className="h-4 w-4 text-red-500" />}
                      </CardTitle>
                      <CardDescription>Add document attachments to this termination</CardDescription>
                    </div>
                    <Button type="button" onClick={addAttachment} disabled={!canEditTermination}>
                      {canEditTermination ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                      Add Document
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {attachmentsFieldArray.fields.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No documents have been added yet. Click "Add Document" to add one.</div>
                    ) : (
                      <Accordion type="multiple" className="w-full">
                        {attachmentsFieldArray.fields.map((field, index) => (
                          <AccordionItem key={field.id} value={`attachment-${index}`} className="border rounded-lg mb-4">
                            <AccordionTrigger className="px-4">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center">
                                  <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                                  <span className="font-medium">{form.watch(`attachments.${index}.DocumentName`) || `Document ${index + 1}`}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {form.watch(`attachments.${index}.DocTypeID`)
                                    ? docTypes.find((dt) => dt.DocTypeID.toString() === form.watch(`attachments.${index}.DocTypeID`))?.Description
                                    : ""}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4">
                                <div className="flex justify-end">
                                  <Button type="button" variant="destructive" size="sm" onClick={() => attachmentsFieldArray.remove(index)} disabled={!canEditTermination}>
                                    {canEditTermination ? <Trash2 className="h-4 w-4 mr-1" /> : <Lock className="h-4 w-4 mr-1" />}
                                    Remove Document
                                  </Button>
                                </div>

                                <FormField
                                  control={form.control}
                                  name={`attachments.${index}.DocTypeID`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="flex items-center justify-between">
                                        <span>Document Type</span>
                                        {canEditTermination && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              setIsDocTypeDialogOpen(true);
                                            }}
                                          >
                                            <PlusCircle className="mr-1 h-3.5 w-3.5" />
                                            Create New
                                          </Button>
                                        )}
                                      </FormLabel>
                                      <Select value={field.value} onValueChange={field.onChange} disabled={!canEditTermination}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select document type" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {docTypes.map((docType) => (
                                            <SelectItem key={docType.DocTypeID} value={docType.DocTypeID.toString()}>
                                              {docType.Description}
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
                                  name={`attachments.${index}.DocumentName`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Document Name</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter document name" {...field} disabled={!canEditTermination} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                {canEditTermination && (
                                  <CustomFormField
                                    form={form}
                                    name={`attachments.${index}.file`}
                                    label="Upload File"
                                    description="Upload a document file (PDF, Word, Excel, or images)"
                                    type="file"
                                    fileConfig={{
                                      maxSize: 10 * 1024 * 1024, // 10MB
                                      acceptedFileTypes: ".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls",
                                      onUpload: (file: File) => handleFileUpload(file, index),
                                      onRemove: () => handleFileRemove(index),
                                      isUploading,
                                      uploadSuccess,
                                      uploadError,
                                    }}
                                  />
                                )}

                                {/* Show file preview if available */}
                                {previewUrls[index] && (
                                  <div className="mt-2 p-2 border rounded-md bg-muted/20">
                                    <p className="text-xs text-muted-foreground mb-1">File preview:</p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm">{form.watch(`attachments.${index}.file`)?.name}</span>
                                      {canEditTermination && (
                                        <Button type="button" variant="ghost" size="sm" onClick={() => handleFileRemove(index)}>
                                          <X className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name={`attachments.${index}.DocIssueDate`}
                                    render={({ field }) => (
                                      <FormItem className="flex flex-col">
                                        <FormLabel>Issue Date</FormLabel>
                                        <FormControl>
                                          <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} readOnly={!canEditTermination} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name={`attachments.${index}.DocExpiryDate`}
                                    render={({ field }) => (
                                      <FormItem className="flex flex-col">
                                        <FormLabel>Expiry Date</FormLabel>
                                        <FormControl>
                                          <DatePicker
                                            value={field.value}
                                            onChange={field.onChange}
                                            disabled={(date) => {
                                              const issueDate = form.watch(`attachments.${index}.DocIssueDate`);
                                              return issueDate ? date < issueDate : false;
                                            }}
                                            readOnly={!canEditTermination}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <FormField
                                  control={form.control}
                                  name={`attachments.${index}.Remarks`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Remarks</FormLabel>
                                      <FormControl>
                                        <Textarea placeholder="Enter remarks about this document" {...field} disabled={!canEditTermination} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email">
                <Card className={isApproved ? "opacity-60" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Email Notifications
                      {isApproved && <Lock className="h-4 w-4 text-red-500" />}
                    </CardTitle>
                    <CardDescription>Configure email notifications for this termination</CardDescription>
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
                        disabled={!canEditTermination}
                      />
                      <Label htmlFor="sendEmailNotification" className="text-sm font-medium">
                        Send email notification when termination is {isEdit ? "updated" : "created"}
                      </Label>
                    </div>

                    {sendEmailNotification && (
                      <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                        <div className="text-sm text-muted-foreground">
                          Email notifications will be sent automatically to the selected recipients when the termination is {isEdit ? "updated" : "created"}.
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
                          <Button type="button" variant="outline" size="sm" onClick={handleSendTestEmail} disabled={!canEditTermination}>
                            <Send className="mr-2 h-4 w-4" />
                            Preview Email Template
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setShowEmailSettings(!showEmailSettings)} disabled={!canEditTermination}>
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
                                <div className="text-sm">• For new terminations: "termination_created" template will be used</div>
                                <div className="text-sm">• For updates: "termination_updated" template will be used</div>
                                <div className="text-sm">• All termination details including deductions, refund amounts, and important dates will be included</div>
                                <div className="text-sm">• Recipients will receive notifications about refund processing, status changes, and approvals</div>
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between mt-6">
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                  Cancel
                </Button>
                <Button type="button" variant="outline" onClick={handleReset} disabled={loading || !canEditTermination}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                {sendEmailNotification && (
                  <Alert className="p-2 inline-flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="text-sm">Email notifications will be sent</span>
                  </Alert>
                )}
                <Button type="submit" disabled={loading || !canEditTermination}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEdit ? "Update Termination" : "Create Termination"}
                      {sendEmailNotification && " & Send Email"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>

      {/* Email Send Dialog for Preview */}
      <EmailSendDialog
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        entityType="termination"
        entityId={0} // Preview mode
        entityData={form.getValues()}
        defaultRecipients={getDefaultEmailRecipients()}
        triggerEvent={isEdit ? "termination_updated" : "termination_created"}
        onEmailSent={handleEmailSent}
      />

      {/* Create Document Type Dialog */}
      <CreateDocTypeDialog isOpen={isDocTypeDialogOpen} onClose={() => setIsDocTypeDialogOpen(false)} onSave={handleSaveDocType} />
    </div>
  );
};

export default TerminationForm;
