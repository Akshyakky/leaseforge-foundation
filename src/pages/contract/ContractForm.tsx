// src/pages/contract/ContractForm.tsx
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
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
  Upload,
  FileText,
  Building,
  Users,
  DollarSign,
  Calendar,
  Calculator,
  AlertCircle,
  CheckCircle,
  Info,
  RotateCcw,
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
  Remarks: z.string().optional(),
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
});

type ContractFormValues = z.infer<typeof contractSchema>;

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

    // Round to 2 decimal places
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

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        await fetchReferenceData();

        if (isEdit && id) {
          const contractData = await contractService.getContractById(parseInt(id));

          if (contractData.contract) {
            setContract(contractData.contract);

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

  // Auto-calculation effects
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (!name) return;

      // Helper function to round to 2 decimal places
      const roundToTwo = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

      // Helper function to get tax details
      const getTaxDetails = (taxId: string) => {
        if (!taxId || taxId === "0") return null;
        return taxes.find((tax) => tax.TaxID.toString() === taxId);
      };

      // 1. Auto-calculate yearly rent based on monthly rent
      if (name.includes("RentPerMonth") && name.includes("units.")) {
        const index = parseInt(name.split(".")[1]);
        const units = form.getValues("units");

        if (units && units[index]) {
          const monthlyRent = units[index].RentPerMonth || 0;
          const installments = units[index].NoOfInstallments || 12;
          const yearlyRent = roundToTwo(monthlyRent * installments);

          form.setValue(`units.${index}.RentPerYear`, yearlyRent);

          // Trigger tax recalculation
          const taxId = units[index].TaxID;
          if (taxId && taxId !== "0") {
            const selectedTax = getTaxDetails(taxId);
            if (selectedTax) {
              const taxAmount = roundToTwo((yearlyRent * selectedTax.TaxRate) / 100);
              form.setValue(`units.${index}.TaxAmount`, taxAmount);
              form.setValue(`units.${index}.TotalAmount`, roundToTwo(yearlyRent + taxAmount));
            }
          } else {
            form.setValue(`units.${index}.TaxAmount`, 0);
            form.setValue(`units.${index}.TotalAmount`, yearlyRent);
          }
        }
      }

      // 2. Auto-calculate number of installments based on yearly/monthly rent
      if (name.includes("NoOfInstallments") && name.includes("units.")) {
        const index = parseInt(name.split(".")[1]);
        const units = form.getValues("units");

        if (units && units[index]) {
          const monthlyRent = units[index].RentPerMonth || 0;
          const installments = units[index].NoOfInstallments || 12;
          const yearlyRent = roundToTwo(monthlyRent * installments);

          form.setValue(`units.${index}.RentPerYear`, yearlyRent);

          // Trigger tax recalculation
          const taxId = units[index].TaxID;
          if (taxId && taxId !== "0") {
            const selectedTax = getTaxDetails(taxId);
            if (selectedTax) {
              const taxAmount = roundToTwo((yearlyRent * selectedTax.TaxRate) / 100);
              form.setValue(`units.${index}.TaxAmount`, taxAmount);
              form.setValue(`units.${index}.TotalAmount`, roundToTwo(yearlyRent + taxAmount));
            }
          } else {
            form.setValue(`units.${index}.TaxAmount`, 0);
            form.setValue(`units.${index}.TotalAmount`, yearlyRent);
          }
        }
      }

      // 3. Auto-calculate contract duration
      if ((name.includes("FromDate") || name.includes("ToDate")) && name.includes("units.")) {
        const index = parseInt(name.split(".")[1]);
        const units = form.getValues("units");

        if (units && units[index]) {
          const fromDate = units[index].FromDate;
          const toDate = units[index].ToDate;

          if (fromDate && toDate && toDate >= fromDate) {
            const totalDays = differenceInDays(toDate, fromDate);
            const totalMonths = differenceInMonths(toDate, fromDate);
            const totalYears = differenceInYears(toDate, fromDate);

            form.setValue(`units.${index}.ContractDays`, totalDays);
            form.setValue(`units.${index}.ContractMonths`, totalMonths);
            form.setValue(`units.${index}.ContractYears`, totalYears);
          }
        }
      }

      // 4. Handle tax changes for units
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

      // 5. Handle direct yearly rent changes for units
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

      // 6. Handle tax changes for additional charges
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

      // 7. Handle amount changes for additional charges
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

      // 8. Handle additional charge selection (AdditionalChargesID changes)
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

  // Auto-populate unit rent values
  useEffect(() => {
    const handleUnitChange = async (unitId: string, index: number) => {
      if (unitId) {
        try {
          let unitDetails = units.find((u) => u.UnitID.toString() === unitId);

          if (!unitDetails) {
            const { unit } = await unitService.getUnitById(parseInt(unitId));
            unitDetails = unit;
          }

          if (unitDetails) {
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

    const subscription = form.watch((value, { name }) => {
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

  // Add new items
  const addUnit = () => {
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
    });
  };

  const addCharge = () => {
    chargesFieldArray.append({
      AdditionalChargesID: "",
      Amount: 0,
      TaxPercentage: 0,
      TaxAmount: 0,
      TotalAmount: 0,
    });
  };

  const addAttachment = () => {
    attachmentsFieldArray.append({
      DocTypeID: "",
      DocumentName: "",
      DocIssueDate: new Date(),
      DocExpiryDate: null,
      Remarks: "",
    });
  };

  // Handle form submission
  const onSubmit = async (data: ContractFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    setLoading(true);

    try {
      const totals = calculateTotals();

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

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      form.setValue(`attachments.${index}.file`, file);

      if (!form.getValues(`attachments.${index}.DocumentName`)) {
        form.setValue(`attachments.${index}.DocumentName`, file.name);
      }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/contracts")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Contract" : "Create Contract"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Contract Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Contract Information
              </CardTitle>
              <CardDescription>Enter the basic contract details and customer information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  form={form}
                  name="ContractNo"
                  label="Contract Number"
                  placeholder="Auto-generated if left empty"
                  description="Leave blank for auto-generated contract number"
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
                />
                <FormField form={form} name="TransactionDate" label="Transaction Date" type="date" required description="Date of contract creation" />
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
                />
              </div>

              <FormField
                form={form}
                name="Remarks"
                label="Contract Remarks"
                type="textarea"
                placeholder="Enter contract remarks or additional notes"
                description="Additional notes about this contract"
              />
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
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
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

          {/* Contract Units */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    Contract Units
                  </CardTitle>
                  <CardDescription>Add rental units to this contract with detailed terms</CardDescription>
                </div>
                <Button type="button" onClick={addUnit}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Unit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {unitsFieldArray.fields.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No units have been added to this contract yet.</p>
                  <Button type="button" variant="outline" onClick={addUnit}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Unit
                  </Button>
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {unitsFieldArray.fields.map((field, index) => {
                    const unitId = form.watch(`units.${index}.UnitID`);
                    const unitDetails = getUnitDetails(unitId);

                    return (
                      <AccordionItem key={field.id} value={`unit-${index}`} className="border rounded-lg mb-4">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <Building className="h-5 w-5 text-muted-foreground" />
                              <div className="text-left">
                                <div className="font-medium">{unitDetails ? `${unitDetails.UnitNo} - ${unitDetails.PropertyName}` : `Unit ${index + 1}`}</div>
                                <div className="text-sm text-muted-foreground">{unitDetails && `${unitDetails.UnitTypeName} • ${unitDetails.UnitCategoryName}`}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-muted-foreground">
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
                          <div className="space-y-6">
                            <div className="flex justify-end">
                              <Button type="button" variant="destructive" size="sm" onClick={() => unitsFieldArray.remove(index)}>
                                <Trash2 className="h-4 w-4 mr-2" />
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
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField form={form} name={`units.${index}.FromDate`} label="From Date" type="date" required description="Contract start date" />
                              <FormField form={form} name={`units.${index}.ToDate`} label="To Date" type="date" required description="Contract end date" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField form={form} name={`units.${index}.FitoutFromDate`} label="Fitout From Date" type="date" description="Optional fitout start date" />
                              <FormField form={form} name={`units.${index}.FitoutToDate`} label="Fitout To Date" type="date" description="Optional fitout end date" />
                            </div>

                            <FormField form={form} name={`units.${index}.CommencementDate`} label="Commencement Date" type="date" description="Date when occupancy begins" />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <FormField form={form} name={`units.${index}.ContractDays`} label="Contract Days" type="number" disabled description="Auto-calculated" />
                              <FormField form={form} name={`units.${index}.ContractMonths`} label="Contract Months" type="number" disabled description="Auto-calculated" />
                              <FormField form={form} name={`units.${index}.ContractYears`} label="Contract Years" type="number" disabled description="Auto-calculated" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField form={form} name={`units.${index}.RentPerMonth`} label="Monthly Rent" type="number" step="0.01" placeholder="0.00" required />
                              <FormField
                                form={form}
                                name={`units.${index}.RentPerYear`}
                                label="Yearly Rent"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                required
                                description="Auto-calculated from monthly rent"
                              />
                            </div>

                            <FormField
                              form={form}
                              name={`units.${index}.NoOfInstallments`}
                              label="Number of Installments"
                              type="number"
                              placeholder="12"
                              description="Payment frequency per year"
                            />

                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">Rent-Free Period (Optional)</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField form={form} name={`units.${index}.RentFreePeriodFrom`} label="Rent-Free From" type="date" />
                                <FormField form={form} name={`units.${index}.RentFreePeriodTo`} label="Rent-Free To" type="date" />
                              </div>
                              <FormField form={form} name={`units.${index}.RentFreeAmount`} label="Rent-Free Amount" type="number" step="0.01" placeholder="0.00" />
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-500" />
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

          {/* Additional Charges */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Additional Charges
                  </CardTitle>
                  <CardDescription>Add extra charges like maintenance, parking, utilities, etc.</CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={addCharge}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Charge
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {chargesFieldArray.fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="mx-auto h-8 w-8 mb-4 text-muted-foreground/50" />
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
                              <DollarSign className="h-5 w-5 text-muted-foreground" />
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
                              <Button type="button" variant="destructive" size="sm" onClick={() => chargesFieldArray.remove(index)}>
                                <Trash2 className="h-4 w-4 mr-2" />
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
                            />

                            <FormField form={form} name={`additionalCharges.${index}.Amount`} label="Charge Amount" type="number" step="0.01" placeholder="0.00" required />

                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-500" />
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

          {/* Attachments */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Contract Attachments
                  </CardTitle>
                  <CardDescription>Upload supporting documents and files for this contract</CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={addAttachment}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Attachment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {attachmentsFieldArray.fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-8 w-8 mb-4 text-muted-foreground/50" />
                  <p>No documents have been attached yet.</p>
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {attachmentsFieldArray.fields.map((field, index) => {
                    const docTypeId = form.watch(`attachments.${index}.DocTypeID`);
                    const docDetails = docTypeId ? docTypes.find((dt) => dt.DocTypeID.toString() === docTypeId) : null;

                    return (
                      <AccordionItem key={field.id} value={`attachment-${index}`} className="border rounded-lg mb-4">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div className="text-left">
                                <div className="font-medium">{form.watch(`attachments.${index}.DocumentName`) || `Document ${index + 1}`}</div>
                                <div className="text-sm text-muted-foreground">{docDetails ? docDetails.Description : "No type selected"}</div>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-6">
                            <div className="flex justify-end">
                              <Button type="button" variant="destructive" size="sm" onClick={() => attachmentsFieldArray.remove(index)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Attachment
                              </Button>
                            </div>

                            <FormField
                              form={form}
                              name={`attachments.${index}.DocTypeID`}
                              label="Document Type"
                              type="select"
                              options={docTypes.map((docType) => ({
                                label: docType.Description,
                                value: docType.DocTypeID.toString(),
                              }))}
                              placeholder="Select document type"
                              required
                            />

                            <FormField form={form} name={`attachments.${index}.DocumentName`} label="Document Name" placeholder="Enter document name" required />

                            <div className="space-y-2">
                              <label className="text-sm font-medium">Document File</label>
                              <div className="flex items-center gap-4">
                                <input
                                  type="file"
                                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                                  onChange={(e) => handleFileChange(e, index)}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <Button type="button" variant="outline" size="icon" onClick={() => (document.querySelector(`input[type="file"]`) as HTMLInputElement)?.click()}>
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground">Upload document file (PDF, Word, Excel, or images)</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField form={form} name={`attachments.${index}.DocIssueDate`} label="Issue Date" type="date" description="Date when document was issued" />
                              <FormField form={form} name={`attachments.${index}.DocExpiryDate`} label="Expiry Date" type="date" description="Date when document expires" />
                            </div>

                            <FormField form={form} name={`attachments.${index}.Remarks`} label="Document Remarks" type="textarea" placeholder="Enter remarks about this document" />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
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
                <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
              <Button type="submit" disabled={loading || unitsFieldArray.fields.length === 0}>
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
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default ContractForm;
