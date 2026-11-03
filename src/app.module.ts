import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbContextModule } from './db-context/db-context.module';
import { AuthModule } from './auth/auth.module';
import { ExcelModule } from './excel/excel.module';
import { NewsModule } from './news/news.module';
import { WorkshopModule } from './workshops/workshop.module';

@Module({
  imports: [DbContextModule, AuthModule, ExcelModule, NewsModule, WorkshopModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
