/**
 * Common types used across domain contexts
 */

export type Url = string;
export type HtmlContent = string;
export type Timestamp = Date;

/**
 * Generic identifier type
 */
export type Id = string;

/**
 * Common result type for operations that may fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Helper functions for Result type
 */
export const Result = {
  success: <T>(data: T): Result<T> => ({ success: true, data }),
  failure: <T, E = Error>(error: E): Result<T, E> => ({
    success: false,
    error,
  }),
};
