// src/pages/contract/ContractDetails.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { contractService, Contract, ContractUnit, ContractAdditionalCharge, ContractAttachment } from "@/services/contractService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit2, Trash2, FileText, Building, Calendar, Users, DollarSign, Download, PlusCircle, Info, Home, Tag } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

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
            <Button variant="outline" onClick={() => {}}>
              Change Status
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <div className="absolute right-0 top-10 z-10 w-56 rounded-md border border-gray-100 bg-white shadow-lg">
              {contractStatusOptions
                .filter((status) => status !== contract.ContractStatus)
                .map((status) => (
                  <button key={status} className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100" onClick={() => openStatusChangeDialog(status)}>
                    Set as {status}
                  </button>
                ))}
            </div>
          </div>
          <Button variant="outline" onClick={handleEdit}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
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

// Import ChevronDown icon
import { ChevronDown } from "lucide-react";

export default ContractDetails;
