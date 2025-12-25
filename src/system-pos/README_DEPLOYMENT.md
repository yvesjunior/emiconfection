# 🚀 Guide de Déploiement Rapide

## Déploiement API

### Méthode Rapide (Script)

```bash
cd src/system-pos/apps/api
./deploy.sh
npm start
```

### Méthode Manuelle

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
cd src/system-pos
docker-compose up -d
```

## Déploiement Mobile

### Build iOS

```bash
cd src/system-pos/apps/mobile
cd ios && pod install && cd ..
npx expo run:ios
```

### Build Android

```bash
cd src/system-pos/apps/mobile
npx expo run:android
```

## Vérification

### API
```bash
curl http://localhost:3001/health
```

### Mobile
- Ouvrir l'application
- Se connecter avec un compte test
- Vérifier que les produits se chargent

## 📚 Documentation Complète

Voir `DEPLOYMENT_GUIDE.md` pour le guide complet de déploiement.

