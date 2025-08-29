/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class VectorStoreService {
  private client: QdrantClient;
  private collection;
  private url;
  private distance;

  constructor(private readonly config: ConfigService) {
    this.client = new QdrantClient({ url: this.url });
    this.collection = this.config.get('QDRANT_COLLECTION') || 'pirozhki';
    this.url = this.config.get('QDRANT_URL') || 'http://localhost:6333';
    this.distance = this.config.get('QDRANT_DISTANCE') || 'Cosine';
  }

  async recreateCollection(size: number, collection = this.collection) {
    try {
      await this.client.deleteCollection(collection);
    } catch {}
    await this.client.createCollection(collection, {
      vectors: { size, distance: this.distance as any },
    });
  }

  async upsertPoints(
    points: { id: string | number; vector: number[]; payload?: any }[],
    collection = this.collection,
  ) {
    // qdrant-js сам батчит, но можно руками по 64
    return this.client.upsert(collection, { wait: true, points });
  }

  async search(
    vector: number[],
    topK: number,
    withPayload = true,
    filter?: any,
    collection = this.collection,
  ) {
    return this.client.search(collection, {
      vector,
      limit: topK,
      with_payload: withPayload,
      filter,
    });
  }

  async pointsCount(collection = this.collection): Promise<number> {
    const info = await this.client.getCollection(collection);
    return info?.points_count ?? 0; // ✅ поля на корне
  }
}
