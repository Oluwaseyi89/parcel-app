import { useState, useEffect, useReducer, useCallback } from 'react';

// Define interfaces for our data structures
interface VendorProduct {
  product_id: number;
  vendor_name: string;
  is_supply_ready: boolean;
  vendor_address: string;
  vendor_phone: string;
  order_id: string;
}

interface DispatchDeal {
  order_id: string;
  customer_name: string;
  address: string;
  phone_no: string;
  handled_dispatch: boolean;
  courier_id?: number;
  courier_name?: string;
  courier_email?: string;
  courier_phone?: string;
  updated_at?: string;
  products: VendorProduct[];
}

interface CourierData {
  id: number;
  last_name: string;
  first_name: string;
  email: string;
  phone_no: string;
}

interface DealsState {
  deals: DispatchDeal[];
}

interface GetDealsAction {
  type: "GET_DEALS";
  payload: DispatchDeal[];
}

interface AcceptDealAction {
  type: "ACCEPT_DEAL";
  payload: string;
}

type DealsAction = GetDealsAction | AcceptDealAction;

// Custom fetch functions with typing
const UseFetchJSON = async <T,>(url: string, method: string = 'GET', body?: any): Promise<T> => {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const CourierDeals = () => {
  const [prodsus, setProdSus] = useState<string>("");
  const [proderr, setProdErr] = useState<string>("");
  const [loadDeals, setLoadDeals] = useState<boolean>(true);

  const loggedCour: CourierData | null = JSON.parse(localStorage.getItem('logcour') || 'null');
  
  const initialDeals: DealsState = {
    deals: []
  };

  const getDeals = useCallback((data: DispatchDeal[]) => {
    return dispatch({
      type: "GET_DEALS",
      payload: data,
    });
  }, []);

  const acceptDeal = (id: string) => {
    return dispatch({
      type: "ACCEPT_DEAL",
      payload: id
    });
  };

  const handleAcceptClick = (orderId: string) => {
    acceptDeal(orderId);
  };

  const reducer = (state: DealsState = initialDeals, action: DealsAction): DealsState => {
    switch (action.type) {
      case "GET_DEALS": {
        const revDeal = action.payload.filter((item) => !item.handled_dispatch);
        return { ...state, deals: revDeal };
      }

      case "ACCEPT_DEAL": {
        // Filter out the accepted deal immediately for responsive UI
        const filteredDeals = state.deals.filter((deal) => deal.order_id !== action.payload);
        
        // Process the acceptance asynchronously
        const dealToAccept = state.deals.find((item) => item.order_id === action.payload);
        
        if (dealToAccept && loggedCour) {
          const detail = {
            handled_dispatch: true,
            courier_id: loggedCour.id,
            courier_name: `${loggedCour.last_name} ${loggedCour.first_name}`,
            courier_email: loggedCour.email,
            courier_phone: loggedCour.phone_no,
            updated_at: new Date().toISOString()
          };

          const apiUrl = `http://localhost:7000/parcel_dispatch/update_dispatch/${action.payload}/`;
          
          UseFetchJSON<{ status: string; data: string }>(apiUrl, 'PATCH', detail)
            .then((res) => {
              if (res.status === "success") {
                setProdSus(res.data);
                setLoadDeals(true);
              }
            })
            .catch((err) => {
              console.log(err.message);
              setProdErr("Failed to accept deal. Please try again.");
            });
        }

        return { ...state, deals: filteredDeals };
      }

      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, initialDeals);

  useEffect(() => {        
    const fetchDeals = () => {
      const apiUrl = 'http://localhost:7000/parcel_dispatch/get_dispatch_from_db/'; 
      
      UseFetchJSON<{ deals: DispatchDeal[] }>(apiUrl, 'GET')
        .then((res) => {
          getDeals(res.deals);
        })
        .catch((err) => {
          console.log(err.message);
          setProdErr("Failed to load deals. Please refresh the page.");
        });
    };

    if (loadDeals) {
      fetchDeals();
    }
    setLoadDeals(false);
  }, [getDeals, loadDeals]);

  const handleCloseAlert = () => {
    setProdSus("");
    setProdErr("");
  };

  return (
    <div className="p-4">
      {/* Error Alert */}
      {proderr && (
        <div 
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <div className="text-center">{proderr}</div>
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
      {prodsus && (
        <div 
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <div className="text-center">{prodsus}</div>
          <button 
            className="absolute top-0 right-0 px-4 py-3 hover:text-green-900"
            onClick={handleCloseAlert}
            aria-label="Close"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}
      
      {/* Deal Information */}
      <p className="text-base text-center mt-1.25 text-gray-700">
        Click 'Accept' to execute a deal
      </p>
      <p className="text-xl text-center font-bold text-gray-800 mb-6">
        There are {state.deals.length} deals available
      </p>
      
      {/* Deals List */}
      <div className="space-y-4">
        {state.deals.map((item) => (
          <div 
            key={item.order_id}
            className="flex flex-col border-[3px] border-danger w-[90%] mr-[5%] ml-[5%] mt-2.5 rounded-tr-[15px] rounded-bl-[15px] bg-white shadow-md"
          >
            <div className="flex flex-row justify-around p-2.5 flex-wrap">
              {/* Customer Info */}
              <div className="border-[2px] border-orange-500 w-full md:w-[45%] rounded-lg p-1.75 mb-4 md:mb-0">
                <strong className="text-lg text-gray-800">Customer's Info:</strong>
                <ul className="mt-2 space-y-1">
                  <li className="text-gray-700">
                    <strong className="text-gray-900">{item.customer_name}</strong>
                  </li>
                  <li className="text-gray-600">{item.address}</li>
                  <li className="text-gray-600">{item.phone_no}</li>
                  <li className="text-gray-700 mt-2">
                    <strong>Order Id: </strong>
                    <span className="text-gray-800 font-mono">{item.order_id}</span>
                  </li>
                </ul>
              </div>
              
              {/* Vendor Info */}
              <div className="border-[2px] border-orange-500 w-full md:w-[45%] rounded-lg p-1.75">
                <strong className="text-lg text-gray-800">Vendors' Info:</strong> 
                <div className="mt-2 space-y-3">
                  {item.products.map((prod) => (
                    <div key={prod.product_id} className="border-b border-gray-200 pb-2 last:border-b-0">
                      <ul className="space-y-1">
                        <li>
                          <strong className="text-gray-900">{prod.vendor_name}</strong>
                        </li>
                        <li>
                          <strong className={
                            prod.is_supply_ready 
                              ? "text-green-600" 
                              : "text-red-600"
                          }>
                            {prod.is_supply_ready ? "✓ Supply is ready" : "✗ Supply not ready"}
                          </strong>
                        </li>
                        <li className="text-gray-600">{prod.vendor_address}</li>
                        <li className="text-gray-600">{prod.vendor_phone}</li>
                        <li className="text-gray-700">
                          <strong>Order Id: </strong>
                          <span className="text-gray-800 font-mono">{prod.order_id}</span>
                        </li>
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Accept Button */}
            <div className="h-[90px] flex justify-center items-center bg-gray-50 rounded-br-[12px] rounded-bl-[12px]">
              <button 
                onClick={() => handleAcceptClick(item.order_id)} 
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-danger hover:text-white transition-colors duration-200 font-medium"
              >
                Accept Deal
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>     
  );
};

export default CourierDeals;
