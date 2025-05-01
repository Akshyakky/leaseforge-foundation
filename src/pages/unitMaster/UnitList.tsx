// src/pages/UnitMaster/UnitList.tsx
import { useState } from "react";
import { UnitListProps } from "./types";
import { UNIT_STATUS_OPTIONS } from "./constants";
import { Eye, Edit, Trash2, MoreHorizontal, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const UnitList: React.FC<UnitListProps> = ({ units, isLoading, onEdit, onView, onDelete, onStatusChange }) => {
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
            <TableHead>Unit No</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Floor</TableHead>
            <TableHead>Bedrooms</TableHead>
            <TableHead>Area (sqft)</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit) => (
            <TableRow key={unit.UnitID}>
              <TableCell className="font-medium">{unit.UnitNo}</TableCell>
              <TableCell>{unit.PropertyName}</TableCell>
              <TableCell>{unit.UnitTypeName}</TableCell>
              <TableCell>{unit.FloorName}</TableCell>
              <TableCell>{unit.BedRooms || "N/A"}</TableCell>
              <TableCell>{unit.TotalAreaSqft ? unit.TotalAreaSqft.toLocaleString() : "N/A"}</TableCell>
              <TableCell>{unit.ListingPrice ? `$${unit.ListingPrice.toLocaleString()}` : "N/A"}</TableCell>
              <TableCell>
                <Popover>
                  <PopoverTrigger asChild>
                    <div>
                      {statusUpdating === unit.UnitID ? (
                        <div className="flex items-center">
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                          <span>Updating...</span>
                        </div>
                      ) : (
                        <Badge variant={getStatusBadgeVariant(unit.UnitStatus || "")}>{unit.UnitStatus}</Badge>
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
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(unit.UnitID)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(unit.UnitID)} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
