import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UseFetchJSON } from './useFetch';
import { useProductStore } from '../stores/productStore';
import { Eye, ShoppingCart, Star, Tag, Truck, Store, Shield, Package } from 'lucide-react';

type Product = any;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { products, setProducts, loading, error } = useProductStore();

  // Hardcoded products for when backend is not available
  const hardcodedProducts = [
    {
      id: 1,
      prod_name: 'Wireless Bluetooth Headphones',
      prod_model: 'Noise Cancelling Premium',
      prod_desc: 'Premium wireless headphones with active noise cancellation and 30-hour battery life.',
      prod_price: 14999,
      prod_photo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
      prod_disc: 40,
      vendor_name: 'AudioTech Store',
      vendor_photo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w-200&h=200&fit=crop',
      category: 'electronics',
      rating: 4.5,
      stock: 25
    },
    {
      id: 2,
      prod_name: 'Smart Watch Series 5',
      prod_model: 'Fitness & Health Tracker',
      prod_desc: 'Advanced smartwatch with heart rate monitoring, GPS, and water resistance.',
      prod_price: 29999,
      prod_photo: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
      prod_disc: 25,
      vendor_name: 'TechGadgets NG',
      vendor_photo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop',
      category: 'electronics',
      rating: 4.7,
      stock: 15
    },
    {
      id: 3,
      prod_name: 'Organic Cotton T-Shirt',
      prod_model: 'Premium Collection',
      prod_desc: '100% organic cotton t-shirt, comfortable and eco-friendly.',
      prod_price: 2499,
      prod_photo: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
      prod_disc: 30,
      vendor_name: 'EcoWear Fashion',
      vendor_photo: 'https://images.unsplash.com/photo-1560883610-4bae3b844f23?w=200&h=200&fit=crop',
      category: 'fashion',
      rating: 4.3,
      stock: 50
    },
    {
      id: 4,
      prod_name: 'Stainless Steel Cookware Set',
      prod_model: '10-Piece Kitchen Set',
      prod_desc: 'Premium stainless steel cookware set with non-stick coating.',
      prod_price: 18999,
      prod_photo: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop',
      prod_disc: 35,
      vendor_name: 'HomeEssentials',
      vendor_photo: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop',
      category: 'home',
      rating: 4.8,
      stock: 12
    },
    {
      id: 5,
      prod_name: 'Professional Camera DSLR',
      prod_model: '24MP 4K Video',
      prod_desc: 'Professional DSLR camera with 24MP sensor and 4K video recording.',
      prod_price: 89999,
      prod_photo: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=300&fit=crop',
      prod_disc: 20,
      vendor_name: 'ProCamera Hub',
      vendor_photo: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200&h=200&fit=crop',
      category: 'electronics',
      rating: 4.9,
      stock: 8
    },
    {
      id: 6,
      prod_name: 'Yoga Mat Premium',
      prod_model: 'Non-Slip 10mm Thick',
      prod_desc: 'Eco-friendly yoga mat with non-slip surface and carrying strap.',
      prod_price: 4999,
      prod_photo: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=300&h=300&fit=crop',
      prod_disc: 40,
      vendor_name: 'FitLife Store',
      vendor_photo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop',
      category: 'sports',
      rating: 4.4,
      stock: 30
    },
    {
      id: 7,
      prod_name: 'Designer Leather Handbag',
      prod_model: 'Classic Collection',
      prod_desc: 'Genuine leather handbag with multiple compartments and adjustable strap.',
      prod_price: 15999,
      prod_photo: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&h=300&fit=crop',
      prod_disc: 45,
      vendor_name: 'LuxeBags NG',
      vendor_photo: 'https://images.unsplash.com/photo-1565130838609-c3a86655db61?w=200&h=200&fit=crop',
      category: 'fashion',
      rating: 4.6,
      stock: 18
    },
    {
      id: 8,
      prod_name: 'Air Purifier HEPA Filter',
      prod_model: 'Smart Air Quality Monitor',
      prod_desc: 'HEPA air purifier with smart sensors and quiet operation.',
      prod_price: 24999,
      prod_photo: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=300&fit=crop',
      prod_disc: 30,
      vendor_name: 'HealthyHome Solutions',
      vendor_photo: 'https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=200&h=200&fit=crop',
      category: 'home',
      rating: 4.7,
      stock: 10
    }
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      const apiUrl = 'http://localhost:7000/parcel_product/get_prod/';
      try {
        const data = await UseFetchJSON<{ data?: Product[] }>(apiUrl, 'GET');
        if (data?.data) {
          setProducts(data.data);
        } else {
          // If backend returns empty or invalid data, use hardcoded products
          console.log('Backend returned no data, using hardcoded products');
          setProducts(hardcodedProducts);
        }
      } catch (err) {
        console.error('Error fetching products, using hardcoded data:', err);
        // Use hardcoded products when backend fails
        setProducts(hardcodedProducts);
      }
    };

    fetchProducts();
  }, [setProducts]);

  const handleViewProduct = (product: Product) => {
    localStorage.setItem('prodView', JSON.stringify(product));
    navigate('/prod-detail');
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering view product
    console.log('Add to cart:', product);
    // Implement add to cart logic here
    // Could add to localStorage or context
    alert(`Added ${product.prod_name} to cart!`);
  };

  const formatCurrency = (amount: number) => {
    return `₦ ${amount?.toLocaleString() || '0'}`;
  };

  const calculateDiscountPrice = (price: number, discount: number) => {
    const discountAmount = price * (discount / 100);
    return price - discountAmount;
  };

  // Calculate discount based on product or use default
  const getProductDiscount = (prod: Product) => {
    return prod.prod_disc || Math.floor(Math.random() * 30) + 20; // 20-50% discount
  };

  // Get product rating
  const getProductRating = (prod: Product) => {
    return prod.rating || 4.0 + Math.random() * 0.9; // 4.0-4.9
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-danger to-orange-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Discover Amazing Products
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Fast delivery, great prices, and exceptional service
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full">
                <Truck className="w-5 h-5" />
                <span>Fast Delivery</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full">
                <Tag className="w-5 h-5" />
                <span>Hot Deals</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full">
                <Star className="w-5 h-5" />
                <span>Quality Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Backend Status Indicator */}
        {products.length > 0 && products[0].id <= 8 && (
          <div className="mb-6">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
              <Shield className="w-4 h-4 mr-2" />
              Showing demo products - Backend connection not available
            </div>
          </div>
        )}

        {/* Loading & Error States */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-danger"></div>
            <span className="ml-4 text-gray-600">Loading products...</span>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Connection error - Showing demo products</span>
            </div>
          </div>
        )}

        {/* Products Grid Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              Featured Products
            </h2>
            <p className="text-gray-600 mt-2">
              {products.length} amazing products waiting for you
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium">
                All Products
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((prod: Product, index: number) => {
              const discount = getProductDiscount(prod);
              const originalPrice = prod.prod_price || 0;
              const discountPrice = calculateDiscountPrice(originalPrice, discount);
              const rating = getProductRating(prod);
              const stockStatus = prod.stock > 0 
                ? prod.stock > 10 
                  ? 'In Stock' 
                  : `Only ${prod.stock} left` 
                : 'Out of Stock';

              return (
                <div
                  key={prod.id || index}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 group cursor-pointer"
                  onClick={() => handleViewProduct(prod)}
                >
                  {/* Product Image */}
                  <div className="relative h-48 md:h-56 overflow-hidden bg-gray-100">
                    <img
                      alt={prod.prod_name || 'Product image'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      src={prod.prod_photo || `https://via.placeholder.com/300x300?text=${encodeURIComponent(prod.prod_name || 'Product')}`}
                      onError={(e) => {
                        e.currentTarget.src = `https://via.placeholder.com/300x300?text=${encodeURIComponent(prod.prod_name || 'Product')}`;
                      }}
                    />
                    
                    {/* Discount Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 bg-danger text-white text-sm font-bold rounded-full flex items-center">
                        <Tag className="w-3 h-3 mr-1" />
                        -{discount}%
                      </span>
                    </div>

                    {/* Stock Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1 text-white text-sm font-bold rounded-full ${
                        prod.stock > 10 ? 'bg-green-500' : prod.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {stockStatus}
                      </span>
                    </div>

                    {/* Quick Actions Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => handleAddToCart(prod, e)}
                        className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-white text-danger p-3 rounded-full shadow-lg hover:bg-danger hover:text-white"
                        aria-label="Add to cart"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    {/* Product Name & Rating */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-800 text-lg line-clamp-1">
                        {prod.prod_name || 'Unnamed Product'}
                      </h3>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Product Model */}
                    <p className="text-gray-600 text-sm mb-3 line-clamp-1">
                      {prod.prod_model || 'Standard Model'}
                    </p>

                    {/* Price Section */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold text-gray-900">
                            {formatCurrency(discountPrice)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {formatCurrency(originalPrice)}
                          </span>
                        </div>
                        <p className="text-xs text-green-600 font-medium">
                          Save {formatCurrency(originalPrice - discountPrice)}
                        </p>
                      </div>
                    </div>

                    {/* Product Description */}
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">
                      {prod.prod_desc || 'No description available.'}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewProduct(prod)}
                        className="flex-1 flex items-center justify-center space-x-2 bg-danger text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={(e) => handleAddToCart(prod, e)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        aria-label="Add to cart"
                      >
                        <ShoppingCart className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>

                    {/* Vendor Info */}
                    {prod.vendor_name && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                            {prod.vendor_photo ? (
                              <img 
                                src={prod.vendor_photo} 
                                alt={prod.vendor_name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/32x32?text=V';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                <Store className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Sold by</p>
                            <p className="text-sm font-medium text-gray-800">{prod.vendor_name}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No products available</h3>
            <p className="text-gray-500 mb-6">
              Check back soon or contact support
            </p>
            <button className="px-6 py-2 bg-danger text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium">
              Browse Categories
            </button>
          </div>
        )}

        {/* Pagination/Load More */}
        {products.length > 0 && (
          <div className="mt-12 flex justify-center">
            <button className="px-6 py-3 border border-danger text-danger rounded-lg hover:bg-red-50 transition-colors duration-200 font-medium">
              Load More Products
            </button>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-800">Fast Delivery</h3>
            </div>
            <p className="text-gray-600">
              Get your products delivered within 24-48 hours in major cities.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-800">Best Prices</h3>
            </div>
            <p className="text-gray-600">
              Competitive prices with regular discounts and special offers.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-800">Secure Shopping</h3>
            </div>
            <p className="text-gray-600">
              Secure payment and buyer protection on all purchases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
