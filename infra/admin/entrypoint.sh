#!/bin/bash
set -e

# Fix permissions on mounted volume
chown -R www-data:www-data /var/www/app 2>/dev/null || true

# Install Composer dependencies if vendor directory doesn't exist
if [ -d "/var/www/app/public/project" ] && [ ! -d "/var/www/app/public/project/vendor" ]; then
    echo "Installing Composer dependencies..."
    cd /var/www/app/public/project
    
    # Remove old lock file if it causes issues
    rm -f composer.lock
    
    # Install dependencies as www-data or root
    COMPOSER_ALLOW_SUPERUSER=1 composer install --no-interaction --no-dev --optimize-autoloader --ignore-platform-reqs || echo "Composer install failed, continuing..."
fi

# Start Apache
exec apache2-foreground
