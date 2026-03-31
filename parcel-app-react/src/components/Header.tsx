import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { 
  Search,
  ShoppingCart,
  Home,
  Store,
  Truck,
  Package,
  Flame,
  User,
  Package2 
} from 'lucide-react';

type HeaderProps = {};

const Header: React.FC<HeaderProps> = () => {
  const cartTotal = useCartStore((state) => state.cartTotal);
  const customer = useAuthStore((state) => state.customer);
  const vendor = useAuthStore((state) => state.vendor);
  const courier = useAuthStore((state) => state.courier);

  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // Implement search functionality here
    }
  };

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b-[3px] border-danger">
      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Upper Header - Logo, Search, Cart */}
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14">
              <Package2 className="w-8 h-8 md:w-10 md:h-10 text-danger" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">Parcel App</h1>
              <p className="text-xs text-gray-500">Fast Delivery</p>
            </div>
          </Link>

          {/* Search Bar - Hidden on mobile, shown on tablet/desktop */}
          {!isMobile && (
            <form 
              onSubmit={handleSearchSubmit} 
              className={`flex-1 max-w-2xl mx-4 md:mx-8 transition-all duration-200 ${
                isSearchFocused ? 'scale-105' : ''
              }`}
            >
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search for products, vendors, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full px-4 py-2 pl-12 pr-4 rounded-full border-2 border-danger focus:outline-none focus:ring-2 focus:ring-danger focus:ring-opacity-50 transition-all duration-200"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-danger text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Cart & Mobile Search */}
          <div className="flex items-center space-x-4">
            
            {/* Mobile Search Button */}
            {isMobile && (
              <button
                onClick={() => console.log('Open mobile search')}
                className="p-2 text-gray-600 hover:text-danger transition-colors duration-200"
                aria-label="Search"
              >
                <Search className="w-6 h-6" />
              </button>
            )}

            {/* Cart */}
            <Link to="/cart-check" className="relative group">
              <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 md:w-7 md:h-7 text-gray-700 group-hover:text-danger transition-colors duration-200" />
                  {cartTotal > 0 && (
                    <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 md:w-6 md:h-6 bg-danger text-white text-xs font-bold rounded-full">
                      {cartTotal > 99 ? '99+' : cartTotal}
                    </span>
                  )}
                </div>
                {!isMobile && (
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">Cart</div>
                    <div className="text-xs text-gray-500">{cartTotal} items</div>
                  </div>
                )}
              </div>
            </Link>

            {/* Mobile Menu Button */}
            {isMobile && (
              <button
                onClick={() => console.log('Open mobile menu')}
                className="p-2 text-gray-600 hover:text-danger transition-colors duration-200"
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Lower Header - Navigation Tabs */}
        <nav className="h-12 md:h-14 border-t border-gray-200">
          <div className="flex items-center justify-between h-full overflow-x-auto scrollbar-hide">
            {/* Desktop/Tablet Navigation */}
            {!isMobile ? (
              <>
                <NavLink to="/home" icon={<Home className="w-5 h-5" />} label="Home" />
                <NavLink 
                  to={vendor ? '/vendor-dash' : '/vendor'} 
                  icon={<Store className="w-5 h-5" />} 
                  label="Vendor" 
                />
                <NavLink 
                  to={courier ? '/courier-dash' : '/courier'} 
                  icon={<Truck className="w-5 h-5" />} 
                  label="Courier" 
                />
                <NavLink to="/catalogue" icon={<Package className="w-5 h-5" />} label="Catalogue" />
                <NavLink to="/hot-deals" icon={<Flame className="w-5 h-5" />} label="Hot Deals" />
                <NavLink 
                  to={customer ? '/customer-dash' : '/customer'} 
                  icon={<User className="w-5 h-5" />} 
                  label="Customer" 
                />
              </>
            ) : (
              // Mobile Navigation - Icons only with labels on hover
              <div className="flex items-center justify-around w-full px-2">
                <MobileNavLink to="/home" icon={<Home className="w-5 h-5" />} label="Home" />
                <MobileNavLink 
                  to={vendor ? '/vendor-dash' : '/vendor'} 
                  icon={<Store className="w-5 h-5" />} 
                  label="Vendor" 
                />
                <MobileNavLink 
                  to={courier ? '/courier-dash' : '/courier'} 
                  icon={<Truck className="w-5 h-5" />} 
                  label="Courier" 
                />
                <MobileNavLink to="/catalogue" icon={<Package className="w-5 h-5" />} label="Catalogue" />
                <MobileNavLink to="/hot-deals" icon={<Flame className="w-5 h-5" />} label="Hot Deals" />
                <MobileNavLink 
                  to={customer ? '/customer-dash' : '/customer'} 
                  icon={<User className="w-5 h-5" />} 
                  label="Customer" 
                />
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile Search Overlay */}
      {isMobile && false && ( // Set to false initially, can be toggled
        <div className="fixed inset-0 z-50 bg-white p-4">
          {/* Mobile search implementation */}
        </div>
      )}
    </header>
  );
};

// Reusable NavLink Component for Desktop/Tablet
const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
  <Link
    to={to}
    className="group flex flex-col items-center justify-center px-4 py-2 h-full min-w-[80px] md:min-w-[100px] transition-all duration-200 hover:bg-gray-50 relative"
  >
    <div className="flex flex-col items-center space-y-1">
      <div className="text-gray-600 group-hover:text-danger transition-colors duration-200">
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-700 group-hover:text-danger transition-colors duration-200">
        {label}
      </span>
    </div>
    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 group-hover:w-10 h-0.5 bg-danger transition-all duration-200"></div>
  </Link>
);

// Reusable MobileNavLink Component
const MobileNavLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
  <Link
    to={to}
    className="group flex flex-col items-center justify-center p-2 relative"
    aria-label={label}
  >
    <div className="text-gray-600 group-hover:text-danger transition-colors duration-200">
      {icon}
    </div>
    {/* Tooltip on hover for mobile */}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
      {label}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
    </div>
  </Link>
);

export default Header;
