import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Search, PlusCircle, UsersRound, ShieldCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { roleService, Role } from "@/services/roleService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";

const RolesList = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();

  const fetchRoles = async (search?: string) => {
    try {
      setLoading(true);
      const rolesData = await roleService.getAllRoles();

      if (search) {
        const filtered = rolesData.filter((role) => role.RoleName.toLowerCase().includes(search.toLowerCase()));
        setRoles(filtered);
      } else {
        setRoles(rolesData);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      fetchRoles(value);
    }
  }, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleAddRole = () => {
    navigate("/roles/new");
  };

  const handleEditRole = (roleId: number) => {
    navigate(`/roles/edit/${roleId}`);
  };

  const handleViewUsers = (roleId: number) => {
    navigate(`/roles/${roleId}/users`);
  };

  const handleManagePermissions = (roleId: number) => {
    navigate(`/roles/${roleId}/permissions`);
  };

  const openDeleteDialog = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedRole(null);
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      const success = await roleService.deleteRole(selectedRole.RoleID);
      if (success) {
        setRoles(roles.filter((role) => role.RoleID !== selectedRole.RoleID));
      }
    } catch (error) {
      console.error("Error deleting role:", error);
    } finally {
      closeDeleteDialog();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">User Roles</h1>
        <Button onClick={handleAddRole}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Role Management</CardTitle>
          <CardDescription>Manage user roles and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search roles..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">{searchTerm ? "No roles found matching your search." : "No roles found."}</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead>Updated By</TableHead>
                    <TableHead>Updated On</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.RoleID}>
                      <TableCell className="font-medium">{role.RoleName}</TableCell>
                      <TableCell>{role.CreatedBy || "N/A"}</TableCell>
                      <TableCell>{role.CreatedOn ? new Date(role.CreatedOn).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell>{role.UpdatedBy || "N/A"}</TableCell>
                      <TableCell>{role.UpdatedOn ? new Date(role.UpdatedOn).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditRole(role.RoleID)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewUsers(role.RoleID)}>
                              <UsersRound className="mr-2 h-4 w-4" />
                              View users
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManagePermissions(role.RoleID)}>
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Manage permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(role)}>
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
        onConfirm={handleDeleteRole}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${selectedRole?.RoleName}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default RolesList;
