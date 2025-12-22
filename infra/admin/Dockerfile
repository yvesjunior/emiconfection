FROM ubuntu:focal
LABEL org.opencontainers.image.authors="yvesjuniorbationo@gmail.com"

ENV OS_LOCALE="en_US.UTF-8"
RUN apt-get update && apt-get install -y locales && locale-gen ${OS_LOCALE}
ENV LANG=${OS_LOCALE} \
    LANGUAGE=${OS_LOCALE} \
    LC_ALL=${OS_LOCALE} \
    DEBIAN_FRONTEND=noninteractive

ENV APACHE_CONF_DIR=/etc/apache2 \
    PHP_CONF_DIR=/etc/php/8.2 \
    PHP_DATA_DIR=/var/lib/php

COPY entrypoint.sh /sbin/entrypoint.sh

RUN	\
	BUILD_DEPS='software-properties-common python-software-properties' \
    && dpkg-reconfigure locales 
RUN apt-get install --no-install-recommends -y $BUILD_DEPS
RUN apt-get update -y && \
    apt-get install -y software-properties-common && \
    rm -rf /var/lib/apt/lists/*
RUN add-apt-repository -y ppa:ondrej/php 
RUN add-apt-repository -y ppa:ondrej/apache2 
RUN apt-get update -y
RUN apt-get install -y curl apache2 vim net-tools libapache2-mod-php8.2 php8.2-cli php8.2-mbstring php8.2-intl php8.2-xml php8.2-curl php8.2-readline php8.2-zip php8.2-gd php8.2-pgsql php8.2-mysql php-pear php-patchwork-utf8

    # Apache settings
RUN cp /dev/null ${APACHE_CONF_DIR}/conf-available/other-vhosts-access-log.conf \
    && rm ${APACHE_CONF_DIR}/sites-enabled/000-default.conf ${APACHE_CONF_DIR}/sites-available/000-default.conf \
    && a2enmod rewrite php8.2 
    # PHP settings
RUN phpenmod mcrypt 

RUN curl -sS https://getcomposer.org/installer | php -- --version=2.7.2 --install-dir=/usr/local/bin --filename=composer 

RUN apt-get purge -y --auto-remove $BUILD_DEPS \
	&& apt-get autoremove -y \
	&& rm -rf /var/lib/apt/lists/* \
	&& ln -sf /dev/stdout /var/log/apache2/access.log \
	&& ln -sf /dev/stderr /var/log/apache2/error.log \
	&& chmod 755 /sbin/entrypoint.sh \
    && chown www-data:www-data ${PHP_DATA_DIR} -Rf

RUN apt-get update -y 

RUN a2enmod ssl

COPY ./configs/apache2.conf ${APACHE_CONF_DIR}/apache2.conf
COPY ./configs/app.conf ${APACHE_CONF_DIR}/sites-enabled/app.conf
COPY ./configs/php.ini  ${PHP_CONF_DIR}/apache2/conf.d/custom.ini

WORKDIR /var/www/app/
RUN  chmod -R 755 /var/www/app
RUN chown -R www-data /var/www/app
EXPOSE 80 443 8080

# By default, simply start apache.
CMD ["/sbin/entrypoint.sh"]
