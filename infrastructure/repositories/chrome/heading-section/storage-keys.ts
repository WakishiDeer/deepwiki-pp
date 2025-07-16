/**
 * Storage keys and namespaces for heading sections in Chrome storage
 */

export const STORAGE_NAMESPACE = "deepwiki_heading_sections";
export const SECTION_LIST_KEY = STORAGE_NAMESPACE;

/**
 * Storage configuration constants
 */
export const STORAGE_CONFIG = {
  SYNC: {
    MAX_SIZE: 100 * 1024, // 100KB for sync storage
    QUOTA_BYTES: chrome.storage?.sync?.QUOTA_BYTES || 102400,
  },
  LOCAL: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB for local storage
    QUOTA_BYTES: chrome.storage?.local?.QUOTA_BYTES || 5242880,
  },
} as const;
