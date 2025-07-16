import {
  HeadingSection,
  serializeHeadingSection,
  deserializeHeadingSection,
  isHeadingSection,
} from "../../../../domain/heading-collection";

/**
 * Handles serialization and deserialization of HeadingSection entities
 * for Chrome storage operations
 */
export class HeadingSectionStorageMapper {
  /**
   * Serializes heading sections for storage
   */
  static serializeSections(sections: HeadingSection[]): any[] {
    return sections.map(serializeHeadingSection);
  }

  /**
   * Deserializes sections from storage data with validation
   */
  static deserializeSections(sectionsData: any[]): HeadingSection[] {
    if (!Array.isArray(sectionsData)) {
      console.warn("Storage data is not an array, returning empty array");
      return [];
    }

    const validSections: HeadingSection[] = [];

    for (const [index, sectionData] of sectionsData.entries()) {
      try {
        const section = deserializeHeadingSection(sectionData);
        if (isHeadingSection(section)) {
          validSections.push(section);
        } else {
          console.warn(
            `Invalid section data found at index ${index}, skipping:`,
            sectionData
          );
        }
      } catch (error) {
        console.warn(
          `Failed to deserialize section at index ${index}, skipping:`,
          sectionData,
          error
        );
      }
    }

    return validSections;
  }

  /**
   * Validates if storage data is in the expected format
   */
  static isValidStorageData(data: any): data is any[] {
    return data === undefined || Array.isArray(data);
  }
}
