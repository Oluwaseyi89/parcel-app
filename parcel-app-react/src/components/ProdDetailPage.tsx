import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { ShoppingCart, Package, Star, Truck, Shield, ChevronLeft, Plus, Minus, User, CheckCircle } from 'lucide-react';

type Product = any;

const ProdDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const prodView: Product | null = JSON.parse(localStorage.getItem('prodView') || 'null');
  const { addToCart, removeFromCart } = useCartStore();

  const [proderr, setProdErr] = useState<string>('');
  const [prodsus, setProdSus] = useState<string>('');
  const [prodqty, setProdQty] = useState<number>(1);
  const [isInCart, setIsInCart] = useState<boolean>(false);

  const goBack = () => {
    navigate(-1);
  };

  const incrementProd = () => {
    setProdQty((qty) => qty + 1);
  };

  const decrementProd = () => {
    setProdQty((qty) => (qty > 1 ? qty - 1 : 1));
  };

  const handleBuyNow = () => {
    if (prodView) {
      const buySingle = { ...prodView, purchased_qty: prodqty };
      localStorage.setItem('buySingle', JSON.stringify(buySingle));
      navigate('/single');
    }
  };

  const handleAddToCart = () => {
    if (prodView && prodqty > 0) {
      addToCart({ ...prodView, purchased_qty: prodqty });
      setProdSus('Product added to cart successfully!');
      setIsInCart(true);
      setProdErr('');
      setTimeout(() => setProdSus(''), 3000);
    } else {
      setProdErr('Please select a valid quantity');
      setProdSus('');
      setTimeout(() => setProdErr(''), 3000);
    }
  };

  const handleRemoveFromCart = () => {
    if (prodView) {
      removeFromCart(prodView.id);
      setProdSus('Product removed from cart!');
      setIsInCart(false);
      setProdQty(1);
      setProdErr('');
      setTimeout(() => setProdSus(''), 3000);
    } else {
      setProdErr('Product was not found in cart.');
      setProdSus('');
      setTimeout(() => setProdErr(''), 3000);
    }
  };

  const calculateDiscountPrice = (price: number, discount: number) => {
    const discountAmount = price * (discount / 100);
    return price - discountAmount;
  };

  const formatCurrency = (amount: number) => {
    return `₦ ${amount?.toLocaleString() || '0'}`;
  };

  useEffect(() => {
    const updateQty = JSON.parse(localStorage.getItem('parcelCart') || 'null');
    if (updateQty && prodView) {
      const cartItem = updateQty.find((item: any) => item.id === prodView.id);
      if (cartItem) {
        setProdQty(cartItem.purchased_qty);
        setIsInCart(true);
      } else {
        setIsInCart(false);
        setProdQty(1);
      }
    }
  }, [prodView?.id]);

  if (!prodView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for is not available.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-danger text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const discount = prodView.prod_disc || Math.floor(Math.random() * 30) + 20;
  const originalPrice = prodView.prod_price || 0;
  const discountPrice = calculateDiscountPrice(originalPrice, discount);
  const rating = prodView.rating || 4.0 + Math.random() * 0.9;
  const stock = prodView.stock || Math.floor(Math.random() * 50) + 10;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={goBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Products
        </button>

        {/* Alerts */}
        {proderr && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{proderr}</p>
              </div>
            </div>
          </div>
        )}

        {prodsus && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{prodsus}</p>
              </div>
            </div>
          </div>
        )}

        {/* Product Detail Container */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Product Image Section */}
            <div className="lg:w-1/2 p-8">
              <div className="relative">
                <img
                  alt={prodView.prod_name || 'Product image'}
                  className="w-full h-auto rounded-xl shadow-md object-cover"
                  src={prodView.prod_photo || `https://via.placeholder.com/600x600?text=${encodeURIComponent(prodView.prod_name || 'Product')}`}
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/600x600?text=${encodeURIComponent(prodView.prod_name || 'Product')}`;
                  }}
                />
                <div className="absolute top-4 right-4">
                  <span className="px-4 py-2 bg-danger text-white text-sm font-bold rounded-full flex items-center">
                    <Tag className="w-3 h-3 mr-1" />
                    -{discount}% OFF
                  </span>
                </div>
                <div className="absolute top-4 left-4">
                  <span className={`px-4 py-2 text-white text-sm font-bold rounded-full ${
                    stock > 10 ? 'bg-green-500' : stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {stock > 10 ? 'In Stock' : stock > 0 ? `Only ${stock} left` : 'Out of Stock'}
                  </span>
                </div>
              </div>

              {/* Additional Images */}
              <div className="flex mt-6 space-x-4 overflow-x-auto pb-2">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Image {num}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Info Section */}
            <div className="lg:w-1/2 p-8 border-l border-gray-100">
              {/* Product Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    {prodView.category || 'Electronics'}
                  </span>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="text-lg font-bold ml-2">{rating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500 ml-1">({Math.floor(Math.random() * 200) + 50} reviews)</span>
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {prodView.prod_name || 'Product Name'}
                </h1>
                <h2 className="text-xl text-gray-600 mb-4">
                  {prodView.prod_model || 'Product Model'}
                </h2>
              </div>

              {/* Price Section */}
              <div className="mb-8">
                <div className="flex items-center mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatCurrency(discountPrice)}
                  </span>
                  <span className="text-xl text-gray-500 line-through ml-4">
                    {formatCurrency(originalPrice)}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-green-600 font-bold">
                    Save {formatCurrency(originalPrice - discountPrice)} ({discount}% off)
                  </span>
                  <span className="text-sm text-gray-500">
                    Inclusive of all taxes
                  </span>
                </div>
              </div>

              {/* Product Description */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {prodView.prod_desc || 'No description available. This is a premium quality product with excellent features and reliable performance.'}
                </p>
              </div>

              {/* Features */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Features</h3>
                <ul className="space-y-2">
                  {[
                    'Premium quality materials',
                    'Long-lasting durability',
                    'Warranty included',
                    'Easy to use',
                    'Excellent customer support'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quantity Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Quantity</h3>
                <div className="flex items-center">
                  <button
                    onClick={decrementProd}
                    className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-l-lg hover:bg-gray-50"
                    disabled={prodqty <= 1}
                  >
                    <Minus className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="w-20 h-12 flex items-center justify-center border-t border-b border-gray-300">
                    <span className="text-xl font-bold">{prodqty}</span>
                  </div>
                  <button
                    onClick={incrementProd}
                    className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-r-lg hover:bg-gray-50"
                    disabled={prodqty >= stock}
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="ml-4 text-gray-600">
                    {stock} available
                  </span>
                </div>
              </div>

              {/* Vendor Info */}
              {prodView.vendor_name && (
                <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Sold by</h3>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden mr-4">
                      {prodView.vendor_photo ? (
                        <img 
                          src={prodView.vendor_photo} 
                          alt={prodView.vendor_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300">
                          <User className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{prodView.vendor_name}</p>
                      <p className="text-sm text-gray-600">Verified Seller</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 bg-danger text-white py-4 px-6 rounded-lg hover:bg-red-600 transition-colors duration-200 font-bold text-lg flex items-center justify-center"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Buy Now
                  </button>
                  {isInCart ? (
                    <button
                      onClick={handleRemoveFromCart}
                      className="flex-1 border-2 border-danger text-danger py-4 px-6 rounded-lg hover:bg-red-50 transition-colors duration-200 font-bold text-lg"
                    >
                      Remove from Cart
                    </button>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 border-2 border-danger text-danger py-4 px-6 rounded-lg hover:bg-red-50 transition-colors duration-200 font-bold text-lg"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center mb-3">
              <Truck className="w-8 h-8 text-blue-600 mr-3" />
              <h4 className="font-bold text-gray-800">Free Shipping</h4>
            </div>
            <p className="text-sm text-gray-600">Free delivery on orders over ₦10,000</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center mb-3">
              <Shield className="w-8 h-8 text-green-600 mr-3" />
              <h4 className="font-bold text-gray-800">Secure Payment</h4>
            </div>
            <p className="text-sm text-gray-600">100% secure payment processing</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center mb-3">
              <CheckCircle className="w-8 h-8 text-purple-600 mr-3" />
              <h4 className="font-bold text-gray-800">Warranty</h4>
            </div>
            <p className="text-sm text-gray-600">1-year manufacturer warranty</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center mb-3">
              <Star className="w-8 h-8 text-yellow-600 mr-3" />
              <h4 className="font-bold text-gray-800">Customer Support</h4>
            </div>
            <p className="text-sm text-gray-600">24/7 customer service available</p>
          </div>
        </div>

        {/* Customer Reviews */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Customer Reviews</h3>
          <div className="space-y-6">
            {[1, 2, 3].map((review) => (
              <div key={review} className="border-b border-gray-100 pb-6 last:border-0">
                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">2 days ago</span>
                </div>
                <p className="text-gray-700 mb-2">
                  "Excellent product! Very satisfied with the quality and service."
                </p>
                <p className="text-sm text-gray-500">- Customer {review}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Add missing Tag icon component
const Tag: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
  </svg>
);

export default ProdDetailPage;
