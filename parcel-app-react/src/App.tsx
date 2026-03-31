import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Vendor from './components/Vendor'
import Home from './components/Home'
import Courier from './components/Courier'
import Catalogue from './components/Catalogue'
import HotDeals from './components/HotDeals'
import Customer from './components/Customer'
import VendorDashBoard from './components/VendorDashBoard'
import CourierDashBoard from './components/CourierDashBoard'
import CustomerDashBoard from './components/CustomerDashBoard'
import VerifyPayment from './components/VerifyPayment'
import RegisterVendor from './components/RegisterVendor'
import RegisterCourier from './components/RegisterCourier'
import RegisterCustomer from './components/RegisterCustomer'
import ProdDetailPage from './components/ProdDetailPage'
import CartCheckOut from './components/CartCheckOut'
import Payment from './components/Payment'
import SingleProdCheckOutPage from './components/SingleProdCheckOutPage'
import { useCartStore } from './stores/cartStore'
import { useAuthStore } from './stores/authStore'

function App() {
  const initializeCart = useCartStore((state: any) => state.initializeCart)
  const initializeAuth = useAuthStore((state: any) => state.initializeAuth)

  useEffect(() => {
    initializeCart()
    initializeAuth()
  }, [initializeCart, initializeAuth])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Router>
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/" element={<Home />} />
            <Route path="/vendor" element={<Vendor />} />
            <Route path="/courier" element={<Courier />} />
            <Route path="/catalogue" element={<Catalogue />} />
            <Route path="/hot-deals" element={<HotDeals />} />
            <Route path="/customer" element={<Customer />} />
            <Route path="/register-vendor" element={<RegisterVendor />} />
            <Route path="/register-courier" element={<RegisterCourier />} />
            <Route path="/register-customer" element={<RegisterCustomer />} />
            <Route path="/courier-dash" element={<CourierDashBoard />} />
            <Route path="/vendor-dash" element={<VendorDashBoard />} />
            <Route path="/customer-dash" element={<CustomerDashBoard />} />
            <Route path="/cart-check" element={<CartCheckOut />} />
            <Route path="/single" element={<SingleProdCheckOutPage />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/verify" element={<VerifyPayment />} />
            <Route path="/prod-detail" element={<ProdDetailPage />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </div>
  )
}

export default App

