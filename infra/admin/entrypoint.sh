#!/bin/bash

# Install Composer dependencies if vendor directory doesn't exist
if [ ! -d "/var/www/app/public/project/vendor" ]; then
    echo "Installing Composer dependencies..."
    cd /var/www/app/public/project
    composer install --no-interaction --no-dev --optimize-autoloader
    chown -R www-data:www-data /var/www/app/public/project/vendor
fi

# Start supervisord (manages Apache + PHP-FPM)
exec /entrypoint supervisord
