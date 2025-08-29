/* eslint-disable @typescript-eslint/no-explicit-any */
export interface JsonlChunk {
  id: string; // исходный id строки (можно игнорить для Qdrant)
  text: string;
  metadata?: Record<string, any>;
}

export class IndexRequestDto {
  jsonl?: string; // прямой текст JSONL
  url?: string; // или URL откуда скачать JSONL
  collection?: string; // опционально переопределить коллекцию
  useNumericIds?: boolean; // true = 1..N, false = детермин. UUID v5
  batchSize?: number; // по-умолчанию 64
}

export class QueryRequestDto {
  question: string;
  topK?: number;
  maxChunks?: number;
  chunkSlice?: number;
  filters?: Record<string, any>; // Qdrant filter
}

export class EmbeddingDimsResponse {
  dims: number;
}
