// src/pages/UnitMaster/UnitMasterPage.tsx
import { useState, useEffect } from "react";
import { unitService } from "../../services/unitService";
import { Unit, UnitContact } from "../../services/unitService";
import { UnitSearchFilters, FormMode } from "./types";
import { toast } from "sonner";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Plus, ArrowLeft, Settings, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UnitSearchFilter } from "./UnitSearchFilter";
import { UnitList } from "./UnitList";
import { UnitDetails } from "./UnitDetails";
import { UnitForm } from "./UnitForm";
import { useAppSelector } from "@/lib/hooks";

enum ViewMode {
  LIST,
  DETAILS,
  CREATE,
  EDIT,
  CLONE,
}

interface LocationState {
  fromDetails?: boolean;
}

export const UnitMasterPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const { unitId, sourceUnitId } = useParams<{ unitId: string; sourceUnitId: string }>();
  const state = location.state as LocationState;

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [sourceUnit, setSourceUnit] = useState<Unit | null>(null); // Unit to clone from
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
    } else if (sourceUnitId) {
      // Clone mode - load source unit data
      const id = parseInt(sourceUnitId);
      if (!isNaN(id)) {
        setViewMode(ViewMode.CLONE);
        fetchSourceUnitForCloning(id);
      }
    } else {
      if (location.pathname.includes("/create")) {
        setViewMode(ViewMode.CREATE);
      } else {
        setViewMode(ViewMode.LIST);
        fetchUnits();
      }
    }
  }, [unitId, sourceUnitId, location.pathname]);

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

  const fetchSourceUnitForCloning = async (id: number) => {
    setIsLoading(true);
    try {
      const { unit, contacts } = await unitService.getUnitById(id);
      if (unit) {
        setSourceUnit(unit);
        // Optionally load contacts for cloning reference
        setUnitContacts(contacts);
        toast.success(`Cloning from unit: ${unit.UnitNo}`);
      } else {
        toast.error("Source unit not found");
        navigateToList();
      }
    } catch (error) {
      toast.error("Failed to load source unit for cloning");
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
      if (viewMode === ViewMode.CREATE || viewMode === ViewMode.CLONE) {
        // For clone mode, ensure we're creating a new unit
        const dataToSave =
          viewMode === ViewMode.CLONE
            ? { ...unitData, UnitID: undefined } // Remove ID to ensure new creation
            : unitData;

        const newUnitId = await unitService.createUnit(dataToSave, contacts);
        if (newUnitId) {
          const successMessage = viewMode === ViewMode.CLONE ? `Unit cloned successfully (New Unit ID: ${newUnitId})` : "Unit created successfully";
          toast.success(successMessage);
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
      const errorMessage = viewMode === ViewMode.CLONE ? "Clone operation failed" : "Save failed";
      toast.error(errorMessage);
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

  const navigateToClone = (sourceUnitId: number) => {
    navigate(`/units/clone/${sourceUnitId}`);
    setViewMode(ViewMode.CLONE);
  };

  const navigateToSettings = () => {
    navigate("/units/settings");
  };

  const handleCloneFromDetails = () => {
    if (selectedUnit) {
      navigateToClone(selectedUnit.UnitID);
    }
  };

  const getFormMode = (): FormMode => {
    return {
      isCreate: viewMode === ViewMode.CREATE,
      isEdit: viewMode === ViewMode.EDIT,
      isView: viewMode === ViewMode.DETAILS,
      isClone: viewMode === ViewMode.CLONE,
    };
  };

  const getPageTitle = (): string => {
    switch (viewMode) {
      case ViewMode.LIST:
        return "Unit Master";
      case ViewMode.DETAILS:
        return "Unit Details";
      case ViewMode.CREATE:
        return "Create Unit";
      case ViewMode.EDIT:
        return "Edit Unit";
      case ViewMode.CLONE:
        return "Clone Unit";
      default:
        return "Unit Master";
    }
  };

  return (
    <div className="mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-bold flex items-center">
            {viewMode === ViewMode.CLONE && <Copy className="mr-2 h-6 w-6 text-blue-600" />}
            {getPageTitle()}
          </CardTitle>
          <div className="flex space-x-2">
            {viewMode === ViewMode.LIST && (
              <>
                {/* Only show settings button for admin/manager roles */}
                {user && (user.role === "admin" || user.role === "manager" || user.roleName === "admin" || user.roleName === "manager") && (
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
                <Button variant="outline" onClick={handleCloneFromDetails}>
                  <Copy className="mr-2 h-4 w-4" /> Clone
                </Button>
                <Button onClick={() => navigateToEdit(parseInt(unitId || "0"))}>Edit</Button>
              </div>
            )}
            {(viewMode === ViewMode.CREATE || viewMode === ViewMode.EDIT || viewMode === ViewMode.CLONE) && (
              <Button variant="outline" onClick={navigateToList}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Clone Mode Information Alert */}
          {viewMode === ViewMode.CLONE && sourceUnit && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <Copy className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Cloning Unit:</strong> {sourceUnit.UnitNo} from {sourceUnit.PropertyName}. Modify the information below as needed and save to create a new unit.
              </AlertDescription>
            </Alert>
          )}

          {viewMode === ViewMode.LIST && (
            <>
              <UnitSearchFilter onSearch={handleSearch} dropdownData={dropdownData} />
              <div className="mt-4">
                <UnitList
                  units={units}
                  isLoading={isLoading}
                  onEdit={navigateToEdit}
                  onView={navigateToDetails}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onClone={navigateToClone}
                />
              </div>
            </>
          )}

          {viewMode === ViewMode.DETAILS && (
            <UnitDetails
              unit={selectedUnit}
              contacts={unitContacts}
              isLoading={isLoading}
              onEdit={() => navigateToEdit(parseInt(unitId || "0"))}
              onBack={navigateToList}
              onClone={handleCloneFromDetails}
            />
          )}

          {(viewMode === ViewMode.CREATE || viewMode === ViewMode.EDIT || viewMode === ViewMode.CLONE) && (
            <UnitForm
              unit={viewMode === ViewMode.EDIT ? selectedUnit || undefined : undefined}
              sourceUnit={viewMode === ViewMode.CLONE ? sourceUnit || undefined : undefined}
              mode={getFormMode()}
              onSave={handleSave}
              onCancel={navigateToList}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
