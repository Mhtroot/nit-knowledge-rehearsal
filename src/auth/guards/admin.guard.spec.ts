import { ExecutionContext } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { IamJwtService } from '../iam-jwt.service';

describe('AdminGuard', () => {
  it('attaches the payload to the request', async () => {
    const payload = { id: 1, role: 'admin' };
    const authenticate = jest.fn().mockResolvedValue(payload);
    const guard = new AdminGuard({ authenticate } as unknown as IamJwtService);
    const request: Record<string, unknown> = {
      headers: { authorization: 'Bearer x' },
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(authenticate).toHaveBeenCalledWith('Bearer x', 'admin');
    expect(request.user).toBe(payload);
  });
});
