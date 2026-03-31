import { useState, useEffect, useReducer, useCallback, ChangeEvent } from 'react';

// Define TypeScript interfaces
interface VendorProduct {
  product_id: string | number;
  vendor_name: string;
  vendor_phone: string;
  vendor_address: string;
  order_id: string;
  product_name: string;
  prod_model: string;
  prod_price: number;
  quantity: number;
  total_amount: number;
  prod_photo: string;
  is_supply_ready: boolean;
  is_supply_received: boolean;
  is_received: boolean;
  is_delivered: boolean;
}

interface DispatchDeal {
  order_id: string;
  customer_name: string;
  address: string;
  phone_no: string;
  courier_email: string;
  total_items: number;
  total_price: number;
  is_delivered: boolean;
  is_received: boolean;
  products: VendorProduct[];
}

interface CourierData {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_no?: string;
}

interface DispatchState {
  dispatchables: DispatchDeal[];
}

type ActionPayloads = 
  | { type: "GET_DISPATCHABLES"; payload: DispatchDeal[] }
  | { 
      type: "SUBMIT_IS_DELIVERED"; 
      payload: { 
        e: ChangeEvent<HTMLInputElement>; 
        order_id: string; 
        product_id: string | number; 
      } 
    }
  | { 
      type: "SUBMIT_SUPPLY_RECEIVED"; 
      payload: { 
        e: ChangeEvent<HTMLInputElement>; 
        order_id: string; 
        product_id: string | number; 
      } 
    };

// Custom fetch functions with typing (assuming these exist in useFetch)
interface UseFetchJSON {
  <T>(url: string, method?: string, body?: any): Promise<T>;
}

interface UseFetch {
  <T>(url: string, method?: string, body?: FormData): Promise<T>;
}

// Assuming these are imported from './useFetch'
declare const UseFetchJSON: UseFetchJSON;
declare const UseFetch: UseFetch;

