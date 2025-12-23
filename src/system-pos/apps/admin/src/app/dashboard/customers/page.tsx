"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  User,
  Phone,
  ShoppingBag,
  Star,
  MoreHorizontal,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import api from "@/lib/api";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  loyaltyPoints: number;
  createdAt: string;
  _count: {
    sales: number;
  };
}

interface CustomerSale {
  id: string;
  invoiceNumber: string;
  total: string;
  status: string;
  createdAt: string;
  employee: { id: string; fullName: string };
  _count: { items: number };
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    notes: "",
  });

  // Fetch customers
  const { data: customersData, isLoading } = useQuery({
    queryKey: ["customers", page, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (searchQuery) params.append("search", searchQuery);
      const res = await api.get(`/customers?${params}`);
      return res.data as PaginatedResponse<Customer>;
    },
  });

  // Fetch customer sales when viewing
  const { data: customerSales, isLoading: loadingSales } = useQuery({
    queryKey: ["customer-sales", viewingCustomer?.id],
    queryFn: async () => {
      if (!viewingCustomer) return null;
      const res = await api.get(`/customers/${viewingCustomer.id}/sales?limit=10`);
      return res.data as PaginatedResponse<CustomerSale>;
    },
    enabled: !!viewingCustomer,
  });

  // Save customer (create/update)
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        name: data.name || null,
        phone: data.phone || null,
        notes: data.notes || null,
      };
      if (editingCustomer) {
        return api.put(`/customers/${editingCustomer.id}`, payload);
      }
      return api.post("/customers", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: editingCustomer ? "Client modifié" : "Client créé",
        description: editingCustomer
          ? "Le client a été modifié avec succès."
          : "Le nouveau client a été créé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Échec de l'enregistrement du client",
        variant: "destructive",
      });
    },
  });

  // Delete customer
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Client supprimé",
        description: "Le client a été supprimé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Échec de la suppression du client",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      notes: "",
    });
    setEditingCustomer(null);
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || "",
      phone: customer.phone || "",
      notes: customer.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name && !formData.phone) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez fournir au moins un nom ou un numéro de téléphone.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  const getInitials = (name: string | null, phone: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (phone) {
      return phone.slice(-2);
    }
    return "?";
  };

  const getDisplayName = (customer: Customer) => {
    if (customer.name) return customer.name;
    if (customer.phone) return customer.phone;
    return "Client inconnu";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-emerald-100 text-emerald-700">Complété</Badge>;
      case "REFUNDED":
        return <Badge className="bg-amber-100 text-amber-700">Remboursé</Badge>;
      case "VOIDED":
        return <Badge className="bg-red-100 text-red-700">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Summary stats
  const customers = customersData?.data || [];
  const pagination = customersData?.pagination;
  const stats = {
    total: pagination?.total || 0,
    withPurchases: customers.filter((c) => c._count.sales > 0).length,
    totalLoyaltyPoints: customers.reduce((sum, c) => sum + c.loyaltyPoints, 0),
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 mt-1">Gérez votre base de données clients</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Total clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <ShoppingBag className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.withPurchases}</p>
                <p className="text-sm text-slate-500">Avec achats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalLoyaltyPoints}</p>
                <p className="text-sm text-slate-500">Points de fidélité</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher par nom ou téléphone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <User className="h-12 w-12 mb-2 opacity-20" />
              <p>Aucun client trouvé</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead className="text-center">Achats</TableHead>
                    <TableHead className="text-center">Points fidélité</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Inscrit le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm">
                              {getInitials(customer.name, customer.phone)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900">{getDisplayName(customer)}</p>
                            {customer.notes && (
                              <p className="text-xs text-slate-500 truncate max-w-[150px]">
                                {customer.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.phone ? (
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{customer._count.sales}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {customer.loyaltyPoints > 0 ? (
                          <Badge className="bg-amber-100 text-amber-700">
                            <Star className="h-3 w-3 mr-1" />
                            {customer.loyaltyPoints}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.notes ? (
                          <span className="text-sm text-slate-600 truncate max-w-[150px] block">
                            {customer.notes}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {formatDate(customer.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingCustomer(customer)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(customer)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => deleteMutation.mutate(customer.id)}
                              disabled={customer._count.sales > 0}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-slate-500">
                    Affichage {(pagination.page - 1) * pagination.limit + 1} à{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} sur{" "}
                    {pagination.total} clients
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-slate-600">
                      Page {pagination.page} sur {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Modifier le client" : "Ajouter un client"}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? "Modifiez les informations du client."
                : "Ajoutez un nouveau client à votre base de données."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                💡 Un nom ou un numéro de téléphone est requis. L'historique d'achat est suivi automatiquement pour les remises.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Client VIP, préfère payer en espèces..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? "Enregistrement..."
                  : editingCustomer
                  ? "Modifier"
                  : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Customer Details Dialog */}
      <Dialog open={!!viewingCustomer} onOpenChange={() => setViewingCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du client</DialogTitle>
            <DialogDescription>Informations et historique d'achat du client</DialogDescription>
          </DialogHeader>

          {viewingCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg">
                    {getInitials(viewingCustomer.name, viewingCustomer.phone)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{getDisplayName(viewingCustomer)}</h3>
                  {viewingCustomer.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                      <Phone className="h-4 w-4" />
                      {viewingCustomer.phone}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-600">
                    <Star className="h-4 w-4" />
                    <span className="font-semibold">{viewingCustomer.loyaltyPoints}</span>
                  </div>
                  <p className="text-xs text-slate-500">Loyalty Points</p>
                </div>
              </div>

              {/* Stats for Discount Eligibility */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-emerald-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {viewingCustomer._count.sales}
                  </p>
                  <p className="text-xs text-emerald-700">Total achats</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(
                      customerSales?.data?.reduce(
                        (sum, sale) => sum + (sale.status === "COMPLETED" ? Number(sale.total) : 0),
                        0
                      ) || 0
                    )}
                  </p>
                  <p className="text-xs text-blue-700">Total dépensé</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {viewingCustomer.loyaltyPoints}
                  </p>
                  <p className="text-xs text-amber-700">Points fidélité</p>
                </div>
              </div>

              {/* Purchase History */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Historique d'achat</h4>
                {loadingSales ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  </div>
                ) : customerSales?.data?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-500 bg-slate-50 rounded-lg">
                    <FileText className="h-8 w-8 mb-2 opacity-20" />
                    <p>Aucun historique d'achat</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Facture</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Articles</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerSales?.data?.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {formatDate(sale.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{sale._count.items} articles</Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(Number(sale.total))}
                            </TableCell>
                            <TableCell>{getStatusBadge(sale.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {viewingCustomer.notes && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Notes</h4>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                    {viewingCustomer.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

