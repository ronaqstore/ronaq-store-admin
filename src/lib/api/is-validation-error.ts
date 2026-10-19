import { ApiError } from '@/lib/api/types';

export function isValidationApiError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    (error.statusCode === 400 || error.statusCode === 422)
  );
}
