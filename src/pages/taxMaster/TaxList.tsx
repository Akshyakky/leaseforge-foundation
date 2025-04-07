import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, PlusCircle, Edit, Trash2, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { taxService, Tax } from "@/services/taxService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

const TaxList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTax, setSelectedTax] = useState<Tax | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [countries, setCountries] = useState<{ CountryID: number; CountryName: string }[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  // Derived values
  const uniqueCategories = Array.from(new Set(taxes.map((tax) => tax.TaxCategory).filter(Boolean) as string[]));

  // Fetch taxes on component mount
  useEffect(() => {
    fetchTaxes();
    fetchCountries();
  }, []);

  // Fetch all taxes
  const fetchTaxes = async (search?: string, params?: any) => {
    try {
      setLoading(true);
      let taxData: Tax[];

      if (search || (params && Object.keys(params).length > 0)) {
        // If search term or filter is provided, use search endpoint
        taxData = await taxService.searchTaxes(search || "", params?.countryId);
      } else {
        // Otherwise fetch all taxes
        taxData = await taxService.getAllTaxes();
      }

      setTaxes(taxData);
    } catch (error) {
      console.error("Error fetching taxes:", error);
      toast.error("Failed to load taxes");
    } finally {
      setLoading(false);
    }
  };

  // Fetch countries for filtering
  const fetchCountries = async () => {
    try {
      // This is a placeholder. You'll need to implement a countryService or get this data from another service
      // For now, we'll use an empty array
      setCountries([]);
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      fetchTaxes(value, {
        countryId: selectedCountry ? parseInt(selectedCountry) : undefined,
      });
    }
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle category filter change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    // Filter taxes client-side by category
    if (value) {
      setTaxes(taxes.filter((tax) => tax.TaxCategory === value));
    } else {
      // If no category selected, fetch all taxes again
      fetchTaxes(searchTerm, {
        countryId: selectedCountry ? parseInt(selectedCountry) : undefined,
      });
    }
  };

  // Handle country filter change
  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    fetchTaxes(searchTerm, {
      countryId: value ? parseInt(value) : undefined,
    });
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

  // Render tax type badge
  const renderTaxBadge = (tax: Tax) => {
    // Different badge styles based on tax type
    if (tax.IsExemptOrZero) {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700">
          Exempt
        </Badge>
      );
    } else if (tax.IsSalesTax) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Sales
        </Badge>
      );
    } else if (tax.IsServiceTax) {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700">
          Service
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
          Other
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Tax Management</h1>
        <Button onClick={handleAddTax}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Tax
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Taxes</CardTitle>
          <CardDescription>Manage tax rates, categories, and rules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6 gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search taxes..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex items-center space-x-2">
              {uniqueCategories.length > 0 && (
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All Categories</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {countries.length > 0 && (
                <Select value={selectedCountry} onValueChange={handleCountryChange}>
                  <SelectTrigger className="w-[180px]">
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
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : taxes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedCategory || selectedCountry ? "No taxes found matching your criteria." : "No taxes found. Click 'Add Tax' to create your first tax record."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tax Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Rate (%)</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxes.map((tax) => (
                    <TableRow key={tax.TaxID} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewTax(tax.TaxID)}>
                      <TableCell className="font-medium">{tax.TaxCode}</TableCell>
                      <TableCell>{tax.TaxName}</TableCell>
                      <TableCell>{tax.TaxRate}%</TableCell>
                      <TableCell>{tax.TaxCategory || "-"}</TableCell>
                      <TableCell>{renderTaxBadge(tax)}</TableCell>
                      <TableCell>{tax.EffectiveFromDate ? formatDate(new Date(tax.EffectiveFromDate)) : "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTax(tax.TaxID);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTax(tax.TaxID);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(tax);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteTax}
        title="Delete Tax"
        description={`Are you sure you want to delete '${selectedTax?.TaxName}'? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default TaxList;
