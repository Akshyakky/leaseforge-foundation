import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { accountService } from "@/services/accountService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Eye, FileText, Calendar, DollarSign, Activity, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { Account, AccountOpeningBalance, AccountTransaction } from "@/types/accountTypes";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const AccountDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [openingBalances, setOpeningBalances] = useState<AccountOpeningBalance[]>([]);
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [asOfDate, setAsOfDate] = useState<Date | null>(new Date());
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [transactionsLoading, setTransactionsLoading] = useState<boolean>(false);
  const [showTaxColumns, setShowTaxColumns] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  useEffect(() => {
    const fetchAccountData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch account data including opening balances
        const data = await accountService.getAccountById(parseInt(id));

        if (data.account) {
          setAccount(data.account);
          setOpeningBalances(data.openingBalances || []);

          // Fetch initial transactions
          await fetchTransactions(data.account.AccountID);
        } else {
          setError("Account not found");
          toast.error("Account not found");
        }
      } catch (err) {
        console.error("Error fetching account:", err);
        setError("Failed to load account details");
        toast.error("Failed to load account details");
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [id]);

  const fetchTransactions = async (accountId: number) => {
    setTransactionsLoading(true);
    try {
      const options: any = {};

      if (asOfDate) {
        options.asOfDate = format(asOfDate, "yyyy-MM-dd");
      }

      if (fromDate) {
        options.fromDate = format(fromDate, "yyyy-MM-dd");
      }

      if (toDate) {
        options.toDate = format(toDate, "yyyy-MM-dd");
      }

      const transactionsData = await accountService.getAccountTransactions(accountId, options);
      setTransactions(transactionsData);

      // Auto-detect if any transactions have tax information
      const hasTaxInfo = transactionsData.some((t) => t.TaxID || t.TaxCode || t.BaseAmount || t.LineTaxAmount);
      setShowTaxColumns(hasTaxInfo);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      toast.error("Failed to load transactions");
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleFilterChange = () => {
    if (account) {
      fetchTransactions(account.AccountID);
    }
  };

  const clearFilters = () => {
    setAsOfDate(new Date());
    setFromDate(null);
    setToDate(null);
    if (account) {
      fetchTransactions(account.AccountID);
    }
  };

  const handleDelete = async () => {
    if (!account) return;

    try {
      const result = await accountService.deleteAccount(account.AccountID);
      if (result.Status === 1) {
        toast.success(result.Message || "Account deleted successfully");
        navigate("/accounts");
      } else {
        toast.error(result.Message || "Failed to delete account");
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      toast.error("Failed to delete account");
    }
  };

  if (loading) {
    return (
      <div className="container p-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-red-500 mb-4">{error || "Account not found"}</p>
            <Button onClick={() => navigate("/accounts")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Accounts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Account Details</CardTitle>
            <CardDescription>View account information and transaction history</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/accounts")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={() => navigate(`/accounts/edit/${account.AccountID}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <h2 className="text-2xl font-bold">
                  {account.AccountCode} - {account.AccountName}
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant={account.IsActive ? "default" : "destructive"} className={account.IsActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {account.IsActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline" className={account.IsPostable ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                    {account.IsPostable ? "Postable" : "Non-Postable"}
                  </Badge>
                </div>
              </div>
              <div className="text-gray-500 mb-4">{account.Description || "No description provided."}</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Account Type:</span>
                    <span className="font-medium">{account.AccountTypeName || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Currency:</span>
                    <span className="font-medium">{account.CurrencyName || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Cash Flow Category:</span>
                    <span className="font-medium">{account.CashFlowCategoryName || "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Parent Account:</span>
                    <span className="font-medium">{account.ParentAccountName || "None"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created On:</span>
                    <span className="font-medium">{account.CreatedOn ? format(new Date(account.CreatedOn), "PPP") : "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-medium">{account.UpdatedOn ? format(new Date(account.UpdatedOn), "PPP") : "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <Tabs defaultValue="transactions">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="openingBalances">Opening Balances</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Transaction History</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
                      <Filter className="mr-2 h-4 w-4" />
                      {showAdvancedFilters ? "Hide" : "Show"} Filters
                    </Button>
                  </div>
                </div>

                {/* Filter Section */}
                {showAdvancedFilters && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Transaction Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>As of Date</Label>
                          <DatePicker value={asOfDate} onChange={setAsOfDate} />
                        </div>
                        <div className="space-y-2">
                          <Label>From Date</Label>
                          <DatePicker value={fromDate} onChange={setFromDate} />
                        </div>
                        <div className="space-y-2">
                          <Label>To Date</Label>
                          <DatePicker value={toDate} onChange={setToDate} />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4">
                        <Button onClick={handleFilterChange}>Apply Filters</Button>
                        <Button variant="outline" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="showTaxColumns" checked={showTaxColumns} onCheckedChange={(checked) => setShowTaxColumns(checked === true)} />
                          <Label htmlFor="showTaxColumns">Show Tax Columns</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {transactionsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No transactions found for this account with the current filters.</div>
                ) : (
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          {showTaxColumns && <TableHead className="text-right">Base Amount</TableHead>}
                          {showTaxColumns && <TableHead>Tax Code</TableHead>}
                          {showTaxColumns && <TableHead className="text-right">Tax Amount</TableHead>}
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction, index) => (
                          <TableRow key={`${transaction.PostingID}-${index}`}>
                            <TableCell>{transaction.PostingDate ? format(new Date(transaction.PostingDate), "PP") : "N/A"}</TableCell>
                            <TableCell>{transaction.ReferenceNo || transaction.PostingNo}</TableCell>
                            <TableCell>{transaction.PostingType}</TableCell>
                            <TableCell>
                              <div>
                                <div>{transaction.Narration || "-"}</div>
                                {transaction.PostingDescription && <div className="text-xs text-muted-foreground">{transaction.PostingDescription}</div>}
                              </div>
                            </TableCell>
                            {showTaxColumns && <TableCell className="text-right">{transaction.BaseAmount ? transaction.BaseAmount.toFixed(2) : "-"}</TableCell>}
                            {showTaxColumns && (
                              <TableCell>
                                <div>
                                  {transaction.TaxCode && (
                                    <Badge variant="outline" className="text-xs">
                                      {transaction.TaxCode}
                                    </Badge>
                                  )}
                                  {transaction.TaxPercentage && <div className="text-xs text-muted-foreground">{transaction.TaxPercentage}%</div>}
                                </div>
                              </TableCell>
                            )}
                            {showTaxColumns && <TableCell className="text-right">{transaction.LineTaxAmount ? transaction.LineTaxAmount.toFixed(2) : "-"}</TableCell>}
                            <TableCell className="text-right">{transaction.DebitAmount ? transaction.DebitAmount.toFixed(2) : "-"}</TableCell>
                            <TableCell className="text-right">{transaction.CreditAmount ? transaction.CreditAmount.toFixed(2) : "-"}</TableCell>
                            <TableCell className="text-right font-medium">{transaction.RunningBalance !== undefined ? transaction.RunningBalance.toFixed(2) : "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="openingBalances" className="mt-6">
              <h3 className="text-lg font-medium mb-4">Opening Balances</h3>
              {openingBalances.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No opening balances have been set for this account.</div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fiscal Year</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {openingBalances.map((balance) => (
                        <TableRow key={balance.OpeningBalanceID}>
                          <TableCell>{balance.FYDescription || "Unknown"}</TableCell>
                          <TableCell>{balance.StartDate ? format(new Date(balance.StartDate), "PP") : "N/A"}</TableCell>
                          <TableCell>{balance.EndDate ? format(new Date(balance.EndDate), "PP") : "N/A"}</TableCell>
                          <TableCell className="text-right">{balance.OpeningDebit.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{balance.OpeningCredit.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{balance.OpeningBalance.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Account"
        description={`Are you sure you want to delete the account "${account.AccountName}"? This action cannot be undone and will remove all data associated with this account.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};
export default AccountDetails;
