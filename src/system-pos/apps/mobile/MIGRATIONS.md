# Migrations de Base de Données

Ce document liste toutes les migrations nécessaires pour les nouvelles fonctionnalités.

## Migration: Stock Transfer Requests et Loyalty Points

**Fichier:** `prisma/migrations/20251225000000_add_stock_transfer_requests_and_loyalty_points/migration.sql`

### Tables Créées

#### 1. `stock_transfer_requests`
Table pour gérer les demandes de transfert de stock entre entrepôts.

**Colonnes:**
- `id` (TEXT, PRIMARY KEY) - Identifiant unique
- `product_id` (TEXT, FOREIGN KEY → products.id) - Produit à transférer
- `from_warehouse_id` (TEXT, FOREIGN KEY → warehouses.id) - Entrepôt source
- `to_warehouse_id` (TEXT, FOREIGN KEY → warehouses.id) - Entrepôt destination
- `quantity` (DECIMAL(10,3)) - Quantité à transférer
- `status` (TEXT, DEFAULT 'pending') - Statut: pending, approved, rejected
- `requested_by` (TEXT, FOREIGN KEY → employees.id) - Employé qui a fait la demande
- `approved_by` (TEXT, NULLABLE, FOREIGN KEY → employees.id) - Employé qui a approuvé/rejeté
- `notes` (TEXT, NULLABLE) - Notes optionnelles
- `created_at` (TIMESTAMP) - Date de création
- `updated_at` (TIMESTAMP) - Date de mise à jour

**Index:**
- Index sur `product_id`
- Index sur `from_warehouse_id`
- Index sur `to_warehouse_id`
- Index sur `requested_by`
- Index sur `approved_by`
- Index sur `status`

**Relations:**
- `product` → `Product` (many-to-one)
- `fromWarehouse` → `Warehouse` (many-to-one, relation "TransferFrom")
- `toWarehouse` → `Warehouse` (many-to-one, relation "TransferTo")
- `requester` → `Employee` (many-to-one, relation "TransferRequester")
- `approver` → `Employee` (many-to-one, nullable, relation "TransferApprover")

### Colonnes Ajoutées

#### 2. `sales.loyalty_points_used`
Colonne ajoutée à la table `sales` pour tracker les points de fidélité utilisés lors d'une vente.

**Colonne:**
- `loyalty_points_used` (INTEGER, DEFAULT 0) - Nombre de points de fidélité utilisés pour la remise

## Application de la Migration

Pour appliquer cette migration :

```bash
cd src/system-pos/apps/api
npx prisma migrate deploy
```

Ou si vous utilisez `migrate dev` :

```bash
npx prisma migrate dev
```

## Vérification

Pour vérifier que la migration a été appliquée :

```bash
npx prisma migrate status
```

Pour vérifier les tables dans la base de données :

```sql
-- Vérifier la table stock_transfer_requests
SELECT * FROM information_schema.tables 
WHERE table_name = 'stock_transfer_requests';

-- Vérifier la colonne loyalty_points_used dans sales
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'sales' AND column_name = 'loyalty_points_used';
```

## Notes Importantes

1. **Stock Transfer Requests**: Cette table permet de gérer le workflow d'approbation des transferts de stock entre entrepôts. Seuls les Managers assignés à l'entrepôt source peuvent approuver les demandes.

2. **Loyalty Points Used**: Cette colonne permet de tracker combien de points de fidélité ont été utilisés lors d'une vente, ce qui est nécessaire pour :
   - Déduire les points du client
   - Traçabilité des remises appliquées
   - Rapports et analyses

3. **Contraintes**: Les foreign keys sont configurées avec `ON DELETE RESTRICT` pour empêcher la suppression accidentelle de données liées, sauf pour `approved_by` qui utilise `ON DELETE SET NULL` car l'approbateur peut être supprimé sans affecter l'historique.

