// src/pages/deductionCharges/DeductionChargesDetails.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deductionService, Deduction } from "@/services/deductionService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit2, Trash2, Tag, HandCoins, Calendar, Info } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const DeductionChargesDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [deduction, setDeduction] = useState<Deduction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchDeductionDetails = async () => {
      if (!id) {
        navigate("/deduction-charges");
        return;
      }

      try {
        setLoading(true);
        const deductionData = await deductionService.getDeductionById(parseInt(id));

        if (deductionData) {
          setDeduction(deductionData);
        } else {
          toast.error("Deduction not found");
          navigate("/deduction-charges");
        }
      } catch (error) {
        console.error("Error fetching deduction:", error);
        toast.error("Failed to load deduction data");
        navigate("/deduction-charges");
      } finally {
        setLoading(false);
      }
    };

    fetchDeductionDetails();
  }, [id, navigate]);

  const handleEdit = () => {
    if (!deduction) return;
    navigate(`/deduction-charges/edit/${deduction.DeductionID}`);
  };

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deduction) return;

    try {
      const success = await deductionService.deleteDeduction(deduction.DeductionID);

      if (success) {
        toast.success("Deduction deleted successfully");
        navigate("/deduction-charges");
      } else {
        toast.error("Failed to delete deduction");
      }
    } catch (error) {
      console.error("Error deleting deduction:", error);
      toast.error("Failed to delete deduction");
    } finally {
      closeDeleteDialog();
    }
  };

  const handleToggleStatus = async () => {
    if (!deduction) return;

    try {
      const result = await deductionService.toggleDeductionStatus(deduction.DeductionID);

      if (result.success) {
        setDeduction({
          ...deduction,
          IsActive: result.isActive !== undefined ? result.isActive : !deduction.IsActive,
        });
        toast.success(`Deduction ${result.isActive ? "activated" : "deactivated"} successfully`);
      } else {
        toast.error("Failed to update deduction status");
      }
    } catch (error) {
      console.error("Error toggling deduction status:", error);
      toast.error("Failed to update deduction status");
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

  if (!deduction) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl">Deduction not found</h2>
        <Button className="mt-4" onClick={() => navigate("/deduction-charges")}>
          Back to deductions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/deduction-charges")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">{deduction.DeductionName}</h1>
          <span className="text-sm text-muted-foreground">{deduction.DeductionCode}</span>
          <div className="ml-2">
            <Badge variant={deduction.IsActive ? "default" : "secondary"}>{deduction.IsActive ? "Active" : "Inactive"}</Badge>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleToggleStatus}>
            {deduction.IsActive ? "Deactivate" : "Activate"}
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
              <DetailRow label="Deduction Code" value={deduction.DeductionCode} />
              <DetailRow label="Deduction Type" value={deduction.DeductionType || "Standard"} />
            </div>

            <Separator />

            <DetailRow label="Description" value={deduction.DeductionDescription} />

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Deduction Value</h3>
              <div className="flex items-center">
                <HandCoins className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{deduction.DeductionValue}</span>
                {deduction.ApplicableOn && <span className="ml-2 text-muted-foreground">applicable on {deduction.ApplicableOn}</span>}
              </div>
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
              <h3 className="text-sm font-medium flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                Validity Period
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Effective From</div>
                  <div>{deduction.EffectiveFromDate ? formatDate(deduction.EffectiveFromDate) : "Not specified"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Expiry Date</div>
                  <div>{deduction.ExpiryDate ? formatDate(deduction.ExpiryDate) : "Not specified"}</div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Remarks</h3>
              <div className="p-3 bg-muted/30 rounded-md">
                <span className="text-muted-foreground">{deduction.Remark || "No remarks"}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Audit Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {deduction.CreatedBy && (
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Created By</div>
                    <div>
                      {deduction.CreatedBy} {deduction.CreatedOn && <span>on {formatDate(deduction.CreatedOn)}</span>}
                    </div>
                  </div>
                )}
                {deduction.UpdatedBy && (
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Last Updated By</div>
                    <div>
                      {deduction.UpdatedBy} {deduction.UpdatedOn && <span>on {formatDate(deduction.UpdatedOn)}</span>}
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
        title="Delete Deduction"
        description={`Are you sure you want to delete "${deduction.DeductionName}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

// Helper component for displaying deduction details
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

export default DeductionChargesDetails;
