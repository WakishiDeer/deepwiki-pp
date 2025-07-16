import {
  AddHeadingSectionUseCase,
  AddHeadingSectionInput,
  AddHeadingSectionResult,
  InputValidationError,
} from "../application/usecases/heading-collection/add-heading-section";
import {
  HeadingSection,
  IHeadingSectionRepository,
} from "../domain/heading-collection";
import { RepositoryError, ValidationError, Result } from "../domain/shared";

// Mock repository implementation for testing
class MockHeadingSectionRepository implements IHeadingSectionRepository {
  private sections: HeadingSection[] = [];
  private shouldThrowError: Error | null = null;
  private existingSectionIds: Set<string> = new Set();

  // Test utility methods
  setShouldThrowError(error: Error | null): void {
    this.shouldThrowError = error;
  }

  setExistingSectionIds(ids: string[]): void {
    this.existingSectionIds = new Set(ids);
  }

  getSections(): HeadingSection[] {
    return [...this.sections];
  }

  clear(): void {
    this.sections = [];
    this.existingSectionIds.clear();
    this.shouldThrowError = null;
  }

  // IHeadingSectionRepository implementation
  async getAllSections(): Promise<HeadingSection[]> {
    return [...this.sections];
  }

  async getSectionById(sectionId: string): Promise<HeadingSection | null> {
    return this.sections.find((s) => s.sectionId === sectionId) || null;
  }

  async addSection(section: HeadingSection): Promise<Result<void>> {
    if (this.shouldThrowError) {
      throw this.shouldThrowError;
    }
    this.sections.push(section);
    return Result.success(undefined);
  }

  async removeSection(sectionId: string): Promise<Result<boolean>> {
    const initialLength = this.sections.length;
    this.sections = this.sections.filter((s) => s.sectionId !== sectionId);
    const removed = this.sections.length < initialLength;
    return Result.success(removed);
  }

  async removeSections(sectionIds: string[]): Promise<Result<number>> {
    const initialLength = this.sections.length;
    this.sections = this.sections.filter(
      (s) => !sectionIds.includes(s.sectionId!)
    );
    const removedCount = initialLength - this.sections.length;
    return Result.success(removedCount);
  }

  async clearAllSections(): Promise<Result<void>> {
    this.sections = [];
    return Result.success(undefined);
  }

  async findSectionsByUrl(sourceUrl: string): Promise<HeadingSection[]> {
    return this.sections.filter((s) => s.sourceUrl === sourceUrl);
  }

  async findSectionsByLevel(level: number): Promise<HeadingSection[]> {
    return this.sections.filter((s) => s.level === level);
  }

