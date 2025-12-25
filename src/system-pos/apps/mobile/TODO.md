# Liste des Tâches d'Implémentation

Ce document liste toutes les fonctionnalités documentées dans `ARCHITECTURE.md` et `QUICK_REFERENCE.md` qui nécessitent une implémentation dans le code.

---

## 📋 Système de Points de Fidélité

### API (Backend)

#### 1. Modèle de Données
- [ ] **loyalty-1**: Créer modèle Prisma `SystemSettings` avec champs:
  - `loyaltyPointsAttributionRate` (Decimal) - Taux d'attribution (ex: 1% = 0.01)
  - `loyaltyPointsConversionRate` (Decimal) - Taux de conversion (ex: 1000 pts = 1000 FCFA = 1.0)
  - `updatedBy` (String) - ID de l'employé qui a modifié
  - `updatedAt` (DateTime)

#### 2. Endpoints de Configuration
- [ ] **loyalty-2**: Créer endpoints pour gérer les paramètres de points de fidélité:
  - `GET /api/settings/loyalty-points` - Récupérer les paramètres actuels
  - `PUT /api/settings/loyalty-points` - Modifier les paramètres (Admin uniquement)
  - Validation: taux d'attribution et conversion doivent être positifs

#### 3. Attribution Automatique des Points
- [ ] **loyalty-3**: Modifier `createSale` dans `sales.service.ts` pour:
  - Récupérer les paramètres de points de fidélité
  - Si un client est associé à la vente:
    - Calculer les points à attribuer: `total * attributionRate`
    - Appeler `addLoyaltyPoints` pour ajouter les points au client
  - Enregistrer les points attribués dans un champ de la vente (optionnel pour traçabilité)

#### 4. Utilisation des Points pour Remise
- [ ] **loyalty-4**: Ajouter champ `loyaltyPointsUsed` dans le schéma de vente:
  - Modifier `createSaleSchema` pour inclure `loyaltyPointsUsed: z.number().min(0).optional()`
  - Ajouter colonne `loyalty_points_used` dans le modèle Prisma `Sale`
  
- [ ] **loyalty-5**: Créer endpoint pour déduire les points:
  - `POST /api/customers/:id/redeem-points`
  - Paramètres: `points` (nombre de points à utiliser)
  - Validation:
    - Vérifier que le client a suffisamment de points
    - Calculer la remise équivalente: `points * conversionRate`
  - Retourner: `{ discountAmount, remainingPoints }`

### Mobile (Frontend)

#### 5. Écran de Configuration
- [ ] **loyalty-6**: Créer écran `settings-loyalty.tsx`:
  - Accessible uniquement par Admin dans le menu "Plus" → "Paramètres"
  - Champs:
    - Taux d'attribution (input numérique avec pourcentage ou points par montant)
    - Taux de conversion (input numérique: X points = Y FCFA)
  - Bouton "Enregistrer" pour sauvegarder les paramètres
  - Afficher les paramètres actuels au chargement

#### 6. Intégration dans le Panier
- [ ] **loyalty-7**: Modifier `cart.tsx` pour:
  - Afficher les points disponibles du client sélectionné (si client existe)
  - Si le client a des points > 0:
    - Afficher une alerte avec options:
      - "Utiliser X points pour remise" (calculer remise selon taux de conversion)
      - "Accumuler de nouveaux points"
    - Si "Utiliser points":
      - Calculer la remise maximale possible (points disponibles * taux de conversion)
      - Permettre au staff de choisir le montant de remise (max = remise maximale)
      - Appliquer la remise au total de la vente
      - Déduire les points utilisés du solde client

- [ ] **loyalty-8**: Implémenter logique de conversion points → remise:
  - Récupérer le taux de conversion depuis les paramètres
  - Calculer: `discountAmount = pointsToUse * conversionRate`
  - Valider que la remise ne dépasse pas le total de la vente
  - Afficher le montant de remise dans le récapitulatif du panier

- [ ] **loyalty-9**: Modifier l'appel API `createSale` pour inclure:
  - `loyaltyPointsUsed` si le client utilise des points
  - L'API doit déduire les points du client lors de la création de la vente

---

## 🔄 Système d'Approbation des Transferts

### API (Backend)

