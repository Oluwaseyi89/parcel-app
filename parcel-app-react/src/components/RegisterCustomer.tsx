import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UseFetchJSON } from './useFetch';
import { AlertCircle, CheckCircle, User, MapPin, Phone, Mail, Lock, Check } from 'lucide-react';

type Customer = any;

const RegisterCustomer: React.FC = () => {
  const [dupPass, setDupPass] = useState<string>('');
  const [cusalert, setCusAlert] = useState<string>('');
  const [cussuccess, setCusSuccess] = useState<string>('');
  const [customer, setCustomer] = useState<Customer>({
    first_name: '',
    last_name: '',
    country: '',
    state: '',
    street: '',
    phone_no: '',
    email: '',
    password: '',
    reg_date: new Date().toISOString(),
    is_email_verified: false,
  });

  const { first_name, last_name, country, state, street, phone_no, email, password } = customer as any;

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof Customer;
    const value = e.target.value;
    setCustomer({ ...customer, [name]: value });
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (first_name && last_name && country && state && street && phone_no && email && password) {
      if (password === dupPass) {
        const apiURL = 'http://localhost:7000/parcel_customer/reg_customer/';
        UseFetchJSON(apiURL, 'POST', customer)
          .then((res: any) => {
            if (res.status === 'success') setCusSuccess(res.data);
            else if (res.status === 'error') setCusAlert(res.data);
          })
          .catch((err: any) => console.log(err));
      } else {
        setCusAlert('Passwords do not match');
      }
    } else {
      setCusAlert('Please fill in all required fields');
    }
  };

  const clearAlerts = () => {
    setCusAlert('');
    setCusSuccess('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-danger rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Customer Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to start shopping
          </p>
        </div>

        {/* Alerts */}
        {cusalert && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{cusalert}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={clearAlerts}
                  className="inline-flex rounded-md text-red-400 hover:text-red-500"
                >
                  <span className="sr-only">Close</span>
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {cussuccess && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{cussuccess}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={clearAlerts}
                  className="inline-flex rounded-md text-green-400 hover:text-green-500"
                >
                  <span className="sr-only">Close</span>
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleCustomerSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          {/* Personal Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-danger" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  value={first_name}
                  onChange={handleCustomerChange}
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Enter first name"
                />
              </div>
              
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  value={last_name}
                  onChange={handleCustomerChange}
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-danger" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone_no" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone_no"
                    name="phone_no"
                    value={phone_no}
                    onChange={handleCustomerChange}
                    type="text"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

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
                    value={email}
                    onChange={handleCustomerChange}
                    type="email"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-danger" />
              Address Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  value={country}
                  onChange={handleCustomerChange}
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Enter country"
                />
              </div>
              
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
                <input
                  id="state"
                  name="state"
                  value={state}
                  onChange={handleCustomerChange}
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Enter state/province"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  id="street"
                  name="street"
                  value={street}
                  onChange={handleCustomerChange}
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Enter street address"
                />
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-danger" />
              Account Security
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    value={password}
                    onChange={handleCustomerChange}
                    type="password"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="retype-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="retype-password"
                    name="retype-password"
                    value={dupPass}
                    onChange={(e) => setDupPass(e.target.value)}
                    type="password"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Customer Benefits Info */}
          <div className="mb-8 bg-blue-50 border border-blue-100 rounded-lg p-6">
            <h4 className="font-medium text-blue-800 mb-3 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
              Customer Benefits
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-700">Fast and reliable delivery services</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-700">Secure payment options</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-700">Order tracking in real-time</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-700">24/7 customer support</span>
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              className="flex-1 bg-danger text-white py-3 px-4 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger transition-colors duration-200 font-medium flex items-center justify-center"
            >
              <Check className="w-5 h-5 mr-2" />
              Register as Customer
            </button>
            
            <div className="text-center sm:text-right">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/customer"
                  className="font-medium text-danger hover:text-red-600"
                >
                  Login Instead
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterCustomer;
