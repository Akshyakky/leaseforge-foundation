// src/pages/lease-revenue/LeaseRevenueForm.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Save, Receipt, Building, Calendar, Calculator, AlertCircle, CheckCircle, Info, DollarSign, Clock, Eye, Printer, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useAppSelector } from "@/lib/hooks";

// Services and Types
import { leaseRevenueService } from "@/services/leaseRevenueService";
import { accountService } from "@/services/accountService";
import { propertyService } from "@/services/propertyService";
import { unitService } from "@/services/unitService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { LeaseRevenueData, LeaseRevenuePostingRequest, SelectedContractUnitForPosting, PostingValidationResponse } from "@/types/leaseRevenueTypes";

// Form Components
import { FormField } from "@/components/forms/FormField";
import { DatePicker } from "@/components/ui/date-picker";

// Email Components
import { EmailSendDialog } from "@/pages/email/EmailSendDialog";
import { useEmailIntegration } from "@/hooks/useEmailIntegration";

// Validation schema
const postingFormSchema = z.object({
  PeriodFrom: z.date({ required_error: "Period From is required" }),
  PeriodTo: z.date({ required_error: "Period To is required" }),
  DebitAccountID: z.string().min(1, "Debit account is required"),
  CreditAccountID: z.string().min(1, "Credit account is required"),
  PostingDate: z.date().default(() => new Date()),
  VoucherNo: z.string().optional(),
  RefNo: z.string().optional(),
  Narration: z.string().optional(),
  PrintVoucher: z.boolean().default(false),
  IncludePMUnits: z.boolean().default(false),
  ShowUnpostedOnly: z.boolean().default(true),
  PropertyID: z.string().optional(),
  UnitID: z.string().optional(),
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

type PostingFormValues = z.infer<typeof postingFormSchema>;

const LeaseRevenueForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [leaseRevenueData, setLeaseRevenueData] = useState<LeaseRevenueData[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<Set<number>>(new Set());
  const [validationResults, setValidationResults] = useState<PostingValidationResponse | null>(null);

  // Reference data
  const [accounts, setAccounts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<any>(null);

  // Email integration
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailTriggerEvent, setEmailTriggerEvent] = useState<string | undefined>(undefined);
  const emailIntegration = useEmailIntegration({
    entityType: "contract",
    entityId: 0,
  });

  // Get pre-selected units from URL parameters
  const preSelectedUnits = useMemo(() => {
    const selected = searchParams.get("selected");
    if (selected) {
      return selected
        .split(",")
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));
    }
    return [];
  }, [searchParams]);

  // Initialize form
  const form = useForm<PostingFormValues>({
    resolver: zodResolver(postingFormSchema),
    defaultValues: {
      PeriodFrom: startOfMonth(new Date()),
      PeriodTo: endOfMonth(new Date()),
      DebitAccountID: "",
      CreditAccountID: "",
      PostingDate: new Date(),
      VoucherNo: "",
      RefNo: "",
      Narration: "",
      PrintVoucher: false,
      IncludePMUnits: false,
      ShowUnpostedOnly: true,
      PropertyID: "",
      UnitID: "",
      sendEmailNotification: false,
      emailRecipients: [],
    },
  });

  // Initialize data on component mount
  useEffect(() => {
    initializeForm();
    emailIntegration.loadEmailTemplates("Lease Revenue Posting");
  }, []);

  // Load lease revenue data when search criteria change
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.PeriodFrom && values.PeriodTo) {
        loadLeaseRevenueData();
      }
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Auto-select pre-selected units when data loads
  useEffect(() => {
    if (leaseRevenueData.length > 0 && preSelectedUnits.length > 0) {
      const validPreSelected = preSelectedUnits.filter((id) => leaseRevenueData.some((item) => item.ContractUnitID === id));
      setSelectedUnits(new Set(validPreSelected));
    }
  }, [leaseRevenueData, preSelectedUnits]);

  // Initialize form data
  const initializeForm = async () => {
    try {
      const [accountsData, propertiesData, unitsData, companiesData, fiscalYearsData] = await Promise.all([
        accountService.getAllAccounts(),
        propertyService.getAllProperties(),
        unitService.getAllUnits(),
        companyService.getCompaniesForDropdown(true),
        fiscalYearService.getAllFiscalYears(),
      ]);

      setAccounts(accountsData.filter((acc) => acc.IsPostable));
      setProperties(propertiesData);
      setUnits(unitsData);
      setCompanies(companiesData);
      setFiscalYears(fiscalYearsData);

      // Set default company and fiscal year
      if (companiesData.length > 0) {
        const defaultCompany = companiesData[0];
        setSelectedCompany(defaultCompany);

        // Get current fiscal year for the company
        try {
          const currentFY = await fiscalYearService.getCurrentFiscalYear(defaultCompany.CompanyID);
          if (currentFY) {
            setSelectedFiscalYear(currentFY);
          } else if (fiscalYearsData.length > 0) {
            const companyFY = fiscalYearsData.find((fy) => fy.CompanyID === defaultCompany.CompanyID);
            if (companyFY) {
              setSelectedFiscalYear(companyFY);
            }
          }
        } catch (error) {
          console.error("Error fetching current fiscal year:", error);
        }
      }

      // Load initial lease revenue data
      await loadLeaseRevenueData();
    } catch (error) {
      console.error("Error initializing form:", error);
      toast.error("Failed to load form data");
    }
  };

  // Load lease revenue data based on search criteria
  const loadLeaseRevenueData = async () => {
    const formValues = form.getValues();

    if (!selectedCompany?.CompanyID || !selectedFiscalYear?.FiscalYearID || !formValues.PeriodFrom || !formValues.PeriodTo) {
      return;
    }

    setLoadingData(true);

    try {
      const searchRequest = {
        PropertyID: formValues.PropertyID ? parseInt(formValues.PropertyID) : undefined,
        UnitID: formValues.UnitID ? parseInt(formValues.UnitID) : undefined,
        PeriodFrom: formValues.PeriodFrom,
        PeriodTo: formValues.PeriodTo,
        IncludePMUnits: formValues.IncludePMUnits,
        ShowUnpostedOnly: formValues.ShowUnpostedOnly,
        CompanyID: selectedCompany.CompanyID,
        FiscalYearID: selectedFiscalYear.FiscalYearID,
      };

      const data = await leaseRevenueService.getLeaseRevenueData(searchRequest);
      setLeaseRevenueData(data);

      if (data.length === 0) {
        toast.info("No lease revenue data found for the specified criteria");
      }
    } catch (error) {
      console.error("Error loading lease revenue data:", error);
      toast.error("Failed to load lease revenue data");
    } finally {
      setLoadingData(false);
    }
  };

  // Validate posting data
  const validatePosting = async (postingRequest: LeaseRevenuePostingRequest) => {
    try {
      const validation = await leaseRevenueService.validatePostingData(postingRequest);
      setValidationResults(validation);
      return validation;
    } catch (error) {
      console.error("Error validating posting data:", error);
      toast.error("Failed to validate posting data");
      return null;
    }
  };

  // Handle unit selection
  const handleUnitSelection = (contractUnitId: number, checked: boolean) => {
    const newSelection = new Set(selectedUnits);
    if (checked) {
      newSelection.add(contractUnitId);
    } else {
      newSelection.delete(contractUnitId);
    }
    setSelectedUnits(newSelection);

    // Clear validation results when selection changes
    setValidationResults(null);
  };

  // Handle select all units
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allUnpostedUnits = leaseRevenueData.filter((item) => !item.IsPosted).map((item) => item.ContractUnitID);
      setSelectedUnits(new Set(allUnpostedUnits));
    } else {
      setSelectedUnits(new Set());
    }
    setValidationResults(null);
  };

  // Get selected units data for posting
  const getSelectedUnitsForPosting = (): SelectedContractUnitForPosting[] => {
    return leaseRevenueData
      .filter((item) => selectedUnits.has(item.ContractUnitID) && !item.IsPosted)
      .map((item) => ({
        ContractUnitID: item.ContractUnitID,
        PostingAmount: item.PostingAmount,
        Narration: item.Narration || `${item.Property} - ${item.UnitNo}`,
      }));
  };

  // Calculate totals
  const calculateTotals = () => {
    const selectedData = leaseRevenueData.filter((item) => selectedUnits.has(item.ContractUnitID) && !item.IsPosted);

    return {
      totalUnits: selectedData.length,
      totalAmount: selectedData.reduce((sum, item) => sum + item.PostingAmount, 0),
      totalDays: selectedData.reduce((sum, item) => sum + item.TotalLeaseDays, 0),
    };
  };

  // Email handlers
  const handleSendEmail = (triggerEvent?: string) => {
    setEmailTriggerEvent(triggerEvent);
    setIsEmailDialogOpen(true);
  };

  const handleEmailSent = async (result: any) => {
    if (result.success) {
      toast.success("Email sent successfully");
    }
  };

  // Generate default email recipients
  const getDefaultEmailRecipients = () => {
    // For lease revenue posting, we might send to finance team, property managers, etc.
    // This would be configured based on business requirements
    return [
      {
        email: "finance@company.com",
        name: "Finance Team",
        type: "to" as const,
      },
    ];
  };

  // Handle form submission
  const onSubmit = async (data: PostingFormValues) => {
    if (!user || !selectedCompany || !selectedFiscalYear) {
      toast.error("User or company information not available");
      return;
    }

    if (selectedUnits.size === 0) {
      toast.error("Please select at least one unit to post");
      return;
    }

    const selectedUnitsForPosting = getSelectedUnitsForPosting();

    if (selectedUnitsForPosting.length === 0) {
      toast.error("No valid units selected for posting");
      return;
    }

    setLoading(true);

    try {
      // Prepare posting request
      const postingRequest: LeaseRevenuePostingRequest = {
        CompanyID: selectedCompany.CompanyID,
        FiscalYearID: selectedFiscalYear.FiscalYearID,
        CurrencyID: 1, // Default currency
        PeriodFrom: data.PeriodFrom,
        PeriodTo: data.PeriodTo,
        DebitAccountID: parseInt(data.DebitAccountID),
        CreditAccountID: parseInt(data.CreditAccountID),
        PostingDate: data.PostingDate,
        VoucherNo: data.VoucherNo,
        RefNo: data.RefNo,
        Narration: data.Narration,
        PrintVoucher: data.PrintVoucher,
        SelectedContractUnits: selectedUnitsForPosting,
      };

      // Validate posting data first
      const validation = await validatePosting(postingRequest);

      if (!validation || !validation.IsValid) {
        if (validation?.Errors.length) {
          validation.Errors.forEach((error) => toast.error(error));
        }
        return;
      }

      // Show warnings if any
      if (validation.Warnings.length > 0) {
        validation.Warnings.forEach((warning) => toast.warning(warning));
      }

      // Process posting
      const response = await leaseRevenueService.processLeaseRevenuePosting(postingRequest);

      if (response.Status === 1) {
        toast.success(`Lease revenue posting completed successfully. Processed ${response.ProcessedCount} units.`);

        // Send email notification if enabled
        if (data.sendEmailNotification && data.emailRecipients && data.emailRecipients.length > 0) {
          try {
            const postingVariables = {
              voucherNo: response.VoucherNo,
              processedCount: response.ProcessedCount,
              totalAmount: response.TotalAmount,
              postingDate: format(data.PostingDate, "MMM dd, yyyy"),
              periodFrom: format(data.PeriodFrom, "MMM dd, yyyy"),
              periodTo: format(data.PeriodTo, "MMM dd, yyyy"),
              debitAccount: accounts.find((acc) => acc.AccountID.toString() === data.DebitAccountID)?.AccountName,
              creditAccount: accounts.find((acc) => acc.AccountID.toString() === data.CreditAccountID)?.AccountName,
              narration: data.Narration,
            };

            const recipients = (data.emailRecipients || []).filter((recipient) => recipient.email && recipient.name && recipient.type) as Array<{
              email: string;
              name: string;
              type: "to" | "cc" | "bcc";
            }>;
            await emailIntegration.sendAutomatedEmail("lease_revenue_posted", postingVariables, recipients);

            toast.success("Email notifications sent successfully");
          } catch (emailError) {
            console.error("Error sending email notification:", emailError);
            toast.warning("Posting completed successfully, but email notification failed");
          }
        }

        // Navigate to details or list view
        navigate(`/lease-revenue?posted=true&voucher=${response.VoucherNo}`);
      } else {
        toast.error(response.Message || "Failed to process lease revenue posting");
      }
    } catch (error) {
      console.error("Error processing posting:", error);
      toast.error("Failed to process lease revenue posting");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const totals = calculateTotals();
  const sendEmailNotification = form.watch("sendEmailNotification");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/lease-revenue")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Lease Revenue Posting</h1>
        {preSelectedUnits.length > 0 && (
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-800">
            {preSelectedUnits.length} units pre-selected
          </Badge>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Search Criteria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Search Criteria
              </CardTitle>
              <CardDescription>Define the period and filters to load lease revenue data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FormField form={form} name="PeriodFrom" label="Period From" type="date" required description="Start date for revenue calculation" />
                <FormField form={form} name="PeriodTo" label="Period To" type="date" required description="End date for revenue calculation" />
                <FormField
                  form={form}
                  name="PropertyID"
                  label="Filter by Property"
                  type="select"
                  options={[
                    { label: "All Properties", value: "0" },
                    ...properties.map((property) => ({
                      label: property.PropertyName,
                      value: property.PropertyID.toString(),
                    })),
                  ]}
                  placeholder="Select property"
                />
                <FormField
                  form={form}
                  name="UnitID"
                  label="Filter by Unit"
                  type="select"
                  options={[
                    { label: "All Units", value: "0" },
                    ...units
                      .filter((unit) => !form.watch("PropertyID") || unit.PropertyID.toString() === form.watch("PropertyID"))
                      .map((unit) => ({
                        label: `${unit.UnitNo} - ${unit.PropertyName}`,
                        value: unit.UnitID.toString(),
                      })),
                  ]}
                  placeholder="Select unit"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="includePMUnits" checked={form.watch("IncludePMUnits")} onCheckedChange={(checked) => form.setValue("IncludePMUnits", !!checked)} />
                  <label htmlFor="includePMUnits" className="text-sm">
                    Include PM Units
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="showUnpostedOnly" checked={form.watch("ShowUnpostedOnly")} onCheckedChange={(checked) => form.setValue("ShowUnpostedOnly", !!checked)} />
                  <label htmlFor="showUnpostedOnly" className="text-sm">
                    Show Unposted Only
                  </label>
                </div>
                <Button type="button" variant="outline" onClick={loadLeaseRevenueData} disabled={loadingData}>
                  {loadingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                  Load Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Transaction Details
              </CardTitle>
              <CardDescription>Configure the posting accounts and transaction details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="DebitAccountID"
                  label="Debit Account"
                  type="select"
                  options={accounts.map((account) => ({
                    label: `${account.AccountCode} - ${account.AccountName}`,
                    value: account.AccountID.toString(),
                  }))}
                  placeholder="Select debit account"
                  required
                  description="Account to be debited (usually Rent Receivable or Unearned Income)"
                />
                <FormField
                  form={form}
                  name="CreditAccountID"
                  label="Credit Account"
                  type="select"
                  options={accounts.map((account) => ({
                    label: `${account.AccountCode} - ${account.AccountName}`,
                    value: account.AccountID.toString(),
                  }))}
                  placeholder="Select credit account"
                  required
                  description="Account to be credited (usually Rental Revenue)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField form={form} name="PostingDate" label="Posting Date" type="date" required description="Date when the posting will be recorded" />
                <FormField form={form} name="VoucherNo" label="Voucher Number" placeholder="Auto-generated if empty" description="Leave blank for auto-generation" />
                <FormField form={form} name="RefNo" label="Reference Number" placeholder="Optional reference" description="Optional reference number" />
              </div>

              <FormField
                form={form}
                name="Narration"
                label="Narration"
                type="textarea"
                placeholder="Enter posting narration"
                description="General description for the posting entries"
              />

              <div className="flex items-center space-x-2">
                <Checkbox id="printVoucher" checked={form.watch("PrintVoucher")} onCheckedChange={(checked) => form.setValue("PrintVoucher", !!checked)} />
                <label htmlFor="printVoucher" className="text-sm">
                  Print Voucher After Posting
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Email Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Notifications
              </CardTitle>
              <CardDescription>Configure email notifications for posting completion</CardDescription>
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
                />
                <label htmlFor="sendEmailNotification" className="text-sm font-medium">
                  Send email notification when posting is completed
                </label>
              </div>

              {sendEmailNotification && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                  <div className="text-sm text-muted-foreground">
                    Email notifications will be sent automatically to the selected recipients when the posting is completed successfully.
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Recipients</label>
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
                    <Button type="button" variant="outline" size="sm" onClick={() => handleSendEmail()}>
                      <Send className="mr-2 h-4 w-4" />
                      Preview Email Template
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lease Revenue Data */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    Lease Revenue Data
                    {loadingData && <Loader2 className="h-4 w-4 animate-spin" />}
                  </CardTitle>
                  <CardDescription>
                    {leaseRevenueData.length > 0
                      ? `${leaseRevenueData.length} entries found. Select units to include in the posting.`
                      : "No data loaded. Please set search criteria and click 'Load Data'."}
                  </CardDescription>
                </div>
                {leaseRevenueData.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll(true)}
                      disabled={leaseRevenueData.filter((item) => !item.IsPosted).length === 0}
                    >
                      Select All Unposted
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleSelectAll(false)}>
                      Clear Selection
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {leaseRevenueData.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No lease revenue data loaded.</p>
                  <p className="text-sm text-muted-foreground mb-4">Set your search criteria above and click "Load Data" to view available entries.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selection Summary */}
                  {totals.totalUnits > 0 && (
                    <Alert>
                      <Calculator className="h-4 w-4" />
                      <AlertDescription>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <strong>Selected Units:</strong> {totals.totalUnits}
                          </div>
                          <div>
                            <strong>Total Amount:</strong> {formatCurrency(totals.totalAmount)}
                          </div>
                          <div>
                            <strong>Total Days:</strong> {totals.totalDays}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Validation Results */}
                  {validationResults && (
                    <div className="space-y-2">
                      {validationResults.Errors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="font-medium">Validation Errors:</div>
                            <ul className="list-disc list-inside space-y-1">
                              {validationResults.Errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                      {validationResults.Warnings.length > 0 && (
                        <Alert className="border-orange-200 bg-orange-50">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <AlertDescription>
                            <div className="font-medium text-orange-800">Validation Warnings:</div>
                            <ul className="list-disc list-inside space-y-1 text-orange-700">
                              {validationResults.Warnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Data Table */}
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={
                                leaseRevenueData.filter((item) => !item.IsPosted).length > 0 &&
                                leaseRevenueData.filter((item) => !item.IsPosted).every((item) => selectedUnits.has(item.ContractUnitID))
                              }
                              onCheckedChange={handleSelectAll}
                              aria-label="Select all unposted units"
                            />
                          </TableHead>
                          <TableHead>Lease No</TableHead>
                          <TableHead>Property & Unit</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Rent/Day</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Posted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaseRevenueData.map((item) => (
                          <TableRow
                            key={item.ContractUnitID}
                            className={`
                              ${selectedUnits.has(item.ContractUnitID) ? "bg-accent/50" : ""}
                              ${item.IsPosted ? "bg-green-50/30 opacity-75" : ""}
                            `}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedUnits.has(item.ContractUnitID)}
                                onCheckedChange={(checked) => handleUnitSelection(item.ContractUnitID, checked as boolean)}
                                disabled={item.IsPosted}
                                aria-label={`Select ${item.LeaseNo}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{item.LeaseNo}</div>
                              <div className="text-sm text-muted-foreground">ID: {item.ContractUnitID}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{item.Property}</div>
                              <div className="text-sm text-muted-foreground">{item.UnitNo}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{item.CustomerName}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>
                                  <strong>From:</strong> {formatDate(item.StartDate)}
                                </div>
                                <div>
                                  <strong>To:</strong> {formatDate(item.EndDate)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-center">
                                <div className="font-medium">{item.TotalLeaseDays}</div>
                                <div className="text-xs text-muted-foreground">days</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{formatCurrency(item.RentPerDay)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-bold">{formatCurrency(item.PostingAmount)}</div>
                              {item.Balance !== item.PostingAmount && <div className="text-sm text-muted-foreground">Balance: {formatCurrency(item.Balance)}</div>}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={item.ContractStatus === "Active" ? "default" : "outline"}
                                className={item.ContractStatus === "Active" ? "bg-green-100 text-green-800" : ""}
                              >
                                {item.ContractStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.IsPosted ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Posted
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Unposted
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Footer Summary */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Entries:</span>
                        <div className="font-medium">{leaseRevenueData.length}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unposted:</span>
                        <div className="font-medium">{leaseRevenueData.filter((item) => !item.IsPosted).length}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Selected:</span>
                        <div className="font-medium">{totals.totalUnits}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Selected Amount:</span>
                        <div className="font-medium">{formatCurrency(totals.totalAmount)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <Card>
            <CardFooter className="flex justify-between pt-6">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => navigate("/lease-revenue")} disabled={loading}>
                  Cancel
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                {sendEmailNotification && (
                  <Alert className="p-2 inline-flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="text-sm">Email notifications will be sent</span>
                  </Alert>
                )}
                <Button type="submit" disabled={loading || selectedUnits.size === 0 || loadingData} className="min-w-[200px]">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Receipt className="mr-2 h-4 w-4" />
                      Process Posting ({totals.totalUnits} units)
                      {sendEmailNotification && " & Send Email"}
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>

      {/* Email Send Dialog */}
      <EmailSendDialog
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        entityType="contract"
        entityId={0}
        entityData={{
          period: {
            from: form.getValues("PeriodFrom"),
            to: form.getValues("PeriodTo"),
          },
          totals,
          selectedUnits: totals.totalUnits,
        }}
        defaultRecipients={getDefaultEmailRecipients()}
        triggerEvent={emailTriggerEvent}
        onEmailSent={handleEmailSent}
      />
    </div>
  );
};

export default LeaseRevenueForm;
