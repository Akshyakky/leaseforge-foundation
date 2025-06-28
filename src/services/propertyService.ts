// src/services/propertyService.ts
import { BaseService, BaseRequest } from "./BaseService";

export interface Property {
  PropertyID: number;
  PropertyNo?: string;
  PropertyName: string;
  ProjectStartDate?: Date;
  ProjectCompletionDate?: Date;
  TitleDeed?: string;
  CommunityID?: number;
  CountryID: number;
  CityID?: number;
  PlotNo?: string;
  PlotSize?: number;
  GEOLocation?: string;
  Location?: string;
  TotalUnit?: number;
  TotalParkings?: number;
  NoOfFloors?: number;
  BuildUpArea?: number;
  GrossArea?: number;
  SquareFootRate?: number;
  Remark?: string;

  // Joined fields from related tables
  CommunityName?: string;
  CountryName?: string;
  CityName?: string;

  // Attachment summary fields
  MainImageName?: string;
  AttachmentCount?: number;
  ImageCount?: number;
  TotalAttachmentCount?: number;

  // Audit fields
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
}

export interface PropertyAttachment {
  PropertyAttachmentID?: number;
  PropertyID: number;
  DocTypeID: number;
  DocumentName: string;
  FilePath?: string;
  FileContent?: string;
  FileContentType?: string;
  FileSize?: number;
  AttachmentType?: string;
  AttachmentCategory?: string;
  DisplayOrder?: number;
  IsMainImage?: boolean;
  ImageCaption?: string;
  ImageAltText?: string;
  DocIssueDate?: Date;
  DocExpiryDate?: Date;
  IsPublic?: boolean;
  Remarks?: string;

  // Joined fields
  DocTypeName?: string;

  // Audit fields
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
}

// Type for new attachments without PropertyID
export type NewPropertyAttachment = Omit<PropertyAttachment, "PropertyID">;

export interface PropertyWithAttachments {
  property: Property;
  attachments: PropertyAttachment[];
}

export interface PropertySearchFilters {
  communityId?: number;
  countryId?: number;
  cityId?: number;
}

export interface CreatePropertyRequest {
  property: Partial<Property>;
  attachments?: NewPropertyAttachment[];
}

export interface UpdatePropertyRequest {
  property: Partial<Property>;
  attachments?: NewPropertyAttachment[];
}

/**
 * Service for property-related operations
 */
