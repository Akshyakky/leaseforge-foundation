
// Just fixing the column typing
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { currencyService, Currency } from "@/services/currencyService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { CheckCircle, Edit, MoreHorizontal, Plus, Search, Star, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Column = {
  header: string;
  accessorKey?: keyof Currency;
  cell?: ({ row }: { row: { original: Currency } }) => React.ReactNode;
};

const CurrencyList = () => {
  const navigate = useNavigate();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredCurrencies, setFilteredCurrencies] = useState<Currency[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [defaultSetId, setDefaultSetId] = useState<number | null>(null);
  const [rateUpdateId, setRateUpdateId] = useState<number | null>(null);
  const [newRate, setNewRate] = useState<number>(0);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCurrencies(currencies);
    } else {
      const filtered = currencies.filter(
        (currency) =>
          currency.CurrencyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          currency.CurrencyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCurrencies(filtered);
    }
  }, [searchTerm, currencies]);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const data = await currencyService.getAll();
      setCurrencies(data);
      setFilteredCurrencies(data);
    } catch (error) {
      console.error("Failed to fetch currencies:", error);
      toast.error("Failed to load currencies");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await currencyService.delete(deleteId);
        toast.success("Currency deleted successfully");
        fetchCurrencies();
      } catch (error) {
        console.error("Failed to delete currency:", error);
        toast.error("Failed to delete currency");
      } finally {
        setDeleteId(null);
      }
    }
  };

  const handleSetDefault = async () => {
    if (defaultSetId) {
      try {
        await currencyService.setDefault(defaultSetId);
        toast.success("Default currency set successfully");
        fetchCurrencies();
      } catch (error) {
        console.error("Failed to set default currency:", error);
        toast.error("Failed to set default currency");
      } finally {
        setDefaultSetId(null);
      }
    }
  };

  const handleRateUpdate = async () => {
    if (rateUpdateId && newRate > 0) {
      try {
        const currencyToUpdate = currencies.find(c => c.CurrencyID === rateUpdateId);
        if (currencyToUpdate) {
          await currencyService.update({
            ...currencyToUpdate,
            ConversionRate: newRate
          });
          toast.success("Conversion rate updated successfully");
          fetchCurrencies();
        }
      } catch (error) {
        console.error("Failed to update conversion rate:", error);
        toast.error("Failed to update conversion rate");
      } finally {
        setRateUpdateId(null);
        setNewRate(0);
      }
    }
  };

  const columns: Column[] = [
    {
      header: "Default",
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.original.IsDefault && (
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          )}
        </div>
      ),
    },
    {
      header: "Currency Code",
      accessorKey: "CurrencyCode",
    },
    {
      header: "Currency Name",
      accessorKey: "CurrencyName",
    },
    {
      header: "Conversion Rate",
      accessorKey: "ConversionRate",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.ConversionRate.toFixed(4)}
        </Badge>
      ),
    },
    {
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/currencies/${row.original.CurrencyID}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => navigate(`/currencies/details/${row.original.CurrencyID}`)}>
              <Search className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            
            {!row.original.IsDefault && (
              <DropdownMenuItem onClick={() => setDefaultSetId(row.original.CurrencyID)}>
                <Star className="mr-2 h-4 w-4" />
                Set as Default
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem onClick={() => {
              setRateUpdateId(row.original.CurrencyID);
              setNewRate(row.original.ConversionRate);
            }}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Update Rate
            </DropdownMenuItem>
            
            {!row.original.IsDefault && (
              <DropdownMenuItem onClick={() => setDeleteId(row.original.CurrencyID)} className="text-red-600">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl">Currencies</CardTitle>
          <Button onClick={() => navigate("/currencies/new")}>
            <Plus className="mr-2 h-4 w-4" /> Add Currency
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search by currency code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
            </div>
          ) : filteredCurrencies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No currencies match your search" : "No currencies found. Add your first currency."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column, i) => (
                      <TableHead key={i} className={column.header === "Default" ? "w-16" : column.header === "Actions" ? "w-16 text-right" : ""}>
                        {column.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCurrencies.map((currency) => (
                    <TableRow key={currency.CurrencyID}>
                      {columns.map((column, i) => (
                        <TableCell key={i} className={column.header === "Actions" ? "text-right" : ""}>
                          {column.cell 
                            ? column.cell({ row: { original: currency } }) 
                            : column.accessorKey 
                              ? currency[column.accessorKey]?.toString() 
                              : null}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this currency?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the currency and remove it from the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Set Default Currency Dialog */}
          <AlertDialog open={defaultSetId !== null} onOpenChange={(open) => !open && setDefaultSetId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Set as Default Currency?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will set the selected currency as the default currency for the system. The current default will be unset.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSetDefault}>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Update Rate Dialog */}
          <AlertDialog open={rateUpdateId !== null} onOpenChange={(open) => !open && setRateUpdateId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Update Conversion Rate</AlertDialogTitle>
                <AlertDialogDescription>
                  Enter the new conversion rate for this currency.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={newRate}
                  onChange={(e) => setNewRate(parseFloat(e.target.value))}
                  placeholder="New conversion rate"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRateUpdate}>Update</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrencyList;
