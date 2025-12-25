# API Endpoints - Documentation Complète

Ce document liste tous les endpoints API implémentés pour les nouvelles fonctionnalités.

## 📋 Table des Matières

1. [Stock Transfer Requests](#stock-transfer-requests)
2. [Loyalty Points Settings](#loyalty-points-settings)
3. [Expenses Management](#expenses-management)
4. [Financial Reports](#financial-reports)

---

## 🔄 Stock Transfer Requests

### Base URL: `/api/inventory/transfer-requests`

### GET `/api/inventory/transfer-requests`
Liste les demandes de transfert avec filtrage selon le rôle.

**Permissions:** `INVENTORY_VIEW`

**Query Parameters:**
- `page` (number, optional) - Numéro de page (défaut: 1)
- `limit` (number, optional) - Nombre d'éléments par page (défaut: 20)
- `status` (string, optional) - Filtrer par statut: `pending`, `approved`, `rejected`
- `warehouseId` (string, optional) - Filtrer par entrepôt
- `productId` (string, optional) - Filtrer par produit

**Filtrage selon rôle:**
- **Seller (Cashier):** Voit uniquement ses propres demandes
- **Manager:** Voit les demandes pour ses entrepôts assignés (source)
- **Admin:** Voit toutes les demandes

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "product": { "id": "uuid", "name": "Product Name", "sku": "SKU001" },
      "fromWarehouse": { "id": "uuid", "name": "Entrepôt Source", "code": "SRC", "type": "STOCKAGE" },
      "toWarehouse": { "id": "uuid", "name": "Entrepôt Dest", "code": "DST", "type": "BOUTIQUE" },
      "quantity": 10,
      "status": "pending",
      "requestedBy": { "id": "uuid", "fullName": "John Doe" },
      "approvedBy": null,
      "notes": "Notes optionnelles",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET `/api/inventory/transfer-requests/:id`
Récupère les détails d'une demande de transfert spécifique.

**Permissions:** `INVENTORY_VIEW`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "product": { "id": "uuid", "name": "Product Name", "sku": "SKU001" },
    "fromWarehouse": { "id": "uuid", "name": "Entrepôt Source", "code": "SRC", "type": "STOCKAGE" },
    "toWarehouse": { "id": "uuid", "name": "Entrepôt Dest", "code": "DST", "type": "BOUTIQUE" },
    "quantity": 10,
    "status": "pending",
    "requestedBy": { "id": "uuid", "fullName": "John Doe" },
    "approvedBy": null,
    "notes": "Notes optionnelles",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST `/api/inventory/transfer-requests`
Crée une nouvelle demande de transfert.

**Permissions:** `INVENTORY_MANAGE`

**Request Body:**
```json
{
  "productId": "uuid",
  "fromWarehouseId": "uuid",
  "toWarehouseId": "uuid",
  "quantity": 10,
  "notes": "Notes optionnelles"
}
```

**Validation:**
- Vérifie que le produit existe
- Vérifie que les entrepôts existent
- Vérifie que l'entrepôt source ≠ destination
- Vérifie que le stock source est suffisant

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "product": { "id": "uuid", "name": "Product Name", "sku": "SKU001" },
    "fromWarehouse": { "id": "uuid", "name": "Entrepôt Source", "code": "SRC" },
    "toWarehouse": { "id": "uuid", "name": "Entrepôt Dest", "code": "DST" },
    "quantity": 10,
    "status": "pending",
    "requestedBy": { "id": "uuid", "fullName": "John Doe" },
    "notes": "Notes optionnelles",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT `/api/inventory/transfer-requests/:id/approve`
Approuve ou rejette une demande de transfert.

**Permissions:** `INVENTORY_MANAGE`

**Restrictions:**
- Seuls les Managers assignés à l'entrepôt source ou les Admins peuvent approuver
- La demande doit être en statut `pending`

**Request Body:**
```json
{
  "status": "approved", // ou "rejected"
  "notes": "Notes optionnelles"
}
```

**Validation:**
- Vérifie que la demande existe et est en statut `pending`
- Vérifie les permissions (Manager assigné à l'entrepôt source OU Admin)
- Si approuvé: vérifie que le stock source est toujours suffisant
- Si approuvé: applique automatiquement le transfert via `transferStock`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "approved",
    "approvedBy": { "id": "uuid", "fullName": "Manager Name" },
    "notes": "Notes optionnelles",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## ⭐ Loyalty Points Settings

### Base URL: `/api/settings/loyalty-points`

### GET `/api/settings/loyalty-points`
Récupère les paramètres actuels des points de fidélité.

**Permissions:** Aucune (lecture publique pour les utilisateurs authentifiés)

**Response:**
```json
{
  "success": true,
  "data": {
    "attributionRate": 0.01,  // 1% (défaut)
    "conversionRate": 1.0     // 1 point = 1 FCFA (défaut)
  }
}
```

### PUT `/api/settings/loyalty-points`
Met à jour les paramètres des points de fidélité.

**Permissions:** `SETTINGS_MANAGE` (Admin uniquement)

**Request Body:**
```json
{
  "attributionRate": 0.02,  // Optionnel: 0 à 1 (0% à 100%)
  "conversionRate": 1.0      // Optionnel: > 0 (points → FCFA)
}
```

**Validation:**
- `attributionRate`: doit être entre 0 et 1 (0% à 100%)
- `conversionRate`: doit être positif

**Response:**
```json
{
  "success": true,
  "message": "Loyalty points settings updated successfully"
}
```

---

## 💰 Expenses Management

### Base URL: `/api/expenses`

### GET `/api/expenses`
Liste les dépenses avec filtrage.

**Permissions:** `EXPENSES_VIEW`

**Query Parameters:**
- `page` (number, optional) - Numéro de page
- `limit` (number, optional) - Nombre d'éléments par page
- `categoryId` (string, optional) - Filtrer par catégorie
- `warehouseId` (string, optional) - Filtrer par entrepôt
- `startDate` (string, optional) - Date de début (ISO format)
- `endDate` (string, optional) - Date de fin (ISO format)
- `search` (string, optional) - Recherche dans description/référence

**Filtrage selon rôle:**
- **Manager:** Voit uniquement les dépenses de ses entrepôts assignés
- **Admin:** Voit toutes les dépenses

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "amount": 5000,
      "description": "Achat de matériel",
      "reference": "REF001",
      "date": "2024-01-01T00:00:00Z",
      "category": {
        "id": "uuid",
        "name": "Matériel",
        "icon": "hammer-outline",
        "color": "#FF5733"
      },
      "warehouse": {
        "id": "uuid",
        "name": "Entrepôt Principal",
        "code": "MAIN"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET `/api/expenses/:id`
Récupère les détails d'une dépense spécifique.

**Permissions:** `EXPENSES_VIEW`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "amount": 5000,
    "description": "Achat de matériel",
    "reference": "REF001",
    "date": "2024-01-01T00:00:00Z",
    "category": { "id": "uuid", "name": "Matériel", "icon": "hammer-outline", "color": "#FF5733" },
    "warehouse": { "id": "uuid", "name": "Entrepôt Principal", "code": "MAIN" }
  }
}
```

### POST `/api/expenses`
Crée une nouvelle dépense.

**Permissions:** `EXPENSES_CREATE`

**Request Body:**
```json
{
  "categoryId": "uuid",
  "warehouseId": "uuid",  // Optionnel: utilise l'entrepôt de l'employé si non fourni
  "amount": 5000,
  "description": "Achat de matériel",
  "reference": "REF001",
  "date": "2024-01-01"  // Optionnel: utilise la date actuelle si non fourni
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "amount": 5000,
    "description": "Achat de matériel",
    "reference": "REF001",
    "date": "2024-01-01T00:00:00Z",
    "category": { "id": "uuid", "name": "Matériel" },
    "warehouse": { "id": "uuid", "name": "Entrepôt Principal" }
  }
}
```

### PUT `/api/expenses/:id`
Met à jour une dépense existante.

**Permissions:** `EXPENSES_MANAGE`

**Request Body:**
```json
{
  "categoryId": "uuid",      // Optionnel
  "amount": 6000,            // Optionnel
  "description": "Nouvelle description",  // Optionnel
  "reference": "REF002",     // Optionnel
  "date": "2024-01-02"       // Optionnel
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "amount": 6000,
    "description": "Nouvelle description",
    "reference": "REF002",
    "date": "2024-01-02T00:00:00Z",
    "category": { "id": "uuid", "name": "Matériel" },
    "warehouse": { "id": "uuid", "name": "Entrepôt Principal" }
  }
}
```

### DELETE `/api/expenses/:id`
Supprime une dépense.

**Permissions:** `EXPENSES_MANAGE`

**Response:**
```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

### GET `/api/expenses/summary`
Récupère un résumé des dépenses.

**Permissions:** `EXPENSES_VIEW`

**Query Parameters:**
- `warehouseId` (string, optional) - Filtrer par entrepôt
- `startDate` (string, optional) - Date de début
- `endDate` (string, optional) - Date de fin

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 50000,
    "count": 10,
    "byCategory": [
      {
        "categoryId": "uuid",
        "categoryName": "Matériel",
        "total": 30000,
        "count": 5
      }
    ]
  }
}
```

---

## 📊 Financial Reports

### Base URL: `/api/reports/financial`

### GET `/api/reports/financial`
Génère un rapport financier pour une période donnée.

**Permissions:** `EXPENSES_VIEW`

**Query Parameters:**
- `period` (string, required) - Période: `day`, `week`, `month`, `year`
- `startDate` (string, optional) - Date de début (ISO format, prioritaire sur `period`)
- `endDate` (string, optional) - Date de fin (ISO format, prioritaire sur `period`)
- `warehouseId` (string, optional) - Filtrer par entrepôt (Admin uniquement)

**Filtrage selon rôle:**
- **Manager:** Voit uniquement les rapports de ses entrepôts assignés
- **Admin:** Voit tous les entrepôts (peut filtrer par `warehouseId`)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z",
    "totalSales": 1000000,
    "totalExpenses": 200000,
    "netProfit": 800000,
    "transactionCount": 150,
    "byWarehouse": [
      {
        "warehouseId": "uuid",
        "warehouseName": "Entrepôt Principal",
        "warehouseCode": "MAIN",
        "totalSales": 600000,
        "totalExpenses": 120000,
        "netProfit": 480000,
        "transactionCount": 90
      },
      {
        "warehouseId": "uuid",
        "warehouseName": "Entrepôt Secondaire",
        "warehouseCode": "SEC",
        "totalSales": 400000,
        "totalExpenses": 80000,
        "netProfit": 320000,
        "transactionCount": 60
      }
    ]
  }
}
```

