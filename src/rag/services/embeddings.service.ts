import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v5 as uuidv5 } from 'uuid';

import { GigaHttpService } from './giga-http.service';

@Injectable()
export class EmbeddingsService {
  private embModel: string;
  private chatModel: string;

  constructor(
    private readonly config: ConfigService,
    private readonly http: GigaHttpService,
  ) {
    this.embModel = this.config.get<string>('GIGACHAT_EMB_MODEL')!;
    this.chatModel = this.config.get<string>('GIGACHAT_CHAT_MODEL')!;
  }

  async getEmbeddingDims(): Promise<number> {
    const body = { model: this.embModel, input: 'probe' };
    const res = await this.http.axios.post('/embeddings', body);
    const emb = res?.data?.data?.[0]?.embedding;
    if (!Array.isArray(emb)) {
      throw new Error('Embedding probe failed');
    }
    return emb.length;
  }

  async embedText(text: string): Promise<number[]> {
    const body = { model: this.embModel, input: text };
    const res = await this.http.axios.post('/embeddings', body);
    const emb = res?.data?.data?.[0]?.embedding;
    if (!Array.isArray(emb)) {
      throw new Error('Bad embedding response');
    }
    return emb;
  }

  async chatWithContext(
    prompt: string,
    system = 'Ты финансовый аналитик. Отвечай только на основе предоставленного контекста. Если данных нет — скажи об этом. На заданный вопрос ответь своим мнением, аргументируй его,. Если вопрос подразумевает "Да" или "Нет" в своем ответе, скажи "Да", или "Нет", и аргументируй почему. Если  не подразумевает - отвечай на конкретный вопрос',
  ): Promise<string> {
    const body = {
      model: this.chatModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    };
    const res = await this.http.axios.post('/chat/completions', body);
    const c =
      res?.data?.choices?.[0]?.message?.content ??
      res?.data?.choices?.[0]?.text ??
      res?.data?.output_text ??
      null;
    if (!c) {
      throw new Error('No content in chat response');
    }
    return c;
  }

  toUUIDv5(srcId: string): string {
    return uuidv5(srcId, uuidv5.URL);
  }
}
