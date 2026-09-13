#!/bin/bash
# ============================================
# RMS Deployment for WSL Ubuntu (Local Dev)
# ============================================
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() { echo -e "\n${GREEN}[STEP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/Backend"
FRONTEND_DIR="$PROJECT_DIR/Frontend"
VENV_DIR="$BACKEND_DIR/venv"

echo "========================================="
echo "  Rental Management System - WSL Setup"
echo "========================================="

# ---- System deps ----
step "Installing system dependencies..."
sudo apt-get update -qq
sudo apt-get install -y -qq python3 python3-pip python3-venv nodejs npm > /dev/null 2>&1
echo "  Python: $(python3 --version 2>&1)"
echo "  Node:   $(node --version 2>&1)"

# ---- MySQL (optional for local dev) ----
step "Checking MySQL..."
if command -v mysql &> /dev/null; then
    echo "  MySQL already installed."
    sudo mysql -e "CREATE DATABASE IF NOT EXISTS rms_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
else
    warn "MySQL not found. Using SQLite for local dev."
fi

# ---- Backend ----
step "Setting up Django backend..."
cd "$BACKEND_DIR"

if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"
pip install --upgrade pip -q
pip install -r requirements.txt -q

python manage.py migrate --noinput
python manage.py create_admin 2>/dev/null || true
python manage.py backfill_account_ids 2>/dev/null || true
deactivate

echo "  Backend ready (SQLite, port 8000)."

# ---- Frontend ----
step "Setting up React frontend..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    npm install --quiet 2>/dev/null
fi

echo "  Frontend ready (Vite dev server, port 5173)."

# ---- Done ----
echo ""
echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "  To start the backend:"
echo "    cd $BACKEND_DIR"
echo "    source venv/bin/activate"
echo "    python manage.py runserver 8000"
echo ""
echo "  To start the frontend:"
echo "    cd $FRONTEND_DIR"
echo "    npm run dev"
echo ""
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000/api"
echo "  Login:    curlsjamin@gmail.com / Jamin\$&2222"
echo ""
