import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy | Swadddo - Food Delivery Marketplace",
  description: "Understand Swadddo's Refund Policy. Learn about refund eligibility, timelines, and the complaint process for cancelled or failed orders.",
  alternates: { canonical: "https://swadddo.in/refund-policy" },
  openGraph: {
    title: "Refund Policy | Swadddo",
    description: "Understand Swadddo's Refund Policy.",
    url: "https://swadddo.in/refund-policy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Refund Policy | Swadddo",
    description: "Understand Swadddo's Refund Policy.",
  }
};

export default function RefundPolicy() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Refund Policy",
    "url": "https://swadddo.in/refund-policy"
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Refund Policy</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated: August 2026</p>
          </header>

          <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">1. Professional Introduction</h2>
              <p>
                At Swadddo, we strive to ensure a seamless food ordering experience. However, we understand that issues may arise. This policy outlines the circumstances under which refunds are provided and the process to claim them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-700 dark:text-green-500 mb-3">2. Refund Eligibility (Refund Allowed)</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Customer Cancellation (Within 2 Mins):</strong> 100% refund if the order is cancelled within 2 minutes of placement.</li>
                <li><strong>Restaurant Cancelled:</strong> 100% refund if the restaurant declines or cancels your order due to item unavailability.</li>
                <li><strong>Duplicate Payment / Tech Failure:</strong> 100% refund if payment is deducted but the order fails to register on our system.</li>
                <li><strong>Wrong Item / Missing Item:</strong> Partial or full refund subject to verification (see complaint process).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-3">3. Refund NOT Available</h2>
              <p className="mb-2">Refunds will strictly <strong>not</strong> be processed in the following scenarios:</p>
              <ul className="list-disc pl-5 space-y-2 font-medium">
                <li>Customer cancels the order <strong>after 2 minutes</strong> of placing it (as food preparation has begun).</li>
                <li>Customer provides a wrong delivery address.</li>
                <li>Customer is not reachable at the time of delivery.</li>
                <li>Delay caused by the customer at the drop location.</li>
                <li>The food has already been accepted and consumed by the customer.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. Complaint Process</h2>
              <p>
                For issues regarding damaged food, wrong items, or missing items, you must raise a complaint within <strong>24 hours</strong> of delivery. 
                <br/><br/>
                <strong>Photo Required:</strong> Clear photographic evidence of the delivered items and receipt is mandatory for approval. Swadddo reserves the right to deny refund claims lacking sufficient proof.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">5. Refund Timeline</h2>
              <p>
                Once a refund is approved by our support team, the amount will be processed back to the original payment method. 
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Timeline:</strong> 5–7 Business Days</li>
                <li><strong>Processing:</strong> May depend on Payment Gateway and respective Bank processing times.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6. Contact Details</h2>
              <p>If you have questions about your refund status, please contact:</p>
              <p className="mt-2 font-medium">Email: <a href="mailto:careernikhilpro@gmail.com" className="text-[#00A14F] hover:underline">careernikhilpro@gmail.com</a></p>
            </section>
          </div>
        </article>
      </main>
    </>
  );
}