#### 1. Modèle de Données
- [ ] **transfer-1**: Créer modèle Prisma `StockTransferRequest`:
  ```prisma
  model StockTransferRequest {
    id              String   @id @default(uuid())
    productId       String   @map("product_id")
    fromWarehouseId String   @map("from_warehouse_id")
    toWarehouseId   String   @map("to_warehouse_id")
    quantity        Decimal  @db.Decimal(10, 3)
    status          String   @default("pending") // pending, approved, rejected
    requestedBy     String   @map("requested_by")
    approvedBy      String?  @map("approved_by")
    notes           String?
    createdAt       DateTime @default(now()) @map("created_at")
    updatedAt       DateTime @updatedAt @map("updated_at")
    
    product       Product   @relation(fields: [productId], references: [id])
    fromWarehouse Warehouse @relation("TransferFrom", fields: [fromWarehouseId], references: [id])
    toWarehouse   Warehouse @relation("TransferTo", fields: [toWarehouseId], references: [id])
    requester     Employee  @relation("TransferRequester", fields: [requestedBy], references: [id])
    approver      Employee? @relation("TransferApprover", fields: [approvedBy], references: [id])
    
    @@map("stock_transfer_requests")
  }
  ```

#### 2. Endpoints de Demande
- [ ] **transfer-2**: Créer endpoints pour les demandes de transfert:
  - `POST /api/inventory/transfer-requests` - Créer une demande
    - Validation: vérifier que l'entrepôt source a suffisamment de stock
    - Créer la demande avec status "pending"
  - `GET /api/inventory/transfer-requests` - Lister les demandes
    - Filtrage selon rôle:
      - Seller: uniquement ses demandes
      - Manager: demandes pour ses entrepôts assignés (source)
      - Admin: toutes les demandes

#### 3. Endpoint d'Approbation
- [ ] **transfer-3**: Créer endpoint pour approuver/rejeter:
  - `PUT /api/inventory/transfer-requests/:id/approve`
  - Paramètres: `{ status: 'approved' | 'rejected', notes?: string }`
  - Validation:
    - Vérifier que l'utilisateur est Manager assigné à l'entrepôt source OU Admin
    - Vérifier que le statut est "pending"
    - Vérifier que le stock source est toujours suffisant
  - Si approuvé: appeler `transferStock` pour appliquer le transfert

#### 4. Logique de Transfert Direct
- [ ] **transfer-4**: Modifier `transferStock` pour détecter transfert direct:
  - Vérifier si l'utilisateur est Manager assigné aux deux entrepôts (source ET destination)
  - Si oui: appliquer le transfert directement (comportement actuel)
  - Si non: créer une demande de transfert avec status "pending"

- [ ] **transfer-5**: Lors de l'approbation:
  - Appeler `transferStock` pour appliquer le transfert
  - Mettre à jour le statut de la demande à "approved"
  - Enregistrer l'ID de l'approbateur

### Mobile (Frontend)

#### 5. Écran de Liste des Demandes
- [ ] **transfer-6**: Créer écran `transfer-requests-list.tsx`:
  - Lister les demandes de transfert avec filtrage selon rôle
  - Colonnes: Produit, Source, Destination, Quantité, Statut, Demandeur, Date
  - Filtres: Statut (pending/approved/rejected), Entrepôt
  - Navigation vers le détail d'une demande
  - Accessible depuis le menu "Plus" → "Demandes de transfert"

#### 6. Modification du Workflow de Transfert
- [ ] **transfer-7**: Modifier `products-manage.tsx`:
  - Au lieu de créer un transfert direct, vérifier les permissions:
    - Si Manager assigné aux deux entrepôts: transfert direct (comportement actuel)
    - Sinon: créer une demande de transfert
  - Afficher un message informatif selon le cas

#### 7. Écran de Détail et Approbation
- [ ] **transfer-8**: Créer écran `transfer-request-detail.tsx`:
  - Afficher les détails de la demande (produit, quantités, entrepôts, demandeur)
  - Si Manager assigné à l'entrepôt source ET status "pending":
    - Boutons "Approuver" et "Rejeter"
    - Champ pour notes de rejet (optionnel)
  - Afficher l'historique (qui a approuvé/rejeté, quand)

---

## 💰 Gestion Financière

### API (Backend)

