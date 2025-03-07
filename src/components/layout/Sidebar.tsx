
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Palette, 
  Database, 
  ServerCog, 
  ListOrdered, 
  FormInput,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Building2,
  TrendingUp,
  BarChart,
  LineChart,
  PieChart,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
                  "flex items-center justify-center rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                )
              }
            >
              {icon}
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">
            {label}
          </TooltipContent>
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
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
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
            <div className="flex justify-center">
              <button
                className={cn(
                  "flex items-center justify-center rounded-md px-3 py-2 text-sm transition-colors",
                  "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {icon}
              </button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="p-2 w-40">
            <div className="font-medium mb-2">{label}</div>
            <div className="space-y-1">
              {React.Children.map(children, (child) => child)}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsSubmenuOpen(!isSubmenuOpen)}
        className={cn(
          "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
          "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="truncate">{label}</span>
        </div>
        {isSubmenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {isSubmenuOpen && (
        <div className="pl-6 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-width duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-16 items-center border-b px-6">
        {isOpen ? (
          <div className="flex items-center gap-2">
            <Building2 size={24} className="text-[#1EAEDB]" />
            <h2 className="text-lg font-semibold">
              {t('appName')}
            </h2>
          </div>
        ) : (
          <Building2 size={24} className="text-[#1EAEDB] mx-auto" />
        )}
      </div>
      
      <div className="flex-1 overflow-auto py-4 px-3 flex flex-col justify-between">
        {/* Main navigation */}
        <nav className="space-y-1">
          <NavItem 
            to="/dashboard" 
            icon={<LayoutDashboard size={18} />} 
            label={t('nav.dashboard')}
            isOpen={isOpen}
          />
          
          {/* Dashboards Submenu */}
          <SubMenu 
            icon={<BarChart size={18} />} 
            label="Dashboards"
            isOpen={isOpen}
          >
            <NavItem 
              to="/analytics-dashboard" 
              icon={<LineChart size={16} />} 
              label="Analytics"
              isOpen={true}
            />
            <NavItem 
              to="/sales-dashboard" 
              icon={<TrendingUp size={16} />} 
              label="Sales"
              isOpen={true}
            />
            <NavItem 
              to="/operations-dashboard" 
              icon={<PieChart size={16} />} 
              label="Operations"
              isOpen={true}
            />
          </SubMenu>
          
          {/* Sample Module */}
          <NavItem 
            to="/sample-module" 
            icon={<Package size={18} />} 
            label="Sample Module"
            isOpen={isOpen}
          />
          
          <SubMenu 
            icon={<Users size={18} />} 
            label={t('nav.users')}
            isOpen={isOpen}
          >
            <NavItem 
              to="/users" 
              icon={<Users size={16} />} 
              label="All Users"
              isOpen={true}
            />
            <NavItem 
              to="/users/new" 
              icon={<Users size={16} />} 
              label="Add User"
              isOpen={true}
            />
          </SubMenu>
          
          <SubMenu 
            icon={<Database size={18} />} 
            label="Data Display"
            isOpen={isOpen}
          >
            <NavItem 
              to="/data-examples" 
              icon={<Database size={16} />} 
              label="Examples"
              isOpen={true}
            />
            <NavItem 
              to="/data-examples/tables" 
              icon={<ListOrdered size={16} />} 
              label="Tables"
              isOpen={true}
            />
          </SubMenu>
          
          <NavItem 
            to="/form-examples" 
            icon={<FormInput size={18} />} 
            label="Form Examples"
            isOpen={isOpen}
          />
          
          <NavItem 
            to="/ui-examples" 
            icon={<Palette size={18} />} 
            label={t('nav.uiExamples')}
            isOpen={isOpen}
          />
        </nav>

        {/* Footer navigation - settings and support */}
        <nav className="space-y-1 mt-auto pt-4 border-t border-border/50">
          <NavItem 
            to="/settings" 
            icon={<Settings size={18} />} 
            label={t('nav.settings')}
            isOpen={isOpen}
          />
          
          <NavItem 
            to="/language-settings" 
            icon={<ServerCog size={18} />} 
            label={t('nav.language')}
            isOpen={isOpen}
          />

          <NavItem 
            to="/support" 
            icon={<HelpCircle size={18} />} 
            label="Support"
            isOpen={isOpen}
          />
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
