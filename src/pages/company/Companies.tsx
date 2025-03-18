import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, PlusCircle, Users, BarChart, Power } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { companyService, Company } from "@/services/companyService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";

const Companies = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();

  const fetchCompanies = async (search?: string) => {
    try {
      setLoading(true);
      let companiesData: Company[];

      if (search) {
        companiesData = await companyService.searchCompanies(search);
      } else {
        companiesData = await companyService.getAllCompanies();
      }

      setCompanies(companiesData);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      fetchCompanies(value);
    }
  }, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleAddCompany = () => {
    navigate("/companies/new");
  };

  const handleEditCompany = (companyId: number) => {
    navigate(`/companies/edit/${companyId}`);
  };

  const handleViewUsers = (companyId: number) => {
    navigate(`/companies/${companyId}/users`);
  };

  const handleViewStatistics = (companyId: number) => {
    navigate(`/companies/${companyId}/statistics`);
  };

  const openDeleteDialog = (company: Company) => {
    setSelectedCompany(company);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedCompany(null);
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;

    try {
      const success = await companyService.deleteCompany(selectedCompany.CompanyID);
      if (success) {
        setCompanies(companies.filter((comp) => comp.CompanyID !== selectedCompany.CompanyID));
      }
    } catch (error) {
      console.error("Error deleting company:", error);
    } finally {
      closeDeleteDialog();
    }
  };

  const handleToggleStatus = async (company: Company) => {
    try {
      const success = await companyService.toggleCompanyStatus(company.CompanyID);
      if (success) {
        // Update the local state
        setCompanies(companies.map((c) => (c.CompanyID === company.CompanyID ? { ...c, IsActive: !c.IsActive } : c)));
      }
    } catch (error) {
      console.error("Error toggling company status:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Companies</h1>
        <Button onClick={handleAddCompany}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Company Management</CardTitle>
          <CardDescription>Manage your organization's companies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search companies..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">{searchTerm ? "No companies found matching your search." : "No companies found."}</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.CompanyID}>
                      <TableCell className="font-medium">{company.CompanyName}</TableCell>
                      <TableCell>{company.CompanyEmail || "N/A"}</TableCell>
                      <TableCell>{company.ContactNo || "N/A"}</TableCell>
                      <TableCell>{company.CityName || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={company.IsActive ? "outline" : "secondary"} className={`${company.IsActive ? "text-emerald-500 bg-emerald-50" : "text-red-500 bg-red-50"}`}>
                          {company.IsActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCompany(company.CompanyID)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewUsers(company.CompanyID)}>
                              <Users className="mr-2 h-4 w-4" />
                              View users
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewStatistics(company.CompanyID)}>
                              <BarChart className="mr-2 h-4 w-4" />
                              Statistics
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(company)}>
                              <Power className="mr-2 h-4 w-4" />
                              {company.IsActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(company)}>
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
        onConfirm={handleDeleteCompany}
        title="Delete Company"
        description={`Are you sure you want to delete the company "${selectedCompany?.CompanyName}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Companies;
