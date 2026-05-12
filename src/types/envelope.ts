export interface ApiSuccess<T> {
  data: T;
  error: null;
  time: number;
  request: string;
}

export interface ApiFailure {
  data: null;
  error: ApiErrorDetails;
  time: number;
  request: string;
}

export interface ApiErrorDetails {
  code: string;
  message: string;
  status: number;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;

  constructor(error: ApiErrorDetails) {
    super(error.message);
    this.name = 'ApiError';
    this.code = error.code;
    this.status = error.status;
    this.details = (error as ApiErrorDetails & { details?: unknown }).details;
  }
}
