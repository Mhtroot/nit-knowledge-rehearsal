import exceljs from "exceljs";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class ExcelHelpers {
  private readonly logger = new Logger(ExcelHelpers.name);

  async createExcelBuffer(rows: string[][]): Promise<Buffer> {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Sheet 1');

    rows.forEach((row) => {
      worksheet.addRow(row);
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
