import { NextRequest, NextResponse } from "next/server";

/**
 * Subdomain-based routing middleware for seller storefronts
 *
 * Handles:
 * - [username].tradelynk.app → Renders seller storefront
 * - www.tradelynk.app → Redirects to tradelynk.app
 * - tradelynk.app → Main marketplace homepage
 * - Legacy /sellers/[username] → Redirects to subdomain
 *
 * IMPORTANT: Using hardcoded constants, NOT environment variables
 */

// =============================================================================
// HARDCODED CONFIGURATION (DO NOT USE ENV VARS)
// =============================================================================

const ROOT_DOMAIN = "tradelynk.app";
const USE_SUBDOMAINS = true;

// Reserved subdomains that should NOT be treated as seller usernames
const RESERVED_SUBDOMAINS = new Set([
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

// Paths that should be excluded from subdomain routing
const EXCLUDED_PATHS = [
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
 * Extract subdomain from hostname
 * Returns null if:
 * - No subdomain exists
 * - Subdomain is reserved (www, api, etc.)
 * - Running on localhost
 */
function getSubdomain(hostname: string): string | null {
  // Remove port if present (for local development)
  const host = hostname.split(":")[0].toLowerCase();

  // Handle localhost development - no subdomain routing
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
    return null;
  }

  // Check if this is the root domain or www
  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
    return null;
  }

  // Check if host ends with root domain
  if (!host.endsWith(`.${ROOT_DOMAIN}`)) {
    // Different domain entirely, no subdomain handling
    return null;
  }

  // Extract subdomain (everything before .ROOT_DOMAIN)
  const subdomain = host.replace(`.${ROOT_DOMAIN}`, "");

  // Validate subdomain
  if (!subdomain || subdomain.includes(".")) {
    // Empty or multi-level subdomain (e.g., sub.sub.tradelynk.app)
    return null;
  }

  // Check if it's a reserved subdomain
  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return null;
  }

  return subdomain;
}

/**
 * Check if the path should be excluded from subdomain routing
 */
function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Check if running in development mode
 */
function isDevelopment(hostname: string): boolean {
  const host = hostname.split(":")[0].toLowerCase();
  return (
    host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")
  );
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";
  const pathname = url.pathname;

  // Skip excluded paths (API routes, static files, etc.)
  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }

  const host = hostname.split(":")[0].toLowerCase();
  const isLocal = isDevelopment(hostname);

  // In development, skip subdomain routing entirely
  if (isLocal) {
    return NextResponse.next();
  }

  // STEP 1: Handle www redirect → main domain (ONE-TIME, then stop)
  if (host === `www.${ROOT_DOMAIN}`) {
    const redirectUrl = url.clone();
    redirectUrl.host = ROOT_DOMAIN;
    return NextResponse.redirect(redirectUrl, { status: 301 });
  }

  // STEP 2: If on main domain, check for legacy /sellers/ redirects, otherwise let through
  if (host === ROOT_DOMAIN) {
    // Handle legacy /sellers/[username] URLs - redirect to subdomain
    if (USE_SUBDOMAINS) {
      const sellersMatch = pathname.match(/^\/sellers\/([^\/]+)(\/.*)?$/);

      if (sellersMatch) {
        const sellerUsername = sellersMatch[1];
        const remainingPath = sellersMatch[2] || "";

        // Skip if the username is reserved
        if (!RESERVED_SUBDOMAINS.has(sellerUsername.toLowerCase())) {
          // Redirect to subdomain version
          const redirectUrl = url.clone();
          redirectUrl.host = `${sellerUsername}.${ROOT_DOMAIN}`;
          redirectUrl.pathname = remainingPath || "/";
          return NextResponse.redirect(redirectUrl, { status: 301 });
        }
      }
    }

    // Main domain - let it through to homepage/app
    return NextResponse.next();
  }

  // STEP 3: Get subdomain if present
  const subdomain = getSubdomain(hostname);

  // STEP 4: Handle subdomain routing - rewrite to internal /sellers/[username] path
  if (subdomain) {
    // Rewrite to the sellers/[username] page internally
    // This keeps the subdomain URL in browser but serves the storefront page

    if (pathname === "/" || pathname === "") {
      // Subdomain root → storefront home
      url.pathname = `/sellers/${subdomain}`;
    } else if (pathname.startsWith("/collections")) {
      // Collections route
      url.pathname = `/sellers/${subdomain}${pathname}`;
    } else if (pathname.startsWith("/settings")) {
      // Settings route
      url.pathname = `/sellers/${subdomain}${pathname}`;
    } else if (pathname.startsWith("/products")) {
      // Products route
      url.pathname = `/sellers/${subdomain}${pathname}`;
    } else if (pathname.startsWith("/sellers/")) {
      // Already has /sellers/ prefix - don't double prefix
      // This handles edge cases where old links might still work
    } else {
      // All other paths on subdomain get prefixed with seller path
      url.pathname = `/sellers/${subdomain}${pathname}`;
    }

    // Add subdomain info to headers for the page to use
    const response = NextResponse.rewrite(url);
    response.headers.set("x-subdomain", subdomain);
    response.headers.set("x-is-subdomain", "true");
    response.headers.set("x-seller-username", subdomain);

    return response;
  }

  // STEP 5: No subdomain - continue with normal routing
  return NextResponse.next();
}

// =============================================================================
// MATCHER CONFIGURATION
// =============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - Image files (.svg, .png, .jpg, etc.)
     * - Font files (.woff, .woff2, .ttf, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
