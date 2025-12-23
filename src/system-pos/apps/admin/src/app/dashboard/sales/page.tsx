"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Receipt,
  Loader2,
  Calendar,
  Eye,
  Download,
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import api from "@/lib/api";

interface Sale {
  id: string;
  invoiceNumber: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
  status: "completed" | "refunded" | "voided";
  createdAt: string;
  employee: { fullName: string } | null;
  customer: { name: string } | null;
  shift: { warehouse: { name: string } } | null;
  items: Array<{
    quantity: string;
    unitPrice: string;
    total: string;
    product: { name: string; sku: string };
  }>;
  payments: Array<{
    method: string;
    amount: string;
  }>;
}

export default function SalesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Fetch sales
  const { data: salesData, isLoading } = useQuery({
    queryKey: ["sales", search, status, dateFrom, dateTo, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });
      if (search) params.append("search", search);
      if (status) params.append("status", status);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      const res = await api.get(`/sales?${params}`);
      return res.data;
    },
  });

  const sales: Sale[] = salesData?.data || [];
  const pagination = salesData?.pagination || { total: 0, pages: 1 };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-700">Completed</Badge>;
      case "refunded":
        return <Badge className="bg-amber-100 text-amber-700">Refunded</Badge>;
      case "voided":
        return <Badge className="bg-red-100 text-red-700">Voided</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historique des ventes</h1>
          <p className="text-slate-500 mt-1">
            Consultez et gérez toutes les transactions ({pagination.total} ventes)
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher par facture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tous statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous statuts</SelectItem>
            <SelectItem value="completed">Complété</SelectItem>
            <SelectItem value="refunded">Remboursé</SelectItem>
            <SelectItem value="voided">Annulé</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-36"
          />
          <span className="text-slate-400">au</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-36"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facture</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Caissier</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Paiement</TableHead>
              <TableHead className="text-right">Total</TableHead>
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
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-500">No sales found</p>
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium font-mono">
                    {sale.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {formatDate(sale.createdAt)}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {sale.employee?.fullName || "—"}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {sale.customer?.name || "Walk-in"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {sale.payments[0]?.method.replace("_", " ") || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(Number(sale.total))}
                  </TableCell>
                  <TableCell>{getStatusBadge(sale.status)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedSale(sale)}
                    >
                      <Eye className="h-4 w-4" />
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
              Page {page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sale Details Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice {selectedSale?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              {/* Sale Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Date</p>
                  <p className="font-medium">{formatDate(selectedSale.createdAt)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedSale.status)}</div>
                </div>
                <div>
                  <p className="text-slate-500">Cashier</p>
                  <p className="font-medium">{selectedSale.employee?.fullName || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Customer</p>
                  <p className="font-medium">{selectedSale.customer?.name || "Walk-in"}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">Items</p>
                <div className="border rounded-lg divide-y">
                  {selectedSale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-3 text-sm">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-slate-500">
                          {item.quantity} × {formatCurrency(Number(item.unitPrice))}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(Number(item.total))}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span>{formatCurrency(Number(selectedSale.subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax</span>
                  <span>{formatCurrency(Number(selectedSale.taxAmount))}</span>
                </div>
                {Number(selectedSale.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(Number(selectedSale.discountAmount))}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(Number(selectedSale.total))}</span>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-500 mb-1">Payment Method</p>
                <p className="font-medium capitalize">
                  {selectedSale.payments[0]?.method.replace("_", " ")} —{" "}
                  {formatCurrency(Number(selectedSale.payments[0]?.amount || 0))}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
