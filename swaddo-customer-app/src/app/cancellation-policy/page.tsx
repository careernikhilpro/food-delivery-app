import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation Policy | Swadddo",
  description: "Read the strict cancellation policy of Swadddo. Understand the 2-minute cancellation rule and refund eligibility for technical failures.",
  alternates: { canonical: "https://swadddo.in/cancellation-policy" },
  openGraph: {
    title: "Cancellation Policy | Swadddo",
    description: "Read the strict cancellation policy of Swadddo.",
    url: "https://swadddo.in/cancellation-policy",
    type: "website",
  }
};

export default function CancellationPolicy() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Cancellation Policy",
    "url": "https://swadddo.in/cancellation-policy"
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Cancellation Policy</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Strict Guidelines for Order Cancellations</p>
          </header>

          <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
            
            <section className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. The 2-Minute Rule</h2>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-green-500 shadow-sm">
                  <h3 className="font-bold text-green-700 dark:text-green-500 mb-2">Within 2 Minutes</h3>
                  <p className="text-sm">Customers are allowed to cancel their order within the first 2 minutes of placing it. A <strong>100% Refund</strong> will be processed for prepaid orders.</p>
                </div>
                <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-red-500 shadow-sm">
                  <h3 className="font-bold text-red-600 dark:text-red-400 mb-2">After 2 Minutes</h3>
                  <p className="text-sm">Once 2 minutes have elapsed, the restaurant immediately begins preparing the food. Therefore, <strong>No Cancellation and No Refund</strong> will be permitted under any circumstances.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. Restaurant Initiated Cancellations</h2>
              <p>
                In rare events, a restaurant may cancel your order (e.g., if an item becomes out of stock or they are unable to fulfill the request). In such cases, Swadddo will initiate a <strong>100% Refund</strong> to your original payment method immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. Technical Failures</h2>
              <p>
                If your payment is successfully deducted from your bank account, but the order fails to register on the Swadddo app due to a network or technical failure, a <strong>Refund is Allowed</strong>. The amount will automatically reverse to your account within 5-7 business days.
              </p>
            </section>

          </div>
        </article>
      </main>
    </>
  );
}
