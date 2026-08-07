import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer | Swadddo",
  description: "Swadddo acts strictly as a technology platform. We are not responsible for food preparation, taste, quality, or ingredients.",
  alternates: { canonical: "https://swadddo.in/disclaimer" },
  openGraph: {
    title: "Disclaimer | Swadddo",
    description: "Swadddo acts strictly as a technology platform.",
    url: "https://swadddo.in/disclaimer",
    type: "website",
  }
};

export default function Disclaimer() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Disclaimer",
    "url": "https://swadddo.in/disclaimer"
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Disclaimer</h1>
          </header>

          <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
            
            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800/30">
              <h2 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-3">1. Technology Platform Only</h2>
              <p>
                <strong>Swadddo is strictly an online technology platform (Marketplace).</strong> We facilitate the connection between customers ordering food, independent restaurants preparing the food, and independent delivery partners executing the delivery. Swadddo does not own, operate, or control any of the restaurants listed on our platform.
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl border border-red-100 dark:border-red-800/30">
              <h2 className="text-xl font-bold text-red-900 dark:text-red-300 mb-3">2. Restaurant Responsibilities</h2>
              <p className="mb-2">The respective restaurants are <strong>solely and strictly responsible</strong> for:</p>
              <ul className="list-disc pl-5 space-y-1 font-medium text-red-800 dark:text-red-200">
                <li>Food preparation and hygiene standards</li>
                <li>Taste and quality of the food</li>
                <li>Secure and safe packaging</li>
                <li>Ingredients used (including allergens and dietary labels)</li>
                <li>Compliance with all local FSSAI and health regulations</li>
              </ul>
            </div>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. Limitation of Liability</h2>
              <p>
                Swadddo expressly disclaims any liability arising from health hazards, food poisoning, allergies, or dissatisfaction related to the food delivered. Any grievances regarding the quality or condition of the food must be directed to the respective restaurant. We act solely as a facilitator for ordering and delivery logistics.
              </p>
            </section>

          </div>
        </article>
      </main>
    </>
  );
}
