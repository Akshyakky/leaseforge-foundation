// src/types/emailTypes.ts

export interface BaseEmailEntity {
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
  DeletedBy?: string;
  DeletedOn?: string;
  RecordStatus?: boolean;
}

// Email Setup Types
export interface EmailSetup extends BaseEmailEntity {
  EmailSetupID: number;
  CompanyID: number;
  SetupName: string;
  SMTPServer: string;
  SMTPPort: number;
  EnableSSL: boolean;
  EnableTLS: boolean;
  AuthenticationRequired: boolean;
  UserName?: string;
  Password?: string;
  FromEmail: string;
  FromDisplayName?: string;
  ReplyToEmail?: string;
  MaxRetryAttempts: number;
  TimeoutSeconds: number;
  IsDefault: boolean;
  IsActive: boolean;
  TestEmailSent: boolean;
  LastTestDate?: string | Date;
  TestResult?: string;
  Description?: string;

  // Additional fields from joins
  CompanyName?: string;
}

// Email Template Types
export interface EmailTemplate extends BaseEmailEntity {
  EmailTemplateID: number;
  CompanyID: number;
  TemplateCode: string;
  TemplateName: string;
  TemplateCategory: EmailTemplateCategory;
  TemplateType: EmailTemplateType;
  SubjectLine: string;
  EmailBody: string;
  IsHTMLFormat: boolean;
  BccEmails?: string;
  CcEmails?: string;
  AttachmentRequired: boolean;
  DefaultAttachmentPath?: string;
  VariablesUsed?: string;
  TriggerEvent?: string;
  AutoSend: boolean;
  RequiresApproval: boolean;
  ApprovalLevel?: number;
  Priority: EmailPriority;
  LanguageCode?: string;
  IsSystemTemplate: boolean;
  IsActive: boolean;
  EffectiveFromDate?: string | Date;
  ExpiryDate?: string | Date;
  UsageCount: number;
  LastUsedDate?: string | Date;
  Description?: string;

  // Additional fields from joins
  CompanyName?: string;
}

// Email Setup Request Types
export interface EmailSetupRequest {
  EmailSetupID?: number;
  CompanyID: number;
  SetupName: string;
  SMTPServer: string;
  SMTPPort?: number;
  EnableSSL?: boolean;
  EnableTLS?: boolean;
  AuthenticationRequired?: boolean;
  UserName?: string;
  Password?: string;
  FromEmail: string;
  FromDisplayName?: string;
  ReplyToEmail?: string;
  MaxRetryAttempts?: number;
  TimeoutSeconds?: number;
  IsDefault?: boolean;
  IsActive?: boolean;
  Description?: string;
}

// Email Template Request Types
export interface EmailTemplateRequest {
  EmailTemplateID?: number;
  CompanyID: number;
  TemplateCode: string;
  TemplateName: string;
  TemplateCategory: EmailTemplateCategory;
  TemplateType: EmailTemplateType;
  SubjectLine: string;
  EmailBody: string;
  IsHTMLFormat?: boolean;
  BccEmails?: string;
  CcEmails?: string;
  AttachmentRequired?: boolean;
  DefaultAttachmentPath?: string;
  VariablesUsed?: string;
  TriggerEvent?: string;
  AutoSend?: boolean;
  RequiresApproval?: boolean;
  ApprovalLevel?: number;
  Priority?: EmailPriority;
  LanguageCode?: string;
  IsSystemTemplate?: boolean;
  IsActive?: boolean;
  EffectiveFromDate?: string | Date;
  ExpiryDate?: string | Date;
  Description?: string;
}

// Test Email Request
export interface TestEmailRequest {
  EmailSetupID: number;
  TestToEmail: string;
  TestSubject?: string;
  TestMessage?: string;
}

// Clone Template Request
export interface CloneTemplateRequest {
  SourceTemplateID: number;
  NewTemplateCode: string;
  NewTemplateName: string;
}

// Search and Filter Types
export interface EmailSetupSearchFilters {
  searchText?: string;
  companyId?: number;
  isActive?: boolean;
}

export interface EmailTemplateSearchFilters {
  searchText?: string;
  companyId?: number;
  templateCategory?: EmailTemplateCategory;
  templateType?: EmailTemplateType;
  triggerEvent?: string;
  isActive?: boolean;
  isSystemTemplate?: boolean;
}

