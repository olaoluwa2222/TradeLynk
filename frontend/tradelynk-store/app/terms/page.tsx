// app/terms/page.tsx
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Service - TradeLynk",
  description:
    "TradeLynk Terms of Service - Rules and guidelines for using our marketplace platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1
            className="text-4xl font-bold text-black mb-4"
            style={{ fontFamily: "Clash Display", fontWeight: 700 }}
          >
            Terms of Service
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
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to TradeLynk. By accessing or using our website at{" "}
              <a
                href="https://www.tradelynk.app"
                className="text-blue-600 hover:underline"
              >
                www.tradelynk.app
              </a>{" "}
              (&quot;the Platform&quot;), you agree to be bound by these Terms
              of Service (&quot;Terms&quot;). If you do not agree to these
              Terms, you must not use TradeLynk. These Terms constitute a
              legally binding agreement between you and TradeLynk.
            </p>
          </section>

          {/* About TradeLynk */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              2. About TradeLynk
            </h2>
            <p className="text-gray-700 leading-relaxed">
              TradeLynk is an online marketplace platform that connects buyers
              and sellers. Sellers can create their own branded storefronts,
              list products, and manage orders. Buyers can browse, purchase
              items, and communicate with sellers. TradeLynk acts as an
              intermediary platform and does not own or sell any products listed
              by sellers.
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              3. Eligibility
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              To use TradeLynk, you must:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Be at least 18 years of age.</li>
              <li>
                Have the legal capacity to enter into a binding agreement.
              </li>
              <li>Provide accurate and complete registration information.</li>
              <li>
                Not have been previously banned or removed from TradeLynk.
              </li>
            </ul>
          </section>

          {/* Account Registration */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              4. Account Registration &amp; Security
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              When creating an account, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide truthful, accurate, and current information.</li>
              <li>Maintain the confidentiality of your account credentials.</li>
              <li>
                Immediately notify us of any unauthorised access to your
                account.
              </li>
              <li>
                Not share your account with others or create multiple accounts.
              </li>
              <li>
                Verify your email address as part of the registration process.
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              You are responsible for all activity that occurs under your
              account. TradeLynk is not liable for any loss arising from
              unauthorised use of your account.
            </p>
          </section>

          {/* Buyer Terms */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              5. Buyer Terms
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              As a buyer on TradeLynk, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                Provide accurate delivery and payment information when placing
                orders.
              </li>
              <li>
                Pay the full listed price plus any applicable shipping fees for
                items purchased.
              </li>
              <li>
                Communicate respectfully with sellers through our in-app
                messaging system.
              </li>
              <li>
                Not engage in fraudulent transactions, chargebacks, or abuse of
                the refund system.
              </li>
              <li>
                Leave honest and fair reviews and ratings for products and
                sellers.
              </li>
            </ul>
          </section>

          {/* Seller Terms */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              6. Seller Terms
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              As a seller on TradeLynk, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                Provide accurate descriptions, images, and pricing for all
                listed products.
              </li>
              <li>
                Only list items that you legally own or are authorised to sell.
              </li>
              <li>
                Fulfil orders promptly and ship items within the stated
                timeframe.
              </li>
              <li>
                Respond to buyer inquiries and messages in a timely manner.
              </li>
              <li>
                Not list prohibited, illegal, counterfeit, or stolen items.
              </li>
              <li>
                Comply with all applicable Nigerian laws and regulations
                regarding the sale of goods.
              </li>
              <li>
                Handle returns and disputes fairly and in accordance with our
                policies.
              </li>
              <li>
                Provide valid bank or payment details for receiving payouts.
              </li>
            </ul>
          </section>

          {/* Prohibited Items & Activities */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              7. Prohibited Items &amp; Activities
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              The following items and activities are strictly prohibited on
              TradeLynk:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Illegal, counterfeit, or stolen goods.</li>
              <li>Drugs, controlled substances, and drug paraphernalia.</li>
              <li>Weapons, firearms, and explosives.</li>
              <li>Pornographic or sexually explicit content.</li>
              <li>Hazardous materials and restricted chemicals.</li>
              <li>Items that infringe intellectual property rights.</li>
              <li>Fraudulent schemes, scams, or misleading listings.</li>
              <li>
                Spam, harassment, or abusive behaviour towards other users.
              </li>
              <li>Attempting to circumvent TradeLynk&apos;s payment system.</li>
              <li>
                Any activity that violates Nigerian law or international law.
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              We reserve the right to remove any listing and suspend or
              terminate accounts that violate these rules without prior notice.
            </p>
          </section>

          {/* Payments */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              8. Payments &amp; Transactions
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                All prices are displayed in the applicable currency and include
                any stated fees.
              </li>
              <li>
                Payments are processed through secure third-party payment
                providers.
              </li>
              <li>
                TradeLynk may charge service fees or commissions on
                transactions, which will be clearly disclosed.
              </li>
              <li>
                Seller payouts are processed according to our payout schedule
                and policies.
              </li>
              <li>
                Refunds and chargebacks are handled in accordance with our
                dispute resolution process.
              </li>
            </ul>
          </section>

          {/* Disputes */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              9. Disputes &amp; Resolutions
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              In the event of a dispute between a buyer and seller:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                We encourage parties to resolve disputes directly through our
                in-app messaging system.
              </li>
              <li>
                If a resolution cannot be reached, either party can open a
                formal dispute through the platform.
              </li>
              <li>
                TradeLynk will review the dispute and may mediate to reach a
                fair outcome.
              </li>
              <li>
                TradeLynk&apos;s decision on disputes is final and binding.
              </li>
              <li>
                We reserve the right to issue refunds, suspend accounts, or take
                other appropriate action.
              </li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              10. Intellectual Property
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>TradeLynk&apos;s IP:</strong> The TradeLynk name, logo,
              website design, and all original content are the intellectual
              property of TradeLynk. You may not copy, modify, or distribute our
              content without written permission.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>User Content:</strong> By uploading content (product
              images, descriptions, reviews), you grant TradeLynk a
              non-exclusive, royalty-free licence to use, display, and
              distribute that content on our platform. You retain ownership of
              your content and are responsible for ensuring it does not infringe
              on any third-party rights.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              11. Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              To the maximum extent permitted by law:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                TradeLynk is provided &quot;as is&quot; and &quot;as
                available&quot; without warranties of any kind.
              </li>
              <li>
                We do not guarantee the quality, safety, or legality of items
                listed on the platform.
              </li>
              <li>
                We are not responsible for the actions, products, or content of
                sellers or buyers.
              </li>
              <li>
                TradeLynk is not liable for any indirect, incidental, special,
                or consequential damages arising from your use of the platform.
              </li>
              <li>
                Our total liability for any claim shall not exceed the amount of
                fees paid by you to TradeLynk in the 12 months preceding the
                claim.
              </li>
            </ul>
          </section>

          {/* Indemnification */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              12. Indemnification
            </h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold TradeLynk, its officers,
              employees, and partners harmless from any claims, damages, losses,
              or expenses (including legal fees) arising from your use of the
              platform, your violation of these Terms, or your infringement of
              any third-party rights.
            </p>
          </section>

          {/* Account Termination */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              13. Account Suspension &amp; Termination
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We reserve the right to suspend or terminate your account at our
              sole discretion if:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You violate any of these Terms of Service.</li>
              <li>You engage in fraudulent, illegal, or harmful activities.</li>
              <li>
                Your account is reported by multiple users for misconduct.
              </li>
              <li>You fail to comply with applicable laws and regulations.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              You may also close your account at any time by contacting us. Upon
              termination, your access to the platform will be revoked, but
              certain data may be retained as required by law.
            </p>
          </section>

          {/* Privacy */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              14. Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Your use of TradeLynk is also governed by our{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              , which describes how we collect, use, and protect your personal
              information. By using TradeLynk, you consent to our data practices
              as described in the Privacy Policy.
            </p>
          </section>

          {/* Third-Party Links */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              15. Third-Party Links &amp; Services
            </h2>
            <p className="text-gray-700 leading-relaxed">
              TradeLynk may contain links to third-party websites or services
              (including social login via Facebook/Meta). We are not responsible
              for the content, privacy practices, or terms of any third-party
              sites. Your use of third-party services is at your own risk and
              subject to their respective terms and conditions.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              16. Governing Law
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with
              the laws of the Federal Republic of Nigeria. Any disputes arising
              from these Terms or your use of TradeLynk shall be subject to the
              exclusive jurisdiction of the courts of Nigeria.
            </p>
          </section>

          {/* Modifications */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              17. Modifications to Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. Changes
              will be effective immediately upon posting to this page. We will
              update the &quot;Last updated&quot; date at the top of this page.
              Your continued use of TradeLynk after any changes constitutes your
              acceptance of the revised Terms.
            </p>
          </section>

          {/* Severability */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              18. Severability
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If any provision of these Terms is found to be invalid or
              unenforceable, the remaining provisions shall continue in full
              force and effect. The invalid provision shall be modified to the
              minimum extent necessary to make it valid and enforceable.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2
              className="text-2xl font-semibold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              19. Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms of Service, please
              contact us:
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
