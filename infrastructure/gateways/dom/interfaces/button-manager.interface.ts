import { HeadingSection } from "../../../../domain/heading-collection";

/**
 * Type representing button states
 */
export type ButtonState = "default" | "adding" | "success" | "error";

/**
 * Interface for button management
 *
 * Responsible for creating, inserting, removing, and managing button states
 */
export interface IButtonManager {
  /**
   * Inserts buttons corresponding to heading sections
   * @param sections - Target heading sections
   * @param onButtonClick - Callback for click events
   */
  insertButtons(
    sections: HeadingSection[],
    onButtonClick: (section: HeadingSection) => void
  ): void;

  /**
   * Removes all buttons
   */
  removeAllButtons(): void;

  /**
   * Updates the state of a specific button
   * @param buttonId - Button ID
   * @param state - New state
   */
  updateButtonState(buttonId: string, state: ButtonState): void;

  /**
   * Gets the number of inserted buttons
   * @returns Number of buttons
   */
  getButtonCount(): number;
}
