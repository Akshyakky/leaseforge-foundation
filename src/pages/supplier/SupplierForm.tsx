// src/pages/supplier/SupplierForm.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, Plus, Trash2, AlertTriangle } from "lucide-react";
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
import { Supplier, SupplierType, SupplierContact, SupplierBankDetails, SupplierRequest, PaymentTerm, BankCategory, Bank } from "@/types/supplierTypes";
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
import { paymentTermsService } from "@/services/paymentTermsService";
import { bankService, bankCategoryService } from "@/services/bankService";
import { AttachmentThumbnail } from "@/components/attachments/AttachmentThumbnail";
import { AttachmentPreview } from "@/components/attachments/AttachmentPreview";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { docTypeService } from "@/services/docTypeService";
import { SupplierAttachment } from "@/types/supplierTypes";
import { DocType } from "@/services/docTypeService";
import { Upload, Eye } from "lucide-react";

// Create the schema for supplier form validation
const supplierSchema = z.object({
  SupplierNo: z.string().min(1, "Supplier number is required").max(50, "Supplier number cannot exceed 50 characters"),
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

// Contact schema
const contactSchema = z.object({
  ContactTypeID: z.string().min(1, "Contact type is required"),
  ContactName: z.string().min(1, "Contact name is required").max(200, "Contact name cannot exceed 200 characters"),
  Designation: z.string().max(200, "Designation cannot exceed 200 characters").optional(),
  EmailID: z.string().email("Invalid email address").optional().or(z.literal("")),
  PhoneNo: z.string().max(30, "Phone number cannot exceed 30 characters").optional(),
  MobileNo: z.string().max(30, "Mobile number cannot exceed 30 characters").optional(),
  CountryID: z.string().optional(),
  CityID: z.string().optional(),
  Address: z.string().max(500, "Address cannot exceed 500 characters").optional(),
  IsDefault: z.boolean().default(false),
  Remarks: z.string().max(1000, "Remarks cannot exceed 1000 characters").optional(),
});

// Bank details schema
const bankDetailsSchema = z.object({
  AccountNo: z.string().min(1, "Account number is required").max(50, "Account number cannot exceed 50 characters"),
  BankID: z.string().optional(),
  BranchName: z.string().max(200, "Branch name cannot exceed 200 characters").optional(),
  SwiftCode: z.string().max(15, "SWIFT code cannot exceed 15 characters").optional(),
  IBAN: z.string().max(40, "IBAN cannot exceed 40 characters").optional(),
  CountryID: z.string().optional(),
  CityID: z.string().optional(),
  ContactPerson: z.string().max(200, "Contact person cannot exceed 200 characters").optional(),
  ContactNo: z.string().max(30, "Contact number cannot exceed 30 characters").optional(),
  CategoryID: z.string().optional(),
  IsDefault: z.boolean().default(false),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;
type ContactFormValues = z.infer<typeof contactSchema>;
type BankFormValues = z.infer<typeof bankDetailsSchema>;

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
  const [isBusy, setIsBusy] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

  const [attachments, setAttachments] = useState<SupplierAttachment[]>([]);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<SupplierAttachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Initialize forms
  const supplierForm = useForm<SupplierFormValues>({
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

  const contactForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      ContactTypeID: "",
      ContactName: "",
      Designation: "",
      EmailID: "",
      PhoneNo: "",
      MobileNo: "",
      CountryID: "",
      CityID: "",
      Address: "",
      IsDefault: false,
      Remarks: "",
    },
  });

  const bankForm = useForm<BankFormValues>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      AccountNo: "",
      BankID: "",
      BranchName: "",
      SwiftCode: "",
      IBAN: "",
      CountryID: "",
      CityID: "",
      ContactPerson: "",
      ContactNo: "",
      CategoryID: "",
      IsDefault: false,
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
          // For mock data, we'll create empty arrays
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
        setDocTypes(docTypesData);

        // If editing, fetch the supplier data
        if (isEdit && id) {
          const data = await supplierService.getSupplierById(parseInt(id));

          if (data.supplier) {
            setSupplier(data.supplier);
            setContacts(data.contacts || []);
            setBankDetails(data.bankDetails || []);
            setAttachments(data.attachments || []);

            // Set form values
            supplierForm.reset({
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

            const processedAttachments = (data.attachments || []).map((attachment) => ({
              ...attachment,
              fileUrl: attachment.FileContent ? supplierService.generateAttachmentUrl(attachment) : undefined,
            }));
            setAttachments(processedAttachments);

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
  }, [id, isEdit, navigate, supplierForm]);

  // Handle country change - load cities
  const handleCountryChange = async (value: string) => {
    supplierForm.setValue("CountryID", value);
    supplierForm.setValue("CityID", "");

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

      // Prepare GL account details if creating new account
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
      const requestData: SupplierRequest = {
        supplier: supplierData,
        contacts: contacts,
        bankDetails: bankDetails,
        glAccountDetails: glAccountDetails,
      };

      if (isEdit && supplier) {
        // Update existing supplier
        requestData.supplier.SupplierID = supplier.SupplierID;
        const result = await supplierService.updateSupplier(requestData as SupplierRequest & { supplier: Partial<Supplier> & { SupplierID: number } });

        if (result.Status === 1) {
          toast.success(result.Message);
          navigate("/suppliers");
        } else {
          toast.error(result.Message);
        }
      } else {
        // Create new supplier
        const result = await supplierService.createSupplier(requestData);

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

  // Contact form handlers
  const handleAddContact = async (data: ContactFormValues) => {
    setIsBusy(true);

    try {
      const contactData: Partial<SupplierContact> = {
        ContactTypeID: parseInt(data.ContactTypeID),
        ContactName: data.ContactName,
        Designation: data.Designation,
        EmailID: data.EmailID,
        PhoneNo: data.PhoneNo,
        MobileNo: data.MobileNo,
        CountryID: data.CountryID ? parseInt(data.CountryID) : undefined,
        CityID: data.CityID ? parseInt(data.CityID) : undefined,
        Address: data.Address,
        IsDefault: data.IsDefault,
        Remarks: data.Remarks,
      };

      if (isEdit && supplier) {
        // Add contact to existing supplier
        const result = await supplierService.saveSupplierContact({
          ...contactData,
          SupplierID: supplier.SupplierID,
        });

        if (result.Status === 1) {
          toast.success(result.Message);
          // Refresh contacts
          const updatedData = await supplierService.getSupplierById(supplier.SupplierID);
          setContacts(updatedData.contacts || []);
        } else {
          toast.error(result.Message);
        }
      } else {
        // Add to local state for new supplier
        const newContact = {
          ...contactData,
          SupplierContactID: -(contacts.length + 1), // Temporary ID
          SupplierID: 0, // Will be set when supplier is created
        } as SupplierContact;
        setContacts([...contacts, newContact]);
        toast.success("Contact added successfully");
      }

      // Reset form
      contactForm.reset();
    } catch (error) {
      console.error("Error adding contact:", error);
      toast.error("Failed to add contact");
    } finally {
      setIsBusy(false);
    }
  };

  // Bank details form handlers
  const handleAddBankDetails = async (data: BankFormValues) => {
    setIsBusy(true);

    try {
      const bankData: Partial<SupplierBankDetails> = {
        AccountNo: data.AccountNo,
        BankID: data.BankID ? parseInt(data.BankID) : undefined,
        BranchName: data.BranchName,
        SwiftCode: data.SwiftCode,
        IBAN: data.IBAN,
        CountryID: data.CountryID ? parseInt(data.CountryID) : undefined,
        CityID: data.CityID ? parseInt(data.CityID) : undefined,
        ContactPerson: data.ContactPerson,
        ContactNo: data.ContactNo,
        CategoryID: data.CategoryID ? parseInt(data.CategoryID) : undefined,
        IsDefault: data.IsDefault,
      };

      if (isEdit && supplier) {
        // Add bank details to existing supplier
        const result = await supplierService.saveSupplierBankDetails({
          ...bankData,
          SupplierID: supplier.SupplierID,
        });

        if (result.Status === 1) {
          toast.success(result.Message);
          // Refresh bank details
          const updatedData = await supplierService.getSupplierById(supplier.SupplierID);
          setBankDetails(updatedData.bankDetails || []);
        } else {
          toast.error(result.Message);
        }
      } else {
        // Add to local state for new supplier
        const newBankDetail = {
          ...bankData,
          SupplierBankID: -(bankDetails.length + 1), // Temporary ID
          SupplierID: 0, // Will be set when supplier is created
        } as SupplierBankDetails;
        setBankDetails([...bankDetails, newBankDetail]);
        toast.success("Bank details added successfully");
      }

      // Reset form
      bankForm.reset();
    } catch (error) {
      console.error("Error adding bank details:", error);
      toast.error("Failed to add bank details");
    } finally {
      setIsBusy(false);
    }
  };

  // Delete handlers
  const handleDeleteContact = async (contactId: number) => {
    if (!confirm("Are you sure you want to delete this contact?")) {
      return;
    }

    setIsBusy(true);

    try {
      if (isEdit && supplier && contactId > 0) {
        // Delete from server
        const result = await supplierService.deleteSupplierContact(contactId);
        if (result.Status === 1) {
          toast.success(result.Message);
          const updatedData = await supplierService.getSupplierById(supplier.SupplierID);
          setContacts(updatedData.contacts || []);
        } else {
          toast.error(result.Message);
        }
      } else {
        // Remove from local state
        setContacts(contacts.filter((contact) => contact.SupplierContactID !== contactId));
        toast.success("Contact removed successfully");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteBankDetails = async (bankId: number) => {
    if (!confirm("Are you sure you want to delete these bank details?")) {
      return;
    }

    setIsBusy(true);

    try {
      if (isEdit && supplier && bankId > 0) {
        // Delete from server
        const result = await supplierService.deleteSupplierBankDetails(bankId);
        if (result.Status === 1) {
          toast.success(result.Message);
          const updatedData = await supplierService.getSupplierById(supplier.SupplierID);
          setBankDetails(updatedData.bankDetails || []);
        } else {
          toast.error(result.Message);
        }
      } else {
        // Remove from local state
        setBankDetails(bankDetails.filter((bank) => bank.SupplierBankID !== bankId));
        toast.success("Bank details removed successfully");
      }
    } catch (error) {
      console.error("Error deleting bank details:", error);
      toast.error("Failed to delete bank details");
    } finally {
      setIsBusy(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, docTypeId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (e.g., 10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadingAttachment(true);

    try {
      const newAttachment: Partial<SupplierAttachment> = {
        SupplierAttachmentID: -(attachments.length + 1), // Temporary ID for new attachment
        SupplierID: supplier?.SupplierID || 0,
        DocTypeID: parseInt(docTypeId),
        DocumentName: file.name,
        FileSize: file.size,
        FileContentType: file.type,
        file: file,
        fileUrl: URL.createObjectURL(file),
        DocTypeName: docTypes.find((dt) => dt.DocTypeID === parseInt(docTypeId))?.Description,
      };

      if (isEdit && supplier) {
        // Add attachment to existing supplier
        const result = await supplierService.addSupplierAttachment({
          ...newAttachment,
          SupplierID: supplier.SupplierID,
        });

        if (result.Status === 1) {
          toast.success(result.Message);
          // Refresh attachments
          const updatedData = await supplierService.getSupplierById(supplier.SupplierID);
          const processedAttachments = (updatedData.attachments || []).map((attachment) => ({
            ...attachment,
            fileUrl: attachment.FileContent ? supplierService.generateAttachmentUrl(attachment) : undefined,
          }));
          setAttachments(processedAttachments);
        } else {
          toast.error(result.Message);
        }
      } else {
        // Add to local state for new supplier
        setAttachments([...attachments, newAttachment as SupplierAttachment]);
        toast.success("Attachment added successfully");
      }
    } catch (error) {
      console.error("Error uploading attachment:", error);
      toast.error("Failed to upload attachment");
    } finally {
      setUploadingAttachment(false);
      // Reset file input
      event.target.value = "";
    }
  };

  // Delete attachment handler
  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm("Are you sure you want to delete this attachment?")) {
      return;
    }

    try {
      if (isEdit && supplier && attachmentId > 0) {
        // Delete from server
        const result = await supplierService.deleteSupplierAttachment(attachmentId);
        if (result.Status === 1) {
          toast.success(result.Message);
          const updatedData = await supplierService.getSupplierById(supplier.SupplierID);
          const processedAttachments = (updatedData.attachments || []).map((attachment) => ({
            ...attachment,
            fileUrl: attachment.FileContent ? supplierService.generateAttachmentUrl(attachment) : undefined,
          }));
          setAttachments(processedAttachments);
        } else {
          toast.error(result.Message);
        }
      } else {
        // Remove from local state
        setAttachments(attachments.filter((attachment) => attachment.SupplierAttachmentID !== attachmentId));
        toast.success("Attachment removed successfully");
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Failed to delete attachment");
    }
  };

  // Preview attachment handler
  const handlePreviewAttachment = (attachment: SupplierAttachment) => {
    setSelectedAttachment(attachment);
    setIsPreviewOpen(true);
  };

  // Open gallery handler
  const handleOpenGallery = (attachmentId?: number) => {
    setIsGalleryOpen(true);
    if (attachmentId) {
      // Find and set the initial attachment for gallery
      const attachment = attachments.find((a) => a.SupplierAttachmentID === attachmentId);
      setSelectedAttachment(attachment || null);
    }
  };

  // Cancel button handler
  const handleCancel = () => {
    navigate("/suppliers");
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

      <Form {...supplierForm}>
        <form onSubmit={supplierForm.handleSubmit(onSubmitSupplier)}>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isEdit ? "Edit Supplier" : "Create New Supplier"}</CardTitle>
                <CardDescription>{isEdit ? "Update supplier information" : "Enter the details for the new supplier"}</CardDescription>
              </CardHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-2">
                <div className="px-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic Information</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    <TabsTrigger value="banking">Banking Details</TabsTrigger>
                    <TabsTrigger value="attachments">Attachments</TabsTrigger>
                    <TabsTrigger value="gl-account">GL Account</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="basic" className="p-6 pt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField form={supplierForm} name="SupplierNo" label="Supplier Number" placeholder="Enter supplier number" required />
                    <FormField form={supplierForm} name="SupplierName" label="Supplier Name" placeholder="Enter supplier name" required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      form={supplierForm}
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
                      form={supplierForm}
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
                    <FormField form={supplierForm} name="ChequeName" label="Cheque Name" placeholder="Enter name for cheques" />
                    <div className="space-y-4">
                      <Label>Status</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="status"
                          checked={supplierForm.watch("Status") === "Active"}
                          onCheckedChange={(checked) => supplierForm.setValue("Status", checked ? "Active" : "Inactive")}
                        />
                        <Label htmlFor="status" className="cursor-pointer">
                          {supplierForm.watch("Status")}
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="credit-facility"
                        checked={supplierForm.watch("HasCreditFacility")}
                        onCheckedChange={(checked) => supplierForm.setValue("HasCreditFacility", checked)}
                      />
                      <Label htmlFor="credit-facility" className="cursor-pointer">
                        Has Credit Facility
                      </Label>
                    </div>

                    {supplierForm.watch("HasCreditFacility") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField form={supplierForm} name="CreditLimit" label="Credit Limit" type="number" placeholder="0.00" />
                        <FormField form={supplierForm} name="CreditDays" label="Credit Days" type="number" placeholder="0" />
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField form={supplierForm} name="VatRegNo" label="VAT Registration No" placeholder="Enter VAT number" />
                    <FormField form={supplierForm} name="TaxID" label="Tax ID" placeholder="Enter tax ID" />
                    <FormField form={supplierForm} name="DiscountPercentage" label="Discount %" type="number" placeholder="0.00" min="0" max="100" />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField form={supplierForm} name="PhoneNo" label="Phone Number" placeholder="Enter phone number" />
                    <FormField form={supplierForm} name="FaxNo" label="Fax Number" placeholder="Enter fax number" />
                    <FormField form={supplierForm} name="MobileNo" label="Mobile Number" placeholder="Enter mobile number" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField form={supplierForm} name="Email" label="Email" type="email" placeholder="Enter email address" />
                    <FormField form={supplierForm} name="Website" label="Website" placeholder="Enter website URL" />
                  </div>

                  <FormField form={supplierForm} name="Address" label="Address" type="textarea" placeholder="Enter address" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      form={supplierForm}
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
                      form={supplierForm}
                      name="CityID"
                      label="City"
                      type="select"
                      options={cities.map((city) => ({
                        label: city.CityName,
                        value: city.CityID.toString(),
                      }))}
                      placeholder="Select city"
                      disabled={!supplierForm.watch("CountryID")}
                    />
                  </div>

                  <FormField form={supplierForm} name="Remarks" label="Remarks" type="textarea" placeholder="Enter remarks" />
                </TabsContent>

                <TabsContent value="contacts" className="p-6 pt-4 space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <h3 className="text-lg font-medium mb-4">Current Contacts</h3>
                      {contacts.length === 0 ? (
                        <p className="text-muted-foreground">No contacts have been added for this supplier.</p>
                      ) : (
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Default</TableHead>
                                <TableHead className="w-20">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {contacts.map((contact) => (
                                <TableRow key={contact.SupplierContactID}>
                                  <TableCell>{contact.ContactName}</TableCell>
                                  <TableCell>{contact.ContactTypeDescription || "N/A"}</TableCell>
                                  <TableCell>{contact.EmailID || "-"}</TableCell>
                                  <TableCell>{contact.PhoneNo || contact.MobileNo || "-"}</TableCell>
                                  <TableCell>{contact.IsDefault ? "Yes" : "No"}</TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="icon" disabled={isBusy} onClick={() => handleDeleteContact(contact.SupplierContactID)}>
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <h3 className="text-lg font-medium mb-4">Add Contact</h3>
                      <Form {...contactForm}>
                        <form onSubmit={contactForm.handleSubmit(handleAddContact)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              form={contactForm}
                              name="ContactTypeID"
                              label="Contact Type"
                              type="select"
                              options={contactTypes.map((type) => ({
                                label: type.ContactTypeDescription,
                                value: type.ContactTypeID.toString(),
                              }))}
                              placeholder="Select contact type"
                              required
                            />
                            <FormField form={contactForm} name="ContactName" label="Contact Name" placeholder="Enter contact name" required />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField form={contactForm} name="Designation" label="Designation" placeholder="Enter designation" />
                            <FormField form={contactForm} name="EmailID" label="Email" type="email" placeholder="Enter email" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField form={contactForm} name="PhoneNo" label="Phone" placeholder="Enter phone number" />
                            <FormField form={contactForm} name="MobileNo" label="Mobile" placeholder="Enter mobile number" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              form={contactForm}
                              name="CountryID"
                              label="Country"
                              type="select"
                              options={countries.map((country) => ({
                                label: country.CountryName,
                                value: country.CountryID.toString(),
                              }))}
                              placeholder="Select country"
                            />
                            <FormField
                              form={contactForm}
                              name="CityID"
                              label="City"
                              type="select"
                              options={cities.map((city) => ({
                                label: city.CityName,
                                value: city.CityID.toString(),
                              }))}
                              placeholder="Select city"
                            />
                          </div>
                          <FormField form={contactForm} name="Address" label="Address" type="textarea" placeholder="Enter address" />
                          <FormField form={contactForm} name="Remarks" label="Remarks" type="textarea" placeholder="Enter remarks" />
                          <div className="flex items-center space-x-2">
                            <Switch id="contact-default" checked={contactForm.watch("IsDefault")} onCheckedChange={(checked) => contactForm.setValue("IsDefault", checked)} />
                            <Label htmlFor="contact-default" className="cursor-pointer">
                              Set as default contact
                            </Label>
                          </div>
                          <div className="flex justify-end">
                            <Button type="submit" disabled={isBusy}>
                              {isBusy ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Contact
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="banking" className="p-6 pt-4 space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <h3 className="text-lg font-medium mb-4">Current Bank Details</h3>
                      {bankDetails.length === 0 ? (
                        <p className="text-muted-foreground">No bank details have been added for this supplier.</p>
                      ) : (
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Account No</TableHead>
                                <TableHead>Bank Name</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>SWIFT</TableHead>
                                <TableHead>Default</TableHead>
                                <TableHead className="w-20">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {bankDetails.map((bank) => (
                                <TableRow key={bank.SupplierBankID}>
                                  <TableCell>{bank.AccountNo}</TableCell>
                                  <TableCell>{bank.BankName || "N/A"}</TableCell>
                                  <TableCell>{bank.BranchName || "-"}</TableCell>
                                  <TableCell>{bank.SwiftCode || "-"}</TableCell>
                                  <TableCell>{bank.IsDefault ? "Yes" : "No"}</TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="icon" disabled={isBusy} onClick={() => handleDeleteBankDetails(bank.SupplierBankID)}>
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <h3 className="text-lg font-medium mb-4">Add Bank Details</h3>
                      <Form {...bankForm}>
                        <form onSubmit={bankForm.handleSubmit(handleAddBankDetails)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField form={bankForm} name="AccountNo" label="Account Number" placeholder="Enter account number" required />
                            <FormField
                              form={bankForm}
                              name="BankID"
                              label="Bank"
                              type="select"
                              options={banks.map((bank) => ({
                                label: bank.BankName,
                                value: bank.BankID.toString(),
                              }))}
                              placeholder="Select bank"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField form={bankForm} name="BranchName" label="Branch Name" placeholder="Enter branch name" />
                            <FormField form={bankForm} name="SwiftCode" label="SWIFT Code" placeholder="Enter SWIFT code" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField form={bankForm} name="IBAN" label="IBAN" placeholder="Enter IBAN" />
                            <FormField
                              form={bankForm}
                              name="CategoryID"
                              label="Category"
                              type="select"
                              options={bankCategories.map((category) => ({
                                label: category.CategoryName,
                                value: category.CategoryID.toString(),
                              }))}
                              placeholder="Select category"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              form={bankForm}
                              name="CountryID"
                              label="Country"
                              type="select"
                              options={countries.map((country) => ({
                                label: country.CountryName,
                                value: country.CountryID.toString(),
                              }))}
                              placeholder="Select country"
                            />
                            <FormField
                              form={bankForm}
                              name="CityID"
                              label="City"
                              type="select"
                              options={cities.map((city) => ({
                                label: city.CityName,
                                value: city.CityID.toString(),
                              }))}
                              placeholder="Select city"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField form={bankForm} name="ContactPerson" label="Contact Person" placeholder="Enter contact person" />
                            <FormField form={bankForm} name="ContactNo" label="Contact Number" placeholder="Enter contact number" />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="bank-default" checked={bankForm.watch("IsDefault")} onCheckedChange={(checked) => bankForm.setValue("IsDefault", checked)} />
                            <Label htmlFor="bank-default" className="cursor-pointer">
                              Set as default bank
                            </Label>
                          </div>
                          <div className="flex justify-end">
                            <Button type="submit" disabled={isBusy}>
                              {isBusy ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Bank Details
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="attachments" className="p-6 pt-4 space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <h3 className="text-lg font-medium mb-4">Current Attachments</h3>
                      {attachments.length === 0 ? (
                        <p className="text-muted-foreground">No attachments have been added for this supplier.</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {attachments.map((attachment) => (
                            <div key={attachment.SupplierAttachmentID} className="border rounded-lg p-3 bg-white">
                              <div className="flex justify-center mb-2">
                                <AttachmentThumbnail
                                  fileUrl={attachment.fileUrl}
                                  fileName={attachment.DocumentName || "Document"}
                                  fileType={attachment.FileContentType}
                                  onClick={() => handlePreviewAttachment(attachment)}
                                />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium truncate" title={attachment.DocumentName}>
                                  {attachment.DocumentName}
                                </p>
                                <p className="text-xs text-muted-foreground">{attachment.DocTypeName || "Unknown Type"}</p>
                                {attachment.FileSize && <p className="text-xs text-muted-foreground">{(attachment.FileSize / 1024).toFixed(1)} KB</p>}
                              </div>
                              <div className="flex justify-center mt-2 gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePreviewAttachment(attachment)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-700"
                                  disabled={uploadingAttachment}
                                  onClick={() => handleDeleteAttachment(attachment.SupplierAttachmentID)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {attachments.length > 1 && (
                        <div className="mt-4 text-center">
                          <Button variant="outline" onClick={() => handleOpenGallery()}>
                            <Eye className="mr-2 h-4 w-4" />
                            View All Attachments
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <h3 className="text-lg font-medium mb-4">Upload New Attachment</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="docType">Document Type</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                              <SelectContent>
                                {docTypes.map((docType) => (
                                  <SelectItem key={docType.DocTypeID} value={docType.DocTypeID.toString()}>
                                    {docType.Description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="fileUpload">Choose File</Label>
                            <div className="mt-1">
                              <input
                                id="fileUpload"
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
                                onChange={(e) => {
                                  const docTypeSelect = document.querySelector("[data-doc-type-select]") as HTMLSelectElement;
                                  const selectedDocType = docTypeSelect?.value;
                                  if (!selectedDocType) {
                                    toast.error("Please select a document type first");
                                    return;
                                  }
                                  handleFileUpload(e, selectedDocType);
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById("fileUpload")?.click()}
                                disabled={uploadingAttachment}
                                className="w-full"
                              >
                                {uploadingAttachment ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Choose File
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG, GIF, XLS, XLSX. Maximum file size: 10MB.</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="gl-account" className="p-6 pt-4 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="create-account"
                        checked={supplierForm.watch("CreateNewAccount")}
                        onCheckedChange={(checked) => supplierForm.setValue("CreateNewAccount", checked)}
                      />
                      <Label htmlFor="create-account" className="cursor-pointer">
                        Create new GL account for this supplier
                      </Label>
                    </div>

                    {supplierForm.watch("CreateNewAccount") ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField form={supplierForm} name="AccountCode" label="Account Code" placeholder="Enter account code" />
                        <FormField form={supplierForm} name="AccountName" label="Account Name" placeholder="Enter account name" />
                        <FormField
                          form={supplierForm}
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
                          form={supplierForm}
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
                          form={supplierForm}
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
                          form={supplierForm}
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
              </Tabs>

              <CardFooter className="flex justify-between border-t p-6">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
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
          </div>
        </form>
      </Form>
      {/* Attachment Preview Dialog */}
      {selectedAttachment && (
        <AttachmentPreview
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setSelectedAttachment(null);
          }}
          fileUrl={selectedAttachment.fileUrl}
          fileName={selectedAttachment.DocumentName || "Document"}
          fileType={selectedAttachment.FileContentType}
          fileSize={selectedAttachment.FileSize}
          uploadDate={selectedAttachment.CreatedOn}
          uploadedBy={selectedAttachment.CreatedBy}
          documentType={selectedAttachment.DocTypeName}
          issueDate={selectedAttachment.DocIssueDate}
          expiryDate={selectedAttachment.DocExpiryDate}
        />
      )}

      {/* Attachment Gallery Dialog */}
      <AttachmentGallery
        isOpen={isGalleryOpen}
        onClose={() => {
          setIsGalleryOpen(false);
          setSelectedAttachment(null);
        }}
        attachments={attachments.map((attachment) => ({
          ...attachment,
          DocumentName: attachment.DocumentName,
          FileContentType: attachment.FileContentType,
          FileSize: attachment.FileSize,
          CreatedOn: attachment.CreatedOn,
          CreatedBy: attachment.CreatedBy,
          DocumentDescription: attachment.Remarks,
          DocTypeName: attachment.DocTypeName,
          DocIssueDate: attachment.DocIssueDate,
          DocExpiryDate: attachment.DocExpiryDate,
          fileUrl: attachment.fileUrl,
        }))}
        initialAttachmentId={selectedAttachment?.SupplierAttachmentID}
      />
    </div>
  );
};

export default SupplierForm;
