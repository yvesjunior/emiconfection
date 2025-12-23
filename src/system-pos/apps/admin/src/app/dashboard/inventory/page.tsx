"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Package,
  Loader2,
  AlertTriangle,
  ArrowUpDown,
  Plus,
  Minus,
  ArrowRightLeft,
  History,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";

interface InventoryItem {
  id: string;
  quantity: string;
  minStockLevel: string;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  employee: {
    id: string;
    fullName: string;
  } | null;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("stock");
  const [search, setSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [showLowStock, setShowLowStock] = useState(false);
  const [page, setPage] = useState(1);
  
  // Adjust dialog state
  const [adjustDialog, setAdjustDialog] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  // Transfer dialog state
  const [transferDialog, setTransferDialog] = useState(false);
  const [transferProduct, setTransferProduct] = useState("");
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const currentWarehouse = useAuthStore((state) => state.currentWarehouse);
  const currentWarehouseId = currentWarehouse?.id;

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await api.get("/warehouses?includeInactive=false");
      return res.data.data;
    },
  });

  const warehouses: Warehouse[] = warehousesData || [];

  // Fetch products for transfer
  const { data: productsData } = useQuery({
    queryKey: ["products-simple"],
    queryFn: async () => {
      const res = await api.get("/products?limit=100");
      return res.data.data;
    },
  });

  const products: Product[] = productsData || [];

  // Fetch inventory
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ["inventory", search, selectedWarehouse, showLowStock, page, currentWarehouseId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (search) params.append("search", search);
      if (selectedWarehouse && selectedWarehouse !== "all") params.append("warehouseId", selectedWarehouse);
      if (showLowStock) params.append("lowStock", "true");
      const res = await api.get(`/inventory?${params}`);
      return res.data;
    },
  });

  const inventory: InventoryItem[] = inventoryData?.data || [];
  const pagination = inventoryData?.pagination || { total: 0, pages: 1 };

  // Fetch stock movements
  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ["stock-movements", selectedWarehouse, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (selectedWarehouse && selectedWarehouse !== "all") params.append("warehouseId", selectedWarehouse);
      const res = await api.get(`/inventory/movements?${params}`);
      return res.data;
    },
    enabled: activeTab === "movements",
  });

  const movements: StockMovement[] = movementsData?.data || [];
  const movementsPagination = movementsData?.pagination || { total: 0, pages: 1 };

  // Fetch low stock alerts
  const { data: lowStockData } = useQuery({
    queryKey: ["low-stock", currentWarehouseId],
    queryFn: async () => {
      const res = await api.get("/inventory/low-stock");
      return res.data.data;
    },
  });

  const lowStockCount = Array.isArray(lowStockData) ? lowStockData.length : 0;

  // Adjust stock mutation
  const adjustMutation = useMutation({
    mutationFn: async (data: {
      productId: string;
      warehouseId: string;
      quantity: number;
      reason: string;
    }) => {
      return api.post("/inventory/adjust", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      setAdjustDialog(null);
      setAdjustQuantity("");
      setAdjustReason("");
      toast({
        title: "Stock ajusté",
        description: "L'inventaire a été mis à jour avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Échec de l'ajustement du stock",
        variant: "destructive",
      });
    },
  });

  // Transfer stock mutation
  const transferMutation = useMutation({
    mutationFn: async (data: {
      productId: string;
      fromWarehouseId: string;
      toWarehouseId: string;
      quantity: number;
      notes?: string;
    }) => {
      return api.post("/inventory/transfer", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      setTransferDialog(false);
      resetTransferForm();
      toast({
        title: "Transfert effectué",
        description: "Le stock a été transféré avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Échec du transfert",
        variant: "destructive",
      });
    },
  });

  const handleAdjustSubmit = () => {
    if (!adjustDialog || !adjustQuantity) return;

    const qty = parseInt(adjustQuantity);
    adjustMutation.mutate({
      productId: adjustDialog.product.id,
      warehouseId: adjustDialog.warehouse.id,
      quantity: adjustType === "add" ? qty : -qty,
      reason: adjustReason || `Ajustement manuel (${adjustType === "add" ? "ajout" : "retrait"})`,
    });
  };

  const handleTransferSubmit = () => {
    if (!transferProduct || !transferFrom || !transferTo || !transferQuantity) return;

    transferMutation.mutate({
      productId: transferProduct,
      fromWarehouseId: transferFrom,
      toWarehouseId: transferTo,
      quantity: parseInt(transferQuantity),
      notes: transferNotes || undefined,
    });
  };

  const resetTransferForm = () => {
    setTransferProduct("");
    setTransferFrom("");
    setTransferTo("");
    setTransferQuantity("");
    setTransferNotes("");
  };

  const isLowStock = (item: InventoryItem) => {
    return Number(item.quantity) <= Number(item.minStockLevel);
  };

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case "sale":
        return <Badge className="bg-blue-100 text-blue-700">Vente</Badge>;
      case "purchase":
        return <Badge className="bg-green-100 text-green-700">Achat</Badge>;
      case "adjustment":
        return <Badge className="bg-amber-100 text-amber-700">Ajustement</Badge>;
      case "transfer":
        return <Badge className="bg-purple-100 text-purple-700">Transfert</Badge>;
      case "return":
        return <Badge className="bg-pink-100 text-pink-700">Retour</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventaire</h1>
          <p className="text-slate-500 mt-1">
            Surveillez et gérez les niveaux de stock
          </p>
        </div>
        <Button onClick={() => setTransferDialog(true)} className="gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Transfert de stock
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-800">Alerte stock faible</p>
            <p className="text-sm text-amber-700">
              {lowStockCount} produit{lowStockCount !== 1 ? "s" : ""} à réapprovisionner
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={() => setShowLowStock(!showLowStock)}
          >
            {showLowStock ? "Voir tout" : "Voir stock faible"}
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="stock" className="gap-2">
            <Package className="h-4 w-4" />
            Stock actuel
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2">
            <History className="h-4 w-4" />
            Mouvements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher produits..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous entrepôts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous entrepôts</SelectItem>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Inventory Table */}
          <div className="border rounded-lg bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Entrepôt</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead className="text-right">Seuil min</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                    </TableCell>
                  </TableRow>
                ) : inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                      <p className="text-slate-500">Aucun article en stock trouvé</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Créez des produits et ajoutez du stock pour les voir ici
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-slate-900">
                        {item.product.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-600">
                        {item.product.sku}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.warehouse.name}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-semibold ${
                            isLowStock(item) ? "text-red-600" : "text-slate-900"
                          }`}
                        >
                          {Number(item.quantity)} {item.product.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-slate-600">
                        {Number(item.minStockLevel)}
                      </TableCell>
                      <TableCell>
                        {isLowStock(item) ? (
                          <Badge className="bg-red-100 text-red-700">Stock faible</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700">En stock</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdjustDialog(item)}
                          className="gap-1"
                        >
                          <ArrowUpDown className="h-3 w-3" />
                          Ajuster
                        </Button>
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
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          {/* Filter by warehouse */}
          <div className="flex gap-4">
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous entrepôts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous entrepôts</SelectItem>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Movements Table */}
          <div className="border rounded-lg bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entrepôt</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead>Par</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movementsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                    </TableCell>
                  </TableRow>
                ) : movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <History className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                      <p className="text-slate-500">Aucun mouvement de stock</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="text-sm text-slate-600">
                        {formatDate(movement.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{movement.product.name}</p>
                          <p className="text-xs text-slate-500">{movement.product.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getMovementTypeBadge(movement.type)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{movement.warehouse.name}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-semibold ${
                            movement.quantity > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {movement.quantity > 0 ? "+" : ""}
                          {movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {movement.employee?.fullName || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">
                        {movement.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {movementsPagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-slate-500">
                  Page {page} sur {movementsPagination.pages}
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
                    disabled={page === movementsPagination.pages}
                    onClick={() => setPage(page + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Adjust Stock Dialog */}
      <Dialog open={!!adjustDialog} onOpenChange={() => setAdjustDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajuster le stock</DialogTitle>
          </DialogHeader>
          {adjustDialog && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="font-medium">{adjustDialog.product.name}</p>
                <p className="text-sm text-slate-500">
                  {adjustDialog.warehouse.name} • Actuel : {Number(adjustDialog.quantity)} {adjustDialog.product.unit}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={adjustType === "add" ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => setAdjustType("add")}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter
                </Button>
                <Button
                  variant={adjustType === "remove" ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => setAdjustType("remove")}
                >
                  <Minus className="h-4 w-4" />
                  Retirer
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  placeholder="Entrez la quantité"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Raison (optionnel)</Label>
                <Input
                  id="reason"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ex : Réception, Casse, Inventaire..."
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAdjustDialog(null)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleAdjustSubmit}
                  disabled={!adjustQuantity || adjustMutation.isPending}
                >
                  {adjustMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Confirmer
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Stock Dialog */}
      <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transfert de stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-product">Produit *</Label>
              <Select value={transferProduct} onValueChange={setTransferProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transfer-from">De *</Label>
                <Select value={transferFrom} onValueChange={setTransferFrom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id} disabled={wh.id === transferTo}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-to">Vers *</Label>
                <Select value={transferTo} onValueChange={setTransferTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id} disabled={wh.id === transferFrom}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-quantity">Quantité *</Label>
              <Input
                id="transfer-quantity"
                type="number"
                min="1"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(e.target.value)}
                placeholder="Entrez la quantité"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-notes">Notes (optionnel)</Label>
              <Input
                id="transfer-notes"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="Ex : Réapprovisionnement magasin..."
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setTransferDialog(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleTransferSubmit}
                disabled={
                  !transferProduct ||
                  !transferFrom ||
                  !transferTo ||
                  !transferQuantity ||
                  transferMutation.isPending
                }
              >
                {transferMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Transférer
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
