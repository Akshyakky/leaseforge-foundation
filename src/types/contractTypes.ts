// src/types/contractTypes.ts
export interface BaseContract {
    CreatedBy?: string;
    CreatedOn?: string;
    UpdatedBy?: string;
    UpdatedOn?: string;
    DeletedBy?: string;
    DeletedOn?: string;
    RecordStatus?: boolean;
  }
  
  export interface Contract extends BaseContract {
    ContractID: number;
    ContractNo: string;
    ContractStatus: string;
    CustomerID: number;
    JointCustomerID?: number;
    TransactionDate: string | Date;
    TotalAmount: number;
    AdditionalCharges: number;
    GrandTotal: number;
    Remarks?: string;
    
    // Joined fields
    CustomerName?: string;
    JointCustomerName?: string;
    UnitCount?: number;
    ChargeCount?: number;
    AttachmentCount?: number;
  }
  
  export interface ContractUnit extends BaseContract {
    ContractUnitID: number;
    ContractID: number;
    UnitID: number;
    FromDate: string | Date;
    ToDate: string | Date;
    FitoutFromDate?: string | Date;
    FitoutToDate?: string | Date;
    CommencementDate?: string | Date;
    ContractDays?: number;
    ContractMonths?: number;
    ContractYears?: number;
    RentPerMonth: number;
    RentPerYear: number;
    NoOfInstallments?: number;
    RentFreePeriodFrom?: string | Date;
    RentFreePeriodTo?: string | Date;
    RentFreeAmount?: number;
    TaxPercentage?: number;
    TaxAmount?: number;
    TotalAmount: number;
    
    // Joined fields
    UnitNo?: string;
    PropertyID?: number;
    PropertyName?: string;
    UnitTypeName?: string;
    UnitCategoryName?: string;
    FloorName?: string;
    BedRooms?: number;
    BathRooms?: number;
  }
  
  export interface ContractAdditionalCharge extends BaseContract {
    ContractAdditionalChargeID: number;
    ContractID: number;
    AdditionalChargesID: number;
    Amount: number;
    TaxPercentage?: number;
    TaxAmount?: number;
    TotalAmount: number;
    
    // Joined fields
    ChargesName?: string;
    ChargesCode?: string;
    ChargesCategoryName?: string;
  }
  
  export interface ContractAttachment extends BaseContract {
    ContractAttachmentID: number;
    ContractID: number;
    DocTypeID: number;
    DocumentName: string;
    FilePath?: string;
    FileContent?: string | ArrayBuffer | null; // Base64 encoded string
    FileContentType?: string;
    FileSize?: number;
    DocIssueDate?: string | Date;
    DocExpiryDate?: string | Date;
    Remarks?: string;
    
    // Joined fields
    DocTypeName?: string;
    
    // For UI only - not sent to backend
    file?: File;
    fileUrl?: string; // For displaying preview
  }
  
  export interface ContractStatistics {
    statusCounts: { ContractStatus: string; ContractCount: number; TotalAmount: number }[];
    propertyUnitCounts: { PropertyID: number; PropertyName: string; UnitCount: number; TotalAmount: number }[];
    customerCounts: { CustomerID: number; CustomerFullName: string; ContractCount: number; TotalAmount: number }[];
  }
  
  // Search parameters
  export interface ContractSearchParams {
    searchText?: string;
    customerID?: number;
    contractStatus?: string;
    fromDate?: string | Date;
    toDate?: string | Date;
    unitID?: number;
    propertyID?: number;
  }
  
  // Contract request for create/update
  export interface ContractRequest {
    contract: Partial<Contract>;
    units?: Partial<ContractUnit>[];
    additionalCharges?: Partial<ContractAdditionalCharge>[];
    attachments?: Partial<ContractAttachment>[];
  }
  
  // API response
  export interface ApiResponse<T = any> {
    Status: number;
    Message: string;
    NewContractID?: number;
    [key: string]: any;
    data?: T;
  }