import { execSync } from 'child_process';

export async function setup() {
  console.log('\n🔧 Setting up test database...');
  execSync('npx prisma migrate deploy', {
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.DATABASE_URL || 'postgresql://postgres:postgres@test-db:5432/test_db',
    },
    cwd: process.cwd(),
    stdio: 'inherit',
  });
  console.log('✅ Test database ready.\n');
}

export async function teardown() {
  console.log('\n🧹 Test database teardown complete.\n');
}
