import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit2, Trash2, Percent, Clock, Calendar, Globe, MapPin, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { taxService, Tax } from "@/services/taxService";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TaxDetails: React.FC = () => {
  const { taxId } = useParams<{ taxId: string }>();
  const navigate = useNavigate();

  const [tax, setTax] = useState<Tax | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchTaxDetails = async () => {
      if (!taxId) {
        navigate("/taxes");
        return;
      }

      try {
        setLoading(true);
        const taxData = await taxService.getTaxById(parseInt(taxId));

        if (taxData) {
          setTax(taxData);
        } else {
          toast.error("Tax not found");
          navigate("/taxes");
        }
      } catch (error) {
        console.error("Error fetching tax:", error);
        toast.error("Failed to load tax data");
        navigate("/taxes");
      } finally {
        setLoading(false);
      }
    };

    fetchTaxDetails();
  }, [taxId, navigate]);

  const handleEdit = () => {
    if (!tax) return;
    navigate(`/taxes/edit/${tax.TaxID}`);
  };

  // Delete dialog handlers
  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!tax) return;

    try {
      const success = await taxService.deleteTax(tax.TaxID);

      if (success) {
        toast.success("Tax deleted successfully");
        navigate("/taxes");
      } else {
        toast.error("Failed to delete tax");
      }
    } catch (error) {
      console.error("Error deleting tax:", error);
      toast.error("Failed to delete tax");
    } finally {
      closeDeleteDialog();
    }
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return "Not specified";
    try {
      return format(new Date(date), "dd MMM yyyy");
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

  if (!tax) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl">Tax not found</h2>
        <Button className="mt-4" onClick={() => navigate("/taxes")}>
          Back to taxes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/taxes")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold">{tax.TaxName}</h1>
            <span className="ml-2 text-xl text-muted-foreground">({tax.TaxCode})</span>
            {tax.IsExemptOrZero && (
              <Badge variant="secondary" className="ml-3">
                Exempt/Zero-Rated
              </Badge>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={openDeleteDialog}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Percent className="mr-2 h-5 w-5 text-muted-foreground" />
              Tax Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tax Code</p>
                <p className="mt-1 text-lg font-semibold">{tax.TaxCode}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tax Name</p>
                <p className="mt-1 text-lg">{tax.TaxName}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tax Rate</p>
                <p className="mt-1 text-lg font-semibold">{tax.IsExemptOrZero ? "Exempt / Zero-Rated" : `${tax.TaxRate.toFixed(2)}%`}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <p className="mt-1 text-lg">{tax.TaxCategory || "General"}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Effective From</p>
                <div className="mt-1 flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(tax.EffectiveFromDate)}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                <div className="mt-1 flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{tax.ExpiryDate ? formatDate(tax.ExpiryDate) : "No expiry date"}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground">Applicable Region</p>
              <div className="mt-1 flex items-center">
                {tax.CountryName ? (
                  <>
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{tax.CountryName}</span>
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Global (All Countries)</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-muted-foreground" />
              Tax Type & Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-4 border rounded-md">
                <div className={tax.IsSalesTax ? "text-green-500" : "text-muted-foreground"}>
                  {tax.IsSalesTax ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium">Sales Tax</p>
                  <p className="text-sm text-muted-foreground">Applies to goods</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 border rounded-md">
                <div className={tax.IsServiceTax ? "text-green-500" : "text-muted-foreground"}>
                  {tax.IsServiceTax ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium">Service Tax</p>
                  <p className="text-sm text-muted-foreground">Applies to services</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 border rounded-md">
                <div className={tax.IsExemptOrZero ? "text-green-500" : "text-muted-foreground"}>
                  {tax.IsExemptOrZero ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium">Exempt/Zero-Rated</p>
                  <p className="text-sm text-muted-foreground">No tax charged</p>
                </div>
              </div>
            </div>

            {(tax.TaxDescription || tax.Remark) && <Separator />}

            {tax.TaxDescription && (
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <div className="p-4 bg-muted/20 rounded-md">
                  <p className="text-sm">{tax.TaxDescription}</p>
                </div>
              </div>
            )}

            {tax.Remark && (
              <div>
                <h3 className="text-sm font-medium mb-2">Remarks</h3>
                <div className="p-4 bg-muted/20 rounded-md">
                  <p className="text-sm">{tax.Remark}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
              Audit Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tax.CreatedBy && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created By</p>
                  <div className="mt-1 flex items-center text-sm">
                    <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span>
                      {tax.CreatedBy} on {formatDate(tax.CreatedOn)}
                    </span>
                  </div>
                </div>
              )}
              {tax.UpdatedBy && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated By</p>
                  <div className="mt-1 flex items-center text-sm">
                    <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span>
                      {tax.UpdatedBy} on {formatDate(tax.UpdatedOn)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Tax"
        description={`Are you sure you want to delete "${tax.TaxName} (${tax.TaxCode})"? This will also delete all associated data and cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default TaxDetails;
