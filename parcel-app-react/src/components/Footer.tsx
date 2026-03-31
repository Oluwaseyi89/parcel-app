import React from 'react';
import { 
  Package, 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  CreditCard,
  Shield,
  Truck,
  Clock,
  HelpCircle
} from 'lucide-react';

type FooterProps = {};

const Footer: React.FC<FooterProps> = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-danger text-white mt-20">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8" />
              <span className="text-xl font-bold">ParcelApp</span>
            </div>
            <p className="text-gray-200">
              Fast, reliable delivery services connecting vendors, couriers, and customers nationwide.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-gray-300 transition-colors duration-200">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors duration-200">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors duration-200">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors duration-200">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/home" className="text-gray-200 hover:text-white transition-colors duration-200">
                  Home
                </a>
              </li>
              <li>
                <a href="/catalogue" className="text-gray-200 hover:text-white transition-colors duration-200">
                  Products
                </a>
              </li>
              <li>
                <a href="/hot-deals" className="text-gray-200 hover:text-white transition-colors duration-200">
                  Hot Deals
                </a>
              </li>
              <li>
                <a href="/vendor" className="text-gray-200 hover:text-white transition-colors duration-200">
                  Become a Vendor
                </a>
              </li>
              <li>
                <a href="/courier" className="text-gray-200 hover:text-white transition-colors duration-200">
                  Become a Courier
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <a href="/help" className="text-gray-200 hover:text-white transition-colors duration-200">
                  <HelpCircle className="w-4 h-4 inline mr-2" />
                  Help Center
                </a>
              </li>
              <li>
                <a href="/track" className="text-gray-200 hover:text-white transition-colors duration-200">
                  <Truck className="w-4 h-4 inline mr-2" />
                  Track Order
                </a>
              </li>
              <li>
                <a href="/returns" className="text-gray-200 hover:text-white transition-colors duration-200">
                  Return Policy
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-gray-200 hover:text-white transition-colors duration-200">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-gray-200 hover:text-white transition-colors duration-200">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200">
                  123 Business Street, Lagos, Nigeria
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-300 flex-shrink-0" />
                <span className="text-gray-200">
                  +234 801 234 5678
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-300 flex-shrink-0" />
                <span className="text-gray-200">
                  support@parcelapp.ng
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
                <span className="text-gray-200">
                  Mon-Fri: 8AM-6PM
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-8 pt-8 border-t border-red-700">
          <h3 className="text-lg font-semibold mb-4 text-center">We Accept</h3>
          <div className="flex flex-wrap justify-center items-center space-x-6">
            <div className="flex items-center space-x-2 bg-white/10 p-2 rounded">
              <CreditCard className="w-6 h-6" />
              <span>Credit/Debit Cards</span>
            </div>
            <div className="text-sm">•</div>
            <div className="flex items-center space-x-2 bg-white/10 p-2 rounded">
              <span>Bank Transfer</span>
            </div>
            <div className="text-sm">•</div>
            <div className="flex items-center space-x-2 bg-white/10 p-2 rounded">
              <span>Cash on Delivery</span>
            </div>
            <div className="text-sm">•</div>
            <div className="flex items-center space-x-2 bg-white/10 p-2 rounded">
              <span>Mobile Money</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-red-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray-200 text-sm">
                © {currentYear} ParcelApp. All rights reserved.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center items-center space-x-6 text-sm text-gray-200">
              <a href="/privacy" className="hover:text-white transition-colors duration-200">
                Privacy Policy
              </a>
              <span className="hidden md:inline">•</span>
              <a href="/terms" className="hover:text-white transition-colors duration-200">
                Terms of Service
              </a>
              <span className="hidden md:inline">•</span>
              <a href="/cookies" className="hover:text-white transition-colors duration-200">
                Cookie Policy
              </a>
              <span className="hidden md:inline">•</span>
              <a href="/sitemap" className="hover:text-white transition-colors duration-200">
                Sitemap
              </a>
            </div>

            <div className="text-gray-200 text-sm">
              Version 1.0.0 • Last updated: {currentYear}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
