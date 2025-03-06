
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
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

interface SubMenuProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
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

const SubMenu: React.FC<SubMenuProps> = ({ icon, label, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
          "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="truncate">{label}</span>
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {isOpen && (
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
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-16 items-center border-b px-6">
        <h2 className={cn("text-lg font-semibold transition-opacity", !isOpen && "opacity-0")}>
          {t('appName')}
        </h2>
      </div>
      <div className="flex-1 overflow-auto py-4 px-3">
        <nav className="space-y-1">
          <NavItem 
            to="/dashboard" 
            icon={<LayoutDashboard size={18} />} 
            label={isOpen ? t('nav.dashboard') : ""}
          />
          
          {isOpen ? (
            <>
              <SubMenu 
                icon={<Users size={18} />} 
                label={t('nav.users')}
              >
                <NavItem 
                  to="/users" 
                  icon={<Users size={16} />} 
                  label="All Users" 
                />
                <NavItem 
                  to="/users/new" 
                  icon={<Users size={16} />} 
                  label="Add User" 
                />
              </SubMenu>
              
              <SubMenu 
                icon={<Database size={18} />} 
                label="Data Display"
              >
                <NavItem 
                  to="/data-examples" 
                  icon={<Database size={16} />} 
                  label="Examples" 
                />
                <NavItem 
                  to="/data-examples/tables" 
                  icon={<ListOrdered size={16} />} 
                  label="Tables" 
                />
              </SubMenu>
            </>
          ) : (
            <>
              <NavItem 
                to="/users" 
                icon={<Users size={18} />} 
                label="" 
              />
              <NavItem 
                to="/data-examples" 
                icon={<Database size={18} />} 
                label="" 
              />
            </>
          )}
          
          <NavItem 
            to="/form-examples" 
            icon={<FormInput size={18} />} 
            label={isOpen ? "Form Examples" : ""} 
          />
          
          <NavItem 
            to="/ui-examples" 
            icon={<Palette size={18} />} 
            label={isOpen ? t('nav.uiExamples') : ""} 
          />
          
          <NavItem 
            to="/settings" 
            icon={<Settings size={18} />} 
            label={isOpen ? t('nav.settings') : ""} 
          />
          
          <NavItem 
            to="/language-settings" 
            icon={<ServerCog size={18} />} 
            label={isOpen ? t('nav.language') : ""} 
          />
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