  async searchSectionsByTitle(searchTerm: string): Promise<HeadingSection[]> {
    return this.sections.filter((s) =>
      s.titleText.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  async getSectionsPage(
    offset: number,
    limit: number
  ): Promise<{
    sections: HeadingSection[];
    total: number;
    hasMore: boolean;
  }> {
    const total = this.sections.length;
    const sections = this.sections.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    return { sections, total, hasMore };
  }

  async updateSection(section: HeadingSection): Promise<Result<void>> {
    const index = this.sections.findIndex(
      (s) => s.sectionId === section.sectionId
    );
    if (index === -1) {
      return Result.failure(new RepositoryError("Section not found"));
    }
    this.sections[index] = section;
    return Result.success(undefined);
  }

  async sectionExists(sectionId: string): Promise<boolean> {
    return (
      this.existingSectionIds.has(sectionId) ||
      this.sections.some((s) => s.sectionId === sectionId)
    );
  }

  async getSectionCount(): Promise<number> {
    return this.sections.length;
  }

  async getSectionsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<HeadingSection[]> {
    // For testing, return all sections since we don't track dates in mock
    return this.sections;
  }

  async searchSections(
    searchText: string,
    searchInContent?: boolean
  ): Promise<HeadingSection[]> {
    return this.sections.filter((s) => {
      const titleMatch = s.titleText
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const contentMatch =
        searchInContent &&
        s.contentHtml.toLowerCase().includes(searchText.toLowerCase());
      return titleMatch || contentMatch;
    });
  }
}

describe("AddHeadingSectionUseCase", () => {
  let useCase: AddHeadingSectionUseCase;
  let mockRepository: MockHeadingSectionRepository;

  beforeEach(() => {
    mockRepository = new MockHeadingSectionRepository();
    useCase = new AddHeadingSectionUseCase(mockRepository);
  });

  afterEach(() => {
    mockRepository.clear();
  });

  describe("Successful addition scenarios", () => {
    test("should add a valid heading section successfully", async () => {
      // Arrange
      const input: AddHeadingSectionInput = {
        level: 2,
        title: "Test Heading",
        content: "<p>Test content</p>",
        sourceUrl: "https://example.com/test",
        id: "test-section-1",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.sectionId).toBe("test-section-1");
      }

      const sections = mockRepository.getSections();
      expect(sections).toHaveLength(1);
      expect(sections[0].level).toBe(2);
      expect(sections[0].titleText).toBe("Test Heading");
      expect(sections[0].sourceUrl).toBe("https://example.com/test");
    });

    test("should generate section ID when not provided", async () => {
      // Arrange
      const input: AddHeadingSectionInput = {
        level: 1,
        title: "Auto Generated ID Test",
        sourceUrl: "https://example.com/auto-id",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        // Check that sectionId follows the new format: hostname-h{level}-title-timestamp-random
        expect(result.sectionId).toMatch(
          /^example-com-h1-auto-generated-id-test-[a-z0-9]+-[a-z0-9]+$/
        );
        expect(result.sectionId).toContain("example-com");
        expect(result.sectionId).toContain("h1");
        expect(result.sectionId).toContain("auto-generated-id-test");
      }
    });

    test("should add section with minimal required fields", async () => {
      // Arrange
      const input: AddHeadingSectionInput = {
        level: 3,
        title: "Minimal Section",
        sourceUrl: "https://example.com/minimal",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);

      const sections = mockRepository.getSections();
      expect(sections).toHaveLength(1);
      expect(sections[0].level).toBe(3);
      expect(sections[0].titleText).toBe("Minimal Section");
      expect(sections[0].contentHtml).toBe("<h3>Minimal Section</h3>");
    });

    test("should trim whitespace from title and content", async () => {
      // Arrange
      const input: AddHeadingSectionInput = {
        level: 1,
        title: "  Whitespace Test  ",
        content: "  <p>Content with spaces</p>  ",
        sourceUrl: "https://example.com/whitespace",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);

      const sections = mockRepository.getSections();
      expect(sections[0].titleText).toBe("Whitespace Test");
      expect(sections[0].contentHtml).toBe("<p>Content with spaces</p>");
    });
  });

  describe("Input validation scenarios", () => {
    test("should reject invalid heading level (too low)", async () => {
      // Arrange
      const input: AddHeadingSectionInput = {
        level: 0,
        title: "Invalid Level",
        sourceUrl: "https://example.com/invalid",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("INVALID_INPUT");
        expect(result.message).toContain("between 1 and 6");
        expect(result.details).toEqual({ field: "level" });
      }
    });

    test("should reject invalid heading level (too high)", async () => {
      // Arrange
      const input: AddHeadingSectionInput = {
        level: 7,
        title: "Invalid Level",
        sourceUrl: "https://example.com/invalid",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("INVALID_INPUT");
        expect(result.message).toContain("between 1 and 6");
      }
    });

    test("should reject non-integer heading level", async () => {
      // Arrange
      const input: AddHeadingSectionInput = {
        level: 2.5,
        title: "Float Level",
        sourceUrl: "https://example.com/float",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("INVALID_INPUT");
      }
    });

    test("should reject empty title", async () => {
      // Arrange
      const input: AddHeadingSectionInput = {
        level: 2,
        title: "",
        sourceUrl: "https://example.com/empty-title",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("INVALID_INPUT");
        expect(result.message).toContain("non-empty string");
        expect(result.details).toEqual({ field: "title" });
      }
    });

    test("should reject whitespace-only title", async () => {
      // Arrange
      const input: AddHeadingSectionInput = {
        level: 2,
        title: "   ",
        sourceUrl: "https://example.com/whitespace-title",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("INVALID_INPUT");
        expect(result.details).toEqual({ field: "title" });
      }
    });

    test("should reject invalid source URL", async () => {
      // Arrange
      const input: AddHeadingSectionInput = {
        level: 2,
        title: "Valid Title",
        sourceUrl: "not-a-valid-url",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("INVALID_INPUT");
        expect(result.message).toContain("valid URL");
        expect(result.details).toEqual({ field: "sourceUrl" });
      }
    });

    test("should reject non-string content", async () => {
      // Arrange
      const input: AddHeadingSectionInput = {
        level: 2,
        title: "Valid Title",
        sourceUrl: "https://example.com/test",
        content: 123 as any, // Invalid content type
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("INVALID_INPUT");
        expect(result.details).toEqual({ field: "content" });
      }
    });

    test("should reject empty custom ID", async () => {
      // Arrange
      const input: AddHeadingSectionInput = {
        level: 2,
        title: "Valid Title",
        sourceUrl: "https://example.com/test",
        id: "",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("INVALID_INPUT");
        expect(result.details).toEqual({ field: "id" });
      }
    });
  });

  describe("Duplicate section scenarios", () => {
    test("should reject duplicate section ID", async () => {
      // Arrange
      mockRepository.setExistingSectionIds(["existing-section"]);

      const input: AddHeadingSectionInput = {
        level: 2,
        title: "Duplicate Test",
        sourceUrl: "https://example.com/duplicate",
        id: "existing-section",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("INVALID_INPUT");
        expect(result.message).toContain("already exists");
        expect(result.details).toEqual({ duplicateId: "existing-section" });
      }
    });

    test("should not check for duplicates when no custom ID provided", async () => {
      // Arrange
      const input: AddHeadingSectionInput = {
        level: 2,
        title: "No Custom ID",
        sourceUrl: "https://example.com/no-id",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("Repository error scenarios", () => {
    test("should handle storage quota exceeded error", async () => {
      // Arrange
      mockRepository.setShouldThrowError(
        new RepositoryError("Storage quota exceeded")
      );

      const input: AddHeadingSectionInput = {
        level: 2,
        title: "Storage Test",
        sourceUrl: "https://example.com/storage",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("STORAGE_QUOTA_EXCEEDED");
        expect(result.message).toContain("Storage quota exceeded");
      }
    });

    test("should handle invalid section error", async () => {
      // Arrange
      mockRepository.setShouldThrowError(
        new ValidationError("Invalid section data")
      );

      const input: AddHeadingSectionInput = {
        level: 2,
        title: "Invalid Section",
        sourceUrl: "https://example.com/invalid",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("INVALID_INPUT");
        expect(result.message).toBe("Invalid section data");
      }
    });

    test("should handle repository error", async () => {
      // Arrange
      mockRepository.setShouldThrowError(
        new RepositoryError("Database connection failed")
      );

      const input: AddHeadingSectionInput = {
        level: 2,
        title: "Repository Error",
        sourceUrl: "https://example.com/repo-error",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("REPOSITORY_ERROR");
        expect(result.message).toContain("Failed to save section");
      }
    });

    test("should handle unknown error", async () => {
      // Arrange
      mockRepository.setShouldThrowError(new Error("Unexpected error"));

      const input: AddHeadingSectionInput = {
        level: 2,
        title: "Unknown Error",
        sourceUrl: "https://example.com/unknown",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("UNKNOWN_ERROR");
        expect(result.message).toContain("unexpected error");
      }
    });
  });

  describe("Edge cases", () => {
    test("should handle very long title", async () => {
      // Arrange
      const longTitle = "A".repeat(1000);
      const input: AddHeadingSectionInput = {
        level: 1,
        title: longTitle,
        sourceUrl: "https://example.com/long-title",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);

      const sections = mockRepository.getSections();
      expect(sections[0].titleText).toBe(longTitle);
    });

    test("should handle special characters in title", async () => {
      // Arrange
      const specialTitle = "Special chars: <>&\"'`";
      const input: AddHeadingSectionInput = {
        level: 2,
        title: specialTitle,
        sourceUrl: "https://example.com/special-chars",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);

      const sections = mockRepository.getSections();
      expect(sections[0].titleText).toBe(specialTitle);
    });

    test("should handle unicode characters in title", async () => {
      // Arrange
      const unicodeTitle = "日本語タイトル 🚀 émojis";
      const input: AddHeadingSectionInput = {
        level: 3,
        title: unicodeTitle,
        sourceUrl: "https://example.com/unicode",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);

      const sections = mockRepository.getSections();
      expect(sections[0].titleText).toBe(unicodeTitle);
    });

    test("should handle complex HTML content", async () => {
      // Arrange
      const complexContent = `
        <div class="content">
          <p>Paragraph with <strong>bold</strong> and <em>italic</em></p>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
          <code>inline code</code>
        </div>
      `;

      const input: AddHeadingSectionInput = {
        level: 2,
        title: "Complex Content",
        content: complexContent,
        sourceUrl: "https://example.com/complex",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);

      const sections = mockRepository.getSections();
      expect(sections[0].contentHtml).toBe(complexContent.trim());
    });
  });
});
