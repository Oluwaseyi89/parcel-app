import React, { useEffect, useState } from 'react';
import { UseFetchJSON } from './useFetch';
import { CheckCircle, XCircle, AlertCircle, X, Loader2, Shield, CreditCard } from 'lucide-react';

const VerifyPayment: React.FC = () => {
  const [proderr, setProdErr] = useState<string>('');
  const [prodsus, setProdSus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'verified' | 'failed'>('pending');

  const payRef = localStorage.getItem('payRef') || null;

  useEffect(() => {
    if (payRef) {
      setIsLoading(true);
      const verUrl = `http://localhost:8080/v1/verifypayment/${payRef}`;
      UseFetchJSON(verUrl, 'GET')
        .then((res: any) => {
          if (res === true) {
            setProdSus('Payment successfully verified.');
            setPaymentStatus('verified');
          } else {
            setProdErr('Your payment is yet to be verified, refresh browser to resolve');
            setPaymentStatus('pending');
          }
        })
        .catch((err: any) => {
          console.log(err?.message);
          setProdErr('Unable to verify payment. Please try again later.');
          setPaymentStatus('failed');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setProdErr('No payment reference found. Please initiate a payment first.');
      setIsLoading(false);
      setPaymentStatus('failed');
    }
  }, [payRef]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[rgb(219,33,76)] to-[rgb(255,87,51)] rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Verification</h1>
          <p className="mt-2 text-gray-600">Verifying your payment transaction</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Payment Reference */}
          {payRef && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center mb-2">
                <CreditCard className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Payment Reference</span>
              </div>
              <p className="font-mono text-sm bg-white p-2 rounded border border-gray-300 truncate">
                {payRef}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-[rgb(219,33,76)] animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Verifying Payment</h3>
              <p className="text-gray-600">Please wait while we confirm your payment status...</p>
            </div>
          ) : (
            <>
              {/* Success Message */}
              {prodsus && paymentStatus === 'verified' && (
                <div className="mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-green-800 mb-2">Payment Verified!</h3>
                    <p className="text-green-700 mb-4">Your payment has been successfully verified.</p>
                    <div className="bg-green-100 text-green-800 text-sm px-4 py-2 rounded-lg inline-block">
                      <span className="font-semibold">Status:</span> Payment Confirmed
                    </div>
                  </div>
                </div>
              )}

              {/* Error Messages */}
              {proderr && paymentStatus === 'failed' && (
                <div className="mb-6">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-800 mb-2">Verification Failed</h3>
                    <p className="text-red-700 mb-4">{proderr}</p>
                    <div className="bg-red-100 text-red-800 text-sm px-4 py-2 rounded-lg inline-block">
                      <span className="font-semibold">Status:</span> Verification Error
                    </div>
                  </div>
                </div>
              )}

              {proderr && paymentStatus === 'pending' && (
                <div className="mb-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-yellow-800 mb-2">Payment Pending</h3>
                    <p className="text-yellow-700 mb-4">{proderr}</p>
                    <div className="bg-yellow-100 text-yellow-800 text-sm px-4 py-2 rounded-lg inline-block">
                      <span className="font-semibold">Status:</span> Awaiting Confirmation
                    </div>
                  </div>
                </div>
              )}

              {/* No Payment Reference */}
              {!payRef && !isLoading && (
                <div className="mb-6">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-800 mb-2">No Payment Found</h3>
                    <p className="text-red-700 mb-4">Please initiate a payment first before verification.</p>
                    <div className="bg-red-100 text-red-800 text-sm px-4 py-2 rounded-lg inline-block">
                      <span className="font-semibold">Status:</span> No Payment Reference
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4">
                {paymentStatus === 'pending' && (
                  <button
                    onClick={handleRefresh}
                    className="w-full py-3 px-6 bg-[rgb(219,33,76)] text-white rounded-lg font-medium hover:bg-[rgb(200,30,70)] hover:shadow-lg transition-all flex items-center justify-center"
                  >
                    Refresh Verification
                  </button>
                )}

                {paymentStatus === 'verified' && (
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full py-3 px-6 bg-[rgb(219,33,76)] text-white rounded-lg font-medium hover:bg-[rgb(200,30,70)] hover:shadow-lg transition-all flex items-center justify-center"
                  >
                    Return to Homepage
                  </button>
                )}

                {(paymentStatus === 'failed' || !payRef) && (
                  <button
                    onClick={() => window.location.href = '/cart'}
                    className="w-full py-3 px-6 bg-[rgb(219,33,76)] text-white rounded-lg font-medium hover:bg-[rgb(200,30,70)] hover:shadow-lg transition-all flex items-center justify-center"
                  >
                    Go to Cart
                  </button>
                )}

                <button
                  onClick={() => window.location.href = '/orders'}
                  className="w-full py-3 px-6 border border-[rgb(219,33,76)] text-[rgb(219,33,76)] rounded-lg font-medium hover:bg-[rgb(219,33,76)] hover:text-white transition-all"
                >
                  View My Orders
                </button>
              </div>
            </>
          )}

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Need help with your payment?</p>
              <div className="space-y-2 text-sm">
                <a 
                  href="mailto:support@example.com" 
                  className="text-[rgb(219,33,76)] hover:text-[rgb(200,30,70)] font-medium"
                >
                  Contact Support
                </a>
                <span className="text-gray-400 mx-2">•</span>
                <a 
                  href="/faq" 
                  className="text-[rgb(219,33,76)] hover:text-[rgb(200,30,70)] font-medium"
                >
                  View FAQ
                </a>
                <span className="text-gray-400 mx-2">•</span>
                <a 
                  href="/payment-terms" 
                  className="text-[rgb(219,33,76)] hover:text-[rgb(200,30,70)] font-medium"
                >
                  Payment Terms
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">Secure Payment Verification</p>
              <p className="text-xs text-blue-700">
                Your payment is processed through secure channels. All transactions are encrypted and protected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPayment;
