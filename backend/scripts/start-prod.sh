#!/usr/bin/env bash
set -euo pipefail

echo "[start-prod] init-backend…"
init-backend

cd .medusa/server

# Install production deps for the built server (idempotent)
if command -v npm >/dev/null 2>&1; then
  echo "[start-prod] npm ci --omit=dev (with legacy peer deps as fallback)"
  npm ci --omit=dev || npm i --omit=dev --legacy-peer-deps
else
  echo "[start-prod] FATAL: npm not found"; exit 1
fi

echo "[start-prod] db:migrate + db:sync-links…"
./node_modules/.bin/medusa db:migrate
./node_modules/.bin/medusa db:sync-links

# Optional one-time admin bootstrap (controlled by env)
if [[ "${ADMIN_BOOTSTRAP:-0}" == "1" ]]; then
  echo "[start-prod] Creating admin user…"
  node -e 'require("@medusajs/medusa/dist/loaders").bootstrap().then(async ({container,shutdown})=>{try{const s=container.resolve("userModuleService");await s.createUsers([{email:process.env.ADMIN_EMAIL||"admin@tech-haven.io",password:process.env.ADMIN_PASSWORD||"TechHaven#2025_Rocket",first_name:"Tech",last_name:"Haven",role:"admin"}]);console.log("Admin created");}catch(e){console.log("Admin create skipped:", e?.message||e);}finally{await shutdown()}})'
fi

echo "[start-prod] Starting Medusa…"
exec ./node_modules/.bin/medusa start --verbose
