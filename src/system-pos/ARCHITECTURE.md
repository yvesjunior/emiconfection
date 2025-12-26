# Architecture et Documentation Complète - POS System

**Version** : 1.1.0 | **Dernière mise à jour** : 2024-12-26 | **Statut** : ✅ Production Ready

---

## 📊 Vue d'Ensemble et Statut des Fonctionnalités

### Résumé
- **Total implémenté** : 60/60 fonctionnalités (100%)
- **À améliorer** : 1 point (priorité basse)
- **À tester** : Suite complète disponible dans `TEST_SUITE.md`

### Vue d'ensemble
Cette application mobile est un système de point de vente (POS) pour la gestion des ventes, des stocks et du personnel dans un environnement multi-entrepôts.

**Important :** 
- Les clients (customers) n'ont **PAS** accès à cette application/platform
- Les clients sont gérés uniquement par le personnel (staff) lors des ventes
- Les clients sont définis **globalement** (non attachés à un entrepôt spécifique)
- Les clients sont partagés entre tous les entrepôts
- Un client peut faire des achats dans n'importe quel entrepôt Boutique

---

## ✅ Fonctionnalités Implémentées

### 🔔 Système d'Alertes pour les Admins (11 points)
- ✅ Modèle `ManagerAlert` dans Prisma
- ✅ Service complet avec CRUD
- ✅ Routes API `/api/alerts`
- ✅ Helper pour création automatique
- ✅ Intégration dans produits (réduction stock, suppression)
- ✅ Intégration dans transferts (tous les événements)
- ✅ Intégration dans employés (création utilisateur)
- ✅ Écran mobile `alerts-list.tsx`
- ✅ Badge de notification dans navigation
- ✅ Filtres par sévérité et type
- ✅ Marquage comme lu / marquer tout comme lu

**Types d'alertes** :
- Réduction de stock en mode gestion
- Demandes de transfert
- Approbations/rejets de transfert
- Réceptions de transfert
- Créations d'utilisateurs
- Suppressions de produits

