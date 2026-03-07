"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  external?: boolean;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  sellerUsername?: string | null;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

/* SVG Icons — clean stroked, Shopify-style */
const Icons = {
  home: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"
      />
    </svg>
  ),
  orders: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      />
    </svg>
  ),
  products: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  ),
  collections: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  ),
  analytics: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  chat: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  ),
  settings: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  add: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  eye: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  ),
  purchases: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
  ),
  whatsapp: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  logout: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  ),
};

export default function DashboardLayout({
  children,
  sellerUsername,
  activeTab,
  onTabChange,
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar on outside click (mobile)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };
    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchend", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchend", handleClickOutside);
    };
  }, [sidebarOpen]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  /* ── NAV SECTIONS ── */
  const navSections: NavSection[] = [
    {
      items: [{ label: "Home", href: "/dashboard/seller", icon: Icons.home }],
    },
    {
      label: "Sales channels",
      items: [
        { label: "Orders", href: "/orders/sales", icon: Icons.orders },
        {
          label: "My Purchases",
          href: "/orders/purchases",
          icon: Icons.purchases,
        },
      ],
    },
    {
      label: "Catalog",
      items: [
        {
          label: "Products",
          href: "/dashboard/seller?tab=products",
          icon: Icons.products,
        },
        {
          label: "Collections",
          href: "/dashboard/seller?tab=collections",
          icon: Icons.collections,
        },
      ],
    },
    {
      label: "Insights",
      items: [
        {
          label: "Analytics",
          href: "/dashboard/seller?tab=analytics",
          icon: Icons.analytics,
        },
        { label: "Chat", href: "/chat", icon: Icons.chat },
      ],
    },
    {
      label: "Store",
      items: [
        ...(sellerUsername
          ? [
              {
                label: "Online Store",
                href: `/sellers/${sellerUsername}`,
                icon: Icons.eye,
                external: true,
              },
            ]
          : []),
        {
          label: "Store Settings",
          href: sellerUsername ? `/sellers/${sellerUsername}/settings` : "#",
          icon: Icons.settings,
        },
        {
          label: "WhatsApp AI",
          href: "#",
          icon: Icons.whatsapp,
          badge: "Soon",
          badgeColor: "bg-purple-100 text-purple-700",
        },
      ],
    },
  ];

  /* ── ACTIVE STATE ── */
  const isActive = (href: string) => {
    if (href.includes("?tab=")) {
      const tab = href.split("?tab=")[1];
      return activeTab === tab;
    }
    if (
      href === "/dashboard/seller" &&
      pathname === "/dashboard/seller" &&
      (!activeTab || activeTab === "overview")
    ) {
      return true;
    }
    return pathname === href;
  };

  const handleNavClick = (href: string) => {
    if (href.includes("?tab=") && onTabChange) {
      const tab = href.split("?tab=")[1];
      onTabChange(tab);
    }
    if (href === "/dashboard/seller" && onTabChange) {
      onTabChange("overview");
    }
    setSidebarOpen(false);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "products":
        return "Products";
      case "collections":
        return "Collections";
      case "analytics":
        return "Analytics";
      default:
        return "Dashboard";
    }
  };

  /* ── RENDER ── */
  return (
    <div className="min-h-screen bg-[#F6F6F7] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══════ SIDEBAR ═══════ */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 z-50 h-full w-60 bg-[#1A1A1A] flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Brand */}
        <div className="h-14 flex items-center justify-between px-4 shrink-0">
          <Link
            href="/dashboard/seller"
            onClick={() => {
              if (onTabChange) onTabChange("overview");
            }}
            className="flex items-center gap-2"
          >
            <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center">
              <span
                className="text-white text-xs font-bold"
                style={{ fontFamily: "Clash Display" }}
              >
                T
              </span>
            </div>
            <span
              className="text-white text-base font-bold tracking-tight"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              Tradelynk
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Add product button */}
        <div className="px-3 mt-1 mb-1">
          <Link
            href="/create-item"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors"
            style={{ fontFamily: "Clash Display", fontWeight: 600 }}
          >
            {Icons.add}
            <span>Add product</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 pt-2 pb-4">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className={sIdx > 0 ? "mt-4" : ""}>
              {section.label && (
                <p
                  className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500"
                  style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                >
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const isTabLink =
                    item.href.includes("?tab=") ||
                    item.href === "/dashboard/seller";

                  const content = (
                    <>
                      <span
                        className={`shrink-0 transition-colors duration-150 ${active ? "text-white" : "text-gray-500 group-hover:text-gray-300"}`}
                      >
                        {item.icon}
                      </span>
                      <span className="flex-1 text-left truncate">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`${item.badgeColor || "bg-gray-700 text-gray-300"} text-[10px] font-bold px-1.5 py-0.5 rounded`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  );

                  const cls = `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 group ${
                    active
                      ? "bg-white/10 text-white font-semibold"
                      : "text-gray-400 hover:bg-white/6 hover:text-gray-200"
                  }`;
                  const sty = {
                    fontFamily: "Clash Display",
                    fontWeight: active ? 600 : 400,
                  };

                  if (isTabLink && !item.external) {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleNavClick(item.href)}
                        className={cls}
                        style={sty}
                      >
                        {content}
                      </button>
                    );
                  }
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => handleNavClick(item.href)}
                      {...(item.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className={cls}
                      style={sty}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-white/10 p-3 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-purple-700 flex items-center justify-center shrink-0">
              <span
                className="text-white font-bold text-xs"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[13px] font-semibold text-white truncate"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                {user?.name?.split(" ")[0]}
              </p>
              <p
                className="text-[11px] text-gray-500 truncate"
                style={{ fontFamily: "Clash Display", fontWeight: 400 }}
              >
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-gray-400 hover:bg-white/6 hover:text-red-400 transition-colors"
            style={{ fontFamily: "Clash Display", fontWeight: 500 }}
          >
            {Icons.logout}
            Log out
          </button>
        </div>
      </aside>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1
              className="text-base font-bold text-black"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              {getPageTitle()}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {sellerUsername && (
              <Link
                href={`/sellers/${sellerUsername}`}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "Clash Display", fontWeight: 500 }}
              >
                {Icons.eye}
                <span>View store</span>
              </Link>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ fontFamily: "Clash Display", fontWeight: 500 }}
            >
              {Icons.home}
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
