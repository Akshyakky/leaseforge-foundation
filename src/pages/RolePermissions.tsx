
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { roleService, Role } from '@/services/roleService';
import { userRightsService, UserRight } from '@/services/userRightsService';
import { menuService, MenuItem } from '@/services/menuService';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

interface Permission {
  menuID: number;
  menuName: string;
  subMenus: {
    subMenuID: number;
    subMenuName: string;
    rights: {
      canView: boolean;
      canAdd: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canExport: boolean;
      canPrint: boolean;
    };
  }[];
}

const RolePermissions = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalRights, setOriginalRights] = useState<UserRight[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        navigate('/roles');
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch role details
        const roleData = await roleService.getRoleById(parseInt(id));
        if (!roleData) {
          toast.error('Role not found');
          navigate('/roles');
          return;
        }
        setRole(roleData);
        
        // Fetch all menus and submenus
        const menuData = await menuService.getAllMenus();
        
        // Fetch current role permissions
        const rightsData = await userRightsService.getRoleRights(parseInt(id));
        setOriginalRights(rightsData);
        
        // Build permissions structure
        const permissionsData = buildPermissionsStructure(menuData, rightsData);
        setPermissions(permissionsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load permissions data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, navigate]);
  
  const buildPermissionsStructure = (menus: MenuItem[], rights: UserRight[]): Permission[] => {
    return menus.map(menu => {
      const menuPermission: Permission = {
        menuID: menu.menuID,
        menuName: menu.menuName,
        subMenus: []
      };
      
      if (menu.subMenus && menu.subMenus.length > 0) {
        menuPermission.subMenus = menu.subMenus.map(subMenu => {
          // Find existing rights for this submenu
          const existingRights = rights.find(r => 
            r.menuID === menu.menuID && r.subMenuID === subMenu.subMenuID
          );
          
          return {
            subMenuID: subMenu.subMenuID,
            subMenuName: subMenu.subMenuName,
            rights: {
              canView: existingRights?.canView || false,
              canAdd: existingRights?.canAdd || false,
              canEdit: existingRights?.canEdit || false,
              canDelete: existingRights?.canDelete || false,
              canExport: existingRights?.canExport || false,
              canPrint: existingRights?.canPrint || false
            }
          };
        });
      }
      
      return menuPermission;
    });
  };
  
  const handleTogglePermission = (
    menuIndex: number, 
    subMenuIndex: number, 
    permission: keyof Permission['subMenus'][0]['rights']
  ) => {
    setPermissions(prev => {
      const updated = [...prev];
      const currentValue = updated[menuIndex].subMenus[subMenuIndex].rights[permission];
      
      // If turning off view permission, turn off all other permissions
      if (permission === 'canView' && currentValue) {
        updated[menuIndex].subMenus[subMenuIndex].rights = {
          canView: false,
          canAdd: false,
          canEdit: false,
          canDelete: false,
          canExport: false,
          canPrint: false
        };
      } 
      // If turning on any other permission, make sure view is enabled
      else if (permission !== 'canView' && !currentValue) {
        updated[menuIndex].subMenus[subMenuIndex].rights[permission] = true;
        updated[menuIndex].subMenus[subMenuIndex].rights.canView = true;
      } 
      // Default toggle behavior
      else {
        updated[menuIndex].subMenus[subMenuIndex].rights[permission] = !currentValue;
      }
      
      return updated;
    });
  };
  
  const handleSavePermissions = async () => {
    if (!role) return;
    
    try {
      setSaving(true);
      
      // Convert permissions structure back to UserRight array
      const updatedRights: UserRight[] = [];
      
      permissions.forEach(menu => {
        menu.subMenus.forEach(subMenu => {
          // Only add rights if at least canView is true
          if (subMenu.rights.canView) {
            // Find existing right to preserve ID if exists
            const existingRight = originalRights.find(r => 
              r.menuID === menu.menuID && r.subMenuID === subMenu.subMenuID
            );
            
            updatedRights.push({
              userRightID: existingRight?.userRightID || 0,
              roleID: role.roleID,
              menuID: menu.menuID,
              subMenuID: subMenu.subMenuID,
              menuName: menu.menuName,
              subMenuName: subMenu.subMenuName,
              ...subMenu.rights
            });
          }
        });
      });
      
      const success = await userRightsService.saveRoleRights(role.roleID, updatedRights);
      
      if (success) {
        toast.success('Permissions saved successfully');
        navigate('/roles');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigate('/roles')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Role Permissions</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Permissions for {role?.roleName}</CardTitle>
          <CardDescription>
            Define which actions users with this role can perform on each module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4">Menu / Sub-Menu</TableHead>
                  <TableHead className="text-center">View</TableHead>
                  <TableHead className="text-center">Add</TableHead>
                  <TableHead className="text-center">Edit</TableHead>
                  <TableHead className="text-center">Delete</TableHead>
                  <TableHead className="text-center">Export</TableHead>
                  <TableHead className="text-center">Print</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((menu, menuIndex) => (
                  <React.Fragment key={menu.menuID}>
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={7} className="font-semibold">
                        {menu.menuName}
                      </TableCell>
                    </TableRow>
                    {menu.subMenus.map((subMenu, subMenuIndex) => (
                      <TableRow key={subMenu.subMenuID}>
                        <TableCell className="pl-6">{subMenu.subMenuName}</TableCell>
                        <TableCell className="text-center">
                          <Switch 
                            checked={subMenu.rights.canView}
                            onCheckedChange={() => handleTogglePermission(menuIndex, subMenuIndex, 'canView')}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch 
                            checked={subMenu.rights.canAdd}
                            disabled={!subMenu.rights.canView}
                            onCheckedChange={() => handleTogglePermission(menuIndex, subMenuIndex, 'canAdd')}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch 
                            checked={subMenu.rights.canEdit}
                            disabled={!subMenu.rights.canView}
                            onCheckedChange={() => handleTogglePermission(menuIndex, subMenuIndex, 'canEdit')}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch 
                            checked={subMenu.rights.canDelete}
                            disabled={!subMenu.rights.canView}
                            onCheckedChange={() => handleTogglePermission(menuIndex, subMenuIndex, 'canDelete')}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch 
                            checked={subMenu.rights.canExport}
                            disabled={!subMenu.rights.canView}
                            onCheckedChange={() => handleTogglePermission(menuIndex, subMenuIndex, 'canExport')}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch 
                            checked={subMenu.rights.canPrint}
                            disabled={!subMenu.rights.canView}
                            onCheckedChange={() => handleTogglePermission(menuIndex, subMenuIndex, 'canPrint')}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/roles')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSavePermissions} 
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Permissions
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RolePermissions;
