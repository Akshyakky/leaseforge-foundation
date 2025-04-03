import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, RotateCcw } from "lucide-react";
import { propertyService, Property } from "@/services/propertyService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/lib/hooks";
import { countryService } from "@/services/countryService";
import { cityService } from "@/services/cityService";

// Create the schema for property form validation
const propertySchema = z.object({
  PropertyNo: z.string().optional(),
  PropertyName: z.string().min(2, "Property name is required"),
  ProjectStartDate: z.date().optional().nullable(),
  ProjectCompletionDate: z.date().optional().nullable(),
  TitleDeed: z.string().optional(),
  CommunityID: z.string().optional(),
  CountryID: z.string().min(1, "Country is required"),
  CityID: z.string().min(1, "City is required"),
  PlotNo: z.string().optional(),
  PlotSize: z.coerce.number().optional().nullable(),
  GEOLocation: z.string().optional(),
  Location: z.string().optional(),
  TotalUnit: z.coerce.number().optional().nullable(),
  TotalParkings: z.coerce.number().optional().nullable(),
  NoOfFloors: z.coerce.number().optional().nullable(),
  BuildUpArea: z.coerce.number().optional().nullable(),
  GrossArea: z.coerce.number().optional().nullable(),
  SquareFootRate: z.coerce.number().optional().nullable(),
  Remark: z.string().optional(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

const PropertyForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [property, setProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  // Reference data
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);

  // Initialize form
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      PropertyNo: "",
      PropertyName: "",
      ProjectStartDate: null,
      ProjectCompletionDate: null,
      TitleDeed: "",
      CommunityID: "",
      CountryID: "",
      CityID: "",
      PlotNo: "",
      PlotSize: null,
      GEOLocation: "",
      Location: "",
      TotalUnit: null,
      TotalParkings: null,
      NoOfFloors: null,
      BuildUpArea: null,
      GrossArea: null,
      SquareFootRate: null,
      Remark: "",
    },
  });

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Fetch reference data in parallel
        const [countriesData, communitiesData] = await Promise.all([
          countryService.getCountriesForDropdown(),
          // Fetch communities data (placeholder - replace with actual service)
          Promise.resolve([]),
        ]);

        setCountries(countriesData);
        setCommunities(communitiesData);

        // If editing, fetch the property data
        if (isEdit && id) {
          const propertyData = await propertyService.getPropertyById(parseInt(id));

          if (propertyData) {
            setProperty(propertyData);

            // Format dates for form
            const formattedData = {
              ...propertyData,
              ProjectStartDate: propertyData.ProjectStartDate ? new Date(propertyData.ProjectStartDate) : null,
              ProjectCompletionDate: propertyData.ProjectCompletionDate ? new Date(propertyData.ProjectCompletionDate) : null,
              CountryID: propertyData.CountryID?.toString() || "",
              CityID: propertyData.CityID?.toString() || "",
              CommunityID: propertyData.CommunityID?.toString() || "",
            };

            // Set form values
            form.reset(formattedData as any);

            // If country is set, fetch cities
            if (propertyData.CountryID) {
              setSelectedCountryId(propertyData.CountryID.toString());
              const citiesData = await cityService.getCitiesByCountry(propertyData.CountryID);
              setCities(citiesData);
            }
          } else {
            toast.error("Property not found");
            navigate("/properties");
          }
        }
      } catch (error) {
        console.error("Error initializing form:", error);
        toast.error("Error loading form data");
      } finally {
        setInitialLoading(false);
      }
    };

    initializeForm();
  }, [id, isEdit, navigate, form]);

  // Effect to load cities when country changes
  useEffect(() => {
    const fetchCities = async () => {
      if (selectedCountryId) {
        try {
          const citiesData = await cityService.getCitiesByCountry(parseInt(selectedCountryId));
          setCities(citiesData);
        } catch (error) {
          console.error("Error fetching cities:", error);
          setCities([]);
        }
      } else {
        setCities([]);
      }
    };

    fetchCities();
  }, [selectedCountryId]);

  // Handle form submission
  const onSubmit = async (data: PropertyFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    setLoading(true);

    try {
      // Prepare property data
      const propertyData: Partial<Property> = {
        PropertyNo: data.PropertyNo,
        PropertyName: data.PropertyName,
        ProjectStartDate: data.ProjectStartDate,
        ProjectCompletionDate: data.ProjectCompletionDate,
        TitleDeed: data.TitleDeed,
        CommunityID: data.CommunityID ? parseInt(data.CommunityID) : undefined,
        CountryID: parseInt(data.CountryID),
        CityID: parseInt(data.CityID),
        PlotNo: data.PlotNo,
        PlotSize: data.PlotSize || undefined,
        GEOLocation: data.GEOLocation,
        Location: data.Location,
        TotalUnit: data.TotalUnit || undefined,
        TotalParkings: data.TotalParkings || undefined,
        NoOfFloors: data.NoOfFloors || undefined,
        BuildUpArea: data.BuildUpArea || undefined,
        GrossArea: data.GrossArea || undefined,
        SquareFootRate: data.SquareFootRate || undefined,
        Remark: data.Remark,
      };

      if (isEdit && property) {
        // Update existing property
        const success = await propertyService.updateProperty({
          ...propertyData,
          PropertyID: property.PropertyID,
        });

        if (success) {
          toast.success("Property updated successfully");
          navigate("/properties");
        } else {
          toast.error("Failed to update property");
        }
      } else {
        // Create new property
        const newPropertyId = await propertyService.createProperty(propertyData);

        if (newPropertyId) {
          toast.success("Property created successfully");
          navigate("/properties");
        } else {
          toast.error("Failed to create property");
        }
      }
    } catch (error) {
      console.error("Error saving property:", error);
      toast.error("Failed to save property");
    } finally {
      setLoading(false);
    }
  };

  // Handle country change
  const handleCountryChange = (value: string) => {
    form.setValue("CountryID", value);
    form.setValue("CityID", ""); // Reset city when country changes
    setSelectedCountryId(value);
  };

  // Reset form
  const handleReset = () => {
    if (isEdit && property) {
      form.reset({
        ...property,
        ProjectStartDate: property.ProjectStartDate ? new Date(property.ProjectStartDate) : null,
        ProjectCompletionDate: property.ProjectCompletionDate ? new Date(property.ProjectCompletionDate) : null,
        CountryID: property.CountryID?.toString() || "",
        CityID: property.CityID?.toString() || "",
        CommunityID: property.CommunityID?.toString() || "",
      } as any);
    } else {
      form.reset();
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    navigate("/properties");
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/properties")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Property" : "Create Property"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isEdit ? "Edit Property" : "Create New Property"}</CardTitle>
                <CardDescription>{isEdit ? "Update property information" : "Enter details for the new property"}</CardDescription>
              </CardHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-2">
                <div className="px-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Information</TabsTrigger>
                    <TabsTrigger value="details">Property Details</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="basic" className="p-6 pt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      form={form}
                      name="PropertyNo"
                      label="Property Number"
                      placeholder="Auto-generated if empty"
                      disabled={isEdit}
                      description="Unique identifier for the property"
                    />
                    <FormField form={form} name="PropertyName" label="Property Name" placeholder="Enter property name" required />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField form={form} name="ProjectStartDate" label="Project Start Date" type="date" placeholder="Select start date" />
                    <FormField form={form} name="ProjectCompletionDate" label="Project Completion Date" type="date" placeholder="Select completion date" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField form={form} name="TitleDeed" label="Title Deed" placeholder="Enter title deed reference" />
                    <FormField form={form} name="PlotNo" label="Plot Number" placeholder="Enter plot number" />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      form={form}
                      name="CountryID"
                      label="Country"
                      type="select"
                      options={countries.map((country) => ({
                        label: country.CountryName,
                        value: country.CountryID.toString(),
                      }))}
                      placeholder="Select country"
                      required
                      onChange={handleCountryChange}
                    />

                    <FormField
                      form={form}
                      name="CityID"
                      label="City"
                      type="select"
                      options={cities.map((city) => ({
                        label: city.CityName,
                        value: city.CityID.toString(),
                      }))}
                      placeholder={selectedCountryId ? "Select city" : "Select country first"}
                      disabled={!selectedCountryId}
                      required
                    />

                    <FormField
                      form={form}
                      name="CommunityID"
                      label="Community"
                      type="select"
                      options={communities.map((community) => ({
                        label: community.CommunityName,
                        value: community.CommunityID.toString(),
                      }))}
                      placeholder="Select community"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <FormField form={form} name="Location" label="Location" placeholder="Enter property location details" type="textarea" />
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <FormField form={form} name="GEOLocation" label="GEO Location" placeholder="Enter coordinates or GEO reference" />
                  </div>
                </TabsContent>

                <TabsContent value="details" className="p-6 pt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField form={form} name="PlotSize" label="Plot Size (sq ft)" type="number" placeholder="0.00" />
                    <FormField form={form} name="BuildUpArea" label="Built-up Area (sq ft)" type="number" placeholder="0.00" />
                    <FormField form={form} name="GrossArea" label="Gross Area (sq ft)" type="number" placeholder="0.00" />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField form={form} name="TotalUnit" label="Total Units" type="number" placeholder="0" />
                    <FormField form={form} name="TotalParkings" label="Total Parking Spaces" type="number" placeholder="0" />
                    <FormField form={form} name="NoOfFloors" label="Number of Floors" type="number" placeholder="0" />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField form={form} name="SquareFootRate" label="Square Foot Rate" type="number" placeholder="0.00" />
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <FormField form={form} name="Remark" label="Remarks" placeholder="Add any additional information about the property" type="textarea" />
                  </div>
                </TabsContent>
              </Tabs>

              <CardFooter className="flex justify-between border-t p-6">
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEdit ? "Update Property" : "Create Property"}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PropertyForm;
