/**
 * URL Transformation Service
 */

import { ValidationError, Url } from "../shared";

export interface HostPair {
  host1: string;
  host2: string;
}

/**
 * Transform URL between configured host pairs
 */
export function transformUrl(
  urlString: Url,
  hostPairs: HostPair[] = [{ host1: "github.com", host2: "deepwiki.com" }]
): Url | null {
  if (!urlString?.trim()) {
    return null;
  }

  try {
    const url = new URL(urlString);

    for (const pair of hostPairs) {
      const result = transformBetweenHosts(url, pair.host1, pair.host2);
      if (result) {
        return result;
      }
    }
  } catch (error) {
    // Invalid URL, return null
    return null;
  }

  return null;
}

/**
 * Transform URL between two specific hosts
 */
function transformBetweenHosts(
  url: URL,
  host1: string,
  host2: string
): Url | null {
  if (url.hostname === host1) {
    return transformToHost(url, host2);
  }
  if (url.hostname === host2) {
    return transformToHost(url, host1);
  }
  return null;
}

/**
 * Transform URL to target host with path extraction
 */
function transformToHost(url: URL, targetHost: string): Url {
  const pathParts = url.pathname.split("/").filter((part) => part.length > 0);

  if (pathParts.length >= 2) {
    // Path format: /owner/repo/... → https://targetHost/owner/repo
    const owner = pathParts[0];
    const repo = pathParts[1];
    return `https://${targetHost}/${owner}/${repo}`;
  } else {
    // If path is incomplete, redirect to target host top page
    return `https://${targetHost}/`;
  }
}

/**
 * Check if URL can be transformed with given host pairs
 */
export function canTransformUrl(
  urlString: Url,
  hostPairs: HostPair[] = [{ host1: "github.com", host2: "deepwiki.com" }]
): boolean {
  try {
    const url = new URL(urlString);
    return hostPairs.some(
      (pair) => url.hostname === pair.host1 || url.hostname === pair.host2
    );
  } catch {
    return false;
  }
}

/**
 * Get all supported hosts from host pairs
 */
export function getSupportedHosts(hostPairs: HostPair[]): string[] {
  const hosts = new Set<string>();
  hostPairs.forEach((pair) => {
    hosts.add(pair.host1);
    hosts.add(pair.host2);
  });
  return Array.from(hosts);
}
