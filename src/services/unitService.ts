
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

export interface UnitStatistics {
  statusCounts: { UnitStatus: string; UnitCount: number }[];
  typeCounts: { UnitTypeID: number; UnitTypeName: string; UnitCount: number }[];
  bedroomCounts?: { BedRooms: number; UnitCount: number }[];
  propertyCounts?: { PropertyID: number; PropertyName: string; UnitCount: number }[];
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
   * Create a new unit with optional contacts
   * @param unit - The unit data to create
   * @param contacts - Optional array of contacts to associate with the unit
   * @returns The ID of the newly created unit or null if unsuccessful
   */
  async createUnit(unit: Partial<Unit>, contacts?: Partial<UnitContact>[]): Promise<number | null> {
    const contactsJSON = contacts && contacts.length > 0 ? JSON.stringify(contacts) : null;

    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Unit
      parameters: {
        ...unit,
        ContactsJSON: contactsJSON,
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
   * Update an existing unit with optional contacts
   * @param unit - The unit data to update
   * @param contacts - Optional array of contacts to associate with the unit
   * @returns true if successful, false otherwise
   */
  async updateUnit(unit: Partial<Unit> & { UnitID: number }, contacts?: Partial<UnitContact>[]): Promise<boolean> {
    const contactsJSON = contacts && contacts.length > 0 ? JSON.stringify(contacts) : null;

    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Unit
      parameters: {
        ...unit,
        ContactsJSON: contactsJSON,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Unit updated successfully");
    }

    return response.success;
  }

  /**
   * Get all active units
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
   * Get a unit by ID (including contacts)
   * @param unitId - The ID of the unit to fetch
   * @returns Object containing the unit and its contacts
   */
  async getUnitById(unitId: number): Promise<{ unit: Unit | null; contacts: UnitContact[] }> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Unit by ID with contacts
      parameters: {
        UnitID: unitId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        unit: response.table1 && response.table1.length > 0 ? response.table1[0] : null,
        contacts: response.table2 || [],
      };
    }

    return { unit: null, contacts: [] };
  }

  /**
   * Delete a unit
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
   * Search for units with various filters
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
}

// Export a singleton instance
export const unitService = new UnitService();
