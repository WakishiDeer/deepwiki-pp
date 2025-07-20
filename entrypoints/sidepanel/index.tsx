// filepath: entrypoints/sidepanel/index.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import ReactDOM from "react-dom/client";
import { HeadingSection } from "../../domain/heading-collection/heading-section";
import { GetHeadingSectionsInput } from "../../application/usecases/heading-collection";
import { containsMermaidSvg } from "../../shared/html/is-mermaid-svg";
import "./style.css";

/**
 * Error Boundary component to catch React errors
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error("SidePanel: React Error Boundary caught error:", error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("SidePanel: React Error Details:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>❌ Error on Sidepanel </h2>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error?.message}</pre>
            <pre>{this.state.error?.stack}</pre>
            {this.state.errorInfo && (
              <pre>{this.state.errorInfo.componentStack}</pre>
            )}
          </details>
          <button
            onClick={() =>
              this.setState({ hasError: false, error: null, errorInfo: null })
            }
            className="sidepanel-button sidepanel-button-retry"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Props for the HeadingSection component
 */
interface HeadingSectionItemProps {
  section: HeadingSection;
  onRemove?: (section: HeadingSection) => void;
  isExpanded?: boolean;
  onToggleExpand?: (section: HeadingSection) => void;
}

/**
 * Component for displaying a single heading section
 */
