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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Save, Plus, Trash2, Upload, FileText, Calculator, Building, DollarSign, Users, PlusCircle } from "lucide-react";
import { contractService } from "@/services/leaseContractService";
import { customerService } from "@/services/customerService";
import { unitService } from "@/services/unitService";
import { additionalChargesService } from "@/services/additionalChargesService";
import { docTypeService } from "@/services/docTypeService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { useAppSelector } from "@/lib/hooks";
import {
  Contract,
  ContractUnit,
  ContractAdditionalCharge,
  ContractAttachment,
  ContractRequest,
  ContractUnitRequest,
  ContractAdditionalChargeRequest,
  ContractAttachmentRequest,
  Unit,
  ContractStatus,
  AdditionalCharge,
} from "@/types/leaseContractTypes";
import { DocType } from "@/services/docTypeService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Customer } from "@/types/customerTypes";

// Create schema for contract form validation
const contractUnitSchema = z.object({
  unitId: z.string().min(1, "Unit is required"),
  fromDate: z.date({ required_error: "From date is required" }),
  toDate: z.date({ required_error: "To date is required" }),
  fitoutFromDate: z.date().optional(),
  fitoutToDate: z.date().optional(),
  commencementDate: z.date().optional(),
  contractDays: z.coerce.number().min(1).optional(),
  contractMonths: z.coerce.number().min(1).optional(),
  contractYears: z.coerce.number().min(1).optional(),
  rentPerMonth: z.coerce.number().min(0.01, "Rent per month must be greater than 0"),
  rentPerYear: z.coerce.number().min(0).optional(),
  noOfInstallments: z.coerce.number().min(1).optional(),
  rentFreePeriodFrom: z.date().optional(),
  rentFreePeriodTo: z.date().optional(),
  rentFreeAmount: z.coerce.number().min(0).optional(),
  taxPercentage: z.coerce.number().min(0).max(100).optional(),
  taxAmount: z.coerce.number().min(0).optional(),
  totalAmount: z.coerce.number().min(0).optional(),
});

