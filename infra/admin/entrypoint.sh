#!/bin/bash
set -e

# Install Composer dependencies if vendor directory doesn't exist
if [ -d "/var/www/app/public/project" ] && [ ! -d "/var/www/app/public/project/vendor" ]; then
    echo "Installing Composer dependencies..."
    cd /var/www/app/public/project
    
    # Remove old lock file if it causes issues, regenerate fresh
    rm -f composer.lock
    
    # Install with ignore platform reqs for compatibility
    composer install --no-interaction --no-dev --optimize-autoloader --ignore-platform-reqs || true
    
    # Set permissions
    if [ -d "vendor" ]; then
        chown -R application:application /var/www/app/public/project/vendor
    fi
fi

# Start the webdevops entrypoint (Apache + PHP-FPM via supervisord)
exec /opt/docker/bin/entrypoint.sh supervisord
