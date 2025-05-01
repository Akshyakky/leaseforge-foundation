// src/pages/UnitMaster/UnitMasterSettingsPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { unitRelatedService } from "../../services/unitRelatedService";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  BathRoomSettings,
  BedRoomSettings,
  CommunitySettings,
  FloorSettings,
  UnitCategorySettings,
  UnitClassSettings,
  UnitStyleSettings,
  UnitTypeSettings,
  UnitViewSettings,
} from "./Settings";

export const UnitMasterSettingsPage = () => {
  const navigate = useNavigate();
  const { settingType } = useParams<{ settingType: string }>();
  const [activeTab, setActiveTab] = useState<string>(settingType || "unit-type");
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    if (settingType) {
      setActiveTab(settingType);
    }
  }, [settingType]);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const props = await unitRelatedService.getEntitiesForDropdown("Property");
      setProperties(props);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load properties. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToUnitMaster = () => {
    navigate("/units");
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/units/settings/${value}`);
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-bold">Unit Master Settings</CardTitle>
          <Button variant="outline" onClick={navigateToUnitMaster}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Unit Master
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 mb-8">
              <TabsTrigger value="unit-type">Unit Types</TabsTrigger>
              <TabsTrigger value="unit-category">Categories</TabsTrigger>
              <TabsTrigger value="unit-view">Views</TabsTrigger>
              <TabsTrigger value="floor">Floors</TabsTrigger>
              <TabsTrigger value="bedroom">Bedrooms</TabsTrigger>
              <TabsTrigger value="bathroom">Bathrooms</TabsTrigger>
              <TabsTrigger value="unit-class">Classes</TabsTrigger>
              <TabsTrigger value="unit-style">Styles</TabsTrigger>
              <TabsTrigger value="community">Communities</TabsTrigger>
            </TabsList>

            <TabsContent value="unit-type">
              <UnitTypeSettings />
            </TabsContent>

            <TabsContent value="unit-category">
              <UnitCategorySettings />
            </TabsContent>

            <TabsContent value="unit-view">
              <UnitViewSettings />
            </TabsContent>

            <TabsContent value="floor">
              <FloorSettings properties={properties} isLoadingProperties={isLoading} />
            </TabsContent>

            <TabsContent value="bedroom">
              <BedRoomSettings />
            </TabsContent>

            <TabsContent value="bathroom">
              <BathRoomSettings />
            </TabsContent>

            <TabsContent value="unit-class">
              <UnitClassSettings />
            </TabsContent>

            <TabsContent value="unit-style">
              <UnitStyleSettings />
            </TabsContent>

            <TabsContent value="community">
              <CommunitySettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
