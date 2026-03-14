import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @ApiOperation({ summary: 'Authenticate with Google OAuth2 token' })
  async googleAuth(@Body() dto: GoogleAuthDto) {
    return this.authService.googleLogin(dto.token);
  }

  @Post('apple')
  @ApiOperation({ summary: 'Authenticate with Apple (TODO)' })
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  async appleAuth() {
    // TODO: Implement Apple Sign-In — requires Apple Developer account
    return { message: 'Apple auth not yet implemented' };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@Req() req: { user: { id: string } }, @Body() dto: RefreshTokenDto) {
    await this.authService.logout(req.user.id, dto.refreshToken);
  }
}
