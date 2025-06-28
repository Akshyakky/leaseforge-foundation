import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, RotateCcw, Upload, X, FileImage, Paperclip, Star, Eye, Trash2 } from "lucide-react";
import { propertyService, Property, PropertyAttachment, CreatePropertyRequest, UpdatePropertyRequest, NewPropertyAttachment } from "@/services/propertyService";
import { docTypeService, DocType } from "@/services/docTypeService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/lib/hooks";
import { countryService } from "@/services/countryService";
import { cityService } from "@/services/cityService";
import { unitRelatedService } from "@/services/unitRelatedService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

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

interface AttachmentFormData extends Omit<PropertyAttachment, "PropertyID"> {
  file?: File;
  preview?: string;
  isNew?: boolean;
}

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
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);

  // Attachment management
  const [attachments, setAttachments] = useState<AttachmentFormData[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [selectedAttachment, setSelectedAttachment] = useState<AttachmentFormData | null>(null);
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);

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
        const [countriesData, communitiesData, docTypesData] = await Promise.all([
          countryService.getCountriesForDropdown(),
          unitRelatedService.getCommunitiesForDropdown(),
          docTypeService.getAllDocTypes(),
        ]);

        setCountries(countriesData);
        setCommunities(communitiesData);
        setDocTypes(docTypesData);

        // If editing, fetch the property data
        if (isEdit && id) {
          const propertyData = await propertyService.getPropertyById(parseInt(id));

          if (propertyData) {
            setProperty(propertyData.property);

            // Format dates for form
            const formattedData = {
              ...propertyData.property,
              ProjectStartDate: propertyData.property.ProjectStartDate ? new Date(propertyData.property.ProjectStartDate) : null,
              ProjectCompletionDate: propertyData.property.ProjectCompletionDate ? new Date(propertyData.property.ProjectCompletionDate) : null,
              CountryID: propertyData.property.CountryID?.toString() || "",
              CityID: propertyData.property.CityID?.toString() || "",
              CommunityID: propertyData.property.CommunityID?.toString() || "",
            };

            // Set form values
            form.reset(formattedData as any);

            // Set attachments
            setAttachments(
              propertyData.attachments.map((att) => ({
                ...att,
                isNew: false,
              }))
            );

            // If country is set, fetch cities
            if (propertyData.property.CountryID) {
              setSelectedCountryId(propertyData.property.CountryID.toString());
              const citiesData = await cityService.getCitiesByCountry(propertyData.property.CountryID);
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

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        let base64Content = "";

        if (e.target?.result) {
          if (typeof e.target.result === "string") {
            // If using readAsDataURL, extract base64 part
            base64Content = e.target.result.split(",")[1];
          } else {
            // If using readAsArrayBuffer, convert to base64
            const arrayBuffer = e.target.result as ArrayBuffer;
            base64Content = arrayBufferToBase64(arrayBuffer);
          }
        }

        const newAttachment: AttachmentFormData = {
          DocumentName: file.name,
          DocTypeID: 0, // Will be selected by user
          FileContent: base64Content, // Now storing as base64 string
          FileContentType: file.type,
          FileSize: file.size,
          AttachmentType: file.type.startsWith("image/") ? "Image" : "Document",
          IsMainImage: false,
          IsPublic: true,
          file: file,
          preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
          isNew: true,
        };

        setAttachments((prev) => [...prev, newAttachment]);
      };

      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast.error(`Failed to read file: ${file.name}`);
      };

      // Read file as data URL to get base64 content
      reader.readAsDataURL(file);
    });

    // Reset input
    event.target.value = "";
  };

  // Helper function to convert ArrayBuffer to base64 string
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Alternative helper function using more modern approach
  const arrayBufferToBase64Modern = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binary);
  };

  // For very large files, you might want to use this chunk-based approach
  const arrayBufferToBase64Chunked = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000; // 32KB chunks
    let binary = "";

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }

    return btoa(binary);
  };

  // Handle attachment update
  const updateAttachment = (index: number, updates: Partial<AttachmentFormData>) => {
    setAttachments((prev) => prev.map((att, i) => (i === index ? { ...att, ...updates } : att)));
  };

  // Handle attachment deletion
  const deleteAttachment = (index: number) => {
    const attachment = attachments[index];
    if (attachment.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Set main image
  const setMainImage = (index: number) => {
    setAttachments((prev) =>
      prev.map((att, i) => ({
        ...att,
        IsMainImage: i === index,
      }))
    );
  };

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

      // Prepare attachments data (exclude existing ones that haven't changed)
      const attachmentsData: NewPropertyAttachment[] = attachments
        .filter((att) => att.isNew && att.DocTypeID > 0)
        .map((att) => ({
          DocTypeID: att.DocTypeID,
          DocumentName: att.DocumentName,
          FileContent: att.FileContent,
          FileContentType: att.FileContentType,
          FileSize: att.FileSize,
          AttachmentType: att.AttachmentType,
          IsMainImage: att.IsMainImage,
          ImageCaption: att.ImageCaption,
          ImageAltText: att.ImageAltText,
          DocIssueDate: att.DocIssueDate,
          DocExpiryDate: att.DocExpiryDate,
          IsPublic: att.IsPublic,
          Remarks: att.Remarks,
        }));

      if (isEdit && property) {
        // Update existing property
        const request: UpdatePropertyRequest = {
          property: {
            ...propertyData,
            PropertyID: property.PropertyID,
          },
          attachments: attachmentsData,
        };

        const success = await propertyService.updateProperty(request);

        if (success) {
          toast.success("Property updated successfully");
          navigate("/properties");
        } else {
          toast.error("Failed to update property");
        }
      } else {
        // Create new property
        const request: CreatePropertyRequest = {
          property: propertyData,
          attachments: attachmentsData,
        };

        const newPropertyId = await propertyService.createProperty(request);

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
      setAttachments([]);
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    navigate("/properties");
  };

  // Open attachment dialog
  const openAttachmentDialog = (attachment: AttachmentFormData) => {
    setSelectedAttachment(attachment);
    setIsAttachmentDialogOpen(true);
  };

  // Close attachment dialog
  const closeAttachmentDialog = () => {
    setSelectedAttachment(null);
    setIsAttachmentDialogOpen(false);
  };

  // Save attachment details
  const saveAttachmentDetails = (details: Partial<AttachmentFormData>) => {
    if (!selectedAttachment) return;

    const index = attachments.findIndex((att) => att === selectedAttachment);
    if (index >= 0) {
      updateAttachment(index, details);
    }
    closeAttachmentDialog();
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const imageAttachments = attachments.filter((att) => att.AttachmentType === "Image" || att.FileContentType?.startsWith("image/"));
  const documentAttachments = attachments.filter((att) => att.AttachmentType !== "Image" && !att.FileContentType?.startsWith("image/"));

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
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic Information</TabsTrigger>
                    <TabsTrigger value="details">Property Details</TabsTrigger>
                    <TabsTrigger value="images">Images ({imageAttachments.length})</TabsTrigger>
                    <TabsTrigger value="documents">Documents ({documentAttachments.length})</TabsTrigger>
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

                <TabsContent value="images" className="p-6 pt-4 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Property Images</h3>
                      <div>
                        <Input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" id="image-upload" />
                        <Label htmlFor="image-upload">
                          <Button type="button" variant="outline" className="cursor-pointer" asChild>
                            <span>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Images
                            </span>
                          </Button>
                        </Label>
                      </div>
                    </div>

                    {imageAttachments.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <FileImage className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No images uploaded yet. Click "Upload Images" to add some.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {imageAttachments.map((attachment, index) => (
                          <div key={index} className="relative group border rounded-lg overflow-hidden">
                            <div className="aspect-square bg-muted">
                              {attachment.preview || attachment.FilePath ? (
                                <img src={attachment.preview || attachment.FilePath} alt={attachment.DocumentName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FileImage className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            <div className="absolute top-2 right-2 flex space-x-1">
                              {attachment.IsMainImage && (
                                <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                  <Star className="h-3 w-3" />
                                </Badge>
                              )}
                              <Button type="button" size="sm" variant="secondary" className="h-6 w-6 p-0" onClick={() => openAttachmentDialog(attachment)}>
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button type="button" size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={() => deleteAttachment(index)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
                              <p className="text-xs truncate">{attachment.DocumentName}</p>
                              {attachment.DocTypeID > 0 ? (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {docTypes.find((dt) => dt.DocTypeID === attachment.DocTypeID)?.Description || "Unknown"}
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs mt-1">
                                  Select Type
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="p-6 pt-4 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Property Documents</h3>
                      <div>
                        <Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" multiple onChange={handleFileUpload} className="hidden" id="document-upload" />
                        <Label htmlFor="document-upload">
                          <Button type="button" variant="outline" className="cursor-pointer" asChild>
                            <span>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Documents
                            </span>
                          </Button>
                        </Label>
                      </div>
                    </div>

                    {documentAttachments.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No documents uploaded yet. Click "Upload Documents" to add some.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {documentAttachments.map((attachment, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{attachment.DocumentName}</span>
                                  {attachment.DocTypeID > 0 ? (
                                    <Badge variant="outline">{docTypes.find((dt) => dt.DocTypeID === attachment.DocTypeID)?.Description || "Unknown"}</Badge>
                                  ) : (
                                    <Badge variant="destructive">Select Type</Badge>
                                  )}
                                </div>
                                <div className="mt-1 text-sm text-muted-foreground">Size: {((attachment.FileSize || 0) / 1024).toFixed(1)} KB</div>
                              </div>
                              <div className="flex space-x-2">
                                <Button type="button" size="sm" variant="outline" onClick={() => openAttachmentDialog(attachment)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                                <Button type="button" size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => deleteAttachment(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

      {/* Attachment Details Dialog */}
      <Dialog open={isAttachmentDialogOpen} onOpenChange={closeAttachmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Attachment Details</DialogTitle>
          </DialogHeader>
          {selectedAttachment && (
            <AttachmentDetailsForm
              attachment={selectedAttachment}
              docTypes={docTypes}
              onSave={saveAttachmentDetails}
              onCancel={closeAttachmentDialog}
              onSetMainImage={() => {
                const index = attachments.findIndex((att) => att === selectedAttachment);
                if (index >= 0) setMainImage(index);
                closeAttachmentDialog();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Attachment Details Form Component
interface AttachmentDetailsFormProps {
  attachment: AttachmentFormData;
  docTypes: DocType[];
  onSave: (details: Partial<AttachmentFormData>) => void;
  onCancel: () => void;
  onSetMainImage: () => void;
}

const AttachmentDetailsForm: React.FC<AttachmentDetailsFormProps> = ({ attachment, docTypes, onSave, onCancel, onSetMainImage }) => {
  const [formData, setFormData] = useState({
    DocTypeID: attachment.DocTypeID || 0,
    ImageCaption: attachment.ImageCaption || "",
    ImageAltText: attachment.ImageAltText || "",
    DocIssueDate: attachment.DocIssueDate || undefined,
    DocExpiryDate: attachment.DocExpiryDate || undefined,
    IsPublic: attachment.IsPublic !== false,
    Remarks: attachment.Remarks || "",
  });

  const handleSave = () => {
    onSave(formData);
  };

  const isImage = attachment.AttachmentType === "Image" || attachment.FileContentType?.startsWith("image/");

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="docType">Document Type *</Label>
        <Select value={formData.DocTypeID.toString()} onValueChange={(value) => setFormData((prev) => ({ ...prev, DocTypeID: parseInt(value) }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Select Type</SelectItem>
            {docTypes.map((docType) => (
              <SelectItem key={docType.DocTypeID} value={docType.DocTypeID.toString()}>
                {docType.Description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isImage && (
        <>
          <div>
            <Label htmlFor="caption">Image Caption</Label>
            <Input
              id="caption"
              value={formData.ImageCaption}
              onChange={(e) => setFormData((prev) => ({ ...prev, ImageCaption: e.target.value }))}
              placeholder="Enter image caption"
            />
          </div>

          <div>
            <Label htmlFor="altText">Alt Text</Label>
            <Input
              id="altText"
              value={formData.ImageAltText}
              onChange={(e) => setFormData((prev) => ({ ...prev, ImageAltText: e.target.value }))}
              placeholder="Enter alt text for accessibility"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button type="button" variant="outline" onClick={onSetMainImage}>
              <Star className="mr-2 h-4 w-4" />
              Set as Main Image
            </Button>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="issueDate">Issue Date</Label>
          <Input
            id="issueDate"
            type="date"
            value={formData.DocIssueDate ? new Date(formData.DocIssueDate).toISOString().split("T")[0] : ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                DocIssueDate: e.target.value ? new Date(e.target.value) : undefined,
              }))
            }
          />
        </div>

        <div>
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            type="date"
            value={formData.DocExpiryDate ? new Date(formData.DocExpiryDate).toISOString().split("T")[0] : ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                DocExpiryDate: e.target.value ? new Date(e.target.value) : undefined,
              }))
            }
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="isPublic" checked={formData.IsPublic} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, IsPublic: checked as boolean }))} />
        <Label htmlFor="isPublic">Make this attachment publicly visible</Label>
      </div>

      <div>
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea
          id="remarks"
          value={formData.Remarks}
          onChange={(e) => setFormData((prev) => ({ ...prev, Remarks: e.target.value }))}
          placeholder="Enter any additional remarks"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSave} disabled={formData.DocTypeID === 0}>
          Save Details
        </Button>
      </div>
    </div>
  );
};

export default PropertyForm;
