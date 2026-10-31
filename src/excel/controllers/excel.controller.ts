import {
  Controller,
  Delete,
  Get,
  Logger,
  Req,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { type AuthedRequest } from 'src/auth/core/authed-request';
import { AdminAuthGuard } from 'src/auth/guards/admin.guard';
import { ExcelService } from '../services/excel.service';

@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('export')
export class ExcelController {
  private readonly logger = new Logger(ExcelController.name);
  constructor(private readonly excelServ: ExcelService) {}

  @Get()
  async exportAsExcel(@Req() req: AuthedRequest) {
    this.logger.log(
      `admin ${req.user!.id} is exporting users as an excel file`,
    );
    return await this.excelServ.exportToExcel();
  }
}
