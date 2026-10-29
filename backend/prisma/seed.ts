import worldCountries from 'world-countries';
import * as countriesAndTimezones from 'countries-and-timezones';
import * as currencyCodes from 'currency-codes';
import * as langs from 'langs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { flagEmoji } from '../src/common/utils/flag-emoji';
import { generateApiKey } from '../src/common/utils/api-key';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function seedResourceTypes() {
  const types: { key: string; displayName: string; classification: 'SYNC' | 'LIVE' }[] = [
    { key: 'country', displayName: 'Countries', classification: 'SYNC' },
    { key: 'currency', displayName: 'Currencies', classification: 'SYNC' },
    { key: 'timezone', displayName: 'Timezones', classification: 'SYNC' },
    { key: 'language', displayName: 'Languages', classification: 'SYNC' },
    { key: 'vendor', displayName: 'Vendors', classification: 'LIVE' },
    { key: 'category', displayName: 'Categories', classification: 'SYNC' },
  ];

  for (const type of types) {
    await prisma.resourceType.upsert({
      where: { key: type.key },
      create: type,
      update: { displayName: type.displayName, classification: type.classification },
    });
  }
  console.log(`Seeded ${types.length} resource types`);
}

async function fetchFlagSvg(alpha2: string): Promise<Uint8Array<ArrayBuffer> | null> {
  try {
    const res = await fetch(`https://flagcdn.com/${alpha2.toLowerCase()}.svg`);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function callingCodeOf(idd: { root?: string; suffixes?: string[] } | undefined): string {
  if (!idd?.root) return '';
  // A single suffix means root+suffix together form the real calling code (e.g. AT: "+4"+"3" -> "+43").
  // Multiple suffixes mean root alone is the shared calling code and suffixes are area codes within it
  // (e.g. NANP: US/CA/DO/PR all share root "+1"; Russia/Kazakhstan share "+7").
  if (idd.suffixes?.length === 1) return `${idd.root}${idd.suffixes[0]}`;
  return idd.root;
}

async function seedCurrencies(): Promise<Map<string, string>> {
  const codeToId = new Map<string, string>();
  const seen = new Map<string, { name: string; symbol: string }>();

  for (const country of worldCountries) {
    for (const [code, info] of Object.entries(country.currencies ?? {})) {
      if (!seen.has(code)) seen.set(code, { name: info.name, symbol: info.symbol ?? code });
    }
  }

  for (const [code, info] of seen) {
    const digits = currencyCodes.code(code)?.digits ?? 2;
    const currency = await prisma.currency.upsert({
      where: { code },
      create: { code, name: info.name, symbol: info.symbol, decimalDigits: digits },
      update: { name: info.name, symbol: info.symbol, decimalDigits: digits },
    });
    codeToId.set(code, currency.id);
  }

  console.log(`Seeded ${codeToId.size} currencies`);
  return codeToId;
}

async function seedLanguages(): Promise<Map<string, string>> {
  // Keyed by ISO 639-3 (as used in world-countries' `languages` field), value is our Language.id.
  // Only languages with a resolvable ISO 639-1 code become Language rows — see note in README/seed output.
  const iso3ToId = new Map<string, string>();
  const seen = new Map<string, { code1: string; name: string; local: string }>();
  const unresolved = new Set<string>();

  for (const country of worldCountries) {
    for (const [code3, name] of Object.entries(country.languages ?? {})) {
      if (seen.has(code3) || unresolved.has(code3)) continue;
      const lang = langs.where('3', code3);
      if (!lang || !lang['1']) {
        unresolved.add(code3);
        continue;
      }
      seen.set(code3, { code1: lang['1'], name: lang.name || (name as string), local: lang.local || (name as string) });
    }
  }

  for (const [code3, info] of seen) {
    const language = await prisma.language.upsert({
      where: { code: info.code1 },
      create: { code: info.code1, name: info.name, nativeName: info.local },
      update: { name: info.name, nativeName: info.local },
    });
    iso3ToId.set(code3, language.id);
  }

  console.log(`Seeded ${iso3ToId.size} languages (skipped ${unresolved.size} without an ISO 639-1 code: ${[...unresolved].join(', ')})`);
  return iso3ToId;
}

async function seedTimezones(): Promise<Map<string, string>> {
  const identifierToId = new Map<string, string>();
  const all = countriesAndTimezones.getAllTimezones();

  for (const [identifier, tz] of Object.entries(all)) {
    const timezone = await prisma.timezone.upsert({
      where: { identifier },
      create: { identifier, utcOffset: tz.utcOffsetStr, displayName: identifier.replace(/_/g, ' ') },
      update: { utcOffset: tz.utcOffsetStr, displayName: identifier.replace(/_/g, ' ') },
    });
    identifierToId.set(identifier, timezone.id);
  }

  console.log(`Seeded ${identifierToId.size} timezones`);
  return identifierToId;
}

async function seedCountries(
  currencyIds: Map<string, string>,
  languageIds: Map<string, string>,
  timezoneIds: Map<string, string>,
) {
  let count = 0;

  for (const country of worldCountries) {
    const alpha2 = country.cca2;
    const alpha3 = country.cca3;
    const callingCode = callingCodeOf(country.idd);
    const flagSvg = await fetchFlagSvg(alpha2);

    const row = await prisma.country.upsert({
      where: { alpha2 },
      create: {
        name: country.name.common,
        alpha2,
        alpha3,
        callingCode,
        region: country.region,
        flagEmoji: flagEmoji(alpha2),
        flagSvg,
      },
      update: {
        name: country.name.common,
        alpha3,
        callingCode,
        region: country.region,
        flagEmoji: flagEmoji(alpha2),
        flagSvg,
      },
    });

    const currencyCodesForCountry = Object.keys(country.currencies ?? {});
    for (const [index, code] of currencyCodesForCountry.entries()) {
      const currencyId = currencyIds.get(code);
      if (!currencyId) continue;
      await prisma.countryCurrency.upsert({
        where: { countryId_currencyId: { countryId: row.id, currencyId } },
        create: { countryId: row.id, currencyId, isPrimary: index === 0 },
        update: { isPrimary: index === 0 },
      });
    }

    const languageCodesForCountry = Object.keys(country.languages ?? {});
    for (const [index, code3] of languageCodesForCountry.entries()) {
      const languageId = languageIds.get(code3);
      if (!languageId) continue;
      await prisma.countryLanguage.upsert({
        where: { countryId_languageId: { countryId: row.id, languageId } },
        create: { countryId: row.id, languageId, isPrimary: index === 0 },
        update: { isPrimary: index === 0 },
      });
    }

    const tzInfo = countriesAndTimezones.getCountry(alpha2);
    const timezonesForCountry = tzInfo?.timezones ?? [];
    for (const [index, identifier] of timezonesForCountry.entries()) {
      const timezoneId = timezoneIds.get(identifier);
      if (!timezoneId) continue;
      await prisma.countryTimezone.upsert({
        where: { countryId_timezoneId: { countryId: row.id, timezoneId } },
        create: { countryId: row.id, timezoneId, isPrimary: index === 0 },
        update: { isPrimary: index === 0 },
      });
    }

    count++;
  }

  console.log(`Seeded ${count} countries with currency/language/timezone associations`);
}

async function seedOrgTaxonomyExample() {
  const techGroup = await prisma.categoryGroup.upsert({
    where: { name: 'Technology' },
    create: { name: 'Technology' },
    update: {},
  });

  const cloudCategory =
    (await prisma.category.findFirst({ where: { name: 'Cloud Infrastructure' } })) ??
    (await prisma.category.create({ data: { name: 'Cloud Infrastructure', groupId: techGroup.id } }));

  const mediaCategory =
    (await prisma.category.findFirst({ where: { name: 'Streaming & Media' } })) ??
    (await prisma.category.create({ data: { name: 'Streaming & Media', groupId: techGroup.id } }));

  const cloudIndustry = await prisma.industry.upsert({
    where: { name: 'Cloud Computing' },
    create: { name: 'Cloud Computing' },
    update: {},
  });

  const ecommerceIndustry = await prisma.industry.upsert({
    where: { name: 'E-commerce' },
    create: { name: 'E-commerce' },
    update: {},
  });

  const streamingIndustry = await prisma.industry.upsert({
    where: { name: 'Streaming Media' },
    create: { name: 'Streaming Media' },
    update: {},
  });

  const amazon = await prisma.company.upsert({
    where: { name: 'Amazon' },
    create: { name: 'Amazon' },
    update: {},
  });

  const preferredTag = await prisma.tag.upsert({
    where: { name: 'preferred' },
    create: { name: 'preferred' },
    update: {},
  });

  await prisma.location.deleteMany({ where: { companyId: amazon.id } });
  const us = await prisma.country.findUnique({ where: { alpha2: 'US' } });
  await prisma.location.create({
    data: {
      companyId: amazon.id,
      isHeadquarters: true,
      addressLine1: '410 Terry Ave N',
      city: 'Seattle',
      postalCode: '98109',
      countryId: us?.id,
      latitude: 47.6216,
      longitude: -122.3363,
    },
  });

  const vendors = [
    { name: 'AWS', categoryId: cloudCategory.id, industryId: cloudIndustry.id },
    { name: 'Amazon Prime', categoryId: mediaCategory.id, industryId: ecommerceIndustry.id },
    { name: 'Twitch', categoryId: mediaCategory.id, industryId: streamingIndustry.id },
  ];

  for (const vendor of vendors) {
    const existing = await prisma.vendor.findFirst({ where: { name: vendor.name, companyId: amazon.id } });
    const row = existing
      ? await prisma.vendor.update({ where: { id: existing.id }, data: vendor })
      : await prisma.vendor.create({ data: { ...vendor, companyId: amazon.id } });

    await prisma.vendorTag.upsert({
      where: { vendorId_tagId: { vendorId: row.id, tagId: preferredTag.id } },
      create: { vendorId: row.id, tagId: preferredTag.id },
      update: {},
    });
  }

  console.log('Seeded illustrative org-curated example (Amazon / AWS / Prime / Twitch)');
}

// Illustrative only — not an authoritative or current crypto/gaming-currency
// dataset (unlike ISO 4217 fiat currencies, there's no single stable source
// for these, and prices/tickers change far more than this server seeds for).
// Demonstrates the `kind` field is usable; real coverage is an admin-curated
// or future-integration concern, same caveat as exchange rates.
async function seedNonFiatCurrenciesExample() {
  const nonFiat: { code: string; name: string; symbol: string; decimalDigits: number; kind: 'CRYPTO' | 'IN_GAME' }[] = [
    { code: 'BTC', name: 'Bitcoin', symbol: '₿', decimalDigits: 8, kind: 'CRYPTO' },
    { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', decimalDigits: 18, kind: 'CRYPTO' },
    { code: 'VBUCKS', name: 'V-Bucks', symbol: 'V$', decimalDigits: 0, kind: 'IN_GAME' },
  ];

  for (const currency of nonFiat) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      create: currency,
      update: { name: currency.name, symbol: currency.symbol, decimalDigits: currency.decimalDigits, kind: currency.kind },
    });
  }

  console.log(`Seeded ${nonFiat.length} illustrative non-fiat currencies (CRYPTO/IN_GAME)`);
}

