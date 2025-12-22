FROM ubuntu:22.04
LABEL org.opencontainers.image.authors="yvesjuniorbationo@gmail.com"

ENV OS_LOCALE="en_US.UTF-8"
ENV LANG=${OS_LOCALE} \
    LANGUAGE=${OS_LOCALE} \
    LC_ALL=${OS_LOCALE} \
    DEBIAN_FRONTEND=noninteractive

ENV APACHE_CONF_DIR=/etc/apache2 \
    PHP_CONF_DIR=/etc/php/8.2 \
    PHP_DATA_DIR=/var/lib/php

COPY entrypoint.sh /sbin/entrypoint.sh

# Install locales and dependencies
RUN apt-get update && \
    apt-get install -y locales software-properties-common gnupg2 && \
    locale-gen ${OS_LOCALE} && \
    dpkg-reconfigure locales

# Add PHP and Apache PPAs
RUN add-apt-repository -y ppa:ondrej/php && \
    add-apt-repository -y ppa:ondrej/apache2 && \
    apt-get update -y

# Install Apache and PHP 8.2
RUN apt-get install -y \
    curl \
    apache2 \
    vim \
    net-tools \
    libapache2-mod-php8.2 \
    php8.2-cli \
    php8.2-mbstring \
    php8.2-intl \
    php8.2-xml \
    php8.2-curl \
    php8.2-readline \
    php8.2-zip \
    php8.2-gd \
    php8.2-pgsql \
    php8.2-mysql \
    php-pear

# Apache settings
RUN cp /dev/null ${APACHE_CONF_DIR}/conf-available/other-vhosts-access-log.conf && \
    rm -f ${APACHE_CONF_DIR}/sites-enabled/000-default.conf ${APACHE_CONF_DIR}/sites-available/000-default.conf && \
    a2enmod rewrite php8.2 ssl

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --version=2.7.2 --install-dir=/usr/local/bin --filename=composer 

# Cleanup and setup logging
RUN apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/* && \
    ln -sf /dev/stdout /var/log/apache2/access.log && \
    ln -sf /dev/stderr /var/log/apache2/error.log && \
    chmod 755 /sbin/entrypoint.sh && \
    chown www-data:www-data ${PHP_DATA_DIR} -Rf

COPY ./configs/apache2.conf ${APACHE_CONF_DIR}/apache2.conf
COPY ./configs/app.conf ${APACHE_CONF_DIR}/sites-enabled/app.conf
COPY ./configs/php.ini  ${PHP_CONF_DIR}/apache2/conf.d/custom.ini

# Create and setup working directory
RUN mkdir -p /var/www/app && \
    chmod -R 755 /var/www/app && \
    chown -R www-data:www-data /var/www/app

WORKDIR /var/www/app/
EXPOSE 80 443 8080

# By default, simply start apache.
CMD ["/sbin/entrypoint.sh"]
