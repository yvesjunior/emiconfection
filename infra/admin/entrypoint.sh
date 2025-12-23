#!/bin/bash
set -e

# Install Composer dependencies if vendor directory doesn't exist
if [ -d "/var/www/app/public/project" ] && [ ! -d "/var/www/app/public/project/vendor" ]; then
    echo "Installing Composer dependencies..."
    cd /var/www/app/public/project
    composer install --no-interaction --no-dev --optimize-autoloader
    chown -R application:application /var/www/app/public/project/vendor
fi

# Start the webdevops entrypoint (Apache + PHP-FPM via supervisord)
exec /opt/docker/bin/entrypoint.sh supervisord
