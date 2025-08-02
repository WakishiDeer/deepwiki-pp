/**
 * DI Container Initialization
 *
 * This module provides factory-based initialization for the DI container,
 * allowing entrypoints to configure dependencies without directly importing
 * infrastructure implementations.
 */

import { DIContainer } from "./di-container";
import type { IInfrastructureFactories } from "./infrastructure-factories.interface";

/**
 * Initializes the DI container with the provided factory functions
 *
 * This function abstracts the infrastructure initialization from entrypoints,
 * ensuring that entrypoints don't directly depend on infrastructure implementations.
 *
 * @param factories - Factory functions for creating infrastructure dependencies
 */
export function initializeDIContainer(
  factories: IInfrastructureFactories
): void {
  // Create instances using the provided factories
  const settingsPort = factories.createSettingsPort();
  const headingSectionRepository = factories.createHeadingRepository();
  const tabGateway = factories.createTabGateway();

  // Configure the DI container
  DIContainer.setSettingsPort(settingsPort);
  DIContainer.setHeadingRepository(headingSectionRepository);
  DIContainer.setTabGateway(tabGateway);

  // Configure DOM gateway if factory is provided
  if (factories.createDomGateway) {
    const domGateway = factories.createDomGateway();
    DIContainer.setDomGateway(domGateway);
  }

  console.log("DI Container initialized successfully");
}

/**
 * Resets the DI container (primarily for testing)
 */
export function resetDIContainer(): void {
  DIContainer.reset();
}
