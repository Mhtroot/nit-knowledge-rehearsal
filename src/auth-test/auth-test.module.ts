import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthTestController } from './auth-test.controller';

@Module({ imports: [AuthModule], controllers: [AuthTestController] })
export class AuthTestModule {}
