// src/pages/lease-revenue/LeaseRevenueDetails.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft,
  Loader2,
  Building,
  Calendar,
  Calculator,
  Receipt,
  Eye,
  Download,
  History,
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  Printer,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAppSelector } from "@/lib/hooks";

// Services and Types
import { leaseRevenueService } from "@/services/leaseRevenueService";
import { contractService } from "@/services/contractService";
import { companyService } from "@/services/companyService";
import { LeaseRevenueData, PostedLeaseRevenueEntry, PostingResult } from "@/types/leaseRevenueTypes";

// PDF Components
import { PdfPreviewModal, PdfActionButtons } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const LeaseRevenueDetails: React.FC = () => {
  const { id, type } = useParams<{ id: string; type?: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [leaseRevenueItem, setLeaseRevenueItem] = useState<LeaseRevenueData | null>(null);
  const [postedEntry, setPostedEntry] = useState<PostedLeaseRevenueEntry | null>(null);
  const [relatedEntries, setRelatedEntries] = useState<PostedLeaseRevenueEntry[]>([]);
  const [contractDetails, setContractDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState("details");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  // Action states
  const [isReverseDialogOpen, setIsReverseDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // PDF generation state
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const detailsPdfReport = useGenericPdfReport();

  const isPostedEntry = type === "posted";

  useEffect(() => {
    initializeCompany();
    fetchDetails();
  }, [id, type]);

  // Initialize company data
  const initializeCompany = async () => {
    try {
      const companiesData = await companyService.getCompaniesForDropdown(true);
      if (companiesData.length > 0) {
        setSelectedCompany(companiesData[0]);
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
    }
  };

  // Fetch details based on type
  const fetchDetails = async () => {
    if (!id) {
      navigate("/lease-revenue");
      return;
    }

    setLoading(true);

    try {
      if (isPostedEntry) {
        await fetchPostedEntryDetails();
      } else {
        await fetchLeaseRevenueDetails();
      }
    } catch (error) {
      console.error("Error fetching details:", error);
      toast.error("Failed to load details");
      navigate("/lease-revenue");
    } finally {
      setLoading(false);
    }
  };

  // Fetch posted entry details
  const fetchPostedEntryDetails = async () => {
    // In a real implementation, you would have a method to get specific posted entry details
    // For now, we'll simulate this by getting entries and finding the matching one
    try {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const entries = await leaseRevenueService.getPostedEntries({
        PeriodFrom: startOfMonth,
        PeriodTo: endOfMonth,
        CompanyID: selectedCompany?.CompanyID || 0,
      });

      const entry = entries.find((e) => e.PostingID === parseInt(id!));
      if (entry) {
        setPostedEntry(entry);

        // Get related entries for the same voucher
        const related = entries.filter((e) => e.VoucherNo === entry.VoucherNo && e.PostingID !== entry.PostingID);
        setRelatedEntries(related);

        // If there's a contract unit ID, try to get contract details
        if (entry.ContractUnitID) {
          await fetchContractDetailsByUnitId(entry.ContractUnitID);
        }
      } else {
        throw new Error("Posted entry not found");
      }
    } catch (error) {
      throw error;
    }
  };

  // Fetch lease revenue details (unposted entry)
  const fetchLeaseRevenueDetails = async () => {
    // For unposted entries, we need to search through lease revenue data
    // This is a simplified approach - in practice, you might want a specific API endpoint
    try {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const data = await leaseRevenueService.getLeaseRevenueData({
        PeriodFrom: startOfMonth,
        PeriodTo: endOfMonth,
        CompanyID: selectedCompany?.CompanyID || 0,
        FiscalYearID: 1, // You would get this from the user context
      });

      const item = data.find((d) => d.ContractUnitID === parseInt(id!));
      if (item) {
        setLeaseRevenueItem(item);
        await fetchContractDetailsByUnitId(item.ContractUnitID);
      } else {
        throw new Error("Lease revenue entry not found");
      }
    } catch (error) {
      throw error;
    }
  };

  // Fetch contract details by contract unit ID
  const fetchContractDetailsByUnitId = async (contractUnitId: number) => {
    try {
      // This would require a service method to get contract details by unit ID
      // For now, we'll simulate this
      const contracts = await contractService.getAllContracts();

      // Find contract that contains this unit (simplified approach)
      const contract = contracts.find(
        (c) =>
          // This assumes you have unit information in the contract
          c.ContractID // You would need to implement proper contract-unit relationship lookup
      );

      if (contract) {
        setContractDetails(contract);
      }
    } catch (error) {
      console.error("Error fetching contract details:", error);
      // Don't throw error here as it's supplementary information
    }
  };

  // Handle reverse posting
  const handleReversePosting = async () => {
    if (!postedEntry?.VoucherNo || !selectedCompany?.CompanyID) return;

    setIsProcessing(true);

    try {
      const reversalRequest = {
        VoucherNo: postedEntry.VoucherNo,
        PostingDate: new Date(),
        CompanyID: selectedCompany.CompanyID,
      };

      const response = await leaseRevenueService.reversePosting(reversalRequest);

      if (response.Status === 1) {
        toast.success("Posting reversed successfully");
        // Refresh the details
        await fetchDetails();
      } else {
        toast.error(response.Message || "Failed to reverse posting");
      }
    } catch (error) {
      console.error("Error reversing posting:", error);
      toast.error("Failed to reverse posting");
    } finally {
      setIsProcessing(false);
      setIsReverseDialogOpen(false);
    }
  };

  // PDF generation handlers
  const handleGenerateReport = async () => {
    const entityData = isPostedEntry ? postedEntry : leaseRevenueItem;
    if (!entityData) return;

    const parameters = {
      EntityType: isPostedEntry ? "PostedEntry" : "LeaseRevenueData",
      EntityID: isPostedEntry ? postedEntry!.PostingID : leaseRevenueItem!.ContractUnitID,
      IncludeRelatedEntries: true,
      IncludeContractDetails: true,
    };

    const response = await detailsPdfReport.generateReport("lease-revenue-details", parameters, {
      orientation: "Portrait",
      download: true,
      showToast: true,
      filename: `Lease_Revenue_Details_${isPostedEntry ? (entityData as PostedLeaseRevenueEntry).PostingID : (entityData as LeaseRevenueData).ContractUnitID}_${format(
        new Date(),
        "yyyy-MM-dd"
      )}.pdf`,
    });

    if (response.success) {
      toast.success("Report generated successfully");
    }
  };

  const handlePreviewReport = async () => {
    const entityData = isPostedEntry ? postedEntry : leaseRevenueItem;
    if (!entityData) return;

    const parameters = {
      EntityType: isPostedEntry ? "PostedEntry" : "LeaseRevenueData",
      EntityID: isPostedEntry ? (postedEntry as PostedLeaseRevenueEntry).PostingID : (leaseRevenueItem as LeaseRevenueData).ContractUnitID,
      IncludeRelatedEntries: true,
      IncludeContractDetails: true,
    };

    setShowPdfPreview(true);
    const response = await detailsPdfReport.generateReport("lease-revenue-details", parameters, {
      orientation: "Portrait",
      download: false,
      showToast: false,
    });

    if (!response.success) {
      toast.error("Failed to generate report preview");
    }
  };

  // Helper functions
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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      case "Expired":
        return "bg-orange-100 text-orange-800";
      case "Cancelled":
      case "Terminated":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentEntity = isPostedEntry ? postedEntry : leaseRevenueItem;

  if (!currentEntity) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl">Entry not found</h2>
        <Button className="mt-4" onClick={() => navigate("/lease-revenue")}>
          Back to lease revenue
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/lease-revenue")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">{isPostedEntry ? "Posted Entry Details" : "Lease Revenue Details"}</h1>
          <div className="ml-2 flex items-center gap-2">
            {isPostedEntry ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Posted
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                <Clock className="h-3 w-3 mr-1" />
                Unposted
              </Badge>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          {/* PDF Generation */}
          <div className="flex space-x-2">
            <PdfActionButtons
              onDownload={handleGenerateReport}
              onPreview={handlePreviewReport}
              isLoading={detailsPdfReport.isLoading}
              downloadLabel="Download Report"
              previewLabel="Preview Report"
              variant="outline"
              size="default"
            />
          </div>

          {/* Posted Entry Actions */}
          {isPostedEntry && postedEntry && (
            <Button variant="destructive" onClick={() => setIsReverseDialogOpen(true)} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
              Reverse Posting
            </Button>
          )}

          {/* Unposted Entry Actions */}
          {!isPostedEntry && leaseRevenueItem && (
            <Button onClick={() => navigate(`/lease-revenue/posting?selected=${leaseRevenueItem.ContractUnitID}`)}>
              <Receipt className="mr-2 h-4 w-4" />
              Create Posting
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-[400px]">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="contract">Contract</TabsTrigger>
          <TabsTrigger value="calculations">Calculations</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {isPostedEntry ? (
            // Posted Entry Details
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="mr-2 h-5 w-5 text-muted-foreground" />
                  Posted Entry Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Posting ID</h3>
                      <p className="text-base">{postedEntry!.PostingID}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Voucher Number</h3>
                      <p className="text-base font-medium">{postedEntry!.VoucherNo}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Transaction Date</h3>
                      <p className="text-base">{formatDate(postedEntry!.TransactionDate)}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Posting Date</h3>
                      <p className="text-base">{formatDate(postedEntry!.PostingDate)}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Account</h3>
                      <p className="text-base font-medium">{postedEntry!.AccountName}</p>
                      <p className="text-sm text-muted-foreground">{postedEntry!.AccountCode}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Transaction Type</h3>
                      <Badge variant={postedEntry!.TransactionType === "Debit" ? "default" : "outline"}>{postedEntry!.TransactionType}</Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Amount</h3>
                      <p className="text-lg font-bold">
                        {postedEntry!.TransactionType === "Debit" ? formatCurrency(postedEntry!.DebitAmount) : formatCurrency(postedEntry!.CreditAmount)}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Unit</h3>
                      {postedEntry!.UnitNo ? (
                        <div>
                          <p className="text-base font-medium">{postedEntry!.UnitNo}</p>
                          <p className="text-sm text-muted-foreground">{postedEntry!.PropertyName}</p>
                        </div>
                      ) : (
                        <p className="text-base text-muted-foreground">Not specified</p>
                      )}
                    </div>
                  </div>
                </div>

                {postedEntry!.Description && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                      <p className="text-base mt-1">{postedEntry!.Description}</p>
                    </div>
                  </>
                )}

                {postedEntry!.Narration && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Narration</h3>
                      <p className="text-base mt-1">{postedEntry!.Narration}</p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Posted By</div>
                    <div>
                      {postedEntry!.CreatedBy} {postedEntry!.CreatedOn && <span>on {formatDate(postedEntry!.CreatedOn)}</span>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Posting Status</div>
                    <div>
                      <Badge className="bg-green-100 text-green-800">{postedEntry!.PostingStatus}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Lease Revenue Data Details
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5 text-muted-foreground" />
                  Lease Revenue Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Contract Unit ID</h3>
                      <p className="text-base">{leaseRevenueItem!.ContractUnitID}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Lease Number</h3>
                      <p className="text-base font-medium">{leaseRevenueItem!.LeaseNo}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Property</h3>
                      <p className="text-base font-medium">{leaseRevenueItem!.Property}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Unit</h3>
                      <p className="text-base">{leaseRevenueItem!.UnitNo}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                      <p className="text-base font-medium">{leaseRevenueItem!.CustomerName}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Contract Period</h3>
                      <div className="text-base">
                        <div>
                          <strong>From:</strong> {formatDate(leaseRevenueItem!.ContractStartDate)}
                        </div>
                        <div>
                          <strong>To:</strong> {formatDate(leaseRevenueItem!.ContractEndDate)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Revenue Period</h3>
                      <div className="text-base">
                        <div>
                          <strong>From:</strong> {formatDate(leaseRevenueItem!.StartDate)}
                        </div>
                        <div>
                          <strong>To:</strong> {formatDate(leaseRevenueItem!.EndDate)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Contract Status</h3>
                      <Badge className={getStatusColor(leaseRevenueItem!.ContractStatus)}>{leaseRevenueItem!.ContractStatus}</Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Posting Status</h3>
                      {leaseRevenueItem!.IsPosted ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Posted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Unposted
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {leaseRevenueItem!.Narration && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Narration</h3>
                      <p className="text-base mt-1">{leaseRevenueItem!.Narration}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Related Entries for Posted Items */}
          {isPostedEntry && relatedEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                  Related Entries (Voucher: {postedEntry!.VoucherNo})
                </CardTitle>
                <CardDescription>Other entries in the same voucher</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Transaction Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatedEntries.map((entry) => (
                        <TableRow key={entry.PostingID}>
                          <TableCell>
                            <div className="font-medium">{entry.AccountName}</div>
                            <div className="text-sm text-muted-foreground">{entry.AccountCode}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={entry.TransactionType === "Debit" ? "default" : "outline"}>{entry.TransactionType}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{entry.TransactionType === "Debit" ? formatCurrency(entry.DebitAmount) : formatCurrency(entry.CreditAmount)}</div>
                          </TableCell>
                          <TableCell>{entry.Description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contract" className="space-y-6">
          {contractDetails ? (
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
                      <p className="text-base font-medium">{contractDetails.ContractNo}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                      <p className="text-base">{contractDetails.CustomerName}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Transaction Date</h3>
                      <p className="text-base">{formatDate(contractDetails.TransactionDate)}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                      <Badge className={getStatusColor(contractDetails.ContractStatus)}>{contractDetails.ContractStatus}</Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Grand Total</h3>
                      <p className="text-lg font-bold">{formatCurrency(contractDetails.GrandTotal)}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Actions</h3>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/contracts/${contractDetails.ContractID}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Contract
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Contract information not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calculations" className="space-y-6">
          {!isPostedEntry && leaseRevenueItem && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="mr-2 h-5 w-5 text-muted-foreground" />
                  Revenue Calculations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Lease Days</div>
                    <div className="text-2xl font-bold">{leaseRevenueItem.TotalLeaseDays}</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Rent Per Day</div>
                    <div className="text-2xl font-bold">{formatCurrency(leaseRevenueItem.RentPerDay)}</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Posting Amount</div>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(leaseRevenueItem.PostingAmount)}</div>
                  </div>
                </div>

                <Alert>
                  <Calculator className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">Calculation Formula:</div>
                    <div className="text-sm mt-1">
                      Posting Amount = Rent Per Day × Total Lease Days
                      <br />
                      {formatCurrency(leaseRevenueItem.PostingAmount)} = {formatCurrency(leaseRevenueItem.RentPerDay)} × {leaseRevenueItem.TotalLeaseDays} days
                    </div>
                  </AlertDescription>
                </Alert>

                {leaseRevenueItem.Balance !== leaseRevenueItem.PostingAmount && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="font-medium text-yellow-800">Balance Information</div>
                    <div className="text-sm text-yellow-700 mt-1">
                      Current Balance: {formatCurrency(leaseRevenueItem.Balance)}
                      <br />
                      Difference: {formatCurrency(leaseRevenueItem.Balance - leaseRevenueItem.PostingAmount)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {isPostedEntry && (
            <Card>
              <CardContent className="text-center py-8">
                <Info className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Calculation details not available for posted entries</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="mr-2 h-5 w-5 text-muted-foreground" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentEntity.CreatedBy && (
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">Created</div>
                      <div className="text-sm text-muted-foreground">
                        By {currentEntity.CreatedBy} on {formatDate(currentEntity.CreatedOn)}
                      </div>
                    </div>
                    <Badge variant="outline">Create</Badge>
                  </div>
                )}

                {currentEntity.UpdatedBy && (
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">Last Updated</div>
                      <div className="text-sm text-muted-foreground">
                        By {currentEntity.UpdatedBy} on {formatDate(currentEntity.UpdatedOn)}
                      </div>
                    </div>
                    <Badge variant="outline">Update</Badge>
                  </div>
                )}

                {isPostedEntry && (
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium">Posted</div>
                      <div className="text-sm text-muted-foreground">Entry posted to general ledger</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Posted</Badge>
                  </div>
                )}

                {!isPostedEntry && leaseRevenueItem && !leaseRevenueItem.IsPosted && (
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <div className="font-medium">Pending Posting</div>
                      <div className="text-sm text-muted-foreground">Revenue entry awaiting posting</div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  </div>
                )}

                {!currentEntity.CreatedBy && !currentEntity.UpdatedBy && (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No audit trail information available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        pdfBlob={detailsPdfReport.data}
        title={`${isPostedEntry ? "Posted Entry" : "Lease Revenue"} Details`}
        isLoading={detailsPdfReport.isLoading}
        error={detailsPdfReport.error}
        onDownload={() => detailsPdfReport.downloadCurrentPdf(`Lease_Revenue_Details_${id}.pdf`)}
        onRefresh={handlePreviewReport}
      />

      {/* Reverse Posting Confirmation Dialog */}
      {isPostedEntry && (
        <ConfirmationDialog
          isOpen={isReverseDialogOpen}
          onClose={() => setIsReverseDialogOpen(false)}
          onConfirm={handleReversePosting}
          title="Reverse Posting"
          description={`Are you sure you want to reverse voucher "${postedEntry?.VoucherNo}"? This will create reversal entries and cannot be undone.`}
          cancelText="Cancel"
          confirmText="Reverse"
          type="danger"
        />
      )}
    </div>
  );
};

export default LeaseRevenueDetails;
