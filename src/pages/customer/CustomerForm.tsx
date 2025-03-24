import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, Plus, Trash2, Edit2, X, Mail, Phone, Home } from "lucide-react";
import { customerService } from "@/services/customerService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/lib/hooks";
import { Customer, CustomerContact, CustomerAttachment, CustomerType, ContactType, DocType } from "@/types/customerTypes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Country, countryService } from "@/services/countryService";
import { City, cityService } from "@/services/cityService";

// Create the schema for customer form validation
const customerSchema = z.object({
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
  TaxRegNo: z.string().optional(),
  CustomerIdentityNo: z.string().optional(),
  AccountCode: z.string().optional(),
  AccountName: z.string().optional(),
  Remark: z.string().optional(),
});

// Contact form schema
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
  const { user } = useAppSelector((state) => state.auth);

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

  // State for file upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
      TaxRegNo: "",
      CustomerIdentityNo: "",
      AccountCode: "",
      AccountName: "",
      Remark: "",
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

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Fetch reference data in parallel
        const [typesData, contactTypesData, docTypesData, countriesData] = await Promise.all([
          customerService.getCustomerTypes(),
          customerService.getContactTypes(),
          customerService.getDocumentTypes(),
          countryService.getCountriesForDropdown(),
        ]);

        setCustomerTypes(typesData);
        setContactTypes(contactTypesData);
        setDocumentTypes(docTypesData);
        setCountries(countriesData);

        // If editing, fetch the customer data
        if (isEdit && id) {
          const customerData = await customerService.getCustomerById(parseInt(id));

          if (customerData.customer) {
            setCustomer(customerData.customer);
            setContacts(customerData.contacts || []);
            setAttachments(customerData.attachments || []);

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
              TaxRegNo: customerData.customer.TaxRegNo || "",
              CustomerIdentityNo: customerData.customer.CustomerIdentityNo || "",
              AccountCode: customerData.customer.AccountCode || "",
              AccountName: customerData.customer.AccountName || "",
              Remark: customerData.customer.Remark || "",
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
    if (!user) {
      toast.error("User information not available");
      return;
    }

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
      };

      if (isEdit && customer) {
        // Update existing customer
        const result = await customerService.updateCustomer({
          customer: { ...customerData, CustomerID: customer.CustomerID },
          contacts,
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
          contacts,
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
        file: undefined, // Don't set the file input, but use the preview URL
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

      // Generate a preview URL for display
      const fileUrl = URL.createObjectURL(data.file);
      newAttachment.fileUrl = fileUrl;

      // Store file information
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

    // In a real app, you would upload to server here
    // For demo, we'll simulate an upload process
    setTimeout(() => {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("File size exceeds 10MB limit");
        setIsUploading(false);
        return;
      }

      // Create a preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      setIsUploading(false);
      setUploadSuccess(true);

      // Reset success status after a moment
      setTimeout(() => setUploadSuccess(false), 3000);
    }, 1500);
  };

  // Handle file removal
  const handleFileRemove = () => {
    // Clean up any preview URL
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
                    <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField form={customerForm} name="TaxRegNo" label="Tax Registration Number" placeholder="Enter tax registration number" />
                    <FormField form={customerForm} name="AccountCode" label="Account Code" placeholder="Enter account code" />
                    <FormField form={customerForm} name="AccountName" label="Account Name" placeholder="Enter account name" />
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <FormField form={customerForm} name="Remark" label="Remarks" placeholder="Enter any additional information" type="textarea" />
                  </div>
                </TabsContent>

                <TabsContent value="contacts" className="p-6 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Contact Persons</h3>
                    <Button type="button" onClick={() => openContactDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </div>

                  {contacts.length === 0 ? (
                    <div className="text-center py-8 border rounded-md bg-muted/10">
                      <p className="text-muted-foreground">No contacts added yet</p>
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
            <DialogTitle>{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
          </DialogHeader>
          <Form {...contactForm}>
            <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-4">
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
              <FormField form={contactForm} name="EmailID" label="Email" type="email" placeholder="Enter email address" />
              <FormField form={contactForm} name="ContactNo" label="Phone Number" placeholder="Enter phone number" />
              <div className="grid grid-cols-2 gap-4">
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
              <FormField
                form={attachmentForm}
                name="DocTypeID"
                label="Document Type"
                type="select"
                options={documentTypes.map((type) => ({
                  label: type.Description,
                  value: type.DocTypeID.toString(),
                }))}
                placeholder="Select document type"
                required
              />

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
    </div>
  );
};

export default CustomerForm;
