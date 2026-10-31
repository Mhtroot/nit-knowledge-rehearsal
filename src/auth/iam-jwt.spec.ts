import crypto from 'crypto';
import {
  extractBearerToken,
  validateAdminJWT,
  validateUserJWT,
  verifyToken,
} from './iam-jwt';

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

const claims = (over: Record<string, unknown> = {}) => ({
  id: 1,
  username: 'admin',
  role: 'admin',
  type: 'access',
  iat: 0,
  exp: Math.floor(Date.now() / 1000) + 60,
  ...over,
});

describe('iam-jwt', () => {
  it('accepts a valid access token', () => {
    expect(validateAdminJWT(sign(claims()), publicKey)?.id).toBe(1);
  });

  it('rejects a refresh token', () => {
    expect(
      validateAdminJWT(sign(claims({ type: 'refresh' })), publicKey),
    ).toBeNull();
  });

  it('rejects wrong role for the guard', () => {
    expect(
      validateAdminJWT(sign(claims({ role: 'user' })), publicKey),
    ).toBeNull();
    expect(
      validateUserJWT(sign(claims({ role: 'user' })), publicKey),
    ).not.toBeNull();
  });

  it('rejects an expired token', () => {
    expect(validateAdminJWT(sign(claims({ exp: 1 })), publicKey)).toBeNull();
  });

  it('rejects a tampered payload', () => {
    const token = sign(claims());
    const [h, , s] = token.split('.');
    const forged = Buffer.from(JSON.stringify(claims({ id: 999 }))).toString(
      'base64url',
    );
    expect(verifyToken(`${h}.${forged}.${s}`, publicKey)).toBeNull();
  });

  it('rejects a token signed by another key', () => {
    const other = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const header = Buffer.from(
      JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
    ).toString('base64url');
    const body = Buffer.from(JSON.stringify(claims())).toString('base64url');
    const sig = crypto
      .sign('sha256', Buffer.from(`${header}.${body}`), other.privateKey)
      .toString('base64url');
    expect(verifyToken(`${header}.${body}.${sig}`, publicKey)).toBeNull();
  });

  it('extracts bearer tokens', () => {
    expect(extractBearerToken('Bearer abc')).toBe('abc');
    expect(extractBearerToken('Basic abc')).toBeNull();
    expect(extractBearerToken(undefined)).toBeNull();
  });
});
