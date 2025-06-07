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
import { ArrowLeft, Loader2, Save, Plus, Trash2, Upload, FileText, AlertCircle, Calculator, Building, Users, Receipt, Calendar } from "lucide-react";
import { contractService } from "@/services/leaseContractService";
import { customerService } from "@/services/customerService";
import { unitService } from "@/services/unitService";
import { additionalChargesService } from "@/services/additionalChargesService";
import { docTypeService } from "@/services/docTypeService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import {
  Contract,
  ContractUnit,
  ContractAdditionalCharge,
  ContractAttachment,
  ContractRequest,
  ContractUnitRequest,
  ContractAdditionalChargeRequest,
  ContractAttachmentRequest,
  ContractStatus,
  Unit,
  AdditionalCharge,
  DocType,
} from "@/types/leaseContractTypes";
import { format } from "date-fns";
import { Customer } from "@/types/customerTypes";

// Enhanced schema for lease contracts
const contractUnitSchema = z.object({
  unitId: z.string().min(1, "Unit is required"),
  fromDate: z.date({ required_error: "From date is required" }),
  toDate: z.date({ required_error: "To date is required" }),
  fitoutFromDate: z.date().optional(),
  fitoutToDate: z.date().optional(),
  commencementDate: z.date().optional(),
  rentPerMonth: z.coerce.number().min(0.01, "Rent per month must be greater than 0"),
  rentPerYear: z.coerce.number().min(0).optional(),
  noOfInstallments: z.coerce.number().min(1).optional(),
  rentFreePeriodFrom: z.date().optional(),
  rentFreePeriodTo: z.date().optional(),
  rentFreeAmount: z.coerce.number().min(0).optional(),
  taxPercentage: z.coerce.number().min(0).max(100).optional(),
});

