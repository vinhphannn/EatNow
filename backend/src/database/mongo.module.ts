import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
// Optional import: OpenSearch may be absent in some environments
let createClient: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  createClient = require('@opensearch-project/opensearch').Client;
} catch {
  createClient = null;
}
import { RestaurantModule } from '../restaurant/restaurant.module';
import { Item, ItemSchema } from '../restaurant/schemas/item.schema';
import { SearchController } from '../search/search.controller';
import { SearchService } from '../search/search.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
    RestaurantModule,
  ],
  controllers: [SearchController],
  providers: [
    createClient
      ? {
          provide: 'OPENSEARCH',
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const node = config.get<string>('OPENSEARCH_URL') || 'http://localhost:9200';
            const username = config.get<string>('OPENSEARCH_USER');
            const password = config.get<string>('OPENSEARCH_PASS');
            return new createClient({
              node,
              auth: username && password ? { username, password } : undefined,
            } as any);
          },
        }
      : {
          provide: 'OPENSEARCH',
          useValue: null,
        },
    SearchService,
  ],
  exports: ['OPENSEARCH', SearchService],
})
export class SearchModule {}


