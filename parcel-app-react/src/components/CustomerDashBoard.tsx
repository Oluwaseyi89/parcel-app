import React, { useState, useEffect } from 'react'; // Add useEffect
import { useNavigate } from 'react-router-dom';
import CustomerCart from './customerPrivatePages/CustomerCart';
import CustomerOrder from './customerPrivatePages/CustomerOrder';
import CustomerDelivery from './customerPrivatePages/CustomerDelivery';
import CustomerNotification from './customerPrivatePages/CustomerNotification';
import CustomerComplain from './customerPrivatePages/CustomerComplain';

const CustomerDashBoard: React.FC = () => {
  const loggedCus = JSON.parse(localStorage.getItem('logcus') || 'null');
  const navigate = useNavigate();
  const [carttab, setCartTab] = useState<boolean>(true);
  const [ordertab, setOrderTab] = useState<boolean>(false);
  const [deliverytab, setDeliveryTab] = useState<boolean>(false);
  const [notifytab, setNotifyTab] = useState<boolean>(false);
  const [complaintab, setComplainTab] = useState<boolean>(false);

  useEffect(() => {
    if (!loggedCus) {
      navigate('/customer');
    }
  }, [loggedCus, navigate]);

  const handleCartTabClick = () => {
    setCartTab(true);
    setOrderTab(false);
    setDeliveryTab(false);
    setNotifyTab(false);
    setComplainTab(false);
  };

  const handleOrderTabClick = () => {
    setCartTab(false);
    setOrderTab(true);
    setDeliveryTab(false);
    setNotifyTab(false);
    setComplainTab(false);
  };

  const handleDeliveryTabClick = () => {
    setCartTab(false);
    setOrderTab(false);
    setDeliveryTab(true);
    setNotifyTab(false);
    setComplainTab(false);
  };

  const handleNotifyTabClick = () => {
    setCartTab(false);
    setOrderTab(false);
    setDeliveryTab(false);
    setNotifyTab(true);
    setComplainTab(false);
  };

  const handleComplainTabClick = () => {
    setCartTab(false);
    setOrderTab(false);
    setDeliveryTab(false);
    setNotifyTab(false);
    setComplainTab(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('logcus');
    navigate('/customer');
  };

  if (!loggedCus) {
    return null;
  }

  return (
    <div className="bg-white w-full min-h-[30px] p-1.25 my-5 box-border rounded-sm shadow-md mt-5">
      <div>
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={handleLogout} 
            className="text-danger font-bold border-[3px] border-danger px-4 py-2 rounded hover:bg-danger hover:text-white transition-colors duration-200"
          >
            Logout
          </button>
          <h4 className="text-center uppercase font-bold text-danger text-xl">
            Customer Dashboard
          </h4>
          <div className="w-20"></div> {/* Spacer for alignment */}
        </div>
        
        <br />
        
        <div className="h-[180px] w-full flex flex-col items-center md:flex-row md:justify-between md:h-[200px] lg:h-[100px]">
          {loggedCus && (
            <p className="text-lg font-bold text-center md:text-left">
              Hello, {loggedCus.last_name + ' ' + loggedCus.first_name}
            </p>
          )}
          <div className="h-[120px] w-[120px] mt-4 md:mt-0">
            {loggedCus?.cus_photo && (
              <img 
                alt="avatar" 
                src={loggedCus.cus_photo} 
                className="h-full w-full object-cover rounded-full border-2 border-gray-300"
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="border-b-2 border-danger mt-9 flex flex-row justify-around w-[95%] h-10 mr-[2.5%] ml-[2.5%] pb-0">
        <div 
          onClick={handleCartTabClick} 
          className={`text-danger text-center w-[20%] pt-2.5 h-full text-xs cursor-pointer transition-colors duration-200 ${
            carttab ? 'bg-danger text-white border-b-2 border-danger opacity-90 font-bold' : 'hover:bg-gray-100'
          }`}
        >
          Carts
        </div>
        <div 
          onClick={handleOrderTabClick} 
          className={`text-danger text-center w-[20%] pt-2.5 h-full text-xs cursor-pointer transition-colors duration-200 ${
            ordertab ? 'bg-danger text-white border-b-2 border-danger opacity-90 font-bold' : 'hover:bg-gray-100'
          }`}
        >
          Orders
        </div>
        <div 
          onClick={handleDeliveryTabClick} 
          className={`text-danger text-center w-[20%] pt-2.5 h-full text-xs cursor-pointer transition-colors duration-200 ${
            deliverytab ? 'bg-danger text-white border-b-2 border-danger opacity-90 font-bold' : 'hover:bg-gray-100'
          }`}
        >
          Deliveries
        </div>
        <div 
          onClick={handleNotifyTabClick} 
          className={`text-danger text-center w-[20%] pt-2.5 h-full text-xs cursor-pointer transition-colors duration-200 ${
            notifytab ? 'bg-danger text-white border-b-2 border-danger opacity-90 font-bold' : 'hover:bg-gray-100'
          }`}
        >
          Notifications
        </div>
        <div 
          onClick={handleComplainTabClick} 
          className={`text-danger text-center w-[20%] pt-2.5 h-full text-xs cursor-pointer transition-colors duration-200 ${
            complaintab ? 'bg-danger text-white border-b-2 border-danger opacity-90 font-bold' : 'hover:bg-gray-100'
        }`}
        >
          Complaints
        </div>
      </div>
      
      {/* Content Area */}
      <div className="mt-4">
        {carttab && <CustomerCart />}
        {ordertab && <CustomerOrder />}
        {deliverytab && <CustomerDelivery />}
        {notifytab && <CustomerNotification />}
        {complaintab && <CustomerComplain />}
      </div>
    </div>
  );
};

export default CustomerDashBoard;
