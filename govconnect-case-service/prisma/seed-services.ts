import { PrismaClient } from '@prisma/client';
import { GOVERNMENT_SERVICES, DEFAULT_OPERATING_HOURS } from '../src/config/services';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding government services...\n');

  for (const serviceDef of GOVERNMENT_SERVICES) {
    const existing = await prisma.service.findUnique({
      where: { code: serviceDef.code },
    });

    if (existing) {
      console.log(`⏭️  Service ${serviceDef.code} already exists, skipping...`);
      continue;
    }

    await prisma.service.create({
      data: {
        code: serviceDef.code,
        name: serviceDef.name,
        description: serviceDef.description,
        category: serviceDef.category,
        requirements: serviceDef.requirements,
        sop_steps: serviceDef.sop_steps,
        estimated_duration: serviceDef.estimated_duration,
        daily_quota: serviceDef.daily_quota,
        operating_hours: DEFAULT_OPERATING_HOURS,
        is_active: true,
        is_online_available: true,
      },
    });

    console.log(`✅ Created service: ${serviceDef.code} - ${serviceDef.name}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Government services seeding completed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding services:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
