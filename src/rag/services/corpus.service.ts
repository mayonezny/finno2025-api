/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import axios from 'axios';

import { EmbeddingsService } from './embeddings.service';
import { VectorStoreService } from './vector-store.service';
import { JsonlChunk, IndexRequestDto } from '../rag.dto';

@Injectable()
export class CorpusService {
  constructor(
    private readonly emb: EmbeddingsService,
    private readonly vs: VectorStoreService,
  ) {}

  private *iterJsonl(text: string): Generator<JsonlChunk> {
    for (const line of text.split(/\r?\n/)) {
      const l = line.trim();
      if (!l) {
        continue;
      }
      const obj = JSON.parse(l);
      if (obj?.text) {
        yield obj as JsonlChunk;
      }
    }
  }

  async indexJsonl(dto: IndexRequestDto) {
    const batchSize = dto.batchSize ?? 64;
    let jsonl = dto.jsonl || '';
    if (dto.url) {
      const res = await axios.get(dto.url, { responseType: 'text' });
      jsonl = res.data;
    }
    if (!jsonl) {
      throw new Error('No JSONL provided');
    }

    // 1) проверяем/узнаём размер и пересоздаём коллекцию
    const dims = await this.emb.getEmbeddingDims();
    await this.vs.recreateCollection(dims, dto.collection);

    // 2) построчно эмбеддинг → upsert батчами
    const points: { id: number | string; vector: number[]; payload: any }[] = [];
    let i = 1;

    for (const chunk of this.iterJsonl(jsonl)) {
      const vector = await this.emb.embedText(chunk.text);
      const payload = { ...(chunk.metadata || {}), text: chunk.text, src_id: chunk.id };

      const id = dto.useNumericIds ? i : this.emb.toUUIDv5(chunk.id || `row-${i}`);

      points.push({ id, vector, payload });
      i++;

      if (points.length >= batchSize) {
        await this.vs.upsertPoints(points, dto.collection);
        points.length = 0;
      }
    }
    if (points.length) {
      await this.vs.upsertPoints(points, dto.collection);
    }
    const count = await this.vs.pointsCount(dto.collection);
    return { ok: true, points: count, dims };
  }
}
