import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthedRequest } from '../authed-request';
import { IamJwtService } from '../iam-jwt.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly iamJwt: IamJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    request.user = await this.iamJwt.authenticate(
      request.headers.authorization,
      'admin',
    );
    return true;
  }
}
