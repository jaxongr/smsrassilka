import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 12);
    await prisma.user.create({
      data: {
        email: 'admin@smsgateway.uz',
        passwordHash,
        fullName: 'Administrator',
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log('Admin user created: admin@smsgateway.uz / admin123');
  } else {
    console.log('Admin user already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
