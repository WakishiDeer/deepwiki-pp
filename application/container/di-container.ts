/**
 * Dependency Injection Container for the Application Layer
 *
 * This container manages the creation and injection of dependencies,
 * ensuring proper separation between layers while maintaining testability.
 */

import { IHeadingSectionRepository } from "../../domain/heading-collection";
import { ISettingsPort } from "../usecases/tab-switch";
import {
  AddHeadingSectionUseCase,
  GetHeadingSectionsUseCase,
  RemoveHeadingSectionUseCase,
  ClearAllHeadingSectionsUseCase,
} from "../usecases/heading-collection";
import { TabSwitchUseCase } from "../usecases/tab-switch";

// Infrastructure gateways interfaces
export interface IDomGateway {
  findMainContentContainer(): Element | null;
  extractHeadingSections(container: Element, sourceUrl: string): Promise<any[]>;
  isValidDeepWikiPage(): boolean;
  waitForHeadings(container: Element, timeout?: number): Promise<boolean>;
  insertAddButtons(
    sections: any[],
    onButtonClick: (section: any) => void
  ): void;
  removeAddButtons(): void;
  startSPAMonitoring(onButtonClick: (section: any) => void): void;
  stopSPAMonitoring(): void;
  waitForContentStabilization(
    container: Element,
    maxWaitTime?: number
  ): Promise<void>;
}

export interface ITabGateway {
  getCurrentTab(tabId: number): Promise<{ url?: string }>;
  updateTab(tabId: number, url: string): Promise<void>;
  setBadge(tabId: number, text: string): Promise<void>;
}

/**
 * Dependency injection container that manages application dependencies
 */
export class DIContainer {
  private static headingRepository: IHeadingSectionRepository | null = null;
  private static settingsPort: ISettingsPort | null = null;
  private static domGateway: IDomGateway | null = null;
  private static tabGateway: ITabGateway | null = null;

  // Setters for dependency injection (typically called from entrypoints)
  static setHeadingRepository(repository: IHeadingSectionRepository): void {
    this.headingRepository = repository;
  }

  static setSettingsPort(settingsPort: ISettingsPort): void {
    this.settingsPort = settingsPort;
  }

  static setDomGateway(domGateway: IDomGateway): void {
    this.domGateway = domGateway;
  }

  static setTabGateway(tabGateway: ITabGateway): void {
    this.tabGateway = tabGateway;
  }

  // Getters for retrieving configured dependencies
  static getHeadingRepository(): IHeadingSectionRepository {
    if (!this.headingRepository) {
      throw new Error("HeadingRepository not configured in DI container");
    }
    return this.headingRepository;
  }

  static getSettingsPort(): ISettingsPort {
    if (!this.settingsPort) {
      throw new Error("SettingsPort not configured in DI container");
    }
    return this.settingsPort;
  }

  static getDomGateway(): IDomGateway {
    if (!this.domGateway) {
      throw new Error("DomGateway not configured in DI container");
    }
    return this.domGateway;
  }

  static getTabGateway(): ITabGateway {
    if (!this.tabGateway) {
      throw new Error("TabGateway not configured in DI container");
    }
    return this.tabGateway;
  }

  // Use case factories
  static createAddHeadingSectionUseCase(): AddHeadingSectionUseCase {
    return new AddHeadingSectionUseCase(this.getHeadingRepository());
  }

  static createGetHeadingSectionsUseCase(): GetHeadingSectionsUseCase {
    return new GetHeadingSectionsUseCase(this.getHeadingRepository());
  }

  static createRemoveHeadingSectionUseCase(): RemoveHeadingSectionUseCase {
    return new RemoveHeadingSectionUseCase(this.getHeadingRepository());
  }

  static createClearAllHeadingSectionsUseCase(): ClearAllHeadingSectionsUseCase {
    return new ClearAllHeadingSectionsUseCase(this.getHeadingRepository());
  }

  static createTabSwitchUseCase(): TabSwitchUseCase {
    return new TabSwitchUseCase(this.getSettingsPort());
  }

  // Reset method for testing
  static reset(): void {
    this.headingRepository = null;
    this.settingsPort = null;
    this.domGateway = null;
    this.tabGateway = null;
  }
}
