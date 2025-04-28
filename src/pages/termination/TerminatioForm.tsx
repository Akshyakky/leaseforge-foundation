// src/pages/termination/TerminationForm.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, RotateCcw, Plus, Trash2, FileText, Calculator, Calendar, Upload } from "lucide-react";
import { terminationService, ContractTermination, TerminationDeduction, TerminationAttachment } from "@/services/terminationService";
import { contractService } from "@/services/contractService";
import { deductionService } from "@/services/deductionService";
import { docTypeService } from "@/services/docTypeService";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/lib/hooks";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

// Create schema for termination form validation
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
        const [contractsData, deductionsData, docTypesData] = await Promise.all([
          contractService.getAllContracts(),
          terminationService.getAvailableDeductions(),
          docTypeService.getAllDocTypes(),
        ]);

        setContracts(contractsData);
        setDeductions(deductionsData);
        setDocTypes(docTypesData);

        // If editing, fetch the termination data
        if (isEdit && id) {
          const terminationData = await terminationService.getTerminationById(parseInt(id));

          if (terminationData.termination) {
            setTermination(terminationData.termination);

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
            const formattedDeductions = terminationData.deductions.map((deduction) => ({
              ...deduction,
              DeductionID: deduction.DeductionID || null,
            }));

            // Format attachments
            const formattedAttachments = terminationData.attachments.map((attachment) => ({
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

  // Fetch contract details
  const fetchContractDetails = async (contractId: number) => {
    try {
      const data = await contractService.getContractById(contractId);
      setContractDetails(data.contract);

      // If contract has security deposit data, pre-fill it
      if (data.contract && !isEdit) {
        // This is a placeholder - in a real app, you might get this from the contract or another source
        // For now, we'll leave it to be manually entered
        // form.setValue("SecurityDepositAmount", data.contract.securityDeposit || 0);
      }
    } catch (error) {
      console.error("Error fetching contract details:", error);
    }
  };

  // Effect to auto-calculate tax and total amount when deduction amount changes
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Auto-calculate deduction total amount based on amount and tax
      if (name && (name.includes("DeductionAmount") || name.includes("TaxPercentage")) && name.includes("deductions")) {
        const index = parseInt(name.split(".")[1]);
        const deductions = form.getValues("deductions");
        if (deductions && deductions[index]) {
          const amount = deductions[index].DeductionAmount || 0;
          const taxPercent = deductions[index].TaxPercentage || 0;
          const taxAmount = (amount * taxPercent) / 100;
          form.setValue(`deductions.${index}.TaxAmount`, taxAmount);
          form.setValue(`deductions.${index}.TotalAmount`, amount + taxAmount);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

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
    deductionsFieldArray.append({
      DeductionName: "",
      DeductionAmount: 0,
      TaxPercentage: 0,
      TaxAmount: 0,
      TotalAmount: 0,
    });

    // Switch to deductions tab
    setActiveTab("deductions");
  };

  // Add a new attachment to the termination
  const addAttachment = () => {
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

  // Handle form submission
  const onSubmit = async (data: TerminationFormValues) => {
    if (!user) {
      toast.error("User information not available");
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
          toast.success("Termination updated successfully");
          navigate(`/terminations/${termination.TerminationID}`);
        } else {
          toast.error(response.Message || "Failed to update termination");
        }
      } else {
        // Create new termination
        const response = await terminationService.createTermination(terminationData);

        if (response.Status === 1 && response.NewTerminationID) {
          toast.success("Termination created successfully");
          navigate(`/terminations/${response.NewTerminationID}`);
        } else {
          toast.error(response.Message || "Failed to create termination");
        }
      }
    } catch (error) {
      console.error("Error saving termination:", error);
      toast.error("Failed to save termination");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
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

      // Auto-set document name if it's empty
      if (!form.getValues(`attachments.${index}.DocumentName`)) {
        form.setValue(`attachments.${index}.DocumentName`, file.name);
      }
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

      // Recalculate totals
      const amount = form.getValues(`deductions.${index}.DeductionAmount`) || 0;
      const taxPercent = form.getValues(`deductions.${index}.TaxPercentage`) || 0;
      const taxAmount = (amount * taxPercent) / 100;
      form.setValue(`deductions.${index}.TaxAmount`, taxAmount);
      form.setValue(`deductions.${index}.TotalAmount`, amount + taxAmount);
    }
  };

  // Calculate figures function
  const calculateFigures = () => {
    const securityDeposit = form.getValues("SecurityDepositAmount") || 0;
    const totalDeductions = calculateTotals().totalDeductions;
    const adjustment = form.getValues("AdjustAmount") || 0;

    // Calculate refund or credit note
    let refundAmount = 0;
    let creditNoteAmount = 0;

    const balance = securityDeposit - totalDeductions - adjustment;

    if (balance > 0) {
      refundAmount = balance;
    } else {
      creditNoteAmount = Math.abs(balance);
    }

    return {
      securityDeposit,
      totalDeductions,
      adjustment,
      refundAmount,
      creditNoteAmount,
    };
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

  const figures = calculateFigures();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Termination" : "Create Termination"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-[400px]">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="deductions">Deductions ({deductionsFieldArray.fields.length})</TabsTrigger>
                <TabsTrigger value="attachments">Attachments ({attachmentsFieldArray.fields.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>{isEdit ? "Edit Termination" : "Create New Termination"}</CardTitle>
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
                              <Input placeholder="Auto-generated if left empty" {...field} />
                            </FormControl>
                            <FormDescription>Optional. Leave blank for auto-generated termination number.</FormDescription>
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
                            <Select value={field.value} onValueChange={field.onChange}>
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
                            disabled={isNewFromContract} // Disable if creating from a specific contract
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
                              <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} />
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
                              <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} />
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
                              <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} />
                            </FormControl>
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
                              <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} />
                            </FormControl>
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
                              <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} />
                            </FormControl>
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
                              <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} />
                            </FormControl>
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
                              <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                            </FormControl>
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
                              <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                            </FormControl>
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
                            <Textarea placeholder="Enter reason for termination" className="min-h-[100px]" {...field} />
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
                              <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} />
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
                              <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
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
                            <Textarea placeholder="Enter additional notes" className="min-h-[100px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-lg">Termination Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Security Deposit</div>
                          <div className="text-2xl font-bold">{figures.securityDeposit.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Total Deductions</div>
                          <div className="text-2xl font-bold">{figures.totalDeductions.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Adjustment</div>
                          <div className="text-2xl font-bold">{figures.adjustment.toLocaleString()}</div>
                        </div>
                        <div>
                          {figures.refundAmount > 0 ? (
                            <>
                              <div className="text-sm font-medium text-muted-foreground">Refund Amount</div>
                              <div className="text-2xl font-bold text-green-600">{figures.refundAmount.toLocaleString()}</div>
                            </>
                          ) : (
                            <>
                              <div className="text-sm font-medium text-muted-foreground">Credit Note Amount</div>
                              <div className="text-2xl font-bold text-red-600">{figures.creditNoteAmount.toLocaleString()}</div>
                            </>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            // Recalculate to force form update
                            calculateFigures();
                          }}
                        >
                          <Calculator className="mr-2 h-4 w-4" />
                          Recalculate Figures
                        </Button>
                      </CardFooter>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deductions">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Deductions</CardTitle>
                      <CardDescription>Add deduction items to this termination</CardDescription>
                    </div>
                    <Button type="button" onClick={addDeduction}>
                      <Plus className="mr-2 h-4 w-4" />
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
                                  <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
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
                                  <Button type="button" variant="destructive" size="sm" onClick={() => deductionsFieldArray.remove(index)}>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Remove Deduction
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <FormLabel>Choose from available deductions</FormLabel>
                                    <Select onValueChange={(value) => handleDeductionSelect(parseInt(value), index)}>
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
                                          <Input placeholder="Enter deduction name" {...field} />
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
                                        <Textarea placeholder="Enter description" {...field} />
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
                                        <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name={`deductions.${index}.TaxPercentage`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Tax Percentage (%)</FormLabel>
                                        <FormControl>
                                          <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
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
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Attachments</CardTitle>
                      <CardDescription>Add document attachments to this termination</CardDescription>
                    </div>
                    <Button type="button" onClick={addAttachment}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Attachment
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {attachmentsFieldArray.fields.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No attachments have been added yet. Click "Add Attachment" to add one.</div>
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
                                  <Button type="button" variant="destructive" size="sm" onClick={() => attachmentsFieldArray.remove(index)}>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Remove Attachment
                                  </Button>
                                </div>

                                <FormField
                                  control={form.control}
                                  name={`attachments.${index}.DocTypeID`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Document Type</FormLabel>
                                      <Select value={field.value} onValueChange={field.onChange}>
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
                                        <Input placeholder="Enter document name" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="space-y-2">
                                  <FormLabel>Document File</FormLabel>
                                  <Input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => handleFileChange(e, index)} />
                                  <FormDescription>Upload document file (PDF, Word, Excel, or images)</FormDescription>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name={`attachments.${index}.DocIssueDate`}
                                    render={({ field }) => (
                                      <FormItem className="flex flex-col">
                                        <FormLabel>Issue Date</FormLabel>
                                        <FormControl>
                                          <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} />
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
                                        <Textarea placeholder="Enter remarks about this document" {...field} />
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
            </Tabs>

            <div className="flex justify-between mt-6">
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEdit ? "Update Termination" : "Create Termination"}
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

// Import DollarSign icon
import { DollarSign } from "lucide-react";

export default TerminationForm;
