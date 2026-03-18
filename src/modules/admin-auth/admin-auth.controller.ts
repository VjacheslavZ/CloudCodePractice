import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentAdmin, AdminPayload } from '../../common/decorators/current-admin.decorator';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRefreshDto } from './dto/admin-refresh.dto';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private adminAuthService: AdminAuthService) {}

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Admin login with email and password' })
  async login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh admin tokens' })
  async refresh(@Body() dto: AdminRefreshDto) {
    return this.adminAuthService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin logout' })
  async logout(@CurrentAdmin() admin: AdminPayload, @Body() dto: AdminRefreshDto) {
    await this.adminAuthService.logout(admin.id, dto.refreshToken);
    return { message: 'Logged out successfully' };
  }
}
