import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, Plus, Trash2, Edit2, X, Mail, Phone, Home, PlusCircle } from "lucide-react";
import { customerService } from "@/services/customerService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/lib/hooks";
import { Customer, CustomerContact, CustomerAttachment, CustomerType, ContactType, DocType, AccountType, Currency, Company } from "@/types/customerTypes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Country, countryService } from "@/services/countryService";
import { City, cityService } from "@/services/cityService";
import { accountService, companyService, contactTypeService, currencyService, docTypeService } from "@/services";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const CreateDocTypeDialog = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (docType: DocType) => void }) => {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!description.trim()) {
        toast.error("Description is required");
        return;
      }

      const newTypeId = await docTypeService.createDocType({
        Description: description,
      });

      if (newTypeId) {
        const newDocType: DocType = {
          DocTypeID: newTypeId,
          Description: description,
        };
        onSave(newDocType);
        setDescription("");
        onClose();
      }
    } catch (error) {
      console.error("Error creating document type:", error);
      toast.error("Failed to create document type");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Document Type</DialogTitle>
          <DialogDescription>Add a new document type to use in the system</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="docTypeDescription" className="text-sm font-medium">
                Description
              </label>
              <Input id="docTypeDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter document type description" required />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CreateContactTypeDialog = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (contactType: ContactType) => void }) => {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!description.trim()) {
        toast.error("Description is required");
        return;
      }

      const newTypeId = await contactTypeService.createContactType({
        ContactTypeDescription: description,
      });

      if (newTypeId) {
        const newContactType: ContactType = {
          ContactTypeID: newTypeId,
          ContactTypeDescription: description,
        };
        onSave(newContactType);
        setDescription("");
        onClose();
      }
    } catch (error) {
      console.error("Error creating contact type:", error);
      toast.error("Failed to create contact type");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Contact Type</DialogTitle>
          <DialogDescription>Add a new contact type to use in the system</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="contactTypeDescription" className="text-sm font-medium">
                Description
              </label>
              <Input id="contactTypeDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter contact type description" required />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Create the schema for customer form validation
const customerSchema = z
  .object({
    CustomerNo: z.string().optional(),
    TypeID: z.string().optional(),
    FirstName: z.string().min(2, "First name must be at least 2 characters").optional(),
    LastName: z.string().min(2, "Last name must be at least 2 characters").optional(),
    CustomerFullName: z.string().min(2, "Customer name must be at least 2 characters"),
    Gender: z.string().optional(),
    BirthDate: z.date().optional().nullable(),
    CountryID: z.string().optional(),
    CityID: z.string().optional(),
    Address: z.string().optional(),
    // Primary contact fields
    PrimaryContactName: z.string().optional(),
    PrimaryEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
    PrimaryPhone: z.string().optional(),
    TaxRegNo: z.string().min(1, "Tax registration number is required"),
    CustomerIdentityNo: z.string().optional(),
    AccountCode: z.string().optional(),
    AccountName: z.string().optional(),
    Remark: z.string().optional(),
    // GL-related fields
    CreateNewAccount: z.boolean().optional(),
    AccountTypeID: z.string().optional(),
    CurrencyID: z.string().optional(),
    CompanyID: z.string().optional(),
  })
  .refine(
    (data) => {
      // If CreateNewAccount is true, require GL fields
      if (data.CreateNewAccount) {
        return data.AccountCode && data.AccountName && data.AccountTypeID && data.CurrencyID && data.CompanyID;
      }
      return true;
    },
    {
      message: "Account Code, Account Name, Account Type, Currency, and Company are required when creating a new account",
      path: ["CreateNewAccount"],
    }
  );

// Contact form schema (for additional contacts)
const contactSchema = z.object({
  ContactTypeID: z.string().min(1, "Contact type is required"),
  ContactName: z.string().min(2, "Contact name is required"),
  EmailID: z.string().email("Invalid email address").optional().or(z.literal("")),
  CountryID: z.string().optional(),
  CityID: z.string().optional(),
  ContactNo: z.string().optional(),
  Address: z.string().optional(),
});

// Attachment form schema
const attachmentSchema = z.object({
  DocTypeID: z.string().min(1, "Document type is required"),
  DocumentName: z.string().min(2, "Document name is required"),
  file: z.instanceof(File).optional(),
  DocIssueDate: z.date().optional().nullable(),
  DocExpiryDate: z.date().optional().nullable(),
  Remark: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;
type ContactFormValues = z.infer<typeof contactSchema>;
type AttachmentFormValues = z.infer<typeof attachmentSchema>;

const CustomerForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [attachments, setAttachments] = useState<CustomerAttachment[]>([]);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CustomerContact | null>(null);
  const [editingAttachment, setEditingAttachment] = useState<CustomerAttachment | null>(null);

  // Reference data
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
  const [contactTypes, setContactTypes] = useState<ContactType[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocType[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);

  // GL-related state
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // State for file upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isContactTypeDialogOpen, setIsContactTypeDialogOpen] = useState(false);
  const [isDocTypeDialogOpen, setIsDocTypeDialogOpen] = useState(false);

  // --- Automation tracking refs ---
  const fullNameManuallyEdited = useRef(false);
  const accountNameManuallyEdited = useRef(false);
  const documentNameManuallyEdited = useRef(false);
  const contactPersonManuallyEdited = useRef(false);

  // Initialize forms
  const customerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      CustomerNo: "",
      TypeID: "",
      FirstName: "",
      LastName: "",
      CustomerFullName: "",
      Gender: "",
      BirthDate: null,
      CountryID: "",
      CityID: "",
      Address: "",
      PrimaryContactName: "",
      PrimaryEmail: "",
      PrimaryPhone: "",
      TaxRegNo: "",
      CustomerIdentityNo: "",
      AccountCode: "",
      AccountName: "",
      Remark: "",
      CreateNewAccount: false,
      AccountTypeID: "",
      CurrencyID: "",
      CompanyID: "",
    },
  });

  const contactForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      ContactTypeID: "",
      ContactName: "",
      EmailID: "",
      CountryID: "",
      CityID: "",
      ContactNo: "",
      Address: "",
    },
  });

  const attachmentForm = useForm<AttachmentFormValues>({
    resolver: zodResolver(attachmentSchema),
    defaultValues: {
      DocTypeID: "",
      DocumentName: "",
      file: undefined,
      DocIssueDate: null,
      DocExpiryDate: null,
      Remark: "",
    },
  });

  // Watch CreateNewAccount value to toggle required fields
  const createNewAccount = customerForm.watch("CreateNewAccount");
  // Watch fields for automation
  const firstName = customerForm.watch("FirstName");
  const lastName = customerForm.watch("LastName");
  const customerFullName = customerForm.watch("CustomerFullName");
  const accountName = customerForm.watch("AccountName");
  const docTypeId = attachmentForm.watch("DocTypeID");
  const documentName = attachmentForm.watch("DocumentName");

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Fetch reference data in parallel
        const [typesData, contactTypesData, docTypesData, countriesData, accountTypesData, currenciesData, companiesData] = await Promise.all([
          customerService.getCustomerTypes(),
          contactTypeService.getAllContactTypes(),
          docTypeService.getAllDocTypes(),
          countryService.getCountriesForDropdown(),
          accountService.getAllAccountTypes(),
          currencyService.getCurrenciesForDropdown(),
          companyService.getCompaniesForDropdown(),
        ]);

        setCustomerTypes(typesData);
        setContactTypes(contactTypesData);
        setDocumentTypes(docTypesData);
        setCountries(countriesData);
        setAccountTypes(accountTypesData);
        setCurrencies(currenciesData);
        setCompanies(companiesData);

        if (companiesData && !isEdit) {
          const defaultCompany = companiesData[0];
          customerForm.setValue("CompanyID", defaultCompany.CompanyID.toString());
        }
        if (currenciesData && !isEdit) {
          const defaultCurrency = currenciesData[0];
          customerForm.setValue("CurrencyID", defaultCurrency.CurrencyID.toString());
        }

        if (countriesData && !isEdit) {
          const defaultCountry = await countryService.getDefaultCountry();
          customerForm.setValue("CountryID", defaultCountry.CountryID.toString());
          handleCountryChange(defaultCountry.CountryID.toString());
        }

        // If editing, fetch the customer data
        if (isEdit && id) {
          const customerData = await customerService.getCustomerById(parseInt(id));

          if (customerData.customer) {
            setCustomer(customerData.customer);
            setContacts(customerData.contacts || []);
            setAttachments(customerData.attachments || []);

            // Find primary contact (first contact or one marked as primary)
            const primaryContact = customerData.contacts && customerData.contacts.length > 0 ? customerData.contacts[0] : null;

            // Set form values
            customerForm.reset({
              CustomerNo: customerData.customer.CustomerNo || "",
              TypeID: customerData.customer.TypeID?.toString() || "",
              FirstName: customerData.customer.FirstName || "",
              LastName: customerData.customer.LastName || "",
              CustomerFullName: customerData.customer.CustomerFullName || "",
              Gender: customerData.customer.Gender || "",
              BirthDate: customerData.customer.BirthDate ? new Date(customerData.customer.BirthDate) : null,
              CountryID: customerData.customer.CountryID?.toString() || "",
              CityID: customerData.customer.CityID?.toString() || "",
              Address: customerData.customer.Address || "",
              // Set primary contact values from first contact
              PrimaryContactName: primaryContact?.ContactName || "",
              PrimaryEmail: primaryContact?.EmailID || "",
              PrimaryPhone: primaryContact?.ContactNo || "",
              TaxRegNo: customerData.customer.TaxRegNo || "",
              CustomerIdentityNo: customerData.customer.CustomerIdentityNo || "",
              AccountCode: customerData.customer.AccountCode || "",
              AccountName: customerData.customer.AccountName || "",
              Remark: customerData.customer.Remark || "",
              CreateNewAccount: customerData.customer.CreateNewAccount || false,
              AccountTypeID: customerData.customer.AccountTypeID?.toString() || "",
              CurrencyID: customerData.customer.CurrencyID?.toString() || "",
              CompanyID: customerData.customer.CompanyID?.toString() || "",
            });
          } else {
            toast.error("Customer not found");
            navigate("/customers");
          }
        }
        if (isEdit && customer?.CountryID) {
          const citiesData = await cityService.getCitiesByCountry(customer.CountryID);
          setCities(citiesData);
          setSelectedCountryId(customer.CountryID.toString());
        }
      } catch (error) {
        console.error("Error initializing form:", error);
        toast.error("Error loading form data");
      } finally {
        setInitialLoading(false);
      }
    };

    initializeForm();
  }, [id, isEdit, navigate, customerForm, contactForm, attachmentForm]);

  // --- Automation for Full Name and Account Name and Contact Person ---
  useEffect(() => {
    // Only autofill if not manually edited
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    if (!fullNameManuallyEdited.current) {
      if (fullName && customerFullName !== fullName) {
        customerForm.setValue("CustomerFullName", fullName);
      }
    }
    if (!accountNameManuallyEdited.current) {
      if (fullName && accountName !== fullName) {
        customerForm.setValue("AccountName", fullName);
      }
    }
    if (!contactPersonManuallyEdited.current) {
      if (fullName && customerForm.getValues("PrimaryContactName") !== fullName) {
        customerForm.setValue("PrimaryContactName", fullName);
      }
    }
  }, [firstName, lastName]);

  // --- Automation for Document Name ---
  useEffect(() => {
    if (!documentNameManuallyEdited.current && docTypeId) {
      const docType = documentTypes.find((d) => d.DocTypeID.toString() === docTypeId);
      if (docType && documentName !== docType.Description) {
        attachmentForm.setValue("DocumentName", docType.Description);
      }
    }
  }, [docTypeId, documentTypes]);

  // --- Track manual edits for Full Name, Account Name, Document Name, Contact Person ---
  // For CustomerFullName, AccountName, PrimaryContactName
  useEffect(() => {
    const subscription = customerForm.watch((value, { name, type }) => {
      if (name === "CustomerFullName" && type === "change") {
        fullNameManuallyEdited.current = true;
      }
      if (name === "AccountName" && type === "change") {
        accountNameManuallyEdited.current = true;
      }
      if (name === "PrimaryContactName" && type === "change") {
        contactPersonManuallyEdited.current = true;
      }
    });
    return () => subscription.unsubscribe();
  }, [customerForm]);
  // For DocumentName
  useEffect(() => {
    const subscription = attachmentForm.watch((value, { name, type }) => {
      if (name === "DocumentName" && type === "change") {
        documentNameManuallyEdited.current = true;
      }
    });
    return () => subscription.unsubscribe();
  }, [attachmentForm]);

  const handleSaveDocType = (newDocType: DocType) => {
    setDocumentTypes([...documentTypes, newDocType]);
    toast.success(`Document type "${newDocType.Description}" created successfully`);
  };

  const handleSaveContactType = (newContactType: ContactType) => {
    setContactTypes([...contactTypes, newContactType]);
    toast.success(`Contact type "${newContactType.ContactTypeDescription}" created successfully`);
  };

  useEffect(() => {
    const fetchCitiesByCountry = async () => {
      if (selectedCountryId) {
        try {
          const citiesData = await cityService.getCitiesByCountry(parseInt(selectedCountryId));
          setCities(citiesData);
        } catch (error) {
          console.error("Error fetching cities:", error);
          setCities([]);
        }
      } else {
        setCities([]);
      }
    };

    fetchCitiesByCountry();
  }, [selectedCountryId]);

  // Submit handler for the customer form
  const onSubmitCustomer = async (data: CustomerFormValues) => {
    setLoading(true);

    try {
      // Prepare customer data
      const customerData: Partial<Customer> = {
        CustomerNo: data.CustomerNo,
        TypeID: data.TypeID ? parseInt(data.TypeID) : undefined,
        FirstName: data.FirstName,
        LastName: data.LastName,
        CustomerFullName: data.CustomerFullName,
        Gender: data.Gender,
        BirthDate: data.BirthDate,
        CountryID: data.CountryID ? parseInt(data.CountryID) : undefined,
        CityID: data.CityID ? parseInt(data.CityID) : undefined,
        Address: data.Address,
        TaxRegNo: data.TaxRegNo,
        CustomerIdentityNo: data.CustomerIdentityNo,
        AccountCode: data.AccountCode,
        AccountName: data.AccountName,
        Remark: data.Remark,
        CreateNewAccount: data.CreateNewAccount,
        AccountTypeID: data.AccountTypeID ? parseInt(data.AccountTypeID) : undefined,
        CurrencyID: data.CurrencyID ? parseInt(data.CurrencyID) : undefined,
        CompanyID: data.CompanyID ? parseInt(data.CompanyID) : undefined,
      };

      // Prepare contacts array
      let allContacts = [...contacts];

      // If primary contact information is provided, create or update the primary contact
      if (data.PrimaryContactName || data.PrimaryEmail || data.PrimaryPhone) {
        const primaryContact: CustomerContact = {
          CustomerContactID: isEdit && contacts.length > 0 ? contacts[0].CustomerContactID : 0,
          CustomerID: customer?.CustomerID || 0,
          ContactTypeID: 1, // Assuming 1 is the primary contact type ID
          ContactName: data.PrimaryContactName || data.CustomerFullName,
          EmailID: data.PrimaryEmail || undefined,
          ContactNo: data.PrimaryPhone || undefined,
          CountryID: data.CountryID ? parseInt(data.CountryID) : undefined,
          CityID: data.CityID ? parseInt(data.CityID) : undefined,
          Address: data.Address || undefined,
          ContactTypeName: "Primary",
        };

        if (isEdit && contacts.length > 0) {
          // Update existing primary contact
          allContacts[0] = primaryContact;
        } else {
          // Add as new primary contact
          allContacts.unshift(primaryContact);
        }
      }

      if (isEdit && customer) {
        // Update existing customer
        const result = await customerService.updateCustomer({
          customer: { ...customerData, CustomerID: customer.CustomerID },
          contacts: allContacts,
          attachments,
        });

        if (result.success) {
          toast.success(result.message);
          navigate("/customers");
        } else {
          toast.error(result.message);
        }
      } else {
        // Create new customer
        const result = await customerService.createCustomer({
          customer: customerData,
          contacts: allContacts,
          attachments,
        });

        if (result.success) {
          toast.success(result.message);
          navigate("/customers");
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  // Contact dialog handlers
  const openContactDialog = (contact?: CustomerContact) => {
    if (contact) {
      setEditingContact(contact);
      contactForm.reset({
        ContactTypeID: contact.ContactTypeID?.toString() || "",
        ContactName: contact.ContactName || "",
        EmailID: contact.EmailID || "",
        CountryID: contact.CountryID?.toString() || "",
        CityID: contact.CityID?.toString() || "",
        ContactNo: contact.ContactNo || "",
        Address: contact.Address || "",
      });
    } else {
      setEditingContact(null);
      contactForm.reset({
        ContactTypeID: "",
        ContactName: "",
        EmailID: "",
        CountryID: "",
        CityID: "",
        ContactNo: "",
        Address: "",
      });
    }
    setContactDialogOpen(true);
  };

  const closeContactDialog = () => {
    setContactDialogOpen(false);
    setEditingContact(null);
  };

  // Handle contact form submission
  const onSubmitContact = (data: ContactFormValues) => {
    const newContact: CustomerContact = {
      CustomerContactID: editingContact ? editingContact.CustomerContactID : 0,
      CustomerID: customer?.CustomerID || 0,
      ContactTypeID: data.ContactTypeID ? parseInt(data.ContactTypeID) : undefined,
      ContactName: data.ContactName,
      EmailID: data.EmailID || undefined,
      CountryID: data.CountryID ? parseInt(data.CountryID) : undefined,
      CityID: data.CityID ? parseInt(data.CityID) : undefined,
      ContactNo: data.ContactNo || undefined,
      Address: data.Address || undefined,
      ContactTypeName: contactTypes.find((t) => t.ContactTypeID.toString() === data.ContactTypeID)?.ContactTypeDescription,
      CountryName: countries.find((c) => c.CountryID.toString() === data.CountryID)?.CountryName,
      CityName: cities.find((c) => c.CityID.toString() === data.CityID)?.CityName,
    };

    if (editingContact) {
      // Update existing contact
      setContacts(contacts.map((c) => (c.CustomerContactID === editingContact.CustomerContactID ? newContact : c)));
    } else {
      // Add new contact
      setContacts([...contacts, newContact]);
    }

    closeContactDialog();
  };

  // Delete contact
  const handleDeleteContact = (contactId: number) => {
    setContacts(contacts.filter((c) => c.CustomerContactID !== contactId));
  };

  // Attachment dialog handlers
  const openAttachmentDialog = (attachment?: CustomerAttachment) => {
    if (attachment) {
      setEditingAttachment(attachment);
      attachmentForm.reset({
        DocTypeID: attachment.DocTypeID?.toString() || "",
        DocumentName: attachment.DocumentName || "",
        file: undefined,
        DocIssueDate: attachment.DocIssueDate ? new Date(attachment.DocIssueDate) : null,
        DocExpiryDate: attachment.DocExpiryDate ? new Date(attachment.DocExpiryDate) : null,
        Remark: attachment.Remark || "",
      });
    } else {
      setEditingAttachment(null);
      attachmentForm.reset({
        DocTypeID: "",
        DocumentName: "",
        file: undefined,
        DocIssueDate: null,
        DocExpiryDate: null,
        Remark: "",
      });
    }
    setAttachmentDialogOpen(true);
  };

  const closeAttachmentDialog = () => {
    setAttachmentDialogOpen(false);
    setEditingAttachment(null);
  };

  // Handle attachment form submission
  const onSubmitAttachment = (data: AttachmentFormValues) => {
    const newAttachment: CustomerAttachment = {
      CustomerAttachmentID: editingAttachment ? editingAttachment.CustomerAttachmentID : 0,
      CustomerID: customer?.CustomerID || 0,
      DocTypeID: data.DocTypeID ? parseInt(data.DocTypeID) : undefined,
      DocumentName: data.DocumentName,
      DocIssueDate: data.DocIssueDate || undefined,
      DocExpiryDate: data.DocExpiryDate || undefined,
      Remark: data.Remark || undefined,
      DocTypeName: documentTypes.find((t) => t.DocTypeID.toString() === data.DocTypeID)?.Description,
    };

    // If there's a file, add file-related properties
    if (data.file) {
      newAttachment.file = data.file;
      const fileUrl = URL.createObjectURL(data.file);
      newAttachment.fileUrl = fileUrl;
      newAttachment.FileContentType = data.file.type;
      newAttachment.FileSize = data.file.size;
    } else if (editingAttachment) {
      // Preserve existing file content if updating and no new file is provided
      newAttachment.FileContent = editingAttachment.FileContent;
      newAttachment.FileContentType = editingAttachment.FileContentType;
      newAttachment.FileSize = editingAttachment.FileSize;
      newAttachment.fileUrl = editingAttachment.fileUrl;
    }

    if (editingAttachment) {
      // Update existing attachment
      setAttachments(attachments.map((a) => (a.CustomerAttachmentID === editingAttachment.CustomerAttachmentID ? newAttachment : a)));
    } else {
      // Add new attachment
      setAttachments([...attachments, newAttachment]);
    }

    closeAttachmentDialog();
  };

  // Delete attachment
  const handleDeleteAttachment = (attachmentId: number) => {
    setAttachments(attachments.filter((a) => a.CustomerAttachmentID !== attachmentId));
  };

  // Cancel button handler
  const handleCancel = () => {
    navigate("/customers");
  };

  const handleFileUpload = (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    setTimeout(() => {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("File size exceeds 10MB limit");
        setIsUploading(false);
        return;
      }

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Auto-set Document Name to file name if not manually edited
      if (!documentNameManuallyEdited.current) {
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        attachmentForm.setValue("DocumentName", fileName);
      }

      setIsUploading(false);
      setUploadSuccess(true);

      setTimeout(() => setUploadSuccess(false), 3000);
    }, 1500);
  };

  // Handle file removal
  const handleFileRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    setUploadSuccess(false);
    setUploadError(null);
  };

  const handleCountryChange = (value: string) => {
    customerForm.setValue("CountryID", value);
    customerForm.setValue("CityID", "");
    setSelectedCountryId(value);
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
        <Button variant="outline" size="icon" onClick={() => navigate("/customers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Customer" : "Create Customer"}</h1>
      </div>

      <Form {...customerForm}>
        <form onSubmit={customerForm.handleSubmit(onSubmitCustomer)}>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isEdit ? "Edit Customer" : "Create New Customer"}</CardTitle>
                <CardDescription>{isEdit ? "Update customer information" : "Enter the details for the new customer"}</CardDescription>
              </CardHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-2">
                <div className="px-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Information</TabsTrigger>
                    <TabsTrigger value="contacts">Additional Contacts ({contacts.length})</TabsTrigger>
                    <TabsTrigger value="attachments">Attachments ({attachments.length})</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="basic" className="p-6 pt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField form={customerForm} name="CustomerNo" label="Customer Number" placeholder="Auto-generated if empty" disabled={isEdit} />
                    <FormField
                      form={customerForm}
                      name="TypeID"
                      label="Customer Type"
                      type="select"
                      options={customerTypes.map((type) => ({
                        label: type.Description,
                        value: type.TypeID.toString(),
                      }))}
                      placeholder="Select customer type"
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField form={customerForm} name="FirstName" label="First Name" placeholder="Enter first name" />
                    <FormField form={customerForm} name="LastName" label="Last Name" placeholder="Enter last name" />
                    <FormField form={customerForm} name="CustomerFullName" label="Full Name" placeholder="Enter full name" required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      form={customerForm}
                      name="Gender"
                      label="Gender"
                      type="select"
                      options={[
                        { label: "Male", value: "Male" },
                        { label: "Female", value: "Female" },
                        { label: "Other", value: "Other" },
                      ]}
                      placeholder="Select gender"
                    />
                    <FormField form={customerForm} name="BirthDate" label="Birth Date" type="date" placeholder="Select birth date" />
                    <FormField form={customerForm} name="CustomerIdentityNo" label="Identity Number" placeholder="Enter identity number" />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      form={customerForm}
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
                      form={customerForm}
                      name="CityID"
                      label="City"
                      type="select"
                      options={cities.map((city) => ({
                        label: city.CityName,
                        value: city.CityID.toString(),
                      }))}
                      placeholder={selectedCountryId ? "Select city" : "Select country first"}
                      disabled={!selectedCountryId}
                    />
                    <FormField form={customerForm} name="Address" label="Address" placeholder="Enter address" />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Primary Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField form={customerForm} name="PrimaryContactName" label="Contact Person" placeholder="Enter contact person name" />
                      <FormField form={customerForm} name="PrimaryEmail" label="Email Address" type="email" placeholder="Enter email address" />
                      <FormField form={customerForm} name="PrimaryPhone" label="Phone Number" placeholder="Enter phone number" />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField form={customerForm} name="TaxRegNo" label="Tax Registration Number" placeholder="Enter tax registration number" required />
                    <FormField form={customerForm} name="AccountCode" label="Account Code" placeholder="Enter account code" />
                    <FormField form={customerForm} name="AccountName" label="Account Name" placeholder="Enter account name" />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">GL Account Settings</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="CreateNewAccount" checked={createNewAccount} onCheckedChange={(checked) => customerForm.setValue("CreateNewAccount", !!checked)} />
                      <label htmlFor="CreateNewAccount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Create new GL account for this customer
                      </label>
                    </div>

                    {createNewAccount && (
                      <div className="ml-6 space-y-4 p-4 border rounded-lg bg-muted/20">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            form={customerForm}
                            name="AccountTypeID"
                            label="Account Type"
                            type="select"
                            options={accountTypes.map((type) => ({
                              label: type.AccountTypeName,
                              value: type.AccountTypeID.toString(),
                            }))}
                            placeholder="Select account type"
                            required={createNewAccount}
                          />
                          <FormField
                            form={customerForm}
                            name="CurrencyID"
                            label="Currency"
                            type="select"
                            options={currencies.map((currency) => ({
                              label: `${currency.CurrencyName} (${currency.CurrencyCode || "N/A"})`,
                              value: currency.CurrencyID.toString(),
                            }))}
                            placeholder="Select currency"
                            required={createNewAccount}
                          />
                          <FormField
                            form={customerForm}
                            name="CompanyID"
                            label="Company"
                            type="select"
                            options={companies.map((company) => ({
                              label: company.CompanyName,
                              value: company.CompanyID.toString(),
                            }))}
                            placeholder="Select company"
                            required={createNewAccount}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">A new GL account will be created automatically with the specified Account Code and Name above.</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <FormField form={customerForm} name="Remark" label="Remarks" placeholder="Enter any additional information" type="textarea" />
                  </div>
                </TabsContent>

                <TabsContent value="contacts" className="p-6 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-medium">Additional Contact Persons</h3>
                      <p className="text-sm text-muted-foreground">Primary contact information is managed in the Basic Information tab</p>
                    </div>
                    <Button type="button" onClick={() => openContactDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </div>

                  {contacts.length === 0 ? (
                    <div className="text-center py-8 border rounded-md bg-muted/10">
                      <p className="text-muted-foreground">No additional contacts added yet</p>
                      <Button type="button" variant="outline" className="mt-4" onClick={() => openContactDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Contact
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] border rounded-md p-4">
                      <div className="space-y-4">
                        {contacts.map((contact) => (
                          <Card key={contact.CustomerContactID}>
                            <CardContent className="p-4">
                              <div className="flex justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <span className="font-medium text-lg">{contact.ContactName}</span>
                                    {contact.ContactTypeName && <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">{contact.ContactTypeName}</Badge>}
                                  </div>
                                  {contact.EmailID && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                      <Mail className="h-4 w-4 mr-1.5" />
                                      {contact.EmailID}
                                    </div>
                                  )}
                                  {contact.ContactNo && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                      <Phone className="h-4 w-4 mr-1.5" />
                                      {contact.ContactNo}
                                    </div>
                                  )}
                                  {(contact.CityName || contact.CountryName || contact.Address) && (
                                    <div className="flex items-start text-sm text-muted-foreground">
                                      <Home className="h-4 w-4 mr-1.5 mt-0.5" />
                                      <div>
                                        {contact.Address && <div>{contact.Address}</div>}
                                        {(contact.CityName || contact.CountryName) && (
                                          <div>
                                            {contact.CityName && contact.CityName}
                                            {contact.CityName && contact.CountryName && ", "}
                                            {contact.CountryName && contact.CountryName}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <Button type="button" variant="ghost" size="icon" onClick={() => openContactDialog(contact)}>
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteContact(contact.CustomerContactID)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>

                <TabsContent value="attachments" className="p-6 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Attachments</h3>
                    <Button type="button" onClick={() => openAttachmentDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Attachment
                    </Button>
                  </div>

                  {attachments.length === 0 ? (
                    <div className="text-center py-8 border rounded-md bg-muted/10">
                      <p className="text-muted-foreground">No attachments added yet</p>
                      <Button type="button" variant="outline" className="mt-4" onClick={() => openAttachmentDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Attachment
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {attachments.map((attachment) => (
                        <Card key={attachment.CustomerAttachmentID}>
                          <CardContent className="p-4">
                            <div className="flex justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <span className="font-medium">{attachment.DocumentName}</span>
                                  {attachment.DocTypeName && <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100">{attachment.DocTypeName}</Badge>}
                                </div>
                                <div className="text-sm space-y-1">
                                  {attachment.DocIssueDate && <div className="text-muted-foreground">Issue date: {format(new Date(attachment.DocIssueDate), "PPP")}</div>}
                                  {attachment.DocExpiryDate && <div className="text-muted-foreground">Expiry date: {format(new Date(attachment.DocExpiryDate), "PPP")}</div>}
                                  {attachment.Remark && <div className="text-muted-foreground">{attachment.Remark}</div>}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button type="button" variant="ghost" size="icon" onClick={() => openAttachmentDialog(attachment)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteAttachment(attachment.CustomerAttachmentID)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
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
                      Save Customer
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Edit Contact" : "Add Additional Contact"}</DialogTitle>
            <DialogDescription>This will be added as an additional contact. Primary contact information is managed in the Basic Information tab.</DialogDescription>
          </DialogHeader>
          <Form {...contactForm}>
            <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-4">
              <div className="space-y-2">
                <FormField
                  form={contactForm}
                  name="ContactTypeID"
                  label={
                    <div className="flex items-center justify-between">
                      <span>Contact Type</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsContactTypeDialogOpen(true);
                        }}
                      >
                        <PlusCircle className="mr-1 h-3.5 w-3.5" />
                        Create New
                      </Button>
                    </div>
                  }
                  type="select"
                  options={contactTypes.map((type) => ({
                    label: type.ContactTypeDescription,
                    value: type.ContactTypeID.toString(),
                  }))}
                  placeholder="Select contact type"
                  required
                />
              </div>
              <FormField form={contactForm} name="ContactName" label="Contact Name" placeholder="Enter contact name" required />
              <FormField form={contactForm} name="EmailID" label="Email" type="email" placeholder="Enter email address" />
              <FormField form={contactForm} name="ContactNo" label="Phone Number" placeholder="Enter phone number" />
              <div className="grid grid-cols-2 gap-4">
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
              <FormField form={contactForm} name="Address" label="Address" placeholder="Enter address" type="textarea" />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeContactDialog}>
                  Cancel
                </Button>
                <Button type="submit">{editingContact ? "Update" : "Add"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Attachment Dialog */}
      <Dialog open={attachmentDialogOpen} onOpenChange={setAttachmentDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingAttachment ? "Edit Attachment" : "Add Attachment"}</DialogTitle>
          </DialogHeader>
          <Form {...attachmentForm}>
            <form onSubmit={attachmentForm.handleSubmit(onSubmitAttachment)} className="space-y-4">
              <div className="space-y-2">
                <FormField
                  form={attachmentForm}
                  name="DocTypeID"
                  label={
                    <div className="flex items-center justify-between">
                      <span>Document Type</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsDocTypeDialogOpen(true);
                        }}
                      >
                        <PlusCircle className="mr-1 h-3.5 w-3.5" />
                        Create New
                      </Button>
                    </div>
                  }
                  type="select"
                  options={documentTypes.map((type) => ({
                    label: type.Description,
                    value: type.DocTypeID.toString(),
                  }))}
                  placeholder="Select document type"
                  required
                />
              </div>

              <FormField form={attachmentForm} name="DocumentName" label="Document Name" placeholder="Enter document name" required />

              <FormField
                form={attachmentForm}
                name="file"
                label="Upload File"
                description={editingAttachment?.FileContent ? "Replace existing file" : "Upload a document file"}
                type="file"
                fileConfig={{
                  maxSize: 10 * 1024 * 1024, // 10MB
                  acceptedFileTypes: ".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls",
                  onUpload: handleFileUpload,
                  onRemove: handleFileRemove,
                  isUploading,
                  uploadSuccess,
                  uploadError,
                }}
              />

              {/* Show existing file preview if available */}
              {!attachmentForm.watch("file") && editingAttachment?.fileUrl && (
                <div className="mt-2 p-2 border rounded-md bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-1">Current file:</p>
                  <div className="flex items-center">
                    <a href={editingAttachment.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                      View current file
                    </a>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField form={attachmentForm} name="DocIssueDate" label="Issue Date" type="date" placeholder="Select issue date" />
                <FormField form={attachmentForm} name="DocExpiryDate" label="Expiry Date" type="date" placeholder="Select expiry date" />
              </div>

              <FormField form={attachmentForm} name="Remark" label="Remarks" placeholder="Enter any additional information" type="textarea" />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeAttachmentDialog}>
                  Cancel
                </Button>
                <Button type="submit">{editingAttachment ? "Update" : "Add"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <CreateDocTypeDialog isOpen={isDocTypeDialogOpen} onClose={() => setIsDocTypeDialogOpen(false)} onSave={handleSaveDocType} />
      <CreateContactTypeDialog isOpen={isContactTypeDialogOpen} onClose={() => setIsContactTypeDialogOpen(false)} onSave={handleSaveContactType} />
    </div>
  );
};

export default CustomerForm;
