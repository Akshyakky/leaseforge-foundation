// src/pages/UnitMaster/UnitMasterPage.tsx
import { useState, useEffect } from "react";
import { unitService } from "../../services/unitService";
import { Unit, UnitContact } from "../../services/unitService";
import { UnitSearchFilters, FormMode } from "./types";
import { toast } from "sonner";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Plus, ArrowLeft, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UnitSearchFilter } from "./UnitSearchFilter";
import { UnitList } from "./UnitList";
import { UnitDetails } from "./UnitDetails";
import { UnitForm } from "./UnitForm";

enum ViewMode {
  LIST,
  DETAILS,
  CREATE,
  EDIT,
}

interface LocationState {
  fromDetails?: boolean;
}

export const UnitMasterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unitId } = useParams<{ unitId: string }>();
  const state = location.state as LocationState;

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [unitContacts, setUnitContacts] = useState<UnitContact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dropdownData, setDropdownData] = useState({
    properties: [],
    unitTypes: [],
    unitCategories: [],
    floors: [],
    bedrooms: [],
    bathrooms: [],
    communities: [],
    unitClasses: [],
  });

  // Initialize view mode based on route parameters
  useEffect(() => {
    if (unitId) {
      const id = parseInt(unitId);
      if (!isNaN(id)) {
        if (location.pathname.includes("/edit")) {
          setViewMode(ViewMode.EDIT);
          fetchUnitDetails(id);
        } else {
          setViewMode(ViewMode.DETAILS);
          fetchUnitDetails(id);
        }
      }
    } else {
      if (location.pathname.includes("/create")) {
        setViewMode(ViewMode.CREATE);
      } else {
        setViewMode(ViewMode.LIST);
        fetchUnits();
      }
    }
  }, [unitId, location.pathname]);

  // Load dropdown data for forms
  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      // In a real implementation, these would be actual service calls
      // For now, we're mocking them with empty arrays
      setDropdownData({
        properties: [],
        unitTypes: [],
        unitCategories: [],
        floors: [],
        bedrooms: [],
        bathrooms: [],
        communities: [],
        unitClasses: [],
      });
    } catch (error) {
      toast.error("Failed to load form data");
    }
  };

  const fetchUnits = async () => {
    setIsLoading(true);
    try {
      const data = await unitService.getAllUnits();
      setUnits(data);
    } catch (error) {
      toast.error("Failed to load units");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnitDetails = async (id: number) => {
    setIsLoading(true);
    try {
      const { unit, contacts } = await unitService.getUnitById(id);
      setSelectedUnit(unit);
      setUnitContacts(contacts);
    } catch (error) {
      toast.error("Failed to load unit details");
      navigateToList();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (filters: UnitSearchFilters) => {
    setIsLoading(true);
    try {
      const data = await unitService.searchUnits(filters);
      setUnits(data);
    } catch (error) {
      toast.error("Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (unitId: number, status: string) => {
    try {
      const success = await unitService.updateUnitStatus(unitId, status);
      if (success) {
        // Update the unit in the list
        setUnits(units.map((unit) => (unit.UnitID === unitId ? { ...unit, UnitStatus: status } : unit)));
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleSave = async (unitData: Partial<Unit>, contacts: Partial<UnitContact>[]) => {
    setIsLoading(true);
    try {
      if (viewMode === ViewMode.CREATE) {
        const newUnitId = await unitService.createUnit(unitData, contacts);
        if (newUnitId) {
          toast.success("Unit created successfully");
          navigateToList();
        }
      } else if (viewMode === ViewMode.EDIT && selectedUnit) {
        const success = await unitService.updateUnit({ ...unitData, UnitID: selectedUnit.UnitID }, contacts);
        if (success) {
          toast.success("Unit updated successfully");
          navigateToList();
        }
      }
    } catch (error) {
      toast.error("Save failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (unitId: number) => {
    if (window.confirm("Are you sure you want to delete this unit?")) {
      try {
        const success = await unitService.deleteUnit(unitId);
        if (success) {
          toast.success("Unit deleted successfully");
          fetchUnits();
        }
      } catch (error) {
        toast.error("Delete failed");
      }
    }
  };

  const navigateToList = () => {
    navigate("/units");
    setViewMode(ViewMode.LIST);
  };

  const navigateToDetails = (unitId: number) => {
    navigate(`/units/${unitId}`);
    setViewMode(ViewMode.DETAILS);
  };

  const navigateToEdit = (unitId: number) => {
    navigate(`/units/${unitId}/edit`);
    setViewMode(ViewMode.EDIT);
  };

  const navigateToCreate = () => {
    navigate("/units/create");
    setViewMode(ViewMode.CREATE);
  };

  const navigateToSettings = () => {
    navigate("/units/settings");
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-bold">
            {viewMode === ViewMode.LIST && "Unit Master"}
            {viewMode === ViewMode.DETAILS && "Unit Details"}
            {viewMode === ViewMode.CREATE && "Create Unit"}
            {viewMode === ViewMode.EDIT && "Edit Unit"}
          </CardTitle>
          <div className="flex space-x-2">
            {viewMode === ViewMode.LIST && (
              <>
                {/* Only show settings button for admin/manager roles */}
                {(userRoles.includes("admin") || userRoles.includes("manager")) && (
                  <Button variant="outline" onClick={navigateToSettings}>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Button>
                )}
                <Button onClick={navigateToCreate}>
                  <Plus className="mr-2 h-4 w-4" /> Add Unit
                </Button>
              </>
            )}
            {viewMode === ViewMode.DETAILS && (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={navigateToList}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={() => navigateToEdit(parseInt(unitId || "0"))}>Edit</Button>
              </div>
            )}
            {(viewMode === ViewMode.CREATE || viewMode === ViewMode.EDIT) && (
              <Button variant="outline" onClick={navigateToList}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === ViewMode.LIST && (
            <>
              <UnitSearchFilter onSearch={handleSearch} dropdownData={dropdownData} />
              <div className="mt-4">
                <UnitList units={units} isLoading={isLoading} onEdit={navigateToEdit} onView={navigateToDetails} onDelete={handleDelete} onStatusChange={handleStatusChange} />
              </div>
            </>
          )}

          {viewMode === ViewMode.DETAILS && (
            <UnitDetails unit={selectedUnit} contacts={unitContacts} isLoading={isLoading} onEdit={() => navigateToEdit(parseInt(unitId || "0"))} onBack={navigateToList} />
          )}

          {(viewMode === ViewMode.CREATE || viewMode === ViewMode.EDIT) && (
            <UnitForm
              unit={selectedUnit || undefined}
              mode={{
                isCreate: viewMode === ViewMode.CREATE,
                isEdit: viewMode === ViewMode.EDIT,
                isView: false,
              }}
              onSave={handleSave}
              onCancel={navigateToList}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
