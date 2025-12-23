FROM thecodingmachine/php:8.1-v4-apache
LABEL org.opencontainers.image.authors="yvesjuniorbationo@gmail.com"

# This image already has: pdo_mysql, mysqli, gd, intl, zip, mbstring, opcache
# No build required - all extensions pre-installed

ENV APACHE_DOCUMENT_ROOT=/var/www/app/public

WORKDIR /var/www/app/
EXPOSE 80
