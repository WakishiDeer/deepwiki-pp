/**
 * Unit tests for the Dependency Injection Container
 *
 * Tests the proper configuration and retrieval of dependencies,
 * ensuring the container maintains proper separation of concerns.
 */

import { DIContainer } from "../application/container/di-container";
import { IHeadingSectionRepository } from "../domain/heading-collection";
import { ISettingsPort } from "../application/usecases/tab-switch";
import { HeadingSection } from "../domain/heading-collection/heading-section";
import { Result, Id } from "../domain/shared";
import { TabSwitchSettings } from "../domain/tab-switching/tab-switch-settings";

// Mock implementations for testing
class MockHeadingRepository implements IHeadingSectionRepository {
  async getAllSections(): Promise<HeadingSection[]> {
    return [];
  }
  async getSectionById(sectionId: Id): Promise<HeadingSection | null> {
    return null;
  }
  async addSection(section: HeadingSection): Promise<Result<void>> {
    return { success: true, data: undefined };
  }
  async removeSection(sectionId: Id): Promise<Result<boolean>> {
    return { success: true, data: true };
  }
  async removeSections(sectionIds: Id[]): Promise<Result<number>> {
    return { success: true, data: sectionIds.length };
  }
  async clearAllSections(): Promise<Result<void>> {
    return { success: true, data: undefined };
  }
  async findSectionsByUrl(sourceUrl: string): Promise<HeadingSection[]> {
    return [];
  }
  async findSectionsByLevel(level: number): Promise<HeadingSection[]> {
    return [];
  }
  async searchSectionsByTitle(searchTerm: string): Promise<HeadingSection[]> {
    return [];
  }
  async getSectionsPage(
    offset: number,
    limit: number
  ): Promise<{
    sections: HeadingSection[];
    total: number;
    hasMore: boolean;
  }> {
    return { sections: [], total: 0, hasMore: false };
  }
  async updateSection(section: HeadingSection): Promise<Result<void>> {
    return { success: true, data: undefined };
  }
  async sectionExists(sectionId: Id): Promise<boolean> {
    return false;
  }
  async findDuplicateSection(params: {
    sourceUrl: string;
    level: number;
    titleText: string;
  }): Promise<HeadingSection | null> {
    return null;
  }
  async getSectionCount(): Promise<number> {
    return 0;
  }
}

class MockSettingsPort implements ISettingsPort {
  async getSettings(): Promise<TabSwitchSettings> {
    return { host1: "example.com", host2: "example.org" };
  }
  async setSetting(
    key: keyof TabSwitchSettings,
    value: string
  ): Promise<void> {}
}

class MockDomGateway {
  findMainContentContainer(): Element | null {
    return null;
  }
  extractHeadingSections(): Promise<any[]> {
    return Promise.resolve([]);
  }
  isValidDeepWikiPage(): boolean {
    return true;
  }
  waitForHeadings(): Promise<boolean> {
    return Promise.resolve(true);
  }
  insertAddButtons(): void {}
  removeAddButtons(): void {}
  startSPAMonitoring(): void {}
  stopSPAMonitoring(): void {}
  waitForContentStabilization(): Promise<void> {
    return Promise.resolve();
  }
}

class MockTabGateway {
  getCurrentTab(): Promise<{ url?: string }> {
    return Promise.resolve({ url: "https://test.com" });
  }
  updateTab(): Promise<void> {
    return Promise.resolve();
  }
  setBadge(): Promise<void> {
    return Promise.resolve();
  }
}

