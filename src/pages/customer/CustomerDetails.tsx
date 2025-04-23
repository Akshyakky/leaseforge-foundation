import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { customerService } from "@/services/customerService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, UserRound, Building, Home, Phone, Mail, CalendarDays, FileText, Link, Calendar, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { Customer, CustomerContact, CustomerAttachment, CustomerType } from "@/types/customerTypes";
import { format } from "date-fns";

export const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State variables
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [attachments, setAttachments] = useState<CustomerAttachment[]>([]);
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
    const fetchCustomerData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch customer data including contacts and attachments
        const data = await customerService.getCustomerById(parseInt(id));

        if (data.customer) {
          setCustomer(data.customer);
          setContacts(data.contacts || []);
          setAttachments(data.attachments || []);

          // Fetch customer types for mapping TypeID to description
          const typesData = await customerService.getCustomerTypes();
          setCustomerTypes(typesData);
        } else {
          setError("Customer not found");
          toast.error("Customer not found");
        }
      } catch (err) {
        console.error("Error fetching customer:", err);
        setError("Failed to load customer details");
        toast.error("Failed to load customer details");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [id]);

  const handleDelete = async () => {
    if (!customer) return;

    try {
      const result = await customerService.deleteCustomer(customer.CustomerID);
      if (result.success) {
        toast.success(result.message || "Customer deleted successfully");
        navigate("/customers");
      } else {
        toast.error(result.message || "Failed to delete customer");
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
            ContactTypeName: contactTypes.find((t) => t.ContactTypeID.toString() === data.ContactTypeID)?.ContactTypeDescription,
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
            ContactTypeName: contactTypes.find((t) => t.ContactTypeID.toString() === data.ContactTypeID)?.ContactTypeDescription,
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

  // Format date for display
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "PPP");
  };

  // Get customer type name based on TypeID
  const getCustomerTypeName = (typeId?: number) => {
    if (!typeId) return "N/A";
    const type = customerTypes.find((t) => t.TypeID === typeId);
    return type ? type.Description : "Unknown";
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Customer Details</CardTitle>
            <CardDescription>View and manage customer information</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/customers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={() => navigate(`/customers/edit/${customer.CustomerID}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex items-center justify-center md:justify-start">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-xl">{customer.TypeID === 1 ? <UserRound className="h-12 w-12" /> : <Building className="h-12 w-12" />}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <h2 className="text-2xl font-bold">{customer.CustomerFullName}</h2>
                <Badge variant={customer.TypeID === 1 ? "default" : "secondary"}>{getCustomerTypeName(customer.TypeID)}</Badge>
              </div>
              <div className="space-y-2">
                {contacts.length > 0 && contacts[0].EmailID && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{contacts[0].EmailID}</span>
                  </div>
                )}
                {contacts.length > 0 && contacts[0].ContactNo && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{contacts[0].ContactNo}</span>
                  </div>
                )}
                {customer.Address && (
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.Address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>Customer since: {formatDate(customer.CreatedOn)}</span>
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

          <Separator className="my-6" />

          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Basic Details</TabsTrigger>
              <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
              <TabsTrigger value="documents">Documents ({attachments.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Customer ID:</span>
                      <span>{customer.CustomerID}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Customer Number:</span>
                      <span>{customer.CustomerNo || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Full Name:</span>
                      <span>{customer.CustomerFullName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">First Name:</span>
                      <span>{customer.FirstName || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Last Name:</span>
                      <span>{customer.LastName || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Customer Type:</span>
                      <span>{getCustomerTypeName(customer.TypeID)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Gender:</span>
                      <span>{customer.Gender || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Birth Date:</span>
                      <span>{customer.BirthDate ? formatDate(customer.BirthDate) : "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Identity Number:</span>
                      <span>{customer.CustomerIdentityNo || "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Account Information</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Account Code:</span>
                      <span>{customer.AccountCode || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Account Name:</span>
                      <span>{customer.AccountName || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Tax Registration No:</span>
                      <span>{customer.TaxRegNo || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Created By:</span>
                      <span>{customer.CreatedBy || "—"}</span>
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

              {customer.Remark && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Remarks</h3>
                  <p className="p-4 bg-gray-50 rounded-md">{customer.Remark}</p>
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Address Information</h3>
                <div className="p-4 bg-gray-50 rounded-md">
                  <p>{customer.Address || "No address information provided"}</p>
                  {customer.CityName && (
                    <div className="mt-2">
                      <span className="font-medium">City:</span> {customer.CityName}
                    </div>
                  )}
                  {customer.CountryName && (
                    <div>
                      <span className="font-medium">Country:</span> {customer.CountryName}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="contacts" className="mt-6">
              {contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
                  <p className="text-muted-foreground mb-4">No contacts associated with this customer.</p>
                  <Button variant="outline" onClick={() => navigate(`/customers/edit/${customer.CustomerID}`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contact
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contacts.map((contact) => (
                    <Card key={contact.CustomerContactID}>
                      <CardContent className="p-4">
                        <div className="flex justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <span className="font-medium">{contact.ContactName}</span>
                              {contact.ContactTypeName && <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">{contact.ContactTypeName}</Badge>}
                            </div>
                            <div className="text-sm space-y-1">
                              {contact.EmailID && (
                                <div className="flex items-center text-muted-foreground">
                                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                                  {contact.EmailID}
                                </div>
                              )}
                              {contact.ContactNo && (
                                <div className="flex items-center text-muted-foreground">
                                  <Phone className="h-3.5 w-3.5 mr-1.5" />
                                  {contact.ContactNo}
                                </div>
                              )}
                              {(contact.Address || contact.CityName || contact.CountryName) && (
                                <div className="flex items-start text-muted-foreground">
                                  <Home className="h-3.5 w-3.5 mr-1.5 mt-0.5" />
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
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="documents" className="mt-6">
              {attachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
                  <p className="text-muted-foreground mb-4">No documents associated with this customer.</p>
                  <Button variant="outline" onClick={() => navigate(`/customers/edit/${customer.CustomerID}`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Document
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
                              {attachment.DocIssueDate && (
                                <div className="flex items-center text-muted-foreground">
                                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                  Issue date: {formatDate(attachment.DocIssueDate)}
                                </div>
                              )}
                              {attachment.DocExpiryDate && (
                                <div className="flex items-center text-muted-foreground">
                                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                  Expiry date: {formatDate(attachment.DocExpiryDate)}
                                </div>
                              )}
                              {attachment.Remark && <div className="text-muted-foreground mt-1">{attachment.Remark}</div>}
                              {attachment.fileUrl && (
                                <div className="flex items-center mt-2">
                                  <Link className="h-3.5 w-3.5 mr-1.5" />
                                  <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    View Document
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Customer Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteCustomer}
        title="Delete Customer"
        description={`Are you sure you want to delete ${customer.CustomerFullName}? This action cannot be undone and will remove all data associated with this customer.`}
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
