// Heading Collection Bounded Context
// Exports for heading section collection and management functionality

// Constants
export * from "./constants/heading-constants";

// Entities
export * from "./entities/heading-section";

// Services
export * from "./services/heading-parser";

// Repositories
export * from "./repositories/heading-section-repository";

// Re-exports for convenience
export type { HeadingSection } from "./entities/heading-section";

export type {
  HeadingParserOptions,
  HeadingParseResult,
} from "./services/heading-parser";

export type {
  IHeadingSectionRepository,
  IHeadingSectionRepositoryWithEvents,
  RepositoryOptions,
  RepositoryEvents,
} from "./repositories/heading-section-repository";

export {
  createHeadingSection,
  isHeadingSection,
  serializeHeadingSection,
  deserializeHeadingSection,
} from "./entities/heading-section";

export {
  HeadingParser,
  parseCurrentDocument,
  parseFromHtmlString,
} from "./services/heading-parser";

export {
  RepositoryError,
  StorageQuotaExceededError,
  SectionNotFoundError,
  InvalidSectionError,
} from "./repositories/heading-section-repository";
