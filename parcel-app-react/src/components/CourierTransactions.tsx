import { useState, FormEvent, ChangeEvent } from 'react';

interface BankDetails {
  bank_name: string;
  account_type: string;
  account_name: string;
  account_no: string;
}

interface CourierData {
  email: string;
  [key: string]: any;
}

interface ApiResponse {
  status: 'success' | 'error';
  data: string;
}

interface UseFetchJSON {
  <T>(url: string, method?: string, body?: any): Promise<T>;
}

declare const UseFetchJSON: UseFetchJSON;

const CourierTransactions = (): JSX.Element => {
  const [showbank, setShowBank] = useState<boolean>(false);
  const [showtxn, setShowTxn] = useState<boolean>(false);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bank_name: "",
    account_type: "",
    account_name: "",
    account_no: ""
  });

  const [banksus, setBankSus] = useState<string>("");
  const [bankerr, setBankErr] = useState<string>("");

  const logcour: CourierData | null = JSON.parse(
    localStorage.getItem('logcour') || 'null'
  );

  const { bank_name, account_type, account_name, account_no } = bankDetails;

  const handleBankDetailChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setBankDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBankDetailSubmit = (e: FormEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    
    if (!logcour) {
      setBankErr('No courier data found. Please log in again.');
      return;
    }

    if (!bank_name || !account_type || !account_name || !account_no) {
      setBankErr('Some fields are blank');
      return;
    }

    const bankData = {
      bank_name,
      account_type,
      account_name,
      account_no,
      courier_email: logcour.email,
      added_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const apiUrl = "http://localhost:7000/parcel_backends/save_cour_bank/";
    
    UseFetchJSON<ApiResponse>(apiUrl, 'POST', bankData)
      .then((res) => {
        if (res.status === "success") {
          setBankSus(res.data);
          setBankErr('');
        } else if (res.status === "error") {
          setBankErr(res.data);
          setBankSus('');
        } else {
          setBankErr('An unexpected error occurred');
          setBankSus('');
        }
      })
      .catch((err: Error) => {
        console.error(err);
        setBankErr('Failed to save bank details. Please try again.');
        setBankSus('');
      });
  };

  const handleBankDetailUpdate = (e: FormEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    
    if (!logcour) {
      setBankErr('No courier data found. Please log in again.');
      return;
    }

    if (!bank_name || !account_type || !account_name || !account_no) {
      setBankErr('Some fields are blank');
      return;
    }

    const bankData = {
      bank_name,
      account_type,
      account_name,
      account_no,
      updated_at: new Date().toISOString()
    };

    const apiUrl = `http://localhost:7000/parcel_backends/update_cour_bank/${logcour.email}`;
    
    UseFetchJSON<ApiResponse>(apiUrl, 'PATCH', bankData)
      .then((res) => {
        if (res.status === "success") {
          setBankSus(res.data);
          setBankErr('');
        } else if (res.status === "error") {
          setBankErr(res.data);
          setBankSus('');
        } else {
          setBankErr('An unexpected error occurred');
          setBankSus('');
        }
      })
      .catch((err: Error) => {
        console.error(err);
        setBankErr('Failed to update bank details. Please try again.');
        setBankSus('');
      });
  };

  const handleShowBank = (): void => {
    setShowBank(true);
    setShowTxn(false);
  };

  const handleShowTxn = (): void => {
    setShowBank(false);
    setShowTxn(true);
  };

  const handleCloseAlert = (): void => {
    setBankSus('');
    setBankErr('');
  };

  return (
    <div className="mt-20 p-6">
      {/* Toggle Buttons */}
      <div className="flex w-full items-center justify-around mb-6">
        <button 
          onClick={handleShowBank}
          className={`text-danger font-bold text-xs hover:bg-danger hover:text-white px-4 py-2 rounded transition-colors duration-200 ${
            showbank ? 'bg-danger text-white' : 'border border-danger'
          }`}
        >
          Bank Details
        </button>
        <button 
          onClick={handleShowTxn}
          className={`text-danger font-bold text-xs hover:bg-danger hover:text-white px-4 py-2 rounded transition-colors duration-200 ${
            showtxn ? 'bg-danger text-white' : 'border border-danger'
          }`}
        >
          View Transactions
        </button>
      </div>
      
      <br/>
      
      {/* Bank Details Form */}
      {showbank && (
        <div className="mt-4">
          <form className="bg-white w-full min-h-[30px] p-1.25 my-5 box-border rounded-sm shadow-md">
            <legend className="text-center uppercase font-bold text-danger text-xl mb-4">
              Bank Details
            </legend>
            
            {/* Error Alert */}
            {bankerr && (
              <div 
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                role="alert"
              >
                <div className="text-center">{bankerr}</div>
                <button 
                  className="absolute top-0 right-0 px-4 py-3 hover:text-red-900"
                  onClick={handleCloseAlert}
                  aria-label="Close"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            )}
            
            {/* Success Alert */}
            {banksus && (
              <div 
                className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
                role="alert"
              >
                <div className="text-center">{banksus}</div>
                <button 
                  className="absolute top-0 right-0 px-4 py-3 hover:text-green-900"
                  onClick={handleCloseAlert}
                  aria-label="Close"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            )}
            
            {/* Form Fields */}
            <div className="space-y-4">
              {/* Bank Name */}
              <div>
                <input 
                  onChange={handleBankDetailChange} 
                  name="bank_name" 
                  value={bank_name} 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Bank Name"
                />
              </div>
              
              {/* Account Type */}
              <div>
                <select 
                  onChange={handleBankDetailChange} 
                  name="account_type" 
                  value={account_type} 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent bg-white"
                >
                  <option value="">Select Account Type</option>
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                </select>
              </div>
              
              {/* Account Name */}
              <div>
                <input 
                  onChange={handleBankDetailChange} 
                  name="account_name" 
                  value={account_name} 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Account Name"
                />
              </div>
              
              {/* Account Number */}
              <div>
                <input 
                  onChange={handleBankDetailChange} 
                  name="account_no" 
                  value={account_no} 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Account Number"
                />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-row w-[250px] justify-between mt-6 mx-auto">
              <button 
                onClick={handleBankDetailSubmit}
                type="button"
                className="text-danger font-bold text-xs hover:bg-danger hover:text-white px-4 py-2 rounded border border-danger transition-colors duration-200"
              >
                Save
              </button>
              <button 
                onClick={handleBankDetailUpdate}
                type="button"
                className="text-danger font-bold text-xs hover:bg-danger hover:text-white px-4 py-2 rounded border border-danger transition-colors duration-200"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Transactions View */}
      {showtxn && (
        <div className="mt-4 p-6 bg-white rounded-lg shadow-md">
          <h4 className="text-center uppercase font-bold text-danger text-xl mb-6">
            Transaction History
          </h4>
          
          {/* Placeholder content - replace with actual transaction data */}
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p className="text-gray-600 mb-2">No transactions yet</p>
            <p className="text-sm text-gray-500">
              Your transaction history will appear here once you start earning
            </p>
            
            {/* Sample transaction table - remove when you have real data */}
            <div className="mt-8 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      No data available
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        N/A
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierTransactions;
