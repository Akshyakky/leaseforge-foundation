// src/pages/UnitMaster/constants.ts

export const UNIT_STATUS_OPTIONS = [
  { value: "Available", label: "Available" },
  { value: "Reserved", label: "Reserved" },
  { value: "Leased", label: "Leased" },
  { value: "Sold", label: "Sold" },
  { value: "Maintenance", label: "Under Maintenance" },
  { value: "NotAvailable", label: "Not Available" },
];

export const DEFAULT_FORM_VALUES = {
  UnitNo: "",
  PropertyID: 0,
  UnitTypeID: 0,
  UnitCategoryID: 0,
  FloorID: 0,
  CountryID: 0,
  CityID: 0,
  UnitStatus: "Available",
  LivingAreaSqft: 0,
  BalconyAreaSqft: 0,
  TereaceAreaSqft: 0,
  TotalAreaSqft: 0,
  UnitRate: 0,
};

export const UNIT_TABS = {
  GENERAL: "general",
  CONTACTS: "contacts",
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
