// src/pages/invoice/LeaseInvoiceForm.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, RotateCcw, Plus, Trash2, FileText, Calculator, Calendar, Building, DollarSign } from "lucide-react";
import { leaseInvoiceService } from "@/services/leaseInvoiceService";
import { contractService } from "@/services/contractService";
import { customerService } from "@/services/customerService";
import { unitService } from "@/services/unitService";
import { taxService } from "@/services/taxService";
import { additionalChargesService } from "@/services/additionalChargesService";
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
import { format, addMonths } from "date-fns";
import { LeaseInvoice } from "@/types/leaseInvoiceTypes";

// Create schema for invoice form validation
const invoiceSchema = z.object({
  InvoiceNo: z.string().optional(),
  InvoiceDate: z.date().default(() => new Date()),
  DueDate: z.date({
    required_error: "Due date is required",
  }),
  ContractID: z.string().min(1, "Contract is required"),
  ContractUnitID: z.string().min(1, "Unit is required"),
  CustomerID: z.string().min(1, "Customer is required"),
  InvoiceStatus: z.string().default("Draft"),
  InvoiceType: z.string().min(1, "Invoice type is required"),
  InvoicePeriodFrom: z.date().optional().nullable(),
  InvoicePeriodTo: z.date().optional().nullable(),
  InvoiceAmount: z.number().min(0, "Invoice amount must be at least 0"),
  TaxID: z.string().optional(),
  TaxPercentage: z.number().optional().nullable(),
  TaxAmount: z.number().optional().nullable(),
  AdditionalCharges: z.number().optional().nullable(),
  DiscountAmount: z.number().optional().nullable(),
  TotalAmount: z.number().min(0, "Total amount must be at least 0"),
  Notes: z.string().optional(),

  additionalChargeItems: z
    .array(
      z.object({
        AdditionalChargesID: z.string().min(1, "Charge is required"),
        ChargeAmount: z.number().min(0, "Amount must be at least 0"),
        TaxPercentage: z.number().optional().nullable(),
        TaxAmount: z.number().optional().nullable(),
        TotalAmount: z.number().min(0, "Total amount must be at least 0"),
      })
    )
    .optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const LeaseInvoiceForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const contractIdFromQuery = queryParams.get("contractId");
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit || !!contractIdFromQuery);
  const [invoice, setInvoice] = useState<LeaseInvoice | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  // Reference data
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractUnits, setContractUnits] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [additionalCharges, setAdditionalCharges] = useState<any[]>([]);
  const [selectedContractData, setSelectedContractData] = useState<any>(null);

  // Invoice type options
  const invoiceTypeOptions = ["Rent", "Service Charge", "Utility", "Security Deposit", "Admin Fee", "Other"];

  // Initialize form
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      InvoiceNo: "",
      InvoiceDate: new Date(),
      DueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Default due date is 30 days from today
      ContractID: contractIdFromQuery || "",
      ContractUnitID: "",
      CustomerID: "",
      InvoiceStatus: "Draft",
      InvoiceType: "Rent",
      InvoicePeriodFrom: null,
      InvoicePeriodTo: null,
      InvoiceAmount: 0,
      TaxID: "",
      TaxPercentage: null,
      TaxAmount: null,
      AdditionalCharges: 0,
      DiscountAmount: 0,
      TotalAmount: 0,
      Notes: "",
      additionalChargeItems: [],
    },
  });

  // Setup field array for additional charges
  const additionalChargeItems = useFieldArray({
    control: form.control,
    name: "additionalChargeItems",
  });

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Fetch reference data in parallel
        const [contractsData, customersData, taxesData, chargesData] = await Promise.all([
          contractService.getAllContracts(),
          customerService.getAllCustomers(),
          taxService.getAllTaxes(),
          additionalChargesService.getAllCharges(),
        ]);

        setContracts(contractsData);
        setCustomers(customersData);
        setTaxes(taxesData);
        setAdditionalCharges(chargesData);

        // If editing, fetch the invoice data
        if (isEdit && id) {
          const invoiceData = await leaseInvoiceService.getInvoiceById(parseInt(id));

          if (invoiceData.invoice) {
            setInvoice(invoiceData.invoice);

            // Get contract units for the selected contract
            if (invoiceData.invoice.ContractID) {
              const contractDetails = await contractService.getContractById(invoiceData.invoice.ContractID);
              if (contractDetails.contract) {
                setSelectedContractData(contractDetails.contract);
                setContractUnits(contractDetails.units);
              }
            }

            // Format data for form
            const formattedInvoice = {
              ...invoiceData.invoice,
              InvoiceDate: invoiceData.invoice.InvoiceDate ? new Date(invoiceData.invoice.InvoiceDate) : new Date(),
              DueDate: invoiceData.invoice.DueDate ? new Date(invoiceData.invoice.DueDate) : new Date(),
              InvoicePeriodFrom: invoiceData.invoice.InvoicePeriodFrom ? new Date(invoiceData.invoice.InvoicePeriodFrom) : null,
              InvoicePeriodTo: invoiceData.invoice.InvoicePeriodTo ? new Date(invoiceData.invoice.InvoicePeriodTo) : null,
              ContractID: invoiceData.invoice.ContractID?.toString() || "",
              ContractUnitID: invoiceData.invoice.ContractUnitID?.toString() || "",
              CustomerID: invoiceData.invoice.CustomerID?.toString() || "",
              TaxID: invoiceData.invoice.TaxID?.toString() || "",
            };

            // Set initial form values
            form.reset(formattedInvoice);
          } else {
            toast.error("Invoice not found");
            navigate("/invoices");
          }
        }
        // If creating from a contract
        else if (contractIdFromQuery) {
          const contractId = parseInt(contractIdFromQuery);
          const contractDetails = await contractService.getContractById(contractId);

          if (contractDetails.contract) {
            setSelectedContractData(contractDetails.contract);
            setContractUnits(contractDetails.units);

            // Set contract and customer values
            form.setValue("ContractID", contractIdFromQuery);
            form.setValue("CustomerID", contractDetails.contract.CustomerID.toString());

            // If there's only one unit, select it automatically
            if (contractDetails.units.length === 1) {
              form.setValue("ContractUnitID", contractDetails.units[0].ContractUnitID.toString());
            }
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
  }, [id, isEdit, contractIdFromQuery, navigate, form]);

  // Handle contract change
  const handleContractChange = async (contractId: string) => {
    if (!contractId) {
      setSelectedContractData(null);
      setContractUnits([]);
      form.setValue("CustomerID", "");
      form.setValue("ContractUnitID", "");
      return;
    }

    try {
      const contractDetails = await contractService.getContractById(parseInt(contractId));
      if (contractDetails.contract) {
        setSelectedContractData(contractDetails.contract);
        setContractUnits(contractDetails.units);

        // Set customer value based on contract
        form.setValue("CustomerID", contractDetails.contract.CustomerID.toString());

        // Reset contract unit
        form.setValue("ContractUnitID", "");

        // If there's only one unit, select it automatically
        if (contractDetails.units.length === 1) {
          form.setValue("ContractUnitID", contractDetails.units[0].ContractUnitID.toString());
        }
      }
    } catch (error) {
      console.error("Error fetching contract details:", error);
      toast.error("Failed to fetch contract details");
    }
  };

  // Handle unit change
  const handleUnitChange = (unitId: string) => {
    if (!unitId || !contractUnits.length) return;

    const selectedUnit = contractUnits.find((unit) => unit.ContractUnitID.toString() === unitId);
    if (selectedUnit) {
      // Set invoice amount based on unit rent
      if (selectedUnit.RentPerMonth) {
        form.setValue("InvoiceAmount", selectedUnit.RentPerMonth);
        calculateTotals();
      }
    }
  };

  // Handle invoice type change
  const handleInvoiceTypeChange = (type: string) => {
    // Set period based on invoice type
    const today = new Date();

    if (type === "Rent") {
      // For rent, set period to current month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      form.setValue("InvoicePeriodFrom", startOfMonth);
      form.setValue("InvoicePeriodTo", endOfMonth);
    } else if (type === "Service Charge" || type === "Utility") {
      // Set last month as default period
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      form.setValue("InvoicePeriodFrom", startOfLastMonth);
      form.setValue("InvoicePeriodTo", endOfLastMonth);
    } else {
      // Clear period for other types
      form.setValue("InvoicePeriodFrom", null);
      form.setValue("InvoicePeriodTo", null);
    }
  };

  // Handle tax change
  const handleTaxChange = (taxId: string) => {
    if (!taxId) {
      form.setValue("TaxPercentage", null);
      form.setValue("TaxAmount", null);
      calculateTotals();
      return;
    }

    const selectedTax = taxes.find((tax) => tax.TaxID.toString() === taxId);
    if (selectedTax) {
      form.setValue("TaxPercentage", selectedTax.TaxRate);
      calculateTotals();
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const invoiceAmount = form.getValues("InvoiceAmount") || 0;
    const taxPercentage = form.getValues("TaxPercentage") || 0;
    const taxAmount = (invoiceAmount * taxPercentage) / 100;
    form.setValue("TaxAmount", taxAmount);

    // Calculate additional charges total
    let additionalChargesTotal = 0;
    const chargeItems = form.getValues("additionalChargeItems") || [];
    chargeItems.forEach((item) => {
      additionalChargesTotal += item.TotalAmount || 0;
    });

    form.setValue("AdditionalCharges", additionalChargesTotal);

    const discountAmount = form.getValues("DiscountAmount") || 0;
    const totalAmount = invoiceAmount + taxAmount + additionalChargesTotal - discountAmount;

    form.setValue("TotalAmount", totalAmount);
  };

  // Effect to recalculate when values change
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === "InvoiceAmount" || name === "TaxPercentage" || name === "DiscountAmount") {
        calculateTotals();
      }

      // If any additional charge items change
      if (name && name.startsWith("additionalChargeItems")) {
        calculateTotals();
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Add additional charge item
  const addAdditionalCharge = () => {
    additionalChargeItems.append({
      AdditionalChargesID: "",
      ChargeAmount: 0,
      TaxPercentage: 0,
      TaxAmount: 0,
      TotalAmount: 0,
    });

    // Switch to charges tab
    setActiveTab("charges");
  };

  // Handle additional charge selection
  const handleAdditionalChargeSelect = (chargeId: string, index: number) => {
    if (!chargeId) return;

    const selectedCharge = additionalCharges.find((charge) => charge.ChargesID.toString() === chargeId);
    if (selectedCharge) {
      // Set amount based on charge definition
      form.setValue(`additionalChargeItems.${index}.ChargeAmount`, selectedCharge.ChargeAmount || 0);

      // Set tax if applicable
      if (selectedCharge.TaxID) {
        const chargeTax = taxes.find((tax) => tax.TaxID === selectedCharge.TaxID);
        if (chargeTax) {
          form.setValue(`additionalChargeItems.${index}.TaxPercentage`, chargeTax.TaxRate || 0);
        }
      } else {
        form.setValue(`additionalChargeItems.${index}.TaxPercentage`, 0);
      }

      // Calculate charge total
      const chargeAmount = form.getValues(`additionalChargeItems.${index}.ChargeAmount`) || 0;
      const taxPercentage = form.getValues(`additionalChargeItems.${index}.TaxPercentage`) || 0;
      const taxAmount = (chargeAmount * taxPercentage) / 100;

      form.setValue(`additionalChargeItems.${index}.TaxAmount`, taxAmount);
      form.setValue(`additionalChargeItems.${index}.TotalAmount`, chargeAmount + taxAmount);

      // Update invoice totals
      calculateTotals();
    }
  };

  // Recalculate charge tax and total when charge amount or tax percentage changes
  const updateChargeCalculation = (index: number) => {
    const chargeAmount = form.getValues(`additionalChargeItems.${index}.ChargeAmount`) || 0;
    const taxPercentage = form.getValues(`additionalChargeItems.${index}.TaxPercentage`) || 0;
    const taxAmount = (chargeAmount * taxPercentage) / 100;

    form.setValue(`additionalChargeItems.${index}.TaxAmount`, taxAmount);
    form.setValue(`additionalChargeItems.${index}.TotalAmount`, chargeAmount + taxAmount);

    // Update invoice totals
    calculateTotals();
  };

  // Handle form submission
  const onSubmit = async (data: InvoiceFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    setLoading(true);

    try {
      // Prepare additional charges
      const additionalChargesList =
        data.additionalChargeItems?.map((item) => ({
          ChargeID: parseInt(item.AdditionalChargesID),
          ChargeName: additionalCharges.find((charge) => charge.ChargesID.toString() === item.AdditionalChargesID)?.ChargesName || "",
          ChargeAmount: item.ChargeAmount,
          TaxPercentage: item.TaxPercentage,
          TaxAmount: item.TaxAmount,
          TotalAmount: item.TotalAmount,
        })) || [];

      // Prepare invoice data
      const invoiceData = {
        invoice: {
          InvoiceNo: data.InvoiceNo,
          InvoiceDate: data.InvoiceDate,
          DueDate: data.DueDate,
          ContractID: parseInt(data.ContractID),
          ContractUnitID: parseInt(data.ContractUnitID),
          CustomerID: parseInt(data.CustomerID),
          InvoiceStatus: data.InvoiceStatus,
          InvoiceType: data.InvoiceType,
          InvoicePeriodFrom: data.InvoicePeriodFrom,
          InvoicePeriodTo: data.InvoicePeriodTo,
          InvoiceAmount: data.InvoiceAmount,
          TaxID: data.TaxID ? parseInt(data.TaxID) : undefined,
          TaxPercentage: data.TaxPercentage,
          TaxAmount: data.TaxAmount,
          AdditionalCharges: data.AdditionalCharges,
          DiscountAmount: data.DiscountAmount,
          TotalAmount: data.TotalAmount,
          PaidAmount: 0, // New invoices have no payments
          BalanceAmount: data.TotalAmount, // Balance equals total for new invoices
          Notes: data.Notes,
        },
        additionalCharges: additionalChargesList,
      };

      if (isEdit && invoice) {
        // Update existing invoice
        const response = await leaseInvoiceService.updateInvoice({
          ...invoiceData,
          invoice: {
            ...invoiceData.invoice,
            InvoiceID: invoice.InvoiceID,
            PaidAmount: invoice.PaidAmount || 0,
            BalanceAmount: data.TotalAmount - (invoice.PaidAmount || 0),
          },
        });

        if (response.Status === 1) {
          toast.success("Invoice updated successfully");
          navigate(`/invoices/${invoice.InvoiceID}`);
        } else {
          toast.error(response.Message || "Failed to update invoice");
        }
      } else {
        // Create new invoice
        const response = await leaseInvoiceService.createInvoice(invoiceData);

        if (response.Status === 1 && response.NewInvoiceID) {
          toast.success("Invoice created successfully");
          navigate(`/invoices/${response.NewInvoiceID}`);
        } else {
          toast.error(response.Message || "Failed to create invoice");
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
        DueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        ContractID: contractIdFromQuery || "",
        ContractUnitID: "",
        CustomerID: "",
        InvoiceStatus: "Draft",
        InvoiceType: "Rent",
        InvoicePeriodFrom: null,
        InvoicePeriodTo: null,
        InvoiceAmount: 0,
        TaxID: "",
        TaxPercentage: null,
        TaxAmount: null,
        AdditionalCharges: 0,
        DiscountAmount: 0,
        TotalAmount: 0,
        Notes: "",
        additionalChargeItems: [],
      });
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    navigate("/invoices");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Invoice" : "Create Invoice"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-[400px]">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="charges">Additional Charges ({additionalChargeItems.fields.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>{isEdit ? "Edit Invoice" : "Create New Invoice"}</CardTitle>
                    <CardDescription>{isEdit ? "Update invoice information" : "Enter invoice details"}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="InvoiceNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice No.</FormLabel>
                            <FormControl>
                              <Input placeholder="Auto-generated if left empty" {...field} disabled={isEdit} />
                            </FormControl>
                            <FormDescription>Optional. Leave blank for auto-generated invoice number.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="InvoiceStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange} disabled={isEdit && invoice?.InvoiceStatus !== "Draft"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Posted">Posted</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="InvoiceDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Invoice Date</FormLabel>
                            <FormControl>
                              <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="DueDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Due Date</FormLabel>
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
                        name="ContractID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contract</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleContractChange(value);
                              }}
                              disabled={isEdit}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select contract" />
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
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="CustomerID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange} disabled={true}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select customer" />
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
                            <FormDescription>Customer is determined by contract selection</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="ContractUnitID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleUnitChange(value);
                              }}
                              disabled={contractUnits.length === 0 || isEdit}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {contractUnits.map((unit) => (
                                  <SelectItem key={unit.ContractUnitID} value={unit.ContractUnitID.toString()}>
                                    {unit.PropertyName} - {unit.UnitNo} ({unit.UnitTypeName})
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
                        name="InvoiceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice Type</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleInvoiceTypeChange(value);
                              }}
                              disabled={isEdit}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select invoice type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {invoiceTypeOptions.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="InvoicePeriodFrom"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Period From</FormLabel>
                            <FormControl>
                              <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} />
                            </FormControl>
                            <FormDescription>Optional for non-rent invoices</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="InvoicePeriodTo"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Period To</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                disabled={(date) => {
                                  const fromDate = form.watch("InvoicePeriodFrom");
                                  return fromDate ? date < fromDate : false;
                                }}
                              />
                            </FormControl>
                            <FormDescription>Optional for non-rent invoices</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="InvoiceAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice Amount</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} step="0.01" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="TaxID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleTaxChange(value);
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select tax" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">No Tax</SelectItem>
                                {taxes.map((tax) => (
                                  <SelectItem key={tax.TaxID} value={tax.TaxID.toString()}>
                                    {tax.TaxName} ({tax.TaxRate}%)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="TaxAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax Amount</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0.00" {...field} disabled step="0.01" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="AdditionalCharges"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Charges</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0.00" {...field} disabled step="0.01" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="DiscountAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Amount</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} step="0.01" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="TotalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Amount</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} disabled className="text-lg font-bold" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="Notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter notes or additional information" className="min-h-[100px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="charges">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Additional Charges</CardTitle>
                      <CardDescription>Add extra charges to this invoice</CardDescription>
                    </div>
                    <Button type="button" onClick={addAdditionalCharge}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Charge
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {additionalChargeItems.fields.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No additional charges have been added to this invoice yet. Click "Add Charge" to add one.</div>
                    ) : (
                      <Accordion type="multiple" className="w-full">
                        {additionalChargeItems.fields.map((field, index) => (
                          <AccordionItem key={field.id} value={`charge-${index}`} className="border rounded-lg mb-4">
                            <AccordionTrigger className="px-4">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center">
                                  <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
                                  <span className="font-medium">
                                    {form.watch(`additionalChargeItems.${index}.AdditionalChargesID`)
                                      ? additionalCharges.find((charge) => charge.ChargesID.toString() === form.watch(`additionalChargeItems.${index}.AdditionalChargesID`))
                                          ?.ChargesName
                                      : `Charge ${index + 1}`}
                                  </span>
                                </div>
                                <div className="font-medium">{formatCurrency(form.watch(`additionalChargeItems.${index}.TotalAmount`) || 0)}</div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4">
                                <div className="flex justify-end">
                                  <Button type="button" variant="destructive" size="sm" onClick={() => additionalChargeItems.remove(index)}>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Remove Charge
                                  </Button>
                                </div>

                                <FormField
                                  control={form.control}
                                  name={`additionalChargeItems.${index}.AdditionalChargesID`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Charge</FormLabel>
                                      <Select
                                        value={field.value}
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          handleAdditionalChargeSelect(value, index);
                                        }}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a charge" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {additionalCharges.map((charge) => (
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
                                  name={`additionalChargeItems.${index}.ChargeAmount`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Amount</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="0.00"
                                          {...field}
                                          onChange={(e) => {
                                            field.onChange(parseFloat(e.target.value) || 0);
                                            updateChargeCalculation(index);
                                          }}
                                          step="0.01"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name={`additionalChargeItems.${index}.TaxPercentage`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Tax Percentage (%)</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            placeholder="0.00"
                                            {...field}
                                            onChange={(e) => {
                                              field.onChange(parseFloat(e.target.value) || 0);
                                              updateChargeCalculation(index);
                                            }}
                                            step="0.01"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name={`additionalChargeItems.${index}.TaxAmount`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Tax Amount</FormLabel>
                                        <FormControl>
                                          <Input type="number" placeholder="0.00" {...field} disabled step="0.01" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <FormField
                                  control={form.control}
                                  name={`additionalChargeItems.${index}.TotalAmount`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Total Amount</FormLabel>
                                      <FormControl>
                                        <Input type="number" placeholder="0.00" {...field} disabled step="0.01" />
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
                    {isEdit ? "Update Invoice" : "Create Invoice"}
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

export default LeaseInvoiceForm;

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