---

## 🔐 Permissions Requises

| Endpoint | Permission |
|----------|-----------|
| `GET /api/inventory/transfer-requests` | `INVENTORY_VIEW` |
| `GET /api/inventory/transfer-requests/:id` | `INVENTORY_VIEW` |
| `POST /api/inventory/transfer-requests` | `INVENTORY_MANAGE` |
| `PUT /api/inventory/transfer-requests/:id/approve` | `INVENTORY_MANAGE` |
| `GET /api/settings/loyalty-points` | Aucune (authentifié) |
| `PUT /api/settings/loyalty-points` | `SETTINGS_MANAGE` |
| `GET /api/expenses` | `EXPENSES_VIEW` |
| `GET /api/expenses/:id` | `EXPENSES_VIEW` |
| `POST /api/expenses` | `EXPENSES_CREATE` |
| `PUT /api/expenses/:id` | `EXPENSES_MANAGE` |
| `DELETE /api/expenses/:id` | `EXPENSES_MANAGE` |
| `GET /api/reports/financial` | `EXPENSES_VIEW` |

---

## 📝 Notes Importantes

1. **Authentification:** Tous les endpoints nécessitent une authentification (token JWT dans le header `Authorization: Bearer <token>`)

2. **Filtrage par rôle:** Les endpoints appliquent automatiquement le filtrage selon le rôle de l'utilisateur connecté

3. **Validation:** Tous les inputs sont validés avec Zod schemas

4. **Gestion d'erreurs:** Les erreurs suivent le format standard:
   ```json
   {
     "success": false,
     "message": "Error message",
     "errors": [] // Optionnel pour les erreurs de validation
   }
   ```

5. **Pagination:** Les endpoints de liste supportent la pagination avec `page` et `limit`

6. **Dates:** Toutes les dates sont au format ISO 8601 (UTC)

