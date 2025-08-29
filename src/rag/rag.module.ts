import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import axios from 'axios';

import { RagController } from './rag.controller';
import { AuthService } from './services/auth.service';
import { CorpusService } from './services/corpus.service';
import { EmbeddingsService } from './services/embeddings.service';
import { GigaHttpService } from './services/giga-http.service';
import { RagService } from './services/rag.service';
import { VectorStoreService } from './services/vector-store.service';

@Module({
  imports: [ConfigModule],
  controllers: [RagController],
  providers: [
    AuthService,
    GigaHttpService,
    EmbeddingsService,
    VectorStoreService,
    RagService,
    CorpusService,
    { provide: 'AXIOS', useValue: axios },
  ],
})
export class RagModule {}
