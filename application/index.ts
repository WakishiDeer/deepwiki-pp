// Application Layer
// Use Cases and application services for the DeepWiki++ extension

// Tab Switching Use Cases
export * from "./usecases/tab-switch";

// Heading Collection Use Cases
export * from "./usecases/heading-collection";

// Re-exports for convenience
export type { ISettingsPort } from "./usecases/tab-switch";
export { TabSwitchUseCase } from "./usecases/tab-switch";

export type {
  AddHeadingSectionInput,
  AddHeadingSectionOutput,
  AddHeadingSectionError,
  AddHeadingSectionResult,
  GetHeadingSectionsInput,
  GetHeadingSectionsOutput,
  GetHeadingSectionsError,
  GetHeadingSectionsResult,
} from "./usecases/heading-collection";

export {
  AddHeadingSectionUseCase,
  GetHeadingSectionsUseCase,
  InputValidationError,
} from "./usecases/heading-collection";
