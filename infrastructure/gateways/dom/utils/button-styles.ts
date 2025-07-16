/**
 * Button style definitions
 */
export const BUTTON_STYLES = {
  default: {
    marginLeft: "8px",
    padding: "2px 6px",
    fontSize: "12px",
    lineHeight: "1",
    border: "1px solid #ccc",
    borderRadius: "3px",
    backgroundColor: "#f8f9fa",
    color: "#333",
    cursor: "pointer",
    verticalAlign: "middle",
    opacity: "0.7",
    transition: "all 0.2s ease",
  },
  hover: {
    opacity: "1",
    backgroundColor: "#e9ecef",
  },
  states: {
    default: {
      icon: "➕",
      styles: {
        opacity: "0.7",
        backgroundColor: "#f8f9fa",
        color: "#333",
      },
    },
    adding: {
      icon: "⏳",
      styles: {
        opacity: "0.5",
        cursor: "not-allowed",
      },
    },
    success: {
      icon: "✅",
      styles: {
        color: "#28a745",
        borderColor: "#28a745",
      },
    },
    error: {
      icon: "❌",
      styles: {
        color: "#dc3545",
        borderColor: "#dc3545",
      },
    },
  },
} as const;

/**
 * Button-related constants
 */
export const BUTTON_CONSTANTS = {
  CLASS_NAME: "dwpp-add-section-btn",
  PROCESSED_ATTRIBUTE: "data-dwpp-processed",
  SECTION_DATA_ATTRIBUTE: "data-dwpp-section-id",
  FEEDBACK_DURATION: {
    SUCCESS: 1500,
    ERROR: 2000,
  },
} as const;
