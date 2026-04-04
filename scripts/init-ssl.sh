#!/bin/bash
# init-ssl.sh — One-time script to obtain initial Let's Encrypt certificates.
# Usage: sudo bash scripts/init-ssl.sh your@email.com
set -e

EMAIL="${1:?Usage: $0 your@email.com}"
COMPOSE="docker compose"
DOMAINS=(
    "api.menteecollege.com"
    "menteecollege.com"
    "www.menteecollege.com"
    "nursesexpress.menteecollege.com"
    "nursesandcompanions.com"
    "www.nursesandcompanions.com"
)

echo "==> Creating temporary self-signed certs so nginx can start..."
for domain in "${DOMAINS[@]}"; do
    cert_dir="./ssl-tmp/${domain}"
    mkdir -p "$cert_dir"
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout "${cert_dir}/privkey.pem" \
        -out "${cert_dir}/fullchain.pem" \
        -subj "/CN=${domain}" 2>/dev/null
done

# Copy temp certs into the ssl-certs volume
$COMPOSE up -d nginx
for domain in "${DOMAINS[@]}"; do
    docker compose exec nginx sh -c "mkdir -p /etc/letsencrypt/live/${domain}"
    docker cp "./ssl-tmp/${domain}/fullchain.pem" "$(docker compose ps -q nginx):/etc/letsencrypt/live/${domain}/fullchain.pem"
    docker cp "./ssl-tmp/${domain}/privkey.pem" "$(docker compose ps -q nginx):/etc/letsencrypt/live/${domain}/privkey.pem"
done
$COMPOSE exec nginx nginx -s reload
rm -rf ./ssl-tmp

echo "==> Requesting real certificates from Let's Encrypt..."

# Group 1: menteecollege.com + www
$COMPOSE run --rm certbot certonly --webroot -w /var/www/certbot \
    --email "$EMAIL" --agree-tos --no-eff-email \
    -d menteecollege.com -d www.menteecollege.com

# Group 2: api.menteecollege.com
$COMPOSE run --rm certbot certonly --webroot -w /var/www/certbot \
    --email "$EMAIL" --agree-tos --no-eff-email \
    -d api.menteecollege.com

# Group 3: nursesexpress.menteecollege.com
$COMPOSE run --rm certbot certonly --webroot -w /var/www/certbot \
    --email "$EMAIL" --agree-tos --no-eff-email \
    -d nursesexpress.menteecollege.com

# Group 4: nursesandcompanions.com + www
$COMPOSE run --rm certbot certonly --webroot -w /var/www/certbot \
    --email "$EMAIL" --agree-tos --no-eff-email \
    -d nursesandcompanions.com -d www.nursesandcompanions.com

echo "==> Reloading nginx with real certs..."
$COMPOSE exec nginx nginx -s reload

echo "==> Done! Certificates installed. Start everything with: docker compose up -d"
