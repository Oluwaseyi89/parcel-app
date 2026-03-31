import React, { useState, useEffect } from 'react'; // Add useEffect
import { useNavigate } from 'react-router-dom';
import CourierDeals from './CourierDeals';
import CourierDispatch from './CourierDispatch';
import CourierResolutions from './CourierResolutions';
import CourierTransactions from './CourierTransactions';

const CourierDashBoard: React.FC = () => {
  const navigate = useNavigate();
  const [dispatchtab, setDispatchTab] = useState(false);
  const [resoltab, setResolTab] = useState(false);
  const [txntab, setTxnTab] = useState(false);
  const [dealtab, setDealTab] = useState(true);

  const loggedCour = JSON.parse(localStorage.getItem('logcour') || 'null');

  // Add useEffect to handle redirect when not logged in
  useEffect(() => {
    if (!loggedCour) {
      navigate('/courier');
    }
  }, [loggedCour, navigate]);

  const handleDealTabClick = () => {
    setDealTab(true);
    setDispatchTab(false);
    setResolTab(false);
    setTxnTab(false);
  };
  const handleDispatchTabClick = () => {
    setDealTab(false);
    setDispatchTab(true);
    setResolTab(false);
    setTxnTab(false);
  };
  const handleResolTabClick = () => {
    setDealTab(false);
    setDispatchTab(false);
    setResolTab(true);
    setTxnTab(false);
  };
  const handleTxnTabClick = () => {
    setDealTab(false);
    setDispatchTab(false);
    setResolTab(false);
    setTxnTab(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('logcour');
    navigate('/courier');
  };

  // If not logged in, return null or loading while useEffect redirects
  if (!loggedCour) {
    return null; // or return a loading spinner
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
            Courier Dashboard
          </h4>
          <div className="w-20"></div> {/* Spacer for alignment */}
        </div>
        
        <br />
        
        <div className="h-[180px] w-full flex flex-col items-center md:flex-row md:justify-between md:h-[200px] lg:h-[100px]">
          {loggedCour && (
            <p className="text-lg font-bold text-center md:text-left">
              Hello, {loggedCour.last_name + ' ' + loggedCour.first_name}
            </p>
          )}
          <div className="h-[120px] w-[120px] mt-4 md:mt-0">
            {loggedCour?.cour_photo && (
              <img 
                alt="avatar" 
                src={loggedCour.cour_photo} 
                className="h-full w-full object-cover rounded-full border-2 border-gray-300"
              />
            )}
          </div>
        </div>
      </div>
      
      <div className="border-b-2 border-danger mt-9 flex flex-row justify-around w-[95%] h-10 mr-[2.5%] ml-[2.5%] pb-0">
        <div 
          onClick={handleDealTabClick} 
          className={`text-danger text-center w-[25%] pt-2.5 h-full text-xs cursor-pointer transition-colors duration-200 ${
            dealtab ? 'bg-danger text-white border-b-2 border-danger opacity-90 font-bold' : 'hover:bg-gray-100'
          }`}
        >
          Deals
        </div>
        <div 
          onClick={handleDispatchTabClick} 
          className={`text-danger text-center w-[25%] pt-2.5 h-full text-xs cursor-pointer transition-colors duration-200 ${
            dispatchtab ? 'bg-danger text-white border-b-2 border-danger opacity-90 font-bold' : 'hover:bg-gray-100'
          }`}
        >
          Dispatches
        </div>
        <div 
          onClick={handleTxnTabClick} 
          className={`text-danger text-center w-[25%] pt-2.5 h-full text-xs cursor-pointer transition-colors duration-200 ${
            txntab ? 'bg-danger text-white border-b-2 border-danger opacity-90 font-bold' : 'hover:bg-gray-100'
          }`}
        >
          Transactions
        </div>
        <div 
          onClick={handleResolTabClick} 
          className={`text-danger text-center w-[25%] pt-2.5 h-full text-xs cursor-pointer transition-colors duration-200 ${
            resoltab ? 'bg-danger text-white border-b-2 border-danger opacity-90 font-bold' : 'hover:bg-gray-100'
        }`}
        >
          Resolutions
        </div>
      </div>
      
      <div className="mt-4">
        {dealtab && <CourierDeals />}
        {dispatchtab && <CourierDispatch />}
        {txntab && <CourierTransactions />}
        {resoltab && <CourierResolutions />}
      </div>
    </div>
  );
};

export default CourierDashBoard;
