"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  MoreHorizontal,
  Loader2,
  X,
  Check,
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
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, cn } from "@/lib/utils";
import api from "@/lib/api";

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  isActive?: boolean;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  costPrice: string;
  sellingPrice: string;
  transportFee?: string;
  isActive: boolean;
  categories: Category[];
  inventory: Array<{ 
    quantity: string; 
    warehouseId?: string;
    minStockLevel?: number;
    warehouse: { id: string; name: string } 
  }>;
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    description: "",
    costPrice: "",
    transportFee: "0",
    sellingPrice: "",
    stock: "0",
    minStockLevel: "1",
    categoryIds: [] as string[],
    warehouseId: "",
  });

  // Category selector state
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Generate SKU from name (clean, uppercase, hyphenated)
  const generateSku = (name: string) => {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special chars
      .trim()
      .toUpperCase()
      .split(/\s+/)
      .filter(Boolean)
      .join("-");
  };

  // Auto-generate SKU when name changes (only for new products)
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Only auto-generate SKU for new products
      sku: !editingProduct ? generateSku(name) : prev.sku,
    }));
  };

  // Fetch categories with hierarchy
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data.data;
    },
  });

  const categories: Category[] = (categoriesData || []).map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    parentId: cat.parentId || null,
    isActive: cat.isActive ?? true,
  }));

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await api.get("/warehouses");
      return res.data.data;
    },
  });

  const warehouses: Array<{ id: string; name: string; isDefault?: boolean }> = warehousesData || [];
  const defaultWarehouse = warehouses.find((w) => w.isDefault);

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", search, selectedCategory, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });
      if (search) params.append("search", search);
      if (selectedCategory) params.append("categoryId", selectedCategory);
      const res = await api.get(`/products?${params}`);
      return res.data;
    },
  });

  const products: Product[] = productsData?.data || [];
  const pagination = productsData?.pagination || { total: 0, pages: 1 };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        name: data.name,
        sku: data.sku,
        barcode: data.barcode || null,
        description: data.description || null,
        costPrice: parseFloat(data.costPrice) || 0,
        transportFee: parseFloat(data.transportFee) || 0,
        sellingPrice: parseFloat(data.sellingPrice),
        stock: parseInt(data.stock) || 0,
        minStockLevel: parseInt(data.minStockLevel) || 1,
        categoryIds: data.categoryIds.length > 0 ? data.categoryIds : undefined,
        warehouseId: data.warehouseId || undefined,
      };

      if (editingProduct) {
        return api.put(`/products/${editingProduct.id}`, payload);
      }
      return api.post("/products", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: editingProduct ? "Produit modifié" : "Produit créé",
        description: `${formData.name} a été ${editingProduct ? "modifié" : "créé"} avec succès.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Échec de l'enregistrement du produit",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteConfirm(null);
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Échec de la suppression du produit",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      barcode: "",
      description: "",
      costPrice: "",
      transportFee: "0",
      sellingPrice: "",
      stock: "0",
      minStockLevel: "1",
      categoryIds: [],
      warehouseId: defaultWarehouse?.id || "",
    });
    setEditingProduct(null);
    setCategoryDropdownOpen(false);
  };

  // Get total stock from inventory
  const getTotalStock = (product: Product) => {
    return product.inventory?.reduce((sum, inv) => sum + Number(inv.quantity), 0) || 0;
  };

  // Get min stock level from first inventory entry
  const getMinStockLevel = (product: Product) => {
    return (product.inventory?.[0] as any)?.minStockLevel || 1;
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    // Get warehouse ID from first inventory entry
    const productWarehouseId = (product as any).inventory?.[0]?.warehouseId || 
                                (product as any).inventory?.[0]?.warehouse?.id || 
                                defaultWarehouse?.id || "";
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || "",
      description: product.description || "",
      costPrice: product.costPrice,
      transportFee: (product as any).transportFee || "0",
      sellingPrice: product.sellingPrice,
      stock: String(getTotalStock(product)),
      minStockLevel: String(getMinStockLevel(product)),
      categoryIds: product.categories?.map((c) => c.id) || [],
      warehouseId: productWarehouseId,
    });
    setIsDialogOpen(true);
  };

  const toggleCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const selectAllCategories = () => {
    const allCategoryIds = categories.map((cat) => cat.id);
    setFormData((prev) => ({
      ...prev,
      categoryIds: allCategoryIds,
    }));
  };

  const deselectAllCategories = () => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: [],
    }));
  };

  const areAllSelected = categories.length > 0 && 
    categories.every((cat) => formData.categoryIds.includes(cat.id));

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || categoryId;
  };

  // Group categories by parent for hierarchical display
  const parentCategories = categories.filter((c) => !c.parentId);
  const getChildCategories = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one category is selected
    if (formData.categoryIds.length === 0) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez sélectionner au moins une catégorie",
        variant: "destructive",
      });
      return;
    }
    
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Produits</h1>
          <p className="text-slate-500 mt-1">
            Gérez votre catalogue de produits ({pagination.total} produits)
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
          Ajouter produit
        </Button>
      </div>

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
        <Select 
          value={selectedCategory || "all"} 
          onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Toutes catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {parentCategories.map((parent) => (
              <div key={parent.id}>
                <SelectItem value={parent.id} className="font-medium">
                  {parent.name}
                </SelectItem>
                {getChildCategories(parent.id).map((child) => (
                  <SelectItem key={child.id} value={child.id} className="pl-6">
                    └ {child.name}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">Coût</TableHead>
              <TableHead className="text-right">Prix</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-500">Aucun produit trouvé</p>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">{product.name}</p>
                      {product.barcode && (
                        <p className="text-xs text-slate-500">{product.barcode}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell>
                    {product.categories && product.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {product.categories.slice(0, 2).map((cat) => (
                          <Badge key={cat.id} variant="secondary" className="text-xs">
                            {cat.name}
                          </Badge>
                        ))}
                        {product.categories.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.categories.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(product.costPrice))}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(product.sellingPrice))}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        getTotalStock(product) <= 10
                          ? "text-red-600 font-medium"
                          : ""
                      }
                    >
                      {getTotalStock(product)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.isActive ? "default" : "secondary"}
                      className={product.isActive ? "bg-emerald-100 text-emerald-700" : ""}
                    >
                      {product.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(product.id)}
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
              {editingProduct ? "Modifier produit" : "Ajouter un produit"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Poupée Barbie, Biberon Avent..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku" className="text-slate-500">SKU (auto)</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  className="font-mono text-sm bg-slate-100 text-slate-600"
                  readOnly={!editingProduct}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Code-barres</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Optionnel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catégories *</Label>
              {/* Selected categories */}
              {formData.categoryIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {formData.categoryIds.map((catId) => (
                    <Badge
                      key={catId}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {getCategoryName(catId)}
                      <button
                        type="button"
                        onClick={() => toggleCategory(catId)}
                        className="ml-1 rounded-full hover:bg-slate-300 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {/* Category selector */}
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {/* Select All / Deselect All Button */}
                {categories.length > 0 && (
                  <button
                    type="button"
                    onClick={areAllSelected ? deselectAllCategories : selectAllCategories}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium hover:bg-slate-50 text-blue-600 border-b"
                  >
                    {areAllSelected ? (
                      <>
                        <Check className="h-4 w-4" />
                        Tout désélectionner
                      </>
                    ) : (
                      <>
                        <div className="h-4 w-4 border border-slate-400 rounded" />
                        Tout sélectionner
                      </>
                    )}
                  </button>
                )}
                {parentCategories.map((parent) => (
                  <div key={parent.id}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(parent.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 text-left font-medium",
                        formData.categoryIds.includes(parent.id) && "bg-blue-50 text-blue-700"
                      )}
                    >
                      {parent.name}
                      {formData.categoryIds.includes(parent.id) && (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    {/* Child categories */}
                    {getChildCategories(parent.id).map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => toggleCategory(child.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 pl-6 text-sm hover:bg-slate-50 text-left",
                          formData.categoryIds.includes(child.id) && "bg-blue-50 text-blue-700"
                        )}
                      >
                        <span className="text-slate-500">└</span>
                        <span className="flex-1 ml-2">{child.name}</span>
                        {formData.categoryIds.includes(child.id) && (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              {formData.categoryIds.length === 0 && (
                <p className="text-xs text-slate-500">Sélectionnez au moins une catégorie</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Prix d'achat</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transportFee">Transport</Label>
                <Input
                  id="transportFee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.transportFee}
                  onChange={(e) => setFormData({ ...formData, transportFee: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Prix vente *</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse">Entrepôt *</Label>
              <Select
                value={formData.warehouseId}
                onValueChange={(value) => setFormData({ ...formData, warehouseId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un entrepôt" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} {warehouse.isDefault && "(Par défaut)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock disponible</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStockLevel">Seuil d'alerte</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
                {editingProduct ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer produit</DialogTitle>
          </DialogHeader>
          <p className="text-slate-500">
            Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
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
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
