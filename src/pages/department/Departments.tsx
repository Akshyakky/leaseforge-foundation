import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Search, PlusCircle, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { departmentService, Department } from "@/services/departmentService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";

const Departments = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();

  const fetchDepartments = async (search?: string) => {
    try {
      setLoading(true);
      let departmentsData: Department[];

      if (search) {
        departmentsData = await departmentService.searchDepartments(search);
      } else {
        departmentsData = await departmentService.getAllDepartments();
      }

      setDepartments(departmentsData);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      fetchDepartments(value);
    }
  }, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleAddDepartment = () => {
    navigate("/departments/new");
  };

  const handleEditDepartment = (departmentId: number) => {
    navigate(`/departments/edit/${departmentId}`);
  };

  const handleViewUsers = (departmentId: number) => {
    navigate(`/departments/${departmentId}/users`);
  };

  const handleViewStatistics = (departmentId: number) => {
    navigate(`/departments/${departmentId}/statistics`);
  };

  const openDeleteDialog = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedDepartment(null);
  };

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;

    try {
      const success = await departmentService.deleteDepartment(selectedDepartment.DepartmentID);
      if (success) {
        setDepartments(departments.filter((dept) => dept.DepartmentID !== selectedDepartment.DepartmentID));
      }
    } catch (error) {
      console.error("Error deleting department:", error);
    } finally {
      closeDeleteDialog();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Departments</h1>
        <Button onClick={handleAddDepartment}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Department Management</CardTitle>
          <CardDescription>Manage company departments and their users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search departments..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">{searchTerm ? "No departments found matching your search." : "No departments found."}</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department Name</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead>Updated By</TableHead>
                    <TableHead>Updated On</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((department) => (
                    <TableRow key={department.DepartmentID}>
                      <TableCell className="font-medium">{department.DepartmentName}</TableCell>
                      <TableCell>{department.CreatedBy || "N/A"}</TableCell>
                      <TableCell>{department.CreatedOn ? new Date(department.CreatedOn).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell>{department.UpdatedBy || "N/A"}</TableCell>
                      <TableCell>{department.UpdatedOn ? new Date(department.UpdatedOn).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditDepartment(department.DepartmentID)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewUsers(department.DepartmentID)}>
                              <Users className="mr-2 h-4 w-4" />
                              View users
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewStatistics(department.DepartmentID)}>Statistics</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(department)}>
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
        onConfirm={handleDeleteDepartment}
        title="Delete Department"
        description={`Are you sure you want to delete the department "${selectedDepartment?.DepartmentName}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Departments;
