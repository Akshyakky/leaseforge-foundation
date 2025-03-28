// src/services/unitRelatedService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";

// Base interface for all unit-related entities
export interface UnitRelatedEntity {
  [key: string]: any;
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
}

// UnitType entity
export interface UnitType extends UnitRelatedEntity {
  UnitTypeID: number;
  UnitTypeName: string;
  UnitTypeCode: string;
  Description?: string;
}

// UnitCategory entity
export interface UnitCategory extends UnitRelatedEntity {
  UnitCategoryID: number;
  UnitCategoryName: string;
  UnitCategoryCode: string;
  Description?: string;
}

// UnitView entity
export interface UnitView extends UnitRelatedEntity {
  UnitViewID: number;
  UnitViewName: string;
  UnitViewCode: string;
  Description?: string;
}

// Floor entity
export interface Floor extends UnitRelatedEntity {
  FloorID: number;
  FloorName: string;
  FloorNumber: number;
  PropertyID: number;
  PropertyName?: string;
}

// BedRoom entity
export interface BedRoom extends UnitRelatedEntity {
  BedRoomID: number;
  BedRoomCount: number;
  Description?: string;
}

// BathRoom entity
export interface BathRoom extends UnitRelatedEntity {
  BathRoomID: number;
  BathRoomCount: number;
  Description?: string;
}

// UnitStyle entity
export interface UnitStyle extends UnitRelatedEntity {
  UnitStyleID: number;
  UnitStyleName: string;
  UnitStyleCode: string;
  Description?: string;
}

// UnitClass entity
export interface UnitClass extends UnitRelatedEntity {
  UnitClassID: number;
  UnitClassName: string;
  UnitClassCode: string;
  Description?: string;
}

// Community entity
export interface Community extends UnitRelatedEntity {
  CommunityID: number;
  CommunityName: string;
  CommunityCode: string;
  Description?: string;
}

// Country entity
export interface Country extends UnitRelatedEntity {
  CountryID: number;
  CountryName: string;
  CountryCode: string;
}

// City entity
export interface City extends UnitRelatedEntity {
  CityID: number;
  CityName: string;
  CityCode: string;
  CountryID: number;
  CountryName?: string;
}

// Property entity
export interface Property extends UnitRelatedEntity {
  PropertyID: number;
  PropertyName: string;
}

