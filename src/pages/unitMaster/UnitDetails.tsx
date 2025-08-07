// src/pages/UnitMaster/UnitDetails.tsx - Enhanced with Attachments Display
import { useState, useEffect } from "react";
import { UnitDetailsProps } from "./types";
import { UnitAttachment } from "../../services/unitService";
import { UNIT_TABS } from "./constants";
import { Home, Users, Calendar, HandCoins, Copy, Edit, FileImage, Paperclip, Download, Eye, Trash2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { unitService } from "../../services/unitService";

// Enhanced UNIT_TABS to include attachments
const ENHANCED_UNIT_TABS = {
  ...UNIT_TABS,
  ATTACHMENTS: "attachments",
};

export const UnitDetails: React.FC<UnitDetailsProps> = ({ unit, contacts, isLoading, onEdit, onBack, onClone }) => {
  const [activeTab, setActiveTab] = useState(ENHANCED_UNIT_TABS.GENERAL);
  const [attachments, setAttachments] = useState<UnitAttachment[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // Load attachments when unit changes
  useEffect(() => {
    const fetchAttachments = async () => {
      if (!unit?.UnitID) return;

      try {
        setLoadingAttachments(true);
        const unitAttachments = await unitService.getUnitAttachments(unit.UnitID);
        setAttachments(unitAttachments);
      } catch (error) {
        console.error("Error fetching unit attachments:", error);
        toast.error("Failed to load unit attachments");
      } finally {
        setLoadingAttachments(false);
      }
    };

    fetchAttachments();
  }, [unit?.UnitID]);

  // Helper function to convert base64 string to data URL for image display
  const getImageDataUrl = (attachment: UnitAttachment): string | null => {
    // If FilePath exists (legacy), use it directly
    if (attachment.FilePath) {
      return attachment.FilePath;
    }

    // If FileContent exists as base64 string, convert to data URL
    if (attachment.FileContent && typeof attachment.FileContent === "string") {
      const mimeType = attachment.FileContentType || "image/jpeg";
      return `data:${mimeType};base64,${attachment.FileContent}`;
    }

    return null;
  };

  // Helper function to convert base64 string to blob for download
  const base64ToBlob = (base64String: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return "Not specified";
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatFileSize = (bytes?: number) => {
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

  const getImageAttachments = () => {
    return attachments.filter(
      (att) =>
        att.AttachmentType === "Image" ||
        att.AttachmentType === "Blueprint" ||
        att.FileContentType?.startsWith("image/") ||
        att.DocumentName?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
    );
  };

  const getDocumentAttachments = () => {
    return attachments.filter(
      (att) =>
        !["Image", "Blueprint"].includes(att.AttachmentType || "") && !att.FileContentType?.startsWith("image/") && !att.DocumentName?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
    );
  };

  const handleDownloadAttachment = async (attachment: UnitAttachment) => {
    try {
      let blob: Blob;
      let fileName = attachment.DocumentName || "download";

      if (attachment.FileContent && typeof attachment.FileContent === "string") {
        // Convert base64 to blob
        const mimeType = attachment.FileContentType || "application/octet-stream";
        blob = base64ToBlob(attachment.FileContent, mimeType);
      } else if (attachment.FilePath) {
        // For legacy file path approach, fetch the file
        const response = await fetch(attachment.FilePath);
        blob = await response.blob();
      } else {
        toast.error("No file content available for download");
        return;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Download started successfully");
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast.error("Failed to download attachment");
    }
  };

  const handleDeleteAttachment = async (attachment: UnitAttachment) => {
    if (!window.confirm("Are you sure you want to delete this attachment?")) return;

    try {
      if (!attachment.UnitAttachmentID) return;

      const success = await unitService.deleteAttachment(attachment.UnitAttachmentID);
      if (success) {
        setAttachments((prev) => prev.filter((a) => a.UnitAttachmentID !== attachment.UnitAttachmentID));
        toast.success("Attachment deleted successfully");
      } else {
        toast.error("Failed to delete attachment");
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Failed to delete attachment");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading unit details...</div>;
  }

  if (!unit) {
    return <div className="text-center py-8">Unit not found or has been deleted.</div>;
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800";
      case "Reserved":
        return "bg-purple-100 text-purple-800";
      case "Leased":
        return "bg-blue-100 text-blue-800";
      case "Sold":
        return "bg-gray-100 text-gray-800";
      case "Maintenance":
      case "NotAvailable":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleClone = () => {
    if (onClone) {
      onClone();
    }
  };

  const imageAttachments = getImageAttachments();
  const documentAttachments = getDocumentAttachments();

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">
              Unit {unit.UnitNo}
              {unit.PropertyName && ` - ${unit.PropertyName}`}
            </h2>
            <p className="text-gray-500">{[unit.UnitTypeName, unit.BedRooms && `${unit.BedRooms} Bed`, unit.BathRooms && `${unit.BathRooms} Bath`].filter(Boolean).join(" • ")}</p>
          </div>
          <div className="flex items-center gap-2">
            {unit.UnitStatus && <Badge className={getStatusColor(unit.UnitStatus)}>{unit.UnitStatus}</Badge>}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClone}>
                <Copy className="mr-2 h-4 w-4" />
                Clone Unit
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value={ENHANCED_UNIT_TABS.GENERAL}>
            <Home className="mr-2 h-4 w-4" />
            General Information
          </TabsTrigger>
          <TabsTrigger value={ENHANCED_UNIT_TABS.ATTACHMENTS}>
            <FileImage className="mr-2 h-4 w-4" />
            Images & Documents ({attachments.length})
          </TabsTrigger>
          <TabsTrigger value={ENHANCED_UNIT_TABS.CONTACTS}>
            <Users className="mr-2 h-4 w-4" />
            Contacts ({contacts.length})
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <HandCoins className="mr-2 h-4 w-4" />
            Pricing Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value={ENHANCED_UNIT_TABS.GENERAL}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Unit Information</h3>
                <div className="space-y-4">
                  <DetailRow label="Unit Number" value={unit.UnitNo} />
                  <DetailRow label="Property" value={unit.PropertyName} />
                  <DetailRow label="Type" value={unit.UnitTypeName} />
                  <DetailRow label="Category" value={unit.UnitCategoryName} />
                  <DetailRow label="View" value={unit.UnitViewName} />
                  <DetailRow label="Floor" value={unit.FloorName} />
                  <DetailRow label="Class" value={unit.UnitClassName} />
                  <DetailRow label="Status" value={unit.UnitStatus} />
                  <DetailRow label="Model" value={unit.UnitModel} />
                  <DetailRow label="Style" value={unit.UnitStyleName} />
                  <DetailRow label="Community" value={unit.CommunityName} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Area & Location</h3>
                <div className="space-y-4">
                  <DetailRow
                    label="Living Area"
                    value={unit.LivingAreaSqft ? `${unit.LivingAreaSqft.toLocaleString()} sqft / ${unit.LivingAreaSqftMtr?.toLocaleString() || "-"} sqm` : undefined}
                  />
                  <DetailRow
                    label="Balcony Area"
                    value={unit.BalconyAreaSqft ? `${unit.BalconyAreaSqft.toLocaleString()} sqft / ${unit.BalconyAreaSqftMtr?.toLocaleString() || "-"} sqm` : undefined}
                  />
                  <DetailRow
                    label="Terrace Area"
                    value={unit.TereaceAreaSqft ? `${unit.TereaceAreaSqft.toLocaleString()} sqft / ${unit.TereaceAreaSqftMtr?.toLocaleString() || "-"} sqm` : undefined}
                  />
                  <DetailRow
                    label="Total Area"
                    value={unit.TotalAreaSqft ? `${unit.TotalAreaSqft.toLocaleString()} sqft / ${unit.TotalAreaSqftMtr?.toLocaleString() || "-"} sqm` : undefined}
                  />
                  <Separator className="my-4" />
                  <DetailRow label="Country" value={unit.CountryName} />
                  <DetailRow label="City" value={unit.CityName} />
                  <DetailRow label="Block" value={unit.Block?.toString()} />
                  <DetailRow label="Sector" value={unit.Sector?.toString()} />
                  <DetailRow label="Municipality No." value={unit.MuncipalyNo?.toString()} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <HandCoins className="mr-2 h-5 w-5" />
                  Financial Details
                </h3>
                <div className="space-y-4">
                  <DetailRow label="Unit Rate" value={unit.UnitRate ? `$${unit.UnitRate.toLocaleString()} per sqft` : undefined} />
                  <DetailRow label="Listing Price" value={unit.ListingPrice ? `$${unit.ListingPrice.toLocaleString()}` : undefined} />
                  <DetailRow label="Sale Price" value={unit.SalePrice ? `$${unit.SalePrice.toLocaleString()}` : undefined} />
                  <Separator className="my-4" />
                  <DetailRow label="Monthly Rent" value={unit.PerMonth ? `$${unit.PerMonth.toLocaleString()}/month` : undefined} />
                  <DetailRow label="Yearly Rent" value={unit.PerYear ? `$${unit.PerYear.toLocaleString()}/year` : undefined} />
                  <DetailRow label="Lease Installments" value={unit.NoOfInstallmentLease?.toString()} />
                  <DetailRow label="Sale Installments" value={unit.NoOfInstallmentSale?.toString()} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Additional Information
                </h3>
                <div className="space-y-4">
                  {unit.Remarks ? (
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Remarks</div>
                      <div className="text-sm">{unit.Remarks}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No additional remarks available for this unit.</div>
                  )}
                  <Separator className="my-4" />
                  <DetailRow label="Created By" value={unit.CreatedBy} />
                  <DetailRow label="Created On" value={unit.CreatedOn ? new Date(unit.CreatedOn).toLocaleString() : undefined} />
                  {unit.UpdatedBy && (
                    <>
                      <DetailRow label="Updated By" value={unit.UpdatedBy} />
                      <DetailRow label="Updated On" value={unit.UpdatedOn ? new Date(unit.UpdatedOn).toLocaleString() : undefined} />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value={ENHANCED_UNIT_TABS.ATTACHMENTS}>
          <div className="space-y-6">
            {loadingAttachments ? (
              <div className="flex justify-center py-8">Loading attachments...</div>
            ) : (
              <Tabs defaultValue="images" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="images">Images ({imageAttachments.length})</TabsTrigger>
                  <TabsTrigger value="documents">Documents ({documentAttachments.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="images">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileImage className="mr-2 h-5 w-5 text-muted-foreground" />
                        Unit Images ({imageAttachments.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {imageAttachments.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                          <FileImage className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No images found for this unit.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {imageAttachments.map((attachment) => {
                            const displayUrl = getImageDataUrl(attachment);
                            return (
                              <div key={attachment.UnitAttachmentID} className="relative group">
                                <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                                  {displayUrl ? (
                                    <img
                                      src={displayUrl}
                                      alt={attachment.ImageAltText || attachment.DocumentName}
                                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                      onClick={() => setSelectedImage(displayUrl)}
                                      onError={(e) => {
                                        console.error("Image failed to load:", attachment.DocumentName);
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <FileImage className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                  )}
                                  {attachment.IsMainImage && (
                                    <Badge className="absolute top-2 left-2" variant="default">
                                      <Star className="h-3 w-3 mr-1" />
                                      Main
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-2">
                                  <p className="text-sm font-medium truncate">{attachment.DocumentName}</p>
                                  {attachment.ImageCaption && <p className="text-xs text-muted-foreground truncate">{attachment.ImageCaption}</p>}
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-muted-foreground">{formatFileSize(attachment.FileSize)}</span>
                                    <div className="flex space-x-1">
                                      {displayUrl && (
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setSelectedImage(displayUrl)}>
                                          <Eye className="h-3 w-3" />
                                        </Button>
                                      )}
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleDownloadAttachment(attachment)}>
                                        <Download className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-700" onClick={() => handleDeleteAttachment(attachment)}>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Paperclip className="mr-2 h-5 w-5 text-muted-foreground" />
                        Unit Documents ({documentAttachments.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {documentAttachments.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                          <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No documents found for this unit.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {documentAttachments.map((attachment) => (
                            <div key={attachment.UnitAttachmentID} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{attachment.DocumentName}</span>
                                    {attachment.DocTypeName && (
                                      <Badge variant="outline" className="text-xs">
                                        {attachment.DocTypeName}
                                      </Badge>
                                    )}
                                    {attachment.AttachmentType && (
                                      <Badge variant={attachment.AttachmentType === "Certificate" ? "default" : "secondary"} className="text-xs">
                                        {attachment.AttachmentType}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-1 text-sm text-muted-foreground">
                                    <span>Size: {formatFileSize(attachment.FileSize)}</span>
                                    {attachment.DocIssueDate && <span className="ml-4">Issued: {formatDate(attachment.DocIssueDate)}</span>}
                                    {attachment.DocExpiryDate && <span className="ml-4">Expires: {formatDate(attachment.DocExpiryDate)}</span>}
                                  </div>
                                  {attachment.Remarks && <p className="mt-2 text-sm text-muted-foreground">{attachment.Remarks}</p>}
                                </div>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline" onClick={() => handleDownloadAttachment(attachment)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteAttachment(attachment)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </TabsContent>

        <TabsContent value={ENHANCED_UNIT_TABS.CONTACTS}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Unit Contacts</h3>
                <Button variant="outline" size="sm" onClick={handleClone}>
                  <Copy className="mr-2 h-4 w-4" />
                  Clone Unit with Contacts
                </Button>
              </div>

              {contacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No contacts associated with this unit.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Contact Type</th>
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Remarks</th>
                        <th className="text-left p-3">Created On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((contact) => (
                        <tr key={contact.UnitContactID} className="border-b hover:bg-gray-50">
                          <td className="p-3">{contact.ContactTypeName}</td>
                          <td className="p-3 font-medium">{contact.ContactName}</td>
                          <td className="p-3">{contact.Remarks || "-"}</td>
                          <td className="p-3 text-sm text-gray-500">{contact.CreatedOn ? new Date(contact.CreatedOn).toLocaleDateString() : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Sale Information</h3>
                <div className="space-y-4">
                  <DetailRow label="Unit Rate" value={unit.UnitRate ? `$${unit.UnitRate.toLocaleString()} per sqft` : undefined} />
                  <DetailRow label="Listing Price" value={unit.ListingPrice ? `$${unit.ListingPrice.toLocaleString()}` : undefined} />
                  <DetailRow label="Sale Price" value={unit.SalePrice ? `$${unit.SalePrice.toLocaleString()}` : undefined} />
                  <DetailRow label="Sale Installments" value={unit.NoOfInstallmentSale?.toString()} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Lease Information</h3>
                <div className="space-y-4">
                  <DetailRow label="Monthly Rent" value={unit.PerMonth ? `$${unit.PerMonth.toLocaleString()}` : undefined} />
                  <DetailRow label="Yearly Rent" value={unit.PerYear ? `$${unit.PerYear.toLocaleString()}` : undefined} />
                  <DetailRow label="Lease Installments" value={unit.NoOfInstallmentLease?.toString()} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Property Management</h3>
                <div className="space-y-4">
                  <DetailRow label="Monthly PM Fee" value={unit.PerMonthRentPm ? `$${unit.PerMonthRentPm.toLocaleString()}` : undefined} />
                  <DetailRow label="Yearly PM Fee" value={unit.PerYearRentPm ? `$${unit.PerYearRentPm.toLocaleString()}` : undefined} />
                  <DetailRow label="PM Installments" value={unit.NoOfInstallmentPM?.toString()} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center">
              <img
                src={selectedImage}
                alt="Unit Image"
                className="max-w-full max-h-[70vh] object-contain"
                onError={(e) => {
                  console.error("Preview image failed to load");
                  toast.error("Failed to load image preview");
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface DetailRowProps {
  label: string;
  value?: string | null;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => {
  if (!value) return null;

  return (
    <div>
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
};
