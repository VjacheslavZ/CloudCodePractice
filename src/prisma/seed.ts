import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;

async function main() {
  const email = 'test@gmail.com';
  const password = 'zxcv1234';

  const existing = await prisma.admin.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`Admin "${email}" already exists, skipping seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.admin.create({
    data: { email, passwordHash },
  });

  console.log(`Default admin created: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
