// src/types/fiscalYearTypes.ts
export interface BaseFiscalYear {
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

export interface FiscalYear extends BaseFiscalYear {
  FiscalYearID: number;
  FYCode: string;
  FYDescription: string;
  StartDate: string | Date;
  EndDate: string | Date;
  IsActive: boolean;
  IsClosed: boolean;
  CompanyID: number;

  // Joined fields from related tables
  CompanyName?: string;
}

export interface FiscalYearStatistics {
  totalFiscalYears: number;
  activeFiscalYears: number;
  closedFiscalYears: number;
  companyDistribution: {
    CompanyID: number;
    CompanyName: string;
    FiscalYearCount: number;
    ActiveCount: number;
    ClosedCount: number;
  }[];
}

export interface CurrentFiscalYear extends FiscalYear {
  DaysRemaining?: number;
  IsCurrentPeriod?: boolean;
}

// Search parameters
export interface FiscalYearSearchParams {
  searchText?: string;
  filterCompanyID?: number;
  filterIsActive?: boolean;
  filterIsClosed?: boolean;
}

// Request parameters for fiscal year operations
export interface FiscalYearRequest {
  fiscalYear: Partial<FiscalYear>;
}

export interface FiscalYearUpdateRequest {
  fiscalYear: Partial<FiscalYear> & { FiscalYearID: number };
}

export interface FiscalYearCreateRequest {
  fiscalYear: Omit<Partial<FiscalYear>, "FiscalYearID"> & {
    FYCode: string;
    FYDescription: string;
    StartDate: string | Date;
    EndDate: string | Date;
    CompanyID: number;
  };
}

export interface FiscalYearDropdownParams {
  filterCompanyID?: number;
  filterIsActive?: boolean;
  filterIsClosed?: boolean;
}

export interface FiscalYearStatusCheck {
  FiscalYearID: number;
  IsClosed: boolean;
  StatusMessage: string;
}

// API response
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  NewFiscalYearID?: number;
  IsClosedStatus?: boolean;
  [key: string]: any;
  data?: T;
}
