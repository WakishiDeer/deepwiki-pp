/**
 * Common domain errors for all bounded contexts
 */

export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
  }
}

export class RepositoryError extends DomainError {
  constructor(message: string) {
    super(message, "REPOSITORY_ERROR");
  }
}

export class ParseError extends DomainError {
  constructor(message: string) {
    super(message, "PARSE_ERROR");
  }
}

export class InvalidSectionError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_SECTION");
  }
}

export class StorageQuotaExceededError extends RepositoryError {
  constructor(message: string) {
    super(message);
  }
}
