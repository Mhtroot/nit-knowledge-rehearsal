import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AdminAuthGuard } from '../../auth/guards/admin.guard';
import { NewsService } from '../services/news.service';
import { CreateNewsDto } from '../dto/create-news.dto';
import { UpdateNewsDto } from '../dto/update-news.dto';
import { NewsEntity } from '../core/types';
import { newsMulterOptions } from '../helpers/news-storage';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({
    summary: 'Create a news article with optional images (Admin only)',
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The news article has been successfully created.',
    type: NewsEntity,
  })
  @UseInterceptors(FilesInterceptor('images', 10, newsMulterOptions))
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createNewsDto: CreateNewsDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.newsService.create(createNewsDto, files);
  }

  @Get()
  @ApiOperation({ summary: 'Get all news articles' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all news articles with their images.',
    type: [NewsEntity],
  })
  findAll() {
    return this.newsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific news article by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The found news article.',
    type: NewsEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'News article not found.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({
    summary:
      'Update a news article and optionally attach new images (Admin only)',
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The news article has been successfully updated.',
    type: NewsEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'News article not found.',
  })
  @UseInterceptors(FilesInterceptor('images', 10, newsMulterOptions))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNewsDto: UpdateNewsDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.newsService.update(id, updateNewsDto, files);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({
    summary: 'Delete a news article and its images (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The news article has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'News article not found.',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.remove(id);
  }

  @Post(':id/images')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({
    summary:
      'Upload and append images to an existing news article (Admin only)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Images uploaded and attached to the news article.',
    type: NewsEntity,
  })
  @UseInterceptors(FilesInterceptor('images', 10, newsMulterOptions))
  addImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.newsService.addImages(id, files);
  }

  @Delete(':id/images/:imageId')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({
    summary: 'Delete a specific image from a news article (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Image deleted successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Image not found.',
  })
  removeImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.newsService.removeImage(id, imageId);
  }
}
