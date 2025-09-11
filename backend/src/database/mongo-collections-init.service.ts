import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class MongoCollectionsInitService implements OnModuleInit {
  private readonly logger = new Logger(MongoCollectionsInitService.name);

  constructor(@InjectConnection() private readonly conn: Connection) {}

  async onModuleInit(): Promise<void> {
    try {
      const requiredCollections = ['users', 'restaurants', 'drivers', 'orders', 'orderitems', 'categories', 'items'];
      const existing = (await this.conn.db.listCollections().toArray()).map((c: any) => c.name);
      for (const name of requiredCollections) {
        if (!existing.includes(name)) {
          await this.conn.createCollection(name);
          this.logger.log(`Created Mongo collection: ${name}`);
        }
      }
    } catch (err) {
      this.logger.warn(`Mongo collection init skipped: ${(err as Error).message}`);
    }
  }
}


