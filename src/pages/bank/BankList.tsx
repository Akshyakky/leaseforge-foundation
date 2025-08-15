import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Plus, Building2, Tag, CreditCard, Globe, Eye, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bankService, bankCategoryService } from "@/services/bankService";
import { Country, countryService } from "@/services/countryService";
import { Bank, BankCategory } from "@/types/bankTypes";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BankList = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCategories, setBankCategories] = useState<BankCategory[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<BankCategory | null>(null);
  const [isDeleteBankDialogOpen, setIsDeleteBankDialogOpen] = useState(false);
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [selectedActiveFilter, setSelectedActiveFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("banks");

  // Fetch data on component mount
  useEffect(() => {
    fetchBanks();
    fetchBankCategories();
    fetchCountries();
  }, []);

  // Fetch all banks
  const fetchBanks = async (search?: string, countryId?: string, isActive?: boolean) => {
    try {
      setLoading(true);
      let banksData: Bank[];

      if (search || countryId || isActive !== undefined) {
        banksData = await bankService.getAllBanks({
          searchText: search,
          filterCountryID: countryId ? parseInt(countryId) : undefined,
          filterIsActive: isActive,
        });
      } else {
        banksData = await bankService.getAllBanks();
      }

      setBanks(banksData);
    } catch (error) {
      console.error("Error fetching banks:", error);
      toast.error("Failed to load banks");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all bank categories
  const fetchBankCategories = async (search?: string) => {
    try {
      setCategoriesLoading(true);
      const categoriesData = await bankCategoryService.getAllBankCategories({
        searchText: search,
      });
      setBankCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching bank categories:", error);
      toast.error("Failed to load bank categories");
    } finally {
      setCategoriesLoading(false);
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
    if (activeTab === "banks") {
      if (value.length >= 2 || value === "") {
        fetchBanks(value, selectedCountryId, getActiveFilterValue());
      }
    } else {
      if (value.length >= 2 || value === "") {
        fetchBankCategories(value);
      }
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
    setSelectedCountryId(value === "all" ? "" : value);
    fetchBanks(searchTerm, value === "all" ? "" : value, getActiveFilterValue());
  };

  // Handle active status filter change
  const handleActiveFilterChange = (value: string) => {
    setSelectedActiveFilter(value);
    fetchBanks(searchTerm, selectedCountryId, getActiveFilterValue(value));
  };

  // Get active filter boolean value
  const getActiveFilterValue = (filterValue?: string): boolean | undefined => {
    const filter = filterValue || selectedActiveFilter;
    if (filter === "active") return true;
    if (filter === "inactive") return false;
    return undefined;
  };

  // Tab change handler
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchTerm("");
  };

  // Navigation handlers
  const handleAddBank = () => {
    navigate("/banks/new");
  };

  const handleAddBankCategory = () => {
    navigate("/bank-categories/new");
  };

  const handleEditBank = (bankId: number) => {
    navigate(`/banks/edit/${bankId}`);
  };

  const handleEditBankCategory = (categoryId: number) => {
    navigate(`/bank-categories/edit/${categoryId}`);
  };

  const handleViewBank = (bankId: number) => {
    navigate(`/banks/${bankId}`);
  };

  // Delete confirmation handlers for banks
  const openDeleteBankDialog = (bank: Bank) => {
    setSelectedBank(bank);
    setIsDeleteBankDialogOpen(true);
  };

  const closeDeleteBankDialog = () => {
    setIsDeleteBankDialogOpen(false);
    setSelectedBank(null);
  };

  const handleDeleteBank = async () => {
    if (!selectedBank) return;

    try {
      const result = await bankService.deleteBank(selectedBank.BankID);

      if (result.Status === 1) {
        setBanks(banks.filter((b) => b.BankID !== selectedBank.BankID));
        toast.success(result.Message);
      } else {
        toast.error(result.Message);
      }
    } catch (error) {
      console.error("Error deleting bank:", error);
      toast.error("Failed to delete bank");
    } finally {
      closeDeleteBankDialog();
    }
  };

  // Delete confirmation handlers for bank categories
  const openDeleteCategoryDialog = (category: BankCategory) => {
    setSelectedCategory(category);
    setIsDeleteCategoryDialogOpen(true);
  };

  const closeDeleteCategoryDialog = () => {
    setIsDeleteCategoryDialogOpen(false);
    setSelectedCategory(null);
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      const result = await bankCategoryService.deleteBankCategory(selectedCategory.CategoryID);

      if (result.Status === 1) {
        setBankCategories(bankCategories.filter((c) => c.CategoryID !== selectedCategory.CategoryID));
        toast.success(result.Message);
      } else {
        toast.error(result.Message);
      }
    } catch (error) {
      console.error("Error deleting bank category:", error);
      toast.error("Failed to delete bank category");
    } finally {
      closeDeleteCategoryDialog();
    }
  };

  // Render active status badge
  const renderActiveStatus = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Bank Management</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Banks & Categories</CardTitle>
          <CardDescription>Manage bank master data and categories</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="banks">Banks ({banks.length})</TabsTrigger>
                <TabsTrigger value="categories">Categories ({bankCategories.length})</TabsTrigger>
              </TabsList>
              <Button onClick={activeTab === "banks" ? handleAddBank : handleAddBankCategory}>
                <Plus className="mr-2 h-4 w-4" />
                {activeTab === "banks" ? "Add Bank" : "Add Category"}
              </Button>
            </div>

            <div className="flex justify-between items-center mb-6 gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder={`Search ${activeTab}...`} className="pl-9" value={searchTerm} onChange={handleSearchChange} />
              </div>
              {activeTab === "banks" && (
                <div className="flex items-center space-x-2">
                  <Select value={selectedCountryId || "all"} onValueChange={handleCountryChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      {countries.map((country) => (
                        <SelectItem key={country.CountryID} value={country.CountryID.toString()}>
                          {country.CountryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedActiveFilter} onValueChange={handleActiveFilterChange}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <TabsContent value="banks">
              {/* Summary Cards for Banks */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Total Banks</span>
                    </div>
                    <div className="text-2xl font-bold">{banks.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Active Banks</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{banks.filter((b) => b.IsActive).length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-muted-foreground">With SWIFT Code</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{banks.filter((b) => b.SwiftCode).length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-muted-foreground">Countries</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{new Set(banks.filter((b) => b.CountryID).map((b) => b.CountryID)).size}</div>
                  </CardContent>
                </Card>
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : banks.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {searchTerm || selectedCountryId || selectedActiveFilter !== "all"
                    ? "No banks found matching your criteria."
                    : "No banks found. Create your first bank to get started."}
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Bank Details</TableHead>
                        <TableHead>SWIFT Code</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {banks.map((bank) => (
                        <TableRow key={bank.BankID}>
                          <TableCell>
                            <div className="font-medium">{bank.BankName}</div>
                            <div className="text-sm text-muted-foreground">{bank.BankCode}</div>
                          </TableCell>
                          <TableCell>
                            {bank.SwiftCode ? <code className="bg-muted px-2 py-1 rounded text-sm">{bank.SwiftCode}</code> : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>{bank.CountryName || <span className="text-muted-foreground">Not specified</span>}</TableCell>
                          <TableCell>{renderActiveStatus(bank.IsActive)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {bank.CreatedBy && <div>{bank.CreatedBy}</div>}
                              {bank.CreatedOn && <div className="text-muted-foreground">{new Date(bank.CreatedOn).toLocaleDateString()}</div>}
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
                                <DropdownMenuItem onClick={() => handleViewBank(bank.BankID)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditBank(bank.BankID)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500" onClick={() => openDeleteBankDialog(bank)}>
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
            </TabsContent>

            <TabsContent value="categories">
              {/* Summary Cards for Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Total Categories</span>
                    </div>
                    <div className="text-2xl font-bold">{bankCategories.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Active Categories</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{bankCategories.filter((c) => c.IsActive).length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-muted-foreground">Inactive Categories</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-600">{bankCategories.filter((c) => !c.IsActive).length}</div>
                  </CardContent>
                </Card>
              </div>

              {categoriesLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : bankCategories.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {searchTerm ? "No bank categories found matching your criteria." : "No bank categories found. Create your first category to get started."}
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Category Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bankCategories.map((category) => (
                        <TableRow key={category.CategoryID}>
                          <TableCell>
                            <div className="font-medium">{category.CategoryName}</div>
                          </TableCell>
                          <TableCell>{category.Description || <span className="text-muted-foreground">—</span>}</TableCell>
                          <TableCell>{renderActiveStatus(category.IsActive)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {category.CreatedBy && <div>{category.CreatedBy}</div>}
                              {category.CreatedOn && <div className="text-muted-foreground">{new Date(category.CreatedOn).toLocaleDateString()}</div>}
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
                                <DropdownMenuItem onClick={() => handleEditBankCategory(category.CategoryID)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500" onClick={() => openDeleteCategoryDialog(category)}>
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Bank Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteBankDialogOpen}
        onClose={closeDeleteBankDialog}
        onConfirm={handleDeleteBank}
        title="Delete Bank"
        description={
          selectedBank
            ? `Are you sure you want to delete "${selectedBank.BankName}"? This action cannot be undone and may affect related transactions.`
            : "Are you sure you want to delete this bank?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />

      {/* Delete Category Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteCategoryDialogOpen}
        onClose={closeDeleteCategoryDialog}
        onConfirm={handleDeleteCategory}
        title="Delete Bank Category"
        description={
          selectedCategory
            ? `Are you sure you want to delete "${selectedCategory.CategoryName}"? This action cannot be undone and may affect related banks.`
            : "Are you sure you want to delete this bank category?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default BankList;
