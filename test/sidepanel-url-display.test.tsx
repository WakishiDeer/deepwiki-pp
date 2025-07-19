/**
 * Tests for Sidepanel URL display functionality (unit tests)
 */

import { HeadingSection } from "../domain/heading-collection/heading-section";

describe("Sidepanel URL Display Logic", () => {
  // Helper functions that match the implementation in sidepanel
  const parseDeepWikiUrl = (
    url: string
  ): { repo: string; pageTitle: string; repoUrl: string } => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter((p) => p);

      if (pathParts.length >= 2) {
        const repo = `${pathParts[0]}/${pathParts[1]}`;
        const repoUrl = `${urlObj.origin}/${repo}`;

        if (pathParts.length > 2) {
          // Extract page title from slug
          const pageSlug = pathParts.slice(2).join("-");
          const pageTitle = formatPageTitle(pageSlug);
          return { repo, pageTitle, repoUrl };
        }

        // Repository top page
        return { repo, pageTitle: "Overview", repoUrl };
      }

      return { repo: urlObj.hostname, pageTitle: "", repoUrl: url };
    } catch {
      return { repo: "Unknown", pageTitle: "", repoUrl: url };
    }
  };

  const formatPageTitle = (slug: string): string => {
    // Remove number prefix (e.g., "1.1-", "1-", "2.3.1-")
    const cleanSlug = slug.replace(/^\d+(\.\d+)*-/, "");

    // Convert kebab-case to Title Case
    return cleanSlug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const createMockSection = (sourceUrl: string): HeadingSection => ({
    level: 2,
    tagName: "H2",
    titleText: "Test Title Text",
    contentHtml: "<p>Test content</p>",
    sourceUrl,
    addedAt: new Date("2024-01-01T10:00:00Z"),
    sectionId: "test-section-id",
  });

  describe("URL parsing for display", () => {
    test("should parse repository top page URL correctly", () => {
      const section = createMockSection(
        "https://deepwiki.com/microsoft/vscode"
      );
      const { repo, pageTitle, repoUrl } = parseDeepWikiUrl(section.sourceUrl);

      expect(repo).toBe("microsoft/vscode");
      expect(pageTitle).toBe("Overview");
      expect(repoUrl).toBe("https://deepwiki.com/microsoft/vscode");
    });

    test("should parse individual page URL correctly", () => {
      const section = createMockSection(
        "https://deepwiki.com/microsoft/vscode/1.1-application-startup-and-process-architecture"
      );
      const { repo, pageTitle, repoUrl } = parseDeepWikiUrl(section.sourceUrl);

      expect(repo).toBe("microsoft/vscode");
      expect(pageTitle).toBe("Application Startup And Process Architecture");
      expect(repoUrl).toBe("https://deepwiki.com/microsoft/vscode");
    });

    test("should handle different repository names correctly", () => {
      const section = createMockSection(
        "https://deepwiki.com/facebook/react/2-components-and-props"
      );
      const { repo, pageTitle, repoUrl } = parseDeepWikiUrl(section.sourceUrl);

      expect(repo).toBe("facebook/react");
      expect(pageTitle).toBe("Components And Props");
      expect(repoUrl).toBe("https://deepwiki.com/facebook/react");
    });

    test("should handle URLs without number prefixes", () => {
      const section = createMockSection(
        "https://deepwiki.com/microsoft/vscode/extension-system-overview"
      );
      const { repo, pageTitle, repoUrl } = parseDeepWikiUrl(section.sourceUrl);

      expect(repo).toBe("microsoft/vscode");
      expect(pageTitle).toBe("Extension System Overview");
      expect(repoUrl).toBe("https://deepwiki.com/microsoft/vscode");
    });

    test("should handle invalid URLs gracefully", () => {
      const section = createMockSection("not-a-valid-url");
      const { repo, pageTitle, repoUrl } = parseDeepWikiUrl(section.sourceUrl);

      expect(repo).toBe("Unknown");
      expect(pageTitle).toBe("");
      expect(repoUrl).toBe("not-a-valid-url");
    });

    test("should handle non-DeepWiki URLs", () => {
      const section = createMockSection(
        "https://github.com/microsoft/vscode/blob/main/README.md"
      );
      const { repo, pageTitle, repoUrl } = parseDeepWikiUrl(section.sourceUrl);

      expect(repo).toBe("microsoft/vscode");
      expect(pageTitle).toBe("Blob Main README.md");
      expect(repoUrl).toBe("https://github.com/microsoft/vscode");
    });
  });

  describe("Integration with HeadingSection data", () => {
    test("should extract meaningful display data from real section data", () => {
      const section: HeadingSection = {
        level: 3,
        tagName: "H3",
        titleText: "Build System and Package Management",
        contentHtml:
          "<div><p>This section covers the build system...</p></div>",
        sourceUrl:
          "https://deepwiki.com/microsoft/vscode/1.2-build-system-and-package-management",
        addedAt: new Date("2024-01-15T14:30:00Z"),
        sectionId: "microsoft-vscode-build-system",
      };

      const { repo, pageTitle, repoUrl } = parseDeepWikiUrl(section.sourceUrl);

      expect(repo).toBe("microsoft/vscode");
      expect(pageTitle).toBe("Build System And Package Management");
      expect(repoUrl).toBe("https://deepwiki.com/microsoft/vscode");

      // Verify the original URL is preserved for page navigation
      expect(section.sourceUrl).toBe(
        "https://deepwiki.com/microsoft/vscode/1.2-build-system-and-package-management"
      );
    });
  });
});
