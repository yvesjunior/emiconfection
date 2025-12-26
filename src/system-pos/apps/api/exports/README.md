# Database Export & Seed Files

Ce dossier contient les exports de la base de données qui peuvent être utilisés pour restaurer les données en cas de problème.

## 📦 Fichiers générés

Chaque export crée deux fichiers :

1. **`database-export-YYYY-MM-DD.json`** : Export brut de toutes les données au format JSON
2. **`seed-from-export-YYYY-MM-DD.ts`** : Fichier seed TypeScript prêt à l'emploi pour restaurer les données

## 🚀 Comment exporter la base de données

```bash
cd src/system-pos/apps/api
npm run export:db
```

Cela créera deux fichiers dans le dossier `exports/` avec la date du jour.

## 🔄 Comment restaurer les données depuis un export

### Option 1 : Utiliser le fichier seed TypeScript

1. Copiez le fichier seed que vous souhaitez utiliser :
   ```bash
   cp exports/seed-from-export-2025-12-26.ts prisma/seed-from-export.ts
   ```

2. Exécutez le seed :
   ```bash
   npx tsx prisma/seed-from-export.ts
   ```

⚠️ **ATTENTION** : Cela supprimera TOUTES les données existantes et les remplacera par les données de l'export !

### Option 2 : Utiliser le fichier JSON directement

Vous pouvez également utiliser le fichier JSON pour restaurer manuellement les données via un script personnalisé.

## 📋 Données exportées

L'export inclut :

- ✅ **Employees** (sans PINs pour des raisons de sécurité)
- ✅ **Warehouses**
- ✅ **Roles & Permissions**
- ✅ **Categories**
- ✅ **Products**
- ✅ **Inventory** (stock par entrepôt)
- ✅ **Customers**
- ✅ **Suppliers**
- ✅ **Settings**
- ✅ **Expense Categories**
- ✅ **Employee-Warehouse assignments**

## ⚠️ Notes importantes

1. **PINs des employés** : Les PINs ne sont PAS exportés pour des raisons de sécurité. Après la restauration, les employés devront réinitialiser leurs PINs.

2. **Dates** : Les dates d'export sont préservées dans les fichiers pour référence.

3. **Relations** : Toutes les relations entre les entités sont préservées (employés-entrepôts, produits-catégories, etc.)

4. **Sécurité** : Ne partagez jamais les fichiers d'export contenant des données sensibles sans les sécuriser d'abord.

## 🔐 Sécurité

- Les PINs des employés ne sont jamais exportés
- Les mots de passe ne sont jamais exportés
- Les tokens d'authentification ne sont jamais exportés

## 📅 Planification d'exports réguliers

Pour automatiser les exports, vous pouvez ajouter une tâche cron :

```bash
# Exporter tous les jours à 2h du matin
0 2 * * * cd /path/to/project/src/system-pos/apps/api && npm run export:db
```

Ou utilisez un script de backup qui archive les anciens exports.

