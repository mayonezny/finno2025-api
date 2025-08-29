/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import axios from 'axios';

@Injectable()
export class VectorStoreService {
  private client: QdrantClient;
  private collection;
  private url;
  private distance;

  constructor(private readonly config: ConfigService) {
    this.url = this.config.get('QDRANT_URL');
    this.client = new QdrantClient({ url: this.url });
    this.collection = this.config.get('QDRANT_COLLECTION') || 'pirozhki';
    this.distance = this.config.get('QDRANT_DISTANCE') || 'Cosine';
    this.waitForQdrantReady();
  }

  private async waitForQdrantReady(timeoutMs = 60000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        await axios.get(`${this.url}/collections`, { timeout: 2000 });
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    throw new Error('Qdrant is not ready after timeout');
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
