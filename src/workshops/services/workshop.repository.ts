import { Injectable } from '@nestjs/common';
import { DbContextService } from 'src/db-context/db-context.service';
import { Prisma } from 'src/generated/prisma/client';
import { Workshop } from '../core/types';

@Injectable()
export class WorkshopRepository {
  constructor(private readonly dbContext: DbContextService) {}

  async create(data: Prisma.WorkshopCreateInput): Promise<Workshop> {
    return await this.dbContext.db.workshop.create({ data });
  }

  async getAll(): Promise<Workshop[]> {
    return await this.dbContext.db.workshop.findMany();
  }

  async getOne(id: number): Promise<Workshop | null> {
    return await this.dbContext.db.workshop.findFirst({
      where: { id },
    });
  }

  async update(
    id: number,
    data: Prisma.WorkshopUpdateInput,
  ): Promise<Workshop> {
    return await this.dbContext.db.workshop.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Workshop> {
    return await this.dbContext.db.workshop.delete({ where: { id } });
  }
}
