// src/pages/UnitMaster/UnitStatistics.tsx
import { useState, useEffect } from "react";
import { unitService } from "../../services/unitService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Home, BarChart3, PieChart as PieChartIcon, ListFilter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UnitStatisticsProps {
  properties: { PropertyID: number; PropertyName: string }[];
}

export const UnitStatistics: React.FC<UnitStatisticsProps> = ({ properties }) => {
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [statistics, setStatistics] = useState<{
    statusCounts: any[];
    typeCounts: any[];
    bedroomCounts?: any[];
    propertyCounts?: any[];
  }>({
    statusCounts: [],
    typeCounts: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  // Define chart colors
  const STATUS_COLORS = [
    "#4CAF50", // Available - Green
    "#9C27B0", // Reserved - Purple
    "#2196F3", // Leased - Blue
    "#757575", // Sold - Gray
    "#F44336", // Maintenance/NotAvailable - Red
  ];

  const TYPE_COLORS = [
    "#3F51B5", // Primary
    "#00BCD4", // Cyan
    "#009688", // Teal
    "#FF9800", // Orange
    "#795548", // Brown
    "#9E9E9E", // Gray
  ];

  useEffect(() => {
    fetchStatistics();
  }, [selectedProperty]);

  const fetchStatistics = async () => {
    setIsLoading(true);
    try {
      const stats = await unitService.getUnitStatistics(selectedProperty || undefined);
      setStatistics(stats);
    } catch (error) {
      console.error("Failed to load unit statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertyChange = (value: string) => {
    setSelectedProperty(value ? parseInt(value, 10) : null);
  };

  // Format chart data
  const formatStatusData = (data: any[]) => {
    // Sort by count descending
    return [...data]
      .sort((a, b) => b.UnitCount - a.UnitCount)
      .map((item) => ({
        name: item.UnitStatus,
        value: item.UnitCount,
      }));
  };

  const formatTypeData = (data: any[]) => {
    // Sort by count descending
    return [...data]
      .sort((a, b) => b.UnitCount - a.UnitCount)
      .map((item) => ({
        name: item.UnitTypeName,
        value: item.UnitCount,
      }));
  };

  const formatBedroomData = (data: any[] | undefined) => {
    if (!data) return [];
    // Sort by bedroom count ascending
    return [...data]
      .sort((a, b) => a.BedRooms - b.BedRooms)
      .map((item) => ({
        name: `${item.BedRooms} ${item.BedRooms === 1 ? "Bedroom" : "Bedrooms"}`,
        value: item.UnitCount,
      }));
  };

  const formatPropertyData = (data: any[] | undefined) => {
    if (!data) return [];
    // Sort by count descending
    return [...data]
      .sort((a, b) => b.UnitCount - a.UnitCount)
      .map((item) => ({
        name: item.PropertyName,
        value: item.UnitCount,
      }));
  };

  const pieStatusData = formatStatusData(statistics.statusCounts || []);
  const pieTypeData = formatTypeData(statistics.typeCounts || []);
  const barBedroomData = formatBedroomData(statistics.bedroomCounts);
  const barPropertyData = formatPropertyData(statistics.propertyCounts);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Unit Statistics Dashboard</h2>
          <p className="text-gray-500">Overview of unit distribution and status</p>
        </div>
        <div className="w-72">
          <Select onValueChange={handlePropertyChange} value={selectedProperty?.toString() || ""}>
            <SelectTrigger>
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All Properties</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.PropertyID} value={property.PropertyID.toString()}>
                  {property.PropertyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Unit Status Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <PieChartIcon className="h-5 w-5 mr-2 text-primary" />
                <CardTitle>Units by Status</CardTitle>
              </div>
              <CardDescription>Distribution of units by their current status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Units`, "Count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Unit Type Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <Home className="h-5 w-5 mr-2 text-primary" />
                <CardTitle>Units by Type</CardTitle>
              </div>
              <CardDescription>Distribution of units by property type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Units`, "Count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bedroom Distribution (for property filter) or Property Distribution (for all properties) */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                <CardTitle>{selectedProperty ? "Units by Bedroom Count" : "Units by Property"}</CardTitle>
              </div>
              <CardDescription>{selectedProperty ? "Distribution of units by number of bedrooms" : "Distribution of units across different properties"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedProperty ? barBedroomData : barPropertyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} Units`, "Count"]} />
                    <Legend />
                    <Bar dataKey="value" name="Units" fill="#3F51B5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <ListFilter className="h-5 w-5 mr-2 text-primary" />
                <CardTitle>Summary</CardTitle>
              </div>
              <CardDescription>Quick overview of unit statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statistics.statusCounts.map((status) => (
                  <div key={status.UnitStatus} className="border rounded-lg p-4">
                    <div className="text-sm text-gray-500">{status.UnitStatus}</div>
                    <div className="text-2xl font-bold mt-1">{status.UnitCount}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
