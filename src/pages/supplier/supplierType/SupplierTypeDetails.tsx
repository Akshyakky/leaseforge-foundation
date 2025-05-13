// src/pages/supplier/SupplierTypeDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Building, CheckCircle, XCircle, Calendar, User, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { supplierService } from "@/services/supplierService";
import { SupplierType } from "@/types/supplierTypes";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export const SupplierTypeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supplierType, setSupplierType] = useState<SupplierType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchSupplierType = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Note: The service doesn't have getSupplierTypeById method yet
        // This is a placeholder for when the method is implemented
        toast.error("View functionality requires getSupplierTypeById method in the service");

        // Code that would be used when the method is available:
        // const data = await supplierService.getSupplierTypeById(parseInt(id));
        // if (data) {
        //   setSupplierType(data);
        // } else {
        //   setError("Supplier type not found");
        //   toast.error("Supplier type not found");
        // }

        // Placeholder data for demonstration
        setError("Supplier type not found - getSupplierTypeById method not implemented");
      } catch (err) {
        console.error("Error fetching supplier type:", err);
        setError("Failed to load supplier type details");
        toast.error("Failed to load supplier type details");
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierType();
  }, [id]);

  const handleDelete = async () => {
    if (!supplierType) return;

    try {
      // Note: The service doesn't have deleteSupplierType method yet
      toast.error("Delete functionality requires deleteSupplierType method in the service");

      // Code that would be used when the method is available:
      // const result = await supplierService.deleteSupplierType(supplierType.SupplierTypeID);
      // if (result.Status === 1) {
      //   toast.success(result.Message || "Supplier type deleted successfully");
      //   navigate("/supplier-types");
      // } else {
      //   toast.error(result.Message || "Failed to delete supplier type");
      // }
    } catch (err) {
      console.error("Error deleting supplier type:", err);
      toast.error("Failed to delete supplier type");
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

  if (error || !supplierType) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-red-500 mb-4">{error || "Supplier type not found"}</p>
            <Button onClick={() => navigate("/supplier-types")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Supplier Types
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
            <CardTitle className="text-2xl">Supplier Type Details</CardTitle>
            <CardDescription>View supplier type information</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/supplier-types")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={() => navigate(`/supplier-types/edit/${supplierType.SupplierTypeID}`)}>
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
          <div className="space-y-6">
            {/* Header Information */}
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">
                    {supplierType.SupplierTypeCode} - {supplierType.SupplierTypeName}
                  </h2>
                  <Badge variant={supplierType.IsActive ? "default" : "destructive"} className={supplierType.IsActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {supplierType.IsActive ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>
                {supplierType.SupplierTypeDescription && <p className="text-gray-600 mb-4">{supplierType.SupplierTypeDescription}</p>}
              </div>
            </div>

            <Separator />

            {/* Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-3">Type Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Code:</span>
                    <span className="font-medium">{supplierType.SupplierTypeCode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{supplierType.SupplierTypeName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      variant={supplierType.IsActive ? "default" : "destructive"}
                      className={supplierType.IsActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    >
                      {supplierType.IsActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-3">Usage Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Suppliers using this type:</span>
                    <span className="font-medium">{supplierType.SupplierCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {supplierType.SupplierTypeDescription && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Description</h3>
                  <p className="text-gray-600 p-4 bg-gray-50 rounded-lg">{supplierType.SupplierTypeDescription}</p>
                </div>
              </>
            )}

            {/* Audit Information */}
            {(supplierType.CreatedBy || supplierType.UpdatedBy) && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {supplierType.CreatedBy && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-muted-foreground">Created</h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{supplierType.CreatedBy}</span>
                        </div>
                        {supplierType.CreatedOn && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{format(new Date(supplierType.CreatedOn), "PPP")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {supplierType.UpdatedBy && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-muted-foreground">Last Updated</h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{supplierType.UpdatedBy}</span>
                        </div>
                        {supplierType.UpdatedOn && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{format(new Date(supplierType.UpdatedOn), "PPP")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Supplier Type"
        description={`Are you sure you want to delete the supplier type "${supplierType.SupplierTypeName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default SupplierTypeDetails;
