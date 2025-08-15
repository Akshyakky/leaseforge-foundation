// src/pages/supplier/SupplierForm.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, Plus, Trash2, AlertTriangle, Upload, Eye, Edit } from "lucide-react";
import { supplierService } from "@/services/supplierService";
import { companyService } from "@/services/companyService";
import { currencyService } from "@/services/currencyService";
import { accountService } from "@/services/accountService";
import { countryService } from "@/services/countryService";
import { cityService } from "@/services/cityService";
import { contactTypeService } from "@/services/contactTypeService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/lib/hooks";
import {
  Supplier,
  SupplierType,
  SupplierContact,
  SupplierBankDetails,
  SupplierAttachment,
  SupplierRequest,
  SupplierUpdateRequest,
  PaymentTerm,
  BankCategory,
  Bank,
} from "@/types/supplierTypes";
import { Company } from "@/services/companyService";
import { Currency } from "@/services/currencyService";
import { Account, AccountType } from "@/types/accountTypes";
import { Country } from "@/services/countryService";
import { City } from "@/services/cityService";
import { ContactType } from "@/services/contactTypeService";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { AttachmentThumbnail } from "@/components/attachments/AttachmentThumbnail";
import { AttachmentPreview } from "@/components/attachments/AttachmentPreview";
import { paymentTermsService } from "@/services/paymentTermsService";
import { bankService, bankCategoryService } from "@/services/bankService";
import { docTypeService } from "@/services";

