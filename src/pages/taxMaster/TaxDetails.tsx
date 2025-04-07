import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { taxService, Tax } from "@/services/taxService";
import { toast } from "sonner";
import { ArrowLeft, Edit, Trash2, Loader2, CalendarDays, Info, BriefcaseIcon, GlobeIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { formatDate } from "@/lib/utils";

const TaxDetails = () => {
  const navigate = useNavigate();
  const { taxId } = useParams<{ taxId: string }>();

  // State variables
  const [tax, setTax] = useState<Tax | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch tax data on component mount
  useEffect(() => {
    const fetchTaxData = async () => {
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
        console.error("Error loading tax:", error);
        toast.error("Failed to load tax details");
        navigate("/taxes");
      } finally {
        setLoading(false);
      }
    };

    fetchTaxData();
  }, [taxId, navigate]);

  // Handle navigation back to tax list
  const handleBack = () => {
    navigate("/taxes");
  };

  // Handle edit navigation
  const handleEdit = () => {
    navigate(`/taxes/edit/${taxId}`);
  };

  // Delete confirmation handlers
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

  // Render function for tax type
  const renderTaxType = () => {
    if (!tax) return null;

    if (tax.IsExemptOrZero) {
      return "Exempt/Zero-Rated";
    } else if (tax.IsSalesTax) {
      return "Sales Tax";
    } else if (tax.IsServiceTax) {
      return "Service Tax";
    } else {
      return "Other";
    }
  };

  // Render badge for tax type
  const renderTaxBadge = () => {
    if (!tax) return null;

    if (tax.IsExemptOrZero) {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700">
          Exempt
        </Badge>
      );
    } else if (tax.IsSalesTax) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Sales
        </Badge>
      );
    } else if (tax.IsServiceTax) {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700">
          Service
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
          Other
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading tax details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold">Tax Details</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={openDeleteDialog}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {tax && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{tax.TaxName}</CardTitle>
                  <CardDescription className="text-base">
                    {tax.TaxCode} {renderTaxBadge()}
                  </CardDescription>
                </div>
                <div className="text-2xl font-bold text-primary">{tax.TaxRate}%</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Tax Type</h3>
                    <p className="text-lg">{renderTaxType()}</p>
                  </div>

                  {tax.TaxCategory && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Category</h3>
                      <p className="text-lg">{tax.TaxCategory}</p>
                    </div>
                  )}

                  {tax.CountryName && (
                    <div className="flex items-start space-x-2">
                      <GlobeIcon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Country</h3>
                        <p className="text-base">{tax.CountryName}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {tax.EffectiveFromDate && (
                    <div className="flex items-start space-x-2">
                      <CalendarDays className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Effective From</h3>
                        <p className="text-base">{formatDate(new Date(tax.EffectiveFromDate))}</p>
                      </div>
                    </div>
                  )}

                  {tax.ExpiryDate && (
                    <div className="flex items-start space-x-2">
                      <CalendarDays className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Expires On</h3>
                        <p className="text-base">{formatDate(new Date(tax.ExpiryDate))}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {tax.TaxDescription && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{tax.TaxDescription}</p>
                </div>
              )}

              {tax.Remark && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Remarks</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{tax.Remark}</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="flex flex-col w-full text-sm text-muted-foreground space-y-1">
                {tax.CreatedBy && tax.CreatedOn && (
                  <div className="flex justify-between">
                    <span>Created by</span>
                    <span>
                      {tax.CreatedBy} on {formatDate(new Date(tax.CreatedOn))}
                    </span>
                  </div>
                )}
                {tax.UpdatedBy && tax.UpdatedOn && (
                  <div className="flex justify-between">
                    <span>Last modified by</span>
                    <span>
                      {tax.UpdatedBy} on {formatDate(new Date(tax.UpdatedOn))}
                    </span>
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Tax"
        description={`Are you sure you want to delete '${tax?.TaxName}'? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default TaxDetails;
