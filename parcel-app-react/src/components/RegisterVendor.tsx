import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { UseFetch } from './useFetch';
import { AlertCircle, CheckCircle, Upload, User, Building, FileText, Phone, Mail, Lock, Check } from 'lucide-react';

type Vendor = any;

const RegisterVendor: React.FC = () => {
  const [apiAlert, setApiAlert] = useState<string>('');
  const [apiSuccess, setApiSuccess] = useState<string>('');
  const [photo, setPhoto] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const [vendor, setVendor] = useState<Vendor>({
    first_name: '',
    last_name: '',
    bus_country: '',
    bus_state: '',
    bus_street: '',
    bus_category: '',
    cac_reg_no: '',
    nin: '',
    phone_no: '',
    email: '',
    password: '',
    ven_policy: false,
  });

  const { first_name, last_name, bus_country, bus_state, bus_street, bus_category, cac_reg_no, nin, phone_no, email, password, ven_policy } = vendor as any;
  const [repass, setRepass] = useState<string>('');

  const venRegUrl = 'http://localhost:7000/parcel_backends/reg_temp_ven/';

  const handleVendChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const name = e.target.name as keyof Vendor;
    const value = (e.target as HTMLInputElement).type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setVendor({ ...vendor, [name]: value });
  };

  if (apiAlert) {
    setTimeout(() => setApiAlert(''), 10000);
  }
  if (apiSuccess) {
    setTimeout(() => setApiSuccess(''), 10000);
  }

  const handleSubmitVend = (e: React.FormEvent) => {
    e.preventDefault();
    if (first_name && last_name && bus_category && bus_country && bus_state && photo && bus_street && cac_reg_no && nin && phone_no && email && password && ven_policy) {
      const formData = new FormData();
      const base_name = photo ? photo.name : 'file';
      formData.append('first_name', first_name || '');
      formData.append('last_name', last_name || '');
      formData.append('bus_country', bus_country || '');
      formData.append('bus_state', bus_state || '');
      formData.append('bus_street', bus_street || '');
      formData.append('bus_category', bus_category || '');
      formData.append('cac_reg_no', cac_reg_no || '');
      formData.append('nin', nin || '');
      formData.append('phone_no', phone_no || '');
      formData.append('email', email || '');
      formData.append('password', password || '');
      if (photo) formData.append('vend_photo', photo, base_name);
      formData.append('ven_policy', String(ven_policy));
      formData.append('reg_date', new Date().toISOString());
      formData.append('is_email_verified', 'false');

      if (password === repass) {
        UseFetch(venRegUrl, 'POST', formData).then((res: any) => {
          if (res.status === 'success') setApiSuccess(res.data);
          else if (res.status === 'error') setApiAlert(res.data);
        }).catch((err: any) => console.log(err.message));
      } else {
        setApiAlert('Passwords do not match');
      }
    } else {
      setApiAlert('Please fill in all required fields');
    }
  };

  const clearAlerts = () => {
    setApiAlert('');
    setApiSuccess('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-danger rounded-full flex items-center justify-center">
              <Building className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Vendor Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your vendor account to start selling
          </p>
        </div>

        {/* Alerts */}
        {apiAlert && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{apiAlert}</p>
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

        {apiSuccess && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{apiSuccess}</p>
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

        <form onSubmit={handleSubmitVend} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          {/* Photo Upload Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="w-full md:w-1/3">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-danger transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <label htmlFor="vend-img" className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer">
                    Upload Business Photo
                  </label>
                  <input
                    ref={fileInputRef}
                    name="vend_photo"
                    onChange={handlePhoto}
                    id="vend-img"
                    type="file"
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    Choose File
                  </button>
                  <p className="mt-2 text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </div>
              
              <div className="w-full md:w-1/3 flex justify-center">
                {photo ? (
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <img
                      id="target-img"
                      alt="avatar"
                      className="w-full h-full object-cover"
                      src={URL.createObjectURL(photo)}
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 rounded-full bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>

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
                  onChange={handleVendChange}
                  value={first_name || ''}
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
                  onChange={handleVendChange}
                  value={last_name || ''}
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label htmlFor="nin" className="block text-sm font-medium text-gray-700 mb-1">
                  National Identity Number (NIN)
                </label>
                <input
                  id="nin"
                  name="nin"
                  onChange={handleVendChange}
                  value={nin || ''}
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Enter NIN"
                />
              </div>

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
                    onChange={handleVendChange}
                    value={phone_no || ''}
                    type="text"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-danger" />
              Business Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="bus_category" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Category
                </label>
                <select
                  id="bus_category"
                  name="bus_category"
                  onChange={handleVendChange}
                  value={bus_category || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                >
                  <option value="">Select Business Category</option>
                  <option value="Chemicals">Chemicals</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Educative_Materials">Educative Materials</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Furniture">Furniture</option>
                  <option value="General_Merchandise">General Merchandise</option>
                  <option value="Kitchen_Utensils">Kitchen Utensils</option>
                  <option value="Plastics">Plastics</option>
                  <option value="Spare_Parts">Spare Parts</option>
                </select>
              </div>

              <div>
                <label htmlFor="cac_reg_no" className="block text-sm font-medium text-gray-700 mb-1">
                  CAC Registration Number
                </label>
                <input
                  id="cac_reg_no"
                  name="cac_reg_no"
                  onChange={handleVendChange}
                  value={cac_reg_no || ''}
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Enter CAC registration number"
                />
              </div>

              <div>
                <label htmlFor="bus_country" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Country
                </label>
                <input
                  id="bus_country"
                  name="bus_country"
                  onChange={handleVendChange}
                  value={bus_country || ''}
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Enter business country"
                />
              </div>

              <div>
                <label htmlFor="bus_state" className="block text-sm font-medium text-gray-700 mb-1">
                  Business State/Province
                </label>
                <input
                  id="bus_state"
                  name="bus_state"
                  onChange={handleVendChange}
                  value={bus_state || ''}
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Enter business state/province"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="bus_street" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Street Address
                </label>
                <input
                  id="bus_street"
                  name="bus_street"
                  onChange={handleVendChange}
                  value={bus_street || ''}
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
              <Mail className="w-5 h-5 mr-2 text-danger" />
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    onChange={handleVendChange}
                    value={email || ''}
                    type="email"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

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
                    onChange={handleVendChange}
                    value={password || ''}
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
                    value={repass}
                    onChange={(e) => setRepass(e.target.value)}
                    type="password"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="mb-8">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="ven_policy"
                  name="ven_policy"
                  checked={ven_policy || false}
                  onChange={handleVendChange}
                  type="checkbox"
                  required
                  className="w-4 h-4 text-danger border-gray-300 rounded focus:ring-danger"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="ven_policy" className="font-medium text-gray-700">
                  I agree to the{' '}
                  <Link to="/vendor-policy" className="text-danger hover:text-red-600 font-semibold">
                    Vendor Policy
                  </Link>
                </label>
                <p className="text-gray-500 mt-1">
                  By checking this box, you agree to our terms and conditions regarding vendor registration and operation.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              className="flex-1 bg-danger text-white py-3 px-4 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger transition-colors duration-200 font-medium flex items-center justify-center"
            >
              <Check className="w-5 h-5 mr-2" />
              Register as Vendor
            </button>
            
            <div className="text-center sm:text-right">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/vendor"
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

export default RegisterVendor;
