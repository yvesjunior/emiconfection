# Architecture et Workflow de l'Application POS Mobile

## Vue d'ensemble

Cette application mobile est un système de point de vente (POS) pour la gestion des ventes, des stocks et du personnel dans un environnement multi-entrepôts.

**Important :** 
- Les clients (customers) n'ont **PAS** accès à cette application/platform
- Les clients sont gérés uniquement par le personnel (staff) lors des ventes
- Les clients sont définis **globalement** (non attachés à un entrepôt spécifique)
- Les clients sont partagés entre tous les entrepôts
- Un client peut faire des achats dans n'importe quel entrepôt Boutique

---

## Rôles Utilisateurs

### 1. Admin (Administrateur)

**Caractéristiques :**
- Accès à tous les entrepôts (Boutique et Stockage)
- Peut gérer tous les aspects du système
- **Seul rôle autorisé à supprimer définitivement des produits de la base de données**
- **Gestion complète du personnel** :
  - Peut créer, modifier et supprimer tous les employés (Managers et staff en dessous)
  - Peut gérer les Managers
  - Peut gérer le staff (Sellers) attaché à tous les entrepôts
  - Peut créer, modifier et supprimer des rôles et permissions
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
- **Peut gérer le staff attaché à ses entrepôts** :
  - Peut créer, modifier et désactiver les employés de type Seller assignés à ses entrepôts
  - Peut voir les employés (Sellers) de ses entrepôts assignés
  - Peut réinitialiser les PIN des employés de ses entrepôts
- **Ne peut pas gérer les Managers** (réservé à Admin)
- **Ne peut pas créer/modifier des rôles ou permissions** (réservé à Admin)

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
1. L'utilisateur entre son numéro de téléphone et son PIN
2. Sélection du mode d'utilisation :
   - **Mode Vente (Sell)** : Pour les opérations de vente
   - **Mode Gestion (Manage)** : Pour les opérations de gestion
3. Sélection de l'entrepôt :
   - **Mode Vente** : Seuls les entrepôts de type Boutique sont disponibles
   - **Mode Gestion** : Tous les entrepôts assignés à l'utilisateur sont disponibles
4. Vérification des permissions selon le rôle

**Règles de sélection d'entrepôt :**
- **Mode Vente** : Seuls les entrepôts de type `BOUTIQUE` sont disponibles (filtrage automatique)
- **Mode Gestion** : Tous les entrepôts actifs (BOUTIQUE et STOCKAGE) sont disponibles
- **Seller** : Seuls les entrepôts Boutique assignés sont disponibles
- **Manager** : Tous les entrepôts assignés (Boutique et Stockage) sont disponibles
- **Admin** : Tous les entrepôts actifs sont disponibles

**Règles de validation au login :**
- Si un employé est assigné à un entrepôt `STOCKAGE` et essaie de se connecter en mode Vente, une alerte bloque la connexion avec le message : "Vous êtes assigné à un entrepôt de type Stockage. Pour effectuer des ventes, veuillez sélectionner le mode 'Gestion' ou vous connecter à un entrepôt de type Boutique."
- Si aucun entrepôt compatible n'est disponible pour le mode sélectionné, une alerte informe l'utilisateur

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

### Suppression
- **Soft Delete (Désactivation) :** Manager, Admin
  - Le produit est marqué comme inactif
  - Reste dans la base de données pour l'historique
  - N'apparaît plus dans les listes de produits actifs

- **Hard Delete (Suppression définitive) :** **Admin uniquement**
  - Suppression complète de la base de données
  - **Restriction :** Impossible si le produit a été utilisé dans des ventes ou commandes d'achat
  - Supprime également les catégories associées et les stocks

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
- Téléphone (unique)
- Rôle (Admin, Manager, ou Seller)
- Entrepôt (requis sauf pour Admin)
- Mot de passe
- PIN (optionnel mais recommandé)

**Règles de validation :**
- Un entrepôt est **requis** pour les rôles Manager et Seller
- Un entrepôt est **optionnel** pour le rôle Admin
- Seller ne peut être assigné qu'à des entrepôts de type Boutique
- Manager peut être assigné à des entrepôts Boutique ou Stockage
- **Manager ne peut créer que des Sellers** assignés à ses entrepôts
- **Admin peut créer des Managers et des Sellers** sans restriction

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
  - Mode Vente : Seulement entrepôts Boutique
  - Mode Gestion : Tous les entrepôts assignés
- Changement en temps réel avec rafraîchissement des données

**Restrictions implémentées :**
- En mode Vente, tentative de changement vers un entrepôt `STOCKAGE` → Alerte bloquante "Changement impossible"
- En mode Gestion, changement vers n'importe quel entrepôt autorisé
- Filtrage automatique des entrepôts disponibles selon le mode actuel

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
8. **Système de points de fidélité** :
   - Les points de fidélité sont attribués au client après la vente
   - Le nombre de points attribués est basé sur le montant de la vente (taux défini par Admin)
   - Exemple : Si le taux est de 1%, une vente de 10 000 FCFA = 100 points
9. **Utilisation des points pour remise** :
   - Le staff est alerté lors de la vente si le client a des points disponibles
   - Le staff peut choisir d'appliquer une remise basée sur les points
   - Conversion monétaire : Les points sont convertis en équivalent monétaire (ex: 1000 points = 1000 FCFA)
   - Le taux de conversion est configurable par Admin dans les paramètres
   - Le staff peut choisir d'accumuler les points OU d'utiliser les points pour une remise

