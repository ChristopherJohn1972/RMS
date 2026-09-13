#!/bin/bash
# ============================================
# Migrate RMS to CRM V2 directory structure
# ============================================
set -e

GREEN='\033[0;32m'
NC='\033[0m'
echo -e "${GREEN}[MIGRATE]${NC} Restructuring RMS to Backend/ + Frontend/ pattern"

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_SRC="$PROJECT_DIR/BACKEND"
FRONTEND_SRC="$PROJECT_DIR/FRONTEND/frontend"
BACKEND_DST="$PROJECT_DIR/Backend"
FRONTEND_DST="$PROJECT_DIR/Frontend"

# ---- Step 1: Copy Backend ----
echo "[STEP] Copying Backend..."
if [ -d "$BACKEND_DST" ]; then
    echo "  Backend/ already exists, skipping."
else
    cp -r "$BACKEND_SRC" "$BACKEND_DST"
    # Remove venv and __pycache__ from copy
    rm -rf "$BACKEND_DST/venv"
    rm -rf "$BACKEND_DST/__pycache__"
    rm -rf "$BACKEND_DST/api/__pycache__"
    rm -rf "$BACKEND_DST/rms/__pycache__"
    echo "  Backend copied to Backend/"
fi

# ---- Step 2: Copy Frontend ----
echo "[STEP] Copying Frontend..."
if [ -d "$FRONTEND_DST" ]; then
    echo "  Frontend/ already exists, skipping."
else
    cp -r "$FRONTEND_SRC" "$FRONTEND_DST"
    echo "  Frontend copied to Frontend/"
fi

# ---- Step 3: Init git repos ----
echo "[STEP] Setting up git repos..."

if [ ! -d "$BACKEND_DST/.git" ]; then
    cd "$BACKEND_DST"
    git init
    git remote add origin https://github.com/ChristopherJohn1972/Rental-Management-Services-backend-.git
    echo "  Backend git initialized"
fi

if [ ! -d "$FRONTEND_DST/.git" ]; then
    cd "$FRONTEND_DST"
    git init
    git remote add origin https://github.com/ChristopherJohn1972/Rental-Management-Services-frontend-.git
    echo "  Frontend git initialized"
fi

# ---- Step 4: Create root README ----
cat > "$PROJECT_DIR/README.md" <<'EOF'
# Rental Management Services

## Structure
```
RMS/
  Backend/     ← Django REST API
  Frontend/    ← React + Vite + Tailwind
```

## Quick Start

### Backend
```bash
cd Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

### Deploy
- Backend: Render (see render.yaml)
- Frontend: Vercel (see vercel.json)

## Login
- Email: curlsjamin@gmail.com
- Password: Jamin$&2222
EOF

echo "  README.md created"

# ---- Step 5: Create root .gitignore ----
cat > "$PROJECT_DIR/.gitignore" <<'EOF'
# Dependencies
Backend/venv/
Frontend/node_modules/

# Python
__pycache__/
*.pyc
*.sqlite3
db.sqlite3

# Environment
.env
.env.local

# Build
Backend/staticfiles/
Frontend/dist/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
desktop.ini
EOF

echo "  .gitignore created"

echo ""
echo -e "${GREEN}[DONE]${NC} Migration complete!"
echo ""
echo "New structure:"
echo "  $PROJECT_DIR/Backend/"
echo "  $PROJECT_DIR/Frontend/"
echo ""
echo "Next steps:"
echo "  1. cd $PROJECT_DIR/Backend && git add . && git commit -m 'restructure'"
echo "  2. cd $PROJECT_DIR/Frontend && git add . && git commit -m 'restructure'"
echo "  3. Delete old BACKEND/ and FRONTEND/ directories"
