import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbContextModule } from './db-context/db-context.module';
import { AuthModule } from './auth/auth.module';
import { ExcelModule } from './excel/excel.module';

@Module({
  imports: [DbContextModule, AuthModule, ExcelModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
