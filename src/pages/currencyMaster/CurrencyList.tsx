import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Search, Plus, DollarSign, RefreshCw, CheckCircle, Ban } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { currencyService, Currency } from "@/services/currencyService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const CurrencyList: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDefaultDialogOpen, setIsDefaultDialogOpen] = useState(false);

  // Fetch currencies on component mount
  useEffect(() => {
    fetchCurrencies();
  }, []);

  // Fetch all currencies
  const fetchCurrencies = async (search?: string) => {
    try {
      setLoading(true);
      let currenciesData: Currency[];

      if (search && search.length >= 2) {
        currenciesData = await currencyService.searchCurrencies(search);
      } else {
        currenciesData = await currencyService.getAllCurrencies();
      }

      setCurrencies(currenciesData);
    } catch (error) {
      console.error("Error fetching currencies:", error);
      toast.error("Failed to load currencies");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      fetchCurrencies(value);
    }
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Navigation handlers
  const handleAddCurrency = () => {
    navigate("/currencies/new");
  };

  const handleEditCurrency = (currencyId: number) => {
    navigate(`/currencies/edit/${currencyId}`);
  };

  const handleViewCurrency = (currencyId: number) => {
    navigate(`/currencies/${currencyId}`);
  };

  // Delete confirmation handlers
  const openDeleteDialog = (currency: Currency) => {
    setSelectedCurrency(currency);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedCurrency(null);
  };

  const handleDeleteCurrency = async () => {
    if (!selectedCurrency) return;

    try {
      const success = await currencyService.deleteCurrency(selectedCurrency.CurrencyID);

      if (success) {
        setCurrencies(currencies.filter((c) => c.CurrencyID !== selectedCurrency.CurrencyID));
        toast.success("Currency deleted successfully");
      } else {
        toast.error("Failed to delete currency");
      }
    } catch (error) {
      console.error("Error deleting currency:", error);
      toast.error("Failed to delete currency");
    } finally {
      closeDeleteDialog();
    }
  };

  // Set default currency handlers
  const openDefaultDialog = (currency: Currency) => {
    if (currency.IsDefault) {
      toast.info("This currency is already set as the default");
      return;
    }
    setSelectedCurrency(currency);
    setIsDefaultDialogOpen(true);
  };

  const closeDefaultDialog = () => {
    setIsDefaultDialogOpen(false);
    setSelectedCurrency(null);
  };

  const handleSetDefaultCurrency = async () => {
    if (!selectedCurrency) return;

    try {
      const success = await currencyService.setDefaultCurrency(selectedCurrency.CurrencyID);

      if (success) {
        // Update the currencies list to reflect the new default
        const updatedCurrencies = currencies.map((currency) => ({
          ...currency,
          IsDefault: currency.CurrencyID === selectedCurrency.CurrencyID,
        }));
        setCurrencies(updatedCurrencies);
        toast.success(`${selectedCurrency.CurrencyName} set as default currency`);
      } else {
        toast.error("Failed to set default currency");
      }
    } catch (error) {
      console.error("Error setting default currency:", error);
      toast.error("Failed to set default currency");
    } finally {
      closeDefaultDialog();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Currencies</h1>
        <Button onClick={handleAddCurrency}>
          <Plus className="mr-2 h-4 w-4" />
          Add Currency
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Currency Management</CardTitle>
          <CardDescription>Manage currencies, rates, and set default currency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search currencies..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : currencies.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">{searchTerm ? "No currencies found matching your search." : "No currencies found."}</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Conversion Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencies.map((currency) => (
                    <TableRow key={currency.CurrencyID}>
                      <TableCell className="font-medium">{currency.CurrencyCode}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                          {currency.CurrencyName}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{currency.ConversionRate.toFixed(4)}</TableCell>
                      <TableCell>
                        {currency.IsDefault ? (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            Default
                          </Badge>
                        ) : (
                          <Badge variant="outline">Standard</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCurrency(currency.CurrencyID)}>View details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditCurrency(currency.CurrencyID)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDefaultDialog(currency)} disabled={currency.IsDefault}>
                              Set as default
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-500"
                              onClick={() => openDeleteDialog(currency)}
                              disabled={currency.IsDefault} // Prevent deleting default currency
                            >
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
        onConfirm={handleDeleteCurrency}
        title="Delete Currency"
        description={
          selectedCurrency
            ? `Are you sure you want to delete "${selectedCurrency.CurrencyName} (${selectedCurrency.CurrencyCode})"? This action cannot be undone.`
            : "Are you sure you want to delete this currency?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />

      <ConfirmationDialog
        isOpen={isDefaultDialogOpen}
        onClose={closeDefaultDialog}
        onConfirm={handleSetDefaultCurrency}
        title="Set Default Currency"
        description={
          selectedCurrency
            ? `Are you sure you want to set "${selectedCurrency.CurrencyName} (${selectedCurrency.CurrencyCode})" as the default currency? This will change the base currency for all calculations.`
            : "Are you sure you want to change the default currency?"
        }
        cancelText="Cancel"
        confirmText="Set as Default"
        type="info"
      />
    </div>
  );
};

export default CurrencyList;
