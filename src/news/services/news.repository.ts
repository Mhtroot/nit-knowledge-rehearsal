import { Injectable } from '@nestjs/common';
import { DbContextService } from 'src/db-context/db-context.service';
import { Prisma } from 'src/generated/prisma/client';
import { NewsEntity } from '../core/types';

@Injectable()
export class NewsRepository {
  constructor(private readonly dbContext: DbContextService) {}

  async create(data: Prisma.NewsCreateInput): Promise<NewsEntity> {
    return await this.dbContext.db.news.create({
      data,
      include: {
        images: true,
      },
    });
  }

  async getAll(): Promise<NewsEntity[]> {
    return this.dbContext.db.news.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        images: true,
      },
    });
  }

  async getById(id: number): Promise<NewsEntity | null> {
    return this.dbContext.db.news.findUnique({
      where: { id },
      include: {
        images: true,
      },
    });
  }

  async update(id: number, data: Prisma.NewsUpdateInput): Promise<NewsEntity> {
    return await this.dbContext.db.news.update({
      where: { id },
      data,
      include: {
        images: true,
      },
    });
  }

  async delete(id: number): Promise<any> {
    return await this.dbContext.db.news.delete({
      where: { id },
    });
  }
}
