// src/pages/contract/ContractList.tsx - Enhanced with Email Integration
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
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Separator } from "@/components/ui/separator";
import { contractService, Contract } from "@/services/contractService";
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

// Types and interfaces
interface ContractFilter {
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
  key: keyof Contract | null;
  direction: "asc" | "desc";
}

interface ContractListStats {
  total: number;
  draft: number;
  pending: number;
  active: number;
  completed: number;
  expired: number;
  cancelled: number;
  totalValue: number;
  averageValue: number;
  approvalPending: number;
  approvalApproved: number;
  approvalRejected: number;
  approvedProtected: number;
  // Email-related stats
  emailNotificationsSent: number;
  pendingEmailReminders: number;
  expiringSoon: number;
}

// Email reminder types
interface EmailReminderConfig {
  triggerEvent: string;
  triggerName: string;
  description: string;
  defaultEnabled: boolean;
}

const CONTRACT_EMAIL_REMINDERS: EmailReminderConfig[] = [
  {
    triggerEvent: "contract_expiring_30",
    triggerName: "Expiring in 30 Days",
    description: "Send reminder 30 days before contract expiration",
    defaultEnabled: true,
  },
  {
    triggerEvent: "contract_expiring_7",
    triggerName: "Expiring in 7 Days",
    description: "Send reminder 7 days before contract expiration",
    defaultEnabled: true,
  },
  {
    triggerEvent: "payment_reminder",
    triggerName: "Payment Reminder",
    description: "Send payment reminder notifications",
    defaultEnabled: false,
  },
  {
    triggerEvent: "document_expiry_reminder",
    triggerName: "Document Expiry",
    description: "Remind about expiring documents",
    defaultEnabled: false,
  },
];

