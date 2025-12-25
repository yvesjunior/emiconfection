# Référence Rapide - Règles Métier

## Matrice des Permissions par Rôle

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
| **Reçus** |
| Imprimer un reçu | ✅ | ✅ | ✅ |
| Partager un reçu (PDF) | ✅ | ✅ | ✅ |
| Réimprimer un reçu | ✅ | ✅ | ✅ |
| Configurer l'imprimante | ✅ | ✅ | ✅ |
| Personnaliser le format | ✅ | ✅ | ✅ |

## Règles d'Assignation d'Entrepôt

| Rôle | Entrepôt Requis | Types Autorisés | Multiples |
|------|----------------|-----------------|-----------|
| Seller | ✅ Oui | Boutique uniquement | ✅ Oui |
| Manager | ✅ Oui | Boutique + Stockage | ✅ Oui |
| Admin | ❌ Non | Tous | N/A |

## Types d'Entrepôts et Ventes

| Type | Vente Autorisée | Assignation Seller | Assignation Manager | Usage Principal |
|------|-----------------|-------------------|---------------------|-----------------|
| Boutique | ✅ Oui | ✅ Oui | ✅ Oui | Vente directe aux clients |
| Stockage | ❌ Non | ❌ Non | ✅ Oui | Stockage uniquement, transfert vers Boutique requis pour vente |

**Règle importante :** Pour vendre un produit, il doit d'abord être transféré depuis Stockage vers Boutique. Les produits dans Stockage ne peuvent pas être vendus directement.

---

## Impression de Reçu

### Fonctionnalités Disponibles

**Après chaque vente :**
- ✅ Impression immédiate du reçu (bouton "Imprimer")
- ✅ Partage du reçu en PDF (bouton "Partager")
- ✅ Options disponibles dans l'alerte de confirmation de vente

**Depuis l'historique :**
- ✅ Réimpression d'un reçu existant
- ✅ Partage d'un reçu existant en PDF

### Contenu du Reçu

Le reçu contient :
- **En-tête** : Nom de l'entrepôt, adresse, téléphone
- **Informations de facture** : Numéro de facture, date et heure
- **Client** : Nom et téléphone (si associé)
- **Produits** : Tableau avec nom, quantité, prix unitaire, total
- **Totaux** : Sous-total, remises, TVA, total général
- **Paiements** : Méthode de paiement, montant, monnaie rendue (si espèces)
- **Pied de page** : Message de remerciement, note de conservation, nom de l'employé

### Configuration

**Types d'imprimantes supportées :**
- Thermique USB
- Réseau (IP/Port)
- Bluetooth

**Options de configuration :**
- Largeur de papier : 58mm ou 80mm
- Impression automatique après chaque vente
- Nombre de copies
- Affichage du logo
- Message personnalisé en pied de page

**Personnalisation du format (Écran "Format du reçu") :**

**En-tête :**
- ✅ Afficher/masquer le logo
- 📝 Nom de l'entreprise (personnalisable)
- 📝 Adresse (personnalisable)
- 📝 Téléphone (personnalisable)
- 📝 Email (personnalisable)

**Contenu :**
- ✅ Afficher/masquer le SKU des produits
- ✅ Afficher/masquer les remises par article
- ✅ Afficher/masquer le détail des taxes (TVA)
- ✅ Afficher/masquer les détails du paiement (méthode, montant reçu, monnaie rendue)
- ✅ Afficher/masquer le nom du vendeur
- ✅ Afficher/masquer la date et l'heure

**Pied de page :**
- ✅ Afficher/masquer le pied de page
- 📝 Ligne 1 personnalisable (ex: "Merci pour votre achat!")
- 📝 Ligne 2 personnalisable (ex: "À bientôt!")
- ✅ Afficher/masquer le code-barres du numéro de vente
- ✅ Afficher/masquer le QR code pour vérification

**Fonctionnalités :**
- 👁️ Aperçu en temps réel du reçu avant impression
- 💾 Sauvegarde automatique des paramètres dans l'application
- 🔄 Paramètres persistants entre les sessions

### Workflow d'Impression

```
Vente réussie
    ↓
Alerte de confirmation
    ↓
Options disponibles :
  - "Nouvelle vente" → Retour à l'accueil
  - "Imprimer" → Ouvre dialogue d'impression natif
  - "Partager" → Génère PDF et ouvre partage
```

**Réimpression :**
```
Historique des ventes
    ↓
Sélection d'une vente
    ↓
Boutons disponibles :
  - "Imprimer" → Réimpression du reçu
  - "Partager" → Partage en PDF
```

## Workflow de Suppression de Produit

