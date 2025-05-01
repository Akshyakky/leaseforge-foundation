// src/pages/UnitMaster/types.ts
import { Unit, UnitContact } from "../../services/unitService";

export interface FormMode {
  isCreate: boolean;
  isEdit: boolean;
  isView: boolean;
}

export interface UnitFormProps {
  unit?: Unit;
  mode: FormMode;
  onSave: (unit: Partial<Unit>, contacts: Partial<UnitContact>[]) => Promise<void>;
  onCancel: () => void;
}

export interface UnitListProps {
  units: Unit[];
  isLoading: boolean;
  onEdit: (unitId: number) => void;
  onView: (unitId: number) => void;
  onDelete: (unitId: number) => void;
  onStatusChange: (unitId: number, status: string) => Promise<void>;
}

export interface UnitDetailsProps {
  unit: Unit | null;
  contacts: UnitContact[];
  isLoading: boolean;
  onEdit: () => void;
  onBack: () => void;
}

export interface UnitContactsProps {
  unitId: number;
  contacts: UnitContact[];
  onContactsChange: (contacts: UnitContact[]) => void;
  readOnly?: boolean;
}

export interface UnitSearchFilterProps {
  onSearch: (filters: UnitSearchFilters) => void;
  dropdownData: {
    properties: { PropertyID: number; PropertyName: string }[];
    unitTypes: { UnitTypeID: number; UnitTypeName: string }[];
    unitCategories: { UnitCategoryID: number; UnitCategoryName: string }[];
    floors: { FloorID: number; FloorName: string }[];
    bedrooms: { BedRoomID: number; BedRoomCount: number }[];
    bathrooms: { BathRoomID: number; BathRoomCount: number }[];
    communities: { CommunityID: number; CommunityName: string }[];
    unitClasses: { UnitClassID: number; UnitClassName: string }[];
  };
}

export interface UnitSearchFilters {
  searchText?: string;
  propertyId?: number;
  unitTypeId?: number;
  unitCategoryId?: number;
  unitStatus?: string;
  floorId?: number;
  bedRoomId?: number;
  bathRoomId?: number;
  communityId?: number;
  unitClassId?: number;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
}

export interface ContactOption {
  ContactTypeID: number;
  ContactTypeDescription: string;
}

export interface ContactRow extends UnitContact {
  isNew?: boolean;
  isDeleted?: boolean;
}
