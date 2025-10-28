// src/pages/accountingPeriod/AccountingPeriodDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { accountingPeriodService } from "@/services/accountingPeriodService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Unlock, Calendar, Building, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { AccountingPeriod } from "@/types/accountingPeriodTypes";
import { format, differenceInDays, isWithinInterval, isFuture, isPast } from "date-fns";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const AccountingPeriodDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<AccountingPeriod | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [closingComments, setClosingComments] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);

  useEffect(() => {
    const fetchPeriodData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const data = await accountingPeriodService.getPeriodById(parseInt(id));

        if (data) {
          setPeriod(data);

          if (!data.IsClosed) {
            const validation = await accountingPeriodService.validatePeriodClosure(parseInt(id));
            setValidationResult(validation);
          }
        } else {
          setError("Accounting period not found");
          toast.error("Accounting period not found");
        }
      } catch (err) {
        console.error("Error fetching period:", err);
        setError("Failed to load period details");
        toast.error("Failed to load period details");
      } finally {
        setLoading(false);
      }
    };

    fetchPeriodData();
  }, [id]);

  const handleClosePeriod = async () => {
    if (!period) return;

    try {
      const result = await accountingPeriodService.closePeriod(period.PeriodID, closingComments);

      if (result.Status === 1) {
        setPeriod({
          ...period,
          IsClosed: true,
          IsOpen: false,
          ClosingComments: closingComments,
        });
        toast.success(result.Message);
        setCloseDialogOpen(false);
        setClosingComments("");
      } else {
        toast.error(result.Message);
      }
    } catch (err) {
      console.error("Error closing period:", err);
      toast.error("Failed to close period");
    }
  };

  const handleReopenPeriod = async () => {
    if (!period) return;

    try {
      const result = await accountingPeriodService.reopenPeriod(period.PeriodID);

      if (result.Status === 1) {
        setPeriod({
          ...period,
          IsClosed: false,
          IsOpen: true,
        });
        toast.success(result.Message);
        setReopenDialogOpen(false);
      } else {
        toast.error(result.Message);
      }
    } catch (err) {
      console.error("Error reopening period:", err);
      toast.error("Failed to reopen period");
    }
  };

  const openCloseDialog = () => {
    setClosingComments("");
    setCloseDialogOpen(true);
  };

  const getCurrentPeriodStatus = () => {
    if (!period) return null;

    const now = new Date();
    const startDate = new Date(period.StartDate);
    const endDate = new Date(period.EndDate);

    if (isFuture(startDate)) {
      return {
        status: "future",
        message: "This period has not started yet",
        className: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
      };
    } else if (isPast(endDate)) {
      return {
        status: "past",
        message: "This period has ended",
        className: "border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200",
      };
    } else if (isWithinInterval(now, { start: startDate, end: endDate })) {
      return {
        status: "current",
        message: "This is the current period",
        className: "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
      };
    }

    return null;
  };

  const getDurationInfo = () => {
    if (!period) return null;

    const startDate = new Date(period.StartDate);
    const endDate = new Date(period.EndDate);
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

  if (error || !period) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-destructive mb-4">{error || "Period not found"}</p>
            <Button onClick={() => navigate("/accounting-periods")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Periods
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const periodStatus = getCurrentPeriodStatus();
  const durationInfo = getDurationInfo();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "current":
        return "default";
      case "future":
        return "secondary";
      case "past":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Accounting Period Details</CardTitle>
            <CardDescription>View period information and manage closure status</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/accounting-periods")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <h2 className="text-2xl font-bold">
                  {period.PeriodCode} - {period.PeriodName}
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    Period {period.PeriodNumber}
                  </Badge>
                  <Badge
                    variant={period.IsClosed ? "secondary" : "default"}
                    className={cn(
                      period.IsClosed ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    )}
                  >
                    {period.IsClosed ? (
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
                <Alert className={cn("mb-4", periodStatus.className)}>
                  <Info className="h-4 w-4" />
                  <AlertDescription>{periodStatus.message}</AlertDescription>
                </Alert>
              )}

              {validationResult && !validationResult.canClose && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {validationResult.validationMessages.map((msg: string, idx: number) => (
                        <div key={idx}>{msg}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {validationResult && validationResult.canClose && !period.IsClosed && (
                <Alert className="mb-4 border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>This period is ready to be closed. All validation checks have passed.</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Start Date:</span>
                    <span className="font-medium">{format(new Date(period.StartDate), "PPP")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">End Date:</span>
                    <span className="font-medium">{format(new Date(period.EndDate), "PPP")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Fiscal Year:</span>
                    <span className="font-medium">
                      {period.FYCode} - {period.FYDescription}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {period.IsClosed && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Closed By:</span>
                        <span className="font-medium">{period.ClosedByUserName || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Closed On:</span>
                        <span className="font-medium">{period.ClosedOn ? format(new Date(period.ClosedOn), "PPP") : "N/A"}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Created By:</span>
                    <span className="font-medium">{period.CreatedBy || "N/A"}</span>
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
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{durationInfo.totalDays}</div>
                          <div className="text-sm text-muted-foreground">Total Days</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{durationInfo.daysElapsed}</div>
                          <div className="text-sm text-muted-foreground">Days Elapsed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{durationInfo.daysRemaining}</div>
                          <div className="text-sm text-muted-foreground">Days Remaining</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{durationInfo.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${durationInfo.progressPercentage}%` }} />
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
                        <span>Period Status:</span>
                        <Badge variant={period.IsClosed ? "secondary" : "default"}>{period.IsClosed ? "Closed" : "Open"}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Period Number:</span>
                        <Badge variant="outline" className="font-mono">
                          P{period.PeriodNumber.toString().padStart(2, "0")}
                        </Badge>
                      </div>
                      {periodStatus && (
                        <div className="flex items-center justify-between">
                          <span>Current Status:</span>
                          <Badge
                            variant={getStatusBadgeVariant(periodStatus.status)}
                            className={cn(
                              periodStatus.status === "current" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                              periodStatus.status === "future" && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                              periodStatus.status === "past" && "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                            )}
                          >
                            {periodStatus.status === "current" ? "Current Period" : periodStatus.status === "future" ? "Future Period" : "Past Period"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {period.ClosingComments && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Closing Comments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{period.ClosingComments}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="actions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Available Actions</CardTitle>
                  <CardDescription>Manage this accounting period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!period.IsClosed ? (
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                        <div>
                          <h4 className="font-medium">Close Period</h4>
                          <p className="text-sm text-muted-foreground">Close this period to prevent new transactions from being posted</p>
                        </div>
                        <Button variant="destructive" onClick={openCloseDialog} disabled={validationResult && !validationResult.canClose}>
                          <Lock className="mr-2 h-4 w-4" />
                          Close Period
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                        <div>
                          <h4 className="font-medium">Reopen Period</h4>
                          <p className="text-sm text-muted-foreground">Reopen this period to allow transactions to be posted again</p>
                        </div>
                        <Button variant="default" onClick={() => setReopenDialogOpen(true)}>
                          <Unlock className="mr-2 h-4 w-4" />
                          Reopen Period
                        </Button>
                      </div>
                    )}
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
                      <div className="space-y-2 p-4 rounded-lg border bg-muted/10">
                        <h4 className="font-medium">Creation Details</h4>
                        <div className="text-sm space-y-1 text-muted-foreground">
                          <div>
                            Created By: <span className="text-foreground">{period.CreatedBy || "N/A"}</span>
                          </div>
                          <div>
                            Created On: <span className="text-foreground">{period.CreatedOn ? format(new Date(period.CreatedOn), "PPpp") : "N/A"}</span>
                          </div>
                        </div>
                      </div>
                      {period.IsClosed && (
                        <div className="space-y-2 p-4 rounded-lg border bg-muted/10">
                          <h4 className="font-medium">Closure Details</h4>
                          <div className="text-sm space-y-1 text-muted-foreground">
                            <div>
                              Closed By: <span className="text-foreground">{period.ClosedByUserName || "N/A"}</span>
                            </div>
                            <div>
                              Closed On: <span className="text-foreground">{period.ClosedOn ? format(new Date(period.ClosedOn), "PPpp") : "N/A"}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {period.UpdatedOn && (
                        <div className="space-y-2 p-4 rounded-lg border bg-muted/10">
                          <h4 className="font-medium">Last Modification</h4>
                          <div className="text-sm space-y-1 text-muted-foreground">
                            <div>
                              Updated By: <span className="text-foreground">{period.UpdatedBy || "N/A"}</span>
                            </div>
                            <div>
                              Updated On: <span className="text-foreground">{period.UpdatedOn ? format(new Date(period.UpdatedOn), "PPpp") : "N/A"}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={closeDialogOpen}
        onClose={() => setCloseDialogOpen(false)}
        onConfirm={handleClosePeriod}
        title="Close Accounting Period"
        description={
          <div className="space-y-4">
            <p>
              Are you sure you want to close period <strong>{period.PeriodName}</strong>? This will prevent new transactions from being posted to this period.
            </p>
            <div className="space-y-2">
              <Label htmlFor="closing-comments">Closing Comments (Optional)</Label>
              <Textarea
                id="closing-comments"
                placeholder="Enter any comments about this period closure..."
                value={closingComments}
                onChange={(e) => setClosingComments(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        }
        confirmText="Close Period"
        cancelText="Cancel"
        type="warning"
      />

      <ConfirmationDialog
        isOpen={reopenDialogOpen}
        onClose={() => setReopenDialogOpen(false)}
        onConfirm={handleReopenPeriod}
        title="Reopen Accounting Period"
        description={`Are you sure you want to reopen period "${period.PeriodName}"? This will allow transactions to be posted to this period again. Ensure no future periods are closed before reopening.`}
        confirmText="Reopen Period"
        cancelText="Cancel"
        type="info"
      />
    </div>
  );
};

export default AccountingPeriodDetails;
