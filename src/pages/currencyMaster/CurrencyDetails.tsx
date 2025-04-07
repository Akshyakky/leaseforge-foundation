import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit2, Trash2, DollarSign, RefreshCw, Clock, Star, CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { currencyService, Currency } from "@/services/currencyService";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const CurrencyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [currency, setCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDefaultDialogOpen, setIsDefaultDialogOpen] = useState(false);
  const [isUpdateRateDialogOpen, setIsUpdateRateDialogOpen] = useState(false);
  const [newConversionRate, setNewConversionRate] = useState<string>("");

  useEffect(() => {
    const fetchCurrencyDetails = async () => {
      if (!id) {
        navigate("/currencies");
        return;
      }

      try {
        setLoading(true);
        const currencyData = await currencyService.getCurrencyById(parseInt(id));

        if (currencyData) {
          setCurrency(currencyData);
          setNewConversionRate(currencyData.ConversionRate.toString());
        } else {
          toast.error("Currency not found");
          navigate("/currencies");
        }
      } catch (error) {
        console.error("Error fetching currency:", error);
        toast.error("Failed to load currency data");
        navigate("/currencies");
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencyDetails();
  }, [id, navigate]);

  const handleEdit = () => {
    if (!currency) return;
    navigate(`/currencies/edit/${currency.CurrencyID}`);
  };

  // Delete dialog handlers
  const openDeleteDialog = () => {
    if (currency?.IsDefault) {
      toast.error("Cannot delete the default currency");
      return;
    }
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!currency) return;

    try {
      const success = await currencyService.deleteCurrency(currency.CurrencyID);

      if (success) {
        toast.success("Currency deleted successfully");
        navigate("/currencies");
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

  // Set as default dialog handlers
  const openDefaultDialog = () => {
    if (currency?.IsDefault) {
      toast.info("This is already the default currency");
      return;
    }
    setIsDefaultDialogOpen(true);
  };

  const closeDefaultDialog = () => {
    setIsDefaultDialogOpen(false);
  };

  const handleSetDefault = async () => {
    if (!currency) return;

    try {
      const success = await currencyService.setDefaultCurrency(currency.CurrencyID);

      if (success) {
        toast.success("Default currency set successfully");
        // Update the currency object to reflect the new default status
        setCurrency({
          ...currency,
          IsDefault: true,
        });
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

  // Update rate dialog handlers
  const openUpdateRateDialog = () => {
    if (!currency) return;
    setNewConversionRate(currency.ConversionRate.toString());
    setIsUpdateRateDialogOpen(true);
  };

  const closeUpdateRateDialog = () => {
    setIsUpdateRateDialogOpen(false);
  };

  const handleUpdateRate = async () => {
    if (!currency) return;

    const rate = parseFloat(newConversionRate);
    if (isNaN(rate) || rate <= 0) {
      toast.error("Please enter a valid conversion rate");
      return;
    }

    try {
      const success = await currencyService.updateConversionRate(currency.CurrencyID, rate);

      if (success) {
        toast.success("Conversion rate updated successfully");
        // Update the currency object to reflect the new rate
        setCurrency({
          ...currency,
          ConversionRate: rate,
        });
      } else {
        toast.error("Failed to update conversion rate");
      }
    } catch (error) {
      console.error("Error updating conversion rate:", error);
      toast.error("Failed to update conversion rate");
    } finally {
      closeUpdateRateDialog();
    }
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return "Not specified";
    try {
      return format(new Date(date), "dd MMM yyyy HH:mm");
    } catch (error) {
      return "Invalid date";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currency) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl">Currency not found</h2>
        <Button className="mt-4" onClick={() => navigate("/currencies")}>
          Back to currencies
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/currencies")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold">{currency.CurrencyName}</h1>
            <span className="ml-2 text-xl text-muted-foreground">({currency.CurrencyCode})</span>
            {currency.IsDefault && (
              <Badge variant="default" className="ml-3 bg-green-500 hover:bg-green-600">
                Default Currency
              </Badge>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          {!currency.IsDefault && (
            <Button variant="outline" onClick={openDefaultDialog}>
              <Star className="mr-2 h-4 w-4" />
              Set as Default
            </Button>
          )}
          <Button variant="outline" onClick={openUpdateRateDialog}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Update Rate
          </Button>
          <Button variant="outline" onClick={handleEdit}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={openDeleteDialog} disabled={currency.IsDefault}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-muted-foreground" />
              Currency Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Currency Code</p>
                <p className="mt-1 text-lg font-semibold">{currency.CurrencyCode}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Currency Name</p>
                <p className="mt-1 text-lg">{currency.CurrencyName}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="mt-1 text-lg">{currency.ConversionRate.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="mt-1 flex items-center">
                  {currency.IsDefault ? (
                    <div className="flex items-center text-green-500">
                      <CircleCheck className="mr-1 h-5 w-5" />
                      <span>Default Currency</span>
                    </div>
                  ) : (
                    <span>Standard Currency</span>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-6">
              {currency.CreatedBy && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created By</p>
                  <div className="mt-1 flex items-center text-sm">
                    <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span>
                      {currency.CreatedBy} on {formatDate(currency.CreatedOn)}
                    </span>
                  </div>
                </div>
              )}
              {currency.UpdatedBy && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated By</p>
                  <div className="mt-1 flex items-center text-sm">
                    <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span>
                      {currency.UpdatedBy} on {formatDate(currency.UpdatedOn)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="mr-2 h-5 w-5 text-muted-foreground" />
              Currency Conversion Example
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 border rounded-md">
                <p className="text-sm font-medium text-muted-foreground mb-2">Amount in {currency.IsDefault ? "Default Currency" : currency.CurrencyName}</p>
                <div className="flex items-center text-xl">
                  <strong>{currency.CurrencyCode}</strong>&nbsp;100.00
                </div>
              </div>
              {!currency.IsDefault && (
                <div className="p-4 border rounded-md">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Equivalent in Default Currency</p>
                  <div className="flex items-center text-xl">
                    <strong>Default</strong>&nbsp;{(100 / currency.ConversionRate).toFixed(2)}
                  </div>
                </div>
              )}
              {currency.IsDefault && (
                <div className="p-4 border rounded-md">
                  <p className="text-sm font-medium text-muted-foreground mb-2">This is the Default Currency</p>
                  <div className="text-sm text-muted-foreground">All other currencies are converted relative to this one</div>
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground italic">Note: The conversion rate represents how many units of this currency equal one unit of the default currency.</div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Currency"
        description={`Are you sure you want to delete "${currency.CurrencyName} (${currency.CurrencyCode})"? This will also delete all associated data and cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />

      {/* Set Default Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDefaultDialogOpen}
        onClose={closeDefaultDialog}
        onConfirm={handleSetDefault}
        title="Set as Default Currency"
        description={`Are you sure you want to set "${currency.CurrencyName} (${currency.CurrencyCode})" as the default currency? This will change the base currency for all conversions and calculations.`}
        cancelText="Cancel"
        confirmText="Set as Default"
        type="info"
      />

      {/* Update Rate Dialog */}
      <ConfirmationDialog
        isOpen={isUpdateRateDialogOpen}
        onClose={closeUpdateRateDialog}
        onConfirm={handleUpdateRate}
        title="Update Conversion Rate"
        description={
          <div className="space-y-4">
            <p>
              Update the conversion rate for {currency.CurrencyName} ({currency.CurrencyCode})
            </p>
            <div className="space-y-2">
              <label htmlFor="conversionRate" className="text-sm font-medium">
                New Conversion Rate:
              </label>
              <Input
                id="conversionRate"
                type="number"
                step="0.0001"
                min="0.0001"
                value={newConversionRate}
                onChange={(e) => setNewConversionRate(e.target.value)}
                placeholder="Enter new conversion rate"
              />
            </div>
          </div>
        }
        cancelText="Cancel"
        confirmText="Update Rate"
        type="info"
      />
    </div>
  );
};

export default CurrencyDetails;
