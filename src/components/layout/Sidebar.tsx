
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
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
      {isOpen && <span className="truncate">{label}</span>}
    </NavLink>
  );
};

const SubMenu: React.FC<SubMenuProps> = ({ icon, label, isOpen, children }) => {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

  if (!isOpen) {
    return (
      <div className="space-y-1">
        <button
          className={cn(
            "w-full flex items-center rounded-md px-3 py-2 text-sm transition-colors",
            "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
          )}
        >
          {icon}
        </button>
      </div>
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
          
          {isOpen ? (
            <>
              <SubMenu 
                icon={<Users size={18} />} 
                label={t('nav.users')}
                isOpen={isOpen}
              >
                <NavItem 
                  to="/users" 
                  icon={<Users size={16} />} 
                  label="All Users"
                  isOpen={isOpen}
                />
                <NavItem 
                  to="/users/new" 
                  icon={<Users size={16} />} 
                  label="Add User"
                  isOpen={isOpen}
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
                  isOpen={isOpen}
                />
                <NavItem 
                  to="/data-examples/tables" 
                  icon={<ListOrdered size={16} />} 
                  label="Tables"
                  isOpen={isOpen}
                />
              </SubMenu>
            </>
          ) : (
            <>
              <NavItem 
                to="/users" 
                icon={<Users size={18} />} 
                label=""
                isOpen={isOpen} 
              />
              <NavItem 
                to="/data-examples" 
                icon={<Database size={18} />} 
                label=""
                isOpen={isOpen}
              />
            </>
          )}
          
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
