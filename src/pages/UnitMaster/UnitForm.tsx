// src/pages/UnitMaster/UnitForm.tsx
import React, { useState, useEffect } from "react";
import { UnitFormProps } from "./types";
import { DEFAULT_FORM_VALUES, UNIT_STATUS_OPTIONS, UNIT_TABS, AREA_UNITS } from "./constants";
import { Unit, UnitContact } from "../../services/unitService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UnitContacts from "./UnitContacts";  // Updated import to default import
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const UnitForm: React.FC<UnitFormProps> = ({ unit, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Unit>>(unit || DEFAULT_FORM_VALUES);
  const [contacts, setContacts] = useState<UnitContact[]>([]);
  const [activeTab, setActiveTab] = useState(UNIT_TABS.GENERAL);
  const [readOnly, setReadOnly] = useState(false);

  useEffect(() => {
    if (unit) {
      setFormData(unit);
      setContacts(unit.contacts || []);
    } else {
      setFormData(DEFAULT_FORM_VALUES);
    }
    setReadOnly(mode.isView);
  }, [unit, mode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === "" ? undefined : parseFloat(value);
    setFormData({ ...formData, [name]: numValue });
  };

  const handleContactsChange = (newContacts: UnitContact[]) => {
    setContacts(newContacts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData, contacts);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value={UNIT_TABS.GENERAL}>General Information</TabsTrigger>
          <TabsTrigger value={UNIT_TABS.CONTACTS}>Contacts</TabsTrigger>
        </TabsList>
        <TabsContent value={UNIT_TABS.GENERAL}>
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">General Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="UnitNo">Unit Number</Label>
                  <Input type="text" id="UnitNo" name="UnitNo" value={formData.UnitNo || ""} onChange={handleInputChange} readOnly={readOnly} />
                </div>
                <div>
                  <Label htmlFor="PropertyID">Property</Label>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder={formData.PropertyName || "Select Property"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Property 1</SelectItem>
                      <SelectItem value="2">Property 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="UnitTypeID">Unit Type</Label>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder={formData.UnitTypeName || "Select Unit Type"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Apartment</SelectItem>
                      <SelectItem value="2">Condo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="UnitCategoryID">Unit Category</Label>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder={formData.UnitCategoryName || "Select Category"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Residential</SelectItem>
                      <SelectItem value="2">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="FloorID">Floor</Label>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder={formData.FloorName || "Select Floor"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Floor</SelectItem>
                      <SelectItem value="2">2nd Floor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="UnitStatus">Unit Status</Label>
                  <Select value={formData.UnitStatus || ""} onValueChange={(value) => handleSelectChange("UnitStatus", value)} disabled={readOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-4" />

              <h3 className="text-xl font-semibold mb-4">Area & Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="LivingAreaSqft">Living Area (sqft)</Label>
                  <Input type="number" id="LivingAreaSqft" name="LivingAreaSqft" value={formData.LivingAreaSqft || ""} onChange={handleNumericChange} readOnly={readOnly} />
                </div>
                <div>
                  <Label htmlFor="BalconyAreaSqft">Balcony Area (sqft)</Label>
                  <Input type="number" id="BalconyAreaSqft" name="BalconyAreaSqft" value={formData.BalconyAreaSqft || ""} onChange={handleNumericChange} readOnly={readOnly} />
                </div>
                <div>
                  <Label htmlFor="TereaceAreaSqft">Terrace Area (sqft)</Label>
                  <Input type="number" id="TereaceAreaSqft" name="TereaceAreaSqft" value={formData.TereaceAreaSqft || ""} onChange={handleNumericChange} readOnly={readOnly} />
                </div>
                <div>
                  <Label htmlFor="TotalAreaSqft">Total Area (sqft)</Label>
                  <Input type="number" id="TotalAreaSqft" name="TotalAreaSqft" value={formData.TotalAreaSqft || ""} onChange={handleNumericChange} readOnly={readOnly} />
                </div>
                <div>
                  <Label htmlFor="CountryID">Country</Label>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder={formData.CountryName || "Select Country"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">USA</SelectItem>
                      <SelectItem value="2">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="CityID">City</Label>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder={formData.CityName || "Select City"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">New York</SelectItem>
                      <SelectItem value="2">Los Angeles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-4" />

              <h3 className="text-xl font-semibold mb-4">Pricing & Payment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="UnitRate">Unit Rate</Label>
                  <Input type="number" id="UnitRate" name="UnitRate" value={formData.UnitRate || ""} onChange={handleNumericChange} readOnly={readOnly} />
                </div>
                <div>
                  <Label htmlFor="ListingPrice">Listing Price</Label>
                  <Input type="number" id="ListingPrice" name="ListingPrice" value={formData.ListingPrice || ""} onChange={handleNumericChange} readOnly={readOnly} />
                </div>
                <div>
                  <Label htmlFor="SalePrice">Sale Price</Label>
                  <Input type="number" id="SalePrice" name="SalePrice" value={formData.SalePrice || ""} onChange={handleNumericChange} readOnly={readOnly} />
                </div>
                <div>
                  <Label htmlFor="PerMonth">Monthly Rent</Label>
                  <Input type="number" id="PerMonth" name="PerMonth" value={formData.PerMonth || ""} onChange={handleNumericChange} readOnly={readOnly} />
                </div>
                <div>
                  <Label htmlFor="PerYear">Yearly Rent</Label>
                  <Input type="number" id="PerYear" name="PerYear" value={formData.PerYear || ""} onChange={handleNumericChange} readOnly={readOnly} />
                </div>
              </div>

              <Separator className="my-4" />

              <h3 className="text-xl font-semibold mb-4">Additional Information</h3>
              <div>
                <Label htmlFor="Remarks">Remarks</Label>
                <Textarea id="Remarks" name="Remarks" value={formData.Remarks || ""} onChange={handleInputChange} readOnly={readOnly} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value={UNIT_TABS.CONTACTS}>
          <UnitContacts unitId={unit?.UnitID || 0} contacts={contacts} onContactsChange={handleContactsChange} readOnly={readOnly} />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={readOnly}>
          Cancel
        </Button>
        {!readOnly && (
          <Button type="submit" disabled={readOnly}>
            Save
          </Button>
        )}
      </div>
    </form>
  );
};

export default UnitForm;
