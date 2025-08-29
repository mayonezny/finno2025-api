import { Body, Controller, Post } from '@nestjs/common';

import { IndexRequestDto, QueryRequestDto } from './rag.dto';
import { CorpusService } from './services/corpus.service';
import { EmbeddingsService } from './services/embeddings.service';
import { RagService } from './services/rag.service';

@Controller('rag')
export class RagController {
  constructor(
    private readonly emb: EmbeddingsService,
    private readonly corpus: CorpusService,
    private readonly rag: RagService,
  ) {}

  @Post('embedding-dims')
  async embeddingDims() {
    const dims = await this.emb.getEmbeddingDims();
    return { dims };
  }

  @Post('index')
  async index(@Body() dto: IndexRequestDto) {
    return this.corpus.indexJsonl(dto);
  }

  @Post('query')
  async query(@Body() dto: QueryRequestDto) {
    return this.rag.query(dto);
  }
}
