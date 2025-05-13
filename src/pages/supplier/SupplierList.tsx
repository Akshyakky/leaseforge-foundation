// src/pages/supplier/SupplierList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Plus, Filter, CheckCircle, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supplierService } from "@/services/supplierService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Supplier, SupplierType } from "@/types/supplierTypes";

const SupplierList = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierTypes, setSupplierTypes] = useState<SupplierType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedHasCredit, setSelectedHasCredit] = useState<string>("");

  // Fetch suppliers and supplier types on component mount
  useEffect(() => {
    fetchSuppliers();
    fetchSupplierTypes();
  }, []);

  // Fetch all suppliers
  const fetchSuppliers = async (search?: string, typeId?: string, status?: string, hasCreditFacility?: boolean) => {
    try {
      setLoading(true);
      const searchParams: any = {};

      if (search) searchParams.searchText = search;
      if (typeId) searchParams.supplierTypeID = parseInt(typeId);
      if (status) searchParams.status = status;
      if (hasCreditFacility !== undefined) searchParams.hasCreditFacility = hasCreditFacility;

      const suppliersData = await supplierService.searchSuppliers(searchParams);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  // Fetch supplier types for filtering
  const fetchSupplierTypes = async () => {
    try {
      const types = await supplierService.getAllSupplierTypes();
      setSupplierTypes(types);
    } catch (error) {
      console.error("Error fetching supplier types:", error);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce(() => {
    const hasCreditFacility = selectedHasCredit === "" ? undefined : selectedHasCredit === "yes";
    fetchSuppliers(searchTerm, selectedTypeId, selectedStatus, hasCreditFacility);
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    debouncedSearch();
  };

  // Handle supplier type filter change
  const handleTypeChange = (value: string) => {
    setSelectedTypeId(value);
    debouncedSearch();
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    debouncedSearch();
  };

  // Handle credit facility filter change
  const handleCreditChange = (value: string) => {
    setSelectedHasCredit(value);
    debouncedSearch();
  };

  // Navigation handlers
  const handleAddSupplier = () => {
    navigate("/suppliers/new");
  };

  const handleEditSupplier = (supplierId: number) => {
    navigate(`/suppliers/edit/${supplierId}`);
  };

  const handleViewSupplier = (supplierId: number) => {
    navigate(`/suppliers/${supplierId}`);
  };

  // Delete confirmation handlers
  const openDeleteDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedSupplier(null);
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    try {
      const result = await supplierService.deleteSupplier(selectedSupplier.SupplierID);

      if (result.Status === 1) {
        setSuppliers(suppliers.filter((s) => s.SupplierID !== selectedSupplier.SupplierID));
        toast.success(result.Message);
      } else {
        toast.error(result.Message);
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast.error("Failed to delete supplier");
    } finally {
      closeDeleteDialog();
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedTypeId("");
    setSelectedStatus("");
    setSelectedHasCredit("");
    fetchSuppliers();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Suppliers</h1>
        <Button onClick={handleAddSupplier}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Supplier Management</CardTitle>
          <CardDescription>View and manage your suppliers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search suppliers..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedTypeId} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Supplier Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Types</SelectItem>
                  {supplierTypes.map((type) => (
                    <SelectItem key={type.SupplierTypeID} value={type.SupplierTypeID.toString()}>
                      {type.SupplierTypeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedHasCredit} onValueChange={handleCreditChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Credit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All</SelectItem>
                  <SelectItem value="yes">Has Credit</SelectItem>
                  <SelectItem value="no">No Credit</SelectItem>
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
          ) : suppliers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedTypeId || selectedStatus || selectedHasCredit
                ? "No suppliers found matching your criteria."
                : "No suppliers found. Create your first supplier."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Supplier No</TableHead>
                    <TableHead className="w-[280px]">Supplier Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Credit Facility</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.SupplierID}>
                      <TableCell className="font-medium">{supplier.SupplierNo}</TableCell>
                      <TableCell>{supplier.SupplierName}</TableCell>
                      <TableCell>{supplier.SupplierTypeName || "-"}</TableCell>
                      <TableCell>
                        {supplier.Status === "Active" ? (
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
                      <TableCell>
                        {supplier.HasCreditFacility ? (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{supplier.CountryName || "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewSupplier(supplier.SupplierID)}>View details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditSupplier(supplier.SupplierID)}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(supplier)}>
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
        onConfirm={handleDeleteSupplier}
        title="Delete Supplier"
        description={
          selectedSupplier
            ? `Are you sure you want to delete the supplier "${selectedSupplier.SupplierName}"? This action cannot be undone.`
            : "Are you sure you want to delete this supplier?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default SupplierList;
