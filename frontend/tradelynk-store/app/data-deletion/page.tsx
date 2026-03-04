// app/data-deletion/page.tsx
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Data Deletion - TradeLynk",
  description: "Request deletion of your personal data from TradeLynk.",
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1
            className="text-4xl font-bold text-black mb-4"
            style={{ fontFamily: "Clash Display", fontWeight: 700 }}
          >
            Data Deletion Request
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
            <p className="text-gray-700 leading-relaxed text-lg">
              At TradeLynk, we respect your right to control your personal data.
              You can request the deletion of your account and all associated
              personal data at any time using any of the methods described
              below.
            </p>
          </section>

          {/* What Gets Deleted */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              What Data Will Be Deleted
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you request data deletion, we will remove the following:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                Your account profile information (name, email, phone number).
              </li>
              <li>Your delivery and billing addresses.</li>
              <li>Your chat messages and communication history.</li>
              <li>
                Your product listings and storefront data (if you are a seller).
              </li>
              <li>
                Your order history and transaction records (after any required
                legal retention period).
              </li>
              <li>
                Any data obtained from Facebook Login (profile name, email,
                profile picture).
              </li>
              <li>Push notification tokens and preferences.</li>
            </ul>
          </section>

          {/* What May Be Retained */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              What Data May Be Retained
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Certain data may be retained for a limited period as required by
              law or legitimate business purposes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                Transaction records required for tax, accounting, or legal
                compliance (retained for up to 6 years).
              </li>
              <li>
                Records related to active disputes or ongoing investigations.
              </li>
              <li>Anonymised and aggregated data that cannot identify you.</li>
            </ul>
          </section>

          {/* How to Request Deletion */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              How to Request Data Deletion
            </h2>

            {/* Method 1 - Email */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
              <h3
                className="text-lg font-semibold text-black mb-3"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                Option 1: Email Request
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Send an email to{" "}
                <a
                  href="mailto:tradelynk.commerce@gmail.com?subject=Data%20Deletion%20Request"
                  className="text-blue-600 hover:underline font-medium"
                >
                  tradelynk.commerce@gmail.com
                </a>{" "}
                with the following details:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  <strong>Subject:</strong> &quot;Data Deletion Request&quot;
                </li>
                <li>
                  <strong>Body:</strong> Include your full name, the email
                  address associated with your TradeLynk account, and your
                  username (if applicable).
                </li>
              </ul>
            </div>

            {/* Method 2 - Facebook */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
              <h3
                className="text-lg font-semibold text-black mb-3"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                Option 2: Via Facebook Settings
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                If you logged in using Facebook, you can remove TradeLynk&apos;s
                access to your data:
              </p>
              <ol className="list-decimal pl-6 text-gray-700 space-y-2">
                <li>
                  Go to your{" "}
                  <a
                    href="https://www.facebook.com/settings?tab=applications"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Facebook App Settings
                  </a>
                  .
                </li>
                <li>Find &quot;TradeLynk&quot; in the list of apps.</li>
                <li>Click &quot;Remove&quot; to revoke access.</li>
                <li>
                  This will trigger the deletion of your Facebook-linked data
                  from our systems.
                </li>
              </ol>
            </div>

            {/* Method 3 - In-App */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3
                className="text-lg font-semibold text-black mb-3"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                Option 3: Account Settings
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Log in to your TradeLynk account, navigate to your Account
                Settings, and select &quot;Delete Account.&quot; Follow the
                on-screen instructions to confirm the deletion.
              </p>
            </div>
          </section>

          {/* Timeline */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              Processing Timeline
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We will process your data deletion request within{" "}
              <strong>30 days</strong> of receiving it. You will receive a
              confirmation email once your data has been deleted. During the
              processing period, your account will be deactivated and
              inaccessible.
            </p>
          </section>

          {/* Confirmation */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              Confirmation
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Once your data deletion request has been processed, you will
              receive a confirmation email at the address associated with your
              account. If you do not receive confirmation within 30 days, please
              contact us at{" "}
              <a
                href="mailto:tradelynk.commerce@gmail.com"
                className="text-blue-600 hover:underline"
              >
                tradelynk.commerce@gmail.com
              </a>
              .
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              Questions?
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about data deletion or our privacy
              practices, please review our{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>{" "}
              or contact us at{" "}
              <a
                href="mailto:tradelynk.commerce@gmail.com"
                className="text-blue-600 hover:underline"
              >
                tradelynk.commerce@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
