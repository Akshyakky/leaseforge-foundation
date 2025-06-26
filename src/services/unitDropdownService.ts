// src/services/unitDropdownService.ts
import { BaseService, BaseRequest } from "./BaseService";

export interface PropertyForDropdown {
  PropertyID: number;
  PropertyName: string;
}

export interface UnitTypeForDropdown {
  UnitTypeID: number;
  UnitTypeName: string;
}

export interface UnitCategoryForDropdown {
  UnitCategoryID: number;
  UnitCategoryName: string;
}

export interface UnitViewForDropdown {
  UnitViewID: number;
  UnitViewName: string;
}

export interface FloorForDropdown {
  FloorID: number;
  FloorName: string;
}

export interface BedRoomForDropdown {
  BedRoomID: number;
  BedRoomCount: number;
}

export interface BathRoomForDropdown {
  BathRoomID: number;
  BathRoomCount: number;
}

export interface UnitStyleForDropdown {
  UnitStyleID: number;
  UnitStyleName: string;
}

export interface CommunityForDropdown {
  CommunityID: number;
  CommunityName: string;
}

export interface UnitClassForDropdown {
  UnitClassID: number;
  UnitClassName: string;
}

/**
 * Service for unit-related dropdown data
 */
class UnitDropdownService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/unitDropdown");
  }

  /**
   * Get properties for dropdown
   * @returns Array of properties
   */
  async getProperties(): Promise<PropertyForDropdown[]> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Get Properties for Dropdown
      parameters: {},
    };

    const response = await this.execute<PropertyForDropdown[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get unit types for dropdown
   * @returns Array of unit types
   */
  async getUnitTypes(): Promise<UnitTypeForDropdown[]> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Get Unit Types for Dropdown
      parameters: {},
    };

    const response = await this.execute<UnitTypeForDropdown[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get unit categories for dropdown
   * @returns Array of unit categories
   */
  async getUnitCategories(): Promise<UnitCategoryForDropdown[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Get Unit Categories for Dropdown
      parameters: {},
    };

    const response = await this.execute<UnitCategoryForDropdown[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get unit views for dropdown
   * @returns Array of unit views
   */
  async getUnitViews(): Promise<UnitViewForDropdown[]> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Get Unit Views for Dropdown
      parameters: {},
    };

    const response = await this.execute<UnitViewForDropdown[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get floors for dropdown
   * @param propertyId - Optional property ID to filter floors
   * @returns Array of floors
   */
  async getFloors(propertyId?: number): Promise<FloorForDropdown[]> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Get Floors for Dropdown
      parameters: {
        PropertyID: propertyId,
      },
    };

    const response = await this.execute<FloorForDropdown[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get bedroom configurations for dropdown
   * @returns Array of bedroom configurations
   */
  async getBedrooms(): Promise<BedRoomForDropdown[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Get Bedrooms for Dropdown
      parameters: {},
    };

    const response = await this.execute<BedRoomForDropdown[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get bathroom configurations for dropdown
   * @returns Array of bathroom configurations
   */
  async getBathrooms(): Promise<BathRoomForDropdown[]> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Get Bathrooms for Dropdown
      parameters: {},
    };

    const response = await this.execute<BathRoomForDropdown[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get unit styles for dropdown
   * @returns Array of unit styles
   */
  async getUnitStyles(): Promise<UnitStyleForDropdown[]> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Get Unit Styles for Dropdown
      parameters: {},
    };

    const response = await this.execute<UnitStyleForDropdown[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get communities for dropdown
   * @returns Array of communities
   */
  async getCommunities(): Promise<CommunityForDropdown[]> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Get Communities for Dropdown
      parameters: {},
    };

    const response = await this.execute<CommunityForDropdown[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get unit classes for dropdown
   * @returns Array of unit classes
   */
  async getUnitClasses(): Promise<UnitClassForDropdown[]> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Get Unit Classes for Dropdown
      parameters: {},
    };

    const response = await this.execute<UnitClassForDropdown[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get all dropdown data in a single call
   * @returns Object containing all dropdown data
   */
  async getAllDropdownData(): Promise<{
    properties: PropertyForDropdown[];
    unitTypes: UnitTypeForDropdown[];
    unitCategories: UnitCategoryForDropdown[];
    unitViews: UnitViewForDropdown[];
    floors: FloorForDropdown[];
    bedrooms: BedRoomForDropdown[];
    bathrooms: BathRoomForDropdown[];
    unitStyles: UnitStyleForDropdown[];
    communities: CommunityForDropdown[];
    unitClasses: UnitClassForDropdown[];
  }> {
    const request: BaseRequest = {
      mode: 11, // Mode 11: Get All Dropdown Data
      parameters: {},
    };

    const response = await this.execute(request, false);

    if (response.success) {
      return {
        properties: response.table1 || [],
        unitTypes: response.table2 || [],
        unitCategories: response.table3 || [],
        unitViews: response.table4 || [],
        floors: response.table5 || [],
        bedrooms: response.table6 || [],
        bathrooms: response.table7 || [],
        unitStyles: response.table8 || [],
        communities: response.table9 || [],
        unitClasses: response.table10 || [],
      };
    }

    return {
      properties: [],
      unitTypes: [],
      unitCategories: [],
      unitViews: [],
      floors: [],
      bedrooms: [],
      bathrooms: [],
      unitStyles: [],
      communities: [],
      unitClasses: [],
    };
  }
}

// Export a singleton instance
export const unitDropdownService = new UnitDropdownService();
