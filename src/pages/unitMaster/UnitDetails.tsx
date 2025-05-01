// src/pages/UnitMaster/UnitDetails.tsx
import { useState } from "react";
import { UnitDetailsProps } from "./types";
import { UNIT_TABS } from "./constants";
import { Home, Users, Calendar, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const UnitDetails: React.FC<UnitDetailsProps> = ({ unit, contacts, isLoading }) => {
  const [activeTab, setActiveTab] = useState(UNIT_TABS.GENERAL);

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading unit details...</div>;
  }

  if (!unit) {
    return <div className="text-center py-8">Unit not found or has been deleted.</div>;
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800";
      case "Reserved":
        return "bg-purple-100 text-purple-800";
      case "Leased":
        return "bg-blue-100 text-blue-800";
      case "Sold":
        return "bg-gray-100 text-gray-800";
      case "Maintenance":
      case "NotAvailable":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">
              Unit {unit.UnitNo}
              {unit.PropertyName && ` - ${unit.PropertyName}`}
            </h2>
            <p className="text-gray-500">{[unit.UnitTypeName, unit.BedRooms && `${unit.BedRooms} Bed`, unit.BathRooms && `${unit.BathRooms} Bath`].filter(Boolean).join(" • ")}</p>
          </div>
          {unit.UnitStatus && <Badge className={getStatusColor(unit.UnitStatus)}>{unit.UnitStatus}</Badge>}
        </div>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Unit Information</h3>
                <div className="space-y-4">
                  <DetailRow label="Unit Number" value={unit.UnitNo} />
                  <DetailRow label="Property" value={unit.PropertyName} />
                  <DetailRow label="Type" value={unit.UnitTypeName} />
                  <DetailRow label="Category" value={unit.UnitCategoryName} />
                  <DetailRow label="View" value={unit.UnitViewName} />
                  <DetailRow label="Floor" value={unit.FloorName} />
                  <DetailRow label="Class" value={unit.UnitClassName} />
                  <DetailRow label="Status" value={unit.UnitStatus} />
                  <DetailRow label="Model" value={unit.UnitModel} />
                  <DetailRow label="Style" value={unit.UnitStyleName} />
                  <DetailRow label="Community" value={unit.CommunityName} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Area & Location</h3>
                <div className="space-y-4">
                  <DetailRow
                    label="Living Area"
                    value={unit.LivingAreaSqft ? `${unit.LivingAreaSqft.toLocaleString()} sqft / ${unit.LivingAreaSqftMtr?.toLocaleString() || "-"} sqm` : undefined}
                  />
                  <DetailRow
                    label="Balcony Area"
                    value={unit.BalconyAreaSqft ? `${unit.BalconyAreaSqft.toLocaleString()} sqft / ${unit.BalconyAreaSqftMtr?.toLocaleString() || "-"} sqm` : undefined}
                  />
                  <DetailRow
                    label="Terrace Area"
                    value={unit.TereaceAreaSqft ? `${unit.TereaceAreaSqft.toLocaleString()} sqft / ${unit.TereaceAreaSqftMtr?.toLocaleString() || "-"} sqm` : undefined}
                  />
                  <DetailRow
                    label="Total Area"
                    value={unit.TotalAreaSqft ? `${unit.TotalAreaSqft.toLocaleString()} sqft / ${unit.TotalAreaSqftMtr?.toLocaleString() || "-"} sqm` : undefined}
                  />
                  <Separator className="my-4" />
                  <DetailRow label="Country" value={unit.CountryName} />
                  <DetailRow label="City" value={unit.CityName} />
                  <DetailRow label="Block" value={unit.Block?.toString()} />
                  <DetailRow label="Sector" value={unit.Sector?.toString()} />
                  <DetailRow label="Municipality No." value={unit.MuncipalyNo?.toString()} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Financial Details
                </h3>
                <div className="space-y-4">
                  <DetailRow label="Unit Rate" value={unit.UnitRate ? `$${unit.UnitRate.toLocaleString()} per sqft` : undefined} />
                  <DetailRow label="Listing Price" value={unit.ListingPrice ? `$${unit.ListingPrice.toLocaleString()}` : undefined} />
                  <DetailRow label="Sale Price" value={unit.SalePrice ? `$${unit.SalePrice.toLocaleString()}` : undefined} />
                  <Separator className="my-4" />
                  <DetailRow label="Monthly Rent" value={unit.PerMonth ? `$${unit.PerMonth.toLocaleString()}/month` : undefined} />
                  <DetailRow label="Yearly Rent" value={unit.PerYear ? `$${unit.PerYear.toLocaleString()}/year` : undefined} />
                  <DetailRow label="Lease Installments" value={unit.NoOfInstallmentLease?.toString()} />
                  <DetailRow label="Sale Installments" value={unit.NoOfInstallmentSale?.toString()} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Additional Information
                </h3>
                <div className="space-y-4">
                  {unit.Remarks ? (
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Remarks</div>
                      <div className="text-sm">{unit.Remarks}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No additional information available.</div>
                  )}
                  <Separator className="my-4" />
                  <DetailRow label="Created By" value={unit.CreatedBy} />
                  <DetailRow label="Created On" value={unit.CreatedOn ? new Date(unit.CreatedOn).toLocaleString() : undefined} />
                  {unit.UpdatedBy && (
                    <>
                      <DetailRow label="Updated By" value={unit.UpdatedBy} />
                      <DetailRow label="Updated On" value={unit.UpdatedOn ? new Date(unit.UpdatedOn).toLocaleString() : undefined} />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value={UNIT_TABS.CONTACTS}>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Unit Contacts</h3>

              {contacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No contacts associated with this unit.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Contact Type</th>
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Remarks</th>
                        <th className="text-left p-3">Created On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((contact) => (
                        <tr key={contact.UnitContactID} className="border-b hover:bg-gray-50">
                          <td className="p-3">{contact.ContactTypeName}</td>
                          <td className="p-3 font-medium">{contact.ContactName}</td>
                          <td className="p-3">{contact.Remarks || "-"}</td>
                          <td className="p-3 text-sm text-gray-500">{contact.CreatedOn ? new Date(contact.CreatedOn).toLocaleDateString() : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface DetailRowProps {
  label: string;
  value?: string | null;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => {
  if (!value) return null;

  return (
    <div>
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
};