```
Produit à supprimer
    ↓
Vérifier le rôle → Admin ? ❌ → Erreur 403 "Only administrators can delete"
    ↓ ✅
Vérifier les ventes → Utilisé ? ✅ → Erreur 400 "Cannot delete product that has been used in X sale(s)"
    ↓ ❌
Vérifier les commandes → Utilisé ? ✅ → Erreur 400 "Cannot delete product that has been used in X purchase order(s)"
    ↓ ❌
Transaction atomique :
  - Supprimer les mouvements de stock
  - Supprimer le produit (cascade ProductCategory, Inventory)
    ↓
Supprimer définitivement ✅
```

**Messages d'erreur explicites :**
- `403` : "Only administrators can delete products from the database"
- `400` : "Cannot delete product that has been used in X sale(s). The product must remain for historical records."
- `400` : "Cannot delete product that has been used in X purchase order(s). The product must remain for historical records."

## Workflow de Création d'Employé

### Hiérarchie de Gestion

**Manager :**
- ✅ Peut créer uniquement des **Sellers** attachés à ses entrepôts assignés
- ❌ Ne peut pas créer de Managers
- ❌ Ne peut pas créer de Sellers pour d'autres entrepôts

**Admin :**
- ✅ Peut créer des **Managers** (sans restriction)
- ✅ Peut créer des **Sellers** (sans restriction)
- ✅ Peut créer des **Admins** (sans restriction)

### Workflow

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
Vérifier unicité email (si fourni) → Existe ? → Erreur 409 "Email already in use"
    ↓
Hasher password et PIN
    ↓