function HeadingSectionItem({
  section,
  onRemove,
  isExpanded = false,
  onToggleExpand,
}: HeadingSectionItemProps) {
  const handleToggleExpand = () => {
    onToggleExpand?.(section);
  };

  const handleRemove = () => {
    onRemove?.(section);
  };

  // Extract text content from HTML for preview
  const getContentPreview = (html: string, maxLength: number = 150) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Extract repository and page info from DeepWiki URL
  const parseDeepWikiUrl = (
    url: string
  ): { repo: string; pageTitle: string; repoUrl: string } => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter((p) => p);

      if (pathParts.length >= 2) {
        const repo = `${pathParts[0]}/${pathParts[1]}`;
        const repoUrl = `${urlObj.origin}/${repo}`;

        if (pathParts.length > 2) {
          // Extract page title from slug
          const pageSlug = pathParts.slice(2).join("-");
          const pageTitle = formatPageTitle(pageSlug);
          return { repo, pageTitle, repoUrl };
        }

        // Repository top page
        return { repo, pageTitle: "Overview", repoUrl };
      }

      return { repo: urlObj.hostname, pageTitle: "", repoUrl: url };
    } catch {
      return { repo: "Unknown", pageTitle: "", repoUrl: url };
    }
  };

  // Convert URL slug to readable title
  const formatPageTitle = (slug: string): string => {
    // Remove number prefix (e.g., "1.1-", "1-", "2.3.1-")
    const cleanSlug = slug.replace(/^\d+(\.\d+)*-/, "");

    // Convert kebab-case to Title Case
    return cleanSlug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Smart navigation: update current tab if on same repo, otherwise open new tab
  const navigateSmartly = async (targetUrl: string) => {
    try {
      // Get the current active tab
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!activeTab?.id || !activeTab?.url) {
        // Fallback to new tab if no active tab
        await chrome.tabs.create({ url: targetUrl });
        return;
      }

      const currentUrl = activeTab.url;

      // Check if both current and target are on DeepWiki
      if (
        currentUrl.includes("deepwiki.com") &&
        targetUrl.includes("deepwiki.com")
      ) {
        try {
          const currentUrlObj = new URL(currentUrl);
          const targetUrlObj = new URL(targetUrl);

          // Extract repository from both URLs
          const getCurrentRepo = (url: URL) => {
            const pathParts = url.pathname.split("/").filter((p) => p);
            return pathParts.length >= 2
              ? `${pathParts[0]}/${pathParts[1]}`
              : null;
          };

          const currentRepo = getCurrentRepo(currentUrlObj);
          const targetRepo = getCurrentRepo(targetUrlObj);

          // If same repository, update current tab
          if (currentRepo && targetRepo && currentRepo === targetRepo) {
            await chrome.tabs.update(activeTab.id, { url: targetUrl });
            return;
          }
        } catch (e) {
          // URL parsing failed, fallback to new tab
          console.error("Failed to parse URLs:", e);
        }
      }

      // Different repository or not both on DeepWiki: open new tab
      await chrome.tabs.create({ url: targetUrl });
    } catch (error) {
      console.error("Navigation failed:", error);
      // Ultimate fallback
      window.open(targetUrl, "_blank");
    }
  };

  // Format date safely
  const formatDate = (dateValue: Date | string) => {
    try {
      if (typeof dateValue === "string") {
        return new Date(dateValue).toLocaleString();
      } else if (dateValue instanceof Date) {
        return dateValue.toLocaleString();
      } else {
        return "Unknown date";
      }
    } catch {
      return "Invalid date";
    }
  };

  const levelClass = `section-level-${section.level}`;
  const titleClass = `section-title section-title-h${section.level}`;

  return (
    <div className="section-item">
      <div
        className={`section-header ${
          isExpanded ? "section-header-expanded" : ""
        }`}
      >
        <div className="section-header-content">
          {/* Expand/Collapse Button */}
          <button
            onClick={handleToggleExpand}
            className="section-expand-button"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? "▼" : "▶"}
          </button>

          {/* Heading Title */}
          <div className={`section-title-container ${levelClass}`}>
            <h3 className={titleClass}>
              H{section.level}: {section.titleText}
            </h3>
            <div className="section-metadata">
              <div className="url-info">
                {(() => {
                  const { repo, pageTitle, repoUrl } = parseDeepWikiUrl(
                    section.sourceUrl
                  );
                  return (
                    <>
                      <button
                        onClick={() => navigateSmartly(repoUrl)}
                        className="repo-link"
                        title={`Go to ${repo} repository`}
                      >
                        📁 {repo}
                      </button>
                      {pageTitle && (
                        <>
                          <span className="separator">›</span>
                          <button
                            onClick={() => navigateSmartly(section.sourceUrl)}
                            className="page-link"
                            title={section.sourceUrl}
                          >
                            📄 {pageTitle}
                          </button>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
              <span className="timestamp">
                📅 {formatDate(section.addedAt)}
              </span>
            </div>
          </div>

          {/* Remove Button */}
          {onRemove && (
            <button
              onClick={handleRemove}
              className="section-remove-button"
              title="Remove section"
            >
              🗑️
            </button>
          )}
        </div>

        {/* Content Preview (when collapsed) */}
        {!isExpanded && section.contentHtml && (
          <div className="section-preview">
            {getContentPreview(section.contentHtml)}
          </div>
        )}
      </div>

      {/* Full Content (when expanded) */}
      {isExpanded && section.contentHtml && (
        <div className="section-content">
          {containsMermaidSvg(section.contentHtml) ? (
            <div
              className="dwpp-diagram-wrapper"
              dangerouslySetInnerHTML={{ __html: section.contentHtml }}
            />
          ) : (
            <div
              className="section-content-html"
              dangerouslySetInnerHTML={{ __html: section.contentHtml }}
            />
          )}
          <div className="section-content-link">
            <button
              onClick={() => navigateSmartly(section.sourceUrl)}
              className="view-original-button"
              title="Navigate to original content"
            >
              🔗 View Original
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main Sidepanel component for DeepWiki++ heading section collection
 */
function Sidepanel() {
  // State for sections data
  const [allSections, setAllSections] = useState<HeadingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  // Filter states (for API calls)
  const [filter, setFilter] = useState<GetHeadingSectionsInput>({});
  const [selectedLevel, setSelectedLevel] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<
    "addedAt" | "level" | "titleText" | "sourceUrl"
  >("addedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Local search state (for immediate UI feedback)
  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Ref to track if initial load is complete
  const isInitialLoadComplete = useRef(false);

  // Filter sections locally based on search text
  const filteredSections = useMemo(() => {
    if (!searchText.trim()) {
      return allSections;
    }

    const lowerSearchText = searchText.toLowerCase();
    setIsSearching(true);

    const filtered = allSections.filter((section) => {
      const titleMatch = section.titleText
        .toLowerCase()
        .includes(lowerSearchText);
      const urlMatch = section.sourceUrl
        .toLowerCase()
        .includes(lowerSearchText);
      // Optional: search in content as well
      const contentMatch = section.contentHtml
        ?.toLowerCase()
        .includes(lowerSearchText);

      return titleMatch || urlMatch || contentMatch;
    });

    // Reset searching state after filtering
    setTimeout(() => setIsSearching(false), 100);
    return filtered;
  }, [allSections, searchText]);

  // Load all sections from background (without search filtering)
  const loadAllSections = useCallback(async () => {
    try {
      // Only show loading spinner on initial load
      if (!isInitialLoadComplete.current) {
        setLoading(true);
      }
      setError(null);

      const currentFilter: GetHeadingSectionsInput = {
        ...filter,
        level: selectedLevel || undefined,
        sortBy,
        sortOrder,
        // Note: searchText is NOT included here - handled locally
      };

      const response = await chrome.runtime.sendMessage({
        action: "getHeadingSections",
        input: currentFilter,
      });

      if (response.success) {
        setAllSections(response.sections || []);
        isInitialLoadComplete.current = true;
      } else {
        setError(response.error || "Failed to load sections");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [filter, selectedLevel, sortBy, sortOrder]); // searchText removed from dependencies

  // Load sections on component mount and when dependencies change
  useEffect(() => {
    loadAllSections();
  }, [loadAllSections]);

  // Listen for real-time section updates from content script
  useEffect(() => {
    console.log("SidePanel: Setting up message and storage listeners");

    const handleMessage = (message: any, sender: any, sendResponse: any) => {
      console.log("SidePanel: Received message:", message);

      if (message.action === "sectionAdded") {
        console.log("SidePanel: Section added, refreshing list");
        // Reload sections to show the new addition
        loadAllSections();
      }
    };

    // Add message listener
    chrome.runtime.onMessage.addListener(handleMessage);

    // Also listen for storage changes
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      console.log("SidePanel: Storage changed:", changes, areaName);

      if (areaName === "local" && changes["deepwiki_heading_sections"]) {
        console.log(
          "SidePanel: Heading sections storage changed, refreshing list"
        );
        loadAllSections();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // Cleanup listeners on unmount
    return () => {
      console.log("SidePanel: Cleaning up listeners");
      chrome.runtime.onMessage.removeListener(handleMessage);
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [loadAllSections]);

  // Handle section expansion/collapse
  const handleToggleExpand = (section: HeadingSection) => {
    const sectionId = section.sectionId || section.titleText;
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Handle section removal
  const handleRemoveSection = async (section: HeadingSection) => {
    if (!section.sectionId) {
      console.error("SidePanel: Cannot remove section without ID");
      return;
    }

    if (!confirm(`Are you sure you want to remove "${section.titleText}"?`)) {
      return;
    }

    try {
      console.log("SidePanel: Removing section:", section.sectionId);

      const response = await chrome.runtime.sendMessage({
        action: "removeHeadingSection",
        sectionId: section.sectionId,
      });

      if (response.success) {
        // Optimistically update UI
        setAllSections((prev) =>
          prev.filter((s) => s.sectionId !== section.sectionId)
        );
        console.log("SidePanel: Section removed successfully");
      } else {
        setError(response.error || "Failed to remove section");
      }
    } catch (err) {
      console.error("SidePanel: Error removing section:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Handle level filter change
  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLevel(value === "" ? "" : parseInt(value));
  };

  // Handle sort change
  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchText("");
    setSelectedLevel("");
    setSortBy("addedAt");
    setSortOrder("desc");
  };

  // Expand/Collapse all sections
  const handleExpandAll = () => {
    setExpandedSections(
      new Set(filteredSections.map((s) => s.sectionId || s.titleText))
    );
  };

  const handleCollapseAll = () => {
    setExpandedSections(new Set());
  };

  // Clear all sections
  const handleClearAllSections = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all collected sections? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await chrome.runtime.sendMessage({
        action: "clearAllHeadingSections",
      });

      if (response.success) {
        setAllSections([]);
        console.log("SidePanel: All sections cleared successfully");
      } else {
        setError(response.error || "Failed to clear sections");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Get available heading levels from sections
  const availableLevels = [...new Set(allSections.map((s) => s.level))].sort();

  if (loading && !isInitialLoadComplete.current) {
    return (
      <div className="loading-state">
        <div>Loading sections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div className="error-message">Error: {error}</div>
        <button
          onClick={loadAllSections}
          className="sidepanel-button sidepanel-button-retry"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="sidepanel-container">
      {/* Header */}
      <div className="sidepanel-header">
        <h1 className="sidepanel-title">📚 DeepWiki++ Sections</h1>
        <div className="sidepanel-subtitle">
          {isSearching ? (
            <span>Searching...</span>
          ) : (
            <>
              {filteredSections.length} / {allSections.length} section
              {filteredSections.length !== 1 ? "s" : ""}
              {searchText && ` matching "${searchText}"`}
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="sidepanel-controls">
        {/* Search */}
        <div className="sidepanel-search">
          <input
            type="text"
            placeholder="Search sections..."
            value={searchText}
            onChange={handleSearchChange}
            className="sidepanel-search-input"
          />
          {searchText && (
            <button
              onClick={() => setSearchText("")}
              className="sidepanel-search-clear"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="sidepanel-filters">
          <select
            value={selectedLevel}
            onChange={handleLevelChange}
            className="sidepanel-select"
            title="Filter by heading level"
          >
            <option value="">All Levels</option>
            {availableLevels.map((level) => (
              <option key={level} value={level}>
                H{level}
              </option>
            ))}
          </select>

          <button
            onClick={handleClearFilters}
            className="sidepanel-button sidepanel-button-clear"
          >
            Clear Filters
          </button>

          <button
            onClick={loadAllSections}
            className="sidepanel-button sidepanel-button-refresh"
          >
            Refresh
          </button>

          {allSections.length > 0 && (
            <button
              onClick={handleClearAllSections}
              className="sidepanel-button sidepanel-button-clear-all"
              title="Clear all collected sections"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Sort and Expand Controls */}
        <div className="sidepanel-sort-controls">
          <span className="sidepanel-sort-label">Sort:</span>
          {(["addedAt", "level", "titleText", "sourceUrl"] as const).map(
            (field) => (
              <button
                key={field}
                onClick={() => handleSortChange(field)}
                className={`sidepanel-sort-button ${
                  sortBy === field
                    ? "sidepanel-sort-button-active"
                    : "sidepanel-sort-button-inactive"
                }`}
              >
                {field}{" "}
                {sortBy === field ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </button>
            )
          )}

          <div className="sidepanel-expand-controls">
            <button
              onClick={handleExpandAll}
              className="sidepanel-expand-button"
            >
              Expand All
            </button>
            <button
              onClick={handleCollapseAll}
              className="sidepanel-expand-button"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Sections List */}
      {filteredSections.length === 0 ? (
        <div className="empty-state">
          {searchText ? (
            <>
              <div className="empty-state-icon">�</div>
              <div className="empty-state-title">No matching sections</div>
              <div className="empty-state-subtitle">
                Try a different search term or{" "}
                <button
                  onClick={() => setSearchText("")}
                  className="link-button"
                >
                  clear the search
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="empty-state-icon">�📄</div>
              <div className="empty-state-title">No sections collected yet</div>
              <div className="empty-state-subtitle">
                Visit a wiki page and use Ctrl+Click on headings to collect
                sections
              </div>
            </>
          )}
        </div>
      ) : (
        <div>
          {filteredSections.map((section, index) => (
            <HeadingSectionItem
              key={section.sectionId || `${index}-${section.titleText}`}
              section={section}
              onRemove={handleRemoveSection}
              isExpanded={expandedSections.has(
                section.sectionId || section.titleText
              )}
              onToggleExpand={handleToggleExpand}
            />
          ))}
        </div>
      )}

      {/* <div className="instructions"></div> */}
    </div>
  );
}

console.log("SidePanel: Initializing React app");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Sidepanel />
    </ErrorBoundary>
  </React.StrictMode>
);