const contractChargeSchema = z.object({
  additionalChargesId: z.string().min(1, "Additional charge is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  taxPercentage: z.coerce.number().min(0).max(100).optional(),
  taxAmount: z.coerce.number().min(0).optional(),
  totalAmount: z.coerce.number().min(0).optional(),
});

const contractAttachmentSchema = z.object({
  docTypeId: z.string().min(1, "Document type is required"),
  documentName: z.string().min(2, "Document name is required"),
  file: z.instanceof(File).optional(),
  docIssueDate: z.date().optional(),
  docExpiryDate: z.date().optional(),
  remarks: z.string().optional(),
});

const contractSchema = z.object({
  contractNo: z.string().optional(),
  contractStatus: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  jointCustomerId: z.string().optional(),
  transactionDate: z.date({ required_error: "Transaction date is required" }),
  remarks: z.string().optional(),
  units: z.array(contractUnitSchema).min(1, "At least one unit is required"),
  charges: z.array(contractChargeSchema).optional(),
  attachments: z.array(contractAttachmentSchema).optional(),
});

type ContractFormValues = z.infer<typeof contractSchema>;

const LeaseContractForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [contract, setContract] = useState<Contract | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  // Reference data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocType[]>([]);

  // Dialog states
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [editingUnitIndex, setEditingUnitIndex] = useState<number | null>(null);
  const [editingChargeIndex, setEditingChargeIndex] = useState<number | null>(null);
  const [editingAttachmentIndex, setEditingAttachmentIndex] = useState<number | null>(null);

  // Initialize forms
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      contractNo: "",
      contractStatus: ContractStatus.DRAFT,
      customerId: "",
      jointCustomerId: "",
      transactionDate: new Date(),
      remarks: "",
      units: [],
      charges: [],
      attachments: [],
    },
  });

  // Field arrays for dynamic sections
  const {
    fields: unitFields,
    append: appendUnit,
    remove: removeUnit,
    update: updateUnit,
  } = useFieldArray({
    control: form.control,
    name: "units",
  });

  const {
    fields: chargeFields,
    append: appendCharge,
    remove: removeCharge,
    update: updateCharge,
  } = useFieldArray({
    control: form.control,
    name: "charges",
  });

  const {
    fields: attachmentFields,
    append: appendAttachment,
    remove: removeAttachment,
    update: updateAttachment,
  } = useFieldArray({
    control: form.control,
    name: "attachments",
  });

  // Initialize and fetch data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        await fetchReferenceData();

        // If editing, fetch the contract data
        if (isEdit && id) {
          const contractData = await contractService.getContractById(parseInt(id));

          if (contractData.contract) {
            setContract(contractData.contract);

            // Set form values
            form.reset({
              contractNo: contractData.contract.ContractNo,
              contractStatus: contractData.contract.ContractStatus,
              customerId: contractData.contract.CustomerID.toString(),
              jointCustomerId: contractData.contract.JointCustomerID?.toString() || "",
              transactionDate: new Date(contractData.contract.TransactionDate),
              remarks: contractData.contract.Remarks || "",
              units: contractData.units.map((unit) => ({
                unitId: unit.UnitID.toString(),
                fromDate: new Date(unit.FromDate),
                toDate: new Date(unit.ToDate),
                fitoutFromDate: unit.FitoutFromDate ? new Date(unit.FitoutFromDate) : undefined,
                fitoutToDate: unit.FitoutToDate ? new Date(unit.FitoutToDate) : undefined,
                commencementDate: unit.CommencementDate ? new Date(unit.CommencementDate) : undefined,
                contractDays: unit.ContractDays || undefined,
                contractMonths: unit.ContractMonths || undefined,
                contractYears: unit.ContractYears || undefined,
                rentPerMonth: unit.RentPerMonth,
                rentPerYear: unit.RentPerYear,
                noOfInstallments: unit.NoOfInstallments || undefined,
                rentFreePeriodFrom: unit.RentFreePeriodFrom ? new Date(unit.RentFreePeriodFrom) : undefined,
                rentFreePeriodTo: unit.RentFreePeriodTo ? new Date(unit.RentFreePeriodTo) : undefined,
                rentFreeAmount: unit.RentFreeAmount || undefined,
                taxPercentage: unit.TaxPercentage || undefined,
                taxAmount: unit.TaxAmount || undefined,
                totalAmount: unit.TotalAmount,
              })),
              charges: contractData.additionalCharges.map((charge) => ({
                additionalChargesId: charge.AdditionalChargesID.toString(),
                amount: charge.Amount,
                taxPercentage: charge.TaxPercentage || undefined,
                taxAmount: charge.TaxAmount || undefined,
                totalAmount: charge.TotalAmount,
              })),
              attachments: contractData.attachments.map((attachment) => ({
                docTypeId: attachment.DocTypeID.toString(),
                documentName: attachment.DocumentName,
                docIssueDate: attachment.DocIssueDate ? new Date(attachment.DocIssueDate) : undefined,
                docExpiryDate: attachment.DocExpiryDate ? new Date(attachment.DocExpiryDate) : undefined,
                remarks: attachment.Remarks || "",
              })),
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

  // Fetch reference data
  const fetchReferenceData = async () => {
    try {
      const [customersData, unitsData, chargesData, docTypesData] = await Promise.all([
        customerService.getAllCustomers(),
        unitService.getAllUnits(),
        additionalChargesService.getAllCharges(),
        docTypeService.getAllDocTypes(),
      ]);

      setCustomers(customersData);
      setUnits(unitsData);
      setAdditionalCharges(chargesData);
      setDocumentTypes(docTypesData);
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Error loading reference data");
    }
  };

  // Submit handler for the contract form
  const onSubmit = async (data: ContractFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    setLoading(true);

    try {
      // Calculate totals
      const unitsTotal = data.units.reduce((sum, unit) => sum + (unit.totalAmount || unit.rentPerMonth), 0);
      const chargesTotal = data.charges?.reduce((sum, charge) => sum + (charge.totalAmount || charge.amount), 0) || 0;
      const grandTotal = unitsTotal + chargesTotal;

      // Prepare contract data
      const contractData: ContractRequest = {
        ContractNo: data.contractNo,
        ContractStatus: data.contractStatus || ContractStatus.DRAFT,
        CustomerID: parseInt(data.customerId),
        JointCustomerID: data.jointCustomerId ? parseInt(data.jointCustomerId) : undefined,
        TransactionDate: data.transactionDate,
        TotalAmount: unitsTotal,
        AdditionalCharges: chargesTotal,
        GrandTotal: grandTotal,
        Remarks: data.remarks,
      };

      if (isEdit && contract) {
        // Update existing contract
        const result = await contractService.updateContract({
          ...contractData,
          ContractID: contract.ContractID,
        });

        if (result.success) {
          // Update units, charges, and attachments separately
          await updateContractDetails(contract.ContractID, data);
          toast.success(result.message);
          navigate("/contracts");
        } else {
          toast.error(result.message);
        }
      } else {
        // Create new contract
        const result = await contractService.createContract(contractData);

        if (result.success && result.contractId) {
          // Add units, charges, and attachments
          await updateContractDetails(result.contractId, data);
          toast.success(result.message);
          navigate("/contracts");
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error("Error saving contract:", error);
      toast.error("Failed to save contract");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to update contract details
  const updateContractDetails = async (contractId: number, data: ContractFormValues) => {
    try {
      // Update units
      for (const unit of data.units) {
        const unitData: ContractUnitRequest = {
          ContractID: contractId,
          UnitID: parseInt(unit.unitId),
          FromDate: unit.fromDate,
          ToDate: unit.toDate,
          FitoutFromDate: unit.fitoutFromDate,
          FitoutToDate: unit.fitoutToDate,
          CommencementDate: unit.commencementDate,
          ContractDays: unit.contractDays,
          ContractMonths: unit.contractMonths,
          ContractYears: unit.contractYears,
          RentPerMonth: unit.rentPerMonth,
          RentPerYear: unit.rentPerYear || unit.rentPerMonth * 12,
          NoOfInstallments: unit.noOfInstallments,
          RentFreePeriodFrom: unit.rentFreePeriodFrom,
          RentFreePeriodTo: unit.rentFreePeriodTo,
          RentFreeAmount: unit.rentFreeAmount,
          TaxPercentage: unit.taxPercentage,
          TaxAmount: unit.taxAmount,
          UnitTotalAmount: unit.totalAmount || unit.rentPerMonth,
        };

        await contractService.addOrUpdateContractUnit(unitData);
      }

      // Update charges
      if (data.charges) {
        for (const charge of data.charges) {
          const chargeData: ContractAdditionalChargeRequest = {
            ContractID: contractId,
            AdditionalChargesID: parseInt(charge.additionalChargesId),
            ChargeAmount: charge.amount,
            ChargeTaxPercentage: charge.taxPercentage,
            ChargeTaxAmount: charge.taxAmount,
            ChargeTotalAmount: charge.totalAmount || charge.amount,
          };

          await contractService.addOrUpdateContractAdditionalCharge(chargeData);
        }
      }

      // Update attachments
      if (data.attachments) {
        for (const attachment of data.attachments) {
          if (attachment.file) {
            const attachmentData: ContractAttachmentRequest = {
              ContractID: contractId,
              DocTypeID: parseInt(attachment.docTypeId),
              DocumentName: attachment.documentName,
              DocIssueDate: attachment.docIssueDate,
              DocExpiryDate: attachment.docExpiryDate,
              AttachmentRemarks: attachment.remarks,
            };

            await contractService.addContractAttachment(attachmentData);
          }
        }
      }
    } catch (error) {
      console.error("Error updating contract details:", error);
      throw error;
    }
  };

  // Unit dialog handlers
  const openUnitDialog = (index?: number) => {
    if (index !== undefined) {
      setEditingUnitIndex(index);
    } else {
      setEditingUnitIndex(null);
    }
    setUnitDialogOpen(true);
  };

  const closeUnitDialog = () => {
    setUnitDialogOpen(false);
    setEditingUnitIndex(null);
  };

  const handleAddUnit = (unitData: any) => {
    if (editingUnitIndex !== null) {
      updateUnit(editingUnitIndex, unitData);
    } else {
      appendUnit(unitData);
    }
    closeUnitDialog();
  };

  const handleRemoveUnit = (index: number) => {
    removeUnit(index);
  };

  // Charge dialog handlers
  const openChargeDialog = (index?: number) => {
    if (index !== undefined) {
      setEditingChargeIndex(index);
    } else {
      setEditingChargeIndex(null);
    }
    setChargeDialogOpen(true);
  };

  const closeChargeDialog = () => {
    setChargeDialogOpen(false);
    setEditingChargeIndex(null);
  };

  const handleAddCharge = (chargeData: any) => {
    if (editingChargeIndex !== null) {
      updateCharge(editingChargeIndex, chargeData);
    } else {
      appendCharge(chargeData);
    }
    closeChargeDialog();
  };

  const handleRemoveCharge = (index: number) => {
    removeCharge(index);
  };

  // Attachment dialog handlers
  const openAttachmentDialog = (index?: number) => {
    if (index !== undefined) {
      setEditingAttachmentIndex(index);
    } else {
      setEditingAttachmentIndex(null);
    }
    setAttachmentDialogOpen(true);
  };

  const closeAttachmentDialog = () => {
    setAttachmentDialogOpen(false);
    setEditingAttachmentIndex(null);
  };

  const handleAddAttachment = (attachmentData: any) => {
    if (editingAttachmentIndex !== null) {
      updateAttachment(editingAttachmentIndex, attachmentData);
    } else {
      appendAttachment(attachmentData);
    }
    closeAttachmentDialog();
  };

  const handleRemoveAttachment = (index: number) => {
    removeAttachment(index);
  };

  // Calculate totals
  const watchedUnits = form.watch("units");
  const watchedCharges = form.watch("charges");

  const unitsTotal = watchedUnits?.reduce((sum, unit) => sum + (unit.totalAmount || unit.rentPerMonth || 0), 0) || 0;
  const chargesTotal = watchedCharges?.reduce((sum, charge) => sum + (charge.totalAmount || charge.amount || 0), 0) || 0;
  const grandTotal = unitsTotal + chargesTotal;

  // Cancel button handler
  const handleCancel = () => {
    navigate("/contracts");
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
        <Button variant="outline" size="icon" onClick={() => navigate("/contracts")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Lease Contract" : "Create Lease Contract"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isEdit ? "Edit Contract" : "Create New Contract"}</CardTitle>
                <CardDescription>{isEdit ? "Update contract information" : "Enter the details for the new lease contract"}</CardDescription>
              </CardHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-2">
                <div className="px-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic Information</TabsTrigger>
                    <TabsTrigger value="units">Units ({unitFields.length})</TabsTrigger>
                    <TabsTrigger value="charges">Charges ({chargeFields.length})</TabsTrigger>
                    <TabsTrigger value="attachments">Attachments ({attachmentFields.length})</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="basic" className="p-6 pt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField form={form} name="contractNo" label="Contract Number" placeholder="Auto-generated if empty" disabled={isEdit} />
                    <FormField
                      form={form}
                      name="contractStatus"
                      label="Contract Status"
                      type="select"
                      options={contractService.getContractStatuses().map((status) => ({
                        label: status.label,
                        value: status.value,
                      }))}
                      placeholder="Select status"
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      form={form}
                      name="customerId"
                      label="Customer"
                      type="select"
                      options={customers.map((customer) => ({
                        label: customer.CustomerFullName,
                        value: customer.CustomerID.toString(),
                      }))}
                      placeholder="Select customer"
                      required
                    />
                    <FormField
                      form={form}
                      name="jointCustomerId"
                      label="Joint Customer"
                      type="select"
                      options={customers.map((customer) => ({
                        label: customer.CustomerFullName,
                        value: customer.CustomerID.toString(),
                      }))}
                      placeholder="Select joint customer (optional)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField form={form} name="transactionDate" label="Transaction Date" type="date" required />
                    <div></div>
                  </div>

                  <FormField form={form} name="remarks" label="Remarks" type="textarea" placeholder="Enter any additional information" />

                  {/* Summary Section */}
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Contract Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Units Total:</span>
                        <div className="text-lg font-semibold">{contractService.formatAmount(unitsTotal)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Additional Charges:</span>
                        <div className="text-lg font-semibold">{contractService.formatAmount(chargesTotal)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Grand Total:</span>
                        <div className="text-xl font-bold text-green-600">{contractService.formatAmount(grandTotal)}</div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="units" className="p-6 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Contract Units</h3>
                    <Button type="button" onClick={() => openUnitDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Unit
                    </Button>
                  </div>

                  {unitFields.length === 0 ? (
                    <div className="text-center py-8 border rounded-md bg-muted/10">
                      <p className="text-muted-foreground">No units added yet</p>
                      <Button type="button" variant="outline" className="mt-4" onClick={() => openUnitDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Unit
                      </Button>
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Unit</TableHead>
                            <TableHead>From Date</TableHead>
                            <TableHead>To Date</TableHead>
                            <TableHead>Rent/Month</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unitFields.map((field, index) => {
                            const unit = watchedUnits[index];
                            const selectedUnit = units.find((u) => u.UnitID.toString() === unit?.unitId);
                            return (
                              <TableRow key={field.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{selectedUnit?.UnitNo || "—"}</div>
                                    <div className="text-sm text-muted-foreground">{selectedUnit?.PropertyName || "—"}</div>
                                  </div>
                                </TableCell>
                                <TableCell>{unit?.fromDate ? format(new Date(unit.fromDate), "MMM dd, yyyy") : "—"}</TableCell>
                                <TableCell>{unit?.toDate ? format(new Date(unit.toDate), "MMM dd, yyyy") : "—"}</TableCell>
                                <TableCell>{contractService.formatAmount(unit?.rentPerMonth || 0)}</TableCell>
                                <TableCell className="font-medium">{contractService.formatAmount(unit?.totalAmount || unit?.rentPerMonth || 0)}</TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button type="button" variant="ghost" size="sm" onClick={() => openUnitDialog(index)}>
                                      Edit
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => handleRemoveUnit(index)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="charges" className="p-6 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Additional Charges</h3>
                    <Button type="button" onClick={() => openChargeDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Charge
                    </Button>
                  </div>

                  {chargeFields.length === 0 ? (
                    <div className="text-center py-8 border rounded-md bg-muted/10">
                      <p className="text-muted-foreground">No additional charges added yet</p>
                      <Button type="button" variant="outline" className="mt-4" onClick={() => openChargeDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Charge
                      </Button>
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Charge Name</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Tax %</TableHead>
                            <TableHead>Tax Amount</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {chargeFields.map((field, index) => {
                            const charge = watchedCharges[index];
                            const selectedCharge = additionalCharges.find((c) => c.ChargesID.toString() === charge?.additionalChargesId);
                            return (
                              <TableRow key={field.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{selectedCharge?.ChargesName || "—"}</div>
                                    <div className="text-sm text-muted-foreground">{selectedCharge?.ChargesCode || "—"}</div>
                                  </div>
                                </TableCell>
                                <TableCell>{contractService.formatAmount(charge?.amount || 0)}</TableCell>
                                <TableCell>{charge?.taxPercentage || 0}%</TableCell>
                                <TableCell>{contractService.formatAmount(charge?.taxAmount || 0)}</TableCell>
                                <TableCell className="font-medium">{contractService.formatAmount(charge?.totalAmount || charge?.amount || 0)}</TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button type="button" variant="ghost" size="sm" onClick={() => openChargeDialog(index)}>
                                      Edit
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => handleRemoveCharge(index)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="attachments" className="p-6 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Contract Attachments</h3>
                    <Button type="button" onClick={() => openAttachmentDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Attachment
                    </Button>
                  </div>

                  {attachmentFields.length === 0 ? (
                    <div className="text-center py-8 border rounded-md bg-muted/10">
                      <p className="text-muted-foreground">No attachments added yet</p>
                      <Button type="button" variant="outline" className="mt-4" onClick={() => openAttachmentDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Attachment
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {attachmentFields.map((field, index) => {
                        const attachment = form.watch(`attachments.${index}`);
                        const selectedDocType = documentTypes.find((dt) => dt.DocTypeID.toString() === attachment?.docTypeId);
                        return (
                          <Card key={field.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <span className="font-medium">{attachment?.documentName || "—"}</span>
                                    {selectedDocType && <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100">{selectedDocType.Description}</Badge>}
                                  </div>
                                  <div className="text-sm space-y-1">
                                    {attachment?.docIssueDate && <div className="text-muted-foreground">Issue date: {format(new Date(attachment.docIssueDate), "PPP")}</div>}
                                    {attachment?.docExpiryDate && <div className="text-muted-foreground">Expiry date: {format(new Date(attachment.docExpiryDate), "PPP")}</div>}
                                    {attachment?.remarks && <div className="text-muted-foreground">{attachment.remarks}</div>}
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button type="button" variant="ghost" size="sm" onClick={() => openAttachmentDialog(index)}>
                                    Edit
                                  </Button>
                                  <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => handleRemoveAttachment(index)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <CardFooter className="flex justify-between border-t p-6">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || unitFields.length === 0}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Contract
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>

      {/* Unit Dialog - Simplified for brevity */}
      <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUnitIndex !== null ? "Edit Unit" : "Add Unit"}</DialogTitle>
          </DialogHeader>
          {/* Unit form content would go here */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeUnitDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={() => handleAddUnit({})}>
              {editingUnitIndex !== null ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Charge Dialog - Simplified for brevity */}
      <Dialog open={chargeDialogOpen} onOpenChange={setChargeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingChargeIndex !== null ? "Edit Charge" : "Add Charge"}</DialogTitle>
          </DialogHeader>
          {/* Charge form content would go here */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeChargeDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={() => handleAddCharge({})}>
              {editingChargeIndex !== null ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attachment Dialog - Simplified for brevity */}
      <Dialog open={attachmentDialogOpen} onOpenChange={setAttachmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAttachmentIndex !== null ? "Edit Attachment" : "Add Attachment"}</DialogTitle>
          </DialogHeader>
          {/* Attachment form content would go here */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAttachmentDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={() => handleAddAttachment({})}>
              {editingAttachmentIndex !== null ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaseContractForm;
