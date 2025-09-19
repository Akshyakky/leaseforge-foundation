// src/pages/termination/TerminationList.tsx - Enhanced with Email Integration
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Loader2,
  MoreHorizontal,
  Search,
  Plus,
  FileText,
  Building,
  Users,
  HandCoins,
  Calendar,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Home,
  User,
  RefreshCw,
  Download,
  Filter,
  X,
  ChevronDown,
  Settings,
  BarChart3,
  TrendingUp,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Shield,
  UserCheck,
  RotateCcw,
  Lock,
  AlertTriangle,
  Mail,
  Send,
  History,
  BellRing,
  MailCheck,
  MailX,
  MessageSquare,
  CalendarClock,
  KeyRound,
  MoveRight,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Separator } from "@/components/ui/separator";
import { terminationService, ContractTermination } from "@/services/terminationService";
import { customerService } from "@/services/customerService";
import { propertyService } from "@/services/propertyService";
import { debounce } from "lodash";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks";

// PDF Report Components
import { PdfPreviewModal } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";

// Email Components
import { EmailSendDialog } from "@/pages/email/EmailSendDialog";
import { useEmailIntegration } from "@/hooks/useEmailIntegration";
import { useCompanyChangeHandler } from "@/hooks/useCompanyChangeHandler";

// Types and interfaces
interface TerminationFilter {
  searchTerm: string;
  selectedCustomerId: string;
  selectedStatus: string;
  selectedApprovalStatus: string;
  selectedPropertyId: string;
  dateFrom?: Date;
  dateTo?: Date;
  emailStatus?: string; // New filter for email status
}

interface SortConfig {
  key: keyof ContractTermination | null;
  direction: "asc" | "desc";
}

interface TerminationListStats {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  completed: number;
  cancelled: number;
  totalSecurityDeposit: number;
  totalRefunds: number;
  averageRefund: number;
  approvalPending: number;
  approvalApproved: number;
  approvalRejected: number;
  approvedProtected: number;
  pendingRefunds: number;
  // Email-related stats
  emailNotificationsSent: number;
  pendingEmailReminders: number;
  movingOutSoon: number;
  keyReturnPending: number;
}

// Email reminder types
interface EmailReminderConfig {
  triggerEvent: string;
  triggerName: string;
  description: string;
  defaultEnabled: boolean;
}

const TERMINATION_EMAIL_REMINDERS: EmailReminderConfig[] = [
  {
    triggerEvent: "move_out_reminder_7",
    triggerName: "Move Out in 7 Days",
    description: "Send reminder 7 days before move out date",
    defaultEnabled: true,
  },
  {
    triggerEvent: "move_out_reminder_3",
    triggerName: "Move Out in 3 Days",
    description: "Send reminder 3 days before move out date",
    defaultEnabled: true,
  },
  {
    triggerEvent: "key_return_reminder",
    triggerName: "Key Return Reminder",
    description: "Send reminder for pending key returns",
    defaultEnabled: true,
  },
  {
    triggerEvent: "refund_status_update",
    triggerName: "Refund Status Update",
    description: "Send updates about refund processing status",
    defaultEnabled: false,
  },
];

