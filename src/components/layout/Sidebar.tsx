
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { toggleSidebar } from '@/features/ui/uiSlice';
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
  ChevronLeft,
  Layers,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  collapsed?: boolean;
}

const NavItem = ({ href, icon: Icon, label, active, collapsed }: NavItemProps) => (
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
    {!collapsed && <span>{label}</span>}
  </Link>
);

interface NavGroupProps {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsed?: boolean;
}

const NavGroup = ({ label, icon: Icon, children, defaultOpen, collapsed }: NavGroupProps) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen || false);

  // Don't show collapsible UI when sidebar is collapsed
  if (collapsed) {
    return <div className="space-y-1">{children}</div>;
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
            <span>{label}</span>
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
  const dispatch = useAppDispatch();
  const { sidebarOpen } = useAppSelector(state => state.ui);

  const handleToggle = () => {
    dispatch(toggleSidebar());
  };

  const renderNavItems = (collapsed: boolean) => {
    return (
      <>
        <NavItem 
          href="/dashboard" 
          icon={LayoutDashboard} 
          label="Dashboard" 
          active={location.pathname === '/dashboard'} 
          collapsed={collapsed}
        />
        <NavItem 
          href="/calendar" 
          icon={Home} 
          label="Calendar" 
          active={location.pathname === '/calendar'} 
          collapsed={collapsed}
        />
        <NavItem 
          href="/ui-examples" 
          icon={Layers} 
          label="UI Examples" 
          active={location.pathname === '/ui-examples'} 
          collapsed={collapsed}
        />
      </>
    );
  };

  const renderNavGroups = (collapsed: boolean) => {
    if (collapsed) {
      // When collapsed, render just the icons
      return (
        <>
          <div className="py-2">
            <NavItem href="/companies" icon={Building} label="Companies" active={location.pathname.includes('/companies')} collapsed={true} />
          </div>
          <div className="py-2">
            <NavItem href="/contracts" icon={FileText} label="Contracts" active={location.pathname.includes('/contracts')} collapsed={true} />
          </div>
          <NavItem href="/invoices" icon={CreditCard} label="Invoices" active={location.pathname === '/invoices'} collapsed={true} />
          <div className="py-2">
            <NavItem href="/reports" icon={BarChart3} label="Reports" active={location.pathname === '/reports'} collapsed={true} />
          </div>
          <div className="py-2">
            <NavItem href="/users" icon={Users} label="Users" active={location.pathname === '/users'} collapsed={true} />
          </div>
          <NavItem href="/products" icon={Package} label="Products" active={location.pathname === '/products'} collapsed={true} />
        </>
      );
    }

    // When expanded, render full navigation with groups
    return (
      <>
        <div className="space-y-1">
          <p className="px-3 text-xs font-medium text-muted-foreground">Leasing</p>
          <NavGroup label="Companies" icon={Building} defaultOpen collapsed={collapsed}>
            <NavItem 
              href="/companies" 
              icon={Building} 
              label="All Companies" 
              active={location.pathname === '/companies'} 
              collapsed={collapsed}
            />
            <NavItem 
              href="/companies/add" 
              icon={Building} 
              label="Add Company" 
              active={location.pathname === '/companies/add'} 
              collapsed={collapsed}
            />
          </NavGroup>
          <NavGroup label="Contracts" icon={FileText} collapsed={collapsed}>
            <NavItem 
              href="/contracts" 
              icon={FileText} 
              label="All Contracts" 
              active={location.pathname === '/contracts'} 
              collapsed={collapsed}
            />
            <NavItem 
              href="/contracts/add" 
              icon={FileText} 
              label="Add Contract" 
              active={location.pathname === '/contracts/add'} 
              collapsed={collapsed}
            />
          </NavGroup>
          <NavItem 
            href="/invoices" 
            icon={CreditCard} 
            label="Invoices" 
            active={location.pathname === '/invoices'} 
            collapsed={collapsed}
          />
        </div>

        <div className="space-y-1">
          <p className="px-3 text-xs font-medium text-muted-foreground">Analytics</p>
          <NavItem 
            href="/reports" 
            icon={BarChart3} 
            label="Reports" 
            active={location.pathname === '/reports'} 
            collapsed={collapsed}
          />
        </div>

        <div className="space-y-1">
          <p className="px-3 text-xs font-medium text-muted-foreground">Management</p>
          <NavItem 
            href="/users" 
            icon={Users} 
            label="Users" 
            active={location.pathname === '/users'} 
            collapsed={collapsed}
          />
          <NavItem 
            href="/products" 
            icon={Package} 
            label="Products" 
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
            <span className="font-semibold">Lease ERP</span>
          </Link>
        ) : (
          <div className="mx-auto">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold">LE</span>
            </div>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleToggle} 
          className={cn("flex md:flex", !sidebarOpen && "mx-auto hidden md:flex")}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
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
          label="Settings" 
          active={location.pathname === '/settings'} 
          collapsed={!sidebarOpen}
        />
        <NavItem 
          href="/support" 
          icon={LifeBuoy} 
          label="Support" 
          active={location.pathname === '/support'} 
          collapsed={!sidebarOpen}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
