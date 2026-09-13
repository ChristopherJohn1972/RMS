# Rental Management Services (RMS)

## Structure
```
RMS/
  Backend/      ← Django REST API (port 8000)
  Frontend/     ← React + Vite + Tailwind (port 5173)
```

## Quick Start (WSL Ubuntu)

### 1. Run migration script (first time only)
```bash
cd /mnt/c/Users/MUTUKU/mu_code/RMS
bash migrate_structure.sh
```

### 2. Setup backend
```bash
cd Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

### 3. Setup frontend
```bash
cd Frontend
npm install
npm run dev
```

## Login
- **Email:** curlsjamin@gmail.com
- **Password:** Jamin$&2222

## Deployment
- **Backend:** Render (render.yaml)
- **Frontend:** Vercel (vercel.json)

## GitHub Repos
- Backend: https://github.com/ChristopherJohn1972/Rental-Management-Services-backend-
- Frontend: https://github.com/ChristopherJohn1972/Rental-Management-Services-frontend-
