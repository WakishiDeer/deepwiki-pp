/**
 * Infrastructure Factories
 *
 * This module provides factory functions for creating infrastructure implementations.
 * These are the only infrastructure exports that entrypoints should use,
 * maintaining clean architecture boundaries.
 */

import { ChromeStorageSettingsRepository } from "./repositories/chrome/settings/chrome-storage-settings-repository";
import { ChromeStorageHeadingSectionRepository } from "./repositories/chrome/heading-section/chrome-storage-heading-section-repository";
import { ChromeTabGateway } from "./gateways/tab/chrome-tab-gateway";
import { ChromeDomGateway } from "./gateways/dom/implementations/chrome-dom-gateway";
import type { IInfrastructureFactories } from "../application/container/infrastructure-factories.interface";

/**
 * Infrastructure factories that create concrete implementations
 *
 * These factories implement the IInfrastructureFactories interface
 * defined in the application layer, maintaining clean architecture boundaries.
 */
export const InfrastructureFactories: IInfrastructureFactories = {
  /**
   * Creates a settings port implementation for Chrome storage
   */
  createSettingsPort: () => {
    return new ChromeStorageSettingsRepository();
  },

  /**
   * Creates a heading section repository implementation for Chrome storage
   */
  createHeadingRepository: () => {
    return new ChromeStorageHeadingSectionRepository();
  },

  /**
   * Creates a tab gateway implementation for Chrome tabs API
   */
  createTabGateway: () => {
    return new ChromeTabGateway();
  },

  /**
   * Creates a DOM gateway implementation for Chrome content scripts
   */
  createDomGateway: () => {
    return new ChromeDomGateway();
  },
} as const;

/**
 * Type for the infrastructure factories
 */
export type InfrastructureFactoriesType = typeof InfrastructureFactories;
