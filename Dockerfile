# Usamos FrankenPHP con PHP 8.4 (compatible con Laravel 11/12)
FROM dunglas/frankenphp:latest-php8.4

# Instalar extensiones de PHP necesarias para Laravel y herramientas de sistema
RUN install-php-extensions \
    pdo_mysql \
    pdo_pgsql \
    gd \
    intl \
    zip \
    opcache \
    bcmath

# Copiar Composer desde la imagen oficial
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Instalar Node.js para compilar assets en la imagen
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

WORKDIR /app

# Copiar archivos del proyecto
COPY . .

# Instalar dependencias de PHP y Node
RUN composer install --no-dev --optimize-autoloader --no-interaction
RUN npm install && npm run build

# Configurar permisos de Laravel
RUN chown -R www-data:www-data storage bootstrap/cache

# Puerto que expone la aplicación
EXPOSE 8000

# Script/Comando de inicio
CMD php artisan config:cache && \
    php artisan route:cache && \
    php artisan serve --host=0.0.0.0 --port=${PORT:-8000}