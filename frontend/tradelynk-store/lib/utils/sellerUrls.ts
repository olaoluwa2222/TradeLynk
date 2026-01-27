/**
 * Utility functions for generating seller storefront URLs
 * Handles both subdomain and legacy path-based URLs
 *
 * IMPORTANT: Using hardcoded constants, NOT environment variables
 */

// =============================================================================
// HARDCODED CONFIGURATION (DO NOT USE ENV VARS)
// =============================================================================

const ROOT_DOMAIN = "tradelynk.app";
const USE_SUBDOMAINS = true;

/**
 * Generate a seller storefront URL
 * Returns subdomain URL (username.tradelynk.app) or legacy URL (/sellers/username)
 */
export function getSellerUrl(username: string, path: string = ""): string {
  if (typeof window === "undefined") {
    // Server-side: always use subdomain format for production
    if (USE_SUBDOMAINS) {
      return `https://${username}.${ROOT_DOMAIN}${path}`;
    }
    return `/sellers/${username}${path}`;
  }

  // Client-side
  const currentHost = window.location.host;
  const isLocalhost =
    currentHost.includes("localhost") || currentHost.includes("127.0.0.1");

  if (isLocalhost) {
    // In development, use path-based routing for simplicity
    return `/sellers/${username}${path}`;
  }

  if (USE_SUBDOMAINS) {
    // Production: use subdomain
    return `https://${username}.${ROOT_DOMAIN}${path}`;
  }

  // Fallback to path-based routing
  return `/sellers/${username}${path}`;
}

/**
 * Generate a seller storefront URL with full origin
 * Useful for sharing links
 */
export function getSellerFullUrl(username: string, path: string = ""): string {
  if (USE_SUBDOMAINS) {
    return `https://${username}.${ROOT_DOMAIN}${path}`;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/sellers/${username}${path}`;
  }

  return `https://${ROOT_DOMAIN}/sellers/${username}${path}`;
}

/**
 * Check if the current page is being viewed via subdomain
 */
export function isSubdomainAccess(): boolean {
  if (typeof window === "undefined") return false;

  const host = window.location.host.split(":")[0];
  const parts = host.split(".");

  // If more than 2 parts and first part is not 'www', it's a subdomain
  return parts.length > 2 && parts[0] !== "www";
}

/**
 * Get the subdomain from current URL
 */
export function getCurrentSubdomain(): string | null {
  if (typeof window === "undefined") return null;

  const host = window.location.host.split(":")[0];
  const parts = host.split(".");

  if (parts.length > 2 && parts[0] !== "www") {
    return parts[0];
  }

  return null;
}

/**
 * Generate a link that works on both subdomain and main domain
 * Use this for internal navigation on storefront pages
 */
export function getStorefrontInternalLink(
  path: string,
  username?: string,
): string {
  // If we're on a subdomain, use relative paths
  if (isSubdomainAccess()) {
    return path.startsWith("/") ? path : `/${path}`;
  }

  // If username provided and on main domain, prefix with /sellers/username
  if (username) {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `/sellers/${username}${cleanPath === "/" ? "" : cleanPath}`;
  }

  return path;
}

/**
 * Get the appropriate settings URL for a seller
 */
export function getSellerSettingsUrl(username: string): string {
  return getSellerUrl(username, "/settings");
}

/**
 * Get the appropriate collections URL for a seller
 */
export function getSellerCollectionsUrl(
  username: string,
  collectionSlug?: string,
): string {
  if (collectionSlug) {
    return getSellerUrl(username, `/collections/${collectionSlug}`);
  }
  return getSellerUrl(username, "/collections");
}

/**
 * Format the display URL for showing to users (cleaner format)
 */
export function getDisplayUrl(username: string): string {
  if (USE_SUBDOMAINS) {
    return `${username}.${ROOT_DOMAIN}`;
  }
  return `${ROOT_DOMAIN}/sellers/${username}`;
}
