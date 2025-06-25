// src/pages/contract/ContractDetails.tsx - Enhanced with Email Integration
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { contractService, Contract, ContractUnit, ContractAdditionalCharge, ContractAttachment } from "@/services/contractService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Lock,
  Shield,
  Mail,
  Send,
  History,
  Settings,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import PDF components
import { PdfPreviewModal, PdfActionButtons } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";
import { useAppSelector } from "@/lib/hooks";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import Email components
import { EmailSendDialog } from "@/pages/email/EmailSendDialog";
import { useEmailIntegration } from "@/hooks/useEmailIntegration";

const ContractDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

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

  // Approval-related state
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | "reset">("approve");
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);

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

  // Email integration states
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailTriggerEvent, setEmailTriggerEvent] = useState<string | undefined>(undefined);
  const [showEmailHistory, setShowEmailHistory] = useState(false);

  // Contract status options
  const contractStatusOptions = ["Draft", "Pending", "Active", "Expired", "Cancelled", "Completed", "Terminated"];

  // Check if user is manager
  const isManager = user?.role === "admin" || user?.role === "manager";

  // Check if contract can be edited
  const canEditContract = contract && contract.ApprovalStatus !== "Approved";
  const isApproved = contract?.ApprovalStatus === "Approved";

  // Initialize email integration hook
  const emailIntegration = useEmailIntegration({
    entityType: "contract",
    entityId: contract?.ContractID || 0,
  });

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

  // Load email templates when contract is loaded
  useEffect(() => {
    if (contract) {
      emailIntegration.loadEmailTemplates("Contract");
    }
  }, [contract, emailIntegration]);

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

  // Email handlers
  const handleSendEmail = (triggerEvent?: string) => {
    setEmailTriggerEvent(triggerEvent);
    setIsEmailDialogOpen(true);
  };

  const handleEmailSent = async (result: any) => {
    if (result.success) {
      toast.success("Email sent successfully");
    }
  };

  const getDefaultEmailRecipients = () => {
    if (!contract) return [];

    const recipients = [];

    // Add primary customer
    if (contract.CustomerEmail) {
      recipients.push({
        email: contract.CustomerEmail,
        name: contract.CustomerName,
        type: "to" as const,
      });
    }

    // Add joint customer if available
    if (contract.JointCustomerEmail) {
      recipients.push({
        email: contract.JointCustomerEmail,
        name: contract.JointCustomerName || "Joint Customer",
        type: "to" as const,
      });
    }

    return recipients;
  };

  // Enhanced approval handlers with email notifications
  const openApprovalDialog = (action: "approve" | "reject" | "reset") => {
    setApprovalAction(action);
    setApprovalComments("");
    setRejectionReason("");
    setIsApprovalDialogOpen(true);
  };

  const closeApprovalDialog = () => {
    setIsApprovalDialogOpen(false);
    setApprovalComments("");
    setRejectionReason("");
  };

  const handleApprovalAction = async () => {
    if (!contract || !isManager) return;

    if (approvalAction === "reject" && !rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    setApprovalLoading(true);

    try {
      let response;

      switch (approvalAction) {
        case "approve":
          response = await contractService.approveContract({
            contractId: contract.ContractID,
            approvalComments,
          });
          break;
        case "reject":
          response = await contractService.rejectContract({
            contractId: contract.ContractID,
            rejectionReason,
          });
          break;
        case "reset":
          response = await contractService.resetApprovalStatus(contract.ContractID);
          break;
        default:
          return;
      }

      if (response.Status === 1) {
        // Refresh contract data
        const data = await contractService.getContractById(contract.ContractID);
        if (data.contract) {
          setContract(data.contract);

          // Send automated email notification
          const triggerEvent = approvalAction === "approve" ? "contract_approved" : approvalAction === "reject" ? "contract_rejected" : undefined;

          if (triggerEvent) {
            const contractVariables = emailIntegration.generateContractVariables(data.contract, {
              customerEmail: data.contract.CustomerEmail,
              approvalComments: approvalAction === "approve" ? approvalComments : undefined,
              rejectionReason: approvalAction === "reject" ? rejectionReason : undefined,
            });

            await emailIntegration.sendAutomatedEmail(triggerEvent, contractVariables, getDefaultEmailRecipients());
          }
        }

        const actionText = approvalAction === "approve" ? "approved" : approvalAction === "reject" ? "rejected" : "reset";
        toast.success(`Contract ${actionText} successfully`);
      } else {
        toast.error(response.Message || `Failed to ${approvalAction} contract`);
      }
    } catch (error) {
      console.error(`Error ${approvalAction}ing contract:`, error);
      toast.error(`Failed to ${approvalAction} contract`);
    } finally {
      setApprovalLoading(false);
      closeApprovalDialog();
    }
  };

  // Enhanced status change with email notifications
  const handleStatusChange = async () => {
    if (!contract || !selectedStatus) return;

    try {
      const response = await contractService.changeContractStatus(contract.ContractID, selectedStatus);

      if (response.Status === 1) {
        const updatedContract = {
          ...contract,
          ContractStatus: selectedStatus,
        };
        setContract(updatedContract);

        // Send automated email notification for certain status changes
        const emailTriggers: Record<string, string> = {
          Active: "contract_activated",
          Expired: "contract_expired",
          Terminated: "contract_terminated",
          Cancelled: "contract_cancelled",
        };

        const triggerEvent = emailTriggers[selectedStatus];
        if (triggerEvent) {
          const contractVariables = emailIntegration.generateContractVariables(updatedContract, {
            customerEmail: updatedContract.CustomerEmail,
            statusChangeReason: `Contract status changed to ${selectedStatus}`,
          });

          await emailIntegration.sendAutomatedEmail(triggerEvent, contractVariables, getDefaultEmailRecipients());
        }

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

    if (!canEditContract) {
      toast.error("Cannot edit approved contracts. Please reset approval status first if necessary.");
      return;
    }

    navigate(`/contracts/edit/${contract.ContractID}`);
  };

  const openDeleteDialog = () => {
    if (!canEditContract) {
      toast.error("Cannot delete approved contracts. Please reset approval status first if necessary.");
      return;
    }
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
    if (!canEditContract) {
      toast.error("Cannot change status of approved contracts. Please reset approval status first if necessary.");
      return;
    }
    setSelectedStatus(status);
    setIsStatusChangeDialogOpen(true);
  };

  const closeStatusChangeDialog = () => {
    setIsStatusChangeDialogOpen(false);
    setSelectedStatus("");
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

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getApprovalIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return CheckCircle;
      case "Rejected":
        return XCircle;
      case "Pending":
        return Clock;
      default:
        return AlertTriangle;
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
        // Send contract renewal notification
        const contractVariables = emailIntegration.generateContractVariables(contract, {
          customerEmail: contract.CustomerEmail,
          renewalPeriod: `${renewalPeriod.years} years, ${renewalPeriod.months} months`,
          newContractId: response.NewContractID,
        });

        await emailIntegration.sendAutomatedEmail("contract_renewed", contractVariables, getDefaultEmailRecipients());

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

  const ApprovalIcon = getApprovalIcon(contract.ApprovalStatus);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => navigate("/contracts")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold">Contract {contract.ContractNo}</h1>
            <div className="ml-2 flex items-center gap-2">
              <Badge variant={getStatusColor(contract.ContractStatus)}>{contract.ContractStatus}</Badge>
              {contract.RequiresApproval && (
                <Badge className={getApprovalStatusColor(contract.ApprovalStatus)}>
                  <ApprovalIcon className="h-3 w-3 mr-1" />
                  {contract.ApprovalStatus}
                </Badge>
              )}
              {isApproved && (
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800">
                  <Lock className="h-3 w-3 mr-1" />
                  Protected
                </Badge>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            {/* Email Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Email Communications</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleSendEmail()}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Custom Email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleSendEmail("contract_notification")}>
                  <Mail className="mr-2 h-4 w-4" />
                  Contract Notification
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSendEmail("payment_reminder")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Payment Reminder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSendEmail("document_request")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Document Request
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowEmailHistory(true)}>
                  <History className="mr-2 h-4 w-4" />
                  Email History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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

            {/* Approval Actions - Manager Only */}
            {isManager && contract.RequiresApproval && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Approval Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {contract.ApprovalStatus === "Pending" && (
                    <>
                      <DropdownMenuItem onClick={() => openApprovalDialog("approve")}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        Approve Contract
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openApprovalDialog("reject")}>
                        <XCircle className="mr-2 h-4 w-4 text-red-600" />
                        Reject Contract
                      </DropdownMenuItem>
                    </>
                  )}
                  {contract.ApprovalStatus !== "Pending" && (
                    <DropdownMenuItem onClick={() => openApprovalDialog("reset")}>
                      <RotateCcw className="mr-2 h-4 w-4 text-blue-600" />
                      Reset Approval
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu open={statusDropdownOpen} onOpenChange={setStatusDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!canEditContract}>
                  Change Status
                  <ChevronDown className="ml-2 h-4 w-4" />
                  {!canEditContract && <Lock className="ml-1 h-3 w-3" />}
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

            {canEditContract ? (
              <Button variant="outline" onClick={handleEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" disabled onClick={handleEdit}>
                    <Lock className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Approved contracts cannot be edited. Reset approval status first if changes are needed.</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Button
              variant="outline"
              onClick={handleRenewContract}
              disabled={contract.ContractStatus !== "Active" && contract.ContractStatus !== "Completed" && contract.ContractStatus !== "Expired"}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Renew
            </Button>

            {canEditContract ? (
              <Button variant="destructive" onClick={openDeleteDialog} disabled={contract.ContractStatus === "Active" || contract.ContractStatus === "Completed"}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="destructive" disabled onClick={openDeleteDialog}>
                    <Lock className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Approved contracts cannot be deleted. Reset approval status first if deletion is needed.</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Approval Status Alert */}
        {contract.RequiresApproval && (
          <Alert
            className={`border-l-4 ${
              contract.ApprovalStatus === "Approved"
                ? "border-l-green-500 bg-green-50"
                : contract.ApprovalStatus === "Rejected"
                ? "border-l-red-500 bg-red-50"
                : "border-l-yellow-500 bg-yellow-50"
            }`}
          >
            <ApprovalIcon className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Approval Status: {contract.ApprovalStatus}</div>
              {contract.ApprovalStatus === "Approved" && contract.ApprovedBy && (
                <div className="text-sm text-muted-foreground mt-1">
                  Approved by {contract.ApprovedBy} on {formatDate(contract.ApprovedOn)}
                  {contract.ApprovalComments && <div className="mt-1">Comments: {contract.ApprovalComments}</div>}
                  <div className="mt-2 text-green-700 font-medium flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    This contract is protected from modifications until approval is reset.
                  </div>
                </div>
              )}
              {contract.ApprovalStatus === "Rejected" && contract.RejectedBy && (
                <div className="text-sm text-muted-foreground mt-1">
                  Rejected by {contract.RejectedBy} on {formatDate(contract.RejectedOn)}
                  {contract.RejectionReason && <div className="mt-1 text-red-700">Reason: {contract.RejectionReason}</div>}
                </div>
              )}
              {contract.ApprovalStatus === "Pending" && <div className="text-sm text-muted-foreground mt-1">This contract is awaiting approval from a manager.</div>}
            </AlertDescription>
          </Alert>
        )}

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

                    {contract.RequiresApproval && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Approval Status</h3>
                        <div>
                          <Badge className={`${getApprovalStatusColor(contract.ApprovalStatus)} mt-1`}>
                            <ApprovalIcon className="h-3 w-3 mr-1" />
                            {contract.ApprovalStatus}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                      <p className="text-base font-medium">{contract.CustomerName}</p>
                      {contract.CustomerEmail && <p className="text-sm text-muted-foreground">{contract.CustomerEmail}</p>}
                    </div>

                    {contract.JointCustomerName && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Joint Customer</h3>
                        <p className="text-base">{contract.JointCustomerName}</p>
                        {contract.JointCustomerEmail && <p className="text-sm text-muted-foreground">{contract.JointCustomerEmail}</p>}
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
                {canEditContract ? (
                  <Button variant="outline" size="sm" disabled>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Unit
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" disabled>
                        <Lock className="mr-2 h-4 w-4" />
                        Add Unit
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cannot modify approved contracts</p>
                    </TooltipContent>
                  </Tooltip>
                )}
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
                {canEditContract ? (
                  <Button variant="outline" size="sm" disabled>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Charge
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" disabled>
                        <Lock className="mr-2 h-4 w-4" />
                        Add Charge
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cannot modify approved contracts</p>
                    </TooltipContent>
                  </Tooltip>
                )}
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
                {canEditContract ? (
                  <Button variant="outline" size="sm" disabled>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Document
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" disabled>
                        <Lock className="mr-2 h-4 w-4" />
                        Add Document
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cannot modify approved contracts</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardHeader>
              <CardContent>
                {attachments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No documents have been attached to this contract.</p>
                    {canEditContract ? (
                      <Button variant="outline" disabled>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Document
                      </Button>
                    ) : (
                      <Button variant="outline" disabled>
                        <Lock className="mr-2 h-4 w-4" />
                        Protected
                      </Button>
                    )}
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

        {/* Email Send Dialog */}
        {contract && (
          <EmailSendDialog
            isOpen={isEmailDialogOpen}
            onClose={() => setIsEmailDialogOpen(false)}
            entityType="contract"
            entityId={contract.ContractID}
            entityData={contract}
            defaultRecipients={getDefaultEmailRecipients()}
            triggerEvent={emailTriggerEvent}
            onEmailSent={handleEmailSent}
          />
        )}

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

        {/* Approval Dialog */}
        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{approvalAction === "approve" ? "Approve Contract" : approvalAction === "reject" ? "Reject Contract" : "Reset Approval Status"}</DialogTitle>
              <DialogDescription>
                {approvalAction === "approve"
                  ? "Approve this contract to allow processing. Note: Once approved, the contract will be protected from modifications and email notifications will be sent automatically."
                  : approvalAction === "reject"
                  ? "Reject this contract with a reason. Email notifications will be sent automatically."
                  : "Reset the approval status to pending."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {approvalAction === "approve" && (
                <div className="space-y-2">
                  <Label htmlFor="approvalComments">Approval Comments (Optional)</Label>
                  <Textarea
                    id="approvalComments"
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    placeholder="Enter any comments about the approval"
                    rows={3}
                  />
                </div>
              )}
              {approvalAction === "reject" && (
                <div className="space-y-2">
                  <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                  <Textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter the reason for rejection"
                    rows={3}
                    required
                  />
                </div>
              )}
              {approvalAction === "reset" && (
                <div className="text-sm text-muted-foreground">This will reset the approval status to "Pending" and clear any previous approval or rejection details.</div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeApprovalDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleApprovalAction}
                disabled={approvalLoading || (approvalAction === "reject" && !rejectionReason.trim())}
                variant={approvalAction === "reject" ? "destructive" : "default"}
              >
                {approvalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {approvalAction === "approve" && <CheckCircle className="mr-2 h-4 w-4" />}
                    {approvalAction === "reject" && <XCircle className="mr-2 h-4 w-4" />}
                    {approvalAction === "reset" && <RotateCcw className="mr-2 h-4 w-4" />}
                    {approvalAction === "approve" ? "Approve & Send Email" : approvalAction === "reject" ? "Reject & Send Email" : "Reset"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
          description={`Are you sure you want to change the status of contract "${contract.ContractNo}" to "${selectedStatus}"? Email notifications will be sent automatically for certain status changes.`}
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
              <DialogDescription>Create a new contract based on the current one with updated dates. Email notifications will be sent automatically.</DialogDescription>
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
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>Contract renewal notifications will be sent automatically to all relevant parties.</AlertDescription>
              </Alert>
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
                    Renew & Send Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default ContractDetails;
