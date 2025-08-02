/**
 * Infrastructure Factory Interface
 *
 * This interface defines the contract for infrastructure factories
 * without exposing concrete implementations. This allows entrypoints
 * to depend on the interface rather than the infrastructure layer,
 * maintaining clean architecture boundaries.
 */

import type { ISettingsPort } from "../usecases/tab-switch";
import type { IHeadingSectionRepository } from "../../domain/heading-collection";
import type { IDomGateway, ITabGateway } from "./di-container";

/**
 * Interface for infrastructure factories
 *
 * This interface is implemented by the infrastructure layer
 * and used by entrypoints to create dependencies
 */
export interface IInfrastructureFactories {
  /**
   * Creates a settings port implementation
   */
  createSettingsPort: () => ISettingsPort;

  /**
   * Creates a heading section repository implementation
   */
  createHeadingRepository: () => IHeadingSectionRepository;

  /**
   * Creates a tab gateway implementation
   */
  createTabGateway: () => ITabGateway;

  /**
   * Creates a DOM gateway implementation
   */
  createDomGateway: () => IDomGateway;
}
