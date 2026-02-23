export interface CiCredentialResult {
  ciTokenFromEnv: string | undefined;
  orgIdFromEnv: number | undefined;
}

/** Parses a credential string in format "orgId:refreshToken". */
export function parseCiCredential(credential: string | undefined): CiCredentialResult {
  const credEnv = credential?.trim();
  if (!credEnv) return { ciTokenFromEnv: undefined, orgIdFromEnv: undefined };
  const colonIdx = credEnv.indexOf(':');
  if (colonIdx === -1) return { ciTokenFromEnv: undefined, orgIdFromEnv: undefined };
  const orgStr = credEnv.slice(0, colonIdx);
  const tokenStr = credEnv.slice(colonIdx + 1);
  if (!orgStr || !tokenStr) return { ciTokenFromEnv: undefined, orgIdFromEnv: undefined };
  const parsed = Number.parseInt(orgStr, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return { ciTokenFromEnv: undefined, orgIdFromEnv: undefined };
  return { ciTokenFromEnv: tokenStr, orgIdFromEnv: parsed };
}
