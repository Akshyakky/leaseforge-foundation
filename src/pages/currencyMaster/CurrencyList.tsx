import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Edit, Trash2, Eye, Check, Search, RefreshCw } from "lucide-react";
import { currencyService, Currency } from "@/services/currencyService";
import { DataTable, Column } from "@/components/data-display/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const CurrencyList = () => {
  const navigate = useNavigate();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currencyToDelete, setCurrencyToDelete] = useState<Currency | null>(null);
  const [defaultDialogOpen, setDefaultDialogOpen] = useState(false);
  const [currencyToSetDefault, setCurrencyToSetDefault] = useState<Currency | null>(null);

  // Load currencies
  const loadCurrencies = async () => {
    setLoading(true);
    try {
      const data = await currencyService.getAllCurrencies();
      setCurrencies(data);
    } catch (error) {
      console.error("Error loading currencies:", error);
      toast.error("Failed to load currencies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  // Handle search
  const handleSearch = async () => {
    setLoading(true);
    try {
      if (searchText.trim()) {
        const results = await currencyService.searchCurrencies(searchText);
        setCurrencies(results);
      } else {
        loadCurrencies();
      }
    } catch (error) {
      toast.error("Error searching currencies");
    } finally {
      setLoading(false);
    }
  };

  // Handle currency deletion
  const handleConfirmDelete = async () => {
    if (!currencyToDelete) return;

    try {
      const success = await currencyService.deleteCurrency(currencyToDelete.CurrencyID);
      if (success) {
        loadCurrencies();
      }
    } catch (error) {
      toast.error("Error deleting currency");
    }
  };

  // Handle setting default currency
  const handleConfirmSetDefault = async () => {
    if (!currencyToSetDefault) return;

    try {
      const success = await currencyService.setDefaultCurrency(currencyToSetDefault.CurrencyID);
      if (success) {
        loadCurrencies();
      }
    } catch (error) {
      toast.error("Error setting default currency");
    }
  };

  // Define columns for data table
  const columns: Column<Currency>[] = [
    {
      header: "Currency Code",
      accessorKey: "CurrencyCode",
      cell: ({ row }) => <div className="font-medium">{row.CurrencyCode}</div>,
    },
    {
      header: "Currency Name",
      accessorKey: "CurrencyName",
    },
    {
      header: "Conversion Rate",
      accessorKey: "ConversionRate",
      cell: ({ row }) => <div>{row.ConversionRate.toFixed(4)}</div>,
    },
    {
      header: "Status",
      accessorKey: "IsDefault",
      cell: ({ row }) =>
        row.IsDefault ? (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            Default Currency
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
            Secondary
          </Badge>
        ),
    },
    {
      header: "Actions",
      accessorKey: "CurrencyID",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/currencies/${row.CurrencyID}`)} title="View Details">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(`/currencies/edit/${row.CurrencyID}`)} title="Edit Currency">
            <Edit className="h-4 w-4" />
          </Button>
          {!row.IsDefault && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setCurrencyToSetDefault(row);
                  setDefaultDialogOpen(true);
                }}
                title="Set as Default Currency"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setCurrencyToDelete(row);
                  setDeleteDialogOpen(true);
                }}
                title="Delete Currency"
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-bold">Currency Management</CardTitle>
          <Button onClick={() => navigate("/currencies/new")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Currency
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search currencies..."
                className="pl-8"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button variant="outline" onClick={handleSearch} className="shrink-0">
              Search
            </Button>
            <Button variant="outline" onClick={loadCurrencies} className="shrink-0">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <DataTable columns={columns} data={currencies} isLoading={loading} />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Currency"
        description={`Are you sure you want to delete ${currencyToDelete?.CurrencyName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Set Default Currency Dialog */}
      <ConfirmationDialog
        isOpen={defaultDialogOpen}
        onClose={() => setDefaultDialogOpen(false)}
        onConfirm={handleConfirmSetDefault}
        title="Set as Default Currency"
        description={`Are you sure you want to set ${currencyToSetDefault?.CurrencyName} as the default currency? This will change all pricing calculations system-wide.`}
        confirmText="Set as Default"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};

export default CurrencyList;
