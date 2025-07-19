import { ChromeDomGateway } from "../../infrastructure/gateways/dom";
import { isHeadingSection } from "../../domain/heading-collection/heading-section";
import { AddHeadingSectionMessage } from "../../shared/messaging";

export default defineContentScript({
  matches: ["https://deepwiki.com/*"],
  main() {
    console.log("DeepWiki++: Content script loaded on DeepWiki");

    // Initialize DOM gateway
    const domGateway = new ChromeDomGateway();

    // Anti-flicker state tracking
    let isInitializing = false;
    let lastUrl = location.href;

    // Check if we're on a relevant DeepWiki page
    function isRelevantPage(): boolean {
      // For testing: allow test pages
      if (window.location.pathname.includes("test-page.html")) {
        console.log("DeepWiki++: Test page detected, allowing initialization");
        return true;
      }

      const host = location.hostname;
      if (host.endsWith("deepwiki.com") || host.endsWith("deepwiki.corp")) {
        return true;
      }
      return domGateway.isValidDeepWikiPage();
    }

    // Handle adding heading sections
    async function handleAddHeading(section: any): Promise<void> {
      try {
        console.log("DeepWiki++: Adding heading section:", section);

        if (!isHeadingSection(section)) {
          console.error("DeepWiki++: Invalid heading section:", section);
          return;
        }

        // Send message to background script with correct format
        const message: AddHeadingSectionMessage = {
          action: "addHeadingSection",
          headingSection: {
            level: section.level,
            title: section.titleText,
            content: section.contentHtml,
            sourceUrl: window.location.href,
            id: section.sectionId,
          },
        };

        console.log("DeepWiki++: Sending message to background:", message);

        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "DeepWiki++: Error sending message:",
              chrome.runtime.lastError
            );
            return;
          }

          console.log("DeepWiki++: Background response:", response);

          if (response?.success) {
            console.log(
              "DeepWiki++: Heading section added successfully:",
              response.sectionId
            );
          } else {
            console.error(
              "DeepWiki++: Failed to add heading section:",
              response?.error,
              "Code:",
              response?.errorCode
            );
          }
        });
      } catch (error) {
        console.error("DeepWiki++: Error handling add heading:", error);
      }
    }

    // Initialize the extension on the page
    async function initialize(): Promise<void> {
      // Prevent overlapping initializations
      if (isInitializing) {
        console.debug(
          "DeepWiki++: Initialization already in progress, skipping"
        );
        return;
      }

      isInitializing = true;

      try {
        if (!isRelevantPage()) {
          console.log(
            "DeepWiki++: Not a relevant DeepWiki page, skipping initialization"
          );
          return;
        }

        console.log(
          "DeepWiki++: Starting initialization on DeepWiki page:",
          window.location.href
        );

        // First, find the main content container
        const contentArea = domGateway.findMainContentContainer();
        if (!contentArea) {
          console.log("DeepWiki++: No content area found on DeepWiki page");
          return;
        }

        console.log(
          "DeepWiki++: Content area found, waiting for headings to appear"
        );

        // Wait for headings to appear (handles SPA/AJAX delays)
        const headingsFound = await domGateway.waitForHeadings(contentArea);
        if (!headingsFound) {
          console.log(
            "DeepWiki++: No headings found after waiting, skipping initialization"
          );
          return;
        }

        console.log(
          "DeepWiki++: Headings detected, proceeding with initialization"
        );

        // Wait for content to be fully stabilized (including Mermaid rendering)
        console.log(
          "DeepWiki++: Waiting for content stabilization before extraction..."
        );
        await domGateway.waitForContentStabilization(contentArea);

        // Extract all heading sections from the content area
        const headingSections = await domGateway.extractHeadingSections(
          contentArea,
          window.location.href
        );
        console.log(
          `DeepWiki++: Found ${headingSections.length} heading sections on DeepWiki page`
        );

        // Minimize flicker: remove old buttons just before inserting new ones
        domGateway.removeAddButtons();
        domGateway.insertAddButtons(headingSections, handleAddHeading);

        console.log(
          `DeepWiki++: Successfully inserted buttons for ${headingSections.length} headings on DeepWiki page`
        );

        // Update last processed URL
        lastUrl = location.href;
      } catch (error) {
        console.error(
          "DeepWiki++: Error during DeepWiki page initialization:",
          error
        );
      } finally {
        isInitializing = false;
      }
    }

    // SPA navigation helper functions
    function hookHistoryNavigation(): void {
      const fireLocationChange = () => {
        window.dispatchEvent(new Event("dwpp-location-change"));
      };

      // Hook into pushState and replaceState
      ["pushState", "replaceState"].forEach((method) => {
        const originalMethod = history[method as "pushState" | "replaceState"];
        // @ts-ignore - preserving original method signature
        history[method as "pushState" | "replaceState"] = function (...args) {
          const result = originalMethod.apply(this, args);
          fireLocationChange();
          return result;
        };
      });

      // Listen for browser back/forward navigation
      window.addEventListener("popstate", fireLocationChange);
    }

    // Handle dynamic content loading and SPA navigation
    function startMonitoring(): void {
      console.log("DeepWiki++: Starting enhanced SPA monitoring");

      // Debounced re-initializer with URL tracking
      let rerunTimer: number | undefined;
      const rerun = () => {
        // Skip if same URL and already processed
        if (location.href === lastUrl || isInitializing) {
          console.debug(
            "DeepWiki++: Skipping rerun - same URL or already initializing"
          );
          return;
        }

        clearTimeout(rerunTimer);
        rerunTimer = window.setTimeout(async () => {
          console.debug(
            "DeepWiki++: SPA navigation detected → re-initializing"
          );
          await initialize();
        }, 400);
      };

      // Hook into History API for navigation detection
      hookHistoryNavigation();
      window.addEventListener("dwpp-location-change", rerun);

      // Fallback: Monitor DOM changes for content swaps without history changes
      const mutationObserver = new MutationObserver(rerun);
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Store observer reference for cleanup
      (startMonitoring as any).observer = mutationObserver;
    }

    // Stop monitoring when page unloads
    function stopMonitoring(): void {
      console.log("DeepWiki++: Stopping SPA monitoring");
      window.removeEventListener("dwpp-location-change", () => {});
      const observer: MutationObserver | undefined = (startMonitoring as any)
        .observer;
      observer?.disconnect();
    }

    // Start the extension
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        initialize();
        startMonitoring();
      });
    } else {
      initialize();
      startMonitoring();
    }

    // Clean up when page unloads
    window.addEventListener("beforeunload", stopMonitoring);
  },
});
