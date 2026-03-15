import { randomUUID } from 'crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { addDays } from 'date-fns';
import Redis from 'ioredis';

import { PrismaService } from '../../prisma/prisma.service';

interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private redis: Redis;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.redis = new Redis(this.configService.get<string>('REDIS_URL')!);
  }

  async validateGoogleToken(token: string): Promise<GoogleProfile> {
    const { OAuth2Client } = await import('google-auth-library');
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID')!;
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET')!;
    const client = new OAuth2Client(clientId, clientSecret, 'postmessage');

    // Try as authorization code first (from web @react-oauth/google),
    // fall back to ID token verification (from mobile)
    try {
      const { tokens } = await client.getToken(token);
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      return {
        googleId: payload.sub,
        email: payload.email!,
        name: payload.name || payload.email!,
        avatarUrl: payload.picture || null,
      };
    } catch {
      // Not an auth code — try as a raw ID token (mobile flow)
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      return {
        googleId: payload.sub,
        email: payload.email!,
        name: payload.name || payload.email!,
        avatarUrl: payload.picture || null,
      };
    }
  }

  async googleLogin(idToken: string) {
    const profile = await this.validateGoogleToken(idToken);

    let user = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
      include: { subscription: true },
    });

    const isNewUser = !user;

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
          googleId: profile.googleId,
          subscription: {
            create: {
              status: 'TRIALING',
              trialStartedAt: new Date(),
              trialEndsAt: addDays(new Date(), 7),
            },
          },
        },
        include: { subscription: true },
      });
    }

    const tokens = await this.generateTokens(user.id);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        nativeLanguage: user.nativeLanguage,
        xpTotal: user.xpTotal,
        currentStreak: user.currentStreak,
      },
      isNewUser,
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: string; tokenId: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken = await this.redis.get(`refresh:${payload.sub}:${payload.tokenId}`);
    if (!storedToken) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    await this.redis.del(`refresh:${payload.sub}:${payload.tokenId}`);

    return this.generateTokens(payload.sub);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify<{ sub: string; tokenId: string }>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      await this.redis.del(`refresh:${payload.sub}:${payload.tokenId}`);
    } catch {
      // Token already invalid, that's fine
    }
  }

  private async generateTokens(userId: string): Promise<TokenPair> {
    const tokenId = randomUUID();

    const accessToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<number>('JWT_ACCESS_EXPIRY_SECONDS', 900),
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, tokenId },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<number>('JWT_REFRESH_EXPIRY_SECONDS', 2592000),
      },
    );

    const refreshTtl = this.configService.get<number>('JWT_REFRESH_EXPIRY_SECONDS', 2592000);
    await this.redis.set(`refresh:${userId}:${tokenId}`, '1', 'EX', refreshTtl);

    return { accessToken, refreshToken };
  }
}
