#!/bin/bash
# Double-cliquez sur ce fichier pour lancer FRANEO JOBS en local sur votre Mac.
cd "$(dirname "$0")" || exit 1
echo "=== FRANEO JOBS : démarrage local ==="

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js n'est pas installé. Installez la version LTS sur https://nodejs.org puis relancez ce fichier."
  read -r -p "Appuyez sur Entrée pour fermer." _; exit 1
fi

# 1. Fichier .env (créé au premier lancement)
if [ ! -f .env ]; then
  cp .env.example .env
  echo
  echo "Première fois : il faut l'adresse de votre base Neon (neon.tech > projet > Connection string)."
  read -r -p "Collez DATABASE_URL (postgresql://...) : " DB
  read -r -p "E-mail administrateur : " AE
  read -r -s -p "Mot de passe administrateur (8 caractères min.) : " AP; echo
  SECRET=$(openssl rand -hex 24)
  python3 - "$DB" "$AE" "$AP" "$SECRET" <<'PY'
import re, sys
db, ae, ap, secret = sys.argv[1:5]
t = open(".env").read()
def put(k, v):
    global t
    t = re.sub(rf'^{k}=.*$', lambda m: f'{k}="{v}"', t, flags=re.M)
put("DATABASE_URL", db); put("ADMIN_EMAIL", ae); put("ADMIN_PASSWORD", ap)
put("CRON_SECRET", secret); put("APP_URL", "http://localhost:3000")
open(".env", "w").write(t)
PY
  echo ".env créé."
fi

# 2. Installation, base de données, compte admin
echo; echo "Installation des paquets (quelques minutes la première fois)…"
npm install || { echo "L'installation a échoué."; read -r -p "Entrée pour fermer." _; exit 1; }
echo; echo "Création des tables…"
npx prisma db push || { echo "Connexion à la base impossible : vérifiez DATABASE_URL dans le fichier .env."; read -r -p "Entrée pour fermer." _; exit 1; }
npx prisma db seed

# 3. Lancement
echo; echo "Ouverture de http://localhost:3000 (Ctrl+C pour arrêter)"
( sleep 6; open "http://localhost:3000/login" ) &
npm run dev
