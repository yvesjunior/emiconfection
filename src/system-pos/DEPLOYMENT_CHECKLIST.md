# Checklist de Déploiement

## ✅ Pré-Déploiement

### API
- [x] Compilation TypeScript réussie
- [x] Migrations créées
- [x] Migrations appliquées
- [x] Client Prisma généré
- [x] Endpoints documentés
- [x] Variables d'environnement configurées

### Mobile
- [x] Code compilé sans erreurs
- [x] API_URL configuré
- [x] Tous les écrans créés
- [x] Navigation configurée
- [x] Permissions vérifiées

## 🚀 Déploiement API

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
curl -X POST http://localhost:3001/api/auth/pin-login \
  -H "Content-Type: application/json" \
  -d '{"phone":"1234567890","pin":"1234"}'
```

## 📱 Déploiement Mobile

### Étape 1: Configuration
```bash
cd src/system-pos/apps/mobile

# Vérifier API_URL
grep API_URL src/lib/api.ts

# Vérifier app.json
cat app.json | grep -A 5 "name\|slug\|bundleIdentifier"
```

### Étape 2: Build iOS
```bash
# Installer les pods
cd ios && pod install && cd ..

# Build pour simulateur
npx expo run:ios

# Build pour appareil
npx expo run:ios --device
```

### Étape 3: Build Android
```bash
# Build pour émulateur
npx expo run:android

# Build pour appareil
npx expo run:android --device
```

### Étape 4: Vérification
- [ ] L'application démarre sans erreur
- [ ] La connexion API fonctionne
- [ ] Le login fonctionne
- [ ] Les produits se chargent
- [ ] La création de vente fonctionne

## 🔍 Tests Post-Déploiement

### Tests API
- [ ] Health check: `/health`
- [ ] Authentification: `/api/auth/pin-login`
- [ ] Produits: `/api/products`
- [ ] Clients: `/api/customers`
- [ ] Ventes: `/api/sales` (POST)
- [ ] Points de fidélité: `/api/settings/loyalty-points`
- [ ] Demandes de transfert: `/api/inventory/transfer-requests`
- [ ] Dépenses: `/api/expenses`
- [ ] Rapports: `/api/reports/financial`

### Tests Mobile
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

## 📊 Monitoring

### Logs à Surveiller
- Logs API (erreurs 500, timeouts)
- Logs base de données (connexions, requêtes lentes)
- Logs mobile (crashes, erreurs réseau)

### Métriques
- Temps de réponse API (< 500ms)
- Taux d'erreur (< 1%)
- Utilisation CPU/Mémoire
- Espace disque disponible

## 🔄 Rollback Plan

### En cas de problème API
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

### En cas de problème Mobile
```bash
# Publier une version précédente
eas update --branch production --message "Rollback" --update-branch <previous-branch>
```

## ✅ Sign-off

- [ ] API déployée et fonctionnelle
- [ ] Mobile déployé et fonctionnel
- [ ] Tests de régression passés
- [ ] Monitoring configuré
- [ ] Documentation à jour
- [ ] Équipe informée

