/**
 * Tests for DeepWiki URL parsing functionality
 */

describe("DeepWiki URL Parser", () => {
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

  describe("parseDeepWikiUrl", () => {
    test("should parse repository top page URL correctly", () => {
      const url = "https://deepwiki.com/microsoft/vscode";
      const result = parseDeepWikiUrl(url);

      expect(result.repo).toBe("microsoft/vscode");
      expect(result.pageTitle).toBe("Overview");
      expect(result.repoUrl).toBe("https://deepwiki.com/microsoft/vscode");
    });

    test("should parse individual page URL correctly", () => {
      const url =
        "https://deepwiki.com/microsoft/vscode/1.1-application-startup-and-process-architecture";
      const result = parseDeepWikiUrl(url);

      expect(result.repo).toBe("microsoft/vscode");
      expect(result.pageTitle).toBe(
        "Application Startup And Process Architecture"
      );
      expect(result.repoUrl).toBe("https://deepwiki.com/microsoft/vscode");
    });

    test("should parse complex page URL with nested paths", () => {
      const url =
        "https://deepwiki.com/microsoft/vscode/1.2-build-system-and-package-management";
      const result = parseDeepWikiUrl(url);

      expect(result.repo).toBe("microsoft/vscode");
      expect(result.pageTitle).toBe("Build System And Package Management");
      expect(result.repoUrl).toBe("https://deepwiki.com/microsoft/vscode");
    });

    test("should handle different organization and repository names", () => {
      const url = "https://deepwiki.com/facebook/react/2-components-and-props";
      const result = parseDeepWikiUrl(url);

      expect(result.repo).toBe("facebook/react");
      expect(result.pageTitle).toBe("Components And Props");
      expect(result.repoUrl).toBe("https://deepwiki.com/facebook/react");
    });

    test("should handle URLs with single-digit prefixes", () => {
      const url =
        "https://deepwiki.com/microsoft/vscode/1-vs-code-architecture-overview";
      const result = parseDeepWikiUrl(url);

      expect(result.repo).toBe("microsoft/vscode");
      expect(result.pageTitle).toBe("Vs Code Architecture Overview");
      expect(result.repoUrl).toBe("https://deepwiki.com/microsoft/vscode");
    });

    test("should handle URLs without number prefixes", () => {
      const url =
        "https://deepwiki.com/microsoft/vscode/extension-system-overview";
      const result = parseDeepWikiUrl(url);

      expect(result.repo).toBe("microsoft/vscode");
      expect(result.pageTitle).toBe("Extension System Overview");
      expect(result.repoUrl).toBe("https://deepwiki.com/microsoft/vscode");
    });

    test("should handle invalid URLs gracefully", () => {
      const url = "not-a-valid-url";
      const result = parseDeepWikiUrl(url);

      expect(result.repo).toBe("Unknown");
      expect(result.pageTitle).toBe("");
      expect(result.repoUrl).toBe("not-a-valid-url");
    });

    test("should handle URLs with insufficient path parts", () => {
      const url = "https://deepwiki.com/microsoft";
      const result = parseDeepWikiUrl(url);

      expect(result.repo).toBe("deepwiki.com");
      expect(result.pageTitle).toBe("");
      expect(result.repoUrl).toBe("https://deepwiki.com/microsoft");
    });

    test("should handle non-DeepWiki URLs", () => {
      const url = "https://github.com/microsoft/vscode";
      const result = parseDeepWikiUrl(url);

      expect(result.repo).toBe("microsoft/vscode");
      expect(result.pageTitle).toBe("Overview");
      expect(result.repoUrl).toBe("https://github.com/microsoft/vscode");
    });
  });

  describe("formatPageTitle", () => {
    test("should remove number prefix and format title correctly", () => {
      expect(
        formatPageTitle("1.1-application-startup-and-process-architecture")
      ).toBe("Application Startup And Process Architecture");
    });

    test("should handle single-digit prefixes", () => {
      expect(formatPageTitle("1-vs-code-architecture-overview")).toBe(
        "Vs Code Architecture Overview"
      );
    });

    test("should handle titles without number prefixes", () => {
      expect(formatPageTitle("extension-system-overview")).toBe(
        "Extension System Overview"
      );
    });

    test("should handle empty strings", () => {
      expect(formatPageTitle("")).toBe("");
    });

    test("should handle single words", () => {
      expect(formatPageTitle("overview")).toBe("Overview");
    });

    test("should handle complex number prefixes", () => {
      expect(formatPageTitle("2.3.1-complex-nested-architecture")).toBe(
        "Complex Nested Architecture"
      );
    });

    test("should preserve capitalization where appropriate", () => {
      expect(formatPageTitle("1-api-reference-guide")).toBe(
        "Api Reference Guide"
      );
    });

    test("should handle multiple hyphens correctly", () => {
      expect(formatPageTitle("1-multi-word-hyphenated-title")).toBe(
        "Multi Word Hyphenated Title"
      );
    });
  });

  describe("Integration scenarios", () => {
    test("should handle real-world DeepWiki URLs correctly", () => {
      const testCases = [
        {
          url: "https://deepwiki.com/microsoft/vscode",
          expectedRepo: "microsoft/vscode",
          expectedTitle: "Overview",
          expectedRepoUrl: "https://deepwiki.com/microsoft/vscode",
        },
        {
          url: "https://deepwiki.com/microsoft/vscode/1-vs-code-architecture-overview",
          expectedRepo: "microsoft/vscode",
          expectedTitle: "Vs Code Architecture Overview",
          expectedRepoUrl: "https://deepwiki.com/microsoft/vscode",
        },
        {
          url: "https://deepwiki.com/microsoft/vscode/1.2-build-system-and-package-management",
          expectedRepo: "microsoft/vscode",
          expectedTitle: "Build System And Package Management",
          expectedRepoUrl: "https://deepwiki.com/microsoft/vscode",
        },
      ];

      testCases.forEach(
        ({ url, expectedRepo, expectedTitle, expectedRepoUrl }) => {
          const result = parseDeepWikiUrl(url);
          expect(result.repo).toBe(expectedRepo);
          expect(result.pageTitle).toBe(expectedTitle);
          expect(result.repoUrl).toBe(expectedRepoUrl);
        }
      );
    });
  });
});