// Create the schema for supplier form validation
const supplierSchema = z.object({
  SupplierNo: z.string().optional(),
  SupplierName: z.string().min(2, "Supplier name must be at least 2 characters").max(200, "Supplier name cannot exceed 200 characters"),
  SupplierTypeID: z.string().optional(),
  PaymentTermID: z.string().optional(),
  ChequeName: z.string().max(200, "Cheque name cannot exceed 200 characters").optional(),
  HasCreditFacility: z.boolean().default(false),
  CreditLimit: z.coerce.number().min(0, "Credit limit cannot be negative").optional(),
  CreditDays: z.coerce.number().min(0, "Credit days cannot be negative").optional(),
  VatRegNo: z.string().max(50, "VAT registration number cannot exceed 50 characters").optional(),
  TaxID: z.string().optional(),
  DiscountPercentage: z.coerce.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%").optional(),
  Status: z.enum(["Active", "Inactive"]).default("Active"),
  PhoneNo: z.string().max(30, "Phone number cannot exceed 30 characters").optional(),
  FaxNo: z.string().max(30, "Fax number cannot exceed 30 characters").optional(),
  MobileNo: z.string().max(30, "Mobile number cannot exceed 30 characters").optional(),
  Email: z.string().email("Invalid email address").optional().or(z.literal("")),
  Website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  Address: z.string().max(500, "Address cannot exceed 500 characters").optional(),
  CountryID: z.string().optional(),
  CityID: z.string().optional(),
  Remarks: z.string().max(1000, "Remarks cannot exceed 1000 characters").optional(),
  // GL Account fields
  CreateNewAccount: z.boolean().default(false),
  AccountID: z.string().optional(),
  AccountCode: z.string().optional(),
  AccountName: z.string().optional(),
  AccountTypeID: z.string().optional(),
  GLCurrencyID: z.string().optional(),
  GLCompanyID: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

const SupplierForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [contacts, setContacts] = useState<SupplierContact[]>([]);
  const [bankDetails, setBankDetails] = useState<SupplierBankDetails[]>([]);
  const [attachments, setAttachments] = useState<SupplierAttachment[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Dialog states
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Partial<SupplierContact> | null>(null);
  const [editingBank, setEditingBank] = useState<Partial<SupplierBankDetails> | null>(null);
  const [editingAttachment, setEditingAttachment] = useState<Partial<SupplierAttachment> | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<SupplierAttachment | null>(null);

  // Reference data states
  const [supplierTypes, setSupplierTypes] = useState<SupplierType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [contactTypes, setContactTypes] = useState<ContactType[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCategories, setBankCategories] = useState<BankCategory[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);

  // Initialize form
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      SupplierNo: "",
      SupplierName: "",
      SupplierTypeID: "",
      PaymentTermID: "",
      ChequeName: "",
      HasCreditFacility: false,
      CreditLimit: 0,
      CreditDays: 0,
      VatRegNo: "",
      TaxID: "",
      DiscountPercentage: 0,
      Status: "Active",
      PhoneNo: "",
      FaxNo: "",
      MobileNo: "",
      Email: "",
      Website: "",
      Address: "",
      CountryID: "",
      CityID: "",
      Remarks: "",
      CreateNewAccount: false,
      AccountID: "",
      AccountCode: "",
      AccountName: "",
      AccountTypeID: "",
      GLCurrencyID: "",
      GLCompanyID: "",
    },
  });

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        setInitialLoading(true);

        // Fetch all reference data in parallel
        const [
          typesData,
          companiesData,
          currenciesData,
          accountsData,
          accountTypesData,
          countriesData,
          contactTypesData,
          paymentTermsData,
          banksData,
          bankCategoriesData,
          docTypesData,
        ] = await Promise.all([
          supplierService.getAllSupplierTypes(),
          companyService.getCompaniesForDropdown(true),
          currencyService.getCurrenciesForDropdown(),
          accountService.getAllAccounts(),
          accountService.getAllAccountTypes(),
          countryService.getAllCountries(),
          contactTypeService.getAllContactTypes(),
          paymentTermsService.getAllPaymentTerms(),
          bankService.getAllBanks(),
          bankCategoryService.getAllBankCategories(),
          docTypeService.getAllDocTypes(),
        ]);

        setSupplierTypes(typesData);
        setCompanies(companiesData);
        setCurrencies(currenciesData);
        setAccounts(accountsData);
        setAccountTypes(accountTypesData);
        setCountries(countriesData);
        setContactTypes(contactTypesData);
        setPaymentTerms(paymentTermsData);
        setBanks(banksData);
        setBankCategories(bankCategoriesData);
        setDocumentTypes(docTypesData);

        // If editing, fetch the supplier data
        if (isEdit && id) {
          const data = await supplierService.getSupplierById(parseInt(id));

          if (data.supplier) {
            setSupplier(data.supplier);
            setContacts(data.contacts || []);
            setBankDetails(data.bankDetails || []);
            setAttachments(data.attachments || []);

            // Set form values
            form.reset({
              SupplierNo: data.supplier.SupplierNo || "",
              SupplierName: data.supplier.SupplierName || "",
              SupplierTypeID: data.supplier.SupplierTypeID?.toString() || "",
              PaymentTermID: data.supplier.PaymentTermID?.toString() || "",
              ChequeName: data.supplier.ChequeName || "",
              HasCreditFacility: data.supplier.HasCreditFacility || false,
              CreditLimit: data.supplier.CreditLimit || 0,
              CreditDays: data.supplier.CreditDays || 0,
              VatRegNo: data.supplier.VatRegNo || "",
              TaxID: data.supplier.TaxID?.toString() || "",
              DiscountPercentage: data.supplier.DiscountPercentage || 0,
              Status: (data.supplier.Status as "Active" | "Inactive") || "Active",
              PhoneNo: data.supplier.PhoneNo || "",
              FaxNo: data.supplier.FaxNo || "",
              MobileNo: data.supplier.MobileNo || "",
              Email: data.supplier.Email || "",
              Website: data.supplier.Website || "",
              Address: data.supplier.Address || "",
              CountryID: data.supplier.CountryID?.toString() || "",
              CityID: data.supplier.CityID?.toString() || "",
              Remarks: data.supplier.Remarks || "",
              CreateNewAccount: false,
              AccountID: data.supplier.AccountID?.toString() || "",
              AccountCode: data.supplier.AccountCode || "",
              AccountName: data.supplier.AccountName || "",
              AccountTypeID: "",
              GLCurrencyID: "",
              GLCompanyID: "",
            });

            // Load cities based on country
            if (data.supplier.CountryID) {
              handleCountryChange(data.supplier.CountryID.toString());
            }
          } else {
            toast.error("Supplier not found");
            navigate("/suppliers");
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

  // Handle country change - load cities
  const handleCountryChange = async (value: string) => {
    form.setValue("CountryID", value);
    form.setValue("CityID", "");

    if (value) {
      try {
        const citiesData = await cityService.getCitiesByCountry(parseInt(value));
        setCities(citiesData);
      } catch (error) {
        console.error("Error loading cities:", error);
        toast.error("Error loading cities");
      }
    } else {
      setCities([]);
    }
  };

  // Submit handler for the supplier form
  const onSubmitSupplier = async (data: SupplierFormValues) => {
    setLoading(true);
    setValidationErrors([]);

    try {
      // Prepare supplier data
      const supplierData: Partial<Supplier> = {
        SupplierNo: data.SupplierNo,
        SupplierName: data.SupplierName,
        SupplierTypeID: data.SupplierTypeID ? parseInt(data.SupplierTypeID) : undefined,
        PaymentTermID: data.PaymentTermID ? parseInt(data.PaymentTermID) : undefined,
        ChequeName: data.ChequeName,
        HasCreditFacility: data.HasCreditFacility,
        CreditLimit: data.CreditLimit,
        CreditDays: data.CreditDays,
        VatRegNo: data.VatRegNo,
        TaxID: data.TaxID ? parseInt(data.TaxID) : undefined,
        DiscountPercentage: data.DiscountPercentage,
        Status: data.Status,
        PhoneNo: data.PhoneNo,
        FaxNo: data.FaxNo,
        MobileNo: data.MobileNo,
        Email: data.Email,
        Website: data.Website,
        Address: data.Address,
        CountryID: data.CountryID ? parseInt(data.CountryID) : undefined,
        CityID: data.CityID ? parseInt(data.CityID) : undefined,
        Remarks: data.Remarks,
      };

      // Prepare GL account details
      let glAccountDetails;
      if (data.CreateNewAccount) {
        glAccountDetails = {
          createNewAccount: true,
          accountCode: data.AccountCode,
          accountName: data.AccountName,
          accountTypeID: data.AccountTypeID ? parseInt(data.AccountTypeID) : undefined,
          currencyID: data.GLCurrencyID ? parseInt(data.GLCurrencyID) : undefined,
          companyID: data.GLCompanyID ? parseInt(data.GLCompanyID) : undefined,
        };
      } else if (data.AccountID) {
        glAccountDetails = {
          createNewAccount: false,
          accountID: parseInt(data.AccountID),
        };
      }

      // Prepare the request
      const requestData: SupplierRequest | SupplierUpdateRequest = {
        supplier: supplierData,
        contacts: contacts,
        bankDetails: bankDetails,
        attachments: attachments,
        glAccountDetails: glAccountDetails,
      };

      if (isEdit && supplier) {
        // Update existing supplier
        (requestData as SupplierUpdateRequest).supplier.SupplierID = supplier.SupplierID;
        const result = await supplierService.updateSupplier(requestData as SupplierUpdateRequest);

        if (result.Status === 1) {
          toast.success(result.Message);
          navigate("/suppliers");
        } else {
          toast.error(result.Message);
        }
      } else {
        // Create new supplier
        const result = await supplierService.createSupplier(requestData as SupplierRequest);

        if (result.Status === 1) {
          toast.success(result.Message);
          navigate("/suppliers");
        } else {
          toast.error(result.Message);
        }
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast.error("Failed to save supplier");
    } finally {
      setLoading(false);
    }
  };

  // Attachment handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditingAttachment((prev) => ({
        ...prev,
        file,
        DocumentName: prev?.DocumentName || file.name,
        FileSize: file.size,
        FileContentType: file.type,
      }));
    }
  };

  const handleAddAttachment = () => {
    setEditingAttachment({
      DocumentName: "",
      DocTypeID: undefined,
    });
    setAttachmentDialogOpen(true);
  };

  const handleEditAttachment = (attachment: SupplierAttachment) => {
    setEditingAttachment(attachment);
    setAttachmentDialogOpen(true);
  };

  const handleSaveAttachment = () => {
    if (editingAttachment && editingAttachment.DocumentName) {
      const existingIndex = attachments.findIndex((a) => a.SupplierAttachmentID === editingAttachment.SupplierAttachmentID);

      if (existingIndex >= 0) {
        const updatedAttachments = [...attachments];
        updatedAttachments[existingIndex] = editingAttachment as SupplierAttachment;
        setAttachments(updatedAttachments);
      } else {
        const newAttachment = {
          ...editingAttachment,
          SupplierAttachmentID: -(attachments.length + 1), // Temporary ID
          SupplierID: supplier?.SupplierID || 0,
        } as SupplierAttachment;
        setAttachments([...attachments, newAttachment]);
      }

      setAttachmentDialogOpen(false);
      setEditingAttachment(null);
    }
  };

  const handleDeleteAttachment = (index: number) => {
    if (confirm("Are you sure you want to delete this attachment?")) {
      const updatedAttachments = attachments.filter((_, i) => i !== index);
      setAttachments(updatedAttachments);
      toast.success("Attachment deleted successfully");
    }
  };

  const handlePreviewAttachment = (attachment: SupplierAttachment) => {
    setPreviewAttachment(attachment);
    setPreviewDialogOpen(true);
  };

  // Contact management functions
  const handleAddContact = () => {
    setEditingContact({
      ContactName: "",
      IsDefault: contacts.length === 0,
    });
    setContactDialogOpen(true);
  };

  const handleEditContact = (contact: SupplierContact) => {
    setEditingContact(contact);
    setContactDialogOpen(true);
  };

  const handleSaveContact = () => {
    if (editingContact && editingContact.ContactName) {
      const existingIndex = contacts.findIndex((c) => c.SupplierContactID === editingContact.SupplierContactID);

      if (existingIndex >= 0) {
        const updatedContacts = [...contacts];
        updatedContacts[existingIndex] = editingContact as SupplierContact;
        setContacts(updatedContacts);
      } else {
        const newContact = {
          ...editingContact,
          SupplierContactID: -(contacts.length + 1), // Temporary ID
          SupplierID: supplier?.SupplierID || 0,
        } as SupplierContact;
        setContacts([...contacts, newContact]);
      }

      setContactDialogOpen(false);
      setEditingContact(null);
      toast.success("Contact saved successfully");
    }
  };

  const handleDeleteContact = (index: number) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      const updatedContacts = contacts.filter((_, i) => i !== index);
      setContacts(updatedContacts);
      toast.success("Contact deleted successfully");
    }
  };

  // Bank details management functions
  const handleAddBank = () => {
    setEditingBank({
      AccountNo: "",
      IsDefault: bankDetails.length === 0,
    });
    setBankDialogOpen(true);
  };

  const handleEditBank = (bank: SupplierBankDetails) => {
    setEditingBank(bank);
    setBankDialogOpen(true);
  };

  const handleSaveBank = () => {
    if (editingBank && editingBank.AccountNo) {
      const existingIndex = bankDetails.findIndex((b) => b.SupplierBankID === editingBank.SupplierBankID);

      if (existingIndex >= 0) {
        const updatedBanks = [...bankDetails];
        updatedBanks[existingIndex] = editingBank as SupplierBankDetails;
        setBankDetails(updatedBanks);
      } else {
        const newBank = {
          ...editingBank,
          SupplierBankID: -(bankDetails.length + 1), // Temporary ID
          SupplierID: supplier?.SupplierID || 0,
        } as SupplierBankDetails;
        setBankDetails([...bankDetails, newBank]);
      }

      setBankDialogOpen(false);
      setEditingBank(null);
      toast.success("Bank details saved successfully");
    }
  };

  const handleDeleteBank = (index: number) => {
    if (confirm("Are you sure you want to delete these bank details?")) {
      const updatedBanks = bankDetails.filter((_, i) => i !== index);
      setBankDetails(updatedBanks);
      toast.success("Bank details deleted successfully");
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
        <Button variant="outline" size="icon" onClick={() => navigate("/suppliers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Supplier" : "Create Supplier"}</h1>
      </div>

      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitSupplier)}>
          <Card>
            <CardHeader>
              <CardTitle>{isEdit ? "Edit Supplier" : "Create New Supplier"}</CardTitle>
              <CardDescription>{isEdit ? "Update supplier information" : "Enter the details for the new supplier"}</CardDescription>
            </CardHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-2">
              <div className="px-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                  <TabsTrigger value="banking">Banking Details</TabsTrigger>
                  <TabsTrigger value="gl-account">GL Account</TabsTrigger>
                  <TabsTrigger value="attachments">Attachments</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="basic" className="p-6 pt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField form={form} name="SupplierNo" label="Supplier Number" placeholder="Enter supplier number or leave empty to auto-generate" />
                  <FormField form={form} name="SupplierName" label="Supplier Name" placeholder="Enter supplier name" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    form={form}
                    name="SupplierTypeID"
                    label="Supplier Type"
                    type="select"
                    options={supplierTypes.map((type) => ({
                      label: type.SupplierTypeName,
                      value: type.SupplierTypeID.toString(),
                    }))}
                    placeholder="Select supplier type"
                  />
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
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField form={form} name="ChequeName" label="Cheque Name" placeholder="Enter name for cheques" />
                  <div className="space-y-4">
                    <Label>Status</Label>
                    <div className="flex items-center space-x-2">
                      <Switch id="status" checked={form.watch("Status") === "Active"} onCheckedChange={(checked) => form.setValue("Status", checked ? "Active" : "Inactive")} />
                      <Label htmlFor="status" className="cursor-pointer">
                        {form.watch("Status")}
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="credit-facility" checked={form.watch("HasCreditFacility")} onCheckedChange={(checked) => form.setValue("HasCreditFacility", checked)} />
                    <Label htmlFor="credit-facility" className="cursor-pointer">
                      Has Credit Facility
                    </Label>
                  </div>

                  {form.watch("HasCreditFacility") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField form={form} name="CreditLimit" label="Credit Limit" type="number" placeholder="0.00" />
                      <FormField form={form} name="CreditDays" label="Credit Days" type="number" placeholder="0" />
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField form={form} name="VatRegNo" label="VAT Registration No" placeholder="Enter VAT number" />
                  <FormField form={form} name="TaxID" label="Tax ID" placeholder="Enter tax ID" />
                  <FormField form={form} name="DiscountPercentage" label="Discount %" type="number" placeholder="0.00" min="0" max="100" />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField form={form} name="PhoneNo" label="Phone Number" placeholder="Enter phone number" />
                  <FormField form={form} name="FaxNo" label="Fax Number" placeholder="Enter fax number" />
                  <FormField form={form} name="MobileNo" label="Mobile Number" placeholder="Enter mobile number" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField form={form} name="Email" label="Email" type="email" placeholder="Enter email address" />
                  <FormField form={form} name="Website" label="Website" placeholder="Enter website URL" />
                </div>

                <FormField form={form} name="Address" label="Address" type="textarea" placeholder="Enter address" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    form={form}
                    name="CountryID"
                    label="Country"
                    type="select"
                    options={countries.map((country) => ({
                      label: country.CountryName,
                      value: country.CountryID.toString(),
                    }))}
                    placeholder="Select country"
                    onChange={handleCountryChange}
                  />
                  <FormField
                    form={form}
                    name="CityID"
                    label="City"
                    type="select"
                    options={cities.map((city) => ({
                      label: city.CityName,
                      value: city.CityID.toString(),
                    }))}
                    placeholder="Select city"
                    disabled={!form.watch("CountryID")}
                  />
                </div>

                <FormField form={form} name="Remarks" label="Remarks" type="textarea" placeholder="Enter remarks" />
              </TabsContent>

              <TabsContent value="contacts" className="p-6 pt-4 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Contact Information</h3>
                  <Button type="button" onClick={handleAddContact}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contact
                  </Button>
                </div>

                {contacts.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No contacts have been added for this supplier.</div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Designation</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Default</TableHead>
                          <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contacts.map((contact, index) => (
                          <TableRow key={contact.SupplierContactID || index}>
                            <TableCell>{contact.ContactName}</TableCell>
                            <TableCell>{contact.Designation || "-"}</TableCell>
                            <TableCell>{contact.EmailID || "-"}</TableCell>
                            <TableCell>{contact.PhoneNo || contact.MobileNo || "-"}</TableCell>
                            <TableCell>{contact.IsDefault && <Badge variant="default">Default</Badge>}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleEditContact(contact)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteContact(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="banking" className="p-6 pt-4 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Banking Information</h3>
                  <Button type="button" onClick={handleAddBank}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Bank Details
                  </Button>
                </div>

                {bankDetails.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No bank details have been added for this supplier.</div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account Number</TableHead>
                          <TableHead>Bank</TableHead>
                          <TableHead>Branch</TableHead>
                          <TableHead>IBAN</TableHead>
                          <TableHead>Default</TableHead>
                          <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bankDetails.map((bank, index) => (
                          <TableRow key={bank.SupplierBankID || index}>
                            <TableCell>{bank.AccountNo}</TableCell>
                            <TableCell>{bank.BankName || "-"}</TableCell>
                            <TableCell>{bank.BranchName || "-"}</TableCell>
                            <TableCell>{bank.IBAN || "-"}</TableCell>
                            <TableCell>{bank.IsDefault && <Badge variant="default">Default</Badge>}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleEditBank(bank)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteBank(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="gl-account" className="p-6 pt-4 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="create-account" checked={form.watch("CreateNewAccount")} onCheckedChange={(checked) => form.setValue("CreateNewAccount", checked)} />
                    <Label htmlFor="create-account" className="cursor-pointer">
                      Create new GL account for this supplier
                    </Label>
                  </div>

                  {form.watch("CreateNewAccount") ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField form={form} name="AccountCode" label="Account Code" placeholder="Enter account code" />
                      <FormField form={form} name="AccountName" label="Account Name" placeholder="Enter account name" />
                      <FormField
                        form={form}
                        name="AccountTypeID"
                        label="Account Type"
                        type="select"
                        options={accountTypes.map((type) => ({
                          label: type.AccountTypeName,
                          value: type.AccountTypeID.toString(),
                        }))}
                        placeholder="Select account type"
                      />
                      <FormField
                        form={form}
                        name="GLCurrencyID"
                        label="Currency"
                        type="select"
                        options={currencies.map((currency) => ({
                          label: `${currency.CurrencyCode} - ${currency.CurrencyName}`,
                          value: currency.CurrencyID.toString(),
                        }))}
                        placeholder="Select currency"
                      />
                      <FormField
                        form={form}
                        name="GLCompanyID"
                        label="Company"
                        type="select"
                        options={companies.map((company) => ({
                          label: company.CompanyName,
                          value: company.CompanyID.toString(),
                        }))}
                        placeholder="Select company"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        form={form}
                        name="AccountID"
                        label="Existing Account"
                        type="select"
                        options={accounts.map((account) => ({
                          label: `${account.AccountCode} - ${account.AccountName}`,
                          value: account.AccountID.toString(),
                        }))}
                        placeholder="Select existing account"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="p-6 pt-4 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Attachments</h3>
                  <Button type="button" onClick={handleAddAttachment}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Attachment
                  </Button>
                </div>

                {attachments.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No attachments have been added for this supplier.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attachments.map((attachment, index) => (
                      <Card key={attachment.SupplierAttachmentID || index} className="p-4">
                        <div className="flex items-start space-x-3">
                          <AttachmentThumbnail
                            fileUrl={attachment.fileUrl}
                            fileName={attachment.DocumentName || "Document"}
                            fileType={attachment.FileContentType}
                            onClick={() => handlePreviewAttachment(attachment)}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{attachment.DocumentName}</h4>
                            <p className="text-xs text-muted-foreground">{attachment.DocTypeName}</p>
                            {attachment.FileSize && <p className="text-xs text-muted-foreground">{Math.round(attachment.FileSize / 1024)} KB</p>}
                            <div className="flex space-x-2 mt-2">
                              <Button type="button" variant="ghost" size="sm" onClick={() => handlePreviewAttachment(attachment)}>
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => handleEditAttachment(attachment)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteAttachment(index)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <CardFooter className="flex justify-between border-t p-6">
              <Button type="button" variant="outline" onClick={() => navigate("/suppliers")} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Supplier
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingContact?.SupplierContactID ? "Edit Contact" : "Add Contact"}</DialogTitle>
            <DialogDescription>Enter the contact information for this supplier.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact-name">Contact Name *</Label>
              <Input
                id="contact-name"
                value={editingContact?.ContactName || ""}
                onChange={(e) => setEditingContact((prev) => ({ ...prev, ContactName: e.target.value }))}
                placeholder="Enter contact name"
              />
            </div>
            <div>
              <Label htmlFor="contact-designation">Designation</Label>
              <Input
                id="contact-designation"
                value={editingContact?.Designation || ""}
                onChange={(e) => setEditingContact((prev) => ({ ...prev, Designation: e.target.value }))}
                placeholder="Enter designation"
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={editingContact?.EmailID || ""}
                onChange={(e) => setEditingContact((prev) => ({ ...prev, EmailID: e.target.value }))}
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                value={editingContact?.PhoneNo || ""}
                onChange={(e) => setEditingContact((prev) => ({ ...prev, PhoneNo: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div className="col-span-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="contact-default"
                  checked={editingContact?.IsDefault || false}
                  onCheckedChange={(checked) => setEditingContact((prev) => ({ ...prev, IsDefault: checked }))}
                />
                <Label htmlFor="contact-default">Set as default contact</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveContact}>
              Save Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bank Dialog */}
      <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBank?.SupplierBankID ? "Edit Bank Details" : "Add Bank Details"}</DialogTitle>
            <DialogDescription>Enter the banking information for this supplier.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank-account">Account Number *</Label>
              <Input
                id="bank-account"
                value={editingBank?.AccountNo || ""}
                onChange={(e) => setEditingBank((prev) => ({ ...prev, AccountNo: e.target.value }))}
                placeholder="Enter account number"
              />
            </div>
            <div>
              <Label htmlFor="bank-name">Bank</Label>
              <Select value={editingBank?.BankID?.toString() || ""} onValueChange={(value) => setEditingBank((prev) => ({ ...prev, BankID: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.BankID} value={bank.BankID.toString()}>
                      {bank.BankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bank-branch">Branch Name</Label>
              <Input
                id="bank-branch"
                value={editingBank?.BranchName || ""}
                onChange={(e) => setEditingBank((prev) => ({ ...prev, BranchName: e.target.value }))}
                placeholder="Enter branch name"
              />
            </div>
            <div>
              <Label htmlFor="bank-iban">IBAN</Label>
              <Input id="bank-iban" value={editingBank?.IBAN || ""} onChange={(e) => setEditingBank((prev) => ({ ...prev, IBAN: e.target.value }))} placeholder="Enter IBAN" />
            </div>
            <div className="col-span-2">
              <div className="flex items-center space-x-2">
                <Switch id="bank-default" checked={editingBank?.IsDefault || false} onCheckedChange={(checked) => setEditingBank((prev) => ({ ...prev, IsDefault: checked }))} />
                <Label htmlFor="bank-default">Set as default bank</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBankDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveBank}>
              Save Bank Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attachment Dialog */}
      <Dialog open={attachmentDialogOpen} onOpenChange={setAttachmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAttachment?.SupplierAttachmentID ? "Edit Attachment" : "Add Attachment"}</DialogTitle>
            <DialogDescription>Upload and configure attachment details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="attachment-name">Document Name *</Label>
              <Input
                id="attachment-name"
                value={editingAttachment?.DocumentName || ""}
                onChange={(e) => setEditingAttachment((prev) => ({ ...prev, DocumentName: e.target.value }))}
                placeholder="Enter document name"
              />
            </div>
            <div>
              <Label htmlFor="attachment-type">Document Type</Label>
              <Select value={editingAttachment?.DocTypeID?.toString() || ""} onValueChange={(value) => setEditingAttachment((prev) => ({ ...prev, DocTypeID: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.DocTypeID} value={type.DocTypeID.toString()}>
                      {type.Description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issue-date">Issue Date</Label>
                <DatePicker
                  value={editingAttachment?.DocIssueDate ? new Date(editingAttachment.DocIssueDate) : undefined}
                  onChange={(date) => setEditingAttachment((prev) => ({ ...prev, DocIssueDate: date }))}
                />
              </div>
              <div>
                <Label htmlFor="expiry-date">Expiry Date</Label>
                <DatePicker
                  value={editingAttachment?.DocExpiryDate ? new Date(editingAttachment.DocExpiryDate) : undefined}
                  onChange={(date) => setEditingAttachment((prev) => ({ ...prev, DocExpiryDate: date }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="attachment-file">File</Label>
              <Input id="attachment-file" type="file" onChange={handleFileUpload} accept="*/*" />
              {editingAttachment?.file && <p className="text-sm text-muted-foreground mt-1">Selected: {editingAttachment.file.name}</p>}
            </div>
            <div>
              <Label htmlFor="attachment-remarks">Remarks</Label>
              <Textarea
                id="attachment-remarks"
                value={editingAttachment?.Remarks || ""}
                onChange={(e) => setEditingAttachment((prev) => ({ ...prev, Remarks: e.target.value }))}
                placeholder="Enter remarks"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAttachmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveAttachment}>
              Save Attachment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {previewAttachment && (
        <AttachmentPreview
          isOpen={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          fileUrl={previewAttachment.fileUrl}
          fileName={previewAttachment.DocumentName || "Document"}
          fileType={previewAttachment.FileContentType}
          fileSize={previewAttachment.FileSize}
          uploadDate={previewAttachment.CreatedOn}
          uploadedBy={previewAttachment.CreatedBy}
          description={previewAttachment.Remarks}
          documentType={previewAttachment.DocTypeName}
          issueDate={previewAttachment.DocIssueDate}
          expiryDate={previewAttachment.DocExpiryDate}
        />
      )}
    </div>
  );
};

export default SupplierForm;