const CourierDispatch = () => {
  const [prodsus, setProdSus] = useState<string>('');
  const [proderr, setProdErr] = useState<string>('');

  const loggedCour: CourierData | null = JSON.parse(
    localStorage.getItem('logcour') || 'null'
  );

  const initialDispatchables: DispatchState = {
    dispatchables: []
  };

  const getDispatchables = useCallback((data: DispatchDeal[]) => {
    return dispatch({
      type: "GET_DISPATCHABLES",
      payload: data
    });
  }, []);

  const handleIsDelivered = (
    e: ChangeEvent<HTMLInputElement>, 
    order_id: string, 
    product_id: string | number
  ) => {
    return dispatch({
      type: "SUBMIT_IS_DELIVERED",
      payload: { e, order_id, product_id }
    });
  };

  const handleSupplyReceived = (
    e: ChangeEvent<HTMLInputElement>, 
    order_id: string, 
    product_id: string | number
  ) => {
    return dispatch({
      type: "SUBMIT_SUPPLY_RECEIVED",
      payload: { e, order_id, product_id }
    });
  };

  const reducer = (state: DispatchState, action: ActionPayloads): DispatchState => {
    switch (action.type) {
      case "GET_DISPATCHABLES": {
        if (!loggedCour) return state;
        
        const setData = action.payload.filter(
          (data) => data.courier_email === loggedCour.email && !data.is_received
        );
        return { ...state, dispatchables: setData };
      }

      case "SUBMIT_IS_DELIVERED": {
        const { e, order_id, product_id } = action.payload;
        const checked = e.target.checked;

        const newDispatchables = state.dispatchables.map((item) => {
          if (item.order_id === order_id) {
            const updatedProducts = item.products.map((prod) => {
              if (prod.product_id === product_id) {
                const detail = {
                  is_delivered: checked,
                  updated_at: new Date().toISOString()
                };
                
                const apiUrl = `http://localhost:7000/parcel_dispatch/update_dispatched_product/${order_id}/${product_id}/`;
                
                UseFetchJSON<{ status: string; data: string }>(apiUrl, 'PATCH', detail)
                  .then((res) => {
                    if (res.status === 'success') {
                      setProdSus(res.data);
                    }
                  })
                  .catch((err) => {
                    console.log(err.message);
                    setProdErr('Failed to update delivery status');
                  });

                return { ...prod, is_delivered: checked };
              }
              return prod;
            });
            
            return { ...item, products: updatedProducts };
          }
          return item;
        });

        return { ...state, dispatchables: newDispatchables };
      }

      case "SUBMIT_SUPPLY_RECEIVED": {
        const { e, order_id, product_id } = action.payload;
        const checked = e.target.checked;

        const newDispatchables = state.dispatchables.map((item) => {
          if (item.order_id === order_id) {
            const updatedProducts = item.products.map((prod) => {
              if (prod.product_id === product_id) {
                const formData = new FormData();
                formData.append("is_supply_received", checked.toString());
                formData.append("updated_at", new Date().toISOString());
                
                const apiUrl = `http://localhost:7000/parcel_dispatch/update_received_product/${order_id}/${product_id}/`;
                
                UseFetch<{ status: string; data: string }>(apiUrl, 'POST', formData)
                  .then((res) => {
                    if (res.status === 'success') {
                      setProdSus(res.data);
                    }
                  })
                  .catch((err) => {
                    console.log(err.message);
                    setProdErr('Failed to update supply status');
                  });

                return { ...prod, is_supply_received: checked };
              }
              return prod;
            });
            
            return { ...item, products: updatedProducts };
          }
          return item;
        });

        return { ...state, dispatchables: newDispatchables };
      }

      default:
        return state;
    }
  };

  useEffect(() => {
    const fetchDispatchable = () => {
      const apiUrl = 'http://localhost:7000/parcel_dispatch/get_dispatch_from_db/'; 
      
      UseFetchJSON<{ deals: DispatchDeal[] }>(apiUrl, 'GET')
        .then((res) => {
          getDispatchables(res.deals);
        })
        .catch((err) => {
          console.log(err.message);
          setProdErr('Failed to load dispatch data');
        });
    };

    fetchDispatchable();
  }, [getDispatchables]);

  const [state, dispatch] = useReducer(reducer, initialDispatchables);

  const handleCloseAlert = () => {
    setProdSus('');
    setProdErr('');
  };

  return (
    <div className="p-4">
      {/* Header */}
      <p className="text-center font-bold mt-2.5 text-lg text-gray-800">
        You have {state.dispatchables.length} Orders to dispatch
      </p>

      {/* Error Alert */}
      {proderr && (
        <div 
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4"
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
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative my-4"
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
      
      {/* Dispatch Items */}
      <div className="space-y-5">
        {state.dispatchables.map((item) => (
          <div 
            key={item.order_id}
            className="border-[3px] border-danger w-full mt-5 rounded-tr-[15px] rounded-bl-[15px] pl-[2%] pr-[2%] bg-white shadow-md p-4"
          >
            {/* Customer Details */}
            <div className="flex flex-col md:flex-row justify-around items-center h-20 mt-5 mb-5 border-b border-red-800 pb-4">
              <div className="text-gray-700 mb-2 md:mb-0">
                <strong className="text-gray-900">Customer: </strong>{item.customer_name}
              </div>
              <div className="text-gray-700 mb-2 md:mb-0">
                <strong className="text-gray-900">Address: </strong>{item.address}
              </div>
              <div className="text-gray-700 mb-2 md:mb-0">
                <strong className="text-gray-900">Phone: </strong>{item.phone_no}
              </div>
              <div className="text-gray-700 mb-2 md:mb-0">
                <strong className="text-gray-900">Total Items: </strong>{item.total_items}
              </div>
              <div className="text-gray-700 mb-2 md:mb-0">
                <strong className="text-gray-900">Total Amount: </strong> 
                <span className="text-green-600 font-semibold">₦ {item.total_price.toLocaleString()}</span>
              </div>
              <div className={
                item.is_delivered 
                  ? "text-green-600 font-semibold" 
                  : "text-red-600 font-semibold"
              }>
                <strong className="text-gray-900">Status: </strong>
                {item.is_delivered ? "✓ Delivered" : "⏳ Pending"}
              </div>
            </div>
            
            {/* Products Details */}
            <div className="flex flex-row justify-around flex-wrap">
              {item.products.map((prod) => (
                <div 
                  key={prod.product_id}
                  className="flex flex-row border-[2px] border-orange-500 rounded-2xl justify-between mb-4 w-full pl-0.25 pr-0.25 p-3 md:w-[390px] bg-orange-50"
                >
                  {/* Product Image */}
                  <div className="h-[150px] w-[150px] mb-5 flex-shrink-0">
                    <img 
                      className="min-h-full min-w-full object-cover rounded-lg"
                      src={prod.prod_photo} 
                      alt={prod.product_name} 
                    />
                  </div>
                  
                  {/* Product Info */}
                  <div className="ml-3 flex-grow">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="text-gray-700">
                        <strong className="text-gray-900">Vendor: </strong> {prod.vendor_name}
                      </div>
                      <div className="text-gray-700">
                        <strong className="text-gray-900">Phone: </strong> {prod.vendor_phone}
                      </div>
                      <div className="text-gray-700 sm:col-span-2">
                        <strong className="text-gray-900">Address: </strong> {prod.vendor_address}
                      </div>
                      <div className="text-gray-700">
                        <strong className="text-gray-900">Order Id: </strong> 
                        <span className="font-mono text-sm">{prod.order_id}</span>
                      </div>
                      <div className="text-gray-700">
                        <strong className="text-gray-900">Product: </strong> {prod.product_name}
                      </div>
                      <div className="text-gray-700">
                        <strong className="text-gray-900">Model: </strong> {prod.prod_model}
                      </div>
                      <div className="text-gray-700">
                        <strong className="text-gray-900">Price: </strong> 
                        <span className="text-green-600">₦ {prod.prod_price.toLocaleString()}</span>
                      </div>
                      <div className="text-gray-700">
                        <strong className="text-gray-900">Qty: </strong> {prod.quantity}
                      </div>
                      <div className="text-gray-700">
                        <strong className="text-gray-900">Amount: </strong> 
                        <span className="text-green-600 font-semibold">₦ {prod.total_amount.toLocaleString()}</span>
                      </div>
                      
                      {/* Status Indicators */}
                      <div className={
                        prod.is_supply_ready 
                          ? 'text-green-600 font-semibold' 
                          : 'text-red-600 font-semibold'
                      }>
                        <strong className="text-gray-900">Supply Status: </strong>
                        {prod.is_supply_ready ? "✓ Ready" : "⏳ Pending"}
                      </div>
                      
                      {/* Checkboxes */}
                      <div className="flex items-center space-x-2">
                        <strong className="text-gray-900">I received supply: </strong>
                        <input 
                          onChange={(e) => handleSupplyReceived(e, prod.order_id, prod.product_id)} 
                          type="checkbox" 
                          checked={prod.is_supply_received || false}
                          className="w-4 h-4 text-danger border-gray-300 rounded focus:ring-danger"
                        />
                      </div>
                      
                      <div className={
                        prod.is_received 
                          ? 'text-green-600 font-semibold' 
                          : 'text-red-600 font-semibold'
                      }>
                        <strong className="text-gray-900">Customer Response: </strong>
                        {prod.is_received ? "✓ Received" : "⏳ Pending"}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <strong className="text-gray-900">I delivered this: </strong>
                        <input 
                          onChange={(e) => handleIsDelivered(e, prod.order_id, prod.product_id)} 
                          type="checkbox" 
                          checked={prod.is_delivered || false}
                          className="w-4 h-4 text-danger border-gray-300 rounded focus:ring-danger"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourierDispatch;
