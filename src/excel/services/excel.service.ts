import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import path from 'path';
import fs from 'fs';
import { UserServices } from 'src/auth/services/user.service';
import { ExcelHelpers } from '../helpers/excel.helpers';
import { readdir, stat, unlink } from 'fs/promises';

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);
  constructor(
    private readonly userServ: UserServices,
    private readonly excel: ExcelHelpers,
  ) {}

  async exportToExcel(): Promise<String> {
    const users = await this.userServ.getAll();

    const collator = new Intl.Collator('fa', {
      sensitivity: 'base',
      numeric: true,
      ignorePunctuation: true,
    });

    const sortedUsers = [...users].sort((a, b) =>
      collator.compare(a.fullName, b.fullName),
    );

    let data: string[][] = [];
    data.push(['کد ملی', 'نام و نام خانوادگی', 'شماره تلفن']);

    for (const user of sortedUsers) {
      data.push([user.ssn, user.fullName, user.phone]);
    }

    const dir = path.join(__dirname, '..', '..', '..', 'assets', 'excel');
    if (!fs.existsSync(dir))
      fs.mkdirSync(dir, { recursive: true });

    const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h
    const now = Date.now();
    
    const files = await readdir(dir);
    await Promise.all(
      files
        .filter((f) => f.endsWith('.xlsx'))
        .map(async (f) => {
          const p = path.join(dir, f);
          const { mtimeMs } = await stat(p);
          if (now - mtimeMs > MAX_AGE_MS) await unlink(p);
        }),
    );
    
    const excelResults = await this.excel.createExcelFile(data, dir);

    if (!excelResults) {
      this.logger.error('error creating excel');
      throw new InternalServerErrorException({
        code: 'ERROR_CREATING_EXCEL',
        message: 'error creating excel',
      });
    }

    return excelResults;
  }
}