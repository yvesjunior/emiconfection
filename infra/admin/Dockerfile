FROM php:8.1-apache
LABEL org.opencontainers.image.authors="yvesjuniorbationo@gmail.com"

# Install required PHP extensions
RUN docker-php-ext-install pdo_mysql mysqli opcache

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set document root to public folder
ENV APACHE_DOCUMENT_ROOT /var/www/app/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!<Directory /var/www/>!<Directory ${APACHE_DOCUMENT_ROOT}>!g' /etc/apache2/apache2.conf

# Allow .htaccess overrides
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

WORKDIR /var/www/app/
EXPOSE 80

CMD ["apache2-foreground"]
