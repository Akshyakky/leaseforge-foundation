// src/pages/finance/receipt/LeaseReceiptDetails.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { leaseReceiptService } from "@/services/leaseReceiptService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  Users,
  DollarSign,
  Download,
  PlusCircle,
  Info,
  Receipt,
  Building,
  Tag,
  CheckCircle,
  Loader2,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeaseReceipt, ReceiptDetail } from "@/types/leaseReceiptTypes";
import { DatePicker } from "@/components/ui/date-picker";

const LeaseReceiptDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState<LeaseReceipt | null>(null);
  const [details, setDetails] = useState<ReceiptDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = useState(false);
  const [isPostingDialogOpen, setIsPostingDialogOpen] = useState(false);
  const [isClearingDialogOpen, setIsClearingDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState("details");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [clearingDate, setClearingDate] = useState<Date>(new Date());

  // Receipt status options
  const receiptStatusOptions = ["Draft", "Validated", "Posted", "Cleared", "Cancelled"];

  useEffect(() => {
    const fetchReceiptDetails = async () => {
      if (!id) {
        navigate("/receipts");
        return;
      }

      try {
        setLoading(true);
        const data = await leaseReceiptService.getReceiptById(parseInt(id));

        if (data.receipt) {
          setReceipt(data.receipt);
          setDetails(data.details);
        } else {
          toast.error("Receipt not found");
          navigate("/receipts");
        }
      } catch (error) {
        console.error("Error fetching receipt:", error);
        toast.error("Failed to load receipt data");
        navigate("/receipts");
      } finally {
        setLoading(false);
      }
    };

    fetchReceiptDetails();
  }, [id, navigate]);

  const handleEdit = () => {
    if (!receipt) return;
    navigate(`/receipts/edit/${receipt.ReceiptID}`);
  };

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!receipt) return;

    try {
      const response = await leaseReceiptService.deleteReceipt(receipt.ReceiptID);

      if (response.Status === 1) {
        toast.success("Receipt deleted successfully");
        navigate("/receipts");
      } else {
        toast.error(response.Message || "Failed to delete receipt");
      }
    } catch (error) {
      console.error("Error deleting receipt:", error);
      toast.error("Failed to delete receipt");
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
    if (!receipt || !selectedStatus) return;

    try {
      const response = await leaseReceiptService.changeReceiptStatus(receipt.ReceiptID, selectedStatus);

      if (response.Status === 1) {
        setReceipt({
          ...receipt,
          ReceiptStatus: selectedStatus,
        });
        toast.success(`Receipt status changed to ${selectedStatus}`);
      } else {
        toast.error(response.Message || "Failed to change receipt status");
      }
    } catch (error) {
      console.error("Error changing receipt status:", error);
      toast.error("Failed to change receipt status");
    } finally {
      closeStatusChangeDialog();
    }
  };

  const openPostingDialog = () => {
    setIsPostingDialogOpen(true);
  };

  const closePostingDialog = () => {
    setIsPostingDialogOpen(false);
  };

  const handlePostToFinancialSystem = async () => {
    if (!receipt) return;

    try {
      const response = await leaseReceiptService.postToFinancialSystem(receipt.ReceiptID);

      if (response.Status === 1) {
        setReceipt({
          ...receipt,
          PostingID: response.PostingID,
          PostingStatus: "Posted",
          ReceiptStatus: "Posted",
        });
        toast.success("Receipt posted to financial system successfully");
      } else {
        toast.error(response.Message || "Failed to post receipt to financial system");
      }
    } catch (error) {
      console.error("Error posting receipt to financial system:", error);
      toast.error("Failed to post receipt to financial system");
    } finally {
      closePostingDialog();
    }
  };

  const openClearingDialog = () => {
    setClearingDate(new Date());
    setIsClearingDialogOpen(true);
  };

  const closeClearingDialog = () => {
    setIsClearingDialogOpen(false);
  };

  const handleToggleClearingStatus = async () => {
    if (!receipt) return;

    try {
      const newClearedStatus = !receipt.IsCleared;
      const response = await leaseReceiptService.markChequeStatus(receipt.ReceiptID, newClearedStatus, newClearedStatus ? clearingDate : undefined);

      if (response.Status === 1) {
        setReceipt({
          ...receipt,
          IsCleared: newClearedStatus,
          ClearingDate: newClearedStatus ? clearingDate : undefined,
        });
        toast.success(newClearedStatus ? "Receipt marked as cleared" : "Receipt marked as uncleared");
      } else {
        toast.error(response.Message || "Failed to update clearing status");
      }
    } catch (error) {
      console.error("Error updating clearing status:", error);
      toast.error("Failed to update clearing status");
    } finally {
      closeClearingDialog();
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
      case "Cleared":
        return "default";
      case "Draft":
        return "secondary";
      case "Validated":
      case "Posted":
        return "outline";
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "Cash":
        return <DollarSign className="mr-2 h-5 w-5 text-muted-foreground" />;
      case "Cheque":
        return <FileText className="mr-2 h-5 w-5 text-muted-foreground" />;
      case "Bank Transfer":
        return <Building className="mr-2 h-5 w-5 text-muted-foreground" />;
      case "Credit Card":
      case "Debit Card":
        return <CreditCard className="mr-2 h-5 w-5 text-muted-foreground" />;
      default:
        return <Receipt className="mr-2 h-5 w-5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl">Receipt not found</h2>
        <Button className="mt-4" onClick={() => navigate("/receipts")}>
          Back to receipts
        </Button>
      </div>
    );
  }

  // Calculate allocated total
  const allocatedTotal = details.reduce((sum, detail) => sum + (detail.AllocatedAmount || 0), 0);
  const unallocatedAmount = (receipt.ReceiptAmount || 0) - allocatedTotal;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/receipts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Receipt {receipt.ReceiptNo}</h1>
          <div className="ml-2">
            <Badge variant={getStatusColor(receipt.ReceiptStatus)}>{receipt.ReceiptStatus}</Badge>
            {receipt.IsCleared && <Badge className="ml-2 bg-green-500">Cleared</Badge>}
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <Button variant="outline" onClick={() => setStatusDropdownOpen(!statusDropdownOpen)} onBlur={() => setTimeout(() => setStatusDropdownOpen(false), 100)}>
              Change Status
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            {statusDropdownOpen && (
              <div className="absolute right-0 top-10 z-10 w-56 rounded-md border border-gray-100 bg-white shadow-lg">
                {receiptStatusOptions
                  .filter((status) => status !== receipt.ReceiptStatus)
                  .map((status) => (
                    <button
                      key={status}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
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

          {receipt.PaymentMethod === "Cheque" && (
            <Button variant="outline" onClick={openClearingDialog}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {receipt.IsCleared ? "Mark as Uncleared" : "Mark as Cleared"}
            </Button>
          )}

          {receipt.ReceiptStatus === "Validated" && !receipt.PostingID && (
            <Button variant="outline" onClick={openPostingDialog}>
              <DollarSign className="mr-2 h-4 w-4" />
              Post to Financial System
            </Button>
          )}

          <Button variant="outline" onClick={handleEdit} disabled={receipt.ReceiptStatus !== "Draft"}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </Button>

          <Button variant="destructive" onClick={openDeleteDialog} disabled={receipt.ReceiptStatus !== "Draft"}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="details">Receipt Details</TabsTrigger>
          <TabsTrigger value="allocations">Invoice Allocations ({details.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {getPaymentMethodIcon(receipt.PaymentMethod)}
                Receipt Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Receipt Number</h3>
                    <p className="text-base">{receipt.ReceiptNo}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={getStatusColor(receipt.ReceiptStatus)}>{receipt.ReceiptStatus}</Badge>
                      {receipt.IsCleared && <Badge className="bg-green-500">Cleared</Badge>}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Receipt Date</h3>
                    <p className="text-base">{formatDate(receipt.ReceiptDate)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Payment Date</h3>
                    <p className="text-base">{formatDate(receipt.PaymentDate)}</p>
                  </div>

                  {receipt.IsCleared && receipt.ClearingDate && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Clearing Date</h3>
                      <p className="text-base">{formatDate(receipt.ClearingDate)}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                    <p className="text-base font-medium">{receipt.CustomerFullName}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contract</h3>
                    <p className="text-base">{receipt.ContractNo}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Payment Method</h3>
                    <p className="text-base">{receipt.PaymentMethod}</p>
                  </div>

                  {receipt.PaymentReference && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Reference</h3>
                      <p className="text-base">{receipt.PaymentReference}</p>
                    </div>
                  )}

                  {receipt.PaymentMethod === "Cheque" && (
                    <>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Bank</h3>
                        <p className="text-base">{receipt.BankName || "Not specified"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Cheque Number</h3>
                        <p className="text-base">{receipt.ChequeNo || "Not specified"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Cheque Date</h3>
                        <p className="text-base">{formatDate(receipt.ChequeDate)}</p>
                      </div>
                    </>
                  )}

                  {receipt.PostingID && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Financial Posting</h3>
                      <p className="text-base">
                        <Badge variant="outline" className="font-normal">
                          Posted (ID: {receipt.PostingID})
                        </Badge>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Receipt Amount</h3>
                  <p className="text-lg font-bold">{formatCurrency(receipt.ReceiptAmount)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Allocated Amount</h3>
                  <p className="text-base font-medium">{formatCurrency(allocatedTotal)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Unallocated Amount</h3>
                  <p className={`text-base font-medium ${unallocatedAmount > 0 ? "text-amber-500" : ""}`}>{formatCurrency(unallocatedAmount)}</p>
                </div>
              </div>

              {receipt.Notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                    <p className="text-base mt-1">{receipt.Notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Created By</div>
                  <div>
                    {receipt.CreatedBy} {receipt.CreatedOn && <span>on {formatDate(receipt.CreatedOn)}</span>}
                  </div>
                </div>
                {receipt.UpdatedBy && (
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Last Updated By</div>
                    <div>
                      {receipt.UpdatedBy} {receipt.UpdatedOn && <span>on {formatDate(receipt.UpdatedOn)}</span>}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocations" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-muted-foreground" />
                Invoice Allocations
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate(`/receipts/edit/${receipt.ReceiptID}`)} disabled={receipt.ReceiptStatus !== "Draft"}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Allocation
              </Button>
            </CardHeader>
            <CardContent>
              {details.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Invoice Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Invoice Amount</TableHead>
                        <TableHead>Allocated Amount</TableHead>
                        <TableHead>Remaining Balance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.map((detail) => (
                        <TableRow key={detail.ReceiptDetailID}>
                          <TableCell>
                            <div className="font-medium">{detail.InvoiceNo}</div>
                          </TableCell>
                          <TableCell>{formatDate(detail.InvoiceDate)}</TableCell>
                          <TableCell>{formatDate(detail.DueDate)}</TableCell>
                          <TableCell>{formatCurrency(detail.TotalAmount)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(detail.AllocatedAmount)}</TableCell>
                          <TableCell>{formatCurrency(detail.BalanceAmount)}</TableCell>
                          <TableCell>
                            <Badge variant={detail.BalanceAmount === 0 ? "default" : "outline"}>{detail.BalanceAmount === 0 ? "Fully Paid" : "Partially Paid"}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} className="text-right font-bold">
                          Total:
                        </TableCell>
                        <TableCell className="font-bold">{formatCurrency(allocatedTotal)}</TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                      {unallocatedAmount > 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-right font-bold">
                            Unallocated Amount:
                          </TableCell>
                          <TableCell className="font-bold text-amber-500">{formatCurrency(unallocatedAmount)}</TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No invoice allocations have been added to this receipt.</div>
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
        title="Delete Receipt"
        description={`Are you sure you want to delete receipt "${receipt.ReceiptNo}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />

      {/* Confirmation Dialog for Status Change */}
      <ConfirmationDialog
        isOpen={isStatusChangeDialogOpen}
        onClose={closeStatusChangeDialog}
        onConfirm={handleStatusChange}
        title="Change Receipt Status"
        description={`Are you sure you want to change the status of receipt "${receipt.ReceiptNo}" to "${selectedStatus}"?`}
        cancelText="Cancel"
        confirmText="Change Status"
        type="warning"
      />

      {/* Confirmation Dialog for Posting to Financial System */}
      <ConfirmationDialog
        isOpen={isPostingDialogOpen}
        onClose={closePostingDialog}
        onConfirm={handlePostToFinancialSystem}
        title="Post to Financial System"
        description={`Are you sure you want to post receipt "${receipt.ReceiptNo}" to the financial system? This will create the corresponding accounting entries.`}
        cancelText="Cancel"
        confirmText="Post Receipt"
        type="warning"
      />

      {/* Dialog for Clearing Status */}
      <Dialog open={isClearingDialogOpen} onOpenChange={closeClearingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{receipt.IsCleared ? "Mark Receipt as Uncleared" : "Mark Receipt as Cleared"}</DialogTitle>
            <DialogDescription>
              {receipt.IsCleared ? "This will mark the cheque as uncleared. Are you sure you want to continue?" : "Please confirm the clearing date for this cheque."}
            </DialogDescription>
          </DialogHeader>
          {!receipt.IsCleared && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clearing-date" className="text-right">
                  Clearing Date
                </Label>
                <div className="col-span-3">
                  <DatePicker value={clearingDate} onChange={setClearingDate} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeClearingDialog}>
              Cancel
            </Button>
            <Button onClick={handleToggleClearingStatus}>{receipt.IsCleared ? "Mark as Uncleared" : "Mark as Cleared"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaseReceiptDetails;
