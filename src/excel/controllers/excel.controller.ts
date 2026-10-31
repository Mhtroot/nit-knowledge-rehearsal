import {
  Controller,
  Get,
  Header,
  Logger,
  Req,
  StreamableFile,
  UseGuards,
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
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="users.xlsx"')
  async exportAsExcel(@Req() req: AuthedRequest) {
    this.logger.log(
      `admin ${req.user!.id} is exporting users as an excel file`,
    );
    const buffer = await this.excelServ.exportToExcel();
    return new StreamableFile(buffer);
  }
}
