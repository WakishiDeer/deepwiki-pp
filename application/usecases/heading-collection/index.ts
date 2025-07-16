// Heading Collection Use Cases
// Application layer exports for heading section collection functionality

// Use Cases
export * from "./add-heading-section";
export * from "./get-heading-sections";
export * from "./remove-heading-section";
export * from "./clear-all-heading-sections";

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

export type {
  RemoveHeadingSectionInput,
  RemoveHeadingSectionOutput,
  RemoveHeadingSectionError,
  RemoveHeadingSectionResult,
} from "./remove-heading-section";

export type {
  ClearAllHeadingSectionsInput,
  ClearAllHeadingSectionsOutput,
  ClearAllHeadingSectionsError,
  ClearAllHeadingSectionsResult,
} from "./clear-all-heading-sections";

export {
  AddHeadingSectionUseCase,
  InputValidationError,
} from "./add-heading-section";

export { GetHeadingSectionsUseCase } from "./get-heading-sections";

export { RemoveHeadingSectionUseCase } from "./remove-heading-section";

export { ClearAllHeadingSectionsUseCase } from "./clear-all-heading-sections";
