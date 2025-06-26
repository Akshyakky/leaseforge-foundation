// src/services/contactTypeService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";

export interface ContactType {
  ContactTypeID: number;
  ContactTypeDescription: string;
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
}

/**
 * Service for contact type-related operations
 */
class ContactTypeService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/contactType");
  }

  /**
   * Get all contact types
   * @returns Array of contact types
   */
  async getAllContactTypes(): Promise<ContactType[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Contact Types
      parameters: {},
    };

    const response = await this.execute<ContactType[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a contact type by ID
   * @param contactTypeId - The ID of the contact type to fetch
   * @returns The contact type object or null if not found
   */
  async getContactTypeById(contactTypeId: number): Promise<ContactType | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Contact Type by ID
      parameters: {
        ContactTypeID: contactTypeId,
      },
    };

    const response = await this.execute<ContactType[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Create a new contact type
   * @param contactType - The contact type data to create
   * @returns The created contact type ID if successful, null otherwise
   */
  async createContactType(contactType: Partial<ContactType>): Promise<number | null> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Contact Type
      parameters: {
        ContactTypeDescription: contactType.ContactTypeDescription,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contact type created successfully");
      return response.NewContactTypeID || null;
    }

    return null;
  }

  /**
   * Update an existing contact type
   * @param contactType - The contact type data to update
   * @returns true if successful, false otherwise
   */
  async updateContactType(contactType: Partial<ContactType>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Contact Type
      parameters: {
        ContactTypeID: contactType.ContactTypeID,
        ContactTypeDescription: contactType.ContactTypeDescription,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contact type updated successfully");
    }

    return response.success;
  }

  /**
   * Delete a contact type
   * @param contactTypeId - The ID of the contact type to delete
   * @returns true if successful, false otherwise
   */
  async deleteContactType(contactTypeId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Contact Type
      parameters: {
        ContactTypeID: contactTypeId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contact type deleted successfully");
    }

    return response.success;
  }

  /**
   * Search for contact types
   * @param searchText - Text to search for in contact type fields
   * @returns Array of matching contact types
   */
  async searchContactTypes(searchText: string): Promise<ContactType[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Contact Types
      parameters: {
        SearchText: searchText,
      },
    };

    const response = await this.execute<ContactType[]>(request);
    return response.success ? response.data || [] : [];
  }
}

// Export a singleton instance
export const contactTypeService = new ContactTypeService();
