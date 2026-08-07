import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | Swadddo - Food Delivery Marketplace",
  description: "Read the Terms & Conditions of Swadddo. Understand the rules, eligibility, order placement, cancellation policies, and payment terms for using our platform.",
  alternates: { canonical: "https://swadddo.in/terms-and-conditions" },
  openGraph: {
    title: "Terms & Conditions | Swadddo",
    description: "Read the Terms & Conditions of Swadddo.",
    url: "https://swadddo.in/terms-and-conditions",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms & Conditions | Swadddo",
    description: "Read the Terms & Conditions of Swadddo.",
  }
};

export default function TermsAndConditions() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Terms & Conditions",
    "url": "https://swadddo.in/terms-and-conditions"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <article className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 sm:p-10 border border-gray-100 dark:border-gray-700">
          <header className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Terms & Conditions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated: August 2026</p>
          </header>

          <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">1. Professional Introduction</h2>
              <p>
                Welcome to Swadddo (hereinafter referred to as "Platform", "We", "Us", or "Our"). Swadddo is an online food ordering and delivery marketplace that connects customers ("Users") with independent restaurants and delivery partners. By accessing or using our website <Link href="https://swadddo.in" className="text-[#00A14F] hover:underline">https://swadddo.in</Link> and associated mobile applications, you agree to comply with and be bound by these Terms & Conditions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. Definitions</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Swadddo:</strong> The technology platform facilitating food orders and delivery.</li>
                <li><strong>User/Customer:</strong> Any individual who registers or places an order on Swadddo.</li>
                <li><strong>Restaurant:</strong> Independent food preparation entities listed on the platform.</li>
                <li><strong>Delivery Partner:</strong> Independent contractors providing delivery services.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. Eligibility & User Accounts</h2>
              <p className="mb-2">
                You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Swadddo reserves the right to suspend or terminate accounts that violate these terms.
              </p>
              <p>
                <strong>Restaurant Accounts:</strong> Restaurants must provide accurate menus, pricing, and operating hours, and must comply with all local health, safety, and food standards laws in India.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. Order Placement & Confirmation</h2>
              <p>
                Placing an order through Swadddo constitutes an offer to purchase food from a Restaurant. The order is only confirmed once accepted by the Restaurant. Swadddo is not responsible for the Restaurant's failure to accept an order.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">5. Cancellation & Modification Policy</h2>
              <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4 rounded-r-lg mb-4">
                <p className="font-medium text-orange-800 dark:text-orange-200">IMPORTANT CANCELLATION RULES:</p>
                <ul className="list-disc pl-5 mt-2 text-orange-700 dark:text-orange-300">
                  <li><strong>Within 2 Minutes:</strong> Customers can cancel an order within 2 minutes of placing it for a 100% refund.</li>
                  <li><strong>After 2 Minutes:</strong> Once 2 minutes pass, the Restaurant starts preparing the food. <strong>No cancellation and no refund</strong> will be allowed after this window.</li>
                </ul>
              </div>
              <p>
                <strong>Restaurant Cancellation:</strong> If a Restaurant cancels your order due to unavailability, you will receive a 100% refund. Order modifications are not permitted once the order is confirmed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6. Payment Terms</h2>
              <p>
                We accept online payments via authorized Payment Gateways (Credit/Debit Cards, Net Banking, UPI, Wallets) and Cash on Delivery (COD) if enabled in your area. All prices are in Indian Rupees (INR) and are inclusive of relevant taxes unless stated otherwise.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">7. Delivery Policy</h2>
              <p>
                Estimated delivery times are indicative and may vary due to traffic, weather, or restaurant delays. Swadddo disclaims any liability for late deliveries caused by unforeseen circumstances beyond our control.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">8. Responsibilities</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Customer:</strong> Must provide an accurate delivery address and be reachable at the time of delivery.</li>
                <li><strong>Restaurant:</strong> Strictly responsible for food quality, taste, hygiene, packaging, and ingredients. Swadddo does NOT manufacture food.</li>
                <li><strong>Delivery Partner:</strong> Responsible for safe and timely transit of the package.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">9. Prohibited Activities & Fraud Prevention</h2>
              <p>
                Users must not use the platform for fraudulent activities, fake orders, abuse of promo codes, or harassment of delivery personnel. Swadddo actively monitors for fraud and will ban accounts and report severe offenses to local authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">10. Disclaimer & Limitation of Liability</h2>
              <p>
                Swadddo operates solely as a technology platform connecting users with restaurants and delivery partners. We do not guarantee the quality, safety, or legality of the food provided by restaurants. In no event shall Swadddo be liable for indirect, incidental, or consequential damages arising from the use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">11. Governing Law & Jurisdiction</h2>
              <p>
                These Terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in India.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">12. Contact Details</h2>
              <p>For any queries regarding these Terms & Conditions, please contact us at:</p>
              <p className="mt-2 font-medium">Email: <a href="mailto:careernikhilpro@gmail.com" className="text-[#00A14F] hover:underline">careernikhilpro@gmail.com</a></p>
            </section>
          </div>
        </article>
      </main>
    </>
  );
}
