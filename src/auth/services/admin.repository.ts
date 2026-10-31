import { Injectable } from '@nestjs/common';
import { DbContextService } from 'src/db-context/db-context.service';
import { Prisma } from 'src/generated/prisma/client';
import { Admin } from '../core/types';

@Injectable()
export class AdminRepository {
  constructor(private readonly dbContext: DbContextService) {}

  async create(data: Prisma.AdminCreateInput): Promise<Admin> {
    return this.dbContext.db.admin.create({ data });
  }

  async getByUsername(username: string): Promise<Admin | null> {
    return this.dbContext.db.admin.findFirst({ where: { username } });
  }
}
