// filepath: entrypoints/sidepanel/index.tsx
import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom/client";
import { HeadingSection } from "../../domain/heading-collection/heading-section";
import { GetHeadingSectionsInput } from "../../application/usecases/heading-collection";
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
          <h2>❌ サイドパネルエラー</h2>
          <details>
            <summary>エラー詳細</summary>
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
            再試行
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

  // Get domain from URL for display
  const getSourceDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  // Format date safely
  const formatDate = (dateValue: Date | string) => {
    try {
      if (typeof dateValue === "string") {
        return new Date(dateValue).toLocaleDateString();
      } else if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString();
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
              <span>📄 {getSourceDomain(section.sourceUrl)}</span>
              <span>📅 {formatDate(section.addedAt)}</span>
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
          <div
            dangerouslySetInnerHTML={{ __html: section.contentHtml }}
            className="section-content-html"
          />
          <div className="section-content-link">
            <a
              href={section.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              🔗 View Original
            </a>
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
  const [sections, setSections] = useState<HeadingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [filter, setFilter] = useState<GetHeadingSectionsInput>({});
  const [searchText, setSearchText] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<
    "addedAt" | "level" | "titleText" | "sourceUrl"
  >("addedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Load sections from background script
  const loadSections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentFilter: GetHeadingSectionsInput = {
        ...filter,
        searchText: searchText.trim() || undefined,
        level: selectedLevel || undefined,
        sortBy,
        sortOrder,
      };

      const response = await chrome.runtime.sendMessage({
        action: "getHeadingSections",
        input: currentFilter,
      });

      if (response.success) {
        setSections(response.sections || []);
      } else {
        setError(response.error || "Failed to load sections");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [filter, searchText, selectedLevel, sortBy, sortOrder]);

  // Load sections on component mount and when dependencies change
  useEffect(() => {
    loadSections();
  }, [loadSections]);

  // Listen for real-time section updates from content script
  useEffect(() => {
    console.log("SidePanel: Setting up message and storage listeners");

    const handleMessage = (message: any, sender: any, sendResponse: any) => {
      console.log("SidePanel: Received message:", message);

      if (message.action === "sectionAdded") {
        console.log("SidePanel: Section added, refreshing list");
        // Reload sections to show the new addition
        loadSections();
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
        loadSections();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // Cleanup listeners on unmount
    return () => {
      console.log("SidePanel: Cleaning up listeners");
      chrome.runtime.onMessage.removeListener(handleMessage);
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [loadSections]);

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
        setSections((prev) =>
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
      new Set(sections.map((s) => s.sectionId || s.titleText))
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
        setSections([]);
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
  const availableLevels = [...new Set(sections.map((s) => s.level))].sort();

  if (loading) {
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
          onClick={loadSections}
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
          {sections.length} collected section{sections.length !== 1 ? "s" : ""}
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
            onClick={loadSections}
            className="sidepanel-button sidepanel-button-refresh"
          >
            Refresh
          </button>

          {sections.length > 0 && (
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
      {sections.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <div className="empty-state-title">No sections collected yet</div>
          <div className="empty-state-subtitle">
            Visit a wiki page and use Ctrl+Click on headings to collect sections
          </div>
        </div>
      ) : (
        <div>
          {sections.map((section, index) => (
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

      {/* Instructions */}
      <div className="instructions">
        <div className="instructions-title">💡 How to use:</div>
        <div>• Ctrl+Click on any heading to collect it</div>
        <div>• Ctrl+Shift+C to collect all sections on a page</div>
        <div>• Ctrl+Shift+H to highlight collectible headings</div>
      </div>
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
