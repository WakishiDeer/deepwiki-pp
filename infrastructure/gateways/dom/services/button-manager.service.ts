import {
  IButtonManager,
  ButtonState,
} from "../interfaces/button-manager.interface";
import { HeadingSection } from "../../../../domain/heading-collection";
import { HeadingElementFinder } from "../strategies/heading-element-finder";
import { ButtonFactory } from "../factories/button.factory";
import { BUTTON_CONSTANTS } from "../utils/button-styles";
import { DomHelpers } from "../utils/dom-helpers";

/**
 * Button management service
 *
 * Handles button creation, insertion, removal, and state management
 */
export class ButtonManagerService implements IButtonManager {
  private readonly buttonClass = BUTTON_CONSTANTS.CLASS_NAME;
  private readonly processedAttribute = BUTTON_CONSTANTS.PROCESSED_ATTRIBUTE;
  private readonly buttons = new Map<string, HTMLButtonElement>();

  constructor(
    private readonly headingFinder: HeadingElementFinder,
    private readonly buttonFactory: ButtonFactory
  ) {}

  /**
   * Inserts buttons for heading sections
   */
  insertButtons(
    sections: HeadingSection[],
    onButtonClick: (section: HeadingSection) => void
  ): void {
    console.log(`DeepWiki++: Attempting to insert ${sections.length} buttons`);

    // Remove existing buttons
    this.removeAllButtons();

    let successCount = 0;
    sections.forEach((section, index) => {
      const buttonId = this.generateButtonId(section, index);

      // Check if already processed
      if (this.buttons.has(buttonId)) {
        console.debug(`DeepWiki++: Button ${buttonId} already exists`);
        return;
      }

      // Find heading element
      const headingElement = this.headingFinder.find(section, index);
      if (!headingElement) {
        console.warn(
          `DeepWiki++: Failed to find heading for "${section.titleText}"`
        );
        return;
      }

      // Check if element is already processed
      if (headingElement.hasAttribute(this.processedAttribute)) {
        console.debug(
          `DeepWiki++: Heading "${section.titleText}" already processed`
        );
        return;
      }

      // Create button
      const button = this.buttonFactory.create(
        section,
        index,
        (clickedSection) => {
          this.handleButtonClick(buttonId, clickedSection, onButtonClick);
        }
      );

      // Insert button
      if (this.insertButton(headingElement, button)) {
        this.buttons.set(buttonId, button);
        DomHelpers.safeSetAttribute(
          headingElement,
          this.processedAttribute,
          "true"
        );
        successCount++;
        console.log(
          `DeepWiki++: Successfully inserted button for "${section.titleText}"`
        );
      }
    });

    console.log(
      `DeepWiki++: Successfully inserted ${successCount}/${sections.length} buttons`
    );
  }

  /**
   * Removes all buttons
   */
  removeAllButtons(): void {
    // Remove individual buttons
    this.buttons.forEach((button, id) => {
      ButtonFactory.removeButton(button);
    });
    this.buttons.clear();

    // Remove remaining buttons by class name
    const remainingButtons = DomHelpers.safeQuerySelectorAll(
      `.${this.buttonClass}`
    );
    remainingButtons.forEach((button) => {
      DomHelpers.safeRemoveElement(button);
    });

    // Remove processed attributes
    const processedElements = DomHelpers.safeQuerySelectorAll(
      `[${this.processedAttribute}]`
    );
    processedElements.forEach((element) => {
      DomHelpers.safeRemoveAttribute(element, this.processedAttribute);
    });

    console.debug("DeepWiki++: Removed all buttons and cleaned up attributes");
  }

  /**
   * Updates button state
   */
  updateButtonState(buttonId: string, state: ButtonState): void {
    const button = this.buttons.get(buttonId);
    if (!button) {
      console.warn(`DeepWiki++: Button ${buttonId} not found`);
      return;
    }

    ButtonFactory.updateButtonState(button, state);
  }

  /**
   * Gets the count of inserted buttons
   */
  getButtonCount(): number {
    return this.buttons.size;
  }

  /**
   * Generates button ID
   */
  private generateButtonId(section: HeadingSection, index: number): string {
    const normalizedTitle = section.titleText
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9\-]/g, "")
      .toLowerCase();
    return `dwpp-btn-${index}-${normalizedTitle}`;
  }

  /**
   * Inserts button into DOM element
   */
  private insertButton(
    headingElement: Element,
    button: HTMLButtonElement
  ): boolean {
    try {
      // Method 1: Insert immediately after heading element
      if (this.insertButtonAfterElement(headingElement, button)) {
        return true;
      }

      // Method 2: Insert inline within heading element
      if (this.insertButtonInline(headingElement, button)) {
        return true;
      }

      // Method 3: Insert at end of parent element
      if (this.insertButtonInParent(headingElement, button)) {
        return true;
      }

      console.error("DeepWiki++: All insertion methods failed");
      return false;
    } catch (error) {
      console.error(`DeepWiki++: Error inserting button:`, error);
      return false;
    }
  }

  /**
   * Inserts button immediately after heading element
   */
  private insertButtonAfterElement(
    headingElement: Element,
    button: HTMLButtonElement
  ): boolean {
    try {
      const parent = headingElement.parentNode;
      if (!parent) return false;

      return DomHelpers.safeInsertElement(parent, button, headingElement);
    } catch (error) {
      console.debug("DeepWiki++: After-element insertion failed:", error);
      return false;
    }
  }

  /**
   * Inserts button inline (alternative method)
   */
  private insertButtonInline(
    headingElement: Element,
    button: HTMLButtonElement
  ): boolean {
    try {
      const wrapper = document.createElement("span");
      wrapper.style.marginLeft = "10px";
      wrapper.style.verticalAlign = "middle";
      wrapper.style.display = "inline-block";
      wrapper.appendChild(button);

      headingElement.appendChild(wrapper);
      return true;
    } catch (error) {
      console.debug("DeepWiki++: Inline insertion failed:", error);
      return false;
    }
  }

  /**
   * Inserts button in parent element (last resort)
   */
  private insertButtonInParent(
    headingElement: Element,
    button: HTMLButtonElement
  ): boolean {
    try {
      const parent = headingElement.parentNode;
      if (!parent) return false;

      // Create wrapper to make button visible
      const wrapper = document.createElement("div");
      wrapper.style.marginTop = "5px";
      wrapper.style.marginBottom = "5px";
      wrapper.appendChild(button);

      parent.appendChild(wrapper);
      return true;
    } catch (error) {
      console.debug("DeepWiki++: Parent insertion failed:", error);
      return false;
    }
  }

  /**
   * Handles button click
   */
  private handleButtonClick(
    buttonId: string,
    section: HeadingSection,
    onButtonClick: (section: HeadingSection) => void
  ): void {
    // Update state to "adding"
    this.updateButtonState(buttonId, "adding");

    try {
      // Execute callback
      onButtonClick(section);

      // Update to success state
      this.updateButtonState(buttonId, "success");

      // Return to default state after specified time
      setTimeout(() => {
        this.updateButtonState(buttonId, "default");
      }, BUTTON_CONSTANTS.FEEDBACK_DURATION.SUCCESS);
    } catch (error) {
      console.error("DeepWiki++: Error handling button click:", error);

      // Update to error state
      this.updateButtonState(buttonId, "error");

      // Return to default state after specified time
      setTimeout(() => {
        this.updateButtonState(buttonId, "default");
      }, BUTTON_CONSTANTS.FEEDBACK_DURATION.ERROR);
    }
  }
}
