import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserAuthRepository } from './services/user-auth.repository';
import { UserServices } from './services/user.service';
import { AuthGuard } from './guards/user.guard';
import { AuthController } from './controllers/auth.controller';
import { AdminRepository } from './services/admin.repository';
import { AdminService } from './services/admin.service';
import { AdminAuthController } from './controllers/admin-auth.controller';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [UserAuthRepository, UserServices, AuthGuard, AdminRepository, AdminService],
  exports: [UserServices],
  controllers: [AuthController, AdminAuthController],
})
export class AuthModule {}
