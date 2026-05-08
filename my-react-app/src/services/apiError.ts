export type ApiErrorCode =
  | 'NO_TOKEN'
  | 'INVALID_HEADER'
  | 'INVALID_TOKEN'
  | 'INVALID_TOKEN_FORMAT'
  | 'TOKEN_EXPIRED'
  | 'ACCOUNT_INACTIVE'
  | 'ACCOUNT_LOCKED'
  | 'EMAIL_NOT_VERIFIED'
  | 'INVALID_REFRESH_TOKEN'
  | 'NO_REFRESH_TOKEN'
  | 'AUTH_ERROR'
  | 'FORBIDDEN'
  | 'USER_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'UNKNOWN_ERROR';

export interface ApiErrorPayload {
  detail?: string;
  message?: string;
  error?: string;
  error_code?: ApiErrorCode | string;
  errors?: Array<{ field?: string; message?: string }>;
}

export interface ApiError extends Error {
  code?: ApiErrorCode | string;
  status?: number;
}

const CODE_MESSAGES: Record<string, string> = {
  NO_TOKEN: 'Please log in to continue.',
  INVALID_HEADER: 'Your session could not be verified. Please log in again.',
  INVALID_TOKEN: 'Your session is invalid. Please log in again.',
  INVALID_TOKEN_FORMAT: 'Your session could not be verified. Please log in again.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  ACCOUNT_INACTIVE: 'Your account is deactivated. Contact support if this is unexpected.',
  ACCOUNT_LOCKED: 'Your account is temporarily locked. Please try again later.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before continuing.',
  INVALID_REFRESH_TOKEN: 'Your session expired. Please log in again.',
  NO_REFRESH_TOKEN: 'Refresh token is missing. Please log in again.',
  AUTH_ERROR: 'We could not verify your session. Please try again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  USER_NOT_FOUND: 'We could not find your account. Please log in again.',
  VALIDATION_ERROR: 'Some information is missing or invalid. Please review and try again.',
  RATE_LIMITED: 'Too many requests. Please wait and try again.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait and try again.',
  INTERNAL_ERROR: 'Something went wrong on our side. Please try again.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

export const buildApiError = (
  payload: ApiErrorPayload,
  status?: number
): ApiError => {
  const code = payload?.error_code || 'UNKNOWN_ERROR';
  const message =
    CODE_MESSAGES[code] ||
    payload?.detail ||
    payload?.message ||
    payload?.error ||
    CODE_MESSAGES.UNKNOWN_ERROR;
  const error = new Error(message) as ApiError;
  error.code = code;
  error.status = status;
  return error;
};

export const formatValidationErrors = (payload?: ApiErrorPayload): string | null => {
  if (!payload?.errors || payload.errors.length === 0) return null;
  return payload.errors
    .map((item) => item.message || item.field || 'Invalid field')
    .filter(Boolean)
    .join(' ');
};
