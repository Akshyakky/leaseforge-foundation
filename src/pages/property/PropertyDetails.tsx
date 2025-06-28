import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { propertyService, Property, PropertyAttachment } from "@/services/propertyService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit2, Trash2, Home, Calendar, MapPin, ParkingCircle, Ruler, Compass, Pencil, Building, FileImage, Download, Eye, Paperclip, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<Property | null>(null);
  const [attachments, setAttachments] = useState<PropertyAttachment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!id) {
        navigate("/properties");
        return;
      }

      try {
        setLoading(true);
        const propertyData = await propertyService.getPropertyById(parseInt(id));

        if (propertyData) {
          setProperty(propertyData.property);
          setAttachments(propertyData.attachments);
        } else {
          toast.error("Property not found");
          navigate("/properties");
        }
      } catch (error) {
        console.error("Error fetching property:", error);
        toast.error("Failed to load property data");
        navigate("/properties");
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [id, navigate]);

  const handleEdit = () => {
    if (!property) return;
    navigate(`/properties/edit/${property.PropertyID}`);
  };

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!property) return;

    try {
      const success = await propertyService.deleteProperty(property.PropertyID);

      if (success) {
        toast.success("Property deleted successfully");
        navigate("/properties");
      } else {
        toast.error("Failed to delete property");
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error("Failed to delete property");
    } finally {
      closeDeleteDialog();
    }
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return "Not specified";
    try {
      return format(new Date(date), "dd MMM yyyy");
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
    return attachments.filter((att) => att.AttachmentType === "Image" || att.FileContentType?.startsWith("image/") || att.DocumentName?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i));
  };

  const getDocumentAttachments = () => {
    return attachments.filter((att) => att.AttachmentType !== "Image" && !att.FileContentType?.startsWith("image/") && !att.DocumentName?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i));
  };

  const handleDownloadAttachment = async (attachment: PropertyAttachment) => {
    try {
      // This would typically involve a download service call
      // For now, we'll just show a message
      toast.info("Download feature would be implemented here");
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast.error("Failed to download attachment");
    }
  };

  const handleDeleteAttachment = async (attachment: PropertyAttachment) => {
    try {
      if (!attachment.PropertyAttachmentID) return;

      const success = await propertyService.deletePropertyAttachment(attachment.PropertyAttachmentID);
      if (success) {
        setAttachments((prev) => prev.filter((a) => a.PropertyAttachmentID !== attachment.PropertyAttachmentID));
        toast.success("Attachment deleted successfully");
      } else {
        toast.error("Failed to delete attachment");
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Failed to delete attachment");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl">Property not found</h2>
        <Button className="mt-4" onClick={() => navigate("/properties")}>
          Back to properties
        </Button>
      </div>
    );
  }

  const imageAttachments = getImageAttachments();
  const documentAttachments = getDocumentAttachments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/properties")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">{property.PropertyName}</h1>
          {property.PropertyNo && <span className="text-sm text-muted-foreground">#{property.PropertyNo}</span>}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={openDeleteDialog}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Property Details</TabsTrigger>
          <TabsTrigger value="images">Images ({imageAttachments.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documentAttachments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="mr-2 h-5 w-5 text-muted-foreground" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Property Number" value={property.PropertyNo} />
                  <DetailRow label="Title Deed" value={property.TitleDeed} />
                </div>

                {(property.ProjectStartDate || property.ProjectCompletionDate) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        Project Timeline
                      </h3>
                      {property.ProjectStartDate && (
                        <div className="grid grid-cols-2 gap-4">
                          <DetailRow label="Start Date" value={formatDate(property.ProjectStartDate)} />
                          {property.ProjectCompletionDate && <DetailRow label="Completion Date" value={formatDate(property.ProjectCompletionDate)} />}
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
                  <MapPin className="mr-2 h-5 w-5 text-muted-foreground" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Country" value={property.CountryName} />
                  <DetailRow label="City" value={property.CityName} />
                </div>

                <DetailRow label="Community" value={property.CommunityName} />
                <DetailRow label="Location" value={property.Location} />
                <DetailRow label="GEO Location" value={property.GEOLocation} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5 text-muted-foreground" />
                  Plot Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Plot Number" value={property.PlotNo} />
                  <DetailRow label="Plot Size" value={property.PlotSize ? `${property.PlotSize.toLocaleString()} sq ft` : undefined} />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Built-up Area" value={property.BuildUpArea ? `${property.BuildUpArea.toLocaleString()} sq ft` : undefined} />
                  <DetailRow label="Gross Area" value={property.GrossArea ? `${property.GrossArea.toLocaleString()} sq ft` : undefined} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ParkingCircle className="mr-2 h-5 w-5 text-muted-foreground" />
                  Property Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Total Units" value={property.TotalUnit !== undefined ? property.TotalUnit?.toString() : undefined} />
                  <DetailRow label="No. of Floors" value={property.NoOfFloors !== undefined ? property.NoOfFloors?.toString() : undefined} />
                </div>

                <DetailRow label="Total Parking Spaces" value={property.TotalParkings !== undefined ? property.TotalParkings?.toString() : undefined} />

                <Separator />

                <DetailRow label="Square Foot Rate" value={property.SquareFootRate ? `$${property.SquareFootRate?.toLocaleString()} per sq ft` : undefined} />

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Total Attachments" value={property.TotalAttachmentCount ? property.TotalAttachmentCount?.toString() : "0"} />
                  <DetailRow label="Images" value={property.ImageCount ? property.ImageCount?.toString() : "0"} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ruler className="mr-2 h-5 w-5 text-muted-foreground" />
                  Area Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <DetailCard
                    title="Plot Size"
                    value={property.PlotSize ? `${property.PlotSize.toLocaleString()} sq ft` : "Not specified"}
                    icon={<Compass className="h-5 w-5" />}
                  />
                  <DetailCard
                    title="Built-up Area"
                    value={property.BuildUpArea ? `${property.BuildUpArea.toLocaleString()} sq ft` : "Not specified"}
                    icon={<Compass className="h-5 w-5" />}
                  />
                  <DetailCard
                    title="Gross Area"
                    value={property.GrossArea ? `${property.GrossArea.toLocaleString()} sq ft` : "Not specified"}
                    icon={<Compass className="h-5 w-5" />}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Pencil className="mr-2 h-5 w-5 text-muted-foreground" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Remarks</h3>
                  <p className="text-sm text-muted-foreground rounded-md p-3 bg-muted/20">{property.Remark || "No additional remarks available for this property."}</p>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <h3 className="text-sm font-medium">Audit Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {property.CreatedBy && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Created By</p>
                        <p>
                          {property.CreatedBy} {property.CreatedOn && <span>on {formatDate(property.CreatedOn)}</span>}
                        </p>
                      </div>
                    )}
                    {property.UpdatedBy && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Last Updated By</p>
                        <p>
                          {property.UpdatedBy} {property.UpdatedOn && <span>on {formatDate(property.UpdatedOn)}</span>}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileImage className="mr-2 h-5 w-5 text-muted-foreground" />
                Property Images ({imageAttachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {imageAttachments.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No images found for this property.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imageAttachments.map((attachment) => (
                    <div key={attachment.PropertyAttachmentID} className="relative group">
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                        {attachment.FilePath ? (
                          <img
                            src={attachment.FilePath}
                            alt={attachment.ImageAltText || attachment.DocumentName}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setSelectedImage(attachment.FilePath || null)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        {attachment.IsMainImage && (
                          <Badge className="absolute top-2 left-2" variant="default">
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
                            {attachment.FilePath && (
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setSelectedImage(attachment.FilePath || null)}>
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
                  ))}
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
                Property Documents ({documentAttachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documentAttachments.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents found for this property.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documentAttachments.map((attachment) => (
                    <div key={attachment.PropertyAttachmentID} className="border rounded-lg p-4">
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

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center">
              <img src={selectedImage} alt="Property Image" className="max-w-full max-h-[70vh] object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Property"
        description={`Are you sure you want to delete "${property.PropertyName}"? This will also delete all associated data and attachments and cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

// Helper component for displaying property details
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

// Card component for displaying property details
interface DetailCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
}

const DetailCard: React.FC<DetailCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-muted/20 rounded-lg p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
        {icon}
        {title}
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
};

export default PropertyDetails;
