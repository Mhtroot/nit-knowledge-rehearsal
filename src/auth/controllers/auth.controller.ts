import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserServices } from '../services/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../dto/create-user.dto';
import { JwtPayload } from '../core/types';
import { AuthGuard } from '../guards/user.guard';
import { type AuthedRequest } from '../core/authed-request';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly userServices: UserServices,
    private readonly jwt: JwtService,
  ) {}

  @Post('user')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a participant user (SSN is optional)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered, returns JWT token.',
  })
  async createUser(@Body() data: CreateUserDto) {
    data.phone = data.phone.replace('+98', '0');
    if (data.phone.startsWith('98')) {
      data.phone = data.phone.replace('98', '0');
    }
    if (data.ssn && data.ssn.trim() === '') {
      delete data.ssn;
    }
    const result = await this.userServices.create(data);

    const payload: JwtPayload = {
      id: result.id,
      role: 'user',
    };

    return {
      token: await this.jwt.signAsync(payload),
    };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Validate user bearer token' })
  @Get('validate/user')
  validateUser(@Req() req: AuthedRequest) {
    return req.user.id;
  }
}
