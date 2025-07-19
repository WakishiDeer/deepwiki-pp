/**
 * HTML utility for adding CSS classes to SVG elements
 */

/**
 * Injects a class attribute into Mermaid-generated <svg> tags that
 * do not already contain that class.
 *
 * @param html - The HTML string to process
 * @param className - The CSS class to add (default: "dwpp-mermaid-svg")
 * @returns The modified HTML string with classes added to Mermaid SVG elements
 */
export function addSvgClass(
  html: string,
  className = "dwpp-mermaid-svg"
): string {
  if (!html?.includes("<svg")) {
    return html;
  }

  return html.replace(/<svg\b([^>]*?)>/gi, (match, attributes) => {
    // Check if this is a Mermaid-generated SVG
    const isMermaidSvg =
      /\bid\s*=\s*["']mermaid-[^"']+["']/i.test(attributes) ||
      /\baria-roledescription\s*=\s*["'][^"']*diagram[^"']*["']/i.test(
        attributes
      ) ||
      /\bclass\s*=\s*["'][^"']*mermaid[^"']*["']/i.test(attributes);

    if (!isMermaidSvg) {
      return match; // Not a Mermaid SVG, return unchanged
    }

    // Check if the class already exists in the attributes
    const classRegex = new RegExp(`\\b${className}\\b`, "i");
    if (classRegex.test(attributes)) {
      return match; // Class already exists, return unchanged
    }

    // Check if there's already a class attribute
    const existingClassMatch = attributes.match(
      /\bclass\s*=\s*["']([^"']*)["']/i
    );

    if (existingClassMatch) {
      // Append to existing class attribute
      const existingClasses = existingClassMatch[1];
      const newAttributes = attributes.replace(
        /\bclass\s*=\s*["']([^"']*)["']/i,
        `class="${existingClasses} ${className}"`
      );
      return `<svg${newAttributes}>`;
    } else {
      // Add new class attribute
      const newAttributes = `${attributes} class="${className}"`;
      return `<svg${newAttributes}>`;
    }
  });
}
