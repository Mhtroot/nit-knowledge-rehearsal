import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateNewsDto } from '../dto/create-news.dto';
import { UpdateNewsDto } from '../dto/update-news.dto';
import { deleteImageFile } from '../helpers/news-storage';
import { NewsRepository } from './news.repository';
import { NewsImageService } from './news-image.service';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(private readonly repo: NewsRepository, private readonly imageService: NewsImageService) {}

  async create(createNewsDto: CreateNewsDto, files?: Express.Multer.File[]) {
    try {
      const imagesCreate =
        files && files.length > 0
          ? {
              create: files.map((file) => ({
                path: `/assets/images/${file.filename}`,
              })),
            }
          : undefined;

      return this.repo.create({ ...createNewsDto, images: imagesCreate });
    } catch (error) {
      this.logger.error('Failed to create news', error);
      if (files && files.length > 0) {
        await Promise.all(files.map((file) => deleteImageFile(file.filename)));
      }
      throw new InternalServerErrorException({
        code: 'NEWS_CREATE_FAILED',
        message: 'Failed to create news article',
      });
    }
  }

  async findAll() {
    return await this.repo.getAll();
  }

  async findOne(id: number) {
    const news = await this.repo.getById(id);

    if (!news) {
      throw new NotFoundException({
        code: 'NEWS_NOT_FOUND',
        message: `News article with ID ${id} not found`,
      });
    }

    return news;
  }

  async update(
    id: number,
    updateNewsDto: UpdateNewsDto,
    files?: Express.Multer.File[],
  ) {
    await this.findOne(id);

    try {
      if (files && files.length > 0) {
        await this.imageService.createMany(id, files)
      }

      const { images: _ignored, ...data } = updateNewsDto;

      return this.repo.update(id, data)
    } catch (error) {
      this.logger.error(`Failed to update news ${id}`, error);
      if (files && files.length > 0) {
        await Promise.all(files.map((file) => deleteImageFile(file.filename)));
      }
      throw new InternalServerErrorException({
        code: 'NEWS_UPDATE_FAILED',
        message: `Failed to update news article with ID ${id}`,
      });
    }
  }

  async remove(id: number) {
    const news = await this.findOne(id);

    if (news.images && news.images.length > 0) {
      await Promise.all(news.images.map((img) => deleteImageFile(img.path)));
    }

    await this.repo.delete(id);

    return {
      message: `News article with ID ${id} deleted successfully`,
      id,
    };
  }

  async addImages(id: number, files: Express.Multer.File[]) {
    await this.findOne(id);

    if (!files || files.length === 0) {
      throw new BadRequestException({
        code: 'NO_FILES_UPLOADED',
        message: 'No image files were provided for upload',
      });
    }

    await this.imageService.createMany(id, files);
    return await this.findOne(id);
  }

  async removeImage(newsId: number, imageId: number) {
    const image = await this.imageService.getOne(imageId, newsId);

    await deleteImageFile(image.path);

    await this.imageService.delete(imageId);

    return {
      message: `Image with ID ${imageId} deleted successfully`,
      imageId,
      newsId,
    };
  }
}
