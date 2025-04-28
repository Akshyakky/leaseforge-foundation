// src/pages/termination/TerminationDetails.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { terminationService, ContractTermination, TerminationDeduction, TerminationAttachment } from "@/services/terminationService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit2, Trash2, FileText, Building, Calendar, Users, DollarSign, Download, PlusCircle, Info, Home, Tag, Calculator } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";

const TerminationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [termination, setTermination] = useState<ContractTermination | null>(null);
  const [deductions, setDeductions] = useState<TerminationDeduction[]>([]);
  const [attachments, setAttachments] = useState<TerminationAttachment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [isCalculationDialogOpen, setIsCalculationDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState("details");
  const [selectedAttachment, setSelectedAttachment] = useState<TerminationAttachment | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [refundDate, setRefundDate] = useState<Date | null>(new Date());
  const [refundReference, setRefundReference] = useState("");
  const [calculationResult, setCalculationResult] = useState<any>(null);

  // Termination status options
  const terminationStatusOptions = ["Draft", "Pending", "Approved", "Completed", "Cancelled"];

  useEffect(() => {
    const fetchTerminationDetails = async () => {
      if (!id) {
        navigate("/terminations");
        return;
      }

      try {
        setLoading(true);
        const data = await terminationService.getTerminationById(parseInt(id));

        if (data.termination) {
          setTermination(data.termination);
          setDeductions(data.deductions);
          setAttachments(data.attachments);
        } else {
          toast.error("Termination not found");
          navigate("/terminations");
        }
      } catch (error) {
        console.error("Error fetching termination:", error);
        toast.error("Failed to load termination data");
        navigate("/terminations");
      } finally {
        setLoading(false);
      }
    };

    fetchTerminationDetails();
  }, [id, navigate]);

  const handleEdit = () => {
    if (!termination) return;
    navigate(`/terminations/edit/${termination.TerminationID}`);
  };

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!termination) return;

    try {
      const response = await terminationService.deleteTermination(termination.TerminationID);

      if (response.Status === 1) {
        toast.success("Termination deleted successfully");
        navigate("/terminations");
      } else {
        toast.error(response.Message || "Failed to delete termination");
      }
    } catch (error) {
      console.error("Error deleting termination:", error);
      toast.error("Failed to delete termination");
    } finally {
      closeDeleteDialog();
    }
  };

  const openStatusChangeDialog = (status: string) => {
    setSelectedStatus(status);
    setIsStatusChangeDialogOpen(true);
  };

  const closeStatusChangeDialog = () => {
    setIsStatusChangeDialogOpen(false);
    setSelectedStatus("");
  };

  const handleStatusChange = async () => {
    if (!termination || !selectedStatus) return;

    try {
      const response = await terminationService.changeTerminationStatus(termination.TerminationID, selectedStatus);

      if (response.Status === 1) {
        setTermination({
          ...termination,
          TerminationStatus: selectedStatus,
        });
        toast.success(`Termination status changed to ${selectedStatus}`);
      } else {
        toast.error(response.Message || "Failed to change termination status");
      }
    } catch (error) {
      console.error("Error changing termination status:", error);
      toast.error("Failed to change termination status");
    } finally {
      closeStatusChangeDialog();
    }
  };

  const openRefundDialog = () => {
    if (!termination) return;
    setRefundDate(new Date());
    setRefundReference("");
    setIsRefundDialogOpen(true);
  };

  const closeRefundDialog = () => {
    setIsRefundDialogOpen(false);
  };

  const handleProcessRefund = async () => {
    if (!termination || !refundDate || !refundReference) {
      toast.error("Please provide refund date and reference");
      return;
    }

    try {
      const response = await terminationService.processRefund(termination.TerminationID, refundDate, refundReference);

      if (response.Status === 1) {
        setTermination({
          ...termination,
          IsRefundProcessed: true,
          RefundDate: refundDate,
          RefundReference: refundReference,
        });
        toast.success("Refund processed successfully");
      } else {
        toast.error(response.Message || "Failed to process refund");
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      toast.error("Failed to process refund");
    } finally {
      closeRefundDialog();
    }
  };

  const openCalculationDialog = () => {
    if (!termination) return;
    setCalculationResult(null);
    setIsCalculationDialogOpen(true);
  };

  const closeCalculationDialog = () => {
    setIsCalculationDialogOpen(false);
  };

  const handleCalculateTerminationFigures = async () => {
    if (!termination) return;

    try {
      const response = await terminationService.calculateTerminationFigures(termination.TerminationID);

      if (response.success) {
        setCalculationResult(response.figures);

        // Update termination with new figures
        if (response.figures) {
          setTermination({
            ...termination,
            SecurityDepositAmount: response.figures.SecurityDepositAmount,
            TotalDeductions: response.figures.TotalDeductions,
            AdjustAmount: response.figures.AdjustAmount,
            TotalInvoiced: response.figures.TotalInvoiced,
            TotalReceived: response.figures.TotalReceived,
            CreditNoteAmount: response.figures.CreditNoteAmount,
            RefundAmount: response.figures.RefundAmount,
          });
        }

        toast.success("Termination figures calculated successfully");

        // Close the dialog after a delay to show the results
        setTimeout(() => {
          closeCalculationDialog();
        }, 2000);
      } else {
        toast.error(response.message || "Failed to calculate termination figures");
      }
    } catch (error) {
      console.error("Error calculating termination figures:", error);
      toast.error("Failed to calculate termination figures");
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

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "Not specified";
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "default";
      case "Draft":
        return "secondary";
      case "Pending":
        return "outline";
      case "Completed":
        return "default";
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const openAttachmentPreview = (attachment: TerminationAttachment) => {
    setSelectedAttachment(attachment);
    setIsPreviewDialogOpen(true);
  };

  const closeAttachmentPreview = () => {
    setIsPreviewDialogOpen(false);
    setSelectedAttachment(null);
  };

  // Check if the attachment is an image or PDF for preview
  const isPreviewable = (attachment: TerminationAttachment) => {
    if (!attachment.FileContentType) return false;
    return attachment.FileContentType.startsWith("image/") || attachment.FileContentType === "application/pdf";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!termination) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl">Termination not found</h2>
        <Button className="mt-4" onClick={() => navigate("/terminations")}>
          Back to terminations
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/terminations")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Termination {termination.TerminationNo}</h1>
          <div className="ml-2">
            <Badge variant={getStatusColor(termination.TerminationStatus)}>{termination.TerminationStatus}</Badge>
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Change Status
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {terminationStatusOptions
                  .filter((status) => status !== termination.TerminationStatus)
                  .map((status) => (
                    <DropdownMenuItem key={status} onClick={() => openStatusChangeDialog(status)}>
                      Set as {status}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {termination.TerminationStatus === "Approved" && termination.RefundAmount > 0 && !termination.IsRefundProcessed && (
            <Button variant="outline" onClick={openRefundDialog}>
              <DollarSign className="mr-2 h-4 w-4" />
              Process Refund
            </Button>
          )}

          <Button variant="outline" onClick={openCalculationDialog}>
            <Calculator className="mr-2 h-4 w-4" />
            Calculate Figures
          </Button>

          <Button variant="outline" onClick={handleEdit} disabled={termination.TerminationStatus === "Completed"}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </Button>

          <Button variant="destructive" onClick={openDeleteDialog} disabled={termination.TerminationStatus === "Approved" || termination.TerminationStatus === "Completed"}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-[400px]">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="deductions">Deductions ({deductions.length})</TabsTrigger>
          <TabsTrigger value="attachments">Attachments ({attachments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                Termination Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Termination Number</h3>
                    <p className="text-base">{termination.TerminationNo}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div>
                      <Badge variant={getStatusColor(termination.TerminationStatus)} className="mt-1">
                        {termination.TerminationStatus}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contract Number</h3>
                    <p className="text-base">{termination.ContractNo}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                    <p className="text-base font-medium">{termination.CustomerFullName}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Termination Date</h3>
                    <p className="text-base">{formatDate(termination.TerminationDate)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Notice Date</h3>
                    <p className="text-base">{formatDate(termination.NoticeDate)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Effective Date</h3>
                    <p className="text-base font-medium">{formatDate(termination.EffectiveDate)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Property</h3>
                    <p className="text-base">{termination.PropertyName}</p>
                    {termination.UnitNumbers && <p className="text-sm text-muted-foreground">Units: {termination.UnitNumbers}</p>}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Vacating Date</h3>
                    <p className="text-base">{formatDate(termination.VacatingDate)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Move Out Date</h3>
                    <p className="text-base">{formatDate(termination.MoveOutDate)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Key Return Date</h3>
                    <p className="text-base">{formatDate(termination.KeyReturnDate)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Stay Period</h3>
                    <p className="text-base">
                      {termination.StayPeriodDays || 0} days
                      {termination.StayPeriodAmount ? ` (${formatCurrency(termination.StayPeriodAmount)})` : ""}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Termination Reason</h3>
                <p className="text-base mt-1">{termination.TerminationReason || "Not specified"}</p>
              </div>

              {termination.Notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                    <p className="text-base mt-1">{termination.Notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-4 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Security Deposit</h3>
                  <p className="text-base font-medium">{formatCurrency(termination.SecurityDepositAmount)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total Deductions</h3>
                  <p className="text-base font-medium">{formatCurrency(termination.TotalDeductions)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Adjustment</h3>
                  <p className="text-base font-medium">{formatCurrency(termination.AdjustAmount || 0)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Refund Amount</h3>
                  <p className="text-lg font-bold">{formatCurrency(termination.RefundAmount || 0)}</p>
                </div>
              </div>

              {termination.RefundAmount > 0 && (
                <>
                  <Separator />
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Refund Status</h3>
                      <p className="text-base">
                        {termination.IsRefundProcessed ? (
                          <Badge variant="default" className="mt-1">
                            Processed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="mt-1">
                            Pending
                          </Badge>
                        )}
                      </p>
                    </div>
                    {termination.IsRefundProcessed && (
                      <>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Refund Date</h3>
                          <p className="text-base">{formatDate(termination.RefundDate)}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Refund Reference</h3>
                          <p className="text-base">{termination.RefundReference}</p>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {termination.CreditNoteAmount > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Credit Note Amount</h3>
                    <p className="text-base font-medium">{formatCurrency(termination.CreditNoteAmount)}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Created By</div>
                  <div>
                    {termination.CreatedBy} {termination.CreatedOn && <span>on {formatDate(termination.CreatedOn)}</span>}
                  </div>
                </div>
                {termination.UpdatedBy && (
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Last Updated By</div>
                    <div>
                      {termination.UpdatedBy} {termination.UpdatedOn && <span>on {formatDate(termination.UpdatedOn)}</span>}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deductions" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-muted-foreground" />
                Deductions
              </CardTitle>
              <Button variant="outline" size="sm" disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Deduction
              </Button>
            </CardHeader>
            <CardContent>
              {deductions.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Deduction</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Tax</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deductions.map((deduction) => (
                        <TableRow key={deduction.TerminationDeductionID}>
                          <TableCell>
                            <div className="font-medium">{deduction.DeductionName}</div>
                            {deduction.DeductionCode && <div className="text-sm text-muted-foreground">{deduction.DeductionCode}</div>}
                          </TableCell>
                          <TableCell>{deduction.DeductionDescription || "N/A"}</TableCell>
                          <TableCell>{formatCurrency(deduction.DeductionAmount)}</TableCell>
                          <TableCell>
                            {deduction.TaxPercentage ? (
                              <div>
                                <div>{deduction.TaxPercentage}%</div>
                                <div className="text-sm text-muted-foreground">{formatCurrency(deduction.TaxAmount)}</div>
                              </div>
                            ) : (
                              "No tax"
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(deduction.TotalAmount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} className="text-right font-bold">
                          Total Deductions
                        </TableCell>
                        <TableCell className="font-bold">{formatCurrency(termination.TotalDeductions)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No deductions have been added to this termination.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                Attachments
              </CardTitle>
              <Button variant="outline" size="sm" disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Attachment
              </Button>
            </CardHeader>
            <CardContent>
              {attachments.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attachments.map((attachment) => (
                        <TableRow key={attachment.TerminationAttachmentID}>
                          <TableCell>
                            <div className="font-medium">{attachment.DocumentName}</div>
                          </TableCell>
                          <TableCell>{attachment.DocTypeName}</TableCell>
                          <TableCell>{attachment.DocIssueDate ? formatDate(attachment.DocIssueDate) : "N/A"}</TableCell>
                          <TableCell>{attachment.DocExpiryDate ? formatDate(attachment.DocExpiryDate) : "N/A"}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {isPreviewable(attachment) && (
                                <Button variant="outline" size="sm" onClick={() => openAttachmentPreview(attachment)}>
                                  Preview
                                </Button>
                              )}
                              <Button variant="outline" size="sm" disabled>
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No attachments have been added to this termination.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Termination"
        description={`Are you sure you want to delete termination "${termination.TerminationNo}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />

      {/* Confirmation Dialog for Status Change */}
      <ConfirmationDialog
        isOpen={isStatusChangeDialogOpen}
        onClose={closeStatusChangeDialog}
        onConfirm={handleStatusChange}
        title="Change Termination Status"
        description={`Are you sure you want to change the status of termination "${termination.TerminationNo}" to "${selectedStatus}"?`}
        cancelText="Cancel"
        confirmText="Change Status"
        type="warning"
      />

      {/* Refund Processing Dialog */}
      <ConfirmationDialog
        isOpen={isRefundDialogOpen}
        onClose={closeRefundDialog}
        onConfirm={handleProcessRefund}
        title="Process Refund"
        description={
          <div className="space-y-4">
            <p>Enter refund details for termination {termination.TerminationNo}:</p>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Refund Date</label>
              <DatePicker value={refundDate} onChange={setRefundDate} placeholder="Select refund date" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Refund Reference</label>
              <Input placeholder="Enter refund reference" value={refundReference} onChange={(e) => setRefundReference(e.target.value)} />
            </div>
          </div>
        }
        cancelText="Cancel"
        confirmText="Process Refund"
        type="warning"
        confirmDisabled={!refundDate || !refundReference}
      />

      {/* Calculate Figures Dialog */}
      <ConfirmationDialog
        isOpen={isCalculationDialogOpen}
        onClose={closeCalculationDialog}
        onConfirm={handleCalculateTerminationFigures}
        title="Calculate Termination Figures"
        description={
          <div className="space-y-4">
            <p>This will recalculate the termination figures based on current deductions and security deposit amount.</p>

            {calculationResult && (
              <div className="mt-4 p-4 border rounded-md bg-muted/20">
                <h4 className="font-medium mb-2">Calculation Results:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Security Deposit:</div>
                  <div className="font-medium">{formatCurrency(calculationResult.SecurityDepositAmount)}</div>

                  <div>Total Deductions:</div>
                  <div className="font-medium">{formatCurrency(calculationResult.TotalDeductions)}</div>

                  <div>Adjustment Amount:</div>
                  <div className="font-medium">{formatCurrency(calculationResult.AdjustAmount)}</div>

                  <Separator className="col-span-2 my-1" />

                  <div>Refund Amount:</div>
                  <div className="font-medium">{formatCurrency(calculationResult.RefundAmount)}</div>

                  <div>Credit Note Amount:</div>
                  <div className="font-medium">{formatCurrency(calculationResult.CreditNoteAmount)}</div>
                </div>
              </div>
            )}
          </div>
        }
        cancelText="Cancel"
        confirmText="Calculate"
        type="warning"
      />

      {/* Document Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={closeAttachmentPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedAttachment?.DocumentName}</DialogTitle>
          </DialogHeader>
          <div className="h-[60vh] overflow-auto flex items-center justify-center p-4 bg-muted/50">
            {selectedAttachment &&
              selectedAttachment.fileUrl &&
              (selectedAttachment.FileContentType?.startsWith("image/") ? (
                <img src={selectedAttachment.fileUrl} alt={selectedAttachment.DocumentName} className="max-w-full max-h-full object-contain" />
              ) : selectedAttachment.FileContentType === "application/pdf" ? (
                <iframe src={selectedAttachment.fileUrl} className="w-full h-full" title={selectedAttachment.DocumentName} />
              ) : (
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                  <p className="mt-2">Preview not available for this file type</p>
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAttachmentPreview}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Import DropdownMenu components and ChevronDown icon
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export default TerminationDetails;
