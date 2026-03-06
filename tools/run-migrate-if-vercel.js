/*
  Runs Prisma migrations in Vercel build/install environments.
  We gate this behind VERCEL to avoid breaking local builds where DATABASE_URL may not be available.
*/

const { execSync } = require('node:child_process');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

const isVercel = Boolean(process.env.VERCEL);
const hasDb = Boolean(process.env.DATABASE_URL);

if (!isVercel) {
  process.stdout.write('[migrate] Skipped (not Vercel)\n');
  process.exit(0);
}

if (!hasDb) {
  process.stdout.write('[migrate] Skipped (no DATABASE_URL)\n');
  process.exit(0);
}

process.stdout.write('[migrate] Running prisma migrate deploy...\n');
run('npx prisma migrate deploy');
