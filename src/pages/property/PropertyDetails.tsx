import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { propertyService, Property } from "@/services/propertyService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit2, Trash2, Home, Calendar, MapPin, ParkingCircle, Ruler, Compass, Pencil, Building } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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
          setProperty(propertyData);
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Property Details</TabsTrigger>
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
                  <DetailRow label="Total Units" value={property.TotalUnit !== undefined ? property.TotalUnit.toString() : undefined} />
                  <DetailRow label="No. of Floors" value={property.NoOfFloors !== undefined ? property.NoOfFloors.toString() : undefined} />
                </div>

                <DetailRow label="Total Parking Spaces" value={property.TotalParkings !== undefined ? property.TotalParkings.toString() : undefined} />

                <Separator />

                <DetailRow label="Square Foot Rate" value={property.SquareFootRate ? `$${property.SquareFootRate.toLocaleString()} per sq ft` : undefined} />
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
      </Tabs>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Property"
        description={`Are you sure you want to delete "${property.PropertyName}"? This will also delete all associated data and cannot be undone.`}
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