#### 1. Modèle de Données
- [ ] **financial-1**: Créer modèle Prisma `Expense`:
  ```prisma
  model Expense {
    id          String   @id @default(uuid())
    warehouseId String   @map("warehouse_id")
    amount      Decimal  @db.Decimal(10, 2)
    category    String   // ex: "rent", "utilities", "supplies", "other"
    description String?
    date        DateTime
    createdBy   String   @map("created_by")
    notes       String?
    createdAt   DateTime @default(now()) @map("created_at")
    updatedAt   DateTime @updatedAt @map("updated_at")
    
    warehouse Warehouse @relation(fields: [warehouseId], references: [id])
    employee  Employee  @relation(fields: [createdBy], references: [id])
    
    @@map("expenses")
  }
  ```

#### 2. Endpoints CRUD
- [ ] **financial-2**: Créer endpoints pour les dépenses:
  - `GET /api/expenses` - Lister les dépenses
    - Filtrage par entrepôt selon rôle (Manager: ses entrepôts, Admin: tous)
    - Filtrage par période (startDate, endDate)
  - `POST /api/expenses` - Créer une dépense
    - Validation: vérifier que l'utilisateur peut gérer l'entrepôt
  - `PUT /api/expenses/:id` - Modifier une dépense
  - `DELETE /api/expenses/:id` - Supprimer une dépense

#### 3. Rapports Financiers
- [ ] **financial-3**: Créer endpoint `GET /api/reports/financial`:
  - Paramètres:
    - `period`: 'day' | 'week' | 'month' | 'year'
    - `startDate`: Date de début (optionnel)
    - `endDate`: Date de fin (optionnel)
    - `warehouseId`: ID de l'entrepôt (optionnel, Admin peut omettre)
  - Retourner:
    - Total des ventes
    - Total des dépenses
    - Bénéfice net (ventes - dépenses)
    - Nombre de transactions
    - Détails par entrepôt (si Admin, sinon uniquement entrepôts assignés)

- [ ] **financial-4**: Implémenter logique de filtrage:
  - Manager: uniquement ses entrepôts assignés
  - Admin: tous les entrepôts
  - Calculer les totaux selon la période sélectionnée

### Mobile (Frontend)

#### 4. Écran de Liste des Dépenses
- [ ] **financial-5**: Créer écran `expenses-list.tsx`:
  - Lister les dépenses avec filtres:
    - Par entrepôt (selon permissions)
    - Par période (jour/semaine/mois/année)
    - Par catégorie
  - Colonnes: Date, Catégorie, Montant, Entrepôt, Créateur
  - Bouton "Ajouter" pour créer une dépense
  - Navigation vers le détail/modification

#### 5. Écran de Gestion des Dépenses
- [ ] **financial-6**: Créer écran `expenses-manage.tsx`:
  - Formulaire avec champs:
    - Entrepôt (sélection selon permissions)
    - Montant
    - Catégorie (sélecteur)
    - Description
    - Date
    - Notes
  - Validation et sauvegarde

#### 6. Écran de Rapports Financiers
- [ ] **financial-7**: Créer écran `reports-financial.tsx`:
  - Sélecteur de période (jour/semaine/mois/année)
  - Sélecteur d'entrepôt (si Admin, sinon entrepôt connecté)
  - Afficher:
    - Total des ventes
    - Total des dépenses
    - Bénéfice net
    - Nombre de transactions
    - Graphique (optionnel)
  - Accessible depuis le menu "Plus" → "Rapports financiers"

---

## 👥 Hiérarchie de Gestion du Personnel

### API (Backend)

#### 1. Restrictions de Création
- [ ] **staff-1**: Modifier `createEmployee` dans `employees.service.ts`:
  - Si l'utilisateur est Manager:
    - Vérifier que le rôle créé est "Seller" uniquement
    - Vérifier que l'entrepôt assigné est dans les entrepôts assignés du Manager
    - Si non: erreur 403 "You can only create Sellers for your assigned warehouses"
  - Si l'utilisateur est Admin: aucune restriction

#### 2. Restrictions de Modification
- [ ] **staff-2**: Modifier `updateEmployee`:
  - Si l'utilisateur est Manager:
    - Vérifier que l'employé à modifier est un Seller
    - Vérifier que l'employé est assigné à un entrepôt du Manager
    - Si changement de rôle vers Manager: erreur 403 "Managers cannot modify Managers"
  - Si l'utilisateur est Admin: aucune restriction

