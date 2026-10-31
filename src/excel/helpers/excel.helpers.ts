import exceljs from "exceljs";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class ExcelHelpers {
  private readonly logger = new Logger(ExcelHelpers.name);
  createExcelFile = async (rows: string[][], dir: string) => {
    try {
      const fileName = uuidv4() + '.xlsx';

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Sheet 1');

      rows.forEach((row) => {
        worksheet.addRow(row);
      });

      const path = `${dir}/${fileName}`;
      await workbook.xlsx.writeFile(path);

      return fileName;
    } catch (error) {
      this.logger.error(error);
    }
  };
}
