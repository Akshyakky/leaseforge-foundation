import { ReactNode } from "react";

export interface RouteConfig {
  path: string;
  element: ReactNode;
  children?: RouteConfig[];
  index?: boolean;
}

export interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

// Additional types can be added as the routing structure grows more complex
