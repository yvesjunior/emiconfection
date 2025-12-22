"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Warehouse,
  MapPin,
  Phone,
  Users,
  Package,
  Star,
  MoreHorizontal,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";

interface WarehouseData {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  _count: {
    employees: number;
    inventory: number;
  };
}

export default function WarehousesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    isActive: true,
    isDefault: false,
  });

  // Fetch warehouses
  const { data: warehouses, isLoading } = useQuery({
    queryKey: ["warehouses", showInactive],
    queryFn: async () => {
      const res = await api.get(`/warehouses?includeInactive=${showInactive}`);
      return res.data.data as WarehouseData[];
    },
  });

  // Save warehouse (create/update)
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingWarehouse) {
        return api.put(`/warehouses/${editingWarehouse.id}`, data);
      }
      return api.post("/warehouses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: editingWarehouse ? "Entrepôt modifié" : "Entrepôt créé",
        description: editingWarehouse
          ? "L'entrepôt a été modifié avec succès."
          : "The new warehouse has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Échec de l'enregistrement de l'entrepôt",
        variant: "destructive",
      });
    },
  });

  // Delete warehouse
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/warehouses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({
        title: "Entrepôt désactivé",
        description: "L'entrepôt a été désactivé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Échec de la désactivation de l'entrepôt",
        variant: "destructive",
      });
    },
  });

  // Set default warehouse
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.put(`/warehouses/${id}`, { isDefault: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({
        title: "Entrepôt par défaut défini",
        description: "L'entrepôt par défaut a été mis à jour.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Échec de la définition de l'entrepôt par défaut",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      address: "",
      phone: "",
      isActive: true,
      isDefault: false,
    });
    setEditingWarehouse(null);
  };

  const openEditDialog = (warehouse: WarehouseData) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address || "",
      phone: warehouse.phone || "",
      isActive: warehouse.isActive,
      isDefault: warehouse.isDefault,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  // Filter warehouses by search
  const filteredWarehouses = warehouses?.filter((warehouse) => {
    const matchesSearch =
      warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Summary stats
  const stats = {
    total: warehouses?.length || 0,
    active: warehouses?.filter((w) => w.isActive).length || 0,
    totalProducts: warehouses?.reduce((sum, w) => sum + w._count.inventory, 0) || 0,
    totalEmployees: warehouses?.reduce((sum, w) => sum + w._count.employees, 0) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Entrepôts</h1>
          <p className="text-slate-500 mt-1">Gérez vos emplacements d'entrepôts</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter entrepôt
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Warehouse className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Total entrepôts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
                <p className="text-sm text-slate-500">Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalProducts}</p>
                <p className="text-sm text-slate-500">Articles en stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalEmployees}</p>
                <p className="text-sm text-slate-500">Employés assignés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher entrepôts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showInactive ? "default" : "outline"}
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? "Masquer inactifs" : "Afficher inactifs"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Warehouses Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredWarehouses?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <Warehouse className="h-12 w-12 mb-2 opacity-20" />
              <p>Aucun entrepôt trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entrepôt</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead className="text-center">Inventaire</TableHead>
                  <TableHead className="text-center">Employés</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses?.map((warehouse) => (
                  <TableRow key={warehouse.id} className={!warehouse.isActive ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100">
                          <Warehouse className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{warehouse.name}</span>
                            {warehouse.isDefault && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                <Star className="h-3 w-3 mr-1" />
                                Défaut
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{warehouse.code}</Badge>
                    </TableCell>
                    <TableCell>
                      {warehouse.address ? (
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin className="h-3 w-3" />
                          <span className="text-sm">{warehouse.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {warehouse.phone ? (
                        <div className="flex items-center gap-1 text-slate-600">
                          <Phone className="h-3 w-3" />
                          <span className="text-sm">{warehouse.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{warehouse._count.inventory}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{warehouse._count.employees}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {warehouse.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                          Inactif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(warehouse)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          {!warehouse.isDefault && warehouse.isActive && (
                            <DropdownMenuItem
                              onClick={() => setDefaultMutation.mutate(warehouse.id)}
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Définir par défaut
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {warehouse.isActive && !warehouse.isDefault && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => deleteMutation.mutate(warehouse.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Désactiver
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? "Modifier entrepôt" : "Ajouter un entrepôt"}
            </DialogTitle>
            <DialogDescription>
              {editingWarehouse
                ? "Modifiez les détails de l'entrepôt."
                : "Créez un nouvel emplacement d'entrepôt."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Entrepôt principal"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="WH001"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street, City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 890"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm font-medium">Actif</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm font-medium">Définir par défaut</span>
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? "Enregistrement..."
                  : editingWarehouse
                  ? "Modifier"
                  : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

