/**
 * Test suite for duplicate section detection functionality
 *
 * This test verifies that the heading collection system properly prevents
 * duplicate sections from being added based on content similarity rather
 * than just ID uniqueness.
 */

import {
  HeadingSection,
  createHeadingSection,
  generateContentBasedId,
} from "../domain/heading-collection";

import { AddHeadingSectionUseCase } from "../application/usecases/heading-collection/add-heading-section";

describe("Duplicate Section Detection", () => {
  describe("generateContentBasedId", () => {
    it("should generate consistent IDs for identical content", () => {
      const params = {
        sourceUrl: "https://example.com/page",
        level: 2,
        titleText: "Introduction to Testing",
      };

      const id1 = generateContentBasedId(params);
      const id2 = generateContentBasedId(params);

      expect(id1).toBe(id2);
      expect(id1).toMatch(
        /^content-example-com-.*-h2-introduction-to-testing$/
      );
    });

    it("should generate different IDs for different content", () => {
      const params1 = {
        sourceUrl: "https://example.com/page",
        level: 2,
        titleText: "Introduction to Testing",
      };

      const params2 = {
        sourceUrl: "https://example.com/page",
        level: 2,
        titleText: "Advanced Testing Techniques",
      };

      const id1 = generateContentBasedId(params1);
      const id2 = generateContentBasedId(params2);

      expect(id1).not.toBe(id2);
    });

    it("should handle special characters in title text", () => {
      const params = {
        sourceUrl: "https://example.com/page",
        level: 1,
        titleText: "Chapter 1: Getting Started (Part A) - The Basics!",
      };

      const id = generateContentBasedId(params);

      expect(id).toBeDefined();
      expect(id).toMatch(
        /^content-example-com-.*-h1-chapter-1-getting-started-part-a-the-basics$/
      );
    });

    it("should handle different URLs correctly", () => {
      const params1 = {
        sourceUrl: "https://example.com/page1",
        level: 2,
        titleText: "Introduction",
      };

      const params2 = {
        sourceUrl: "https://example.com/page2",
        level: 2,
        titleText: "Introduction",
      };

      const id1 = generateContentBasedId(params1);
      const id2 = generateContentBasedId(params2);

      expect(id1).not.toBe(id2);
    });

    it("should handle invalid URLs gracefully", () => {
      const params = {
        sourceUrl: "not-a-valid-url",
        level: 1,
        titleText: "Test Title",
      };

      const id = generateContentBasedId(params);

      expect(id).toBeDefined();
      expect(id).toMatch(/^content-not-a-valid-url-h1-test-title$/);
    });
  });

  describe("AddHeadingSectionUseCase - Duplicate Detection", () => {
    let useCase: AddHeadingSectionUseCase;
    let mockRepository: any;

    beforeEach(() => {
      mockRepository = {
        findDuplicateSection: jest.fn(),
        sectionExists: jest.fn(),
        addSection: jest.fn(),
      };
      useCase = new AddHeadingSectionUseCase(mockRepository);
    });

    it("should prevent adding duplicate sections based on content", async () => {
      // Mock existing section
      const existingSection: HeadingSection = createHeadingSection({
        level: 2,
        tagName: "H2",
        titleText: "Introduction to Testing",
        contentHtml: "<h2>Introduction to Testing</h2>",
        sourceUrl: "https://example.com/testing-guide",
      });

      mockRepository.findDuplicateSection.mockResolvedValue(existingSection);

      const input = {
        level: 2,
        title: "Introduction to Testing", // Same title
        sourceUrl: "https://example.com/testing-guide", // Same URL
        content:
          "<h2>Introduction to Testing</h2><p>This is about testing...</p>",
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("INVALID_INPUT");
        expect(result.message).toContain(
          "A section with the same content already exists"
        );
        expect((result.details as any)?.existingSection).toBeDefined();
        expect((result.details as any)?.existingSection?.title).toBe(
          "Introduction to Testing"
        );
      }

      // Repository should not be called for adding since duplicate was detected
      expect(mockRepository.addSection).not.toHaveBeenCalled();
    });

    it("should allow adding sections with same title but different URL", async () => {
      mockRepository.findDuplicateSection.mockResolvedValue(null);
      mockRepository.sectionExists.mockResolvedValue(false);
      mockRepository.addSection.mockResolvedValue({ success: true });

      const input = {
        level: 2,
        title: "Introduction to Testing", // Same title
        sourceUrl: "https://different-site.com/guide", // Different URL
        content: "<h2>Introduction to Testing</h2><p>Different content...</p>",
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(mockRepository.findDuplicateSection).toHaveBeenCalledWith({
        sourceUrl: "https://different-site.com/guide",
        level: 2,
        titleText: "Introduction to Testing",
      });
      expect(mockRepository.addSection).toHaveBeenCalled();
    });

    it("should allow adding sections with same URL but different title", async () => {
      mockRepository.findDuplicateSection.mockResolvedValue(null);
      mockRepository.sectionExists.mockResolvedValue(false);
      mockRepository.addSection.mockResolvedValue({ success: true });

      const input = {
        level: 2,
        title: "Advanced Testing Techniques", // Different title
        sourceUrl: "https://example.com/testing-guide", // Same URL
        content: "<h2>Advanced Testing Techniques</h2>",
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(mockRepository.findDuplicateSection).toHaveBeenCalledWith({
        sourceUrl: "https://example.com/testing-guide",
        level: 2,
        titleText: "Advanced Testing Techniques",
      });
      expect(mockRepository.addSection).toHaveBeenCalled();
    });

    it("should allow adding sections with same title/URL but different level", async () => {
      mockRepository.findDuplicateSection.mockResolvedValue(null);
      mockRepository.sectionExists.mockResolvedValue(false);
      mockRepository.addSection.mockResolvedValue({ success: true });

      const input = {
        level: 3, // Different level
        title: "Introduction to Testing", // Same title
        sourceUrl: "https://example.com/testing-guide", // Same URL
        content: "<h3>Introduction to Testing</h3>",
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(mockRepository.findDuplicateSection).toHaveBeenCalledWith({
        sourceUrl: "https://example.com/testing-guide",
        level: 3,
        titleText: "Introduction to Testing",
      });
      expect(mockRepository.addSection).toHaveBeenCalled();
    });

    it("should handle case-insensitive title comparison", async () => {
      const existingSection: HeadingSection = createHeadingSection({
        level: 2,
        tagName: "H2",
        titleText: "introduction to testing", // lowercase
        contentHtml: "<h2>introduction to testing</h2>",
        sourceUrl: "https://example.com/testing-guide",
      });

      mockRepository.findDuplicateSection.mockResolvedValue(existingSection);

      const input = {
        level: 2,
        title: "Introduction To Testing", // Different case
        sourceUrl: "https://example.com/testing-guide",
        content: "<h2>Introduction To Testing</h2>",
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("INVALID_INPUT");
        expect(result.message).toContain(
          "A section with the same content already exists"
        );
      }
    });

    it("should handle whitespace differences in title comparison", async () => {
      const existingSection: HeadingSection = createHeadingSection({
        level: 2,
        tagName: "H2",
        titleText: "  Introduction to Testing  ", // Extra whitespace
        contentHtml: "<h2>Introduction to Testing</h2>",
        sourceUrl: "https://example.com/testing-guide",
      });

      mockRepository.findDuplicateSection.mockResolvedValue(existingSection);

      const input = {
        level: 2,
        title: "Introduction to Testing", // No extra whitespace
        sourceUrl: "https://example.com/testing-guide",
        content: "<h2>Introduction to Testing</h2>",
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("INVALID_INPUT");
        expect(result.message).toContain(
          "A section with the same content already exists"
        );
      }
    });
  });
});
