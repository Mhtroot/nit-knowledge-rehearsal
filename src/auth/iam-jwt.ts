import crypto from 'crypto';

export interface JwtPayload {
  id: number;
  username?: string;
  phone?: string;
  role: 'admin' | 'user';
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export type Role = 'admin' | 'user';

export const extractBearerToken = (authHeader?: string): string | null =>
  authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]?.trim() || null
    : null;

export const verifyToken = (
  token: string,
  publicKey: string,
): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;
    const data = `${headerB64}.${payloadB64}`;
    const valid = crypto.verify(
      'sha256',
      Buffer.from(data),
      publicKey,
      Buffer.from(signatureB64, 'base64url'),
    );
    if (!valid) return null;
    const payload: JwtPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8'),
    );
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
};

export const validateAdminJWT = (
  token: string,
  publicKey: string,
): JwtPayload | null => {
  const payload = verifyToken(token, publicKey);
  return payload && payload.type === 'access' && payload.role === 'admin'
    ? payload
    : null;
};

export const validateUserJWT = (
  token: string,
  publicKey: string,
): JwtPayload | null => {
  const payload = verifyToken(token, publicKey);
  return payload && payload.type === 'access' && payload.role === 'user'
    ? payload
    : null;
};
