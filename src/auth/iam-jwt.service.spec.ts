import crypto from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { IamJwtService } from './iam-jwt.service';

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const sign = (payload: Record<string, unknown>): string => {
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const data = `${header}.${body}`;
  return `${data}.${crypto.sign('sha256', Buffer.from(data), privateKey).toString('base64url')}`;
};

const token = (role: string) =>
  sign({
    id: 1,
    role,
    type: 'access',
    iat: 0,
    exp: Math.floor(Date.now() / 1000) + 60,
  });

describe('IamJwtService', () => {
  let service: IamJwtService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    service = new IamJwtService();
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ publicKey }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('authenticates a valid token and caches the key', async () => {
    const header = `Bearer ${token('admin')}`;
    await expect(service.authenticate(header, 'admin')).resolves.toMatchObject({
      id: 1,
    });
    await service.authenticate(header, 'admin');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a missing bearer token', async () => {
    await expect(service.authenticate(undefined, 'user')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a token with the wrong role', async () => {
    await expect(
      service.authenticate(`Bearer ${token('user')}`, 'admin'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('does not cache an empty key response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });
    await expect(service.getPublicKey('admin')).rejects.toThrow();
    await expect(service.getPublicKey('admin')).resolves.toBe(publicKey);
  });
});
