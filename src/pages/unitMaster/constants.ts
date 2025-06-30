// src/pages/UnitMaster/constants.ts
import { Unit } from "../../services/unitService";

export const UNIT_TABS = {
  GENERAL: "general",
  CONTACTS: "contacts",
  PRICING: "pricing",
};

export const UNIT_STATUS_OPTIONS = [
  { value: "Available", label: "Available" },
  { value: "Leased", label: "Leased" },
  { value: "Sold", label: "Sold" },
  { value: "Reserved", label: "Reserved" },
  { value: "UnderMaintenance", label: "Under Maintenance" },
  { value: "NotAvailable", label: "Not Available" },
];

export const DEFAULT_FORM_VALUES: Partial<Unit> = {
  UnitNo: "",
  PropertyID: 0,
  UnitTypeID: 0,
  UnitCategoryID: 0,
  FloorID: 0,
  CountryID: 0,
  CityID: 0,
  UnitStatus: "Available",
  UnitViewID: undefined,
  BedRoomID: undefined,
  BathRoomID: undefined,
  Balconoy: undefined,
  UnitStyleID: undefined,
  UnitModel: undefined,
  CommunityID: undefined,
  BalconyAreaSqft: undefined,
  BalconyAreaSqftMtr: undefined,
  MuncipalyNo: undefined,
  LivingAreaSqft: undefined,
  LivingAreaSqftMtr: undefined,
  Sector: undefined,
  TereaceAreaSqft: undefined,
  TereaceAreaSqftMtr: undefined,
  Block: undefined,
  TotalAreaSqft: undefined,
  TotalAreaSqftMtr: undefined,
  UnitRate: undefined,
  NoOfInstallmentLease: undefined,
  PerMonth: undefined,
  PerYear: undefined,
  NoOfInstallmentSale: undefined,
  ListingPrice: undefined,
  SalePrice: undefined,
  NoOfInstallmentPM: undefined,
  PerMonthRentPm: undefined,
  PerYearRentPm: undefined,
  Remarks: undefined,
  UnitClassID: undefined,
};

export const AREA_UNITS = [
  { value: "sqft", label: "Square Feet" },
  { value: "sqm", label: "Square Meters" },
];

export const EMPTY_CONTACT = {
  UnitContactID: 0,
  UnitID: 0,
  ContactTypeID: 0,
  ContactName: "",
  Remarks: "",
  isNew: true,
};
