import { IDomGateway } from "../interfaces/dom-gateway.interface";
import { ChromeDomGateway } from "../implementations/chrome-dom-gateway";

/**
 * DOM Gateway Factory
 *
 * Creates appropriate DOM gateway implementation based on environment
 */
export class DomGatewayFactory {
  /**
   * Creates a DOM gateway instance
   * @returns Created DOM gateway instance
   */
  static create(): IDomGateway {
    // Future enhancement: Return different implementations based on environment
    // Examples: Mock implementation for testing, different browser implementations

    if (DomGatewayFactory.isTestEnvironment()) {
      // For test environment, return mock implementation (future enhancement)
      console.debug("DeepWiki++: Creating test DOM gateway");
      return new ChromeDomGateway(); // Currently using Chrome implementation
    }

    if (DomGatewayFactory.isChromeExtension()) {
      console.debug("DeepWiki++: Creating Chrome extension DOM gateway");
      return new ChromeDomGateway();
    }

    // Default to Chrome implementation
    console.debug("DeepWiki++: Creating default Chrome DOM gateway");
    return new ChromeDomGateway();
  }

  /**
   * Determines if running in test environment
   * @returns true if in test environment
   */
  private static isTestEnvironment(): boolean {
    return (
      (typeof process !== "undefined" && process.env?.NODE_ENV === "test") ||
      (typeof window !== "undefined" && (window as any).__JEST__ === true)
    );
  }

  /**
   * Determines if running in Chrome extension environment
   * @returns true if in Chrome extension environment
   */
  private static isChromeExtension(): boolean {
    return (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.id !== undefined
    );
  }

  /**
   * Gets available implementation types
   * @returns Array of available implementation types
   */
  static getAvailableImplementations(): string[] {
    const implementations = ["chrome"];

    if (DomGatewayFactory.isTestEnvironment()) {
      implementations.push("test");
    }

    return implementations;
  }

  /**
   * Creates a DOM gateway with specific implementation type
   * @param implementationType - Implementation type
   * @returns DOM gateway instance of specified implementation
   */
  static createSpecific(implementationType: string): IDomGateway {
    switch (implementationType.toLowerCase()) {
      case "chrome":
        return new ChromeDomGateway();

      case "test":
        // Test implementation (future enhancement)
        console.warn(
          "DeepWiki++: Test implementation not yet available, using Chrome implementation"
        );
        return new ChromeDomGateway();

      default:
        console.warn(
          `DeepWiki++: Unknown implementation type "${implementationType}", using default`
        );
        return new ChromeDomGateway();
    }
  }
}
