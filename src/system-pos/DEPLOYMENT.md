# 🚀 Guide de Déploiement Complet - POS System

Ce guide décrit les étapes complètes pour déployer l'API, l'Admin Panel et l'application mobile.

## 📋 Table des Matières

1. [Déploiement Rapide](#déploiement-rapide)
2. [Prérequis](#prérequis)
3. [Déploiement API](#déploiement-api)
4. [Déploiement Admin Panel](#déploiement-admin-panel)
5. [Déploiement Mobile](#déploiement-mobile)
6. [Checklist de Déploiement](#checklist-de-déploiement)
7. [Vérification Post-Déploiement](#vérification-post-déploiement)
8. [Sécurité Production](#sécurité-production)
9. [Monitoring](#monitoring)
10. [Mises à Jour](#mises-à-jour)
11. [Dépannage](#dépannage)

---

## 🔧 Troubleshooting Login Issues

### Problem: Login fails with "connexion echoue" (connection failed)

#### ✅ Admin User Status

The admin user **exists and is correctly configured** in the database:
- **Phone**: `0611`
- **PIN**: `1234`
- **Status**: Active ✅
- **PIN Verification**: ✅ MATCH

#### 🔍 Common Causes

**1. API Server Not Running**

The most common issue is that the API server is not running.

**Check if API is running:**
```bash
# Check if port 3001 is in use
lsof -i :3001

# Or check Docker containers
docker ps | grep pos_api
```

**Start the API server:**
```bash
cd src/system-pos/apps/api
npm run dev
```

The API should be accessible at: `http://localhost:3001`

**2. Wrong API URL in Mobile App**

The mobile app is configured to use: `http://192.168.2.15:3001/api`

**Check your local IP address:**
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or
ipconfig getifaddr en0  # macOS
```

**Update the API URL** in `src/system-pos/apps/mobile/src/lib/api.ts`:
```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://YOUR_LOCAL_IP:3001/api';
```

Or set environment variable:
```bash
export EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3001/api
```

**3. Network Connectivity Issues**

- Ensure your mobile device and computer are on the **same WiFi network**
- Check firewall settings (port 3001 should be accessible)
- Try accessing `http://YOUR_IP:3001/api/health` from your mobile browser

**4. Database Connection Issues**

**Verify database is running:**
```bash
docker ps | grep pos_postgres
```

**Check database connection:**
```bash
cd src/system-pos/apps/api
npx tsx scripts/check-admin-login.ts
```

**5. Admin User Not Created**

If admin user doesn't exist, create it:

```bash
cd src/system-pos/apps/api
npm run db:seed
```

Or manually check/fix:
```bash
npx tsx scripts/check-admin-login.ts
```

#### 🧪 Testing Steps

1. **Test database directly:**
   ```bash
   cd src/system-pos/apps/api
   npx tsx scripts/check-admin-login.ts
   ```
   Should show: ✅ Can Login: YES

2. **Test API endpoint:**
   ```bash
   # Start API server first
   cd src/system-pos/apps/api
   npm run dev
   
   # In another terminal
   npx tsx scripts/test-admin-login-api.ts
   ```

3. **Test from mobile app:**
   - Open mobile app
   - Enter phone: `0611`
   - Enter PIN: `1234`
   - Check console logs for error messages

#### 📋 Quick Fix Checklist

- [ ] API server is running (`npm run dev` in `apps/api`)
- [ ] Database is running (`docker ps` shows `pos_postgres`)
- [ ] API URL in mobile app matches your local IP
- [ ] Mobile device and computer are on same WiFi network
- [ ] Admin user exists (run `check-admin-login.ts`)
- [ ] Port 3001 is not blocked by firewall

#### 🔧 Diagnostic Scripts

Located in `src/system-pos/apps/api/scripts/`:

- `check-admin-login.ts` - Verify admin user exists and PIN is correct
- `test-admin-login-api.ts` - Test login via HTTP API
- `test-simplified-login.ts` - Test login logic directly

#### 📞 Still Having Issues?

1. Check API server logs for errors
2. Check mobile app console logs
3. Verify network connectivity
4. Try accessing API health endpoint from mobile browser

---

## 🚀 Déploiement Rapide

### API - Méthode Rapide (Script)

```bash
cd src/system-pos/apps/api
./deploy.sh
npm start
```

### API - Méthode Manuelle

```bash
cd src/system-pos/apps/api

# 1. Installer les dépendances
npm install

# 2. Générer Prisma Client
npx prisma generate

# 3. Appliquer les migrations
npx prisma migrate deploy

# 4. Build
npm run build

# 5. Démarrer
npm start
```

### Avec Docker

```bash
# Depuis la racine du workspace
cd ../..
docker-compose up -d pos_postgres pos_redis pos_api pos_admin
```

### Mobile - Build Rapide

```bash
cd src/system-pos/apps/mobile

# iOS
cd ios && pod install && cd ..
npx expo run:ios

# Android
npx expo run:android
```

---

## 🔧 Prérequis

### Pour l'API
- Node.js 18+ installé
- PostgreSQL 14+ installé et configuré
- Docker et Docker Compose (optionnel)

### Pour l'Admin Panel
- Node.js 18+ installé
- Accès à l'API

### Pour le Mobile
- Node.js 18+ installé
- Expo CLI installé (`npm install -g expo-cli`)
- Xcode (pour iOS) ou Android Studio (pour Android)
- CocoaPods installé (pour iOS)

---

## 🚀 Déploiement API

### Option 1: Déploiement avec Docker (Recommandé)

#### 1. Configuration

Créer un fichier `.env` dans `src/system-pos/apps/api/` :

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@pos_postgres:5432/pos_system?schema=public

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

#### 2. Build et Démarrage

```bash
# Depuis la racine du workspace
cd ../..
docker-compose up -d pos_postgres pos_redis pos_api

# Vérifier les logs
docker-compose logs -f pos_api

# Vérifier le statut
docker-compose ps
```

#### 3. Appliquer les Migrations

```bash
# Se connecter au container API
docker-compose exec pos_api sh

# Dans le container
npx prisma generate
npx prisma migrate deploy

# Vérifier le statut
npx prisma migrate status
```

### Option 2: Déploiement Direct (Sans Docker)

#### 1. Installation

```bash
cd src/system-pos/apps/api
npm install
```

#### 2. Configuration Base de Données

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy

# Vérifier le statut
npx prisma migrate status
```

#### 3. Build et Démarrage

```bash
# Build
npm run build

# Démarrer en production
npm start

# Ou avec PM2
pm2 start dist/index.js --name pos-api
pm2 save
pm2 startup
```

### Option 3: Déploiement avec PM2

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

### Vérification API

```bash
# Health check
curl http://localhost:3001/health

# API info
curl http://localhost:3001/api
```

---

## 🖥️ Déploiement Admin Panel

### 1. Configuration

Créer un fichier `.env.local` dans `src/system-pos/apps/admin/` :

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 2. Build et Démarrage

```bash
cd src/system-pos/apps/admin

# Build
npm run build

# Démarrer en production
npm start

# Ou avec PM2
pm2 start npm --name pos-admin -- start
```

### 3. Avec Docker

```bash
# Depuis la racine du workspace
docker-compose up -d pos_admin
```

---

## 📱 Déploiement Mobile

### 1. Configuration

Vérifier que l'URL de l'API est correcte dans `src/system-pos/apps/mobile/src/lib/api.ts` :

```typescript
export const API_URL = 'http://192.168.2.15:3001/api'; // IP du serveur API
```

### 2. Build pour iOS

```bash
cd src/system-pos/apps/mobile

# Installer les dépendances natives
cd ios && pod install && cd ..

# Build et lancer sur simulateur
npx expo run:ios

# Ou build pour appareil physique
npx expo run:ios --device
```

### 3. Build pour Android

```bash
cd src/system-pos/apps/mobile

# Build et lancer sur émulateur
npx expo run:android

# Ou build pour appareil physique
npx expo run:android --device
```

### 4. Build de Production (EAS Build)

```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter
eas login

# Configurer le projet
eas build:configure

# Build iOS
eas build --platform ios

# Build Android
eas build --platform android
```

### 5. Déploiement OTA (Over-The-Air)

```bash
# Publier une mise à jour
eas update --branch production --message "Nouvelle version"

# Ou avec un canal spécifique
eas update --channel production --message "Mise à jour de production"
```

---

## ✅ Checklist de Déploiement

### Pré-Déploiement

#### API
- [ ] Compilation TypeScript réussie
- [ ] Migrations créées
- [ ] Migrations appliquées
- [ ] Client Prisma généré
- [ ] Endpoints documentés
- [ ] Variables d'environnement configurées

#### Mobile
- [ ] Code compilé sans erreurs
- [ ] API_URL configuré
- [ ] Tous les écrans créés
- [ ] Navigation configurée
- [ ] Permissions vérifiées

### Étape 1: Préparation

```bash
cd src/system-pos/apps/api

# Vérifier les variables d'environnement
cat .env

# Vérifier que la base de données est accessible
psql -U postgres -d pos_system -c "SELECT 1;"
```

### Étape 2: Migrations

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy

# Vérifier le statut
npx prisma migrate status
```

### Étape 3: Build

```bash
# Build TypeScript
npm run build

# Vérifier que dist/ existe
ls -la dist/
```

### Étape 4: Démarrage

```bash
# Option 1: Direct
npm start

# Option 2: PM2
pm2 start dist/index.js --name pos-api
pm2 save

# Option 3: Docker
docker-compose up -d pos_api
```

### Étape 5: Vérification

```bash
# Health check
curl http://localhost:3001/health

# Test d'authentification
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0611","password":"1234"}'
```

### Tests Post-Déploiement

#### Tests API
- [ ] Health check: `/health`
- [ ] Authentification: `/api/auth/login`
- [ ] Produits: `/api/products`
- [ ] Clients: `/api/customers`
- [ ] Ventes: `/api/sales` (POST)
- [ ] Points de fidélité: `/api/settings/loyalty-points`
- [ ] Demandes de transfert: `/api/inventory/transfer-requests`
- [ ] Dépenses: `/api/expenses`
- [ ] Rapports: `/api/reports/financial`

#### Tests Mobile
- [ ] Login avec PIN
- [ ] Sélection de client par numéro
- [ ] Création rapide de client
- [ ] Ajout de produits au panier
- [ ] Création de vente avec points de fidélité
- [ ] Impression/partage de reçu
- [ ] Gestion des produits
- [ ] Demandes de transfert
- [ ] Gestion des dépenses
- [ ] Rapports financiers

---

## ✅ Vérification Post-Déploiement

### API

#### 1. Health Check
```bash
curl http://localhost:3001/health
```

Réponse attendue:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 2. Endpoints Principaux

```bash
# Liste des produits
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/products

# Liste des clients
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/customers

# Liste des entrepôts
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/warehouses

# Paramètres de points de fidélité
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/settings/loyalty-points
```

#### 3. Vérifier les Tables

```bash
# Se connecter à PostgreSQL
psql -U postgres -d pos_system

# Vérifier les tables
\dt

# Vérifier stock_transfer_requests
\d stock_transfer_requests

# Vérifier loyalty_points_used dans sales
\d sales
```

### Mobile

#### 1. Vérifier la Connexion API

1. Ouvrir l'application mobile
2. Se connecter avec un compte test
3. Vérifier que les produits se chargent
4. Vérifier que les catégories s'affichent

#### 2. Tester les Fonctionnalités

- ✅ Sélection de client par numéro
- ✅ Création rapide de client
- ✅ Ajout de produits au panier
- ✅ Création de vente
- ✅ Points de fidélité
- ✅ Demandes de transfert
- ✅ Gestion des dépenses
- ✅ Rapports financiers

---

## 🔐 Sécurité Production

### Checklist de Sécurité

- [ ] Changer `JWT_SECRET` et `JWT_REFRESH_SECRET` en production
- [ ] Configurer HTTPS (via reverse proxy comme Nginx)
- [ ] Limiter les origines CORS aux domaines autorisés
- [ ] Activer le rate limiting
- [ ] Configurer les firewall rules
- [ ] Utiliser des variables d'environnement sécurisées
- [ ] Activer les logs d'audit
- [ ] Configurer les backups de base de données automatiques
- [ ] Désactiver les logs de debug en production

### Configuration Nginx (Exemple)

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

---

## 📊 Monitoring

### Logs API

```bash
# Docker
docker-compose logs -f pos_api

# PM2
pm2 logs pos-api

# Direct
tail -f logs/api.log
```

### Métriques à Surveiller

- Temps de réponse API
- Taux d'erreur
- Utilisation CPU/Mémoire
- Connexions base de données
- Espace disque

### Logs à Surveiller

- Logs API (erreurs 500, timeouts)
- Logs base de données (connexions, requêtes lentes)
- Logs mobile (crashes, erreurs réseau)

### Métriques Cibles

- Temps de réponse API (< 500ms)
- Taux d'erreur (< 1%)
- Utilisation CPU/Mémoire
- Espace disque disponible

---

## 🔄 Mises à Jour

### Mise à Jour API

```bash
cd src/system-pos/apps/api

# Pull les dernières modifications
git pull

# Installer les dépendances
npm install

# Appliquer les migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Redémarrer
pm2 restart pos-api
# Ou avec Docker
docker-compose restart pos_api
```

### Mise à Jour Mobile

```bash
cd src/system-pos/apps/mobile

# Pull les dernières modifications
git pull

# Installer les dépendances
npm install

# Publier une mise à jour OTA
eas update --branch production --message "Description de la mise à jour"
```

### Rollback Plan

#### En cas de problème API
```bash
# Arrêter le service
pm2 stop pos-api
# Ou
docker-compose stop pos_api

# Restaurer la version précédente
git checkout <previous-commit>
npm install
npm run build
pm2 restart pos-api
```

#### En cas de problème Mobile
```bash
# Publier une version précédente
eas update --branch production --message "Rollback" --update-branch <previous-branch>
```

---

## 🐛 Dépannage

### Problèmes Courants

#### API ne démarre pas
- Vérifier que PostgreSQL est démarré
- Vérifier `DATABASE_URL` dans `.env`
- Vérifier les logs: `docker-compose logs pos_api`

#### Migrations échouent
- Vérifier la connexion à la base de données
- Vérifier que Prisma est à jour: `npx prisma generate`
- Vérifier les migrations: `npx prisma migrate status`

#### Mobile ne se connecte pas à l'API
- Vérifier `API_URL` dans `src/lib/api.ts`
- Vérifier que l'API est accessible depuis le device/émulateur
- Vérifier les règles de firewall
- Pour iOS Simulator, utiliser l'IP de la machine hôte (pas localhost)

#### Erreurs de build mobile
- Nettoyer le cache: `npx expo start -c`
- Réinstaller les pods iOS: `cd ios && pod install && cd ..`
- Vérifier les versions de dépendances: `npx expo-doctor`

#### Erreur de connexion à la base de données
- Vérifier `DATABASE_URL`
- Vérifier que PostgreSQL est démarré
- Vérifier les permissions de l'utilisateur

#### Erreurs de compilation TypeScript
- Vérifier que toutes les dépendances sont installées
- Exécuter `npm run build` pour voir les erreurs détaillées

#### Erreurs d'authentification
- Vérifier que `JWT_SECRET` est configuré
- Vérifier que les tokens sont valides
- Vérifier les permissions de l'utilisateur

---

## 📝 Notes Importantes

1. **Base de Données**: Assurez-vous d'avoir des backups réguliers
2. **Migrations**: Toujours tester les migrations en développement avant production
3. **Variables d'Environnement**: Ne jamais commiter les fichiers `.env`
4. **Tokens JWT**: Changer les secrets en production
5. **HTTPS**: Toujours utiliser HTTPS en production
6. **Monitoring**: Configurer des alertes pour les erreurs critiques

---

## ✅ Sign-off

- [ ] API déployée et fonctionnelle
- [ ] Admin Panel déployé et fonctionnel
- [ ] Mobile déployé et fonctionnel
- [ ] Tests de régression passés
- [ ] Monitoring configuré
- [ ] Documentation à jour
- [ ] Équipe informée

---

## 📞 Support

En cas de problème, vérifier:
1. Les logs de l'API
2. Les logs du mobile (via Expo Dev Tools)
3. Les logs de la base de données
4. La documentation dans `API_ENDPOINTS.md`

