import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { paymentTermsService } from "@/services/paymentTermsService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Calendar, FileText, CheckCircle, XCircle, Clock, BarChart3, TrendingUp, Users, Activity, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { PaymentTerms, PaymentTermsUsageInfo } from "@/types/paymentTermsTypes";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const PaymentTermsDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [paymentTerm, setPaymentTerm] = useState<PaymentTerms | null>(null);
  const [usageInfo, setUsageInfo] = useState<PaymentTermsUsageInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);

  useEffect(() => {
    const fetchPaymentTermData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch payment term data
        const termData = await paymentTermsService.getPaymentTermById(parseInt(id));

        if (termData) {
          setPaymentTerm(termData);

          // Fetch usage information
          try {
            const usage = await paymentTermsService.getPaymentTermUsage(termData.PaymentTermID);
            setUsageInfo(usage);
          } catch (usageError) {
            console.warn("Could not fetch usage information:", usageError);
            // Continue without usage data as it's not critical
          }
        } else {
          setError("Payment term not found");
          toast.error("Payment term not found");
        }
      } catch (err) {
        console.error("Error fetching payment term:", err);
        setError("Failed to load payment term details");
        toast.error("Failed to load payment term details");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentTermData();
  }, [id]);

  const handleDelete = async () => {
    if (!paymentTerm) return;

    try {
      const result = await paymentTermsService.deletePaymentTerm(paymentTerm.PaymentTermID);
      if (result.success) {
        toast.success(result.message || "Payment term deleted successfully");
        navigate("/payment-terms");
      } else {
        toast.error(result.message || "Failed to delete payment term");
      }
    } catch (err) {
      console.error("Error deleting payment term:", err);
      toast.error("Failed to delete payment term");
    }
  };

  const handleStatusToggle = async () => {
    if (!paymentTerm) return;

    try {
      const result = await paymentTermsService.togglePaymentTermStatus(paymentTerm.PaymentTermID, !paymentTerm.IsActive);
      if (result.success) {
        toast.success(result.message);
        setPaymentTerm({ ...paymentTerm, IsActive: !paymentTerm.IsActive });
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error("Error toggling payment term status:", err);
      toast.error("Failed to update payment term status");
    }
  };

  const handleDuplicate = async () => {
    if (!paymentTerm) return;

    try {
      const newTermCode = `${paymentTerm.TermCode}_COPY`;
      const newTermName = `${paymentTerm.TermName} (Copy)`;

      const result = await paymentTermsService.duplicatePaymentTerm(paymentTerm.PaymentTermID, newTermCode, newTermName);

      if (result.success) {
        toast.success("Payment term duplicated successfully");
        navigate("/payment-terms");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error duplicating payment term:", error);
      toast.error("Failed to duplicate payment term");
    }
  };

  if (loading) {
    return (
      <div className="container p-4">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded-md w-3/4 mx-auto"></div>
            <div className="h-64 bg-gray-200 rounded-md w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !paymentTerm) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-red-500 mb-4">{error || "Payment term not found"}</p>
            <Button onClick={() => navigate("/payment-terms")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payment Terms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "PPP");
  };

  // Render status badge
  const renderStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-50 text-green-700" : ""}>
        {isActive ? (
          <>
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </>
        ) : (
          <>
            <XCircle className="mr-1 h-3 w-3" />
            Inactive
          </>
        )}
      </Badge>
    );
  };

  // Render days count with formatting
  const renderDaysCount = (daysCount?: number) => {
    if (daysCount === undefined || daysCount === null) {
      return (
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">No specific payment period</span>
        </div>
      );
    }

    if (daysCount === 0) {
      return (
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-blue-600" />
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Immediate Payment
          </Badge>
        </div>
      );
    }

    let badgeClass = "bg-gray-50 text-gray-700";
    if (daysCount <= 7) badgeClass = "bg-green-50 text-green-700";
    else if (daysCount <= 30) badgeClass = "bg-yellow-50 text-yellow-700";
    else if (daysCount <= 60) badgeClass = "bg-orange-50 text-orange-700";
    else badgeClass = "bg-red-50 text-red-700";

    return (
      <div className="flex items-center">
        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
        <Badge variant="outline" className={badgeClass}>
          {daysCount} {daysCount === 1 ? "day" : "days"}
        </Badge>
      </div>
    );
  };

  // Get payment category description
  const getPaymentCategoryDescription = (daysCount?: number) => {
    if (daysCount === undefined || daysCount === null) {
      return "Custom payment terms without specific days";
    }
    if (daysCount === 0) return "Immediate payment required";
    if (daysCount <= 7) return "Short-term payment";
    if (daysCount <= 30) return "Standard payment term";
    if (daysCount <= 60) return "Extended payment term";
    return "Long-term payment arrangement";
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Payment Term Details</CardTitle>
            <CardDescription>View and manage payment term information</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/payment-terms")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={handleDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <Button variant="outline" onClick={() => navigate(`/payment-terms/edit/${paymentTerm.PaymentTermID}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant={paymentTerm.IsActive ? "secondary" : "default"} onClick={() => setStatusChangeDialogOpen(true)}>
              {paymentTerm.IsActive ? (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex items-center justify-center md:justify-start">
              <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <h2 className="text-2xl font-bold">{paymentTerm.TermName}</h2>
                {renderStatusBadge(paymentTerm.IsActive)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Code: {paymentTerm.TermCode}</span>
                </div>
                {renderDaysCount(paymentTerm.DaysCount)}
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span>Created: {formatDate(paymentTerm.CreatedOn)}</span>
                </div>
                {usageInfo && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Used in {usageInfo.UsageCount} records</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Basic Details</TabsTrigger>
              <TabsTrigger value="usage">Usage Information</TabsTrigger>
              <TabsTrigger value="history">History & Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Payment Term Information</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Term ID:</span>
                      <span>{paymentTerm.PaymentTermID}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Term Code:</span>
                      <span className="font-mono">{paymentTerm.TermCode}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Term Name:</span>
                      <span>{paymentTerm.TermName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Days Count:</span>
                      <span>{paymentTerm.DaysCount ?? "Not specified"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Status:</span>
                      {renderStatusBadge(paymentTerm.IsActive)}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Category:</span>
                      <span>{getPaymentCategoryDescription(paymentTerm.DaysCount)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Information</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Created By:</span>
                      <span>{paymentTerm.CreatedBy || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Created On:</span>
                      <span>{formatDate(paymentTerm.CreatedOn)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Last Updated By:</span>
                      <span>{paymentTerm.UpdatedBy || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Last Updated On:</span>
                      <span>{paymentTerm.UpdatedOn ? formatDate(paymentTerm.UpdatedOn) : "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {paymentTerm.Description && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="p-4 bg-gray-50 rounded-md">{paymentTerm.Description}</p>
                </div>
              )}

              {/* Payment Timeline Visualization */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Payment Timeline</h3>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">0</div>
                      <span className="text-xs mt-1">Invoice Date</span>
                    </div>

                    <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-500 to-green-500 mx-4"></div>

                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">{paymentTerm.DaysCount ?? "∞"}</div>
                      <span className="text-xs mt-1">Payment Due</span>
                    </div>
                  </div>
                  <div className="mt-3 text-center text-sm text-muted-foreground">
                    {paymentTerm.DaysCount ? `Payment is due ${paymentTerm.DaysCount} days after invoice date` : "Payment terms to be negotiated separately"}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="usage" className="mt-6">
              <div className="space-y-6">
                {usageInfo ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <BarChart3 className="mr-2 h-5 w-5" />
                          Usage Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-4 border rounded-md text-center">
                            <div className="text-2xl font-bold text-blue-600">{usageInfo.UsageCount}</div>
                            <div className="text-sm text-muted-foreground">Total Usage</div>
                          </div>
                          <div className="p-4 border rounded-md text-center">
                            <div className="text-2xl font-bold text-green-600">{usageInfo.UsedInContracts}</div>
                            <div className="text-sm text-muted-foreground">Contracts</div>
                          </div>
                          <div className="p-4 border rounded-md text-center">
                            <div className="text-2xl font-bold text-purple-600">{usageInfo.UsedInInvoices}</div>
                            <div className="text-sm text-muted-foreground">Invoices</div>
                          </div>
                          <div className="p-4 border rounded-md text-center">
                            <div className="text-2xl font-bold text-orange-600">{usageInfo.UsedInSuppliers}</div>
                            <div className="text-sm text-muted-foreground">Suppliers</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {usageInfo.UsageCount > 0 && (
                      <Alert>
                        <TrendingUp className="h-4 w-4" />
                        <AlertDescription>
                          This payment term is actively used in {usageInfo.UsageCount} records across the system.
                          {!usageInfo.CanDelete && " Deletion is not allowed due to existing references."}
                        </AlertDescription>
                      </Alert>
                    )}

                    {usageInfo.UsageCount === 0 && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>This payment term is not currently used in any records and can be safely deleted if no longer needed.</AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="mx-auto h-12 w-12 mb-4" />
                    <p>Usage information is not available at this time.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="mr-2 h-5 w-5" />
                      Change History
                    </CardTitle>
                    <CardDescription>Track of all modifications made to this payment term</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>{formatDate(paymentTerm.CreatedOn)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Created
                            </Badge>
                          </TableCell>
                          <TableCell>{paymentTerm.CreatedBy}</TableCell>
                          <TableCell>Payment term created</TableCell>
                        </TableRow>
                        {paymentTerm.UpdatedOn && (
                          <TableRow>
                            <TableCell>{formatDate(paymentTerm.UpdatedOn)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                Updated
                              </Badge>
                            </TableCell>
                            <TableCell>{paymentTerm.UpdatedBy}</TableCell>
                            <TableCell>Payment term modified</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Payment Term"
        description={
          usageInfo && usageInfo.UsageCount > 0
            ? `This payment term "${paymentTerm.TermName}" is currently used in ${usageInfo.UsageCount} records. Deleting it may cause issues with existing data. Are you sure you want to proceed?`
            : `Are you sure you want to delete the payment term "${paymentTerm.TermName}"? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <ConfirmationDialog
        isOpen={statusChangeDialogOpen}
        onClose={() => setStatusChangeDialogOpen(false)}
        onConfirm={handleStatusToggle}
        title={paymentTerm.IsActive ? "Deactivate Payment Term" : "Activate Payment Term"}
        description={
          paymentTerm.IsActive
            ? `Are you sure you want to deactivate "${paymentTerm.TermName}"? It will no longer be available for selection in new transactions.`
            : `Are you sure you want to activate "${paymentTerm.TermName}"? It will become available for selection in transactions.`
        }
        confirmText={paymentTerm.IsActive ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        type={paymentTerm.IsActive ? "warning" : "success"}
      />
    </div>
  );
};

export default PaymentTermsDetails;
