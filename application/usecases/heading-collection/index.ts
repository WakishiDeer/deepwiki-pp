// Heading Collection Use Cases
// Application layer exports for heading section collection functionality

// Use Cases
export * from "./add-heading-section";
export * from "./get-heading-sections";

// Re-exports for convenience
export type {
  AddHeadingSectionInput,
  AddHeadingSectionOutput,
  AddHeadingSectionError,
  AddHeadingSectionResult,
} from "./add-heading-section";

export type {
  GetHeadingSectionsInput,
  GetHeadingSectionsOutput,
  GetHeadingSectionsError,
  GetHeadingSectionsResult,
} from "./get-heading-sections";

export {
  AddHeadingSectionUseCase,
  InputValidationError,
} from "./add-heading-section";

export { GetHeadingSectionsUseCase } from "./get-heading-sections";
