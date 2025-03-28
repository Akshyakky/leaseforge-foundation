// src/pages/UnitMaster/UnitDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { unitService } from "../../services/unitService";
import { unitDropdownService } from "../../services/unitDropdownService";
import { UnitStatistics } from "./UnitStatistics";
import { Unit } from "../../services/unitService";
import { Plus, LayoutDashboard, ListFilter, Home, CircleDollarSign, Map, Clock, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const UnitDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [recentUnits, setRecentUnits] = useState<Unit[]>([]);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardTab, setDashboardTab] = useState("overview");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // Fetch properties for the statistics component
      const propertiesData = await unitDropdownService.getProperties();
      setProperties(propertiesData);

      // Fetch recent units (we'll use search with no filters as a mock)
      const units = await unitService.getAllUnits();

      // Sort units by created date descending to get recent ones
      const sortedUnits = [...units].sort((a, b) => {
        const dateA = a.CreatedOn ? new Date(a.CreatedOn).getTime() : 0;
        const dateB = b.CreatedOn ? new Date(b.CreatedOn).getTime() : 0;
        return dateB - dateA;
      });

      setRecentUnits(sortedUnits.slice(0, 5)); // Take first 5 units

      // Get available units
      const availableUnitsData = await unitService.getUnitsByStatus("Available");
      setAvailableUnits(availableUnitsData.slice(0, 5)); // Take first 5 units
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToCreate = () => {
    navigate("/units/create");
  };

  const navigateToUnitDetails = (unitId: number) => {
    navigate(`/units/${unitId}`);
  };

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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Unit Management Dashboard</h1>
          <p className="text-gray-500">Manage and track property units</p>
        </div>
        <Button onClick={navigateToCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Unit
        </Button>
      </div>

      <Tabs value={dashboardTab} onValueChange={setDashboardTab}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="overview">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard Overview
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <ListFilter className="mr-2 h-4 w-4" />
            Unit Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Quick Stat Cards */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <div className="h-8 w-16 animate-pulse bg-gray-200 rounded"></div> : recentUnits.length + availableUnits.length}
                </div>
                <p className="text-xs text-muted-foreground">Across all properties</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Available Units</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? <div className="h-8 w-16 animate-pulse bg-gray-200 rounded"></div> : availableUnits.length}</div>
                <p className="text-xs text-muted-foreground">Ready for sale or lease</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Map className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? <div className="h-8 w-16 animate-pulse bg-gray-200 rounded"></div> : properties.length}</div>
                <p className="text-xs text-muted-foreground">With active units</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? <div className="h-8 w-16 animate-pulse bg-gray-200 rounded"></div> : recentUnits.length}</div>
                <p className="text-xs text-muted-foreground">Units added recently</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recently Added Units */}
            <Card>
              <CardHeader>
                <CardTitle>Recently Added Units</CardTitle>
                <CardDescription>The latest units added to the system</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="h-16 w-full animate-pulse bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : recentUnits.length > 0 ? (
                  <div className="space-y-4">
                    {recentUnits.map((unit) => (
                      <div
                        key={unit.UnitID}
                        className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigateToUnitDetails(unit.UnitID)}
                      >
                        <div>
                          <div className="font-medium">
                            {unit.UnitNo} - {unit.PropertyName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {[unit.UnitTypeName, unit.BedRooms && `${unit.BedRooms} Bed`, unit.BathRooms && `${unit.BathRooms} Bath`].filter(Boolean).join(" • ")}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {unit.UnitStatus && <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(unit.UnitStatus)}`}>{unit.UnitStatus}</span>}
                          <span className="text-sm font-medium">{unit.ListingPrice ? `$${unit.ListingPrice.toLocaleString()}` : "-"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No recent units found.</div>
                )}
              </CardContent>
            </Card>

            {/* Available Units */}
            <Card>
              <CardHeader>
                <CardTitle>Available Units</CardTitle>
                <CardDescription>Units currently available for sale or lease</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="h-16 w-full animate-pulse bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : availableUnits.length > 0 ? (
                  <div className="space-y-4">
                    {availableUnits.map((unit) => (
                      <div
                        key={unit.UnitID}
                        className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigateToUnitDetails(unit.UnitID)}
                      >
                        <div>
                          <div className="font-medium">
                            {unit.UnitNo} - {unit.PropertyName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {[
                              unit.UnitTypeName,
                              unit.BedRooms && `${unit.BedRooms} Bed`,
                              unit.BathRooms && `${unit.BathRooms} Bath`,
                              unit.TotalAreaSqft && `${unit.TotalAreaSqft.toLocaleString()} sqft`,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {unit.PerMonth ? (
                            <div className="flex items-center">
                              <CircleDollarSign className="h-4 w-4 mr-1 text-green-600" />
                              <span className="text-sm font-medium">${unit.PerMonth.toLocaleString()}/mo</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <CircleDollarSign className="h-4 w-4 mr-1 text-green-600" />
                              <span className="text-sm font-medium">${unit.ListingPrice ? unit.ListingPrice.toLocaleString() : "-"}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No available units found.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="statistics">
          <UnitStatistics properties={properties} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
