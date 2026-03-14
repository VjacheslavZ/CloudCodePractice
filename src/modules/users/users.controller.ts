import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: { user: { id: string } }) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@Req() req: { user: { id: string } }, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete current user account' })
  async deleteAccount(@Req() req: { user: { id: string } }) {
    await this.usersService.deleteAccount(req.user.id);
  }
}
