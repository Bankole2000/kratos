-- CreateTable
CREATE TABLE "country_currencies" (
    "countryId" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "country_currencies_pkey" PRIMARY KEY ("countryId","currencyId")
);

-- CreateTable
CREATE TABLE "country_languages" (
    "countryId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "country_languages_pkey" PRIMARY KEY ("countryId","languageId")
);

-- CreateTable
CREATE TABLE "country_timezones" (
    "countryId" TEXT NOT NULL,
    "timezoneId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "country_timezones_pkey" PRIMARY KEY ("countryId","timezoneId")
);

-- CreateIndex
CREATE INDEX "country_currencies_currencyId_idx" ON "country_currencies"("currencyId");

-- CreateIndex
CREATE INDEX "country_languages_languageId_idx" ON "country_languages"("languageId");

-- CreateIndex
CREATE INDEX "country_timezones_timezoneId_idx" ON "country_timezones"("timezoneId");

-- AddForeignKey
ALTER TABLE "country_currencies" ADD CONSTRAINT "country_currencies_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_currencies" ADD CONSTRAINT "country_currencies_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "currencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_languages" ADD CONSTRAINT "country_languages_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_languages" ADD CONSTRAINT "country_languages_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_timezones" ADD CONSTRAINT "country_timezones_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_timezones" ADD CONSTRAINT "country_timezones_timezoneId_fkey" FOREIGN KEY ("timezoneId") REFERENCES "timezones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