#### 3. Filtrage des Employés
- [ ] **staff-3**: Modifier `getEmployees`:
  - Si l'utilisateur est Manager:
    - Filtrer pour ne retourner que les Sellers assignés à ses entrepôts
  - Si l'utilisateur est Admin: retourner tous les employés
  - Inclure les informations d'entrepôt et de rôle dans la réponse

#### 4. Vérification des Managers
- [ ] **staff-4**: Ajouter vérifications supplémentaires:
  - Manager ne peut pas créer un employé avec rôle "Manager" ou "Admin"
  - Manager ne peut pas modifier un employé qui est Manager ou Admin
  - Messages d'erreur explicites: "Only administrators can manage Managers"

### Mobile (Frontend)

#### 5. Filtrage dans la Liste
- [ ] **staff-5**: Modifier `employees-list.tsx`:
  - Filtrer les employés selon les permissions:
    - Manager: uniquement les Sellers de ses entrepôts assignés
    - Admin: tous les employés
  - Afficher un indicateur visuel si l'utilisateur ne peut pas voir tous les employés

#### 6. Restrictions dans le Formulaire
- [ ] **staff-6**: Modifier `employees-manage.tsx`:
  - Si Manager:
    - Restreindre la sélection d'entrepôts aux entrepôts assignés au Manager
    - Restreindre la sélection de rôles à "Seller" uniquement
    - Cacher les options de rôle Manager/Admin
  - Si Admin: aucune restriction

#### 7. Masquage des Options
- [ ] **staff-7**: Cacher les options de création/modification de Managers:
  - Dans `employees-list.tsx`: Cacher le bouton "Créer Manager" si non-Admin
  - Dans `employees-manage.tsx`: Désactiver la sélection du rôle "Manager" si non-Admin
  - Dans le menu "Gestion du personnel": Afficher uniquement les options autorisées

---

## 📝 Notes d'Implémentation

### Ordre de Priorité Suggéré

1. **Haute Priorité**:
   - Système de points de fidélité (fonctionnalité client importante)
   - Hiérarchie de gestion du personnel (sécurité et permissions)

2. **Priorité Moyenne**:
   - Système d'approbation des transferts (améliore le workflow)
   - Gestion financière (rapports importants pour la gestion)

### Points d'Attention

- **Permissions**: Toujours vérifier les permissions côté API, même si le mobile les vérifie aussi
- **Transactions**: Utiliser des transactions Prisma pour les opérations critiques (transferts, ventes avec points)
- **Validation**: Valider toutes les entrées côté client ET serveur
- **Messages d'erreur**: Fournir des messages d'erreur explicites pour faciliter le débogage
- **Tests**: Tester chaque fonctionnalité avec différents rôles (Seller, Manager, Admin)

### Fichiers à Modifier/Créer

**API:**
- `prisma/schema.prisma` - Ajouter nouveaux modèles
- `src/modules/settings/` - Nouveau module pour paramètres système
- `src/modules/inventory/inventory.service.ts` - Modifier pour approbations
- `src/modules/inventory/inventory.routes.ts` - Ajouter routes transfer-requests
- `src/modules/sales/sales.service.ts` - Modifier pour points de fidélité
- `src/modules/employees/employees.service.ts` - Modifier pour hiérarchie
- `src/modules/expenses/` - Nouveau module pour dépenses
- `src/modules/reports/` - Nouveau module pour rapports

**Mobile:**
- `app/(app)/settings-loyalty.tsx` - Nouveau
- `app/(app)/transfer-requests-list.tsx` - Nouveau
- `app/(app)/transfer-request-detail.tsx` - Nouveau
- `app/(app)/expenses-list.tsx` - Nouveau
- `app/(app)/expenses-manage.tsx` - Nouveau
- `app/(app)/reports-financial.tsx` - Nouveau
- `app/(app)/cart.tsx` - Modifier pour points de fidélité
- `app/(app)/products-manage.tsx` - Modifier pour demandes de transfert
- `app/(app)/employees-list.tsx` - Modifier pour filtrage
- `app/(app)/employees-manage.tsx` - Modifier pour restrictions
- `app/(app)/more.tsx` - Ajouter liens vers nouveaux écrans

---

**Dernière mise à jour**: 2024-12-24
**Total des tâches**: 27
