export function transformUrl(
  urlString: string,
  hostPairs: Array<[string, string]> = [["github.com", "deepwiki.com"]]
): string | null {
  try {
    const url = new URL(urlString);
    for (const [a, b] of hostPairs) {
      if (url.hostname === a) {
        // GitHub → DeepWiki: Extract repository path and redirect to DeepWiki
        const pathParts = url.pathname
          .split("/")
          .filter((part) => part.length > 0);
        if (pathParts.length >= 2) {
          // Path format: /owner/repo/... → https://deepwiki.com/owner/repo
          const owner = pathParts[0];
          const repo = pathParts[1];
          return `https://${b}/${owner}/${repo}`;
        } else {
          // If path is incomplete, redirect to DeepWiki top page
          return `https://${b}/`;
        }
      }
      if (url.hostname === b) {
        // DeepWiki → GitHub: Extract repository path and redirect to GitHub
        const pathParts = url.pathname
          .split("/")
          .filter((part) => part.length > 0);
        if (pathParts.length >= 2) {
          // Path format: /owner/repo/... → https://github.com/owner/repo
          const owner = pathParts[0];
          const repo = pathParts[1];
          return `https://${a}/${owner}/${repo}`;
        } else {
          // If path is incomplete, redirect to GitHub top page
          return `https://${a}/`;
        }
      }
    }
  } catch {
    // ignore invalid URLs
  }
  return null;
}
