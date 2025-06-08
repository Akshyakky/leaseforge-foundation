// src/pages/contractInvoice/ContractInvoiceForm.tsx
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
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
  PlusCircle,
  Send,
  Copy,
} from "lucide-react";
import { contractInvoiceService } from "@/services/contractInvoiceService";
import { contractService } from "@/services/contractService";
import { customerService } from "@/services/customerService";
import { unitService } from "@/services/unitService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { currencyService } from "@/services/currencyService";
import { accountService } from "@/services/accountService";
import { taxService } from "@/services/taxService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { useAppSelector } from "@/lib/hooks";
import { differenceInDays, differenceInMonths, addDays, addMonths, format } from "date-fns";
import {
  InvoiceGenerationRequest,
  ContractUnitForInvoice,
  InvoiceUpdateRequest,
  ContractInvoice,
  INVOICE_STATUS,
  INVOICE_TYPE,
  GENERATION_MODE,
} from "@/types/contractInvoiceTypes";

// Enhanced schema for invoice generation form
const contractUnitInvoiceSchema = z.object({
  ContractUnitID: z.number().optional(),
  UnitID: z.string().min(1, "Unit is required"),
  ContractID: z.string().min(1, "Contract is required"),
  PeriodFromDate: z.date({ required_error: "Period from date is required" }),
  PeriodToDate: z.date({ required_error: "Period to date is required" }),
  InvoiceAmount: z.coerce.number().min(0, "Invoice amount must be 0 or greater"),
  TaxPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
  TaxAmount: z.coerce.number().min(0).optional().nullable(),
  DiscountAmount: z.coerce.number().min(0).optional().nullable(),
  TotalAmount: z.coerce.number().min(0, "Total amount must be 0 or greater"),
  RentPerMonth: z.coerce.number().min(0).optional().nullable(),
  RentPerYear: z.coerce.number().min(0).optional().nullable(),
  NoOfInstallments: z.number().optional().nullable(),
  ContractDays: z.number().optional().nullable(),
});

