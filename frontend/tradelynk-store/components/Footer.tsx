import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h3
              className="text-2xl font-bold text-black mb-3"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              🏪 TradeLynk
            </h3>
            <p
              className="text-gray-600 text-sm leading-relaxed"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              Buy and sell within Landmark University. Your campus marketplace
              for everything you need.
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h4
              className="text-lg font-bold text-black mb-5"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 hover:text-black transition-colors"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-gray-600 hover:text-black transition-colors"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-600 hover:text-black transition-colors"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4
              className="text-lg font-bold text-black mb-5"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              Resources
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/how-it-works"
                  className="text-gray-600 hover:text-black transition-colors"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/faqs"
                  className="text-gray-600 hover:text-black transition-colors"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  href="/safety-tips"
                  className="text-gray-600 hover:text-black transition-colors"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Safety Tips
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4
              className="text-lg font-bold text-black mb-5"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              Support
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/help"
                  className="text-gray-600 hover:text-black transition-colors"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/report-issue"
                  className="text-gray-600 hover:text-black transition-colors"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Report Issue
                </Link>
              </li>
              <li>
                <Link
                  href="/contact-us"
                  className="text-gray-600 hover:text-black transition-colors"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-8"></div>

        {/* Legal and Social Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Legal Links */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Link
                href="/terms"
                className="text-sm text-gray-600 hover:text-black transition-colors"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Terms of Service
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                href="/privacy"
                className="text-sm text-gray-600 hover:text-black transition-colors"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Privacy Policy
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                href="/community-rules"
                className="text-sm text-gray-600 hover:text-black transition-colors"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Community Rules
              </Link>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-6 md:justify-end">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-black transition-colors text-lg"
            >
              📘 Facebook
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-black transition-colors text-lg"
            >
              📷 Instagram
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-black transition-colors text-lg"
            >
              🐦 Twitter
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Copyright Section */}
        <div className="pt-8 text-center space-y-2">
          <p
            className="text-sm text-gray-600"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            © {currentYear} TradeLynk. All rights reserved.
          </p>
          <p
            className="text-sm text-gray-600"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            Made with ❤️ for Landmark University students
          </p>
        </div>
      </div>
    </footer>
  );
}
