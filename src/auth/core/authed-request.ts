import { Request } from 'express';
import { JwtPayload } from './types';

export interface AuthedRequest extends Request {
  user: JwtPayload;
}
