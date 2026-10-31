import { Global, Module } from '@nestjs/common';
import { DbContextService } from './db-context.service';

@Global()
@Module({
  providers: [DbContextService],
  exports: [DbContextService],
})
export class DbContextModule {}
