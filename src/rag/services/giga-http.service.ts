import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

import { AuthService } from './auth.service';

@Injectable()
export class GigaHttpService {
  private client: AxiosInstance;

  constructor(
    private readonly config: ConfigService,
    private readonly auth: AuthService,
  ) {
    this.client = axios.create({
      baseURL: this.config.get<string>('GIGACHAT_URL'),
      timeout: 60_000,
    });

    // attach Authorization header
    this.client.interceptors.request.use(async (req) => {
      const token = await this.auth.getToken();
      req.headers = req.headers || {};
      req.headers['Authorization'] = `Bearer ${token}`;
      return req;
    });

    // 401 refresh + retry once
    this.client.interceptors.response.use(
      (res) => res,
      async (error: AxiosError) => {
        const original = error.config as AxiosRequestConfig & { __retry?: boolean };
        if (error.response?.status === 401 && !original?.__retry) {
          try {
            this.auth.invalidateToken();
            await this.auth.getToken(); // refresh
            original.__retry = true;
            original.headers = original.headers || {};
            original.headers['Authorization'] = `Bearer ${await this.auth.getToken()}`;
            return this.client.request(original);
          } catch (e) {
            return Promise.reject(e);
          }
        }
        return Promise.reject(error);
      },
    );
  }

  get axios() {
    return this.client;
  }
}
