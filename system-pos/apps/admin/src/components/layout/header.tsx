"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, LogOut, User, Moon, Sun, Warehouse, ChevronDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";
import { useTheme } from "next-themes";
import api from "@/lib/api";

interface WarehouseOption {
  id: string;
  name: string;
  code: string;
  isDefault?: boolean;
}

export function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const employee = useAuthStore((state) => state.employee);
  const currentWarehouse = useAuthStore((state) => state.currentWarehouse);
  const setCurrentWarehouse = useAuthStore((state) => state.setCurrentWarehouse);
  const logout = useAuthStore((state) => state.logout);

  const isAdmin = employee?.role.name === "Admin";

  // Fetch warehouses for admin users
  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses-selector"],
    queryFn: async () => {
      const res = await api.get("/warehouses");
      return res.data.data;
    },
    enabled: isAdmin, // Only fetch for admins
  });

  const warehouses: WarehouseOption[] = warehousesData || [];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleWarehouseChange = (warehouse: WarehouseOption | null) => {
    setCurrentWarehouse(warehouse);
  };

  const initials = employee?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AD";

  // Display warehouse: use currentWarehouse if set, otherwise employee's assigned warehouse
  const displayWarehouse = currentWarehouse || employee?.warehouse;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Warehouse Selector for Admin, Static display for others */}
        {isAdmin ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-blue-50 border-blue-200 hover:bg-blue-100"
              >
                <Warehouse className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {displayWarehouse ? displayWarehouse.name : "Tous les entrepôts"}
                </span>
                {displayWarehouse && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-600">
                    {displayWarehouse.code}
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4 text-blue-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Choisir un entrepôt</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleWarehouseChange(null)}
                className="flex items-center justify-between"
              >
                <span>Tous les entrepôts</span>
                {!currentWarehouse && <Check className="h-4 w-4 text-blue-600" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {warehouses.map((wh) => (
                <DropdownMenuItem 
                  key={wh.id}
                  onClick={() => handleWarehouseChange(wh)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span>{wh.name}</span>
                    <Badge variant="outline" className="text-xs">{wh.code}</Badge>
                    {wh.isDefault && (
                      <Badge className="text-xs bg-green-100 text-green-700">Défaut</Badge>
                    )}
                  </div>
                  {currentWarehouse?.id === wh.id && <Check className="h-4 w-4 text-blue-600" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : displayWarehouse ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
            <Warehouse className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              {displayWarehouse.name}
            </span>
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-600">
              {displayWarehouse.code}
            </Badge>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-slate-500 hover:text-slate-900"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-900">{employee?.fullName}</p>
                <p className="text-xs text-slate-500 capitalize">{employee?.role.name}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

