import { HeadingSection } from "../../../../domain/heading-collection";
import { BUTTON_STYLES, BUTTON_CONSTANTS } from "../utils/button-styles";
import { DomHelpers } from "../utils/dom-helpers";

/**
 * Button creation factory
 *
 * Provides unified button creation and styling
 */
export class ButtonFactory {
  private readonly buttonClass = BUTTON_CONSTANTS.CLASS_NAME;

  /**
   * Creates an add button
   * @param section - Target heading section
   * @param index - Section index
   * @param onClick - Click event callback
   * @returns Created button element
   */
  create(
    section: HeadingSection,
    index: number,
    onClick: (section: HeadingSection) => void
  ): HTMLButtonElement {
    const button = document.createElement("button");

    // Set basic attributes
    this.setBasicAttributes(button, section, index);

    // Apply styles
    this.applyDefaultStyles(button);

    // Setup event handlers
    this.setupEventHandlers(button, section, onClick);

    return button;
  }

  /**
   * Sets basic attributes
   */
  private setBasicAttributes(
    button: HTMLButtonElement,
    section: HeadingSection,
    index: number
  ): void {
    button.className = this.buttonClass;
    DomHelpers.safeSetAttribute(button, "type", "button");
    DomHelpers.safeSetAttribute(button, "data-section-index", index.toString());
    DomHelpers.safeSetAttribute(
      button,
      "title",
      `Add "${section.titleText}" to collection`
    );
    DomHelpers.safeSetAttribute(
      button,
      "aria-label",
      `Add section "${section.titleText}" to collection`
    );
    button.innerHTML = BUTTON_STYLES.states.default.icon;
  }

  /**
   * Applies default styles
   */
  private applyDefaultStyles(button: HTMLButtonElement): void {
    Object.assign(button.style, BUTTON_STYLES.default);
  }

  /**
   * Sets up event handlers
   */
  private setupEventHandlers(
    button: HTMLButtonElement,
    section: HeadingSection,
    onClick: (section: HeadingSection) => void
  ): void {
    // Click handler
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      // Do nothing if already disabled
      if (button.disabled) {
        return;
      }

      try {
        onClick(section);
      } catch (error) {
        console.error("DeepWiki++: Error in button click handler:", error);
      }
    });

    // Hover effects
    this.setupHoverEffects(button);

    // Focus handling
    this.setupFocusHandling(button);
  }

  /**
   * Sets up hover effects
   */
  private setupHoverEffects(button: HTMLButtonElement): void {
    button.addEventListener("mouseenter", () => {
      if (!button.disabled) {
        Object.assign(button.style, BUTTON_STYLES.hover);
      }
    });

    button.addEventListener("mouseleave", () => {
      if (!button.disabled) {
        Object.assign(button.style, {
          opacity: BUTTON_STYLES.default.opacity,
          backgroundColor: BUTTON_STYLES.default.backgroundColor,
        });
      }
    });
  }

  /**
   * Sets up focus handling
   */
  private setupFocusHandling(button: HTMLButtonElement): void {
    button.addEventListener("focus", () => {
      if (!button.disabled) {
        button.style.outline = "2px solid #007cba";
        button.style.outlineOffset = "2px";
      }
    });

    button.addEventListener("blur", () => {
      button.style.outline = "none";
      button.style.outlineOffset = "0";
    });

    // Keyboard navigation
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        button.click();
      }
    });
  }

  /**
   * Helper method for updating button state
   * @param button - Target button
   * @param state - New state
   */
  static updateButtonState(
    button: HTMLButtonElement,
    state: keyof typeof BUTTON_STYLES.states
  ): void {
    const stateConfig = BUTTON_STYLES.states[state];
    if (!stateConfig) {
      console.warn(`DeepWiki++: Unknown button state: ${state}`);
      return;
    }

    // Update icon
    if (stateConfig.icon) {
      button.innerHTML = stateConfig.icon;
    }

    // Update styles
    if (stateConfig.styles) {
      Object.assign(button.style, stateConfig.styles);
    }

    // Manage disabled state
    button.disabled = state === "adding";

    // Update ARIA label
    const stateLabels = {
      default: "Add to collection",
      adding: "Adding to collection...",
      success: "Successfully added to collection",
      error: "Failed to add to collection",
    };

    DomHelpers.safeSetAttribute(
      button,
      "aria-label",
      `${button.title} - ${stateLabels[state]}`
    );
  }

  /**
   * Safely removes a button
   * @param button - Button to remove
   */
  static removeButton(button: HTMLButtonElement): void {
    // Clean up event listeners
    const newButton = button.cloneNode(true) as HTMLButtonElement;
    button.parentNode?.replaceChild(newButton, button);

    // Remove element
    DomHelpers.safeRemoveElement(newButton);
  }
}
