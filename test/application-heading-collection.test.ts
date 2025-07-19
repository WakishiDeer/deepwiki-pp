import {
  AddHeadingSectionUseCase,
  GetHeadingSectionsUseCase,
  InputValidationError,
  type AddHeadingSectionInput,
  type GetHeadingSectionsInput,
} from "../application/usecases/heading-collection";

import {
  HeadingSection,
  IHeadingSectionRepository,
} from "../domain/heading-collection";
import { RepositoryError, ValidationError, Result, Id } from "../domain/shared";

/**
 * Mock implementation of IHeadingSectionRepository for testing
 */
class MockHeadingSectionRepository implements IHeadingSectionRepository {
  private sections: HeadingSection[] = [];
  private shouldThrowError: string | null = null;

  // Test helper methods
  setSections(sections: HeadingSection[]): void {
    this.sections = [...sections];
  }

  getSections(): HeadingSection[] {
    return [...this.sections];
  }

  setError(errorType: string | null): void {
    this.shouldThrowError = errorType;
  }

  private createErrorResult<T>(errorMessage: string): Result<T> {
    return {
      success: false,
      error: new RepositoryError(errorMessage),
    };
  }

  private createSuccessResult<T>(data: T): Result<T> {
    return {
      success: true,
      data,
    };
  }

  private throwIfErrorSet(): void {
    if (this.shouldThrowError) {
      switch (this.shouldThrowError) {
        case "storage_quota":
          throw new RepositoryError("Storage quota exceeded");
        case "invalid_section":
          throw new ValidationError("Test invalid section error");
        case "repository_error":
          throw new RepositoryError("Test repository error");
        default:
          throw new Error("Test unknown error");
      }
    }
  }

  // IHeadingSectionRepository implementation
  async getAllSections(): Promise<HeadingSection[]> {
    this.throwIfErrorSet();
    return [...this.sections];
  }

  async getSectionById(sectionId: Id): Promise<HeadingSection | null> {
    this.throwIfErrorSet();
    return this.sections.find((s) => s.sectionId === sectionId) || null;
  }

  async addSection(section: HeadingSection): Promise<Result<void>> {
    if (this.shouldThrowError) {
      return this.createErrorResult<void>("Test error in addSection");
    }
    this.sections.push(section);
    return this.createSuccessResult<void>(undefined);
  }

  async removeSection(sectionId: Id): Promise<Result<boolean>> {
    if (this.shouldThrowError) {
      return this.createErrorResult<boolean>("Test error in removeSection");
    }
    const index = this.sections.findIndex((s) => s.sectionId === sectionId);
    if (index >= 0) {
      this.sections.splice(index, 1);
      return this.createSuccessResult(true);
    }
    return this.createSuccessResult(false);
  }

  async removeSections(sectionIds: Id[]): Promise<Result<number>> {
    if (this.shouldThrowError) {
      return this.createErrorResult<number>("Test error in removeSections");
    }
    let removed = 0;
    for (const id of sectionIds) {
      const result = await this.removeSection(id);
      if (result.success && result.data) {
        removed++;
      }
    }
    return this.createSuccessResult(removed);
  }

  async clearAllSections(): Promise<Result<void>> {
    if (this.shouldThrowError) {
      return this.createErrorResult<void>("Test error in clearAllSections");
    }
    this.sections = [];
    return this.createSuccessResult<void>(undefined);
  }

  async findSectionsByUrl(sourceUrl: string): Promise<HeadingSection[]> {
    this.throwIfErrorSet();
    return this.sections.filter((s) => s.sourceUrl === sourceUrl);
  }

  async findSectionsByLevel(level: number): Promise<HeadingSection[]> {
    this.throwIfErrorSet();
    return this.sections.filter((s) => s.level === level);
  }

