import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  'aihubs-super-secret-key-change-in-production'
);
const COOKIE_NAME = 'token';
const EXPIRY = '7d';

export interface JWTPayload {
  sub: number;
  email: string;
  role: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({
    sub: String(payload.sub),
    email: payload.email,
    role: payload.role,
  } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const p = payload as unknown as { sub: string; email: string; role: string };
    return {
      sub: Number(p.sub),
      email: p.email,
      role: p.role,
    };
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