// Enums and Constants
export type EmailTemplateCategory = "Contract" | "Invoice" | "Payment" | "Proposal" | "Termination" | "Reminder" | "Welcome" | "General";

export type EmailTemplateType = "System" | "Custom" | "Notification" | "Marketing" | "Transactional";

export type EmailPriority = "Low" | "Normal" | "High" | "Urgent";

// Dropdown Support Types
export interface Company {
  CompanyID: number;
  CompanyName: string;
}

export interface EmailTriggerEvent {
  EventCode: string;
  EventName: string;
  Description?: string;
}

// Statistics and Dashboard Types
export interface EmailStatistics {
  TotalSetups: number;
  ActiveSetups: number;
  TotalTemplates: number;
  ActiveTemplates: number;
  SystemTemplates: number;
  CustomTemplates: number;
  TemplatesByCategory: {
    Category: EmailTemplateCategory;
    Count: number;
  }[];
  TemplatesByType: {
    Type: EmailTemplateType;
    Count: number;
  }[];
  SetupsByCompany: {
    CompanyName: string;
    Count: number;
  }[];
}

// Email Variable Types for Template Processing
export interface EmailVariable {
  VariableName: string;
  DisplayName: string;
  Description: string;
  Category: string;
  DataType: "string" | "number" | "date" | "boolean";
  SampleValue?: string;
}

export interface EmailVariableCategory {
  CategoryName: string;
  Variables: EmailVariable[];
}

// Email Preview Types
export interface EmailPreviewRequest {
  TemplateID: number;
  Variables: Record<string, any>;
  RecipientEmail?: string;
}

export interface EmailPreviewResult {
  Subject: string;
  Body: string;
  IsHTML: boolean;
  Variables: Record<string, any>;
}

// Email Send Types
export interface EmailSendRequest {
  TemplateID: number;
  ToEmails: string[];
  CcEmails?: string[];
  BccEmails?: string[];
  Variables: Record<string, any>;
  Attachments?: EmailAttachment[];
  Priority?: EmailPriority;
  ScheduledDate?: string | Date;
}

export interface EmailAttachment {
  FileName: string;
  FileContent: string; // Base64 encoded
  ContentType: string;
  Size: number;
}

export interface EmailSendResult {
  Success: boolean;
  Message: string;
  EmailId?: number;
  SentDate?: string | Date;
  FailureReason?: string;
}

// API Response Types
export interface EmailApiResponse<T = any> {
  Status: number;
  Message: string;
  [key: string]: any;
  data?: T;
}

// Email Audit and History Types
export interface EmailHistory {
  EmailHistoryID: number;
  TemplateID: number;
  SetupID: number;
  ToEmails: string;
  CcEmails?: string;
  BccEmails?: string;
  Subject: string;
  Body: string;
  SentDate: string | Date;
  Status: "Sent" | "Failed" | "Pending" | "Scheduled";
  ErrorMessage?: string;
  Variables: string; // JSON string
  CreatedBy: string;
  CreatedOn: string | Date;
}

// Email Template Usage Analytics
export interface TemplateUsageAnalytics {
  TemplateID: number;
  TemplateName: string;
  TotalUsage: number;
  LastUsed?: string | Date;
  AverageUsagePerMonth: number;
  PeakUsageMonth: string;
  SuccessRate: number;
  FailureRate: number;
}

// Email Setup Health Check
export interface EmailSetupHealthCheck {
  SetupID: number;
  SetupName: string;
  IsHealthy: boolean;
  LastTestDate?: string | Date;
  LastTestResult?: string;
  Issues: string[];
  Recommendations: string[];
}

// export default {
//   EmailSetup,
//   EmailTemplate,
//   EmailSetupRequest,
//   EmailTemplateRequest,
//   TestEmailRequest,
//   CloneTemplateRequest,
//   EmailSetupSearchFilters,
//   EmailTemplateSearchFilters,
//   EmailStatistics,
//   EmailVariable,
//   EmailVariableCategory,
//   EmailPreviewRequest,
//   EmailPreviewResult,
//   EmailSendRequest,
//   EmailSendResult,
//   EmailHistory,
//   TemplateUsageAnalytics,
//   EmailSetupHealthCheck,
// };
