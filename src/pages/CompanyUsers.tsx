import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { companyService, Company, CompanyUser } from "@/services/companyService";
import { ArrowLeft, Loader2, UserPlus, Mail, Phone } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search } from "lucide-react";

const CompanyUsers = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        navigate("/companies");
        return;
      }

      try {
        setLoading(true);

        // Fetch company details
        const companyData = await companyService.getCompanyById(parseInt(id));
        if (!companyData) {
          toast.error("Company not found");
          navigate("/companies");
          return;
        }
        setCompany(companyData);

        // Fetch users with this company
        const userData = await companyService.getCompanyUsers(parseInt(id));
        setUsers(userData);
        setFilteredUsers(userData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load users data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.UserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.UserFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.EmailID.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.DepartmentName && user.DepartmentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.RoleName && user.RoleName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const handleAddUser = () => {
    // Navigate to user creation with pre-selected company
    navigate(`/users/new?companyId=${id}`);
  };

  const handleEditUser = (userId: number) => {
    navigate(`/users/edit/${userId}`);
  };

  const handleViewUser = (userId: number) => {
    navigate(`/users/view/${userId}`);
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
        <Button variant="outline" size="icon" onClick={() => navigate("/companies")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Users in Company: {company?.CompanyName}</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users in {company?.CompanyName}</CardTitle>
            <CardDescription>View and manage users assigned to this company</CardDescription>
          </div>
          <Button onClick={handleAddUser}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search users..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">{searchTerm ? "No users found matching your search." : "No users found in this company."}</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.UserID}>
                      <TableCell className="font-medium">{user.UserFullName}</TableCell>
                      <TableCell>{user.UserName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">{user.EmailID}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          {user.RoleName || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.DepartmentName || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={user.IsActive ? "outline" : "secondary"} className={`${user.IsActive ? "text-emerald-500 bg-emerald-50" : "text-red-500 bg-red-50"}`}>
                          {user.IsActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleViewUser(user.UserID)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUser(user.UserID)}>Edit User</DropdownMenuItem>
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

      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate(`/companies/${id}/statistics`)}>
          View Statistics
        </Button>
        <Button variant="outline" onClick={() => navigate(`/companies/edit/${id}`)}>
          Edit Company
        </Button>
      </div>
    </div>
  );
};

export default CompanyUsers;
