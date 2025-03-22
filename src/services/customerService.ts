// src/services/customerService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import { Customer, CustomerContact, CustomerAttachment, CustomerType, ContactType, DocType, CustomerStatistics } from "../types/customerTypes";

/**
 * Service for customer-related operations
 */
class CustomerService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/customer");
  }

  /**
   * Convert File to base64 string
   * @param file - The file to convert
   * @returns Promise with base64 string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Extract the base64 string from the Data URL
        const base64String = reader.result as string;
        // Remove the Data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Content = base64String.split(",")[1];
        resolve(base64Content);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Process attachment file for upload
   * @param attachment - The attachment with file data
   * @returns Processed attachment ready for API
   */
  private async processAttachmentFile(attachment: Partial<CustomerAttachment>): Promise<Partial<CustomerAttachment>> {
    // Clone the attachment to avoid modifying the original
    const processedAttachment = { ...attachment };

    // If there's a file object, convert it to base64
    if (attachment.file) {
      processedAttachment.FileContent = await this.fileToBase64(attachment.file);
      processedAttachment.FileContentType = attachment.file.type;
      processedAttachment.FileSize = attachment.file.size;

      // Remove the file object as it's not needed for the API
      delete processedAttachment.file;
      delete processedAttachment.fileUrl;
    }

    return processedAttachment;
  }

  /**
   * Get all customers
   * @returns Array of customers
   */
  async getAllCustomers(): Promise<Customer[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Customers
      parameters: {},
    };

    const response = await this.execute<Customer[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a customer by ID (including contacts and attachments)
   * @param customerId - The ID of the customer to fetch
   * @returns Customer object with contacts and attachments
   */
  async getCustomerById(customerId: number): Promise<{
    customer: Customer | null;
    contacts: CustomerContact[];
    attachments: CustomerAttachment[];
  }> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Customer by ID with contacts and attachments
      parameters: {
        CustomerID: customerId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      // Process attachments to create file URLs for display if needed
      const attachments = (response.table3 || []).map((attachment: CustomerAttachment) => {
        if (attachment.FileContent && attachment.FileContentType) {
          // Create a data URL for display
          attachment.fileUrl = `data:${attachment.FileContentType};base64,${attachment.FileContent}`;
        }
        return attachment;
      });

      return {
        customer: response.table1 && response.table1.length > 0 ? response.table1[0] : null,
        contacts: response.table2 || [],
        attachments: attachments,
      };
    }

    return { customer: null, contacts: [], attachments: [] };
  }

  /**
   * Create a new customer with optional contacts and attachments
   * @param data - The customer data, contacts and attachments
   * @returns Response with status and newly created customer ID
   */
  async createCustomer(data: {
    customer: Partial<Customer>;
    contacts?: Partial<CustomerContact>[];
    attachments?: Partial<CustomerAttachment>[];
  }): Promise<{ success: boolean; message: string; customerId?: number }> {
    // Process attachments if provided
    let processedAttachments = data.attachments;
    if (data.attachments && data.attachments.length > 0) {
      processedAttachments = await Promise.all(data.attachments.map((attachment) => this.processAttachmentFile(attachment)));
    }

    // Prepare contacts JSON if provided
    const contactsJSON = data.contacts && data.contacts.length > 0 ? JSON.stringify(data.contacts) : null;

    // Prepare attachments JSON if provided
    const attachmentsJSON = processedAttachments && processedAttachments.length > 0 ? JSON.stringify(processedAttachments) : null;

    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Customer
      parameters: {
        ...data.customer,
        ContactsJSON: contactsJSON,
        AttachmentsJSON: attachmentsJSON,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Customer created successfully");
      return {
        success: true,
        message: response.message || "Customer created successfully",
        customerId: response.NewCustomerID,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to create customer",
    };
  }

  /**
   * Update an existing customer with optional contacts and attachments
   * @param data - The customer data, contacts and attachments
   * @returns Response with status
   */
  async updateCustomer(data: {
    customer: Partial<Customer> & { CustomerID: number };
    contacts?: Partial<CustomerContact>[];
    attachments?: Partial<CustomerAttachment>[];
  }): Promise<{ success: boolean; message: string }> {
    // Process attachments if provided
    let processedAttachments = data.attachments;
    if (data.attachments && data.attachments.length > 0) {
      processedAttachments = await Promise.all(data.attachments.map((attachment) => this.processAttachmentFile(attachment)));
    }

    // Prepare contacts JSON if provided
    const contactsJSON = data.contacts && data.contacts.length > 0 ? JSON.stringify(data.contacts) : null;

    // Prepare attachments JSON if provided
    const attachmentsJSON = processedAttachments && processedAttachments.length > 0 ? JSON.stringify(processedAttachments) : null;

    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Customer
      parameters: {
        ...data.customer,
        ContactsJSON: contactsJSON,
        AttachmentsJSON: attachmentsJSON,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Customer updated successfully");
      return {
        success: true,
        message: response.message || "Customer updated successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to update customer",
    };
  }

  /**
   * Delete a customer
   * @param customerId - The ID of the customer to delete
   * @returns Response with status
   */
  async deleteCustomer(customerId: number): Promise<{ success: boolean; message: string }> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Customer
      parameters: {
        CustomerID: customerId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Customer deleted successfully");
      return {
        success: true,
        message: response.message || "Customer deleted successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to delete customer",
    };
  }

  /**
   * Search for customers
   * @param searchText - Text to search for in customer fields
   * @param filters - Optional filters for the search
   * @returns Array of matching customers
   */
  async searchCustomers(
    searchText: string,
    filters?: {
      typeId?: number;
      countryId?: number;
      cityId?: number;
    }
  ): Promise<Customer[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Customers with Filters
      parameters: {
        SearchText: searchText,
        FilterTypeID: filters?.typeId,
        FilterCountryID: filters?.countryId,
        FilterCityID: filters?.cityId,
      },
    };

    const response = await this.execute<Customer[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Check if customer identity number already exists
   * @param identityNumber - The identity number to check
   * @param customerId - Optional current customer ID (for updates)
   * @returns Whether the identity number exists
   */
  async checkIdentityNumberExists(identityNumber: string, customerId?: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Check if CustomerIdentityNo already exists
      parameters: {
        CustomerIdentityNo: identityNumber,
        CustomerID: customerId,
      },
    };

    const response = await this.execute(request, false);
    return response.Status === 0; // Status 0 means it exists, 1 means it's available
  }

  /**
   * Get customers with counts of contacts and attachments
   * @returns Array of customers with counts
   */
  async getCustomersWithCounts(): Promise<Customer[]> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Get Customers with Counts of Contacts and Attachments
      parameters: {},
    };

    const response = await this.execute<Customer[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Add a contact to a customer
   * @param contact - The contact data
   * @returns Response with status and new contact ID
   */
  async addContact(contact: Partial<CustomerContact> & { CustomerID: number }): Promise<{
    success: boolean;
    message: string;
    contactId?: number;
  }> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Add Single Contact to Customer
      parameters: {
        ...contact,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contact added successfully");
      return {
        success: true,
        message: response.message || "Contact added successfully",
        contactId: response.NewContactID,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to add contact",
    };
  }

  /**
   * Update a customer contact
   * @param contact - The contact data to update
   * @returns Response with status
   */
  async updateContact(contact: Partial<CustomerContact> & { CustomerContactID: number }): Promise<{
    success: boolean;
    message: string;
  }> {
    const request: BaseRequest = {
      mode: 11, // Mode 11: Update Single Contact
      parameters: {
        ...contact,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contact updated successfully");
      return {
        success: true,
        message: response.message || "Contact updated successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to update contact",
    };
  }

  /**
   * Delete a customer contact
   * @param contactId - The ID of the contact to delete
   * @returns Response with status
   */
  async deleteContact(contactId: number): Promise<{ success: boolean; message: string }> {
    const request: BaseRequest = {
      mode: 12, // Mode 12: Delete Single Contact
      parameters: {
        CustomerContactID: contactId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contact deleted successfully");
      return {
        success: true,
        message: response.message || "Contact deleted successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to delete contact",
    };
  }

  /**
   * Get all contacts for a customer
   * @param customerId - The customer ID
   * @returns Array of contacts
   */
  async getContactsByCustomerId(customerId: number): Promise<CustomerContact[]> {
    const request: BaseRequest = {
      mode: 13, // Mode 13: Get Contacts by Customer ID
      parameters: {
        CustomerID: customerId,
      },
    };

    const response = await this.execute<CustomerContact[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Add an attachment to a customer
   * @param attachment - The attachment data
   * @returns Response with status and new attachment ID
   */
  async addAttachment(attachment: Partial<CustomerAttachment> & { CustomerID: number }): Promise<{
    success: boolean;
    message: string;
    attachmentId?: number;
  }> {
    // Process the attachment file if present
    const processedAttachment = await this.processAttachmentFile(attachment);

    const request: BaseRequest = {
      mode: 14, // Mode 14: Add Single Attachment to Customer
      parameters: {
        ...processedAttachment,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Attachment added successfully");
      return {
        success: true,
        message: response.message || "Attachment added successfully",
        attachmentId: response.NewAttachmentID,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to add attachment",
    };
  }

  /**
   * Update a customer attachment
   * @param attachment - The attachment data to update
   * @returns Response with status
   */
  async updateAttachment(attachment: Partial<CustomerAttachment> & { CustomerAttachmentID: number }): Promise<{
    success: boolean;
    message: string;
  }> {
    // Process the attachment file if present
    const processedAttachment = await this.processAttachmentFile(attachment);

    const request: BaseRequest = {
      mode: 15, // Mode 15: Update Single Attachment
      parameters: {
        ...processedAttachment,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Attachment updated successfully");
      return {
        success: true,
        message: response.message || "Attachment updated successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to update attachment",
    };
  }

  /**
   * Delete a customer attachment
   * @param attachmentId - The ID of the attachment to delete
   * @returns Response with status
   */
  async deleteAttachment(attachmentId: number): Promise<{ success: boolean; message: string }> {
    const request: BaseRequest = {
      mode: 16, // Mode 16: Delete Single Attachment
      parameters: {
        CustomerAttachmentID: attachmentId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Attachment deleted successfully");
      return {
        success: true,
        message: response.message || "Attachment deleted successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to delete attachment",
    };
  }

  /**
   * Get all attachments for a customer
   * @param customerId - The customer ID
   * @returns Array of attachments
   */
  async getAttachmentsByCustomerId(customerId: number): Promise<CustomerAttachment[]> {
    const request: BaseRequest = {
      mode: 17, // Mode 17: Get Attachments by Customer ID
      parameters: {
        CustomerID: customerId,
      },
    };

    const response = await this.execute<CustomerAttachment[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get documents expiring soon
   * @returns Array of attachments expiring soon
   */
  async getExpiringDocuments(): Promise<any[]> {
    const request: BaseRequest = {
      mode: 18, // Mode 18: Get Expiring Documents
      parameters: {},
    };

    const response = await this.execute<any[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get customer types for dropdown
   * @returns Array of customer types
   */
  async getCustomerTypes(): Promise<CustomerType[]> {
    // This would need a corresponding endpoint in the backend
    // For now, returning mock data
    return [
      { TypeID: 1, Description: "Individual" },
      { TypeID: 2, Description: "Corporate" },
      { TypeID: 3, Description: "Government" },
      { TypeID: 4, Description: "Non-Profit" },
    ];
  }

  /**
   * Get contact types for dropdown
   * @returns Array of contact types
   */
  async getContactTypes(): Promise<ContactType[]> {
    // This would need a corresponding endpoint in the backend
    // For now, returning mock data
    return [
      { ContactTypeID: 1, ContactDesc: "Primary" },
      { ContactTypeID: 2, ContactDesc: "Billing" },
      { ContactTypeID: 3, ContactDesc: "Emergency" },
      { ContactTypeID: 4, ContactDesc: "Other" },
    ];
  }

  /**
   * Get document types for dropdown
   * @returns Array of document types
   */
  async getDocumentTypes(): Promise<DocType[]> {
    // This would need a corresponding endpoint in the backend
    // For now, returning mock data
    return [
      { DocTypeID: 1, Description: "ID Card" },
      { DocTypeID: 2, Description: "Passport" },
      { DocTypeID: 3, Description: "Driving License" },
      { DocTypeID: 4, Description: "Contract" },
      { DocTypeID: 5, Description: "Other" },
    ];
  }

  /**
   * Get customer statistics
   * @returns Customer statistics
   */
  async getCustomerStatistics(): Promise<CustomerStatistics> {
    // This would need a corresponding endpoint in the backend
    // For now, returning mock data
    return {
      TotalCustomers: 0,
      ActiveCustomers: 0,
      CustomersThisMonth: 0,
      CustomersLastMonth: 0,
      TypeDistribution: [],
    };
  }
}

// Export a singleton instance
export const customerService = new CustomerService();
