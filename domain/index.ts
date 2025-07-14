/**
 * Domain Layer
 * Selective exports maintaining bounded context separation
 */

// Shared domain utilities
export {
  DomainError,
  ValidationError,
  RepositoryError,
  ParseError,
  type Id,
  type Url,
  type HtmlContent,
  type Timestamp,
  type Result,
  generateId,
  isValidUrl,
  sanitizeHtml,
  deepClone,
} from "./shared";

// Re-export each bounded context as namespace
export * as HeadingCollection from "./heading-collection";
export * as TabSwitching from "./tab-switching";

// Convenience exports for commonly used types
export type { HeadingSection } from "./heading-collection";
export type { TabSwitchSettings } from "./tab-switching";
