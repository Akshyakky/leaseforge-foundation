import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { customerService } from "@/services/customerService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Edit,
  Trash2,
  UserRound,
  Building,
  Home,
  Phone,
  Mail,
  CalendarDays,
  FileText,
  Link,
  Calendar,
  Plus,
  Download,
  HandCoins,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { Customer, CustomerContact, CustomerAttachment, CustomerType, CustomerGLDetails, CustomerOutstandingBalance } from "@/types/customerTypes";
import { format } from "date-fns";
import { AttachmentPreview } from "@/components/attachments/AttachmentPreview";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { AttachmentThumbnail } from "@/components/attachments/AttachmentThumbnail";
import { FileTypeIcon } from "@/components/attachments/FileTypeIcon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [attachments, setAttachments] = useState<CustomerAttachment[]>([]);
  const [glDetails, setGlDetails] = useState<CustomerGLDetails[]>([]);
  const [outstandingBalance, setOutstandingBalance] = useState<CustomerOutstandingBalance | null>(null);
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [previewAttachment, setPreviewAttachment] = useState<CustomerAttachment | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialAttachmentId, setInitialAttachmentId] = useState<number | undefined>(undefined);

  const openAttachmentPreview = (attachment: CustomerAttachment) => {
    setPreviewAttachment(attachment);
    setPreviewOpen(true);
  };

  const openAttachmentGallery = (attachmentId?: number) => {
    setInitialAttachmentId(attachmentId);
    setGalleryOpen(true);
  };

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch customer data including contacts, attachments, and GL details
        const data = await customerService.getCustomerById(parseInt(id));

        if (data.customer) {
          setCustomer(data.customer);
          setContacts(data.contacts || []);
          setAttachments(data.attachments || []);
          setGlDetails(data.glDetails || []);

          // Fetch customer types for mapping TypeID to description
          const typesData = await customerService.getCustomerTypes();
          setCustomerTypes(typesData);

          // Fetch outstanding balance for the current date
          try {
            const balances = await customerService.getCustomerOutstandingBalances(new Date(), data.customer.CustomerID);
            if (balances.length > 0) {
              setOutstandingBalance(balances[0]);
            }
          } catch (balanceError) {
            console.warn("Could not fetch outstanding balance:", balanceError);
            // Continue without balance data as it's not critical
          }
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
    } catch (err) {
      console.error("Error deleting customer:", err);
      toast.error("Failed to delete customer");
    }
  };

  if (loading) {
    return (
      <div className="container p-4">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded-md w-3/4 mx-auto"></div>
            <div className="h-64 bg-gray-200 rounded-md w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-red-500 mb-4">{error || "Customer not found"}</p>
            <Button onClick={() => navigate("/customers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Button>
          </CardContent>
        </Card>
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

  // Format currency amount for display
  const formatCurrency = (amount: number, currencyCode?: string) => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));

    const sign = amount < 0 ? "-" : "";
    const currency = currencyCode || "";

    return `${sign}${currency} ${formatted}`;
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
                {outstandingBalance && (
                  <div className="flex items-center gap-2">
                    <HandCoins className="h-4 w-4 text-muted-foreground" />
                    <span className={`font-semibold ${outstandingBalance.OutstandingBalance >= 0 ? "text-blue-700" : "text-red-700"}`}>
                      Outstanding Balance: {formatCurrency(outstandingBalance.OutstandingBalance)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Basic Details</TabsTrigger>
              <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
              <TabsTrigger value="documents">Documents ({attachments.length})</TabsTrigger>
              <TabsTrigger value="accounts" className="relative">
                GL Accounts ({glDetails.length})
                {outstandingBalance && outstandingBalance.OutstandingBalance !== 0 && <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full"></span>}
              </TabsTrigger>
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
                      <span className="text-sm font-medium text-muted-foreground">GL Account:</span>
                      <span>{customer.GLAccountName || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Tax Registration No:</span>
                      <span>{customer.TaxRegNo || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Created By:</span>
                      <span>{customer.CreatedBy || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Created On:</span>
                      <span>{formatDate(customer.CreatedOn)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Last Updated By:</span>
                      <span>{customer.UpdatedBy || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Last Updated On:</span>
                      <span>{customer.UpdatedOn ? formatDate(customer.UpdatedOn) : "—"}</span>
                    </div>
                  </div>
                </div>
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
                <>
                  <div className="flex justify-end mb-4">
                    <Button variant="outline" onClick={() => openAttachmentGallery()}>
                      <FileText className="mr-2 h-4 w-4" />
                      View All Documents
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attachments.map((attachment) => (
                      <Card key={attachment.CustomerAttachmentID} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <AttachmentThumbnail
                              fileUrl={attachment.fileUrl}
                              fileName={attachment.DocumentName || "Document"}
                              fileType={attachment.FileContentType}
                              onClick={() => attachment.fileUrl && openAttachmentPreview(attachment)}
                            />
                            <div className="flex-1 space-y-2">
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
                              </div>

                              {/* Document preview and download buttons */}
                              {attachment.fileUrl && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Button variant="outline" size="sm" onClick={() => openAttachmentGallery(attachment.CustomerAttachmentID)} className="h-8 px-3">
                                    <FileTypeIcon fileName={attachment.DocumentName || "Document"} fileType={attachment.FileContentType} size={14} className="mr-1.5" />
                                    Preview
                                  </Button>
                                  <a
                                    href={attachment.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={attachment.DocumentName}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                                  >
                                    <Download className="h-3.5 w-3.5 mr-1.5" />
                                    Download
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
            <TabsContent value="accounts" className="mt-6">
              <div className="space-y-6">
                {/* Outstanding Balance Summary */}
                {outstandingBalance && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="mr-2 h-5 w-5" />
                        Outstanding Balance Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-muted-foreground">Current Outstanding Amount</p>
                          <p className={`text-2xl font-bold ${outstandingBalance.OutstandingBalance >= 0 ? "text-blue-700" : "text-red-700"}`}>
                            {formatCurrency(outstandingBalance.OutstandingBalance)}
                          </p>
                        </div>
                        <div className={`p-4 rounded-full ${outstandingBalance.OutstandingBalance >= 0 ? "bg-blue-50" : "bg-red-50"}`}>
                          <HandCoins className={`h-8 w-8 ${outstandingBalance.OutstandingBalance >= 0 ? "text-blue-700" : "text-red-700"}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* GL Account Details */}
                {glDetails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
                    <p className="text-muted-foreground mb-4">No GL accounts associated with this customer.</p>
                    <Button variant="outline" onClick={() => navigate(`/customers/edit/${customer.CustomerID}`)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add GL Account
                    </Button>
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CreditCard className="mr-2 h-5 w-5" />
                        GL Account Details
                      </CardTitle>
                      <CardDescription>General Ledger accounts linked to this customer</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account Code</TableHead>
                            <TableHead>Account Name</TableHead>
                            <TableHead>Account Type</TableHead>
                            <TableHead>Currency</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {glDetails.map((account) => (
                            <TableRow key={account.CustomerGLID}>
                              <TableCell className="font-medium">{account.AccountCode}</TableCell>
                              <TableCell>{account.GLAccountName || account.AccountName}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{account.AccountTypeName || "Unknown"}</Badge>
                              </TableCell>
                              <TableCell>{account.CurrencyName || "N/A"}</TableCell>
                              <TableCell>
                                {account.IsDefault ? <Badge className="bg-green-100 text-green-800">Default</Badge> : <Badge variant="secondary">Secondary</Badge>}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{account.Remarks || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        description={`Are you sure you want to delete ${customer.CustomerFullName}? This action cannot be undone and will remove all data associated with this customer.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
      {/* Attachment Preview Dialog */}
      {previewAttachment && (
        <AttachmentPreview
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          fileUrl={previewAttachment.fileUrl}
          fileName={previewAttachment.DocumentName || "Document"}
          fileType={previewAttachment.FileContentType}
          fileSize={previewAttachment.FileSize}
          uploadDate={previewAttachment.CreatedOn}
          uploadedBy={previewAttachment.CreatedBy}
          description={previewAttachment.Remark}
          documentType={previewAttachment.DocTypeName}
          issueDate={previewAttachment.DocIssueDate}
          expiryDate={previewAttachment.DocExpiryDate}
        />
      )}

      {/* Attachment Gallery Dialog */}
      {attachments.length > 0 && (
        <AttachmentGallery isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} attachments={attachments} initialAttachmentId={initialAttachmentId} />
      )}
    </div>
  );
};

export default CustomerDetails;
