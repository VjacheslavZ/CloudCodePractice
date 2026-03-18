import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async createAdmin(email: string, password: string) {
    const existing = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('Admin with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const admin = await this.prisma.admin.create({
      data: { email, passwordHash },
    });

    return {
      id: admin.id,
      email: admin.email,
      createdAt: admin.createdAt,
    };
  }

  async listAdmins() {
    return this.prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
