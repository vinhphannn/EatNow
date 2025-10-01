import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Item, ItemDocument } from '../restaurant/schemas/item.schema';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly indexName = 'eatnow_items';

  constructor(
    @Inject('OPENSEARCH') private readonly client: any,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
  ) {}

  async ensureIndex() {
    try {
      if (!this.client) {
        this.logger.log('OpenSearch not available, using MongoDB search only');
        return; // OpenSearch not available
      }
      const exists = await this.client.indices.exists({ index: this.indexName });
      // @ts-ignore
      if (!exists?.body) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            settings: {
              analysis: {
                analyzer: {
                  vi_no_accent: {
                    tokenizer: 'standard',
                    filter: ['lowercase', 'asciifolding'],
                    type: 'custom',
                  },
                },
              },
            },
            mappings: {
              properties: {
                id: { type: 'keyword' },
                restaurantId: { type: 'keyword' },
                name: { type: 'text', analyzer: 'vi_no_accent' },
                nameSearch: { type: 'text', analyzer: 'vi_no_accent' },
                price: { type: 'integer' },
                popularityScore: { type: 'integer' },
                imageUrl: { type: 'keyword' },
              },
            },
          },
        });
      }
    } catch (e) {
      this.logger.warn(`ensureIndex failed: ${(e as Error).message}`);
      this.logger.log('Falling back to MongoDB search');
    }
  }

  async reindexAll(limit = 5000) {
    await this.ensureIndex();
    if (!this.client) {
      this.logger.log('OpenSearch not available, skipping reindex');
      return { indexed: 0, skipped: true } as any;
    }
    try {
      const cursor = this.itemModel.find({ isActive: true }).cursor();
      const ops: any[] = [];
      let count = 0;
      for await (const doc of cursor) {
        ops.push({ index: { _index: this.indexName, _id: String(doc._id) } });
        ops.push({
          id: String(doc._id),
          restaurantId: String(doc.restaurantId),
          name: doc.name,
          nameSearch: doc.nameSearch || doc.name,
          price: doc.price,
          popularityScore: doc.popularityScore || 0,
          imageUrl: doc.imageUrl || '',
        });
        count++;
        if (ops.length >= 1000) {
          await this.client.bulk({ body: ops });
          ops.length = 0;
        }
        if (count >= limit) break;
      }
      if (ops.length > 0) await this.client.bulk({ body: ops });
      return { indexed: count };
    } catch (e) {
      this.logger.warn(`Reindex skipped due to OpenSearch connection error: ${(e as Error).message}`);
      return { indexed: 0, skipped: true, reason: 'connection_error' } as any;
    }
  }

  async searchItems(query: string, restaurantId?: string, size = 10) {
    await this.ensureIndex();
    try {
      if (!this.client) {
        this.logger.log('OpenSearch not available, using MongoDB search');
        throw new Error('OpenSearch client not available');
      }
      const body: any = {
        size,
        query: {
          bool: {
            must: query
              ? [{ multi_match: { query, fields: ['name^2', 'nameSearch'] } }]
              : [{ match_all: {} }],
            filter: restaurantId ? [{ term: { restaurantId } }] : [],
          },
        },
        sort: [{ popularityScore: { order: 'desc' } }],
      };
      // @ts-ignore
      const res = await this.client.search({ index: this.indexName, body });
      // @ts-ignore
      const hits = res?.body?.hits?.hits || [];
      return hits.map((h: any) => ({ id: h._id, ...h._source }));
    } catch (e) {
      // Fallback Mongo search
      const q = (query || '').toLowerCase();
      const filter: any = { isActive: true };
      if (restaurantId) filter.restaurantId = restaurantId;
      if (q) {
        filter.$or = [
          { name: new RegExp(q.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') },
          { nameSearch: new RegExp(q.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') },
          { description: new RegExp(q.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') }
        ];
      }
      const docs = await this.itemModel
        .find(filter)
        .sort({ popularityScore: -1, position: 1 })
        .limit(size)
        .lean();
      return docs.map((d: any) => ({ 
        id: String(d._id), 
        restaurantId: String(d.restaurantId),
        name: d.name,
        price: d.price,
        type: d.type,
        description: d.description,
        imageUrl: d.imageUrl,
        isActive: d.isActive
      }));
    }
  }
}