### 📦 Système de Transfert de Stock (17 points)
- ✅ Modèle `StockTransferRequest` dans Prisma
- ✅ Endpoints de demande et approbation
- ✅ Création sans quantité (quantité définie lors de l'approbation)
- ✅ Validation de quantité contre stock disponible
- ✅ Filtre par entrepôt pour managers et admins
- ✅ Tab "Transferts" dans la navigation
- ✅ Filtre par statut (En attente par défaut)
- ✅ Permissions `inventory:manage` pour managers
- ✅ Vérification d'accès aux entrepôts
- ✅ Écrans mobile complets

**Workflow** :
1. Création de demande (sans quantité)
2. Approbation avec quantité définie
3. Réception et transfert effectif du stock

### 💰 Système de Points de Fidélité (9 points)
- ✅ Endpoints de configuration
- ✅ Attribution automatique lors des ventes
- ✅ Utilisation pour remises
- ✅ Conversion points → monnaie
- ✅ Intégration dans le panier
- ✅ Écran de configuration admin
- ✅ Champ `loyaltyPointsUsed` dans les ventes

### 💵 Gestion Financière (7 points)
- ✅ Modèles `Expense` et `ExpenseCategory`
- ✅ Module complet avec CRUD
- ✅ Endpoint `/api/reports/financial`
- ✅ Filtrage par entrepôt et période
- ✅ Écrans mobile complets
- ✅ Rapports par jour/semaine/mois/année
- ✅ Gestion par rôle (Manager: entrepôt, Admin: global)

### 👥 Hiérarchie de Gestion du Personnel (7 points)
- ✅ Restrictions de création (Manager → Sellers uniquement)
- ✅ Restrictions de modification
- ✅ Filtrage automatique des employés
- ✅ Vérifications de permissions
- ✅ Interface adaptée par rôle

### 🏪 Permissions et Accès aux Entrepôts (4 points)
- ✅ Managers peuvent voir les entrepôts assignés
- ✅ Accès en lecture seule aux détails
- ✅ Filtre d'entrepôt pour les transferts
- ✅ Pas de permission `warehouses:manage` requise pour voir

### 🎨 Améliorations Interface Utilisateur (5 points)
- ✅ Couleurs alternées dans les listes
- ✅ Bordures entre éléments
- ✅ Contraste amélioré
- ✅ Intégration sélection entrepôt dans modal
- ✅ Affichage conditionnel optimisé

---

## ⚠️ Fonctionnalités à Améliorer

**Note** : Tous les transferts passent déjà par le processus complet (demande → approbation → réception). Il n'y a pas de transfert direct dans le système.

### 1. Modèle SystemSettings dédié (Priorité: Basse)
**Statut** : ⚠️ À vérifier/améliorer

**Description** :
- Actuellement utilise la table générique `Setting` pour les paramètres de points de fidélité
- Suggestion : Modèle dédié `SystemSettings` avec `updatedBy` et `updatedAt`

**Impact** : Faible - Le système fonctionne actuellement avec `Setting`

---

## Rôles Utilisateurs

### Matrice des Permissions par Rôle

| Fonctionnalité | Seller | Manager | Admin |
|----------------|--------|---------|-------|
| **Vente** |
| Créer une vente | ✅ | ✅ | ✅ |
| Voir ses ventes | ✅ | ✅ | ✅ |
| Voir toutes les ventes | ❌ | ✅ (son entrepôt) | ✅ (tous) |
| **Produits** |
| Créer un produit | ❌ | ✅ | ✅ |
| Modifier un produit | ❌ | ✅ | ✅ |
| Désactiver un produit | ❌ | ✅ | ✅ |
| Supprimer définitivement | ❌ | ❌ | ✅ |
| **Stocks** |
| Voir les stocks | ✅ | ✅ | ✅ |
| Modifier les stocks | ❌ | ✅ (son entrepôt) | ✅ (tous) |
| Demander un transfert | ✅ | ✅ | ✅ |
| Approuver un transfert | ❌ | ✅ (son entrepôt source) | ✅ (tous) |
| Transférer directement | ❌ | ✅ (ses entrepôts) | ✅ (tous) |
| **Gestion** |
| Gérer les catégories | ❌ | ✅ | ✅ |
| Gérer les entrepôts | ❌ | ✅ | ✅ |
| Gérer le personnel | ❌ | ✅ (staff de ses entrepôts) | ✅ (tous) |
| Gérer les Managers | ❌ | ❌ | ✅ |
| Gérer les rôles | ❌ | ❌ | ✅ |
| **Rapports** |
| Voir les rapports | ❌ | ✅ (son entrepôt) | ✅ (tous) |
| **Finances** |
| Gérer les ventes | ❌ | ✅ (son entrepôt) | ✅ (tous) |
| Gérer les dépenses | ❌ | ✅ (son entrepôt) | ✅ (tous) |
| Rapports financiers | ❌ | ✅ (son entrepôt) | ✅ (tous) |
| **Reçus** |
| Imprimer un reçu | ✅ | ✅ | ✅ |
| Partager un reçu (PDF) | ✅ | ✅ | ✅ |
| Réimprimer un reçu | ✅ | ✅ | ✅ |
| Configurer l'imprimante | ✅ | ✅ | ✅ |
| Personnaliser le format | ✅ | ✅ | ✅ |

### Règles d'Assignation d'Entrepôt

| Rôle | Entrepôt Requis | Types Autorisés | Multiples |
|------|----------------|-----------------|-----------|
| Seller | ✅ Oui | Boutique uniquement | ✅ Oui |
| Manager | ✅ Oui | Boutique + Stockage | ✅ Oui |
| Admin | ❌ Non | Tous | N/A |

### 1. Admin (Administrateur)

**Caractéristiques :**
- Accès à tous les entrepôts (Boutique et Stockage)
- Peut gérer tous les aspects du système
- **Seul rôle autorisé à supprimer définitivement des produits de la base de données**
- **Gestion complète du personnel** :
  - Peut créer, modifier et supprimer/désactiver tous les employés SAUF les autres admins
  - Peut gérer les Managers (création, modification, suppression/désactivation)
  - Peut gérer le staff (Sellers) attaché à tous les entrepôts
  - Peut créer, modifier et supprimer des rôles et permissions
  - **Restrictions** : Ne peut PAS créer/modifier/supprimer/désactiver d'autres admins
- **Gestion financière au niveau global** (tous les entrepôts)

**Permissions principales :**
- Toutes les permissions du système
- Suppression de produits (hard delete)
- Gestion des rôles et permissions
- Gestion de tous les entrepôts
- Accès aux données de tous les entrepôts
- **Gestion financière globale** : Voir et gérer toutes les ventes et dépenses de tous les entrepôts
- **Rapports financiers globaux** : Accès aux rapports consolidés de tous les entrepôts
  - Visualisation par jour, semaine, mois et année
  - Rapports consolidés de tous les entrepôts

**Assignation :**
- Peut être assigné à un ou plusieurs entrepôts (optionnel, car accès global)
- Peut fonctionner sans entrepôt assigné

---

### 2. Manager (Gestionnaire)

**Caractéristiques :**
- Assigné à un ou plusieurs entrepôts (Boutique ou Stockage)
- Gère les opérations de son/ses entrepôt(s) assigné(s)
- Peut vendre des produits (permission de vente)
- **Gestion financière au niveau de son/ses entrepôt(s) assigné(s)**
- Peut gérer les stocks et inventaires de son/ses entrepôt(s)

**Permissions principales :**
- Gestion des produits (création, modification, mais pas de suppression définitive)
- Gestion des stocks et inventaires
- Création de ventes
- Visualisation des ventes (toutes les ventes de son/ses entrepôt(s) assigné(s))
- Gestion des catégories
- Gestion des transferts entre entrepôts
- **Gestion financière au niveau entrepôt** :
  - Voir et gérer toutes les ventes de son/ses entrepôt(s) assigné(s)
  - Voir et gérer toutes les dépenses de son/ses entrepôt(s) assigné(s)
  - Visualisation des rapports financiers de son/ses entrepôt(s) assigné(s)
    - Visualisation par jour, semaine, mois et année
    - Rapports limités à ses entrepôts assignés uniquement
- **Pas d'accès** aux données financières des autres entrepôts non assignés

**Assignation :**
- **Doit être assigné à au moins un entrepôt**
- Peut être assigné à plusieurs entrepôts
- Peut gérer des entrepôts de type Boutique ou Stockage

**Gestion du personnel :**
- **Peut gérer le staff attaché à ses entrepôts uniquement** :
  - Peut créer, modifier et supprimer/désactiver les employés de type Seller assignés à ses entrepôts
  - Peut voir les employés (Sellers) de ses entrepôts assignés
  - Peut réinitialiser les PIN des employés de ses entrepôts
  - Les Sellers doivent être attachés à au moins un entrepôt assigné au manager
- **Ne peut pas gérer les Managers** (réservé à Admin)
- **Ne peut pas gérer les Admins** (réservé à Admin)
- **Ne peut pas créer/modifier des rôles ou permissions** (réservé à Admin)
- **Ne peut pas promouvoir des Sellers vers Manager ou Admin**

**Restrictions :**
- Ne peut pas supprimer définitivement des produits
- Ne peut accéder qu'aux données de ses entrepôts assignés
- Ne peut pas créer/modifier des rôles ou permissions
- Ne peut pas gérer les Managers (seulement le staff Seller attaché à ses entrepôts)

---

### 3. Seller (Vendeur)

**Caractéristiques :**
- Assigné à au moins un entrepôt de type **Boutique uniquement**
- Peut uniquement vendre des produits
- Accès limité aux fonctionnalités de vente
- Ne peut pas gérer les stocks directement (sauf ajustements mineurs si autorisé)

**Permissions principales :**
- Création de ventes
- Visualisation de ses propres ventes
- Consultation des produits et stocks disponibles
- Gestion du panier de vente
- Accès aux clients (lecture, ajout rapide)

**Assignation :**
- **Doit être assigné à au moins un entrepôt de type Boutique**
- Ne peut pas être assigné à un entrepôt de type Stockage
- Peut être assigné à plusieurs entrepôts Boutique

**Restrictions :**
- Ne peut pas créer/modifier/supprimer des produits
- Ne peut pas gérer les stocks (sauf ajustements autorisés)
- Ne peut pas accéder aux rapports financiers détaillés
- Ne peut pas gérer les entrepôts, catégories, ou autres ressources système
- Ne peut pas voir les ventes d'autres vendeurs (sauf si permission spécifique)

---

## Types d'Entrepôts

### Types d'Entrepôts et Ventes

| Type | Vente Autorisée | Assignation Seller | Assignation Manager | Usage Principal |
|------|----------------|-------------------|---------------------|-----------------|
| Boutique | ✅ Oui | ✅ Oui | ✅ Oui | Vente directe aux clients |
| Stockage | ❌ Non | ❌ Non | ✅ Oui | Stockage uniquement, transfert vers Boutique requis pour vente |

**Règle importante :** Pour vendre un produit, il doit d'abord être transféré depuis Stockage vers Boutique. Les produits dans Stockage ne peuvent pas être vendus directement.

### Boutique
- **Usage :** Vente directe aux clients
- **Caractéristiques :**
  - Les ventes peuvent être effectuées **uniquement** depuis ce type d'entrepôt
  - Les vendeurs (Seller) peuvent être assignés uniquement à ce type
  - Les managers peuvent gérer ce type d'entrepôt
  - Stock visible et accessible pour les ventes
  - **Règle importante :** Pour vendre un produit, il doit d'abord être transféré depuis Stockage vers Boutique

### Stockage
- **Usage :** Stockage et transferts (pas de vente)
- **Caractéristiques :**
  - **Aucune vente ne peut être effectuée depuis ce type d'entrepôt**
  - Utilisé pour le stockage et les transferts vers les boutiques
  - Les vendeurs ne peuvent pas être assignés à ce type
  - Les managers peuvent gérer ce type d'entrepôt
  - Stock visible mais **non vendable directement**
  - **Règle importante :** Les produits doivent être transférés vers une Boutique avant de pouvoir être vendus

---

## Workflow de l'Application

### 1. Connexion (Login)

**Processus :**
1. L'utilisateur entre son numéro de téléphone (champ `login`) et son PIN (champ `password`)
   - **Authentification simplifiée** : Un seul système d'authentification avec téléphone/PIN
   - Pas de champ `email` ou `password` séparé - uniquement téléphone et PIN
2. Sélection du mode d'utilisation :
   - **Mode Vente (Sell)** : Pour les opérations de vente
   - **Mode Gestion (Manage)** : Pour les opérations de gestion
   - **Sécurité** : Les Sellers ne peuvent pas accéder au mode Gestion (bloqué automatiquement)
3. Sélection de l'entrepôt :
   - **Mode Vente** : Seuls les entrepôts de type Boutique sont disponibles
   - **Mode Gestion** : Tous les entrepôts assignés à l'utilisateur sont disponibles
   - **Filtrage automatique** : Les entrepôts STOCKAGE ne sont pas listés en mode Vente
4. Vérification des permissions selon le rôle
5. **Vidage automatique du panier** : Lors du changement d'entrepôt, le panier est automatiquement vidé

**Règles de sélection d'entrepôt :**
- **Mode Vente** : Seuls les entrepôts de type `BOUTIQUE` sont disponibles (filtrage automatique)
- **Mode Gestion** : Tous les entrepôts actifs (BOUTIQUE et STOCKAGE) sont disponibles
- **Seller** : Seuls les entrepôts Boutique assignés sont disponibles
- **Manager** : Tous les entrepôts assignés (Boutique et Stockage) sont disponibles
- **Admin** : Tous les entrepôts actifs sont disponibles

**Règles de validation au login :**
- Si un employé est assigné à un entrepôt `STOCKAGE` et essaie de se connecter en mode Vente, une alerte bloque la connexion avec le message : "Vous êtes assigné à un entrepôt de type Stockage. Pour effectuer des ventes, veuillez sélectionner le mode 'Gestion' ou vous connecter à un entrepôt de type Boutique."
- Si aucun entrepôt compatible n'est disponible pour le mode sélectionné, une alerte informe l'utilisateur

**Filtrage des entrepôts au login :**
- **Mode Vente** : Seuls les entrepôts `BOUTIQUE` sont disponibles
- **Mode Gestion** : Tous les entrepôts actifs (BOUTIQUE et STOCKAGE)

**Changement d'entrepôt :**
- Mode Vente : Impossible de changer vers STOCKAGE (alerte bloquante)
- Mode Gestion : Changement vers n'importe quel entrepôt autorisé

---

### 2. Mode Vente (Sell Mode)

**Accès :**
- Disponible pour : Seller, Manager, Admin
- Nécessite un entrepôt de type Boutique

**Fonctionnalités principales :**
- Consultation des produits disponibles
- Filtrage par catégories
- Recherche de produits
- Ajout au panier
- Création de ventes
- **Impression de reçu** après chaque vente
- Partage de reçu en PDF
- Gestion des clients
- Visualisation de l'historique des ventes (selon permissions)

**Restrictions :**
- Impossible de vendre depuis un entrepôt Stockage
- Vérification du stock disponible dans l'entrepôt Boutique connecté
- Les produits sans stock dans la Boutique ne peuvent pas être ajoutés au panier
- **Règle importante :** Pour vendre un produit stocké dans Stockage, il faut d'abord le transférer vers une Boutique

**Vérifications implémentées :**
1. **Avant ajout au panier** : Vérification que l'entrepôt connecté est de type `BOUTIQUE`
   - Si `STOCKAGE` : Alerte bloquante "Vente impossible" avec suggestion de se connecter à une Boutique
2. **Vérification du stock** : 
   - Stock = 0 → Alerte "Rupture de stock" avec option "Voir autres entrepôts"
   - Stock insuffisant (déjà dans panier) → Alerte "Stock insuffisant"
   - Stock faible (≤ 5 après ajout) → Haptic feedback d'avertissement
3. **Vérification API** : Même si le client mobile contourne les vérifications, l'API bloque la création de vente depuis un entrepôt `STOCKAGE` avec erreur `400 Bad Request`

---

### 3. Mode Gestion (Manage Mode)

**Accès :**
- Disponible pour : Manager, Admin
- Seller n'a pas accès au mode gestion

**Fonctionnalités principales :**
- Gestion des produits (création, modification)
- Gestion des catégories
- Gestion des entrepôts
- Gestion des stocks et inventaires
- Gestion du personnel (Admin uniquement)
- Visualisation des rapports et statistiques
- Gestion des transferts entre entrepôts

**Gestion des stocks :**
- Modification directe des quantités dans l'entrepôt connecté uniquement
- Consultation des stocks dans tous les entrepôts (lecture seule pour les autres entrepôts)
- Demande de transferts depuis Stockage vers Boutique
- Indicateurs visuels : Badge "Connecté" pour l'entrepôt actuel, badge "Lecture seule" pour les autres

**Règles de modification du stock :**
- **Modification autorisée** : Uniquement pour l'entrepôt actuellement connecté (`getEffectiveWarehouse()`)
- **Permission requise** : `inventory:adjust` pour pouvoir modifier
- **Visualisation** : Tous les entrepôts sont visibles avec leur type (BOUTIQUE/STOCKAGE) et quantité
- **Autres entrepôts** : Affichés en lecture seule avec badge "Lecture seule"
- Historique des mouvements de stock

---

## Gestion des Produits

### Création et Modification
- **Qui peut créer :** Manager, Admin
- **Qui peut modifier :** Manager, Admin
- **Stock initial :** Défini lors de la création pour l'entrepôt connecté
- **Champ Unité :** Liste prédéfinie d'unités disponibles (Pièce, kg, g, Litre, mL, Mètre, cm, m², m³, Boîte, Paquet, Carton, Unité)
  - Sélection via un modal avec liste d'unités
  - Valeur par défaut : "piece"
  - Standardisation des unités pour cohérence des données

### Champs Produit

**Champs Requis :**
- Nom (minimum 2 caractères)
- SKU (unique)
- Prix de vente (doit être positif)

**Champs Optionnels :**
- Code-barres (peut être scanné)
- Description
- Prix d'achat
- Frais de transport
- **Unité** : Liste prédéfinie d'unités (valeur par défaut : "piece")
  - Options : Pièce, kg, g, Litre, mL, Mètre, cm, m², m³, Boîte, Paquet, Carton, Unité
- Niveau de stock minimum (défaut : 5)
- Image
- Catégories (au moins une requise)

### Suppression

**Soft Delete (Désactivation) :** Manager, Admin
- Le produit est marqué comme inactif
- Reste dans la base de données pour l'historique
- N'apparaît plus dans les listes de produits actifs

**Hard Delete (Suppression définitive) :** **Admin uniquement**
- Suppression complète de la base de données
- **Restriction :** Impossible si le produit a été utilisé dans des ventes ou commandes d'achat
- Supprime également les catégories associées et les stocks

**Workflow de suppression implémenté :**
```
Admin tente de supprimer un produit
    ↓
Vérification du rôle → Admin ? ❌ → Erreur 403 "Only administrators can delete"
    ↓ ✅
Vérification des ventes → Utilisé ? ✅ → Erreur 400 avec nombre de ventes
    ↓ ❌
Vérification des commandes → Utilisé ? ✅ → Erreur 400 avec nombre de commandes
    ↓ ❌
Transaction atomique :
  - Suppression des mouvements de stock
  - Suppression du produit (cascade ProductCategory et Inventory)
    ↓
Succès ✅
```

**Messages d'erreur explicites :**
- `403` : "Only administrators can delete products from the database"
- `400` : "Cannot delete product that has been used in X sale(s). The product must remain for historical records."
- `400` : "Cannot delete product that has been used in X purchase order(s). The product must remain for historical records."

---

## Gestion des Clients

### Caractéristiques des Clients

**Important :**
- Les clients **n'ont PAS accès** à l'application/platform
- Les clients sont gérés uniquement par le personnel lors des ventes
- Les clients sont **globaux** (non attachés à un entrepôt spécifique)
- Un client peut faire des achats dans n'importe quel entrepôt Boutique
- Les données clients sont partagées entre tous les entrepôts

### Informations Client

**Champs requis :**
- Nom (optionnel mais recommandé)
- Téléphone (optionnel mais recommandé pour identification)

**Champs optionnels :**
- Email
- Adresse
- Notes

**Système de Points de Fidélité :**
- Chaque client accumule des points de fidélité (`loyaltyPoints`)
- **Conversion monétaire** : Les points peuvent être convertis en équivalent monétaire pour des remises
  - Exemple : 1000 points = 1000 FCFA de remise
  - Le taux de conversion est configurable par Admin dans les paramètres
- **Accumulation** : Les points sont gagnés lors des achats
  - Le nombre de points attribués est basé sur le montant de l'achat
  - Le taux d'attribution (ex: 1% du montant, ou X points par Y FCFA) est défini par Admin dans les paramètres
- **Utilisation** : Les points peuvent être utilisés pour obtenir des remises lors des achats
  - Le staff est alerté lors de la vente pour proposer au client :
    - Soit d'accumuler les points (gagner de nouveaux points)
    - Soit d'utiliser les points disponibles pour une remise
- **Points globaux** : Les points sont globaux (même compte pour tous les entrepôts)

### Création et Gestion

**Qui peut créer/gérer :**
- Seller : Peut créer des clients rapidement lors d'une vente
- Manager : Peut créer et modifier des clients
- Admin : Accès complet à la gestion des clients

**Workflow typique :**
1. Lors d'une vente, recherche d'un client par téléphone ou nom
2. Si le client existe :
   - Le système affiche les points disponibles du client
   - **Alerte au staff** : Proposition d'utiliser les points pour une remise OU d'accumuler de nouveaux points
   - Le staff peut choisir d'appliquer une remise basée sur les points disponibles
   - Conversion automatique : X points = Y FCFA de remise (selon le taux configuré)
3. Si le client n'existe pas, création rapide avec nom et téléphone
4. Après la vente, attribution de points selon le montant de la vente
   - Calcul basé sur le taux d'attribution défini par Admin (ex: 1% du montant total)
   - Les points sont ajoutés au solde du client
5. Les points peuvent être utilisés pour des remises lors de ventes futures

### Règles Métier

1. **Identification :** Un client est principalement identifié par son téléphone (si disponible)
2. **Unicité :** Le téléphone peut être utilisé pour éviter les doublons
3. **Points globaux :** Les points sont partagés entre tous les entrepôts
4. **Historique :** Toutes les ventes d'un client sont tracées, peu importe l'entrepôt
5. **Configuration Admin** : Seul Admin peut configurer les taux d'attribution et de conversion des points

### Configuration des Points de Fidélité (Admin uniquement - Global)

**Portée Globale :**
- Les paramètres sont **globaux** : Appliqués à tous les entrepôts du système
- Configuration **unique** : Définis une seule fois par l'admin
- Traçabilité : Chaque modification est enregistrée avec `updatedBy` et `updatedAt`

**Taux d'attribution :**
- Nombre de points attribués par montant d'achat
- **Global** : Même taux pour tous les entrepôts
- Exemples :
  - 1% du montant : 10 000 FCFA → 100 points
  - 10 points par 1000 FCFA : 10 000 FCFA → 100 points
  - Taux fixe : X points par achat

**Taux de conversion :**
- Équivalence points → monnaie pour remises
- **Global** : Même taux pour tous les entrepôts
- Exemples :
  - 1000 points = 1000 FCFA (1:1)
  - 1000 points = 500 FCFA (2:1)
  - 100 points = 100 FCFA (1:1)

**Workflow d'utilisation lors d'une vente :**
```
Client sélectionné
    ↓
Système affiche points disponibles
    ↓
Alerte au staff :
  - "Client a X points disponibles"
  - Options :
    1. Utiliser points pour remise (X points = Y FCFA)
    2. Accumuler nouveaux points
    ↓
Staff choisit l'option
    ↓
Si utilisation :
  - Remise appliquée au total
  - Points déduits du solde client
Si accumulation :
  - Points ajoutés après la vente
```

---

## Gestion du Personnel

### Hiérarchie de Gestion

**Manager :**
- **Gère le staff attaché à ses entrepôts** :
  - Peut créer, modifier et désactiver les employés de type **Seller** assignés à ses entrepôts
  - Peut voir les employés (Sellers) de ses entrepôts assignés
  - Peut réinitialiser les PIN des employés de ses entrepôts
- **Ne peut pas gérer les Managers** (réservé à Admin uniquement)
- **Scope limité** : Uniquement les Sellers attachés à ses entrepôts assignés

**Admin :**
- **Gère les Managers** :
  - Peut créer, modifier et supprimer tous les Managers
  - Peut assigner les Managers à des entrepôts
  - Peut modifier les permissions des Managers
- **Gère le staff en dessous** :
  - Peut créer, modifier et supprimer tous les employés (Managers et Sellers)
  - Peut gérer le staff de tous les entrepôts (pas de restriction)
- **Gestion complète** :
  - Peut créer, modifier et supprimer des rôles et permissions
  - Accès à tous les employés du système

### Création d'Employé

**Qui peut créer :**
- **Manager** : Uniquement les Sellers attachés à ses entrepôts assignés
- **Admin** : Tous les employés (Managers et Sellers)

**Champs requis :**
- Nom complet
- Téléphone (unique) - utilisé comme identifiant de connexion
- Rôle (Admin, Manager, ou Seller)
- Entrepôt(s) (assignation multiple possible) :
  - **Admin** : Entrepôt(s) optionnel(s) - peut fonctionner sans entrepôt assigné
  - **Manager** : Au moins un entrepôt requis (peut être assigné à plusieurs)
  - **Seller** : Au moins un entrepôt Boutique requis (peut être assigné à plusieurs Boutiques)
- PIN (requis) - utilisé pour l'authentification mobile

**Champs supprimés :**
- ❌ Email (supprimé - non utilisé)
- ❌ Password (supprimé - seul PIN utilisé pour l'authentification)

**Règles de validation :**
- **Assignation multiple** : Tous les employés peuvent être assignés à plusieurs entrepôts
- Un entrepôt est **requis** pour les rôles Manager et Seller (au moins un)
- Un entrepôt est **optionnel** pour le rôle Admin
- Seller ne peut être assigné qu'à des entrepôts de type Boutique (un ou plusieurs)
- Manager peut être assigné à des entrepôts Boutique ou Stockage (un ou plusieurs)
- **Manager ne peut créer que des Sellers** assignés à ses entrepôts
- **Admin peut créer des Managers et des Sellers** sans restriction
- Lors de la création/modification, sélection multiple d'entrepôts disponible

**Workflow de création d'employé :**
```
Créer employé
    ↓
Vérifier qui crée :
  Manager ? → Vérifier que le rôle est Seller → Non ? → Erreur 403
  Manager ? → Vérifier que l'entrepôt est assigné au Manager → Non ? → Erreur 403
    ↓ ✅
Vérifier le rôle existe → Non ? → Erreur 400 "Invalid role"
    ↓ ✅
Vérifier le rôle assigné
    ↓
Admin ? → Entrepôt optionnel ✅
Manager ? → Entrepôt requis → Manquant ? → Erreur 400 "Warehouse is required for non-admin roles"
Seller ? → Entrepôt requis + Type Boutique uniquement → Manquant ? → Erreur 400 "Warehouse is required"
    ↓
Vérifier unicité téléphone → Existe ? → Erreur 409 "Phone number already in use"
    ↓
Hasher PIN
    ↓
Créer l'employé ✅
```

**Messages d'erreur :**
- `400` : "Warehouse is required for non-admin roles"
- `400` : "Invalid role"
- `403` : "You can only create Sellers for your assigned warehouses" (Manager tentant de créer un Manager)
- `403` : "You can only manage staff assigned to your warehouses" (Manager tentant de créer pour un autre entrepôt)
- `409` : "Phone number already in use"

### Modification d'Employé

**Qui peut modifier :**
- **Manager** : Uniquement les Sellers attachés à ses entrepôts assignés
- **Admin** : Tous les employés (Managers et Sellers)

**Modifications possibles :**
- Changer le rôle (Manager → Admin uniquement)
- Changer l'entrepôt assigné
- Modifier le statut actif/inactif
- Réinitialiser le PIN
- Modifier les informations personnelles

### Suppression d'Employé

**Qui peut supprimer :**
- **Manager** : Uniquement les Sellers attachés à ses entrepôts assignés (soft delete)
- **Admin** : Tous les employés (Managers et Sellers) - soft delete

**Type de suppression :**
- Soft delete (désactivation) pour préserver l'historique
- L'employé désactivé ne peut plus se connecter mais ses données restent dans le système

### Authentification

**Système d'Authentification Simplifié :**
- **Identifiant** : Numéro de téléphone (champ `login`)
- **Mot de passe** : PIN à 4 chiffres minimum (champ `password`)
- **Champs supprimés** : Email et Password séparé (non utilisés)
- **Validation simultanée** : Le téléphone et le PIN sont validés ensemble lors de la connexion

---

## Gestion des Stocks

### Consultation
- Tous les utilisateurs peuvent voir les stocks disponibles
- Affichage par entrepôt
- Indication du stock disponible dans l'entrepôt connecté

### Modification
- **Qui peut modifier :** Manager, Admin
- Modification uniquement pour l'entrepôt connecté
- Consultation en lecture seule pour les autres entrepôts
- Historique des mouvements conservé

**Modification du stock :**
- **Autorisée uniquement** pour l'entrepôt connecté (`getEffectiveWarehouse()`)
- **Permission requise** : `inventory:adjust`
- **Autres entrepôts** : Affichés en lecture seule avec badge "Lecture seule"

**Affichage dans la liste des produits :**
- Stock prioritaire : Entrepôt Boutique connecté
- Indicateurs : "Rupture" (0), "X dispo" avec warning (≤5), "Dans panier" (tout dans panier)
- Bouton "Voir autres entrepôts" si plusieurs entrepôts avec stock

**Affichage dans l'écran Inventaire :**
- Conversion automatique des quantités (Decimal → Number)
- Affichage de l'unité du produit si disponible
- Validation des valeurs pour éviter "NaN"
- Affichage cohérent même pour produits sans inventaire (0 stock)

### Transferts de Stock

**Système de Demande et Approbation :**

1. **Demande de Transfert** :
   - **Qui peut demander :** Seller, Manager, Admin
   - **Quand :** Lorsque le stock est faible dans l'entrepôt de destination
   - **Processus :** Création d'une demande de transfert avec :
     - Produit concerné
     - Quantité demandée
     - Entrepôt source (qui a le stock disponible)
     - Entrepôt destination (qui a besoin du stock)
     - Raison/notes

2. **Approbation de Transfert** :
   - **Qui peut approuver :** Seulement un **Manager** assigné à l'entrepôt source
   - **Condition :** Le Manager doit être assigné à l'entrepôt qui a le stock disponible
   - **Processus :** 
     - Le Manager voit les demandes de transfert pour ses entrepôts assignés
     - Vérifie la disponibilité du stock dans son entrepôt
     - Approuve ou rejette la demande
     - Si approuvé, le transfert est appliqué automatiquement

3. **Transfert Direct (Manager multi-entrepôts)** :
   - **Qui peut transférer directement :** Manager assigné à plusieurs entrepôts
   - **Processus :** Un Manager peut transférer des produits entre ses propres entrepôts assignés sans approbation
   - **Cas d'usage :** Réorganisation de stock, équilibrage entre entrepôts

**Règles d'Approbation :**

| Rôle | Peut Demander | Peut Approuver | Peut Transférer Directement |
|------|---------------|----------------|----------------------------|
| Seller | ✅ (son entrepôt) | ❌ | ❌ |
| Manager | ✅ | ✅ (son entrepôt source) | ✅ (ses entrepôts) |
| Admin | ✅ | ✅ (tous) | ✅ (tous) |

**Workflow complet :**

#### 1. Création de la Demande
- **Qui** : Manager ou Admin de l'entrepôt de destination
- **Quand** : Produit avec stock à 0 dans l'entrepôt actuel
- **Comment** : 
  - Sélection du produit dans le modal de stock
  - Affichage des entrepôts avec stock disponible
  - Sélection de l'entrepôt source
  - Création sans quantité (quantité définie lors de l'approbation)
- **Résultat** : Demande créée avec statut "pending", quantité = null

#### 2. Approbation
- **Qui** : Manager de l'entrepôt source/destination ou Admin
- **Quand** : Demande en statut "pending"
- **Comment** :
  - Vérification du stock disponible dans l'entrepôt source
  - Définition de la quantité à transférer (validation : quantité ≤ stock disponible)
  - Approbation ou rejet avec notes optionnelles
- **Résultat** : 
  - Si approuvé : Statut "approved", quantité définie, stock non encore transféré
  - Si rejeté : Statut "rejected", quantité reste null

#### 3. Réception
- **Qui** : Manager de l'entrepôt de destination ou Admin
- **Quand** : Demande en statut "approved"
- **Comment** :
  - Vérification que la demande est approuvée
  - Vérification du stock disponible dans l'entrepôt source
  - Transfert effectif du stock (déduction source, ajout destination)
  - Création d'entrées dans `StockMovement`
- **Résultat** : Statut "completed", stock transféré

**Demande de transfert (implémenté) :**
1. **Bouton "Demander un transfert"** apparaît uniquement si :
   - Le produit est dans une Boutique (`isBoutique`)
   - Le stock est à 0 (`qty === 0`)
   - Il existe un entrepôt Stockage avec du stock disponible
2. **Recherche automatique** : Le système cherche automatiquement un entrepôt Stockage avec du stock disponible
3. **Si trouvé** : Ouvre la modale de transfert avec l'entrepôt source pré-sélectionné
4. **Si non trouvé** : Affiche une alerte "Aucun entrepôt Stockage n'a de stock disponible"

**Transfert de stock (API implémenté) :**
1. **Vérifications** :
   - L'entrepôt source et destination doivent être différents (erreur `400` si identiques)
   - Le stock source doit être suffisant (erreur `400 "Insufficient stock"` si insuffisant)
2. **Transaction atomique** :
   - Diminution du stock source
   - Augmentation du stock destination (création automatique si n'existe pas)
   - Création de deux mouvements de stock (sortie source, entrée destination)
3. **Traçabilité** : Les notes du transfert sont enregistrées dans les mouvements avec l'employé responsable

**Exemples de Workflow :**

**Scénario 1 : Seller demande un transfert depuis Stockage**
- Seller dans Boutique A détecte que produit-1 a un stock faible (besoin de 10 unités)
- Seller crée une demande de transfert : Boutique A ← Stockage B (qty: 10)
- Un Manager assigné à Stockage B voit la demande et vérifie le stock (disponible: 15)
- Manager approuve le transfert
- Le transfert est appliqué : Stockage B (-10), Boutique A (+10)
- Seller peut maintenant continuer à vendre depuis Boutique A

**Scénario 2 : Manager transfère entre ses entrepôts**
- Manager assigné à Stockage A et Boutique B
- Décide de transférer 20 unités de produit-2 de Stockage A vers Boutique B pour permettre la vente
- Effectue le transfert directement sans demande d'approbation
- Transfert appliqué immédiatement
- Les produits sont maintenant disponibles pour la vente dans Boutique B

**Scénario 3 : Transfert entre Boutiques**
- Manager assigné à Boutique A et Boutique B
- Décide de transférer 15 unités de produit-3 de Boutique A vers Boutique B pour équilibrer
- Effectue le transfert directement
- Les produits restent vendables dans les deux boutiques

**Règles importantes :**
- Les transferts doivent être approuvés par un Manager de l'entrepôt source
- Un Manager ne peut approuver que les transferts depuis ses entrepôts assignés
- Un Manager peut transférer directement entre ses propres entrepôts assignés
- Admin peut approuver n'importe quel transfert (accès global)
- Traçabilité complète : toutes les demandes et approbations sont enregistrées

**Filtres et Navigation :**
- **Filtre par statut** : En attente (défaut), Approuvées, Reçues, Rejetées
- **Filtre par entrepôt** : 
  - Managers : Seulement leurs entrepôts assignés
  - Admins : Tous les entrepôts
- **Tab Navigation** : "Transferts" visible en mode gestion

---

## Règles Métier Importantes

### Clients
1. Les clients **n'ont pas accès** à l'application (pas de login/compte utilisateur)
2. Les clients sont **globaux** (non attachés à un entrepôt spécifique)
3. Un client peut acheter dans n'importe quel entrepôt Boutique
4. Les points de fidélité sont **globaux** et partagés entre tous les entrepôts
5. Nom et téléphone sont suffisants pour créer un client (champs optionnels mais recommandés)
6. Les points de fidélité peuvent être utilisés pour obtenir des remises lors des ventes

### Ventes
1. Une vente ne peut être effectuée que depuis un entrepôt **Boutique**
2. **Règle fondamentale :** Pour vendre un produit, il doit d'abord être transféré depuis Stockage vers Boutique
3. Le stock vérifié est celui de l'entrepôt Boutique connecté
4. Les produits sans stock dans la Boutique ne peuvent pas être vendus
5. Les produits stockés uniquement dans Stockage ne peuvent pas être vendus directement
6. Les ventes sont liées à l'entrepôt Boutique et à l'employé qui les crée
7. Les ventes peuvent être associées à un client (optionnel)
8. **Filtrage par entrepôt** : Les listes de ventes et rapports sont automatiquement filtrées par l'entrepôt actuellement connecté
9. **Modes de paiement** : 
   - ✅ Espèces (cash)
   - ✅ Mobile Money
   - ❌ Carte bancaire (supprimé)
   - ❌ Virement bancaire / Crédit (supprimé)
   
   **Note :** Seuls les modes de paiement Espèces et Mobile Money sont disponibles dans le système.
10. **Système de points de fidélité** :
    - Les points de fidélité sont attribués au client après la vente
    - Le nombre de points attribués est basé sur le montant de la vente (taux défini par Admin)
    - Exemple : Si le taux est de 1%, une vente de 10 000 FCFA = 100 points
11. **Utilisation des points pour remise** :
    - Le staff est alerté lors de la vente si le client a des points disponibles
    - Le staff peut choisir d'appliquer une remise basée sur les points
    - Conversion monétaire : Les points sont convertis en équivalent monétaire (ex: 1000 points = 1000 FCFA)
    - Le taux de conversion est configurable par Admin dans les paramètres
    - Le staff peut choisir d'accumuler les points OU d'utiliser les points pour une remise
12. **Mise à jour automatique du stock** : Après validation d'une vente, le stock de l'entrepôt est automatiquement décrémenté

**Workflow de vente :**
- Produit dans Stockage → Transfert vers Boutique → Vente possible
- Produit déjà dans Boutique → Vente directe possible

**Vérifications implémentées lors de l'ajout au panier :**
1. Vérification du type d'entrepôt (doit être BOUTIQUE)
2. Vérification du stock disponible dans l'entrepôt connecté
3. Vérification de la quantité déjà dans le panier
4. Alerte de stock faible si ≤ 5 unités restantes après ajout

**Vérifications dans le panier :**
1. **Validation en temps réel** : Lors de la modification de quantité, vérification immédiate du stock disponible
2. **Blocage de quantité excessive** : Impossible d'ajouter plus que le stock disponible
3. **Validation avant checkout** : Vérification complète de tous les articles avant validation de la vente
4. **Messages d'erreur explicites** : Alerte détaillée si stock insuffisant avec liste des articles concernés

### Impression de Reçu

**Fonctionnalités implémentées :**
1. **Impression après vente** :
   - Après une vente réussie, une alerte propose deux options :
     - **"Imprimer"** : Ouvre le dialogue d'impression natif du système
     - **"Partager"** : Génère un PDF et permet de le partager (email, messages, etc.)
2. **Réimpression** :
   - Depuis l'historique des ventes, possibilité de réimprimer un reçu
   - Boutons "Imprimer" et "Partager" disponibles sur chaque vente
3. **Contenu du reçu** :
   - Informations de l'entrepôt (nom, adresse, téléphone)
   - Numéro de facture et date/heure
   - Informations client (si associé)
   - Liste des produits (nom, quantité, prix unitaire, total)
   - Sous-total, remises, TVA, total
   - Détails des paiements (méthode, montant, monnaie rendue si espèces)
   - Nom de l'employé qui a effectué la vente
   - Message de remerciement et note de conservation

**Configuration :**
- **Paramètres d'imprimante** (`settings-printer`) :
  - Types d'imprimantes supportées : Thermique USB, Réseau, Bluetooth
  - Configuration IP/Port pour imprimantes réseau
  - Largeur de papier (58mm ou 80mm)
  - Impression automatique après chaque vente (optionnel)
  - Nombre de copies
  - Affichage du logo et message de pied de page
- **Format du reçu** (`settings-receipt`) :
  - **En-tête** :
    - ✅ Afficher/masquer le logo
    - 📝 Nom de l'entreprise (personnalisable)
    - 📝 Adresse (personnalisable)
    - 📝 Téléphone (personnalisable)
    - 📝 Email (personnalisable)
  - **Contenu** :
    - ✅ Afficher/masquer le SKU des produits
    - ✅ Afficher/masquer les remises par article
    - ✅ Afficher/masquer le détail des taxes (TVA)
    - ✅ Afficher/masquer les détails du paiement (méthode, montant reçu, monnaie rendue)
    - ✅ Afficher/masquer le nom du vendeur
    - ✅ Afficher/masquer la date et l'heure
  - **Pied de page** :
    - ✅ Afficher/masquer le pied de page
    - 📝 Ligne 1 personnalisable (ex: "Merci pour votre achat!")
    - 📝 Ligne 2 personnalisable (ex: "À bientôt!")
    - ✅ Afficher/masquer le code-barres du numéro de vente
    - ✅ Afficher/masquer le QR code pour vérification
  - **Fonctionnalités** :
    - 👁️ Aperçu en temps réel du reçu avant impression (bouton "Aperçu du reçu")
    - 💾 Sauvegarde automatique des paramètres dans l'application
    - 🔄 Paramètres persistants entre les sessions

**Technologie utilisée :**
- `expo-print` pour la génération HTML et l'impression
- `expo-sharing` pour le partage en PDF
- Génération HTML avec styles CSS pour le formatage du reçu

### Stocks
1. Chaque produit a un stock par entrepôt
2. Les stocks sont indépendants entre entrepôts
3. Les transferts modifient les stocks des deux entrepôts concernés
4. L'historique des mouvements est conservé pour audit

**Affichage du stock dans la liste des produits :**
- **Stock prioritaire** : Le stock affiché est celui de l'entrepôt Boutique connecté (`getEffectiveWarehouse()`)
- **Affichage cohérent** : Les produits apparaissent toujours avec un stock (même 0) pour l'entrepôt connecté
- **Indicateurs visuels** :
  - "Rupture" si stock = 0
  - "X dispo" avec icône warning si stock ≤ 5
  - "Dans panier" si tout le stock est dans le panier
- **Bouton "Voir autres entrepôts"** : Visible si le produit a plusieurs entrepôts avec stock
- **Virtual inventory** : Si un produit n'a pas d'entrée d'inventaire pour l'entrepôt connecté, affichage de 0 stock au lieu de "rupture de stock"

**Affichage dans l'écran Inventaire :**
- **Conversion automatique** : Les quantités (Decimal de Prisma) sont automatiquement converties en nombres pour l'affichage
- **Affichage de l'unité** : L'unité du produit est affichée sous le SKU si disponible
- **Pas de NaN** : Toutes les valeurs sont validées et converties pour éviter l'affichage de "NaN"

### Produits
1. Un produit peut être désactivé (soft delete) par Manager ou Admin
2. **Seul Admin peut supprimer définitivement un produit** (hard delete)
3. **Vérifications avant suppression** :
   - Le produit ne doit pas avoir été utilisé dans des ventes (`saleItems`)
   - Le produit ne doit pas avoir été utilisé dans des commandes d'achat (`purchaseOrderItems`)
   - Si utilisé : Erreur `400 Bad Request` avec message explicite : "Cannot delete product that has been used in X sale(s). The product must remain for historical records."
4. **Suppression en transaction** : Si les vérifications passent, suppression atomique du produit et de tous les mouvements de stock associés
5. Les produits inactifs n'apparaissent pas dans les listes de vente

### Employés
1. **Assignation d'entrepôt requise** :
   - **Admin** : Entrepôt optionnel (peut être créé sans entrepôt assigné)
   - **Manager** : Entrepôt requis (erreur `400 Bad Request` si manquant)
   - **Seller** : Entrepôt requis + doit être de type Boutique uniquement
2. **Validation lors de la création/modification** :
   - Si rôle non-admin créé/modifié sans `warehouseId` → Erreur `400 "Warehouse is required for non-admin roles"`
   - Vérification que le rôle existe avant validation
3. Un Seller ne peut être assigné qu'à des entrepôts Boutique
4. Un Manager peut être assigné à plusieurs entrepôts (Boutique ou Stockage)
5. Un Admin a accès à tous les entrepôts même sans assignation

### Finances
1. **Manager** : Gère les finances (ventes et dépenses) au niveau de son/ses entrepôt(s) assigné(s)
   - Peut voir toutes les ventes de ses entrepôts assignés
   - Peut gérer les dépenses de ses entrepôts assignés
   - Peut voir les rapports financiers de ses entrepôts assignés
   - **Périodes de visualisation** : Jour, Semaine, Mois, Année
   - **Ne peut pas** accéder aux données financières des autres entrepôts non assignés
2. **Admin** : Gère les finances au niveau global (tous les entrepôts)
   - Peut voir toutes les ventes de tous les entrepôts
   - Peut gérer les dépenses de tous les entrepôts
   - Peut voir les rapports financiers consolidés de tous les entrepôts
   - **Périodes de visualisation** : Jour, Semaine, Mois, Année
   - Accès complet aux données financières globales
3. **Seller** : Pas d'accès à la gestion financière
   - Peut uniquement créer des ventes
   - Peut voir ses propres ventes
   - Ne peut pas voir les rapports financiers ou gérer les dépenses

### Rapports Financiers

**Périodes disponibles :**

| Période | Description | Utilisation |
|---------|-------------|-------------|
| **Jour** | Rapports journaliers | Ventes et dépenses du jour sélectionné |
| **Semaine** | Rapports hebdomadaires | Ventes et dépenses de la semaine sélectionnée |
| **Mois** | Rapports mensuels | Ventes et dépenses du mois sélectionné |
| **Année** | Rapports annuels | Ventes et dépenses de l'année sélectionnée |

1. **Périodes disponibles** : Tous les rapports financiers peuvent être visualisés par :
   - **Jour** : Rapports journaliers (ventes et dépenses du jour)
   - **Semaine** : Rapports hebdomadaires (ventes et dépenses de la semaine)
   - **Mois** : Rapports mensuels (ventes et dépenses du mois)
   - **Année** : Rapports annuels (ventes et dépenses de l'année)
2. **Scoping par rôle** :
   - Manager : Rapports limités à ses entrepôts assignés pour chaque période
   - Admin : Rapports consolidés de tous les entrepôts pour chaque période
3. **Données incluses** :
   - Total des ventes
   - Total des dépenses
   - Bénéfice net (ventes - dépenses)
   - Nombre de transactions
   - Détails par entrepôt (pour Admin)

---

## Permissions et Sécurité

### Système de Permissions
- Basé sur les rôles (Role-Based Access Control - RBAC)
- Permissions granulaires par ressource et action
- Admin a automatiquement toutes les permissions

### Vérifications de Sécurité
- Authentification par PIN pour l'accès mobile
- Token JWT pour les requêtes API
- Vérification des permissions à chaque action
- Scoping des données par entrepôt assigné

### Codes d'Erreur Courants

| Code | Signification | Action |
|------|---------------|--------|
| 403 | Permission insuffisante | Vérifier le rôle et les permissions |
| 400 | Requête invalide | Vérifier les données envoyées |
| 404 | Ressource non trouvée | Vérifier l'ID ou l'existence |
| 409 | Conflit (doublon) | Vérifier l'unicité (téléphone, SKU, etc.) |

---

## Navigation et Interface

### Structure de Navigation

**Mode Vente :**
- Accueil (liste des produits)
- Ventes (historique)
- Panier
- Clients
- Plus (paramètres, déconnexion)

**Mode Gestion :**
- Accueil (liste des produits - mode gestion)
- Catégories
- Entrepôts
- Personnel (si permissions)
- Plus (paramètres, déconnexion)

### Changement d'Entrepôt
- Disponible depuis le menu "Plus"
- Filtrage selon le mode :
  - Mode Vente : Seulement entrepôts Boutique (les entrepôts STOCKAGE ne sont même pas listés)
  - Mode Gestion : Tous les entrepôts assignés
- Changement en temps réel avec rafraîchissement des données
- **Vidage automatique du panier** : Lors du changement d'entrepôt, le panier est automatiquement vidé pour éviter les ventes avec des produits d'un entrepôt différent

**Restrictions implémentées :**
- En mode Vente, les entrepôts `STOCKAGE` ne sont pas affichés dans la liste de sélection
- En mode Vente, tentative de changement vers un entrepôt `STOCKAGE` → Alerte bloquante "Changement impossible"
- En mode Gestion, changement vers n'importe quel entrepôt autorisé
- Filtrage automatique des entrepôts disponibles selon le mode actuel

### Affichage du Nom d'Entrepôt
- **Écran principal (POS)** : Nom de l'entrepôt affiché avec icône `storefront` sous le message "Bonjour"
- **Écran Panier** : Barre d'entrepôt en haut de l'écran avec icône et nom
- **Écran Ventes** : Barre d'entrepôt en haut de l'écran avec icône et nom
- **Style** : Nom de l'entrepôt en couleur primaire, taille moyenne, avec icône pour identification rapide

### Gestion du Panier
- **Vidage automatique** : Le panier est automatiquement vidé lors du changement d'entrepôt
- **Validation du stock** : Vérification en temps réel lors de la modification des quantités
- **Blocage de checkout** : Impossible de valider une vente si les quantités dépassent le stock disponible
- **Messages d'erreur** : Alertes détaillées avec liste des articles concernés en cas de problème de stock

---

## Système d'Alertes pour les Admins

### Vue d'ensemble
Système complet permettant aux administrateurs de suivre les activités critiques des autres utilisateurs dans le système.

### Types d'Alertes
- **stock_reduction** : Réduction de stock en mode gestion (non liée aux ventes)
- **transfer_request** : Création d'une demande de transfert
- **transfer_approval** : Approbation d'une demande de transfert
- **transfer_rejection** : Rejet d'une demande de transfert
- **transfer_reception** : Réception d'un transfert
- **user_creation** : Création d'un nouvel utilisateur
- **product_deletion** : Suppression définitive d'un produit

### Niveaux de Sévérité
- **info** : Informations générales
- **warning** : Avertissements (par défaut)
- **critical** : Alertes critiques (suppression de produit)

### Architecture
- **Modèle Prisma** : `ManagerAlert` avec relations vers `Warehouse`, `Product`, `Employee`, `StockTransferRequest`
- **Service** : `alerts.service.ts` - CRUD complet, restriction aux admins
- **Routes API** : `/api/alerts` - GET, PUT pour marquer comme lu
- **Helper** : `alerts.helper.ts` - Fonctions de création automatique d'alertes

### Intégration
Les alertes sont créées automatiquement lors de :
- Réduction de stock dans `products.service.ts`
- Suppression de produit dans `products.service.ts`
- Création/approbation/rejet/réception de transfert dans `transfer-requests.service.ts`
- Création d'utilisateur dans `employees.service.ts`

### Interface Mobile
- **Écran** : `alerts-list.tsx` - Liste avec filtres par sévérité
- **Navigation** : Tab "Alertes" visible uniquement pour les admins en mode gestion
- **Badge** : Notification avec nombre d'alertes non lues (rafraîchissement toutes les 30 secondes)
- **Modal** : Détails complets de chaque alerte avec métadonnées

---

## Principes de Gestion des Données

### Standardisation des Unités
- **Liste prédéfinie** : Les unités de produits sont standardisées via une liste enum
- **Cohérence** : Évite les variations d'écriture (ex: "kg" vs "kilogramme" vs "Kg")
- **13 unités disponibles** : Pièce, kg, g, Litre, mL, Mètre, cm, m², m³, Boîte, Paquet, Carton, Unité
- **Valeur par défaut** : "piece" si aucune unité n'est spécifiée
- **Interface** : Sélection via modal avec libellés complets pour meilleure compréhension
- **Avantages** : 
  - Cohérence des données dans tout le système
  - Facilite les rapports et analyses
  - Réduit les erreurs de saisie

### Gestion des Valeurs Numériques
- **Conversion automatique** : Les valeurs Decimal (Prisma) sont converties en Number pour l'affichage
- **Validation** : Toutes les valeurs numériques sont validées avant affichage pour éviter "NaN"
- **Valeurs par défaut** : 
  - Stock : 0 si non spécifié
  - minStockLevel : 5 si non spécifié (modifiable)
- **Gestion des erreurs** : Affichage de 0 au lieu de "NaN" pour les valeurs invalides

### Modes de Paiement Simplifiés
- **Deux modes uniquement** : Espèces et Mobile Money
- **Suppression** : Carte bancaire et Virement bancaire/Crédit ont été supprimés
- **Cohérence** : Simplification pour faciliter la gestion et réduire les erreurs
- **Avantages** :
  - Interface plus simple
  - Moins de confusion pour les utilisateurs
  - Alignement avec les pratiques locales

### Filtrage par Entrepôt
- **Principe fondamental** : Toutes les données sont filtrées par l'entrepôt connecté
- **Ventes** : Seules les ventes de l'entrepôt connecté sont affichées
- **Rapports** : Les rapports financiers sont filtrés par entrepôt
- **Produits** : Les quantités affichées correspondent à l'entrepôt connecté
- **Inventaire** : Affichage du stock par entrepôt avec possibilité de modification uniquement pour l'entrepôt connecté
- **Avantages** :
  - Sécurité des données
  - Clarté pour les utilisateurs
  - Prévention des erreurs de gestion

### Vidage Automatique du Panier
- **Principe** : Le panier est automatiquement vidé lors du changement d'entrepôt
- **Raison** : Éviter les ventes avec des produits d'un entrepôt différent
- **Sécurité** : Garantit que les ventes sont effectuées avec les bons stocks
- **Implémentation** : Vérification de changement d'entrepôt avant vidage (ne vide que si changement réel)

### Affichage du Nom d'Entrepôt
- **Principe** : Le nom de l'entrepôt connecté est toujours visible
- **Emplacements** : 
  - Écran principal (sous "Bonjour")
  - Écran Panier (barre en haut)
  - Écran Ventes (barre en haut)
- **Style** : Icône + nom en couleur primaire pour identification rapide
- **Avantages** : 
  - Réduction des erreurs de vente
  - Clarté sur l'entrepôt actif
  - Meilleure expérience utilisateur

---

## Points d'Attention pour le Développement

### Checklist de Développement

**Avant d'ajouter une nouvelle fonctionnalité :**
- [ ] Vérifier quel(s) rôle(s) doit(vent) avoir accès
- [ ] Vérifier si une assignation d'entrepôt est nécessaire
- [ ] Vérifier si le type d'entrepôt est important (Boutique vs Stockage)
- [ ] Ajouter les vérifications de permissions dans le code
- [ ] Filtrer les données selon l'entrepôt connecté
- [ ] Tester avec chaque rôle (Seller, Manager, Admin)
- [ ] Tester avec différents types d'entrepôts
- [ ] Mettre à jour cette documentation si nécessaire

**Points de vérification courants :**
1. **Permissions** : Utiliser `hasPermission()` avant chaque action
2. **Entrepôt** : Vérifier `getEffectiveWarehouse()` pour le scope des données
3. **Rôle** : Vérifier `employee.role.name` pour les restrictions spéciales
4. **Type d'entrepôt** : Vérifier `warehouse.type` avant les ventes
5. **Assignation** : Vérifier que l'employé est assigné à l'entrepôt

### Cohérence des Données
- Toujours vérifier le rôle de l'utilisateur avant d'autoriser une action
- Vérifier l'assignation à l'entrepôt avant d'afficher/modifier des données
- Filtrer les données selon l'entrepôt connecté

### Performance
- Mettre en cache les listes de produits et catégories
- Paginer les grandes listes (ventes, produits)
- Invalider le cache après modifications

### Expérience Utilisateur
- Feedback haptique pour les actions importantes
- Messages d'erreur clairs et contextuels
- Indicateurs visuels pour les stocks faibles
- Confirmation pour les actions destructives

### Sécurité
- Ne jamais exposer les mots de passe ou PIN
- Valider toutes les entrées côté client et serveur
- Vérifier les permissions à chaque requête API
- Logger les actions importantes pour audit

---

## Constantes Importantes

### Rôles
```typescript
'admin'    // Administrateur
'manager' // Gestionnaire
'cashier' // Vendeur (Seller)
```

### Types d'Entrepôts
```typescript
'BOUTIQUE'  // Pour les ventes
'STOCKAGE'  // Pour le stockage
```

### Modes d'Application
```typescript
'sell'    // Mode vente
'manage'  // Mode gestion
```

---

## 📋 Fonctionnalités à Tester

### Tests Critiques (Priorité: Haute)
- [ ] **Workflow de transfert complet** : Demande → Approbation → Réception
- [ ] **Points de fidélité** : Attribution automatique lors d'une vente avec client
- [ ] **Points de fidélité** : Utilisation des points pour remise
- [ ] **Hiérarchie personnel** : Manager ne peut créer que des Sellers
- [ ] **Hiérarchie personnel** : Manager ne peut modifier que les Sellers de ses entrepôts

**Suite complète** : Voir `TEST_SUITE.md` pour 40 scénarios de test détaillés

---

## 📈 Historique des Versions

### Version 1.1.0 (2024-12-26)
**Nouvelles fonctionnalités** :
- Système d'alertes pour les admins
- Améliorations du système de transfert
- Permissions et accès aux entrepôts améliorés
- Améliorations de l'interface utilisateur
- Tab "Transferts" dans la navigation

**Corrections** :
- Admin accès entrepôt lors de création de transferts
- Stock disponible dans modal d'approbation
- Permissions managers pour approbation/réception

### Version 1.0.0 (2024-12-20)
**Fonctionnalités initiales** :
- Authentification avec PIN
- Gestion des produits et catégories
- Gestion des entrepôts
- Gestion des stocks et inventaire
- Système de ventes avec panier
- Gestion des employés avec rôles
- Système de permissions (RBAC)
- Transferts de stock entre entrepôts
- Système de points de fidélité
- Gestion financière (dépenses et rapports)

---

## 🎯 Prochaines Étapes Recommandées

### Court terme
1. ✅ Exécuter la suite de tests complète (`TEST_SUITE.md`)
2. ✅ Valider tous les workflows critiques (tous les transferts passent par le processus complet)

### Moyen terme
1. ⚠️ Considérer le modèle `SystemSettings` dédié
2. 📊 Monitoring et dashboard pour alertes
3. 🔔 Notifications push pour alertes critiques

### Long terme
1. 📈 Rapports avancés et analytics
2. 🔄 Mode hors ligne avec synchronisation
3. 🌐 Intégration avec systèmes externes

---

## 📊 Statistiques

### Par Catégorie
- **Alertes** : 11 fonctionnalités ✅
- **Transferts** : 17 fonctionnalités ✅
- **Points de fidélité** : 9 fonctionnalités ✅
- **Finances** : 7 fonctionnalités ✅
- **Personnel** : 7 fonctionnalités ✅
- **Entrepôts** : 4 fonctionnalités ✅
- **Interface** : 5 fonctionnalités ✅

### Par Priorité
- **Implémenté** : 60 points ✅
- **À améliorer** : 1 point ⚠️
- **À tester** : 5 scénarios critiques 📋

---

**Dernière mise à jour** : 2024-12-26  
**Version** : 1.1.0
