import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { UseFetch } from './useFetch';
import { AlertCircle, CheckCircle, Upload, User, Package, FileText, Phone, Mail, Lock, Check } from 'lucide-react';

type Courier = any;

const RegisterCourier: React.FC = () => {
  const [courphoto, setCourPhoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [courier, setCourier] = useState<Courier>({
    first_name: '',
    last_name: '',
    bus_country: '',
    bus_state: '',
    bus_street: '',
    cac_reg_no: '',
    nin: '',
    phone_no: '',
    email: '',
    password: '',
    cour_policy: false,
  });

  const { first_name, last_name, bus_country, bus_state, bus_street, cac_reg_no, nin, phone_no, email, password, cour_policy } = courier as any;
  const [duPass, setDupass] = useState<string>('');
  const [courAlert, setCourAlert] = useState<string>('');
  const [courSuccess, setCourSuccess] = useState<string>('');

  const handleCourPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCourPhoto(e.target.files[0]);
    }
  };

  const handleCourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof Courier;
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setCourier({ ...courier, [name]: value });
  };

  const courRegUrl = 'http://localhost:7000/parcel_backends/reg_temp_cour/';

  if (courAlert) setTimeout(() => setCourAlert(''), 10000);
  if (courSuccess) setTimeout(() => setCourSuccess(''), 10000);

  const handleSubmitCour = (e: React.FormEvent) => {
    e.preventDefault();
    if (first_name && last_name && bus_country && bus_state && courphoto && bus_street && cac_reg_no && nin && phone_no && email && password) {
      const formData = new FormData();
      const base_name = courphoto ? courphoto.name : 'file';
      formData.append('first_name', first_name || '');
      formData.append('last_name', last_name || '');
      formData.append('bus_country', bus_country || '');
      formData.append('bus_state', bus_state || '');
      formData.append('bus_street', bus_street || '');
      formData.append('cac_reg_no', cac_reg_no || '');
      formData.append('nin', nin || '');
      formData.append('phone_no', phone_no || '');
      formData.append('email', email || '');
      formData.append('password', password || '');
      if (courphoto) formData.append('cour_photo', courphoto, base_name);
      formData.append('cour_policy', String(cour_policy));
      formData.append('reg_date', new Date().toISOString());
      formData.append('is_email_verified', 'false');

      if (password === duPass) {
        UseFetch(courRegUrl, 'POST', formData).then((res: any) => {
          if (res.status === 'success') setCourSuccess(res.data);
          else setCourAlert(res.data);
        });
      } else {
        setCourAlert('Passwords do not match');
      }
    } else setCourAlert('Please fill in all required fields');
  };

  const clearAlerts = () => {
    setCourAlert('');
    setCourSuccess('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-danger rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Courier Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our delivery network and start earning today
          </p>
        </div>

        {/* Alerts */}
        {courAlert && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{courAlert}</p>
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

        {courSuccess && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{courSuccess}</p>
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

        <form onSubmit={handleSubmitCour} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          {/* Photo Upload Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="w-full md:w-1/3">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-danger transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <label htmlFor="cour-img" className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer">
                    Upload Profile Photo
                  </label>
                  <input
                    name="cour_photo"
                    onChange={handleCourPhoto}
                    id="cour-img"
                    type="file"
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('cour-img')?.click()}
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
                {courphoto ? (
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <img
                      id="tar-cour-img"
                      alt="courier avatar"
                      className="w-full h-full object-cover"
                      src={URL.createObjectURL(courphoto)}
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
                  onChange={handleCourChange}
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
                  onChange={handleCourChange}
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
                  onChange={handleCourChange}
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
                    onChange={handleCourChange}
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
              <Package className="w-5 h-5 mr-2 text-danger" />
              Delivery Business Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="cac_reg_no" className="block text-sm font-medium text-gray-700 mb-1">
                  CAC Registration Number
                </label>
                <input
                  id="cac_reg_no"
                  name="cac_reg_no"
                  onChange={handleCourChange}
                  value={cac_reg_no || ''}
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Enter CAC registration number"
                />
              </div>

              <div>
                <label htmlFor="bus_country" className="block text-sm font-medium text-gray-700 mb-1">
                  Operating Country
                </label>
                <input
                  id="bus_country"
                  name="bus_country"
                  onChange={handleCourChange}
                  value={bus_country || ''}
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Enter operating country"
                />
              </div>

              <div>
                <label htmlFor="bus_state" className="block text-sm font-medium text-gray-700 mb-1">
                  Operating State/Province
                </label>
                <input
                  id="bus_state"
                  name="bus_state"
                  onChange={handleCourChange}
                  value={bus_state || ''}
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Enter operating state/province"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="bus_street" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Street Address
                </label>
                <input
                  id="bus_street"
                  name="bus_street"
                  onChange={handleCourChange}
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
                    onChange={handleCourChange}
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
                    onChange={handleCourChange}
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
                    value={duPass}
                    onChange={(e) => setDupass(e.target.value)}
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
                  id="cour_policy"
                  name="cour_policy"
                  checked={cour_policy || false}
                  onChange={handleCourChange}
                  type="checkbox"
                  required
                  className="w-4 h-4 text-danger border-gray-300 rounded focus:ring-danger"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="cour_policy" className="font-medium text-gray-700">
                  I agree to the{' '}
                  <Link to="/courier-policy" className="text-danger hover:text-red-600 font-semibold">
                    Courier Policy
                  </Link>
                </label>
                <p className="text-gray-500 mt-1">
                  By checking this box, you agree to our terms and conditions regarding courier registration, delivery standards, and operational guidelines.
                </p>
              </div>
            </div>
          </div>

          {/* Courier Benefits Info */}
          <div className="mb-8 bg-blue-50 border border-blue-100 rounded-lg p-6">
            <h4 className="font-medium text-blue-800 mb-3 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Courier Benefits
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-700">Flexible working hours and schedule</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-700">Competitive per-delivery rates</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-700">Weekly payout settlement</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-700">Training and support provided</span>
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
              Register as Courier
            </button>
            
            <div className="text-center sm:text-right">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/courier"
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

export default RegisterCourier;
