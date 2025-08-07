// src/pages/UnitMaster/UnitForm.tsx - Enhanced with Attachments Support
import { useState, useEffect } from "react";
import { UnitFormProps, ContactRow } from "./types";
import { Unit, UnitContact, UnitAttachment } from "../../services/unitService";
import { Property } from "../../services/propertyService";
import { DocType } from "../../services/docTypeService";
import { DEFAULT_FORM_VALUES, UNIT_STATUS_OPTIONS, UNIT_TABS } from "./constants";
import { UnitContacts } from "./UnitContacts";
import { Home, Users, Save, RotateCcw, HandCoins, Info, Building2, Copy, Upload, X, FileImage, Paperclip, Star, Eye, Trash2, Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { unitDropdownService } from "../../services/unitDropdownService";
import { propertyService } from "../../services/propertyService";
import { unitService } from "../../services/unitService";
import { docTypeService } from "../../services/docTypeService";
import { cityService, countryService } from "@/services";

// Enhanced UNIT_TABS to include attachments
const ENHANCED_UNIT_TABS = {
  ...UNIT_TABS,
  ATTACHMENTS: "attachments",
};

export const transformNullValues = (obj: any): any => {
  if (obj === null) return undefined;
  if (obj === undefined) return undefined;

  if (Array.isArray(obj)) {
    return obj.map(transformNullValues);
  }

  if (typeof obj === "object" && obj !== null) {
    const transformed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === null) {
        transformed[key] = undefined;
      } else if (typeof value === "string" && value.trim() === "") {
        transformed[key] = undefined;
      } else if (typeof value === "object") {
        transformed[key] = transformNullValues(value);
      } else {
        transformed[key] = value;
      }
    }
    return transformed;
  }

  return obj;
};

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

// Enhanced attachment interface with form data
interface AttachmentFormData extends Omit<UnitAttachment, "UnitID" | "UnitAttachmentID"> {
  file?: File;
  preview?: string;
  isNew?: boolean;
  AttachmentType?: "Image" | "Document" | "Blueprint" | "Certificate" | "Video" | "Other";
  AttachmentCategory?: "Primary" | "Gallery" | "Floor Plan" | "Legal" | "Marketing" | "Construction" | "Other";
}

