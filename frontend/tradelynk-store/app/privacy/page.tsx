// app/privacy/page.tsx
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy - TradeLynk",
  description:
    "TradeLynk Privacy Policy - How we collect, use, and protect your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1
            className="text-4xl font-bold text-black mb-4"
            style={{ fontFamily: "Clash Display", fontWeight: 700 }}
          >
            Privacy Policy
          </h1>
          <p
            className="text-gray-500 text-sm"
            style={{ fontFamily: "Clash Display", fontWeight: 400 }}
          >
            Last updated: March 4, 2026
          </p>
        </div>

        {/* Content */}
        <div
          className="prose prose-gray max-w-none space-y-8"
          style={{ fontFamily: "Clash Display", fontWeight: 400 }}
        >
          {/* Introduction */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              1. Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to TradeLynk (&quot;we,&quot; &quot;our,&quot; or
              &quot;us&quot;). TradeLynk is an online marketplace platform
              operated from Nigeria, accessible at{" "}
              <a
                href="https://www.tradelynk.app"
                className="text-blue-600 hover:underline"
              >
                www.tradelynk.app
              </a>
              . We are committed to protecting your privacy and ensuring the
              security of your personal information.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you visit our website and use our
              services. Please read this policy carefully. By using TradeLynk,
              you consent to the data practices described in this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              2. Information We Collect
            </h2>

            <h3
              className="text-lg font-semibold text-black mb-2 mt-6"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              2.1 Personal Information You Provide
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you register for an account, make a purchase, become a
              seller, or interact with our platform, we may collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Identity Information:</strong> Full name, username, and
                profile details.
              </li>
              <li>
                <strong>Contact Information:</strong> Email address and phone
                number.
              </li>
              <li>
                <strong>Payment Information:</strong> Bank account details, card
                information, and transaction records processed through our
                payment partners.
              </li>
              <li>
                <strong>Location Information:</strong> Delivery address,
                shipping address, and general location data.
              </li>
              <li>
                <strong>Seller Information:</strong> Business name, storefront
                details, product listings, and bank/payment details for payouts.
              </li>
              <li>
                <strong>Communication Data:</strong> Messages sent through our
                in-app chat system between buyers and sellers.
              </li>
            </ul>

            <h3
              className="text-lg font-semibold text-black mb-2 mt-6"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              2.2 Information Collected Automatically
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you access our platform, we automatically collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Device Information:</strong> Browser type, operating
                system, device type, and unique device identifiers.
              </li>
              <li>
                <strong>Usage Data:</strong> Pages visited, time spent on pages,
                click patterns, and search queries.
              </li>
              <li>
                <strong>Cookies &amp; Tracking Technologies:</strong> We use
                cookies, local storage, and similar technologies to enhance your
                experience and collect analytics data.
              </li>
              <li>
                <strong>Log Data:</strong> IP address, access times, and
                referring website addresses.
              </li>
            </ul>

            <h3
              className="text-lg font-semibold text-black mb-2 mt-6"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              2.3 Information from Third Parties
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              We may receive information about you from third-party services:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Social Login Providers:</strong> If you sign in using
                Facebook or other social accounts, we receive your name, email
                address, and profile picture as permitted by your privacy
                settings on those platforms.
              </li>
              <li>
                <strong>Payment Processors:</strong> Transaction confirmation
                and payment status from our payment partners.
              </li>
              <li>
                <strong>Analytics Providers:</strong> Aggregated usage and
                performance data.
              </li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Account Management:</strong> To create and manage your
                account, verify your identity, and maintain your profile.
              </li>
              <li>
                <strong>Marketplace Operations:</strong> To facilitate
                transactions between buyers and sellers, process orders, and
                manage deliveries.
              </li>
              <li>
                <strong>Payment Processing:</strong> To process payments, issue
                refunds, and manage seller payouts.
              </li>
              <li>
                <strong>Communication:</strong> To enable in-app messaging
                between buyers and sellers, send order updates, and provide
                customer support.
              </li>
              <li>
                <strong>Notifications:</strong> To send you push notifications,
                email alerts, and updates about your orders, messages, and
                account activity.
              </li>
              <li>
                <strong>Platform Improvement:</strong> To analyse usage
                patterns, troubleshoot issues, and improve our services.
              </li>
              <li>
                <strong>Safety &amp; Security:</strong> To detect fraud, resolve
                disputes, and enforce our Terms of Service.
              </li>
              <li>
                <strong>Legal Compliance:</strong> To comply with applicable
                laws, regulations, and legal processes.
              </li>
            </ul>
          </section>

          {/* How We Share Your Information */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              4. How We Share Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We do not sell your personal information. We may share your data
              in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>With Other Users:</strong> Your public profile, seller
                storefront, listings, and reviews are visible to other users.
                When you make a purchase, your delivery information is shared
                with the seller.
              </li>
              <li>
                <strong>Service Providers:</strong> We share data with trusted
                third-party providers who help us operate our platform,
                including Firebase (authentication &amp; real-time database),
                Cloudinary (image hosting), and payment processors.
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may disclose your
                information if required by law, legal process, or government
                request.
              </li>
              <li>
                <strong>Business Transfers:</strong> In the event of a merger,
                acquisition, or sale of assets, your data may be transferred as
                part of the transaction.
              </li>
              <li>
                <strong>With Your Consent:</strong> We may share your
                information for other purposes with your explicit consent.
              </li>
            </ul>
          </section>

          {/* Cookies & Tracking */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              5. Cookies &amp; Tracking Technologies
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use cookies and similar technologies for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Essential Cookies:</strong> Required for the platform to
                function (e.g., authentication tokens, session management).
              </li>
              <li>
                <strong>Analytics Cookies:</strong> To understand how users
                interact with our platform and improve the experience.
              </li>
              <li>
                <strong>Preference Cookies:</strong> To remember your settings
                and preferences.
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              You can control cookie settings through your browser preferences.
              Disabling certain cookies may limit your ability to use some
              features of TradeLynk.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              6. Data Security
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organisational measures to
              protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
              <li>Encryption of data in transit using SSL/TLS protocols.</li>
              <li>Secure authentication through Firebase Authentication.</li>
              <li>
                Regular security reviews and updates to our infrastructure.
              </li>
              <li>Access controls to limit who can view your personal data.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              While we strive to protect your information, no method of
              transmission over the Internet is 100% secure. We cannot guarantee
              absolute security of your data.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              7. Data Retention
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal information for as long as your account is
              active or as needed to provide our services. We may also retain
              data as necessary to comply with legal obligations, resolve
              disputes, and enforce our agreements. When your data is no longer
              needed, we will securely delete or anonymize it.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              8. Your Rights
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              In accordance with the Nigeria Data Protection Regulation (NDPR)
              and other applicable laws, you have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Access:</strong> Request a copy of the personal data we
                hold about you.
              </li>
              <li>
                <strong>Correction:</strong> Request correction of inaccurate or
                incomplete data.
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your personal
                data, subject to legal retention requirements.
              </li>
              <li>
                <strong>Data Portability:</strong> Request a machine-readable
                copy of your data.
              </li>
              <li>
                <strong>Withdraw Consent:</strong> Withdraw your consent for
                data processing at any time.
              </li>
              <li>
                <strong>Object:</strong> Object to the processing of your
                personal data for certain purposes.
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              To exercise any of these rights, please contact us at{" "}
              <a
                href="mailto:tradelynk.commerce@gmail.com"
                className="text-blue-600 hover:underline"
              >
                tradelynk.commerce@gmail.com
              </a>
              .
            </p>
          </section>

          {/* Facebook / Meta Data */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              9. Facebook Login &amp; Meta Platform Data
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you choose to log in or register using Facebook, we access the
              following information from your Facebook account (as authorized by
              you):
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Your public profile (name, profile picture).</li>
              <li>Your email address.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              We use this information solely for account creation and
              authentication purposes. We do not post to your Facebook account
              or access your friends list. You can revoke TradeLynk&apos;s
              access to your Facebook data at any time through your{" "}
              <a
                href="https://www.facebook.com/settings?tab=applications"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook App Settings
              </a>
              .
            </p>
          </section>

          {/* Data Deletion */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              10. Data Deletion
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You can request deletion of your data at any time:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Via our Data Deletion Page:</strong> Visit our{" "}
                <Link
                  href="/data-deletion"
                  className="text-blue-600 hover:underline"
                >
                  Data Deletion Request
                </Link>{" "}
                page to submit a deletion request.
              </li>
              <li>
                <strong>Via Email:</strong> Send a request to{" "}
                <a
                  href="mailto:tradelynk.commerce@gmail.com"
                  className="text-blue-600 hover:underline"
                >
                  tradelynk.commerce@gmail.com
                </a>{" "}
                with the subject &quot;Data Deletion Request.&quot;
              </li>
              <li>
                <strong>Via Facebook:</strong> You can remove TradeLynk&apos;s
                access through your Facebook App Settings. We will process the
                deletion of your data within 30 days of receiving your request.
              </li>
            </ul>
          </section>

          {/* Third Party Services */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              11. Third-Party Services
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Our platform integrates with the following third-party services,
              each with their own privacy policies:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Firebase (Google):</strong> Authentication, real-time
                database, and push notifications —{" "}
                <a
                  href="https://firebase.google.com/support/privacy"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Firebase Privacy Policy
                </a>
              </li>
              <li>
                <strong>Cloudinary:</strong> Image upload and hosting —{" "}
                <a
                  href="https://cloudinary.com/privacy"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Cloudinary Privacy Policy
                </a>
              </li>
              <li>
                <strong>Meta (Facebook):</strong> Social login —{" "}
                <a
                  href="https://www.facebook.com/privacy/policy/"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Meta Privacy Policy
                </a>
              </li>
              <li>
                <strong>Vercel:</strong> Website hosting —{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Vercel Privacy Policy
                </a>
              </li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              12. Children&apos;s Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              TradeLynk is not intended for use by individuals under the age of
              18. We do not knowingly collect personal information from
              children. If we become aware that we have collected data from a
              child under 18, we will take steps to delete that information
              promptly.
            </p>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              13. International Data Transfers
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries
              outside Nigeria where our service providers operate (e.g., the
              United States, European Union). We ensure that such transfers
              comply with applicable data protection laws and that adequate
              safeguards are in place.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              14. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of significant changes by posting the new policy on
              this page and updating the &quot;Last updated&quot; date. We
              encourage you to review this page periodically for any changes.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              15. Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions or concerns about this Privacy Policy or
              our data practices, please contact us:
            </p>
            <div className="mt-4 bg-gray-50 rounded-xl p-6 border border-gray-200">
              <p className="text-gray-700">
                <strong>TradeLynk</strong>
              </p>
              <p className="text-gray-700 mt-1">
                Email:{" "}
                <a
                  href="mailto:tradelynk.commerce@gmail.com"
                  className="text-blue-600 hover:underline"
                >
                  tradelynk.commerce@gmail.com
                </a>
              </p>
              <p className="text-gray-700 mt-1">
                Website:{" "}
                <a
                  href="https://www.tradelynk.app"
                  className="text-blue-600 hover:underline"
                >
                  www.tradelynk.app
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
