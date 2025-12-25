# Règles et Scénarios Implémentés dans le Code

Ce document liste les règles métier et scénarios qui sont **déjà implémentés** dans le code (mobile et API). Ces règles doivent être validées avant d'être intégrées dans la documentation officielle.

---

## 1. Filtrage des Entrepôts au Login

### Règle Implémentée
- **Mode Vente** : Seuls les entrepôts de type `BOUTIQUE` sont disponibles pour la sélection
- **Mode Gestion** : Tous les entrepôts actifs (BOUTIQUE et STOCKAGE) sont disponibles

### Code de Référence
- **Fichier** : `app/login.tsx`
- **Lignes** : 123-125, 132-141
- **Logique** :
  ```typescript
  const availableWarehouses = selectedMode === 'manage' 
    ? allWarehouses // Tous les entrepôts en mode gestion
    : allWarehouses.filter((w: Warehouse) => w.type === 'BOUTIQUE' || !w.type); // Seulement BOUTIQUE en mode vente
  ```

### Scénario Implémenté
- Si un employé est assigné à un entrepôt `STOCKAGE` et essaie de se connecter en mode Vente, une alerte est affichée :
  ```
  "Vous êtes assigné à un entrepôt de type Stockage. Pour effectuer des ventes, 
  veuillez sélectionner le mode 'Gestion' ou vous connecter à un entrepôt de type Boutique."
  ```

---

## 2. Vérification du Type d'Entrepôt Avant les Ventes (Mobile)

### Règle Implémentée
- Avant d'ajouter un produit au panier, le système vérifie que l'entrepôt connecté est de type `BOUTIQUE`
- Si l'entrepôt est de type `STOCKAGE`, la vente est bloquée avec une alerte

### Code de Référence
- **Fichier** : `app/(app)/index.tsx`
- **Lignes** : 133-142
- **Logique** :
  ```typescript
  if (!isBoutiqueWarehouse) {
    Alert.alert(
      'Vente impossible',
      `Vous êtes connecté à l'entrepôt "${currentWarehouse?.name || 'Stockage'}". 
      Les ventes ne peuvent être effectuées que depuis un entrepôt de type Boutique.`
    );
    return;
  }
  ```

### Scénario Implémenté
- Un utilisateur connecté à un entrepôt STOCKAGE ne peut pas ajouter de produits au panier
- L'alerte suggère de se connecter à un entrepôt Boutique

---

## 3. Vérification API lors de la Création d'une Vente

### Règle Implémentée
- L'API vérifie que l'entrepôt utilisé pour la vente est de type `BOUTIQUE`
- Si ce n'est pas le cas, une erreur `400 Bad Request` est renvoyée

### Code de Référence
- **Fichier** : `apps/api/src/modules/sales/sales.service.ts`
- **Lignes** : 141-143
- **Logique** :
  ```typescript
  if (warehouse.type !== 'BOUTIQUE') {
    throw ApiError.badRequest('Sales can only be made from Boutique warehouses');
  }
  ```

### Scénario Implémenté
- Même si le client mobile contourne la vérification, l'API bloque la création de la vente
- Message d'erreur explicite : "Sales can only be made from Boutique warehouses"

---

## 4. Changement d'Entrepôt avec Restriction selon le Mode

### Règle Implémentée
- En mode Vente, l'utilisateur ne peut pas changer vers un entrepôt de type `STOCKAGE`
- En mode Gestion, tous les entrepôts sont disponibles

### Code de Référence
- **Fichier** : `app/(app)/more.tsx`
- **Lignes** : 131-139, 156-163
- **Logique** :
  ```typescript
  // Filtrage des entrepôts disponibles
  const availableWarehouses = allWarehouses.filter((w: Warehouse) => {
    if (!w.isActive) return false;
    if (mode === 'sell') {
      return w.type === 'BOUTIQUE' || !w.type; // Seulement BOUTIQUE en mode vente
    }
    return true; // Tous en mode gestion
  });

  // Vérification lors de la confirmation
  if (mode === 'sell' && selectedWarehouse.type === 'STOCKAGE') {
    Alert.alert('Changement impossible', 
      'Vous ne pouvez pas vous connecter à un entrepôt de type Stockage en mode Vente.');
    return;
  }
  ```

### Scénario Implémenté
- Tentative de changement vers STOCKAGE en mode Vente → Alerte bloquante
- Changement vers STOCKAGE en mode Gestion → Autorisé

---

## 5. Gestion du Stock par Entrepôt

