import { Module } from '@nestjs/common';
import { IamJwtService } from './iam-jwt.service';
import { AdminGuard } from './guards/admin.guard';
import { UserGuard } from './guards/user.guard';

@Module({
  providers: [IamJwtService, AdminGuard, UserGuard],
  exports: [IamJwtService, AdminGuard, UserGuard],
})
export class AuthModule {}
