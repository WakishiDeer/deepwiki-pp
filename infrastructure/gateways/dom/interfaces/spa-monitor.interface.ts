/**
 * Interface for SPA monitoring
 *
 * Monitors single page application navigation and
 * dynamic content changes
 */
export interface ISPAMonitor {
  /**
   * Starts monitoring
   * @param onNavigationChange - Callback for navigation changes
   * @param onContentChange - Callback for content changes
   */
  startMonitoring(
    onNavigationChange: (url: string) => void,
    onContentChange: (container: Element) => void
  ): void;

  /**
   * Stops monitoring
   */
  stopMonitoring(): void;

  /**
   * Checks if monitoring is active
   * @returns True if monitoring is active
   */
  isMonitoring(): boolean;

  /**
   * Waits for element appearance
   * @param container - Container to monitor
   * @param selector - Element selector to wait for
   * @param timeout - Timeout in milliseconds
   * @returns True if element is found
   */
  waitForElement(
    container: Element,
    selector: string,
    timeout?: number
  ): Promise<boolean>;
}
