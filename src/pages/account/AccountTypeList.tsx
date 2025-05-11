// src/pages/account/AccountTypeList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Plus, CheckCircle, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { accountService } from "@/services/accountService";
import { AccountType } from "@/types/accountTypes";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";

const AccountTypeList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch account types on component mount
  useEffect(() => {
    fetchAccountTypes();
  }, []);

  // Fetch all account types
  const fetchAccountTypes = async (search?: string) => {
    try {
      setLoading(true);
      const typesData = await accountService.getAllAccountTypes();

      // Filter by search term if provided
      if (search) {
        const filteredTypes = typesData.filter(
          (type) => type.AccountTypeName.toLowerCase().includes(search.toLowerCase()) || type.AccountTypeCode.toLowerCase().includes(search.toLowerCase())
        );
        setAccountTypes(filteredTypes);
      } else {
        setAccountTypes(typesData);
      }
    } catch (error) {
      console.error("Error fetching account types:", error);
      toast.error("Failed to load account types");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    fetchAccountTypes(value);
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Navigation handlers
  const handleAddAccountType = () => {
    navigate("/account-types/new");
  };

  const handleEditAccountType = (accountTypeId: number) => {
    navigate(`/account-types/edit/${accountTypeId}`);
  };

  // Delete confirmation handlers
  const openDeleteDialog = (accountType: AccountType) => {
    setSelectedAccountType(accountType);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedAccountType(null);
  };

  const handleDeleteAccountType = async () => {
    if (!selectedAccountType) return;

    try {
      // In a real app, call API to delete account type
      // For now, just simulate success
      toast.success(`Account type ${selectedAccountType.AccountTypeName} deleted successfully`);

      // Remove from state
      setAccountTypes(accountTypes.filter((at) => at.AccountTypeID !== selectedAccountType.AccountTypeID));
    } catch (error) {
      console.error("Error deleting account type:", error);
      toast.error("Failed to delete account type");
    } finally {
      closeDeleteDialog();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Account Types</h1>
        <Button onClick={handleAddAccountType}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account Type
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Account Type Management</CardTitle>
          <CardDescription>Manage account types for the chart of accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6 gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search account types..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : accountTypes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm ? "No account types found matching your search." : "No account types found. Create your first account type."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Code</TableHead>
                    <TableHead className="w-[300px]">Account Type</TableHead>
                    <TableHead>Parent Type</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Account Count</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountTypes.map((accountType) => (
                    <TableRow key={accountType.AccountTypeID}>
                      <TableCell className="font-medium">{accountType.AccountTypeCode}</TableCell>
                      <TableCell>{accountType.AccountTypeName}</TableCell>
                      <TableCell>{accountType.ParentAccountTypeName || "-"}</TableCell>
                      <TableCell>{accountType.AccountLevel}</TableCell>
                      <TableCell>
                        {accountType.IsActive ? (
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
                      <TableCell className="text-right">{accountType.AccountCount || 0}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditAccountType(accountType.AccountTypeID)}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(accountType)}>
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
        onConfirm={handleDeleteAccountType}
        title="Delete Account Type"
        description={
          selectedAccountType
            ? `Are you sure you want to delete the account type "${selectedAccountType.AccountTypeName}"? This may affect accounts that use this type.`
            : "Are you sure you want to delete this account type?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default AccountTypeList;