### Règles Implémentées
- **Modification du stock** : Uniquement pour l'entrepôt actuellement connecté
- **Visualisation** : Tous les entrepôts sont visibles, mais les autres sont en "Lecture seule"
- **Indicateurs visuels** : Badge "Connecté" pour l'entrepôt actuel, badge "Lecture seule" pour les autres

### Code de Référence
- **Fichier** : `app/(app)/products-manage.tsx`
- **Lignes** : 788-893
- **Logique** :
  ```typescript
  const isCurrentWarehouse = currentWarehouse?.id === item.warehouse.id;
  const canEdit = hasPermission('inventory:adjust') && isCurrentWarehouse;
  
  // Affichage conditionnel
  {canEdit ? (
    <TouchableOpacity onPress={() => setEditingWarehouseStock(...)}>
      <Ionicons name="pencil" />
    </TouchableOpacity>
  ) : !isCurrentWarehouse && (
    <View style={styles.readOnlyBadge}>
      <Ionicons name="eye-outline" />
      <Text>Lecture seule</Text>
    </View>
  )}
  ```

### Scénarios Implémentés
- **Scénario 1** : Utilisateur connecté à Boutique A → Peut modifier le stock de Boutique A uniquement
- **Scénario 2** : Utilisateur connecté à Boutique A → Voit le stock de Stockage B en lecture seule
- **Scénario 3** : Utilisateur sans permission `inventory:adjust` → Ne peut modifier aucun stock

---

## 6. Suppression de Produits (Hard Delete)

### Règles Implémentées
- **Seul un Admin** peut supprimer un produit de la base de données
- **Vérifications préalables** :
  - Le produit ne doit pas avoir été utilisé dans des ventes (`saleItems`)
  - Le produit ne doit pas avoir été utilisé dans des commandes d'achat (`purchaseOrderItems`)
- **Si utilisé** : Erreur `400 Bad Request` avec message explicite expliquant pourquoi la suppression n'est pas possible
- **Si OK** : Suppression en transaction (hard delete) avec suppression des mouvements de stock associés

