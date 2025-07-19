import { containsMermaidSvg } from "../shared/html/is-mermaid-svg";

describe("containsMermaidSvg", () => {
  describe("when HTML contains Mermaid SVG", () => {
    it("should detect Mermaid SVG with id", () => {
      const html = '<svg id="mermaid-123" viewBox="0 0 10 10"></svg>';
      expect(containsMermaidSvg(html)).toBe(true);
    });

    it("should detect Mermaid SVG with aria-roledescription", () => {
      const html =
        '<svg aria-roledescription="flowchart diagram" width="10"></svg>';
      expect(containsMermaidSvg(html)).toBe(true);
    });

    it("should detect Mermaid SVG with mermaid class", () => {
      const html = '<svg class="mermaid-graph" width="10"></svg>';
      expect(containsMermaidSvg(html)).toBe(true);
    });

    it("should detect Mermaid SVG in mixed content", () => {
      const html =
        '<p>Some text</p><svg id="logo"></svg><svg id="mermaid-123"></svg>';
      expect(containsMermaidSvg(html)).toBe(true);
    });
  });

  describe("when HTML does not contain Mermaid SVG", () => {
    it("should not detect non-Mermaid SVG", () => {
      const html = '<svg id="logo" viewBox="0 0 10 10"></svg>';
      expect(containsMermaidSvg(html)).toBe(false);
    });

    it("should not detect regular icons", () => {
      const html = '<svg class="icon" width="20"></svg>';
      expect(containsMermaidSvg(html)).toBe(false);
    });

    it("should handle HTML without SVG", () => {
      const html = "<p>Just text content</p><div>No SVG here</div>";
      expect(containsMermaidSvg(html)).toBe(false);
    });

    it("should handle empty string", () => {
      expect(containsMermaidSvg("")).toBe(false);
    });

    it("should handle null/undefined", () => {
      expect(containsMermaidSvg(null as any)).toBe(false);
      expect(containsMermaidSvg(undefined as any)).toBe(false);
    });
  });
});
