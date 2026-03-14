import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      emails: Array<{ value: string }>;
      displayName: string;
      photos: Array<{ value: string }>;
    },
    done: VerifyCallback,
  ): void {
    const user = {
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value || null,
    };
    done(null, user);
  }
}
