import React, { useEffect, useState } from 'react';
import { UseFetchJSON } from './useFetch';
import { X, AlertCircle, CheckCircle, CreditCard, Building, Truck, Loader2 } from 'lucide-react';

const Payment: React.FC = () => {
  const [showProvider, setShowProvider] = useState(false);
  const [showTxnRef, setShowTxnRef] = useState(false);
  const [showShipTxnRef, setShowShipTxnRef] = useState(false);
  const [showPayDeliv, setShowPayDeliv] = useState(false);
  const [showShipProv, setShowShipProv] = useState(false);
  const [customerId, setCustomerId] = useState<number | null>(0);
  const [isCustomer, setIsCustomer] = useState(false);
  const [proderr, setProdErr] = useState<string>('');
  const [prodsus, setProdSus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const curOrder = JSON.parse(localStorage.getItem('curOrder') || 'null') || null;

  const [payment, setPayment] = useState<any>({
    shipping_fee: '',
    amount: '',
    grand_total_amount: '',
    payment_type: '',
    shipping_pay_type: '',
    provider: '',
    shipping_provider: '',
    txn_ref: '',
    shipping_txn_ref: '',
  });

  const { shipping_fee, shipping_provider, shipping_pay_type, amount, txn_ref, shipping_txn_ref, grand_total_amount, payment_type, provider } = payment;

  const handlePaymentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const name = (e.target as HTMLInputElement).name;
    const value = (e.target as HTMLInputElement).value;
    setPayment({ ...payment, [name]: value });
  };

  const handlePayClick = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const payUrl = 'http://localhost:8080/v1/initializetransaction';
    const amountToSend = (grand_total_amount as number) * 100;
    let email = '';
    const anonCusUrl = `http://localhost:7000/parcel_customer/get_anon_customer/${customerId}/`;
    const cusUrl = `http://localhost:7000/parcel_customer/get_customer/${customerId}/`;

    if (isCustomer) {
      UseFetchJSON(cusUrl, 'GET').then((res: any) => {
        if (res.status === 'success') {
          email = res.data.email;
          const payData = { email, amount: amountToSend, callback_url: 'http://localhost:3000/verify' };

          UseFetchJSON(payUrl, 'POST', payData).finally(() => setProdSus('Processing your payment...'))
            .then(async (res2: any) => {
              const auth_url = res2.data.authorization_url;
              const reference = res2.data.reference;
              localStorage.setItem('payRef', reference);
              const updateData = { shipping_fee, grand_total_amount, reference, updated_at: new Date().toISOString() };
              const updateUrl = `http://localhost:7000/parcel_order/payment_update/${curOrder}/`;
              UseFetchJSON(updateUrl, 'PATCH', updateData).then((mess: any) => {
                if (mess.status === 'success') {
                  // redirect
                  (window as any).location = auth_url;
                } else {
                  setProdErr('Error occurred, order might have expired');
                  setIsProcessing(false);
                }
              });
            })
            .catch(() => {
              setProdSus('');
              setProdErr('Unable to connect with payment API');
              setIsProcessing(false);
            });
        }
      });
    } else {
      UseFetchJSON(anonCusUrl, 'GET').then((res: any) => {
        if (res.status === 'success') {
          email = res.data.email;
          const payData = { email, amount: amountToSend, callback_url: 'http://localhost:3000/verify' };

          UseFetchJSON(payUrl, 'POST', payData).finally(() => setProdSus('Processing your payment...'))
            .then(async (res2: any) => {
              const auth_url = res2.data.authorization_url;
              const reference = res2.data.reference;
              localStorage.setItem('payRef', reference);
              const updateData = { shipping_fee, grand_total_amount, reference, updated_at: new Date().toISOString() };
              const updateUrl = `http://localhost:7000/parcel_order/payment_update/${curOrder}/`;
              UseFetchJSON(updateUrl, 'PATCH', updateData).then((mess: any) => {
                if (mess.status === 'success') {
                  (window as any).location = auth_url;
                } else {
                  setProdErr('Error occurred, order might have expired');
                  setIsProcessing(false);
                }
              });
            })
            .catch(() => {
              setProdSus('');
              setProdErr('Unable to connect with payment API');
              setIsProcessing(false);
            });
        }
      });
    }
  };

  useEffect(() => {
    if (payment_type === 'Card Payment') setShowProvider(true);
    else setShowProvider(false);

    if (payment_type === 'Bank Transfer') setShowTxnRef(true);
    else setShowTxnRef(false);

    if (payment_type === 'Bank Transfer On Delivery') setShowPayDeliv(true);
    else setShowPayDeliv(false);
  }, [payment_type]);

  useEffect(() => {
    if (shipping_pay_type === 'Card Payment for Shipping') setShowShipProv(true);
    else setShowShipProv(false);

    if (shipping_pay_type === 'Bank Transfer for Shipping') setShowShipTxnRef(true);
    else setShowShipTxnRef(false);
  }, [shipping_pay_type]);

  useEffect(() => {
    if (curOrder) {
      const payUrl = `http://localhost:7000/parcel_order/get_order_id/${curOrder}`;
      UseFetchJSON(payUrl, 'GET').then((res: any) => {
        if (res.status === 'success') {
          setPayment({ ...payment, shipping_fee: res.data.shipping_fee, amount: res.data.total_price, grand_total_amount: (res.data.shipping_fee + res.data.total_price) });
          setCustomerId(res.data.customer_id);
          setIsCustomer(res.data.is_customer);
        }
      }).catch(() => {});
    }
  }, [curOrder]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[rgb(219,33,76)]">Complete Your Payment</h1>
          <p className="text-gray-600 mt-2">Review your order summary and choose a payment method</p>
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

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-2 h-6 bg-[rgb(219,33,76)] rounded-full mr-3"></div>
            Order Summary
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-800">₦{amount ? Number(amount).toLocaleString() : '0.00'}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Shipping Fee</span>
              <span className="font-semibold text-gray-800">₦{shipping_fee ? Number(shipping_fee).toLocaleString() : '0.00'}</span>
            </div>
            
            <div className="flex justify-between items-center py-3">
              <span className="text-lg font-bold text-gray-800">Grand Total</span>
              <span className="text-2xl font-bold text-[rgb(219,33,76)]">
                ₦{grand_total_amount ? Number(grand_total_amount).toLocaleString() : '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-2 h-6 bg-[rgb(219,33,76)] rounded-full mr-3"></div>
            Select Payment Method
          </h2>

          <form className="space-y-6">
            {/* Payment Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Type <span className="text-red-500">*</span>
              </label>
              <select
                name="payment_type"
                value={payment_type}
                onChange={handlePaymentFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent appearance-none bg-white"
              >
                <option value="">Select Payment Type</option>
                <option value="Card Payment">Card Payment</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Bank Transfer On Delivery">Bank Transfer On Delivery</option>
              </select>
            </div>

            {/* Card Payment Section */}
            {showProvider && (
              <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                <div className="flex items-center mb-4">
                  <CreditCard className="w-5 h-5 text-[rgb(219,33,76)] mr-2" />
                  <h3 className="font-semibold text-gray-800">Card Payment Details</h3>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Provider <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="provider"
                    onChange={handlePaymentFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Select Provider</option>
                    <option value="Master Card">Master Card</option>
                    <option value="Verve Card">Verve Card</option>
                    <option value="Visa Card">Visa Card</option>
                  </select>
                </div>

                <button
                  type="submit"
                  onClick={handlePayClick}
                  disabled={isProcessing || !provider}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center ${
                    isProcessing || !provider
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[rgb(219,33,76)] text-white hover:bg-[rgb(200,30,70)] hover:shadow-lg'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Proceed to Payment'
                  )}
                </button>
              </div>
            )}

            {/* Bank Transfer Section */}
            {showTxnRef && (
              <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                <div className="flex items-center mb-4">
                  <Building className="w-5 h-5 text-[rgb(219,33,76)] mr-2" />
                  <h3 className="font-semibold text-gray-800">Bank Transfer Details</h3>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Account Number</p>
                    <p className="font-mono text-lg font-bold text-gray-800">3xxxxxxxx9</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Bank Name</p>
                    <p className="text-lg font-semibold text-gray-800">First Bank</p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Reference <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="txn_ref"
                    value={txn_ref}
                    onChange={handlePaymentFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent"
                    placeholder="Enter transaction reference from your bank transfer"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Please enter the reference number provided by your bank after the transfer
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-[rgb(219,33,76)] text-white rounded-lg font-medium hover:bg-[rgb(200,30,70)] hover:shadow-lg transition-all"
                >
                  Submit Payment Confirmation
                </button>
              </div>
            )}

            {/* Bank Transfer On Delivery Section */}
            {showPayDeliv && (
              <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                <div className="flex items-center mb-4">
                  <Truck className="w-5 h-5 text-[rgb(219,33,76)] mr-2" />
                  <h3 className="font-semibold text-gray-800">Payment On Delivery</h3>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    Pay for shipping fee now and complete the main payment on delivery
                  </p>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shipping Fee Payment Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="shipping_pay_type"
                      value={shipping_pay_type}
                      onChange={handlePaymentFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Select Payment Type for Shipping Fee</option>
                      <option value="Card Payment for Shipping">Card Payment for Shipping</option>
                      <option value="Bank Transfer for Shipping">Bank Transfer for Shipping</option>
                    </select>
                  </div>

                  {/* Shipping Card Payment */}
                  {showShipProv && (
                    <div className="border border-gray-200 rounded-xl p-4 bg-white mb-6">
                      <div className="flex items-center mb-4">
                        <CreditCard className="w-5 h-5 text-[rgb(219,33,76)] mr-2" />
                        <h4 className="font-medium text-gray-800">Card Payment for Shipping</h4>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Card Provider <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="shipping_provider"
                          value={shipping_provider}
                          onChange={handlePaymentFormChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent appearance-none bg-white"
                        >
                          <option value="">Select Provider</option>
                          <option value="Master Card">Master Card</option>
                          <option value="Verve Card">Verve Card</option>
                          <option value="Visa Card">Visa Card</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Shipping Bank Transfer */}
                  {showShipTxnRef && (
                    <div className="border border-gray-200 rounded-xl p-4 bg-white mb-6">
                      <div className="flex items-center mb-4">
                        <Building className="w-5 h-5 text-[rgb(219,33,76)] mr-2" />
                        <h4 className="font-medium text-gray-800">Bank Transfer for Shipping</h4>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">Account Number</p>
                          <p className="font-mono text-lg font-bold text-gray-800">3073566093</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">Bank Name</p>
                          <p className="text-lg font-semibold text-gray-800">First Bank</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Transaction Reference <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="shipping_txn_ref"
                          value={shipping_txn_ref}
                          onChange={handlePaymentFormChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent"
                          placeholder="Enter transaction reference"
                        />
                      </div>
                    </div>
                  )}

                  {shipping_pay_type && (
                    <button
                      type="submit"
                      className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                        (showShipProv && !shipping_provider) || (showShipTxnRef && !shipping_txn_ref)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-[rgb(219,33,76)] text-white hover:bg-[rgb(200,30,70)] hover:shadow-lg'
                      }`}
                      disabled={(showShipProv && !shipping_provider) || (showShipTxnRef && !shipping_txn_ref)}
                    >
                      Submit Shipping Payment
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>

          {/* Payment Info Note */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Secure Payment Information</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• All payments are processed through secure channels</li>
                <li>• Your financial information is encrypted and protected</li>
                <li>• You will receive payment confirmation via email</li>
                <li>• For assistance, contact support@example.com</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
