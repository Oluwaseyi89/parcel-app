import React, { useState } from 'react';
import { Search, Flame, CheckCircle } from 'lucide-react';

const HotDeals: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Handle search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-4">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8 max-w-md mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex flex-row border-2 border-[rgb(219,33,76)] rounded-full h-12">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hot deals..."
                className="w-full border-none rounded-l-full pl-6 pr-4 py-3 focus:outline-none text-base"
              />
              <button
                type="submit"
                className="w-16 border-none rounded-r-full bg-[rgb(219,33,76)] hover:bg-[rgb(200,30,70)] transition-colors flex items-center justify-center"
              >
                <Search className="w-5 h-5 text-white" />
              </button>
            </div>
          </form>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[rgb(219,33,76)] to-[rgb(255,87,51)] rounded-2xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-6 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                🔥 HOT DEALS OF THE DAY!
              </h1>
              <p className="text-lg mb-6">
                Limited time offers with massive discounts. Don't miss out on these amazing deals!
              </p>
              <button className="bg-white text-[rgb(219,33,76)] font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors text-lg">
                Shop Now →
              </button>
            </div>
            <div className="md:w-2/5">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
                <div className="text-center">
                  <div className="inline-block bg-white text-[rgb(219,33,76)] rounded-full px-4 py-2 font-bold mb-4">
                    ⏰ LIMITED TIME
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Flash Sale Ends In:</h3>
                  <div className="flex justify-center space-x-4">
                    <div className="text-center">
                      <div className="bg-white text-[rgb(219,33,76)] rounded-lg p-3 text-2xl font-bold">12</div>
                      <div className="text-sm mt-1">Hours</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-white text-[rgb(219,33,76)] rounded-lg p-3 text-2xl font-bold">45</div>
                      <div className="text-sm mt-1">Mins</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-white text-[rgb(219,33,76)] rounded-lg p-3 text-2xl font-bold">30</div>
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
            <h2 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Today's Best Deals</h2>
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 border border-[rgb(219,33,76)] text-[rgb(219,33,76)] rounded-full text-sm hover:bg-[rgb(219,33,76)] hover:text-white transition-colors">
                Electronics
              </button>
              <button className="px-4 py-2 border border-[rgb(219,33,76)] text-[rgb(219,33,76)] rounded-full text-sm hover:bg-[rgb(219,33,76)] hover:text-white transition-colors">
                Fashion
              </button>
              <button className="px-4 py-2 border border-[rgb(219,33,76)] text-[rgb(219,33,76)] rounded-full text-sm hover:bg-[rgb(219,33,76)] hover:text-white transition-colors">
                Home & Kitchen
              </button>
              <button className="px-4 py-2 border border-[rgb(219,33,76)] text-[rgb(219,33,76)] rounded-full text-sm hover:bg-[rgb(219,33,76)] hover:text-white transition-colors">
                Beauty
              </button>
              <button className="px-4 py-2 border border-[rgb(219,33,76)] text-[rgb(219,33,76)] rounded-full text-sm hover:bg-[rgb(219,33,76)] hover:text-white transition-colors">
                Sports
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1">
                <div className="relative">
                  <div className="h-56 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <div className="text-gray-400 text-lg">Product Image {item}</div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      -{item * 10}%
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <button className="bg-white/90 hover:bg-white p-2 rounded-full transition-colors">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-800 mb-2 text-lg">Premium Wireless Headphones {item}</h3>
                  <div className="flex items-center mb-3">
                    <div className="flex text-yellow-400">
                      {"★".repeat(5 - (item % 2))}
                      <span className="text-gray-300">{"★".repeat(item % 2)}</span>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">({128 + item * 10} reviews)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-[rgb(219,33,76)]">${(89.99 - item * 5).toFixed(2)}</span>
                      <span className="text-sm text-gray-500 line-through ml-2">${(149.99 - item * 5).toFixed(2)}</span>
                    </div>
                    <button className="bg-[rgb(219,33,76)] text-white px-4 py-2 rounded-lg text-sm hover:bg-[rgb(200,30,70)] transition-colors font-medium">
                      Add to Cart
                    </button>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Sold: {item * 23}</span>
                      <span>Limited stock</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500" 
                        style={{ width: `${100 - item * 12}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Hot Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['Smartphones', 'Laptops', 'Fashion', 'Home Appliances', 'Gaming', 'Fitness', 'Books', 'Toys'].map((category, index) => (
              <div key={category} className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300 cursor-pointer group hover:-translate-y-1">
                <div className="w-20 h-20 bg-gradient-to-r from-[rgb(219,33,76)] to-[rgb(255,87,51)] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Flame className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2 text-lg">{category}</h3>
                <p className="text-sm text-gray-600">Up to {60 + index * 5}% off</p>
                <div className="mt-3 text-xs text-[rgb(219,33,76)] font-medium">
                  Shop Now →
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Why Shop Hot Deals?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[rgb(219,33,76)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-2">Best Prices</h3>
              <p className="text-gray-600">Guaranteed lowest prices on all hot deals</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[rgb(219,33,76)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Same-day or next-day delivery available</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[rgb(219,33,76)] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-2">Quality Guarantee</h3>
              <p className="text-gray-600">30-day return policy on all products</p>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="bg-gradient-to-r from-[rgb(219,33,76)] to-[rgb(255,87,51)] rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Get Notified About Hot Deals!</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto opacity-90">
            Subscribe to our newsletter and be the first to know about exclusive deals, flash sales, and special offers.
          </p>
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-grow px-6 py-4 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-white text-gray-800"
            />
            <button className="bg-white text-[rgb(219,33,76)] font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-colors whitespace-nowrap text-lg">
              Subscribe Now
            </button>
          </div>
          <p className="text-sm opacity-75 mt-4">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </main>
    </div>
  );
};

export default HotDeals;