const contractAdditionalChargeSchema = z.object({
  additionalChargesId: z.string().min(1, "Charge is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  taxPercentage: z.coerce.number().min(0).max(100).optional(),
});

const contractAttachmentSchema = z.object({
  docTypeId: z.string().min(1, "Document type is required"),
  documentName: z.string().min(1, "Document name is required"),
  docIssueDate: z.date().optional(),
  docExpiryDate: z.date().optional(),
  remarks: z.string().optional(),
  file: z.any().optional(),
});

const leaseContractSchema = z.object({
  contractNo: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  jointCustomerId: z.string().optional(),
  transactionDate: z.date({ required_error: "Transaction date is required" }),
  remarks: z.string().optional(),

  units: z.array(contractUnitSchema).min(1, "At least one unit is required"),
  additionalCharges: z.array(contractAdditionalChargeSchema).optional(),
  attachments: z.array(contractAttachmentSchema).optional(),
});

type LeaseContractFormValues = z.infer<typeof leaseContractSchema>;

const LeaseContractForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [contract, setContract] = useState<Contract | null>(null);

  // Reference data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);

  // Initialize form
  const form = useForm<LeaseContractFormValues>({
    resolver: zodResolver(leaseContractSchema),
    defaultValues: {
      contractNo: "",
      customerId: "",
      jointCustomerId: "",
      transactionDate: new Date(),
      remarks: "",
      units: [
        {
          unitId: "",
          fromDate: new Date(),
          toDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // One year from now
          rentPerMonth: 0,
          rentPerYear: 0,
          noOfInstallments: 12,
          taxPercentage: 0,
        },
      ],
      additionalCharges: [],
      attachments: [],
    },
  });

  // Field arrays for dynamic sections
  const {
    fields: unitFields,
    append: appendUnit,
    remove: removeUnit,
  } = useFieldArray({
    control: form.control,
    name: "units",
  });

  const {
    fields: chargeFields,
    append: appendCharge,
    remove: removeCharge,
  } = useFieldArray({
    control: form.control,
    name: "additionalCharges",
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

        // If editing, fetch the contract data
        if (isEdit && id) {
          const contractData = await contractService.getContractById(parseInt(id));

          if (contractData.contract) {
            setContract(contractData.contract);

            // Set form values
            form.reset({
              contractNo: contractData.contract.ContractNo,
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
                rentPerMonth: unit.RentPerMonth,
                rentPerYear: unit.RentPerYear,
                noOfInstallments: unit.NoOfInstallments || 12,
                rentFreePeriodFrom: unit.RentFreePeriodFrom ? new Date(unit.RentFreePeriodFrom) : undefined,
                rentFreePeriodTo: unit.RentFreePeriodTo ? new Date(unit.RentFreePeriodTo) : undefined,
                rentFreeAmount: unit.RentFreeAmount || 0,
                taxPercentage: unit.TaxPercentage || 0,
              })),
              additionalCharges: contractData.additionalCharges.map((charge) => ({
                additionalChargesId: charge.AdditionalChargesID.toString(),
                amount: charge.Amount,
                taxPercentage: charge.TaxPercentage || 0,
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
      setUnits(unitsData.filter((unit) => unit.UnitStatus === "Available" || isEdit));
      setAdditionalCharges(chargesData.filter((charge) => charge.IsActive));
      setDocTypes(docTypesData);
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Error loading reference data");
    }
  };

  // Submit handler for the contract form
  const onSubmit = async (data: LeaseContractFormValues) => {
    setLoading(true);

    try {
      // Calculate totals
      const unitsTotal = data.units.reduce((sum, unit) => {
        const baseAmount = unit.rentPerMonth * (unit.noOfInstallments || 12);
        const taxAmount = unit.taxPercentage ? (baseAmount * unit.taxPercentage) / 100 : 0;
        return sum + baseAmount + taxAmount;
      }, 0);

      const chargesTotal = (data.additionalCharges || []).reduce((sum, charge) => {
        const taxAmount = charge.taxPercentage ? (charge.amount * charge.taxPercentage) / 100 : 0;
        return sum + charge.amount + taxAmount;
      }, 0);

      const grandTotal = unitsTotal + chargesTotal;

      // Prepare contract data
      const contractData: ContractRequest = {
        ContractNo: data.contractNo,
        CustomerID: parseInt(data.customerId),
        JointCustomerID: data.jointCustomerId ? parseInt(data.jointCustomerId) : undefined,
        TransactionDate: data.transactionDate.toISOString(),
        TotalAmount: unitsTotal,
        AdditionalCharges: chargesTotal,
        GrandTotal: grandTotal,
        Remarks: data.remarks?.trim() || undefined,
        ContractStatus: ContractStatus.DRAFT,
      };

      if (isEdit && contract) {
        // Update existing contract
        const result = await contractService.updateContract({
          ...contractData,
          ContractID: contract.ContractID,
        });

        if (result.success) {
          // Update units, charges, and attachments if needed
          // For simplicity, we'll redirect to details page
          toast.success(result.message);
          navigate(`/contracts/${contract.ContractID}`);
        } else {
          toast.error(result.message);
        }
      } else {
        // Create new contract
        const result = await contractService.createContract(contractData);

        if (result.success && result.contractId) {
          // Add units
          for (const unit of data.units) {
            const contractDays = Math.ceil((unit.toDate.getTime() - unit.fromDate.getTime()) / (1000 * 60 * 60 * 24));
            const baseAmount = unit.rentPerMonth * (unit.noOfInstallments || 12);
            const taxAmount = unit.taxPercentage ? (baseAmount * unit.taxPercentage) / 100 : 0;

            const unitData: ContractUnitRequest = {
              ContractID: result.contractId,
              UnitID: parseInt(unit.unitId),
              FromDate: unit.fromDate.toISOString(),
              ToDate: unit.toDate.toISOString(),
              FitoutFromDate: unit.fitoutFromDate?.toISOString(),
              FitoutToDate: unit.fitoutToDate?.toISOString(),
              CommencementDate: unit.commencementDate?.toISOString(),
              ContractDays: contractDays,
              RentPerMonth: unit.rentPerMonth,
              RentPerYear: unit.rentPerYear || unit.rentPerMonth * 12,
              NoOfInstallments: unit.noOfInstallments || 12,
              RentFreePeriodFrom: unit.rentFreePeriodFrom?.toISOString(),
              RentFreePeriodTo: unit.rentFreePeriodTo?.toISOString(),
              RentFreeAmount: unit.rentFreeAmount || 0,
              TaxPercentage: unit.taxPercentage || 0,
              TaxAmount: taxAmount,
              UnitTotalAmount: baseAmount + taxAmount,
            };

            await contractService.addOrUpdateContractUnit(unitData);
          }

          // Add additional charges
          for (const charge of data.additionalCharges || []) {
            const taxAmount = charge.taxPercentage ? (charge.amount * charge.taxPercentage) / 100 : 0;

            const chargeData: ContractAdditionalChargeRequest = {
              ContractID: result.contractId,
              AdditionalChargesID: parseInt(charge.additionalChargesId),
              ChargeAmount: charge.amount,
              ChargeTaxPercentage: charge.taxPercentage || 0,
              ChargeTaxAmount: taxAmount,
              ChargeTotalAmount: charge.amount + taxAmount,
            };

            await contractService.addOrUpdateContractAdditionalCharge(chargeData);
          }

          // Add attachments
          for (const attachment of data.attachments || []) {
            if (attachment.file) {
              const attachmentData: ContractAttachmentRequest = {
                ContractID: result.contractId,
                DocTypeID: parseInt(attachment.docTypeId),
                DocumentName: attachment.documentName,
                DocIssueDate: attachment.docIssueDate?.toISOString(),
                DocExpiryDate: attachment.docExpiryDate?.toISOString(),
                AttachmentRemarks: attachment.remarks?.trim() || undefined,
                FileContent: attachment.file,
                FileContentType: attachment.file?.type,
                FileSize: attachment.file?.size,
              };

              await contractService.addContractAttachment(attachmentData);
            }
          }

          toast.success(result.message);
          navigate(`/contracts/${result.contractId}`);
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

  // Add new unit
  const addUnit = () => {
    appendUnit({
      unitId: "",
      fromDate: new Date(),
      toDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      rentPerMonth: 0,
      rentPerYear: 0,
      noOfInstallments: 12,
      taxPercentage: 0,
    });
  };

  // Remove unit
  const removeUnitItem = (index: number) => {
    if (unitFields.length > 1) {
      removeUnit(index);
    }
  };

  // Add new additional charge
  const addAdditionalCharge = () => {
    appendCharge({
      additionalChargesId: "",
      amount: 0,
      taxPercentage: 0,
    });
  };

  // Remove additional charge
  const removeChargeItem = (index: number) => {
    removeCharge(index);
  };

  // Add new attachment
  const addAttachment = () => {
    appendAttachment({
      docTypeId: "",
      documentName: "",
      remarks: "",
    });
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
  const unitsData = form.watch("units");
  const chargesData = form.watch("additionalCharges") || [];

  const unitsTotal = unitsData.reduce((sum, unit) => {
    const baseAmount = (Number(unit.rentPerMonth) || 0) * (Number(unit.noOfInstallments) || 12);
    const taxAmount = (Number(unit.taxPercentage) || 0) > 0 ? (baseAmount * (Number(unit.taxPercentage) || 0)) / 100 : 0;
    return sum + baseAmount + taxAmount;
  }, 0);

  const chargesTotal = chargesData.reduce((sum, charge) => {
    const baseAmount = Number(charge.amount) || 0;
    const taxAmount = (Number(charge.taxPercentage) || 0) > 0 ? (baseAmount * (Number(charge.taxPercentage) || 0)) / 100 : 0;
    return sum + baseAmount + taxAmount;
  }, 0);

  const grandTotal = unitsTotal + chargesTotal;

  // Handle rental calculation
  const handleRentCalculation = (index: number) => {
    const rentPerMonth = Number(form.getValues(`units.${index}.rentPerMonth`)) || 0;
    const rentPerYear = rentPerMonth * 12;
    form.setValue(`units.${index}.rentPerYear`, rentPerYear);
  };

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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contract Information
              </CardTitle>
              <CardDescription>Enter the basic contract details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField form={form} name="contractNo" label="Contract Number" placeholder="Auto-generated" disabled={isEdit} description="Unique contract number" />
                <FormField form={form} name="transactionDate" label="Transaction Date" type="date" required description="Date of the contract" />
                <div></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="customerId"
                  label="Customer"
                  type="select"
                  options={customers.map((customer) => ({
                    label: `${customer.CustomerNo ? customer.CustomerNo + " - " : ""}${customer.CustomerFullName}`,
                    value: customer.CustomerID.toString(),
                  }))}
                  placeholder="Select customer"
                  required
                  description="Primary customer for this contract"
                />
                <FormField
                  form={form}
                  name="jointCustomerId"
                  label="Joint Customer"
                  type="select"
                  options={customers.map((customer) => ({
                    label: `${customer.CustomerNo ? customer.CustomerNo + " - " : ""}${customer.CustomerFullName}`,
                    value: customer.CustomerID.toString(),
                  }))}
                  placeholder="Select joint customer"
                  description="Optional joint customer"
                />
              </div>

              <FormField form={form} name="remarks" label="Remarks" type="textarea" placeholder="Enter contract remarks" description="Additional notes or comments" />
            </CardContent>
          </Card>

          {/* Contract Details Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
              <CardDescription>Configure contract units, charges, and attachments</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="units">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="units">Units ({unitFields.length})</TabsTrigger>
                  <TabsTrigger value="charges">Additional Charges ({chargeFields.length})</TabsTrigger>
                  <TabsTrigger value="attachments">Attachments ({attachmentFields.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="units" className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Contract Units</h3>
                    <Button type="button" variant="outline" onClick={addUnit}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Unit
                    </Button>
                  </div>

                  {unitFields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building className="mx-auto h-12 w-12 mb-4" />
                      <p>No units added. Click "Add Unit" to include units in the contract.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {unitFields.map((field, index) => (
                        <Card key={field.id} className="border">
                          <CardHeader className="pb-4">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base">Unit {index + 1}</CardTitle>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeUnitItem(index)} disabled={unitFields.length === 1}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                form={form}
                                name={`units.${index}.unitId`}
                                label="Unit"
                                type="select"
                                options={units.map((unit) => ({
                                  label: `${unit.UnitNo} - ${unit.PropertyName || "Property"}`,
                                  value: unit.UnitID.toString(),
                                }))}
                                placeholder="Select unit"
                                required
                              />
                              <FormField form={form} name={`units.${index}.fromDate`} label="From Date" type="date" required />
                              <FormField form={form} name={`units.${index}.toDate`} label="To Date" type="date" required />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                form={form}
                                name={`units.${index}.rentPerMonth`}
                                label="Rent Per Month"
                                type="number"
                                step="0.01"
                                required
                                onChange={() => handleRentCalculation(index)}
                              />
                              <FormField form={form} name={`units.${index}.rentPerYear`} label="Rent Per Year" type="number" step="0.01" disabled />
                              <FormField form={form} name={`units.${index}.noOfInstallments`} label="No. of Installments" type="number" min="1" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField form={form} name={`units.${index}.commencementDate`} label="Commencement Date" type="date" />
                              <FormField form={form} name={`units.${index}.taxPercentage`} label="Tax Percentage" type="number" step="0.01" min="0" max="100" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField form={form} name={`units.${index}.rentFreePeriodFrom`} label="Rent Free From" type="date" />
                              <FormField form={form} name={`units.${index}.rentFreePeriodTo`} label="Rent Free To" type="date" />
                            </div>

                            <FormField form={form} name={`units.${index}.rentFreeAmount`} label="Rent Free Amount" type="number" step="0.01" min="0" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="charges" className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Additional Charges</h3>
                    <Button type="button" variant="outline" onClick={addAdditionalCharge}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Charge
                    </Button>
                  </div>

                  {chargeFields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Receipt className="mx-auto h-12 w-12 mb-4" />
                      <p>No additional charges added. Click "Add Charge" to include charges.</p>
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Charge</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Tax %</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {chargeFields.map((field, index) => (
                            <TableRow key={field.id}>
                              <TableCell>
                                <FormField
                                  form={form}
                                  name={`additionalCharges.${index}.additionalChargesId`}
                                  type="select"
                                  options={additionalCharges.map((charge) => ({
                                    label: `${charge.ChargesCode} - ${charge.ChargesName}`,
                                    value: charge.ChargesID.toString(),
                                  }))}
                                  placeholder="Select charge"
                                  className="min-w-[200px]"
                                />
                              </TableCell>
                              <TableCell>
                                <FormField form={form} name={`additionalCharges.${index}.amount`} type="number" step="0.01" placeholder="0.00" className="w-[120px]" />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  form={form}
                                  name={`additionalCharges.${index}.taxPercentage`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  placeholder="0"
                                  className="w-[80px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeChargeItem(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="attachments" className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Attachments</h3>
                    <Button type="button" variant="outline" onClick={addAttachment}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Attachment
                    </Button>
                  </div>

                  {attachmentFields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 mb-4" />
                      <p>No attachments added. Click "Add Attachment" to upload documents.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {attachmentFields.map((field, index) => (
                        <Card key={field.id} className="border">
                          <CardContent className="p-4">
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
                              <FormField form={form} name={`attachments.${index}.docIssueDate`} label="Issue Date" type="date" />
                              <FormField form={form} name={`attachments.${index}.docExpiryDate`} label="Expiry Date" type="date" />
                            </div>
                            <div className="grid grid-cols-1 gap-4 mb-4">
                              <FormField form={form} name={`attachments.${index}.remarks`} label="Remarks" placeholder="Enter remarks" />
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
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Contract Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Units Total</div>
                  <div className="text-2xl font-bold">{contractService.formatAmount(unitsTotal)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Additional Charges</div>
                  <div className="text-2xl font-bold">{contractService.formatAmount(chargesTotal)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Grand Total</div>
                  <div className="text-3xl font-bold text-green-600">{contractService.formatAmount(grandTotal)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <Card>
            <CardFooter className="flex justify-between">
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
        </form>
      </Form>
    </div>
  );
};

export default LeaseContractForm;
