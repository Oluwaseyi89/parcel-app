import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UseFetchJSON } from './useFetch';
import { savecart } from './savecart';
import { saveorder } from './saveorder';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { X, AlertCircle, CheckCircle, Trash2, ShoppingCart } from 'lucide-react';

type CartItem = {
  id: number;
  prod_price: number;
  purchased_qty: number;
  prod_photo?: string;
  prod_name?: string;
  prod_model?: string;
};

type Customer = {
  id?: number;
  first_name?: string;
  last_name?: string;
  street?: string;
  state?: string;
  country?: string;
  email?: string;
  phone_no?: string;
};

const CartCheckOut: React.FC = () => {
  const navigate = useNavigate();
  const cart: CartItem[] = useCartStore((state: any) => state.cart);
  const cartTotal = useCartStore((state: any) => state.cartTotal);
  const customer: Customer | null = useAuthStore((state: any) => state.customer);

  const [totPrice, setTotPrice] = useState<number | undefined>(undefined);
  const [proderr, setProdErr] = useState<string>('');
  const [prodsus, setProdSus] = useState<string>('');
  const [showCartAlrt, setShowCartAlrt] = useState(false);
  const [showCartAlrtSwitch, setShowCartAlrtSwitch] = useState(true);

  const [cartUser, setCartUser] = useState({
    first_name: '',
    last_name: '',
    country: '',
    state: '',
    shipping_method: '',
    street: '',
    phone_no: '',
    email: '',
    zip_code: '',
    reg_date: new Date().toISOString(),
  });

  const { first_name, last_name, country, state, shipping_method, zip_code, street, phone_no, email, reg_date } = cartUser;

  const customer_name = last_name + ' ' + first_name;

  const handleCartFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.preventDefault?.();
    const name = (e.target as HTMLInputElement).name;
    const value = (e.target as HTMLInputElement).value;
    setCartUser({ ...cartUser, [name]: value });
  };

  const handleSaveCartClick = (e: React.FormEvent) => {
    e.preventDefault();
    savecart(first_name, last_name, country, state, shipping_method, zip_code, street, phone_no, email, reg_date, customer, cartTotal, totPrice, cart, customer_name, setProdSus, setProdErr);
  };

  const handleSaveOrderClick = (e: React.FormEvent) => {
    e.preventDefault();
    saveorder(first_name, last_name, country, state, shipping_method, zip_code, street, phone_no, email, reg_date, customer, cartTotal, totPrice, cart, customer_name, setProdSus, setProdErr, navigate);
  };

  useEffect(() => {
    if (showCartAlrtSwitch && cart && cart.length > 0) {
      const cust_name = customer ? customer.last_name + ' ' + customer.first_name : (last_name + ' ' + first_name);
      const apiUrl = `http://localhost:7000/parcel_customer/get_cart/${cust_name}/`;
      UseFetchJSON(apiUrl, 'GET').then((res: any) => {
        if (res.status === 'success') {
          setShowCartAlrt(true);
          localStorage.setItem('retrCart', JSON.stringify(res.data));
        }
      }).catch(() => {});
    }
  }, [customer, first_name, last_name, showCartAlrtSwitch, cart?.length]);

  const getTotalPrice = () => {
    if (cart && cart.length > 0) {
      const g_tot = cart.reduce((total, item) => total + (item.prod_price * item.purchased_qty), 0);
      setTotPrice(g_tot);
    }
  };

  useEffect(() => {
    getTotalPrice();
  }, [cart]);

  const handleRemoveItem = (itemId: number) => {
    const updatedCart = cart.filter((item) => item.id !== itemId);
    localStorage.setItem('parcelCart', JSON.stringify(updatedCart));
    window.location.reload();
  };

  const handleChangeQty = (itemId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value || '0', 10);
    const updatedCart = cart.map((item) => {
      if (item.id === itemId) {
        return { ...item, purchased_qty: value };
      }
      return item;
    });
    localStorage.setItem('parcelCart', JSON.stringify(updatedCart));
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[rgb(219,33,76)]">Cart Details</h1>
          <div className="mt-2 flex items-center justify-center text-gray-600">
            <ShoppingCart className="w-5 h-5 mr-2" />
            <p>Review your items and complete your purchase</p>
          </div>
        </div>

        {/* Saved Cart Alert */}
        {showCartAlrt && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="flex items-center mb-3 sm:mb-0">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800 font-medium">You have a saved cart. What do you wish to do with it?</p>
              </div>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium">
                  Retrieve
                </button>
                <button className="px-4 py-2 border border-yellow-600 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors text-sm font-medium">
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Alerts */}
        {proderr && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800 font-medium">{proderr}</p>
              </div>
              <button 
                onClick={() => setProdErr('')}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {prodsus && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-green-800 font-medium">{prodsus}</p>
              </div>
              <button 
                onClick={() => setProdSus('')}
                className="text-green-600 hover:text-green-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-2 h-6 bg-[rgb(219,33,76)] rounded-full mr-3"></div>
              <h2 className="text-xl font-bold text-gray-800">Order Summary</h2>
            </div>

            {cart && cart.length > 0 ? (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.prod_photo}
                          alt={item.prod_name}
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-grow">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-800 text-lg">{item.prod_name}</h3>
                            <p className="text-gray-600 text-sm">{item.prod_model}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="mt-2 sm:mt-0 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center text-sm"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Price</p>
                            <p className="font-semibold text-gray-800">₦{item.prod_price.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Quantity</p>
                            <input
                              type="number"
                              value={item.purchased_qty}
                              onChange={(e) => handleChangeQty(item.id, e)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent"
                              min="1"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Total</p>
                            <p className="font-semibold text-gray-800">
                              ₦{(item.prod_price * item.purchased_qty).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Grand Total */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-700">Grand Total</span>
                    <span className="text-2xl font-bold text-[rgb(219,33,76)]">
                      ₦{(totPrice || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-6">Add some items to your cart to proceed</p>
                <button
                  onClick={() => navigate('/products')}
                  className="px-6 py-3 bg-[rgb(219,33,76)] text-white rounded-lg hover:bg-[rgb(200,30,70)] transition-colors font-medium"
                >
                  Browse Products
                </button>
              </div>
            )}
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-2 h-6 bg-[rgb(219,33,76)] rounded-full mr-3"></div>
              <h2 className="text-xl font-bold text-gray-800">Shipping Information</h2>
            </div>

            <form className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-4 text-lg">Personal Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={customer ? customer.first_name : first_name}
                      onChange={handleCartFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent transition-all"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={customer ? customer.last_name : last_name}
                      onChange={handleCartFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent transition-all"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Method
                </label>
                <select
                  name="shipping_method"
                  value={shipping_method}
                  onChange={handleCartFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Select shipping method</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Pick up">Pick up</option>
                </select>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-4 text-lg">Address Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="street"
                      value={customer ? customer.street : street}
                      onChange={handleCartFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent transition-all"
                      placeholder="Enter street address"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={customer ? customer.state : state}
                        onChange={handleCartFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent transition-all"
                        placeholder="Enter state"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={customer ? customer.country : country}
                        onChange={handleCartFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent transition-all"
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zip/Postal Code
                    </label>
                    <input
                      type="text"
                      name="zip_code"
                      value={zip_code}
                      onChange={handleCartFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent transition-all"
                      placeholder="Enter zip code"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-4 text-lg">Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={customer ? customer.email : email}
                      onChange={handleCartFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent transition-all"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone_no"
                      value={customer ? customer.phone_no : phone_no}
                      onChange={handleCartFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent transition-all"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <button
                  onClick={handleSaveOrderClick}
                  disabled={cart.length === 0}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                    cart.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[rgb(219,33,76)] text-white hover:bg-[rgb(200,30,70)] hover:shadow-lg'
                  }`}
                >
                  Proceed to Payment
                </button>
                <button
                  onClick={handleSaveCartClick}
                  disabled={cart.length === 0}
                  className={`w-full py-3 px-6 border rounded-lg font-medium transition-all ${
                    cart.length === 0
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'border-[rgb(219,33,76)] text-[rgb(219,33,76)] hover:bg-[rgb(219,33,76)] hover:text-white'
                  }`}
                >
                  Save Cart for Later
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartCheckOut;
