import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Search, Plus, Percent, Calendar, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { taxService, Tax } from "@/services/taxService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countryService } from "@/services/countryService";

const TaxList: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTax, setSelectedTax] = useState<Tax | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filter states
  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [selectedTaxType, setSelectedTaxType] = useState<string>("");

  // Fetch taxes and countries on component mount
  useEffect(() => {
    fetchTaxes();
    fetchCountries();
  }, []);

  // Fetch all taxes
  const fetchTaxes = async (search?: string, countryId?: number, taxType?: string) => {
    try {
      setLoading(true);
      let taxesData: Tax[];

      // Apply all filters
      taxesData = await taxService.searchTaxes(search || "", countryId);

      // Additional client-side filtering for tax type if specified
      if (taxType) {
        taxesData = taxesData.filter((tax) => {
          if (taxType === "sales") return tax.IsSalesTax;
          if (taxType === "service") return tax.IsServiceTax;
          if (taxType === "exempt") return tax.IsExemptOrZero;
          return true;
        });
      }

      setTaxes(taxesData);
    } catch (error) {
      console.error("Error fetching taxes:", error);
      toast.error("Failed to load taxes");
    } finally {
      setLoading(false);
    }
  };

  // Fetch countries for filter
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
      fetchTaxes(value, selectedCountryId ? parseInt(selectedCountryId) : undefined, selectedTaxType);
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
    fetchTaxes(searchTerm, value ? parseInt(value) : undefined, selectedTaxType);
  };

  // Handle tax type filter change
  const handleTaxTypeChange = (value: string) => {
    setSelectedTaxType(value);
    fetchTaxes(searchTerm, selectedCountryId ? parseInt(selectedCountryId) : undefined, value);
  };

  // Navigation handlers
  const handleAddTax = () => {
    navigate("/taxes/new");
  };

  const handleEditTax = (taxId: number) => {
    navigate(`/taxes/edit/${taxId}`);
  };

  const handleViewTax = (taxId: number) => {
    navigate(`/taxes/${taxId}`);
  };

  // Delete confirmation handlers
  const openDeleteDialog = (tax: Tax) => {
    setSelectedTax(tax);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedTax(null);
  };

  const handleDeleteTax = async () => {
    if (!selectedTax) return;

    try {
      const success = await taxService.deleteTax(selectedTax.TaxID);

      if (success) {
        setTaxes(taxes.filter((t) => t.TaxID !== selectedTax.TaxID));
        toast.success("Tax deleted successfully");
      } else {
        toast.error("Failed to delete tax");
      }
    } catch (error) {
      console.error("Error deleting tax:", error);
      toast.error("Failed to delete tax");
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Taxes</h1>
        <Button onClick={handleAddTax}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tax
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Tax Management</CardTitle>
          <CardDescription>Manage tax rates, categories, and configurations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search taxes..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>

            <Select value={selectedCountryId} onValueChange={handleCountryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Countries</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.CountryID} value={country.CountryID.toString()}>
                    {country.CountryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTaxType} onValueChange={handleTaxTypeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Tax Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Tax Types</SelectItem>
                <SelectItem value="sales">Sales Tax</SelectItem>
                <SelectItem value="service">Service Tax</SelectItem>
                <SelectItem value="exempt">Exempt/Zero Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : taxes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedCountryId || selectedTaxType ? "No taxes found matching your criteria." : "No taxes found."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Tax Code</TableHead>
                    <TableHead>Tax Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Effective Period</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxes.map((tax) => (
                    <TableRow key={tax.TaxID}>
                      <TableCell className="font-medium">{tax.TaxCode}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Percent className="h-4 w-4 mr-2 text-muted-foreground" />
                          {tax.TaxName}
                        </div>
                      </TableCell>
                      <TableCell>{tax.TaxCategory || "General"}</TableCell>
                      <TableCell className="text-right font-medium">{tax.IsExemptOrZero ? <Badge variant="outline">Exempt</Badge> : `${tax.TaxRate.toFixed(2)}%`}</TableCell>
                      <TableCell>
                        {tax.CountryName ? (
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                            {tax.CountryName}
                          </div>
                        ) : (
                          "Global"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <div className="text-xs flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                            From: {formatDate(tax.EffectiveFromDate)}
                          </div>
                          {tax.ExpiryDate && (
                            <div className="text-xs flex items-center">
                              <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                              To: {formatDate(tax.ExpiryDate)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tax.IsSalesTax && (
                            <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                              Sales
                            </Badge>
                          )}
                          {tax.IsServiceTax && (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                              Service
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewTax(tax.TaxID)}>View details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditTax(tax.TaxID)}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(tax)}>
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
        onConfirm={handleDeleteTax}
        title="Delete Tax"
        description={
          selectedTax
            ? `Are you sure you want to delete "${selectedTax.TaxName} (${selectedTax.TaxCode})"? This will also delete all associated data and cannot be undone.`
            : "Are you sure you want to delete this tax?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default TaxList;
