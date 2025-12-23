#!/bin/bash
set -e

# Install Composer dependencies if vendor directory doesn't exist
if [ -d "/var/www/app/public/project" ] && [ ! -d "/var/www/app/public/project/vendor" ]; then
    echo "Installing Composer dependencies..."
    cd /var/www/app/public/project
    
    # Remove old lock file if it causes issues
    rm -f composer.lock
    
    # Install dependencies
    composer install --no-interaction --no-dev --optimize-autoloader --ignore-platform-reqs || echo "Composer install failed, continuing..."
    
    # Set permissions
    if [ -d "vendor" ]; then
        chown -R www-data:www-data /var/www/app/public/project/vendor
    fi
fi

# Start the thecodingmachine entrypoint
exec /usr/local/bin/apache2-foreground
