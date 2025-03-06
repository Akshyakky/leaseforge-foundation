
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, Settings, Palette, Database, ServerCog, ListOrdered, FormInput } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
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
      <span>{label}</span>
    </NavLink>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-16 items-center border-b px-6">
        <h2 className="text-lg font-semibold">{t('appName')}</h2>
      </div>
      <div className="flex-1 overflow-auto py-4 px-3">
        <div className="space-y-1">
          <NavItem 
            to="/dashboard" 
            icon={<LayoutDashboard size={18} />} 
            label={t('nav.dashboard')} 
          />
          <NavItem 
            to="/users" 
            icon={<Users size={18} />} 
            label={t('nav.users')} 
          />
          <NavItem 
            to="/data-examples" 
            icon={<Database size={18} />} 
            label="Data Display" 
          />
          <NavItem 
            to="/form-examples" 
            icon={<FormInput size={18} />} 
            label="Form Examples" 
          />
          <NavItem 
            to="/ui-examples" 
            icon={<Palette size={18} />} 
            label={t('nav.uiExamples')} 
          />
          <NavItem 
            to="/settings" 
            icon={<Settings size={18} />} 
            label={t('nav.settings')} 
          />
          <NavItem 
            to="/language-settings" 
            icon={<ServerCog size={18} />} 
            label={t('nav.language')} 
          />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
