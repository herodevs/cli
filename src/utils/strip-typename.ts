export function stripTypename<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(stripTypename) as any;
  }

  if (obj !== null && typeof obj === 'object') {
    const result: any = {};

    for (const key of Object.keys(obj)) {
      if (key === '__typename') continue;
      result[key] = stripTypename((obj as any)[key]);
    }

    return result;
  }

  return obj;
}
