import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { generateApiKey } from '../src/common/utils/api-key';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function main() {
  const projectName = process.argv[2] ?? 'admin-ui';
  const rateLimitPerMin = Number(process.argv[3] ?? 6000);

  const slug = slugify(projectName);
  const project = await prisma.project.upsert({
    where: { slug },
    create: { name: projectName, slug },
    update: {},
  });

  const { raw, hashedKey, keyPrefix } = generateApiKey();
  await prisma.apiKey.create({
    data: { projectId: project.id, hashedKey, keyPrefix, rateLimitPerMin },
  });

  console.log(`Created API key for "${projectName}":`);
  console.log(`  ${raw}`);
  console.log('Save this now — it will not be shown again.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
