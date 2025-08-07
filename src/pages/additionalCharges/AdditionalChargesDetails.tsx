// src/pages/additionalCharges/AdditionalChargesDetails.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { additionalChargesService, Charge } from "@/services/additionalChargesService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit2, Trash2, Tag, Percent, HandCoins, Calendar, Info } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const AdditionalChargesDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [charge, setCharge] = useState<Charge | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchChargeDetails = async () => {
      if (!id) {
        navigate("/additional-charges");
        return;
      }

      try {
        setLoading(true);
        const chargeData = await additionalChargesService.getChargeById(parseInt(id));

        if (chargeData) {
          setCharge(chargeData);
        } else {
          toast.error("Charge not found");
          navigate("/additional-charges");
        }
      } catch (error) {
        console.error("Error fetching charge:", error);
        toast.error("Failed to load charge data");
        navigate("/additional-charges");
      } finally {
        setLoading(false);
      }
    };

    fetchChargeDetails();
  }, [id, navigate]);

  const handleEdit = () => {
    if (!charge) return;
    navigate(`/additional-charges/edit/${charge.ChargesID}`);
  };

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!charge) return;

    try {
      const success = await additionalChargesService.deleteCharge(charge.ChargesID);

      if (success) {
        toast.success("Charge deleted successfully");
        navigate("/additional-charges");
      } else {
        toast.error("Failed to delete charge");
      }
    } catch (error) {
      console.error("Error deleting charge:", error);
      toast.error("Failed to delete charge");
    } finally {
      closeDeleteDialog();
    }
  };

  const handleToggleStatus = async () => {
    if (!charge) return;

    try {
      const result = await additionalChargesService.toggleChargeStatus(charge.ChargesID);

      if (result.success) {
        setCharge({
          ...charge,
          IsActive: result.isActive !== undefined ? result.isActive : !charge.IsActive,
        });
        toast.success(`Charge ${result.isActive ? "activated" : "deactivated"} successfully`);
      } else {
        toast.error("Failed to update charge status");
      }
    } catch (error) {
      console.error("Error toggling charge status:", error);
      toast.error("Failed to update charge status");
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

  if (!charge) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl">Charge not found</h2>
        <Button className="mt-4" onClick={() => navigate("/additional-charges")}>
          Back to charges
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/additional-charges")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">{charge.ChargesName}</h1>
          <span className="text-sm text-muted-foreground">{charge.ChargesCode}</span>
          <div className="ml-2 flex space-x-2">
            <Badge variant={charge.IsActive ? "default" : "secondary"}>{charge.IsActive ? "Active" : "Inactive"}</Badge>
            {charge.IsDeposit && <Badge variant="outline">Deposit</Badge>}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleToggleStatus}>
            {charge.IsActive ? "Deactivate" : "Activate"}
          </Button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="mr-2 h-5 w-5 text-muted-foreground" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="Charge Code" value={charge.ChargesCode} />
              <DetailRow label="Category" value={charge.ChargesCategoryName} />
            </div>

            <Separator />

            <DetailRow label="Description" value={charge.Description} />

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Charge Type</h3>
              {charge.IsPercentage ? (
                <div className="flex items-center">
                  <Percent className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{charge.PercentageValue}%</span>
                  {charge.ApplicableOn && <span className="ml-2 text-muted-foreground">applicable on {charge.ApplicableOn}</span>}
                </div>
              ) : (
                <div className="flex items-center">
                  <HandCoins className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {charge.CurrencyName} {charge.ChargeAmount?.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="mr-2 h-5 w-5 text-muted-foreground" />
              Additional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Tax Information</h3>
              <div className="p-3 bg-muted/30 rounded-md">
                {charge.TaxID ? (
                  <div className="space-y-1">
                    <div className="font-medium">{charge.TaxName}</div>
                    <div className="text-sm text-muted-foreground">Rate: {charge.TaxRate}%</div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">No tax applied</span>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                Validity Period
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Effective From</div>
                  <div>{charge.EffectiveFromDate ? formatDate(charge.EffectiveFromDate) : "Not specified"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Expiry Date</div>
                  <div>{charge.ExpiryDate ? formatDate(charge.ExpiryDate) : "Not specified"}</div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Audit Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {charge.CreatedBy && (
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Created By</div>
                    <div>
                      {charge.CreatedBy} {charge.CreatedOn && <span>on {formatDate(charge.CreatedOn)}</span>}
                    </div>
                  </div>
                )}
                {charge.UpdatedBy && (
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Last Updated By</div>
                    <div>
                      {charge.UpdatedBy} {charge.UpdatedOn && <span>on {formatDate(charge.UpdatedOn)}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Charge"
        description={`Are you sure you want to delete "${charge.ChargesName}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

// Helper component for displaying charge details
interface DetailRowProps {
  label: string;
  value?: string | null;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => {
  if (!value) return null;

  return (
    <div>
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
};

export default AdditionalChargesDetails;