const ContractList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedContracts, setSelectedContracts] = useState<Set<number>>(new Set());

  // Filter and sort state
  const [filters, setFilters] = useState<ContractFilter>({
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
  const contractListPdf = useGenericPdfReport();

  // Approval state
  const [bulkApprovalAction, setBulkApprovalAction] = useState<"approve" | "reject" | null>(null);
  const [bulkApprovalLoading, setBulkApprovalLoading] = useState(false);

  // Email integration states
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailDialogContract, setEmailDialogContract] = useState<Contract | null>(null);
  const [emailTriggerEvent, setEmailTriggerEvent] = useState<string | undefined>(undefined);
  const [isBulkEmailing, setIsBulkEmailing] = useState(false);
  const [showEmailRemindersDialog, setShowEmailRemindersDialog] = useState(false);

  // Contract status and approval options
  const contractStatusOptions = ["Draft", "Pending", "Active", "Expired", "Cancelled", "Completed", "Terminated"];
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
    entityType: "contract",
    entityId: 0, // Will be set when needed
  });

  // Initialize data on component mount
  useEffect(() => {
    initializeData();
    // Load email templates for contract category
    emailIntegration.loadEmailTemplates("Contract");
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

  // Apply filters and sorting whenever contracts or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [contracts, filters, sortConfig]);

  // Initialize component data
  const initializeData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchContracts(), fetchCustomers(), fetchProperties()]);
    } catch (error) {
      console.error("Error initializing data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all contracts
  const fetchContracts = async () => {
    try {
      const contractsData = await contractService.getAllContracts();
      setContracts(contractsData);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Failed to load contracts");
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
      await fetchContracts();
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  // Apply filters and sorting
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...contracts];

    // Apply text search
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (contract) =>
          contract.ContractNo?.toLowerCase().includes(searchLower) ||
          contract.CustomerName?.toLowerCase().includes(searchLower) ||
          contract.JointCustomerName?.toLowerCase().includes(searchLower) ||
          contract.Remarks?.toLowerCase().includes(searchLower)
      );
    }

    // Apply customer filter
    if (filters.selectedCustomerId) {
      filtered = filtered.filter(
        (contract) => contract.CustomerID.toString() === filters.selectedCustomerId || contract.JointCustomerID?.toString() === filters.selectedCustomerId
      );
    }

    // Apply status filter
    if (filters.selectedStatus) {
      filtered = filtered.filter((contract) => contract.ContractStatus === filters.selectedStatus);
    }

    // Apply approval status filter
    if (filters.selectedApprovalStatus) {
      filtered = filtered.filter((contract) => contract.ApprovalStatus === filters.selectedApprovalStatus);
    }

    // Apply email status filter
    if (filters.emailStatus) {
      switch (filters.emailStatus) {
        case "sent":
          filtered = filtered.filter((contract) => contract.EmailNotificationSent === true);
          break;
        case "not_sent":
          filtered = filtered.filter((contract) => contract.EmailNotificationSent !== true);
          break;
        case "pending":
          filtered = filtered.filter((contract) => contract.EmailNotificationPending === true);
          break;
        case "failed":
          filtered = filtered.filter((contract) => contract.EmailNotificationFailed === true);
          break;
      }
    }

    // Apply date filters
    if (filters.dateFrom) {
      filtered = filtered.filter((contract) => new Date(contract.TransactionDate) >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter((contract) => new Date(contract.TransactionDate) <= filters.dateTo!);
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

    setFilteredContracts(filtered);
  }, [contracts, filters, sortConfig]);

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
  const handleFilterChange = (key: keyof ContractFilter, value: any) => {
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
  const handleSort = (key: keyof Contract) => {
    setSortConfig((prevSort) => ({
      key,
      direction: prevSort.key === key && prevSort.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Check if contract can be edited
  const canEditContract = (contract: Contract) => {
    return contract.ApprovalStatus !== "Approved";
  };

  // Email helper functions
  const getDefaultEmailRecipients = (contract: Contract) => {
    const recipients = [];

    if (contract.CustomerEmail) {
      recipients.push({
        email: contract.CustomerEmail,
        name: contract.CustomerName,
        type: "to" as const,
      });
    }

    if (contract.JointCustomerEmail) {
      recipients.push({
        email: contract.JointCustomerEmail,
        name: contract.JointCustomerName || "Joint Customer",
        type: "to" as const,
      });
    }

    return recipients;
  };

  // Email action handlers
  const handleSendEmail = (contract: Contract, triggerEvent?: string) => {
    setEmailDialogContract(contract);
    setEmailTriggerEvent(triggerEvent);
    setIsEmailDialogOpen(true);
  };

  const handleEmailSent = async (result: any) => {
    if (result.success) {
      toast.success("Email sent successfully");
      // Optionally update the contract's email status
      if (emailDialogContract) {
        setContracts(
          contracts.map((c) => (c.ContractID === emailDialogContract.ContractID ? { ...c, EmailNotificationSent: true, LastEmailSentDate: new Date().toISOString() } : c))
        );
      }
    }
  };

  // Bulk email operations
  const handleBulkEmail = async (triggerEvent: string) => {
    if (selectedContracts.size === 0) {
      toast.error("Please select contracts to send emails");
      return;
    }

    setIsBulkEmailing(true);

    try {
      const contractsToEmail = Array.from(selectedContracts)
        .map((contractId) => contracts.find((c) => c.ContractID === contractId))
        .filter(Boolean) as Contract[];

      const emailPromises = contractsToEmail.map(async (contract) => {
        const recipients = getDefaultEmailRecipients(contract);
        if (recipients.length === 0) {
          return { contract, success: false, error: "No email recipients found" };
        }

        try {
          const contractVariables = emailIntegration.generateContractVariables(contract, {
            customerEmail: recipients[0]?.email,
          });

          const result = await emailIntegration.sendAutomatedEmail(triggerEvent, contractVariables, recipients);

          return { contract, success: result.success, result };
        } catch (error) {
          return { contract, success: false, error: error.message };
        }
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} emails sent successfully`);

        // Update contracts with email sent status
        setContracts(
          contracts.map((contract) => {
            const result = results.find((r) => r.contract.ContractID === contract.ContractID);
            if (result && result.success) {
              return { ...contract, EmailNotificationSent: true, LastEmailSentDate: new Date().toISOString() };
            }
            return contract;
          })
        );
      }

      if (failureCount > 0) {
        toast.warning(`${failureCount} emails failed to send`);
      }

      setSelectedContracts(new Set());
    } catch (error) {
      console.error("Bulk email error:", error);
      toast.error("Failed to send bulk emails");
    } finally {
      setIsBulkEmailing(false);
    }
  };

  // Automated reminder handlers
  const handleSendExpiryReminders = async () => {
    try {
      // Find contracts expiring in the next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringContracts = contracts.filter((contract) => {
        if (contract.ContractStatus !== "Active") return false;

        // This would need actual expiry date logic based on your contract structure
        // For now, using transaction date + 1 year as example
        const expiryDate = new Date(contract.TransactionDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
      });

      if (expiringContracts.length === 0) {
        toast.info("No contracts are expiring in the next 30 days");
        return;
      }

      const emailPromises = expiringContracts.map(async (contract) => {
        const recipients = getDefaultEmailRecipients(contract);
        if (recipients.length === 0) return { contract, success: false };

        try {
          const contractVariables = emailIntegration.generateContractVariables(contract, {
            customerEmail: recipients[0]?.email,
            expiryDate: new Date(contract.TransactionDate).setFullYear(new Date(contract.TransactionDate).getFullYear() + 1),
          });

          const result = await emailIntegration.sendAutomatedEmail("contract_expiring_30", contractVariables, recipients);

          return { contract, success: result.success };
        } catch (error) {
          return { contract, success: false };
        }
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter((r) => r.success).length;

      if (successCount > 0) {
        toast.success(`Expiry reminders sent for ${successCount} contracts`);
      } else {
        toast.error("Failed to send expiry reminders");
      }
    } catch (error) {
      console.error("Error sending expiry reminders:", error);
      toast.error("Failed to send expiry reminders");
    }
  };

  // Navigation handlers
  const handleAddContract = () => {
    navigate("/contracts/new");
  };

  const handleEditContract = (contract: Contract) => {
    if (!canEditContract(contract)) {
      toast.error("Cannot edit approved contracts. Please reset approval status first if changes are needed.");
      return;
    }
    navigate(`/contracts/edit/${contract.ContractID}`);
  };

  const handleViewContract = (contract: Contract) => {
    navigate(`/contracts/${contract.ContractID}`);
  };

  const handleRenewContract = (contract: Contract) => {
    navigate(`/contracts/${contract.ContractID}?action=renew`);
  };

  // Analytics navigation
  const handleViewAnalytics = () => {
    navigate("/contracts/analytics");
  };

  const handleViewPendingApprovals = () => {
    setFilters((prev) => ({ ...prev, selectedApprovalStatus: "Pending" }));
    setShowFilters(true);
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContracts(new Set(filteredContracts.map((c) => c.ContractID)));
    } else {
      setSelectedContracts(new Set());
    }
  };

  const handleSelectContract = (contractId: number, checked: boolean) => {
    const newSelection = new Set(selectedContracts);
    if (checked) {
      newSelection.add(contractId);
    } else {
      newSelection.delete(contractId);
    }
    setSelectedContracts(newSelection);
  };

  // Bulk operations
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedContracts.size === 0) return;

    const editableContracts = Array.from(selectedContracts).filter((contractId) => {
      const contract = contracts.find((c) => c.ContractID === contractId);
      return contract && canEditContract(contract);
    });

    if (editableContracts.length === 0) {
      toast.error("Selected contracts cannot be modified as they are approved. Please reset approval status first.");
      return;
    }

    if (editableContracts.length < selectedContracts.size) {
      const skippedCount = selectedContracts.size - editableContracts.length;
      toast.warning(`${skippedCount} approved contracts were skipped from status change.`);
    }

    try {
      const promises = editableContracts.map((contractId) => contractService.changeContractStatus(contractId, newStatus));

      await Promise.all(promises);

      setContracts((prev) => prev.map((contract) => (editableContracts.includes(contract.ContractID) ? { ...contract, ContractStatus: newStatus } : contract)));

      setSelectedContracts(new Set());
      toast.success(`${editableContracts.length} contracts updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update contract statuses");
    }
  };

  // Bulk approval operations - Manager only
  const handleBulkApproval = async (action: "approve" | "reject") => {
    if (!isManager || selectedContracts.size === 0) return;

    const pendingContracts = Array.from(selectedContracts).filter((contractId) => {
      const contract = contracts.find((c) => c.ContractID === contractId);
      return contract?.ApprovalStatus === "Pending";
    });

    if (pendingContracts.length === 0) {
      toast.error("No pending contracts selected for approval action");
      return;
    }

    setBulkApprovalLoading(true);

    try {
      const promises = pendingContracts.map((contractId) => {
        if (action === "approve") {
          return contractService.approveContract({ contractId });
        } else {
          return contractService.rejectContract({
            contractId,
            rejectionReason: "Bulk rejection",
          });
        }
      });

      await Promise.all(promises);

      await fetchContracts();

      setSelectedContracts(new Set());
      toast.success(`${pendingContracts.length} contracts ${action}d successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} contracts`);
    } finally {
      setBulkApprovalLoading(false);
    }
  };

  // Delete contract handlers
  const openDeleteDialog = (contract: Contract) => {
    if (!canEditContract(contract)) {
      toast.error("Cannot delete approved contracts. Please reset approval status first if deletion is needed.");
      return;
    }
    setSelectedContract(contract);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedContract(null);
  };

  const handleDeleteContract = async () => {
    if (!selectedContract) return;

    try {
      const response = await contractService.deleteContract(selectedContract.ContractID);

      if (response.Status === 1) {
        setContracts(contracts.filter((c) => c.ContractID !== selectedContract.ContractID));
        toast.success("Contract deleted successfully");
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

  // Change contract status
  const handleChangeStatus = async (contract: Contract, newStatus: string) => {
    if (!canEditContract(contract)) {
      toast.error("Cannot change status of approved contracts. Please reset approval status first if changes are needed.");
      return;
    }

    try {
      const response = await contractService.changeContractStatus(contract.ContractID, newStatus);

      if (response.Status === 1) {
        setContracts(contracts.map((c) => (c.ContractID === contract.ContractID ? { ...c, ContractStatus: newStatus } : c)));
        toast.success(`Contract status changed to ${newStatus}`);
      } else {
        toast.error(response.Message || "Failed to change contract status");
      }
    } catch (error) {
      console.error("Error changing contract status:", error);
      toast.error("Failed to change contract status");
    }
  };

  // Approval handlers for individual contracts
  const handleApproveContract = async (contract: Contract) => {
    if (!isManager) return;

    try {
      const response = await contractService.approveContract({ contractId: contract.ContractID });

      if (response.Status === 1) {
        setContracts(contracts.map((c) => (c.ContractID === contract.ContractID ? { ...c, ApprovalStatus: "Approved" } : c)));
        toast.success("Contract approved successfully");
      } else {
        toast.error(response.Message || "Failed to approve contract");
      }
    } catch (error) {
      console.error("Error approving contract:", error);
      toast.error("Failed to approve contract");
    }
  };

  const handleRejectContract = async (contract: Contract) => {
    if (!isManager) return;

    try {
      const response = await contractService.rejectContract({
        contractId: contract.ContractID,
        rejectionReason: "Quick rejection from list",
      });

      if (response.Status === 1) {
        setContracts(contracts.map((c) => (c.ContractID === contract.ContractID ? { ...c, ApprovalStatus: "Rejected" } : c)));
        toast.success("Contract rejected successfully");
      } else {
        toast.error(response.Message || "Failed to reject contract");
      }
    } catch (error) {
      console.error("Error rejecting contract:", error);
      toast.error("Failed to reject contract");
    }
  };

  // PDF generation handlers
  const filterEmptyParameters = (params) => {
    const filtered = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "" && value !== 0) {
        filtered[key] = value;
      }
    });

    return filtered;
  };

  const handleGenerateContractList = async () => {
    const parameters = {
      SearchText: filters.searchTerm || "",
      FilterCustomerID: filters.selectedCustomerId ? parseInt(filters.selectedCustomerId) : null,
      FilterContractStatus: filters.selectedStatus || "",
      FilterApprovalStatus: filters.selectedApprovalStatus || "",
      FilterFromDate: filters.dateFrom,
      FilterToDate: filters.dateTo,
      FilterPropertyID: filters.selectedPropertyId ? parseInt(filters.selectedPropertyId) : null,
      FilterEmailStatus: filters.emailStatus || "",
    };

    const filteredParameters = filterEmptyParameters(parameters);

    const response = await contractListPdf.generateReport("contract-list", filteredParameters, {
      orientation: "Landscape",
      download: true,
      showToast: true,
      filename: `Contract_List_${new Date().toISOString().split("T")[0]}.pdf`,
    });

    if (response.success) {
      toast.success("Contract list report generated successfully");
    }
  };

  const handlePreviewContractList = async () => {
    const parameters = {
      SearchText: filters.searchTerm || "",
      FilterCustomerID: filters.selectedCustomerId ? parseInt(filters.selectedCustomerId) : null,
      FilterContractStatus: filters.selectedStatus || "",
      FilterApprovalStatus: filters.selectedApprovalStatus || "",
      FilterFromDate: filters.dateFrom,
      FilterToDate: filters.dateTo,
      FilterPropertyID: filters.selectedPropertyId ? parseInt(filters.selectedPropertyId) : null,
      FilterEmailStatus: filters.emailStatus || "",
    };

    const filteredParameters = filterEmptyParameters(parameters);

    setShowPdfPreview(true);

    const response = await contractListPdf.generateReport("contract-list", filteredParameters, {
      orientation: "Landscape",
      download: false,
      showToast: false,
    });

    if (!response.success) {
      toast.error("Failed to generate contract list preview");
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: { variant: "secondary" as const, icon: FileText, className: "bg-gray-100 text-gray-800" },
      Pending: { variant: "default" as const, icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      Active: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" },
      Completed: { variant: "default" as const, icon: CheckCircle, className: "bg-blue-100 text-blue-800" },
      Expired: { variant: "destructive" as const, icon: AlertCircle, className: "bg-orange-100 text-orange-800" },
      Cancelled: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800" },
      Terminated: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800" },
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
  const renderEmailStatusIndicator = (contract: Contract) => {
    if (contract.EmailNotificationSent) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <MailCheck className="h-4 w-4 text-green-600" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Email notification sent</p>
            {contract.LastEmailSentDate && <p className="text-xs">Last sent: {format(new Date(contract.LastEmailSentDate), "MMM dd, yyyy")}</p>}
          </TooltipContent>
        </Tooltip>
      );
    }

    if (contract.EmailNotificationFailed) {
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

    if (contract.EmailNotificationPending) {
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
  const stats: ContractListStats = useMemo(() => {
    const filtered = filteredContracts;
    return {
      total: filtered.length,
      draft: filtered.filter((c) => c.ContractStatus === "Draft").length,
      pending: filtered.filter((c) => c.ContractStatus === "Pending").length,
      active: filtered.filter((c) => c.ContractStatus === "Active").length,
      completed: filtered.filter((c) => c.ContractStatus === "Completed").length,
      expired: filtered.filter((c) => c.ContractStatus === "Expired").length,
      cancelled: filtered.filter((c) => c.ContractStatus === "Cancelled" || c.ContractStatus === "Terminated").length,
      totalValue: filtered.reduce((sum, c) => sum + (c.GrandTotal || 0), 0),
      averageValue: filtered.length > 0 ? filtered.reduce((sum, c) => sum + (c.GrandTotal || 0), 0) / filtered.length : 0,
      approvalPending: filtered.filter((c) => c.ApprovalStatus === "Pending").length,
      approvalApproved: filtered.filter((c) => c.ApprovalStatus === "Approved").length,
      approvalRejected: filtered.filter((c) => c.ApprovalStatus === "Rejected").length,
      approvedProtected: filtered.filter((c) => c.ApprovalStatus === "Approved").length,
      // Email-related stats
      emailNotificationsSent: filtered.filter((c) => c.EmailNotificationSent === true).length,
      pendingEmailReminders: filtered.filter((c) => c.EmailNotificationPending === true).length,
      expiringSoon: filtered.filter((c) => {
        if (c.ContractStatus !== "Active") return false;
        const expiryDate = new Date(c.TransactionDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
      }).length,
    };
  }, [filteredContracts]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Contract Management</h1>
            <p className="text-muted-foreground">Manage rental and property contracts with integrated email communications</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Email Reminders Button */}
            {stats.expiringSoon > 0 && (
              <Button variant="outline" onClick={handleSendExpiryReminders} className="bg-orange-50 border-orange-200 text-orange-800">
                <BellRing className="mr-2 h-4 w-4" />
                {stats.expiringSoon} Expiring Soon
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
                  <p>{stats.emailNotificationsSent} contracts have email notifications sent</p>
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
                  <p>{stats.approvedProtected} approved contracts are protected from modifications</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Button variant="outline" onClick={handleViewAnalytics}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button onClick={handleAddContract}>
              <Plus className="mr-2 h-4 w-4" />
              New Contract
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
              <div className="text-xs text-muted-foreground">{hasActiveFilters ? `of ${contracts.length} total` : "contracts"}</div>
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
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
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
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">Expired</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.expired}</div>
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
                <BellRing className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">Expiring Soon</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</div>
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

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-muted-foreground">Rejected</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{stats.approvalRejected}</div>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HandCoins className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Total Value</span>
              </div>
              <div className="text-lg font-bold text-blue-600">{formatCurrency(stats.totalValue)}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-muted-foreground">Average</span>
              </div>
              <div className="text-lg font-bold text-purple-600">{formatCurrency(stats.averageValue)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Contracts</CardTitle>
                <CardDescription>
                  {hasActiveFilters ? `Showing ${filteredContracts.length} of ${contracts.length} contracts` : `Showing all ${contracts.length} contracts`}
                  {stats.approvedProtected > 0 && <span className="ml-2 text-green-600">• {stats.approvedProtected} approved contracts are protected from modifications</span>}
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
                    <DropdownMenuItem onClick={handleSendExpiryReminders} disabled={stats.expiringSoon === 0}>
                      <BellRing className="mr-2 h-4 w-4" />
                      Send Expiry Reminders ({stats.expiringSoon})
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Bulk Email Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleBulkEmail("contract_notification")} disabled={selectedContracts.size === 0 || isBulkEmailing}>
                      <Send className="mr-2 h-4 w-4" />
                      Send Contract Notifications ({selectedContracts.size})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkEmail("payment_reminder")} disabled={selectedContracts.size === 0 || isBulkEmailing}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Send Payment Reminders ({selectedContracts.size})
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
                    <Button variant="outline" disabled={contractListPdf.isLoading}>
                      {contractListPdf.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      Export
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handlePreviewContractList}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleGenerateContractList}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Bulk Operations */}
                {selectedContracts.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        Bulk Actions ({selectedContracts.size})
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                      {contractStatusOptions.map((status) => (
                        <DropdownMenuItem key={status} onClick={() => handleBulkStatusChange(status)}>
                          Set as {status}
                        </DropdownMenuItem>
                      ))}

                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Email Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleBulkEmail("contract_notification")} disabled={isBulkEmailing}>
                        <Send className="mr-2 h-4 w-4" />
                        Send Contract Notifications
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkEmail("payment_reminder")} disabled={isBulkEmailing}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Send Payment Reminders
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
                <Input type="text" placeholder="Search contracts..." className="pl-9" defaultValue={filters.searchTerm} onChange={handleSearchChange} />
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 p-4 bg-muted/50 rounded-lg">
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
                      {contractStatusOptions.map((status) => (
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

            {/* Contracts Table */}
            {filteredContracts.length === 0 ? (
              <div className="text-center py-10">
                {hasActiveFilters ? (
                  <div>
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No contracts found matching your criteria.</p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div>
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No contracts found. Create your first contract to get started.</p>
                    <Button onClick={handleAddContract}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Contract
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
                          checked={selectedContracts.size === filteredContracts.length && filteredContracts.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all contracts"
                        />
                      </TableHead>
                      <TableHead className="w-[180px] cursor-pointer" onClick={() => handleSort("ContractNo")}>
                        <div className="flex items-center gap-1">
                          Contract #
                          {sortConfig.key === "ContractNo" ? (
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
                      <TableHead className="cursor-pointer" onClick={() => handleSort("CustomerName")}>
                        <div className="flex items-center gap-1">
                          Customer
                          {sortConfig.key === "CustomerName" ? (
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
                      <TableHead className="cursor-pointer" onClick={() => handleSort("TransactionDate")}>
                        <div className="flex items-center gap-1">
                          Date
                          {sortConfig.key === "TransactionDate" ? (
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
                      <TableHead className="cursor-pointer" onClick={() => handleSort("GrandTotal")}>
                        <div className="flex items-center gap-1">
                          Total Amount
                          {sortConfig.key === "GrandTotal" ? (
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
                      <TableHead className="cursor-pointer" onClick={() => handleSort("ContractStatus")}>
                        <div className="flex items-center gap-1">
                          Status
                          {sortConfig.key === "ContractStatus" ? (
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
                      <TableHead>Units</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((contract) => {
                      const isApproved = contract.ApprovalStatus === "Approved";
                      const canEdit = canEditContract(contract);

                      return (
                        <TableRow
                          key={contract.ContractID}
                          className={cn("hover:bg-muted/50 transition-colors", selectedContracts.has(contract.ContractID) && "bg-accent/50", isApproved && "bg-green-50/30")}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedContracts.has(contract.ContractID)}
                              onCheckedChange={(checked) => handleSelectContract(contract.ContractID, checked as boolean)}
                              aria-label={`Select contract ${contract.ContractNo}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium">{contract.ContractNo}</div>
                                <div className="text-sm text-muted-foreground">ID: {contract.ContractID}</div>
                              </div>
                              {isApproved && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Lock className="h-3 w-3 text-green-600" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Protected - Approved contracts cannot be modified</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{contract.CustomerName}</div>
                                {contract.CustomerEmail && <div className="text-xs text-muted-foreground">{contract.CustomerEmail}</div>}
                                {contract.JointCustomerName && <div className="text-sm text-muted-foreground">Joint: {contract.JointCustomerName}</div>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {formatDate(contract.TransactionDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(contract.GrandTotal)}</div>
                            {contract.AdditionalCharges > 0 && <div className="text-sm text-muted-foreground">Base: {formatCurrency(contract.TotalAmount)}</div>}
                            {contract.AdditionalCharges > 0 && <div className="text-sm text-muted-foreground">Additional: {formatCurrency(contract.AdditionalCharges)}</div>}
                          </TableCell>
                          <TableCell>{renderStatusBadge(contract.ContractStatus)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {contract.RequiresApproval ? (
                                renderApprovalBadge(contract.ApprovalStatus)
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
                            <div className="flex items-center gap-2">{renderEmailStatusIndicator(contract)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3 text-muted-foreground" />
                              <Badge variant="outline" className="font-normal">
                                {contract.UnitCount || 0} units
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {contract.CreatedBy && <div>{contract.CreatedBy}</div>}
                              {contract.CreatedOn && <div className="text-muted-foreground">{formatDate(contract.CreatedOn)}</div>}
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
                                <DropdownMenuItem onClick={() => handleViewContract(contract)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>

                                {canEdit ? (
                                  <DropdownMenuItem onClick={() => handleEditContract(contract)}>
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
                                      <p>Cannot edit approved contracts</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Email Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleSendEmail(contract)}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Custom Email
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendEmail(contract, "contract_notification")}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Contract Notification
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendEmail(contract, "payment_reminder")}>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Payment Reminder
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendEmail(contract, "document_request")}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Document Request
                                </DropdownMenuItem>

                                {(contract.ContractStatus === "Active" || contract.ContractStatus === "Completed" || contract.ContractStatus === "Expired") && (
                                  <DropdownMenuItem onClick={() => handleRenewContract(contract)}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Renew
                                  </DropdownMenuItem>
                                )}

                                {isManager && contract.RequiresApproval && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="font-medium text-muted-foreground">Approval Actions</DropdownMenuLabel>

                                    {contract.ApprovalStatus === "Pending" && (
                                      <>
                                        <DropdownMenuItem onClick={() => handleApproveContract(contract)}>
                                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                          Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRejectContract(contract)}>
                                          <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                          Reject
                                        </DropdownMenuItem>
                                      </>
                                    )}

                                    {contract.ApprovalStatus !== "Pending" && (
                                      <DropdownMenuItem onClick={() => navigate(`/contracts/${contract.ContractID}`)}>
                                        <RotateCcw className="mr-2 h-4 w-4 text-blue-600" />
                                        Reset Approval
                                      </DropdownMenuItem>
                                    )}
                                  </>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuLabel className="font-medium text-muted-foreground">Change Status</DropdownMenuLabel>

                                {contractStatusOptions
                                  .filter((status) => status !== contract.ContractStatus)
                                  .map((status) => (
                                    <DropdownMenuItem key={status} onClick={() => handleChangeStatus(contract, status)} disabled={!canEdit}>
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
                                            <p>Cannot change status of approved contracts</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </DropdownMenuItem>
                                  ))}

                                <DropdownMenuSeparator />

                                {canEdit ? (
                                  <DropdownMenuItem
                                    className="text-red-500"
                                    onClick={() => openDeleteDialog(contract)}
                                    disabled={contract.ContractStatus === "Active" || contract.ContractStatus === "Completed"}
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
                                      <p>Cannot delete approved contracts</p>
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
        {emailDialogContract && (
          <EmailSendDialog
            isOpen={isEmailDialogOpen}
            onClose={() => setIsEmailDialogOpen(false)}
            entityType="contract"
            entityId={emailDialogContract.ContractID}
            entityData={emailDialogContract}
            defaultRecipients={getDefaultEmailRecipients(emailDialogContract)}
            triggerEvent={emailTriggerEvent}
            onEmailSent={handleEmailSent}
          />
        )}

        {/* PDF Preview Modal */}
        <PdfPreviewModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          pdfBlob={contractListPdf.data}
          title="Contract List Report"
          isLoading={contractListPdf.isLoading}
          error={contractListPdf.error}
          onDownload={() => contractListPdf.downloadCurrentPdf("Contract_List_Report.pdf")}
          onRefresh={handlePreviewContractList}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={handleDeleteContract}
          title="Delete Contract"
          description={
            selectedContract
              ? `Are you sure you want to delete contract "${selectedContract.ContractNo}"? This action cannot be undone.`
              : "Are you sure you want to delete this contract?"
          }
          cancelText="Cancel"
          confirmText="Delete"
          type="danger"
        />
      </div>
    </TooltipProvider>
  );
};

export default ContractList;
