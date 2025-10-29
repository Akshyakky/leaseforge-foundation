// src/pages/termination/TerminationDetails.tsx - Enhanced with Email Integration and Dark Mode Support
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { terminationService, ContractTermination, TerminationDeduction, TerminationAttachment } from "@/services/terminationService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  FileText,
  Building,
  Calendar,
  Users,
  HandCoins,
  Download,
  PlusCircle,
  Info,
  Home,
  Tag,
  Calculator,
  ChevronDown,
  Printer,
  Eye,
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
  MessageSquare,
  BellRing,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import PDF components
import { PdfPreviewModal, PdfActionButtons } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";

// Import attachment components
import { AttachmentPreview } from "@/components/attachments/AttachmentPreview";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { AttachmentThumbnail } from "@/components/attachments/AttachmentThumbnail";
import { FileTypeIcon } from "@/components/attachments/FileTypeIcon";

// Import Email components
import { EmailSendDialog } from "@/pages/email/EmailSendDialog";
import { useEmailIntegration } from "@/hooks/useEmailIntegration";

import { useAppSelector } from "@/lib/hooks";

const TerminationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

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
  const [refundDate, setRefundDate] = useState<Date | null>(new Date());
  const [refundReference, setRefundReference] = useState("");
  const [calculationResult, setCalculationResult] = useState<any>(null);

  // Approval-related state
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | "reset">("approve");
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);

  // PDF generation state
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const terminationPdfReport = useGenericPdfReport();

  // Attachment preview and gallery state
  const [previewAttachment, setPreviewAttachment] = useState<TerminationAttachment | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialAttachmentId, setInitialAttachmentId] = useState<number | undefined>(undefined);

  // Email integration states
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailTriggerEvent, setEmailTriggerEvent] = useState<string | undefined>(undefined);
  const [showEmailHistory, setShowEmailHistory] = useState(false);

  // Termination status options
  const terminationStatusOptions = ["Draft", "Pending", "Completed", "Cancelled"]; //"Approved",

  // Check if user is manager
  const isManager = user?.role === "admin" || user?.role === "manager";

  // Check if termination can be edited
  const canEditTermination = termination && termination.ApprovalStatus !== "Approved";
  const isApproved = termination?.ApprovalStatus === "Approved";

  // Initialize email integration hook
  const emailIntegration = useEmailIntegration({
    entityType: "termination",
    entityId: termination?.TerminationID || 0,
  });

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

  // Load email templates when termination is loaded
  useEffect(() => {
    if (termination) {
      emailIntegration.loadEmailTemplates("Termination");
    }
  }, [termination, emailIntegration]);

  // PDF Generation Handlers
  const handleGenerateTerminationSlip = async () => {
    if (!termination) return;

    const response = await terminationPdfReport.generateReport(
      "termination-slip",
      { TerminationId: termination.TerminationID },
      {
        orientation: "Portrait",
        download: true,
        showToast: true,
        filename: `Termination_Slip_${termination.TerminationNo}_${new Date().toISOString().split("T")[0]}.pdf`,
      }
    );

    if (response.success) {
      toast.success("Termination slip generated successfully");
    }
  };

  const handlePreviewTerminationSlip = async () => {
    if (!termination) return;

    setShowPdfPreview(true);
    const response = await terminationPdfReport.generateReport(
      "termination-slip",
      { TerminationId: termination.TerminationID },
      {
        orientation: "Portrait",
        download: false,
        showToast: false,
      }
    );

    if (!response.success) {
      toast.error("Failed to generate termination slip preview");
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
    if (!termination) return [];

    const recipients = [];

    // Add primary customer
    if (termination.CustomerEmail) {
      recipients.push({
        email: termination.CustomerEmail,
        name: termination.CustomerFullName,
        type: "to" as const,
      });
    }

    // Add joint customer if available
    // if (termination.JointCustomerEmail) {
    //   recipients.push({
    //     email: termination.JointCustomerEmail,
    //     name: termination.JointCustomerName || "Joint Customer",
    //     type: "to" as const,
    //   });
    // }

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
    if (!termination || !isManager) return;

    if (approvalAction === "reject" && !rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    setApprovalLoading(true);

    try {
      let response;

      switch (approvalAction) {
        case "approve":
          response = await terminationService.approveTermination({
            terminationId: termination.TerminationID,
            approvalComments,
          });
          break;
        case "reject":
          response = await terminationService.rejectTermination({
            terminationId: termination.TerminationID,
            rejectionReason,
          });
          break;
        case "reset":
          response = await terminationService.resetApprovalStatus(termination.TerminationID);
          break;
        default:
          return;
      }

      if (response.Status === 1) {
        // Refresh termination data
        const data = await terminationService.getTerminationById(termination.TerminationID);
        if (data.termination) {
          setTermination(data.termination);

          // Send automated email notification
          const triggerEvent = approvalAction === "approve" ? "termination_approved" : approvalAction === "reject" ? "termination_rejected" : undefined;

          if (triggerEvent) {
            const terminationVariables = emailIntegration.generateTerminationVariables(data.termination, {
              customerEmail: data.termination.CustomerEmail,
              approvalComments: approvalAction === "approve" ? approvalComments : undefined,
              rejectionReason: approvalAction === "reject" ? rejectionReason : undefined,
            });

            await emailIntegration.sendAutomatedEmail(triggerEvent, terminationVariables, getDefaultEmailRecipients());
          }
        }

        const actionText = approvalAction === "approve" ? "approved" : approvalAction === "reject" ? "rejected" : "reset";
        toast.success(`Termination ${actionText} successfully`);
      } else {
        toast.error(response.Message || `Failed to ${approvalAction} termination`);
      }
    } catch (error) {
      console.error(`Error ${approvalAction}ing termination:`, error);
      toast.error(`Failed to ${approvalAction} termination`);
    } finally {
      setApprovalLoading(false);
      closeApprovalDialog();
    }
  };

  // Enhanced status change with email notifications
  const handleStatusChange = async () => {
    if (!termination || !selectedStatus) return;

    try {
      const response = await terminationService.changeTerminationStatus(termination.TerminationID, selectedStatus);

      if (response.Status === 1) {
        const updatedTermination = {
          ...termination,
          TerminationStatus: selectedStatus,
        };
        setTermination(updatedTermination);

        // Send automated email notification for certain status changes
        const emailTriggers: Record<string, string> = {
          Approved: "termination_approved",
          Completed: "termination_completed",
          Cancelled: "termination_cancelled",
        };

        const triggerEvent = emailTriggers[selectedStatus];
        if (triggerEvent) {
          const terminationVariables = emailIntegration.generateTerminationVariables(updatedTermination, {
            customerEmail: updatedTermination.CustomerEmail,
            statusChangeReason: `Termination status changed to ${selectedStatus}`,
          });

          await emailIntegration.sendAutomatedEmail(triggerEvent, terminationVariables, getDefaultEmailRecipients());
        }

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

  // Enhanced refund processing with email notifications
  const handleProcessRefund = async () => {
    if (!termination || !refundDate || !refundReference) {
      toast.error("Please provide refund date and reference");
      return;
    }

    try {
      const response = await terminationService.processRefund(termination.TerminationID, refundDate, refundReference);

      if (response.Status === 1) {
        const updatedTermination = {
          ...termination,
          IsRefundProcessed: true,
          RefundDate: refundDate,
          RefundReference: refundReference,
        };
        setTermination(updatedTermination);

        // Send refund processed notification
        const terminationVariables = emailIntegration.generateTerminationVariables(updatedTermination, {
          customerEmail: updatedTermination.CustomerEmail,
          refundAmount: updatedTermination.RefundAmount,
          refundDate: refundDate,
          refundReference: refundReference,
        });

        await emailIntegration.sendAutomatedEmail("refund_processed", terminationVariables, getDefaultEmailRecipients());

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

  // Attachment handlers
  const openAttachmentPreview = (attachment: TerminationAttachment) => {
    setPreviewAttachment(attachment);
    setPreviewOpen(true);
  };

  const openAttachmentGallery = (attachmentId?: number) => {
    setInitialAttachmentId(attachmentId);
    setGalleryOpen(true);
  };

  const handleEdit = () => {
    if (!termination) return;

    if (!canEditTermination) {
      toast.error("Cannot edit approved terminations. Please reset approval status first if necessary.");
      return;
    }

    navigate(`/terminations/edit/${termination.TerminationID}`);
  };

  const openDeleteDialog = () => {
    if (!canEditTermination) {
      toast.error("Cannot delete approved terminations. Please reset approval status first if necessary.");
      return;
    }
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
    if (!canEditTermination) {
      toast.error("Cannot change status of approved terminations. Please reset approval status first if necessary.");
      return;
    }
    setSelectedStatus(status);
    setIsStatusChangeDialogOpen(true);
  };

  const closeStatusChangeDialog = () => {
    setIsStatusChangeDialogOpen(false);
    setSelectedStatus("");
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

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
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

  const ApprovalIcon = getApprovalIcon(termination.ApprovalStatus);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => navigate("/terminations")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold">Termination {termination.TerminationNo}</h1>
            <div className="ml-2 flex items-center gap-2">
              <Badge variant={getStatusColor(termination.TerminationStatus)}>{termination.TerminationStatus}</Badge>
              {termination.RequiresApproval && (
                <Badge className={getApprovalStatusColor(termination.ApprovalStatus)}>
                  <ApprovalIcon className="h-3 w-3 mr-1" />
                  {termination.ApprovalStatus}
                </Badge>
              )}
              {isApproved && (
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
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
                <DropdownMenuItem onClick={() => handleSendEmail("termination_notification")}>
                  <Mail className="mr-2 h-4 w-4" />
                  Termination Notification
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSendEmail("refund_notification")}>
                  <HandCoins className="mr-2 h-4 w-4" />
                  Refund Notification
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSendEmail("document_request")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Document Request
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSendEmail("move_out_reminder")}>
                  <BellRing className="mr-2 h-4 w-4" />
                  Move Out Reminder
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
                onDownload={handleGenerateTerminationSlip}
                onPreview={handlePreviewTerminationSlip}
                isLoading={terminationPdfReport.isLoading}
                downloadLabel="Download Termination Slip"
                previewLabel="Preview Termination Slip"
                variant="outline"
                size="default"
              />
            </div>

            {/* Approval Actions - Manager Only */}
            {isManager && termination.RequiresApproval && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Approval Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {termination.ApprovalStatus === "Pending" && (
                    <>
                      <DropdownMenuItem onClick={() => openApprovalDialog("approve")}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                        Approve Termination
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openApprovalDialog("reject")}>
                        <XCircle className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
                        Reject Termination
                      </DropdownMenuItem>
                    </>
                  )}
                  {termination.ApprovalStatus !== "Pending" && (
                    <DropdownMenuItem onClick={() => openApprovalDialog("reset")}>
                      <RotateCcw className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                      Reset Approval
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!canEditTermination}>
                  Change Status
                  <ChevronDown className="ml-2 h-4 w-4" />
                  {!canEditTermination && <Lock className="ml-1 h-3 w-3" />}
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

            {termination.TerminationStatus === "Approved" && termination.RefundAmount > 0 && !termination.IsRefundProcessed && (
              <Button variant="outline" onClick={openRefundDialog}>
                <HandCoins className="mr-2 h-4 w-4" />
                Process Refund
              </Button>
            )}

            <Button variant="outline" onClick={openCalculationDialog}>
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Figures
            </Button>

            {canEditTermination ? (
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
                  <p>Approved terminations cannot be edited. Reset approval status first if changes are needed.</p>
                </TooltipContent>
              </Tooltip>
            )}

            {canEditTermination ? (
              <Button variant="destructive" onClick={openDeleteDialog} disabled={termination.TerminationStatus === "Approved" || termination.TerminationStatus === "Completed"}>
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
                  <p>Approved terminations cannot be deleted. Reset approval status first if deletion is needed.</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Approval Status Alert */}
        {termination.RequiresApproval && (
          <Alert
            className={`border-l-4 ${
              termination.ApprovalStatus === "Approved"
                ? "border-l-green-500 bg-green-50 dark:bg-green-900/20"
                : termination.ApprovalStatus === "Rejected"
                ? "border-l-red-500 bg-red-50 dark:bg-red-900/20"
                : "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
            }`}
          >
            <ApprovalIcon className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Approval Status: {termination.ApprovalStatus}</div>
              {termination.ApprovalStatus === "Approved" && termination.ApprovedBy && (
                <div className="text-sm text-muted-foreground mt-1">
                  Approved by {termination.ApprovedBy} on {formatDate(termination.ApprovedOn)}
                  {termination.ApprovalComments && <div className="mt-1">Comments: {termination.ApprovalComments}</div>}
                  <div className="mt-2 text-green-700 dark:text-green-400 font-medium flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    This termination is protected from modifications until approval is reset.
                  </div>
                </div>
              )}
              {termination.ApprovalStatus === "Rejected" && termination.RejectedBy && (
                <div className="text-sm text-muted-foreground mt-1">
                  Rejected by {termination.RejectedBy} on {formatDate(termination.RejectedOn)}
                  {termination.RejectionReason && <div className="mt-1 text-red-700 dark:text-red-400">Reason: {termination.RejectionReason}</div>}
                </div>
              )}
              {termination.ApprovalStatus === "Pending" && <div className="text-sm text-muted-foreground mt-1">This termination is awaiting approval from a manager.</div>}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-[400px]">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="deductions">Deductions ({deductions.length})</TabsTrigger>
            <TabsTrigger value="attachments">Documents ({attachments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                  Termination Information
                  {isApproved && <Lock className="ml-2 h-4 w-4 text-green-600 dark:text-green-400" />}
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
                      {termination.CustomerEmail && <p className="text-sm text-muted-foreground">{termination.CustomerEmail}</p>}
                    </div>

                    {termination.RequiresApproval && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Approval Status</h3>
                        <div>
                          <Badge className={`${getApprovalStatusColor(termination.ApprovalStatus)} mt-1`}>
                            <ApprovalIcon className="h-3 w-3 mr-1" />
                            {termination.ApprovalStatus}
                          </Badge>
                        </div>
                      </div>
                    )}
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
                  <HandCoins className="mr-2 h-5 w-5 text-muted-foreground" />
                  Deductions
                  {isApproved && <Lock className="ml-2 h-4 w-4 text-green-600 dark:text-green-400" />}
                </CardTitle>
                {canEditTermination ? (
                  <Button variant="outline" size="sm" disabled>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Deduction
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" disabled>
                        <Lock className="mr-2 h-4 w-4" />
                        Add Deduction
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cannot modify approved terminations</p>
                    </TooltipContent>
                  </Tooltip>
                )}
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
                  Documents
                  {isApproved && <Lock className="ml-2 h-4 w-4 text-green-600 dark:text-green-400" />}
                </CardTitle>
                <div className="flex space-x-2">
                  {attachments.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => openAttachmentGallery()}>
                      <FileText className="mr-2 h-4 w-4" />
                      View All Documents
                    </Button>
                  )}
                  {canEditTermination ? (
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
                        <p>Cannot modify approved terminations</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {attachments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <p className="text-muted-foreground mb-4">No documents associated with this termination.</p>
                    {canEditTermination ? (
                      <Button variant="outline" onClick={() => navigate(`/terminations/edit/${termination.TerminationID}`)}>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attachments.map((attachment) => (
                      <Card key={attachment.TerminationAttachmentID} className="overflow-hidden">
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
                                {attachment.DocTypeName && (
                                  <Badge className="ml-2 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30">
                                    {attachment.DocTypeName}
                                  </Badge>
                                )}
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
                                  <Button variant="outline" size="sm" onClick={() => openAttachmentGallery(attachment.TerminationAttachmentID)} className="h-8 px-3">
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Email Send Dialog */}
        {termination && (
          <EmailSendDialog
            isOpen={isEmailDialogOpen}
            onClose={() => setIsEmailDialogOpen(false)}
            entityType="termination"
            entityId={termination.TerminationID}
            entityData={termination}
            defaultRecipients={getDefaultEmailRecipients()}
            triggerEvent={emailTriggerEvent}
            onEmailSent={handleEmailSent}
          />
        )}

        {/* PDF Preview Modal */}
        <PdfPreviewModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          pdfBlob={terminationPdfReport.data}
          title={`Termination Slip - ${termination.TerminationNo}`}
          isLoading={terminationPdfReport.isLoading}
          error={terminationPdfReport.error}
          onDownload={() => terminationPdfReport.downloadCurrentPdf(`Termination_Slip_${termination.TerminationNo}.pdf`)}
          onRefresh={handlePreviewTerminationSlip}
        />

        {/* Approval Dialog */}
        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{approvalAction === "approve" ? "Approve Termination" : approvalAction === "reject" ? "Reject Termination" : "Reset Approval Status"}</DialogTitle>
              <DialogDescription>
                {approvalAction === "approve"
                  ? "Approve this termination to allow processing. Note: Once approved, the termination will be protected from modifications and email notifications will be sent automatically."
                  : approvalAction === "reject"
                  ? "Reject this termination with a reason. Email notifications will be sent automatically."
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
          description={`Are you sure you want to change the status of termination "${termination.TerminationNo}" to "${selectedStatus}"? Email notifications will be sent automatically for certain status changes.`}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Refund Date</label>
                <DatePicker value={refundDate} onChange={setRefundDate} placeholder="Select refund date" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Refund Reference</label>
                <Input placeholder="Enter refund reference" value={refundReference} onChange={(e) => setRefundReference(e.target.value)} />
              </div>
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>Refund processed notifications will be sent automatically to all relevant parties.</AlertDescription>
              </Alert>
            </div>
          }
          cancelText="Cancel"
          confirmText="Process Refund & Send Email"
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
              PostingAttachmentID: attachment.TerminationAttachmentID, // Map ID for gallery compatibility
            }))}
            initialAttachmentId={initialAttachmentId}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default TerminationDetails;