Créer l'employé ✅
```

**Messages d'erreur :**
- `400` : "Warehouse is required for non-admin roles"
- `400` : "Invalid role"
- `403` : "You can only create Sellers for your assigned warehouses" (Manager tentant de créer un Manager)
- `403` : "You can only manage staff assigned to your warehouses" (Manager tentant de créer pour un autre entrepôt)
- `409` : "Phone number already in use"
- `409` : "Email already in use"

## Checklist de Développement

### Avant d'ajouter une nouvelle fonctionnalité :

- [ ] Vérifier quel(s) rôle(s) doit(vent) avoir accès
- [ ] Vérifier si une assignation d'entrepôt est nécessaire
- [ ] Vérifier si le type d'entrepôt est important (Boutique vs Stockage)
- [ ] Ajouter les vérifications de permissions dans le code
- [ ] Filtrer les données selon l'entrepôt connecté
- [ ] Tester avec chaque rôle (Seller, Manager, Admin)
- [ ] Tester avec différents types d'entrepôts
- [ ] Mettre à jour cette documentation si nécessaire

### Points de vérification courants :

1. **Permissions** : Utiliser `hasPermission()` avant chaque action
2. **Entrepôt** : Vérifier `getEffectiveWarehouse()` pour le scope des données
3. **Rôle** : Vérifier `employee.role.name` pour les restrictions spéciales
4. **Type d'entrepôt** : Vérifier `warehouse.type` avant les ventes
5. **Assignation** : Vérifier que l'employé est assigné à l'entrepôt

### Règles de Connexion Implémentées

**Filtrage des entrepôts au login :**
- **Mode Vente** : Seuls les entrepôts `BOUTIQUE` sont disponibles
- **Mode Gestion** : Tous les entrepôts actifs (BOUTIQUE et STOCKAGE)

**Validation au login :**
- Employé assigné à STOCKAGE en mode Vente → Alerte bloquante
- Aucun entrepôt compatible → Alerte informative

**Changement d'entrepôt :**
- Mode Vente : Impossible de changer vers STOCKAGE (alerte bloquante)
- Mode Gestion : Changement vers n'importe quel entrepôt autorisé

### Gestion du Stock par Entrepôt

**Modification du stock :**
- **Autorisée uniquement** pour l'entrepôt connecté (`getEffectiveWarehouse()`)
- **Permission requise** : `inventory:adjust`
- **Autres entrepôts** : Affichés en lecture seule avec badge "Lecture seule"

**Affichage dans la liste des produits :**
- Stock prioritaire : Entrepôt Boutique connecté
- Indicateurs : "Rupture" (0), "X dispo" avec warning (≤5), "Dans panier" (tout dans panier)
- Bouton "Voir autres entrepôts" si plusieurs entrepôts avec stock

**Vérifications lors de l'ajout au panier :**
- Vérification type entrepôt (doit être BOUTIQUE)
- Vérification stock disponible
- Vérification quantité déjà dans panier
- Alerte stock faible si ≤ 5 unités restantes

## Gestion des Clients

### Caractéristiques
- **Pas d'accès à l'application** : Les clients n'ont pas de compte/login
- **Globaux** : Non attachés à un entrepôt spécifique
- **Partagés** : Même client peut acheter dans tous les entrepôts Boutique
- **Points de fidélité** : Système de points globaux pour remises

### Champs Requis
- Nom (optionnel mais recommandé)
- Téléphone (optionnel mais recommandé pour identification)

### Système de Points de Fidélité

**Accumulation :**
- Points accumulés automatiquement lors des achats
- Basé sur le montant de la vente (taux défini par Admin dans les paramètres)
- Exemple : Taux de 1% → Vente de 10 000 FCFA = 100 points attribués

**Conversion monétaire :**
- Les points peuvent être convertis en équivalent monétaire pour des remises
- Taux de conversion configurable par Admin (ex: 1000 points = 1000 FCFA)
- Le staff est alerté lors de la vente pour proposer l'utilisation des points

**Utilisation :**
- Le staff peut choisir lors de la vente :
  - **Accumuler** : Le client gagne de nouveaux points sur cet achat
  - **Utiliser** : Appliquer une remise basée sur les points disponibles du client
- Conversion automatique : X points = Y FCFA de remise (selon le taux configuré)
- Points globaux (même compte partout, tous les entrepôts)

**Configuration (Admin uniquement) :**
- Taux d'attribution : Nombre de points par montant d'achat (ex: 1% du montant)
- Taux de conversion : Équivalence points → monnaie (ex: 1000 pts = 1000 FCFA)

---

## Codes d'Erreur Courants

| Code | Signification | Action |
|------|---------------|--------|
| 403 | Permission insuffisante | Vérifier le rôle et les permissions |
| 400 | Requête invalide | Vérifier les données envoyées |
| 404 | Ressource non trouvée | Vérifier l'ID ou l'existence |
| 409 | Conflit (doublon) | Vérifier l'unicité (téléphone, SKU, etc.) |

## Gestion Financière par Rôle

### Manager
- **Niveau** : Entrepôt(s) assigné(s)
- **Accès** :
  - Voir toutes les ventes de ses entrepôts assignés
  - Gérer les dépenses de ses entrepôts assignés
  - Voir les rapports financiers de ses entrepôts assignés
    - Par jour, semaine, mois, année
- **Restriction** : Ne peut pas accéder aux données financières des autres entrepôts

### Admin
- **Niveau** : Global (tous les entrepôts)
- **Accès** :
  - Voir toutes les ventes de tous les entrepôts
  - Gérer les dépenses de tous les entrepôts
  - Voir les rapports financiers consolidés de tous les entrepôts
    - Par jour, semaine, mois, année
- **Aucune restriction** : Accès complet aux données financières globales

### Seller
- **Niveau** : Aucun accès à la gestion financière
- **Limitation** :
  - Peut uniquement créer des ventes
  - Peut voir ses propres ventes
  - Ne peut pas voir les rapports ou gérer les dépenses

## Périodes de Rapports Financiers

Tous les rapports financiers peuvent être visualisés par période :

| Période | Description | Utilisation |
|---------|-------------|-------------|
| **Jour** | Rapports journaliers | Ventes et dépenses du jour sélectionné |
| **Semaine** | Rapports hebdomadaires | Ventes et dépenses de la semaine sélectionnée |
| **Mois** | Rapports mensuels | Ventes et dépenses du mois sélectionné |
| **Année** | Rapports annuels | Ventes et dépenses de l'année sélectionnée |

**Données incluses dans les rapports :**
- Total des ventes
- Total des dépenses
- Bénéfice net (ventes - dépenses)
- Nombre de transactions
- Détails par entrepôt (pour Admin uniquement)

## Système de Transfert de Stock

### Demande de Transfert (Implémenté)

**Conditions d'affichage du bouton "Demander un transfert" :**
- Produit dans une Boutique (`isBoutique === true`)
- Stock = 0 (`qty === 0`)
- Existe un entrepôt Stockage avec stock disponible

**Workflow implémenté :**
```
1. Détection stock faible (0)
   ↓
2. Recherche automatique d'un entrepôt Stockage avec stock
   ↓
   Trouvé ? → Ouvre modale de transfert avec source pré-sélectionnée
   Non trouvé ? → Alerte "Aucun entrepôt Stockage n'a de stock disponible"
```

### Transfert de Stock (API Implémenté)

**Workflow de transfert :**
```
1. Vérifications
   ↓
   Source ≠ Destination ? ❌ → Erreur 400 "Source and destination warehouses must be different"
   Stock source suffisant ? ❌ → Erreur 400 "Insufficient stock in source warehouse"
   ↓ ✅
