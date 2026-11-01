import { Injectable } from '@nestjs/common';
import { DbContextService } from 'src/db-context/db-context.service';
import { NewsImageCreateInput } from 'src/generated/prisma/models';
import { NewsImageEntity } from '../core/types';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class NewsImageRepository {
  constructor(private readonly dbContext: DbContextService) {}

  async create(newsId: number, path: string): Promise<NewsImageEntity> {
    return await this.dbContext.db.newsImage.create({
      data: {
        newsId,
        path,
      },
    });
  }

  async get(imageId: number, newsId: number): Promise<NewsImageEntity | null> {
    return this.dbContext.db.newsImage.findFirst({
      where: { id: imageId, newsId },
    });
  }

  async delete(id: number): Promise<any> {
    return await this.dbContext.db.newsImage.delete({
      where: { id },
    });
  }
}
