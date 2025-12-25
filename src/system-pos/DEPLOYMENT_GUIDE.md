# Guide de Déploiement Complet - POS System

Ce guide décrit les étapes pour déployer l'API et l'application mobile.

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Déploiement API](#déploiement-api)
3. [Déploiement Mobile](#déploiement-mobile)
4. [Vérification Post-Déploiement](#vérification-post-déploiement)

---

## 🔧 Prérequis

### Pour l'API
- Node.js 18+ installé
- PostgreSQL 14+ installé et configuré
- Docker et Docker Compose (optionnel)

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
cd src/system-pos

# Démarrer tous les services (PostgreSQL + API)
docker-compose up -d

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

### Vérification API

```bash
# Health check
curl http://localhost:3001/health

# API info
curl http://localhost:3001/api
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

---

## 📝 Notes Importantes

1. **Base de Données**: Assurez-vous d'avoir des backups réguliers
2. **Migrations**: Toujours tester les migrations en développement avant production
3. **Variables d'Environnement**: Ne jamais commiter les fichiers `.env`
4. **Tokens JWT**: Changer les secrets en production
5. **HTTPS**: Toujours utiliser HTTPS en production
6. **Monitoring**: Configurer des alertes pour les erreurs critiques

---

## 📞 Support

En cas de problème, vérifier:
1. Les logs de l'API
2. Les logs du mobile (via Expo Dev Tools)
3. Les logs de la base de données
4. La documentation dans `API_ENDPOINTS.md` et `DEPLOYMENT.md`

