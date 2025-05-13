// src/pages/supplier/supplierType/SupplierTypeList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Plus, Filter, CheckCircle, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supplierService } from "@/services/supplierService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SupplierType } from "@/types/supplierTypes";

const SupplierTypeList = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierTypes, setSupplierTypes] = useState<SupplierType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplierType, setSelectedSupplierType] = useState<SupplierType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Fetch supplier types on component mount
  useEffect(() => {
    fetchSupplierTypes();
  }, []);

  // Fetch all supplier types
  const fetchSupplierTypes = async (search?: string, status?: string) => {
    try {
      setLoading(true);
      const supplierTypesData = await supplierService.getAllSupplierTypes();

      // Filter based on search and status
      let filteredData = supplierTypesData;

      if (search) {
        filteredData = filteredData.filter(
          (type) =>
            type.SupplierTypeName.toLowerCase().includes(search.toLowerCase()) ||
            type.SupplierTypeCode.toLowerCase().includes(search.toLowerCase()) ||
            (type.SupplierTypeDescription && type.SupplierTypeDescription.toLowerCase().includes(search.toLowerCase()))
        );
      }

      if (status === "active") {
        filteredData = filteredData.filter((type) => type.IsActive);
      } else if (status === "inactive") {
        filteredData = filteredData.filter((type) => !type.IsActive);
      }

      setSupplierTypes(filteredData);
    } catch (error) {
      console.error("Error fetching supplier types:", error);
      toast.error("Failed to load supplier types");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce(() => {
    fetchSupplierTypes(searchTerm, selectedStatus);
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    debouncedSearch();
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    debouncedSearch();
  };

  // Navigation handlers
  const handleAddSupplierType = () => {
    navigate("/supplier-types/new");
  };

  const handleEditSupplierType = (supplierTypeId: number) => {
    navigate(`/supplier-types/edit/${supplierTypeId}`);
  };

  const handleViewSupplierType = (supplierTypeId: number) => {
    navigate(`/supplier-types/${supplierTypeId}`);
  };

  // Delete confirmation handlers
  const openDeleteDialog = (supplierType: SupplierType) => {
    setSelectedSupplierType(supplierType);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedSupplierType(null);
  };

  const handleDeleteSupplierType = async () => {
    if (!selectedSupplierType) return;

    try {
      // Note: The service doesn't have deleteSupplierType method yet
      // This is a placeholder for when the method is implemented
      toast.error("Delete functionality not yet implemented in the service");

      // Code that would be used when delete method is available:
      // const result = await supplierService.deleteSupplierType(selectedSupplierType.SupplierTypeID);
      // if (result.Status === 1) {
      //   setSupplierTypes(supplierTypes.filter(t => t.SupplierTypeID !== selectedSupplierType.SupplierTypeID));
      //   toast.success(result.Message);
      // } else {
      //   toast.error(result.Message);
      // }
    } catch (error) {
      console.error("Error deleting supplier type:", error);
      toast.error("Failed to delete supplier type");
    } finally {
      closeDeleteDialog();
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
    fetchSupplierTypes();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Supplier Types</h1>
        <Button onClick={handleAddSupplierType}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier Type
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Supplier Type Management</CardTitle>
          <CardDescription>View and manage supplier types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search supplier types..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="ghost" onClick={resetFilters} className="h-9">
                <Filter className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : supplierTypes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedStatus ? "No supplier types found matching your criteria." : "No supplier types found. Create your first supplier type."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Code</TableHead>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Supplier Count</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierTypes.map((supplierType) => (
                    <TableRow key={supplierType.SupplierTypeID}>
                      <TableCell className="font-medium">{supplierType.SupplierTypeCode}</TableCell>
                      <TableCell>{supplierType.SupplierTypeName}</TableCell>
                      <TableCell>{supplierType.SupplierTypeDescription || "-"}</TableCell>
                      <TableCell>
                        {supplierType.IsActive ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{supplierType.SupplierCount || 0}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewSupplierType(supplierType.SupplierTypeID)}>View details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditSupplierType(supplierType.SupplierTypeID)}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(supplierType)}>
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
        onConfirm={handleDeleteSupplierType}
        title="Delete Supplier Type"
        description={
          selectedSupplierType
            ? `Are you sure you want to delete the supplier type "${selectedSupplierType.SupplierTypeName}"? This action cannot be undone.`
            : "Are you sure you want to delete this supplier type?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default SupplierTypeList;
