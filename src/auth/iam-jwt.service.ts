import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  extractBearerToken,
  JwtPayload,
  Role,
  validateAdminJWT,
  validateUserJWT,
} from './iam-jwt';

@Injectable()
export class IamJwtService {
  private readonly keyCache: Partial<Record<Role, string>> = {};

  async getPublicKey(role: Role): Promise<string> {
    const cached = this.keyCache[role];
    if (cached) return cached;
    const res = await fetch(`${process.env.IAM_URL}/${role}/public-key`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok)
      throw new Error(`IAM responded ${res.status} for ${role} public key`);
    const { publicKey } = (await res.json()) as { publicKey?: string };
    if (!publicKey) throw new Error(`IAM returned no public key for ${role}`);
    this.keyCache[role] = publicKey;
    return publicKey;
  }

  /** Validates the Authorization header for the given role or throws 401. */
  async authenticate(
    authHeader: string | undefined,
    role: Role,
  ): Promise<JwtPayload> {
    const token = extractBearerToken(authHeader);
    if (!token)
      throw new UnauthorizedException('Not Authorized, bearer token required');
    const publicKey = await this.getPublicKey(role);
    const payload =
      role === 'admin'
        ? validateAdminJWT(token, publicKey)
        : validateUserJWT(token, publicKey);
    if (!payload)
      throw new UnauthorizedException(`Invalid or expired ${role} token`);
    return payload;
  }
}
