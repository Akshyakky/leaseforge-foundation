// src/services/countryService.ts
import { BaseService, BaseRequest } from "./BaseService";

export interface Country {
  CountryID: number;
  CountryCode: string;
  CountryName: string;
  IsDefault: boolean;
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
}

/**
 * Service for country-related operations
 */
class CountryService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/country");
  }

  /**
   * Get all countries
   * @returns Array of countries
   */
  async getAllCountries(): Promise<Country[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Countries
      parameters: {},
    };

    const response = await this.execute<Country[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a country by ID
   * @param countryId - The ID of the country to fetch
   * @returns The country object or null if not found
   */
  async getCountryById(countryId: number): Promise<Country | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Country by ID
      parameters: {
        CountryID: countryId,
      },
    };

    const response = await this.execute<Country[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Create a new country
   * @param country - The country data to create
   * @returns true if successful, false otherwise
   */
  async createCountry(country: Partial<Country>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Country
      parameters: {
        CountryCode: country.CountryCode,
        CountryName: country.CountryName,
        IsDefault: country.IsDefault || false,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Country created successfully");
    }

    return response.success;
  }

  /**
   * Update an existing country
   * @param country - The country data to update
   * @returns true if successful, false otherwise
   */
  async updateCountry(country: Partial<Country>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Country
      parameters: {
        CountryID: country.CountryID,
        CountryCode: country.CountryCode,
        CountryName: country.CountryName,
        IsDefault: country.IsDefault || false,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Country updated successfully");
    }

    return response.success;
  }

  /**
   * Delete a country
   * @param countryId - The ID of the country to delete
   * @returns true if successful, false otherwise
   */
  async deleteCountry(countryId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Country
      parameters: {
        CountryID: countryId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Country deleted successfully");
    }

    return response.success;
  }

  /**
   * Search for countries
   * @param searchText - Text to search for in country fields
   * @returns Array of matching countries
   */
  async searchCountries(searchText: string): Promise<Country[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Countries
      parameters: {
        SearchText: searchText,
      },
    };

    const response = await this.execute<Country[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get countries for dropdown
   * @returns Array of countries for dropdown
   */
  async getCountriesForDropdown(): Promise<Country[]> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Get Countries for Dropdown
      parameters: {},
    };

    const response = await this.execute<Country[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get the default country
   * @returns The default country or null if not found
   */
  async getDefaultCountry(): Promise<Country | null> {
    const countries = await this.getAllCountries();
    return countries.find((country) => country.IsDefault) || null;
  }
}

// Export a singleton instance
export const countryService = new CountryService();
