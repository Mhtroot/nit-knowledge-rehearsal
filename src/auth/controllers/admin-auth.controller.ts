import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { AdminService } from '../services/admin.service';
import { JwtPayload } from '../core/types';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuthGuard } from '../guards/admin.guard';
import { type AuthedRequest } from '../core/authed-request';
import { comparePassword, hashPassword } from '../helper/password.helper';

@Controller('auth')
export class AdminAuthController {
  constructor(
    private readonly adminServices: AdminService,
    private readonly jwt: JwtService,
  ) { }

  @Post('login/admin')
  async login(@Body() data: CreateAdminDto) {
    const admin = await this.adminServices.getByUsername(data.username);

    if (!comparePassword(data.password, admin.password)) {
      throw new BadRequestException({
        code: 'INCORRECT_USERNAME_OR_PASSWORD',
        message: 'incorrect username or password',
      });
    }

    const payload: JwtPayload = {
      id: admin.id,
      role: 'admin',
    };

    return {
      token: await this.jwt.signAsync(payload),
    };
  }

  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: CreateAdminDto) {
    const hash = hashPassword(data.password);
    data.password = hash;
    const result = await this.adminServices.create(data);

    const payload: JwtPayload = {
      id: result.id,
      role: 'admin',
    };

    return {
      token: await this.jwt.signAsync(payload),
    };
  }

  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Get('validate/admin')
  validate(@Req() req: AuthedRequest) {
    return req.user.id;
  }
}
