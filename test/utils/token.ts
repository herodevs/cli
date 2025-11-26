export function createTokenWithExp(offsetSeconds: number) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + offsetSeconds })).toString(
    'base64url',
  );
  return `${header}.${payload}.signature`;
}
