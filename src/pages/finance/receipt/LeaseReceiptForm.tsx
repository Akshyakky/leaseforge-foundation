// src/pages/finance/receipt/LeaseReceiptForm.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, RotateCcw, Plus, Trash2, FileText, Calculator, Calendar, Building, DollarSign, Receipt } from "lucide-react";
import { leaseReceiptService } from "@/services/leaseReceiptService";
import { leaseInvoiceService } from "@/services/leaseInvoiceService";
import { contractService } from "@/services/contractService";
import { customerService } from "@/services/customerService";
import { currencyService } from "@/services/currencyService";
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
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Create schema for receipt form validation
const receiptSchema = z.object({
  ReceiptNo: z.string().optional(),
  ReceiptDate: z.date().default(() => new Date()),
  CustomerID: z.string().min(1, "Customer is required"),
  ContractID: z.string().min(1, "Contract is required"),
  PaymentMethod: z.string().min(1, "Payment method is required"),
  PaymentReference: z.string().optional(),
  PaymentDate: z.date().default(() => new Date()),
  BankName: z.string().optional(),
  ChequeNo: z.string().optional(),
  ChequeDate: z.date().optional().nullable(),
  ReceiptAmount: z.number().min(0.01, "Receipt amount must be greater than 0"),
  ReceiptStatus: z.string().default("Draft"),
  IsCleared: z.boolean().default(false),
  ClearingDate: z.date().optional().nullable(),
  CurrencyID: z.string().default("1"), // Default to first currency
  ExchangeRate: z.number().default(1),
  Notes: z.string().optional(),

  // Relationships - Payment allocations to invoices
  details: z
    .array(
      z.object({
        ReceiptDetailID: z.number().optional(),
        InvoiceID: z.number(),
        AllocatedAmount: z.number().min(0, "Allocated amount must be at least 0"),

        // Fields for display only
        InvoiceNo: z.string().optional(),
        InvoiceDate: z.date().optional(),
        DueDate: z.date().optional(),
        TotalAmount: z.number().optional(),
        BalanceAmount: z.number().optional(),
        OriginalBalance: z.number().optional(), // For validation
        Selected: z.boolean().default(false).optional(), // For UI only
      })
    )
    .optional(),
});

type ReceiptFormValues = z.infer<typeof receiptSchema>;

const LeaseReceiptForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const invoiceIdFromQuery = queryParams.get("invoiceId");
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit || !!invoiceIdFromQuery);
  const [activeTab, setActiveTab] = useState("details");
  const [availableInvoices, setAvailableInvoices] = useState<any[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [unallocatedAmount, setUnallocatedAmount] = useState(0);

  // Reference data
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);

  // Payment method options
  const paymentMethodOptions = ["Cash", "Cheque", "Bank Transfer", "Credit Card", "Debit Card", "Others"];

  // Initialize form
  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      ReceiptNo: "",
      ReceiptDate: new Date(),
      CustomerID: "",
      ContractID: "",
      PaymentMethod: "",
      PaymentReference: "",
      PaymentDate: new Date(),
      BankName: "",
      ChequeNo: "",
      ChequeDate: null,
      ReceiptAmount: 0,
      ReceiptStatus: "Draft",
      IsCleared: false,
      ClearingDate: null,
      CurrencyID: "1", // Default to first currency
      ExchangeRate: 1,
      Notes: "",
      details: [],
    },
  });

  // Setup field array for invoice allocations
  const detailsFieldArray = useFieldArray({
    control: form.control,
    name: "details",
  });

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Fetch reference data in parallel
        const [customersData, contractsData, currenciesData] = await Promise.all([
          customerService.getAllCustomers(),
          contractService.getAllContracts(),
          currencyService.getCurrenciesForDropdown(),
        ]);

        setCustomers(customersData);
        setContracts(contractsData);
        setCurrencies(currenciesData);

        // If editing, fetch the receipt data
        if (isEdit && id) {
          const receiptData = await leaseReceiptService.getReceiptById(parseInt(id));

          if (receiptData.receipt) {
            // Format data for form
            const formattedReceipt = {
              ...receiptData.receipt,
              ReceiptDate: receiptData.receipt.ReceiptDate ? new Date(receiptData.receipt.ReceiptDate) : new Date(),
              PaymentDate: receiptData.receipt.PaymentDate ? new Date(receiptData.receipt.PaymentDate) : new Date(),
              ChequeDate: receiptData.receipt.ChequeDate ? new Date(receiptData.receipt.ChequeDate) : null,
              ClearingDate: receiptData.receipt.ClearingDate ? new Date(receiptData.receipt.ClearingDate) : null,
              CustomerID: receiptData.receipt.CustomerID?.toString() || "",
              ContractID: receiptData.receipt.ContractID?.toString() || "",
              CurrencyID: receiptData.receipt.CurrencyID?.toString() || "1",
              ReceiptAmount: receiptData.receipt.ReceiptAmount || 0,
            };

            // Format invoice allocation details
            const formattedDetails = receiptData.details.map((detail) => ({
              ...detail,
              InvoiceDate: detail.InvoiceDate ? new Date(detail.InvoiceDate) : undefined,
              DueDate: detail.DueDate ? new Date(detail.DueDate) : undefined,
              OriginalBalance: detail.BalanceAmount, // Store original balance for validation
            }));

            // Set form values
            form.reset({
              ...formattedReceipt,
              details: formattedDetails,
            });

            // Load any additional unpaid invoices from this contract/customer
            if (formattedReceipt.CustomerID && formattedReceipt.ContractID) {
              const unpaidInvoices = await leaseReceiptService.getUnpaidInvoices(parseInt(formattedReceipt.CustomerID), parseInt(formattedReceipt.ContractID));

              // Filter out invoices that are already allocated
              const existingInvoiceIds = formattedDetails.map((d) => d.InvoiceID);
              const filteredInvoices = unpaidInvoices.filter((invoice) => !existingInvoiceIds.includes(invoice.InvoiceID));

              setAvailableInvoices(filteredInvoices);
            }

            // Calculate unallocated amount
            const totalAllocated = formattedDetails.reduce((sum, detail) => sum + (detail.AllocatedAmount || 0), 0);
            setUnallocatedAmount(formattedReceipt.ReceiptAmount - totalAllocated);
          } else {
            toast.error("Receipt not found");
            navigate("/receipts");
          }
        }
        // If creating from an invoice
        else if (invoiceIdFromQuery) {
          const invoiceId = parseInt(invoiceIdFromQuery);
          const invoiceData = await leaseInvoiceService.getInvoiceById(invoiceId);

          if (invoiceData.invoice) {
            const invoice = invoiceData.invoice;

            // Set customer and contract
            form.setValue("CustomerID", invoice.CustomerID.toString());
            form.setValue("ContractID", invoice.ContractID.toString());
            form.setValue("ReceiptAmount", invoice.BalanceAmount);

            // Add this invoice to the details
            detailsFieldArray.append({
              InvoiceID: invoice.InvoiceID,
              InvoiceNo: invoice.InvoiceNo,
              InvoiceDate: invoice.InvoiceDate ? new Date(invoice.InvoiceDate) : undefined,
              DueDate: invoice.DueDate ? new Date(invoice.DueDate) : undefined,
              TotalAmount: invoice.TotalAmount,
              AllocatedAmount: invoice.BalanceAmount,
              BalanceAmount: 0, // This will be fully paid
              OriginalBalance: invoice.BalanceAmount,
            });

            // Also load any other unpaid invoices from this contract/customer
            const unpaidInvoices = await leaseReceiptService.getUnpaidInvoices(invoice.CustomerID, invoice.ContractID);

            // Filter out the current invoice
            const filteredInvoices = unpaidInvoices.filter((inv) => inv.InvoiceID !== invoice.InvoiceID);
            setAvailableInvoices(filteredInvoices);
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
  }, [id, isEdit, invoiceIdFromQuery, navigate, form, detailsFieldArray]);

  // Update calculations when form values change
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Calculate unallocated amount when receipt amount or allocations change
      if (name === "ReceiptAmount" || name?.startsWith("details")) {
        const receiptAmount = form.getValues("ReceiptAmount") || 0;
        const details = form.getValues("details") || [];
        const totalAllocated = details.reduce((sum, detail) => sum + (detail.AllocatedAmount || 0), 0);
        setUnallocatedAmount(receiptAmount - totalAllocated);
      }

      // Show/hide cheque fields based on payment method
      if (name === "PaymentMethod") {
        const paymentMethod = form.getValues("PaymentMethod");
        if (paymentMethod !== "Cheque") {
          form.setValue("BankName", "");
          form.setValue("ChequeNo", "");
          form.setValue("ChequeDate", null);
          form.setValue("IsCleared", false);
          form.setValue("ClearingDate", null);
        } else {
          form.setValue("ChequeDate", new Date());
        }
      }

      // Clear clearing date if not cleared
      if (name === "IsCleared") {
        const isCleared = form.getValues("IsCleared");
        if (!isCleared) {
          form.setValue("ClearingDate", null);
        } else if (!form.getValues("ClearingDate")) {
          form.setValue("ClearingDate", new Date());
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Handle customer change
  const handleCustomerChange = async (customerId: string) => {
    if (!customerId) {
      form.setValue("ContractID", "");
      setAvailableInvoices([]);
      return;
    }

    // Filter contracts for this customer
    const customerContracts = contracts.filter((contract) => contract.CustomerID.toString() === customerId);

    // Reset contract selection
    form.setValue("ContractID", "");
    setAvailableInvoices([]);
  };

  // Handle contract change
  const handleContractChange = async (contractId: string) => {
    if (!contractId) {
      setAvailableInvoices([]);
      return;
    }

    try {
      const customerId = form.getValues("CustomerID");
      if (customerId && contractId) {
        // Fetch unpaid invoices for this customer/contract
        const unpaidInvoices = await leaseReceiptService.getUnpaidInvoices(parseInt(customerId), parseInt(contractId));

        // Filter out invoices that are already allocated in the form
        const details = form.getValues("details") || [];
        const existingInvoiceIds = details.map((d) => d.InvoiceID);
        const filteredInvoices = unpaidInvoices.filter((invoice) => !existingInvoiceIds.includes(invoice.InvoiceID));

        setAvailableInvoices(filteredInvoices);
      }
    } catch (error) {
      console.error("Error fetching unpaid invoices:", error);
      toast.error("Failed to fetch unpaid invoices");
    }
  };

  // Handle adding invoices to allocations
  const handleAddInvoices = () => {
    const selected = availableInvoices.filter((inv) => inv.Selected);

    if (selected.length === 0) {
      toast.error("Please select at least one invoice");
      return;
    }

    // Add selected invoices to details
    selected.forEach((invoice) => {
      // Determine allocation amount (use remaining unallocated amount or invoice balance, whichever is smaller)
      const currentUnallocated = form.getValues("ReceiptAmount") - form.getValues("details")?.reduce((sum, d) => sum + d.AllocatedAmount, 0) || 0;

      const allocateAmount = Math.min(currentUnallocated, invoice.BalanceAmount);

      detailsFieldArray.append({
        InvoiceID: invoice.InvoiceID,
        InvoiceNo: invoice.InvoiceNo,
        InvoiceDate: invoice.InvoiceDate ? new Date(invoice.InvoiceDate) : undefined,
        DueDate: invoice.DueDate ? new Date(invoice.DueDate) : undefined,
        TotalAmount: invoice.TotalAmount,
        AllocatedAmount: allocateAmount,
        BalanceAmount: invoice.BalanceAmount - allocateAmount,
        OriginalBalance: invoice.BalanceAmount,
      });
    });

    // Remove selected invoices from available invoices
    setAvailableInvoices(availableInvoices.filter((inv) => !inv.Selected));

    // Recalculate unallocated amount
    calculateUnallocatedAmount();
  };

  // Handle removing allocation
  const handleRemoveAllocation = (index: number) => {
    const detail = form.getValues(`details.${index}`);

    // Add this invoice back to available invoices
    if (detail) {
      setAvailableInvoices([
        ...availableInvoices,
        {
          InvoiceID: detail.InvoiceID,
          InvoiceNo: detail.InvoiceNo,
          InvoiceDate: detail.InvoiceDate,
          DueDate: detail.DueDate,
          TotalAmount: detail.TotalAmount,
          BalanceAmount: detail.OriginalBalance || detail.BalanceAmount + detail.AllocatedAmount,
          Selected: false,
        },
      ]);
    }

    // Remove from form
    detailsFieldArray.remove(index);

    // Recalculate unallocated amount
    calculateUnallocatedAmount();
  };

  // Toggle selection of an invoice
  const toggleInvoiceSelection = (index: number) => {
    setAvailableInvoices(availableInvoices.map((inv, i) => (i === index ? { ...inv, Selected: !inv.Selected } : inv)));
  };

  // Calculate unallocated amount
  const calculateUnallocatedAmount = () => {
    const receiptAmount = form.getValues("ReceiptAmount") || 0;
    const details = form.getValues("details") || [];
    const totalAllocated = details.reduce((sum, detail) => sum + (detail.AllocatedAmount || 0), 0);
    setUnallocatedAmount(receiptAmount - totalAllocated);
  };

  // Update allocation amount and balance
  const updateAllocationAmount = (index: number, value: number) => {
    const detail = form.getValues(`details.${index}`);
    const originalBalance = detail.OriginalBalance || 0;

    // Ensure amount is not negative and doesn't exceed original balance
    const validAmount = Math.max(0, Math.min(value, originalBalance));

    // Set allocated amount
    form.setValue(`details.${index}.AllocatedAmount`, validAmount);

    // Update balance
    form.setValue(`details.${index}.BalanceAmount`, originalBalance - validAmount);

    // Recalculate unallocated amount
    calculateUnallocatedAmount();
  };

  // Auto-allocate remaining amount
  const autoAllocate = () => {
    if (unallocatedAmount <= 0) return;

    const details = form.getValues("details") || [];
    let remainingToAllocate = unallocatedAmount;

    // Loop through details and allocate remaining amount
    for (let i = 0; i < details.length; i++) {
      const detail = details[i];
      const currentAllocation = detail.AllocatedAmount || 0;
      const originalBalance = detail.OriginalBalance || 0;
      const maxAdditional = originalBalance - currentAllocation;

      if (maxAdditional > 0) {
        const additionalAllocation = Math.min(remainingToAllocate, maxAdditional);
        const newAllocation = currentAllocation + additionalAllocation;

        // Update allocation
        form.setValue(`details.${i}.AllocatedAmount`, newAllocation);
        form.setValue(`details.${i}.BalanceAmount`, originalBalance - newAllocation);

        // Reduce remaining amount
        remainingToAllocate -= additionalAllocation;

        // Break if nothing left to allocate
        if (remainingToAllocate <= 0) break;
      }
    }

    // Recalculate unallocated amount
    calculateUnallocatedAmount();
  };

  // Handle form submission
  const onSubmit = async (data: ReceiptFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    setLoading(true);

    try {
      // Validate allocations if details exist
      if (data.details && data.details.length > 0) {
        const totalAllocated = data.details.reduce((sum, detail) => sum + (detail.AllocatedAmount || 0), 0);
        const difference = Math.abs(data.ReceiptAmount - totalAllocated);

        // Allow a small rounding difference (0.01)
        if (difference > 0.01) {
          const message = totalAllocated > data.ReceiptAmount ? "Total allocations exceed receipt amount" : "Receipt amount not fully allocated";

          if (totalAllocated > data.ReceiptAmount) {
            toast.error(message);
            setLoading(false);
            return;
          } else {
            // Warn but allow to proceed if not fully allocated
            const proceed = window.confirm(`${message}. Do you want to proceed anyway?`);
            if (!proceed) {
              setLoading(false);
              return;
            }
          }
        }
      }

      // Prepare receipt data
      const receiptData = {
        receipt: {
          ReceiptNo: data.ReceiptNo,
          ReceiptDate: data.ReceiptDate,
          CustomerID: parseInt(data.CustomerID),
          ContractID: parseInt(data.ContractID),
          PaymentMethod: data.PaymentMethod,
          PaymentReference: data.PaymentReference,
          PaymentDate: data.PaymentDate,
          BankName: data.BankName,
          ChequeNo: data.ChequeNo,
          ChequeDate: data.ChequeDate,
          ReceiptAmount: data.ReceiptAmount,
          ReceiptStatus: data.ReceiptStatus,
          IsCleared: data.IsCleared,
          ClearingDate: data.ClearingDate,
          CurrencyID: parseInt(data.CurrencyID),
          ExchangeRate: data.ExchangeRate,
          Notes: data.Notes,
        },
        details: data.details?.map((detail) => ({
          ReceiptDetailID: detail.ReceiptDetailID,
          InvoiceID: detail.InvoiceID,
          AllocatedAmount: detail.AllocatedAmount,
        })),
      };

      if (isEdit && id) {
        // Update existing receipt
        const response = await leaseReceiptService.updateReceipt({
          ...receiptData,
          receipt: {
            ...receiptData.receipt,
            ReceiptID: parseInt(id),
          },
        });

        if (response.Status === 1) {
          toast.success("Receipt updated successfully");
          navigate(`/receipts/${id}`);
        } else {
          toast.error(response.Message || "Failed to update receipt");
        }
      } else {
        // Create new receipt
        const response = await leaseReceiptService.createReceipt(receiptData);

        if (response.Status === 1 && response.NewReceiptID) {
          toast.success("Receipt created successfully");
          navigate(`/receipts/${response.NewReceiptID}`);
        } else {
          toast.error(response.Message || "Failed to create receipt");
        }
      }
    } catch (error) {
      console.error("Error saving receipt:", error);
      toast.error("Failed to save receipt");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    if (isEdit && id) {
      form.reset();
    } else {
      form.reset({
        ReceiptNo: "",
        ReceiptDate: new Date(),
        CustomerID: "",
        ContractID: "",
        PaymentMethod: "",
        PaymentReference: "",
        PaymentDate: new Date(),
        BankName: "",
        ChequeNo: "",
        ChequeDate: null,
        ReceiptAmount: 0,
        ReceiptStatus: "Draft",
        IsCleared: false,
        ClearingDate: null,
        CurrencyID: "1",
        ExchangeRate: 1,
        Notes: "",
        details: [],
      });
      setAvailableInvoices([]);
      setUnallocatedAmount(0);
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    navigate("/receipts");
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

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "0.00";
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
        <Button variant="outline" size="icon" onClick={() => navigate("/receipts")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Receipt" : "Create Receipt"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-[400px]">
                <TabsTrigger value="details">Receipt Details</TabsTrigger>
                <TabsTrigger value="allocations">
                  Invoice Allocations ({detailsFieldArray.fields.length})
                  {unallocatedAmount > 0 && (
                    <Badge variant="outline" className="ml-2">
                      Unallocated: {formatCurrency(unallocatedAmount)}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>{isEdit ? "Edit Receipt" : "Create New Receipt"}</CardTitle>
                    <CardDescription>{isEdit ? "Update receipt information" : "Enter receipt details"}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="ReceiptNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Receipt No.</FormLabel>
                            <FormControl>
                              <Input placeholder="Auto-generated if left empty" {...field} disabled={isEdit} />
                            </FormControl>
                            <FormDescription>Optional. Leave blank for auto-generated receipt number.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ReceiptStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Validated">Validated</SelectItem>
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
                        name="ReceiptDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Receipt Date</FormLabel>
                            <FormControl>
                              <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="PaymentDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Payment Date</FormLabel>
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
                        name="CustomerID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleCustomerChange(value);
                              }}
                              disabled={isEdit || !!invoiceIdFromQuery}
                            >
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                              disabled={!form.getValues("CustomerID") || isEdit || !!invoiceIdFromQuery}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select contract" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {contracts
                                  .filter((contract) => contract.CustomerID.toString() === form.getValues("CustomerID"))
                                  .map((contract) => (
                                    <SelectItem key={contract.ContractID} value={contract.ContractID.toString()}>
                                      {contract.ContractNo}
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
                        name="PaymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {paymentMethodOptions.map((method) => (
                                  <SelectItem key={method} value={method}>
                                    {method}
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
                        name="PaymentReference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Reference</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter reference number" {...field} />
                            </FormControl>
                            <FormDescription>Optional reference for the payment</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch("PaymentMethod") === "Cheque" && (
                      <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-medium">Cheque Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="BankName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bank Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter bank name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="ChequeNo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cheque Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter cheque number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="ChequeDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Cheque Date</FormLabel>
                                <FormControl>
                                  <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <FormField
                            control={form.control}
                            name="IsCleared"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Cheque is cleared</FormLabel>
                                  <FormDescription>Mark if the cheque has been cleared by the bank</FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>

                        {form.watch("IsCleared") && (
                          <FormField
                            control={form.control}
                            name="ClearingDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Clearing Date</FormLabel>
                                <FormControl>
                                  <DatePicker value={field.value} onChange={field.onChange} disabled={(date) => false} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="CurrencyID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {currencies.map((currency) => (
                                  <SelectItem key={currency.CurrencyID} value={currency.CurrencyID.toString()}>
                                    {currency.CurrencyName}
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
                        name="ReceiptAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Receipt Amount</FormLabel>
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

              <TabsContent value="allocations">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Invoice Allocations</CardTitle>
                      <CardDescription>Allocate this receipt to outstanding invoices</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button type="button" variant="outline" onClick={autoAllocate} disabled={unallocatedAmount <= 0 || detailsFieldArray.fields.length === 0}>
                        <Calculator className="mr-2 h-4 w-4" />
                        Auto-Allocate
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setIsAllocationDialogOpen(true)}
                        disabled={!form.getValues("CustomerID") || !form.getValues("ContractID") || availableInvoices.length === 0}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Invoice
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {detailsFieldArray.fields.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No invoice allocations have been added to this receipt yet.
                        {availableInvoices.length > 0 ? (
                          <div className="mt-2">
                            <Button type="button" variant="outline" onClick={() => setIsAllocationDialogOpen(true)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Select Invoices
                            </Button>
                          </div>
                        ) : form.getValues("CustomerID") && form.getValues("ContractID") ? (
                          <div className="mt-2 text-muted-foreground">No unpaid invoices found for this contract.</div>
                        ) : (
                          <div className="mt-2 text-muted-foreground">Select a customer and contract to view available invoices.</div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Total Amount</TableHead>
                                <TableHead>Original Balance</TableHead>
                                <TableHead>Allocated</TableHead>
                                <TableHead>Remaining</TableHead>
                                <TableHead>Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {detailsFieldArray.fields.map((field, index) => (
                                <TableRow key={field.id}>
                                  <TableCell>{form.getValues(`details.${index}.InvoiceNo`)}</TableCell>
                                  <TableCell>{formatDate(form.getValues(`details.${index}.InvoiceDate`))}</TableCell>
                                  <TableCell>{formatDate(form.getValues(`details.${index}.DueDate`))}</TableCell>
                                  <TableCell>{formatCurrency(form.getValues(`details.${index}.TotalAmount`))}</TableCell>
                                  <TableCell>{formatCurrency(form.getValues(`details.${index}.OriginalBalance`))}</TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={`details.${index}.AllocatedAmount`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              {...field}
                                              onChange={(e) => {
                                                const value = parseFloat(e.target.value) || 0;
                                                updateAllocationAmount(index, value);
                                              }}
                                              step="0.01"
                                              className="max-w-[120px]"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>{formatCurrency(form.getValues(`details.${index}.BalanceAmount`))}</TableCell>
                                  <TableCell>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveAllocation(index)}
                                      disabled={isEdit && !!form.getValues(`details.${index}.ReceiptDetailID`)}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow>
                                <TableCell colSpan={5} className="text-right font-bold">
                                  Total Allocated:
                                </TableCell>
                                <TableCell className="font-bold" colSpan={3}>
                                  {formatCurrency(form.getValues("details")?.reduce((sum, detail) => sum + (detail.AllocatedAmount || 0), 0) || 0)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell colSpan={5} className="text-right font-bold">
                                  Receipt Amount:
                                </TableCell>
                                <TableCell className="font-bold" colSpan={3}>
                                  {formatCurrency(form.getValues("ReceiptAmount") || 0)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell colSpan={5} className="text-right font-bold">
                                  Unallocated Amount:
                                </TableCell>
                                <TableCell className={`font-bold ${unallocatedAmount > 0 ? "text-amber-500" : unallocatedAmount < 0 ? "text-red-500" : ""}`} colSpan={3}>
                                  {formatCurrency(unallocatedAmount)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>

                        {availableInvoices.length > 0 && (
                          <div className="flex justify-end">
                            <Button type="button" variant="outline" onClick={() => setIsAllocationDialogOpen(true)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add More Invoices
                            </Button>
                          </div>
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
                    {isEdit ? "Update Receipt" : "Create Receipt"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Invoice Selection Dialog */}
      {isAllocationDialogOpen && (
        <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Select Invoices to Allocate</DialogTitle>
              <DialogDescription>Choose from the available unpaid invoices to allocate this receipt.</DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {availableInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No unpaid invoices available for this contract.</div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Select</TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Outstanding</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableInvoices.map((invoice, index) => (
                        <TableRow key={invoice.InvoiceID}>
                          <TableCell>
                            <Checkbox checked={invoice.Selected} onCheckedChange={() => toggleInvoiceSelection(index)} />
                          </TableCell>
                          <TableCell>{invoice.InvoiceNo}</TableCell>
                          <TableCell>{formatDate(new Date(invoice.InvoiceDate))}</TableCell>
                          <TableCell>{formatDate(new Date(invoice.DueDate))}</TableCell>
                          <TableCell>{formatCurrency(invoice.TotalAmount)}</TableCell>
                          <TableCell>{formatCurrency(invoice.BalanceAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAllocationDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleAddInvoices();
                  setIsAllocationDialogOpen(false);
                }}
                disabled={availableInvoices.filter((inv) => inv.Selected).length === 0}
              >
                Add Selected Invoices
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LeaseReceiptForm;
