import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Swadddo - Food Delivery Marketplace",
  description: "Learn about Swadddo, the online food ordering and delivery marketplace connecting customers, restaurants, and delivery partners.",
  alternates: { canonical: "https://swadddo.in/about" },
  openGraph: {
    title: "About Us | Swadddo",
    description: "Learn about Swadddo, the online food ordering marketplace.",
    url: "https://swadddo.in/about",
    type: "website",
  }
};

export default function AboutUs() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Swadddo",
    "url": "https://swadddo.in/about"
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">About Us</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Discover the story behind Swadddo.</p>
          </header>

          <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Who We Are</h2>
              <p>
                Swadddo is a dynamic online food ordering and delivery marketplace. We serve as the digital bridge connecting hungry customers with local restaurants and dedicated delivery partners. Please note, Swadddo is strictly a technology platform; we do not own restaurants or manufacture food ourselves.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Our Mission</h2>
              <p>
                To empower local eateries by providing them with a robust digital presence, while ensuring customers get lightning-fast access to their favorite local and street food at the lowest guaranteed prices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Our Vision</h2>
              <p>
                To revolutionize the local food delivery ecosystem in India by building a transparent, fair, and hyper-efficient marketplace that benefits every stakeholder in the food supply chain.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">How Swadddo Works</h2>
              <div className="grid sm:grid-cols-3 gap-6 mt-4">
                <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-xl border border-green-100 dark:border-green-800/30">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">1. For Customers</h3>
                  <p className="text-sm">Browse a wide variety of local restaurants, place orders seamlessly, and track deliveries in real-time right to your doorstep.</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-xl border border-orange-100 dark:border-orange-800/30">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">2. For Restaurants</h3>
                  <p className="text-sm">Restaurants receive orders via our platform, prepare the food with their own ingredients, and hand it over for delivery.</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-800/30">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">3. For Delivery Partners</h3>
                  <p className="text-sm">Independent delivery partners pick up the freshly prepared food and ensure safe, timely transit to the customer.</p>
                </div>
              </div>
            </section>
          </div>
        </article>
      </main>
    </>
  );
}
