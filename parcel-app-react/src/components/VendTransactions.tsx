import React, { useState, useEffect } from 'react';
import { UseFetchJSON } from './useFetch';

const VendTransactions: React.FC = () => {
  const [showbank, setShowBank] = useState(false);
  const [showtxn, setShowTxn] = useState(false);
  const [bankDetails, setBankDetails] = useState<any>({ bank_name: '', account_type: '', account_name: '', account_no: '' });

  const [banksus, setBankSus] = useState('');
  const [bankerr, setBankErr] = useState('');

  const [fetchedDetails, setFetchedDetails] = useState<any>({});

  const logvend = JSON.parse(localStorage.getItem('logvend') || 'null');

  const { bank_name, account_type, account_name, account_no } = bankDetails;

  const handleBankDetailChange = (e: any) => {
    const name = e.target.name;
    const value = e.target.value;
    setBankDetails({ ...bankDetails, [name]: value });
  };

  const handleBankDetailSubmit = (e: any) => {
    e.preventDefault();
    if (bank_name && account_type && account_name && account_no) {
      const email = logvend.email;
      const bankData = { bank_name, account_type, account_name, account_no, vendor_email: email, added_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const apiUrl = 'http://localhost:7000/parcel_backends/save_vend_bank/';
      UseFetchJSON(apiUrl, 'POST', bankData)
        .then((res: any) => {
          if (res.status === 'success') setBankSus(res.data);
          else if (res.status === 'error') setBankErr(res.data);
          else setBankErr('An error occured');
        })
        .catch((err: any) => console.log(err));
    } else setBankErr('Some fields are blank');
  };

  const handleBankDetailUpdate = (e: any) => {
    e.preventDefault();
    if (bank_name && account_type && account_name && account_no) {
      const email = logvend.email;
      const bankData = { bank_name, account_type, account_name, account_no, updated_at: new Date().toISOString() };
      const apiUrl = `http://localhost:7000/parcel_backends/update_vend_bank/${email}`;
      UseFetchJSON(apiUrl, 'PATCH', bankData)
        .then((res: any) => {
          if (res.status === 'success') setBankSus(res.data);
          else if (res.status === 'error') setBankErr(res.data);
          else setBankErr('An error occured');
        })
        .catch((err: any) => console.log(err));
    } else setBankErr('Some fields are blank');
  };

  const handleShowBank = () => {
    setShowBank(true);
    setShowTxn(false);
  };

  const handleShowTxn = () => {
    setShowBank(false);
    setShowTxn(true);
  };

  useEffect(() => {
    const apiUrl = `http://localhost:7000/parcel_backends/get_dist_vend_bank/${logvend.email}/`;
    UseFetchJSON(apiUrl, 'GET')
      .then((res: any) => {
        if (res.status === 'success') setFetchedDetails(res.data);
        else if (res.status === 'error') setBankErr(res.data);
      })
      .catch((err: any) => setBankErr(err.message));
  }, [logvend.email]);

  const clearAlert = () => {
    setBankErr('');
    setBankSus('');
  };

  return (
    <div className="mt-20">
      <div className="flex space-x-4 mb-4">
        <button 
          onClick={handleShowBank} 
          className={`px-4 py-2 rounded-md transition-colors ${showbank ? 'bg-[rgb(219,33,76)] text-white' : 'bg-white text-[rgb(219,33,76)] border-2 border-[rgb(219,33,76)]'}`}
        >
          Bank Details
        </button>
        <button 
          onClick={handleShowTxn} 
          className={`px-4 py-2 rounded-md transition-colors ${showtxn ? 'bg-[rgb(219,33,76)] text-white' : 'bg-white text-[rgb(219,33,76)] border-2 border-[rgb(219,33,76)]'}`}
        >
          View Transactions
        </button>
      </div>
      
      {showbank && (
        <div className="bg-white p-6 rounded-lg shadow-[0_0_5px_rgb(167,167,167)] max-w-2xl mx-auto">
          <form className="space-y-4">
            <legend className="text-center uppercase font-bold text-[rgb(219,33,76)] text-xl mb-4">
              Bank Update
            </legend>
            
            {bankerr && (
              <div className="relative h-12 text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center justify-between">
                <span>{bankerr}</span>
                <button 
                  onClick={clearAlert}
                  className="text-2xl leading-none hover:text-red-900"
                >
                  &times;
                </button>
              </div>
            )}
            
            {banksus && (
              <div className="relative h-12 text-center bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center justify-between">
                <span>{banksus}</span>
                <button 
                  onClick={clearAlert}
                  className="text-2xl leading-none hover:text-green-900"
                >
                  &times;
                </button>
              </div>
            )}
            
            <div className="space-y-4">
              <input 
                onChange={handleBankDetailChange} 
                name="bank_name" 
                value={bank_name} 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent"
                placeholder={fetchedDetails.bank_name ? fetchedDetails.bank_name : 'Bank Name'} 
              />
              
              <select 
                onChange={handleBankDetailChange} 
                name="account_type" 
                value={account_type} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent"
              >
                <option value="">
                  {fetchedDetails.account_type ? fetchedDetails.account_type : 'Select Account Type'}
                </option>
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
              </select>
              
              <input 
                onChange={handleBankDetailChange} 
                name="account_name" 
                value={account_name} 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent"
                placeholder={fetchedDetails.account_name ? fetchedDetails.account_name : 'Account Name'} 
              />
              
              <input 
                onChange={handleBankDetailChange} 
                name="account_no" 
                value={account_no} 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(219,33,76)] focus:border-transparent"
                placeholder={fetchedDetails.account_no ? fetchedDetails.account_no : 'Account Number'} 
              />
            </div>
            
            <div className="flex space-x-4 pt-4">
              <button 
                onClick={handleBankDetailSubmit} 
                className="flex-1 px-4 py-2 bg-[rgb(219,33,76)] text-white rounded-md hover:bg-[rgb(200,30,70)] transition-colors"
              >
                Save
              </button>
              <button 
                onClick={handleBankDetailUpdate} 
                className="flex-1 px-4 py-2 bg-[rgb(219,33,76)] text-white rounded-md hover:bg-[rgb(200,30,70)] transition-colors"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      )}
      
      {showtxn && (
        <div className="bg-white p-6 rounded-lg shadow-[0_0_5px_rgb(167,167,167)] max-w-2xl mx-auto">
          <h4 className="text-xl font-semibold text-gray-800 mb-4">Txn Details</h4>
          {/* Add transaction details content here */}
        </div>
      )}
    </div>
  );
};

export default VendTransactions;
