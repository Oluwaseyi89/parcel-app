import React, { useState, useCallback, useEffect, useReducer } from 'react';
import { UseFetchJSON, UseFetch } from './useFetch';
import { Package, Truck, User, Phone, CheckCircle, XCircle, AlertCircle, X, Loader2 } from 'lucide-react';

const VendDeals: React.FC = () => {
  const [prodsus, setProdSus] = useState('');
  const [proderr, setProdErr] = useState('');
  const [loadDeals, setLoadDeals] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const logvend = JSON.parse(localStorage.getItem('logvend') || 'null');

  const initialDeals = { deals: [] as any[] };

  const getDeals = useCallback((data: any) => {
    return dispatch({ type: 'GET_DEALS', payload: data });
  }, []);

  const handleSupplyReadyClick = (e: any, order_id: any, product_id: any) => {
    setIsLoading(true);
    dispatch({ type: 'SUPPLY_READY', payload: { e, order_id, product_id } });
    setTimeout(() => setIsLoading(false), 500);
  };

  const reducer = (state = initialDeals, action: any) => {
    if (action.type === 'GET_DEALS') {
      const vendDealCollectn: any[] = [];
      action.payload.forEach((deal: any) => {
        deal.products.forEach((prod: any) => {
          if (prod.vendor_phone === logvend.phone_no && !prod.is_received) vendDealCollectn.push(prod);
        });
      });
      const modDealColl: any[] = [];
      vendDealCollectn.forEach((deal) => {
        action.payload.forEach((mod: any) => {
          if (mod.order_id === deal.order_id) {
            modDealColl.push({ ...deal, handled_dispatch: mod.handled_dispatch, courier_name: mod.courier_name, courier_phone: mod.courier_phone });
          }
        });
      });
      return { ...state, deals: modDealColl };
    }
    if (action.type === 'SUPPLY_READY') {
      const newState = state.deals.map((item: any) => {
        if (item.order_id === action.payload.order_id && item.product_id === action.payload.product_id) {
          const order_id = action.payload.order_id;
          const product_id = action.payload.product_id;
          const e = action.payload.e;
          const checked = e.target.checked;
          item.is_supply_ready = checked;
          const formData = new FormData();
          formData.append('is_supply_ready', checked);
          formData.append('updated_at', new Date().toISOString());
          const apUrl = `http://localhost:7000/parcel_dispatch/update_supplied_product/${order_id}/${product_id}/`;
          UseFetch(apUrl, 'POST', formData)
            .then((res: any) => {
              if (res.status === 'success') {
                setProdSus(res.data);
                setTimeout(() => setProdSus(''), 3000);
              }
            })
            .catch((err: any) => {
              console.log(err.message);
              setProdErr('Failed to update supply status');
              setTimeout(() => setProdErr(''), 3000);
            });
          return item;
        }
        return { ...item };
      });
      return { ...state, deals: newState };
    }
    return state;
  };

  useEffect(() => {
    const fetchDeals = () => {
      setIsLoading(true);
      const apiUrl = 'http://localhost:7000/parcel_dispatch/get_dispatch_from_db/';
      UseFetchJSON(apiUrl, 'GET')
        .then((res: any) => {
          const deals = res.deals;
          getDeals(deals);
        })
        .catch((err: any) => {
          console.log(err.message);
          setProdErr('Failed to load deals');
        })
        .finally(() => {
          setIsLoading(false);
          setLoadDeals(false);
        });
    };
    if (loadDeals) fetchDeals();
  }, [getDeals, loadDeals]);

  const [state, dispatch] = useReducer(reducer, initialDeals as any);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[rgb(219,33,76)] mb-2">Supply Deals Management</h1>
          <p className="text-gray-600">Manage your product supplies and track delivery status</p>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Deals Overview</h2>
              <div className="flex items-center">
                <div className="w-2 h-6 bg-[rgb(219,33,76)] rounded-full mr-3"></div>
                <p className="text-lg font-semibold text-gray-700">
                  There are <span className="text-[rgb(219,33,76)]">{state.deals.length}</span> supply deals available
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center">
              <Package className="w-8 h-8 text-[rgb(219,33,76)] mr-2" />
              <div className="text-right">
                <p className="text-sm text-gray-600">Active Supplies</p>
                <p className="text-2xl font-bold text-gray-800">{state.deals.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* API Alerts */}
        {proderr && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800 font-medium">{proderr}</p>
              </div>
              <button 
                onClick={() => setProdErr('')}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {prodsus && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-green-800 font-medium">{prodsus}</p>
              </div>
              <button 
                onClick={() => setProdSus('')}
                className="text-green-600 hover:text-green-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && state.deals.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-[rgb(219,33,76)] animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading supply deals...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Empty State */}
            {state.deals.length === 0 && !isLoading ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Supply Deals Available</h3>
                <p className="text-gray-600 mb-6">You don't have any active supply deals at the moment.</p>
                <div className="text-sm text-gray-500">
                  <p>When customers purchase your products, they'll appear here.</p>
                </div>
              </div>
            ) : (
              /* Deals Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.deals.map((item: any) => (
                  <div 
                    key={item.order_id + item.product_id} 
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                  >
                    {/* Product Image */}
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      <img 
                        src={item.prod_photo} 
                        alt={item.product_name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-[rgb(219,33,76)] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                          Order #{item.order_id}
                        </span>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="p-6">
                      <h3 className="font-bold text-gray-800 text-lg mb-2 truncate">{item.product_name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{item.prod_model}</p>

                      {/* Order Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Quantity</span>
                          <span className="font-semibold text-gray-800">{item.quantity} units</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Price per unit</span>
                          <span className="font-semibold text-gray-800">₦{Number(item.prod_price).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total Amount</span>
                          <span className="font-bold text-lg text-[rgb(219,33,76)]">₦{Number(item.total_amount).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Courier Information */}
                      <div className="border-t border-gray-100 pt-4 mb-4">
                        <div className="flex items-center mb-3">
                          <Truck className="w-5 h-5 text-gray-500 mr-2" />
                          <h4 className="font-semibold text-gray-700">Courier Details</h4>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-700">
                              <strong className="text-gray-600">Courier: </strong>
                              {item.courier_name === '000' ? 'No Courier yet' : item.courier_name}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-700">
                              <strong className="text-gray-600">Phone: </strong>
                              {item.courier_phone === '000' ? 'No Courier yet' : item.courier_phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Indicators */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className={`rounded-lg p-3 text-center ${item.is_supply_received ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                          <div className="flex items-center justify-center mb-1">
                            {item.is_supply_received ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-yellow-600" />
                            )}
                          </div>
                          <p className="text-xs font-medium text-gray-700">Courier Status</p>
                          <p className={`text-sm font-semibold ${item.is_supply_received ? 'text-green-600' : 'text-yellow-600'}`}>
                            {item.is_supply_received ? 'Received' : 'Pending'}
                          </p>
                        </div>
                        <div className={`rounded-lg p-3 text-center ${item.is_received ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                          <div className="flex items-center justify-center mb-1">
                            {item.is_received ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-yellow-600" />
                            )}
                          </div>
                          <p className="text-xs font-medium text-gray-700">Customer Status</p>
                          <p className={`text-sm font-semibold ${item.is_received ? 'text-green-600' : 'text-yellow-600'}`}>
                            {item.is_received ? 'Received' : 'Pending'}
                          </p>
                        </div>
                      </div>

                      {/* Supply Ready Toggle */}
                      <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${item.is_supply_ready ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className="text-sm font-medium text-gray-700">
                              Ready for supply
                            </span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              onChange={(e) => handleSupplyReadyClick(e, item.order_id, item.product_id)}
                              checked={item.is_supply_ready}
                              className="sr-only peer"
                              disabled={isLoading}
                            />
                            <div className={`w-11 h-6 rounded-full peer ${item.is_supply_ready ? 'bg-[rgb(219,33,76)]' : 'bg-gray-300'} peer-focus:ring-2 peer-focus:ring-[rgb(219,33,76)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Mark when product is ready for courier pickup
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Legend */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-bold text-gray-800 mb-4 text-lg">Status Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-700">Courier Received - Courier has picked up the product</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
              <span className="text-sm text-gray-700">Pending - Awaiting action</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-sm text-gray-700">Customer Received - Product delivered to customer</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[rgb(219,33,76)] mr-2"></div>
              <span className="text-sm text-gray-700">Ready for Supply - Product prepared for courier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendDeals;
