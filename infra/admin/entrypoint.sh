#!/bin/bash
set -e

# Enable mod_rewrite for Laravel URL routing
a2enmod rewrite > /dev/null 2>&1 || true

# Configure Apache to allow .htaccess overrides
cat > /etc/apache2/sites-available/000-default.conf << 'EOF'
<VirtualHost *:80>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/app/public

    <Directory /var/www/app/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
EOF

# Fix permissions on mounted volume
chown -R www-data:www-data /var/www/app 2>/dev/null || true

# Create .env if it doesn't exist
if [ ! -f "/var/www/app/public/project/.env" ]; then
    if [ -f "/var/www/app/public/project/.env.example" ]; then
        cp /var/www/app/public/project/.env.example /var/www/app/public/project/.env
        echo "Created .env from .env.example"
    fi
fi

# Ensure storage and cache directories are writable
chmod -R 777 /var/www/app/public/project/storage 2>/dev/null || true
chmod -R 777 /var/www/app/public/project/bootstrap/cache 2>/dev/null || true

# Install Composer dependencies if vendor directory doesn't exist
if [ -d "/var/www/app/public/project" ] && [ ! -d "/var/www/app/public/project/vendor" ]; then
    echo "Installing Composer dependencies..."
    cd /var/www/app/public/project
    
    # Install dependencies
    COMPOSER_ALLOW_SUPERUSER=1 composer install --no-interaction --no-dev --optimize-autoloader --no-scripts || echo "Composer install failed, continuing..."
fi

# Generate Laravel app key if not set
if [ -f "/var/www/app/public/project/.env" ]; then
    if grep -q "APP_KEY=$" /var/www/app/public/project/.env 2>/dev/null; then
        cd /var/www/app/public/project
        php artisan key:generate --force 2>/dev/null || true
        echo "Generated Laravel APP_KEY"
    fi
fi

# Start Apache
exec apache2-foreground