  async searchSectionsByTitle(searchTerm: string): Promise<HeadingSection[]> {
    this.throwIfErrorSet();
    const lowerSearchTerm = searchTerm.toLowerCase();
    return this.sections.filter((s) =>
      s.titleText.toLowerCase().includes(lowerSearchTerm)
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
    this.throwIfErrorSet();
    const total = this.sections.length;
    const sections = this.sections.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    return { sections, total, hasMore };
  }

  async updateSection(section: HeadingSection): Promise<Result<void>> {
    if (this.shouldThrowError) {
      return this.createErrorResult<void>("Test error in updateSection");
    }
    const index = this.sections.findIndex(
      (s) => s.sectionId === section.sectionId
    );
    if (index >= 0) {
      this.sections[index] = section;
      return this.createSuccessResult<void>(undefined);
    }
    return this.createErrorResult<void>("Section not found");
  }

  async sectionExists(sectionId: Id): Promise<boolean> {
    this.throwIfErrorSet();
    return this.sections.some((s) => s.sectionId === sectionId);
  }

  async findDuplicateSection(params: {
    sourceUrl: string;
    level: number;
    titleText: string;
  }): Promise<HeadingSection | null> {
    this.throwIfErrorSet();

    // Normalize the input title text for consistent comparison
    const normalizedInputTitle = params.titleText.trim().toLowerCase();

    // Find a section that matches URL, level, and title (case-insensitive)
    const duplicateSection = this.sections.find((section) => {
      const normalizedSectionTitle = section.titleText.trim().toLowerCase();

      return (
        section.sourceUrl === params.sourceUrl &&
        section.level === params.level &&
        normalizedSectionTitle === normalizedInputTitle
      );
    });

    return duplicateSection || null;
  }

  async getSectionCount(): Promise<number> {
    this.throwIfErrorSet();
    return this.sections.length;
  }
}

describe("Application Layer - Heading Collection Use Cases", () => {
  let mockRepository: MockHeadingSectionRepository;
  let addUseCase: AddHeadingSectionUseCase;
  let getUseCase: GetHeadingSectionsUseCase;

  beforeEach(() => {
    mockRepository = new MockHeadingSectionRepository();
    addUseCase = new AddHeadingSectionUseCase(mockRepository);
    getUseCase = new GetHeadingSectionsUseCase(mockRepository);
  });

  describe("AddHeadingSectionUseCase", () => {
    const validInput: AddHeadingSectionInput = {
      level: 2,
      title: "Test Heading",
      content: "<h2>Test Heading</h2><p>Test content</p>",
      sourceUrl: "https://example.com/page",
    };

    describe("Input Validation", () => {
      test("should reject invalid heading level", async () => {
        const result = await addUseCase.execute({
          ...validInput,
          level: 0,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errorCode).toBe("INVALID_INPUT");
          expect(result.message).toContain("level must be");
        }
      });

      test("should reject empty title", async () => {
        const result = await addUseCase.execute({
          ...validInput,
          title: "",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errorCode).toBe("INVALID_INPUT");
          expect(result.message).toContain("Title must be");
        }
      });

      test("should reject invalid URL", async () => {
        const result = await addUseCase.execute({
          ...validInput,
          sourceUrl: "not-a-url",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errorCode).toBe("INVALID_INPUT");
          expect(result.message).toContain("valid URL");
        }
      });

      test("should reject invalid custom ID", async () => {
        const result = await addUseCase.execute({
          ...validInput,
          id: "",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errorCode).toBe("INVALID_INPUT");
          expect(result.message).toContain("Custom ID");
        }
      });
    });

    describe("Successful Operation", () => {
      test("should successfully add a valid heading section", async () => {
        const result = await addUseCase.execute(validInput);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.sectionId).toBeDefined();
        }

        const sections = mockRepository.getSections();
        expect(sections).toHaveLength(1);
        expect(sections[0].titleText).toBe("Test Heading");
        expect(sections[0].level).toBe(2);
        expect(sections[0].sourceUrl).toBe("https://example.com/page");
      });

      test("should handle missing content by generating default HTML", async () => {
        const result = await addUseCase.execute({
          ...validInput,
          content: undefined,
        });

        expect(result.success).toBe(true);

        const sections = mockRepository.getSections();
        expect(sections[0].contentHtml).toBe("<h2>Test Heading</h2>");
      });

      test("should use custom ID when provided", async () => {
        const customId = "custom-section-id";
        const result = await addUseCase.execute({
          ...validInput,
          id: customId,
        });

        expect(result.success).toBe(true);

        const sections = mockRepository.getSections();
        expect(sections[0].sectionId).toBe(customId);
      });
    });

    describe("Duplicate Prevention", () => {
      test("should prevent adding duplicate sections with same ID", async () => {
        const customId = "duplicate-id";

        // Add first section
        await addUseCase.execute({
          ...validInput,
          id: customId,
        });

        // Try to add duplicate
        const result = await addUseCase.execute({
          ...validInput,
          id: customId,
          title: "Different Title",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errorCode).toBe("INVALID_INPUT");
          expect(result.message).toContain("already exists");
        }

        // Should still have only one section
        expect(mockRepository.getSections()).toHaveLength(1);
      });
    });

    describe("Error Handling", () => {
      test("should handle storage quota exceeded error", async () => {
        mockRepository.setError("storage_quota");

        const result = await addUseCase.execute(validInput);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errorCode).toBe("STORAGE_QUOTA_EXCEEDED");
          expect(result.message).toContain("quota exceeded");
        }
      });

      test("should handle repository errors", async () => {
        mockRepository.setError("repository_error");

        const result = await addUseCase.execute(validInput);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errorCode).toBe("REPOSITORY_ERROR");
          expect(result.message).toContain("Failed to save");
        }
      });

