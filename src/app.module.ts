import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbContextModule } from './db-context/db-context.module';
import { AuthModule } from './auth/auth.module';
import { AuthTestModule } from './auth-test/auth-test.module';

@Module({
  imports: [DbContextModule, AuthModule, AuthTestModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
