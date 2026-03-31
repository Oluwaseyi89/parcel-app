import React, { useEffect, useState } from 'react';
import { UseFetchJSON } from '../useFetch';
import { useNavigate } from 'react-router-dom';

type CartProd = any;

const CustomerCart: React.FC = () => {
  const logcus = JSON.parse(localStorage.getItem('logcus') || 'null');
  const retrCart = JSON.parse(localStorage.getItem('retrCart') || 'null');
  const [retCartDetails, setRetCartDetails] = useState<CartProd[]>([]);
  const [doFetchCart, setDoFetchCart] = useState<boolean>(true);
  const navigate = useNavigate();

  const handleContinueShopping = () => {
    navigate('/cart-check');
  };

  useEffect(() => {
    if (logcus !== null) {
      const cust_name = logcus.last_name + ' ' + logcus.first_name;
      const apiUrl = `http://localhost:7000/parcel_customer/get_cart/${cust_name}/`;
      UseFetchJSON(apiUrl, 'GET').then((res) => {
        if ((res as any).status === 'success') {
          localStorage.setItem('retrCart', JSON.stringify((res as any).data));
        } else {
          localStorage.removeItem('retrCart');
        }
      });
    }
  }, [logcus]);

  useEffect(() => {
    if (doFetchCart) {
      let details: CartProd[] = [];
      if (retrCart) {
        retrCart.forEach((prod: any) => {
          const apiUrl = `http://localhost:7000/parcel_product/get_sing_prod/${prod.product_id}/`;
          UseFetchJSON(apiUrl, 'GET').then((res) => {
            if ((res as any).status === 'success') {
              details.push((res as any).data);
              details = details.map((newItem) => {
                if (newItem.id === prod.product_id) {
                  return { ...newItem, purchased_qty: prod.quantity };
                }
                return newItem;
              });
              setDoFetchCart(false);
              setRetCartDetails(details);
            }
          });
        });
      }
    }
  }, [doFetchCart, retrCart]);

  return (
    <div className="flex flex-col items-center p-6">
      {/* Cart Summary */}
      {retrCart && (
        <p className="text-center text-gray-700 text-lg mb-4">
          You have <span className="font-bold text-danger">{retrCart.length}</span> distinct products in your saved cart
        </p>
      )}
      
      {retrCart === null && (
        <div className="text-center p-8 bg-gray-50 rounded-lg w-full max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <p className="text-gray-600 mb-2">Your cart is empty</p>
          <p className="text-sm text-gray-500">
            You have no saved cart or it might have expired
          </p>
        </div>
      )}
      
      {/* Continue Shopping Button */}
      <button 
        onClick={handleContinueShopping} 
        className="text-danger text-center hover:bg-danger hover:text-white px-6 py-2 rounded border border-danger transition-colors duration-200 font-medium mb-6"
      >
        Continue Shopping
      </button>
      
      <hr className="w-full border-gray-300 my-4" />
      
      {/* Products Grid */}
      <div className="flex flex-row justify-around flex-wrap w-full">
        {retCartDetails.map((prod: CartProd) => (
          <div 
            key={prod.id}
            className="flex flex-row border-[2px] border-orange-500 rounded-2xl justify-between mb-4 w-full p-4 md:w-[390px] bg-orange-50 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            {/* Product Image */}
            <div className="h-[150px] w-[150px] mb-5 flex-shrink-0">
              <img 
                className="min-h-full min-w-full object-cover rounded-lg"
                src={prod.prod_photo} 
                alt={prod.prod_name || "product"} 
              />
            </div>
            
            {/* Product Details */}
            <div className="ml-4 flex-grow">
              <div className="space-y-2">
                <div className="text-gray-700">
                  <strong className="text-gray-900">Product: </strong> 
                  <span className="font-medium">{prod.prod_name}</span>
                </div>
                <div className="text-gray-700">
                  <strong className="text-gray-900">Model: </strong> 
                  <span className="font-mono text-sm">{prod.prod_model}</span>
                </div>
                <div className="text-gray-700">
                  <strong className="text-gray-900">Price: </strong> 
                  <span className="text-green-600 font-semibold">₦ {prod.prod_price?.toLocaleString()}</span>
                </div>
                <div className="text-gray-700">
                  <strong className="text-gray-900">Quantity: </strong> 
                  <span className="px-2 py-1 bg-gray-100 rounded text-gray-800">
                    {prod.purchased_qty}
                  </span>
                </div>
                <div className="text-gray-700">
                  <strong className="text-gray-900">Amount: </strong> 
                  <span className="text-green-600 font-bold">
                    ₦ {(prod.prod_price * prod.purchased_qty)?.toLocaleString()}
                  </span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-4 flex space-x-2">
                <button className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200">
                  Update
                </button>
                <button className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200">
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Cart Total Summary */}
      {retCartDetails.length > 0 && (
        <div className="mt-8 p-4 bg-white border border-gray-200 rounded-lg w-full max-w-2xl">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Cart Summary</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Subtotal ({retCartDetails.length} items)</span>
            <span className="font-bold text-gray-800">
              ₦ {retCartDetails.reduce((sum, prod) => sum + (prod.prod_price * prod.purchased_qty), 0)?.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Estimated Shipping</span>
            <span className="font-bold text-gray-800">₦ 2,500</span>
          </div>
          <hr className="my-3" />
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-green-600">
              ₦ {(retCartDetails.reduce((sum, prod) => sum + (prod.prod_price * prod.purchased_qty), 0) + 2500)?.toLocaleString()}
            </span>
          </div>
          <button 
            onClick={handleContinueShopping}
            className="mt-4 w-full bg-danger text-white py-3 rounded hover:bg-red-600 transition-colors duration-200 font-medium"
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerCart;
