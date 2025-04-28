// src/pages/contract/ContractDetails.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { contractService, Contract, ContractUnit, ContractAdditionalCharge, ContractAttachment } from "@/services/contractService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit2, Trash2, FileText, Building, Calendar, Users, DollarSign, Download, PlusCircle, Info, Home, Tag, Eye, Image, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [selectedAttachment, setSelectedAttachment] = useState<ContractAttachment | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

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

  const openAttachmentPreview = (attachment: ContractAttachment) => {
    setSelectedAttachment(attachment);
    setIsPreviewDialogOpen(true);
  };

  const closeAttachmentPreview = () => {
    setIsPreviewDialogOpen(false);
    setSelectedAttachment(null);
  };

  // Check if the attachment is an image or PDF for preview
  const isPreviewable = (attachment: ContractAttachment) => {
    if (!attachment.FileContentType) return false;
    return attachment.FileContentType.startsWith("image/") || attachment.FileContentType === "application/pdf";
  };

  // Get file type icon
  const getFileIcon = (contentType?: string, fileName?: string) => {
    if (!contentType) {
      // Try to determine type from filename if available
      if (fileName) {
        const extension = fileName.split(".").pop()?.toLowerCase();
        if (["pdf"].includes(extension || "")) return <FileText className="h-16 w-16 text-red-500" />;
        if (["doc", "docx"].includes(extension || "")) return <FileText className="h-16 w-16 text-blue-500" />;
        if (["xls", "xlsx"].includes(extension || "")) return <FileText className="h-16 w-16 text-green-500" />;
        if (["jpg", "jpeg", "png", "gif"].includes(extension || "")) return <Image className="h-16 w-16 text-purple-500" />;
      }
      return <FileText className="h-16 w-16 text-muted-foreground" />;
    }

    if (contentType.startsWith("image/")) return <Image className="h-16 w-16 text-purple-500" />;
    if (contentType === "application/pdf") return <FileText className="h-16 w-16 text-red-500" />;
    if (contentType.includes("word") || contentType.includes("document")) return <FileText className="h-16 w-16 text-blue-500" />;
    if (contentType.includes("excel") || contentType.includes("spreadsheet")) return <FileText className="h-16 w-16 text-green-500" />;

    return <FileText className="h-16 w-16 text-muted-foreground" />;
  };

  // Contract renewal functions
  const handleRenewContract = async () => {
    if (!contract) return;

    // Open confirmation dialog
    setIsRenewDialogOpen(true);
  };

  const executeContractRenewal = async () => {
    if (!contract) return;

    try {
      setIsRenewing(true);

      // Create a copy of the current contract
      const renewalData = {
        contract: {
          ContractNo: "", // Will be auto-generated
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
          // Calculate new dates based on renewal period
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
        attachments: [], // Don't copy attachments to the renewal
      };

      // Create new contract with the renewal data
      const response = await contractService.createContract(renewalData);

      if (response.Status === 1 && response.NewContractID) {
        toast.success("Contract renewed successfully");
        // Navigate to the new contract
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
          <div className="relative">
            <Button variant="outline" onClick={() => setStatusDropdownOpen(!statusDropdownOpen)} onBlur={() => setTimeout(() => setStatusDropdownOpen(false), 100)}>
              Change Status
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            {statusDropdownOpen && (
              <div className="absolute right-0 top-10 z-10 w-56 rounded-md border border-gray-100  shadow-lg">
                {contractStatusOptions
                  .filter((status) => status !== contract.ContractStatus)
                  .map((status) => (
                    <button
                      key={status}
                      className="block w-full px-4 py-2 text-left text-sm "
                      onClick={() => {
                        openStatusChangeDialog(status);
                        setStatusDropdownOpen(false);
                      }}
                    >
                      Set as {status}
                    </button>
                  ))}
              </div>
            )}
          </div>
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
                        <TableRow key={attachment.ContractAttachmentID}>
                          <TableCell>
                            <div className="font-medium">{attachment.DocumentName}</div>
                          </TableCell>
                          <TableCell>{attachment.DocTypeName}</TableCell>
                          <TableCell>{attachment.DocIssueDate ? formatDate(attachment.DocIssueDate) : "N/A"}</TableCell>
                          <TableCell>{attachment.DocExpiryDate ? formatDate(attachment.DocExpiryDate) : "N/A"}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {attachment.FileContentType && (
                                <Button variant="outline" size="sm" onClick={() => openAttachmentPreview(attachment)} className="flex items-center gap-1">
                                  {isPreviewable(attachment) ? (
                                    <>
                                      <Eye className="h-4 w-4" /> Preview
                                    </>
                                  ) : (
                                    <>
                                      {getFileIcon(attachment.FileContentType, attachment.DocumentName)}
                                      <span>View File Info</span>
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!attachment.FileContent}
                                onClick={() => {
                                  if (attachment.fileUrl) {
                                    // Create an anchor element and trigger download
                                    const link = document.createElement("a");
                                    link.href = attachment.fileUrl;
                                    link.download = attachment.DocumentName || "document";
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }
                                }}
                              >
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
                <div className="text-center py-8 text-muted-foreground">No attachments have been added to this contract.</div>
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

      {/* Document Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={closeAttachmentPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAttachment && getFileIcon(selectedAttachment.FileContentType, selectedAttachment.DocumentName)}
              <span>{selectedAttachment?.DocumentName}</span>
            </DialogTitle>
            {selectedAttachment?.DocTypeID && (
              <DialogDescription>
                Document Type: {selectedAttachment.DocTypeName}
                {selectedAttachment.DocIssueDate && <span className="ml-4">Issued: {formatDate(selectedAttachment.DocIssueDate)}</span>}
                {selectedAttachment.DocExpiryDate && (
                  <span className="ml-4">
                    Expires: {formatDate(selectedAttachment.DocExpiryDate)}
                    {new Date(selectedAttachment.DocExpiryDate) < new Date() && (
                      <Badge variant="destructive" className="ml-2">
                        Expired
                      </Badge>
                    )}
                  </span>
                )}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="h-[60vh] overflow-auto flex items-center justify-center p-4 bg-muted/50">
            {selectedAttachment && selectedAttachment.fileUrl ? (
              selectedAttachment.FileContentType?.startsWith("image/") ? (
                <img src={selectedAttachment.fileUrl} alt={selectedAttachment.DocumentName} className="max-w-full max-h-full object-contain" />
              ) : selectedAttachment.FileContentType === "application/pdf" ? (
                <iframe src={selectedAttachment.fileUrl} className="w-full h-full" title={selectedAttachment.DocumentName} />
              ) : (
                <div className="text-center">
                  {getFileIcon(selectedAttachment.FileContentType, selectedAttachment.DocumentName)}
                  <p className="mt-2">Preview not available for this file type</p>
                  <p className="text-sm text-muted-foreground">File type: {selectedAttachment.FileContentType}</p>
                  {selectedAttachment.FileSize && <p className="text-sm text-muted-foreground">Size: {(selectedAttachment.FileSize / 1024).toFixed(2)} KB</p>}
                </div>
              )
            ) : (
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="mt-2">No file content available</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <div>
              {selectedAttachment?.fileUrl && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedAttachment.fileUrl) {
                      const link = document.createElement("a");
                      link.href = selectedAttachment.fileUrl;
                      link.download = selectedAttachment.DocumentName || "document";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={closeAttachmentPreview}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

// Import ChevronDown icon
import { ChevronDown } from "lucide-react";

export default ContractDetails;
