# Guide de Déploiement API

Ce document décrit les étapes pour déployer l'API avec toutes les nouvelles fonctionnalités.

## 📋 Prérequis

- Node.js 18+ installé
- PostgreSQL 14+ installé et configuré
- Docker et Docker Compose (optionnel, pour le déploiement containerisé)
- Accès à la base de données PostgreSQL

## 🔧 Configuration

### 1. Variables d'Environnement

Créer un fichier `.env` à la racine du dossier `api` :

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pos_system?schema=public

# Server
PORT=3001
NODE_ENV=production

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:8081

# Default Tax Rate
DEFAULT_TAX_RATE=18
```

### 2. Installation des Dépendances

```bash
cd src/system-pos/apps/api
npm install
```

## 🗄️ Base de Données

### 1. Appliquer les Migrations

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy

# Ou en mode développement
npx prisma migrate dev
```

### 2. Vérifier les Migrations

```bash
npx prisma migrate status
```

Vous devriez voir :
- ✅ `20251224162705_add_warehouse_type` (appliquée)
- ✅ `20251225000000_add_stock_transfer_requests_and_loyalty_points` (appliquée)

### 3. Vérifier les Tables

```bash
# Se connecter à PostgreSQL
psql -U postgres -d pos_system

# Vérifier les tables
\dt

# Vérifier la table stock_transfer_requests
\d stock_transfer_requests

# Vérifier la colonne loyalty_points_used dans sales
\d sales
```

## 🏗️ Build

### Compilation TypeScript

```bash
npm run build
```

Cela génère les fichiers JavaScript dans le dossier `dist/`.

### Vérification du Build

```bash
# Vérifier que les fichiers sont générés
ls -la dist/

# Tester le démarrage
node dist/index.js
```

## 🚀 Déploiement

### Option 1: Déploiement Direct

```bash
# Build
npm run build

# Démarrer le serveur
npm start
```

Le serveur démarre sur `http://localhost:3001`

### Option 2: Déploiement avec PM2

```bash
# Installer PM2 globalement
npm install -g pm2

# Build
npm run build

# Démarrer avec PM2
pm2 start dist/index.js --name pos-api

# Vérifier le statut
pm2 status

# Voir les logs
pm2 logs pos-api
```

### Option 3: Déploiement Docker

#### Dockerfile

Le Dockerfile est déjà configuré. Pour construire l'image :

```bash
docker build -t pos-api:latest .
```

#### Docker Compose

Créer un fichier `docker-compose.yml` :

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pos_system?schema=public
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - NODE_ENV=production
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=pos_system
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

Démarrer les services :

```bash
docker-compose up -d
```

## ✅ Vérification du Déploiement

### 1. Health Check

```bash
curl http://localhost:3001/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. API Info

```bash
curl http://localhost:3001/api
```

Réponse attendue :
```json
{
  "name": "POS System API",
  "version": "1.0.0",
  "status": "ok",
  "endpoints": [
    "/api/auth",
    "/api/employees",
    "/api/roles",
    "/api/categories",
    "/api/products",
    "/api/warehouses",
    "/api/inventory",
    "/api/customers",
    "/api/shifts",
    "/api/sales",
    "/api/settings",
    "/api/expenses",
    "/api/reports"
  ]
}
```

### 3. Test des Nouveaux Endpoints

#### Stock Transfer Requests

```bash
# Liste des demandes (nécessite authentification)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/inventory/transfer-requests
```

#### Loyalty Points Settings

```bash
# Récupérer les paramètres
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/settings/loyalty-points

# Mettre à jour (Admin uniquement)
curl -X PUT \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"attributionRate": 0.02, "conversionRate": 1.0}' \
  http://localhost:3001/api/settings/loyalty-points
```

#### Expenses

```bash
# Liste des dépenses
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/expenses
```

#### Financial Reports

```bash
# Rapport financier
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/reports/financial?period=month"
```

## 🔍 Monitoring

### Logs

Les logs sont affichés dans la console. Pour la production, configurez un système de logging centralisé (ex: Winston, Pino).

### Erreurs

Toutes les erreurs sont capturées et formatées via le middleware `errorHandler`.

### Performance

Pour le monitoring de performance, considérez :
- New Relic
- Datadog
- Prometheus + Grafana

## 🔐 Sécurité

### Checklist de Sécurité

- [ ] Changer `JWT_SECRET` et `JWT_REFRESH_SECRET` en production
- [ ] Configurer HTTPS (via reverse proxy comme Nginx)
- [ ] Limiter les origines CORS
- [ ] Activer le rate limiting
- [ ] Configurer les firewall rules
- [ ] Utiliser des variables d'environnement sécurisées
- [ ] Activer les logs d'audit
- [ ] Configurer les backups de base de données

### Reverse Proxy (Nginx)

Exemple de configuration Nginx :

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Endpoints Disponibles

Tous les endpoints sont documentés dans `API_ENDPOINTS.md`.

### Nouveaux Endpoints

- `GET /api/inventory/transfer-requests` - Liste des demandes de transfert
- `GET /api/inventory/transfer-requests/:id` - Détails d'une demande
- `POST /api/inventory/transfer-requests` - Créer une demande
- `PUT /api/inventory/transfer-requests/:id/approve` - Approuver/rejeter
- `GET /api/settings/loyalty-points` - Paramètres de points de fidélité
- `PUT /api/settings/loyalty-points` - Mettre à jour les paramètres
- `GET /api/expenses` - Liste des dépenses
- `POST /api/expenses` - Créer une dépense
- `PUT /api/expenses/:id` - Modifier une dépense
- `DELETE /api/expenses/:id` - Supprimer une dépense
- `GET /api/reports/financial` - Rapport financier

## 🐛 Dépannage

### Problèmes Courants

1. **Erreur de connexion à la base de données**
   - Vérifier `DATABASE_URL`
   - Vérifier que PostgreSQL est démarré
   - Vérifier les permissions de l'utilisateur

2. **Erreurs de migration**
   - Vérifier que toutes les migrations sont appliquées
   - Vérifier la version de Prisma
   - Exécuter `npx prisma migrate reset` (⚠️ supprime les données)

3. **Erreurs de compilation TypeScript**
   - Vérifier que toutes les dépendances sont installées
   - Exécuter `npm run build` pour voir les erreurs détaillées

4. **Erreurs d'authentification**
   - Vérifier que `JWT_SECRET` est configuré
   - Vérifier que les tokens sont valides
   - Vérifier les permissions de l'utilisateur

## 📝 Notes

- L'API écoute sur le port `3001` par défaut
- Tous les endpoints nécessitent une authentification (sauf `/health` et `/api`)
- Les permissions sont vérifiées pour chaque endpoint
- Les filtres par rôle sont appliqués automatiquement

