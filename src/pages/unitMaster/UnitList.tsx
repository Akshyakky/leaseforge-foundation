// src/pages/UnitMaster/UnitList.tsx - Enhanced with Attachments Display
import { useState } from "react";
import { UnitListProps } from "./types";
import { UNIT_STATUS_OPTIONS } from "./constants";
import { Eye, Edit, Trash2, MoreHorizontal, CheckCircle2, Copy, FileImage, Paperclip, MapPin, Calendar, Home, HandCoins } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const UnitList: React.FC<UnitListProps> = ({ units, isLoading, onEdit, onView, onDelete, onStatusChange, onClone }) => {
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Available":
        return "default"; // green
      case "Reserved":
        return "secondary"; // purple
      case "Leased":
      case "Sold":
        return "outline"; // neutral
      case "Maintenance":
      case "NotAvailable":
        return "destructive"; // red
      default:
        return "default";
    }
  };

  const handleStatusChange = async (unitId: number, newStatus: string) => {
    setStatusUpdating(unitId);
    try {
      await onStatusChange(unitId, newStatus);
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleClone = (unitId: number) => {
    if (onClone) {
      onClone(unitId);
    }
  };

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format attachment counts for display
  const formatAttachmentInfo = (unit: any) => {
    const imageCount = unit.ImageCount || 0;
    const attachmentCount = unit.AttachmentCount || 0;
    const totalCount = unit.TotalAttachmentCount || 0;

    if (totalCount === 0) {
      return { text: "No attachments", icon: null, variant: "outline" as const };
    }

    if (imageCount > 0 && attachmentCount > 0) {
      return {
        text: `${imageCount} images, ${attachmentCount} docs`,
        icon: <FileImage className="h-3 w-3 mr-1" />,
        variant: "default" as const,
      };
    } else if (imageCount > 0) {
      return {
        text: `${imageCount} image${imageCount > 1 ? "s" : ""}`,
        icon: <FileImage className="h-3 w-3 mr-1" />,
        variant: "default" as const,
      };
    } else {
      return {
        text: `${attachmentCount} document${attachmentCount > 1 ? "s" : ""}`,
        icon: <Paperclip className="h-3 w-3 mr-1" />,
        variant: "secondary" as const,
      };
    }
  };

  // Format price display
  const formatPrice = (unit: any) => {
    if (unit.SalePrice) {
      return `$${unit.SalePrice.toLocaleString()} (Sale)`;
    }
    if (unit.ListingPrice) {
      return `$${unit.ListingPrice.toLocaleString()} (List)`;
    }
    if (unit.PerMonth) {
      return `$${unit.PerMonth.toLocaleString()}/mo`;
    }
    if (unit.PerYear) {
      return `$${unit.PerYear.toLocaleString()}/yr`;
    }
    return "N/A";
  };

  // Format area display
  const formatArea = (unit: any) => {
    if (unit.TotalAreaSqft) {
      return `${unit.TotalAreaSqft.toLocaleString()} sqft`;
    }
    if (unit.LivingAreaSqft) {
      return `${unit.LivingAreaSqft.toLocaleString()} sqft (Living)`;
    }
    return "N/A";
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading units...</div>;
  }

  if (units.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg">
        <p className="text-gray-500">No units found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Unit</TableHead>
            <TableHead>Property & Location</TableHead>
            <TableHead>Type & Configuration</TableHead>
            <TableHead>Area & Pricing</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Attachments</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit) => {
            const attachmentInfo = formatAttachmentInfo(unit);
            return (
              <TableRow key={unit.UnitID} className="hover:bg-muted/50">
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-base">{unit.UnitNo}</div>
                    <div className="text-sm text-muted-foreground">ID: {unit.UnitID}</div>
                    {unit.MainImageName && (
                      <div className="text-xs text-blue-600 flex items-center">
                        <FileImage className="h-3 w-3 mr-1" />
                        Main: {unit.MainImageName}
                      </div>
                    )}
                    {unit.UnitModel && <div className="text-xs text-muted-foreground">Model: {unit.UnitModel}</div>}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-2">
                    <div className="font-medium">{unit.PropertyName}</div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {[unit.CityName, unit.CountryName].filter(Boolean).join(", ") || "Location not specified"}
                    </div>
                    {unit.CommunityName && <div className="text-xs text-muted-foreground">Community: {unit.CommunityName}</div>}
                    {unit.FloorName && <div className="text-xs text-muted-foreground">Floor: {unit.FloorName}</div>}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-2">
                    <div className="font-medium">{unit.UnitTypeName}</div>
                    {unit.UnitCategoryName && (
                      <Badge variant="outline" className="text-xs">
                        {unit.UnitCategoryName}
                      </Badge>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {[unit.BedRooms && `${unit.BedRooms} Bed`, unit.BathRooms && `${unit.BathRooms} Bath`].filter(Boolean).join(" • ") || "Configuration not specified"}
                    </div>
                    {unit.UnitViewName && <div className="text-xs text-muted-foreground">View: {unit.UnitViewName}</div>}
                    {unit.UnitClassName && <div className="text-xs text-muted-foreground">Class: {unit.UnitClassName}</div>}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-2">
                    <div className="text-sm">{formatArea(unit)}</div>
                    <div className="font-medium flex items-center">
                      <HandCoins className="h-3 w-3 mr-1" />
                      {formatPrice(unit)}
                    </div>
                    {unit.UnitRate && <div className="text-xs text-muted-foreground">Rate: ${unit.UnitRate.toLocaleString()}/sqft</div>}
                  </div>
                </TableCell>

                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="cursor-pointer">
                        {statusUpdating === unit.UnitID ? (
                          <div className="flex items-center">
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                            <span className="text-sm">Updating...</span>
                          </div>
                        ) : (
                          <Badge variant={getStatusBadgeVariant(unit.UnitStatus || "")} className="cursor-pointer">
                            {unit.UnitStatus}
                          </Badge>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Change Status</div>
                        <Select value={unit.UnitStatus || ""} onValueChange={(value) => handleStatusChange(unit.UnitID, value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                <div className="flex items-center">
                                  {status.value === unit.UnitStatus && <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />}
                                  {status.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>

                <TableCell>
                  <Badge variant={attachmentInfo.variant} className="font-normal">
                    {attachmentInfo.icon}
                    {attachmentInfo.text}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(unit.UnitID)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(unit.UnitID)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Unit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleClone(unit.UnitID)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Clone Unit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(unit.UnitID)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Unit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
