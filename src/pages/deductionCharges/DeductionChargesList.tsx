// src/pages/deductionCharges/DeductionChargesList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Search, Plus, Filter, Calendar, HandCoins, Tag } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deductionService, Deduction } from "@/services/deductionService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

const DeductionChargesList: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeduction, setSelectedDeduction] = useState<Deduction | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filters
  const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [deductionTypes, setDeductionTypes] = useState<any[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchDeductions();
    fetchDeductionTypes();
  }, []);

  // Fetch all deductions
  const fetchDeductions = async (search?: string, filters?: any) => {
    try {
      setLoading(true);
      const deductionsData = await deductionService.searchDeductions(search, filters);
      setDeductions(deductionsData);
    } catch (error) {
      console.error("Error fetching deductions:", error);
      toast.error("Failed to load deductions");
    } finally {
      setLoading(false);
    }
  };

  // Fetch deduction types for filter dropdown
  const fetchDeductionTypes = async () => {
    try {
      const typesData = await deductionService.getDeductionTypes();
      setDeductionTypes(typesData);
    } catch (error) {
      console.error("Error fetching deduction types:", error);
    }
  };

  // Apply filters
  const applyFilters = () => {
    const filters = {
      isActive: filterActiveOnly || undefined,
      deductionType: filterType && filterType !== "all" ? filterType : undefined,
    };
    fetchDeductions(searchTerm, filters);
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
  }, [filterActiveOnly, filterType]);

  // Navigation handlers
  const handleAddDeduction = () => {
    navigate("/deduction-charges/new");
  };

  const handleEditDeduction = (deductionId: number) => {
    navigate(`/deduction-charges/edit/${deductionId}`);
  };

  const handleViewDeduction = (deductionId: number) => {
    navigate(`/deduction-charges/${deductionId}`);
  };

  // Delete deduction handlers
  const openDeleteDialog = (deduction: Deduction) => {
    setSelectedDeduction(deduction);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedDeduction(null);
  };

  const handleDeleteDeduction = async () => {
    if (!selectedDeduction) return;

    try {
      const success = await deductionService.deleteDeduction(selectedDeduction.DeductionID);

      if (success) {
        setDeductions(deductions.filter((d) => d.DeductionID !== selectedDeduction.DeductionID));
        toast.success("Deduction deleted successfully");
      } else {
        toast.error("Failed to delete deduction");
      }
    } catch (error) {
      console.error("Error deleting deduction:", error);
      toast.error("Failed to delete deduction");
    } finally {
      closeDeleteDialog();
    }
  };

  // Toggle deduction status
  const handleToggleDeductionStatus = async (deduction: Deduction) => {
    try {
      const result = await deductionService.toggleDeductionStatus(deduction.DeductionID);

      if (result.success) {
        // Update deduction in the list
        setDeductions(deductions.map((d) => (d.DeductionID === deduction.DeductionID ? { ...d, IsActive: result.isActive !== undefined ? result.isActive : !d.IsActive } : d)));
        toast.success(`Deduction ${result.isActive ? "activated" : "deactivated"} successfully`);
      } else {
        toast.error("Failed to update deduction status");
      }
    } catch (error) {
      console.error("Error toggling deduction status:", error);
      toast.error("Failed to update deduction status");
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
        <h1 className="text-2xl font-semibold">Deduction Charges</h1>
        <Button onClick={handleAddDeduction}>
          <Plus className="mr-2 h-4 w-4" />
          Add Deduction
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Deduction Charges Management</CardTitle>
          <CardDescription>Manage deduction charges for your application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search deductions..." className="pl-9" onChange={handleSearchChange} />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {deductionTypes.map((type, index) => (
                  <SelectItem key={index} value={type.DeductionType}>
                    {type.DeductionType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Switch id="active-only" checked={filterActiveOnly} onCheckedChange={setFilterActiveOnly} />
              <Label htmlFor="active-only">Active Only</Label>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : deductions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || filterActiveOnly || filterType ? "No deductions found matching your criteria." : "No deductions have been created yet."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Deduction</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Applicable On</TableHead>
                    <TableHead>Effective Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deductions.map((deduction) => (
                    <TableRow key={deduction.DeductionID}>
                      <TableCell>
                        <div className="font-medium">{deduction.DeductionName}</div>
                        <div className="text-sm text-muted-foreground">{deduction.DeductionCode}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Tag className="h-3 w-3 mr-1" />
                          {deduction.DeductionType || "Standard"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <HandCoins className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{deduction.DeductionValue}</span>
                        </div>
                      </TableCell>
                      <TableCell>{deduction.ApplicableOn || "All"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>From: {deduction.EffectiveFromDate ? formatDate(deduction.EffectiveFromDate) : "N/A"}</span>
                          <span>To: {deduction.ExpiryDate ? formatDate(deduction.ExpiryDate) : "Ongoing"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={deduction.IsActive ? "default" : "secondary"}>{deduction.IsActive ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDeduction(deduction.DeductionID)}>View details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditDeduction(deduction.DeductionID)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleDeductionStatus(deduction)}>{deduction.IsActive ? "Deactivate" : "Activate"}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(deduction)}>
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

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteDeduction}
        title="Delete Deduction"
        description={
          selectedDeduction
            ? `Are you sure you want to delete "${selectedDeduction.DeductionName}"? This action cannot be undone.`
            : "Are you sure you want to delete this deduction?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default DeductionChargesList;
