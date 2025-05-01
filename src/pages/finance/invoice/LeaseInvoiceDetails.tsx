// src/pages/invoice/LeaseInvoiceDetails.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { leaseInvoiceService } from "@/services/leaseInvoiceService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit2, Trash2, FileText, Calendar, Users, DollarSign, Download, PlusCircle, Info, Receipt, Building, Tag, CheckCircle, Loader2 } from "lucide-react";
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
import { LeaseInvoice, PaymentAllocation } from "@/types/leaseInvoiceTypes";

const LeaseInvoiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<LeaseInvoice | null>(null);
  const [paymentAllocations, setPaymentAllocations] = useState<PaymentAllocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = useState(false);
  const [isPostingDialogOpen, setIsPostingDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState("details");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Invoice status options
  const invoiceStatusOptions = ["Draft", "Posted", "Paid", "Partially Paid", "Cancelled", "Void"];

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!id) {
        navigate("/invoices");
        return;
      }

      try {
        setLoading(true);
        const data = await leaseInvoiceService.getInvoiceById(parseInt(id));

        if (data.invoice) {
          setInvoice(data.invoice);
          setPaymentAllocations(data.paymentAllocations);
        } else {
          toast.error("Invoice not found");
          navigate("/invoices");
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
        toast.error("Failed to load invoice data");
        navigate("/invoices");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [id, navigate]);

  const handleEdit = () => {
    if (!invoice) return;
    navigate(`/invoices/edit/${invoice.InvoiceID}`);
  };

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!invoice) return;

    try {
      const response = await leaseInvoiceService.deleteInvoice(invoice.InvoiceID);

      if (response.Status === 1) {
        toast.success("Invoice deleted successfully");
        navigate("/invoices");
      } else {
        toast.error(response.Message || "Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
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
    if (!invoice || !selectedStatus) return;

    try {
      const response = await leaseInvoiceService.updateInvoiceStatus(invoice.InvoiceID, selectedStatus);

      if (response.Status === 1) {
        setInvoice({
          ...invoice,
          InvoiceStatus: selectedStatus,
        });
        toast.success(`Invoice status changed to ${selectedStatus}`);
      } else {
        toast.error(response.Message || "Failed to change invoice status");
      }
    } catch (error) {
      console.error("Error changing invoice status:", error);
      toast.error("Failed to change invoice status");
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
    if (!invoice) return;

    try {
      const response = await leaseInvoiceService.createFinancialPosting(invoice.InvoiceID);

      if (response.Status === 1) {
        setInvoice({
          ...invoice,
          PostingID: response.PostingID,
          PostingStatus: "Posted",
        });
        toast.success("Invoice posted to financial system successfully");
      } else {
        toast.error(response.Message || "Failed to post invoice to financial system");
      }
    } catch (error) {
      console.error("Error posting invoice to financial system:", error);
      toast.error("Failed to post invoice to financial system");
    } finally {
      closePostingDialog();
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
      case "Paid":
        return "default";
      case "Draft":
        return "secondary";
      case "Posted":
        return "outline";
      case "Partially Paid":
        return "outline"; // Map "warning" to a supported variant
      case "Cancelled":
      case "Void":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Determine if invoice is overdue
  const isOverdue = () => {
    if (!invoice) return false;
    if (invoice.InvoiceStatus === "Paid") return false;
    if (!invoice.DueDate) return false;

    const dueDate = new Date(invoice.DueDate);
    const today = new Date();
    return dueDate < today;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl">Invoice not found</h2>
        <Button className="mt-4" onClick={() => navigate("/invoices")}>
          Back to invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Invoice {invoice.InvoiceNo}</h1>
          <div className="ml-2">
            <Badge variant={getStatusColor(invoice.InvoiceStatus)}>{invoice.InvoiceStatus}</Badge>
            {isOverdue() && (
              <Badge variant="destructive" className="ml-2">
                Overdue
              </Badge>
            )}
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
                {invoiceStatusOptions
                  .filter((status) => status !== invoice.InvoiceStatus)
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

          {invoice.InvoiceStatus === "Posted" && !invoice.PostingID && (
            <Button variant="outline" onClick={openPostingDialog}>
              <DollarSign className="mr-2 h-4 w-4" />
              Post to Financial System
            </Button>
          )}

          <Button variant="outline" onClick={handleEdit} disabled={invoice.InvoiceStatus !== "Draft"}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </Button>

          <Button variant="destructive" onClick={openDeleteDialog} disabled={invoice.InvoiceStatus !== "Draft"}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="payments">Payments ({paymentAllocations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                Invoice Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Invoice Number</h3>
                    <p className="text-base">{invoice.InvoiceNo}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div>
                      <Badge variant={getStatusColor(invoice.InvoiceStatus)} className="mt-1">
                        {invoice.InvoiceStatus}
                      </Badge>
                      {isOverdue() && (
                        <Badge variant="destructive" className="ml-2 mt-1">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Invoice Type</h3>
                    <p className="text-base">{invoice.InvoiceType}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Invoice Date</h3>
                    <p className="text-base">{formatDate(invoice.InvoiceDate)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                    <p className={`text-base ${isOverdue() ? "font-bold text-red-600" : ""}`}>{formatDate(invoice.DueDate)}</p>
                  </div>

                  {invoice.InvoicePeriodFrom && invoice.InvoicePeriodTo && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Invoice Period</h3>
                      <p className="text-base">
                        {formatDate(invoice.InvoicePeriodFrom)} - {formatDate(invoice.InvoicePeriodTo)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                    <p className="text-base font-medium">{invoice.CustomerFullName}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contract</h3>
                    <p className="text-base">{invoice.ContractNo}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Property</h3>
                    <p className="text-base">{invoice.PropertyName}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Unit</h3>
                    <p className="text-base">{invoice.UnitNo || "Not specified"}</p>
                  </div>

                  {invoice.PostingID && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Financial Posting</h3>
                      <p className="text-base">
                        <Badge variant="outline" className="font-normal">
                          Posted (ID: {invoice.PostingID})
                        </Badge>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-4 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Invoice Amount</h3>
                  <p className="text-base font-medium">{formatCurrency(invoice.InvoiceAmount)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Tax</h3>
                  <p className="text-base font-medium">{invoice.TaxPercentage ? `${invoice.TaxPercentage}% (${formatCurrency(invoice.TaxAmount)})` : "No tax"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Additional Charges</h3>
                  <p className="text-base font-medium">{formatCurrency(invoice.AdditionalCharges || 0)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total</h3>
                  <p className="text-lg font-bold">{formatCurrency(invoice.TotalAmount)}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Paid Amount</h3>
                  <p className="text-base font-bold text-green-600">{formatCurrency(invoice.PaidAmount)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Balance</h3>
                  <p className="text-base font-bold text-red-600">{formatCurrency(invoice.BalanceAmount)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Payment Status</h3>
                  <p className="text-base">
                    {invoice.PaidAmount === 0 ? (
                      <Badge variant="destructive">Unpaid</Badge>
                    ) : invoice.BalanceAmount === 0 ? (
                      <Badge className="bg-green-500">Fully Paid</Badge>
                    ) : (
                      <Badge variant="outline">Partially Paid</Badge>
                    )}
                  </p>
                </div>
              </div>

              {invoice.Notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                    <p className="text-base mt-1">{invoice.Notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Created By</div>
                  <div>
                    {invoice.CreatedBy} {invoice.CreatedOn && <span>on {formatDate(invoice.CreatedOn)}</span>}
                  </div>
                </div>
                {invoice.UpdatedBy && (
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Last Updated By</div>
                    <div>
                      {invoice.UpdatedBy} {invoice.UpdatedOn && <span>on {formatDate(invoice.UpdatedOn)}</span>}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Receipt className="mr-2 h-5 w-5 text-muted-foreground" />
                Payment Allocations
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate(`/receipts/new?invoiceId=${invoice.InvoiceID}`)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Payment
              </Button>
            </CardHeader>
            <CardContent>
              {paymentAllocations.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentAllocations.map((payment) => (
                        <TableRow key={payment.ReceiptID}>
                          <TableCell>
                            <div className="font-medium">{payment.ReceiptNo}</div>
                          </TableCell>
                          <TableCell>{formatDate(payment.ReceiptDate)}</TableCell>
                          <TableCell>{payment.PaymentMethod}</TableCell>
                          <TableCell>{payment.PaymentReference || "N/A"}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(payment.AllocatedAmount)}</TableCell>
                          <TableCell>
                            <Badge variant={payment.IsCleared ? "default" : "outline"}>{payment.IsCleared ? "Cleared" : "Pending"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/receipts/${payment.ReceiptID}`)}>
                              View Receipt
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} className="text-right font-bold">
                          Total Paid:
                        </TableCell>
                        <TableCell className="font-bold text-green-600">{formatCurrency(invoice.PaidAmount)}</TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={4} className="text-right font-bold">
                          Balance:
                        </TableCell>
                        <TableCell className="font-bold text-red-600">{formatCurrency(invoice.BalanceAmount)}</TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No payments have been recorded for this invoice.</div>
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
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice "${invoice.InvoiceNo}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />

      {/* Confirmation Dialog for Status Change */}
      <ConfirmationDialog
        isOpen={isStatusChangeDialogOpen}
        onClose={closeStatusChangeDialog}
        onConfirm={handleStatusChange}
        title="Change Invoice Status"
        description={`Are you sure you want to change the status of invoice "${invoice.InvoiceNo}" to "${selectedStatus}"?`}
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
        description={`Are you sure you want to post invoice "${invoice.InvoiceNo}" to the financial system? This will create the corresponding accounting entries.`}
        cancelText="Cancel"
        confirmText="Post Invoice"
        type="warning"
      />
    </div>
  );
};

export default LeaseInvoiceDetails;
