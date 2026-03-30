import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // Limpando o banco para rodar o seed múltiplas vezes (opcional mas recomendado)
  await prisma.invalidTransaction.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.user.deleteMany();

  // Criando usuários base (O Prisma vai gerar os UUIDs automaticamente por causa do @default(uuid()))
  const user1 = await prisma.user.create({
    data: {
      name: 'Alice Silva',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Bob Santos',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Carlos Oliveira',
    },
  });

  console.log('Seeding finished.');
  console.log('--- Initial Users Created ---');
  console.table([
    { id: user1.id, name: user1.name },
    { id: user2.id, name: user2.name },
    { id: user3.id, name: user3.name },
  ]);
  console.log('-----------------------------');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
