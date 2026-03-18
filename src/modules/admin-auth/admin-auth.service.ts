import { randomUUID } from 'crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';

import { PrismaService } from '../../prisma/prisma.service';

export interface AdminTokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AdminAuthService {
  private redis: Redis;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.redis = new Redis(this.configService.get<string>('REDIS_URL')!);
  }

  async login(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(admin.id, admin.email);

    return {
      ...tokens,
      admin: {
        id: admin.id,
        email: admin.email,
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<AdminTokenPair> {
    let payload: { sub: string; email: string; type: string; tokenId: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'admin') {
      throw new UnauthorizedException('Invalid refresh token type');
    }

    const storedToken = await this.redis.get(`admin-refresh:${payload.sub}:${payload.tokenId}`);
    if (!storedToken) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    await this.redis.del(`admin-refresh:${payload.sub}:${payload.tokenId}`);

    return this.generateTokens(payload.sub, payload.email);
  }

  async logout(adminId: string, refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify<{ sub: string; tokenId: string }>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      await this.redis.del(`admin-refresh:${payload.sub}:${payload.tokenId}`);
    } catch {
      // Token already invalid, that's fine
    }
  }

  private async generateTokens(adminId: string, email: string): Promise<AdminTokenPair> {
    const tokenId = randomUUID();

    const accessToken = this.jwtService.sign(
      { sub: adminId, email, type: 'admin' },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<number>('JWT_ACCESS_EXPIRY_SECONDS', 900),
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: adminId, email, type: 'admin', tokenId },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<number>('JWT_REFRESH_EXPIRY_SECONDS', 2592000),
      },
    );

    const refreshTtl = this.configService.get<number>('JWT_REFRESH_EXPIRY_SECONDS', 2592000);
    await this.redis.set(`admin-refresh:${adminId}:${tokenId}`, '1', 'EX', refreshTtl);

    return { accessToken, refreshToken };
  }
}
