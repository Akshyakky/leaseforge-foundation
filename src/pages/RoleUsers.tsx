import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { roleService, Role } from "@/services/roleService";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface RoleUser {
  userID: number;
  userName: string;
  userFullName: string;
  emailID: string;
  phoneNo?: string;
  departmentID?: number;
  departmentName?: string;
  isActive: boolean;
}

const RoleUsers = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role | null>(null);
  const [users, setUsers] = useState<RoleUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        navigate("/roles");
        return;
      }

      try {
        setLoading(true);

        // Fetch role details
        const roleData = await roleService.getRoleById(parseInt(id));
        if (!roleData) {
          toast.error("Role not found");
          navigate("/roles");
          return;
        }
        setRole(roleData);

        // Fetch users with this role
        const userData = await roleService.getUsersByRole(parseInt(id));
        setUsers(userData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load users data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleAddUser = () => {
    // Navigate to user creation with pre-selected role
    navigate(`/users/new?roleId=${id}`);
  };

  const handleEditUser = (userId: number) => {
    navigate(`/users/edit/${userId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/roles")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Users with Role: {role?.RoleName}</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users with {role?.RoleName} Role</CardTitle>
            <CardDescription>View and manage users assigned to this role</CardDescription>
          </div>
          <Button onClick={handleAddUser}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No users found with this role.</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.userID}>
                      <TableCell className="font-medium">{user.userFullName}</TableCell>
                      <TableCell>{user.userName}</TableCell>
                      <TableCell>{user.emailID}</TableCell>
                      <TableCell>{user.departmentName || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "outline" : "secondary"} className={`${user.isActive ? "text-emerald-500 bg-emerald-50" : "text-red-500 bg-red-50"}`}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleEditUser(user.userID)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleUsers;
