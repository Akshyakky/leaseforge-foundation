
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { currencyService, Currency } from "@/services/currencyService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Check, DollarSign, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

const CurrencyDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [defaultDialogOpen, setDefaultDialogOpen] = useState(false);
  const [rateUpdateOpen, setRateUpdateOpen] = useState(false);
  const [newRate, setNewRate] = useState<string>("");

  // Load currency data
  const loadCurrency = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await currencyService.getCurrencyById(parseInt(id));
      setCurrency(data);
      if (data) {
        setNewRate(data.ConversionRate.toString());
      }
    } catch (error) {
      console.error("Error loading currency:", error);
      toast.error("Failed to load currency details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrency();
  }, [id]);

  // Handle currency deletion
  const handleDelete = async () => {
    if (!currency) return;
    
    try {
      const success = await currencyService.deleteCurrency(currency.CurrencyID);
      if (success) {
        toast.success("Currency deleted successfully");
        navigate("/currencies");
      }
    } catch (error) {
      toast.error("Error deleting currency");
    }
  };

  // Handle setting as default currency
  const handleSetDefault = async () => {
    if (!currency) return;
    
    try {
      const success = await currencyService.setDefaultCurrency(currency.CurrencyID);
      if (success) {
        loadCurrency();
      }
    } catch (error) {
      toast.error("Error setting default currency");
    }
  };

  // Handle updating conversion rate
  const handleUpdateRate = async () => {
    if (!currency || !newRate) return;
    
    try {
      const rateValue = parseFloat(newRate);
      if (isNaN(rateValue) || rateValue <= 0) {
        toast.error("Please enter a valid positive number");
        return;
      }
      
      const success = await currencyService.updateConversionRate(currency.CurrencyID, rateValue);
      if (success) {
        setRateUpdateOpen(false);
        loadCurrency();
      }
    } catch (error) {
      toast.error("Error updating conversion rate");
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="flex justify-center items-center h-64">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gray-200"></div>
              <div className="h-4 w-48 bg-gray-200 rounded"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currency) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-lg text-gray-500 mb-4">Currency not found or has been deleted.</p>
              <Button onClick={() => navigate("/currencies")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Currencies
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center">
              <DollarSign className="mr-2 h-6 w-6 text-primary" />
              {currency.CurrencyName} ({currency.CurrencyCode})
            </CardTitle>
            <CardDescription>
              Currency details and management
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/currencies")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={() => navigate(`/currencies/edit/${currency.CurrencyID}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            {!currency.IsDefault && (
              <>
                <Button variant="outline" onClick={() => setDefaultDialogOpen(true)}>
                  <Check className="mr-2 h-4 w-4" />
                  Set as Default
                </Button>
                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Currency Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Currency Code</p>
                  <p className="font-mono">{currency.CurrencyCode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Currency Name</p>
                  <p>{currency.CurrencyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  {currency.IsDefault ? (
                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                      Default Currency
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                      Secondary Currency
                    </Badge>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                    <Button variant="ghost" size="sm" onClick={() => setRateUpdateOpen(true)}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Update Rate
                    </Button>
                  </div>
                  <p className="font-mono">{currency.ConversionRate.toFixed(4)}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Audit Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Created By</p>
                  <p>{currency.CreatedBy || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created On</p>
                  <p>{formatDate(currency.CreatedOn)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Updated By</p>
                  <p>{currency.UpdatedBy || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Updated On</p>
                  <p>{formatDate(currency.UpdatedOn)}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-md font-semibold mb-2">Currency Usage Notes</h3>
            <p className="text-sm text-gray-600">
              {currency.IsDefault 
                ? "This is the system's default currency. All pricing calculations use this as the base rate. Other currencies are converted based on their conversion rates relative to this currency."
                : "This currency uses a conversion rate of " + currency.ConversionRate.toFixed(4) + " relative to the system's default currency for all pricing calculations."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Currency"
        description={`Are you sure you want to delete ${currency.CurrencyName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Set Default Currency Dialog */}
      <ConfirmationDialog
        isOpen={defaultDialogOpen}
        onClose={() => setDefaultDialogOpen(false)}
        onConfirm={handleSetDefault}
        title="Set as Default Currency"
        description={`Are you sure you want to set ${currency.CurrencyName} as the default currency? This will change all pricing calculations system-wide.`}
        confirmText="Set as Default"
        cancelText="Cancel"
        type="warning"
      />

      {/* Update Conversion Rate Modal */}
      <Modal
        isOpen={rateUpdateOpen}
        onClose={() => setRateUpdateOpen(false)}
        title="Update Conversion Rate"
        description="Enter the new conversion rate for this currency relative to the system default currency."
        footer={
          <>
            <Button variant="outline" onClick={() => setRateUpdateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRate}>
              Update Rate
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <div>
            <label htmlFor="conversionRate" className="text-sm font-medium">
              Conversion Rate
            </label>
            <Input
              id="conversionRate"
              type="number"
              step="0.0001"
              min="0.0001"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              className="font-mono"
            />
            <p className="text-sm text-gray-500 mt-1">
              This is the rate at which this currency converts to the system default currency.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CurrencyDetails;
