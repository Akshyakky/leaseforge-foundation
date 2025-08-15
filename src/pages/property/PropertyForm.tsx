import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, RotateCcw, Upload, X, FileImage, Paperclip, Star, Eye, Trash2, Settings } from "lucide-react";
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

// Enhanced schema with attachment categories
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

// Enhanced attachment interface with categories
interface AttachmentFormData extends Omit<PropertyAttachment, "PropertyID"> {
  file?: File;
  preview?: string;
  isNew?: boolean;
  AttachmentType?: "Image" | "Document" | "Blueprint" | "Certificate" | "Video" | "Other";
  AttachmentCategory?: "Primary" | "Gallery" | "Floor Plan" | "Legal" | "Marketing" | "Construction" | "Other";
}

// Smart categorization based on file type
const getSmartAttachmentInfo = (
  file: File
): {
  type: AttachmentFormData["AttachmentType"];
  category: AttachmentFormData["AttachmentCategory"];
  suggestedDocTypes: number[];
} => {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  const fileExtension = fileName.split(".").pop() || "";

  // Image files
  if (fileType.startsWith("image/")) {
    if (fileName.includes("floor") || fileName.includes("plan") || fileName.includes("layout")) {
      return { type: "Blueprint", category: "Floor Plan", suggestedDocTypes: [1, 2] }; // Adjust IDs based on your doc types
    }
    if (fileName.includes("main") || fileName.includes("cover") || fileName.includes("primary")) {
      return { type: "Image", category: "Primary", suggestedDocTypes: [1] };
    }
    return { type: "Image", category: "Gallery", suggestedDocTypes: [1, 2] };
  }

  // Video files
  if (fileType.startsWith("video/")) {
    return { type: "Video", category: "Marketing", suggestedDocTypes: [3] };
  }

  // PDF files
  if (fileType === "application/pdf" || fileExtension === "pdf") {
    if (fileName.includes("certificate") || fileName.includes("cert")) {
      return { type: "Certificate", category: "Legal", suggestedDocTypes: [4, 5] };
    }
    if (fileName.includes("title") || fileName.includes("deed") || fileName.includes("legal")) {
      return { type: "Document", category: "Legal", suggestedDocTypes: [4, 5, 6] };
    }
    if (fileName.includes("plan") || fileName.includes("blueprint") || fileName.includes("drawing")) {
      return { type: "Blueprint", category: "Floor Plan", suggestedDocTypes: [7, 8] };
    }
    return { type: "Document", category: "Other", suggestedDocTypes: [9, 10] };
  }

  // Office documents
  if (fileType.includes("word") || fileType.includes("excel") || fileType.includes("powerpoint") || ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(fileExtension)) {
    return { type: "Document", category: "Other", suggestedDocTypes: [9, 10, 11] };
  }

  // CAD files
  if (["dwg", "dxf", "autocad"].includes(fileExtension)) {
    return { type: "Blueprint", category: "Construction", suggestedDocTypes: [7, 8] };
  }

  // Default fallback
  return { type: "Other", category: "Other", suggestedDocTypes: [12] };
};

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

        if (countriesData && !isEdit) {
          const defaultCountry = await countryService.getDefaultCountry();
          form.setValue("CountryID", defaultCountry.CountryID.toString());
          handleCountryChange(defaultCountry.CountryID.toString());
        }

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
                AttachmentType: (att.AttachmentType as AttachmentFormData["AttachmentType"]) || "Other",
                AttachmentCategory: (att.AttachmentCategory as AttachmentFormData["AttachmentCategory"]) || "Other",
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

  // Enhanced file upload with smart categorization
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        let base64Content = "";

        if (e.target?.result) {
          if (typeof e.target.result === "string") {
            base64Content = e.target.result.split(",")[1];
          } else {
            const arrayBuffer = e.target.result as ArrayBuffer;
            base64Content = arrayBufferToBase64(arrayBuffer);
          }
        }

        // Get smart attachment info
        const smartInfo = getSmartAttachmentInfo(file);

        // Find the best matching doc type
        const suggestedDocType =
          smartInfo.suggestedDocTypes.find((id) => docTypes.some((dt) => dt.DocTypeID === id)) ||
          smartInfo.suggestedDocTypes[0] ||
          (docTypes.length > 0 ? docTypes[0].DocTypeID : 0);

        const newAttachment: AttachmentFormData = {
          DocumentName: file.name,
          DocTypeID: suggestedDocType, // Auto-assign suggested doc type
          FileContent: base64Content,
          FileContentType: file.type,
          FileSize: file.size,
          AttachmentType: smartInfo.type,
          AttachmentCategory: smartInfo.category,
          IsMainImage: false,
          IsPublic: true,
          file: file,
          preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
          isNew: true,
        };

        setAttachments((prev) => [...prev, newAttachment]);

        // Show helpful toast about auto-categorization
        toast.success(`${file.name} categorized as ${smartInfo.type} - ${smartInfo.category}`);
      };

      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast.error(`Failed to read file: ${file.name}`);
      };

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

  // Quick update attachment inline
  const updateAttachmentInline = (index: number, field: keyof AttachmentFormData, value: any) => {
    setAttachments((prev) => prev.map((att, i) => (i === index ? { ...att, [field]: value } : att)));
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

  // Get filtered doc types based on attachment type
  const getFilteredDocTypes = (attachmentType: AttachmentFormData["AttachmentType"]) => {
    // This would be based on your actual doc type structure
    // Return doc types that are relevant to the attachment type
    return docTypes.filter((dt) => {
      // Implement filtering logic based on your doc type structure
      // For now, return all doc types
      return true;
    });
  };

  // Bulk actions for attachments
  const bulkSetDocType = (docTypeId: number, attachmentType?: AttachmentFormData["AttachmentType"]) => {
    setAttachments((prev) => prev.map((att) => (!attachmentType || att.AttachmentType === attachmentType ? { ...att, DocTypeID: docTypeId } : att)));
  };

  // Handle form submission
  const onSubmit = async (data: PropertyFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    // Validate that all attachments have doc types
    const attachmentsWithoutType = attachments.filter((att) => att.isNew && (!att.DocTypeID || att.DocTypeID === 0));
    if (attachmentsWithoutType.length > 0) {
      toast.error(`Please select document types for ${attachmentsWithoutType.length} attachment(s)`);
      setActiveTab("images"); // Switch to images tab to show the issue
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

      // Prepare attachments data
      const attachmentsData: NewPropertyAttachment[] = attachments
        .filter((att) => att.isNew && att.DocTypeID > 0)
        .map((att) => ({
          DocTypeID: att.DocTypeID,
          DocumentName: att.DocumentName,
          FileContent: att.FileContent,
          FileContentType: att.FileContentType,
          FileSize: att.FileSize,
          AttachmentType: att.AttachmentType || "Other",
          AttachmentCategory: att.AttachmentCategory || "Other",
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
    form.setValue("CityID", "");
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

  const imageAttachments = attachments.filter((att) => att.AttachmentType === "Image" || att.AttachmentType === "Blueprint" || att.FileContentType?.startsWith("image/"));

  const documentAttachments = attachments.filter((att) => !["Image", "Blueprint"].includes(att.AttachmentType || "") && !att.FileContentType?.startsWith("image/"));

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
                    <TabsTrigger value="images" className="relative">
                      Images & Plans ({imageAttachments.length})
                      {imageAttachments.some((att) => att.isNew && (!att.DocTypeID || att.DocTypeID === 0)) && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="relative">
                      Documents ({documentAttachments.length})
                      {documentAttachments.some((att) => att.isNew && (!att.DocTypeID || att.DocTypeID === 0)) && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Basic Information Tab - Same as before */}
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

                {/* Property Details Tab - Same as before */}
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

                {/* Enhanced Images Tab */}
                <TabsContent value="images" className="p-6 pt-4 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Images & Visual Content</h3>
                      <div className="flex space-x-2">
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

                    {imageAttachments.length > 0 && (
                      <div className="bg-muted/20 rounded-lg p-4 space-y-3">
                        <h4 className="text-sm font-medium">Quick Actions</h4>
                        <div className="flex flex-wrap gap-2">
                          <Select onValueChange={(value) => bulkSetDocType(parseInt(value), "Image")}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Set all images type" />
                            </SelectTrigger>
                            <SelectContent>
                              {docTypes
                                .filter((dt) => dt.Description.toLowerCase().includes("image") || dt.Description.toLowerCase().includes("photo"))
                                .map((docType) => (
                                  <SelectItem key={docType.DocTypeID} value={docType.DocTypeID.toString()}>
                                    {docType.Description}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Select onValueChange={(value) => bulkSetDocType(parseInt(value), "Blueprint")}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Set all plans type" />
                            </SelectTrigger>
                            <SelectContent>
                              {docTypes
                                .filter((dt) => dt.Description.toLowerCase().includes("plan") || dt.Description.toLowerCase().includes("blueprint"))
                                .map((docType) => (
                                  <SelectItem key={docType.DocTypeID} value={docType.DocTypeID.toString()}>
                                    {docType.Description}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {imageAttachments.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <FileImage className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No images uploaded yet. Files will be automatically categorized when uploaded.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {imageAttachments.map((attachment, index) => (
                          <div key={index} className="border rounded-lg overflow-hidden space-y-3 p-3">
                            <div className="relative group">
                              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
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
                                  <Settings className="h-3 w-3" />
                                </Button>
                                <Button type="button" size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={() => deleteAttachment(index)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-sm font-medium truncate">{attachment.DocumentName}</p>

                              <div className="flex flex-wrap gap-1">
                                <Badge variant={attachment.AttachmentType === "Image" ? "default" : "secondary"} className="text-xs">
                                  {attachment.AttachmentType}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {attachment.AttachmentCategory}
                                </Badge>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">Document Type</Label>
                                <Select value={attachment.DocTypeID?.toString() || "0"} onValueChange={(value) => updateAttachmentInline(index, "DocTypeID", parseInt(value))}>
                                  <SelectTrigger className={`h-8 ${!attachment.DocTypeID || attachment.DocTypeID === 0 ? "border-red-300" : ""}`}>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getFilteredDocTypes(attachment.AttachmentType).map((docType) => (
                                      <SelectItem key={docType.DocTypeID} value={docType.DocTypeID.toString()}>
                                        {docType.Description}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {(!attachment.DocTypeID || attachment.DocTypeID === 0) && <p className="text-xs text-red-500">Document type is required</p>}
                              </div>

                              <div className="flex items-center justify-between">
                                <Button type="button" size="sm" variant="outline" onClick={() => setMainImage(index)} disabled={attachment.IsMainImage}>
                                  {attachment.IsMainImage ? "Main Image" : "Set as Main"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Enhanced Documents Tab */}
                <TabsContent value="documents" className="p-6 pt-4 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Documents & Files</h3>
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

                    {documentAttachments.length > 0 && (
                      <div className="bg-muted/20 rounded-lg p-4 space-y-3">
                        <h4 className="text-sm font-medium">Quick Actions</h4>
                        <div className="flex flex-wrap gap-2">
                          <Select onValueChange={(value) => bulkSetDocType(parseInt(value), "Document")}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Set all documents type" />
                            </SelectTrigger>
                            <SelectContent>
                              {docTypes
                                .filter((dt) => dt.Description.toLowerCase().includes("document") || dt.Description.toLowerCase().includes("certificate"))
                                .map((docType) => (
                                  <SelectItem key={docType.DocTypeID} value={docType.DocTypeID.toString()}>
                                    {docType.Description}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {documentAttachments.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No documents uploaded yet. Files will be automatically categorized when uploaded.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {documentAttachments.map((attachment, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center space-x-2">
                                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{attachment.DocumentName}</span>
                                  <Badge variant={attachment.AttachmentType === "Certificate" ? "default" : "secondary"} className="text-xs">
                                    {attachment.AttachmentType}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {attachment.AttachmentCategory}
                                  </Badge>
                                </div>

                                <div className="text-sm text-muted-foreground">Size: {((attachment.FileSize || 0) / 1024).toFixed(1)} KB</div>

                                <div className="max-w-xs">
                                  <Label className="text-xs">Document Type</Label>
                                  <Select value={attachment.DocTypeID?.toString() || "0"} onValueChange={(value) => updateAttachmentInline(index, "DocTypeID", parseInt(value))}>
                                    <SelectTrigger className={`h-8 mt-1 ${!attachment.DocTypeID || attachment.DocTypeID === 0 ? "border-red-300" : ""}`}>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getFilteredDocTypes(attachment.AttachmentType).map((docType) => (
                                        <SelectItem key={docType.DocTypeID} value={docType.DocTypeID.toString()}>
                                          {docType.Description}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {(!attachment.DocTypeID || attachment.DocTypeID === 0) && <p className="text-xs text-red-500 mt-1">Document type is required</p>}
                                </div>
                              </div>

                              <div className="flex space-x-2">
                                <Button type="button" size="sm" variant="outline" onClick={() => openAttachmentDialog(attachment)}>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Details
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

      {/* Enhanced Attachment Details Dialog */}
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

// Enhanced Attachment Details Form Component
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
    AttachmentType: attachment.AttachmentType || "Other",
    AttachmentCategory: attachment.AttachmentCategory || "Other",
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

  const isImage = ["Image", "Blueprint"].includes(formData.AttachmentType) || attachment.FileContentType?.startsWith("image/");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="attachmentType">Attachment Type</Label>
          <Select value={formData.AttachmentType} onValueChange={(value: AttachmentFormData["AttachmentType"]) => setFormData((prev) => ({ ...prev, AttachmentType: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Image">Image</SelectItem>
              <SelectItem value="Document">Document</SelectItem>
              <SelectItem value="Blueprint">Blueprint</SelectItem>
              <SelectItem value="Certificate">Certificate</SelectItem>
              <SelectItem value="Video">Video</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="attachmentCategory">Category</Label>
          <Select
            value={formData.AttachmentCategory}
            onValueChange={(value: AttachmentFormData["AttachmentCategory"]) => setFormData((prev) => ({ ...prev, AttachmentCategory: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Primary">Primary</SelectItem>
              <SelectItem value="Gallery">Gallery</SelectItem>
              <SelectItem value="Floor Plan">Floor Plan</SelectItem>
              <SelectItem value="Legal">Legal</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Construction">Construction</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
