/**
 * Application Container Module
 *
 * Exports dependency injection container and related interfaces
 * for managing application dependencies.
 */

export { DIContainer } from "./di-container";
export type { IDomGateway, ITabGateway } from "./di-container";
export { initializeDIContainer, resetDIContainer } from "./initialize";
export type { IInfrastructureFactories } from "./infrastructure-factories.interface";
