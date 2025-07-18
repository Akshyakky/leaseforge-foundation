// src/services/emailService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import {
  EmailTemplate,
  EmailTemplateRequest,
  CloneTemplateRequest,
  EmailTemplateSearchFilters,
  EmailStatistics,
  EmailVariableCategory,
  EmailPreviewRequest,
  EmailPreviewResult,
  EmailSendRequest,
  EmailSendResult,
  EmailHistory,
  TemplateUsageAnalytics,
  EmailSetupHealthCheck,
  EmailTriggerEvent,
} from "../types/emailTypes";

/**
 * Service for email setup and template management operations
 */
class EmailTemplateService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/emailTemplate");
  }

  // =============================================
  // EMAIL TEMPLATE MANAGEMENT METHODS
  // =============================================

  /**
   * Create a new email template
   * @param templateData - The email template data
   * @returns Response with status and newly created template ID
   */
  async createEmailTemplate(templateData: EmailTemplateRequest): Promise<{
    success: boolean;
    message: string;
    templateId?: number;
  }> {
    const request: BaseRequest = {
      mode: 1, // Mode 1 for template management (assuming different endpoint or mode offset)
      parameters: {
        ...templateData,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Email template created successfully");
      return {
        success: true,
        message: response.message || "Email template created successfully",
        templateId: response.NewEmailTemplateID,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to create email template",
    };
  }

  /**
   * Update an existing email template
   * @param templateData - The email template data to update
   * @returns Response with status
   */
  async updateEmailTemplate(templateData: EmailTemplateRequest & { EmailTemplateID: number }): Promise<{
    success: boolean;
    message: string;
  }> {
    const request: BaseRequest = {
      mode: 2, // Mode 2 for template management
      parameters: {
        ...templateData,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Email template updated successfully");
      return {
        success: true,
        message: response.message || "Email template updated successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to update email template",
    };
  }

  /**
   * Get all email templates
   * @param filters - Optional filters for the query
   * @returns Array of email templates
   */
  async getAllEmailTemplates(filters?: {
    companyId?: number;
    templateCategory?: string;
    templateType?: string;
    triggerEvent?: string;
    isActive?: boolean;
    isSystemTemplate?: boolean;
  }): Promise<EmailTemplate[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3 for template management
      parameters: {
        FilterCompanyID: filters?.companyId,
        FilterTemplateCategory: filters?.templateCategory,
        FilterTemplateType: filters?.templateType,
        FilterTriggerEvent: filters?.triggerEvent,
        FilterIsActive: filters?.isActive,
        FilterIsSystemTemplate: filters?.isSystemTemplate,
      },
    };

    const response = await this.execute<EmailTemplate[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get an email template by ID
   * @param templateId - The ID of the email template to fetch
   * @returns Email template object
   */
  async getEmailTemplateById(templateId: number): Promise<EmailTemplate | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4 for template management
      parameters: {
        EmailTemplateID: templateId,
      },
    };

    const response = await this.execute(request);

    if (response.success && response.data && response.data.length > 0) {
      return response.data[0];
    }

    return null;
  }

  /**
   * Delete an email template
   * @param templateId - The ID of the email template to delete
   * @returns Response with status
   */
  async deleteEmailTemplate(templateId: number): Promise<{ success: boolean; message: string }> {
    const request: BaseRequest = {
      mode: 5, // Mode 5 for template management
      parameters: {
        EmailTemplateID: templateId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Email template deleted successfully");
      return {
        success: true,
        message: response.message || "Email template deleted successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to delete email template",
    };
  }

  /**
   * Search email templates
   * @param filters - Search filters
   * @returns Array of matching email templates
   */
  async searchEmailTemplates(filters: EmailTemplateSearchFilters): Promise<EmailTemplate[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6 for template management
      parameters: {
        SearchText: filters.searchText,
        FilterCompanyID: filters.companyId,
        FilterTemplateCategory: filters.templateCategory,
        FilterTemplateType: filters.templateType,
        FilterTriggerEvent: filters.triggerEvent,
        FilterIsActive: filters.isActive,
        FilterIsSystemTemplate: filters.isSystemTemplate,
      },
    };

    const response = await this.execute<EmailTemplate[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get email templates by category
   * @param category - The template category
   * @param companyId - Optional company ID filter
   * @returns Array of templates in the specified category
   */
  async getTemplatesByCategory(category: string, companyId?: number): Promise<EmailTemplate[]> {
    const request: BaseRequest = {
      mode: 7, // Mode 7 for template management
      parameters: {
        TemplateCategory: category,
        CompanyID: companyId,
      },
    };

    const response = await this.execute<EmailTemplate[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get email templates by trigger event
   * @param triggerEvent - The trigger event
   * @param companyId - Optional company ID filter
   * @returns Array of templates for the specified trigger event
   */
  async getTemplatesByTriggerEvent(triggerEvent: string, companyId?: number): Promise<EmailTemplate[]> {
    const request: BaseRequest = {
      mode: 8, // Mode 8 for template management
      parameters: {
        TriggerEvent: triggerEvent,
        CompanyID: companyId,
      },
    };

    const response = await this.execute<EmailTemplate[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Update template usage statistics
   * @param templateId - The template ID
   * @returns Response with status
   */
  async updateTemplateUsage(templateId: number): Promise<{ success: boolean; message: string }> {
    const request: BaseRequest = {
      mode: 9, // Mode 9 for template management
      parameters: {
        EmailTemplateID: templateId,
      },
    };

    const response = await this.execute(request);

    return {
      success: response.success,
      message: response.message || (response.success ? "Usage updated" : "Failed to update usage"),
    };
  }

  /**
   * Clone an email template
   * @param cloneData - Clone template data
   * @returns Response with status and new template ID
   */
  async cloneEmailTemplate(cloneData: CloneTemplateRequest): Promise<{
    success: boolean;
    message: string;
    templateId?: number;
  }> {
    const request: BaseRequest = {
      mode: 10, // Mode 10 for template management
      parameters: {
        ...cloneData,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Email template cloned successfully");
      return {
        success: true,
        message: response.message || "Email template cloned successfully",
        templateId: response.NewTemplateID,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to clone email template",
    };
  }

  // =============================================
  // HELPER AND UTILITY METHODS
  // =============================================

  /**
   * Get email trigger events for dropdown
   * @returns Array of trigger events
   */
  async getEmailTriggerEvents(): Promise<EmailTriggerEvent[]> {
    // This would need a corresponding endpoint in the backend
    // For now, returning mock data based on lease management workflow
    return [
      { EventCode: "contract_created", EventName: "Contract Created", Description: "When a new lease contract is created" },
      { EventCode: "contract_approved", EventName: "Contract Approved", Description: "When a lease contract is approved" },
      { EventCode: "contract_expiring", EventName: "Contract Expiring", Description: "When a lease contract is nearing expiration" },
      { EventCode: "payment_due", EventName: "Payment Due", Description: "When a payment is due" },
      { EventCode: "payment_overdue", EventName: "Payment Overdue", Description: "When a payment is overdue" },
      { EventCode: "payment_received", EventName: "Payment Received", Description: "When a payment is received" },
      { EventCode: "proposal_submitted", EventName: "Proposal Submitted", Description: "When a lease proposal is submitted" },
      { EventCode: "proposal_approved", EventName: "Proposal Approved", Description: "When a lease proposal is approved" },
      { EventCode: "termination_notice", EventName: "Termination Notice", Description: "When a lease termination notice is sent" },
      { EventCode: "welcome_customer", EventName: "Welcome Customer", Description: "When welcoming a new customer" },
      { EventCode: "document_expiring", EventName: "Document Expiring", Description: "When customer documents are expiring" },
    ];
  }

  /**
   * Get available email variables for template building
   * @returns Array of variable categories with variables
   */
  async getEmailVariables(): Promise<EmailVariableCategory[]> {
    // This would need a corresponding endpoint in the backend
    // For now, returning mock data based on lease management entities
    return [
      {
        CategoryName: "Customer Information",
        Variables: [
          {
            VariableName: "{{CustomerName}}",
            DisplayName: "Customer Name",
            Description: "Full name of the customer",
            Category: "Customer",
            DataType: "string",
            SampleValue: "John Smith",
          },
          {
            VariableName: "{{CustomerEmail}}",
            DisplayName: "Customer Email",
            Description: "Email address of the customer",
            Category: "Customer",
            DataType: "string",
            SampleValue: "john.smith@example.com",
          },
          {
            VariableName: "{{CustomerPhone}}",
            DisplayName: "Customer Phone",
            Description: "Phone number of the customer",
            Category: "Customer",
            DataType: "string",
            SampleValue: "+1-555-123-4567",
          },
          {
            VariableName: "{{CustomerAddress}}",
            DisplayName: "Customer Address",
            Description: "Address of the customer",
            Category: "Customer",
            DataType: "string",
            SampleValue: "123 Main St, City, State",
          },
        ],
      },
      {
        CategoryName: "Contract Information",
        Variables: [
          {
            VariableName: "{{ContractNumber}}",
            DisplayName: "Contract Number",
            Description: "Unique contract identifier",
            Category: "Contract",
            DataType: "string",
            SampleValue: "CNT-2024-001",
          },
          {
            VariableName: "{{ContractStartDate}}",
            DisplayName: "Contract Start Date",
            Description: "Start date of the contract",
            Category: "Contract",
            DataType: "date",
            SampleValue: "2024-01-01",
          },
          {
            VariableName: "{{ContractEndDate}}",
            DisplayName: "Contract End Date",
            Description: "End date of the contract",
            Category: "Contract",
            DataType: "date",
            SampleValue: "2024-12-31",
          },
          { VariableName: "{{RentAmount}}", DisplayName: "Rent Amount", Description: "Monthly rent amount", Category: "Contract", DataType: "number", SampleValue: "$1,500.00" },
        ],
      },
      {
        CategoryName: "Property Information",
        Variables: [
          {
            VariableName: "{{PropertyName}}",
            DisplayName: "Property Name",
            Description: "Name of the property",
            Category: "Property",
            DataType: "string",
            SampleValue: "Sunset Apartments",
          },
          { VariableName: "{{UnitNumber}}", DisplayName: "Unit Number", Description: "Unit number", Category: "Property", DataType: "string", SampleValue: "Unit 205" },
          {
            VariableName: "{{PropertyAddress}}",
            DisplayName: "Property Address",
            Description: "Address of the property",
            Category: "Property",
            DataType: "string",
            SampleValue: "456 Oak Avenue, City, State",
          },
        ],
      },
      {
        CategoryName: "Payment Information",
        Variables: [
          { VariableName: "{{InvoiceNumber}}", DisplayName: "Invoice Number", Description: "Invoice number", Category: "Payment", DataType: "string", SampleValue: "INV-2024-001" },
          { VariableName: "{{AmountDue}}", DisplayName: "Amount Due", Description: "Amount due on invoice", Category: "Payment", DataType: "number", SampleValue: "$1,500.00" },
          { VariableName: "{{DueDate}}", DisplayName: "Due Date", Description: "Payment due date", Category: "Payment", DataType: "date", SampleValue: "2024-01-15" },
          {
            VariableName: "{{PaymentStatus}}",
            DisplayName: "Payment Status",
            Description: "Current payment status",
            Category: "Payment",
            DataType: "string",
            SampleValue: "Pending",
          },
        ],
      },
      {
        CategoryName: "System Information",
        Variables: [
          { VariableName: "{{CurrentDate}}", DisplayName: "Current Date", Description: "Current system date", Category: "System", DataType: "date", SampleValue: "2024-01-10" },
          {
            VariableName: "{{CompanyName}}",
            DisplayName: "Company Name",
            Description: "Name of the company",
            Category: "System",
            DataType: "string",
            SampleValue: "ABC Property Management",
          },
          {
            VariableName: "{{CompanyPhone}}",
            DisplayName: "Company Phone",
            Description: "Company phone number",
            Category: "System",
            DataType: "string",
            SampleValue: "+1-555-987-6543",
          },
          {
            VariableName: "{{CompanyEmail}}",
            DisplayName: "Company Email",
            Description: "Company email address",
            Category: "System",
            DataType: "string",
            SampleValue: "info@abcproperty.com",
          },
        ],
      },
    ];
  }

  /**
   * Preview an email template with variables
   * @param previewData - Preview request data
   * @returns Preview result with processed content
   */
  async previewEmailTemplate(previewData: EmailPreviewRequest): Promise<EmailPreviewResult | null> {
    // This would need a corresponding endpoint in the backend
    // For now, returning mock preview processing
    const template = await this.getEmailTemplateById(previewData.TemplateID);

    if (!template) {
      return null;
    }

    // Simple variable replacement (in real implementation, this would be server-side)
    let processedSubject = template.SubjectLine;
    let processedBody = template.EmailBody;

    Object.entries(previewData.Variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processedSubject = processedSubject.replace(new RegExp(placeholder, "g"), String(value));
      processedBody = processedBody.replace(new RegExp(placeholder, "g"), String(value));
    });

    return {
      Subject: processedSubject,
      Body: processedBody,
      IsHTML: template.IsHTMLFormat,
      Variables: previewData.Variables,
    };
  }

  /**
   * Send an email using a template
   * @param sendData - Email send request data
   * @returns Send result
   */
  async sendEmail(sendData: EmailSendRequest): Promise<EmailSendResult> {
    // This would need a corresponding endpoint in the backend
    // For now, returning mock success
    await this.updateTemplateUsage(sendData.TemplateID);

    return {
      Success: true,
      Message: "Email sent successfully",
      EmailId: Math.floor(Math.random() * 10000),
      SentDate: new Date().toISOString(),
    };
  }

  /**
   * Get email statistics for dashboard
   * @returns Email system statistics
   */
  async getEmailStatistics(): Promise<EmailStatistics> {
    // This would need a corresponding endpoint in the backend
    // For now, returning mock statistics
    return {
      TotalSetups: 0,
      ActiveSetups: 0,
      TotalTemplates: 0,
      ActiveTemplates: 0,
      SystemTemplates: 0,
      CustomTemplates: 0,
      TemplatesByCategory: [],
      TemplatesByType: [],
      SetupsByCompany: [],
    };
  }

  /**
   * Get template usage analytics
   * @param templateId - Optional template ID for specific analytics
   * @returns Array of template usage analytics
   */
  async getTemplateUsageAnalytics(templateId?: number): Promise<TemplateUsageAnalytics[]> {
    // This would need a corresponding endpoint in the backend
    // For now, returning empty array
    return [];
  }

  /**
   * Perform health check on email setups
   * @param companyId - Optional company ID filter
   * @returns Array of health check results
   */
  async performEmailSetupHealthCheck(companyId?: number): Promise<EmailSetupHealthCheck[]> {
    // This would need a corresponding endpoint in the backend
    // For now, returning empty array
    return [];
  }

  /**
   * Get email history
   * @param filters - Optional filters for history query
   * @returns Array of email history records
   */
  async getEmailHistory(filters?: { templateId?: number; fromDate?: Date; toDate?: Date; status?: string }): Promise<EmailHistory[]> {
    // This would need a corresponding endpoint in the backend
    // For now, returning empty array
    return [];
  }
}

// Export a singleton instance
export const emailTemplateService = new EmailTemplateService();