**Workflow de vente :**
- Produit dans Stockage → Transfert vers Boutique → Vente possible
- Produit déjà dans Boutique → Vente directe possible

**Vérifications implémentées lors de l'ajout au panier :**
1. Vérification du type d'entrepôt (doit être BOUTIQUE)
2. Vérification du stock disponible dans l'entrepôt connecté
3. Vérification de la quantité déjà dans le panier
4. Alerte de stock faible si ≤ 5 unités restantes après ajout

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
- **Indicateurs visuels** :
  - "Rupture" si stock = 0
  - "X dispo" avec icône warning si stock ≤ 5
  - "Dans panier" si tout le stock est dans le panier
- **Bouton "Voir autres entrepôts"** : Visible si le produit a plusieurs entrepôts avec stock
- **Fallback** : Si pas d'inventaire par entrepôt, utilise le stock global du produit

### Transferts de Stock

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

**Approbation (à implémenter) :**
1. **Demande de transfert** : Seller/Manager peut demander un transfert quand le stock est faible
2. **Approbation requise** : Seul un Manager assigné à l'entrepôt source peut approuver
3. **Condition d'approbation** : Le Manager doit être assigné à l'entrepôt qui a le stock disponible
4. **Transfert direct** : Un Manager assigné à plusieurs entrepôts peut transférer directement entre ses entrepôts (sans approbation)
5. **Admin** : Peut approuver n'importe quel transfert (accès global)

**Exemples implémentés :**
- Boutique A a 0 stock, Stockage B a 10 unités → Bouton "Demander un transfert" visible
- Transfert de 10 unités de Stockage A vers Boutique B → Stock source -10, destination +10, 2 mouvements créés
- Tentative de transfert avec stock insuffisant → Erreur 400 "Insufficient stock"
- Tentative de transfert vers le même entrepôt → Erreur 400 "Source and destination must be different"

### Produits
1. Un produit peut être désactivé (soft delete) par Manager ou Admin
2. **Seul Admin peut supprimer définitivement un produit** (hard delete)
3. **Vérifications avant suppression** :
   - Le produit ne doit pas avoir été utilisé dans des ventes (`saleItems`)
   - Le produit ne doit pas avoir été utilisé dans des commandes d'achat (`purchaseOrderItems`)
   - Si utilisé : Erreur `400 Bad Request` avec message explicite : "Cannot delete product that has been used in X sale(s). The product must remain for historical records."
4. **Suppression en transaction** : Si les vérifications passent, suppression atomique du produit et de tous les mouvements de stock associés
5. Les produits inactifs n'apparaissent pas dans les listes de vente

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
  - Suppression du produit (cascade sur ProductCategory et Inventory)
    ↓
Succès ✅
```

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

## Points d'Attention pour le Développement

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

## Configuration Système (Admin)

### Paramètres de Points de Fidélité

**Taux d'attribution :**
- Défini par Admin dans les paramètres
- Détermine combien de points sont attribués par montant d'achat
- Exemples :
  - 1% du montant : Achat de 10 000 FCFA = 100 points
  - 10 points par 1000 FCFA : Achat de 10 000 FCFA = 100 points
  - Taux fixe : X points par achat quel que soit le montant

**Taux de conversion :**
- Défini par Admin dans les paramètres
- Détermine l'équivalence points → monnaie pour les remises
- Exemples :
  - 1000 points = 1000 FCFA (1:1)
  - 1000 points = 500 FCFA (2:1)
  - 100 points = 100 FCFA (1:1)

**Workflow de configuration :**
1. Admin accède aux paramètres système
2. Configure le taux d'attribution des points
3. Configure le taux de conversion points → monnaie
4. Les paramètres s'appliquent à toutes les ventes futures

---

## Configuration Système (Admin)

### Paramètres de Points de Fidélité

**Taux d'attribution :**
- Défini par Admin dans les paramètres
- Détermine combien de points sont attribués par montant d'achat
- Exemples :
  - 1% du montant : Achat de 10 000 FCFA = 100 points
  - 10 points par 1000 FCFA : Achat de 10 000 FCFA = 100 points
  - Taux fixe : X points par achat quel que soit le montant

**Taux de conversion :**
- Défini par Admin dans les paramètres
- Détermine l'équivalence points → monnaie pour les remises
- Exemples :
  - 1000 points = 1000 FCFA (1:1)
  - 1000 points = 500 FCFA (2:1)
  - 100 points = 100 FCFA (1:1)

**Workflow de configuration :**
1. Admin accède aux paramètres système
2. Configure le taux d'attribution des points
3. Configure le taux de conversion points → monnaie
4. Les paramètres s'appliquent à toutes les ventes futures

**Workflow d'utilisation lors d'une vente :**
1. Client sélectionné → Système affiche les points disponibles
2. Alerte au staff : "Client a X points disponibles"
3. Options proposées :
   - Utiliser points pour remise (X points = Y FCFA selon taux de conversion)
   - Accumuler nouveaux points (points ajoutés après la vente selon taux d'attribution)
4. Staff choisit l'option
5. Si utilisation : Remise appliquée, points déduits
6. Si accumulation : Points ajoutés après la vente

---

## Évolutions Futures Possibles

- Système de notifications pour les stocks faibles
- Rapports avancés et analytics
- Intégration avec systèmes externes
- Mode hors ligne avec synchronisation
- Gestion des promotions et remises
- Système de fidélité clients (points globaux, remises) ✅ **Implémenté**

---

**Dernière mise à jour :** 2024-12-24
**Version :** 1.0

