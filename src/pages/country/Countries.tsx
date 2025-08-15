import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Plus, Globe, MapPin, Star } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { countryService, Country } from "@/services/countryService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";

const Countries = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch countries on component mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch all countries
  const fetchCountries = async (search?: string) => {
    try {
      setLoading(true);
      let countriesData: Country[];

      if (search && search.trim()) {
        countriesData = await countryService.searchCountries(search.trim());
      } else {
        countriesData = await countryService.getAllCountries();
      }

      setCountries(countriesData);
    } catch (error) {
      console.error("Error fetching countries:", error);
      toast.error("Failed to load countries");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      fetchCountries(value);
    }
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Navigation handlers
  const handleAddCountry = () => {
    navigate("/countries/new");
  };

  const handleEditCountry = (countryId: number) => {
    navigate(`/countries/edit/${countryId}`);
  };

  const handleViewCountry = (countryId: number) => {
    navigate(`/countries/${countryId}`);
  };

  // Delete confirmation handlers
  const openDeleteDialog = (country: Country) => {
    setSelectedCountry(country);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedCountry(null);
  };

  const handleDeleteCountry = async () => {
    if (!selectedCountry) return;

    try {
      const success = await countryService.deleteCountry(selectedCountry.CountryID);

      if (success) {
        setCountries(countries.filter((c) => c.CountryID !== selectedCountry.CountryID));
        toast.success("Country deleted successfully");
      } else {
        toast.error("Failed to delete country");
      }
    } catch (error) {
      console.error("Error deleting country:", error);
      toast.error("Failed to delete country");
    } finally {
      closeDeleteDialog();
    }
  };

  // Calculate statistics
  const defaultCountriesCount = countries.filter((country) => country.IsDefault).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Countries</h1>
        <Button onClick={handleAddCountry}>
          <Plus className="mr-2 h-4 w-4" />
          Add Country
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Country Management</CardTitle>
          <CardDescription>Manage country master data and geographical information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6 gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search countries..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
          </div>

          {/* Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Countries</span>
                </div>
                <div className="text-2xl font-bold">{countries.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Active Records</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{countries.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-muted-foreground">Default Country</span>
                </div>
                <div className="text-2xl font-bold text-amber-600">{defaultCountriesCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Search Results</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{searchTerm ? countries.length : "—"}</div>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : countries.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">{searchTerm ? "No countries found matching your search criteria." : "No countries found."}</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country Code</TableHead>
                    <TableHead>Country Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {countries.map((country) => (
                    <TableRow key={country.CountryID}>
                      <TableCell>
                        <div className="flex items-center">
                          <Badge variant="secondary" className="mr-2">
                            {country.CountryCode}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{country.CountryName}</span>
                          {country.IsDefault && (
                            <Badge variant="default" className="bg-amber-100 text-amber-800 border-amber-200">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {country.IsDefault ? (
                          <Badge variant="default" className="bg-amber-100 text-amber-800 border-amber-200">
                            Default
                          </Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>{country.CreatedBy ? <span>{country.CreatedBy}</span> : <span className="text-muted-foreground">System</span>}</TableCell>
                      <TableCell>
                        {country.CreatedOn ? <span>{new Date(country.CreatedOn).toLocaleDateString()}</span> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {country.UpdatedOn ? (
                          <div className="flex flex-col">
                            <span>{new Date(country.UpdatedOn).toLocaleDateString()}</span>
                            {country.UpdatedBy && <span className="text-sm text-muted-foreground">by {country.UpdatedBy}</span>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCountry(country.CountryID)}>View details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditCountry(country.CountryID)}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={country.IsDefault ? "text-muted-foreground" : "text-red-500"}
                              onClick={() => !country.IsDefault && openDeleteDialog(country)}
                              disabled={country.IsDefault}
                            >
                              {country.IsDefault ? "Cannot Delete Default" : "Delete"}
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
        onConfirm={handleDeleteCountry}
        title="Delete Country"
        description={
          selectedCountry
            ? `Are you sure you want to delete the country "${selectedCountry.CountryName}"? This action cannot be undone and may affect related records.`
            : "Are you sure you want to delete this country?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Countries;
