"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Boxes,
  Users,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";
import api from "@/lib/api";

interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  totalProducts: number;
  lowStockCount: number;
  salesGrowth: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayTransactions: 0,
    totalProducts: 0,
    lowStockCount: 0,
    salesGrowth: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch products count
        const productsRes = await api.get("/products?limit=1");
        const totalProducts = productsRes.data.pagination?.total || 0;

        // Fetch today's sales
        const today = new Date().toISOString().split("T")[0];
        const salesRes = await api.get(`/sales?dateFrom=${today}&limit=10`);
        const todaySalesData = salesRes.data.data || [];
        const todaySales = todaySalesData.reduce(
          (sum: number, sale: any) => sum + Number(sale.total),
          0
        );

        // Fetch low stock
        const lowStockRes = await api.get("/inventory/low-stock");
        const lowStockCount = Array.isArray(lowStockRes.data.data)
          ? lowStockRes.data.data.length
          : 0;

        setStats({
          todaySales,
          todayTransactions: todaySalesData.length,
          totalProducts,
          lowStockCount,
          salesGrowth: 12.5, // Mock growth percentage
        });

        setRecentSales(todaySalesData.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: "Ventes du jour",
      value: formatCurrency(stats.todaySales),
      description: `${stats.todayTransactions} transactions`,
      icon: DollarSign,
      trend: stats.salesGrowth,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Total produits",
      value: formatNumber(stats.totalProducts),
      description: "Produits actifs",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Stock faible",
      value: formatNumber(stats.lowStockCount),
      description: stats.lowStockCount > 0 ? "À réapprovisionner" : "Stock OK",
      icon: stats.lowStockCount > 0 ? AlertTriangle : CheckCircle,
      color: stats.lowStockCount > 0 ? "text-red-600" : "text-emerald-600",
      bgColor: stats.lowStockCount > 0 ? "bg-red-50" : "bg-emerald-50",
    },
    {
      title: "Croissance ventes",
      value: `${stats.salesGrowth > 0 ? "+" : ""}${stats.salesGrowth}%`,
      description: "vs mois dernier",
      icon: TrendingUp,
      trend: stats.salesGrowth,
      color: stats.salesGrowth >= 0 ? "text-emerald-600" : "text-red-600",
      bgColor: stats.salesGrowth >= 0 ? "bg-emerald-50" : "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-500 mt-1">Bienvenue ! Voici ce qui se passe aujourd'hui.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                {stat.trend !== undefined && (
                  <div
                    className={`flex items-center text-xs font-medium ${
                      stat.trend >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {stat.trend >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    )}
                    {Math.abs(stat.trend)}%
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Sales & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ventes récentes</CardTitle>
            <CardDescription>Dernières transactions aujourd'hui</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                <p>Aucune vente aujourd'hui</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {sale.invoiceNumber}
                      </p>
                      <p className="text-sm text-slate-500">
                        {sale.employee?.fullName || "Inconnu"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(Number(sale.total))}
                      </p>
                      <p className="text-xs text-slate-500">
                        {sale._count?.items || 0} articles
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions rapides</CardTitle>
            <CardDescription>Tâches courantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Ajouter produit", href: "/dashboard/products", icon: Plus },
                { label: "Voir inventaire", href: "/dashboard/inventory", icon: Boxes },
                { label: "Voir ventes", href: "/dashboard/sales", icon: ShoppingCart },
                { label: "Gérer employés", href: "/dashboard/employees", icon: Users },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-100">
                    <action.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-sm text-slate-900">{action.label}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