### Code de Référence
- **Fichier** : `apps/api/src/modules/products/products.service.ts`
- **Lignes** : 359-413
- **Logique** :
  ```typescript
  // Vérification du rôle
  if (employeeRoleName !== 'admin') {
    throw ApiError.forbidden('Only administrators can delete products from the database');
  }

  // Vérification des ventes
  const saleItemsCount = await prisma.saleItem.count({
    where: { productId: id },
  });
  if (saleItemsCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete product that has been used in ${saleItemsCount} sale(s). 
      The product must remain for historical records.`
    );
  }

  // Vérification des commandes d'achat
  const purchaseOrderItemsCount = await prisma.purchaseOrderItem.count({
    where: { productId: id },
  });
  if (purchaseOrderItemsCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete product that has been used in ${purchaseOrderItemsCount} purchase order(s). 
      The product must remain for historical records.`
    );
  }

  // Hard delete en transaction
  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.deleteMany({ where: { productId: id } });
    await tx.product.delete({ where: { id } });
  });
  ```

### Scénarios Implémentés
- **Scénario 1** : Admin essaie de supprimer un produit jamais vendu → Suppression réussie
- **Scénario 2** : Admin essaie de supprimer un produit utilisé dans 5 ventes → Erreur 400 avec message explicite
- **Scénario 3** : Manager essaie de supprimer un produit → Erreur 403 "Only administrators can delete"
- **Scénario 4** : Admin supprime un produit → Tous les mouvements de stock associés sont supprimés

---

## 7. Demande de Transfert depuis Stockage

### Règles Implémentées
- **Bouton "Demander un transfert"** apparaît uniquement si :
  - Le produit est dans une Boutique (`isBoutique`)
  - Le stock est à 0 (`qty === 0`)
  - Il existe un entrepôt Stockage avec du stock disponible
- **Recherche automatique** : Le système cherche automatiquement un entrepôt Stockage avec du stock disponible
- **Si trouvé** : Ouvre la modale de transfert avec l'entrepôt source pré-sélectionné
- **Si non trouvé** : Affiche une alerte "Aucun entrepôt Stockage n'a de stock disponible"

### Code de Référence
- **Fichier** : `app/(app)/products-manage.tsx`
- **Lignes** : 897-917
- **Logique** :
  ```typescript
  {isBoutique && qty === 0 && !editingWarehouseStock && (
    <TouchableOpacity onPress={() => {
      // Recherche d'un entrepôt Stockage avec stock
      const stockageInv = productData?.inventory?.find((inv: InventoryItem) => 
        inv.warehouse.type === 'STOCKAGE' && Number(inv.quantity) > 0
      );
      if (stockageInv) {
        setTransferFromWarehouse(stockageInv.warehouse.id);
        setShowTransferModal(true);
      } else {
        Alert.alert('Aucun stock disponible', 
          'Aucun entrepôt Stockage n\'a de stock disponible pour ce produit');
      }
    }}>
      <Text>Demander un transfert</Text>
    </TouchableOpacity>
  )}
  ```

### Scénarios Implémentés
- **Scénario 1** : Boutique A a 0 stock, Stockage B a 10 unités → Bouton "Demander un transfert" visible
- **Scénario 2** : Boutique A a 0 stock, aucun Stockage n'a de stock → Alerte "Aucun stock disponible"
- **Scénario 3** : Boutique A a 5 unités → Bouton "Demander un transfert" non visible

---

## 8. Transfert de Stock (API)

### Règles Implémentées
- **Vérification** : L'entrepôt source et destination doivent être différents
- **Vérification du stock** : Le stock source doit être suffisant
- **Transaction atomique** :
  - Diminution du stock source
  - Augmentation du stock destination (création si n'existe pas)
  - Création de deux mouvements de stock (sortie source, entrée destination)
- **Notes** : Les notes du transfert sont enregistrées dans les mouvements

### Code de Référence
- **Fichier** : `apps/api/src/modules/inventory/inventory.service.ts`
- **Lignes** : 194-273
- **Logique** :
  ```typescript
  // Vérification des entrepôts différents
  if (input.fromWarehouseId === input.toWarehouseId) {
    throw ApiError.badRequest('Source and destination warehouses must be different');
  }

  // Vérification du stock source
  if (!sourceInventory || Number(sourceInventory.quantity) < input.quantity) {
    throw ApiError.badRequest('Insufficient stock in source warehouse');
  }

  // Transaction atomique
  await prisma.$transaction(async (tx) => {
    // Diminution source
    await tx.inventory.update({
      where: { id: sourceInventory.id },
      data: { quantity: { decrement: input.quantity } },
    });

    // Augmentation destination (upsert)
    await tx.inventory.upsert({
      where: { productId_warehouseId: { ... } },
      update: { quantity: { increment: input.quantity } },
      create: { ... },
    });

    // Création des mouvements
    await tx.stockMovement.createMany({
      data: [
        { type: TRANSFER, quantity: -input.quantity, ... }, // Source
        { type: TRANSFER, quantity: input.quantity, ... },   // Destination
      ],
    });
  });
  ```

### Scénarios Implémentés
- **Scénario 1** : Transfert de 10 unités de Stockage A vers Boutique B → Stock source -10, destination +10, 2 mouvements créés
- **Scénario 2** : Transfert vers un entrepôt sans stock du produit → Création automatique de l'inventaire
- **Scénario 3** : Tentative de transfert avec stock insuffisant → Erreur 400 "Insufficient stock"
- **Scénario 4** : Tentative de transfert vers le même entrepôt → Erreur 400 "Source and destination must be different"

---

## 9. Assignation d'Entrepôt aux Employés

### Règles Implémentées
- **Admin** : N'a pas besoin d'entrepôt assigné (`warehouseId` optionnel)
- **Autres rôles (Seller, Manager)** : Doivent avoir un `warehouseId` assigné
- **Validation** : Si un rôle non-admin est créé/modifié sans `warehouseId`, erreur `400 Bad Request`

### Code de Référence
- **Fichier** : `apps/api/src/modules/employees/employees.service.ts`
- **Lignes** : 94-106, 150-165
- **Logique** :
  ```typescript
  // Lors de la création
  const role = await prisma.role.findUnique({ where: { id: input.roleId } });
  if (role.name !== 'admin' && !input.warehouseId) {
    throw ApiError.badRequest('Warehouse is required for non-admin roles');
  }

  // Lors de la mise à jour
  if (input.roleId) {
    const role = await prisma.role.findUnique({ where: { id: input.roleId } });
    if (role.name !== 'admin' && !input.warehouseId) {
      throw ApiError.badRequest('Warehouse is required for non-admin roles');
    }
  }
  ```

### Scénarios Implémentés
- **Scénario 1** : Création d'un Seller sans entrepôt → Erreur 400 "Warehouse is required"
- **Scénario 2** : Création d'un Admin sans entrepôt → Succès
- **Scénario 3** : Modification d'un Manager pour retirer l'entrepôt → Erreur 400 si le rôle n'est pas admin

---

## 10. Gestion du Stock Disponible dans le Panier

### Règles Implémentées
- **Vérification du stock** : Avant d'ajouter un produit au panier, vérification du stock disponible dans l'entrepôt Boutique connecté
- **Stock insuffisant** : Si le stock est à 0, alerte avec option "Voir autres entrepôts"
- **Stock déjà dans le panier** : Vérification que la quantité disponible (stock - quantité dans panier) est suffisante
- **Alerte de stock faible** : Haptic feedback si le stock restant après ajout est ≤ 5

### Code de Référence
- **Fichier** : `app/(app)/index.tsx`
- **Lignes** : 144-193
- **Logique** :
  ```typescript
  const currentStock = getStock(product); // Stock dans l'entrepôt connecté
  const cartQty = getCartQuantity(product.id);
  const availableQty = currentStock - cartQty;

  if (currentStock <= 0) {
    Alert.alert('Rupture de stock', `${product.name} est en rupture de stock dans votre boutique.`, [
      { text: 'Voir autres entrepôts', onPress: () => setShowStockModal(true) },
      { text: 'OK', style: 'cancel' }
    ]);
    return;
  }

  if (availableQty <= 0) {
    Alert.alert('Stock insuffisant', 
      `Vous avez déjà ajouté tout le stock disponible (${currentStock}) au panier.`);
    return;
  }

  // Alerte de stock faible
  if (availableQty <= 5 && availableQty > 1) {
    setTimeout(() => hapticImpact(Haptics.ImpactFeedbackStyle.Light), 100);
  }
  ```

### Scénarios Implémentés
- **Scénario 1** : Stock = 0 → Alerte "Rupture de stock" avec option "Voir autres entrepôts"
- **Scénario 2** : Stock = 10, déjà 10 dans le panier → Alerte "Stock insuffisant"
- **Scénario 3** : Stock = 10, 6 dans le panier, ajout de 1 → Haptic feedback (stock faible)

---

## 11. Affichage du Stock par Entrepôt dans la Liste des Produits

### Règles Implémentées
- **Stock prioritaire** : Le stock affiché est celui de l'entrepôt Boutique connecté
- **Indicateurs visuels** :
  - "Rupture" si stock = 0
  - "X dispo" avec icône warning si stock ≤ 5
  - "Dans panier" si tout le stock est dans le panier
- **Bouton "Voir autres entrepôts"** : Visible si le produit a plusieurs entrepôts avec stock

### Code de Référence
- **Fichier** : `app/(app)/index.tsx`
- **Lignes** : 237-251, 267-362
- **Logique** :
  ```typescript
  const getStock = (product: Product) => {
    if (!currentWarehouse) return 0;
    
    // Priorité : inventaire par entrepôt
    if (product.inventory && product.inventory.length > 0) {
      const warehouseInventory = product.inventory.find(
        (inv) => inv.warehouse.id === currentWarehouse.id
      );
      return warehouseInventory ? Number(warehouseInventory.quantity || 0) : 0;
    }
    
    // Fallback : stock global
    return product.stock || 0;
  };
  ```

### Scénarios Implémentés
- **Scénario 1** : Produit avec stock dans Boutique A (connecté) → Affiche le stock de Boutique A
- **Scénario 2** : Produit sans stock dans Boutique A mais avec stock dans Stockage B → Affiche "Rupture" avec bouton "Voir autres entrepôts"
- **Scénario 3** : Produit avec stock ≤ 5 → Affiche quantité avec icône warning

---

## Notes pour Validation

1. **Règles manquantes** : Certaines règles documentées dans `ARCHITECTURE.md` ne sont pas encore implémentées :
   - Système d'approbation des transferts (demande → approbation Manager)
   - Transfert direct pour Managers multi-entrepôts (sans approbation)
   - Filtrage des entrepôts par assignation (actuellement tous les entrepôts actifs sont montrés)

2. **Règles partiellement implémentées** :
   - Le transfert de stock existe mais sans workflow d'approbation
   - La gestion du stock par entrepôt existe mais sans restriction par assignation

3. **À vérifier** :
   - Les règles de permissions pour les transferts
   - Les règles de visualisation des stocks selon les assignations d'entrepôts
   - Les règles de modification du stock selon les rôles (Seller, Manager, Admin)

---

**Date de création** : 2025-01-XX
**Dernière mise à jour** : 2025-01-XX

