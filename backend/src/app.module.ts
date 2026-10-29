import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './datasources/prisma/prisma.module';
import { CountriesModule } from './modules/countries/countries.module';
import { ProvincesModule } from './modules/provinces/provinces.module';
import { CitiesModule } from './modules/cities/cities.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { ExchangeRatesModule } from './modules/exchange-rates/exchange-rates.module';
import { UnitsModule } from './modules/units/units.module';
import { TimezonesModule } from './modules/timezones/timezones.module';
import { LanguagesModule } from './modules/languages/languages.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { BanksModule } from './modules/banks/banks.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { CategoryGroupsModule } from './modules/category-groups/category-groups.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { IndustriesModule } from './modules/industries/industries.module';
import { LocationsModule } from './modules/locations/locations.module';
import { TagsModule } from './modules/tags/tags.module';
import { SyncModule } from './modules/sync/sync.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { AuthModule } from './common/auth/auth.module';
import { IdentityModule } from './modules/identity/identity.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { PersonalAccessTokensModule } from './modules/personal-access-tokens/personal-access-tokens.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { ProjectsModule } from './modules/projects/projects.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    IdentityModule,
    MessagingModule,
    PersonalAccessTokensModule,
    AuditLogsModule,
    ApiKeysModule,
    CountriesModule,
    ProvincesModule,
    CitiesModule,
    CurrenciesModule,
    ExchangeRatesModule,
    UnitsModule,
    TimezonesModule,
    LanguagesModule,
    CompaniesModule,
    BanksModule,
    VendorsModule,
    CategoryGroupsModule,
    CategoriesModule,
    IndustriesModule,
    LocationsModule,
    TagsModule,
    ProjectsModule,
    SyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
