import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NewsImageRepository } from './news-image.repository';
import { deleteImageFile } from '../helpers/news-storage';
import { NewsImageEntity } from '../core/types';

@Injectable()
export class NewsImageService {
  private readonly logger = new Logger(NewsImageService.name);

  constructor(private readonly repo: NewsImageRepository) {}

  async createMany(newsId: number, files: Express.Multer.File[]) {
    this.logger.log(`images are being add to news with id ${newsId}`);

    // let result: NewsImageEntity[] = [];
    try {
      for (const file of files)
        await this.repo.create(newsId, `/assets/images/${file.filename}`);

      this.logger.log(`all images has been added to article ${newsId}`);
      return;
    } catch (error) {
      this.logger.error(`Failed to upload images for news ${newsId}`, error);
      await Promise.all(files.map((file) => deleteImageFile(file.filename)));
      throw new InternalServerErrorException({
        code: 'IMAGE_UPLOAD_FAILED',
        message: `Failed to add images to news article ${newsId}`,
      });
    }
  }

  async getOne(imageId: number, newsId: number) {
    const image = await this.repo.get(imageId, newsId);

    if (!image) {
      throw new NotFoundException({
        code: 'IMAGE_NOT_FOUND',
        message: `Image with ID ${imageId} not found for news article ${newsId}`,
      });
    }

    return image;
  }

  async delete(id: number) {
    this.logger.log(`image with id ${id} is being deleted`);
    return this.repo.delete(id);
  }
}
