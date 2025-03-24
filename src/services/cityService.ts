// src/services/cityService.ts
import { BaseService, BaseRequest } from "./BaseService";

export interface City {
  CityID: number;
  CityName: string;
  CityCode?: string;
  CountryID: number;
  CountryName?: string;
  StateID?: number;
  StateName?: string;
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
}

/**
 * Service for city-related operations
 */
class CityService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/city");
  }

  /**
   * Get all cities
   * @returns Array of cities
   */
  async getAllCities(): Promise<City[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Cities
      parameters: {},
    };

    const response = await this.execute<City[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a city by ID
   * @param cityId - The ID of the city to fetch
   * @returns The city object or null if not found
   */
  async getCityById(cityId: number): Promise<City | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch City by ID
      parameters: {
        CityID: cityId,
      },
    };

    const response = await this.execute<City[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Create a new city
   * @param city - The city data to create
   * @returns true if successful, false otherwise
   */
  async createCity(city: Partial<City>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New City
      parameters: {
        CityName: city.CityName,
        CityCode: city.CityCode,
        CountryID: city.CountryID,
        StateID: city.StateID,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("City created successfully");
    }

    return response.success;
  }

  /**
   * Update an existing city
   * @param city - The city data to update
   * @returns true if successful, false otherwise
   */
  async updateCity(city: Partial<City>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing City
      parameters: {
        CityID: city.CityID,
        CityName: city.CityName,
        CityCode: city.CityCode,
        CountryID: city.CountryID,
        StateID: city.StateID,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("City updated successfully");
    }

    return response.success;
  }

  /**
   * Delete a city
   * @param cityId - The ID of the city to delete
   * @returns true if successful, false otherwise
   */
  async deleteCity(cityId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete City
      parameters: {
        CityID: cityId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("City deleted successfully");
    }

    return response.success;
  }

  /**
   * Search for cities
   * @param searchText - Text to search for in city fields
   * @returns Array of matching cities
   */
  async searchCities(searchText: string): Promise<City[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Cities
      parameters: {
        SearchText: searchText,
      },
    };

    const response = await this.execute<City[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get cities by country
   * @param countryId - The country ID to filter by
   * @returns Array of cities in the specified country
   */
  async getCitiesByCountry(countryId: number): Promise<City[]> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Get Cities by Country
      parameters: {
        CountryID: countryId,
      },
    };

    const response = await this.execute<City[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get cities for dropdown
   * @param countryId - Optional country ID to filter by
   * @returns Array of cities for dropdown
   */
  async getCitiesForDropdown(countryId?: number): Promise<City[]> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Get Cities for Dropdown
      parameters: {
        CountryID: countryId,
      },
    };

    const response = await this.execute<City[]>(request, false);
    return response.success ? response.data || [] : [];
  }
}

// Export a singleton instance
export const cityService = new CityService();
