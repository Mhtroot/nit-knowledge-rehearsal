import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbContextModule } from './db-context/db-context.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [DbContextModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
