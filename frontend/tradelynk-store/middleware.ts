import { NextRequest, NextResponse } from "next/server";

/**
 * Subdomain-based routing middleware for seller storefronts
 *
 * Handles:
 * - [username].tradelynk.app → Renders seller storefront
 * - www.tradelynk.app → Let Vercel handle redirect
 * - tradelynk.app → Main marketplace homepage
 * - Legacy /sellers/[username] → Redirects to subdomain
 */

const ROOT_DOMAIN = "tradelynk.app";
const USE_SUBDOMAINS = true;

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

// ---------------- Helpers ----------------

function getSubdomain(hostname: string): string | null {
  const host = hostname.split(":")[0].toLowerCase();

  // Local dev = no subdomains
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
    return null;
  }

  // Root or www = no subdomain handling
  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
    return null;
  }

  if (!host.endsWith(`.${ROOT_DOMAIN}`)) return null;

  const subdomain = host.replace(`.${ROOT_DOMAIN}`, "");

  if (!subdomain || subdomain.includes(".")) return null;

  if (RESERVED_SUBDOMAINS.has(subdomain)) return null;

  return subdomain;
}

function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATHS.some((path) => pathname.startsWith(path));
}

function isDevelopment(hostname: string): boolean {
  const host = hostname.split(":")[0].toLowerCase();
  return (
    host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")
  );
}

// ---------------- Middleware ----------------

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";
  const pathname = url.pathname;
  const host = hostname.split(":")[0].toLowerCase();

  // Skip static / api paths
  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }

  // Skip subdomain logic in local dev
  if (isDevelopment(hostname)) {
    return NextResponse.next();
  }

  // ✅ STEP 1: Let Vercel handle www entirely
  if (host === `www.${ROOT_DOMAIN}`) {
    return NextResponse.next();
  }

  // ✅ STEP 2: Handle ROOT domain only
  if (host === ROOT_DOMAIN) {
    // Legacy /sellers/[username] → redirect to subdomain
    if (USE_SUBDOMAINS) {
      const match = pathname.match(/^\/sellers\/([^\/]+)(\/.*)?$/);

      if (match) {
        const sellerUsername = match[1];
        const remainingPath = match[2] || "";

        if (!RESERVED_SUBDOMAINS.has(sellerUsername.toLowerCase())) {
          const redirectUrl = url.clone();
          redirectUrl.host = `${sellerUsername}.${ROOT_DOMAIN}`;
          redirectUrl.pathname = remainingPath || "/";
          return NextResponse.redirect(redirectUrl, { status: 301 });
        }
      }
    }

    return NextResponse.next();
  }

  // ✅ STEP 3: Handle REAL subdomains
  const subdomain = getSubdomain(hostname);

  if (subdomain) {
    if (pathname === "/" || pathname === "") {
      url.pathname = `/sellers/${subdomain}`;
    } else if (!pathname.startsWith("/sellers/")) {
      url.pathname = `/sellers/${subdomain}${pathname}`;
    }

    const response = NextResponse.rewrite(url);
    response.headers.set("x-subdomain", subdomain);
    response.headers.set("x-seller-username", subdomain);
    return response;
  }

  return NextResponse.next();
}

// ---------------- Matcher ----------------

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
