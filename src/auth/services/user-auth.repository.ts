import { Injectable } from '@nestjs/common';
import { DbContextService } from 'src/db-context/db-context.service';
import { Prisma } from 'src/generated/prisma/client';
import { User } from '../core/types';

@Injectable()
export class UserAuthRepository {
  constructor(private readonly dbContext: DbContextService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return await this.dbContext.db.user.create({ data });
  }

  async getById(id: number): Promise<User | null> {
    return await this.dbContext.db.user.findFirst({ where: { id } });
  }

  async getBySsn(ssn: string): Promise<User | null> {
    return await this.dbContext.db.user.findUnique({ where: { ssn } });
  }

  async getAll(): Promise<User[]> {
    return await this.dbContext.db.user.findMany();
  }
}