// Physical conversion factors are fixed constants, not something that goes
// stale the way exchange rates or crypto prices do — safe to seed as real,
// authoritative data rather than illustrative-only. Each category's base
// unit carries conversionFactor 1.0; every other unit's factor converts a
// quantity in that unit into the base unit (e.g. 1 lb * 0.45359237 = kg).
async function seedUnits() {
  const units: { name: string; symbol: string; unitCategory: string; isBaseUnit: boolean; conversionFactor: number }[] = [
    { name: 'Kilogram', symbol: 'kg', unitCategory: 'mass', isBaseUnit: true, conversionFactor: 1 },
    { name: 'Gram', symbol: 'g', unitCategory: 'mass', isBaseUnit: false, conversionFactor: 0.001 },
    { name: 'Pound', symbol: 'lb', unitCategory: 'mass', isBaseUnit: false, conversionFactor: 0.45359237 },
    { name: 'Ounce', symbol: 'oz', unitCategory: 'mass', isBaseUnit: false, conversionFactor: 0.028349523125 },
    { name: 'Liter', symbol: 'L', unitCategory: 'volume', isBaseUnit: true, conversionFactor: 1 },
    { name: 'Milliliter', symbol: 'mL', unitCategory: 'volume', isBaseUnit: false, conversionFactor: 0.001 },
    { name: 'US Gallon', symbol: 'gal', unitCategory: 'volume', isBaseUnit: false, conversionFactor: 3.785411784 },
    { name: 'US Fluid Ounce', symbol: 'fl oz', unitCategory: 'volume', isBaseUnit: false, conversionFactor: 0.0295735295625 },
    { name: 'Meter', symbol: 'm', unitCategory: 'length', isBaseUnit: true, conversionFactor: 1 },
    { name: 'Centimeter', symbol: 'cm', unitCategory: 'length', isBaseUnit: false, conversionFactor: 0.01 },
    { name: 'Kilometer', symbol: 'km', unitCategory: 'length', isBaseUnit: false, conversionFactor: 1000 },
    { name: 'Inch', symbol: 'in', unitCategory: 'length', isBaseUnit: false, conversionFactor: 0.0254 },
    { name: 'Foot', symbol: 'ft', unitCategory: 'length', isBaseUnit: false, conversionFactor: 0.3048 },
    { name: 'Mile', symbol: 'mi', unitCategory: 'length', isBaseUnit: false, conversionFactor: 1609.344 },
    { name: 'Piece', symbol: 'pc', unitCategory: 'count', isBaseUnit: true, conversionFactor: 1 },
    { name: 'Dozen', symbol: 'doz', unitCategory: 'count', isBaseUnit: false, conversionFactor: 12 },
  ];

  let count = 0;
  for (const unit of units) {
    const existing = await prisma.unit.findFirst({ where: { name: unit.name, unitCategory: unit.unitCategory } });
    if (existing) {
      await prisma.unit.update({ where: { id: existing.id }, data: unit });
    } else {
      await prisma.unit.create({ data: unit });
    }
    count++;
  }

  console.log(`Seeded ${count} units across mass/volume/length/count categories`);
}

