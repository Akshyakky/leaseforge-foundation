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

  // Audit fields
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
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
   * Get a property by ID
   * @param propertyId - The ID of the property to fetch
   * @returns The property object or null if not found
   */
  async getPropertyById(propertyId: number): Promise<Property | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Property by ID
      parameters: {
        PropertyID: propertyId,
      },
    };

    const response = await this.execute<Property[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Create a new property
   * @param property - The property data to create
   * @returns The ID of the newly created property or null if unsuccessful
   */
  async createProperty(property: Partial<Property>): Promise<number | null> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Property
      parameters: {
        ...property,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Property created successfully");
      return response.NewPropertyID || null;
    }

    return null;
  }

  /**
   * Update an existing property
   * @param property - The property data to update
   * @returns true if successful, false otherwise
   */
  async updateProperty(property: Partial<Property>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Property
      parameters: {
        ...property,
      },
    };

    const response = await this.execute(request);

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
   * Search for properties
   * @param searchText - Text to search for in property fields
   * @param filters - Optional filters for the search
   * @returns Array of matching properties
   */
  async searchProperties(
    searchText?: string,
    filters?: {
      communityId?: number;
      countryId?: number;
      cityId?: number;
    }
  ): Promise<Property[]> {
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
}

// Export a singleton instance
export const propertyService = new PropertyService();
