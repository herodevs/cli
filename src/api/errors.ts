const API_ERROR_CODES = ['SESSION_EXPIRED', 'INVALID_TOKEN', 'UNAUTHENTICATED', 'FORBIDDEN'] as const;
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
