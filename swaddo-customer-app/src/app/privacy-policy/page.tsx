import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Swadddo - Food Delivery Marketplace",
  description: "Learn how Swadddo collects, uses, and protects your personal data. Read our privacy policy for information on data security and user rights.",
  alternates: { canonical: "https://swadddo.in/privacy-policy" },
  openGraph: {
    title: "Privacy Policy | Swadddo",
    description: "Learn how Swadddo collects, uses, and protects your personal data.",
    url: "https://swadddo.in/privacy-policy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Swadddo",
    description: "Learn how Swadddo collects, uses, and protects your personal data.",
  }
};

export default function PrivacyPolicy() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy",
    "url": "https://swadddo.in/privacy-policy"
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated: August 2026</p>
          </header>

          <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">1. Introduction</h2>
              <p>
                At Swadddo, your privacy is a top priority. This Privacy Policy outlines how we collect, use, and protect your information when you use our website (<Link href="https://swadddo.in" className="text-[#00A14F] hover:underline">https://swadddo.in</Link>) and mobile applications.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. Information We Collect</h2>
              <p className="mb-2">To provide you with a seamless food delivery experience, we collect the following information:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Name</li>
                <li>Email Address</li>
                <li>Phone Number</li>
                <li>Delivery Address</li>
                <li>GPS Location (with consent)</li>
                <li>Device Information & IP Address</li>
                <li>Order History & Payment Status</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-3">3. Information We DON'T Collect</h2>
              <p>
                For your ultimate security, Swadddo relies entirely on secure third-party payment gateways. <strong>We DO NOT collect or store:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2 font-medium">
                <li>Debit Card Numbers</li>
                <li>Credit Card Numbers</li>
                <li>CVV Codes</li>
                <li>UPI PINs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. How We Use Information</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Order Processing & Delivery:</strong> To relay your order to the restaurant and guide the delivery partner to your address.</li>
                <li><strong>Customer Support:</strong> To assist you with order modifications, refunds, or complaints.</li>
                <li><strong>Marketing:</strong> To send you promotional offers and discounts (you can opt-out at any time).</li>
                <li><strong>Fraud Detection & Analytics:</strong> To prevent malicious activities and improve our platform's performance.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">5. Data Sharing</h2>
              <p className="mb-2">We only share necessary data with trusted third parties to fulfill your order:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Restaurants:</strong> Order details and first name.</li>
                <li><strong>Delivery Partners:</strong> Name, phone number, and delivery address.</li>
                <li><strong>Payment Gateways:</strong> Order value and payment status.</li>
                <li><strong>Government Authorities:</strong> When required by Indian law or legal compliance.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6. Data Security & Retention</h2>
              <p>
                We use industry-standard encryption to protect your data. We retain your personal information only for as long as necessary to fulfill the purposes outlined in this policy or as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">7. User Rights & Contact</h2>
              <p>
                You have the right to access, modify, or request the deletion of your account and personal information.
              </p>
              <p className="mt-4 font-medium">
                To exercise your rights, or for privacy-related inquiries, contact us at: <br/>
                <a href="mailto:careernikhilpro@gmail.com" className="text-[#00A14F] hover:underline">careernikhilpro@gmail.com</a>
              </p>
            </section>
          </div>
        </article>
      </main>
    </>
  );
}