describe("DIContainer", () => {
  beforeEach(() => {
    // Reset container before each test
    DIContainer.reset();
  });

  describe("Dependency Configuration", () => {
    it("should set and get heading repository", () => {
      const mockRepo = new MockHeadingRepository();

      DIContainer.setHeadingRepository(mockRepo);
      const retrieved = DIContainer.getHeadingRepository();

      expect(retrieved).toBe(mockRepo);
    });

    it("should set and get settings port", () => {
      const mockSettings = new MockSettingsPort();

      DIContainer.setSettingsPort(mockSettings);
      const retrieved = DIContainer.getSettingsPort();

      expect(retrieved).toBe(mockSettings);
    });

    it("should set and get DOM gateway", () => {
      const mockDom = new MockDomGateway();

      DIContainer.setDomGateway(mockDom);
      const retrieved = DIContainer.getDomGateway();

      expect(retrieved).toBe(mockDom);
    });

    it("should set and get tab gateway", () => {
      const mockTab = new MockTabGateway();

      DIContainer.setTabGateway(mockTab);
      const retrieved = DIContainer.getTabGateway();

      expect(retrieved).toBe(mockTab);
    });
  });

  describe("Error Handling", () => {
    it("should throw error when getting unconfigured heading repository", () => {
      expect(() => DIContainer.getHeadingRepository()).toThrow(
        "HeadingRepository not configured in DI container"
      );
    });

    it("should throw error when getting unconfigured settings port", () => {
      expect(() => DIContainer.getSettingsPort()).toThrow(
        "SettingsPort not configured in DI container"
      );
    });

    it("should throw error when getting unconfigured DOM gateway", () => {
      expect(() => DIContainer.getDomGateway()).toThrow(
        "DomGateway not configured in DI container"
      );
    });

    it("should throw error when getting unconfigured tab gateway", () => {
      expect(() => DIContainer.getTabGateway()).toThrow(
        "TabGateway not configured in DI container"
      );
    });
  });

  describe("Use Case Factory Methods", () => {
    beforeEach(() => {
      // Configure dependencies for use case creation
      DIContainer.setHeadingRepository(new MockHeadingRepository());
      DIContainer.setSettingsPort(new MockSettingsPort());
    });

    it("should create AddHeadingSectionUseCase with configured repository", () => {
      const useCase = DIContainer.createAddHeadingSectionUseCase();
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe("AddHeadingSectionUseCase");
    });

    it("should create GetHeadingSectionsUseCase with configured repository", () => {
      const useCase = DIContainer.createGetHeadingSectionsUseCase();
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe("GetHeadingSectionsUseCase");
    });

    it("should create RemoveHeadingSectionUseCase with configured repository", () => {
      const useCase = DIContainer.createRemoveHeadingSectionUseCase();
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe("RemoveHeadingSectionUseCase");
    });

    it("should create ClearAllHeadingSectionsUseCase with configured repository", () => {
      const useCase = DIContainer.createClearAllHeadingSectionsUseCase();
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe("ClearAllHeadingSectionsUseCase");
    });

    it("should create TabSwitchUseCase with configured settings port", () => {
      const useCase = DIContainer.createTabSwitchUseCase();
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe("TabSwitchUseCase");
    });
  });

  describe("Use Case Factory Error Handling", () => {
    it("should throw error when creating use case without repository", () => {
      expect(() => DIContainer.createAddHeadingSectionUseCase()).toThrow(
        "HeadingRepository not configured in DI container"
      );
    });

    it("should throw error when creating tab switch use case without settings port", () => {
      expect(() => DIContainer.createTabSwitchUseCase()).toThrow(
        "SettingsPort not configured in DI container"
      );
    });
  });

  describe("Container Reset", () => {
    it("should reset all dependencies when reset is called", () => {
      // Configure all dependencies
      DIContainer.setHeadingRepository(new MockHeadingRepository());
      DIContainer.setSettingsPort(new MockSettingsPort());
      DIContainer.setDomGateway(new MockDomGateway());
      DIContainer.setTabGateway(new MockTabGateway());

      // Reset container
      DIContainer.reset();

      // All dependencies should be cleared
      expect(() => DIContainer.getHeadingRepository()).toThrow();
      expect(() => DIContainer.getSettingsPort()).toThrow();
      expect(() => DIContainer.getDomGateway()).toThrow();
      expect(() => DIContainer.getTabGateway()).toThrow();
    });
  });
});
