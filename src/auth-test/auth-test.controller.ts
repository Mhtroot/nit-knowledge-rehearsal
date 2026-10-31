import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { type AuthedRequest } from '../auth/authed-request';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UserGuard } from '../auth/guards/user.guard';

@Controller()
export class AuthTestController {
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Get('admin/me')
  adminMe(@Req() req: AuthedRequest) {
    return req.user;
  }

  @ApiBearerAuth()
  @UseGuards(UserGuard)
  @Get('user/me')
  userMe(@Req() req: AuthedRequest) {
    return req.user;
  }
}
