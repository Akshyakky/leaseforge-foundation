// src/services/supplierService.ts
import { BaseService, BaseRequest } from "./BaseService";
import {
  Supplier,
  SupplierContact,
  SupplierBankDetails,
  SupplierGLDetails,
  SupplierType,
  SupplierAttachment,
  SupplierOutstandingBalance,
  BankCategory,
  Bank,
  PaymentTerm,
  SupplierSearchParams,
  SupplierRequest,
  GLAccountRequest,
  ApiResponse,
  SupplierUpdateRequest,
  ExpiringSupplierDocument,
} from "../types/supplierTypes";

/**
 * Service for supplier management operations
 */
class SupplierService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/supplierManagement");
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
   * Convert attachment file to proper format for database storage
   * @param attachment - The attachment with potential file data
   * @returns Processed attachment ready for API
   */
  private async processAttachmentFile(attachment: Partial<SupplierAttachment>): Promise<Partial<SupplierAttachment>> {
    // Clone the attachment to avoid modifying the original
    const processedAttachment = { ...attachment };

    // If there's a file object, convert it to base64
    if (attachment.file) {
      try {
        processedAttachment.FileContent = await this.fileToBase64(attachment.file);
        processedAttachment.FileContentType = attachment.file.type;
        processedAttachment.FileSize = attachment.file.size;

        // Set document name from file if not provided
        if (!processedAttachment.DocumentName) {
          processedAttachment.DocumentName = attachment.file.name;
        }

        // Remove the file object as it's not needed for the API
        delete processedAttachment.file;
        delete processedAttachment.fileUrl;
      } catch (error) {
        console.error("Error processing attachment file:", error);
        throw new Error("Failed to process attachment file");
      }
    }

    return processedAttachment;
  }

  /**
   * Generate file URL for attachment display
   * @param attachment - The attachment with file content
   * @returns URL for file display or download
   */
  generateAttachmentUrl(attachment: SupplierAttachment): string {
    if (!attachment.FileContent || !attachment.FileContentType) {
      return "";
    }

    try {
      // Convert base64 back to blob for URL generation
      const byteCharacters = atob(attachment.FileContent as string);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: attachment.FileContentType });

      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error generating attachment URL:", error);
      return "";
    }
  }

  /**
   * Download attachment file
   * @param attachment - The attachment to download
   */
  downloadAttachment(attachment: SupplierAttachment): void {
    if (!attachment.FileContent || !attachment.DocumentName) {
      return;
    }

    try {
      const url = this.generateAttachmentUrl(attachment);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.DocumentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading attachment:", error);
    }
  }

  /**
   * Create supplier with attachments
   * @param data - The supplier request data including attachments
   * @returns Response with status and newly created supplier ID
   */
  async createSupplier(data: SupplierRequest): Promise<ApiResponse> {
    // Process attachments if present
    let processedAttachments: Partial<SupplierAttachment>[] = [];
    if (data.attachments && data.attachments.length > 0) {
      processedAttachments = await Promise.all(data.attachments.map((attachment) => this.processAttachmentFile(attachment)));
    }

    // Prepare parameters for GL account
    let glAccountParams: any = {};
    if (data.glAccountDetails) {
      const gl = data.glAccountDetails;
      glAccountParams = {
        CreateNewAccount: gl.createNewAccount,
        AccountID: gl.accountID,
        AccountCode: gl.accountCode,
        AccountName: gl.accountName,
        AccountTypeID: gl.accountTypeID,
        CurrencyID: gl.currencyID,
        CompanyID: gl.companyID,
      };
    }

    // Prepare parameters
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Supplier
      parameters: {
        // Supplier details
        SupplierNo: data.supplier.SupplierNo,
        SupplierName: data.supplier.SupplierName,
        SupplierTypeID: data.supplier.SupplierTypeID,
        PaymentTermID: data.supplier.PaymentTermID,
        ChequeName: data.supplier.ChequeName,
        HasCreditFacility: data.supplier.HasCreditFacility,
        CreditLimit: data.supplier.CreditLimit,
        CreditDays: data.supplier.CreditDays,
        VatRegNo: data.supplier.VatRegNo,
        TaxID: data.supplier.TaxID,
        DiscountPercentage: data.supplier.DiscountPercentage,
        Status: data.supplier.Status,
        PhoneNo: data.supplier.PhoneNo,
        FaxNo: data.supplier.FaxNo,
        MobileNo: data.supplier.MobileNo,
        Email: data.supplier.Email,
        Website: data.supplier.Website,
        Address: data.supplier.Address,
        CountryID: data.supplier.CountryID,
        CityID: data.supplier.CityID,
        Remarks: data.supplier.Remarks,

        // GL Account parameters
        ...glAccountParams,

        // Primary contact if provided
        ...(data.contacts && data.contacts.length > 0
          ? {
              ContactTypeID: data.contacts[0].ContactTypeID,
              ContactName: data.contacts[0].ContactName,
              ContactDesignation: data.contacts[0].Designation,
              ContactEmailID: data.contacts[0].EmailID,
              ContactPhoneNo: data.contacts[0].PhoneNo,
              ContactMobileNo: data.contacts[0].MobileNo,
              ContactCountryID: data.contacts[0].CountryID,
              ContactCityID: data.contacts[0].CityID,
              ContactAddress: data.contacts[0].Address,
              IsDefaultContact: data.contacts[0].IsDefault,
              ContactRemarks: data.contacts[0].Remarks,
            }
          : {}),

        // Primary bank details if provided
        ...(data.bankDetails && data.bankDetails.length > 0
          ? {
              BankAccountNo: data.bankDetails[0].AccountNo,
              BankID: data.bankDetails[0].BankID,
              BranchName: data.bankDetails[0].BranchName,
              SwiftCode: data.bankDetails[0].SwiftCode,
              IBAN: data.bankDetails[0].IBAN,
              BankCountryID: data.bankDetails[0].CountryID,
              BankCityID: data.bankDetails[0].CityID,
              BankContactPerson: data.bankDetails[0].ContactPerson,
              BankContactNo: data.bankDetails[0].ContactNo,
              BankCategoryID: data.bankDetails[0].CategoryID,
              IsDefaultBank: data.bankDetails[0].IsDefault,
            }
          : {}),

        // Attachments as JSON if provided
        AttachmentsJSON: processedAttachments.length > 0 ? JSON.stringify(processedAttachments) : null,

        // Audit parameters
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Supplier created successfully");
      return {
        Status: 1,
        Message: response.message || "Supplier created successfully",
        NewSupplierID: response.NewSupplierID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create supplier",
    };
  }

  /**
   * Update an existing supplier with optional GL account updates
   * @param data - The supplier request data
   * @returns Response with status
   */
  async updateSupplier(data: SupplierUpdateRequest): Promise<ApiResponse> {
    // Prepare parameters for GL account
    let glAccountParams: any = {};

    if (data.glAccountDetails) {
      const gl = data.glAccountDetails;
      glAccountParams = {
        CreateNewAccount: gl.createNewAccount,
        AccountID: gl.accountID,
        AccountCode: gl.accountCode,
        AccountName: gl.accountName,
        AccountTypeID: gl.accountTypeID,
        CurrencyID: gl.currencyID,
        CompanyID: gl.companyID,
      };
    }

    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Supplier
      parameters: {
        SupplierID: data.supplier.SupplierID,

        // Supplier details
        SupplierNo: data.supplier.SupplierNo,
        SupplierName: data.supplier.SupplierName,
        SupplierTypeID: data.supplier.SupplierTypeID,
        PaymentTermID: data.supplier.PaymentTermID,
        ChequeName: data.supplier.ChequeName,
        HasCreditFacility: data.supplier.HasCreditFacility,
        CreditLimit: data.supplier.CreditLimit,
        CreditDays: data.supplier.CreditDays,
        VatRegNo: data.supplier.VatRegNo,
        TaxID: data.supplier.TaxID,
        DiscountPercentage: data.supplier.DiscountPercentage,
        Status: data.supplier.Status,
        PhoneNo: data.supplier.PhoneNo,
        FaxNo: data.supplier.FaxNo,
        MobileNo: data.supplier.MobileNo,
        Email: data.supplier.Email,
        Website: data.supplier.Website,
        Address: data.supplier.Address,
        CountryID: data.supplier.CountryID,
        CityID: data.supplier.CityID,
        Remarks: data.supplier.Remarks,

        // GL Account parameters
        ...glAccountParams,

        // Audit parameters
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Supplier updated successfully");
      return {
        Status: 1,
        Message: response.message || "Supplier updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update supplier",
    };
  }

  /**
   * Get all active suppliers
   * @returns Array of suppliers
   */
  async getAllSuppliers(): Promise<Supplier[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Suppliers
      parameters: {},
    };

    const response = await this.execute<Supplier[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get supplier by ID with all related data including attachments
   * @param supplierId - The ID of the supplier to fetch
   * @returns Supplier with contacts, bank details, GL details, and attachments
   */
  async getSupplierById(supplierId: number): Promise<{
    supplier: Supplier | null;
    contacts: SupplierContact[];
    bankDetails: SupplierBankDetails[];
    glDetails: SupplierGLDetails[];
    attachments: SupplierAttachment[];
  }> {
    const request: BaseRequest = {
      mode: 4,
      parameters: {
        SupplierID: supplierId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        supplier: response.table1 && response.table1.length > 0 ? response.table1[0] : null,
        contacts: response.table2 || [],
        bankDetails: response.table3 || [],
        glDetails: response.table4 || [],
        attachments: response.table5 || [],
      };
    }

    return { supplier: null, contacts: [], bankDetails: [], glDetails: [], attachments: [] };
  }

  /**
   * Delete a supplier
   * @param supplierId - The ID of the supplier to delete
   * @returns Response with status
   */
  async deleteSupplier(supplierId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Supplier
      parameters: {
        SupplierID: supplierId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Supplier deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Supplier deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete supplier",
    };
  }

  /**
   * Search for suppliers with filters
   * @param params - Search parameters
   * @returns Array of matching suppliers
   */
  async searchSuppliers(params: SupplierSearchParams = {}): Promise<Supplier[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Suppliers with Filters
      parameters: {
        SearchText: params.searchText,
        FilterSupplierTypeID: params.supplierTypeID,
        FilterStatus: params.status,
        FilterCountryID: params.countryID,
        FilterCityID: params.cityID,
        FilterHasCreditFacility: params.hasCreditFacility,
      },
    };

    const response = await this.execute<Supplier[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Add or update supplier contact
   * @param contact - The contact data
   * @returns Response with status and contact ID
   */
  async saveSupplierContact(contact: Partial<SupplierContact> & { SupplierID: number }): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Add/Update Supplier Contact
      parameters: {
        SupplierID: contact.SupplierID,
        SupplierContactID: contact.SupplierContactID,
        ContactTypeID: contact.ContactTypeID,
        ContactName: contact.ContactName,
        ContactDesignation: contact.Designation,
        ContactEmailID: contact.EmailID,
        ContactPhoneNo: contact.PhoneNo,
        ContactMobileNo: contact.MobileNo,
        ContactCountryID: contact.CountryID,
        ContactCityID: contact.CityID,
        ContactAddress: contact.Address,
        IsDefaultContact: contact.IsDefault,
        ContactRemarks: contact.Remarks,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contact saved successfully");
      return {
        Status: 1,
        Message: response.message || "Contact saved successfully",
        ContactID: response.ContactID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to save contact",
    };
  }

  /**
   * Add or update supplier bank details
   * @param bankDetails - The bank details data
   * @returns Response with status and bank ID
   */
  async saveSupplierBankDetails(bankDetails: Partial<SupplierBankDetails> & { SupplierID: number }): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Add/Update Supplier Bank Details
      parameters: {
        SupplierID: bankDetails.SupplierID,
        SupplierBankID: bankDetails.SupplierBankID,
        BankAccountNo: bankDetails.AccountNo,
        BankID: bankDetails.BankID,
        BranchName: bankDetails.BranchName,
        SwiftCode: bankDetails.SwiftCode,
        IBAN: bankDetails.IBAN,
        BankCountryID: bankDetails.CountryID,
        BankCityID: bankDetails.CityID,
        BankContactPerson: bankDetails.ContactPerson,
        BankContactNo: bankDetails.ContactNo,
        BankCategoryID: bankDetails.CategoryID,
        IsDefaultBank: bankDetails.IsDefault,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Bank details saved successfully");
      return {
        Status: 1,
        Message: response.message || "Bank details saved successfully",
        BankID: response.BankID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to save bank details",
    };
  }

  /**
   * Create a new supplier type
   * @param supplierType - The supplier type data to create
   * @returns Response with status and new supplier type ID
   */
  async createSupplierType(supplierType: Partial<SupplierType>): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Create New Supplier Type
      parameters: {
        SupplierTypeCode: supplierType.SupplierTypeCode,
        SupplierTypeName: supplierType.SupplierTypeName,
        SupplierTypeDescription: supplierType.SupplierTypeDescription,
        IsActive: supplierType.IsActive,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Supplier type created successfully");
      return {
        Status: 1,
        Message: response.message || "Supplier type created successfully",
        NewSupplierTypeID: response.NewSupplierTypeID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create supplier type",
    };
  }

  /**
   * Get all supplier types
   * @returns Array of supplier types
   */
  async getAllSupplierTypes(): Promise<SupplierType[]> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Get All Supplier Types
      parameters: {},
    };

    const response = await this.execute<SupplierType[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get supplier outstanding balances
   * @param asOfDate - The date to get balances as of
   * @param supplierId - Optional supplier ID filter
   * @returns Array of supplier outstanding balances
   */
  async getSupplierOutstandingBalances(asOfDate: Date | string, supplierId?: number): Promise<SupplierOutstandingBalance[]> {
    const request: BaseRequest = {
      mode: 11, // Mode 11: Get Supplier Outstanding Balances
      parameters: {
        BalanceAsOfDate: asOfDate,
        SupplierID: supplierId,
      },
    };

    const response = await this.execute<SupplierOutstandingBalance[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get supplier contacts by supplier ID
   * @param supplierId - The supplier ID
   * @returns Array of supplier contacts
   */
  async getSupplierContacts(supplierId: number): Promise<SupplierContact[]> {
    const request: BaseRequest = {
      mode: 12, // Mode 12: Get Supplier Contacts
      parameters: {
        SupplierID: supplierId,
      },
    };

    const response = await this.execute<SupplierContact[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get supplier bank details by supplier ID
   * @param supplierId - The supplier ID
   * @returns Array of supplier bank details
   */
  async getSupplierBankDetails(supplierId: number): Promise<SupplierBankDetails[]> {
    const request: BaseRequest = {
      mode: 13, // Mode 13: Get Supplier Bank Details
      parameters: {
        SupplierID: supplierId,
      },
    };

    const response = await this.execute<SupplierBankDetails[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Delete supplier contact
   * @param contactId - The contact ID to delete
   * @returns Response with status
   */
  async deleteSupplierContact(contactId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 14, // Mode 14: Delete Supplier Contact
      parameters: {
        SupplierContactID: contactId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contact deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Contact deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete contact",
    };
  }

  /**
   * Delete supplier bank details
   * @param bankId - The bank details ID to delete
   * @returns Response with status
   */
  async deleteSupplierBankDetails(bankId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 15, // Mode 15: Delete Supplier Bank Details
      parameters: {
        SupplierBankID: bankId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Bank details deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Bank details deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete bank details",
    };
  }

  /**
   * Add attachment to supplier
   * @param attachment - The attachment data including supplier ID
   * @returns Response with status and attachment ID
   */
  async addSupplierAttachment(attachment: Partial<SupplierAttachment> & { SupplierID: number }): Promise<ApiResponse> {
    // Process file if present
    const processedAttachment = await this.processAttachmentFile(attachment);

    const request: BaseRequest = {
      mode: 16, // Mode 16: Add Single Attachment to Supplier
      parameters: {
        SupplierID: attachment.SupplierID,
        DocTypeID: processedAttachment.DocTypeID,
        DocumentName: processedAttachment.DocumentName,
        FileContent: processedAttachment.FileContent,
        FileContentType: processedAttachment.FileContentType,
        FileSize: processedAttachment.FileSize,
        DocIssueDate: processedAttachment.DocIssueDate,
        DocExpiryDate: processedAttachment.DocExpiryDate,
        AttachmentRemark: processedAttachment.Remarks,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Attachment added successfully");
      return {
        Status: 1,
        Message: response.message || "Attachment added successfully",
        NewAttachmentID: response.NewAttachmentID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to add attachment",
    };
  }

  /**
   * Update supplier attachment
   * @param attachment - The attachment data with ID
   * @returns Response with status
   */
  async updateSupplierAttachment(attachment: Partial<SupplierAttachment> & { SupplierAttachmentID: number }): Promise<ApiResponse> {
    // Process file if present
    const processedAttachment = await this.processAttachmentFile(attachment);

    const request: BaseRequest = {
      mode: 17, // Mode 17: Update Single Attachment
      parameters: {
        SupplierAttachmentID: attachment.SupplierAttachmentID,
        DocTypeID: processedAttachment.DocTypeID,
        DocumentName: processedAttachment.DocumentName,
        FileContent: processedAttachment.FileContent,
        FileContentType: processedAttachment.FileContentType,
        FileSize: processedAttachment.FileSize,
        DocIssueDate: processedAttachment.DocIssueDate,
        DocExpiryDate: processedAttachment.DocExpiryDate,
        AttachmentRemark: processedAttachment.Remarks,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Attachment updated successfully");
      return {
        Status: 1,
        Message: response.message || "Attachment updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update attachment",
    };
  }

  /**
   * Delete supplier attachment
   * @param attachmentId - The attachment ID to delete
   * @returns Response with status
   */
  async deleteSupplierAttachment(attachmentId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 18, // Mode 18: Delete Single Attachment
      parameters: {
        SupplierAttachmentID: attachmentId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Attachment deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Attachment deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete attachment",
    };
  }

  /**
   * Get supplier attachments by supplier ID
   * @param supplierId - The supplier ID
   * @returns Array of supplier attachments
   */
  async getSupplierAttachments(supplierId: number): Promise<SupplierAttachment[]> {
    const request: BaseRequest = {
      mode: 19, // Mode 19: Get Attachments by Supplier ID
      parameters: {
        SupplierID: supplierId,
      },
    };

    const response = await this.execute<SupplierAttachment[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get expiring supplier documents for notifications
   * @param daysAhead - Number of days ahead to check for expiry (default 30)
   * @returns Array of expiring documents
   */
  async getExpiringSupplierDocuments(daysAhead: number = 30): Promise<ExpiringSupplierDocument[]> {
    const request: BaseRequest = {
      mode: 20, // Mode 20: Get Expiring Documents
      parameters: {
        DaysToExpiry: daysAhead,
      },
    };

    const response = await this.execute<ExpiringSupplierDocument[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get suppliers for dropdown (minimal data)
   * @param activeOnly - Whether to fetch only active suppliers
   * @returns Array of suppliers for dropdown
   */
  async getSuppliersForDropdown(activeOnly: boolean = true): Promise<Pick<Supplier, "SupplierID" | "SupplierNo" | "SupplierName">[]> {
    const suppliers = await this.getAllSuppliers();

    if (activeOnly) {
      return suppliers
        .filter((supplier) => supplier.Status === "Active")
        .map((supplier) => ({
          SupplierID: supplier.SupplierID,
          SupplierNo: supplier.SupplierNo,
          SupplierName: supplier.SupplierName,
        }));
    }

    return suppliers.map((supplier) => ({
      SupplierID: supplier.SupplierID,
      SupplierNo: supplier.SupplierNo,
      SupplierName: supplier.SupplierName,
    }));
  }

  /**
   * Get available banks for dropdown
   * @returns Array of banks
   */
  async getBanksForDropdown(): Promise<Bank[]> {
    // This would typically be a separate service/endpoint
    // For now, returning from the Base Service or you could create a separate method
    return [];
  }

  /**
   * Get bank categories for dropdown
   * @returns Array of bank categories
   */
  async getBankCategoriesForDropdown(): Promise<BankCategory[]> {
    // This would typically be a separate service/endpoint
    return [];
  }

  /**
   * Get payment terms for dropdown
   * @returns Array of payment terms
   */
  async getPaymentTermsForDropdown(): Promise<PaymentTerm[]> {
    // This would typically be a separate service/endpoint
    return [];
  }
}

// Export a singleton instance
export const supplierService = new SupplierService();
