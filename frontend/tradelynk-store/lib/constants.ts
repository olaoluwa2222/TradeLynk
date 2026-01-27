/**
 * Application Constants
 *
 * IMPORTANT: These are hardcoded values for production.
 * DO NOT use environment variables for these values.
 */

// =============================================================================
// DOMAIN CONFIGURATION
// =============================================================================

/**
 * Root domain for the application
 * All subdomains will be based on this domain (e.g., username.tradelynk.app)
 */
export const ROOT_DOMAIN = "tradelynk.app";

/**
 * Whether to use subdomain-based routing for seller storefronts
 * - true: Sellers get [username].tradelynk.app
 * - false: Sellers get tradelynk.app/sellers/[username]
 */
export const USE_SUBDOMAINS = true;

// =============================================================================
// API CONFIGURATION
// =============================================================================

/**
 * Backend API base URL
 * All API requests are made to this endpoint
 */
export const API_BASE_URL =
  "https://tradelynk-api-t598w.ondigitalocean.app/api/v1";

// =============================================================================
// RESERVED SUBDOMAINS
// =============================================================================

/**
 * Subdomains that are reserved and should NOT be treated as seller usernames
 * These will be handled by the main app or other services
 */
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "app",
  "admin",
  "dashboard",
  "staging",
  "dev",
  "test",
  "mail",
  "email",
  "blog",
  "help",
  "support",
  "docs",
  "status",
  "cdn",
  "assets",
  "static",
  "media",
  "img",
  "images",
]);

// =============================================================================
// EXCLUDED PATHS
// =============================================================================

/**
 * Paths that should be excluded from subdomain routing
 * These paths are handled normally regardless of subdomain
 */
export const EXCLUDED_PATHS = [
  "/api",
  "/_next",
  "/static",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.json",
  "/firebase-messaging-sw.js",
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a subdomain is reserved
 */
export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.has(subdomain.toLowerCase());
}

/**
 * Check if a path should be excluded from subdomain routing
 */
export function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Check if we're running in a development environment
 */
export function isDevelopment(): boolean {
  if (typeof window !== "undefined") {
    const host = window.location.host;
    return host.includes("localhost") || host.includes("127.0.0.1");
  }
  return process.env.NODE_ENV === "development";
}

/**
 * Get the protocol based on environment
 */
export function getProtocol(): string {
  if (isDevelopment()) {
    return "http";
  }
  return "https";
}
