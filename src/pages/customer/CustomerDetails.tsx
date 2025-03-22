import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { customerService } from "@/services/customerService";
import { Customer, CustomerContact, CustomerAttachment } from "@/types/customerTypes";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Edit2, Trash2, UserCog, FileText, Phone, Mail, MapPin, Calendar, CreditCard, ClipboardList, AlertTriangle, Plus, Eye, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { FormField } from "@/components/forms/FormField";
import { ScrollArea } from "@/components/ui/scroll-area";

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

type ContactFormValues = z.infer<typeof contactSchema>;
type AttachmentFormValues = z.infer<typeof attachmentSchema>;

const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State variables
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [attachments, setAttachments] = useState<CustomerAttachment[]>([]);
  const [customerTypes, setCustomerTypes] = useState<{ TypeID: number; Description: string }[]>([]);
  const [contactTypes, setContactTypes] = useState<{ ContactTypeID: number; ContactDesc: string }[]>([]);
  const [docTypes, setDocTypes] = useState<{ DocTypeID: number; Description: string }[]>([]);
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CustomerContact | null>(null);
  const [editingAttachment, setEditingAttachment] = useState<CustomerAttachment | null>(null);
  const [deleteContactDialogOpen, setDeleteContactDialogOpen] = useState(false);
  const [deleteAttachmentDialogOpen, setDeleteAttachmentDialogOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<number | null>(null);

  const [fileUploading, setFileUploading] = useState(false);
  const [fileUploadSuccess, setFileUploadSuccess] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

  // Form initialization
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

  // Fetch customer data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        navigate("/customers");
        return;
      }

      try {
        setLoading(true);

        // Fetch reference data in parallel
        const [customerData, typesData, contactTypesData, docTypesData] = await Promise.all([
          customerService.getCustomerById(parseInt(id)),
          customerService.getCustomerTypes(),
          customerService.getContactTypes(),
          customerService.getDocumentTypes(),
        ]);

        // Mock data for countries and cities - in a real app, fetch from API
        setCountries([
          { id: "1", name: "United States" },
          { id: "2", name: "United Kingdom" },
          { id: "3", name: "Canada" },
          { id: "4", name: "Australia" },
        ]);

        setCities([
          { id: "1", name: "New York" },
          { id: "2", name: "London" },
          { id: "3", name: "Toronto" },
          { id: "4", name: "Sydney" },
        ]);

        if (customerData.customer) {
          setCustomer(customerData.customer);
          setContacts(customerData.contacts || []);
          setAttachments(customerData.attachments || []);
          setCustomerTypes(typesData);
          setContactTypes(contactTypesData);
          setDocTypes(docTypesData);
        } else {
          toast.error("Customer not found");
          navigate("/customers");
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
        toast.error("Failed to load customer data");
        navigate("/customers");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // Helper to get type name
  const getCustomerTypeName = (typeId?: number) => {
    if (!typeId) return "Not specified";
    const type = customerTypes.find((t) => t.TypeID === typeId);
    return type ? type.Description : "Unknown";
  };

  // Delete customer handler
  const handleDeleteCustomer = async () => {
    if (!customer) return;

    try {
      const result = await customerService.deleteCustomer(customer.CustomerID);

      if (result.success) {
        toast.success(result.message);
        navigate("/customers");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Edit customer handler
  const handleEditCustomer = () => {
    if (!customer) return;
    navigate(`/customers/edit/${customer.CustomerID}`);
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
  const onSubmitContact = async (data: ContactFormValues) => {
    if (!customer) return;

    try {
      if (editingContact) {
        // Update existing contact
        const result = await customerService.updateContact({
          CustomerContactID: editingContact.CustomerContactID,
          CustomerID: customer.CustomerID,
          ContactTypeID: data.ContactTypeID ? parseInt(data.ContactTypeID) : undefined,
          ContactName: data.ContactName,
          EmailID: data.EmailID || undefined,
          CountryID: data.CountryID ? parseInt(data.CountryID) : undefined,
          CityID: data.CityID ? parseInt(data.CityID) : undefined,
          ContactNo: data.ContactNo || undefined,
          Address: data.Address || undefined,
        });

        if (result.success) {
          toast.success(result.message);

          // Update the contacts list
          const updatedContact: CustomerContact = {
            CustomerContactID: editingContact.CustomerContactID,
            CustomerID: customer.CustomerID,
            ContactTypeID: data.ContactTypeID ? parseInt(data.ContactTypeID) : undefined,
            ContactName: data.ContactName,
            EmailID: data.EmailID || undefined,
            CountryID: data.CountryID ? parseInt(data.CountryID) : undefined,
            CityID: data.CityID ? parseInt(data.CityID) : undefined,
            ContactNo: data.ContactNo || undefined,
            Address: data.Address || undefined,
            ContactTypeName: contactTypes.find((t) => t.ContactTypeID.toString() === data.ContactTypeID)?.ContactDesc,
            CountryName: countries.find((c) => c.id === data.CountryID)?.name,
            CityName: cities.find((c) => c.id === data.CityID)?.name,
          };

          setContacts(contacts.map((c) => (c.CustomerContactID === editingContact.CustomerContactID ? updatedContact : c)));
        } else {
          toast.error(result.message);
        }
      } else {
        // Add new contact
        const result = await customerService.addContact({
          CustomerID: customer.CustomerID,
          ContactTypeID: data.ContactTypeID ? parseInt(data.ContactTypeID) : undefined,
          ContactName: data.ContactName,
          EmailID: data.EmailID || undefined,
          CountryID: data.CountryID ? parseInt(data.CountryID) : undefined,
          CityID: data.CityID ? parseInt(data.CityID) : undefined,
          ContactNo: data.ContactNo || undefined,
          Address: data.Address || undefined,
        });

        if (result.success && result.contactId) {
          toast.success(result.message);

          // Add the new contact to the list
          const newContact: CustomerContact = {
            CustomerContactID: result.contactId,
            CustomerID: customer.CustomerID,
            ContactTypeID: data.ContactTypeID ? parseInt(data.ContactTypeID) : undefined,
            ContactName: data.ContactName,
            EmailID: data.EmailID || undefined,
            CountryID: data.CountryID ? parseInt(data.CountryID) : undefined,
            CityID: data.CityID ? parseInt(data.CityID) : undefined,
            ContactNo: data.ContactNo || undefined,
            Address: data.Address || undefined,
            ContactTypeName: contactTypes.find((t) => t.ContactTypeID.toString() === data.ContactTypeID)?.ContactDesc,
            CountryName: countries.find((c) => c.id === data.CountryID)?.name,
            CityName: cities.find((c) => c.id === data.CityID)?.name,
          };

          setContacts([...contacts, newContact]);
        } else {
          toast.error(result.message || "Failed to add contact");
        }
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      toast.error("An error occurred while saving the contact");
    } finally {
      closeContactDialog();
    }
  };

  // Delete contact handlers
  const openDeleteContactDialog = (contactId: number) => {
    setSelectedContactId(contactId);
    setDeleteContactDialogOpen(true);
  };

  const closeDeleteContactDialog = () => {
    setDeleteContactDialogOpen(false);
    setSelectedContactId(null);
  };

  const handleDeleteContact = async () => {
    if (!selectedContactId) return;

    try {
      const result = await customerService.deleteContact(selectedContactId);

      if (result.success) {
        toast.success(result.message);
        setContacts(contacts.filter((c) => c.CustomerContactID !== selectedContactId));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    } finally {
      closeDeleteContactDialog();
    }
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
  const onSubmitAttachment = async (data: AttachmentFormValues) => {
    if (!customer) return;

    try {
      const attachmentData: Partial<CustomerAttachment> = {
        CustomerID: customer.CustomerID,
        DocTypeID: data.DocTypeID ? parseInt(data.DocTypeID) : undefined,
        DocumentName: data.DocumentName,
        DocIssueDate: data.DocIssueDate || undefined,
        DocExpiryDate: data.DocExpiryDate || undefined,
        Remark: data.Remark || undefined,
      };

      // Add file if selected
      if (data.file) {
        attachmentData.file = data.file;
      }

      if (editingAttachment) {
        // Update existing attachment
        const result = await customerService.updateAttachment({
          CustomerAttachmentID: editingAttachment.CustomerAttachmentID,
          ...attachmentData,
        });

        if (result.success) {
          toast.success(result.message);

          // Refresh the customer data to get updated attachments
          const refreshedData = await customerService.getCustomerById(customer.CustomerID);
          setAttachments(refreshedData.attachments || []);
        } else {
          toast.error(result.message);
        }
      } else {
        // Add new attachment
        const result = await customerService.addAttachment(attachmentData as any);

        if (result.success && result.attachmentId) {
          toast.success(result.message);

          // Refresh the customer data to get updated attachments
          const refreshedData = await customerService.getCustomerById(customer.CustomerID);
          setAttachments(refreshedData.attachments || []);
        } else {
          toast.error(result.message || "Failed to add attachment");
        }
      }
    } catch (error) {
      console.error("Error saving attachment:", error);
      toast.error("An error occurred while saving the attachment");
    } finally {
      closeAttachmentDialog();
    }
  };

  const handleViewAttachment = (attachment: CustomerAttachment) => {
    if (attachment.fileUrl) {
      window.open(attachment.fileUrl, "_blank");
    } else {
      toast.error("File preview not available");
    }
  };

  const handleDownloadAttachment = (attachment: CustomerAttachment) => {
    if (attachment.fileUrl) {
      const link = document.createElement("a");
      link.href = attachment.fileUrl;
      link.download = attachment.DocumentName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error("File download not available");
    }
  };

  // Delete attachment handlers
  const openDeleteAttachmentDialog = (attachmentId: number) => {
    setSelectedAttachmentId(attachmentId);
    setDeleteAttachmentDialogOpen(true);
  };

  const closeDeleteAttachmentDialog = () => {
    setDeleteAttachmentDialogOpen(false);
    setSelectedAttachmentId(null);
  };

  const handleDeleteAttachment = async () => {
    if (!selectedAttachmentId) return;

    try {
      const result = await customerService.deleteAttachment(selectedAttachmentId);

      if (result.success) {
        toast.success(result.message);
        setAttachments(attachments.filter((a) => a.CustomerAttachmentID !== selectedAttachmentId));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Failed to delete attachment");
    } finally {
      closeDeleteAttachmentDialog();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl">Customer not found</h2>
        <Button className="mt-4" onClick={() => navigate("/customers")}>
          Back to customers
        </Button>
      </div>
    );
  }

  const getBadgeColorForType = (typeId?: number) => {
    if (!typeId) return "";

    const typeName = getCustomerTypeName(typeId);
    if (typeName === "Individual") return "bg-blue-100 text-blue-800";
    if (typeName === "Corporate") return "bg-purple-100 text-purple-800";
    if (typeName === "Government") return "bg-amber-100 text-amber-800";
    return "bg-emerald-100 text-emerald-800";
  };

  const getTimeUntilExpiry = (expiryDate?: Date | string) => {
    if (!expiryDate) return null;

    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { days: Math.abs(diffDays), expired: true };
    return { days: diffDays, expired: false };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileUpload = (file: File) => {
    setFileUploading(true);
    setFileUploadError(null);

    // In a real application, you would upload to your backend here
    // For demonstration, we'll simulate a file upload
    setTimeout(() => {
      if (file.size > 10 * 1024 * 1024) {
        setFileUploadError("File size exceeds 10MB limit");
        setFileUploading(false);
        return;
      }

      setFileUploading(false);
      setFileUploadSuccess(true);

      // Reset success status after 3 seconds
      setTimeout(() => setFileUploadSuccess(false), 3000);
    }, 1500);
  };

  const handleFileRemove = () => {
    setFileUploadSuccess(false);
    setFileUploadError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/customers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">{customer.CustomerFullName}</h1>
          {customer.TypeID && <Badge className={getBadgeColorForType(customer.TypeID)}>{getCustomerTypeName(customer.TypeID)}</Badge>}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleEditCustomer}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
          <TabsTrigger value="attachments">Attachments ({attachments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCog className="mr-2 h-5 w-5 text-muted-foreground" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Customer Number</div>
                    <div>{customer.CustomerNo || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Identity Number</div>
                    <div>{customer.CustomerIdentityNo || "N/A"}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Full Name</div>
                  <div>{customer.CustomerFullName}</div>
                </div>

                {(customer.FirstName || customer.LastName) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">First Name</div>
                      <div>{customer.FirstName || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Last Name</div>
                      <div>{customer.LastName || "N/A"}</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Gender</div>
                    <div>{customer.Gender || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Birth Date</div>
                    <div>{customer.BirthDate ? format(new Date(customer.BirthDate), "PPP") : "N/A"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5 text-muted-foreground" />
                  Location & Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Address</div>
                  <div>{customer.Address || "N/A"}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Country</div>
                    <div>{customer.CountryName || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">City</div>
                    <div>{customer.CityName || "N/A"}</div>
                  </div>
                </div>

                {/* Primary contact info if available from contacts */}
                {contacts.length > 0 && (
                  <>
                    <div className="border-t pt-3">
                      <div className="text-sm font-medium mb-2">Primary Contact Details</div>
                      {contacts.some((c) => c.EmailID) && (
                        <div className="flex items-center text-sm mb-2">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          {contacts.find((c) => c.EmailID)?.EmailID}
                        </div>
                      )}
                      {contacts.some((c) => c.ContactNo) && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          {contacts.find((c) => c.ContactNo)?.ContactNo}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                  Tax & Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Tax Registration Number</div>
                    <div>{customer.TaxRegNo || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Tax Type</div>
                    <div>{customer.TaxID ? `ID: ${customer.TaxID}` : "N/A"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Account Code</div>
                    <div>{customer.AccountCode || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Account Name</div>
                    <div>{customer.AccountName || "N/A"}</div>
                  </div>
                </div>

                {customer.CreateGL && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">GL Account</div>
                    <div>
                      {customer.CreateGL} {customer.GLID && `(ID: ${customer.GLID})`}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClipboardList className="mr-2 h-5 w-5 text-muted-foreground" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Remarks</div>
                  <div className="text-sm">{customer.Remark || "No remarks available"}</div>
                </div>

                <div className="space-y-1 border-t pt-3">
                  <div className="text-sm font-medium text-muted-foreground">Created By</div>
                  <div className="text-sm">
                    {customer.CreatedBy} on {customer.CreatedOn && format(new Date(customer.CreatedOn), "PPP")}
                  </div>
                </div>

                {customer.UpdatedBy && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Last Updated By</div>
                    <div className="text-sm">
                      {customer.UpdatedBy} on {customer.UpdatedOn && format(new Date(customer.UpdatedOn), "PPP")}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Contact Persons</CardTitle>
                <Button onClick={() => openContactDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
              </div>
              <CardDescription>Manage customer contacts and communication details</CardDescription>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <div className="text-center py-8 border rounded-md bg-muted/10">
                  <p className="text-muted-foreground">No contacts added yet</p>
                  <Button variant="outline" className="mt-4" onClick={() => openContactDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contact
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
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
                                  <MapPin className="h-4 w-4 mr-1.5 mt-0.5" />
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
                              <Button variant="ghost" size="icon" onClick={() => openContactDialog(contact)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => openDeleteContactDialog(contact.CustomerContactID)}>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Attachments</CardTitle>
                <Button onClick={() => openAttachmentDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Attachment
                </Button>
              </div>
              <CardDescription>Manage customer documents and files</CardDescription>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <div className="text-center py-8 border rounded-md bg-muted/10">
                  <p className="text-muted-foreground">No attachments added yet</p>
                  <Button variant="outline" className="mt-4" onClick={() => openAttachmentDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Attachment
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attachments.map((attachment) => {
                    const expiry = attachment.DocExpiryDate ? getTimeUntilExpiry(attachment.DocExpiryDate) : null;
                    const hasFileContent = Boolean(attachment.FileContent);

                    return (
                      <Card key={attachment.CustomerAttachmentID}>
                        <CardContent className="p-4">
                          <div className="flex justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <span className="font-medium">{attachment.DocumentName}</span>
                                {attachment.DocTypeName && <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100">{attachment.DocTypeName}</Badge>}
                              </div>

                              {hasFileContent && attachment.FileSize && (
                                <div className="text-sm text-muted-foreground flex items-center">
                                  <FileText className="h-3.5 w-3.5 mr-1" />
                                  {formatFileSize(attachment.FileSize)}
                                </div>
                              )}

                              <div className="text-sm space-y-1">
                                {attachment.DocIssueDate && (
                                  <div className="text-muted-foreground flex items-center">
                                    <Calendar className="h-3.5 w-3.5 mr-1" />
                                    Issue date: {format(new Date(attachment.DocIssueDate), "PPP")}
                                  </div>
                                )}
                                {attachment.DocExpiryDate && (
                                  <div className={`flex items-center ${expiry?.expired ? "text-red-500" : "text-muted-foreground"}`}>
                                    <Calendar className="h-3.5 w-3.5 mr-1" />
                                    Expiry date: {format(new Date(attachment.DocExpiryDate), "PPP")}
                                    {expiry && (
                                      <span className="ml-2">
                                        {expiry.expired ? (
                                          <Badge variant="destructive" className="text-xs">
                                            Expired {expiry.days} days ago
                                          </Badge>
                                        ) : expiry.days <= 30 ? (
                                          <Badge variant="outline" className="bg-amber-50 text-amber-800 text-xs">
                                            Expires in {expiry.days} days
                                          </Badge>
                                        ) : null}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {attachment.Remark && <div className="text-muted-foreground">{attachment.Remark}</div>}
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              {hasFileContent && (
                                <>
                                  <Button variant="ghost" size="icon" onClick={() => handleViewAttachment(attachment)} title="View">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDownloadAttachment(attachment)} title="Download">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => openAttachmentDialog(attachment)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => openDeleteAttachmentDialog(attachment.CustomerAttachmentID)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Customer Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteCustomer}
        title="Delete Customer"
        description={`Are you sure you want to delete ${customer.CustomerFullName}? This will also delete all associated contacts and attachments. This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />

      {/* Delete Contact Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteContactDialogOpen}
        onClose={closeDeleteContactDialog}
        onConfirm={handleDeleteContact}
        title="Delete Contact"
        description="Are you sure you want to delete this contact? This action cannot be undone."
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />

      {/* Delete Attachment Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteAttachmentDialogOpen}
        onClose={closeDeleteAttachmentDialog}
        onConfirm={handleDeleteAttachment}
        title="Delete Attachment"
        description="Are you sure you want to delete this attachment? This action cannot be undone."
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />

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
                  label: type.ContactDesc,
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
                  form={contactForm}
                  name="CountryID"
                  label="Country"
                  type="select"
                  options={countries.map((country) => ({
                    label: country.name,
                    value: country.id,
                  }))}
                  placeholder="Select country"
                />
                <FormField
                  form={contactForm}
                  name="CityID"
                  label="City"
                  type="select"
                  options={cities.map((city) => ({
                    label: city.name,
                    value: city.id,
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
        <DialogContent className="max-w-md">
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
                options={docTypes.map((type) => ({
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
                description={editingAttachment?.FileContent ? "Replace existing file" : undefined}
                type="file"
                fileConfig={{
                  maxSize: 10 * 1024 * 1024, // 10MB
                  acceptedFileTypes: ".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls",
                  onUpload: handleFileUpload,
                  onRemove: handleFileRemove,
                  isUploading: fileUploading,
                  uploadSuccess: fileUploadSuccess,
                  uploadError: fileUploadError,
                }}
              />

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

export default CustomerDetails;
