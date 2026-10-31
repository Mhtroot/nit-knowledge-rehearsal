import { Request } from 'express';
import { JwtPayload } from './iam-jwt';

export type AuthedRequest = Request & { user?: JwtPayload };