const TerminationList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [terminations, setTerminations] = useState<ContractTermination[]>([]);
  const [filteredTerminations, setFilteredTerminations] = useState<ContractTermination[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTermination, setSelectedTermination] = useState<ContractTermination | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [selectedTerminations, setSelectedTerminations] = useState<Set<number>>(new Set());
  const [refundDate, setRefundDate] = useState<Date | null>(new Date());
  const [refundReference, setRefundReference] = useState("");
  const [isCompanyChanging, setIsCompanyChanging] = useState(false);

  // Filter and sort state
  const [filters, setFilters] = useState<TerminationFilter>({
    searchTerm: searchParams.get("search") || "",
    selectedCustomerId: searchParams.get("customer") || "",
    selectedStatus: searchParams.get("status") || "",
    selectedApprovalStatus: searchParams.get("approval") || "",
    selectedPropertyId: searchParams.get("property") || "",
    dateFrom: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
    dateTo: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
    emailStatus: searchParams.get("emailStatus") || "",
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);

  // PDF Generation
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const terminationListPdf = useGenericPdfReport();

  // Approval state
  const [bulkApprovalAction, setBulkApprovalAction] = useState<"approve" | "reject" | null>(null);
  const [bulkApprovalLoading, setBulkApprovalLoading] = useState(false);

  // Email integration states
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailDialogTermination, setEmailDialogTermination] = useState<ContractTermination | null>(null);
  const [emailTriggerEvent, setEmailTriggerEvent] = useState<string | undefined>(undefined);
  const [isBulkEmailing, setIsBulkEmailing] = useState(false);
  const [showEmailRemindersDialog, setShowEmailRemindersDialog] = useState(false);

  // Termination status and approval options
  const terminationStatusOptions = ["Draft", "Pending", "Approved", "Completed", "Cancelled"];
  const approvalStatusOptions = ["Pending", "Approved", "Rejected"];
  const emailStatusOptions = [
    { label: "All", value: "" },
    { label: "Email Sent", value: "sent" },
    { label: "No Email Sent", value: "not_sent" },
    { label: "Email Pending", value: "pending" },
    { label: "Email Failed", value: "failed" },
  ];

  // Check if user is manager
  const isManager = user?.role === "admin" || user?.role === "manager";

  // Initialize email integration hook
  const emailIntegration = useEmailIntegration({
    entityType: "termination",
    entityId: 0, // Will be set when needed
  });

  const { currentCompanyId, currentCompanyName } = useCompanyChangeHandler({
    onCompanyChange: async (newCompanyId: string, oldCompanyId: string | null) => {
      setIsCompanyChanging(true);

      try {
        // Clear existing data first
        setTerminations([]);
        setFilteredTerminations([]);
        setSelectedTerminations(new Set());

        // Clear filters when company changes
        const clearedFilters = {
          searchTerm: "",
          selectedCustomerId: "",
          selectedStatus: "",
          selectedApprovalStatus: "",
          selectedPropertyId: "",
          emailStatus: "",
          dateFrom: undefined,
          dateTo: undefined,
        };
        setFilters(clearedFilters);
        setSearchParams(new URLSearchParams());

        // Reload all data for the new company
        if (newCompanyId) {
          const companyIdNum = parseInt(newCompanyId);

          // Fetch data in parallel for better performance
          const [terminationsData, customersData, propertiesData] = await Promise.all([
            terminationService.getAllTerminations(companyIdNum),
            customerService.getAllCustomers(),
            propertyService.getAllProperties().catch(() => []), // Gracefully handle if properties fail
          ]);

          setTerminations(terminationsData);
          setCustomers(customersData);
          setProperties(propertiesData);

          // Reload email templates for the new company
          await emailIntegration.loadEmailTemplates("Termination");
        }
      } catch (error) {
        console.error("Error handling company change in TerminationList:", error);
        toast.error("Failed to load terminations for the selected company");
      } finally {
        setIsCompanyChanging(false);
      }
    },
    enableLogging: true,
    showNotifications: true,
  });

  // Initialize data on component mount
  useEffect(() => {
    initializeData();
    // Load email templates for termination category
    emailIntegration.loadEmailTemplates("Termination");
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.searchTerm) params.set("search", filters.searchTerm);
    if (filters.selectedCustomerId) params.set("customer", filters.selectedCustomerId);
    if (filters.selectedStatus) params.set("status", filters.selectedStatus);
    if (filters.selectedApprovalStatus) params.set("approval", filters.selectedApprovalStatus);
    if (filters.selectedPropertyId) params.set("property", filters.selectedPropertyId);
    if (filters.emailStatus) params.set("emailStatus", filters.emailStatus);
    if (filters.dateFrom) params.set("from", filters.dateFrom.toISOString().split("T")[0]);
    if (filters.dateTo) params.set("to", filters.dateTo.toISOString().split("T")[0]);

    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Apply filters and sorting whenever terminations or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [terminations, filters, sortConfig]);

  // Initialize component data
  const initializeData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTerminations(), fetchCustomers(), fetchProperties()]);
    } catch (error) {
      console.error("Error initializing data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all terminations
  const fetchTerminations = async () => {
    try {
      const companyId = currentCompanyId ? parseInt(currentCompanyId) : undefined;
      const terminationsData = await terminationService.getAllTerminations(companyId);
      setTerminations(terminationsData);
    } catch (error) {
      console.error("Error fetching terminations:", error);
      toast.error("Failed to load terminations");
    }
  };

  // Fetch customers for filter dropdown
  const fetchCustomers = async () => {
    try {
      const customersData = await customerService.getAllCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    }
  };

  // Fetch properties for filter dropdown
  const fetchProperties = async () => {
    try {
      const propertiesData = await propertyService.getAllProperties();
      setProperties(propertiesData);
    } catch (error) {
      console.error("Error fetching properties:", error);
      console.warn("Properties filter will not be available");
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTerminations();
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  // Apply filters and sorting
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...terminations];

    // Apply text search
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (termination) =>
          termination.TerminationNo?.toLowerCase().includes(searchLower) ||
          termination.ContractNo?.toLowerCase().includes(searchLower) ||
          termination.CustomerFullName?.toLowerCase().includes(searchLower) ||
          termination.TerminationReason?.toLowerCase().includes(searchLower) ||
          termination.Notes?.toLowerCase().includes(searchLower)
      );
    }

    // Apply customer filter
    if (filters.selectedCustomerId) {
      filtered = filtered.filter((termination) => termination.CustomerID?.toString() === filters.selectedCustomerId);
    }

    // Apply status filter
    if (filters.selectedStatus) {
      filtered = filtered.filter((termination) => termination.TerminationStatus === filters.selectedStatus);
    }

    // Apply approval status filter
    if (filters.selectedApprovalStatus) {
      filtered = filtered.filter((termination) => termination.ApprovalStatus === filters.selectedApprovalStatus);
    }

    // Apply email status filter
    if (filters.emailStatus) {
      switch (filters.emailStatus) {
        case "sent":
          filtered = filtered.filter((termination) => termination.EmailNotificationSent === true);
          break;
        case "not_sent":
          filtered = filtered.filter((termination) => termination.EmailNotificationSent !== true);
          break;
        case "pending":
          filtered = filtered.filter((termination) => termination.EmailNotificationPending === true);
          break;
        case "failed":
          filtered = filtered.filter((termination) => termination.EmailNotificationFailed === true);
          break;
      }
    }

    // Apply property filter (if available)
    if (filters.selectedPropertyId) {
      filtered = filtered.filter((termination) => termination.PropertyID?.toString() === filters.selectedPropertyId);
    }

    // Apply date filters
    if (filters.dateFrom) {
      filtered = filtered.filter((termination) => new Date(termination.TerminationDate) >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter((termination) => new Date(termination.TerminationDate) <= filters.dateTo!);
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    }

    setFilteredTerminations(filtered);
  }, [terminations, filters, sortConfig]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilters((prev) => ({ ...prev, searchTerm: value }));
      }, 300),
    []
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof TerminationFilter, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      selectedCustomerId: "",
      selectedStatus: "",
      selectedApprovalStatus: "",
      selectedPropertyId: "",
      emailStatus: "",
      dateFrom: undefined,
      dateTo: undefined,
    });
    setSearchParams(new URLSearchParams());
  };

  // Handle sorting
  const handleSort = (key: keyof ContractTermination) => {
    setSortConfig((prevSort) => ({
      key,
      direction: prevSort.key === key && prevSort.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Check if termination can be edited
  const canEditTermination = (termination: ContractTermination) => {
    return termination.ApprovalStatus !== "Approved";
  };

  // Email helper functions
  const getDefaultEmailRecipients = (termination: ContractTermination) => {
    const recipients = [];

    if (termination.CustomerEmail) {
      recipients.push({
        email: termination.CustomerEmail,
        name: termination.CustomerFullName,
        type: "to" as const,
      });
    }

    // if (termination.JointCustomerEmail) {
    //   recipients.push({
    //     email: termination.JointCustomerEmail,
    //     name: termination.JointCustomerName || "Joint Customer",
    //     type: "to" as const,
    //   });
    // }

    return recipients;
  };

  // Email action handlers
  const handleSendEmail = (termination: ContractTermination, triggerEvent?: string) => {
    setEmailDialogTermination(termination);
    setEmailTriggerEvent(triggerEvent);
    setIsEmailDialogOpen(true);
  };

  const handleEmailSent = async (result: any) => {
    if (result.success) {
      toast.success("Email sent successfully");
      // Optionally update the termination's email status
      if (emailDialogTermination) {
        setTerminations(
          terminations.map((t) =>
            t.TerminationID === emailDialogTermination.TerminationID ? { ...t, EmailNotificationSent: true, LastEmailSentDate: new Date().toISOString() } : t
          )
        );
      }
    }
  };

  // Bulk email operations
  const handleBulkEmail = async (triggerEvent: string) => {
    if (selectedTerminations.size === 0) {
      toast.error("Please select terminations to send emails");
      return;
    }

    setIsBulkEmailing(true);

    try {
      const terminationsToEmail = Array.from(selectedTerminations)
        .map((terminationId) => terminations.find((t) => t.TerminationID === terminationId))
        .filter(Boolean) as ContractTermination[];

      const emailPromises = terminationsToEmail.map(async (termination) => {
        const recipients = getDefaultEmailRecipients(termination);
        if (recipients.length === 0) {
          return { termination, success: false, error: "No email recipients found" };
        }

        try {
          const terminationVariables = emailIntegration.generateTerminationVariables(termination, {
            customerEmail: recipients[0]?.email,
          });

          const result = await emailIntegration.sendAutomatedEmail(triggerEvent, terminationVariables, recipients);

          return { termination, success: result.success, result };
        } catch (error) {
          return { termination, success: false, error: error.message };
        }
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} emails sent successfully`);

        // Update terminations with email sent status
        setTerminations(
          terminations.map((termination) => {
            const result = results.find((r) => r.termination.TerminationID === termination.TerminationID);
            if (result && result.success) {
              return { ...termination, EmailNotificationSent: true, LastEmailSentDate: new Date().toISOString() };
            }
            return termination;
          })
        );
      }

      if (failureCount > 0) {
        toast.warning(`${failureCount} emails failed to send`);
      }

      setSelectedTerminations(new Set());
    } catch (error) {
      console.error("Bulk email error:", error);
      toast.error("Failed to send bulk emails");
    } finally {
      setIsBulkEmailing(false);
    }
  };

  // Automated reminder handlers
  const handleSendMoveOutReminders = async () => {
    try {
      // Find terminations with move out dates in the next 7 days
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const movingOutSoon = terminations.filter((termination) => {
        if (termination.TerminationStatus !== "Approved") return false;

        const moveOutDate = termination.MoveOutDate ? new Date(termination.MoveOutDate) : null;
        return moveOutDate && moveOutDate <= sevenDaysFromNow && moveOutDate > new Date();
      });

      if (movingOutSoon.length === 0) {
        toast.info("No terminations have move out dates in the next 7 days");
        return;
      }

      const emailPromises = movingOutSoon.map(async (termination) => {
        const recipients = getDefaultEmailRecipients(termination);
        if (recipients.length === 0) return { termination, success: false };

        try {
          const terminationVariables = emailIntegration.generateTerminationVariables(termination, {
            customerEmail: recipients[0]?.email,
            moveOutDate: termination.MoveOutDate,
            daysUntilMoveOut: Math.ceil((new Date(termination.MoveOutDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
          });

          const result = await emailIntegration.sendAutomatedEmail("move_out_reminder_7", terminationVariables, recipients);

          return { termination, success: result.success };
        } catch (error) {
          return { termination, success: false };
        }
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter((r) => r.success).length;

      if (successCount > 0) {
        toast.success(`Move out reminders sent for ${successCount} terminations`);
      } else {
        toast.error("Failed to send move out reminders");
      }
    } catch (error) {
      console.error("Error sending move out reminders:", error);
      toast.error("Failed to send move out reminders");
    }
  };

  const handleSendKeyReturnReminders = async () => {
    try {
      // Find terminations with pending key returns
      const keyReturnPending = terminations.filter((termination) => {
        const moveOutDate = termination.MoveOutDate ? new Date(termination.MoveOutDate) : null;
        const keyReturnDate = termination.KeyReturnDate ? new Date(termination.KeyReturnDate) : null;

        return (
          termination.TerminationStatus === "Approved" &&
          moveOutDate &&
          moveOutDate < new Date() && // Move out date has passed
          (!keyReturnDate || keyReturnDate > new Date()) // Key not yet returned
        );
      });

      if (keyReturnPending.length === 0) {
        toast.info("No pending key returns found");
        return;
      }

      const emailPromises = keyReturnPending.map(async (termination) => {
        const recipients = getDefaultEmailRecipients(termination);
        if (recipients.length === 0) return { termination, success: false };

        try {
          const terminationVariables = emailIntegration.generateTerminationVariables(termination, {
            customerEmail: recipients[0]?.email,
            moveOutDate: termination.MoveOutDate,
            propertyName: termination.PropertyName,
          });

          const result = await emailIntegration.sendAutomatedEmail("key_return_reminder", terminationVariables, recipients);

          return { termination, success: result.success };
        } catch (error) {
          return { termination, success: false };
        }
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter((r) => r.success).length;

      if (successCount > 0) {
        toast.success(`Key return reminders sent for ${successCount} terminations`);
      } else {
        toast.error("Failed to send key return reminders");
      }
    } catch (error) {
      console.error("Error sending key return reminders:", error);
      toast.error("Failed to send key return reminders");
    }
  };

  // Navigation handlers
  const handleAddTermination = () => {
    navigate("/terminations/new");
  };

  const handleEditTermination = (termination: ContractTermination) => {
    if (!canEditTermination(termination)) {
      toast.error("Cannot edit approved terminations. Please reset approval status first if changes are needed.");
      return;
    }
    navigate(`/terminations/edit/${termination.TerminationID}`);
  };

  const handleViewTermination = (termination: ContractTermination) => {
    navigate(`/terminations/${termination.TerminationID}`);
  };

  // Analytics navigation
  const handleViewPendingApprovals = () => {
    setFilters((prev) => ({ ...prev, selectedApprovalStatus: "Pending" }));
    setShowFilters(true);
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTerminations(new Set(filteredTerminations.map((t) => t.TerminationID)));
    } else {
      setSelectedTerminations(new Set());
    }
  };

  const handleSelectTermination = (terminationId: number, checked: boolean) => {
    const newSelection = new Set(selectedTerminations);
    if (checked) {
      newSelection.add(terminationId);
    } else {
      newSelection.delete(terminationId);
    }
    setSelectedTerminations(newSelection);
  };

  // Bulk operations
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedTerminations.size === 0) return;

    // Filter out approved terminations
    const editableTerminations = Array.from(selectedTerminations).filter((terminationId) => {
      const termination = terminations.find((t) => t.TerminationID === terminationId);
      return termination && canEditTermination(termination);
    });

    if (editableTerminations.length === 0) {
      toast.error("Selected terminations cannot be modified as they are approved. Please reset approval status first.");
      return;
    }

    if (editableTerminations.length < selectedTerminations.size) {
      const skippedCount = selectedTerminations.size - editableTerminations.length;
      toast.warning(`${skippedCount} approved terminations were skipped from status change.`);
    }

    try {
      const promises = editableTerminations.map((terminationId) => terminationService.changeTerminationStatus(terminationId, newStatus));

      await Promise.all(promises);

      // Update local state
      setTerminations((prev) =>
        prev.map((termination) => (editableTerminations.includes(termination.TerminationID) ? { ...termination, TerminationStatus: newStatus } : termination))
      );

      setSelectedTerminations(new Set());
      toast.success(`${editableTerminations.length} terminations updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update termination statuses");
    }
  };

  // Bulk approval operations - Manager only
  const handleBulkApproval = async (action: "approve" | "reject") => {
    if (!isManager || selectedTerminations.size === 0) return;

    const pendingTerminations = Array.from(selectedTerminations).filter((terminationId) => {
      const termination = terminations.find((t) => t.TerminationID === terminationId);
      return termination?.ApprovalStatus === "Pending";
    });

    if (pendingTerminations.length === 0) {
      toast.error("No pending terminations selected for approval action");
      return;
    }

    setBulkApprovalLoading(true);

    try {
      const promises = pendingTerminations.map((terminationId) => {
        if (action === "approve") {
          return terminationService.approveTermination({ terminationId });
        } else {
          return terminationService.rejectTermination({
            terminationId,
            rejectionReason: "Bulk rejection",
          });
        }
      });

      await Promise.all(promises);

      // Refresh terminations to get updated approval status
      await fetchTerminations();

      setSelectedTerminations(new Set());
      toast.success(`${pendingTerminations.length} terminations ${action}d successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} terminations`);
    } finally {
      setBulkApprovalLoading(false);
    }
  };

  // Delete termination handlers
  const openDeleteDialog = (termination: ContractTermination) => {
    if (!canEditTermination(termination)) {
      toast.error("Cannot delete approved terminations. Please reset approval status first if deletion is needed.");
      return;
    }
    setSelectedTermination(termination);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedTermination(null);
  };

  const handleDeleteTermination = async () => {
    if (!selectedTermination) return;

    try {
      const response = await terminationService.deleteTermination(selectedTermination.TerminationID);

      if (response.Status === 1) {
        setTerminations(terminations.filter((t) => t.TerminationID !== selectedTermination.TerminationID));
        toast.success("Termination deleted successfully");
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

  // Refund processing handlers
  const openRefundDialog = (termination: ContractTermination) => {
    setSelectedTermination(termination);
    setRefundDate(new Date());
    setRefundReference("");
    setIsRefundDialogOpen(true);
  };

  const closeRefundDialog = () => {
    setIsRefundDialogOpen(false);
    setSelectedTermination(null);
  };

  const handleProcessRefund = async () => {
    if (!selectedTermination || !refundDate || !refundReference) {
      toast.error("Please provide refund date and reference");
      return;
    }

    try {
      const response = await terminationService.processRefund(selectedTermination.TerminationID, refundDate, refundReference);

      if (response.Status === 1) {
        setTerminations(
          terminations.map((t) =>
            t.TerminationID === selectedTermination.TerminationID ? { ...t, IsRefundProcessed: true, RefundDate: refundDate, RefundReference: refundReference } : t
          )
        );
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

  // Change termination status
  const handleChangeStatus = async (termination: ContractTermination, newStatus: string) => {
    if (!canEditTermination(termination)) {
      toast.error("Cannot change status of approved terminations. Please reset approval status first if changes are needed.");
      return;
    }

    try {
      const response = await terminationService.changeTerminationStatus(termination.TerminationID, newStatus);

      if (response.Status === 1) {
        setTerminations(terminations.map((t) => (t.TerminationID === termination.TerminationID ? { ...t, TerminationStatus: newStatus } : t)));
        toast.success(`Termination status changed to ${newStatus}`);
      } else {
        toast.error(response.Message || "Failed to change termination status");
      }
    } catch (error) {
      console.error("Error changing termination status:", error);
      toast.error("Failed to change termination status");
    }
  };

  // Approval handlers for individual terminations
  const handleApproveTermination = async (termination: ContractTermination) => {
    if (!isManager) return;

    try {
      const response = await terminationService.approveTermination({ terminationId: termination.TerminationID });

      if (response.Status === 1) {
        setTerminations(terminations.map((t) => (t.TerminationID === termination.TerminationID ? { ...t, ApprovalStatus: "Approved" } : t)));
        toast.success("Termination approved successfully");
      } else {
        toast.error(response.Message || "Failed to approve termination");
      }
    } catch (error) {
      console.error("Error approving termination:", error);
      toast.error("Failed to approve termination");
    }
  };

  const handleRejectTermination = async (termination: ContractTermination) => {
    if (!isManager) return;

    try {
      const response = await terminationService.rejectTermination({
        terminationId: termination.TerminationID,
        rejectionReason: "Quick rejection from list",
      });

      if (response.Status === 1) {
        setTerminations(terminations.map((t) => (t.TerminationID === termination.TerminationID ? { ...t, ApprovalStatus: "Rejected" } : t)));
        toast.success("Termination rejected successfully");
      } else {
        toast.error(response.Message || "Failed to reject termination");
      }
    } catch (error) {
      console.error("Error rejecting termination:", error);
      toast.error("Failed to reject termination");
    }
  };

  // PDF generation helpers
  const filterEmptyParameters = (params: any) => {
    const filtered: any = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "" && value !== 0) {
        filtered[key] = value;
      }
    });

    return filtered;
  };

  const handleGenerateTerminationList = async () => {
    const parameters = {
      SearchText: filters.searchTerm || "",
      FilterCustomerID: filters.selectedCustomerId ? parseInt(filters.selectedCustomerId) : null,
      FilterTerminationStatus: filters.selectedStatus || "",
      FilterApprovalStatus: filters.selectedApprovalStatus || "",
      FilterFromDate: filters.dateFrom,
      FilterToDate: filters.dateTo,
      FilterPropertyID: filters.selectedPropertyId ? parseInt(filters.selectedPropertyId) : null,
      FilterEmailStatus: filters.emailStatus || "",
    };

    const filteredParameters = filterEmptyParameters(parameters);

    const response = await terminationListPdf.generateReport("termination-list", filteredParameters, {
      orientation: "Landscape",
      download: true,
      showToast: true,
      filename: `Termination_List_${new Date().toISOString().split("T")[0]}.pdf`,
    });

    if (response.success) {
      toast.success("Termination list report generated successfully");
    }
  };

  const handlePreviewTerminationList = async () => {
    const parameters = {
      SearchText: filters.searchTerm || "",
      FilterCustomerID: filters.selectedCustomerId ? parseInt(filters.selectedCustomerId) : null,
      FilterTerminationStatus: filters.selectedStatus || "",
      FilterApprovalStatus: filters.selectedApprovalStatus || "",
      FilterFromDate: filters.dateFrom,
      FilterToDate: filters.dateTo,
      FilterPropertyID: filters.selectedPropertyId ? parseInt(filters.selectedPropertyId) : null,
      FilterEmailStatus: filters.emailStatus || "",
    };

    const filteredParameters = filterEmptyParameters(parameters);

    setShowPdfPreview(true);

    const response = await terminationListPdf.generateReport("termination-list", filteredParameters, {
      orientation: "Landscape",
      download: false,
      showToast: false,
    });

    if (!response.success) {
      toast.error("Failed to generate termination list preview");
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: { variant: "secondary" as const, icon: FileText, className: "bg-gray-100 text-gray-800" },
      Pending: { variant: "default" as const, icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      Approved: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" },
      Completed: { variant: "default" as const, icon: CheckCircle, className: "bg-blue-100 text-blue-800" },
      Cancelled: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Render approval status badge
  const renderApprovalBadge = (status: string) => {
    const approvalConfig = {
      Pending: { icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      Approved: { icon: CheckCircle, className: "bg-green-100 text-green-800" },
      Rejected: { icon: XCircle, className: "bg-red-100 text-red-800" },
    };

    const config = approvalConfig[status as keyof typeof approvalConfig] || approvalConfig.Pending;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Render email status indicator
  const renderEmailStatusIndicator = (termination: ContractTermination) => {
    if (termination.EmailNotificationSent) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <MailCheck className="h-4 w-4 text-green-600" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Email notification sent</p>
            {termination.LastEmailSentDate && <p className="text-xs">Last sent: {format(new Date(termination.LastEmailSentDate), "MMM dd, yyyy")}</p>}
          </TooltipContent>
        </Tooltip>
      );
    }

    if (termination.EmailNotificationFailed) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <MailX className="h-4 w-4 text-red-600" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Email notification failed</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    if (termination.EmailNotificationPending) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <Clock className="h-4 w-4 text-yellow-600" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Email notification pending</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger>
          <Mail className="h-4 w-4 text-gray-400" />
        </TooltipTrigger>
        <TooltipContent>
          <p>No email sent</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate statistics
  const stats: TerminationListStats = useMemo(() => {
    const filtered = filteredTerminations;
    return {
      total: filtered.length,
      draft: filtered.filter((t) => t.TerminationStatus === "Draft").length,
      pending: filtered.filter((t) => t.TerminationStatus === "Pending").length,
      approved: filtered.filter((t) => t.TerminationStatus === "Approved").length,
      completed: filtered.filter((t) => t.TerminationStatus === "Completed").length,
      cancelled: filtered.filter((t) => t.TerminationStatus === "Cancelled").length,
      totalSecurityDeposit: filtered.reduce((sum, t) => sum + (t.SecurityDepositAmount || 0), 0),
      totalRefunds: filtered.reduce((sum, t) => sum + (t.RefundAmount || 0), 0),
      averageRefund: filtered.length > 0 ? filtered.reduce((sum, t) => sum + (t.RefundAmount || 0), 0) / filtered.length : 0,
      approvalPending: filtered.filter((t) => t.ApprovalStatus === "Pending").length,
      approvalApproved: filtered.filter((t) => t.ApprovalStatus === "Approved").length,
      approvalRejected: filtered.filter((t) => t.ApprovalStatus === "Rejected").length,
      approvedProtected: filtered.filter((t) => t.ApprovalStatus === "Approved").length,
      pendingRefunds: filtered.filter((t) => t.RefundAmount > 0 && !t.IsRefundProcessed).length,
      // Email-related stats
      emailNotificationsSent: filtered.filter((t) => t.EmailNotificationSent === true).length,
      pendingEmailReminders: filtered.filter((t) => t.EmailNotificationPending === true).length,
      movingOutSoon: filtered.filter((t) => {
        if (t.TerminationStatus !== "Approved") return false;
        const moveOutDate = t.MoveOutDate ? new Date(t.MoveOutDate) : null;
        if (!moveOutDate) return false;
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        return moveOutDate <= sevenDaysFromNow && moveOutDate > new Date();
      }).length,
      keyReturnPending: filtered.filter((t) => {
        const moveOutDate = t.MoveOutDate ? new Date(t.MoveOutDate) : null;
        const keyReturnDate = t.KeyReturnDate ? new Date(t.KeyReturnDate) : null;
        return t.TerminationStatus === "Approved" && moveOutDate && moveOutDate < new Date() && (!keyReturnDate || keyReturnDate > new Date());
      }).length,
    };
  }, [filteredTerminations]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.searchTerm ||
    filters.selectedCustomerId ||
    filters.selectedStatus ||
    filters.selectedApprovalStatus ||
    filters.selectedPropertyId ||
    filters.emailStatus ||
    filters.dateFrom ||
    filters.dateTo;

  if (loading || isCompanyChanging) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {isCompanyChanging && (
          <div className="text-center">
            <p className="text-muted-foreground">Switching to {currentCompanyName}...</p>
            <p className="text-sm text-muted-foreground">Loading terminations for the selected company</p>
          </div>
        )}
      </div>
    );
  }
  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Contract Termination Management</h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">Manage rental contract terminations and security deposit processing with automated email communications</p>
              {currentCompanyName && (
                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700">
                  <Building className="mr-1 h-3 w-3" />
                  {currentCompanyName}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Move Out Reminders */}
            {stats.movingOutSoon > 0 && (
              <Button variant="outline" onClick={handleSendMoveOutReminders} className="bg-orange-50 border-orange-200 text-orange-800">
                <MoveRight className="mr-2 h-4 w-4" />
                {stats.movingOutSoon} Moving Out Soon
              </Button>
            )}

            {/* Key Return Reminders */}
            {stats.keyReturnPending > 0 && (
              <Button variant="outline" onClick={handleSendKeyReturnReminders} className="bg-red-50 border-red-200 text-red-800">
                <KeyRound className="mr-2 h-4 w-4" />
                {stats.keyReturnPending} Key Returns Pending
              </Button>
            )}

            {/* Email Notifications Summary */}
            {stats.emailNotificationsSent > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="bg-blue-50 border-blue-200 text-blue-800">
                    <MailCheck className="mr-2 h-4 w-4" />
                    {stats.emailNotificationsSent} Emails Sent
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stats.emailNotificationsSent} terminations have email notifications sent</p>
                </TooltipContent>
              </Tooltip>
            )}

            {isManager && stats.approvalPending > 0 && (
              <Button variant="outline" onClick={handleViewPendingApprovals} className="bg-yellow-50 border-yellow-200 text-yellow-800">
                <Shield className="mr-2 h-4 w-4" />
                {stats.approvalPending} Pending Approval{stats.approvalPending !== 1 ? "s" : ""}
              </Button>
            )}

            {stats.approvedProtected > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="bg-green-50 border-green-200 text-green-800">
                    <Lock className="mr-2 h-4 w-4" />
                    {stats.approvedProtected} Protected
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stats.approvedProtected} approved terminations are protected from modifications</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button onClick={handleAddTermination}>
              <Plus className="mr-2 h-4 w-4" />
              New Termination
            </Button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">{hasActiveFilters ? `of ${terminations.length} total` : "terminations"}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-muted-foreground">Draft</span>
              </div>
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Approved</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Completed</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-muted-foreground">Cancelled</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            </CardContent>
          </Card>

          {/* Email-specific stats */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MailCheck className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Emails Sent</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.emailNotificationsSent}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MoveRight className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">Moving Out Soon</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.movingOutSoon}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-red-600" />
                <span className="text-sm text-muted-foreground">Key Returns Due</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{stats.keyReturnPending}</div>
            </CardContent>
          </Card>

          {isManager && (
            <>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-muted-foreground">Approval Pending</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.approvalPending}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">Approved</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{stats.approvalApproved}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">Protected</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{stats.approvedProtected}</div>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HandCoins className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Total Deposits</span>
              </div>
              <div className="text-lg font-bold text-blue-600">{formatCurrency(stats.totalSecurityDeposit)}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HandCoins className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Total Refunds</span>
              </div>
              <div className="text-lg font-bold text-green-600">{formatCurrency(stats.totalRefunds)}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">Pending Refunds</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingRefunds}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Terminations</CardTitle>
                <CardDescription>
                  {hasActiveFilters ? `Showing ${filteredTerminations.length} of ${terminations.length} terminations` : `Showing all ${terminations.length} terminations`}
                  {stats.approvedProtected > 0 && <span className="ml-2 text-green-600">• {stats.approvedProtected} approved terminations are protected from modifications</span>}
                  {stats.emailNotificationsSent > 0 && <span className="ml-2 text-blue-600">• {stats.emailNotificationsSent} have email notifications sent</span>}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Email Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={emailIntegration.isLoading}>
                      {emailIntegration.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                      Email Actions
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Automated Reminders</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleSendMoveOutReminders} disabled={stats.movingOutSoon === 0}>
                      <MoveRight className="mr-2 h-4 w-4" />
                      Send Move Out Reminders ({stats.movingOutSoon})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSendKeyReturnReminders} disabled={stats.keyReturnPending === 0}>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Send Key Return Reminders ({stats.keyReturnPending})
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Bulk Email Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleBulkEmail("termination_notification")} disabled={selectedTerminations.size === 0 || isBulkEmailing}>
                      <Send className="mr-2 h-4 w-4" />
                      Send Termination Notifications ({selectedTerminations.size})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkEmail("refund_notification")} disabled={selectedTerminations.size === 0 || isBulkEmailing}>
                      <HandCoins className="mr-2 h-4 w-4" />
                      Send Refund Notifications ({selectedTerminations.size})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkEmail("move_out_reminder")} disabled={selectedTerminations.size === 0 || isBulkEmailing}>
                      <CalendarClock className="mr-2 h-4 w-4" />
                      Send Move Out Reminders ({selectedTerminations.size})
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowEmailRemindersDialog(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Configure Email Reminders
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* PDF Generation */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={terminationListPdf.isLoading}>
                      {terminationListPdf.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      Export
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handlePreviewTerminationList}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleGenerateTerminationList}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Bulk Operations */}
                {selectedTerminations.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        Bulk Actions ({selectedTerminations.size})
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                      {terminationStatusOptions.map((status) => (
                        <DropdownMenuItem key={status} onClick={() => handleBulkStatusChange(status)}>
                          Set as {status}
                        </DropdownMenuItem>
                      ))}

                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Email Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleBulkEmail("termination_notification")} disabled={isBulkEmailing}>
                        <Send className="mr-2 h-4 w-4" />
                        Send Termination Notifications
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkEmail("refund_notification")} disabled={isBulkEmailing}>
                        <HandCoins className="mr-2 h-4 w-4" />
                        Send Refund Notifications
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkEmail("move_out_reminder")} disabled={isBulkEmailing}>
                        <CalendarClock className="mr-2 h-4 w-4" />
                        Send Move Out Reminders
                      </DropdownMenuItem>

                      {isManager && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Approval Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleBulkApproval("approve")} disabled={bulkApprovalLoading}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                            Approve Selected
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkApproval("reject")} disabled={bulkApprovalLoading}>
                            <XCircle className="mr-2 h-4 w-4 text-red-600" />
                            Reject Selected
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={cn(showFilters && "bg-accent")}>
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      !
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Search and Filters */}
            <div className="space-y-4 mb-6">
              {/* Search Bar */}
              <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder="Search terminations..." className="pl-9" defaultValue={filters.searchTerm} onChange={handleSearchChange} />
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4 p-4 bg-muted/50 rounded-lg">
                  <Select value={filters.selectedCustomerId || "all"} onValueChange={(value) => handleFilterChange("selectedCustomerId", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.CustomerID} value={customer.CustomerID.toString()}>
                          {customer.CustomerFullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.selectedStatus || "all"} onValueChange={(value) => handleFilterChange("selectedStatus", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {terminationStatusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.selectedApprovalStatus || "all"} onValueChange={(value) => handleFilterChange("selectedApprovalStatus", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Approval Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Approval Status</SelectItem>
                      {approvalStatusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.emailStatus || "all"} onValueChange={(value) => handleFilterChange("emailStatus", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Email Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {emailStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value || "all"}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {properties.length > 0 && (
                    <Select value={filters.selectedPropertyId || "all"} onValueChange={(value) => handleFilterChange("selectedPropertyId", value === "all" ? "" : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Property" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Properties</SelectItem>
                        {properties.map((property) => (
                          <SelectItem key={property.PropertyID} value={property.PropertyID.toString()}>
                            {property.PropertyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <DatePicker value={filters.dateFrom} onChange={(date) => handleFilterChange("dateFrom", date)} placeholder="From date" />

                  <DatePicker value={filters.dateTo} onChange={(date) => handleFilterChange("dateTo", date)} placeholder="To date" />

                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={clearFilters} size="sm">
                      <X className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {filters.searchTerm && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("searchTerm", "")}>
                      Search: {filters.searchTerm} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  {filters.selectedCustomerId && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("selectedCustomerId", "")}>
                      Customer: {customers.find((c) => c.CustomerID.toString() === filters.selectedCustomerId)?.CustomerFullName}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  {filters.selectedStatus && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("selectedStatus", "")}>
                      Status: {filters.selectedStatus} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  {filters.selectedApprovalStatus && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("selectedApprovalStatus", "")}>
                      Approval: {filters.selectedApprovalStatus} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  {filters.emailStatus && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("emailStatus", "")}>
                      Email: {emailStatusOptions.find((o) => o.value === filters.emailStatus)?.label} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  {filters.dateFrom && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("dateFrom", undefined)}>
                      From: {formatDate(filters.dateFrom)} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  {filters.dateTo && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("dateTo", undefined)}>
                      To: {formatDate(filters.dateTo)} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            {/* Terminations Table */}
            {filteredTerminations.length === 0 ? (
              <div className="text-center py-10">
                {hasActiveFilters ? (
                  <div>
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No terminations found matching your criteria.</p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div>
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No terminations found. Create your first termination to get started.</p>
                    <Button onClick={handleAddTermination}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Termination
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedTerminations.size === filteredTerminations.length && filteredTerminations.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all terminations"
                        />
                      </TableHead>
                      <TableHead className="w-[180px] cursor-pointer" onClick={() => handleSort("TerminationNo")}>
                        <div className="flex items-center gap-1">
                          Termination #
                          {sortConfig.key === "TerminationNo" ? (
                            sortConfig.direction === "asc" ? (
                              <SortAsc className="h-4 w-4" />
                            ) : (
                              <SortDesc className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("CustomerFullName")}>
                        <div className="flex items-center gap-1">
                          Contract & Customer
                          {sortConfig.key === "CustomerFullName" ? (
                            sortConfig.direction === "asc" ? (
                              <SortAsc className="h-4 w-4" />
                            ) : (
                              <SortDesc className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("TerminationDate")}>
                        <div className="flex items-center gap-1">
                          Dates
                          {sortConfig.key === "TerminationDate" ? (
                            sortConfig.direction === "asc" ? (
                              <SortAsc className="h-4 w-4" />
                            ) : (
                              <SortDesc className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("SecurityDepositAmount")}>
                        <div className="flex items-center gap-1">
                          Security Deposit
                          {sortConfig.key === "SecurityDepositAmount" ? (
                            sortConfig.direction === "asc" ? (
                              <SortAsc className="h-4 w-4" />
                            ) : (
                              <SortDesc className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("TerminationStatus")}>
                        <div className="flex items-center gap-1">
                          Status
                          {sortConfig.key === "TerminationStatus" ? (
                            sortConfig.direction === "asc" ? (
                              <SortAsc className="h-4 w-4" />
                            ) : (
                              <SortDesc className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("ApprovalStatus")}>
                        <div className="flex items-center gap-1">
                          Approval
                          {sortConfig.key === "ApprovalStatus" ? (
                            sortConfig.direction === "asc" ? (
                              <SortAsc className="h-4 w-4" />
                            ) : (
                              <SortDesc className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTerminations.map((termination) => {
                      const isApproved = termination.ApprovalStatus === "Approved";
                      const canEdit = canEditTermination(termination);

                      return (
                        <TableRow
                          key={termination.TerminationID}
                          className={cn(
                            "hover:bg-muted/50 transition-colors",
                            selectedTerminations.has(termination.TerminationID) && "bg-accent/50",
                            isApproved && "bg-green-50/30"
                          )}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedTerminations.has(termination.TerminationID)}
                              onCheckedChange={(checked) => handleSelectTermination(termination.TerminationID, checked as boolean)}
                              aria-label={`Select termination ${termination.TerminationNo}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium">{termination.TerminationNo}</div>
                                <div className="text-sm text-muted-foreground">ID: {termination.TerminationID}</div>
                              </div>
                              {isApproved && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Lock className="h-3 w-3 text-green-600" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Protected - Approved terminations cannot be modified</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                                <div className="font-medium">{termination.ContractNo}</div>
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                                <div className="text-sm">{termination.CustomerFullName}</div>
                              </div>
                              {termination.CustomerEmail && <div className="text-xs text-muted-foreground ml-6">{termination.CustomerEmail}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{termination.PropertyName}</div>
                                {termination.UnitNumbers && <div className="text-sm text-muted-foreground">Units: {termination.UnitNumbers}</div>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Notice:</span>
                                <span>{formatDate(termination.NoticeDate)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Effective:</span>
                                <span className="font-medium">{formatDate(termination.EffectiveDate)}</span>
                              </div>
                              {termination.MoveOutDate && (
                                <div className="flex items-center gap-1">
                                  <MoveRight className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Move Out:</span>
                                  <span>{formatDate(termination.MoveOutDate)}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{formatCurrency(termination.SecurityDepositAmount)}</div>
                              {termination.RefundAmount > 0 && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Refund:</span>
                                  <span className="font-medium text-green-600 ml-1">{formatCurrency(termination.RefundAmount)}</span>
                                  {termination.IsRefundProcessed && (
                                    <Badge variant="outline" className="ml-2 text-xs py-0">
                                      Processed
                                    </Badge>
                                  )}
                                </div>
                              )}
                              {termination.CreditNoteAmount > 0 && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Credit:</span>
                                  <span className="font-medium text-red-600 ml-1">{formatCurrency(termination.CreditNoteAmount)}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{renderStatusBadge(termination.TerminationStatus)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {termination.RequiresApproval ? (
                                renderApprovalBadge(termination.ApprovalStatus)
                              ) : (
                                <Badge variant="outline" className="bg-gray-50">
                                  No Approval Required
                                </Badge>
                              )}
                              {isApproved && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Shield className="h-3 w-3 text-green-600 ml-1" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Protected from modifications</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">{renderEmailStatusIndicator(termination)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {termination.CreatedBy && <div>{termination.CreatedBy}</div>}
                              {termination.CreatedOn && <div className="text-muted-foreground">{formatDate(termination.CreatedOn)}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewTermination(termination)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>

                                {canEdit ? (
                                  <DropdownMenuItem onClick={() => handleEditTermination(termination)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <DropdownMenuItem disabled>
                                          <Lock className="mr-2 h-4 w-4" />
                                          Edit (Protected)
                                        </DropdownMenuItem>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Cannot edit approved terminations</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Email Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleSendEmail(termination)}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Custom Email
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendEmail(termination, "termination_notification")}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Termination Notification
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendEmail(termination, "move_out_reminder")}>
                                  <CalendarClock className="mr-2 h-4 w-4" />
                                  Move Out Reminder
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendEmail(termination, "refund_notification")}>
                                  <HandCoins className="mr-2 h-4 w-4" />
                                  Refund Notification
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendEmail(termination, "key_return_reminder")}>
                                  <KeyRound className="mr-2 h-4 w-4" />
                                  Key Return Reminder
                                </DropdownMenuItem>

                                {isManager && termination.RequiresApproval && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="font-medium text-muted-foreground">Approval Actions</DropdownMenuLabel>

                                    {termination.ApprovalStatus === "Pending" && (
                                      <>
                                        <DropdownMenuItem onClick={() => handleApproveTermination(termination)}>
                                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                          Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRejectTermination(termination)}>
                                          <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                          Reject
                                        </DropdownMenuItem>
                                      </>
                                    )}

                                    {termination.ApprovalStatus !== "Pending" && (
                                      <DropdownMenuItem onClick={() => navigate(`/terminations/${termination.TerminationID}`)}>
                                        <RotateCcw className="mr-2 h-4 w-4 text-blue-600" />
                                        Reset Approval
                                      </DropdownMenuItem>
                                    )}
                                  </>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuLabel className="font-medium text-muted-foreground">Change Status</DropdownMenuLabel>

                                {terminationStatusOptions
                                  .filter((status) => status !== termination.TerminationStatus)
                                  .map((status) => (
                                    <DropdownMenuItem key={status} onClick={() => handleChangeStatus(termination, status)} disabled={!canEdit}>
                                      {canEdit ? (
                                        <>Set as {status}</>
                                      ) : (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center w-full">
                                              <Lock className="mr-2 h-4 w-4" />
                                              Set as {status} (Protected)
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Cannot change status of approved terminations</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </DropdownMenuItem>
                                  ))}

                                {termination.TerminationStatus === "Approved" && termination.RefundAmount > 0 && !termination.IsRefundProcessed && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => openRefundDialog(termination)}>
                                      <HandCoins className="mr-2 h-4 w-4" />
                                      Process Refund
                                    </DropdownMenuItem>
                                  </>
                                )}

                                <DropdownMenuSeparator />

                                {canEdit ? (
                                  <DropdownMenuItem
                                    className="text-red-500"
                                    onClick={() => openDeleteDialog(termination)}
                                    disabled={termination.TerminationStatus === "Approved" || termination.TerminationStatus === "Completed"}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <DropdownMenuItem disabled>
                                          <Lock className="mr-2 h-4 w-4" />
                                          Delete (Protected)
                                        </DropdownMenuItem>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Cannot delete approved terminations</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Send Dialog */}
        {emailDialogTermination && (
          <EmailSendDialog
            isOpen={isEmailDialogOpen}
            onClose={() => setIsEmailDialogOpen(false)}
            entityType="termination"
            entityId={emailDialogTermination.TerminationID}
            entityData={emailDialogTermination}
            defaultRecipients={getDefaultEmailRecipients(emailDialogTermination)}
            triggerEvent={emailTriggerEvent}
            onEmailSent={handleEmailSent}
          />
        )}

        {/* PDF Preview Modal */}
        <PdfPreviewModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          pdfBlob={terminationListPdf.data}
          title="Termination List Report"
          isLoading={terminationListPdf.isLoading}
          error={terminationListPdf.error}
          onDownload={() => terminationListPdf.downloadCurrentPdf("Termination_List_Report.pdf")}
          onRefresh={handlePreviewTerminationList}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={handleDeleteTermination}
          title="Delete Termination"
          description={
            selectedTermination
              ? `Are you sure you want to delete termination "${selectedTermination.TerminationNo}"? This action cannot be undone.`
              : "Are you sure you want to delete this termination?"
          }
          cancelText="Cancel"
          confirmText="Delete"
          type="danger"
        />

        {/* Refund Processing Dialog */}
        <ConfirmationDialog
          isOpen={isRefundDialogOpen}
          onClose={closeRefundDialog}
          onConfirm={handleProcessRefund}
          title="Process Refund"
          description={
            <div className="space-y-4">
              <p>Enter refund details for termination {selectedTermination?.TerminationNo}:</p>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Refund Date</label>
                <DatePicker value={refundDate} onChange={setRefundDate} placeholder="Select refund date" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Refund Reference</label>
                <Input placeholder="Enter refund reference" value={refundReference} onChange={(e) => setRefundReference(e.target.value)} />
              </div>
            </div>
          }
          cancelText="Cancel"
          confirmText="Process Refund"
          type="warning"
          confirmDisabled={!refundDate || !refundReference}
        />
      </div>
    </TooltipProvider>
  );
};

export default TerminationList;