2. Transaction atomique
   ↓
   Diminuer stock source
   Augmenter stock destination (créer si n'existe pas)
   Créer 2 mouvements de stock (sortie source, entrée destination)
   ↓
   Succès ✅
```

### Approbation (À Implémenter)

```
1. Demande de Transfert
   ↓
   Seller/Manager détecte stock faible
   ↓
   Crée demande : Entrepôt Destination ← Entrepôt Source (qty)
   
2. Approbation
   ↓
   Manager assigné à Entrepôt Source voit la demande
   ↓
   Vérifie disponibilité du stock
   ↓
   Approuve ou Rejette
   
3. Application
   ↓
   Si approuvé → Transfert appliqué automatiquement
   ↓
   Stock Source (-qty), Stock Destination (+qty)
   ↓
   Mouvements enregistrés dans l'historique
```

### Règles d'Approbation

| Rôle | Peut Demander | Peut Approuver | Peut Transférer Directement |
|------|---------------|----------------|----------------------------|
| Seller | ✅ (son entrepôt) | ❌ | ❌ |
| Manager | ✅ | ✅ (son entrepôt source) | ✅ (ses entrepôts) |
| Admin | ✅ | ✅ (tous) | ✅ (tous) |

### Scénarios

**Scénario 1 : Seller demande transfert depuis Stockage**
- Seller Boutique A → Détecte stock faible → Demande transfert depuis Stockage B
- Manager Stockage B → Vérifie stock disponible → Approuve
- Transfert appliqué : Stockage B (-qty), Boutique A (+qty)
- Seller peut maintenant vendre depuis Boutique A

**Scénario 2 : Manager transfère directement**
- Manager assigné à Stockage A et Boutique B
- Transfère directement de Stockage A → Boutique B
- Pas besoin d'approbation (ses propres entrepôts)
- Produits maintenant disponibles pour vente dans Boutique B

**Règle fondamentale :** Les produits dans Stockage doivent être transférés vers Boutique avant de pouvoir être vendus.

---

## Gestion du Personnel - Hiérarchie

### Manager
**Peut gérer :**
- ✅ Le staff (Sellers) attaché à ses entrepôts assignés
- ✅ Créer, modifier, désactiver des Sellers pour ses entrepôts
- ✅ Réinitialiser les PIN des Sellers de ses entrepôts
- ✅ Voir les employés (Sellers) de ses entrepôts assignés

**Ne peut pas gérer :**
- ❌ Les Managers (réservé à Admin)
- ❌ Le staff d'autres entrepôts non assignés
- ❌ Les rôles et permissions

### Admin
**Peut gérer :**
- ✅ Les Managers (création, modification, suppression)
- ✅ Le staff en dessous (tous les Sellers de tous les entrepôts)
- ✅ Tous les employés sans restriction
- ✅ Les rôles et permissions
- ✅ L'assignation des Managers aux entrepôts

**Scope :**
- Accès complet à tous les employés du système
- Pas de restriction géographique ou hiérarchique

### Exemples

**Scénario 1 : Manager gère son staff**
- Manager assigné à Boutique A et Boutique B
- Peut créer un Seller pour Boutique A ✅
- Peut créer un Seller pour Boutique B ✅
- Peut modifier un Seller de Boutique A ✅
- Ne peut pas créer un Seller pour Boutique C (non assigné) ❌
- Ne peut pas créer un Manager ❌

**Scénario 2 : Admin gère tout**
- Admin peut créer un Manager pour n'importe quel entrepôt ✅
- Admin peut créer un Seller pour n'importe quel entrepôt ✅
- Admin peut modifier n'importe quel Manager ✅
- Admin peut modifier n'importe quel Seller ✅

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

## Configuration des Points de Fidélité (Admin)

### Paramètres Configurables

**Taux d'attribution :**
- Nombre de points attribués par montant d'achat
- Exemples :
  - 1% du montant : 10 000 FCFA → 100 points
  - 10 points par 1000 FCFA : 10 000 FCFA → 100 points
  - Taux fixe : X points par achat

**Taux de conversion :**
- Équivalence points → monnaie pour remises
- Exemples :
  - 1000 points = 1000 FCFA (1:1)
  - 1000 points = 500 FCFA (2:1)
  - 100 points = 100 FCFA (1:1)

### Workflow d'Utilisation

**Lors d'une vente :**
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

**Exemple concret :**
- Client a 5000 points disponibles
- Taux de conversion : 1000 pts = 1000 FCFA
- Staff peut appliquer une remise de 5000 FCFA (5000 points)
- OU laisser le client accumuler de nouveaux points sur cet achat

