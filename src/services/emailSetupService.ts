// src/services/emailService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import {
  EmailSetup,
  EmailSetupRequest,
  TestEmailRequest,
  EmailSetupSearchFilters,
  EmailStatistics,
  EmailVariableCategory,
  EmailHistory,
  TemplateUsageAnalytics,
  EmailSetupHealthCheck,
  EmailTriggerEvent,
} from "../types/emailTypes";

/**
 * Service for email setup and template management operations
 */
class EmailSetupService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/emailSetup");
  }

  // =============================================
  // EMAIL SETUP MANAGEMENT METHODS
  // =============================================

  /**
   * Create a new email setup
   * @param setupData - The email setup data
   * @returns Response with status and newly created setup ID
   */
  async createEmailSetup(setupData: EmailSetupRequest): Promise<{
    success: boolean;
    message: string;
    setupId?: number;
  }> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Email Setup
      parameters: {
        ...setupData,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Email setup created successfully");
      return {
        success: true,
        message: response.message || "Email setup created successfully",
        setupId: response.NewEmailSetupID,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to create email setup",
    };
  }

  /**
   * Update an existing email setup
   * @param setupData - The email setup data to update
   * @returns Response with status
   */
  async updateEmailSetup(setupData: EmailSetupRequest & { EmailSetupID: number }): Promise<{
    success: boolean;
    message: string;
  }> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Email Setup
      parameters: {
        ...setupData,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Email setup updated successfully");
      return {
        success: true,
        message: response.message || "Email setup updated successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to update email setup",
    };
  }

  /**
   * Get all email setups
   * @param filters - Optional filters for the query
   * @returns Array of email setups
   */
  async getAllEmailSetups(filters?: { companyId?: number; isActive?: boolean }): Promise<EmailSetup[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Get All Email Setups
      parameters: {
        FilterCompanyID: filters?.companyId,
        FilterIsActive: filters?.isActive,
      },
    };

    const response = await this.execute<EmailSetup[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get an email setup by ID
   * @param setupId - The ID of the email setup to fetch
   * @returns Email setup object
   */
  async getEmailSetupById(setupId: number): Promise<EmailSetup | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Get Email Setup by ID
      parameters: {
        EmailSetupID: setupId,
      },
    };

    const response = await this.execute(request);

    if (response.success && response.table1 && response.table1.length > 0) {
      return response.table1[0];
    }

    return null;
  }

  /**
   * Delete an email setup
   * @param setupId - The ID of the email setup to delete
   * @returns Response with status
   */
  async deleteEmailSetup(setupId: number): Promise<{ success: boolean; message: string }> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Delete Email Setup
      parameters: {
        EmailSetupID: setupId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Email setup deleted successfully");
      return {
        success: true,
        message: response.message || "Email setup deleted successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to delete email setup",
    };
  }

  /**
   * Search email setups
   * @param filters - Search filters
   * @returns Array of matching email setups
   */
  async searchEmailSetups(filters: EmailSetupSearchFilters): Promise<EmailSetup[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Email Setups
      parameters: {
        SearchText: filters.searchText,
        FilterCompanyID: filters.companyId,
        FilterIsActive: filters.isActive,
      },
    };

    const response = await this.execute<EmailSetup[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Set an email setup as default for a company
   * @param setupId - The ID of the email setup to set as default
   * @returns Response with status
   */
  async setDefaultEmailSetup(setupId: number): Promise<{ success: boolean; message: string }> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Set as Default Email Setup
      parameters: {
        EmailSetupID: setupId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Email setup set as default successfully");
      return {
        success: true,
        message: response.message || "Email setup set as default successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to set email setup as default",
    };
  }

  /**
   * Test email configuration
   * @param testData - Test email data
   * @returns Response with test results
   */
  async testEmailConfiguration(testData: TestEmailRequest): Promise<{
    success: boolean;
    message: string;
  }> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Test Email Configuration
      parameters: {
        ...testData,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Test email sent successfully");
      return {
        success: true,
        message: response.message || "Test email sent successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Test email failed",
    };
  }

  /**
   * Get default email setup for a company
   * @param companyId - The company ID
   * @returns Default email setup for the company
   */
  async getDefaultEmailSetup(companyId: number): Promise<EmailSetup | null> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Get Default Email Setup by Company
      parameters: {
        CompanyID: companyId,
      },
    };

    const response = await this.execute(request);

    if (response.success && response.table1 && response.table1.length > 0) {
      return response.table1[0];
    }

    return null;
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
export const emailSetupService = new EmailSetupService();
