import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cityService, City } from "@/services/cityService";
import { countryService, Country } from "@/services/countryService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ArrowLeft, Edit, Trash2, Building2, Globe, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";

export const CityDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [city, setCity] = useState<City | null>(null);
  const [country, setCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCityData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch city data
        const cityData = await cityService.getCityById(parseInt(id));

        if (cityData) {
          setCity(cityData);

          // Fetch country data if available
          if (cityData.CountryID) {
            try {
              const countryData = await countryService.getCountryById(cityData.CountryID);
              setCountry(countryData);
            } catch (countryError) {
              console.warn("Could not fetch country:", countryError);
              // Continue without country data as it's not critical
            }
          }
        } else {
          setError("City not found");
          toast.error("City not found");
        }
      } catch (err) {
        console.error("Error fetching city:", err);
        setError("Failed to load city details");
        toast.error("Failed to load city details");
      } finally {
        setLoading(false);
      }
    };

    fetchCityData();
  }, [id]);

  const handleDelete = async () => {
    if (!city) return;

    try {
      const success = await cityService.deleteCity(city.CityID);
      if (success) {
        toast.success("City deleted successfully");
        navigate("/cities");
      } else {
        toast.error("Failed to delete city");
      }
    } catch (err) {
      console.error("Error deleting city:", err);
      toast.error("Failed to delete city");
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

  if (error || !city) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-red-500 mb-4">{error || "City not found"}</p>
            <Button onClick={() => navigate("/cities")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">City Details</CardTitle>
            <CardDescription>View and manage city information</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/cities")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={() => navigate(`/cities/edit/${city.CityID}`)}>
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
              <div className="flex items-center justify-center w-24 h-24 bg-purple-100 rounded-full">
                <Building2 className="h-12 w-12 text-purple-600" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <h2 className="text-2xl font-bold">{city.CityName}</h2>
                <div className="flex gap-2">
                  {city.CityCode && (
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {city.CityCode}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    City ID: {city.CityID}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                {country && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {country.CountryName} ({country.CountryCode})
                    </span>
                  </div>
                )}
                {city.StateName && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>State/Province: {city.StateName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Created on: {formatDate(city.CreatedOn)}</span>
                </div>
                {city.UpdatedOn && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Last updated: {formatDate(city.UpdatedOn)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">City ID:</span>
                  <span>{city.CityID}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">City Name:</span>
                  <span>{city.CityName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">City Code:</span>
                  <span>{city.CityCode || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">State ID:</span>
                  <span>{city.StateID || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">State Name:</span>
                  <span>{city.StateName || "—"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Country Information</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Country ID:</span>
                  <span>{city.CountryID || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Country Name:</span>
                  <span>{city.CountryName || country?.CountryName || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Country Code:</span>
                  <span>{country?.CountryCode || "—"}</span>
                </div>
                {country && (
                  <div className="pt-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/countries/${country.CountryID}`)}>
                      <Globe className="mr-2 h-4 w-4" />
                      View Country Details
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Record Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Record Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Created By:</span>
                  <span>{city.CreatedBy || "System"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Created On:</span>
                  <span>{formatDate(city.CreatedOn)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Last Updated By:</span>
                  <span>{city.UpdatedBy || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Last Updated On:</span>
                  <span>{city.UpdatedOn ? formatDate(city.UpdatedOn) : "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Actions */}
          <Separator className="my-6" />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate(`/cities/edit/${city.CityID}`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit City
              </Button>
              {country && (
                <Button variant="outline" onClick={() => navigate(`/countries/${country.CountryID}`)}>
                  <Globe className="mr-2 h-4 w-4" />
                  View Country
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate(`/cities/new?countryId=${city.CountryID}`)}>
                <Building2 className="mr-2 h-4 w-4" />
                Add Another City
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete City"
        description={`Are you sure you want to delete ${city.CityName}? This action cannot be undone and may affect related records.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default CityDetails;
