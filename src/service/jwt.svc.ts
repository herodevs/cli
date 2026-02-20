export function decodeJwtPayload(token: string | undefined): Record<string, unknown> | undefined {
  if (!token) {
    return;
  }

  try {
    const parts = token.split('.');
    if (parts.length < 2 || !parts[1]) {
      return;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as unknown;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return;
    }

    return payload as Record<string, unknown>;
  } catch {
    return;
  }
}
