#!/bin/bash

source /etc/apache2/envvars

# Install Composer dependencies if vendor directory doesn't exist
if [ ! -d "/var/www/app/public/project/vendor" ]; then
    echo "Installing Composer dependencies..."
    cd /var/www/app/public/project
    composer install --no-interaction --no-dev --optimize-autoloader
    chown -R www-data:www-data /var/www/app/public/project/vendor
fi

#tail -F /var/log/apache2/* &
exec apache2 -D FOREGROUND
