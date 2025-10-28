// src/types/accountingPeriodTypes.ts

export interface BaseAccountingPeriod {
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

export interface AccountingPeriod extends BaseAccountingPeriod {
  PeriodID: number;
  PeriodCode: string;
  PeriodName: string;
  FiscalYearID: number;
  PeriodNumber: number;
  StartDate: string | Date;
  EndDate: string | Date;
  IsOpen: boolean;
  IsClosed: boolean;
  ClosedByUserID?: number;
  ClosedByUserName?: string;
  ClosedOn?: string | Date;
  ClosingComments?: string;
  CompanyID: number;

  // Joined fields from related tables
  FYCode?: string;
  FYDescription?: string;
  CompanyName?: string;
}

export interface PeriodStatistics {
  totalPeriods: number;
  openPeriods: number;
  closedPeriods: number;
  currentPeriod?: AccountingPeriod;
}

export interface CurrentPeriod extends AccountingPeriod {
  DaysRemaining?: number;
  IsCurrentPeriod?: boolean;
}

export interface PeriodClosureValidation {
  canClose: boolean;
  validationMessages: string[];
  previousPeriodsOpen: boolean;
  hasTransactions: boolean;
  transactionCount?: number;
}

export interface PeriodSearchParams {
  searchText?: string;
  filterFiscalYearID?: number;
  filterCompanyID?: number;
  filterIsOpen?: boolean;
  filterIsClosed?: boolean;
  filterPeriodNumber?: number;
}

export interface AccountingPeriodRequest {
  period: Partial<AccountingPeriod>;
}

export interface AccountingPeriodUpdateRequest {
  period: Partial<AccountingPeriod> & { PeriodID: number };
}

export interface AccountingPeriodCreateRequest {
  period: Omit<Partial<AccountingPeriod>, "PeriodID"> & {
    PeriodCode: string;
    PeriodName: string;
    FiscalYearID: number;
    PeriodNumber: number;
    StartDate: string | Date;
    EndDate: string | Date;
    CompanyID: number;
  };
}

export interface PeriodBulkCreateRequest {
  FiscalYearID: number;
  CompanyID: number;
}

export interface PeriodCloseRequest {
  PeriodID: number;
  ClosingComments?: string;
}

export interface PeriodReopenRequest {
  PeriodID: number;
}

export interface PeriodDropdownParams {
  filterFiscalYearID?: number;
  filterCompanyID?: number;
  filterIsOpen?: boolean;
  openPeriodsOnly?: boolean;
}

export interface PeriodValidationResult {
  isValid: boolean;
  message: string;
  periodID?: number;
  isOpen?: boolean;
}

export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  NewPeriodID?: number;
  data?: T;
  [key: string]: any;
}
