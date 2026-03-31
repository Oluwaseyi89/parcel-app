"use client";

import { useState, useEffect } from "react";
import { Search, Flame, CheckCircle } from "lucide-react";

interface CountdownTime {
  hours: number;
  mins: number;
  secs: number;
}

const HOT_CATEGORIES = [
  "Smartphones",
  "Laptops",
  "Fashion",
  "Home Appliances",
  "Gaming",
  "Fitness",
  "Books",
  "Toys",
];

const DEAL_FILTER_TABS = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports"];

const DEAL_ITEMS = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: `Premium Wireless Headphones ${i + 1}`,
  discount: (i + 1) * 10,
  price: (89.99 - (i + 1) * 5).toFixed(2),
  originalPrice: (149.99 - (i + 1) * 5).toFixed(2),
  rating: 5 - (i % 2),
  reviews: 128 + (i + 1) * 10,
  sold: (i + 1) * 23,
  stock: 100 - (i + 1) * 12,
}));

function useCountdown(targetSeconds: number) {
  const [remaining, setRemaining] = useState(targetSeconds);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  return { h, m, s };
}

export default function HotDealsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const { h, m, s } = useCountdown(12 * 3600 + 45 * 60 + 30);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="min-h-screen bg-gray-50 pt-4">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Search Bar */}
        <div className="mb-8 max-w-md mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex flex-row border-2 border-danger rounded-full h-12">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hot deals..."
                className="w-full border-none rounded-l-full pl-6 pr-4 py-3 focus:outline-none text-base"
              />
              <button
                type="submit"
                className="w-16 border-none rounded-r-full bg-danger hover:brightness-90 transition-all flex items-center justify-center"
              >
                <Search className="w-5 h-5 text-white" />
              </button>
            </div>
          </form>
        </div>

        {/* Hero Section */}
        <div className="bg-linear-to-r from-danger to-orange-500 rounded-2xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-6 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                🔥 HOT DEALS OF THE DAY!
              </h1>
              <p className="text-lg mb-6">
                Limited time offers with massive discounts. Don&apos;t miss out on these amazing
                deals!
              </p>
              <button className="bg-white text-danger font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors text-lg">
                Shop Now →
              </button>
            </div>
            <div className="md:w-2/5">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
                <div className="text-center">
                  <div className="inline-block bg-white text-danger rounded-full px-4 py-2 font-bold mb-4">
                    ⏰ LIMITED TIME
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Flash Sale Ends In:</h3>
                  <div className="flex justify-center space-x-4">
                    <div className="text-center">
                      <div className="bg-white text-danger rounded-lg p-3 text-2xl font-bold min-w-14">
                        {pad(h)}
                      </div>
                      <div className="text-sm mt-1">Hours</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-white text-danger rounded-lg p-3 text-2xl font-bold min-w-14">
                        {pad(m)}
                      </div>
                      <div className="text-sm mt-1">Mins</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-white text-danger rounded-lg p-3 text-2xl font-bold min-w-14">
                        {pad(s)}
                      </div>
                      <div className="text-sm mt-1">Secs</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hot Deals Grid */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
              Today&apos;s Best Deals
            </h2>
            <div className="flex flex-wrap gap-2">
              {DEAL_FILTER_TABS.map((tab) => (
                <button
                  key={tab}
                  className="px-4 py-2 border border-danger text-danger rounded-full text-sm hover:bg-danger hover:text-white transition-colors"
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {DEAL_ITEMS.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative">
                  <div className="h-56 bg-linear-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <div className="text-gray-400 text-lg">Product Image {item.id}</div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      -{item.discount}%
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <button className="bg-white/90 hover:bg-white p-2 rounded-full transition-colors">
                      <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-800 mb-2 text-lg">{item.name}</h3>
                  <div className="flex items-center mb-3">
                    <div className="flex text-yellow-400">
                      {"★".repeat(item.rating)}
                      <span className="text-gray-300">{"★".repeat(5 - item.rating)}</span>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">({item.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-danger">${item.price}</span>
                      <span className="text-sm text-gray-500 line-through ml-2">
                        ${item.originalPrice}
                      </span>
                    </div>
                    <button className="bg-danger text-white px-4 py-2 rounded-lg text-sm hover:brightness-90 transition-all font-medium">
                      Add to Cart
                    </button>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Sold: {item.sold}</span>
                      <span>Limited stock</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${item.stock}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hot Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Hot Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {HOT_CATEGORIES.map((category, index) => (
              <div
                key={category}
                className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1"
              >
                <div className="w-20 h-20 bg-linear-to-r from-danger to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Flame className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2 text-lg">{category}</h3>
                <p className="text-sm text-gray-600">Up to {60 + index * 5}% off</p>
                <div className="mt-3 text-xs text-danger font-medium">Shop Now →</div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-12 bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Why Shop Hot Deals?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-danger rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-2">Best Prices</h3>
              <p className="text-gray-600">Guaranteed lowest prices on all hot deals</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-danger rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Same-day or next-day delivery available</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-danger rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-2">Quality Guarantee</h3>
              <p className="text-gray-600">30-day return policy on all products</p>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="bg-linear-to-r from-danger to-orange-500 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Get Notified About Hot Deals!</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto opacity-90">
            Subscribe to our newsletter and be the first to know about exclusive deals, flash
            sales, and special offers.
          </p>
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="grow px-6 py-4 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-white text-gray-800"
            />
            <button className="bg-white text-danger font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-colors whitespace-nowrap text-lg">
              Subscribe Now
            </button>
          </div>
          <p className="text-sm opacity-75 mt-4">No spam. Unsubscribe anytime.</p>
        </div>
      </main>
    </div>
  );
}
