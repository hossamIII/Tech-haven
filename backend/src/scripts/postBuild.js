const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const MEDUSA_SERVER_PATH = path.join(process.cwd(), '.medusa', 'server');

// Ensure medusa build succeeded
if (!fs.existsSync(MEDUSA_SERVER_PATH)) {
  throw new Error('.medusa/server not found — Medusa build failed.');
}

// Copy pnpm-lock.yaml so prod deps are deterministic
fs.copyFileSync(
  path.join(process.cwd(), 'pnpm-lock.yaml'),
  path.join(MEDUSA_SERVER_PATH, 'pnpm-lock.yaml')
);

// IMPORTANT: DO NOT copy .env into the built server for prod!
// If an .env exists in the repo, warn loudly so it’s not used accidentally.
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.warn('WARNING: .env exists in repo. It will NOT be used in production builds.');
}

// Install prod deps for the built server
console.log('Installing prod deps in .medusa/server...');
execSync('pnpm i --prod --frozen-lockfile', {
  cwd: MEDUSA_SERVER_PATH,
  stdio: 'inherit',
});
