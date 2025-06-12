// src/pages/UnitMaster/UnitForm.tsx - Enhanced with Clone Mode Support
import { useState, useEffect } from "react";
import { UnitFormProps, ContactRow } from "./types";
import { Unit, UnitContact } from "../../services/unitService";
import { Property } from "../../services/propertyService";
import { DEFAULT_FORM_VALUES, UNIT_STATUS_OPTIONS, UNIT_TABS } from "./constants";
import { UnitContacts } from "./UnitContacts";
import { Home, Users, Save, RotateCcw, DollarSign, Info, Building2, Copy } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { unitDropdownService } from "../../services/unitDropdownService";
import { propertyService } from "../../services/propertyService";
import { unitService } from "../../services/unitService";
import { cityService, countryService } from "@/services";

// Define the form validation schema
const unitFormSchema = z.object({
  UnitNo: z.string().min(1, "Unit number is required"),
  PropertyID: z.coerce.number().min(1, "Property is required"),
  UnitTypeID: z.coerce.number().min(1, "Unit type is required"),
  UnitCategoryID: z.coerce.number().min(1, "Unit category is required"),
  UnitViewID: z.coerce.number().optional(),
  FloorID: z.coerce.number().min(1, "Floor is required"),
  BedRoomID: z.coerce.number().optional(),
  BathRoomID: z.coerce.number().optional(),
  Balconoy: z.string().optional(),
  UnitStyleID: z.coerce.number().optional(),
  UnitModel: z.string().optional(),
  CommunityID: z.coerce.number().optional(),
  CountryID: z.coerce.number().min(1, "Country is required"),
  CityID: z.coerce.number().min(1, "City is required"),
  BalconyAreaSqft: z.coerce.number().optional(),
  BalconyAreaSqftMtr: z.coerce.number().optional(),
  MuncipalyNo: z.coerce.number().optional(),
  LivingAreaSqft: z.coerce.number().optional(),
  LivingAreaSqftMtr: z.coerce.number().optional(),
  Sector: z.coerce.number().optional(),
  TereaceAreaSqft: z.coerce.number().optional(),
  TereaceAreaSqftMtr: z.coerce.number().optional(),
  Block: z.coerce.number().optional(),
  TotalAreaSqft: z.coerce.number().optional(),
  TotalAreaSqftMtr: z.coerce.number().optional(),
  UnitRate: z.coerce.number().optional(),
  NoOfInstallmentLease: z.coerce.number().optional(),
  PerMonth: z.coerce.number().optional(),
  PerYear: z.coerce.number().optional(),
  NoOfInstallmentSale: z.coerce.number().optional(),
  ListingPrice: z.coerce.number().optional(),
  SalePrice: z.coerce.number().optional(),
  NoOfInstallmentPM: z.coerce.number().optional(),
  PerMonthRentPm: z.coerce.number().optional(),
  PerYearRentPm: z.coerce.number().optional(),
  UnitStatus: z.string().optional(),
  Remarks: z.string().optional(),
  UnitClassID: z.coerce.number().optional(),
});

type UnitFormValues = z.infer<typeof unitFormSchema>;

// Property Summary Interface
interface PropertySummary {
  property: Property | null;
  existingUnits: Unit[];
  totalUnits: number;
  availableUnits: number;
  occupiedUnits: number;
  nextSuggestedUnitNo: string;
}

