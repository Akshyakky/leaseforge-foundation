// src/pages/contract/ContractDetails.tsx - Updated with Contract Slip PDF Generation
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { contractService, Contract, ContractUnit, ContractAdditionalCharge, ContractAttachment } from "@/services/contractService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  FileText,
  Building,
  Calendar,
  Users,
  DollarSign,
  Download,
  PlusCircle,
  Info,
  Home,
  Tag,
  Eye,
  Image,
  RefreshCw,
  Loader2,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AttachmentPreview } from "@/components/attachments/AttachmentPreview";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { AttachmentThumbnail } from "@/components/attachments/AttachmentThumbnail";
import { FileTypeIcon } from "@/components/attachments/FileTypeIcon";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
// Import PDF components
import { PdfPreviewModal, PdfActionButtons } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";

const ContractDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [contract, setContract] = useState<Contract | null>(null);
  const [units, setUnits] = useState<ContractUnit[]>([]);
  const [additionalCharges, setAdditionalCharges] = useState<ContractAdditionalCharge[]>([]);
  const [attachments, setAttachments] = useState<ContractAttachment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState("details");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // PDF generation state
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const contractPdfReport = useGenericPdfReport();

  // Attachment-related state
  const [previewAttachment, setPreviewAttachment] = useState<ContractAttachment | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialAttachmentId, setInitialAttachmentId] = useState<number | undefined>(undefined);

  // Contract renewal states
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);
  const [renewalPeriod, setRenewalPeriod] = useState<{ years: number; months: number }>({ years: 1, months: 0 });
  const [isRenewing, setIsRenewing] = useState(false);

  // Contract status options
  const contractStatusOptions = ["Draft", "Pending", "Active", "Expired", "Cancelled", "Completed", "Terminated"];

  useEffect(() => {
    const fetchContractDetails = async () => {
      if (!id) {
        navigate("/contracts");
        return;
      }

      try {
        setLoading(true);
        const data = await contractService.getContractById(parseInt(id));

        if (data.contract) {
          setContract(data.contract);
          setUnits(data.units);
          setAdditionalCharges(data.additionalCharges);
          setAttachments(data.attachments);
        } else {
          toast.error("Contract not found");
          navigate("/contracts");
        }
      } catch (error) {
        console.error("Error fetching contract:", error);
        toast.error("Failed to load contract data");
        navigate("/contracts");
      } finally {
        setLoading(false);
      }
    };

    fetchContractDetails();
  }, [id, navigate]);

  // PDF Generation Handlers
  const handleGenerateContractSlip = async () => {
    if (!contract) return;

    const response = await contractPdfReport.generateReport(
      "contract-slip",
      { ContractId: contract.ContractID },
      {
        orientation: "Portrait",
        download: true,
        showToast: true,
        filename: `Contract_Slip_${contract.ContractNo}_${new Date().toISOString().split("T")[0]}.pdf`,
      }
    );

    if (response.success) {
      toast.success("Contract slip generated successfully");
    }
  };

  const handlePreviewContractSlip = async () => {
    if (!contract) return;

    setShowPdfPreview(true);
    const response = await contractPdfReport.generateReport(
      "contract-slip",
      { ContractId: contract.ContractID },
      {
        orientation: "Portrait",
        download: false,
        showToast: false,
      }
    );

    if (!response.success) {
      toast.error("Failed to generate contract slip preview");
    }
  };

  // Attachment handlers
  const openAttachmentPreview = (attachment: ContractAttachment) => {
    setPreviewAttachment(attachment);
    setPreviewOpen(true);
  };

  const openAttachmentGallery = (attachmentId?: number) => {
    setInitialAttachmentId(attachmentId);
    setGalleryOpen(true);
  };

  const handleEdit = () => {
    if (!contract) return;
    navigate(`/contracts/edit/${contract.ContractID}`);
  };

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!contract) return;

    try {
      const response = await contractService.deleteContract(contract.ContractID);

      if (response.Status === 1) {
        toast.success("Contract deleted successfully");
        navigate("/contracts");
      } else {
        toast.error(response.Message || "Failed to delete contract");
      }
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast.error("Failed to delete contract");
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
    if (!contract || !selectedStatus) return;

    try {
      const response = await contractService.changeContractStatus(contract.ContractID, selectedStatus);

      if (response.Status === 1) {
        setContract({
          ...contract,
          ContractStatus: selectedStatus,
        });
        toast.success(`Contract status changed to ${selectedStatus}`);
      } else {
        toast.error(response.Message || "Failed to change contract status");
      }
    } catch (error) {
      console.error("Error changing contract status:", error);
      toast.error("Failed to change contract status");
    } finally {
      closeStatusChangeDialog();
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
      case "Active":
        return "default";
      case "Draft":
        return "secondary";
      case "Pending":
        return "outline";
      case "Completed":
        return "default";
      case "Expired":
      case "Cancelled":
      case "Terminated":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Contract renewal functions
  const handleRenewContract = async () => {
    if (!contract) return;
    setIsRenewDialogOpen(true);
  };

  const executeContractRenewal = async () => {
    if (!contract) return;

    try {
      setIsRenewing(true);

      const renewalData = {
        contract: {
          ContractNo: "",
          ContractStatus: "Draft",
          CustomerID: contract.CustomerID,
          JointCustomerID: contract.JointCustomerID,
          TransactionDate: new Date(),
          TotalAmount: contract.TotalAmount,
          AdditionalCharges: contract.AdditionalCharges,
          GrandTotal: contract.GrandTotal,
          Remarks: `Renewal of contract ${contract.ContractNo}. ${contract.Remarks || ""}`,
        },
        units: units.map((unit) => {
          const fromDate = new Date();
          const toDate = new Date(fromDate);
          toDate.setFullYear(toDate.getFullYear() + renewalPeriod.years);
          toDate.setMonth(toDate.getMonth() + renewalPeriod.months);

          return {
            UnitID: unit.UnitID,
            FromDate: fromDate,
            ToDate: toDate,
            FitoutFromDate: null,
            FitoutToDate: null,
            CommencementDate: fromDate,
            ContractDays: 0,
            ContractMonths: renewalPeriod.months,
            ContractYears: renewalPeriod.years,
            RentPerMonth: unit.RentPerMonth,
            RentPerYear: unit.RentPerYear,
            NoOfInstallments: unit.NoOfInstallments,
            RentFreePeriodFrom: null,
            RentFreePeriodTo: null,
            RentFreeAmount: null,
            TaxPercentage: unit.TaxPercentage,
            TaxAmount: unit.TaxAmount,
            TotalAmount: unit.TotalAmount,
          };
        }),
        additionalCharges: additionalCharges,
        attachments: [],
      };

      const response = await contractService.createContract(renewalData);

      if (response.Status === 1 && response.NewContractID) {
        toast.success("Contract renewed successfully");
        navigate(`/contracts/${response.NewContractID}`);
      } else {
        toast.error(response.Message || "Failed to renew contract");
      }
    } catch (error) {
      console.error("Error renewing contract:", error);
      toast.error("Failed to renew contract");
    } finally {
      setIsRenewing(false);
      setIsRenewDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl">Contract not found</h2>
        <Button className="mt-4" onClick={() => navigate("/contracts")}>
          Back to contracts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/contracts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Contract {contract.ContractNo}</h1>
          <div className="ml-2">
            <Badge variant={getStatusColor(contract.ContractStatus)}>{contract.ContractStatus}</Badge>
          </div>
        </div>
        <div className="flex space-x-2">
          {/* PDF Generation Actions */}
          <div className="flex space-x-2 mr-2">
            <PdfActionButtons
              onDownload={handleGenerateContractSlip}
              onPreview={handlePreviewContractSlip}
              isLoading={contractPdfReport.isLoading}
              downloadLabel="Download Contract Slip"
              previewLabel="Preview Contract Slip"
              variant="outline"
              size="default"
            />
          </div>

          <DropdownMenu open={statusDropdownOpen} onOpenChange={setStatusDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Change Status
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {contractStatusOptions
                .filter((status) => status !== contract.ContractStatus)
                .map((status) => (
                  <DropdownMenuItem key={status} onClick={() => openStatusChangeDialog(status)}>
                    Set as {status}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={handleEdit}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleRenewContract}
            disabled={contract.ContractStatus !== "Active" && contract.ContractStatus !== "Completed" && contract.ContractStatus !== "Expired"}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Renew
          </Button>
          <Button variant="destructive" onClick={openDeleteDialog} disabled={contract.ContractStatus === "Active" || contract.ContractStatus === "Completed"}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-[400px]">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="units">Units ({units.length})</TabsTrigger>
          <TabsTrigger value="charges">Charges ({additionalCharges.length})</TabsTrigger>
          <TabsTrigger value="attachments">Attachments ({attachments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                Contract Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contract Number</h3>
                    <p className="text-base">{contract.ContractNo}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div>
                      <Badge variant={getStatusColor(contract.ContractStatus)} className="mt-1">
                        {contract.ContractStatus}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Transaction Date</h3>
                    <p className="text-base">{formatDate(contract.TransactionDate)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                    <p className="text-base font-medium">{contract.CustomerName}</p>
                  </div>

                  {contract.JointCustomerName && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Joint Customer</h3>
                      <p className="text-base">{contract.JointCustomerName}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Units Amount</h3>
                  <p className="text-base font-medium">{formatCurrency(contract.TotalAmount)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Additional Charges</h3>
                  <p className="text-base font-medium">{formatCurrency(contract.AdditionalCharges)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Grand Total</h3>
                  <p className="text-lg font-bold">{formatCurrency(contract.GrandTotal)}</p>
                </div>
              </div>

              {contract.Remarks && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Remarks</h3>
                    <p className="text-base mt-1">{contract.Remarks}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Created By</div>
                  <div>
                    {contract.CreatedBy} {contract.CreatedOn && <span>on {formatDate(contract.CreatedOn)}</span>}
                  </div>
                </div>
                {contract.UpdatedBy && (
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Last Updated By</div>
                    <div>
                      {contract.UpdatedBy} {contract.UpdatedOn && <span>on {formatDate(contract.UpdatedOn)}</span>}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5 text-muted-foreground" />
                Units
              </CardTitle>
              <Button variant="outline" size="sm" disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Unit
              </Button>
            </CardHeader>
            <CardContent>
              {units.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Rent</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {units.map((unit) => (
                        <TableRow key={unit.ContractUnitID}>
                          <TableCell>
                            <div className="font-medium">{unit.UnitNo}</div>
                            <div className="text-sm text-muted-foreground">
                              {unit.UnitTypeName} • {unit.UnitCategoryName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{unit.PropertyName}</div>
                            <div className="text-sm text-muted-foreground">Floor: {unit.FloorName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="font-medium">From:</span> {formatDate(unit.FromDate)}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">To:</span> {formatDate(unit.ToDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{formatCurrency(unit.RentPerMonth)} / month</div>
                            <div>{formatCurrency(unit.RentPerYear)} / year</div>
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(unit.TotalAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No units have been added to this contract.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charges" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-muted-foreground" />
                Additional Charges
              </CardTitle>
              <Button variant="outline" size="sm" disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Charge
              </Button>
            </CardHeader>
            <CardContent>
              {additionalCharges.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Charge</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Tax</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {additionalCharges.map((charge) => (
                        <TableRow key={charge.ContractAdditionalChargeID}>
                          <TableCell>
                            <div className="font-medium">{charge.ChargesName}</div>
                            <div className="text-sm text-muted-foreground">{charge.ChargesCode}</div>
                          </TableCell>
                          <TableCell>{charge.ChargesCategoryName}</TableCell>
                          <TableCell>{formatCurrency(charge.Amount)}</TableCell>
                          <TableCell>
                            {charge.TaxPercentage ? (
                              <div>
                                <div>{charge.TaxPercentage}%</div>
                                <div className="text-sm text-muted-foreground">{formatCurrency(charge.TaxAmount)}</div>
                              </div>
                            ) : (
                              "No tax"
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(charge.TotalAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No additional charges have been added to this contract.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                Contract Documents
              </CardTitle>
              <Button variant="outline" size="sm" disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Document
              </Button>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No documents have been attached to this contract.</p>
                  <Button variant="outline" disabled>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Document
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <Button variant="outline" onClick={() => openAttachmentGallery()}>
                      <FileText className="mr-2 h-4 w-4" />
                      View All Documents
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    Issue date: {formatDate(attachment.DocIssueDate)}
                                  </div>
                                )}
                                {attachment.DocExpiryDate && (
                                  <div className="flex items-center text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                    Expiry date: {formatDate(attachment.DocExpiryDate)}
                                  </div>
                                )}
                                {attachment.Remarks && <div className="text-muted-foreground mt-1">{attachment.Remarks}</div>}
                              </div>

                              {attachment.fileUrl && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Button variant="outline" size="sm" onClick={() => openAttachmentGallery(attachment.ContractAttachmentID)} className="h-8 px-3">
                                    <FileTypeIcon fileName={attachment.DocumentName || "Document"} fileType={attachment.FileContentType} size={14} className="mr-1.5" />
                                    Preview
                                  </Button>
                                  <a
                                    href={attachment.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={attachment.DocumentName}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                                  >
                                    <Download className="h-3.5 w-3.5 mr-1.5" />
                                    Download
                                  </a>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        pdfBlob={contractPdfReport.data}
        title={`Contract Slip - ${contract.ContractNo}`}
        isLoading={contractPdfReport.isLoading}
        error={contractPdfReport.error}
        onDownload={() => contractPdfReport.downloadCurrentPdf(`Contract_Slip_${contract.ContractNo}.pdf`)}
        onRefresh={handlePreviewContractSlip}
      />

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Contract"
        description={`Are you sure you want to delete contract "${contract.ContractNo}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />

      {/* Confirmation Dialog for Status Change */}
      <ConfirmationDialog
        isOpen={isStatusChangeDialogOpen}
        onClose={closeStatusChangeDialog}
        onConfirm={handleStatusChange}
        title="Change Contract Status"
        description={`Are you sure you want to change the status of contract "${contract.ContractNo}" to "${selectedStatus}"?`}
        cancelText="Cancel"
        confirmText="Change Status"
        type="warning"
      />

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
        <AttachmentGallery
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          attachments={attachments.map((attachment) => ({
            ...attachment,
            PostingAttachmentID: attachment.ContractAttachmentID, // Map ID for gallery compatibility
          }))}
          initialAttachmentId={initialAttachmentId}
        />
      )}

      {/* Contract Renewal Dialog */}
      <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renew Contract</DialogTitle>
            <DialogDescription>Create a new contract based on the current one with updated dates.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="years">Years</Label>
                <Input
                  id="years"
                  type="number"
                  min="0"
                  value={renewalPeriod.years}
                  onChange={(e) => setRenewalPeriod({ ...renewalPeriod, years: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="months">Months</Label>
                <Input
                  id="months"
                  type="number"
                  min="0"
                  max="11"
                  value={renewalPeriod.months}
                  onChange={(e) => setRenewalPeriod({ ...renewalPeriod, months: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Contract Details to Copy</Label>
              <div className="text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Customer information</li>
                  <li>Units with updated dates</li>
                  <li>Additional charges</li>
                  <li>Contract values and amounts</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={executeContractRenewal} disabled={isRenewing || (renewalPeriod.years === 0 && renewalPeriod.months === 0)}>
              {isRenewing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Renewing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Renew Contract
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractDetails;
