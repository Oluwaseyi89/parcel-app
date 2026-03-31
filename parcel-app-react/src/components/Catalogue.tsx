import React, { useState } from 'react';
import { Search, Filter, Grid, List, Star, ShoppingCart, ChevronDown, Heart } from 'lucide-react';

const Catalogue: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
    }
  };

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'fashion', name: 'Fashion' },
    { id: 'home', name: 'Home & Kitchen' },
    { id: 'beauty', name: 'Beauty & Health' },
    { id: 'sports', name: 'Sports & Fitness' },
    { id: 'books', name: 'Books & Media' },
    { id: 'toys', name: 'Toys & Games' },
  ];

  const sortOptions = [
    { id: 'featured', name: 'Featured' },
    { id: 'price-low', name: 'Price: Low to High' },
    { id: 'price-high', name: 'Price: High to Low' },
    { id: 'rating', name: 'Customer Rating' },
    { id: 'newest', name: 'Newest Arrivals' },
    { id: 'bestselling', name: 'Best Selling' },
  ];

  const products = [
    { id: 1, name: 'Wireless Bluetooth Headphones', category: 'electronics', price: 89.99, originalPrice: 149.99, rating: 4.5, reviews: 128, imageColor: 'bg-blue-100', discount: 40 },
    { id: 2, name: 'Smart Watch Series 5', category: 'electronics', price: 249.99, originalPrice: 349.99, rating: 4.7, reviews: 89, imageColor: 'bg-gray-100', discount: 29 },
    { id: 3, name: 'Organic Cotton T-Shirt', category: 'fashion', price: 24.99, originalPrice: 39.99, rating: 4.3, reviews: 56, imageColor: 'bg-green-100', discount: 38 },
    { id: 4, name: 'Stainless Steel Cookware Set', category: 'home', price: 129.99, originalPrice: 199.99, rating: 4.8, reviews: 203, imageColor: 'bg-red-100', discount: 35 },
    { id: 5, name: 'Professional Camera DSLR', category: 'electronics', price: 899.99, originalPrice: 1299.99, rating: 4.9, reviews: 45, imageColor: 'bg-purple-100', discount: 31 },
    { id: 6, name: 'Yoga Mat Premium', category: 'sports', price: 34.99, originalPrice: 49.99, rating: 4.4, reviews: 167, imageColor: 'bg-yellow-100', discount: 30 },
    { id: 7, name: 'Designer Handbag', category: 'fashion', price: 159.99, originalPrice: 299.99, rating: 4.6, reviews: 78, imageColor: 'bg-pink-100', discount: 47 },
    { id: 8, name: 'Air Purifier HEPA Filter', category: 'home', price: 179.99, originalPrice: 249.99, rating: 4.7, reviews: 112, imageColor: 'bg-indigo-100', discount: 28 },
    { id: 9, name: 'Fitness Tracker Watch', category: 'sports', price: 79.99, originalPrice: 119.99, rating: 4.2, reviews: 234, imageColor: 'bg-teal-100', discount: 33 },
    { id: 10, name: 'Gaming Laptop', category: 'electronics', price: 1299.99, originalPrice: 1799.99, rating: 4.8, reviews: 67, imageColor: 'bg-gray-200', discount: 28 },
    { id: 11, name: 'Skincare Set', category: 'beauty', price: 49.99, originalPrice: 79.99, rating: 4.5, reviews: 189, imageColor: 'bg-rose-100', discount: 38 },
    { id: 12, name: 'Board Game Collection', category: 'toys', price: 39.99, originalPrice: 59.99, rating: 4.7, reviews: 145, imageColor: 'bg-orange-100', discount: 33 },
  ];

  const filteredProducts = products.filter(product => 
    selectedCategory === 'all' || product.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-4">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <div className="flex flex-row border-2 border-[rgb(219,33,76)] rounded-full h-12">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products in catalogue..."
                    className="w-full border-none rounded-l-full pl-6 pr-4 py-3 focus:outline-none text-base"
                  />
                  <button
                    type="submit"
                    className="w-16 border-none rounded-r-full bg-[rgb(219,33,76)] hover:bg-[rgb(200,30,70)] transition-colors flex items-center justify-center"
                  >
                    <Search className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </form>

            {/* View Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-[rgb(219,33,76)] text-white' : 'bg-white text-gray-700'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 ${viewMode === 'list' ? 'bg-[rgb(219,33,76)] text-white' : 'bg-white text-gray-700'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Button */}
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </button>
            </div>
          </div>

          {/* Categories and Sort */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === category.id ? 'bg-[rgb(219,33,76)] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    Sort by: {option.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{filteredProducts.length}</span> products
            {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
          </p>
        </div>

        {/* Products Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                <div className="relative">
                  <div className={`h-48 ${product.imageColor} flex items-center justify-center relative overflow-hidden`}>
                    <div className="text-gray-400 text-center p-4">
                      <div className="w-32 h-32 rounded-full bg-white/50 mx-auto mb-4" />
                      <div className="text-lg font-medium">{product.category.toUpperCase()}</div>
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        -{product.discount}%
                      </span>
                    </div>
                    <button className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full transition-colors">
                      <Heart className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{product.category}</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium ml-1">{product.rating}</span>
                      <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-3 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-[rgb(219,33,76)]">${product.price.toFixed(2)}</span>
                      <span className="text-sm text-gray-500 line-through ml-2">${product.originalPrice.toFixed(2)}</span>
                    </div>
                    <button className="bg-[rgb(219,33,76)] text-white px-4 py-2 rounded-lg text-sm hover:bg-[rgb(200,30,70)] transition-colors font-medium flex items-center">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add
                    </button>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Free shipping</span>
                      <span className="text-green-600 font-medium">In stock</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4">
                    <div className={`h-48 md:h-full ${product.imageColor} flex items-center justify-center relative`}>
                      <div className="text-center p-4">
                        <div className="w-32 h-32 rounded-full bg-white/50 mx-auto mb-4" />
                        <div className="text-lg font-medium">{product.category.toUpperCase()}</div>
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                          -{product.discount}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="md:w-3/4 p-6">
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">{product.category}</span>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium ml-1">{product.rating}</span>
                            <span className="text-xs text-gray-500 ml-1">({product.reviews} reviews)</span>
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">{product.name}</h3>
                        <p className="text-gray-600 mb-4">
                          Premium quality product with excellent customer reviews. Includes warranty and free shipping.
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-[rgb(219,33,76)]">${product.price.toFixed(2)}</span>
                          <span className="text-lg text-gray-500 line-through ml-3">${product.originalPrice.toFixed(2)}</span>
                          <div className="text-sm text-green-600 font-medium mt-1">
                            Save ${(product.originalPrice - product.price).toFixed(2)} ({product.discount}% off)
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                            View Details
                          </button>
                          <button className="bg-[rgb(219,33,76)] text-white px-6 py-2 rounded-lg hover:bg-[rgb(200,30,70)] transition-colors font-medium flex items-center">
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-12 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button className="px-4 py-2 bg-[rgb(219,33,76)] text-white rounded-lg">1</button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">2</button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">3</button>
            <span className="px-2 text-gray-500">...</span>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">10</button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Next
            </button>
          </nav>
        </div>

        {/* Newsletter CTA */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Can't Find What You're Looking For?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Sign up for our catalogue updates and be the first to know about new arrivals and restocks.
          </p>
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-grow px-6 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent"
            />
            <button className="bg-[rgb(219,33,76)] text-white font-bold px-6 py-3 rounded-full hover:bg-[rgb(200,30,70)] transition-colors whitespace-nowrap">
              Notify Me
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Catalogue;
