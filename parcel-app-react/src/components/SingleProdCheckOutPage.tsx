import React, { useEffect, useState } from 'react';
import { savesingleorder } from './savesingleorder';
import { useNavigate } from 'react-router-dom';
import { X, AlertCircle, CheckCircle, ShoppingBag, Package, User, MapPin, Phone, Mail } from 'lucide-react';

type BuySingle = {
  prod_price: number;
  purchased_qty: number;
  prod_photo?: string;
  prod_name?: string;
  prod_model?: string;
  id?: number;
};

type LogCus = {
  first_name?: string;
  last_name?: string;
  street?: string;
  state?: string;
  country?: string;
  email?: string;
  phone_no?: string;
  id?: number;
};

const SingleProdCheckOutPage: React.FC = () => {
  const rawBuy = localStorage.getItem('buySingle');
  const buySingle: BuySingle | null = rawBuy ? JSON.parse(rawBuy) : null;

  const navigate = useNavigate();

  const refresh = () => {
    window.location.reload();
  };

  const cartItems = JSON.parse(localStorage.getItem('parcelCart') || 'null') || null;
  const logcus: LogCus | null = JSON.parse(localStorage.getItem('logcus') || 'null') || null;

  const [totPrice, setTotPrice] = useState<number | undefined>(undefined);
  const [proderr, setProdErr] = useState<string>('');
  const [prodsus, setProdSus] = useState<string>('');

  useEffect(() => {
    if (buySingle) {
      const t_price = buySingle.prod_price * buySingle.purchased_qty;
      setTotPrice(t_price);
    }
  }, [buySingle]);

  const cartTot = buySingle ? buySingle.purchased_qty : 0;

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

  const customer_name = `${last_name} ${first_name}`;

  const handleCartFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.preventDefault?.();
    const name = (e.target as HTMLInputElement).name;
    const value = (e.target as HTMLInputElement).value;
    setCartUser((s) => ({ ...s, [name]: value }));
  };

  const handleSingleOrderClick = (e: React.FormEvent) => {
    e.preventDefault();
    savesingleorder(
      first_name,
      last_name,
      country,
      state,
      shipping_method,
      zip_code,
      street,
      phone_no,
      email,
      reg_date,
      logcus,
      cartTot,
      totPrice,
      buySingle,
      customer_name,
      setProdSus,
      setProdErr,
      navigate
    );
  };

  const handleChangeQty = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (buySingle) {
      const value = e.target.value;
      const newCartVal = { ...buySingle, purchased_qty: parseInt(value || '0', 10) } as BuySingle;
      localStorage.setItem('buySingle', JSON.stringify(newCartVal));
      refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[rgb(219,33,76)]">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your purchase for a single product</p>
        </div>

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

            {buySingle ? (
              <div className="space-y-6">
                {/* Product Details */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={buySingle.prod_photo}
                        alt={buySingle.prod_name}
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-grow">
                      <h3 className="font-semibold text-gray-800 text-lg mb-1">{buySingle.prod_name}</h3>
                      <p className="text-gray-600 text-sm mb-3">{buySingle.prod_model}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Price</p>
                          <p className="font-semibold text-gray-800">₦{buySingle.prod_price.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Quantity</p>
                          <input
                            type="number"
                            value={buySingle.purchased_qty}
                            onChange={handleChangeQty}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Total */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Item Total</span>
                      <span className="font-semibold text-gray-800">
                        ₦{(buySingle.prod_price * buySingle.purchased_qty).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Shipping Fee</span>
                      <span className="font-semibold text-gray-800">₦0.00</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <span className="text-lg font-bold text-gray-800">Grand Total</span>
                      <span className="text-2xl font-bold text-[rgb(219,33,76)]">
                        ₦{(buySingle.prod_price * buySingle.purchased_qty).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Product Selected</h3>
                <p className="text-gray-600 mb-6">Please select a product to proceed with checkout</p>
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
                <div className="flex items-center mb-4">
                  <User className="w-5 h-5 text-gray-500 mr-2" />
                  <h3 className="font-semibold text-gray-700 text-lg">Personal Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={logcus?.first_name ?? first_name}
                      onChange={handleCartFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent transition-all"
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={logcus?.last_name ?? last_name}
                      onChange={handleCartFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent transition-all"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div>
                <div className="flex items-center mb-4">
                  <Package className="w-5 h-5 text-gray-500 mr-2" />
                  <h3 className="font-semibold text-gray-700 text-lg">Delivery Method</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="shipping_method"
                    value={shipping_method}
                    onChange={handleCartFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent appearance-none bg-white"
                    required
                  >
                    <option value="">Select shipping method</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Pick up">Pick up</option>
                  </select>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <div className="flex items-center mb-4">
                  <MapPin className="w-5 h-5 text-gray-500 mr-2" />
                  <h3 className="font-semibold text-gray-700 text-lg">Address Details</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="street"
                      value={logcus?.street ?? street}
                      onChange={handleCartFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent transition-all"
                      placeholder="Enter street address"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={logcus?.state ?? state}
                        onChange={handleCartFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent transition-all"
                        placeholder="Enter state"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={logcus?.country ?? country}
                        onChange={handleCartFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent transition-all"
                        placeholder="Enter country"
                        required
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
                <div className="flex items-center mb-4">
                  <h3 className="font-semibold text-gray-700 text-lg">Contact Information</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center mb-1">
                      <Mail className="w-4 h-4 text-gray-500 mr-2" />
                      <label className="text-sm font-medium text-gray-700">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={logcus?.email ?? email}
                      onChange={handleCartFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent transition-all"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      <Phone className="w-4 h-4 text-gray-500 mr-2" />
                      <label className="text-sm font-medium text-gray-700">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                    </div>
                    <input
                      type="tel"
                      name="phone_no"
                      value={logcus?.phone_no ?? phone_no}
                      onChange={handleCartFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent transition-all"
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleSingleOrderClick}
                  disabled={!buySingle}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                    !buySingle
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[rgb(219,33,76)] text-white hover:bg-[rgb(200,30,70)] hover:shadow-lg'
                  }`}
                >
                  Proceed to Payment
                </button>
                <p className="text-sm text-gray-500 text-center mt-3">
                  By proceeding, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Secure Payment Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row items-center">
            <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-blue-800 text-lg mb-2">Secure Checkout Process</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-blue-700">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                  <span>256-bit SSL encryption</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                  <span>Secure payment processing</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                  <span>Data privacy protection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleProdCheckOutPage;























// import React, { useEffect, useState } from 'react';
// import { savesingleorder } from './savesingleorder';
// import { useNavigate } from 'react-router-dom';

// type BuySingle = {
//   prod_price: number;
//   purchased_qty: number;
//   prod_photo?: string;
//   prod_name?: string;
//   prod_model?: string;
//   id?: number;
// };



// type LogCus = {
//   first_name?: string;
//   last_name?: string;
//   street?: string;
//   state?: string;
//   country?: string;
//   email?: string;
//   phone_no?: string;
//   id?: number;
// };

// const SingleProdCheckOutPage: React.FC = () => {
//   const rawBuy = localStorage.getItem('buySingle');
//   const buySingle: BuySingle | null = rawBuy ? JSON.parse(rawBuy) : null;

//   const navigate = useNavigate();

//   const refresh = () => {
//     window.location.reload();
//   };

//   const cartItems = JSON.parse(localStorage.getItem('parcelCart') || 'null') || null;
//   const logcus: LogCus | null = JSON.parse(localStorage.getItem('logcus') || 'null') || null;

//   const [totPrice, setTotPrice] = useState<number | undefined>(undefined);
//   const [proderr, setProdErr] = useState<string>('');
//   const [prodsus, setProdSus] = useState<string>('');

//   useEffect(() => {
//     if (buySingle) {
//       const t_price = buySingle.prod_price * buySingle.purchased_qty;
//       setTotPrice(t_price);
//     }
//   }, [buySingle]);

//   const cartTot = buySingle ? buySingle.purchased_qty : 0;

//   const [cartUser, setCartUser] = useState({
//     first_name: '',
//     last_name: '',
//     country: '',
//     state: '',
//     shipping_method: '',
//     street: '',
//     phone_no: '',
//     email: '',
//     zip_code: '',
//     reg_date: new Date().toISOString(),
//   });

//   const { first_name, last_name, country, state, shipping_method, zip_code, street, phone_no, email, reg_date } = cartUser;

//   const customer_name = `${last_name} ${first_name}`;

//   const handleCartFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     e.preventDefault?.();
//     const name = (e.target as HTMLInputElement).name;
//     const value = (e.target as HTMLInputElement).value;
//     setCartUser((s) => ({ ...s, [name]: value }));
//   };

//   const handleSingleOrderClick = (e: React.FormEvent) => {
//     e.preventDefault();
//     savesingleorder(
//       first_name,
//       last_name,
//       country,
//       state,
//       shipping_method,
//       zip_code,
//       street,
//       phone_no,
//       email,
//       reg_date,
//       logcus,
//       cartTot,
//       totPrice,
//       buySingle,
//       customer_name,
//       setProdSus,
//       setProdErr,
//       navigate
//     );
//   };

//   const handleChangeQty = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (buySingle) {
//       const value = e.target.value;
//       const newCartVal = { ...buySingle, purchased_qty: parseInt(value || '0', 10) } as BuySingle;
//       localStorage.setItem('buySingle', JSON.stringify(newCartVal));
//       refresh();
//     }
//   };

//   return (
//     <div className="Vendor-Frag">
//       {proderr ? (
//         <div id="apiAlert" style={{ height: '50px', textAlign: 'center' }} className="alert alert-danger alert-dismissible" role="alert">
//           {proderr}
//           <button className="close" role="alert" data-dismiss="alert">
//             <span>&times;</span>
//           </button>
//         </div>
//       ) : (
//         ''
//       )}
//       {prodsus ? (
//         <div style={{ height: '50px', textAlign: 'center' }} className="alert alert-success alert-dismissible" role="alert">
//           {prodsus}
//           <button className="close" role="alert" data-dismiss="alert">
//             <span>&times;</span>
//           </button>
//         </div>
//       ) : (
//         ''
//       )}

//       <div className="single-check-con">
//         <div className="shipping-info">
//           <p id="shipping-head" className="badge order-frag-head">
//             Shipping Info
//           </p>
//           <form className="form container">
//             <div className="form-group">
//               <input type="text" name="first_name" value={logcus?.first_name ?? first_name} onChange={handleCartFormChange} className="form-control check-input" placeholder="First Name" />
//             </div>
//             <div className="form-group">
//               <input type="text" name="last_name" value={logcus?.last_name ?? last_name} onChange={handleCartFormChange} className="form-control check-input" placeholder="Last Name" />
//             </div>
//             <div className="form-group">
//               <select className="form-control check-input" name="shipping_method" value={shipping_method} onChange={handleCartFormChange}>
//                 <option>Shipping_Method</option>
//                 <option>Delivery</option>
//                 <option>Pick up</option>
//               </select>
//             </div>
//             <div className="form-group">
//               <input type="text" name="street" value={logcus?.street ?? street} onChange={handleCartFormChange} className="form-control check-input" placeholder="Street" />
//             </div>
//             <div className="form-group">
//               <input type="text" name="state" value={logcus?.state ?? state} onChange={handleCartFormChange} className="form-control check-input" placeholder="State" />
//             </div>
//             <div className="form-group">
//               <input type="text" name="country" value={logcus?.country ?? country} onChange={handleCartFormChange} className="form-control check-input" placeholder="Country" />
//             </div>
//             <div className="form-group">
//               <input type="text" name="zip_code" value={zip_code} onChange={handleCartFormChange} className="form-control check-input" placeholder="Zip Code" />
//             </div>
//             <p style={{ marginLeft: '10px' }} className="badge order-frag-head">
//               Contact Info
//             </p>
//             <div className="form-group">
//               <input type="text" name="email" value={logcus?.email ?? email} onChange={handleCartFormChange} className="form-control check-input" placeholder="E-mail Address" />
//             </div>
//             <div className="form-group">
//               <input type="text" name="phone_no" value={logcus?.phone_no ?? phone_no} onChange={handleCartFormChange} className="form-control check-input" placeholder="Phone Number" />
//             </div>
//             <div className="check-btn-fin">
//               <button onClick={handleSingleOrderClick} className="btn">
//                 Proceed to Payment
//               </button>
//             </div>
//           </form>
//         </div>
//         <div className="order-summary">
//           <p className="badge order-frag-head">Order Summary</p>

//           <div className="order-frag">
//             <img alt="cart-avatar" src={buySingle?.prod_photo} className="img-thumbnail" />
//             <div className="order-frag-panel">
//               <p className="badge">{buySingle?.prod_name}</p>
//               <p className="badge">{buySingle?.prod_model}</p>
//               <p className="badge">₦ {buySingle?.prod_price}</p>
//               <label className="badge">
//                 Qty:{' '}
//                 <input style={{ textAlign: 'center' }} onChange={handleChangeQty} id="cart-item-qty" type="number" name="cart-item-qty" value={buySingle?.purchased_qty ?? 0} />
//               </label>
//               <p className="badge">Tot: ₦ {buySingle ? buySingle.prod_price * buySingle.purchased_qty : 0}</p>

//             </div>
//             <hr />
//           </div>
//           <p style={{ fontSize: '1.2em' }} className="badge">
//             G.Total: ₦ {totPrice}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SingleProdCheckOutPage;
