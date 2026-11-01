import { Module } from '@nestjs/common';
import { NewsService } from './services/news.service';
import { NewsController } from './controllers/news.controller';
import { AuthModule } from '../auth/auth.module';
import { NewsRepository } from './services/news.repository';
import { NewsImageRepository } from './services/news-image.repository';
import { NewsImageService } from './services/news-image.service';

@Module({
  imports: [AuthModule],
  controllers: [NewsController],
  providers: [NewsService, NewsRepository, NewsImageRepository, NewsImageService],
  exports: [NewsService],
})
export class NewsModule {}
