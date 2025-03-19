import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MoreHorizontal, Search, PlusCircle, Layers, LayoutList } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CostCenter1, CostCenter2, CostCenter3, CostCenter4 } from "@/types/costCenterTypes";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { useAppSelector } from "@/lib/hooks";
import { costCenterService } from "@/services/costCenterService";

const CostCentersList = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("level1");
  const [searchTerm, setSearchTerm] = useState("");
  const [costCenters1, setCostCenters1] = useState<CostCenter1[]>([]);
  const [costCenters2, setCostCenters2] = useState<CostCenter2[]>([]);
  const [costCenters3, setCostCenters3] = useState<CostCenter3[]>([]);
  const [costCenters4, setCostCenters4] = useState<CostCenter4[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCostCenter, setSelectedCostCenter] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Selected parent IDs for filtering
  const [selectedParents, setSelectedParents] = useState<{
    CostCenter1ID?: number;
    CostCenter2ID?: number;
    CostCenter3ID?: number;
  }>({});

  const navigate = useNavigate();

  // Initialize and fetch data
  useEffect(() => {
    fetchCostCenters();
  }, []);

  // Handle tab change
  useEffect(() => {
    const level = parseInt(activeTab.replace("level", ""));
    setSelectedLevel(level);

    if (level === 1) {
      setSelectedParents({});
    }

    // Reset search when changing tabs
    setSearchTerm("");
    fetchCostCentersByLevel(level);
  }, [activeTab]);

  // Fetch all cost centers based on level
  const fetchCostCenters = async () => {
    try {
      setLoading(true);
      await fetchCostCentersByLevel(1);
    } catch (error) {
      console.error("Error fetching cost centers:", error);
      toast.error("Failed to fetch cost centers");
    } finally {
      setLoading(false);
    }
  };

  // Fetch cost centers by level with optional search and parent filter
  const fetchCostCentersByLevel = async (level: number, search?: string, parents?: any) => {
    try {
      setLoading(true);

      // Use provided parents or fall back to current selected parents
      const parentFilter = parents || selectedParents;

      let data: any[] = [];

      if (search) {
        data = await costCenterService.searchCostCenters(level, search, parentFilter);
      } else {
        data = await costCenterService.getCostCentersByLevel(level, parentFilter);
      }

      // Update the appropriate state based on level
      switch (level) {
        case 1:
          setCostCenters1(data as CostCenter1[]);
          break;
        case 2:
          setCostCenters2(data as CostCenter2[]);
          break;
        case 3:
          setCostCenters3(data as CostCenter3[]);
          break;
        case 4:
          setCostCenters4(data as CostCenter4[]);
          break;
      }
    } catch (error) {
      console.error(`Error fetching level ${level} cost centers:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Create debounced search function
  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      fetchCostCentersByLevel(selectedLevel, value);
    }
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Navigate to add new cost center
  const handleAddCostCenter = () => {
    const queryParams = new URLSearchParams();
    queryParams.append("level", selectedLevel.toString());

    // Add parent IDs to query params if applicable
    if (selectedParents.CostCenter1ID && selectedLevel > 1) {
      queryParams.append("parent1", selectedParents.CostCenter1ID.toString());
    }
    if (selectedParents.CostCenter2ID && selectedLevel > 2) {
      queryParams.append("parent2", selectedParents.CostCenter2ID.toString());
    }
    if (selectedParents.CostCenter3ID && selectedLevel > 3) {
      queryParams.append("parent3", selectedParents.CostCenter3ID.toString());
    }

    navigate(`/cost-centers/new?${queryParams.toString()}`);
  };

  // Navigate to edit cost center
  const handleEditCostCenter = (level: number, id: number) => {
    navigate(`/cost-centers/edit/${level}/${id}`);
  };

  // Navigate to view children of a cost center
  const handleViewChildren = (level: number, costCenter: any) => {
    if (level >= 4) return; // Level 4 has no children

    // Update selectedParents based on the level
    const newParents = { ...selectedParents };

    switch (level) {
      case 1:
        newParents.CostCenter1ID = costCenter.CostCenter1ID;
        newParents.CostCenter2ID = undefined;
        newParents.CostCenter3ID = undefined;
        break;
      case 2:
        newParents.CostCenter2ID = costCenter.CostCenter2ID;
        newParents.CostCenter3ID = undefined;
        break;
      case 3:
        newParents.CostCenter3ID = costCenter.CostCenter3ID;
        break;
    }

    setSelectedParents(newParents);
    setActiveTab(`level${level + 1}`);
    fetchCostCentersByLevel(level + 1, undefined, newParents);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (level: number, costCenter: any) => {
    setSelectedLevel(level);
    setSelectedCostCenter(costCenter);
    setIsDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedCostCenter(null);
  };

  // Delete the selected cost center
  const handleDeleteCostCenter = async () => {
    if (!selectedCostCenter || !user) return;

    try {
      const success = await costCenterService.deleteCostCenter(selectedLevel, selectedCostCenter[`CostCenter${selectedLevel}ID`], user.name || "System");

      if (success.Status === 1) {
        // Refresh the list
        fetchCostCentersByLevel(selectedLevel);
        toast.success(success.Message);
      } else {
        toast.error(success.Message);
      }
    } catch (error) {
      console.error("Error deleting cost center:", error);
      toast.error("Failed to delete cost center");
    } finally {
      closeDeleteDialog();
    }
  };

  // Get breadcrumbs for navigation context
  const getBreadcrumbs = () => {
    const crumbs = [];

    if (selectedParents.CostCenter1ID && selectedLevel > 1) {
      const parent = costCenters1.find((cc) => cc.CostCenter1ID === selectedParents.CostCenter1ID);
      if (parent) {
        crumbs.push({
          level: 1,
          id: parent.CostCenter1ID,
          description: parent.Description,
        });
      }
    }

    if (selectedParents.CostCenter2ID && selectedLevel > 2) {
      const parent = costCenters2.find((cc) => cc.CostCenter2ID === selectedParents.CostCenter2ID);
      if (parent) {
        crumbs.push({
          level: 2,
          id: parent.CostCenter2ID,
          description: parent.Description,
        });
      }
    }

    if (selectedParents.CostCenter3ID && selectedLevel > 3) {
      const parent = costCenters3.find((cc) => cc.CostCenter3ID === selectedParents.CostCenter3ID);
      if (parent) {
        crumbs.push({
          level: 3,
          id: parent.CostCenter3ID,
          description: parent.Description,
        });
      }
    }

    return crumbs;
  };

  // Navigate back to parent level
  const handleNavigateToLevel = (level: number, id?: number) => {
    if (level === 1) {
      setSelectedParents({});
    } else if (level === 2) {
      setSelectedParents({
        CostCenter1ID: selectedParents.CostCenter1ID,
      });
    } else if (level === 3) {
      setSelectedParents({
        CostCenter1ID: selectedParents.CostCenter1ID,
        CostCenter2ID: selectedParents.CostCenter2ID,
      });
    }

    setActiveTab(`level${level}`);
    fetchCostCentersByLevel(level);
  };

  // View hierarchy of all cost centers
  const handleViewHierarchy = () => {
    navigate("/cost-centers/hierarchy");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Cost Centers</h1>
          {selectedLevel > 1 && (
            <div className="flex items-center text-sm text-muted-foreground mt-1 space-x-1">
              <button onClick={() => handleNavigateToLevel(1)} className="hover:underline">
                All
              </button>
              {getBreadcrumbs().map((crumb, index) => (
                <React.Fragment key={`${crumb.level}-${crumb.id}`}>
                  <span>/</span>
                  <button onClick={() => handleNavigateToLevel(crumb.level)} className="hover:underline max-w-xs truncate">
                    {crumb.description}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleViewHierarchy}>
            <Layers className="mr-2 h-4 w-4" />
            View Hierarchy
          </Button>
          <Button onClick={handleAddCostCenter}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Cost Center
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Cost Center Management</CardTitle>
          <CardDescription>Manage your organization's cost centers and hierarchy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search cost centers..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
          </div>

          <Tabs defaultValue="level1" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="level1">Level 1</TabsTrigger>
              <TabsTrigger value="level2" disabled={selectedLevel === 2 && !selectedParents.CostCenter1ID}>
                Level 2
              </TabsTrigger>
              <TabsTrigger value="level3" disabled={selectedLevel === 3 && !selectedParents.CostCenter2ID}>
                Level 3
              </TabsTrigger>
              <TabsTrigger value="level4" disabled={selectedLevel === 4 && !selectedParents.CostCenter3ID}>
                Level 4
              </TabsTrigger>
            </TabsList>

            {/* Level 1 Cost Centers */}
            <TabsContent value="level1">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : costCenters1.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">{searchTerm ? "No cost centers found matching your search." : "No cost centers found."}</div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Created On</TableHead>
                        <TableHead>Updated By</TableHead>
                        <TableHead>Updated On</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costCenters1.map((costCenter) => (
                        <TableRow key={costCenter.CostCenter1ID}>
                          <TableCell className="font-medium">{costCenter.Description}</TableCell>
                          <TableCell>{costCenter.CreatedBy || "N/A"}</TableCell>
                          <TableCell>{costCenter.CreatedOn ? new Date(costCenter.CreatedOn).toLocaleDateString() : "N/A"}</TableCell>
                          <TableCell>{costCenter.UpdatedBy || "N/A"}</TableCell>
                          <TableCell>{costCenter.UpdatedOn ? new Date(costCenter.UpdatedOn).toLocaleDateString() : "N/A"}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditCostCenter(1, costCenter.CostCenter1ID)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewChildren(1, costCenter)}>
                                  <LayoutList className="mr-2 h-4 w-4" />
                                  View sub-levels
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(1, costCenter)}>
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
              )}
            </TabsContent>

            {/* Level 2 Cost Centers */}
            <TabsContent value="level2">
              {selectedParents.CostCenter1ID ? (
                loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : costCenters2.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">{searchTerm ? "No cost centers found matching your search." : "No cost centers found."}</div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Parent</TableHead>
                          <TableHead>Created By</TableHead>
                          <TableHead>Created On</TableHead>
                          <TableHead>Updated By</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costCenters2.map((costCenter) => (
                          <TableRow key={costCenter.CostCenter2ID}>
                            <TableCell className="font-medium">{costCenter.Description}</TableCell>
                            <TableCell>{costCenter.ParentDescription}</TableCell>
                            <TableCell>{costCenter.CreatedBy || "N/A"}</TableCell>
                            <TableCell>{costCenter.CreatedOn ? new Date(costCenter.CreatedOn).toLocaleDateString() : "N/A"}</TableCell>
                            <TableCell>{costCenter.UpdatedBy || "N/A"}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditCostCenter(2, costCenter.CostCenter2ID)}>Edit</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleViewChildren(2, costCenter)}>
                                    <LayoutList className="mr-2 h-4 w-4" />
                                    View sub-levels
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(2, costCenter)}>
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
                )
              ) : (
                <div className="text-center py-10 text-muted-foreground">Please select a Level 1 cost center first</div>
              )}
            </TabsContent>

            {/* Level 3 Cost Centers */}
            <TabsContent value="level3">
              {selectedParents.CostCenter2ID ? (
                loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : costCenters3.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">{searchTerm ? "No cost centers found matching your search." : "No cost centers found."}</div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Level 1</TableHead>
                          <TableHead>Level 2</TableHead>
                          <TableHead>Created By</TableHead>
                          <TableHead>Created On</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costCenters3.map((costCenter) => (
                          <TableRow key={costCenter.CostCenter3ID}>
                            <TableCell className="font-medium">{costCenter.Description}</TableCell>
                            <TableCell>{costCenter.Level1Description}</TableCell>
                            <TableCell>{costCenter.Level2Description}</TableCell>
                            <TableCell>{costCenter.CreatedBy || "N/A"}</TableCell>
                            <TableCell>{costCenter.CreatedOn ? new Date(costCenter.CreatedOn).toLocaleDateString() : "N/A"}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditCostCenter(3, costCenter.CostCenter3ID)}>Edit</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleViewChildren(3, costCenter)}>
                                    <LayoutList className="mr-2 h-4 w-4" />
                                    View sub-levels
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(3, costCenter)}>
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
                )
              ) : (
                <div className="text-center py-10 text-muted-foreground">Please select a Level 2 cost center first</div>
              )}
            </TabsContent>

            {/* Level 4 Cost Centers */}
            <TabsContent value="level4">
              {selectedParents.CostCenter3ID ? (
                loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : costCenters4.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">{searchTerm ? "No cost centers found matching your search." : "No cost centers found."}</div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Level 1</TableHead>
                          <TableHead>Level 2</TableHead>
                          <TableHead>Level 3</TableHead>
                          <TableHead>Created By</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costCenters4.map((costCenter) => (
                          <TableRow key={costCenter.CostCenter4ID}>
                            <TableCell className="font-medium">{costCenter.Description}</TableCell>
                            <TableCell>{costCenter.Level1Description}</TableCell>
                            <TableCell>{costCenter.Level2Description}</TableCell>
                            <TableCell>{costCenter.Level3Description}</TableCell>
                            <TableCell>{costCenter.CreatedBy || "N/A"}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditCostCenter(4, costCenter.CostCenter4ID)}>Edit</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(4, costCenter)}>
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
                )
              ) : (
                <div className="text-center py-10 text-muted-foreground">Please select a Level 3 cost center first</div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteCostCenter}
        title="Delete Cost Center"
        description={
          selectedCostCenter
            ? `Are you sure you want to delete the cost center "${selectedCostCenter.Description}"? This action cannot be undone and will remove all related data.`
            : "Are you sure you want to delete this cost center?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default CostCentersList;