// Property Information Display Component
const PropertyInfoDisplay: React.FC<{ propertySummary: PropertySummary | null }> = ({ propertySummary }) => {
  if (!propertySummary?.property) return null;

  const { property, existingUnits, totalUnits, availableUnits, occupiedUnits, nextSuggestedUnitNo } = propertySummary;

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800";
      case "Leased":
        return "bg-blue-100 text-blue-800";
      case "Sold":
        return "bg-gray-100 text-gray-800";
      case "Reserved":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  return (
    <Card className="mb-6 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Building2 className="mr-2 h-5 w-5 text-blue-600" />
          Property Information: {property.PropertyName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Property Number</div>
            <div className="font-semibold">{property.PropertyNo || "Not specified"}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Total Planned Units</div>
            <div className="font-semibold">{property.TotalUnit || "Not specified"}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Created Units</div>
            <div className="font-semibold">{totalUnits}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Available Units</div>
            <div className="font-semibold text-green-600">{availableUnits}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Location Details</div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Address:</span> {property.Location || "Not specified"}
              </div>
              <div>
                <span className="font-medium">Plot Number:</span> {property.PlotNo || "Not specified"}
              </div>
              <div>
                <span className="font-medium">Plot Size:</span> {property.PlotSize ? `${property.PlotSize.toLocaleString()} sq ft` : "Not specified"}
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Property Statistics</div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Total Floors:</span> {property.NoOfFloors || "Not specified"}
              </div>
              <div>
                <span className="font-medium">Parking Spaces:</span> {property.TotalParkings || "Not specified"}
              </div>
              <div>
                <span className="font-medium">Built-up Area:</span> {property.BuildUpArea ? `${property.BuildUpArea.toLocaleString()} sq ft` : "Not specified"}
              </div>
            </div>
          </div>
        </div>

        {nextSuggestedUnitNo && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Suggested next unit number: <strong>{nextSuggestedUnitNo}</strong>
            </AlertDescription>
          </Alert>
        )}

        {existingUnits.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Unit Status Distribution</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(
                existingUnits.reduce((acc, unit) => {
                  const status = unit.UnitStatus || "Unknown";
                  acc[status] = (acc[status] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([status, count]) => (
                <Badge key={status} className={getStatusColor(status)}>
                  {status}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Clone Information Display Component
const CloneInfoDisplay: React.FC<{ sourceUnit: Unit | null }> = ({ sourceUnit }) => {
  if (!sourceUnit) return null;

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Copy className="mr-2 h-5 w-5 text-orange-600" />
          Cloning from Unit: {sourceUnit.UnitNo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-sm text-gray-600">Source Property</div>
            <div className="font-semibold">{sourceUnit.PropertyName}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-sm text-gray-600">Unit Type</div>
            <div className="font-semibold">{sourceUnit.UnitTypeName}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-sm text-gray-600">Total Area</div>
            <div className="font-semibold">{sourceUnit.TotalAreaSqft ? `${sourceUnit.TotalAreaSqft.toLocaleString()} sqft` : "Not specified"}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-sm text-gray-600">Original Price</div>
            <div className="font-semibold">{sourceUnit.ListingPrice ? `$${sourceUnit.ListingPrice.toLocaleString()}` : "Not specified"}</div>
          </div>
        </div>
        <Alert className="mt-4 border-orange-200">
          <Info className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            The form has been pre-populated with data from the source unit. Please review and modify the unit number and any other fields as needed before saving.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

// Helper function to create cloned unit data
const createClonedUnitData = (sourceUnit: Unit): Partial<Unit> => {
  const clonedData = { ...sourceUnit };

  // Remove fields that should not be cloned
  delete clonedData.UnitID;
  delete clonedData.CreatedBy;
  delete clonedData.CreatedOn;
  delete clonedData.UpdatedBy;
  delete clonedData.UpdatedOn;

  // Clear unit number to force user to enter new one
  clonedData.UnitNo = "";

  // Reset status to Available for new unit
  clonedData.UnitStatus = "Available";

  // Clear sale price but keep listing price as reference
  clonedData.SalePrice = undefined;

  return clonedData;
};

export const UnitForm: React.FC<UnitFormProps> = ({ unit, mode, sourceUnit, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState(UNIT_TABS.GENERAL);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPropertyLoading, setIsPropertyLoading] = useState(false);
  const [cities, setCities] = useState<{ CityID: number; CityName: string }[]>([]);
  const [propertySummary, setPropertySummary] = useState<PropertySummary | null>(null);
  const [dropdownData, setDropdownData] = useState({
    properties: [],
    unitTypes: [],
    unitCategories: [],
    unitViews: [],
    floors: [],
    bedrooms: [],
    bathrooms: [],
    unitStyles: [],
    communities: [],
    countries: [],
    cities: [],
    unitClasses: [],
  });

  // Prepare default values for the form
  const getDefaultValues = (): UnitFormValues => {
    if (mode.isClone && sourceUnit) {
      // Use cloned data for clone mode
      return createClonedUnitData(sourceUnit) as UnitFormValues;
    } else if (mode.isEdit && unit) {
      // Use existing unit data for edit mode
      return { ...DEFAULT_FORM_VALUES, ...unit } as UnitFormValues;
    } else {
      // Use default values for create mode
      return DEFAULT_FORM_VALUES as UnitFormValues;
    }
  };

  // Initialize form with react-hook-form
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: getDefaultValues(),
    mode: "onChange",
  });

  // Track when country and property changes
  const watchCountry = form.watch("CountryID");
  const watchProperty = form.watch("PropertyID");

  // Reset form based on mode and unit/source unit data availability
  useEffect(() => {
    const formValues = getDefaultValues();
    form.reset(formValues);
  }, [unit, sourceUnit, mode.isEdit, mode.isCreate, mode.isClone, form]);

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setIsLoading(true);
        const allDropdowns = await unitDropdownService.getAllDropdownData();
        const countries = await countryService.getCountriesForDropdown();

        setDropdownData({
          ...allDropdowns,
          countries,
          cities: [],
        });
      } catch (error) {
        console.error("Error loading dropdown data:", error);
        toast({
          title: "Error",
          description: "Failed to load dropdown data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDropdownData();
  }, []);

  // Enhanced property selection handler
  const handlePropertyChange = async (propertyId: number) => {
    form.setValue("PropertyID", propertyId);

    if (propertyId > 0) {
      setIsPropertyLoading(true);

      try {
        // Fetch comprehensive property information
        const [propertyDetails, existingUnits, floors] = await Promise.all([
          propertyService.getPropertyById(propertyId),
          unitService.getUnitsByProperty(propertyId),
          unitDropdownService.getFloors(propertyId),
        ]);

        // Update floors dropdown
        setDropdownData((prev) => ({
          ...prev,
          floors,
        }));

        if (propertyDetails) {
          // Auto-populate location fields only if not in clone mode with different property
          if (!mode.isClone || (mode.isClone && sourceUnit && sourceUnit.PropertyID === propertyId)) {
            if (propertyDetails.CountryID) {
              form.setValue("CountryID", propertyDetails.CountryID);

              // Load cities for the property's country
              const cityResponse = await cityService.getCitiesByCountry(propertyDetails.CountryID);
              setCities(cityResponse);

              setTimeout(() => {
                if (propertyDetails.CityID) {
                  form.setValue("CityID", propertyDetails.CityID);
                }
              }, 100);
            }

            if (propertyDetails.CommunityID) {
              form.setValue("CommunityID", propertyDetails.CommunityID);
            }
          }

          // Calculate property statistics
          const totalUnits = existingUnits.length;
          const availableUnits = existingUnits.filter((unit) => unit.UnitStatus === "Available").length;
          const occupiedUnits = totalUnits - availableUnits;

          // Generate suggested unit number
          const nextSuggestedUnitNo = generateNextUnitNumber(existingUnits, propertyDetails);

          // Set property summary
          setPropertySummary({
            property: propertyDetails,
            existingUnits,
            totalUnits,
            availableUnits,
            occupiedUnits,
            nextSuggestedUnitNo,
          });

          // Auto-suggest unit number for new units (including clones)
          if ((mode.isCreate || mode.isClone) && nextSuggestedUnitNo && !form.getValues("UnitNo")) {
            form.setValue("UnitNo", nextSuggestedUnitNo);
          }
        }
      } catch (error) {
        console.error("Error loading property information:", error);
        toast({
          title: "Error",
          description: "Failed to load property information. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsPropertyLoading(false);
      }
    } else {
      // Clear property-related data
      setDropdownData((prev) => ({ ...prev, floors: [] }));
      setPropertySummary(null);
      form.setValue("CountryID", 0);
      form.setValue("CityID", 0);
      form.setValue("CommunityID", 0);
      setCities([]);
    }
  };

  // Generate next unit number based on existing units
  const generateNextUnitNumber = (existingUnits: Unit[], property: Property): string => {
    if (existingUnits.length === 0) {
      return `${property.PropertyNo || "P"}-001`;
    }

    // Extract numeric parts from existing unit numbers
    const numericParts = existingUnits
      .map((unit) => {
        const match = unit.UnitNo.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => num > 0)
      .sort((a, b) => b - a);

    const nextNumber = numericParts.length > 0 ? numericParts[0] + 1 : 1;
    const paddedNumber = nextNumber.toString().padStart(3, "0");

    return `${property.PropertyNo || "P"}-${paddedNumber}`;
  };

  // Load cities when country changes
  useEffect(() => {
    const loadCities = async () => {
      if (watchCountry && watchCountry > 0) {
        try {
          form.setValue("CityID", 0);
          const cityResponse = await cityService.getCitiesByCountry(watchCountry);
          setCities(cityResponse);
        } catch (error) {
          console.error("Error loading cities for country:", error);
          setCities([]);
        }
      } else {
        setCities([]);
      }
    };

    loadCities();
  }, [watchCountry, form]);

  // Load cities immediately when editing/cloning and country is already selected
  useEffect(() => {
    const loadInitialCities = async () => {
      const countryId = (mode.isEdit && unit?.CountryID) || (mode.isClone && sourceUnit?.CountryID);
      if (countryId) {
        try {
          const cityResponse = await cityService.getCitiesByCountry(countryId);
          setCities(cityResponse);
        } catch (error) {
          console.error("Error loading initial cities:", error);
        }
      }
    };

    loadInitialCities();
  }, [unit, sourceUnit, mode.isEdit, mode.isClone]);

  // Load property information immediately when editing or cloning
  useEffect(() => {
    const propertyId = (mode.isEdit && unit?.PropertyID) || (mode.isClone && sourceUnit?.PropertyID);
    if (propertyId) {
      handlePropertyChange(propertyId);
    }
  }, [unit, sourceUnit, mode.isEdit, mode.isClone]);

  // Initialize contacts
  useEffect(() => {
    if (unit?.UnitID) {
      setContacts([]);
    } else if (mode.isClone && sourceUnit) {
      // Optionally pre-populate contacts from source unit
      // For now, we'll start with empty contacts for cloned units
      setContacts([]);
    }
  }, [unit, sourceUnit, mode.isClone]);

  // Auto-calculate total area
  useEffect(() => {
    const livingArea = form.watch("LivingAreaSqft") || 0;
    const balconyArea = form.watch("BalconyAreaSqft") || 0;
    const terraceArea = form.watch("TereaceAreaSqft") || 0;

    const totalArea = livingArea + balconyArea + terraceArea;
    form.setValue("TotalAreaSqft", totalArea > 0 ? totalArea : undefined);
  }, [form.watch("LivingAreaSqft"), form.watch("BalconyAreaSqft"), form.watch("TereaceAreaSqft"), form]);

  // Synchronize rent calculations
  useEffect(() => {
    const monthlyRent = form.watch("PerMonth");
    const yearlyRent = form.watch("PerYear");
    const installments = form.watch("NoOfInstallmentLease");

    const hasMonthly = monthlyRent !== undefined && monthlyRent !== null && monthlyRent !== 0;
    const hasYearly = yearlyRent !== undefined && yearlyRent !== null && yearlyRent !== 0;
    const hasInstallments = installments !== undefined && installments !== null && installments !== 0;

    if (hasMonthly && hasYearly && !hasInstallments) {
      if (monthlyRent > 0) {
        const calculatedInstallments = Math.round(yearlyRent / monthlyRent);
        form.setValue("NoOfInstallmentLease", calculatedInstallments);
      }
    }

    if (hasMonthly && hasInstallments && !hasYearly) {
      const calculatedYearly = parseFloat((monthlyRent * installments).toFixed(2));
      form.setValue("PerYear", calculatedYearly);
    }

    if (hasYearly && hasInstallments && !hasMonthly) {
      if (installments > 0) {
        const calculatedMonthly = parseFloat((yearlyRent / installments).toFixed(2));
        form.setValue("PerMonth", calculatedMonthly);
      }
    }

    if (hasMonthly && hasYearly && hasInstallments) {
      const calculatedYearly = monthlyRent * installments;
      const epsilon = 0.01;

      if (Math.abs(calculatedYearly - yearlyRent) > epsilon) {
        const newYearly = parseFloat((monthlyRent * installments).toFixed(2));
        form.setValue("PerYear", newYearly);
      }
    }
  }, [form.watch("PerMonth"), form.watch("PerYear"), form.watch("NoOfInstallmentLease")]);

  const handleContactsChange = (updatedContacts: UnitContact[]) => {
    setContacts(updatedContacts as ContactRow[]);
  };

  const handleReset = () => {
    const defaultValues = getDefaultValues();
    form.reset(defaultValues);
    setContacts([]);
    setPropertySummary(null);
  };

  const handleSubmit = (data: UnitFormValues) => {
    onSave(data, contacts);
  };

  const getFormTitle = (): string => {
    if (mode.isClone) return "Clone Unit";
    if (mode.isEdit) return "Edit Unit";
    if (mode.isCreate) return "Create Unit";
    return "Unit Form";
  };

  const getSubmitButtonText = (): string => {
    if (mode.isClone) return "Clone Unit";
    if (mode.isEdit) return "Update Unit";
    return "Create Unit";
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading form data...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {/* Clone Information Display */}
        {mode.isClone && sourceUnit && <CloneInfoDisplay sourceUnit={sourceUnit} />}

        {/* Property Information Display */}
        {propertySummary && <PropertyInfoDisplay propertySummary={propertySummary} />}

        {isPropertyLoading && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>Loading property information...</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value={UNIT_TABS.GENERAL}>
              <Home className="mr-2 h-4 w-4" />
              General Information
            </TabsTrigger>
            <TabsTrigger value={UNIT_TABS.PRICING}>
              <DollarSign className="mr-2 h-4 w-4" />
              Pricing & Payment
            </TabsTrigger>
            <TabsTrigger value={UNIT_TABS.CONTACTS}>
              <Users className="mr-2 h-4 w-4" />
              Contacts ({contacts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={UNIT_TABS.GENERAL}>
            <div className="space-y-8">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="PropertyID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              const propertyId = parseInt(value);
                              field.onChange(propertyId);
                              handlePropertyChange(propertyId);
                            }}
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Property" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Select Property</SelectItem>
                              {dropdownData.properties.map((property) => (
                                <SelectItem key={property.PropertyID} value={property.PropertyID.toString()}>
                                  {property.PropertyName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="UnitNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter unit number" {...field} />
                          </FormControl>
                          {mode.isClone && <p className="text-sm text-orange-600">⚠️ Please update the unit number for the cloned unit</p>}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="UnitTypeID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Type *</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Unit Type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Select Unit Type</SelectItem>
                              {dropdownData.unitTypes.map((type) => (
                                <SelectItem key={type.UnitTypeID} value={type.UnitTypeID.toString()}>
                                  {type.UnitTypeName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="UnitCategoryID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Category *</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Select Category</SelectItem>
                              {dropdownData.unitCategories.map((category) => (
                                <SelectItem key={category.UnitCategoryID} value={category.UnitCategoryID.toString()}>
                                  {category.UnitCategoryName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="UnitViewID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit View</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString() || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select View" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">None</SelectItem>
                              {dropdownData.unitViews.map((view) => (
                                <SelectItem key={view.UnitViewID} value={view.UnitViewID.toString()}>
                                  {view.UnitViewName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="FloorID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Floor *</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={watchProperty ? "Select Floor" : "Select Property First"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Select Floor</SelectItem>
                              {dropdownData.floors.map((floor) => (
                                <SelectItem key={floor.FloorID} value={floor.FloorID.toString()}>
                                  {floor.FloorName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="BedRoomID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bedrooms</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString() || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Bedrooms" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">None</SelectItem>
                              {dropdownData.bedrooms.map((bedroom) => (
                                <SelectItem key={bedroom.BedRoomID} value={bedroom.BedRoomID.toString()}>
                                  {bedroom.BedRoomCount} {bedroom.BedRoomCount === 1 ? "Bedroom" : "Bedrooms"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="BathRoomID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bathrooms</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString() || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Bathrooms" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">None</SelectItem>
                              {dropdownData.bathrooms.map((bathroom) => (
                                <SelectItem key={bathroom.BathRoomID} value={bathroom.BathRoomID.toString()}>
                                  {bathroom.BathRoomCount} {bathroom.BathRoomCount === 1 ? "Bathroom" : "Bathrooms"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="UnitStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "Available"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {UNIT_STATUS_OPTIONS.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">Area Details</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="LivingAreaSqft"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Living Area (sqft)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                  field.onChange(value);
                                  if (value) {
                                    form.setValue("LivingAreaSqftMtr", parseFloat((value * 0.092903).toFixed(2)));
                                  } else {
                                    form.setValue("LivingAreaSqftMtr", undefined);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="BalconyAreaSqft"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Balcony Area (sqft)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                  field.onChange(value);
                                  if (value) {
                                    form.setValue("BalconyAreaSqftMtr", parseFloat((value * 0.092903).toFixed(2)));
                                  } else {
                                    form.setValue("BalconyAreaSqftMtr", undefined);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="TereaceAreaSqft"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Terrace Area (sqft)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                  field.onChange(value);
                                  if (value) {
                                    form.setValue("TereaceAreaSqftMtr", parseFloat((value * 0.092903).toFixed(2)));
                                  } else {
                                    form.setValue("TereaceAreaSqftMtr", undefined);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="TotalAreaSqft"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Area (sqft)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Calculated automatically" {...field} disabled />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator className="my-4" />

                      <FormField
                        control={form.control}
                        name="UnitModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Model</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter unit model" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="UnitStyleID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Style</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString() || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Style" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">None</SelectItem>
                                {dropdownData.unitStyles.map((style) => (
                                  <SelectItem key={style.UnitStyleID} value={style.UnitStyleID.toString()}>
                                    {style.UnitStyleName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="Balconoy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Balcony Details</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter balcony details" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">Location Information</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="CountryID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country *</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">Select Country</SelectItem>
                                {dropdownData.countries.map((country) => (
                                  <SelectItem key={country.CountryID} value={country.CountryID.toString()}>
                                    {country.CountryName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="CityID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City *</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""} disabled={!watchCountry}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={watchCountry ? "Select City" : "Select Country First"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">Select City</SelectItem>
                                {cities.map((city) => (
                                  <SelectItem key={city.CityID} value={city.CityID.toString()}>
                                    {city.CityName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="CommunityID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Community</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString() || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Community" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">None</SelectItem>
                                {dropdownData.communities.map((community) => (
                                  <SelectItem key={community.CommunityID} value={community.CommunityID.toString()}>
                                    {community.CommunityName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="Block"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Block</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Block number"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="Sector"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sector</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Sector number"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="MuncipalyNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Municipality Number</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Municipality number"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                  <FormField
                    control={form.control}
                    name="Remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter additional information about the unit" className="min-h-32" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value={UNIT_TABS.PRICING}>
            <div className="space-y-8">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Sale Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="UnitRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Rate (per sqft)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ListingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Listing Price</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="SalePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Price</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          {mode.isClone && <p className="text-sm text-blue-600">💡 Sale price has been cleared for the cloned unit</p>}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="NoOfInstallmentSale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Installments (Sale)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Lease Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="PerMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Rent</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="PerYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yearly Rent</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="NoOfInstallmentLease"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Installments (Lease)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Property Management Fees</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="PerMonthRentPm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Management Fee</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="PerYearRentPm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yearly Management Fee</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="NoOfInstallmentPM"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Installments (Management)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value={UNIT_TABS.CONTACTS}>
            <Card>
              <CardContent className="pt-6">
                <UnitContacts unitId={unit?.UnitID || 0} contacts={contacts} onContactsChange={handleContactsChange} readOnly={mode.isView} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-8">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button type="submit" disabled={mode.isView}>
            <Save className="mr-2 h-4 w-4" />
            {getSubmitButtonText()}
          </Button>
        </div>
      </form>
    </Form>
  );
};
