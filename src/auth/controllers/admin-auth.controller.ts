import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { AdminService } from '../services/admin.service';
import { JwtPayload } from '../core/types';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuthGuard } from '../guards/admin.guard';
import { type AuthedRequest } from '../core/authed-request';

@Controller('auth')
export class AdminAuthController {
  constructor(
    private readonly adminServices: AdminService,
    private readonly jwt: JwtService,
  ) {}

  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: CreateAdminDto) {
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
