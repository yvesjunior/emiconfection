FROM php:8.2-apache
LABEL org.opencontainers.image.authors="yvesjuniorbationo@gmail.com"

ENV DEBIAN_FRONTEND=noninteractive

# Install PHP extensions and dependencies
RUN apt-get update && apt-get install -y \
    vim \
    net-tools \
    libicu-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libpq-dev \
    libxml2-dev \
    libreadline-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        intl \
        zip \
        gd \
        pdo_mysql \
        mysqli \
        pdo_pgsql \
        xml \
        opcache \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Enable Apache modules
RUN a2enmod rewrite ssl headers

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --version=2.7.2 --install-dir=/usr/local/bin --filename=composer

# Copy configurations
COPY ./configs/app.conf /etc/apache2/sites-enabled/000-default.conf
COPY ./configs/php.ini /usr/local/etc/php/conf.d/custom.ini
COPY entrypoint.sh /sbin/entrypoint.sh

# Setup logging and permissions
RUN ln -sf /dev/stdout /var/log/apache2/access.log && \
    ln -sf /dev/stderr /var/log/apache2/error.log && \
    chmod 755 /sbin/entrypoint.sh

# Create and setup working directory
RUN mkdir -p /var/www/app && \
    chmod -R 755 /var/www/app && \
    chown -R www-data:www-data /var/www/app

WORKDIR /var/www/app/
EXPOSE 80 443

CMD ["/sbin/entrypoint.sh"]
