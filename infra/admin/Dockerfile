FROM webdevops/php-apache:8.2
LABEL org.opencontainers.image.authors="yvesjuniorbationo@gmail.com"

# This image already includes: PHP 8.2, Apache, Composer, and common extensions
# (mbstring, gd, intl, zip, pdo_mysql, mysqli, xml, opcache, bcmath)

ENV WEB_DOCUMENT_ROOT=/var/www/app/public

# Copy custom configurations
COPY ./configs/php.ini /opt/docker/etc/php/php.ini
COPY entrypoint.sh /sbin/entrypoint.sh
RUN chmod 755 /sbin/entrypoint.sh

WORKDIR /var/www/app/
EXPOSE 80 443

CMD ["/sbin/entrypoint.sh"]
