import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const email = 'mohammadhabib42730@gmail.com';
  
  try {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    // Delete the organization. Since User has onDelete: Cascade, the user will also be deleted.
    await prisma.organization.delete({ where: { id: user.orgId } });
    console.log('Successfully deleted the user and their organization!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
