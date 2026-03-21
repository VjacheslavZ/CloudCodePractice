import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class ContentCacheService {
  private redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis(this.configService.get<string>('REDIS_URL')!);
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', CACHE_TTL);
  }

  async invalidate(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await this.redis.del(...keys);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
