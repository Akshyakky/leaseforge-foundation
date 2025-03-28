// src/pages/UnitMaster/UnitForm.tsx
import { useState, useEffect } from "react";
import { UnitFormProps, ContactRow } from "./types";
import { Unit, UnitContact } from "../../services/unitService";
import { DEFAULT_FORM_VALUES, UNIT_STATUS_OPTIONS, UNIT_TABS } from "./constants";
import { UnitContacts } from "./UnitContacts";
import { Home, Users, Save, RotateCcw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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

export const UnitForm: React.FC<UnitFormProps> = ({ unit, mode, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState(UNIT_TABS.GENERAL);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
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
  const defaultValues: UnitFormValues = {
    ...DEFAULT_FORM_VALUES,
    ...unit,
  };

  // Initialize form with react-hook-form
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues,
    mode: "onChange",
  });

  // Track when country changes to reset city selection
  const watchCountry = form.watch("CountryID");

  useEffect(() => {
    if (watchCountry) {
      // In a real implementation, this would fetch cities for the selected country
      form.setValue("CityID", 0);
    }
  }, [watchCountry, form]);

  // Initialize contacts
  useEffect(() => {
    if (unit?.UnitID) {
      // This would normally be fetched from the API in the parent component
      // and passed down via props
      setContacts([]);
    }
  }, [unit]);

  // Load dropdown data (would be API calls in a real implementation)
  useEffect(() => {
    // Mock data for demonstration
    setDropdownData({
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
  }, []);

  // Update total area when component area values change
  useEffect(() => {
    const livingArea = form.watch("LivingAreaSqft") || 0;
    const balconyArea = form.watch("BalconyAreaSqft") || 0;
    const terraceArea = form.watch("TereaceAreaSqft") || 0;

    const totalArea = livingArea + balconyArea + terraceArea;
    form.setValue("TotalAreaSqft", totalArea > 0 ? totalArea : undefined);
  }, [form.watch("LivingAreaSqft"), form.watch("BalconyAreaSqft"), form.watch("TereaceAreaSqft")]);

  const handleContactsChange = (updatedContacts: UnitContact[]) => {
    setContacts(updatedContacts as ContactRow[]);
  };

  const handleReset = () => {
    form.reset(defaultValues);
    setContacts(unit?.UnitID ? [] : []);
  };

  const handleSubmit = (data: UnitFormValues) => {
    onSave(data, contacts);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value={UNIT_TABS.GENERAL}>
              <Home className="mr-2 h-4 w-4" />
              General Information
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
                      name="UnitNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter unit number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="PropertyID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property *</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Property" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Select Property</SelectItem>
                              {dropdownData.properties.map((property: any) => (
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
                              {dropdownData.unitTypes.map((type: any) => (
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
                              {dropdownData.unitCategories.map((category: any) => (
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
                              {dropdownData.unitViews.map((view: any) => (
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
                                <SelectValue placeholder="Select Floor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Select Floor</SelectItem>
                              {dropdownData.floors.map((floor: any) => (
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
                              {dropdownData.bedrooms.map((bedroom: any) => (
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
                              {dropdownData.bathrooms.map((bathroom: any) => (
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

                    <FormField
                      control={form.control}
                      name="UnitClassID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Class</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString() || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Class" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">None</SelectItem>
                              {dropdownData.unitClasses.map((unitClass: any) => (
                                <SelectItem key={unitClass.UnitClassID} value={unitClass.UnitClassID.toString()}>
                                  {unitClass.UnitClassName}
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
                                  // Optionally calculate sqm value
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
                                  // Optionally calculate sqm value
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
                                  // Optionally calculate sqm value
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
                                {dropdownData.unitStyles.map((style: any) => (
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
                    <h3 className="text-lg font-semibold mb-4">Location & Pricing</h3>
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
                                {dropdownData.countries.map((country: any) => (
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
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""} disabled={!form.watch("CountryID")}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={form.watch("CountryID") ? "Select City" : "Select Country First"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">Select City</SelectItem>
                                {dropdownData.cities.map((city: any) => (
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
                                {dropdownData.communities.map((community: any) => (
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

                      <Separator className="my-4" />

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
            {mode.isCreate ? "Create Unit" : "Update Unit"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
