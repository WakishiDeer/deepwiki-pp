import {
  HEADING_TAGS,
  getHeadingLevelFromTag,
  createHeadingTag,
  isValidHeadingLevel,
} from "../domain/heading-collection/heading-section";
import {
  createHeadingSection,
  isHeadingSection,
  serializeHeadingSection,
  deserializeHeadingSection,
} from "../domain/heading-collection/heading-section";

describe("Heading Constants", () => {
  test("HEADING_TAGS contains all heading levels", () => {
    expect(HEADING_TAGS).toEqual(["H1", "H2", "H3", "H4", "H5", "H6"]);
  });

  test("getHeadingLevelFromTag extracts correct level", () => {
    expect(getHeadingLevelFromTag("H1")).toBe(1);
    expect(getHeadingLevelFromTag("H3")).toBe(3);
    expect(getHeadingLevelFromTag("H6")).toBe(6);
    expect(getHeadingLevelFromTag("h2")).toBe(2); // case insensitive
    expect(getHeadingLevelFromTag("DIV")).toBeNull();
    expect(getHeadingLevelFromTag("H7")).toBeNull();
  });

  test("createHeadingTag returns correct tag", () => {
    expect(createHeadingTag(1)).toBe("H1");
    expect(createHeadingTag(4)).toBe("H4");
    expect(createHeadingTag(6)).toBe("H6");
    expect(() => createHeadingTag(0)).toThrow();
    expect(() => createHeadingTag(7)).toThrow();
  });

  test("isValidHeadingLevel validates correctly", () => {
    expect(isValidHeadingLevel(1)).toBe(true);
    expect(isValidHeadingLevel(6)).toBe(true);
    expect(isValidHeadingLevel(0)).toBe(false);
    expect(isValidHeadingLevel(7)).toBe(false);
    expect(isValidHeadingLevel(-1)).toBe(false);
  });
});

describe("HeadingSection Entity", () => {
  const validSectionData = {
    level: 2,
    tagName: "H2",
    titleText: "Test Heading",
    contentHtml: "<h2>Test Heading</h2><p>Some content</p>",
    sourceUrl: "https://example.com/page",
  };

  test("createHeadingSection creates valid section", () => {
    const section = createHeadingSection(validSectionData);

    expect(section.level).toBe(2);
    expect(section.tagName).toBe("H2");
    expect(section.titleText).toBe("Test Heading");
    expect(section.contentHtml).toBe(
      "<h2>Test Heading</h2><p>Some content</p>"
    );
    expect(section.sourceUrl).toBe("https://example.com/page");
    expect(section.addedAt).toBeInstanceOf(Date);
  });

  test("createHeadingSection validates level", () => {
    expect(() => {
      createHeadingSection({ ...validSectionData, level: 7 });
    }).toThrow("Invalid heading level: 7");

    expect(() => {
      createHeadingSection({ ...validSectionData, level: 0 });
    }).toThrow("Invalid heading level: 0");
  });

  test("createHeadingSection validates tag name consistency", () => {
    expect(() => {
      createHeadingSection({ ...validSectionData, level: 2, tagName: "H3" });
    }).toThrow("Tag name H3 doesn't match level 2. Expected H2");
  });

  test("createHeadingSection validates required fields", () => {
    expect(() => {
      createHeadingSection({ ...validSectionData, titleText: "" });
    }).toThrow("Title text is required");

    expect(() => {
      createHeadingSection({ ...validSectionData, contentHtml: "" });
    }).toThrow("Content HTML is required");

    expect(() => {
      createHeadingSection({ ...validSectionData, sourceUrl: "" });
    }).toThrow("Source URL is required");
  });

  test("createHeadingSection validates URL format", () => {
    expect(() => {
      createHeadingSection({ ...validSectionData, sourceUrl: "not-a-url" });
    }).toThrow("Invalid source URL: not-a-url");
  });

  test("isHeadingSection type guard works correctly", () => {
    const section = createHeadingSection(validSectionData);
    expect(isHeadingSection(section)).toBe(true);

    expect(isHeadingSection(null)).toBe(false);
    expect(isHeadingSection({})).toBe(false);
    expect(isHeadingSection({ level: "2" })).toBe(false); // wrong type
  });

  test("serialization and deserialization", () => {
    const section = createHeadingSection(validSectionData);
    const serialized = serializeHeadingSection(section);
    const deserialized = deserializeHeadingSection(serialized);

    expect(deserialized.level).toBe(section.level);
    expect(deserialized.tagName).toBe(section.tagName);
    expect(deserialized.titleText).toBe(section.titleText);
    expect(deserialized.contentHtml).toBe(section.contentHtml);
    expect(deserialized.sourceUrl).toBe(section.sourceUrl);
    expect(deserialized.addedAt.getTime()).toBe(section.addedAt.getTime());
  });
});
