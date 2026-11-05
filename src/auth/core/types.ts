export interface Admin {
  id: string;
  username: string;
  password: string;
}

export interface User {
  id: number;
  ssn: string | null;
  fullName: string;
  phone: string;
  childCount: number;
  teenageCount: number;
  adultCount: number;
}

export interface JwtPayload {
  id: number | string;
  role: 'admin' | 'user';
}

export type Role = 'admin' | 'user';
