// src/services/docTypeService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";

export interface DocType {
  DocTypeID: number;
  Description: string;
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
}

/**
 * Service for document type-related operations
 */
class DocTypeService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/docType");
  }

  /**
   * Get all document types
   * @returns Array of document types
   */
  async getAllDocTypes(): Promise<DocType[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Document Types
      parameters: {},
    };

    const response = await this.execute<DocType[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a document type by ID
   * @param docTypeId - The ID of the document type to fetch
   * @returns The document type object or null if not found
   */
  async getDocTypeById(docTypeId: number): Promise<DocType | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Document Type by ID
      parameters: {
        DocTypeID: docTypeId,
      },
    };

    const response = await this.execute<DocType[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Create a new document type
   * @param docType - The document type data to create
   * @returns The created document type ID if successful, null otherwise
   */
  async createDocType(docType: Partial<DocType>): Promise<number | null> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Document Type
      parameters: {
        Description: docType.Description,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Document type created successfully");
      return response.NewDocTypeID || null;
    }

    return null;
  }

  /**
   * Update an existing document type
   * @param docType - The document type data to update
   * @returns true if successful, false otherwise
   */
  async updateDocType(docType: Partial<DocType>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Document Type
      parameters: {
        DocTypeID: docType.DocTypeID,
        Description: docType.Description,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Document type updated successfully");
    }

    return response.success;
  }

  /**
   * Delete a document type
   * @param docTypeId - The ID of the document type to delete
   * @returns true if successful, false otherwise
   */
  async deleteDocType(docTypeId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Document Type
      parameters: {
        DocTypeID: docTypeId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Document type deleted successfully");
    }

    return response.success;
  }

  /**
   * Search for document types
   * @param searchText - Text to search for in document type fields
   * @returns Array of matching document types
   */
  async searchDocTypes(searchText: string): Promise<DocType[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Document Types
      parameters: {
        SearchText: searchText,
      },
    };

    const response = await this.execute<DocType[]>(request);
    return response.success ? response.data || [] : [];
  }
}

// Export a singleton instance
export const docTypeService = new DocTypeService();
