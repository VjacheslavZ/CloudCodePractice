import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { AdminGuard } from '../admin-auth/guards/admin.guard';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('admins')
  @ApiOperation({ summary: 'Add new admin account' })
  async createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto.email, dto.password);
  }

  @Get('admins')
  @ApiOperation({ summary: 'List all admin accounts' })
  async listAdmins() {
    return this.adminService.listAdmins();
  }
}
