#!/bin/bash

# Script de déploiement API
set -e

echo "🚀 Déploiement de l'API POS System"
echo "===================================="

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: package.json non trouvé. Exécutez ce script depuis le dossier api/${NC}"
    exit 1
fi

# Vérifier les variables d'environnement
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Avertissement: Fichier .env non trouvé${NC}"
    echo "Création d'un fichier .env.example..."
    cat > .env.example << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pos_system?schema=public
PORT=3001
NODE_ENV=production
JWT_SECRET=change-me-in-production
JWT_REFRESH_SECRET=change-me-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
DEFAULT_TAX_RATE=18
EOF
    echo -e "${RED}❌ Veuillez créer un fichier .env avant de continuer${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Variables d'environnement trouvées${NC}"

# Installer les dépendances
echo ""
echo "📦 Installation des dépendances..."
npm install

# Générer le client Prisma
echo ""
echo "🔧 Génération du client Prisma..."
npx prisma generate

# Appliquer les migrations
echo ""
echo "🗄️  Application des migrations..."
npx prisma migrate deploy

# Build
echo ""
echo "🏗️  Compilation TypeScript..."
npm run build

# Vérifier que le build a réussi
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erreur: Le dossier dist/ n'existe pas après le build${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build réussi${NC}"

# Vérifier le statut des migrations
echo ""
echo "📊 Statut des migrations:"
npx prisma migrate status

echo ""
echo -e "${GREEN}✅ Déploiement API terminé avec succès!${NC}"
echo ""
echo "Pour démarrer l'API:"
echo "  npm start"
echo ""
echo "Ou avec PM2:"
echo "  pm2 start dist/index.js --name pos-api"
echo "  pm2 save"
echo ""

