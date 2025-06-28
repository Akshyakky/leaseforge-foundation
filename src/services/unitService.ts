// src/services/unitService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";

export interface Unit {
  UnitID: number;
  UnitNo: string;
  PropertyID: number;
  UnitTypeID: number;
  UnitCategoryID: number;
  UnitViewID?: number;
  FloorID: number;
  BedRoomID?: number;
  BathRoomID?: number;
  Balconoy?: string;
  UnitStyleID?: number;
  UnitModel?: string;
  CommunityID?: number;
  CountryID: number;
  CityID: number;
  BalconyAreaSqft?: number;
  BalconyAreaSqftMtr?: number;
  MuncipalyNo?: number;
  LivingAreaSqft?: number;
  LivingAreaSqftMtr?: number;
  Sector?: number;
  TereaceAreaSqft?: number;
  TereaceAreaSqftMtr?: number;
  Block?: number;
  TotalAreaSqft?: number;
  TotalAreaSqftMtr?: number;
  UnitRate?: number;
  NoOfInstallmentLease?: number;
  PerMonth?: number;
  PerYear?: number;
  NoOfInstallmentSale?: number;
  ListingPrice?: number;
  SalePrice?: number;
  NoOfInstallmentPM?: number;
  PerMonthRentPm?: number;
  PerYearRentPm?: number;
  UnitStatus?: string;
  Remarks?: string;
  UnitClassID?: number;

  // Joined fields from related tables
  PropertyName?: string;
  UnitTypeName?: string;
  UnitCategoryName?: string;
  UnitViewName?: string;
  FloorName?: string;
  BedRooms?: number;
  BathRooms?: number;
  UnitStyleName?: string;
  CommunityName?: string;
  CountryName?: string;
  CityName?: string;
  UnitClassName?: string;

  // Enhanced image information (from stored procedure modes 3, 6, 34)
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

export interface UnitContact {
  UnitContactID: number;
  UnitID: number;
  ContactTypeID: number;
  ContactName: string;
  Remarks?: string;
  ContactTypeName?: string;

  // Audit fields
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
}

export interface UnitAttachment {
  UnitAttachmentID: number;
  UnitID: number;
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
  DocIssueDate?: string;
  DocExpiryDate?: string;
  IsPublic?: boolean;
  Remarks?: string;
  DocTypeName?: string;

