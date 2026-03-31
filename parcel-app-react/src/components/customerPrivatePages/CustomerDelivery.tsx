import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { UseFetchJSON } from '../useFetch';

type DeliveryProduct = {
  order_id: number;
  product_id: number;
  product_name?: string;
  prod_model?: string;
  prod_photo?: string;
  prod_price?: number;
  quantity?: number;
  total_amount?: number;
  is_supply_ready?: boolean;
  is_supply_received?: boolean;
  is_delivered?: boolean;
  is_received?: boolean;
};

type Delivery = {
  order_id: number;
  courier_name?: string;
  courier_phone?: string;
  total_items?: number;
  total_price?: number;
  is_delivered?: boolean;
  products: DeliveryProduct[];
  email?: string;
};

type DeliveryState = { deliveries: Delivery[] };

const initialDeliveries: DeliveryState = { deliveries: [] };

const CustomerDelivery: React.FC = () => {
  const loggedCus = JSON.parse(localStorage.getItem('logcus') || 'null');
  const [prodsus, setProdSus] = useState<string>('');
  const [proderr, setProdErr] = useState<string>('');
  const [doFetch, setDoFetch] = useState<boolean>(true);

  const reducer = (state: DeliveryState, action: any): DeliveryState => {
    switch (action.type) {
      case 'GET_DISPATCHABLES': {
        const setData = action.payload.filter((data: Delivery) => data.email === loggedCus.email);
        const pendData = setData.map((each: Delivery) => {
          const pendProd = each.products.filter((it) => it.is_received === false);
          if (pendProd.length === 0) {
            const apiUrl = `http://localhost:7000/parcel_dispatch/update_dispatch/${each.order_id}/`;
            const orderUrl = `http://localhost:7000/parcel_order/update_order_dispatched/${each.order_id}/`;
            const detail = { is_delivered: true, is_received: true, updated_at: new Date().toISOString() };
            const updateData = { is_dispatched: true, updated_at: new Date().toISOString() };
            UseFetchJSON(apiUrl, 'PATCH', detail)
              .then((res: any) => {
                if (res.status === 'success') {
                  UseFetchJSON(orderUrl, 'PATCH', updateData)
                    .then((res2: any) => {
                      if (res2.status === 'success') console.log(res2.data);
                    })
                    .catch((err: any) => console.log(err.message));
                  return { ...each, is_received: true, is_delivered: true } as Delivery;
                }
              })
              .catch((err: any) => setProdErr(err.message));
            return each;
          }
          return each;
        });
        const usable = pendData.filter((ite) => ite.is_received === false);
        return { ...state, deliveries: usable };
      }
      case 'SUBMIT_SUPPLY_RECEIVED': {
        const newState = state.deliveries.map((item) => {
          if (item.order_id === action.payload.order_id) {
            const newProducts = item.products.map((prod) => {
              if (prod.product_id === action.payload.product_id) {
                const e = action.payload.e;
                const checked = e.target.checked;
                const detail = { is_received: checked, updated_at: new Date().toISOString() };
                const apiUrl = `http://localhost:7000/parcel_dispatch/update_dispatched_product/${action.payload.order_id}/${action.payload.product_id}/`;
                UseFetchJSON(apiUrl, 'PATCH', detail)
                  .then((res: any) => {
                    if (res.status === 'success') {
                      setProdSus(res.data);
                      setDoFetch(true);
                    }
                  })
                  .catch((err: any) => console.log(err.message));
                return { ...prod, is_received: checked } as DeliveryProduct;
              }
              return { ...prod } as DeliveryProduct;
            });
            return { ...item, products: newProducts } as Delivery;
          }
          return { ...item } as Delivery;
        });
        return { ...state, deliveries: newState };
      }
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, initialDeliveries);

  const getDispatchables = useCallback((data: Delivery[]) => dispatch({ type: 'GET_DISPATCHABLES', payload: data }), [dispatch]);

  const handleSupplyReceived = (e: React.ChangeEvent<HTMLInputElement>, order_id: number, product_id: number) => dispatch({ type: 'SUBMIT_SUPPLY_RECEIVED', payload: { e, order_id, product_id } });

  useEffect(() => {
    const fetchDispatchable = () => {
      const apiUrl = 'http://localhost:7000/parcel_dispatch/get_dispatch_from_db/';
      UseFetchJSON(apiUrl, 'GET')
        .then((res: any) => {
          const deals = res.deals;
          getDispatchables(deals);
        })
        .catch((err: any) => console.log(err.message));
    };
    if (doFetch) {
      fetchDispatchable();
      setDoFetch(false);
    }
  }, [getDispatchables, doFetch]);

  const handleCloseAlert = () => {
    setProdErr('');
    setProdSus('');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <p className="text-center font-bold mt-2.5 text-lg text-gray-800 mb-6">
        You have <span className="text-danger">{state.deliveries.length}</span> expected order{state.deliveries.length !== 1 ? 's' : ''} to receive
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

      {/* Empty State */}
      {state.deliveries.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <p className="text-gray-600 mb-2">No pending deliveries</p>
          <p className="text-sm text-gray-500">
            All your orders have been received or are being processed
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {state.deliveries.map((item) => (
            <div 
              key={item.order_id}
              className="border-[3px] border-danger w-full rounded-tr-[15px] rounded-bl-[15px] bg-white shadow-md p-6"
            >
              {/* Order Header */}
              <div className="flex flex-col md:flex-row justify-around items-center h-20 mt-5 mb-5 border-b border-red-800 pb-4">
                <div className="text-gray-700 mb-2 md:mb-0">
                  <strong className="text-gray-900">Order Id: </strong>
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{item.order_id}</span>
                </div>
                <div className="text-gray-700 mb-2 md:mb-0">
                  <strong className="text-gray-900">Courier: </strong>
                  {item.courier_name === '000' ? (
                    <span className="text-yellow-600 font-medium">Awaiting Courier</span>
                  ) : (
                    <span className="font-medium">{item.courier_name}</span>
                  )}
                </div>
                <div className="text-gray-700 mb-2 md:mb-0">
                  <strong className="text-gray-900">Phone: </strong>
                  {item.courier_phone === '000' ? (
                    <span className="text-yellow-600">N/A</span>
                  ) : (
                    <span>{item.courier_phone}</span>
                  )}
                </div>
                <div className="text-gray-700 mb-2 md:mb-0">
                  <strong className="text-gray-900">Total Items: </strong>
                  <span className="font-bold">{item.total_items}</span>
                </div>
                <div className="text-gray-700 mb-2 md:mb-0">
                  <strong className="text-gray-900">Total Amount: </strong>
                  <span className="text-green-600 font-semibold">₦ {item.total_price?.toLocaleString()}</span>
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
              
              {/* Products Grid */}
              <div className="flex flex-row justify-around flex-wrap">
                {item.products.map((prod) => (
                  <div 
                    key={`${prod.order_id}-${prod.product_id}`}
                    className="flex flex-row border-[2px] border-orange-500 rounded-2xl justify-between mb-4 w-full p-4 md:w-[390px] bg-orange-50"
                  >
                    {/* Product Image */}
                    <div className="h-[150px] w-[150px] mb-5 flex-shrink-0">
                      <img 
                        className="min-h-full min-w-full object-cover rounded-lg"
                        src={prod.prod_photo} 
                        alt={prod.product_name || "product"} 
                      />
                    </div>
                    
                    {/* Product Details */}
                    <div className="ml-4 flex-grow">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        {/* Status Indicators */}
                        <div className={
                          prod.is_supply_ready 
                            ? 'text-green-600 font-semibold' 
                            : 'text-red-600 font-semibold'
                        }>
                          <strong className="text-gray-900">Vendor: </strong>
                          {prod.is_supply_ready ? "✓ Supplied" : "⏳ Pending"}
                        </div>
                        
                        <div className={
                          prod.is_supply_received 
                            ? 'text-green-600 font-semibold' 
                            : 'text-red-600 font-semibold'
                        }>
                          <strong className="text-gray-900">Courier: </strong>
                          {prod.is_supply_received ? "✓ Received" : "⏳ Pending"}
                        </div>
                        
                        <div className={
                          prod.is_delivered 
                            ? 'text-green-600 font-semibold' 
                            : 'text-red-600 font-semibold'
                        }>
                          <strong className="text-gray-900">Delivery: </strong>
                          {prod.is_delivered ? "✓ Delivered" : "⏳ Pending"}
                        </div>
                        
                        {/* Product Details */}
                        <div className="text-gray-700">
                          <strong className="text-gray-900">Order Id: </strong>
                          <span className="font-mono text-sm">{prod.order_id}</span>
                        </div>
                        <div className="text-gray-700 sm:col-span-2">
                          <strong className="text-gray-900">Product: </strong>
                          <span className="font-medium">{prod.product_name}</span>
                        </div>
                        <div className="text-gray-700">
                          <strong className="text-gray-900">Model: </strong>
                          <span className="font-mono text-sm">{prod.prod_model}</span>
                        </div>
                        <div className="text-gray-700">
                          <strong className="text-gray-900">Price: </strong>
                          <span className="text-green-600">₦ {prod.prod_price?.toLocaleString()}</span>
                        </div>
                        <div className="text-gray-700">
                          <strong className="text-gray-900">Qty: </strong>
                          <span className="px-2 py-1 bg-gray-100 rounded">{prod.quantity}</span>
                        </div>
                        <div className="text-gray-700">
                          <strong className="text-gray-900">Amount: </strong>
                          <span className="text-green-600 font-semibold">₦ {prod.total_amount?.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {/* Receive Checkbox */}
                      <div className="flex items-center space-x-2 bg-white p-3 rounded border border-gray-200">
                        <strong className="text-gray-900">Mark as Received: </strong>
                        <input 
                          type="checkbox" 
                          checked={!!prod.is_received} 
                          onChange={(e) => handleSupplyReceived(e, prod.order_id, prod.product_id)}
                          className="w-5 h-5 text-danger border-gray-300 rounded focus:ring-danger"
                          disabled={!prod.is_delivered}
                          title={prod.is_delivered ? "Mark as received" : "Wait for delivery"}
                        />
                        {!prod.is_delivered && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Available after delivery)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Order Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3">Order Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded shadow-sm">
                    <div className="text-2xl font-bold text-gray-800">{item.products.length}</div>
                    <div className="text-sm text-gray-600">Products</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded shadow-sm">
                    <div className="text-2xl font-bold text-green-600">
                      {item.products.filter(p => p.is_received).length}
                    </div>
                    <div className="text-sm text-gray-600">Received</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded shadow-sm">
                    <div className="text-2xl font-bold text-yellow-600">
                      {item.products.filter(p => p.is_delivered && !p.is_received).length}
                    </div>
                    <div className="text-sm text-gray-600">Delivered</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded shadow-sm">
                    <div className="text-2xl font-bold text-red-600">
                      {item.products.filter(p => !p.is_delivered).length}
                    </div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerDelivery;
