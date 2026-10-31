export interface Admin {
  id: string;
  username: string;
  password: string;
}

export interface User {
  id: number;
  ssn: string;
  fullName: string;
  phone: string;
}

export interface JwtPayload {
  id: number | string;
  role: 'admin' | 'user';
}

export type Role = 'admin' | 'user';