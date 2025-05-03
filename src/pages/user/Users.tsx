import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Loader2, MoreHorizontal, Search, UserPlus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { userService, User } from "@/services/userService";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import { toast } from "sonner";

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch users from API
  const fetchUsers = async (search?: string) => {
    try {
      setLoading(true);

      let userData: User[];
      if (search) {
        userData = await userService.searchUsers(search);
      } else {
        userData = await userService.getAllUsers();
      }

      setUsers(userData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search with debounce
  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      fetchUsers(value);
    }
  }, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleAddUser = () => {
    navigate("/users/new");
  };

  const handleEditUser = (userId: number) => {
    navigate(`/users/edit/${userId}`);
  };

  const handleViewUser = (userId: number) => {
    navigate(`/users/view/${userId}`);
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const success = await userService.deleteUser(userId);
        if (success) {
          // Remove user from state
          setUsers(users.filter((user) => user.UserID !== userId));
        }
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleResetPassword = (userId: number, userName: string) => {
    toast.info(`Password reset functionality will be implemented for ${userName}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Button onClick={handleAddUser}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6 gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search users..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    Filter
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Role</DropdownMenuItem>
                  <DropdownMenuItem>Status</DropdownMenuItem>
                  <DropdownMenuItem>Department</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">{searchTerm ? "No users found matching your search." : "No users found."}</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.UserID}>
                      <TableCell className="font-medium">{user.UserFullName}</TableCell>
                      <TableCell>{user.EmailID}</TableCell>
                      <TableCell>
                        <Badge variant={user.RoleName === "Admin" ? "default" : "outline"}>{user.RoleName || "User"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.IsActive ? "outline" : "secondary"} className={`${user.IsActive ? "text-emerald-500 bg-emerald-50" : "text-red-500 bg-red-50"}`}>
                          {user.IsActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.DefaultCompanyName || "N/A"}</TableCell>
                      <TableCell className="text-muted-foreground">{user.DepartmentName || "N/A"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user.UserID)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewUser(user.UserID)}>View details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user.UserID, user.UserName)}>Reset password</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteUser(user.UserID)}>
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
    </div>
  );
};

export default Users;