async function seedCoreProjects() {
  await prisma.project.upsert({
    where: { slug: 'core-platform' },
    create: {
      name: 'Core Platform',
      slug: 'core-platform',
      description: "Core Platform's own identity flows (email verification, password reset).",
    },
    update: {},
  });

  await prisma.project.upsert({
    where: { slug: 'portfolio-manager' },
    create: {
      name: 'Portfolio Manager',
      slug: 'portfolio-manager',
      description: 'Consuming project — tracks investments, projects, and financial data. Owns its own JWT verification (RS256, public key only) and calls Core Platform APIs (messaging, reference data) using its own API key.',
    },
    update: {},
  });

  return prisma.project.upsert({
    where: { slug: 'bootstrap-admin' },
    create: { name: 'bootstrap-admin', slug: 'bootstrap-admin' },
    update: {},
  });
}

async function seedBootstrapApiKey(bootstrapProjectId: string) {
  const existingCount = await prisma.apiKey.count();
  if (existingCount > 0) {
    console.log('API keys already exist, skipping bootstrap key');
    return;
  }

  const { raw, hashedKey, keyPrefix } = generateApiKey();
  await prisma.apiKey.create({
    data: { projectId: bootstrapProjectId, hashedKey, keyPrefix, rateLimitPerMin: 6000 },
  });
  console.log('Created bootstrap API key — save this now, it will not be shown again:');
  console.log(`  ${raw}`);
}

async function main() {
  await seedResourceTypes();
  const currencyIds = await seedCurrencies();
  const languageIds = await seedLanguages();
  const timezoneIds = await seedTimezones();
  await seedCountries(currencyIds, languageIds, timezoneIds);
  await seedNonFiatCurrenciesExample();
  await seedUnits();
  await seedOrgTaxonomyExample();
  const bootstrapProject = await seedCoreProjects();
  await seedBootstrapApiKey(bootstrapProject.id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
