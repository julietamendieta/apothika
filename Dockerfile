# Usamos una etiqueta oficial existente de FrankenPHP con PHP 8.4
FROM dunglas/frankenphp:php8.4-alpine

# Instalar extensiones de PHP necesarias para Laravel y dependencias del sistema operativo en Alpine
RUN apk add --no-cache \
    git \
    unzip \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    nodejs \
    npm

# Instalar extensiones PHP con install-php-extensions (compatible con Alpine)
ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN chmod +x /usr/local/bin/install-php-extensions && \
    install-php-extensions pdo_mysql pdo_pgsql gd intl zip opcache bcmath

# Copiar Composer desde la imagen oficial
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copiar archivos del proyecto
COPY . .

# Instalar dependencias de PHP y Node
RUN composer install --no-dev --optimize-autoloader --no-interaction
RUN npm install && npm run build

# Configurar permisos de almacenamiento de Laravel
RUN chown -R www-data:www-data storage bootstrap/cache

# Puerto de la app
EXPOSE 8000

# Comando de inicio
CMD php artisan config:cache && \
    php artisan route:cache && \
    php artisan serve --host=0.0.0.0 --port=${PORT:-8000}