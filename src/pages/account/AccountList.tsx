// src/pages/account/AccountList.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Plus, Filter, CheckCircle, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { accountService } from "@/services/accountService";
import { Account, AccountType } from "@/types/accountTypes";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AccountList = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("all");
  const [selectedIsActive, setSelectedIsActive] = useState<string>("all");
  const [selectedIsPostable, setSelectedIsPostable] = useState<string>("all");

  // Fetch accounts with filters
  const fetchAccounts = useCallback(async (search?: string, typeId?: string, isActive?: string, isPostable?: string) => {
    try {
      setLoading(true);
      const searchParams: any = {};

      if (search) searchParams.searchText = search;
      if (typeId && typeId !== "all") searchParams.accountTypeID = parseInt(typeId);
      if (isActive && isActive !== "all") searchParams.isActive = isActive === "active";
      if (isPostable && isPostable !== "all") searchParams.isPostable = isPostable === "yes";

      const accountsData = await accountService.searchAccounts(searchParams);
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  // Create debounced search for text input only
  const debouncedSearchText = useMemo(
    () =>
      debounce((search: string, typeId: string, isActive: string, isPostable: string) => {
        fetchAccounts(search, typeId, isActive, isPostable);
      }, 500),
    [fetchAccounts]
  );

  // Fetch account types for filtering
  const fetchAccountTypes = async () => {
    try {
      const types = await accountService.getAllAccountTypes();
      setAccountTypes(types);
    } catch (error) {
      console.error("Error fetching account types:", error);
    }
  };

  // Fetch accounts and account types on component mount
  useEffect(() => {
    fetchAccounts("", "all", "all", "all");
    fetchAccountTypes();
  }, [fetchAccounts]);

  // Handle search input change (debounced)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    debouncedSearchText(newSearchTerm, selectedTypeId, selectedIsActive, selectedIsPostable);
  };

  // Handle account type filter change (immediate)
  const handleTypeChange = (value: string) => {
    setSelectedTypeId(value);
    fetchAccounts(searchTerm, value, selectedIsActive, selectedIsPostable);
  };

  // Handle active status filter change (immediate)
  const handleActiveChange = (value: string) => {
    setSelectedIsActive(value);
    fetchAccounts(searchTerm, selectedTypeId, value, selectedIsPostable);
  };

  // Handle postable filter change (immediate)
  const handlePostableChange = (value: string) => {
    setSelectedIsPostable(value);
    fetchAccounts(searchTerm, selectedTypeId, selectedIsActive, value);
  };

  // Navigation handlers
  const handleAddAccount = () => {
    navigate("/accounts/new");
  };

  const handleEditAccount = (accountId: number) => {
    navigate(`/accounts/edit/${accountId}`);
  };

  const handleViewAccount = (accountId: number) => {
    navigate(`/accounts/${accountId}`);
  };

  // Delete confirmation handlers
  const openDeleteDialog = (account: Account) => {
    setSelectedAccount(account);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedAccount(null);
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    try {
      const result = await accountService.deleteAccount(selectedAccount.AccountID);

      if (result.Status === 1) {
        setAccounts(accounts.filter((a) => a.AccountID !== selectedAccount.AccountID));
        toast.success(result.Message);
      } else {
        toast.error(result.Message);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      closeDeleteDialog();
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedTypeId("all");
    setSelectedIsActive("all");
    setSelectedIsPostable("all");
    fetchAccounts("", "all", "all", "all");
  };

  // View account hierarchy
  const viewHierarchy = () => {
    navigate("/accounts/hierarchy");
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedTypeId !== "all" || selectedIsActive !== "all" || selectedIsPostable !== "all";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-foreground">Chart of Accounts</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={viewHierarchy}>
            View Hierarchy
          </Button>
          <Button onClick={handleAddAccount}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Account Management</CardTitle>
          <CardDescription>View and manage your chart of accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search accounts..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedTypeId} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Account Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.AccountTypeID} value={type.AccountTypeID.toString()}>
                      {type.AccountTypeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedIsActive} onValueChange={handleActiveChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedIsPostable} onValueChange={handlePostableChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Postable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Postable</SelectItem>
                  <SelectItem value="no">Non-Postable</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={resetFilters} className="h-9">
                  <Filter className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {hasActiveFilters ? "No accounts found matching your criteria." : "No accounts found. Create your first account."}
            </div>
          ) : (
            <div className="border border-border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Account Code</TableHead>
                    <TableHead className="w-[280px]">Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Postable</TableHead>
                    <TableHead>Parent Account</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.AccountID}>
                      <TableCell className="font-medium">{account.AccountCode}</TableCell>
                      <TableCell>{account.AccountName}</TableCell>
                      <TableCell>{account.AccountTypeName || "Unknown"}</TableCell>
                      <TableCell>
                        {account.IsActive ? (
                          <Badge variant="default" className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-green-200 dark:border-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border-red-200 dark:border-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {account.IsPostable ? (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-blue-200 dark:border-blue-800">
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{account.ParentAccountName || "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewAccount(account.AccountID)}>View details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditAccount(account.AccountID)}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(account)}>
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
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description={
          selectedAccount
            ? `Are you sure you want to delete the account "${selectedAccount.AccountName}"? This action cannot be undone.`
            : "Are you sure you want to delete this account?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default AccountList;
