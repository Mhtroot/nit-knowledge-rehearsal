import { Module } from '@nestjs/common';
import { WorkshopRepository } from './services/workshop.repository';
import { WorkshopService } from './services/workshop.service';
import { WorkshopController } from './controllers/workshop.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [WorkshopRepository, WorkshopService],
  controllers: [WorkshopController],
})
export class WorkshopModule {}
