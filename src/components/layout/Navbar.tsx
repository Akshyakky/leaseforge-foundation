import React from "react";
import { Menu, Search, UserCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { toggleSidebar } from "@/features/ui/uiSlice";
import { logoutUser } from "@/features/auth/authService";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import ThemeCustomizer from "@/components/theme/ThemeCustomizer";
import CompanySelector from "@/components/common/CompanySelector";

const Navbar = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <header className="h-16 bg-background border-b border-border z-10">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleToggleSidebar} className="mr-2" aria-label="Toggle sidebar">
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden md:flex items-center w-72">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search..." className="w-full pl-9 bg-muted/40" />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Company Selector */}
          <CompanySelector />

          {/* Theme Customizer */}
          <ThemeCustomizer />

          {/* Notification Center */}
          <NotificationCenter />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">{user?.name || "User"}</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
