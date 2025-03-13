import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
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
}

interface SubMenuProps {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  children: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isOpen }) => {
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

const SubMenu: React.FC<SubMenuProps> = ({ icon, label, isOpen, children }) => {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

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

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsSubmenuOpen(!isSubmenuOpen)}
        className={cn("w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors", "hover:bg-accent/50 text-muted-foreground hover:text-foreground")}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="truncate">{label}</span>
        </div>
        {isSubmenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isSubmenuOpen && <div className="pl-6 space-y-1">{children}</div>}
    </div>
  );
};

const DynamicSidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, [user?.id]);

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
          ) : (
            <>
              {/* Home dashboard is always available */}
              <NavItem to="/dashboard" icon={getLucideIcon("LayoutDashboard", 18)} label={t("nav.dashboard")} isOpen={isOpen} />

              {/* Render dynamic menu items */}
              {menus.map((menu) => {
                const menuIcon = getLucideIcon(menu.MenuIcon || "CircleDot", 18);

                // Menu with submenus
                if (menu.subMenus && menu.subMenus.length > 0) {
                  return (
                    <SubMenu key={`menu-${menu.MenuID}`} icon={menuIcon} label={menu.MenuName} isOpen={isOpen}>
                      {menu.subMenus.map((subMenu) => (
                        <NavItem
                          key={`submenu-${subMenu.SubMenuID}`}
                          to={subMenu.SubMenuPath || "#"}
                          icon={getLucideIcon(subMenu.SubMenuIcon || "Circle", 16)}
                          label={subMenu.SubMenuName}
                          isOpen={true}
                        />
                      ))}
                    </SubMenu>
                  );
                }
                // Menu without submenus
                else {
                  return <NavItem key={`menu-${menu.MenuID}`} to={menu.MenuPath || "#"} icon={menuIcon} label={menu.MenuName} isOpen={isOpen} />;
                }
              })}
            </>
          )}
        </nav>

        {/* Footer navigation - settings and support */}
        <nav className="space-y-1 mt-auto pt-4 border-t border-border/50 w-full">
          <NavItem to="/settings" icon={getLucideIcon("Settings", 18)} label={t("nav.settings")} isOpen={isOpen} />

          <NavItem to="/language-settings" icon={getLucideIcon("Languages", 18)} label={t("nav.language")} isOpen={isOpen} />

          <NavItem to="/support" icon={getLucideIcon("HelpCircle", 18)} label="Support" isOpen={isOpen} />
        </nav>
      </div>
    </aside>
  );
};

export default DynamicSidebar;
