export const SESSION_EXPIRED_ERROR_CODE = 'SESSION_EXPIRED';
export const INVALID_TOKEN_ERROR_CODE = 'INVALID_TOKEN';
export const UNAUTHENTICATED_ERROR_CODE = 'UNAUTHENTICATED';
export const FORBIDDEN_ERROR_CODE = 'FORBIDDEN';
export const PAYLOAD_TOO_LARGE_ERROR_CODE = 'PAYLOAD_TOO_LARGE';

const API_ERROR_CODES = [
  SESSION_EXPIRED_ERROR_CODE,
  INVALID_TOKEN_ERROR_CODE,
  UNAUTHENTICATED_ERROR_CODE,
  FORBIDDEN_ERROR_CODE,
  PAYLOAD_TOO_LARGE_ERROR_CODE,
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

const VALID_API_ERROR_CODES = new Set<ApiErrorCode>(API_ERROR_CODES);

export class ApiError extends Error {
  readonly code: ApiErrorCode;

  constructor(message: string, code: ApiErrorCode) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export function isApiErrorCode(code: string): code is ApiErrorCode {
  return VALID_API_ERROR_CODES.has(code as ApiErrorCode);
}

export const EMPTY_SBOM_ERROR_CODE = 'EMPTY_SBOM';
export const INVALID_SBOM_JSON_ERROR_CODE = 'INVALID_SBOM_JSON';
export const SBOM_MISSING_COMPONENTS_ERROR_CODE = 'SBOM_MISSING_COMPONENTS';
export const SBOM_NO_IDENTIFIABLE_COMPONENTS_ERROR_CODE = 'SBOM_NO_IDENTIFIABLE_COMPONENTS';
export const INVALID_PURL_ERROR_CODE = 'INVALID_PURL';

/**
 * SBOM validation codes returned by eol-api when a submitted SBOM is rejected.
 * Kept separate from the auth-oriented API_ERROR_CODES: these are surfaced with
 * their own CLI copy and must not feed isApiErrorCode / AUTH_ERROR_MESSAGES.
 */
const SBOM_ERROR_CODES = [
  EMPTY_SBOM_ERROR_CODE,
  INVALID_SBOM_JSON_ERROR_CODE,
  SBOM_MISSING_COMPONENTS_ERROR_CODE,
  SBOM_NO_IDENTIFIABLE_COMPONENTS_ERROR_CODE,
  INVALID_PURL_ERROR_CODE,
] as const;
export type SbomErrorCode = (typeof SBOM_ERROR_CODES)[number];

const VALID_SBOM_ERROR_CODES = new Set<SbomErrorCode>(SBOM_ERROR_CODES);

export function isSbomErrorCode(code: string): code is SbomErrorCode {
  return VALID_SBOM_ERROR_CODES.has(code as SbomErrorCode);
}

/** Extra context merged into the GraphQL error `extensions` for some SBOM codes. */
export interface SbomErrorDetails {
  purl?: string;
  totalComponents?: number;
}

export class SbomError extends Error {
  readonly code: SbomErrorCode;
  readonly details?: SbomErrorDetails;

  constructor(message: string, code: SbomErrorCode, details?: SbomErrorDetails) {
    super(message);
    this.name = 'SbomError';
    this.code = code;
    this.details = details;
  }
}
