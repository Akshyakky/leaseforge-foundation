
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/lib/hooks';
import {
  BarChart3,
  Building,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileText,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Settings,
  Users,
  Layers,
  Globe,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  collapsed?: boolean;
}

const NavItem = ({ href, icon: Icon, label, active, collapsed }: NavItemProps) => {
  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={href}
              className={cn(
                'flex items-center justify-center rounded-md h-10 w-10 mx-auto text-sm transition-colors',
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link
      to={href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4 min-w-4" />
      <span>{label}</span>
    </Link>
  );
};

interface NavGroupProps {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsed?: boolean;
}

const NavGroup = ({ label, icon: Icon, children, defaultOpen, collapsed }: NavGroupProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen || false);
  const { t } = useTranslation();

  // When sidebar is collapsed, show tooltip with submenu
  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="h-10 w-10 mx-auto flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Icon className="h-5 w-5" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="p-0 bg-background border border-border w-48">
            <div className="py-1">
              <div className="px-3 py-2 text-sm font-medium border-b border-border">{t(label)}</div>
              <div className="py-1">{children}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full"
    >
      <CollapsibleTrigger asChild>
        <button 
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4" />
            <span>{t(label)}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-10 space-y-1 pt-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const { sidebarOpen } = useAppSelector(state => state.ui);
  const { t } = useTranslation();

  const renderNavItems = (collapsed: boolean) => {
    return (
      <>
        <NavItem 
          href="/dashboard" 
          icon={LayoutDashboard} 
          label={t('nav.dashboard')} 
          active={location.pathname === '/dashboard'} 
          collapsed={collapsed}
        />
        <NavItem 
          href="/calendar" 
          icon={Home} 
          label={t('nav.calendar')} 
          active={location.pathname === '/calendar'} 
          collapsed={collapsed}
        />
        <NavItem 
          href="/ui-examples" 
          icon={Layers} 
          label={t('nav.uiExamples')} 
          active={location.pathname === '/ui-examples'} 
          collapsed={collapsed}
        />
      </>
    );
  };

  const renderNavGroups = (collapsed: boolean) => {
    return (
      <>
        <div className={collapsed ? 'space-y-4' : 'space-y-1'}>
          {!collapsed && <p className="px-3 text-xs font-medium text-muted-foreground">{t('nav.sections.leasing')}</p>}
          <NavGroup label="nav.companies" icon={Building} defaultOpen={location.pathname.includes('/companies')} collapsed={collapsed}>
            <NavItem 
              href="/companies" 
              icon={Building} 
              label={t('nav.allCompanies')} 
              active={location.pathname === '/companies'} 
              collapsed={false}
            />
            <NavItem 
              href="/companies/add" 
              icon={Building} 
              label={t('nav.addCompany')} 
              active={location.pathname === '/companies/add'} 
              collapsed={false}
            />
          </NavGroup>
          <NavGroup label="nav.contracts" icon={FileText} defaultOpen={location.pathname.includes('/contracts')} collapsed={collapsed}>
            <NavItem 
              href="/contracts" 
              icon={FileText} 
              label={t('nav.allContracts')} 
              active={location.pathname === '/contracts'} 
              collapsed={false}
            />
            <NavItem 
              href="/contracts/add" 
              icon={FileText} 
              label={t('nav.addContract')} 
              active={location.pathname === '/contracts/add'} 
              collapsed={false}
            />
          </NavGroup>
          <NavItem 
            href="/invoices" 
            icon={CreditCard} 
            label={t('nav.invoices')} 
            active={location.pathname === '/invoices'} 
            collapsed={collapsed}
          />
        </div>

        <div className={collapsed ? 'space-y-4' : 'space-y-1'}>
          {!collapsed && <p className="px-3 text-xs font-medium text-muted-foreground">{t('nav.sections.analytics')}</p>}
          <NavItem 
            href="/reports" 
            icon={BarChart3} 
            label={t('nav.reports')} 
            active={location.pathname === '/reports'} 
            collapsed={collapsed}
          />
        </div>

        <div className={collapsed ? 'space-y-4' : 'space-y-1'}>
          {!collapsed && <p className="px-3 text-xs font-medium text-muted-foreground">{t('nav.sections.management')}</p>}
          <NavItem 
            href="/users" 
            icon={Users} 
            label={t('nav.users')} 
            active={location.pathname === '/users'} 
            collapsed={collapsed}
          />
          <NavItem 
            href="/products" 
            icon={Package} 
            label={t('nav.products')} 
            active={location.pathname === '/products'} 
            collapsed={collapsed}
          />
        </div>
      </>
    );
  };

  return (
    <aside 
      className={cn(
        'fixed inset-y-0 left-0 z-20 flex h-full flex-col border-r border-border bg-background transition-all duration-300 ease-in-out',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {sidebarOpen ? (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold">LE</span>
            </div>
            <span className="font-semibold">{t('appName')}</span>
          </Link>
        ) : (
          <div className="mx-auto">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold">LE</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div className="space-y-1">
          {renderNavItems(sidebarOpen ? false : true)}
        </div>

        {renderNavGroups(sidebarOpen ? false : true)}
      </div>

      <div className="mt-auto border-t border-border p-3 space-y-1">
        <NavItem 
          href="/settings" 
          icon={Settings} 
          label={t('nav.settings')} 
          active={location.pathname === '/settings'} 
          collapsed={!sidebarOpen}
        />
        <NavItem 
          href="/support" 
          icon={LifeBuoy} 
          label={t('nav.support')} 
          active={location.pathname === '/support'} 
          collapsed={!sidebarOpen}
        />
        <NavItem 
          href="/language-settings" 
          icon={Globe} 
          label={t('nav.language')} 
          active={location.pathname === '/language-settings'} 
          collapsed={!sidebarOpen}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
