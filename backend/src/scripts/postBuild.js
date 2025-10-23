// postBuild.js — SAFE for Railway/CI + convenient for local dev

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const ROOT = process.cwd();
const SERVER_DIR = path.join(ROOT, '.medusa', 'server');
const ON_RAILWAY =
  !!(process.env.RAILWAY_PROJECT_ID ||
     process.env.RAILWAY_ENVIRONMENT ||
     process.env.RAILWAY_STATIC_URL);

if (!fs.existsSync(SERVER_DIR)) {
  throw new Error('.medusa/server directory not found. The Medusa build likely failed. Check build output.');
}

// 1) Copy lockfile (helps deterministic install)
const rootLock = path.join(ROOT, 'pnpm-lock.yaml');
if (fs.existsSync(rootLock)) {
  fs.copyFileSync(rootLock, path.join(SERVER_DIR, 'pnpm-lock.yaml'));
}

// 2) Handle .env in .medusa/server
const serverEnvPath = path.join(SERVER_DIR, '.env');

if (ON_RAILWAY) {
  // NEVER ship secrets via file in CI/Prod; rely on platform env only
  if (fs.existsSync(serverEnvPath)) {
    fs.rmSync(serverEnvPath);
    console.log('[postBuild] Removed existing .medusa/server/.env to avoid overriding platform env.');
  }
  console.log('[postBuild] Skipping writing .medusa/server/.env (using platform environment only).');
} else {
  // Local dev convenience ONLY
  const rootEnvPath = path.join(ROOT, '.env');
  if (fs.existsSync(rootEnvPath)) {
    console.log('[postBuild] Local dev: copying root .env -> .medusa/server/.env');
    fs.copyFileSync(rootEnvPath, serverEnvPath);
  } else {
    console.log('[postBuild] No root .env found; server will read process.env only.');
  }
}

// 3) Install production deps for the compiled server
console.log('[postBuild] Installing production deps in .medusa/server ...');
execSync('pnpm install --prod --frozen-lockfile', {
  cwd: SERVER_DIR,
  stdio: 'inherit',
});

console.log('[postBuild] Done.');