const invoiceSchema = z.object({
  InvoiceNo: z.string().optional(),
  InvoiceDate: z.date().default(() => new Date()),
  DueDate: z.date().optional().nullable(),
  InvoiceType: z.string().default(INVOICE_TYPE.RENT),
  InvoiceStatus: z.string().default(INVOICE_STATUS.DRAFT),
  CompanyID: z.string().min(1, "Company is required"),
  FiscalYearID: z.string().min(1, "Fiscal year is required"),
  CustomerID: z.string().optional(),
  CurrencyID: z.string().optional(),
  ExchangeRate: z.coerce.number().min(0.0001, "Exchange rate must be greater than 0").default(1),
  PaymentTermID: z.string().optional(),
  TaxID: z.string().optional(),
  IsRecurring: z.boolean().default(false),
  RecurrencePattern: z.string().optional(),
  NextInvoiceDate: z.date().optional().nullable(),
  Notes: z.string().optional(),
  InternalNotes: z.string().optional(),
  GenerationMode: z.string().default(GENERATION_MODE.SINGLE),
  AutoNumbering: z.boolean().default(true),
  AutoPost: z.boolean().default(false),
  PostingDate: z.date().optional().nullable(),
  DebitAccountID: z.string().optional(),
  CreditAccountID: z.string().optional(),
  PostingNarration: z.string().optional(),
  contractUnits: z.array(contractUnitInvoiceSchema).min(1, "At least one contract unit is required"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const ContractInvoiceForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [invoice, setInvoice] = useState<ContractInvoice | null>(null);

  // Reference data
  const [companies, setCompanies] = useState<any[]>([]);
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [contractUnits, setContractUnits] = useState<any[]>([]);

  // UI state
  const [showAutoPostOptions, setShowAutoPostOptions] = useState(false);

  // Initialize form
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      InvoiceNo: "",
      InvoiceDate: new Date(),
      InvoiceType: INVOICE_TYPE.RENT,
      InvoiceStatus: INVOICE_STATUS.DRAFT,
      CompanyID: "",
      FiscalYearID: "",
      CustomerID: "",
      CurrencyID: "",
      ExchangeRate: 1,
      PaymentTermID: "",
      TaxID: "",
      IsRecurring: false,
      RecurrencePattern: "",
      Notes: "",
      InternalNotes: "",
      GenerationMode: GENERATION_MODE.SINGLE,
      AutoNumbering: true,
      AutoPost: false,
      contractUnits: [],
    },
  });

  // Setup field arrays
  const contractUnitsFieldArray = useFieldArray({
    control: form.control,
    name: "contractUnits",
  });

  // Calculate totals
  const calculateTotals = () => {
    const formValues = form.getValues();
    let subTotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;
    let grandTotal = 0;

    const roundToTwo = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    if (formValues.contractUnits && formValues.contractUnits.length > 0) {
      formValues.contractUnits.forEach((unit) => {
        const invoiceAmount = unit.InvoiceAmount || 0;
        const taxAmount = unit.TaxAmount || 0;
        const discountAmount = unit.DiscountAmount || 0;
        const totalAmount = unit.TotalAmount || 0;

        subTotal += invoiceAmount;
        taxTotal += taxAmount;
        discountTotal += discountAmount;
        grandTotal += totalAmount;
      });
    }

    return {
      subTotal: roundToTwo(subTotal),
      taxTotal: roundToTwo(taxTotal),
      discountTotal: roundToTwo(discountTotal),
      grandTotal: roundToTwo(grandTotal),
    };
  };

  // Validate form before submission
  const validateFormBeforeSubmit = (data: InvoiceFormValues): string[] => {
    const errors: string[] = [];

    if (!data.CompanyID) {
      errors.push("Company is required");
    }

    if (!data.FiscalYearID) {
      errors.push("Fiscal Year is required");
    }

    if (!data.contractUnits || data.contractUnits.length === 0) {
      errors.push("At least one contract unit is required");
    } else {
      data.contractUnits.forEach((unit, index) => {
        if (!unit.UnitID) {
          errors.push(`Unit ${index + 1}: Unit selection is required`);
        }
        if (!unit.ContractID) {
          errors.push(`Unit ${index + 1}: Contract ID is missing. Please reselect the unit.`);
        }
        if (!unit.PeriodFromDate || !unit.PeriodToDate) {
          errors.push(`Unit ${index + 1}: Invoice period dates are required`);
        }
        if (unit.InvoiceAmount <= 0) {
          errors.push(`Unit ${index + 1}: Invoice amount must be greater than zero`);
        }
      });
    }

    return errors;
  };

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        await fetchReferenceData();

        if (isEdit && id) {
          const invoiceData = await contractInvoiceService.getInvoiceById(parseInt(id));

          if (invoiceData.invoice) {
            setInvoice(invoiceData.invoice);
            populateFormWithInvoiceData(invoiceData.invoice);
          } else {
            toast.error("Invoice not found");
            navigate("/invoices");
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
      const [companiesData, fiscalYearsData, customersData, contractsData, unitsData, currenciesData, accountsData, taxesData] = await Promise.all([
        companyService.getCompaniesForDropdown(true),
        fiscalYearService.getFiscalYearsForDropdown({ filterIsActive: true }),
        customerService.getAllCustomers(),
        contractService.getAllContracts(),
        unitService.getAllUnits(),
        currencyService.getAllCurrencies(),
        accountService.getAllAccounts(),
        taxService.getAllTaxes(),
      ]);

      setCompanies(companiesData);
      setFiscalYears(fiscalYearsData);
      setCustomers(customersData);
      setContracts(contractsData);
      setUnits(unitsData);
      setCurrencies(currenciesData);
      setAccounts(accountsData.filter((acc) => acc.IsActive && acc.IsPostable));
      setPaymentTerms([
        { PaymentTermID: 1, TermName: "Net 30", DaysCount: 30 },
        { PaymentTermID: 2, TermName: "Net 15", DaysCount: 15 },
        { PaymentTermID: 3, TermName: "Net 60", DaysCount: 60 },
        { PaymentTermID: 4, TermName: "Due on Receipt", DaysCount: 0 },
      ]);
      setTaxes(taxesData);

      // Set default values
      if (companiesData.length > 0) {
        const defaultCompany = companiesData[0];
        form.setValue("CompanyID", defaultCompany.CompanyID.toString());
      }

      if (fiscalYearsData.length > 0) {
        const activeFY = fiscalYearsData.find((fy) => fy.IsActive) || fiscalYearsData[0];
        form.setValue("FiscalYearID", activeFY.FiscalYearID.toString());
      }

      if (currenciesData.length > 0) {
        const defaultCurrency = currenciesData.find((c) => c.IsDefault) || currenciesData[0];
        form.setValue("CurrencyID", defaultCurrency.CurrencyID.toString());
      }
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Error loading reference data");
    }
  };

  // Populate form with existing invoice data
  const populateFormWithInvoiceData = (invoiceData: ContractInvoice) => {
    const formattedInvoice = {
      ...invoiceData,
      InvoiceDate: invoiceData.InvoiceDate ? new Date(invoiceData.InvoiceDate) : new Date(),
      DueDate: invoiceData.DueDate ? new Date(invoiceData.DueDate) : null,
      NextInvoiceDate: invoiceData.NextInvoiceDate ? new Date(invoiceData.NextInvoiceDate) : null,
      CompanyID: invoiceData.CompanyID?.toString() || "",
      FiscalYearID: invoiceData.FiscalYearID?.toString() || "",
      CustomerID: invoiceData.CustomerID?.toString() || "",
      CurrencyID: invoiceData.CurrencyID?.toString() || "",
      PaymentTermID: invoiceData.PaymentTermID?.toString() || "",
      TaxID: invoiceData.TaxID?.toString() || "",
    };

    // Create a single contract unit from the invoice data
    const contractUnit = {
      ContractUnitID: invoiceData.ContractUnitID,
      UnitID: invoiceData.ContractUnitID?.toString() || "",
      ContractID: invoiceData.ContractID?.toString() || "",
      PeriodFromDate: invoiceData.PeriodFromDate ? new Date(invoiceData.PeriodFromDate) : new Date(),
      PeriodToDate: invoiceData.PeriodToDate ? new Date(invoiceData.PeriodToDate) : new Date(),
      InvoiceAmount: invoiceData.SubTotal || 0,
      TaxPercentage: 0,
      TaxAmount: invoiceData.TaxAmount || 0,
      DiscountAmount: invoiceData.DiscountAmount || 0,
      TotalAmount: invoiceData.TotalAmount || 0,
      RentPerMonth: 0,
      ContractDays: null,
    };

    form.reset({
      ...formattedInvoice,
      contractUnits: [contractUnit],
    });
  };

  // Enhanced fetchContractUnits function
  const fetchContractUnits = async (customerId?: string, contractId?: string) => {
    try {
      let units: any[] = [];

      if (contractId) {
        // Fetch units for specific contract
        const contractData = await contractService.getContractById(parseInt(contractId));
        if (contractData.contract && contractData.units) {
          units = contractData.units.map((unit) => ({
            ...unit,
            ContractID: contractData.contract!.ContractID,
          }));
        }
      } else if (customerId) {
        // Fetch all contracts for customer and their units
        const customerContracts = await contractService.searchContracts({
          customerID: parseInt(customerId),
        });

        for (const contract of customerContracts) {
          const contractData = await contractService.getContractById(contract.ContractID);
          if (contractData.units) {
            const contractUnitsWithId = contractData.units.map((unit) => ({
              ...unit,
              ContractID: contract.ContractID,
            }));
            units.push(...contractUnitsWithId);
          }
        }
      }

      setContractUnits(units);
    } catch (error) {
      console.error("Error fetching contract units:", error);
      toast.error("Error loading contract units");
    }
  };

  // Auto-calculation effects
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (!name) return;

      const roundToTwo = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

      const getTaxDetails = (taxId: string) => {
        if (!taxId || taxId === "0") return null;
        return taxes.find((tax) => tax.TaxID.toString() === taxId);
      };

      // Auto-calculation for contract units
      if (name.includes("contractUnits.") && name.includes("InvoiceAmount")) {
        const index = parseInt(name.split(".")[1]);
        const units = form.getValues("contractUnits");

        if (units && units[index]) {
          const invoiceAmount = units[index].InvoiceAmount || 0;
          const taxPercentage = units[index].TaxPercentage || 0;
          const discountAmount = units[index].DiscountAmount || 0;

          const taxAmount = roundToTwo((invoiceAmount * taxPercentage) / 100);
          const totalAmount = roundToTwo(invoiceAmount + taxAmount - discountAmount);

          form.setValue(`contractUnits.${index}.TaxAmount`, taxAmount);
          form.setValue(`contractUnits.${index}.TotalAmount`, totalAmount);
        }
      }

      // Auto-calculation when tax percentage changes
      if (name.includes("contractUnits.") && name.includes("TaxPercentage")) {
        const index = parseInt(name.split(".")[1]);
        const units = form.getValues("contractUnits");

        if (units && units[index]) {
          const invoiceAmount = units[index].InvoiceAmount || 0;
          const taxPercentage = units[index].TaxPercentage || 0;
          const discountAmount = units[index].DiscountAmount || 0;

          const taxAmount = roundToTwo((invoiceAmount * taxPercentage) / 100);
          const totalAmount = roundToTwo(invoiceAmount + taxAmount - discountAmount);

          form.setValue(`contractUnits.${index}.TaxAmount`, taxAmount);
          form.setValue(`contractUnits.${index}.TotalAmount`, totalAmount);
        }
      }

      // Auto-calculation when discount changes
      if (name.includes("contractUnits.") && name.includes("DiscountAmount")) {
        const index = parseInt(name.split(".")[1]);
        const units = form.getValues("contractUnits");

        if (units && units[index]) {
          const invoiceAmount = units[index].InvoiceAmount || 0;
          const taxAmount = units[index].TaxAmount || 0;
          const discountAmount = units[index].DiscountAmount || 0;

          const totalAmount = roundToTwo(invoiceAmount + taxAmount - discountAmount);
          form.setValue(`contractUnits.${index}.TotalAmount`, totalAmount);
        }
      }

      // Auto-calculate period amounts when unit or period changes
      if (name.includes("contractUnits.") && (name.includes("UnitID") || name.includes("PeriodFromDate") || name.includes("PeriodToDate"))) {
        const index = parseInt(name.split(".")[1]);
        calculateUnitInvoiceAmount(index);
      }

      // Update contract units when customer changes
      if (name === "CustomerID") {
        const customerId = form.getValues("CustomerID");
        if (customerId) {
          fetchContractUnits(customerId);
        }
      }

      // Calculate due date when invoice date or payment term changes
      if (name === "InvoiceDate" || name === "PaymentTermID") {
        calculateDueDate();
      }
    });

    return () => subscription.unsubscribe();
  }, [form, taxes]);

  // Enhanced auto-populate unit rent values
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
            // Ensure ContractID is properly set
            const contractUnit = contractUnits.find((cu) => cu.UnitID.toString() === unitId);

            if (contractUnit && contractUnit.ContractID) {
              form.setValue(`contractUnits.${index}.ContractID`, contractUnit.ContractID.toString());
            }

            // Set rental values
            if (unitDetails.PerMonth) {
              form.setValue(`contractUnits.${index}.RentPerMonth`, unitDetails.PerMonth);
            }
            if (unitDetails.PerYear) {
              form.setValue(`contractUnits.${index}.RentPerYear`, unitDetails.PerYear);
            }
            if (unitDetails.NoOfInstallmentLease) {
              form.setValue(`contractUnits.${index}.NoOfInstallments`, unitDetails.NoOfInstallmentLease);
            }

            // Trigger amount calculation after setting values
            setTimeout(() => {
              calculateUnitInvoiceAmount(index);
            }, 100);
          }
        } catch (error) {
          console.error("Error fetching unit details:", error);
          toast.error("Error loading unit details");
        }
      }
    };

    const subscription = form.watch((value, { name }) => {
      if (name && name.includes(".UnitID") && value) {
        const index = parseInt(name.split(".")[1]);
        const unitId = form.getValues(`contractUnits.${index}.UnitID`);
        if (unitId) {
          handleUnitChange(unitId, index);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, units, contractUnits]);

  // Calculate unit invoice amount based on contract details and period
  const calculateUnitInvoiceAmount = async (index: number) => {
    try {
      const units = form.getValues("contractUnits");
      if (!units || !units[index]) return;

      const unit = units[index];
      const unitId = unit.UnitID;
      const periodFrom = unit.PeriodFromDate;
      const periodTo = unit.PeriodToDate;

      if (!unitId || !periodFrom || !periodTo) return;

      // Find contract unit details
      const contractUnit = contractUnits.find((cu) => cu.UnitID.toString() === unitId);
      if (!contractUnit) return;

      // Calculate days in period
      const daysInPeriod = differenceInDays(periodTo, periodFrom) + 1;

      // Calculate invoice amount based on contract terms
      const rentPerDay = (contractUnit.RentPerMonth || 0) / 30;
      const invoiceAmount = Math.round(rentPerDay * daysInPeriod * 100) / 100;

      // Update form values
      form.setValue(`contractUnits.${index}.InvoiceAmount`, invoiceAmount);
      form.setValue(`contractUnits.${index}.RentPerMonth`, contractUnit.RentPerMonth || 0);
      form.setValue(`contractUnits.${index}.ContractDays`, daysInPeriod);
      form.setValue(`contractUnits.${index}.ContractID`, contractUnit.ContractID?.toString() || "");

      // Trigger tax calculation
      const taxPercentage = unit.TaxPercentage || 0;
      const taxAmount = Math.round(((invoiceAmount * taxPercentage) / 100) * 100) / 100;
      const totalAmount = Math.round((invoiceAmount + taxAmount - (unit.DiscountAmount || 0)) * 100) / 100;

      form.setValue(`contractUnits.${index}.TaxAmount`, taxAmount);
      form.setValue(`contractUnits.${index}.TotalAmount`, totalAmount);
    } catch (error) {
      console.error("Error calculating unit invoice amount:", error);
    }
  };

  // Calculate due date based on payment terms
  const calculateDueDate = () => {
    const invoiceDate = form.getValues("InvoiceDate");
    const paymentTermId = form.getValues("PaymentTermID");

    if (!invoiceDate) return;

    let dueDate = addDays(invoiceDate, 30); // Default 30 days

    if (paymentTermId) {
      const paymentTerm = paymentTerms.find((pt) => pt.PaymentTermID.toString() === paymentTermId);
      if (paymentTerm && paymentTerm.DaysCount) {
        dueDate = addDays(invoiceDate, paymentTerm.DaysCount);
      }
    }

    form.setValue("DueDate", dueDate);
  };

  // Add new contract unit
  const addContractUnit = () => {
    const fromDate = new Date();
    const toDate = addDays(fromDate, 29); // Default to 30 days

    contractUnitsFieldArray.append({
      UnitID: "",
      ContractID: "",
      PeriodFromDate: fromDate,
      PeriodToDate: toDate,
      InvoiceAmount: 0,
      TaxPercentage: 0,
      TaxAmount: 0,
      DiscountAmount: 0,
      TotalAmount: 0,
      RentPerMonth: 0,
      ContractDays: 30,
    });
  };

  // Handle form submission
  const onSubmit = async (data: InvoiceFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    // Validate form before submission
    const validationErrors = validateFormBeforeSubmit(data);
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    setLoading(true);

    try {
      const totals = calculateTotals();

      // Prepare contract units data
      const contractUnitsData: ContractUnitForInvoice[] = data.contractUnits.map((unit) => ({
        //ContractUnitID: unit.ContractUnitID || 0,
        ContractUnitID: parseInt(unit.UnitID) || 0,
        PeriodFromDate: unit.PeriodFromDate,
        PeriodToDate: unit.PeriodToDate,
        InvoiceAmount: unit.InvoiceAmount,
        TaxPercentage: unit.TaxPercentage,
        TaxAmount: unit.TaxAmount,
        DiscountAmount: unit.DiscountAmount,
        TotalAmount: unit.TotalAmount,
        UnitID: parseInt(unit.UnitID),
        RentPerMonth: unit.RentPerMonth,
        ContractDays: unit.ContractDays,
      }));

      if (isEdit && invoice) {
        // Update existing invoice
        const updateRequest: InvoiceUpdateRequest = {
          LeaseInvoiceID: invoice.LeaseInvoiceID,
          InvoiceNo: data.InvoiceNo,
          InvoiceDate: data.InvoiceDate,
          DueDate: data.DueDate,
          InvoiceType: data.InvoiceType,
          InvoiceStatus: data.InvoiceStatus,
          PeriodFromDate: contractUnitsData[0]?.PeriodFromDate,
          PeriodToDate: contractUnitsData[0]?.PeriodToDate,
          SubTotal: totals.subTotal,
          TaxAmount: totals.taxTotal,
          DiscountAmount: totals.discountTotal,
          TotalAmount: totals.grandTotal,
          CurrencyID: data.CurrencyID ? parseInt(data.CurrencyID) : undefined,
          ExchangeRate: data.ExchangeRate,
          PaymentTermID: data.PaymentTermID ? parseInt(data.PaymentTermID) : undefined,
          TaxID: data.TaxID ? parseInt(data.TaxID) : undefined,
          IsRecurring: data.IsRecurring,
          RecurrencePattern: data.RecurrencePattern,
          NextInvoiceDate: data.NextInvoiceDate,
          Notes: data.Notes,
          InternalNotes: data.InternalNotes,
        };

        const response = await contractInvoiceService.updateInvoice(updateRequest);

        if (response.Status === 1) {
          toast.success("Invoice updated successfully");
          navigate(`/invoices/${invoice.LeaseInvoiceID}`);
        } else {
          toast.error(response.Message || "Failed to update invoice");
        }
      } else {
        // Generate new invoice
        const firstContractUnit = data.contractUnits[0];
        const contractId = firstContractUnit?.ContractID ? parseInt(firstContractUnit.ContractID) : undefined;
        const contractUnitId = firstContractUnit?.UnitID ? parseInt(firstContractUnit.UnitID) : undefined;

        const generationRequest: InvoiceGenerationRequest = {
          CompanyID: parseInt(data.CompanyID),
          FiscalYearID: parseInt(data.FiscalYearID),
          GenerationMode: data.GenerationMode as any,
          InvoiceDate: data.InvoiceDate,
          InvoiceType: data.InvoiceType,
          InvoiceStatus: data.InvoiceStatus,
          CustomerID: data.CustomerID ? parseInt(data.CustomerID) : undefined,
          ContractID: contractId,
          ContractUnitID: contractUnitId,
          PeriodFromDate: contractUnitsData[0]?.PeriodFromDate,
          PeriodToDate: contractUnitsData[0]?.PeriodToDate,
          SubTotal: totals.subTotal,
          TaxAmount: totals.taxTotal,
          DiscountAmount: totals.discountTotal,
          TotalAmount: totals.grandTotal,
          CurrencyID: data.CurrencyID ? parseInt(data.CurrencyID) : undefined,
          ExchangeRate: data.ExchangeRate,
          PaymentTermID: data.PaymentTermID ? parseInt(data.PaymentTermID) : undefined,
          TaxID: data.TaxID ? parseInt(data.TaxID) : undefined,
          IsRecurring: data.IsRecurring,
          RecurrencePattern: data.RecurrencePattern,
          NextInvoiceDate: data.NextInvoiceDate,
          Notes: data.Notes,
          InternalNotes: data.InternalNotes,
          AutoNumbering: data.AutoNumbering,
          AutoPost: data.AutoPost,
          PostingDate: data.PostingDate,
          DebitAccountID: data.DebitAccountID ? parseInt(data.DebitAccountID) : undefined,
          CreditAccountID: data.CreditAccountID ? parseInt(data.CreditAccountID) : undefined,
          PostingNarration: data.PostingNarration,
          ContractUnits: contractUnitsData.length > 1 ? contractUnitsData : undefined,
        };

        // Enhanced validation before calling service
        if (!generationRequest.ContractID && !generationRequest.ContractUnitID) {
          toast.error("Please select a valid contract unit. Contract ID or Contract Unit ID is required.");
          setLoading(false);
          return;
        }

        const response =
          data.GenerationMode === GENERATION_MODE.SINGLE || contractUnitsData.length === 1
            ? await contractInvoiceService.generateSingleInvoice(generationRequest)
            : await contractInvoiceService.generateBatchInvoices(generationRequest);

        if (response.Status === 1) {
          if (response.NewInvoiceID) {
            toast.success("Invoice generated successfully");
            navigate(`/invoices/${response.NewInvoiceID}`);
          } else if (response.GeneratedCount) {
            toast.success(`Generated ${response.GeneratedCount} invoices successfully`);
            navigate("/invoices");
          }
        } else {
          toast.error(response.Message || "Failed to generate invoice");
        }
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to save invoice");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    if (isEdit && invoice) {
      form.reset();
    } else {
      form.reset({
        InvoiceNo: "",
        InvoiceDate: new Date(),
        InvoiceType: INVOICE_TYPE.RENT,
        InvoiceStatus: INVOICE_STATUS.DRAFT,
        CompanyID: companies.length > 0 ? companies[0].CompanyID.toString() : "",
        FiscalYearID: fiscalYears.length > 0 ? fiscalYears[0].FiscalYearID.toString() : "",
        CustomerID: "",
        CurrencyID: currencies.length > 0 ? currencies[0].CurrencyID.toString() : "",
        ExchangeRate: 1,
        PaymentTermID: "",
        TaxID: "",
        IsRecurring: false,
        RecurrencePattern: "",
        Notes: "",
        InternalNotes: "",
        GenerationMode: GENERATION_MODE.SINGLE,
        AutoNumbering: true,
        AutoPost: false,
        contractUnits: [],
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

  // Get unit details
  const getUnitDetails = (unitId: string) => {
    if (!unitId) return null;
    return contractUnits.find((unit) => unit.UnitID === parseInt(unitId));
  };

  // Get contract details
  const getContractDetails = (contractId: string) => {
    if (!contractId) return null;
    return contracts.find((contract) => contract.ContractID === parseInt(contractId));
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { subTotal, taxTotal, discountTotal, grandTotal } = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Invoice" : "Generate Invoice"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Invoice Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Invoice Information
              </CardTitle>
              <CardDescription>Enter the basic invoice details and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  form={form}
                  name="InvoiceNo"
                  label="Invoice Number"
                  placeholder="Auto-generated if left empty"
                  description="Leave blank for auto-generated invoice number"
                />
                <FormField form={form} name="InvoiceDate" label="Invoice Date" type="date" required description="Date of invoice generation" />
                <FormField form={form} name="DueDate" label="Due Date" type="date" description="Payment due date (auto-calculated from payment terms)" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  form={form}
                  name="InvoiceType"
                  label="Invoice Type"
                  type="select"
                  options={Object.values(INVOICE_TYPE).map((type) => ({
                    label: type,
                    value: type,
                  }))}
                  placeholder="Select invoice type"
                  required
                />
                <FormField
                  form={form}
                  name="InvoiceStatus"
                  label="Invoice Status"
                  type="select"
                  options={Object.values(INVOICE_STATUS).map((status) => ({
                    label: status,
                    value: status,
                  }))}
                  placeholder="Select status"
                  required
                />
                <FormField
                  form={form}
                  name="GenerationMode"
                  label="Generation Mode"
                  type="select"
                  options={Object.values(GENERATION_MODE).map((mode) => ({
                    label: mode,
                    value: mode,
                  }))}
                  placeholder="Select generation mode"
                  required
                  description="Single for one unit, Multiple for batch generation"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  description="Company for the invoice"
                />
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
                  description="Fiscal year for the invoice"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="CustomerID"
                  label="Customer"
                  type="select"
                  options={customers.map((customer) => ({
                    label: customer.CustomerFullName,
                    value: customer.CustomerID.toString(),
                  }))}
                  placeholder="Select customer (optional for batch)"
                  description="Customer for the invoice"
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
                  description="Invoice currency"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField form={form} name="ExchangeRate" label="Exchange Rate" type="number" step="0.0001" placeholder="1.0000" description="Exchange rate to base currency" />
                <FormField
                  form={form}
                  name="PaymentTermID"
                  label="Payment Terms"
                  type="select"
                  options={paymentTerms.map((term) => ({
                    label: term.TermName,
                    value: term.PaymentTermID.toString(),
                  }))}
                  placeholder="Select payment terms"
                  description="Payment terms for due date calculation"
                />
                <FormField
                  form={form}
                  name="TaxID"
                  label="Default Tax"
                  type="select"
                  options={taxes.map((tax) => ({
                    label: `${tax.TaxName} (${tax.TaxRate}%)`,
                    value: tax.TaxID.toString(),
                  }))}
                  placeholder="Select default tax"
                  description="Default tax rate for units"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="auto-numbering" checked={form.watch("AutoNumbering")} onCheckedChange={(checked) => form.setValue("AutoNumbering", checked as boolean)} />
                  <Label htmlFor="auto-numbering">Auto-generate invoice number</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-post"
                    checked={form.watch("AutoPost")}
                    onCheckedChange={(checked) => {
                      form.setValue("AutoPost", checked as boolean);
                      setShowAutoPostOptions(checked as boolean);
                    }}
                  />
                  <Label htmlFor="auto-post">Auto-post to general ledger</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="is-recurring" checked={form.watch("IsRecurring")} onCheckedChange={(checked) => form.setValue("IsRecurring", checked as boolean)} />
                  <Label htmlFor="is-recurring">Recurring invoice</Label>
                </div>
              </div>

              {/* Auto-posting options */}
              {showAutoPostOptions && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">Auto-Posting Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField form={form} name="PostingDate" label="Posting Date" type="date" description="Date for posting entries" />
                    <FormField
                      form={form}
                      name="DebitAccountID"
                      label="Debit Account"
                      type="select"
                      options={accounts
                        .filter((acc) => acc.AccountCode.startsWith("1"))
                        .map((account) => ({
                          label: `${account.AccountCode} - ${account.AccountName}`,
                          value: account.AccountID.toString(),
                        }))}
                      placeholder="Select debit account"
                      description="Account to debit (typically Accounts Receivable)"
                    />
                    <FormField
                      form={form}
                      name="CreditAccountID"
                      label="Credit Account"
                      type="select"
                      options={accounts
                        .filter((acc) => acc.AccountCode.startsWith("4"))
                        .map((account) => ({
                          label: `${account.AccountCode} - ${account.AccountName}`,
                          value: account.AccountID.toString(),
                        }))}
                      placeholder="Select credit account"
                      description="Account to credit (typically Revenue account)"
                    />
                  </div>
                  <FormField
                    form={form}
                    name="PostingNarration"
                    label="Posting Narration"
                    type="textarea"
                    placeholder="Enter posting narration"
                    description="Description for the posting entries"
                  />
                </div>
              )}

              {/* Recurring options */}
              {form.watch("IsRecurring") && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">Recurring Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      form={form}
                      name="RecurrencePattern"
                      label="Recurrence Pattern"
                      type="select"
                      options={[
                        { label: "Monthly", value: "Monthly" },
                        { label: "Quarterly", value: "Quarterly" },
                        { label: "Annual", value: "Annual" },
                        { label: "Custom", value: "Custom" },
                      ]}
                      placeholder="Select pattern"
                      description="How often to generate invoice"
                    />
                    <FormField form={form} name="NextInvoiceDate" label="Next Invoice Date" type="date" description="Date for next automatic generation" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField form={form} name="Notes" label="Notes" type="textarea" placeholder="Enter invoice notes" description="Notes visible to customer" />
                <FormField
                  form={form}
                  name="InternalNotes"
                  label="Internal Notes"
                  type="textarea"
                  placeholder="Enter internal notes"
                  description="Internal notes (not visible to customer)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Invoice Summary
              </CardTitle>
              <CardDescription>Live calculation of invoice totals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Sub Total</span>
                  </div>
                  <div className="text-2xl font-bold">{subTotal.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{contractUnitsFieldArray.fields.length} units</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Tax Amount</span>
                  </div>
                  <div className="text-2xl font-bold">{taxTotal.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total tax</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Discount</span>
                  </div>
                  <div className="text-2xl font-bold">{discountTotal.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total discount</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-muted-foreground">Grand Total</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{grandTotal.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Final amount</div>
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
                  <CardDescription>Add units to be invoiced with detailed period and amount information</CardDescription>
                </div>
                <Button type="button" onClick={addContractUnit}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Unit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {contractUnitsFieldArray.fields.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No units have been added to this invoice yet.</p>
                  <Button type="button" variant="outline" onClick={addContractUnit}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Unit
                  </Button>
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {contractUnitsFieldArray.fields.map((field, index) => {
                    const unitId = form.watch(`contractUnits.${index}.UnitID`);
                    const contractId = form.watch(`contractUnits.${index}.ContractID`);
                    const unitDetails = getUnitDetails(unitId);
                    const contractDetails = getContractDetails(contractId);

                    return (
                      <AccordionItem key={field.id} value={`unit-${index}`} className="border rounded-lg mb-4">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <Building className="h-5 w-5 text-muted-foreground" />
                              <div className="text-left">
                                <div className="font-medium">{unitDetails ? `${unitDetails.UnitNo} - ${unitDetails.PropertyName}` : `Unit ${index + 1}`}</div>
                                <div className="text-sm text-muted-foreground">{contractDetails && `Contract: ${contractDetails.ContractNo}`}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-muted-foreground">
                                {form.watch(`contractUnits.${index}.PeriodFromDate`) && form.watch(`contractUnits.${index}.PeriodToDate`) ? (
                                  <span>
                                    {formatDate(form.watch(`contractUnits.${index}.PeriodFromDate`))} - {formatDate(form.watch(`contractUnits.${index}.PeriodToDate`))}
                                  </span>
                                ) : (
                                  "Period not set"
                                )}
                              </div>
                              <div className="font-medium">
                                {form.watch(`contractUnits.${index}.TotalAmount`) ? form.watch(`contractUnits.${index}.TotalAmount`).toLocaleString() : "0"}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-6">
                            <div className="flex justify-end">
                              <Button type="button" variant="destructive" size="sm" onClick={() => contractUnitsFieldArray.remove(index)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Unit
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                form={form}
                                name={`contractUnits.${index}.UnitID`}
                                label="Select Unit"
                                type="select"
                                options={contractUnits.map((unit) => ({
                                  label: `${unit.UnitNo} - ${unit.PropertyName}`,
                                  value: unit.UnitID.toString(),
                                }))}
                                placeholder="Choose a unit"
                                required
                              />
                              <FormField
                                form={form}
                                name={`contractUnits.${index}.ContractID`}
                                label="Contract"
                                type="select"
                                options={contracts.map((contract) => ({
                                  label: `${contract.ContractNo} - ${contract.CustomerName}`,
                                  value: contract.ContractID.toString(),
                                }))}
                                placeholder="Select contract"
                                description="Auto-filled when unit is selected"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                form={form}
                                name={`contractUnits.${index}.PeriodFromDate`}
                                label="Period From Date"
                                type="date"
                                required
                                description="Invoice period start date"
                              />
                              <FormField
                                form={form}
                                name={`contractUnits.${index}.PeriodToDate`}
                                label="Period To Date"
                                type="date"
                                required
                                description="Invoice period end date"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                form={form}
                                name={`contractUnits.${index}.InvoiceAmount`}
                                label="Invoice Amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                required
                                description="Base invoice amount (auto-calculated)"
                              />
                              <FormField
                                form={form}
                                name={`contractUnits.${index}.TaxPercentage`}
                                label="Tax %"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                description="Tax percentage"
                              />
                              <FormField
                                form={form}
                                name={`contractUnits.${index}.TaxAmount`}
                                label="Tax Amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                description="Auto-calculated tax amount"
                                disabled
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                form={form}
                                name={`contractUnits.${index}.DiscountAmount`}
                                label="Discount Amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                description="Discount amount (if any)"
                              />
                              <FormField
                                form={form}
                                name={`contractUnits.${index}.TotalAmount`}
                                label="Total Amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                required
                                description="Final amount for this unit"
                                disabled
                              />
                            </div>

                            {unitDetails && (
                              <div className="p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-medium mb-2">Unit Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Property:</span>
                                    <div>{unitDetails.PropertyName}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Unit Type:</span>
                                    <div>{unitDetails.UnitTypeName}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Monthly Rent:</span>
                                    <div>{form.watch(`contractUnits.${index}.RentPerMonth`)?.toLocaleString() || "0"}</div>
                                  </div>
                                </div>
                              </div>
                            )}
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
                <Button type="button" variant="outline" onClick={() => navigate("/invoices")} disabled={loading}>
                  Cancel
                </Button>
                <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
              <Button type="submit" disabled={loading || contractUnitsFieldArray.fields.length === 0}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEdit ? "Updating..." : "Generating..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEdit ? "Update Invoice" : "Generate Invoice"}
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

export default ContractInvoiceForm;
