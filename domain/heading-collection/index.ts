/**
 * Heading Collection Bounded Context
 * Exports for heading section collection and management functionality
 */

// Core entity and factory
export {
  HeadingSection,
  createHeadingSection,
  isHeadingSection,
  serializeHeadingSection,
  deserializeHeadingSection,
  generateContentBasedId,
} from "./heading-section";

// Parser service
export {
  HeadingParser,
  type HeadingParserOptions,
  type HeadingParseResult,
} from "./heading-parser";

// Repository interface
export { type IHeadingSectionRepository } from "./heading-repository";

// Constants and utilities
export {
  HEADING_TAGS,
  MIN_HEADING_LEVEL,
  MAX_HEADING_LEVEL,
  HEADING_SELECTOR,
  isValidHeadingLevel,
  getHeadingLevelFromTag,
  createHeadingTag,
} from "./heading-section";
