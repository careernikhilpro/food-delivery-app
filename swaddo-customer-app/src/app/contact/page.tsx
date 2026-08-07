import { Metadata } from "next";
import Link from "next/link";
import { Mail, Globe, Clock, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | Swadddo Support",
  description: "Get in touch with Swadddo customer support. Reach out to us for order issues, restaurant inquiries, or partnership opportunities.",
  alternates: { canonical: "https://swadddo.in/contact" },
  openGraph: {
    title: "Contact Us | Swadddo",
    description: "Get in touch with Swadddo customer support.",
    url: "https://swadddo.in/contact",
    type: "website",
  }
};

export default function Contact() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact Swadddo",
    "url": "https://swadddo.in/contact"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <article className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 sm:p-10 border border-gray-100 dark:border-gray-700">
          <header className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h1>
            <p className="text-gray-500 dark:text-gray-400">We're here to help! Reach out to us regarding your orders, partnerships, or any general inquiries.</p>
          </header>

          <div className="grid sm:grid-cols-2 gap-6 text-gray-700 dark:text-gray-300">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
              <Mail className="w-8 h-8 text-[#00A14F] mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">Support Email</h3>
              <a href="mailto:careernikhilpro@gmail.com" className="text-gray-600 dark:text-gray-300 hover:text-[#00A14F] dark:hover:text-[#00A14F]">
                careernikhilpro@gmail.com
              </a>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
              <Globe className="w-8 h-8 text-[#00A14F] mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">Website</h3>
              <Link href="https://swadddo.in" className="text-gray-600 dark:text-gray-300 hover:text-[#00A14F] dark:hover:text-[#00A14F]">
                https://swadddo.in
              </Link>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center sm:col-span-2">
              <Clock className="w-8 h-8 text-[#00A14F] mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">Business Hours</h3>
              <p className="text-gray-600 dark:text-gray-300">Customer Support: 24/7 for active orders</p>
              <p className="text-gray-600 dark:text-gray-300">General Inquiries: Mon-Fri, 9:00 AM - 6:00 PM (IST)</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center sm:col-span-2">
              <MapPin className="w-8 h-8 text-[#00A14F] mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">Country</h3>
              <p className="text-gray-600 dark:text-gray-300">India</p>
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
