// src/pages/fiscalYear/FiscalYearDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fiscalYearService } from "@/services/fiscalYearService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Calendar, Building, Lock, Unlock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { format, differenceInDays, isWithinInterval, isFuture, isPast } from "date-fns";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const FiscalYearDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fiscalYear, setFiscalYear] = useState<FiscalYear | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<"close" | "open">("close");

  useEffect(() => {
    const fetchFiscalYearData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const data = await fiscalYearService.getFiscalYearById(parseInt(id));

        if (data) {
          setFiscalYear(data);
        } else {
          setError("Fiscal year not found");
          toast.error("Fiscal year not found");
        }
      } catch (err) {
        console.error("Error fetching fiscal year:", err);
        setError("Failed to load fiscal year details");
        toast.error("Failed to load fiscal year details");
      } finally {
        setLoading(false);
      }
    };

    fetchFiscalYearData();
  }, [id]);

  const handleDelete = async () => {
    if (!fiscalYear) return;

    try {
      const result = await fiscalYearService.deleteFiscalYear(fiscalYear.FiscalYearID);
      if (result.Status === 1) {
        toast.success(result.Message || "Fiscal year deleted successfully");
        navigate("/fiscal-years");
      } else {
        toast.error(result.Message || "Failed to delete fiscal year");
      }
    } catch (err) {
      console.error("Error deleting fiscal year:", err);
      toast.error("Failed to delete fiscal year");
    }
  };

  const handleStatusChange = async () => {
    if (!fiscalYear) return;

    try {
      const result = await fiscalYearService.setFiscalYearClosedStatus(fiscalYear.FiscalYearID, statusAction === "close");

      if (result.Status === 1) {
        setFiscalYear({
          ...fiscalYear,
          IsClosed: statusAction === "close",
        });
        toast.success(result.Message);
        setStatusDialogOpen(false);
      } else {
        toast.error(result.Message);
      }
    } catch (err) {
      console.error("Error changing fiscal year status:", err);
      toast.error("Failed to change fiscal year status");
    }
  };

  const handleToggleActive = async () => {
    if (!fiscalYear) return;

    try {
      const result = await fiscalYearService.toggleFiscalYearStatus(fiscalYear.FiscalYearID, !fiscalYear.IsActive);

      if (result.Status === 1) {
        setFiscalYear({
          ...fiscalYear,
          IsActive: !fiscalYear.IsActive,
        });
        toast.success(result.Message);
      } else {
        toast.error(result.Message);
      }
    } catch (err) {
      console.error("Error toggling fiscal year status:", err);
      toast.error("Failed to toggle fiscal year status");
    }
  };

  const openStatusDialog = (action: "close" | "open") => {
    setStatusAction(action);
    setStatusDialogOpen(true);
  };

  const getCurrentPeriodStatus = () => {
    if (!fiscalYear) return null;

    const now = new Date();
    const startDate = new Date(fiscalYear.StartDate);
    const endDate = new Date(fiscalYear.EndDate);

    if (isFuture(startDate)) {
      return { status: "future", message: "This fiscal year has not started yet", color: "blue" };
    } else if (isPast(endDate)) {
      return { status: "past", message: "This fiscal year has ended", color: "gray" };
    } else if (isWithinInterval(now, { start: startDate, end: endDate })) {
      return { status: "current", message: "This is the current fiscal year", color: "green" };
    }

    return null;
  };

  const getDurationInfo = () => {
    if (!fiscalYear) return null;

    const startDate = new Date(fiscalYear.StartDate);
    const endDate = new Date(fiscalYear.EndDate);
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const now = new Date();

    let daysElapsed = 0;
    let daysRemaining = 0;

    if (isWithinInterval(now, { start: startDate, end: endDate })) {
      daysElapsed = differenceInDays(now, startDate);
      daysRemaining = differenceInDays(endDate, now);
    } else if (isPast(endDate)) {
      daysElapsed = totalDays;
      daysRemaining = 0;
    } else {
      daysElapsed = 0;
      daysRemaining = totalDays;
    }

    return {
      totalDays,
      daysElapsed,
      daysRemaining,
      progressPercentage: totalDays > 0 ? Math.round((daysElapsed / totalDays) * 100) : 0,
    };
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

  if (error || !fiscalYear) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-red-500 mb-4">{error || "Fiscal year not found"}</p>
            <Button onClick={() => navigate("/fiscal-years")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Fiscal Years
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const periodStatus = getCurrentPeriodStatus();
  const durationInfo = getDurationInfo();

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Fiscal Year Details</CardTitle>
            <CardDescription>View fiscal year information and status</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/fiscal-years")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={() => navigate(`/fiscal-years/edit/${fiscalYear.FiscalYearID}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            {!fiscalYear.IsClosed && (
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <h2 className="text-2xl font-bold">
                  {fiscalYear.FYCode} - {fiscalYear.FYDescription}
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant={fiscalYear.IsActive ? "default" : "destructive"} className={fiscalYear.IsActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {fiscalYear.IsActive ? (
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
                  <Badge variant={fiscalYear.IsClosed ? "secondary" : "outline"} className={fiscalYear.IsClosed ? "bg-gray-100 text-gray-800" : "bg-blue-100 text-blue-800"}>
                    {fiscalYear.IsClosed ? (
                      <>
                        <Lock className="h-3 w-3 mr-1" />
                        Closed
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3 w-3 mr-1" />
                        Open
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              {periodStatus && (
                <Alert className={`mb-4 border-${periodStatus.color}-200 bg-${periodStatus.color}-50`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className={`text-${periodStatus.color}-800`}>{periodStatus.message}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Start Date:</span>
                    <span className="font-medium">{format(new Date(fiscalYear.StartDate), "PPP")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">End Date:</span>
                    <span className="font-medium">{format(new Date(fiscalYear.EndDate), "PPP")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Company:</span>
                    <span className="font-medium">{fiscalYear.CompanyName || "Unknown"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created On:</span>
                    <span className="font-medium">{fiscalYear.CreatedOn ? format(new Date(fiscalYear.CreatedOn), "PPP") : "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-medium">{fiscalYear.UpdatedOn ? format(new Date(fiscalYear.UpdatedOn), "PPP") : "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Created By:</span>
                    <span className="font-medium">{fiscalYear.CreatedBy || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="audit">Audit Trail</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="space-y-6">
                {durationInfo && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Period Duration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{durationInfo.totalDays}</div>
                          <div className="text-sm text-muted-foreground">Total Days</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{durationInfo.daysElapsed}</div>
                          <div className="text-sm text-muted-foreground">Days Elapsed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{durationInfo.daysRemaining}</div>
                          <div className="text-sm text-muted-foreground">Days Remaining</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{durationInfo.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${durationInfo.progressPercentage}%` }}></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Status Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Active Status:</span>
                        <Badge variant={fiscalYear.IsActive ? "default" : "destructive"}>{fiscalYear.IsActive ? "Active" : "Inactive"}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Period Status:</span>
                        <Badge variant={fiscalYear.IsClosed ? "secondary" : "outline"}>{fiscalYear.IsClosed ? "Closed" : "Open"}</Badge>
                      </div>
                      {periodStatus && (
                        <div className="flex items-center justify-between">
                          <span>Current Status:</span>
                          <Badge variant="outline" className={`bg-${periodStatus.color}-100 text-${periodStatus.color}-800`}>
                            {periodStatus.status === "current" ? "Current Period" : periodStatus.status === "future" ? "Future Period" : "Past Period"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Available Actions</CardTitle>
                  <CardDescription>Manage this fiscal year</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Toggle Active Status</h4>
                        <p className="text-sm text-muted-foreground">{fiscalYear.IsActive ? "Deactivate" : "Activate"} this fiscal year</p>
                      </div>
                      <Button variant="outline" onClick={handleToggleActive}>
                        {fiscalYear.IsActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Period Management</h4>
                        <p className="text-sm text-muted-foreground">{fiscalYear.IsClosed ? "Reopen" : "Close"} this fiscal year period</p>
                      </div>
                      <Button variant={fiscalYear.IsClosed ? "default" : "destructive"} onClick={() => openStatusDialog(fiscalYear.IsClosed ? "open" : "close")}>
                        {fiscalYear.IsClosed ? (
                          <>
                            <Unlock className="mr-2 h-4 w-4" />
                            Reopen Period
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Close Period
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Edit Details</h4>
                        <p className="text-sm text-muted-foreground">Modify fiscal year information</p>
                      </div>
                      <Button variant="outline" onClick={() => navigate(`/fiscal-years/edit/${fiscalYear.FiscalYearID}`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Audit Information</CardTitle>
                  <CardDescription>Track changes and modifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Creation Details</h4>
                        <div className="text-sm space-y-1">
                          <div>Created By: {fiscalYear.CreatedBy || "N/A"}</div>
                          <div>Created On: {fiscalYear.CreatedOn ? format(new Date(fiscalYear.CreatedOn), "PPpp") : "N/A"}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Last Modification</h4>
                        <div className="text-sm space-y-1">
                          <div>Updated By: {fiscalYear.UpdatedBy || "N/A"}</div>
                          <div>Updated On: {fiscalYear.UpdatedOn ? format(new Date(fiscalYear.UpdatedOn), "PPpp") : "N/A"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Fiscal Year"
        description={`Are you sure you want to delete the fiscal year "${fiscalYear.FYDescription}"? This action cannot be undone and will remove all data associated with this fiscal year.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Status Change Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        onConfirm={handleStatusChange}
        title={statusAction === "close" ? "Close Fiscal Year" : "Reopen Fiscal Year"}
        description={
          statusAction === "close"
            ? `Are you sure you want to close the fiscal year "${fiscalYear.FYDescription}"? This will prevent new transactions from being posted to this period.`
            : `Are you sure you want to reopen the fiscal year "${fiscalYear.FYDescription}"? This will allow transactions to be posted to this period again.`
        }
        confirmText={statusAction === "close" ? "Close Period" : "Reopen Period"}
        cancelText="Cancel"
        type={statusAction === "close" ? "warning" : "info"}
      />
    </div>
  );
};

export default FiscalYearDetails;
