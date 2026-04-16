import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  // 生产环境建议通过环境变量注入，此处用固定密钥
  'aihubs-super-secret-key-change-in-production'
);
const COOKIE_NAME = 'token';
const EXPIRY = '7d';

export interface JWTPayload {
  sub: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function getExpiryDays(): number {
  return 7;
}
