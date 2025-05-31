// src/pages/paymentVoucher/PaymentVoucherList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Plus, ChevronDown, FileText, DollarSign, CreditCard, AlertTriangle, Check, Clock, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { paymentVoucherService, PaymentVoucher, PaymentStatus, PaymentType } from "@/services/paymentVoucherService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const PaymentVoucherList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentVouchers, setPaymentVouchers] = useState<PaymentVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<PaymentVoucher | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>("");

  // Fetch payment vouchers on component mount
  useEffect(() => {
    fetchPaymentVouchers();
  }, []);

  // Fetch all payment vouchers
  const fetchPaymentVouchers = async (search?: string, status?: string, paymentType?: string) => {
    try {
      setLoading(true);
      let vouchersData: PaymentVoucher[];

      if (search || status || paymentType) {
        // If search term or filters provided, use search endpoint
        vouchersData = await paymentVoucherService.searchPaymentVouchers({
          searchText: search || "",
          filterPaymentStatus: status || undefined,
          filterPaymentType: paymentType || undefined,
        });
      } else {
        // Otherwise fetch all payment vouchers
        vouchersData = await paymentVoucherService.getAllPaymentVouchers();
      }

      setPaymentVouchers(vouchersData);
    } catch (error) {
      console.error("Error fetching payment vouchers:", error);
      toast.error("Failed to load payment vouchers");
    } finally {
      setLoading(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      fetchPaymentVouchers(value, selectedStatus, selectedPaymentType);
    }
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    fetchPaymentVouchers(searchTerm, value, selectedPaymentType);
  };

  // Handle payment type filter change
  const handlePaymentTypeChange = (value: string) => {
    setSelectedPaymentType(value);
    fetchPaymentVouchers(searchTerm, selectedStatus, value);
  };

  // Navigation handlers
  const handleAddPaymentVoucher = () => {
    navigate("/payment-vouchers/new");
  };

  const handleEditPaymentVoucher = (voucherNo: string) => {
    navigate(`/payment-vouchers/edit/${voucherNo}`);
  };

  const handleViewPaymentVoucher = (voucherNo: string) => {
    navigate(`/payment-vouchers/${voucherNo}`);
  };

  // Delete confirmation handlers
  const openDeleteDialog = (voucher: PaymentVoucher) => {
    setSelectedVoucher(voucher);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedVoucher(null);
  };

  const handleDeletePaymentVoucher = async () => {
    if (!selectedVoucher) return;

    try {
      const result = await paymentVoucherService.deletePaymentVoucher(selectedVoucher.VoucherNo);

      if (result.Status === 1) {
        setPaymentVouchers(paymentVouchers.filter((v) => v.VoucherNo !== selectedVoucher.VoucherNo));
        toast.success(result.Message);
      } else {
        toast.error(result.Message);
      }
    } catch (error) {
      console.error("Error deleting payment voucher:", error);
      toast.error("Failed to delete payment voucher");
    } finally {
      closeDeleteDialog();
    }
  };

  // Approval and posting handlers
  const handleApproveVoucher = async (voucherNo: string) => {
    try {
      const result = await paymentVoucherService.approvePaymentVoucher({ VoucherNo: voucherNo });
      if (result.Status === 1) {
        fetchPaymentVouchers(); // Refresh the list
        toast.success(result.Message);
      } else {
        toast.error(result.Message);
      }
    } catch (error) {
      console.error("Error approving payment voucher:", error);
      toast.error("Failed to approve payment voucher");
    }
  };

  const handlePostVoucher = async (voucherNo: string) => {
    try {
      const result = await paymentVoucherService.postPaymentVoucherToGL({ VoucherNo: voucherNo });
      if (result.Status === 1) {
        fetchPaymentVouchers(); // Refresh the list
        toast.success(result.Message);
      } else {
        toast.error(result.Message);
      }
    } catch (error) {
      console.error("Error posting payment voucher:", error);
      toast.error("Failed to post payment voucher");
    }
  };

  // Render payment status badge
  const renderPaymentStatus = (status: string) => {
    const statusConfig = {
      [PaymentStatus.DRAFT]: { color: "bg-gray-50 text-gray-700", icon: FileText },
      [PaymentStatus.PENDING]: { color: "bg-yellow-50 text-yellow-700", icon: Clock },
      [PaymentStatus.APPROVED]: { color: "bg-blue-50 text-blue-700", icon: Check },
      [PaymentStatus.POSTED]: { color: "bg-green-50 text-green-700", icon: Check },
      [PaymentStatus.CANCELLED]: { color: "bg-red-50 text-red-700", icon: X },
    };

    const config = statusConfig[status as PaymentStatus] || statusConfig[PaymentStatus.DRAFT];
    const IconComponent = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <IconComponent className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  };

  // Render payment type badge
  const renderPaymentType = (paymentType: string) => {
    const typeConfig = {
      [PaymentType.CASH]: { color: "bg-emerald-50 text-emerald-700", icon: DollarSign },
      [PaymentType.CHEQUE]: { color: "bg-purple-50 text-purple-700", icon: FileText },
      [PaymentType.BANK_TRANSFER]: { color: "bg-blue-50 text-blue-700", icon: CreditCard },
      [PaymentType.CREDIT_CARD]: { color: "bg-orange-50 text-orange-700", icon: CreditCard },
      [PaymentType.ONLINE_PAYMENT]: { color: "bg-indigo-50 text-indigo-700", icon: CreditCard },
    };

    const config = typeConfig[paymentType as PaymentType] || typeConfig[PaymentType.CASH];
    const IconComponent = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <IconComponent className="mr-1 h-3 w-3" />
        {paymentType}
      </Badge>
    );
  };

  // Calculate statistics
  const statistics = React.useMemo(() => {
    const totalVouchers = paymentVouchers.length;
    const totalAmount = paymentVouchers.reduce((sum, v) => sum + (v.TotalAmount || 0), 0);
    const draftCount = paymentVouchers.filter((v) => v.PaymentStatus === PaymentStatus.DRAFT).length;
    const pendingCount = paymentVouchers.filter((v) => v.PaymentStatus === PaymentStatus.PENDING).length;
    const approvedCount = paymentVouchers.filter((v) => v.PaymentStatus === PaymentStatus.APPROVED).length;
    const postedCount = paymentVouchers.filter((v) => v.PaymentStatus === PaymentStatus.POSTED).length;

    return { totalVouchers, totalAmount, draftCount, pendingCount, approvedCount, postedCount };
  }, [paymentVouchers]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Payment Vouchers</h1>
        <Button onClick={handleAddPaymentVoucher}>
          <Plus className="mr-2 h-4 w-4" />
          Add Payment Voucher
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Payment Voucher Management</CardTitle>
          <CardDescription>Manage payment vouchers and track payment status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6 gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search vouchers..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Statuses</SelectItem>
                  <SelectItem value={PaymentStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={PaymentStatus.APPROVED}>Approved</SelectItem>
                  <SelectItem value={PaymentStatus.POSTED}>Posted</SelectItem>
                  <SelectItem value={PaymentStatus.CANCELLED}>Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPaymentType} onValueChange={handlePaymentTypeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Types</SelectItem>
                  <SelectItem value={PaymentType.CASH}>Cash</SelectItem>
                  <SelectItem value={PaymentType.CHEQUE}>Cheque</SelectItem>
                  <SelectItem value={PaymentType.BANK_TRANSFER}>Bank Transfer</SelectItem>
                  <SelectItem value={PaymentType.CREDIT_CARD}>Credit Card</SelectItem>
                  <SelectItem value={PaymentType.ONLINE_PAYMENT}>Online Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Vouchers</span>
                </div>
                <div className="text-2xl font-bold">{statistics.totalVouchers}</div>
                <div className="text-xs text-muted-foreground">Amount: ${formatCurrency(statistics.totalAmount)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-muted-foreground">Pending Approval</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">{statistics.pendingCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Ready to Post</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{statistics.approvedCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Posted</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{statistics.postedCount}</div>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : paymentVouchers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedStatus || selectedPaymentType ? "No payment vouchers found matching your criteria." : "No payment vouchers found."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Voucher No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Payment Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentVouchers.map((voucher) => (
                    <TableRow key={voucher.VoucherNo}>
                      <TableCell>
                        <div className="font-medium">{voucher.VoucherNo}</div>
                        <div className="text-sm text-muted-foreground">{voucher.CompanyName}</div>
                      </TableCell>
                      <TableCell>
                        <div>{format(new Date(voucher.TransactionDate), "MMM dd, yyyy")}</div>
                        {voucher.PostingDate && <div className="text-sm text-muted-foreground">Posted: {format(new Date(voucher.PostingDate), "MMM dd")}</div>}
                      </TableCell>
                      <TableCell>
                        {voucher.SupplierName ? (
                          <div>
                            <div className="font-medium">{voucher.SupplierName}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No supplier</span>
                        )}
                      </TableCell>
                      <TableCell>{renderPaymentType(voucher.PaymentType)}</TableCell>
                      <TableCell>{renderPaymentStatus(voucher.PaymentStatus)}</TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">${formatCurrency(voucher.TotalAmount)}</div>
                        {voucher.CurrencyName && <div className="text-sm text-muted-foreground">{voucher.CurrencyName}</div>}
                      </TableCell>
                      <TableCell>
                        {voucher.ReferenceNo ? (
                          <div>
                            <div className="text-sm">{voucher.ReferenceType}</div>
                            <div className="text-sm text-muted-foreground">{voucher.ReferenceNo}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewPaymentVoucher(voucher.VoucherNo)}>View details</DropdownMenuItem>
                            {(voucher.PaymentStatus === PaymentStatus.DRAFT || voucher.PaymentStatus === PaymentStatus.PENDING) && (
                              <DropdownMenuItem onClick={() => handleEditPaymentVoucher(voucher.VoucherNo)}>Edit</DropdownMenuItem>
                            )}
                            {voucher.PaymentStatus === PaymentStatus.PENDING && (
                              <DropdownMenuItem onClick={() => handleApproveVoucher(voucher.VoucherNo)}>Approve</DropdownMenuItem>
                            )}
                            {voucher.PaymentStatus === PaymentStatus.APPROVED && (
                              <DropdownMenuItem onClick={() => handlePostVoucher(voucher.VoucherNo)}>Post to GL</DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {(voucher.PaymentStatus === PaymentStatus.DRAFT || voucher.PaymentStatus === PaymentStatus.PENDING) && (
                              <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(voucher)}>
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeletePaymentVoucher}
        title="Delete Payment Voucher"
        description={
          selectedVoucher
            ? `Are you sure you want to delete payment voucher "${selectedVoucher.VoucherNo}"? This action cannot be undone.`
            : "Are you sure you want to delete this payment voucher?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default PaymentVoucherList;
