// src/types/bankTypes.ts
export interface BaseBank {
  CreatedBy?: string;
  CreatedOn?: string;
  CreatedID?: number;
  UpdatedBy?: string;
  UpdatedOn?: string;
  UpdatedID?: number;
  DeletedBy?: string;
  DeletedOn?: string;
  DeletedID?: number;
  RecordStatus?: number;
}

export interface BankCategory extends BaseBank {
  CategoryID: number;
  CategoryName: string;
  Description?: string;
  IsActive: boolean;
}

export interface Bank extends BaseBank {
  BankID: number;
  BankCode: string;
  BankName: string;
  SwiftCode?: string;
  CountryID?: number;
  IsActive: boolean;

  // Joined fields
  CountryName?: string;
}

export interface BankStatistics {
  totalBanks: number;
  activeBanks: number;
  inactiveBanks: number;
  countryDistribution: {
    CountryID: number;
    CountryName: string;
    BankCount: number;
  }[];
}

export interface BankCategoryStatistics {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
}

// Search parameters
export interface BankSearchParams {
  searchText?: string;
  filterCountryID?: number;
  filterIsActive?: boolean;
}

export interface BankCategorySearchParams {
  searchText?: string;
}

// Request parameters for bank category operations
export interface BankCategoryRequest {
  category: {
    CategoryName: string;
    Description?: string;
    IsActive: boolean;
  };
}

export interface BankCategoryUpdateRequest {
  category: {
    CategoryID: number;
    CategoryName?: string;
    Description?: string;
    IsActive?: boolean;
  };
}

// Request parameters for bank operations
export interface BankRequest {
  bank: {
    BankCode: string;
    BankName: string;
    SwiftCode?: string;
    CountryID?: number;
    IsActive: boolean;
  };
}

export interface BankUpdateRequest {
  bank: {
    BankID: number;
    BankCode?: string;
    BankName?: string;
    SwiftCode?: string;
    CountryID?: number;
    IsActive?: boolean;
  };
}

// API response interfaces
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  CategoryID?: number;
  BankID?: number;
  [key: string]: any;
  data?: T;
}

// Bank status constants
export const BANK_STATUS = {
  ACTIVE: true,
  INACTIVE: false,
} as const;

// Utility type guards
export function isActiveBank(bank: Bank): boolean {
  return bank.IsActive;
}

export function isActiveBankCategory(category: BankCategory): boolean {
  return category.IsActive;
}

// Validation rules for banks
export interface BankValidation {
  bankCodeRequired: boolean;
  bankNameRequired: boolean;
  swiftCodeOptional: boolean;
  countryOptional: boolean;
}

// Enhanced types for specific views
export interface BankListItem extends Bank {
  // Additional computed properties for list display
  canEdit?: boolean;
  canDelete?: boolean;
  isInUse?: boolean;
  supplierCount?: number;
  transactionCount?: number;
}

export interface BankCategoryListItem extends BankCategory {
  // Additional computed properties for list display
  canEdit?: boolean;
  canDelete?: boolean;
  isInUse?: boolean;
  bankCount?: number;
}

export interface BankSummary {
  totalBanks: number;
  activeBanks: number;
  inactiveBanks: number;
  banksWithSwiftCode: number;
  banksWithoutSwiftCode: number;
  categorizedBanks: number;
  uncategorizedBanks: number;
}

export interface BankCategorySummary {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  categoriesInUse: number;
  categoriesNotInUse: number;
}
