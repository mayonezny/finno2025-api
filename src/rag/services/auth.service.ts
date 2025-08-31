import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { randomUUID } from 'crypto';
import * as qs from 'querystring';

type TokenResp = {
  access_token: string;
  expires_at?: string; // если приходит
  expires_in?: number; // или так (в секундах)
  token_type?: string; // обычно "Bearer"
};

@Injectable()
export class AuthService {
  private accessToken: string | null = null;
  private expiresAt: number = 0; // ms epoch
  private refreshPromise: Promise<string> | null = null;

  constructor(private readonly config: ConfigService) {}

  private isExpired(skewMs = 30_000) {
    return !this.accessToken || Date.now() + skewMs >= this.expiresAt;
  }

  private computeExpiry(t: TokenResp) {
    if (t.expires_at) {
      const ts = Date.parse(t.expires_at);
      if (!Number.isNaN(ts)) {
        return ts;
      }
    }
    if (t.expires_in) {
      return Date.now() + t.expires_in * 1000;
    }
    // запас: ровно час
    return Date.now() + 60 * 60 * 1000;
  }

  async fetchToken(): Promise<string> {
    const authUrl = this.config.get<string>('GIGACHAT_AUTH_URL')!;
    const scope = this.config.get<string>('GIGACHAT_SCOPE') || 'GIGACHAT_API_PERS';
    const secret = this.config.get<string>('GIGACHAT_SECRET')!;
    const rqUid = randomUUID();

    const data = qs.stringify({ scope });
    const res = await axios.post<TokenResp>(authUrl, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        RqUID: rqUid,
        Authorization: `Basic: ${secret}`,
      },
      // Если нужен mTLS/сертификаты — добавь httpsAgent здесь
    });

    const body = res.data;
    if (!body?.access_token) {
      throw new Error('OAuth: no access_token in response');
    }

    this.accessToken = body.access_token;
    this.expiresAt = this.computeExpiry(body);
    return this.accessToken;
  }

  async getToken(): Promise<string> {
    if (!this.isExpired()) {
      return this.accessToken!;
    }
    // дедупликация параллельных рефрешей
    if (!this.refreshPromise) {
      this.refreshPromise = this.fetchToken().finally(() => (this.refreshPromise = null));
    }
    return this.refreshPromise;
  }

  invalidateToken() {
    this.expiresAt = 0;
    this.accessToken = null;
  }
}
