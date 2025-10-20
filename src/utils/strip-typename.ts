export function stripTypename<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(stripTypename) as unknown as T;
  }

  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(obj)) {
      if (key === '__typename') continue;
      const value = (obj as Record<string, unknown>)[key];
      result[key] = stripTypename(value);
    }

    return result as unknown as T;
  }

  return obj;
}
