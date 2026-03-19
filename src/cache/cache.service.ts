import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class CacheService implements OnModuleInit {
  private client: ReturnType<typeof createClient> | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.REDIS_CACHE === 'true';
  }

  async onModuleInit() {
    if (this.enabled) {
      await this.initializeClient();
    }
  }

  private async initializeClient() {
    try {
      const redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        console.warn('REDIS_URL not set in environment');
        this.enabled = false;
        return;
      }

      this.client = createClient({
        url: redisUrl,
      });

      this.client.on('error', (err) => {
        console.warn('Redis cache error:', err.message);
        this.enabled = false;
      });

      await this.client.connect();
      console.log('✓ Redis cache connected (Upstash)');
    } catch (err) {
      console.warn('Redis cache unavailable:', err?.message);
      this.enabled = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.enabled || !this.client) return null;
    try {
      return await this.client.get(key);
    } catch (err) {
      console.warn('Cache get error:', err?.message);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.enabled || !this.client) return;
    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (err) {
      console.warn('Cache set error:', err?.message);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.enabled || !this.client) return;
    try {
      await this.client.del(key);
    } catch (err) {
      console.warn('Cache delete error:', err?.message);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.enabled || !this.client) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (err) {
      console.warn('Cache exists error:', err?.message);
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.disconnect();
    }
  }
}
