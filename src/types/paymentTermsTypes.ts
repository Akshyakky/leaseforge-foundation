// src/types/paymentTermsTypes.ts

export interface BasePaymentTerms {
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
  DeletedBy?: string;
  DeletedOn?: string;
  RecordStatus?: boolean;
}

export interface PaymentTerms extends BasePaymentTerms {
  PaymentTermID: number;
  TermCode: string;
  TermName: string;
  DaysCount?: number;
  Description?: string;
  IsActive: boolean;
}

export interface PaymentTermsRequest {
  PaymentTermID?: number;
  TermCode: string;
  TermName: string;
  DaysCount?: number;
  Description?: string;
  IsActive?: boolean;
}

export interface PaymentTermsSearchFilters {
  searchText?: string;
  isActive?: boolean;
}

export interface PaymentTermsDropdownItem {
  PaymentTermID: number;
  TermCode: string;
  TermName: string;
  DaysCount?: number;
}

export interface PaymentTermsStatistics {
  TotalTerms: number;
  ActiveTerms: number;
  InactiveTerms: number;
  TermsWithDays: number;
  TermsWithoutDays: number;
  AverageDaysCount: number;
  MostUsedTerm?: PaymentTerms;
  RecentlyCreated: number;
}

export interface PaymentTermsValidationResult {
  isValid: boolean;
  message?: string;
  field?: string;
}

export interface PaymentTermsUsageInfo {
  PaymentTermID: number;
  TermName: string;
  UsageCount: number;
  UsedInContracts: number;
  UsedInInvoices: number;
  UsedInSuppliers: number;
  CanDelete: boolean;
}

// API response interfaces
export interface PaymentTermsApiResponse<T = any> {
  Status: number;
  Message: string;
  NewPaymentTermID?: number;
  data?: T;
  success?: boolean;
}

export interface PaymentTermsCreateResponse {
  success: boolean;
  message: string;
  paymentTermId?: number;
}

export interface PaymentTermsUpdateResponse {
  success: boolean;
  message: string;
}

export interface PaymentTermsDeleteResponse {
  success: boolean;
  message: string;
}

export interface PaymentTermsExistsResponse {
  exists: boolean;
  message: string;
}

// Dashboard and reporting types
export interface PaymentTermsDashboardData {
  statistics: PaymentTermsStatistics;
  recentActivity: PaymentTermsActivity[];
  usageDistribution: PaymentTermsUsage[];
  statusDistribution: PaymentTermsStatusDistribution[];
}

export interface PaymentTermsActivity {
  ActivityID: number;
  PaymentTermID: number;
  TermName: string;
  ActivityType: "Created" | "Updated" | "Activated" | "Deactivated" | "Deleted";
  ActivityDate: string;
  PerformedBy: string;
  Description?: string;
}

export interface PaymentTermsUsage {
  PaymentTermID: number;
  TermName: string;
  TermCode: string;
  TotalUsage: number;
  ContractUsage: number;
  InvoiceUsage: number;
  SupplierUsage: number;
}

export interface PaymentTermsStatusDistribution {
  Status: "Active" | "Inactive";
  Count: number;
  Percentage: number;
}

// Export and import types
export interface PaymentTermsExportOptions {
  format: "excel" | "csv" | "pdf";
  includeInactive?: boolean;
  includeUsageStats?: boolean;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface PaymentTermsImportResult {
  success: boolean;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: PaymentTermsImportError[];
}

export interface PaymentTermsImportError {
  row: number;
  field: string;
  value: string;
  error: string;
}

// Audit and history types
export interface PaymentTermsAuditLog {
  AuditID: number;
  PaymentTermID: number;
  TermName: string;
  ChangeType: "Insert" | "Update" | "Delete" | "StatusChange";
  FieldName?: string;
  OldValue?: string;
  NewValue?: string;
  ChangedBy: string;
  ChangeDate: string;
  IPAddress?: string;
  UserAgent?: string;
}

export interface PaymentTermsHistory {
  HistoryID: number;
  PaymentTermID: number;
  VersionNumber: number;
  TermCode: string;
  TermName: string;
  DaysCount?: number;
  Description?: string;
  IsActive: boolean;
  ValidFrom: string;
  ValidTo?: string;
  CreatedBy: string;
  CreatedOn: string;
}

// Configuration and settings types
export interface PaymentTermsConfiguration {
  AllowDuplicateNames: boolean;
  RequireDescription: boolean;
  MaxDaysCount: number;
  MinDaysCount: number;
  DefaultIsActive: boolean;
  AutoGenerateCode: boolean;
  CodePrefix: string;
  NotificationSettings: {
    NotifyOnCreate: boolean;
    NotifyOnUpdate: boolean;
    NotifyOnDelete: boolean;
    NotificationEmails: string[];
  };
}

// Validation rules
export interface PaymentTermsValidationRules {
  TermCode: {
    required: boolean;
    minLength: number;
    maxLength: number;
    pattern?: RegExp;
    unique: boolean;
  };
  TermName: {
    required: boolean;
    minLength: number;
    maxLength: number;
    unique?: boolean;
  };
  DaysCount: {
    required: boolean;
    min: number;
    max: number;
  };
  Description: {
    required: boolean;
    maxLength: number;
  };
}

// Form and UI types
export interface PaymentTermsFormData {
  paymentTermId?: number;
  termCode: string;
  termName: string;
  daysCount?: number;
  description?: string;
  isActive: boolean;
}

export interface PaymentTermsFormErrors {
  termCode?: string;
  termName?: string;
  daysCount?: string;
  description?: string;
  general?: string;
}

export interface PaymentTermsTableColumn {
  key: keyof PaymentTerms | "actions";
  label: string;
  sortable: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  format?: (value: any) => string;
}

export interface PaymentTermsTableProps {
  data: PaymentTerms[];
  loading: boolean;
  error?: string;
  onEdit: (paymentTerm: PaymentTerms) => void;
  onDelete: (paymentTermId: number) => void;
  onStatusChange: (paymentTermId: number, isActive: boolean) => void;
  onRefresh: () => void;
}

// Integration types for other modules
export interface PaymentTermsIntegration {
  ContractModule: {
    getUsageInContracts: (paymentTermId: number) => Promise<number>;
    updateContractPaymentTerms: (oldTermId: number, newTermId: number) => Promise<boolean>;
  };
  InvoiceModule: {
    getUsageInInvoices: (paymentTermId: number) => Promise<number>;
    updateInvoicePaymentTerms: (oldTermId: number, newTermId: number) => Promise<boolean>;
  };
  SupplierModule: {
    getUsageInSuppliers: (paymentTermId: number) => Promise<number>;
    updateSupplierPaymentTerms: (oldTermId: number, newTermId: number) => Promise<boolean>;
  };
}
