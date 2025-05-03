import React, { useState, useEffect, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppSelector } from "@/lib/hooks";
import { menuService, MenuItem, SubMenuItem } from "@/services/menuService";
import { getLucideIcon } from "@/lib/iconMapper";

interface SidebarProps {
  isOpen: boolean;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  permissions?: {
    canView: boolean;
    canAdd?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canExport?: boolean;
    canPrint?: boolean;
  };
}

interface SubMenuProps {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  children: React.ReactNode;
  permissions?: {
    canView: boolean;
    canAdd?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canExport?: boolean;
    canPrint?: boolean;
  };
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isOpen, permissions }) => {
  // Skip rendering if user doesn't have view permission
  if (permissions && !permissions.canView) {
    return null;
  }

  if (!isOpen) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-center rounded-md px-3 py-2 text-sm transition-colors w-full",
                  isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                )
              }
            >
              <div className="flex items-center justify-center">{icon}</div>
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
        )
      }
    >
      {icon}
      <span className="truncate">{label}</span>
    </NavLink>
  );
};

const SubMenu: React.FC<SubMenuProps> = ({ icon, label, isOpen, children, permissions }) => {
  const location = useLocation();
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

  // Skip rendering if user doesn't have view permission
  if (permissions && !permissions.canView) {
    return null;
  }

  // Check if any child routes are active to automatically expand the submenu
  useEffect(() => {
    // This assumes children are NavItem components with to props
    const childrenArray = React.Children.toArray(children);
    const hasActiveChild = childrenArray.some((child) => {
      if (React.isValidElement(child) && child.props.to) {
        return location.pathname.startsWith(child.props.to);
      }
      return false;
    });

    if (hasActiveChild) {
      setIsSubmenuOpen(true);
    }
  }, [location.pathname, children]);

  if (!isOpen) {
    // When the sidebar is collapsed, show a tooltip with submenu items
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex w-full justify-center">
              <button
                className={cn(
                  "flex items-center justify-center rounded-md px-3 py-2 text-sm transition-colors w-full",
                  "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {icon}
              </button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="p-2 w-40">
            <div className="font-medium mb-2">{label}</div>
            <div className="space-y-1">{React.Children.map(children, (child) => child)}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Filter out any null children (those without view permissions)
  const visibleChildren = React.Children.toArray(children).filter((child) => child !== null);

  // Don't render the submenu if it has no visible children
  if (visibleChildren.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsSubmenuOpen(!isSubmenuOpen)}
        className={cn(
          "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
          "hover:bg-accent/50 text-muted-foreground hover:text-foreground",
          isSubmenuOpen && "bg-accent/30"
        )}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="truncate">{label}</span>
        </div>
        {isSubmenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isSubmenuOpen && <div className="pl-6 space-y-1">{visibleChildren}</div>}
    </div>
  );
};

const DynamicSidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoading(true);
        setError(null);
        let menuData: MenuItem[] = [];

        // If user ID is available, fetch user-specific menus
        if (user?.id) {
          menuData = await menuService.getUserMenus(parseInt(user.id));
        } else {
          // Otherwise fetch all menus (for development/testing)
          menuData = await menuService.getAllMenus();
        }

        setMenus(menuData);
      } catch (error) {
        console.error("Error fetching menus:", error);
        setError("Failed to load navigation menu. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, [user?.id]);

  // Static menu items that are always available
  const staticMenuItems = useMemo(
    () => [
      {
        path: "/dashboard",
        icon: "LayoutDashboard",
        label: t("nav.dashboard"),
      },
    ],
    [t]
  );

  // Footer menu items
  const footerMenuItems = useMemo(
    () => [
      {
        path: "/settings",
        icon: "Settings",
        label: t("nav.settings"),
      },
      {
        path: "/language-settings",
        icon: "Languages",
        label: t("nav.language"),
      },
      {
        path: "/support",
        icon: "HelpCircle",
        label: t("nav.support"),
      },
    ],
    [t]
  );

  return (
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-width duration-300 ease-in-out", isOpen ? "w-64" : "w-16")}>
      <div className="flex h-16 items-center justify-center border-b px-6">
        {isOpen ? (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-semibold">LE</span>
            </div>
            <h2 className="text-lg font-semibold">{t("appName")}</h2>
          </div>
        ) : (
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-semibold">LE</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto py-4 px-3 flex flex-col justify-between">
        {/* Main navigation */}
        <nav className="space-y-1 w-full">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-sm text-destructive px-3 py-2 text-center">{error}</div>
          ) : (
            <>
              {/* Static menu items first */}
              {staticMenuItems.map((item) => (
                <NavItem key={`static-${item.path}`} to={item.path} icon={getLucideIcon(item.icon, 18)} label={item.label} isOpen={isOpen} />
              ))}

              {/* Separator between static and dynamic items */}
              {menus.length > 0 && <div className="h-px bg-border/70 my-2" />}

              {/* Render dynamic menu items */}
              {menus.map((menu) => {
                const menuIcon = getLucideIcon(menu.MenuIcon || "CircleDot", 18);
                const menuPermissions = {
                  canView: menu.CanView !== undefined ? menu.CanView : true,
                  canAdd: menu.CanAdd,
                  canEdit: menu.CanEdit,
                  canDelete: menu.CanDelete,
                  canExport: menu.CanExport,
                  canPrint: menu.CanPrint,
                };

                // Skip rendering if user doesn't have view permission
                if (!menuPermissions.canView) {
                  return null;
                }

                // Menu with submenus
                if (menu.subMenus && menu.subMenus.length > 0) {
                  return (
                    <SubMenu key={`menu-${menu.MenuID}`} icon={menuIcon} label={menu.MenuName} isOpen={isOpen} permissions={menuPermissions}>
                      {menu.subMenus.map((subMenu) => {
                        const subMenuPermissions = {
                          canView: subMenu.CanView !== undefined ? subMenu.CanView : true,
                          canAdd: subMenu.CanAdd,
                          canEdit: subMenu.CanEdit,
                          canDelete: subMenu.CanDelete,
                          canExport: subMenu.CanExport,
                          canPrint: subMenu.CanPrint,
                        };

                        return (
                          <NavItem
                            key={`submenu-${subMenu.SubMenuID}`}
                            to={subMenu.SubMenuPath || "#"}
                            icon={getLucideIcon(subMenu.SubMenuIcon || "Circle", 16)}
                            label={subMenu.SubMenuName}
                            isOpen={true}
                            permissions={subMenuPermissions}
                          />
                        );
                      })}
                    </SubMenu>
                  );
                }
                // Menu without submenus (direct link)
                else if (menu.MenuPath) {
                  return <NavItem key={`menu-${menu.MenuID}`} to={menu.MenuPath} icon={menuIcon} label={menu.MenuName} isOpen={isOpen} permissions={menuPermissions} />;
                }

                return null;
              })}
            </>
          )}
        </nav>

        {/* Footer navigation - settings and support */}
        <nav className="space-y-1 mt-auto pt-4 border-t border-border/50 w-full">
          {footerMenuItems.map((item) => (
            <NavItem key={`footer-${item.path}`} to={item.path} icon={getLucideIcon(item.icon, 18)} label={item.label} isOpen={isOpen} />
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default DynamicSidebar;
