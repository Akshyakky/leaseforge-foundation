import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { departmentService, Department } from "@/services/departmentService";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface DepartmentUser {
  UserID: number;
  UserName: string;
  UserFullName: string;
  EmailID: string;
  PhoneNo?: string;
  RoleID?: number;
  RoleName?: string;
  IsActive: boolean;
}

const DepartmentUsers = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [department, setDepartment] = useState<Department | null>(null);
  const [users, setUsers] = useState<DepartmentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        navigate("/departments");
        return;
      }

      try {
        setLoading(true);

        // Fetch department details
        const departmentData = await departmentService.getDepartmentById(parseInt(id));
        if (!departmentData) {
          toast.error("Department not found");
          navigate("/departments");
          return;
        }
        setDepartment(departmentData);

        // Fetch users with this department
        const userData = await departmentService.getDepartmentUsers(parseInt(id));
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
    // Navigate to user creation with pre-selected department
    navigate(`/users/new?departmentId=${id}`);
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
        <Button variant="outline" size="icon" onClick={() => navigate("/departments")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Users in Department: {department?.DepartmentName}</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users in {department?.DepartmentName} Department</CardTitle>
            <CardDescription>View and manage users assigned to this department</CardDescription>
          </div>
          <Button onClick={handleAddUser}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No users found in this department.</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.UserID}>
                      <TableCell className="font-medium">{user.UserFullName}</TableCell>
                      <TableCell>{user.UserName}</TableCell>
                      <TableCell>{user.EmailID}</TableCell>
                      <TableCell>{user.RoleName || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={user.IsActive ? "outline" : "secondary"} className={`${user.IsActive ? "text-emerald-500 bg-emerald-50" : "text-red-500 bg-red-50"}`}>
                          {user.IsActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleEditUser(user.UserID)}>
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

export default DepartmentUsers;
