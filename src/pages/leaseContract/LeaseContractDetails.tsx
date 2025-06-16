import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { contractService } from "@/services/leaseContractService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Calendar,
  Building2,
  Download,
  Eye,
  Check,
  X,
  Send,
  Printer,
  Copy,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  User,
  DollarSign,
  Building,
  MapPin,
  Users,
  Calculator,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { Contract, ContractUnit, ContractAdditionalCharge, ContractAttachment, ContractResponse, ContractStatus, CreateContractResponse } from "@/types/leaseContractTypes";
import { format } from "date-fns";
import { AttachmentPreview } from "@/components/attachments/AttachmentPreview";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { AttachmentThumbnail } from "@/components/attachments/AttachmentThumbnail";
import { FileTypeIcon } from "@/components/attachments/FileTypeIcon";

export const LeaseContractDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State variables
  const [contract, setContract] = useState<Contract | null>(null);
  const [units, setUnits] = useState<ContractUnit[]>([]);
  const [additionalCharges, setAdditionalCharges] = useState<ContractAdditionalCharge[]>([]);
  const [attachments, setAttachments] = useState<ContractAttachment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);

  // Form states
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusUpdateComments, setStatusUpdateComments] = useState("");

  // Loading states for actions
  const [actionLoading, setActionLoading] = useState(false);

  // Attachment preview states
  const [previewAttachment, setPreviewAttachment] = useState<ContractAttachment | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialAttachmentId, setInitialAttachmentId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchContractData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const contractData = await contractService.getContractById(parseInt(id));

        if (contractData.contract) {
          setContract(contractData.contract);
          setUnits(contractData.units);
          setAdditionalCharges(contractData.additionalCharges);
          setAttachments(contractData.attachments);
        } else {
          setError("Contract not found");
          toast.error("Contract not found");
        }
      } catch (err) {
        console.error("Error fetching contract:", err);
        setError("Failed to load contract details");
        toast.error("Failed to load contract details");
      } finally {
        setLoading(false);
      }
    };

    fetchContractData();
  }, [id]);

  // Format date for display
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "PPP");
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return contractService.formatAmount(amount);
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      [ContractStatus.DRAFT]: { variant: "secondary" as const, icon: FileText, className: "bg-gray-100 text-gray-800" },
      [ContractStatus.ACTIVE]: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" },
      [ContractStatus.APPROVED]: { variant: "default" as const, icon: Check, className: "bg-blue-100 text-blue-800" },
      [ContractStatus.EXPIRED]: { variant: "destructive" as const, icon: Clock, className: "bg-red-100 text-red-800" },
      [ContractStatus.TERMINATED]: { variant: "destructive" as const, icon: XCircle, className: "bg-orange-100 text-orange-800" },
      [ContractStatus.CANCELLED]: { variant: "destructive" as const, icon: X, className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[ContractStatus.DRAFT];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Action handlers
  const handleEdit = () => {
    if (contract) {
      navigate(`/contracts/edit/${contract.ContractID}`);
    }
  };

  const handleDelete = async () => {
    if (!contract) return;

    setActionLoading(true);
    try {
      const result = await contractService.deleteContract(contract.ContractID);
      if (result.success) {
        toast.success(result.message || "Contract deleted successfully");
        navigate("/contracts");
      } else {
        toast.error(result.message || "Failed to delete contract");
      }
    } catch (err) {
      console.error("Error deleting contract:", err);
      toast.error("Failed to delete contract");
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!contract || !newStatus) return;

    setActionLoading(true);
    try {
      const result = await contractService.updateContractStatus({
        ContractID: contract.ContractID,
        ContractStatus: newStatus,
      });

      if (result.success) {
        toast.success(result.message || "Contract status updated successfully");
        setContract({ ...contract, ContractStatus: newStatus });
        setStatusUpdateDialogOpen(false);
        setNewStatus("");
        setStatusUpdateComments("");
      } else {
        toast.error(result.message || "Failed to update contract status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update contract status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadAttachment = (attachment: ContractAttachment) => {
    if (attachment.fileUrl) {
      const link = document.createElement("a");
      link.href = attachment.fileUrl;
      link.download = attachment.DocumentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error("File not available for download");
    }
  };

  const handleViewAttachment = (attachment: ContractAttachment) => {
    if (attachment.fileUrl) {
      window.open(attachment.fileUrl, "_blank");
    } else {
      toast.error("File not available for viewing");
    }
  };

  const openAttachmentPreview = (attachment: ContractAttachment) => {
    setPreviewAttachment(attachment);
    setPreviewOpen(true);
  };

  const openAttachmentGallery = (attachmentId?: number) => {
    setInitialAttachmentId(attachmentId);
    setGalleryOpen(true);
  };

  const handleCopyContractNo = () => {
    if (contract?.ContractNo) {
      navigator.clipboard.writeText(contract.ContractNo);
      toast.success("Contract number copied to clipboard");
    }
  };

  // Calculate totals
  const unitsTotal = units.reduce((sum, unit) => sum + unit.TotalAmount, 0);
  const chargesTotal = additionalCharges.reduce((sum, charge) => sum + charge.TotalAmount, 0);
  const grandTotal = unitsTotal + chargesTotal;

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

  if (error || !contract) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-red-500 mb-4">{error || "Contract not found"}</p>
            <Button onClick={() => navigate("/contracts")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Contracts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine available actions based on status
  const canEdit = contract.ContractStatus === ContractStatus.DRAFT || contract.ContractStatus === ContractStatus.APPROVED;
  const canDelete = contract.ContractStatus === ContractStatus.DRAFT || contract.ContractStatus === ContractStatus.APPROVED;
  const canChangeStatus = true; // Allow status changes for all contracts
  const canActivate = contract.ContractStatus === ContractStatus.APPROVED;
  const canApprove = contract.ContractStatus === ContractStatus.DRAFT;

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Contract Details</CardTitle>
            <CardDescription>View and manage lease contract information</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/contracts")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {canEdit && (
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Contract Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex items-center justify-center md:justify-start">
              <div className="h-24 w-24 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{contract.ContractNo}</h2>
                  <Button variant="ghost" size="sm" onClick={handleCopyContractNo}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {renderStatusBadge(contract.ContractStatus)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Customer:</span>
                  <span>{contract.CustomerFullName}</span>
                  {contract.CustomerNo && <span className="text-muted-foreground">({contract.CustomerNo})</span>}
                </div>
                {contract.JointCustomerName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Joint Customer:</span>
                    <span>{contract.JointCustomerName}</span>
                    {contract.JointCustomerNo && <span className="text-muted-foreground">({contract.JointCustomerNo})</span>}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Transaction Date:</span>
                  <span>{formatDate(contract.TransactionDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Grand Total:</span>
                  <span className="text-lg font-semibold text-green-600">{formatCurrency(contract.GrandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contract Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contract Summary</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Contract No:</span>
                  <span className="font-mono">{contract.ContractNo}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Status:</span>
                  {renderStatusBadge(contract.ContractStatus)}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Transaction Date:</span>
                  <span>{formatDate(contract.TransactionDate)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Units Total:</span>
                  <span className="font-medium">{formatCurrency(contract.TotalAmount)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Additional Charges:</span>
                  <span className="font-medium">{formatCurrency(contract.AdditionalCharges)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Grand Total:</span>
                  <span className="font-bold text-green-600">{formatCurrency(contract.GrandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Customer Information</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Primary Customer:</span>
                  <span>{contract.CustomerFullName}</span>
                </div>
                {contract.CustomerNo && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Customer No:</span>
                    <span>{contract.CustomerNo}</span>
                  </div>
                )}
                {contract.JointCustomerName && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Joint Customer:</span>
                    <span>{contract.JointCustomerName}</span>
                  </div>
                )}
                {contract.JointCustomerNo && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Joint Customer No:</span>
                    <span>{contract.JointCustomerNo}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Contract Items:</span>
                  <div className="text-sm">
                    <div>{units.length} unit(s)</div>
                    <div>{additionalCharges.length} additional charge(s)</div>
                    <div>{attachments.length} attachment(s)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Remarks */}
          {contract.Remarks && (
            <>
              <Separator className="my-6" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Remarks</h3>
                <p className="p-4 bg-gray-50 rounded-md">{contract.Remarks}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contract Details Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="units">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="units">Units ({units.length})</TabsTrigger>
              <TabsTrigger value="charges">Additional Charges ({additionalCharges.length})</TabsTrigger>
              <TabsTrigger value="attachments">Attachments ({attachments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="units" className="mt-6">
              {units.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building className="mx-auto h-12 w-12 mb-4" />
                  <p>No units associated with this contract.</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit Details</TableHead>
                        <TableHead>Contract Period</TableHead>
                        <TableHead>Rent Details</TableHead>
                        <TableHead>Tax Information</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {units.map((unit) => (
                        <TableRow key={unit.ContractUnitID}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{unit.UnitNo}</div>
                              <div className="text-sm text-muted-foreground">{unit.PropertyName}</div>
                              {unit.FloorName && <div className="text-sm text-muted-foreground">Floor: {unit.FloorName}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                <span className="font-medium">From:</span> {formatDate(unit.FromDate)}
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">To:</span> {formatDate(unit.ToDate)}
                              </div>
                              {unit.CommencementDate && (
                                <div className="text-sm">
                                  <span className="font-medium">Commencement:</span> {formatDate(unit.CommencementDate)}
                                </div>
                              )}
                              {unit.ContractDays && <div className="text-sm text-muted-foreground">{unit.ContractDays} days</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                <span className="font-medium">Monthly:</span> {formatCurrency(unit.RentPerMonth)}
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Yearly:</span> {formatCurrency(unit.RentPerYear)}
                              </div>
                              {unit.NoOfInstallments && <div className="text-sm text-muted-foreground">{unit.NoOfInstallments} installments</div>}
                              {unit.RentFreeAmount && unit.RentFreeAmount > 0 && <div className="text-sm text-green-600">Rent free: {formatCurrency(unit.RentFreeAmount)}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {unit.TaxPercentage && unit.TaxPercentage > 0 ? (
                              <div className="space-y-1">
                                <div className="text-sm">Tax: {unit.TaxPercentage}%</div>
                                {unit.TaxAmount && <div className="text-sm">Amount: {formatCurrency(unit.TaxAmount)}</div>}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No tax</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium">{formatCurrency(unit.TotalAmount)}</div>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold bg-muted/20">
                        <TableCell colSpan={4}>Units Total</TableCell>
                        <TableCell className="text-right">{formatCurrency(unitsTotal)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="charges" className="mt-6">
              {additionalCharges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="mx-auto h-12 w-12 mb-4" />
                  <p>No additional charges for this contract.</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Charge Details</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Tax</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {additionalCharges.map((charge) => (
                        <TableRow key={charge.ContractAdditionalChargeID}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{charge.ChargesName}</div>
                              <div className="text-sm text-muted-foreground">{charge.ChargesCode}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{charge.Description || "—"}</div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(charge.Amount)}</TableCell>
                          <TableCell className="text-right">
                            {charge.TaxPercentage && charge.TaxPercentage > 0 ? (
                              <div>
                                <div className="text-sm">{charge.TaxPercentage}%</div>
                                {charge.TaxAmount && <div className="text-sm">{formatCurrency(charge.TaxAmount)}</div>}
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium">{formatCurrency(charge.TotalAmount)}</div>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold bg-muted/20">
                        <TableCell colSpan={4}>Additional Charges Total</TableCell>
                        <TableCell className="text-right">{formatCurrency(chargesTotal)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="attachments" className="mt-6">
              {attachments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Paperclip className="mx-auto h-12 w-12 mb-4" />
                  <p>No attachments for this contract.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <Button variant="outline" onClick={() => openAttachmentGallery()}>
                      <FileText className="mr-2 h-4 w-4" />
                      View All Documents
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attachments.map((attachment) => (
                      <Card key={attachment.ContractAttachmentID} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <AttachmentThumbnail
                              fileUrl={attachment.fileUrl}
                              fileName={attachment.DocumentName || "Document"}
                              fileType={attachment.FileContentType}
                              onClick={() => attachment.fileUrl && openAttachmentPreview(attachment)}
                            />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center">
                                <span className="font-medium">{attachment.DocumentName}</span>
                                {attachment.DocTypeName && <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100">{attachment.DocTypeName}</Badge>}
                              </div>
                              <div className="text-sm space-y-1">
                                {attachment.DocIssueDate && (
                                  <div className="flex items-center text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                    Issue: {formatDate(attachment.DocIssueDate)}
                                  </div>
                                )}
                                {attachment.DocExpiryDate && (
                                  <div className="flex items-center text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                    Expiry: {formatDate(attachment.DocExpiryDate)}
                                  </div>
                                )}
                                {attachment.Remarks && <div className="text-muted-foreground mt-1">{attachment.Remarks}</div>}
                              </div>

                              {/* Document preview and download buttons */}
                              {attachment.fileUrl && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Button variant="outline" size="sm" onClick={() => openAttachmentGallery(attachment.ContractAttachmentID)} className="h-8 px-3">
                                    <FileTypeIcon fileName={attachment.DocumentName || "Document"} fileType={attachment.FileContentType} size={14} className="mr-1.5" />
                                    Preview
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => handleDownloadAttachment(attachment)} className="h-8 px-3">
                                    <Download className="h-3.5 w-3.5 mr-1.5" />
                                    Download
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Audit Information */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium text-muted-foreground">Created By:</span>
                <span>{contract.CreatedBy || "—"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium text-muted-foreground">Created On:</span>
                <span>{formatDate(contract.CreatedOn)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium text-muted-foreground">Updated By:</span>
                <span>{contract.UpdatedBy || "—"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium text-muted-foreground">Updated On:</span>
                <span>{contract.UpdatedOn ? formatDate(contract.UpdatedOn) : "—"}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium text-muted-foreground">Contract Summary:</span>
                <div className="text-sm">
                  <div>
                    {units.length} units totaling {formatCurrency(unitsTotal)}
                  </div>
                  <div>
                    {additionalCharges.length} charges totaling {formatCurrency(chargesTotal)}
                  </div>
                  <div className="font-medium">Grand total: {formatCurrency(grandTotal)}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="flex flex-wrap justify-center gap-2 pt-6">
          {canApprove && (
            <Button onClick={() => contractService.approveContract(contract.ContractID)} className="bg-blue-600 hover:bg-blue-700">
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          )}
          {canActivate && (
            <Button onClick={() => contractService.activateContract(contract.ContractID)} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              Activate
            </Button>
          )}
          {canChangeStatus && (
            <Button variant="outline" onClick={() => setStatusUpdateDialogOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              Change Status
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Contract"
        description={`Are you sure you want to delete contract "${contract.ContractNo}"? This will also delete all associated units, charges, and attachments. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialogOpen} onOpenChange={setStatusUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Contract Status</DialogTitle>
            <DialogDescription>Change the status of contract "{contract.ContractNo}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {contractService.getContractStatuses().map((status) => (
                    <SelectItem key={status.value} value={status.value} disabled={status.value === contract.ContractStatus}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-comments">Comments (Optional)</Label>
              <Textarea id="status-comments" placeholder="Enter status update comments" value={statusUpdateComments} onChange={(e) => setStatusUpdateComments(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={actionLoading || !newStatus}>
              {actionLoading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Update Status
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attachment Preview Dialog */}
      {previewAttachment && (
        <AttachmentPreview
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          fileUrl={previewAttachment.fileUrl}
          fileName={previewAttachment.DocumentName || "Document"}
          fileType={previewAttachment.FileContentType}
          fileSize={previewAttachment.FileSize}
          uploadDate={previewAttachment.CreatedOn}
          uploadedBy={previewAttachment.CreatedBy}
          description={previewAttachment.Remarks}
          documentType={previewAttachment.DocTypeName}
          issueDate={previewAttachment.DocIssueDate}
          expiryDate={previewAttachment.DocExpiryDate}
        />
      )}

      {/* Attachment Gallery Dialog */}
      {attachments.length > 0 && (
        <AttachmentGallery isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} attachments={attachments} initialAttachmentId={initialAttachmentId} />
      )}
    </div>
  );
};

export default LeaseContractDetails;
