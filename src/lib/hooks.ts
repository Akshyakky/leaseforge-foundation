import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { RootState, AppDispatch } from "./store";

// Redux hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Route history tracking hook
export const useRouteHistory = (maxSize = 5) => {
  const location = useLocation();
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory((prev) => {
      // Don't add duplicate consecutive entries
      if (prev[prev.length - 1] === location.pathname) {
        return prev;
      }

      // Add current path and maintain max size
      const newHistory = [...prev, location.pathname];
      return newHistory.slice(-maxSize);
    });
  }, [location, maxSize]);

  return history;
};

// Environment variables hook
export const useEnv = () => {
  return {
    apiUrl: import.meta.env.VITE_API_URL as string,
    apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT || 30000),
    appName: import.meta.env.VITE_APP_NAME as string,
    appVersion: import.meta.env.VITE_APP_VERSION as string,
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
    enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== "false",
  };
};

// Auth permissions check hook
export const useHasPermission = (requiredPermission: string | string[]) => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const checkPermission = useCallback(() => {
    // If no user, return false
    if (!user) return false;

    // Admin role has all permissions
    if (user.role === "admin") return true;

    // For now, simple role-based check
    // In the future, this could check a permissions array on the user object
    const permissionsMap: Record<string, string[]> = {
      admin: ["users.manage", "settings.manage", "reports.view", "contracts.manage"],
      manager: ["users.view", "reports.view", "contracts.manage"],
      staff: ["contracts.view", "reports.view"],
    };

    const userPermissions = permissionsMap[user.role] || [];

    if (Array.isArray(requiredPermission)) {
      return requiredPermission.some((perm) => userPermissions.includes(perm));
    }

    return userPermissions.includes(requiredPermission);
  }, [user, requiredPermission]);

  const redirectIfNoPermission = useCallback(
    (redirectPath = "/dashboard") => {
      if (!checkPermission()) {
        navigate(redirectPath);
        return false;
      }
      return true;
    },
    [checkPermission, navigate]
  );

  return { hasPermission: checkPermission(), checkPermission, redirectIfNoPermission };
};
