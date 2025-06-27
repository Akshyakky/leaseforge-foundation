import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Plus, Building2, Globe, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cityService, City } from "@/services/cityService";
import { countryService, Country } from "@/services/countryService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";

const Cities = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");

  // Fetch cities and countries on component mount
  useEffect(() => {
    fetchCities();
    fetchCountries();
  }, []);

  // Fetch all cities
  const fetchCities = async (search?: string, countryId?: string) => {
    try {
      setLoading(true);
      let citiesData: City[];

      if (countryId && countryId !== "") {
        // Filter by country
        citiesData = await cityService.getCitiesByCountry(parseInt(countryId));

        // If we also have a search term, filter the results further
        if (search && search.trim()) {
          citiesData = citiesData.filter(
            (city) => city.CityName.toLowerCase().includes(search.toLowerCase()) || (city.CityCode && city.CityCode.toLowerCase().includes(search.toLowerCase()))
          );
        }
      } else if (search && search.trim()) {
        // Search cities
        citiesData = await cityService.searchCities(search.trim());
      } else {
        // Get all cities
        citiesData = await cityService.getAllCities();
      }

      setCities(citiesData);
    } catch (error) {
      console.error("Error fetching cities:", error);
      toast.error("Failed to load cities");
    } finally {
      setLoading(false);
    }
  };

  // Fetch countries for filtering
  const fetchCountries = async () => {
    try {
      const countriesData = await countryService.getCountriesForDropdown();
      setCountries(countriesData);
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      fetchCities(value, selectedCountryId);
    }
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle country filter change
  const handleCountryChange = (value: string) => {
    setSelectedCountryId(value);
    fetchCities(searchTerm, value);
  };

  // Navigation handlers
  const handleAddCity = () => {
    navigate("/cities/new");
  };

  const handleEditCity = (cityId: number) => {
    navigate(`/cities/edit/${cityId}`);
  };

  const handleViewCity = (cityId: number) => {
    navigate(`/cities/${cityId}`);
  };

  // Delete confirmation handlers
  const openDeleteDialog = (city: City) => {
    setSelectedCity(city);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedCity(null);
  };

  const handleDeleteCity = async () => {
    if (!selectedCity) return;

    try {
      const success = await cityService.deleteCity(selectedCity.CityID);

      if (success) {
        setCities(cities.filter((c) => c.CityID !== selectedCity.CityID));
        toast.success("City deleted successfully");
      } else {
        toast.error("Failed to delete city");
      }
    } catch (error) {
      console.error("Error deleting city:", error);
      toast.error("Failed to delete city");
    } finally {
      closeDeleteDialog();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Cities</h1>
        <Button onClick={handleAddCity}>
          <Plus className="mr-2 h-4 w-4" />
          Add City
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>City Management</CardTitle>
          <CardDescription>Manage city master data and geographical information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6 gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search cities..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedCountryId} onValueChange={handleCountryChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by country" />
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
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Cities</span>
                </div>
                <div className="text-2xl font-bold">{cities.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Countries</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{new Set(cities.map((c) => c.CountryID)).size}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Active Records</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{cities.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-muted-foreground">Search Results</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">{searchTerm || selectedCountryId ? cities.length : "—"}</div>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : cities.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">{searchTerm || selectedCountryId ? "No cities found matching your criteria." : "No cities found."}</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>City Name</TableHead>
                    <TableHead>City Code</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>State/Province</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cities.map((city) => (
                    <TableRow key={city.CityID}>
                      <TableCell>
                        <div className="font-medium">{city.CityName}</div>
                      </TableCell>
                      <TableCell>{city.CityCode ? <Badge variant="secondary">{city.CityCode}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        {city.CountryName ? (
                          <div className="flex items-center">
                            <Globe className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span>{city.CountryName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>{city.StateName ? <span>{city.StateName}</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{city.CreatedBy ? <span>{city.CreatedBy}</span> : <span className="text-muted-foreground">System</span>}</TableCell>
                      <TableCell>{city.CreatedOn ? <span>{new Date(city.CreatedOn).toLocaleDateString()}</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCity(city.CityID)}>View details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditCity(city.CityID)}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(city)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteCity}
        title="Delete City"
        description={
          selectedCity
            ? `Are you sure you want to delete the city "${selectedCity.CityName}"? This action cannot be undone and may affect related records.`
            : "Are you sure you want to delete this city?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Cities;
