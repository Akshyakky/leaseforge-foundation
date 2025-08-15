import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { countryService, Country } from "@/services/countryService";
import { cityService, City } from "@/services/cityService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, Trash2, Globe, MapPin, Calendar, User, Building2, Star } from "lucide-react";
import { toast } from "sonner";

export const CountryDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [country, setCountry] = useState<Country | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCountryData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch country data
        const countryData = await countryService.getCountryById(parseInt(id));

        if (countryData) {
          setCountry(countryData);

          // Fetch cities for this country
          try {
            const citiesData = await cityService.getCitiesByCountry(countryData.CountryID);
            setCities(citiesData);
          } catch (cityError) {
            console.warn("Could not fetch cities:", cityError);
            // Continue without city data as it's not critical
          }
        } else {
          setError("Country not found");
          toast.error("Country not found");
        }
      } catch (err) {
        console.error("Error fetching country:", err);
        setError("Failed to load country details");
        toast.error("Failed to load country details");
      } finally {
        setLoading(false);
      }
    };

    fetchCountryData();
  }, [id]);

  const handleDelete = async () => {
    if (!country) return;

    try {
      const success = await countryService.deleteCountry(country.CountryID);
      if (success) {
        toast.success("Country deleted successfully");
        navigate("/countries");
      } else {
        toast.error("Failed to delete country");
      }
    } catch (err) {
      console.error("Error deleting country:", err);
      toast.error("Failed to delete country");
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

  if (error || !country) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-red-500 mb-4">{error || "Country not found"}</p>
            <Button onClick={() => navigate("/countries")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Countries
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
            <CardTitle className="text-2xl">Country Details</CardTitle>
            <CardDescription>View and manage country information</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/countries")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={() => navigate(`/countries/edit/${country.CountryID}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={country.IsDefault}>
              <Trash2 className="mr-2 h-4 w-4" />
              {country.IsDefault ? "Cannot Delete Default" : "Delete"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex items-center justify-center md:justify-start">
              <div className="flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full relative">
                <Globe className="h-12 w-12 text-blue-600" />
                {country.IsDefault && (
                  <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-1">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{country.CountryName}</h2>
                  {country.IsDefault && (
                    <Badge variant="default" className="bg-amber-100 text-amber-800 border-amber-200">
                      <Star className="h-3 w-3 mr-1" />
                      Default Country
                    </Badge>
                  )}
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {country.CountryCode}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{cities.length} cities registered</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Created on: {formatDate(country.CreatedOn)}</span>
                </div>
                {country.UpdatedOn && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Last updated: {formatDate(country.UpdatedOn)}</span>
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
                  <span className="text-sm font-medium text-muted-foreground">Country ID:</span>
                  <span>{country.CountryID}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Country Code:</span>
                  <span>{country.CountryCode}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Country Name:</span>
                  <span>{country.CountryName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Default Country:</span>
                  <span>
                    {country.IsDefault ? (
                      <Badge variant="default" className="bg-amber-100 text-amber-800 border-amber-200">
                        <Star className="h-3 w-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Record Information</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Created By:</span>
                  <span>{country.CreatedBy || "System"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Created On:</span>
                  <span>{formatDate(country.CreatedOn)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Last Updated By:</span>
                  <span>{country.UpdatedBy || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Last Updated On:</span>
                  <span>{country.UpdatedOn ? formatDate(country.UpdatedOn) : "—"}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Cities Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Cities ({cities.length})</h3>
              <Button variant="outline" onClick={() => navigate(`/cities/new?countryId=${country.CountryID}`)}>
                <Building2 className="mr-2 h-4 w-4" />
                Add City
              </Button>
            </div>

            {cities.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
                <p className="text-muted-foreground mb-4">No cities registered for this country.</p>
                <Button variant="outline" onClick={() => navigate(`/cities/new?countryId=${country.CountryID}`)}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Add First City
                </Button>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Registered Cities</CardTitle>
                  <CardDescription>Cities registered under this country</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>City Name</TableHead>
                        <TableHead>City Code</TableHead>
                        <TableHead>Created Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cities.map((city) => (
                        <TableRow key={city.CityID}>
                          <TableCell className="font-medium">{city.CityName}</TableCell>
                          <TableCell>{city.CityCode ? <Badge variant="outline">{city.CityCode}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                          <TableCell>{city.CreatedOn ? new Date(city.CreatedOn).toLocaleDateString() : "—"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/cities/${city.CityID}`)}>
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Country"
        description={
          country.IsDefault
            ? `Cannot delete ${country.CountryName} because it is set as the default country. Please set another country as default before deleting this one.`
            : `Are you sure you want to delete ${country.CountryName}? This action cannot be undone and may affect related records including cities.`
        }
        confirmText={country.IsDefault ? "OK" : "Delete"}
        cancelText={country.IsDefault ? undefined : "Cancel"}
        type={country.IsDefault ? "info" : "danger"}
      />
    </div>
  );
};

export default CountryDetails;
