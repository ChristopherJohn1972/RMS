#!/bin/bash
# ============================================
# RMS Backend + Frontend Deployment for Ubuntu
# ============================================
set -e

echo "========================================="
echo "  Rental Management System - Deployment"
echo "========================================="

# Config
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/BACKEND"
FRONTEND_DIR="$PROJECT_DIR/FRONTEND/frontend"
VENV_DIR="$BACKEND_DIR/venv"
PYTHON="python3"
NODE="node"
SUPERVISOR_CONF="/etc/supervisor/conf.d/rms.conf"
NGINX_CONF="/etc/nginx/sites-available/rms"
NGINX_LINK="/etc/nginx/sites-enabled/rms"
APP_USER="$USER"
APP_PORT=8000

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

step() { echo -e "\n${GREEN}[STEP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

# ---- STEP 1: System Dependencies ----
step "Installing system dependencies..."
sudo apt-get update -qq
sudo apt-get install -y -qq \
    python3 python3-pip python3-venv \
    nodejs npm \
    nginx \
    supervisor \
    libmysqlclient-dev \
    pkg-config \
    gcc \
    > /dev/null 2>&1

echo "  Python: $(python3 --version)"
echo "  Node:   $(node --version)"
echo "  Nginx:  $(nginx -v 2>&1)"

# ---- STEP 2: MySQL ----
step "Checking MySQL..."
if ! command -v mysql &> /dev/null; then
    warn "MySQL not found. Installing..."
    sudo apt-get install -y -qq mysql-server mysql-client > /dev/null 2>&1
    sudo systemctl start mysql
    sudo systemctl enable mysql
    echo "  MySQL installed and started."
else
    echo "  MySQL already installed."
fi

# Create database if it doesn't exist
if command -v mysql &> /dev/null; then
    sudo mysql -e "CREATE DATABASE IF NOT EXISTS rms_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
    echo "  Database 'rms_database' ready."
fi

# ---- STEP 3: Backend Setup ----
step "Setting up Django backend..."
cd "$BACKEND_DIR"

# Create/update .env for production
cat > .env <<'ENVEOF'
# Django Production Configuration
DJANGO_SECRET_KEY=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
ENVIRONMENT=production

# MySQL Database
DB_NAME=rms_database
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:80,http://localhost:8000,http://localhost:5173

# Firebase (optional)
FIREBASE_API_KEY=
FIREBASE_PROJECT_ID=

# App
APP_PORT=8000
LOG_LEVEL=INFO
ENVEOF

# Generate a real secret key
SECRET_KEY=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())" 2>/dev/null || echo "django-insecure-rms-prod-$(date +%s)")
sed -i "s|\$(python3 -c.*\)|$SECRET_KEY|" .env

# Python venv
if [ ! -d "$VENV_DIR" ]; then
    echo "  Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

echo "  Installing Python packages..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

# Django setup
echo "  Running migrations..."
python manage.py migrate --noinput

echo "  Collecting static files..."
python manage.py collectstatic --noinput 2>/dev/null || true

# Create admin user
echo "  Creating admin user (if not exists)..."
python manage.py create_admin 2>/dev/null || true

# Backfill account IDs
echo "  Backfilling account IDs..."
python manage.py backfill_account_ids 2>/dev/null || true

deactivate

echo "  Backend setup complete."

# ---- STEP 4: Frontend Build ----
step "Building React frontend..."
cd "$FRONTEND_DIR"

# Update production env to point to local backend
cat > .env.production <<'ENVEOF'
VITE_APP_NAME=RentalSync Pro
VITE_APP_VERSION=1.0.0
VITE_API_URL=http://localhost/api
VITE_ENVIRONMENT=production
ENVEOF

if [ ! -d "node_modules" ]; then
    echo "  Installing npm packages..."
    npm install --quiet 2>/dev/null
fi

echo "  Building production bundle..."
npm run build 2>/dev/null || npx vite build 2>/dev/null

echo "  Frontend build complete."
echo "  Output: $FRONTEND_DIR/dist/"

# ---- STEP 5: Nginx Config ----
step "Configuring Nginx..."
sudo rm -f "$NGINX_LINK"

cat > /tmp/rms_nginx.conf <<'NGINXEOF'
server {
    listen 80;
    server_name localhost;

    # Frontend - serve built React app
    location / {
        root /mnt/c/Users/MUTUKU/mu_code/RMS/FRONTEND/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;
    }

    # Django admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (served by Django)
    location /static/ {
        proxy_pass http://127.0.0.1:8000/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_min_length 256;
}
NGINXEOF

sudo cp /tmp/rms_nginx.conf "$NGINX_CONF"
sudo ln -sf "$NGINX_CONF" "$NGINX_LINK"
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t 2>&1 || fail "Nginx config test failed"
echo "  Nginx configured."

# ---- STEP 6: Supervisor Config ----
step "Configuring Supervisor (Gunicorn)..."
sudo mkdir -p /var/log/rms

cat > /tmp/rms_supervisor.conf <<SUPEREOF
[program:rms-api]
command=$VENV_DIR/bin/gunicorn rms.wsgi:application --bind 127.0.0.1:8000 --workers 3 --timeout 120
directory=$BACKEND_DIR
user=$APP_USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/rms/gunicorn.log
stderr_logfile=/var/log/rms/gunicorn-error.log
environment=DJANGO_SETTINGS_MODULE="rms.settings",ENVIRONMENT="production"
SUPEREOF

sudo cp /tmp/rms_supervisor.conf "$SUPERVISOR_CONF"
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart rms-api 2>/dev/null || sudo supervisorctl start rms-api

echo "  Supervisor configured."

# ---- STEP 7: Restart Services ----
step "Restarting services..."
sudo supervisorctl restart rms-api 2>/dev/null || true
sudo systemctl restart nginx

echo "  Services restarted."

# ---- DONE ----
echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
echo "  Frontend:  http://localhost"
echo "  API:       http://localhost/api"
echo "  Django:    http://localhost/admin"
echo ""
echo "  Login: curlsjamin@gmail.com / Jamin\$&2222"
echo ""
echo "  Commands:"
echo "    sudo supervisorctl status        # Check Gunicorn"
echo "    sudo supervisorctl restart rms-api  # Restart backend"
echo "    sudo systemctl restart nginx     # Restart Nginx"
echo "    sudo tail -f /var/log/rms/gunicorn.log  # View logs"
echo ""
