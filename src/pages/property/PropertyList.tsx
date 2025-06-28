import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Search, Building, Plus, MapPin, Calendar, FileImage, Paperclip } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { propertyService, Property } from "@/services/propertyService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countryService } from "@/services/countryService";
import { cityService } from "@/services/cityService";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const PropertyList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filters
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  const [communities, setCommunities] = useState<any[]>([]);

  // Fetch properties and filter data on component mount
  useEffect(() => {
    fetchProperties();
    fetchFilterData();
  }, []);

  // Fetch all properties with image counts
  const fetchProperties = async (search?: string, filters?: any) => {
    try {
      setLoading(true);
      const propertiesData = await propertyService.getPropertiesWithImageCounts();

      // Apply client-side filtering if search or filters are provided
      let filteredProperties = propertiesData;

      if (search && search.length >= 2) {
        filteredProperties = filteredProperties.filter(
          (property) =>
            property.PropertyName.toLowerCase().includes(search.toLowerCase()) ||
            property.PropertyNo?.toLowerCase().includes(search.toLowerCase()) ||
            property.Location?.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (filters?.countryId) {
        filteredProperties = filteredProperties.filter((property) => property.CountryID === filters.countryId);
      }

      if (filters?.cityId) {
        filteredProperties = filteredProperties.filter((property) => property.CityID === filters.cityId);
      }

      if (filters?.communityId) {
        filteredProperties = filteredProperties.filter((property) => property.CommunityID === filters.communityId);
      }

      setProperties(filteredProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data for filters
  const fetchFilterData = async () => {
    try {
      const [countriesData, communitiesData] = await Promise.all([
        countryService.getCountriesForDropdown(),
        // Fetch communities from appropriate service
        // This is a placeholder - replace with actual service call
        Promise.resolve([]),
      ]);

      setCountries(countriesData);
      setCommunities(communitiesData);
    } catch (error) {
      console.error("Error fetching filter data:", error);
    }
  };

  // Fetch cities when country changes
  useEffect(() => {
    const fetchCities = async () => {
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

    fetchCities();
  }, [selectedCountryId]);

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      const filters = {
        countryId: selectedCountryId ? parseInt(selectedCountryId) : undefined,
        cityId: selectedCityId ? parseInt(selectedCityId) : undefined,
        communityId: selectedCommunityId ? parseInt(selectedCommunityId) : undefined,
      };
      fetchProperties(value, filters);
    }
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle filter changes
  const handleCountryChange = (value: string) => {
    setSelectedCountryId(value);
    setSelectedCityId("");
    applyFilters(value, "", selectedCommunityId);
  };

  const handleCityChange = (value: string) => {
    setSelectedCityId(value);
    applyFilters(selectedCountryId, value, selectedCommunityId);
  };

  const handleCommunityChange = (value: string) => {
    setSelectedCommunityId(value);
    applyFilters(selectedCountryId, selectedCityId, value);
  };

  const applyFilters = (countryId: string, cityId: string, communityId: string) => {
    const filters = {
      countryId: countryId ? parseInt(countryId) : undefined,
      cityId: cityId ? parseInt(cityId) : undefined,
      communityId: communityId ? parseInt(communityId) : undefined,
    };
    fetchProperties(searchTerm, filters);
  };

  // Navigation handlers
  const handleAddProperty = () => {
    navigate("/properties/new");
  };

  const handleEditProperty = (propertyId: number) => {
    navigate(`/properties/edit/${propertyId}`);
  };

  const handleViewProperty = (propertyId: number) => {
    navigate(`/properties/${propertyId}`);
  };

  // Delete confirmation handlers
  const openDeleteDialog = (property: Property) => {
    setSelectedProperty(property);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedProperty(null);
  };

  const handleDeleteProperty = async () => {
    if (!selectedProperty) return;

    try {
      const success = await propertyService.deleteProperty(selectedProperty.PropertyID);

      if (success) {
        setProperties(properties.filter((p) => p.PropertyID !== selectedProperty.PropertyID));
        toast.success("Property deleted successfully");
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

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "dd MMM yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format attachment counts for display
  const formatAttachmentInfo = (property: Property) => {
    const imageCount = property.ImageCount || 0;
    const attachmentCount = property.AttachmentCount || 0;
    const totalCount = property.TotalAttachmentCount || 0;

    if (totalCount === 0) {
      return { text: "No attachments", icon: null, variant: "outline" as const };
    }

    if (imageCount > 0 && attachmentCount > 0) {
      return {
        text: `${imageCount} images, ${attachmentCount} docs`,
        icon: <FileImage className="h-3 w-3 mr-1" />,
        variant: "default" as const,
      };
    } else if (imageCount > 0) {
      return {
        text: `${imageCount} image${imageCount > 1 ? "s" : ""}`,
        icon: <FileImage className="h-3 w-3 mr-1" />,
        variant: "default" as const,
      };
    } else {
      return {
        text: `${attachmentCount} document${attachmentCount > 1 ? "s" : ""}`,
        icon: <Paperclip className="h-3 w-3 mr-1" />,
        variant: "secondary" as const,
      };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Properties</h1>
        <Button onClick={handleAddProperty}>
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Property Management</CardTitle>
          <CardDescription>Manage property details and information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search properties..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>

            <Select value={selectedCountryId} onValueChange={handleCountryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Countries</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.CountryID} value={country.CountryID.toString()}>
                    {country.CountryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCityId} onValueChange={handleCityChange} disabled={!selectedCountryId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={selectedCountryId ? "All Cities" : "Select Country First"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.CityID} value={city.CityID.toString()}>
                    {city.CityName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {communities.length > 0 && (
              <Select value={selectedCommunityId} onValueChange={handleCommunityChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Communities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Communities</SelectItem>
                  {communities.map((community) => (
                    <SelectItem key={community.CommunityID} value={community.CommunityID.toString()}>
                      {community.CommunityName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedCountryId || selectedCityId || selectedCommunityId ? "No properties found matching your criteria." : "No properties found."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Property</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Project Dates</TableHead>
                    <TableHead>Plot Details</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Attachments</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => {
                    const attachmentInfo = formatAttachmentInfo(property);
                    return (
                      <TableRow key={property.PropertyID}>
                        <TableCell>
                          <div className="font-medium">{property.PropertyName}</div>
                          <div className="text-sm text-muted-foreground">{property.PropertyNo || "No property number"}</div>
                          {property.MainImageName && (
                            <div className="text-xs text-blue-600 mt-1 flex items-center">
                              <FileImage className="h-3 w-3 mr-1" />
                              Main image: {property.MainImageName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            {property.Location && (
                              <div className="text-sm flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {property.Location}
                              </div>
                            )}
                            <div className="text-sm">{[property.CityName, property.CountryName].filter(Boolean).join(", ") || "Location not specified"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1 text-sm">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Start: {formatDate(property.ProjectStartDate)}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Completion: {formatDate(property.ProjectCompletionDate)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1 text-sm">
                            {property.PlotNo && <div>Plot: {property.PlotNo}</div>}
                            {property.PlotSize && <div>Size: {property.PlotSize.toLocaleString()} sq.ft</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {property.TotalUnit ? `${property.TotalUnit} ${property.TotalUnit === 1 ? "Unit" : "Units"}` : "No units"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={attachmentInfo.variant} className="font-normal">
                            {attachmentInfo.icon}
                            {attachmentInfo.text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewProperty(property.PropertyID)}>View details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditProperty(property.PropertyID)}>Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(property)}>
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteProperty}
        title="Delete Property"
        description={
          selectedProperty
            ? `Are you sure you want to delete "${selectedProperty.PropertyName}"? This will also delete all associated data and attachments. This action cannot be undone.`
            : "Are you sure you want to delete this property?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default PropertyList;