  // Audit fields
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
}

export interface UnitStatistics {
  statusCounts: { UnitStatus: string; UnitCount: number }[];
  typeCounts: { UnitTypeID: number; UnitTypeName: string; UnitCount: number }[];
  bedroomCounts?: { BedRooms: number; UnitCount: number }[];
  propertyCounts?: { PropertyID: number; PropertyName: string; UnitCount: number }[];
}

export interface UnitWithDetails {
  unit: Unit | null;
  contacts: UnitContact[];
  attachments: UnitAttachment[];
}

/**
 * Service for unit-related operations
 */
class UnitService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/unit");
  }

  /**
   * Create a new unit with optional contacts and attachments
   * @param unit - The unit data to create
   * @param contacts - Optional array of contacts to associate with the unit
   * @param attachments - Optional array of attachments to associate with the unit
   * @returns The ID of the newly created unit or null if unsuccessful
   */
  async createUnit(unit: Partial<Unit>, contacts?: Partial<UnitContact>[], attachments?: Partial<UnitAttachment>[]): Promise<number | null> {
    const contactsJSON = contacts && contacts.length > 0 ? JSON.stringify(contacts) : null;
    const attachmentsJSON = attachments && attachments.length > 0 ? JSON.stringify(attachments) : null;

    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Unit
      parameters: {
        ...unit,
        ContactsJSON: contactsJSON,
        AttachmentsJSON: attachmentsJSON,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Unit created successfully");
      return response.NewUnitID || null;
    }

    return null;
  }

  /**
   * Update an existing unit with optional contacts and attachments
   * @param unit - The unit data to update
   * @param contacts - Optional array of contacts to associate with the unit
   * @param attachments - Optional array of attachments to associate with the unit
   * @returns true if successful, false otherwise
   */
  async updateUnit(unit: Partial<Unit> & { UnitID: number }, contacts?: Partial<UnitContact>[], attachments?: Partial<UnitAttachment>[]): Promise<boolean> {
    const contactsJSON = contacts && contacts.length > 0 ? JSON.stringify(contacts) : null;
    const attachmentsJSON = attachments && attachments.length > 0 ? JSON.stringify(attachments) : null;

    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Unit
      parameters: {
        ...unit,
        ContactsJSON: contactsJSON,
        AttachmentsJSON: attachmentsJSON,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Unit updated successfully");
    }

    return response.success;
  }

  /**
   * Get all active units (Enhanced with image information)
   * @returns Array of units
   */
  async getAllUnits(): Promise<Unit[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Units
      parameters: {},
    };

    const response = await this.execute<Unit[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a unit by ID (including contacts and attachments)
   * @param unitId - The ID of the unit to fetch
   * @returns Object containing the unit, its contacts, and attachments
   */
  async getUnitById(unitId: number): Promise<UnitWithDetails> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Unit by ID with contacts and attachments
      parameters: {
        UnitID: unitId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        unit: response.table1 && response.table1.length > 0 ? response.table1[0] : null,
        contacts: response.table2 || [],
        attachments: response.table3 || [],
      };
    }

    return { unit: null, contacts: [], attachments: [] };
  }

  /**
   * Delete a unit (and associated attachments)
   * @param unitId - The ID of the unit to delete
   * @returns true if successful, false otherwise
   */
  async deleteUnit(unitId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Unit
      parameters: {
        UnitID: unitId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Unit deleted successfully");
    }

    return response.success;
  }

  /**
   * Search for units with various filters (Enhanced with image information)
   * @param params - Search parameters and filters
   * @returns Array of matching units
   */
  async searchUnits(
    params: {
      searchText?: string;
      propertyId?: number;
      unitTypeId?: number;
      unitCategoryId?: number;
      unitStatus?: string;
      floorId?: number;
      bedRoomId?: number;
      bathRoomId?: number;
      communityId?: number;
      unitClassId?: number;
      minPrice?: number;
      maxPrice?: number;
      minArea?: number;
      maxArea?: number;
    } = {}
  ): Promise<Unit[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Units with Filters
      parameters: {
        SearchText: params.searchText,
        FilterPropertyID: params.propertyId,
        FilterUnitTypeID: params.unitTypeId,
        FilterUnitCategoryID: params.unitCategoryId,
        FilterUnitStatus: params.unitStatus,
        FilterFloorID: params.floorId,
        FilterBedRoomID: params.bedRoomId,
        FilterBathRoomID: params.bathRoomId,
        FilterCommunityID: params.communityId,
        FilterUnitClassID: params.unitClassId,
        MinPrice: params.minPrice,
        MaxPrice: params.maxPrice,
        MinArea: params.minArea,
        MaxArea: params.maxArea,
      },
    };

    const response = await this.execute<Unit[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get units by property
   * @param propertyId - The property ID
   * @returns Array of units in the specified property
   */
  async getUnitsByProperty(propertyId: number): Promise<Unit[]> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Get Units by Property
      parameters: {
        PropertyID: propertyId,
      },
    };

    const response = await this.execute<Unit[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get units by status
   * @param status - The unit status
   * @returns Array of units with the specified status
   */
  async getUnitsByStatus(status: string): Promise<Unit[]> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Get Units by Status
      parameters: {
        UnitStatus: status,
      },
    };

    const response = await this.execute<Unit[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Update a unit's status
   * @param unitId - The unit ID
   * @param status - The new status
   * @returns true if successful, false otherwise
   */
  async updateUnitStatus(unitId: number, status: string): Promise<boolean> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Update Unit Status
      parameters: {
        UnitID: unitId,
        UnitStatus: status,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Unit status updated successfully");
    }

    return response.success;
  }

  /**
   * Add a contact to a unit
   * @param contact - The contact data
   * @returns The ID of the newly created contact or null if unsuccessful
   */
  async addContact(contact: Partial<UnitContact> & { UnitID: number }): Promise<number | null> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Add Contact to Unit
      parameters: {
        UnitID: contact.UnitID,
        ContactTypeID: contact.ContactTypeID,
        ContactName: contact.ContactName,
        ContactRemarks: contact.Remarks,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contact added successfully");
      return response.NewUnitContactID || null;
    }

    return null;
  }

  /**
   * Update a unit contact
   * @param contact - The contact data to update
   * @returns true if successful, false otherwise
   */
  async updateContact(contact: Partial<UnitContact> & { UnitContactID: number }): Promise<boolean> {
    const request: BaseRequest = {
      mode: 11, // Mode 11: Update Unit Contact
      parameters: {
        UnitContactID: contact.UnitContactID,
        ContactTypeID: contact.ContactTypeID,
        ContactName: contact.ContactName,
        ContactRemarks: contact.Remarks,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contact updated successfully");
    }

    return response.success;
  }

  /**
   * Delete a unit contact
   * @param contactId - The ID of the contact to delete
   * @returns true if successful, false otherwise
   */
  async deleteContact(contactId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 12, // Mode 12: Delete Unit Contact
      parameters: {
        UnitContactID: contactId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contact deleted successfully");
    }

    return response.success;
  }

  /**
   * Get all contacts for a unit
   * @param unitId - The unit ID
   * @returns Array of contacts
   */
  async getUnitContacts(unitId: number): Promise<UnitContact[]> {
    const request: BaseRequest = {
      mode: 13, // Mode 13: Get Unit Contacts
      parameters: {
        UnitID: unitId,
      },
    };

    const response = await this.execute<UnitContact[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get units by floor
   * @param floorId - The floor ID
   * @returns Array of units on the specified floor
   */
  async getUnitsByFloor(floorId: number): Promise<Unit[]> {
    const request: BaseRequest = {
      mode: 14, // Mode 14: Get Units by Floor
      parameters: {
        FloorID: floorId,
      },
    };

    const response = await this.execute<Unit[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get unit statistics
   * @param propertyId - Optional property ID to filter statistics
   * @returns Unit statistics
   */
  async getUnitStatistics(propertyId?: number): Promise<UnitStatistics> {
    const request: BaseRequest = {
      mode: 15, // Mode 15: Get Unit Statistics
      parameters: {
        PropertyID: propertyId,
      },
    };

    const response = await this.execute(request, false);

    if (response.success) {
      return {
        statusCounts: response.table1 || [],
        typeCounts: response.table2 || [],
        bedroomCounts: propertyId ? response.table3 || [] : undefined,
        propertyCounts: !propertyId ? response.table3 || [] : undefined,
      };
    }

    return {
      statusCounts: [],
      typeCounts: [],
    };
  }

  // ==================== ATTACHMENT METHODS ====================

  /**
   * Add a single attachment to a unit
   * @param attachment - The attachment data
   * @returns The ID of the newly created attachment or null if unsuccessful
   */
  async addAttachment(attachment: Partial<UnitAttachment> & { UnitID: number }): Promise<number | null> {
    const request: BaseRequest = {
      mode: 30, // Mode 30: Add Single Attachment to Unit
      parameters: {
        UnitID: attachment.UnitID,
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
   * Update a single attachment
   * @param attachment - The attachment data to update
   * @returns true if successful, false otherwise
   */
  async updateAttachment(attachment: Partial<UnitAttachment> & { UnitAttachmentID: number }): Promise<boolean> {
    const request: BaseRequest = {
      mode: 31, // Mode 31: Update Single Attachment
      parameters: {
        UnitAttachmentID: attachment.UnitAttachmentID,
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
   * Delete a single attachment
   * @param attachmentId - The ID of the attachment to delete
   * @returns true if successful, false otherwise
   */
  async deleteAttachment(attachmentId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 32, // Mode 32: Delete Single Attachment
      parameters: {
        UnitAttachmentID: attachmentId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Attachment deleted successfully");
    }

    return response.success;
  }

  /**
   * Get all attachments for a unit
   * @param unitId - The unit ID
   * @returns Array of attachments
   */
  async getUnitAttachments(unitId: number): Promise<UnitAttachment[]> {
    const request: BaseRequest = {
      mode: 33, // Mode 33: Get Attachments by Unit ID
      parameters: {
        UnitID: unitId,
      },
    };

    const response = await this.execute<UnitAttachment[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get units with image counts
   * @param propertyId - Optional property ID to filter results
   * @returns Array of units with image count information
   */
  async getUnitsWithImageCounts(propertyId?: number): Promise<Unit[]> {
    const request: BaseRequest = {
      mode: 34, // Mode 34: Get Units with Image Counts
      parameters: {
        PropertyID: propertyId,
      },
    };

    const response = await this.execute<Unit[]>(request);
    return response.success ? response.data || [] : [];
  }
}

// Export a singleton instance
export const unitService = new UnitService();
