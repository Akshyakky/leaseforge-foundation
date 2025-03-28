// src/pages/UnitMaster/UnitSearchFilter.tsx
import { useState } from "react";
import { UnitSearchFilterProps, UnitSearchFilters } from "./types";
import { UNIT_STATUS_OPTIONS } from "./constants";
import { Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const UnitSearchFilter: React.FC<UnitSearchFilterProps> = ({ onSearch, dropdownData }) => {
  const [filters, setFilters] = useState<UnitSearchFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (value === "") {
      // Remove the filter if empty selection
      const newFilters = { ...filters };
      delete newFilters[name as keyof UnitSearchFilters];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [name]: value });
    }
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === "" ? undefined : parseFloat(value);
    setFilters({ ...filters, [name]: numValue });
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({});
    onSearch({});
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
            <div className="flex-1">
              <Input placeholder="Search by unit no, property name..." name="searchText" value={filters.searchText || ""} onChange={handleInputChange} className="w-full" />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSearch} className="w-full md:w-auto">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button variant="outline" onClick={handleReset} className="w-full md:w-auto">
                Reset
              </Button>
              <Button variant="ghost" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                {showAdvancedFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>
          </div>

          {showAdvancedFilters && (
            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="main-filters">
                <AccordionTrigger>Main Filters</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="text-sm font-medium">Property</label>
                      <Select value={filters.propertyId?.toString() || ""} onValueChange={(value) => handleSelectChange("propertyId", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Property" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">All Properties</SelectItem>
                          {dropdownData.properties.map((property) => (
                            <SelectItem key={property.PropertyID} value={property.PropertyID.toString()}>
                              {property.PropertyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Unit Type</label>
                      <Select value={filters.unitTypeId?.toString() || ""} onValueChange={(value) => handleSelectChange("unitTypeId", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Unit Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">All Unit Types</SelectItem>
                          {dropdownData.unitTypes.map((type) => (
                            <SelectItem key={type.UnitTypeID} value={type.UnitTypeID.toString()}>
                              {type.UnitTypeName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select value={filters.unitStatus || ""} onValueChange={(value) => handleSelectChange("unitStatus", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">All Statuses</SelectItem>
                          {UNIT_STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Bedrooms</label>
                      <Select value={filters.bedRoomId?.toString() || ""} onValueChange={(value) => handleSelectChange("bedRoomId", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Bedrooms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">All Bedroom Types</SelectItem>
                          {dropdownData.bedrooms.map((bedroom) => (
                            <SelectItem key={bedroom.BedRoomID} value={bedroom.BedRoomID.toString()}>
                              {bedroom.BedRoomCount} {bedroom.BedRoomCount === 1 ? "Bedroom" : "Bedrooms"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Bathrooms</label>
                      <Select value={filters.bathRoomId?.toString() || ""} onValueChange={(value) => handleSelectChange("bathRoomId", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Bathrooms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">All Bathroom Types</SelectItem>
                          {dropdownData.bathrooms.map((bathroom) => (
                            <SelectItem key={bathroom.BathRoomID} value={bathroom.BathRoomID.toString()}>
                              {bathroom.BathRoomCount} {bathroom.BathRoomCount === 1 ? "Bathroom" : "Bathrooms"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="price-area-filters">
                <AccordionTrigger>Price & Area Filters</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div>
                      <label className="text-sm font-medium">Min Price</label>
                      <Input type="number" name="minPrice" value={filters.minPrice || ""} onChange={handleNumericChange} placeholder="Min Price" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Max Price</label>
                      <Input type="number" name="maxPrice" value={filters.maxPrice || ""} onChange={handleNumericChange} placeholder="Max Price" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Min Area (sqft)</label>
                      <Input type="number" name="minArea" value={filters.minArea || ""} onChange={handleNumericChange} placeholder="Min Area" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Max Area (sqft)</label>
                      <Input type="number" name="maxArea" value={filters.maxArea || ""} onChange={handleNumericChange} placeholder="Max Area" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="more-filters">
                <AccordionTrigger>Additional Filters</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="text-sm font-medium">Unit Category</label>
                      <Select value={filters.unitCategoryId?.toString() || ""} onValueChange={(value) => handleSelectChange("unitCategoryId", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">All Categories</SelectItem>
                          {dropdownData.unitCategories.map((category) => (
                            <SelectItem key={category.UnitCategoryID} value={category.UnitCategoryID.toString()}>
                              {category.UnitCategoryName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Floor</label>
                      <Select value={filters.floorId?.toString() || ""} onValueChange={(value) => handleSelectChange("floorId", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Floor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">All Floors</SelectItem>
                          {dropdownData.floors.map((floor) => (
                            <SelectItem key={floor.FloorID} value={floor.FloorID.toString()}>
                              {floor.FloorName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Community</label>
                      <Select value={filters.communityId?.toString() || ""} onValueChange={(value) => handleSelectChange("communityId", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Community" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">All Communities</SelectItem>
                          {dropdownData.communities.map((community) => (
                            <SelectItem key={community.CommunityID} value={community.CommunityID.toString()}>
                              {community.CommunityName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
