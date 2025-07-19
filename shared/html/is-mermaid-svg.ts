/**
 * Utility to detect Mermaid SVG content in HTML
 */

/**
 * Checks if the HTML string contains at least one Mermaid-generated SVG
 * @param html - The HTML string to check
 * @returns true if Mermaid SVG is found, false otherwise
 */
export function containsMermaidSvg(html: string): boolean {
  if (!html?.includes("<svg")) {
    return false;
  }

  // Check for Mermaid-specific attributes in SVG tags
  return /<svg\b[^>]*(?:id\s*=\s*["']mermaid-[^"']+["']|aria-roledescription\s*=\s*["'][^"']*diagram[^"']*["']|class\s*=\s*["'][^"']*mermaid[^"']*["'])/i.test(
    html
  );
}
