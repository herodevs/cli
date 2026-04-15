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
