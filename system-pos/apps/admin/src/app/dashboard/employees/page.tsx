"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Loader2,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";

interface Employee {
  id: string;
  phone: string;
  fullName: string;
  email: string | null;
  isActive: boolean;
  role: { id: string; name: string };
  warehouse: { id: string; name: string } | null;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [resetPinDialog, setResetPinDialog] = useState<Employee | null>(null);
  const [newPin, setNewPin] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    pin: "",
    fullName: "",
    email: "",
    roleId: "",
    warehouseId: "none",
  });

  // Fetch roles
  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await api.get("/roles");
      return res.data.data;
    },
  });

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await api.get("/warehouses");
      return res.data.data;
    },
  });

  const roles: Role[] = rolesData || [];
  const warehouses: Warehouse[] = warehousesData || [];

  // Fetch employees
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ["employees", search, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });
      if (search) params.append("search", search);
      const res = await api.get(`/employees?${params}`);
      return res.data;
    },
  });

  const employees: Employee[] = employeesData?.data || [];
  const pagination = employeesData?.pagination || { total: 0, pages: 1 };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: any = {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || null,
        roleId: data.roleId,
        warehouseId: data.warehouseId === "none" ? null : data.warehouseId,
      };

      if (!editingEmployee) {
        payload.password = data.password;
        payload.pinCode = data.pin || undefined;
      }

      if (editingEmployee) {
        return api.put(`/employees/${editingEmployee.id}`, payload);
      }
      return api.post("/employees", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: editingEmployee ? "Employé modifié" : "Employé créé",
        description: `${formData.fullName} a été ${editingEmployee ? "modifié" : "créé"} avec succès.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Échec de l'enregistrement de l'employé",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setDeleteConfirm(null);
      toast({
        title: "Employé supprimé",
        description: "L'employé a été supprimé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Échec de la suppression de l'employé",
        variant: "destructive",
      });
    },
  });

  // Reset PIN mutation
  const resetPinMutation = useMutation({
    mutationFn: async ({ id, pin }: { id: string; pin: string }) => {
      return api.put(`/employees/${id}/pin`, { pin });
    },
    onSuccess: () => {
      setResetPinDialog(null);
      setNewPin("");
      toast({
        title: "PIN réinitialisé",
        description: "Le PIN de l'employé a été réinitialisé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Échec de la réinitialisation du PIN",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      phone: "",
      password: "",
      pin: "",
      fullName: "",
      email: "",
      roleId: "",
      warehouseId: "none",
    });
    setEditingEmployee(null);
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      phone: employee.phone,
      password: "",
      pin: "",
      fullName: employee.fullName,
      email: employee.email || "",
      roleId: employee.role.id,
      warehouseId: employee.warehouse?.id || "none",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case "admin":
        return "bg-purple-100 text-purple-700";
      case "manager":
        return "bg-blue-100 text-blue-700";
      case "cashier":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employés</h1>
          <p className="text-slate-500 mt-1">
            Gérez votre équipe ({pagination.total} employés)
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter employé
        </Button>
      </div>

      {/* Filters */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Rechercher employés..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Employees Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employé</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Entrepôt</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-500">Aucun employé trouvé</p>
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-slate-100 text-slate-600 text-sm">
                          {getInitials(employee.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-900">{employee.fullName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{employee.phone}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={getRoleBadgeColor(employee.role.name)}
                    >
                      {employee.role.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {employee.warehouse ? (
                      <span className="text-slate-600">{employee.warehouse.name}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={employee.isActive ? "default" : "secondary"}
                      className={employee.isActive ? "bg-emerald-100 text-emerald-700" : ""}
                    >
                      {employee.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setResetPinDialog(employee)}
                        title="Réinitialiser PIN"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(employee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(employee.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-slate-500">
              Page {page} sur {pagination.pages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Modifier employé" : "Ajouter un employé"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0612345678"
                required
              />
            </div>

            {!editingEmployee && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin">PIN (4-6 chiffres) *</Label>
                  <Input
                    id="pin"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    maxLength={6}
                    pattern="[0-9]{4,6}"
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Rôle *</Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => setFormData({ ...formData, roleId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse">Assigned Warehouse</Label>
              <Select
                value={formData.warehouseId || "none"}
                onValueChange={(value) => setFormData({ ...formData, warehouseId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner entrepôt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune affectation</SelectItem>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingEmployee ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset PIN Dialog */}
      <Dialog open={!!resetPinDialog} onOpenChange={() => setResetPinDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Réinitialiser PIN</DialogTitle>
          </DialogHeader>
          <p className="text-slate-500 text-sm">
            Enter a new PIN for {resetPinDialog?.fullName}
          </p>
          <div className="space-y-2">
            <Label htmlFor="newPin">New PIN (4-6 digits)</Label>
            <Input
              id="newPin"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              maxLength={6}
              pattern="[0-9]{4,6}"
              placeholder="Enter new PIN"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPinDialog(null)}>
              Annuler
            </Button>
            <Button
              onClick={() =>
                resetPinDialog && resetPinMutation.mutate({ id: resetPinDialog.id, pin: newPin })
              }
              disabled={resetPinMutation.isPending || newPin.length < 4}
            >
              {resetPinMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer employé</DialogTitle>
          </DialogHeader>
          <p className="text-slate-500">
            Are you sure you want to delete this employee? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
