import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ExcelHelpers } from './helpers/excel.helpers';
import { ExcelService } from './services/excel.service';
import { ExcelController } from './controllers/excel.controller';

@Module({
  imports: [AuthModule],
  providers: [ExcelHelpers, ExcelService],
  controllers: [ExcelController],
})
export class ExcelModule {}
