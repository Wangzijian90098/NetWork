const IP_API_URL = 'http://ip-api.com/json';

export async function ipToRegion(ip: string): Promise<'CN' | 'OVERSEAS'> {
  // 跳过本地/内网 IP
  if (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.')
  ) {
    return 'OVERSEAS';
  }

  try {
    const url = `${IP_API_URL}/${ip}?fields=countryCode`;
    const res = await fetch(url, { cf: { cacheTtl: 86400, cacheEverything: true } });
    if (!res.ok) return 'OVERSEAS';
    const data = await res.json<{ countryCode: string }>();
    if (data.countryCode === 'CN') return 'CN';
    return 'OVERSEAS';
  } catch {
    return 'OVERSEAS';
  }
}

export function getClientIP(request: Request): string {
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}
