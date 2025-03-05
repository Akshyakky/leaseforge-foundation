
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

// Route map for customizing breadcrumb display names
const routeMap: Record<string, string> = {
  '': 'Home',
  'dashboard': 'Dashboard',
  'users': 'User Management',
  'settings': 'Settings',
  // Add more routes here as needed
};

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  
  // Don't render breadcrumbs on the root or login page
  if (location.pathname === '/' || location.pathname === '/login') {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="py-2 px-1">
      <ol className="flex items-center space-x-1 text-sm">
        <li>
          <Link 
            to="/" 
            className="text-muted-foreground hover:text-foreground flex items-center"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          
          return (
            <li key={name} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              {isLast ? (
                <span className="ml-1 font-medium" aria-current="page">
                  {routeMap[name] || name}
                </span>
              ) : (
                <Link
                  to={routeTo}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  {routeMap[name] || name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