class PropertyService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/property");
  }

  /**
   * Get all properties
   * @returns Array of properties
   */
  async getAllProperties(): Promise<Property[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Properties
      parameters: {},
    };

    const response = await this.execute<Property[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a property by ID with its attachments
   * @param propertyId - The ID of the property to fetch
   * @returns The property with attachments or null if not found
   */
  async getPropertyById(propertyId: number): Promise<PropertyWithAttachments | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Property by ID (including attachments)
      parameters: {
        PropertyID: propertyId,
      },
    };

    const response = await this.execute<{ property: Property[]; attachments: PropertyAttachment[] }>(request);

    if (response.success && response.table1 && response.table1.length > 0) {
      return {
        property: response.table1[0],
        attachments: response.table2 || [],
      };
    }

    return null;
  }

  /**
   * Create a new property with optional attachments
   * @param request - The property and attachment data to create
   * @returns The ID of the newly created property or null if unsuccessful
   */
  async createProperty(request: CreatePropertyRequest): Promise<number | null> {
    const serviceRequest: BaseRequest = {
      mode: 1, // Mode 1: Insert New Property with Attachments
      parameters: {
        ...request.property,
        AttachmentsJSON: request.attachments ? JSON.stringify(request.attachments) : null,
      },
    };

    const response = await this.execute(serviceRequest);

    if (response.success) {
      this.showSuccess("Property created successfully");
      return response.NewPropertyID || null;
    }

    return null;
  }

  /**
   * Update an existing property with optional attachments
   * @param request - The property and attachment data to update
   * @returns true if successful, false otherwise
   */
  async updateProperty(request: UpdatePropertyRequest): Promise<boolean> {
    const serviceRequest: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Property with Attachments
      parameters: {
        ...request.property,
        AttachmentsJSON: request.attachments ? JSON.stringify(request.attachments) : null,
      },
    };

    const response = await this.execute(serviceRequest);

    if (response.success) {
      this.showSuccess("Property updated successfully");
    }

    return response.success;
  }

  /**
   * Delete a property
   * @param propertyId - The ID of the property to delete
   * @returns true if successful, false otherwise
   */
  async deleteProperty(propertyId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Property
      parameters: {
        PropertyID: propertyId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Property deleted successfully");
    }

    return response.success;
  }

  /**
   * Search for properties with filters
   * @param searchText - Text to search for in property fields
   * @param filters - Optional filters for the search
   * @returns Array of matching properties
   */
  async searchProperties(searchText?: string, filters?: PropertySearchFilters): Promise<Property[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Properties with Filters
      parameters: {
        SearchText: searchText,
        FilterCommunityID: filters?.communityId,
        FilterCountryID: filters?.countryId,
        FilterCityID: filters?.cityId,
      },
    };

    const response = await this.execute<Property[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Add a single attachment to a property
   * @param attachment - The attachment data to add
   * @returns The ID of the newly created attachment or null if unsuccessful
   */
  async addPropertyAttachment(attachment: PropertyAttachment): Promise<number | null> {
    const request: BaseRequest = {
      mode: 20, // Mode 20: Add Single Attachment to Property
      parameters: {
        PropertyID: attachment.PropertyID,
        DocTypeID: attachment.DocTypeID,
        DocumentName: attachment.DocumentName,
        FilePath: attachment.FilePath,
        FileContent: attachment.FileContent,
        FileContentType: attachment.FileContentType,
        FileSize: attachment.FileSize,
        AttachmentType: attachment.AttachmentType,
        AttachmentCategory: attachment.AttachmentCategory,
        DisplayOrder: attachment.DisplayOrder,
        IsMainImage: attachment.IsMainImage,
        ImageCaption: attachment.ImageCaption,
        ImageAltText: attachment.ImageAltText,
        DocIssueDate: attachment.DocIssueDate,
        DocExpiryDate: attachment.DocExpiryDate,
        IsPublic: attachment.IsPublic,
        AttachmentRemarks: attachment.Remarks,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Attachment added successfully");
      return response.NewAttachmentID || null;
    }

    return null;
  }

  /**
   * Update a property attachment
   * @param attachment - The attachment data to update
   * @returns true if successful, false otherwise
   */
  async updatePropertyAttachment(attachment: PropertyAttachment): Promise<boolean> {
    const request: BaseRequest = {
      mode: 21, // Mode 21: Update Single Attachment
      parameters: {
        PropertyAttachmentID: attachment.PropertyAttachmentID,
        DocTypeID: attachment.DocTypeID,
        DocumentName: attachment.DocumentName,
        FilePath: attachment.FilePath,
        FileContent: attachment.FileContent,
        FileContentType: attachment.FileContentType,
        FileSize: attachment.FileSize,
        AttachmentType: attachment.AttachmentType,
        AttachmentCategory: attachment.AttachmentCategory,
        DisplayOrder: attachment.DisplayOrder,
        IsMainImage: attachment.IsMainImage,
        ImageCaption: attachment.ImageCaption,
        ImageAltText: attachment.ImageAltText,
        DocIssueDate: attachment.DocIssueDate,
        DocExpiryDate: attachment.DocExpiryDate,
        IsPublic: attachment.IsPublic,
        AttachmentRemarks: attachment.Remarks,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Attachment updated successfully");
    }

    return response.success;
  }

  /**
   * Delete a property attachment
   * @param attachmentId - The ID of the attachment to delete
   * @returns true if successful, false otherwise
   */
  async deletePropertyAttachment(attachmentId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 22, // Mode 22: Delete Single Attachment
      parameters: {
        PropertyAttachmentID: attachmentId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Attachment deleted successfully");
    }

    return response.success;
  }

  /**
   * Get all attachments for a property
   * @param propertyId - The ID of the property
   * @returns Array of property attachments
   */
  async getPropertyAttachments(propertyId: number): Promise<PropertyAttachment[]> {
    const request: BaseRequest = {
      mode: 23, // Mode 23: Get Attachments by Property ID
      parameters: {
        PropertyID: propertyId,
      },
    };

    const response = await this.execute<PropertyAttachment[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get properties with image counts
   * @returns Array of properties with image count information
   */
  async getPropertiesWithImageCounts(): Promise<Property[]> {
    const request: BaseRequest = {
      mode: 24, // Mode 24: Get Properties with Image Counts
      parameters: {},
    };

    const response = await this.execute<Property[]>(request);
    return response.success ? response.data || [] : [];
  }
}

// Export a singleton instance
export const propertyService = new PropertyService();
