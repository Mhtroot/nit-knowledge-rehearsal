import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { UserServices } from 'src/auth/services/user.service';
import { ExcelHelpers } from '../helpers/excel.helpers';

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);
  constructor(
    private readonly userServ: UserServices,
    private readonly excel: ExcelHelpers,
  ) {}

  async exportToExcel(): Promise<Buffer> {
    const users = await this.userServ.getAll();

    const collator = new Intl.Collator('fa', {
      sensitivity: 'base',
      numeric: true,
      ignorePunctuation: true,
    });

    const sortedUsers = [...users].sort((a, b) =>
      collator.compare(a.fullName, b.fullName),
    );

    const data: string[][] = [];
    data.push([
      'کد ملی',
      'نام و نام خانوادگی',
      'شماره تلفن',
      'تعداد کودک',
      'تعداد نوجوان',
      'تعداد بزرگسال',
    ]);

    for (const user of sortedUsers) {
      data.push([
        user.ssn,
        user.fullName,
        user.phone,
        String(user.childCount ?? 0),
        String(user.teenageCount ?? 0),
        String(user.adultCount ?? 0),
      ]);
    }

    try {
      return await this.excel.createExcelBuffer(data);
    } catch (error) {
      this.logger.error('error creating excel', error);
      throw new InternalServerErrorException({
        code: 'ERROR_CREATING_EXCEL',
        message: 'error creating excel',
      });
    }
  }
}