// Property Summary Interface
interface PropertySummary {
  property: Property | null;
  existingUnits: Unit[];
  totalUnits: number;
  availableUnits: number;
  occupiedUnits: number;
  nextSuggestedUnitNo: string;
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
      return { type: "Blueprint", category: "Floor Plan", suggestedDocTypes: [1, 2] };
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
  const clonedData = transformNullValues({ ...sourceUnit });

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
  const [activeTab, setActiveTab] = useState(ENHANCED_UNIT_TABS.GENERAL);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [attachments, setAttachments] = useState<AttachmentFormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPropertyLoading, setIsPropertyLoading] = useState(false);
  const [cities, setCities] = useState<{ CityID: number; CityName: string }[]>([]);
  const [propertySummary, setPropertySummary] = useState<PropertySummary | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<AttachmentFormData | null>(null);
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
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
      return createClonedUnitData(sourceUnit) as UnitFormValues;
    } else if (mode.isEdit && unit) {
      return { ...DEFAULT_FORM_VALUES, ...unit } as UnitFormValues;
    } else {
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
    const getFormValues = (): UnitFormValues => {
      if (mode.isClone && sourceUnit) {
        const clonedData = createClonedUnitData(sourceUnit);
        return { ...DEFAULT_FORM_VALUES, ...clonedData } as UnitFormValues;
      } else if (mode.isEdit && unit) {
        const transformedUnit = transformNullValues(unit);
        return { ...DEFAULT_FORM_VALUES, ...transformedUnit } as UnitFormValues;
      } else {
        return DEFAULT_FORM_VALUES as UnitFormValues;
      }
    };

    const formValues = getFormValues();
    form.reset(formValues);
  }, [unit, sourceUnit, mode.isEdit, mode.isCreate, mode.isClone, form]);

  // Load dropdown data and initialize attachments
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [allDropdowns, countries, docTypesData] = await Promise.all([
          unitDropdownService.getAllDropdownData(),
          countryService.getCountriesForDropdown(),
          docTypeService.getAllDocTypes(),
        ]);

        setDropdownData({
          ...allDropdowns,
          countries,
          cities: [],
        });
        setDocTypes(docTypesData);

        // Load existing attachments if editing
        if (mode.isEdit && unit?.UnitID) {
          const existingAttachments = await unitService.getUnitAttachments(unit.UnitID);
          setAttachments(
            existingAttachments.map((att) => ({
              ...att,
              AttachmentType: (att.AttachmentType as AttachmentFormData["AttachmentType"]) || "Other",
              AttachmentCategory: (att.AttachmentCategory as AttachmentFormData["AttachmentCategory"]) || "Other",
              isNew: false,
            }))
          );
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast({
          title: "Error",
          description: "Failed to load form data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [mode.isEdit, unit]);

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
          DocTypeID: suggestedDocType,
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

        toast({
          title: "File uploaded",
          description: `${file.name} categorized as ${smartInfo.type} - ${smartInfo.category}`,
        });
      };

      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast({
          title: "Error",
          description: `Failed to read file: ${file.name}`,
          variant: "destructive",
        });
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
    return docTypes.filter((dt) => {
      // Implement filtering logic based on your doc type structure
      return true;
    });
  };

  // Bulk actions for attachments
  const bulkSetDocType = (docTypeId: number, attachmentType?: AttachmentFormData["AttachmentType"]) => {
    setAttachments((prev) => prev.map((att) => (!attachmentType || att.AttachmentType === attachmentType ? { ...att, DocTypeID: docTypeId } : att)));
  };

  // Enhanced property selection handler
  const handlePropertyChange = async (propertyId: number) => {
    form.setValue("PropertyID", propertyId);

    if (propertyId > 0) {
      setIsPropertyLoading(true);

      try {
        const [propertyDetails, existingUnits, floors] = await Promise.all([
          propertyService.getPropertyById(propertyId),
          unitService.getUnitsByProperty(propertyId),
          unitDropdownService.getFloors(propertyId),
        ]);

        setDropdownData((prev) => ({
          ...prev,
          floors,
        }));

        if (propertyDetails) {
          if (!mode.isClone || (mode.isClone && sourceUnit && sourceUnit.PropertyID === propertyId)) {
            if (propertyDetails.property.CountryID) {
              form.setValue("CountryID", propertyDetails.property.CountryID);

              const cityResponse = await cityService.getCitiesByCountry(propertyDetails.property.CountryID);
              setCities(cityResponse);

              setTimeout(() => {
                if (propertyDetails.property.CityID) {
                  form.setValue("CityID", propertyDetails.property.CityID);
                }
              }, 100);
            }

            if (propertyDetails.property.CommunityID) {
              form.setValue("CommunityID", propertyDetails.property.CommunityID);
            }
          }

          const totalUnits = existingUnits.length;
          const availableUnits = existingUnits.filter((unit) => unit.UnitStatus === "Available").length;
          const occupiedUnits = totalUnits - availableUnits;

          const nextSuggestedUnitNo = generateNextUnitNumber(existingUnits, propertyDetails.property);

          setPropertySummary({
            property: propertyDetails.property,
            existingUnits,
            totalUnits,
            availableUnits,
            occupiedUnits,
            nextSuggestedUnitNo,
          });

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

  // Enhanced Lease Information Calculations
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type !== "change") return;

      const monthlyRent = value.PerMonth || 0;
      const yearlyRent = value.PerYear || 0;
      const installments = value.NoOfInstallmentLease || 0;

      switch (name) {
        case "PerMonth":
          if (monthlyRent > 0 && installments > 0) {
            const calculatedYearly = parseFloat((monthlyRent * installments).toFixed(2));
            form.setValue("PerYear", calculatedYearly, { shouldValidate: false });
          } else if (monthlyRent > 0 && installments === 0) {
            form.setValue("NoOfInstallmentLease", 12, { shouldValidate: false });
            form.setValue("PerYear", parseFloat((monthlyRent * 12).toFixed(2)), { shouldValidate: false });
          } else if (monthlyRent === 0) {
            form.setValue("PerYear", undefined, { shouldValidate: false });
          }
          break;

        case "PerYear":
          if (yearlyRent > 0 && installments > 0) {
            const calculatedMonthly = parseFloat((yearlyRent / installments).toFixed(2));
            form.setValue("PerMonth", calculatedMonthly, { shouldValidate: false });
          } else if (yearlyRent > 0 && installments === 0) {
            form.setValue("NoOfInstallmentLease", 12, { shouldValidate: false });
            form.setValue("PerMonth", parseFloat((yearlyRent / 12).toFixed(2)), { shouldValidate: false });
          } else if (yearlyRent === 0) {
            form.setValue("PerMonth", undefined, { shouldValidate: false });
          }
          break;

        case "NoOfInstallmentLease":
          if (installments > 0) {
            if (monthlyRent > 0) {
              const calculatedYearly = parseFloat((monthlyRent * installments).toFixed(2));
              form.setValue("PerYear", calculatedYearly, { shouldValidate: false });
            } else if (yearlyRent > 0) {
              const calculatedMonthly = parseFloat((yearlyRent / installments).toFixed(2));
              form.setValue("PerMonth", calculatedMonthly, { shouldValidate: false });
            }
          }
          break;

        default:
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const handleContactsChange = (updatedContacts: UnitContact[]) => {
    setContacts(updatedContacts as ContactRow[]);
  };

  const handleReset = () => {
    const defaultValues = getDefaultValues();
    form.reset(defaultValues);
    setContacts([]);
    setAttachments([]);
    setPropertySummary(null);
  };

  const handleSubmit = async (data: UnitFormValues) => {
    // Clean the data before submission
    const cleanedData = transformNullValues(data);

    // Convert undefined numeric values to null for database compatibility
    const preparedData = Object.entries(cleanedData).reduce((acc, [key, value]) => {
      if (value === undefined && typeof value !== "string") {
        acc[key] = null;
      } else if (value === "" && key !== "UnitNo") {
        acc[key] = null;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    // Validate that all new attachments have doc types
    const attachmentsWithoutType = attachments.filter((att) => att.isNew && (!att.DocTypeID || att.DocTypeID === 0));
    if (attachmentsWithoutType.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please select document types for ${attachmentsWithoutType.length} attachment(s)`,
        variant: "destructive",
      });
      setActiveTab(ENHANCED_UNIT_TABS.ATTACHMENTS);
      return;
    }

    // Prepare attachments data
    const attachmentsData: Partial<UnitAttachment>[] = attachments
      .filter((att) => att.isNew && att.DocTypeID && att.DocTypeID > 0)
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

    await onSave(preparedData, contacts);
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

  const imageAttachments = attachments.filter((att) => att.AttachmentType === "Image" || att.AttachmentType === "Blueprint" || att.FileContentType?.startsWith("image/"));

  const documentAttachments = attachments.filter((att) => !["Image", "Blueprint"].includes(att.AttachmentType || "") && !att.FileContentType?.startsWith("image/"));

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
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value={ENHANCED_UNIT_TABS.GENERAL}>
              <Home className="mr-2 h-4 w-4" />
              General Information
            </TabsTrigger>
            <TabsTrigger value={ENHANCED_UNIT_TABS.PRICING}>
              <HandCoins className="mr-2 h-4 w-4" />
              Pricing & Payment
            </TabsTrigger>
            <TabsTrigger value={ENHANCED_UNIT_TABS.ATTACHMENTS} className="relative">
              <FileImage className="mr-2 h-4 w-4" />
              Images & Documents ({attachments.length})
              {attachments.some((att) => att.isNew && (!att.DocTypeID || att.DocTypeID === 0)) && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value={ENHANCED_UNIT_TABS.CONTACTS}>
              <Users className="mr-2 h-4 w-4" />
              Contacts ({contacts.length})
            </TabsTrigger>
          </TabsList>

          {/* General Information Tab - Same as before */}
          <TabsContent value={ENHANCED_UNIT_TABS.GENERAL}>
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

                  <Alert className="mt-4 border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Lease Calculation Logic:</strong>
                      <br />• Monthly Rent × Number of Installments = Yearly Rent
                      <br />• Entering any two values will automatically calculate the third
                      <br />• Default installments will be set to 12 if not specified
                    </AlertDescription>
                  </Alert>
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
          {/* Enhanced Attachments Tab */}
          <TabsContent value={ENHANCED_UNIT_TABS.ATTACHMENTS}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Images Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <FileImage className="mr-2 h-5 w-5 text-muted-foreground" />
                        Images & Plans ({imageAttachments.length})
                      </span>
                      <div>
                        <Input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" id="image-upload" />
                        <Label htmlFor="image-upload">
                          <Button type="button" variant="outline" size="sm" className="cursor-pointer" asChild>
                            <span>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Images
                            </span>
                          </Button>
                        </Label>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {imageAttachments.length > 0 && (
                      <div className="bg-muted/20 rounded-lg p-4 space-y-3 mb-4">
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
                        </div>
                      </div>
                    )}

                    {imageAttachments.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <FileImage className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No images uploaded yet. Files will be automatically categorized when uploaded.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </CardContent>
                </Card>

                {/* Documents Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Paperclip className="mr-2 h-5 w-5 text-muted-foreground" />
                        Documents & Files ({documentAttachments.length})
                      </span>
                      <div>
                        <Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" multiple onChange={handleFileUpload} className="hidden" id="document-upload" />
                        <Label htmlFor="document-upload">
                          <Button type="button" variant="outline" size="sm" className="cursor-pointer" asChild>
                            <span>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Documents
                            </span>
                          </Button>
                        </Label>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value={ENHANCED_UNIT_TABS.CONTACTS}>
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
    </Form>
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
                DocIssueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
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
                DocExpiryDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
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
