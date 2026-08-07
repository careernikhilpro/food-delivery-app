import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy | Swadddo - Food Delivery Marketplace",
  description: "Read Swadddo's Cookie Policy to understand how we use essential, analytics, and marketing cookies to improve your food delivery experience.",
  alternates: { canonical: "https://swadddo.in/cookie-policy" },
  openGraph: {
    title: "Cookie Policy | Swadddo",
    description: "Read Swadddo's Cookie Policy.",
    url: "https://swadddo.in/cookie-policy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookie Policy | Swadddo",
    description: "Read Swadddo's Cookie Policy.",
  }
};

export default function CookiePolicy() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Cookie Policy",
    "url": "https://swadddo.in/cookie-policy"
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Cookie Policy</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated: August 2026</p>
          </header>

          <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">1. What are Cookies?</h2>
              <p>
                Cookies are small text files stored on your device when you visit a website. Swadddo uses cookies to enhance your browsing experience, remember your preferences (like delivery location), and analyze site traffic.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. Types of Cookies We Use</h2>
              <ul className="list-disc pl-5 space-y-4 mt-2">
                <li>
                  <strong>Essential Cookies:</strong> Strictly necessary for the platform to function. These allow you to log in securely, add items to your cart, and process payments.
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Help us understand how users interact with our platform by collecting anonymous data on page views, load times, and click patterns.
                </li>
                <li>
                  <strong>Marketing Cookies:</strong> Used to track visitors across websites to display relevant advertisements and promotional offers tailored to your interests.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. Managing Browser Settings</h2>
              <p>
                You have the right to accept or decline cookies. Most web browsers automatically accept cookies, but you can usually modify your browser settings to decline them. Please note that disabling essential cookies may prevent you from placing orders on Swadddo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. Cookie Consent</h2>
              <p>
                By continuing to use Swadddo's website and app, you consent to our use of cookies in accordance with this policy. For further queries, please email <a href="mailto:careernikhilpro@gmail.com" className="text-[#00A14F] hover:underline">careernikhilpro@gmail.com</a>.
              </p>
            </section>
          </div>
        </article>
      </main>
    </>
  );
}
