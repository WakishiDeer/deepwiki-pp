/**
 * Content selectors in priority order
 */
export const CONTENT_SELECTORS = [
  "#codebase-wiki-repo-page .markdown-body",
  "#codebase-wiki-repo-page article",
  "#codebase-wiki-repo-page .prose",
  "#codebase-wiki-repo-page",
  "main",
  '[role="main"]',
  "article",
  ".content",
  ".markdown-body",
  ".prose",
] as const;

/**
 * List of heading tags
 */
export const HEADING_SELECTORS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

/**
 * DeepWiki-specific selectors
 */
export const DEEPWIKI_SELECTORS = {
  REPO_PAGE: "#codebase-wiki-repo-page",
  MARKDOWN_BODY: ".markdown-body",
  ARTICLE: "article",
  PROSE: ".prose",
} as const;
