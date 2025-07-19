import { addSvgClass } from "../shared/html/add-svg-class";

describe("addSvgClass", () => {
  const defaultClass = "dwpp-mermaid-svg";

  describe("when HTML contains Mermaid SVG elements", () => {
    it("should add the class to Mermaid SVG with id", () => {
      const html = '<svg id="mermaid-123" viewBox="0 0 10 10"></svg>';
      const result = addSvgClass(html);

      expect(result).toContain(`class="${defaultClass}"`);
      expect(result).toBe(
        `<svg id="mermaid-123" viewBox="0 0 10 10" class="${defaultClass}"></svg>`
      );
    });

    it("should add the class to Mermaid SVG with aria-roledescription", () => {
      const html =
        '<svg aria-roledescription="flowchart diagram" width="10"></svg>';
      const result = addSvgClass(html);

      expect(result).toContain(`class="${defaultClass}"`);
      expect(result).toBe(
        `<svg aria-roledescription="flowchart diagram" width="10" class="${defaultClass}"></svg>`
      );
    });

    it("should append the class when Mermaid SVG has existing class", () => {
      const html = '<svg id="mermaid-456" class="foo" width="10"></svg>';
      const result = addSvgClass(html);

      expect(result).toContain(`class="foo ${defaultClass}"`);
      expect(result).toBe(
        `<svg id="mermaid-456" class="foo ${defaultClass}" width="10"></svg>`
      );
    });

    it("should not duplicate the class if it already exists", () => {
      const html = `<svg id="mermaid-789" class="${defaultClass} bar"></svg>`;
      const result = addSvgClass(html);

      const matches = result.match(new RegExp(defaultClass, "g"));
      expect(matches).toHaveLength(1);
      expect(result).toBe(html); // Should remain unchanged
    });

    it("should handle multiple Mermaid SVG elements", () => {
      const html =
        '<svg id="mermaid-123" class="first"></svg><div><svg id="mermaid-456" viewBox="0 0 100 100"></svg></div>';
      const result = addSvgClass(html);

      expect(result).toContain(`class="first ${defaultClass}"`);
      expect(result).toContain(`viewBox="0 0 100 100" class="${defaultClass}"`);
    });

    it("should handle Mermaid SVG with mermaid class", () => {
      const html =
        '<svg class="mermaid-graph" xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>';
      const result = addSvgClass(html);

      expect(result).toContain(`class="mermaid-graph ${defaultClass}"`);
      expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it("should ignore non-Mermaid SVG elements", () => {
      const html =
        '<svg id="logo" viewBox="0 0 10 10"></svg><svg class="icon" width="20"></svg>';
      const result = addSvgClass(html);

      expect(result).toBe(html); // Should remain unchanged
      expect(result).not.toContain(defaultClass);
    });

    it("should only add class to Mermaid SVGs in mixed content", () => {
      const html =
        '<svg id="logo" viewBox="0 0 10 10"></svg><svg id="mermaid-123" width="100"></svg><svg class="icon"></svg>';
      const result = addSvgClass(html);

      expect(result).toContain('<svg id="logo" viewBox="0 0 10 10"></svg>'); // Unchanged
      expect(result).toContain(
        `<svg id="mermaid-123" width="100" class="${defaultClass}"></svg>`
      ); // Class added
      expect(result).toContain('<svg class="icon"></svg>'); // Unchanged
    });

    it("should work with custom class name for Mermaid SVG", () => {
      const html = '<svg id="mermaid-123" viewBox="0 0 10 10"></svg>';
      const customClass = "my-custom-class";
      const result = addSvgClass(html, customClass);

      expect(result).toContain(`class="${customClass}"`);
      expect(result).not.toContain(defaultClass);
    });

    it("should handle case-insensitive class detection for Mermaid SVG", () => {
      const html = `<svg id="mermaid-123" CLASS="DWPP-MERMAID-SVG"></svg>`;
      const result = addSvgClass(html);

      // Should not add duplicate class (case-insensitive check)
      expect(result).toBe(html);
    });
  });

  describe("when HTML does not contain SVG elements", () => {
    it("should leave HTML without svg untouched", () => {
      const html = "<p>No svg here</p><div>Just regular content</div>";
      const result = addSvgClass(html);

      expect(result).toBe(html);
    });

    it("should handle empty string", () => {
      const result = addSvgClass("");
      expect(result).toBe("");
    });

    it("should handle null input", () => {
      const result = addSvgClass(null as any);
      expect(result).toBe(null);
    });

    it("should handle undefined input", () => {
      const result = addSvgClass(undefined as any);
      expect(result).toBe(undefined);
    });
  });

  describe("edge cases", () => {
    it("should handle non-Mermaid SVG with malformed content", () => {
      const html = "<svg><invalid></svg>";
      const result = addSvgClass(html);

      // Should remain unchanged since it's not a Mermaid SVG
      expect(result).toBe(html);
    });

    it("should handle Mermaid SVG with malformed content", () => {
      const html = '<svg id="mermaid-123"><invalid></svg>';
      const result = addSvgClass(html);

      expect(result).toContain(`class="${defaultClass}"`);
    });

    it("should handle non-Mermaid SVG tags with quotes in attributes", () => {
      const html = `<svg title='My "quoted" title'></svg>`;
      const result = addSvgClass(html);

      // Should remain unchanged since it's not a Mermaid SVG
      expect(result).toBe(html);
    });

    it("should handle Mermaid SVG with mixed quote styles in class attribute", () => {
      const html = `<svg id="mermaid-123" class='existing-class'></svg>`;
      const result = addSvgClass(html);

      expect(result).toContain(`existing-class ${defaultClass}`);
    });
  });
});