      test("should handle unknown errors", async () => {
        mockRepository.setError("unknown");

        const result = await addUseCase.execute(validInput);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errorCode).toBe("UNKNOWN_ERROR");
          expect(result.message).toContain("unexpected error");
        }
      });
    });
  });

  describe("GetHeadingSectionsUseCase", () => {
    const sampleSections: HeadingSection[] = [
      {
        level: 1,
        tagName: "H1",
        titleText: "Main Title",
        contentHtml: "<h1>Main Title</h1><p>Main content</p>",
        sourceUrl: "https://example.com/page1",
        addedAt: new Date("2024-01-01"),
        sectionId: "section-1",
      },
      {
        level: 2,
        tagName: "H2",
        titleText: "Subtitle",
        contentHtml: "<h2>Subtitle</h2><p>Sub content</p>",
        sourceUrl: "https://example.com/page2",
        addedAt: new Date("2024-01-02"),
        sectionId: "section-2",
      },
      {
        level: 1,
        tagName: "H1",
        titleText: "Another Title",
        contentHtml: "<h1>Another Title</h1><p>More content</p>",
        sourceUrl: "https://example.com/page1",
        addedAt: new Date("2024-01-03"),
        sectionId: "section-3",
      },
    ];

    beforeEach(() => {
      mockRepository.setSections(sampleSections);
    });

    describe("Basic Retrieval", () => {
      test("should retrieve all sections when no filters applied", async () => {
        const result = await getUseCase.execute();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.sections).toHaveLength(3);
          expect(result.totalCount).toBe(3);
          expect(result.metadata.hasFilters).toBe(false);
        }
      });

      test("should return empty array when no sections exist", async () => {
        mockRepository.setSections([]);

        const result = await getUseCase.execute();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.sections).toHaveLength(0);
          expect(result.totalCount).toBe(0);
        }
      });
    });

    describe("Filtering", () => {
      test("should filter by source URL", async () => {
        const result = await getUseCase.execute({
          sourceUrl: "https://example.com/page1",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.sections).toHaveLength(2);
          expect(
            result.sections.every(
              (s) => s.sourceUrl === "https://example.com/page1"
            )
          ).toBe(true);
          expect(result.metadata.hasFilters).toBe(true);
        }
      });

      test("should filter by heading level", async () => {
        const result = await getUseCase.execute({
          level: 1,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.sections).toHaveLength(2);
          expect(result.sections.every((s) => s.level === 1)).toBe(true);
        }
      });

      test("should filter by search text", async () => {
        const result = await getUseCase.execute({
          searchText: "Main",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.sections).toHaveLength(1);
          expect(result.sections[0].titleText).toBe("Main Title");
        }
      });

      test("should filter by date range", async () => {
        const result = await getUseCase.execute({
          startDate: new Date("2024-01-02"),
          endDate: new Date("2024-01-03"),
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.sections).toHaveLength(2);
        }
      });
    });

    describe("Sorting", () => {
      test("should sort by title text ascending", async () => {
        const result = await getUseCase.execute({
          sortBy: "titleText",
          sortOrder: "asc",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.sections[0].titleText).toBe("Another Title");
          expect(result.sections[1].titleText).toBe("Main Title");
          expect(result.sections[2].titleText).toBe("Subtitle");
        }
      });

      test("should sort by level descending", async () => {
        const result = await getUseCase.execute({
          sortBy: "level",
          sortOrder: "desc",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.sections[0].level).toBe(2);
          expect(result.sections[1].level).toBe(1);
          expect(result.sections[2].level).toBe(1);
        }
      });

      test("should use default sorting (addedAt desc) when not specified", async () => {
        const result = await getUseCase.execute();

        expect(result.success).toBe(true);
        if (result.success) {
          // Should be sorted by addedAt descending (newest first)
          expect(result.sections[0].sectionId).toBe("section-3"); // 2024-01-03
          expect(result.sections[1].sectionId).toBe("section-2"); // 2024-01-02
          expect(result.sections[2].sectionId).toBe("section-1"); // 2024-01-01
        }
      });
    });

    describe("Limiting", () => {
      test("should limit results when specified", async () => {
        const result = await getUseCase.execute({
          limit: 2,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.sections).toHaveLength(2);
          expect(result.totalCount).toBe(3); // Total before limiting
          expect(result.metadata.wasLimited).toBe(true);
        }
      });

      test("should not limit when limit is greater than available sections", async () => {
        const result = await getUseCase.execute({
          limit: 10,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.sections).toHaveLength(3);
          expect(result.totalCount).toBe(3);
          expect(result.metadata.wasLimited).toBe(false);
        }
      });
    });

    describe("Input Validation", () => {
      test("should reject invalid heading level", async () => {
        const result = await getUseCase.execute({
          level: 0,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errorCode).toBe("INVALID_INPUT");
          expect(result.message).toContain("level must be");
        }
      });

      test("should reject invalid URL", async () => {
        const result = await getUseCase.execute({
          sourceUrl: "not-a-url",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errorCode).toBe("INVALID_INPUT");
          expect(result.message).toContain("valid URL");
        }
      });

      test("should reject invalid date range", async () => {
        const result = await getUseCase.execute({
          startDate: new Date("2024-01-03"),
          endDate: new Date("2024-01-01"),
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errorCode).toBe("INVALID_INPUT");
          expect(result.message).toContain("Start date must be before");
        }
      });

      test("should reject invalid limit", async () => {
        const result = await getUseCase.execute({
          limit: 0,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errorCode).toBe("INVALID_INPUT");
          expect(result.message).toContain("positive integer");
        }
      });
    });

    describe("Error Handling", () => {
      test("should handle repository errors", async () => {
        mockRepository.setError("repository_error");

        const result = await getUseCase.execute();

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errorCode).toBe("REPOSITORY_ERROR");
          expect(result.message).toContain("Failed to retrieve");
        }
      });

      test("should handle unknown errors", async () => {
        mockRepository.setError("unknown");

        const result = await getUseCase.execute();

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errorCode).toBe("UNKNOWN_ERROR");
          expect(result.message).toContain("unexpected error");
        }
      });
    });
  });

  describe("Integration Scenarios", () => {
    test("should handle add then get workflow", async () => {
      const addInput: AddHeadingSectionInput = {
        level: 3,
        title: "Integration Test",
        content: "<h3>Integration Test</h3><p>Test content</p>",
        sourceUrl: "https://test.com",
      };

      // Add a section
      const addResult = await addUseCase.execute(addInput);
      expect(addResult.success).toBe(true);

      // Retrieve all sections
      const getResult = await getUseCase.execute();
      expect(getResult.success).toBe(true);

      if (getResult.success) {
        expect(getResult.sections).toHaveLength(1);
        expect(getResult.sections[0].titleText).toBe("Integration Test");
        expect(getResult.sections[0].level).toBe(3);
      }
    });

    test("should handle complex filtering after adding multiple sections", async () => {
      // Add multiple sections
      const sections = [
        { level: 1, title: "Title A", sourceUrl: "https://site1.com" },
        { level: 2, title: "Title B", sourceUrl: "https://site2.com" },
        { level: 1, title: "Title C", sourceUrl: "https://site1.com" },
      ];

      for (const section of sections) {
        await addUseCase.execute({
          ...section,
          content: `<h${section.level}>${section.title}</h${section.level}>`,
        });
      }

      // Filter by source URL and level
      const result = await getUseCase.execute({
        sourceUrl: "https://site1.com",
        sortBy: "titleText",
        sortOrder: "asc",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.sections).toHaveLength(2);
        expect(result.sections[0].titleText).toBe("Title A");
        expect(result.sections[1].titleText).toBe("Title C");
      }
    });
  });
});
