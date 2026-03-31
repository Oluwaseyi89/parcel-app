import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UseFetchJSON } from './useFetch';
import { AlertCircle, CheckCircle, Mail, Lock, UserPlus } from 'lucide-react';

const Vendor: React.FC = () => {
  const [vendcred, setVendCred] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const [logalert, setLogAlert] = useState<string | undefined>(undefined);
  const [logsus, setLogSus] = useState<string | undefined>(undefined);
  const [logvend, setLogVend] = useState<any>({ first_name: '' });
  const [showreset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const { email, password } = vendcred;

  const handleVendCredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = e.target.value;
    setVendCred({ ...vendcred, [name]: value });
    setShowReset(false);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { email: resetEmail };
    const apiURL = 'http://localhost:7000/parcel_backends/vendor_resetter/';
    if (resetEmail === '') {
      setLogAlert('Enter your email for resetting the password');
    } else if (resetEmail !== email) {
      setLogAlert('Wrong Email Entered');
    } else {
      UseFetchJSON(apiURL, 'POST', data)
        .then((res: any) => {
          if (res.status === 'success') setLogSus(res.data);
          else if (res.status === 'error') setLogAlert(res.data);
          else setLogAlert('An error occured!');
        })
        .catch((err: any) => console.log(err));
    }
  };

  const handleVendCredLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLogAlert(undefined);
    if (email && password) {
      const apiURL = 'http://localhost:7000/parcel_backends/vendor_login/';
      UseFetchJSON(apiURL, 'POST', vendcred)
        .then((res: any) => {
          if (res.data?.email === email) {
            setLogVend(res.data);
            if (res.data?.first_name) {
              localStorage.setItem('logvend', JSON.stringify(res.data));
              navigate('/vendor-dash');
            }
          } else {
            if (res.status === 'password-error') {
              setShowReset(true);
              setLogAlert(res.data);
            }
            setLogAlert(res.data);
          }
        })
        .catch((err: any) => console.log(err));
    } else {
      setLogAlert('Please fill in all required fields');
    }
  };

  const handleCloseAlert = () => {
    setLogAlert(undefined);
    setLogSus(undefined);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-danger rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Vendor Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Access your vendor dashboard
          </p>
        </div>

        {/* Error Alert */}
        {logalert && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{logalert}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={handleCloseAlert}
                  className="inline-flex rounded-md text-red-400 hover:text-red-500"
                >
                  <span className="sr-only">Close</span>
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {logsus && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{logsus}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={handleCloseAlert}
                  className="inline-flex rounded-md text-green-400 hover:text-green-500"
                >
                  <span className="sr-only">Close</span>
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleVendCredLogin} className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleVendCredChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={handleVendCredChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                onClick={() => setShowReset(!showreset)}
                className="font-medium text-danger hover:text-red-600"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-danger hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger transition-colors duration-200"
            >
              Sign in to Dashboard
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register-vendor"
                className="font-medium text-danger hover:text-red-600"
              >
                Register as Vendor
              </Link>
            </p>
          </div>
        </form>

        {/* Reset Password Form */}
        {showreset && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reset Password</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter your email
                </label>
                <input
                  id="reset-email"
                  name="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Your registered email"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="flex-1 bg-danger text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
                >
                  Reset Password
                </button>
                <button
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Benefits Section */}
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-6">
          <h4 className="font-medium text-blue-800 mb-3">Vendor Benefits</h4>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-blue-700">Reach thousands of customers</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-blue-700">Real-time sales analytics</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-blue-700">Fast delivery network</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-blue-700">Secure payment processing</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Vendor;
