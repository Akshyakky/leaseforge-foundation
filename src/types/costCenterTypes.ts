// src/types/costCenterTypes.ts
export interface BaseCostCenter {
  Description: string;
  CreatedBy?: string;
  CreatedOn?: string;
  CreatedID?: number;
  UpdatedBy?: string;
  UpdatedOn?: string;
  RecordStatus?: number;
}

export interface CostCenter1 extends BaseCostCenter {
  CostCenter1ID: number;
}

export interface CostCenter2 extends BaseCostCenter {
  CostCenter2ID: number;
  CostCenter1ID: number;
  ParentDescription?: string;
}

export interface CostCenter3 extends BaseCostCenter {
  CostCenter3ID: number;
  CostCenter2ID: number;
  CostCenter1ID: number;
  Level1Description?: string;
  Level2Description?: string;
}

export interface CostCenter4 extends BaseCostCenter {
  CostCenter4ID: number;
  CostCenter3ID: number;
  CostCenter2ID: number;
  CostCenter1ID: number;
  Level1Description?: string;
  Level2Description?: string;
  Level3Description?: string;
}

export interface CostCenterHierarchy {
  Level: number;
  ID: number;
  ParentID: number | null;
  Description: string;
  FullPath: string;
}

// Request parameters for cost center operations
export interface CostCenterRequest {
  Level: number;
  Description: string;
  CostCenter1ID?: number;
  CostCenter2ID?: number;
  CostCenter3ID?: number;
  CostCenter4ID?: number;
  CurrentUserID?: number;
  CurrentUserName?: string;
}

// Response from the API
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  [key: string]: any;
  data?: T;
}
