// src/pages/additionalCharges/AdditionalChargesList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Search, Plus, Filter, Percent, DollarSign, Tag, Database } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { additionalChargesService, Charge } from "@/services/additionalChargesService";
import { additionalChargesCategoryService, ChargesCategory } from "@/services/additionalChargesCategoryService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Schema for category form
const categorySchema = z.object({
  ChargesCategoryCode: z.string().min(1, "Category code is required"),
  ChargesCategoryName: z.string().min(1, "Category name is required"),
  Description: z.string().optional(),
  IsActive: z.boolean().default(true),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const AdditionalChargesList: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [charges, setCharges] = useState<Charge[]>([]);
  const [categories, setCategories] = useState<ChargesCategory[]>([]);
  const [loadingCharges, setLoadingCharges] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ChargesCategory | null>(null);
  const [isDeleteChargeDialogOpen, setIsDeleteChargeDialogOpen] = useState(false);
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("charges");
  const [editingCategory, setEditingCategory] = useState(false);

  // Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(false);
  const [filterDepositsOnly, setFilterDepositsOnly] = useState<boolean>(false);

  // Form for category
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      ChargesCategoryCode: "",
      ChargesCategoryName: "",
      Description: "",
      IsActive: true,
    },
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchCharges();
    fetchCategories();
  }, []);

  // Fetch all charges
  const fetchCharges = async (search?: string, filters?: any) => {
    try {
      setLoadingCharges(true);
      const chargesData = await additionalChargesService.searchCharges(search, filters);
      setCharges(chargesData);
    } catch (error) {
      console.error("Error fetching charges:", error);
      toast.error("Failed to load charges");
    } finally {
      setLoadingCharges(false);
    }
  };

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const categoriesData = await additionalChargesCategoryService.getCategoriesWithCounts();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    const filters = {
      categoryId: selectedCategoryId ? parseInt(selectedCategoryId) : undefined,
      isActive: filterActiveOnly || undefined,
      isDeposit: filterDepositsOnly || undefined,
    };
    fetchCharges(searchTerm, filters);
  };

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      setSearchTerm(value);
      applyFilters();
    }
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Handle filter changes
  useEffect(() => {
    applyFilters();
  }, [selectedCategoryId, filterActiveOnly, filterDepositsOnly]);

  // Navigation handlers
  const handleAddCharge = () => {
    navigate("/additional-charges/new");
  };

  const handleEditCharge = (chargeId: number) => {
    navigate(`/additional-charges/edit/${chargeId}`);
  };

  const handleViewCharge = (chargeId: number) => {
    navigate(`/additional-charges/${chargeId}`);
  };

  // Delete charge handlers
  const openDeleteChargeDialog = (charge: Charge) => {
    setSelectedCharge(charge);
    setIsDeleteChargeDialogOpen(true);
  };

  const closeDeleteChargeDialog = () => {
    setIsDeleteChargeDialogOpen(false);
    setSelectedCharge(null);
  };

  const handleDeleteCharge = async () => {
    if (!selectedCharge) return;

    try {
      const success = await additionalChargesService.deleteCharge(selectedCharge.ChargesID);

      if (success) {
        setCharges(charges.filter((c) => c.ChargesID !== selectedCharge.ChargesID));
        toast.success("Charge deleted successfully");
      } else {
        toast.error("Failed to delete charge");
      }
    } catch (error) {
      console.error("Error deleting charge:", error);
      toast.error("Failed to delete charge");
    } finally {
      closeDeleteChargeDialog();
    }
  };

  // Toggle charge status
  const handleToggleChargeStatus = async (charge: Charge) => {
    try {
      const result = await additionalChargesService.toggleChargeStatus(charge.ChargesID);

      if (result.success) {
        // Update charge in the list
        setCharges(charges.map((c) => (c.ChargesID === charge.ChargesID ? { ...c, IsActive: result.isActive !== undefined ? result.isActive : !c.IsActive } : c)));
        toast.success(`Charge ${result.isActive ? "activated" : "deactivated"} successfully`);
      } else {
        toast.error("Failed to update charge status");
      }
    } catch (error) {
      console.error("Error toggling charge status:", error);
      toast.error("Failed to update charge status");
    }
  };

  // Category dialog handlers
  const openCategoryDialog = (category?: ChargesCategory) => {
    if (category) {
      setEditingCategory(true);
      setSelectedCategory(category);
      categoryForm.reset({
        ChargesCategoryCode: category.ChargesCategoryCode,
        ChargesCategoryName: category.ChargesCategoryName,
        Description: category.Description || "",
        IsActive: category.IsActive,
      });
    } else {
      setEditingCategory(false);
      setSelectedCategory(null);
      categoryForm.reset({
        ChargesCategoryCode: "",
        ChargesCategoryName: "",
        Description: "",
        IsActive: true,
      });
    }
    setIsCategoryDialogOpen(true);
  };

  const closeCategoryDialog = () => {
    setIsCategoryDialogOpen(false);
    setEditingCategory(false);
    setSelectedCategory(null);
  };

  const handleSaveCategory = async (data: CategoryFormValues) => {
    try {
      if (editingCategory && selectedCategory) {
        // Update existing category
        const success = await additionalChargesCategoryService.updateCategory({
          ChargesCategoryID: selectedCategory.ChargesCategoryID,
          ...data,
        });

        if (success) {
          toast.success("Category updated successfully");
          fetchCategories();
        } else {
          toast.error("Failed to update category");
        }
      } else {
        // Create new category
        const newCategoryId = await additionalChargesCategoryService.createCategory(data);

        if (newCategoryId) {
          toast.success("Category created successfully");
          fetchCategories();
        } else {
          toast.error("Failed to create category");
        }
      }
      closeCategoryDialog();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    }
  };

  // Delete category handlers
  const openDeleteCategoryDialog = (category: ChargesCategory) => {
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
      const success = await additionalChargesCategoryService.deleteCategory(selectedCategory.ChargesCategoryID);

      if (success) {
        setCategories(categories.filter((c) => c.ChargesCategoryID !== selectedCategory.ChargesCategoryID));
        toast.success("Category deleted successfully");
      } else {
        toast.error("Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      closeDeleteCategoryDialog();
    }
  };

  // Toggle category status
  const handleToggleCategoryStatus = async (category: ChargesCategory) => {
    try {
      const result = await additionalChargesCategoryService.toggleCategoryStatus(category.ChargesCategoryID);

      if (result.success) {
        // Update category in the list
        setCategories(
          categories.map((c) => (c.ChargesCategoryID === category.ChargesCategoryID ? { ...c, IsActive: result.isActive !== undefined ? result.isActive : !c.IsActive } : c))
        );
        toast.success(`Category ${result.isActive ? "activated" : "deactivated"} successfully`);
      } else {
        toast.error("Failed to update category status");
      }
    } catch (error) {
      console.error("Error toggling category status:", error);
      toast.error("Failed to update category status");
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

  // Format currency
  const formatCurrency = (amount?: number, currencyName?: string) => {
    if (amount === undefined || amount === null) return "N/A";
    return `${currencyName || ""} ${amount.toLocaleString()}`.trim();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Additional Charges</h1>
        {activeTab === "charges" ? (
          <Button onClick={handleAddCharge}>
            <Plus className="mr-2 h-4 w-4" />
            Add Charge
          </Button>
        ) : (
          <Button onClick={() => openCategoryDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Additional Charges Management</CardTitle>
          <CardDescription>Manage charges and their categories</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-[400px] mb-6">
              <TabsTrigger value="charges">Charges</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="charges" className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="text" placeholder="Search charges..." className="pl-9" onChange={handleSearchChange} />
                </div>

                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.ChargesCategoryID} value={category.ChargesCategoryID.toString()}>
                        {category.ChargesCategoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Switch id="active-only" checked={filterActiveOnly} onCheckedChange={setFilterActiveOnly} />
                  <Label htmlFor="active-only">Active Only</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="deposits-only" checked={filterDepositsOnly} onCheckedChange={setFilterDepositsOnly} />
                  <Label htmlFor="deposits-only">Deposits Only</Label>
                </div>
              </div>

              {loadingCharges ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : charges.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {searchTerm || selectedCategoryId || filterActiveOnly || filterDepositsOnly ? "No charges found matching your criteria." : "No charges have been created yet."}
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Charge</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Tax</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {charges.map((charge) => (
                        <TableRow key={charge.ChargesID}>
                          <TableCell>
                            <div className="font-medium">{charge.ChargesName}</div>
                            <div className="text-sm text-muted-foreground">{charge.ChargesCode}</div>
                          </TableCell>
                          <TableCell>{charge.ChargesCategoryName}</TableCell>
                          <TableCell>{charge.IsPercentage ? `${charge.PercentageValue}%` : formatCurrency(charge.ChargeAmount, charge.CurrencyName)}</TableCell>
                          <TableCell>
                            <Badge variant={charge.IsPercentage ? "secondary" : "outline"}>
                              {charge.IsPercentage ? <Percent className="h-3 w-3 mr-1" /> : <DollarSign className="h-3 w-3 mr-1" />}
                              {charge.IsPercentage ? "Percentage" : "Fixed"}
                            </Badge>
                          </TableCell>
                          <TableCell>{charge.TaxName || "No Tax"}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Badge variant={charge.IsActive ? "default" : "secondary"}>{charge.IsActive ? "Active" : "Inactive"}</Badge>
                              {charge.IsDeposit && <Badge variant="outline">Deposit</Badge>}
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
                                <DropdownMenuItem onClick={() => handleViewCharge(charge.ChargesID)}>View details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditCharge(charge.ChargesID)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleChargeStatus(charge)}>{charge.IsActive ? "Deactivate" : "Activate"}</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500" onClick={() => openDeleteChargeDialog(charge)}>
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

            <TabsContent value="categories" className="space-y-4">
              {loadingCategories ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No categories have been created yet.</div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Charges Count</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.ChargesCategoryID}>
                          <TableCell>
                            <div className="font-medium">{category.ChargesCategoryName}</div>
                            <div className="text-sm text-muted-foreground">{category.ChargesCategoryCode}</div>
                          </TableCell>
                          <TableCell>{category.Description || "No description"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              <Database className="h-3 w-3 mr-1" />
                              {category.ChargesCount || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={category.IsActive ? "default" : "secondary"}>{category.IsActive ? "Active" : "Inactive"}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openCategoryDialog(category)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleCategoryStatus(category)}>{category.IsActive ? "Deactivate" : "Activate"}</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onClick={() => openDeleteCategoryDialog(category)}
                                  disabled={!!(category.ChargesCount && category.ChargesCount > 0)}
                                >
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

      {/* Category Form Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription>{editingCategory ? "Update the details for this category." : "Enter the details for the new category."}</DialogDescription>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(handleSaveCategory)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="ChargesCategoryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="ChargesCategoryName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="Description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter description (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="IsActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>Make this category available for selection</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeCategoryDialog}>
                  Cancel
                </Button>
                <Button type="submit">{editingCategory ? "Update Category" : "Create Category"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={isDeleteChargeDialogOpen}
        onClose={closeDeleteChargeDialog}
        onConfirm={handleDeleteCharge}
        title="Delete Charge"
        description={
          selectedCharge ? `Are you sure you want to delete "${selectedCharge.ChargesName}"? This action cannot be undone.` : "Are you sure you want to delete this charge?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />

      <ConfirmationDialog
        isOpen={isDeleteCategoryDialogOpen}
        onClose={closeDeleteCategoryDialog}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        description={
          selectedCategory
            ? `Are you sure you want to delete "${selectedCategory.ChargesCategoryName}"? This action cannot be undone.`
            : "Are you sure you want to delete this category?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default AdditionalChargesList;