// Type guard to check if an entity has a specific property
function hasProperty<T, K extends string>(obj: T, prop: K): obj is T & Record<K, any> {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

// Type for dropdown data response
export interface AllDropdownData {
  unitTypes: UnitType[];
  unitCategories: UnitCategory[];
  unitViews: UnitView[];
  floors: Floor[];
  bedRooms: BedRoom[];
  bathRooms: BathRoom[];
  unitStyles: UnitStyle[];
  unitClasses: UnitClass[];
  communities: Community[];
  countries: Country[];
  cities: City[];
  properties: Property[];
}

/**
 * Service for unit-related master data operations
 */
class UnitRelatedService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/unitrelated");
  }

  /**
   * Create a new entity
   * @param entityType - The type of entity to create
   * @param entity - The entity data to create
   * @returns The created entity ID if successful, null otherwise
   */
  async createEntity<T extends UnitRelatedEntity>(entityType: string, entity: Partial<T>): Promise<number | null> {
    const parameters: Record<string, any> = {
      EntityType: entityType,
    };

    // Map entity properties to parameters based on entity type
    switch (entityType) {
      case "UnitType":
      case "UnitCategory":
      case "UnitView":
      case "UnitStyle":
      case "UnitClass":
      case "Community":
      case "Country":
        if (hasProperty(entity, "Name") || hasProperty(entity, `${entityType}Name`)) {
          parameters.Name = entity.Name || entity[`${entityType}Name`];
        }
        if (hasProperty(entity, "Code") || hasProperty(entity, `${entityType}Code`)) {
          parameters.Code = entity.Code || entity[`${entityType}Code`];
        }
        if (hasProperty(entity, "Description")) {
          parameters.Description = entity.Description;
        }
        break;
      case "Floor":
        if (hasProperty(entity, "FloorName")) {
          parameters.Name = entity.FloorName;
        }
        if (hasProperty(entity, "FloorNumber")) {
          parameters.Count = entity.FloorNumber;
        }
        if (hasProperty(entity, "PropertyID")) {
          parameters.PropertyID = entity.PropertyID;
        }
        break;
      case "BedRoom":
      case "BathRoom":
        if (hasProperty(entity, `${entityType}Count`)) {
          parameters.Count = entity[`${entityType}Count`];
        }
        if (hasProperty(entity, "Description")) {
          parameters.Description = entity.Description;
        }
        break;
      case "City":
        if (hasProperty(entity, "CityName")) {
          parameters.Name = entity.CityName;
        }
        if (hasProperty(entity, "CityCode")) {
          parameters.Code = entity.CityCode;
        }
        if (hasProperty(entity, "CountryID")) {
          parameters.CountryID = entity.CountryID;
        }
        if (hasProperty(entity, "Description")) {
          parameters.Description = entity.Description;
        }
        break;
    }

    const request: BaseRequest = {
      mode: 1, // Mode 1: Create
      parameters,
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(`${entityType} created successfully`);
      return response.NewID || null;
    }

    return null;
  }

  /**
   * Update an existing entity
   * @param entityType - The type of entity to update
   * @param entity - The entity data to update
   * @returns true if successful, false otherwise
   */
  async updateEntity<T extends UnitRelatedEntity>(entityType: string, entity: Partial<T> & { [key: string]: any }): Promise<boolean> {
    const parameters: Record<string, any> = {
      EntityType: entityType,
    };

    // Set ID based on entity type
    const idProperty = `${entityType}ID`;
    if (hasProperty(entity, idProperty)) {
      parameters.ID = entity[idProperty];
    } else if (hasProperty(entity, "ID")) {
      parameters.ID = (entity as any).ID;
    }

    // Map entity properties to parameters based on entity type
    switch (entityType) {
      case "UnitType":
      case "UnitCategory":
      case "UnitView":
      case "UnitStyle":
      case "UnitClass":
      case "Community":
      case "Country":
        if (hasProperty(entity, "Name") || hasProperty(entity, `${entityType}Name`)) {
          parameters.Name = entity.Name || entity[`${entityType}Name`];
        }
        if (hasProperty(entity, "Code") || hasProperty(entity, `${entityType}Code`)) {
          parameters.Code = entity.Code || entity[`${entityType}Code`];
        }
        if (hasProperty(entity, "Description")) {
          parameters.Description = entity.Description;
        }
        break;
      case "Floor":
        if (hasProperty(entity, "FloorName")) {
          parameters.Name = entity.FloorName;
        }
        if (hasProperty(entity, "FloorNumber")) {
          parameters.Count = entity.FloorNumber;
        }
        if (hasProperty(entity, "PropertyID")) {
          parameters.PropertyID = entity.PropertyID;
        }
        break;
      case "BedRoom":
      case "BathRoom":
        if (hasProperty(entity, `${entityType}Count`)) {
          parameters.Count = entity[`${entityType}Count`];
        }
        if (hasProperty(entity, "Description")) {
          parameters.Description = entity.Description;
        }
        break;
      case "City":
        if (hasProperty(entity, "CityName")) {
          parameters.Name = entity.CityName;
        }
        if (hasProperty(entity, "CityCode")) {
          parameters.Code = entity.CityCode;
        }
        if (hasProperty(entity, "CountryID")) {
          parameters.CountryID = entity.CountryID;
        }
        if (hasProperty(entity, "Description")) {
          parameters.Description = entity.Description;
        }
        break;
    }

    const request: BaseRequest = {
      mode: 2, // Mode 2: Update
      parameters,
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(`${entityType} updated successfully`);
      return true;
    }

    return false;
  }

  /**
   * Get all entities of a specific type
   * @param entityType - The type of entity to fetch
   * @param filterParams - Optional filter parameters (e.g., PropertyID for Floor, CountryID for City)
   * @returns Array of entities
   */
  async getAllEntities<T extends UnitRelatedEntity>(entityType: string, filterParams?: Record<string, any>): Promise<T[]> {
    const parameters: Record<string, any> = {
      EntityType: entityType,
      ...filterParams,
    };

    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All
      parameters,
    };

    const response = await this.execute<T[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get an entity by ID
   * @param entityType - The type of entity to fetch
   * @param id - The ID of the entity to fetch
   * @returns The entity object or null if not found
   */
  async getEntityById<T extends UnitRelatedEntity>(entityType: string, id: number): Promise<T | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch By ID
      parameters: {
        EntityType: entityType,
        ID: id,
      },
    };

    const response = await this.execute<T[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Delete an entity
   * @param entityType - The type of entity to delete
   * @param id - The ID of the entity to delete
   * @returns true if successful, false otherwise
   */
  async deleteEntity(entityType: string, id: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Delete
      parameters: {
        EntityType: entityType,
        ID: id,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(`${entityType} deleted successfully`);
      return true;
    }

    return false;
  }

  /**
   * Get entities for dropdown
   * @param entityType - The type of entity to fetch
   * @param filterParams - Optional filter parameters (e.g., PropertyID for Floor, CountryID for City)
   * @returns Array of entities for dropdown
   */
  async getEntitiesForDropdown<T extends UnitRelatedEntity>(entityType: string, filterParams?: Record<string, any>): Promise<T[]> {
    const parameters: Record<string, any> = {
      EntityType: entityType,
      ...filterParams,
    };

    const request: BaseRequest = {
      mode: 6, // Mode 6: Fetch for Dropdown
      parameters,
    };

    const response = await this.execute<T[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get all dropdown data in a single call
   * @returns Object containing all dropdown data
   */
  async getAllDropdownData(): Promise<AllDropdownData> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Get All Dropdown Data
      parameters: {},
    };

    const response = await this.execute(request, false);

    if (response.success) {
      return {
        unitTypes: response.table1 || [],
        unitCategories: response.table2 || [],
        unitViews: response.table3 || [],
        floors: response.table4 || [],
        bedRooms: response.table5 || [],
        bathRooms: response.table6 || [],
        unitStyles: response.table7 || [],
        unitClasses: response.table8 || [],
        communities: response.table9 || [],
        countries: response.table10 || [],
        cities: response.table11 || [],
        properties: response.table12 || [],
      };
    }

    return {
      unitTypes: [],
      unitCategories: [],
      unitViews: [],
      floors: [],
      bedRooms: [],
      bathRooms: [],
      unitStyles: [],
      unitClasses: [],
      communities: [],
      countries: [],
      cities: [],
      properties: [],
    };
  }

  // Convenience methods for specific entity types

  // UnitType methods
  async createUnitType(unitType: Partial<UnitType>): Promise<number | null> {
    return this.createEntity<UnitType>("UnitType", unitType);
  }

  async updateUnitType(unitType: Partial<UnitType> & { UnitTypeID: number }): Promise<boolean> {
    return this.updateEntity<UnitType>("UnitType", unitType);
  }

  async getAllUnitTypes(): Promise<UnitType[]> {
    return this.getAllEntities<UnitType>("UnitType");
  }

  async getUnitTypeById(id: number): Promise<UnitType | null> {
    return this.getEntityById<UnitType>("UnitType", id);
  }

  async deleteUnitType(id: number): Promise<boolean> {
    return this.deleteEntity("UnitType", id);
  }

  async getUnitTypesForDropdown(): Promise<UnitType[]> {
    return this.getEntitiesForDropdown<UnitType>("UnitType");
  }

  // UnitCategory methods
  async createUnitCategory(unitCategory: Partial<UnitCategory>): Promise<number | null> {
    return this.createEntity<UnitCategory>("UnitCategory", unitCategory);
  }

  async updateUnitCategory(unitCategory: Partial<UnitCategory> & { UnitCategoryID: number }): Promise<boolean> {
    return this.updateEntity<UnitCategory>("UnitCategory", unitCategory);
  }

  async getAllUnitCategories(): Promise<UnitCategory[]> {
    return this.getAllEntities<UnitCategory>("UnitCategory");
  }

  async getUnitCategoryById(id: number): Promise<UnitCategory | null> {
    return this.getEntityById<UnitCategory>("UnitCategory", id);
  }

  async deleteUnitCategory(id: number): Promise<boolean> {
    return this.deleteEntity("UnitCategory", id);
  }

  async getUnitCategoriesForDropdown(): Promise<UnitCategory[]> {
    return this.getEntitiesForDropdown<UnitCategory>("UnitCategory");
  }

  // UnitView methods
  async createUnitView(unitView: Partial<UnitView>): Promise<number | null> {
    return this.createEntity<UnitView>("UnitView", unitView);
  }

  async updateUnitView(unitView: Partial<UnitView> & { UnitViewID: number }): Promise<boolean> {
    return this.updateEntity<UnitView>("UnitView", unitView);
  }

  async getAllUnitViews(): Promise<UnitView[]> {
    return this.getAllEntities<UnitView>("UnitView");
  }

  async getUnitViewById(id: number): Promise<UnitView | null> {
    return this.getEntityById<UnitView>("UnitView", id);
  }

  async deleteUnitView(id: number): Promise<boolean> {
    return this.deleteEntity("UnitView", id);
  }

  async getUnitViewsForDropdown(): Promise<UnitView[]> {
    return this.getEntitiesForDropdown<UnitView>("UnitView");
  }

  // Floor methods
  async createFloor(floor: Partial<Floor>): Promise<number | null> {
    return this.createEntity<Floor>("Floor", floor);
  }

  async updateFloor(floor: Partial<Floor> & { FloorID: number }): Promise<boolean> {
    return this.updateEntity<Floor>("Floor", floor);
  }

  async getAllFloors(propertyId?: number): Promise<Floor[]> {
    return this.getAllEntities<Floor>("Floor", propertyId ? { PropertyID: propertyId } : undefined);
  }

  async getFloorById(id: number): Promise<Floor | null> {
    return this.getEntityById<Floor>("Floor", id);
  }

  async deleteFloor(id: number): Promise<boolean> {
    return this.deleteEntity("Floor", id);
  }

  async getFloorsForDropdown(propertyId?: number): Promise<Floor[]> {
    return this.getEntitiesForDropdown<Floor>("Floor", propertyId ? { PropertyID: propertyId } : undefined);
  }

  // BedRoom methods
  async createBedRoom(bedRoom: Partial<BedRoom>): Promise<number | null> {
    return this.createEntity<BedRoom>("BedRoom", bedRoom);
  }

  async updateBedRoom(bedRoom: Partial<BedRoom> & { BedRoomID: number }): Promise<boolean> {
    return this.updateEntity<BedRoom>("BedRoom", bedRoom);
  }

  async getAllBedRooms(): Promise<BedRoom[]> {
    return this.getAllEntities<BedRoom>("BedRoom");
  }

  async getBedRoomById(id: number): Promise<BedRoom | null> {
    return this.getEntityById<BedRoom>("BedRoom", id);
  }

  async deleteBedRoom(id: number): Promise<boolean> {
    return this.deleteEntity("BedRoom", id);
  }

  async getBedRoomsForDropdown(): Promise<BedRoom[]> {
    return this.getEntitiesForDropdown<BedRoom>("BedRoom");
  }

  // BathRoom methods
  async createBathRoom(bathRoom: Partial<BathRoom>): Promise<number | null> {
    return this.createEntity<BathRoom>("BathRoom", bathRoom);
  }

  async updateBathRoom(bathRoom: Partial<BathRoom> & { BathRoomID: number }): Promise<boolean> {
    return this.updateEntity<BathRoom>("BathRoom", bathRoom);
  }

  async getAllBathRooms(): Promise<BathRoom[]> {
    return this.getAllEntities<BathRoom>("BathRoom");
  }

  async getBathRoomById(id: number): Promise<BathRoom | null> {
    return this.getEntityById<BathRoom>("BathRoom", id);
  }

  async deleteBathRoom(id: number): Promise<boolean> {
    return this.deleteEntity("BathRoom", id);
  }

  async getBathRoomsForDropdown(): Promise<BathRoom[]> {
    return this.getEntitiesForDropdown<BathRoom>("BathRoom");
  }

  // UnitStyle methods
  async createUnitStyle(unitStyle: Partial<UnitStyle>): Promise<number | null> {
    return this.createEntity<UnitStyle>("UnitStyle", unitStyle);
  }

  async updateUnitStyle(unitStyle: Partial<UnitStyle> & { UnitStyleID: number }): Promise<boolean> {
    return this.updateEntity<UnitStyle>("UnitStyle", unitStyle);
  }

  async getAllUnitStyles(): Promise<UnitStyle[]> {
    return this.getAllEntities<UnitStyle>("UnitStyle");
  }

  async getUnitStyleById(id: number): Promise<UnitStyle | null> {
    return this.getEntityById<UnitStyle>("UnitStyle", id);
  }

  async deleteUnitStyle(id: number): Promise<boolean> {
    return this.deleteEntity("UnitStyle", id);
  }

  async getUnitStylesForDropdown(): Promise<UnitStyle[]> {
    return this.getEntitiesForDropdown<UnitStyle>("UnitStyle");
  }

  // UnitClass methods
  async createUnitClass(unitClass: Partial<UnitClass>): Promise<number | null> {
    return this.createEntity<UnitClass>("UnitClass", unitClass);
  }

  async updateUnitClass(unitClass: Partial<UnitClass> & { UnitClassID: number }): Promise<boolean> {
    return this.updateEntity<UnitClass>("UnitClass", unitClass);
  }

  async getAllUnitClasses(): Promise<UnitClass[]> {
    return this.getAllEntities<UnitClass>("UnitClass");
  }

  async getUnitClassById(id: number): Promise<UnitClass | null> {
    return this.getEntityById<UnitClass>("UnitClass", id);
  }

  async deleteUnitClass(id: number): Promise<boolean> {
    return this.deleteEntity("UnitClass", id);
  }

  async getUnitClassesForDropdown(): Promise<UnitClass[]> {
    return this.getEntitiesForDropdown<UnitClass>("UnitClass");
  }

  // Community methods
  async createCommunity(community: Partial<Community>): Promise<number | null> {
    return this.createEntity<Community>("Community", community);
  }

  async updateCommunity(community: Partial<Community> & { CommunityID: number }): Promise<boolean> {
    return this.updateEntity<Community>("Community", community);
  }

  async getAllCommunities(): Promise<Community[]> {
    return this.getAllEntities<Community>("Community");
  }

  async getCommunityById(id: number): Promise<Community | null> {
    return this.getEntityById<Community>("Community", id);
  }

  async deleteCommunity(id: number): Promise<boolean> {
    return this.deleteEntity("Community", id);
  }

  async getCommunitiesForDropdown(): Promise<Community[]> {
    return this.getEntitiesForDropdown<Community>("Community");
  }

  // Country methods
  async createCountry(country: Partial<Country>): Promise<number | null> {
    return this.createEntity<Country>("Country", country);
  }

  async updateCountry(country: Partial<Country> & { CountryID: number }): Promise<boolean> {
    return this.updateEntity<Country>("Country", country);
  }

  async getAllCountries(): Promise<Country[]> {
    return this.getAllEntities<Country>("Country");
  }

  async getCountryById(id: number): Promise<Country | null> {
    return this.getEntityById<Country>("Country", id);
  }

  async deleteCountry(id: number): Promise<boolean> {
    return this.deleteEntity("Country", id);
  }

  async getCountriesForDropdown(): Promise<Country[]> {
    return this.getEntitiesForDropdown<Country>("Country");
  }

  // City methods
  async createCity(city: Partial<City>): Promise<number | null> {
    return this.createEntity<City>("City", city);
  }

  async updateCity(city: Partial<City> & { CityID: number }): Promise<boolean> {
    return this.updateEntity<City>("City", city);
  }

  async getAllCities(countryId?: number): Promise<City[]> {
    return this.getAllEntities<City>("City", countryId ? { CountryID: countryId } : undefined);
  }

  async getCityById(id: number): Promise<City | null> {
    return this.getEntityById<City>("City", id);
  }

  async deleteCity(id: number): Promise<boolean> {
    return this.deleteEntity("City", id);
  }

  async getCitiesForDropdown(countryId?: number): Promise<City[]> {
    return this.getEntitiesForDropdown<City>("City", countryId ? { CountryID: countryId } : undefined);
  }
}

// Export a singleton instance
export const unitRelatedService = new UnitRelatedService();
