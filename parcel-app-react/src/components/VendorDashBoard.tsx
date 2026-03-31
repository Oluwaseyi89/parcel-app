import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import VendProducts from './VendProducts';
import VendDeals from './VendDeals';
import VendTransactions from './VendTransactions';
import VendResolutions from './VendResolutions';
import { Package, Tag, CreditCard, MessageSquare, LogOut, User } from 'lucide-react';

interface VendorData {
  first_name: string;
  last_name: string;
  vend_photo: string;
  [key: string]: any;
}

const VendorDashBoard = (): JSX.Element => {
  const navigate = useNavigate();
  const loggedVen: VendorData | null = JSON.parse(
    localStorage.getItem('logvend') || 'null'
  );

  const [activeTab, setActiveTab] = useState<string>('products');
  const [prodtab, setProdTab] = useState<boolean>(false);
  const [dealtab, setDealTab] = useState<boolean>(false);
  const [transtab, setTransTab] = useState<boolean>(false);
  const [resoltab, setResolTab] = useState<boolean>(false);

  const handleLogout = (): void => {
    localStorage.removeItem('logvend');
    navigate('/vendor');
  };

  const handleProdTabClick = (): void => {
    setActiveTab('products');
    setProdTab(true);
    setDealTab(false);
    setTransTab(false);
    setResolTab(false);
  };

  const handleDealTabClick = (): void => {
    setActiveTab('deals');
    setProdTab(false);
    setDealTab(true);
    setTransTab(false);
    setResolTab(false);
  };

  const handleTransTabClick = (): void => {
    setActiveTab('transactions');
    setProdTab(false);
    setDealTab(false);
    setTransTab(true);
    setResolTab(false);
  };

  const handleResolTabClick = (): void => {
    setActiveTab('resolutions');
    setProdTab(false);
    setDealTab(false);
    setTransTab(false);
    setResolTab(true);
  };

  if (!loggedVen) {
    navigate('/vendor');
    return <></>;
  }

  const { first_name, last_name, vend_photo } = loggedVen;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            {/* Left: Dashboard Title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Vendor Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your products, deals, and transactions
              </p>
            </div>

            {/* Right: Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-danger text-danger rounded-lg hover:bg-danger hover:text-white transition-colors duration-200 font-medium"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>

          {/* Profile Section */}
          <div className="mt-6 flex flex-col md:flex-row items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow">
                {vend_photo ? (
                  <img
                    src={vend_photo}
                    alt={`${first_name} ${last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-danger flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Welcome back, {first_name} {last_name}!
                </h2>
                <p className="text-gray-600">Manage your vendor account</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex space-x-4">
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-lg font-bold text-gray-800">24</div>
                <div className="text-sm text-gray-600">Products</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-lg font-bold text-green-600">₦ 245,000</div>
                <div className="text-sm text-gray-600">Revenue</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-lg font-bold text-blue-600">12</div>
                <div className="text-sm text-gray-600">Orders</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <div className="flex flex-col sm:flex-row border-b border-gray-200">
            <button
              onClick={handleProdTabClick}
              className={`flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-colors duration-200 ${
                activeTab === 'products'
                  ? 'bg-danger text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Package className="w-5 h-5" />
              <span>Products</span>
            </button>

            <button
              onClick={handleDealTabClick}
              className={`flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-colors duration-200 ${
                activeTab === 'deals'
                  ? 'bg-danger text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Tag className="w-5 h-5" />
              <span>Deals</span>
            </button>

            <button
              onClick={handleTransTabClick}
              className={`flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-colors duration-200 ${
                activeTab === 'transactions'
                  ? 'bg-danger text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Transactions</span>
            </button>

            <button
              onClick={handleResolTabClick}
              className={`flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-colors duration-200 ${
                activeTab === 'resolutions'
                  ? 'bg-danger text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Resolutions</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {prodtab && <VendProducts />}
          {dealtab && <VendDeals />}
          {transtab && <VendTransactions />}
          {resoltab && <VendResolutions />}

          {/* Empty State (when no tab selected) */}
          {!prodtab && !dealtab && !transtab && !resoltab && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Select a section to get started
              </h3>
              <p className="text-gray-500">
                Choose from Products, Deals, Transactions, or Resolutions to manage your vendor account.
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Add New Product</h3>
                <p className="text-sm text-gray-600">List your products for sale</p>
              </div>
            </div>
            <button className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
              Add Product
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Create Hot Deal</h3>
                <p className="text-sm text-gray-600">Boost sales with special offers</p>
              </div>
            </div>
            <button className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
              Create Deal
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">View Earnings</h3>
                <p className="text-sm text-gray-600">Check your revenue and payouts</p>
              </div>
            </div>
            <button className="w-full mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200">
              View Earnings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashBoard;
