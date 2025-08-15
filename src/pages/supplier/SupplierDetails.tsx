// src/pages/supplier/SupplierDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supplierService } from "@/services/supplierService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Eye, FileText, Calendar, HandCoins, CreditCard, Building, Phone, Mail, Globe, Download, Plus, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { Supplier, SupplierContact, SupplierBankDetails, SupplierGLDetails, SupplierAttachment } from "@/types/supplierTypes";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { AttachmentThumbnail } from "@/components/attachments/AttachmentThumbnail";
import { AttachmentPreview } from "@/components/attachments/AttachmentPreview";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";

export const SupplierDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [contacts, setContacts] = useState<SupplierContact[]>([]);
  const [bankDetails, setBankDetails] = useState<SupplierBankDetails[]>([]);
  const [glDetails, setGlDetails] = useState<SupplierGLDetails[]>([]);
  const [attachments, setAttachments] = useState<SupplierAttachment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<SupplierAttachment | null>(null);
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState<number>(0);

  useEffect(() => {
    const fetchSupplierData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const data = await supplierService.getSupplierById(parseInt(id));

        if (data.supplier) {
          setSupplier(data.supplier);
          setContacts(data.contacts || []);
          setBankDetails(data.bankDetails || []);
          setGlDetails(data.glDetails || []);
          setAttachments(data.attachments || []);
        } else {
          setError("Supplier not found");
          toast.error("Supplier not found");
        }
      } catch (err) {
        console.error("Error fetching supplier:", err);
        setError("Failed to load supplier details");
        toast.error("Failed to load supplier details");
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierData();
  }, [id]);

  const handleDelete = async () => {
    if (!supplier) return;

    try {
      const result = await supplierService.deleteSupplier(supplier.SupplierID);
      if (result.Status === 1) {
        toast.success(result.Message || "Supplier deleted successfully");
        navigate("/suppliers");
      } else {
        toast.error(result.Message || "Failed to delete supplier");
      }
    } catch (err) {
      console.error("Error deleting supplier:", err);
      toast.error("Failed to delete supplier");
    }
  };

  const handleAttachmentPreview = (attachment: SupplierAttachment, index: number) => {
    setSelectedAttachment(attachment);
    setSelectedAttachmentIndex(index);
    setPreviewDialogOpen(true);
  };

  const handleAttachmentGallery = (index: number) => {
    setSelectedAttachmentIndex(index);
    setGalleryDialogOpen(true);
  };

  const handleDownloadAttachment = (attachment: SupplierAttachment) => {
    if (attachment.fileUrl) {
      const link = document.createElement("a");
      link.href = attachment.fileUrl;
      link.download = attachment.DocumentName || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error("File not available for download");
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm("Are you sure you want to delete this attachment?")) {
      return;
    }

    try {
      const result = await supplierService.deleteSupplierAttachment(attachmentId);
      if (result.Status === 1) {
        setAttachments(attachments.filter((a) => a.SupplierAttachmentID !== attachmentId));
        toast.success(result.Message || "Attachment deleted successfully");
      } else {
        toast.error(result.Message || "Failed to delete attachment");
      }
    } catch (err) {
      console.error("Error deleting attachment:", err);
      toast.error("Failed to delete attachment");
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown size";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const isDocumentExpiringSoon = (expiryDate?: string | Date): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isDocumentExpired = (expiryDate?: string | Date): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  if (loading) {
    return (
      <div className="container p-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-red-500 mb-4">{error || "Supplier not found"}</p>
            <Button onClick={() => navigate("/suppliers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Suppliers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Supplier Details</CardTitle>
            <CardDescription>View supplier information and related details</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/suppliers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={() => navigate(`/suppliers/edit/${supplier.SupplierID}`)}>
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
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <h2 className="text-2xl font-bold">
                  {supplier.SupplierNo} - {supplier.SupplierName}
                </h2>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={supplier.Status === "Active" ? "default" : "destructive"}
                    className={supplier.Status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {supplier.Status}
                  </Badge>
                  {supplier.HasCreditFacility && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      Credit Facility
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-gray-500 mb-4">{supplier.Remarks || "No remarks provided."}</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Supplier Type:</span>
                    <span className="font-medium">{supplier.SupplierTypeName || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Payment Terms:</span>
                    <span className="font-medium">{supplier.PaymentTermName || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HandCoins className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Credit Limit:</span>
                    <span className="font-medium">{supplier.CreditLimit ? `${supplier.CreditLimit.toFixed(2)}` : "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Credit Days:</span>
                    <span className="font-medium">{supplier.CreditDays || "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">VAT Reg No:</span>
                    <span className="font-medium">{supplier.VatRegNo || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Tax ID:</span>
                    <span className="font-medium">{supplier.TaxName || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HandCoins className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Discount %:</span>
                    <span className="font-medium">{supplier.DiscountPercentage ? `${supplier.DiscountPercentage}%` : "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{[supplier.CityName, supplier.CountryName].filter(Boolean).join(", ") || "N/A"}</span>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {supplier.PhoneNo && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{supplier.PhoneNo}</span>
                  </div>
                )}
                {supplier.MobileNo && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{supplier.MobileNo}</span>
                  </div>
                )}
                {supplier.Email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{supplier.Email}</span>
                  </div>
                )}
                {supplier.Website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={supplier.Website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      {supplier.Website}
                    </a>
                  </div>
                )}
              </div>

              {supplier.Address && (
                <div className="mt-4">
                  <span className="text-muted-foreground">Address:</span>
                  <p className="mt-1 text-sm">{supplier.Address}</p>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          <Tabs defaultValue="contacts">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="banking">Banking Details</TabsTrigger>
              <TabsTrigger value="gl-accounts">GL Accounts</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>

            <TabsContent value="contacts" className="mt-6">
              <h3 className="text-lg font-medium mb-4">Contact Details</h3>
              {contacts.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No contacts found for this supplier.</div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>Default</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact) => (
                        <TableRow key={contact.SupplierContactID}>
                          <TableCell className="font-medium">{contact.ContactName}</TableCell>
                          <TableCell>{contact.ContactTypeDescription || "N/A"}</TableCell>
                          <TableCell>{contact.Designation || "-"}</TableCell>
                          <TableCell>{contact.EmailID || "-"}</TableCell>
                          <TableCell>{contact.PhoneNo || "-"}</TableCell>
                          <TableCell>{contact.MobileNo || "-"}</TableCell>
                          <TableCell>
                            {contact.IsDefault ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="banking" className="mt-6">
              <h3 className="text-lg font-medium mb-4">Banking Details</h3>
              {bankDetails.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No banking details found for this supplier.</div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account No</TableHead>
                        <TableHead>Bank Name</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>SWIFT Code</TableHead>
                        <TableHead>IBAN</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Default</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bankDetails.map((bank) => (
                        <TableRow key={bank.SupplierBankID}>
                          <TableCell className="font-medium">{bank.AccountNo}</TableCell>
                          <TableCell>{bank.BankName || "N/A"}</TableCell>
                          <TableCell>{bank.BranchName || "-"}</TableCell>
                          <TableCell>{bank.SwiftCode || "-"}</TableCell>
                          <TableCell>{bank.IBAN || "-"}</TableCell>
                          <TableCell>{bank.BankCategoryName || "-"}</TableCell>
                          <TableCell>
                            {bank.IsDefault ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="gl-accounts" className="mt-6">
              <h3 className="text-lg font-medium mb-4">GL Account Details</h3>
              {glDetails.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No GL accounts found for this supplier.</div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account Code</TableHead>
                        <TableHead>Account Name</TableHead>
                        <TableHead>Account Type</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {glDetails.map((gl) => (
                        <TableRow key={gl.SupplierGLID}>
                          <TableCell className="font-medium">{gl.AccountCode}</TableCell>
                          <TableCell>{gl.AccountName || "N/A"}</TableCell>
                          <TableCell>{gl.AccountTypeName || "-"}</TableCell>
                          <TableCell>{gl.CurrencyName || "-"}</TableCell>
                          <TableCell>
                            {gl.IsDefault ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </TableCell>
                          <TableCell>{gl.Remarks || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="attachments" className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Attachments</h3>
                <Button onClick={() => navigate(`/suppliers/edit/${supplier.SupplierID}`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Attachment
                </Button>
              </div>

              {attachments.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No attachments found for this supplier.</div>
              ) : (
                <>
                  {/* Grid view for attachments */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                    {attachments.map((attachment, index) => (
                      <Card key={attachment.SupplierAttachmentID} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col space-y-3">
                          <div className="flex justify-center">
                            <AttachmentThumbnail
                              fileUrl={attachment.fileUrl}
                              fileName={attachment.DocumentName || "Document"}
                              fileType={attachment.FileContentType}
                              className="w-20 h-20"
                              onClick={() => handleAttachmentGallery(index)}
                            />
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-sm font-medium truncate" title={attachment.DocumentName}>
                              {attachment.DocumentName}
                            </h4>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">{attachment.DocTypeName || "Document"}</span>
                              {attachment.DocExpiryDate && (
                                <Badge
                                  variant={isDocumentExpired(attachment.DocExpiryDate) ? "destructive" : isDocumentExpiringSoon(attachment.DocExpiryDate) ? "default" : "outline"}
                                  className={
                                    isDocumentExpired(attachment.DocExpiryDate)
                                      ? "bg-red-100 text-red-800"
                                      : isDocumentExpiringSoon(attachment.DocExpiryDate)
                                      ? "bg-yellow-100 text-yellow-800"
                                      : ""
                                  }
                                >
                                  {isDocumentExpired(attachment.DocExpiryDate) ? "Expired" : isDocumentExpiringSoon(attachment.DocExpiryDate) ? "Expiring" : "Valid"}
                                </Badge>
                              )}
                            </div>

                            <div className="text-xs text-muted-foreground">
                              {attachment.FileSize && <div>Size: {formatFileSize(attachment.FileSize)}</div>}
                              {attachment.DocExpiryDate && <div>Expires: {format(new Date(attachment.DocExpiryDate), "MMM dd, yyyy")}</div>}
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t">
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm" onClick={() => handleAttachmentPreview(attachment, index)} title="Preview">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDownloadAttachment(attachment)} title="Download">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAttachment(attachment.SupplierAttachmentID)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Table view for detailed information */}
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Issue Date</TableHead>
                          <TableHead>Expiry Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attachments.map((attachment, index) => (
                          <TableRow key={attachment.SupplierAttachmentID}>
                            <TableCell className="font-medium">
                              <div className="flex items-center space-x-2">
                                <AttachmentThumbnail
                                  fileUrl={attachment.fileUrl}
                                  fileName={attachment.DocumentName || "Document"}
                                  fileType={attachment.FileContentType}
                                  className="w-8 h-8"
                                />
                                <span>{attachment.DocumentName}</span>
                              </div>
                            </TableCell>
                            <TableCell>{attachment.DocTypeName || "-"}</TableCell>
                            <TableCell>{attachment.FileSize ? formatFileSize(attachment.FileSize) : "-"}</TableCell>
                            <TableCell>{attachment.DocIssueDate ? format(new Date(attachment.DocIssueDate), "MMM dd, yyyy") : "-"}</TableCell>
                            <TableCell>{attachment.DocExpiryDate ? format(new Date(attachment.DocExpiryDate), "MMM dd, yyyy") : "-"}</TableCell>
                            <TableCell>
                              {attachment.DocExpiryDate && (
                                <Badge
                                  variant={isDocumentExpired(attachment.DocExpiryDate) ? "destructive" : isDocumentExpiringSoon(attachment.DocExpiryDate) ? "default" : "outline"}
                                  className={
                                    isDocumentExpired(attachment.DocExpiryDate)
                                      ? "bg-red-100 text-red-800"
                                      : isDocumentExpiringSoon(attachment.DocExpiryDate)
                                      ? "bg-yellow-100 text-yellow-800"
                                      : ""
                                  }
                                >
                                  {isDocumentExpired(attachment.DocExpiryDate) ? "Expired" : isDocumentExpiringSoon(attachment.DocExpiryDate) ? "Expiring Soon" : "Valid"}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => handleAttachmentPreview(attachment, index)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDownloadAttachment(attachment)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteAttachment(attachment.SupplierAttachmentID)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="transactions" className="mt-6">
              <h3 className="text-lg font-medium mb-4">Transaction History</h3>
              <div className="text-center py-10 text-muted-foreground">Transaction history feature will be implemented when purchase order and invoice modules are available.</div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Supplier"
        description={`Are you sure you want to delete the supplier "${supplier.SupplierName}"? This action cannot be undone and will remove all data associated with this supplier.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Attachment Preview Dialog */}
      {selectedAttachment && (
        <AttachmentPreview
          isOpen={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          fileUrl={selectedAttachment.fileUrl}
          fileName={selectedAttachment.DocumentName || "Document"}
          fileType={selectedAttachment.FileContentType}
          fileSize={selectedAttachment.FileSize}
          uploadDate={selectedAttachment.CreatedOn}
          uploadedBy={selectedAttachment.CreatedBy}
          description={selectedAttachment.Remarks}
          documentType={selectedAttachment.DocTypeName}
          issueDate={selectedAttachment.DocIssueDate}
          expiryDate={selectedAttachment.DocExpiryDate}
        />
      )}

      {/* Attachment Gallery Dialog */}
      <AttachmentGallery
        isOpen={galleryDialogOpen}
        onClose={() => setGalleryDialogOpen(false)}
        attachments={attachments}
        initialAttachmentId={attachments[selectedAttachmentIndex]?.SupplierAttachmentID}
      />
    </div>
  );
};

export default SupplierDetails;
