"use client";

import { useEffect, useState } from "react";
import { Settings, Store, Receipt, DollarSign, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await api.get("/settings");
      // API returns { data: { key1: value1, key2: value2, ... } }
      const settingsObj = res.data.data || {};
      // Convert all values to strings for the form inputs
      const settingsMap: Record<string, string> = {};
      Object.entries(settingsObj).forEach(([key, value]) => {
        settingsMap[key] = String(value ?? "");
      });
      setSettings(settingsMap);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // API expects the settings object directly
      await api.put("/settings", settings);
      toast({
        title: "Paramètres enregistrés",
        description: "Les paramètres ont été mis à jour avec succès.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de sauvegarder les paramètres",
      });
    } finally {
      setSaving(false);
    }
  }

  function updateSetting(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">
            Configurez les paramètres de votre boutique
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Informations de la boutique
            </CardTitle>
            <CardDescription>
              Informations générales sur votre entreprise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Nom de la boutique</Label>
              <Input
                id="business_name"
                value={settings.business_name || ""}
                onChange={(e) => updateSetting("business_name", e.target.value)}
                placeholder="Ma Boutique"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_address">Adresse</Label>
              <Input
                id="business_address"
                value={settings.business_address || ""}
                onChange={(e) => updateSetting("business_address", e.target.value)}
                placeholder="123 Rue du Commerce"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_phone">Téléphone</Label>
              <Input
                id="business_phone"
                value={settings.business_phone || ""}
                onChange={(e) => updateSetting("business_phone", e.target.value)}
                placeholder="+226 00 00 00 00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_email">Email</Label>
              <Input
                id="business_email"
                type="email"
                value={settings.business_email || ""}
                onChange={(e) => updateSetting("business_email", e.target.value)}
                placeholder="contact@maboutique.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Currency & Tax */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Devise et taxes
            </CardTitle>
            <CardDescription>
              Configuration de la devise et du taux de taxe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Input
                id="currency"
                value={settings.currency || ""}
                onChange={(e) => updateSetting("currency", e.target.value)}
                placeholder="XOF"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency_symbol">Symbole de devise</Label>
              <Input
                id="currency_symbol"
                value={settings.currency_symbol || ""}
                onChange={(e) => updateSetting("currency_symbol", e.target.value)}
                placeholder="FCFA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_rate">Taux de taxe (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                value={settings.tax_rate || ""}
                onChange={(e) => updateSetting("tax_rate", e.target.value)}
                placeholder="18"
              />
            </div>
          </CardContent>
        </Card>

        {/* Receipt Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Reçus
            </CardTitle>
            <CardDescription>
              Personnalisez vos reçus de vente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receipt_footer">Message de fin de reçu</Label>
              <Input
                id="receipt_footer"
                value={settings.receipt_footer || ""}
                onChange={(e) => updateSetting("receipt_footer", e.target.value)}
                placeholder="Merci pour votre achat !"
              />
            </div>
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Inventaire
            </CardTitle>
            <CardDescription>
              Paramètres de gestion de l'inventaire
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold">Seuil de stock bas (par défaut)</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                value={settings.low_stock_threshold || ""}
                onChange={(e) => updateSetting("low_stock_threshold", e.target.value)}
                placeholder="10"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

