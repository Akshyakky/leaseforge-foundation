// src/pages/contract/ContractForm.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, RotateCcw, Plus, Trash2, FileText, Building, DollarSign } from "lucide-react";
import { contractService, Contract } from "@/services/contractService";
import { customerService } from "@/services/customerService";
import { unitService } from "@/services/unitService";
import { additionalChargesService } from "@/services/additionalChargesService";
import { docTypeService } from "@/services/docTypeService";
import { toast } from "sonner";
import { useAppSelector } from "@/lib/hooks";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { differenceInDays, differenceInMonths, differenceInYears, format } from "date-fns";
import { Tax, taxService } from "@/services";

// Create schema for contract form validation
const contractSchema = z.object({
  ContractNo: z.string().optional(),
  ContractStatus: z.string().default("Draft"),
  CustomerID: z.string().min(1, "Customer is required"),
  JointCustomerID: z.string().optional(),
  TransactionDate: z.date().default(() => new Date()),
  Remarks: z.string().optional(),

  units: z
    .array(
      z.object({
        ContractUnitID: z.number().optional(),
        UnitID: z.string().min(1, "Unit is required"),
        FromDate: z.date({
          required_error: "From date is required",
        }),
        ToDate: z.date({
          required_error: "To date is required",
        }),
        FitoutFromDate: z.date().optional().nullable(),
        FitoutToDate: z.date().optional().nullable(),
        CommencementDate: z.date().optional().nullable(),
        ContractDays: z.number().optional().nullable(),
        ContractMonths: z.number().optional().nullable(),
        ContractYears: z.number().optional().nullable(),
        RentPerMonth: z
          .number({
            required_error: "Monthly rent is required",
          })
          .min(0),
        RentPerYear: z
          .number({
            required_error: "Yearly rent is required",
          })
          .min(0),
        NoOfInstallments: z.number().optional().nullable(),
        RentFreePeriodFrom: z.date().optional().nullable(),
        RentFreePeriodTo: z.date().optional().nullable(),
        RentFreeAmount: z.number().optional().nullable(),
        TaxID: z.string().optional(),
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

  additionalCharges: z
    .array(
      z.object({
        ContractAdditionalChargeID: z.number().optional(),
        AdditionalChargesID: z.string().min(1, "Charge is required"),
        Amount: z
          .number({
            required_error: "Amount is required",
          })
          .min(0),
        TaxID: z.string().optional(), // Add TaxID field for reference to tax master
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
        ContractAttachmentID: z.number().optional(),
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

type ContractFormValues = z.infer<typeof contractSchema>;

const ContractForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [contract, setContract] = useState<Contract | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  // Reference data
  const [customers, setCustomers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);

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
    },
  });

  // Setup field arrays for units, charges, and attachments
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

    // Calculate unit totals
    if (formValues.units && formValues.units.length > 0) {
      unitTotal = formValues.units.reduce((sum, unit) => sum + (unit.TotalAmount || 0), 0);
    }

    // Calculate charges totals
    if (formValues.additionalCharges && formValues.additionalCharges.length > 0) {
      chargesTotal = formValues.additionalCharges.reduce((sum, charge) => sum + (charge.TotalAmount || 0), 0);
    }

    return {
      unitTotal,
      chargesTotal,
      grandTotal: unitTotal + chargesTotal,
    };
  };

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Fetch reference data in parallel
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

        // If editing, fetch the contract data
        if (isEdit && id) {
          const contractData = await contractService.getContractById(parseInt(id));

          if (contractData.contract) {
            setContract(contractData.contract);

            // Format data for form
            const formattedContract = {
              ...contractData.contract,
              TransactionDate: contractData.contract.TransactionDate ? new Date(contractData.contract.TransactionDate) : new Date(),
              CustomerID: contractData.contract.CustomerID?.toString() || "",
              JointCustomerID: contractData.contract.JointCustomerID?.toString() || "",
            };

            // Format units
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

            // Format charges
            const formattedCharges = contractData.additionalCharges.map((charge) => ({
              ...charge,
              AdditionalChargesID: charge.AdditionalChargesID?.toString() || "",
            }));

            // Format attachments
            const formattedAttachments = contractData.attachments.map((attachment) => ({
              ...attachment,
              DocTypeID: attachment.DocTypeID?.toString() || "",
              DocIssueDate: attachment.DocIssueDate ? new Date(attachment.DocIssueDate) : null,
              DocExpiryDate: attachment.DocExpiryDate ? new Date(attachment.DocExpiryDate) : null,
            }));

            // Set form values
            form.reset({
              ...formattedContract,
              units: formattedUnits,
              additionalCharges: formattedCharges,
              attachments: formattedAttachments,
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

  // Effect to auto-calculate tax and total amount when unit rent changes
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Auto-calculate yearly rent based on monthly rent
      if (name && name.includes("RentPerMonth")) {
        const index = parseInt(name.split(".")[1]);
        const units = form.getValues("units");
        if (units && units[index]) {
          const monthlyRent = units[index].RentPerMonth || 0;
          const installments = units[index].NoOfInstallments || 12;

          // Calculate yearly rent based on monthly rent and installments
          form.setValue(`units.${index}.RentPerYear`, monthlyRent * installments);
        }
      }

      // Auto-calculate unit total amount based on rent and tax
      if (name && (name.includes("RentPerYear") || name.includes("TaxPercentage"))) {
        const index = parseInt(name.split(".")[1]);
        const units = form.getValues("units");
        if (units && units[index]) {
          const rentPerYear = units[index].RentPerYear || 0;
          const taxPercent = units[index].TaxPercentage || 0;
          const taxAmount = (rentPerYear * taxPercent) / 100;
          form.setValue(`units.${index}.TaxAmount`, taxAmount);
          form.setValue(`units.${index}.TotalAmount`, rentPerYear + taxAmount);
        }
      }

      if (name && (name.includes(".FromDate") || name.includes(".ToDate"))) {
        const index = parseInt(name.split(".")[1]);
        const units = form.getValues("units");

        if (units && units[index]) {
          const fromDate = units[index].FromDate;
          const toDate = units[index].ToDate;

          if (fromDate && toDate && toDate >= fromDate) {
            // Calculate total days, months, and years between dates
            const totalDays = differenceInDays(toDate, fromDate);
            const totalMonths = differenceInMonths(toDate, fromDate);
            const totalYears = differenceInYears(toDate, fromDate);

            // Update form values with total counts
            form.setValue(`units.${index}.ContractDays`, totalDays);
            form.setValue(`units.${index}.ContractMonths`, totalMonths);
            form.setValue(`units.${index}.ContractYears`, totalYears);
          }
        }
      }
      if (name && name.includes(".TaxID")) {
        const index = parseInt(name.split(".")[1]);
        const itemType = name.split(".")[0]; // "units" or "additionalCharges"

        if (itemType === "units") {
          const units = form.getValues("units");
          const taxId = units[index].TaxID;

          if (taxId) {
            // Find the selected tax
            const selectedTax = taxes.find((tax) => tax.TaxID.toString() === taxId);

            if (selectedTax) {
              // Update the tax percentage based on the selected tax
              form.setValue(`units.${index}.TaxPercentage`, selectedTax.TaxRate);

              // Recalculate tax amount and total
              const rentPerYear = units[index].RentPerYear || 0;
              const taxAmount = (rentPerYear * selectedTax.TaxRate) / 100;
              form.setValue(`units.${index}.TaxAmount`, taxAmount);
              form.setValue(`units.${index}.TotalAmount`, rentPerYear + taxAmount);
            }
          }
        } else if (itemType === "additionalCharges") {
          const charges = form.getValues("additionalCharges");
          const taxId = charges[index].TaxID;

          if (taxId) {
            // Find the selected tax
            const selectedTax = taxes.find((tax) => tax.TaxID.toString() === taxId);

            if (selectedTax) {
              // Update the tax percentage based on the selected tax
              form.setValue(`additionalCharges.${index}.TaxPercentage`, selectedTax.TaxRate);

              // Recalculate tax amount and total
              const amount = charges[index].Amount || 0;
              const taxAmount = (amount * selectedTax.TaxRate) / 100;
              form.setValue(`additionalCharges.${index}.TaxAmount`, taxAmount);
              form.setValue(`additionalCharges.${index}.TotalAmount`, amount + taxAmount);
            }
          }
        }
      }
      if (name && (name.includes("RentPerYear") || name.includes(".Amount"))) {
        const index = parseInt(name.split(".")[1]);
        const itemType = name.split(".")[0]; // "units" or "additionalCharges"

        if (itemType === "units") {
          const units = form.getValues("units");
          if (units && units[index]) {
            const rentPerYear = units[index].RentPerYear || 0;
            const taxId = units[index].TaxID;

            if (taxId) {
              const selectedTax = taxes.find((tax) => tax.TaxID.toString() === taxId);
              if (selectedTax) {
                const taxRate = selectedTax.TaxRate;
                const taxAmount = (rentPerYear * taxRate) / 100;
                form.setValue(`units.${index}.TaxAmount`, taxAmount);
                form.setValue(`units.${index}.TotalAmount`, rentPerYear + taxAmount);
              }
            }
          }
        } else if (itemType === "additionalCharges") {
          const charges = form.getValues("additionalCharges");
          if (charges && charges[index]) {
            const amount = charges[index].Amount || 0;
            const taxId = charges[index].TaxID;

            if (taxId) {
              const selectedTax = taxes.find((tax) => tax.TaxID.toString() === taxId);
              if (selectedTax) {
                const taxRate = selectedTax.TaxRate;
                const taxAmount = (amount * taxRate) / 100;
                form.setValue(`additionalCharges.${index}.TaxAmount`, taxAmount);
                form.setValue(`additionalCharges.${index}.TotalAmount`, amount + taxAmount);
              }
            }
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, taxes]);

  useEffect(() => {
    const handleUnitChange = async (unitId: string, index: number) => {
      if (unitId) {
        try {
          // Find unit in already loaded units first
          let unitDetails = units.find((u) => u.UnitID.toString() === unitId);

          // If not found, fetch the unit details from the API
          if (!unitDetails) {
            const { unit } = await unitService.getUnitById(parseInt(unitId));
            unitDetails = unit;
          }

          if (unitDetails) {
            // Populate rent values from the selected unit
            if (unitDetails.PerMonth) {
              form.setValue(`units.${index}.RentPerMonth`, unitDetails.PerMonth);
            }

            if (unitDetails.PerYear) {
              form.setValue(`units.${index}.RentPerYear`, unitDetails.PerYear);
            }

            if (unitDetails.NoOfInstallmentLease) {
              form.setValue(`units.${index}.NoOfInstallments`, unitDetails.NoOfInstallmentLease);
            }
          }
        } catch (error) {
          console.error("Error fetching unit details:", error);
        }
      }
    };

    // Subscribe to changes in unit selection
    const subscription = form.watch((value, { name, type }) => {
      // When a unit is selected
      if (name && name.includes(".UnitID") && value) {
        const index = parseInt(name.split(".")[1]);
        const unitId = form.getValues(`units.${index}.UnitID`);
        if (unitId) {
          handleUnitChange(unitId, index);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, units]);

  // Add a new unit to the contract
  const addUnit = () => {
    const fromDate = new Date();
    const toDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));

    // Calculate contract duration values
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
      // Include calculated duration values
      ContractDays: totalDays,
      ContractMonths: totalMonths,
      ContractYears: totalYears,
    });

    // Switch to units tab
    setActiveTab("units");
  };
  // Add a new charge to the contract
  const addCharge = () => {
    chargesFieldArray.append({
      AdditionalChargesID: "",
      Amount: 0,
      TaxPercentage: 0,
      TaxAmount: 0,
      TotalAmount: 0,
    });

    // Switch to charges tab
    setActiveTab("charges");
  };

  // Add a new attachment to the contract
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
  const onSubmit = async (data: ContractFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    setLoading(true);

    try {
      // Calculate totals
      const totals = calculateTotals();

      // Prepare contract data
      const contractData = {
        contract: {
          ContractNo: data.ContractNo,
          ContractStatus: data.ContractStatus,
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
          Remarks: attachment.Remarks,
          file: attachment.file,
        })),
      };

      if (isEdit && contract) {
        // Update existing contract
        const response = await contractService.updateContract({
          ...contractData,
          contract: {
            ...contractData.contract,
            ContractID: contract.ContractID,
          },
        });

        if (response.Status === 1) {
          toast.success("Contract updated successfully");
          navigate(`/contracts/${contract.ContractID}`);
        } else {
          toast.error(response.Message || "Failed to update contract");
        }
      } else {
        // Create new contract
        const response = await contractService.createContract(contractData);

        if (response.Status === 1 && response.NewContractID) {
          toast.success("Contract created successfully");
          navigate(`/contracts/${response.NewContractID}`);
        } else {
          toast.error(response.Message || "Failed to create contract");
        }
      }
    } catch (error) {
      console.error("Error saving contract:", error);
      toast.error("Failed to save contract");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
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
      });
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    navigate("/contracts");
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

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { unitTotal, chargesTotal, grandTotal } = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/contracts")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Contract" : "Create Contract"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-[400px]">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="units">Units ({unitsFieldArray.fields.length})</TabsTrigger>
                <TabsTrigger value="charges">Charges ({chargesFieldArray.fields.length})</TabsTrigger>
                <TabsTrigger value="attachments">Attachments ({attachmentsFieldArray.fields.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>{isEdit ? "Edit Contract" : "Create New Contract"}</CardTitle>
                    <CardDescription>{isEdit ? "Update contract information" : "Enter contract details"}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="ContractNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contract No.</FormLabel>
                            <FormControl>
                              <Input placeholder="Auto-generated if left empty" {...field} />
                            </FormControl>
                            <FormDescription>Optional. Leave blank for auto-generated contract number.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ContractStatus"
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
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Expired">Expired</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Terminated">Terminated</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="TransactionDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Transaction Date</FormLabel>
                          <FormControl>
                            <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="CustomerID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a customer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers.map((customer) => (
                                <SelectItem key={customer.CustomerID} value={customer.CustomerID.toString()}>
                                  {customer.CustomerFullName}
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
                      name="JointCustomerID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Joint Customer (Optional)</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a joint customer (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">None</SelectItem>
                              {customers
                                .filter((c) => c.CustomerID.toString() !== form.getValues("CustomerID"))
                                .map((customer) => (
                                  <SelectItem key={customer.CustomerID} value={customer.CustomerID.toString()}>
                                    {customer.CustomerFullName}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Optional. Select a joint customer for shared contracts.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="Remarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remarks</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter remarks or additional notes" className="min-h-[100px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-lg">Contract Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Units Total</div>
                          <div className="text-2xl font-bold">{unitTotal.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Additional Charges</div>
                          <div className="text-2xl font-bold">{chargesTotal.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Grand Total</div>
                          <div className="text-2xl font-bold">{grandTotal.toLocaleString()}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="units">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Units</CardTitle>
                      <CardDescription>Add rental units to this contract</CardDescription>
                    </div>
                    <Button type="button" onClick={addUnit}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Unit
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {unitsFieldArray.fields.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No units have been added to this contract yet. Click "Add Unit" to add one.</div>
                    ) : (
                      <Accordion type="multiple" className="w-full">
                        {unitsFieldArray.fields.map((field, index) => {
                          const unitId = form.watch(`units.${index}.UnitID`);
                          const unitDetails = getUnitDetails(unitId);

                          return (
                            <AccordionItem key={field.id} value={`item-${index}`} className="border rounded-lg mb-4">
                              <AccordionTrigger className="px-4">
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center">
                                    <Building className="h-5 w-5 mr-2 text-muted-foreground" />
                                    <span className="font-medium">{unitDetails ? `${unitDetails.UnitNo} - ${unitDetails.PropertyName}` : `Unit ${index + 1}`}</span>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <div className="text-sm text-muted-foreground">
                                      {form.watch(`units.${index}.FromDate`) && form.watch(`units.${index}.ToDate`) ? (
                                        <span>
                                          {formatDate(form.watch(`units.${index}.FromDate`))} - {formatDate(form.watch(`units.${index}.ToDate`))}
                                        </span>
                                      ) : (
                                        "Period not set"
                                      )}
                                    </div>
                                    <div className="font-medium">{form.watch(`units.${index}.TotalAmount`) ? form.watch(`units.${index}.TotalAmount`).toLocaleString() : "0"}</div>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4">
                                <div className="space-y-4">
                                  <div className="flex justify-end">
                                    <Button type="button" variant="destructive" size="sm" onClick={() => unitsFieldArray.remove(index)}>
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Remove Unit
                                    </Button>
                                  </div>

                                  <FormField
                                    control={form.control}
                                    name={`units.${index}.UnitID`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Unit</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select a unit" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {units.map((unit) => (
                                              <SelectItem key={unit.UnitID} value={unit.UnitID.toString()}>
                                                {unit.UnitNo} - {unit.PropertyName} ({unit.UnitTypeName})
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={form.control}
                                      name={`units.${index}.FromDate`}
                                      render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                          <FormLabel>From Date</FormLabel>
                                          <FormControl>
                                            <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={form.control}
                                      name={`units.${index}.ToDate`}
                                      render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                          <FormLabel>To Date</FormLabel>
                                          <FormControl>
                                            <DatePicker
                                              value={field.value}
                                              onChange={field.onChange}
                                              disabled={(date) => {
                                                const fromDate = form.watch(`units.${index}.FromDate`);
                                                return fromDate ? date < fromDate : false;
                                              }}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={form.control}
                                      name={`units.${index}.FitoutFromDate`}
                                      render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                          <FormLabel>Fitout From Date (Optional)</FormLabel>
                                          <FormControl>
                                            <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={form.control}
                                      name={`units.${index}.FitoutToDate`}
                                      render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                          <FormLabel>Fitout To Date (Optional)</FormLabel>
                                          <FormControl>
                                            <DatePicker
                                              value={field.value}
                                              onChange={field.onChange}
                                              disabled={(date) => {
                                                const fitoutFromDate = form.watch(`units.${index}.FitoutFromDate`);
                                                return fitoutFromDate ? date < fitoutFromDate : false;
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
                                    name={`units.${index}.CommencementDate`}
                                    render={({ field }) => (
                                      <FormItem className="flex flex-col">
                                        <FormLabel>Commencement Date</FormLabel>
                                        <FormControl>
                                          <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="grid grid-cols-3 gap-4">
                                    <FormField
                                      control={form.control}
                                      name={`units.${index}.ContractDays`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Contract Days</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              placeholder="0"
                                              {...field}
                                              readOnly
                                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={form.control}
                                      name={`units.${index}.ContractMonths`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Contract Months</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              placeholder="0"
                                              {...field}
                                              readOnly
                                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={form.control}
                                      name={`units.${index}.ContractYears`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Contract Years</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              placeholder="0"
                                              {...field}
                                              readOnly
                                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={form.control}
                                      name={`units.${index}.RentPerMonth`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Rent Per Month</FormLabel>
                                          <FormControl>
                                            <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={form.control}
                                      name={`units.${index}.RentPerYear`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Rent Per Year</FormLabel>
                                          <FormControl>
                                            <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>

                                  <FormField
                                    control={form.control}
                                    name={`units.${index}.NoOfInstallments`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Number of Installments</FormLabel>
                                        <FormControl>
                                          <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="space-y-2">
                                    <div>
                                      <FormLabel>Rent-Free Period (Optional)</FormLabel>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <FormField
                                        control={form.control}
                                        name={`units.${index}.RentFreePeriodFrom`}
                                        render={({ field }) => (
                                          <FormItem className="flex flex-col">
                                            <FormLabel className="text-xs">From Date</FormLabel>
                                            <FormControl>
                                              <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={form.control}
                                        name={`units.${index}.RentFreePeriodTo`}
                                        render={({ field }) => (
                                          <FormItem className="flex flex-col">
                                            <FormLabel className="text-xs">To Date</FormLabel>
                                            <FormControl>
                                              <DatePicker
                                                value={field.value}
                                                onChange={field.onChange}
                                                disabled={(date) => {
                                                  const rentFreeFrom = form.watch(`units.${index}.RentFreePeriodFrom`);
                                                  return rentFreeFrom ? date < rentFreeFrom : false;
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
                                      name={`units.${index}.RentFreeAmount`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Rent-Free Amount</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              placeholder="0.00"
                                              {...field}
                                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>

                                  <div className="space-y-4">
                                    <FormField
                                      control={form.control}
                                      name={`units.${index}.TaxID`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Applicable Tax</FormLabel>
                                          <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select a tax" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              <SelectItem value="0">No Tax</SelectItem>
                                              {taxes.map((tax) => (
                                                <SelectItem key={tax.TaxID} value={tax.TaxID.toString()}>
                                                  {tax.TaxName} ({tax.TaxCode}) - {tax.IsExemptOrZero ? "Exempt" : `${tax.TaxRate}%`}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <FormDescription>Select the applicable tax for this unit</FormDescription>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                      <FormField
                                        control={form.control}
                                        name={`units.${index}.TaxPercentage`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Tax Rate (%)</FormLabel>
                                            <FormControl>
                                              <Input type="number" placeholder="0.00" {...field} disabled />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={form.control}
                                        name={`units.${index}.TaxAmount`}
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
                                  </div>

                                  <FormField
                                    control={form.control}
                                    name={`units.${index}.TotalAmount`}
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
                          );
                        })}
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="charges">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Additional Charges</CardTitle>
                      <CardDescription>Add additional charges to this contract</CardDescription>
                    </div>
                    <Button type="button" onClick={addCharge}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Charge
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {chargesFieldArray.fields.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No additional charges have been added to this contract yet. Click "Add Charge" to add one.</div>
                    ) : (
                      <Accordion type="multiple" className="w-full">
                        {chargesFieldArray.fields.map((field, index) => {
                          const chargeId = form.watch(`additionalCharges.${index}.AdditionalChargesID`);
                          const chargeDetails = chargeId ? charges.find((c) => c.ChargesID.toString() === chargeId) : null;

                          return (
                            <AccordionItem key={field.id} value={`charge-${index}`} className="border rounded-lg mb-4">
                              <AccordionTrigger className="px-4">
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center">
                                    <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
                                    <span className="font-medium">{chargeDetails ? chargeDetails.ChargesName : `Charge ${index + 1}`}</span>
                                  </div>
                                  <div className="font-medium">
                                    {form.watch(`additionalCharges.${index}.TotalAmount`) ? form.watch(`additionalCharges.${index}.TotalAmount`).toLocaleString() : "0"}
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4">
                                <div className="space-y-4">
                                  <div className="flex justify-end">
                                    <Button type="button" variant="destructive" size="sm" onClick={() => chargesFieldArray.remove(index)}>
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Remove Charge
                                    </Button>
                                  </div>

                                  <FormField
                                    control={form.control}
                                    name={`additionalCharges.${index}.AdditionalChargesID`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Charge</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select a charge" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {charges.map((charge) => (
                                              <SelectItem key={charge.ChargesID} value={charge.ChargesID.toString()}>
                                                {charge.ChargesName} - {charge.ChargesCategoryName}
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
                                    name={`additionalCharges.${index}.Amount`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Amount</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            placeholder="0.00"
                                            {...field}
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              field.onChange(value === "" ? 0 : parseFloat(value));
                                            }}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="space-y-4">
                                    <FormField
                                      control={form.control}
                                      name={`additionalCharges.${index}.TaxID`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Applicable Tax</FormLabel>
                                          <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select a tax" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              <SelectItem value="0">No Tax</SelectItem>
                                              {taxes.map((tax) => (
                                                <SelectItem key={tax.TaxID} value={tax.TaxID.toString()}>
                                                  {tax.TaxName} ({tax.TaxCode}) - {tax.IsExemptOrZero ? "Exempt" : `${tax.TaxRate}%`}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <FormDescription>Select the applicable tax for this charge</FormDescription>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                      <FormField
                                        control={form.control}
                                        name={`additionalCharges.${index}.TaxPercentage`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Tax Rate (%)</FormLabel>
                                            <FormControl>
                                              <Input type="number" placeholder="0.00" {...field} disabled />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={form.control}
                                        name={`additionalCharges.${index}.TaxAmount`}
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
                                  </div>

                                  <FormField
                                    control={form.control}
                                    name={`additionalCharges.${index}.TotalAmount`}
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
                          );
                        })}
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
                      <CardDescription>Add documents to this contract</CardDescription>
                    </div>
                    <Button type="button" onClick={addAttachment}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Attachment
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {attachmentsFieldArray.fields.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No documents have been attached to this contract yet. Click "Add Attachment" to add one.</div>
                    ) : (
                      <Accordion type="multiple" className="w-full">
                        {attachmentsFieldArray.fields.map((field, index) => {
                          const docTypeId = form.watch(`attachments.${index}.DocTypeID`);
                          const docDetails = docTypeId ? docTypes.find((dt) => dt.DocTypeID.toString() === docTypeId) : null;

                          return (
                            <AccordionItem key={field.id} value={`attachment-${index}`} className="border rounded-lg mb-4">
                              <AccordionTrigger className="px-4">
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center">
                                    <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                                    <span className="font-medium">{form.watch(`attachments.${index}.DocumentName`) || `Document ${index + 1}`}</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">{docDetails ? docDetails.Description : ""}</div>
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
                          );
                        })}
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
                    {isEdit ? "Update Contract" : "Create Contract"}
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

export default ContractForm;
