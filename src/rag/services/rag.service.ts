/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EmbeddingsService } from './embeddings.service';
import { VectorStoreService } from './vector-store.service';
import { QueryRequestDto } from '../rag.dto';

@Injectable()
export class RagService {
  constructor(
    private readonly emb: EmbeddingsService,
    private readonly vs: VectorStoreService,
    private readonly config: ConfigService,
  ) {}

  private buildContext(hits: any[], maxChunks: number, slice: number): string {
    const parts: string[] = [];
    for (const h of hits.slice(0, maxChunks)) {
      const section = h?.payload?.section ?? 'unknown';
      const text = (h?.payload?.text ?? '').replace(/\s+/g, ' ').slice(0, slice);
      parts.push(`[${section}] ${text}`);
    }
    return parts.join('\n\n---\n\n');
  }

  private buildPrompt(question: string, context: string): string {
    return `Вопрос: ${question}

Контекст:
${context}

Ответ:`;
  }

  async query(dto: QueryRequestDto) {
    const topK = dto.topK ?? parseInt(this.config.get('RAG_TOP_K') || '8', 10);
    const maxChunks = dto.maxChunks ?? parseInt(this.config.get('RAG_MAX_CHUNKS') || '6', 10);
    const slice = dto.chunkSlice ?? parseInt(this.config.get('RAG_CHUNK_SLICE') || '700', 10);

    const qvec = await this.emb.embedText(dto.question);
    const hits = await this.vs.search(qvec, topK, true, dto.filters);
    const context = this.buildContext(hits, maxChunks, slice);
    const prompt = this.buildPrompt(dto.question, context);
    const answer = await this.emb.chatWithContext(prompt);

    return { hits: hits.length, context, answer };
  }
}
