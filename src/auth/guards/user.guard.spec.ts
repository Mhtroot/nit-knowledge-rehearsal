import { ExecutionContext } from '@nestjs/common';
import { UserGuard } from './user.guard';
import { IamJwtService } from '../iam-jwt.service';

describe('UserGuard', () => {
  it('attaches the payload to the request', async () => {
    const payload = { id: 2, role: 'user' };
    const authenticate = jest.fn().mockResolvedValue(payload);
    const guard = new UserGuard({ authenticate } as unknown as IamJwtService);
    const request: Record<string, unknown> = {
      headers: { authorization: 'Bearer x' },
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(authenticate).toHaveBeenCalledWith('Bearer x', 'user');
    expect(request.user).toBe(payload);
  });
});
