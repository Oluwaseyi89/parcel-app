import React, { useState } from 'react';

type Order = {
  id: number;
  orderNumber: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: number;
  total: number;
  customer: string;
  paymentMethod: string;
  trackingNumber?: string;
  itemsList: {
    name: string;
    quantity: number;
    price: number;
    image: string;
  }[];
};

const CustomerOrder: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 1,
      orderNumber: 'ORD-78945',
      date: '2024-01-15',
      status: 'delivered',
      items: 3,
      total: 125000,
      customer: 'John Smith',
      paymentMethod: 'Credit Card',
      trackingNumber: 'TRK-789456123',
      itemsList: [
        { name: 'iPhone 15 Pro', quantity: 1, price: 105000, image: 'https://via.placeholder.com/60x60?text=iPhone' },
        { name: 'AirPods Pro', quantity: 1, price: 15000, image: 'https://via.placeholder.com/60x60?text=AirPods' },
        { name: 'Phone Case', quantity: 1, price: 5000, image: 'https://via.placeholder.com/60x60?text=Case' },
      ],
    },
    {
      id: 2,
      orderNumber: 'ORD-78946',
      date: '2024-01-14',
      status: 'shipped',
      items: 2,
      total: 75000,
      customer: 'John Smith',
      paymentMethod: 'PayPal',
      trackingNumber: 'TRK-789456124',
      itemsList: [
        { name: 'MacBook Air', quantity: 1, price: 70000, image: 'https://via.placeholder.com/60x60?text=MacBook' },
        { name: 'USB-C Hub', quantity: 1, price: 5000, image: 'https://via.placeholder.com/60x60?text=Hub' },
      ],
    },
    {
      id: 3,
      orderNumber: 'ORD-78947',
      date: '2024-01-13',
      status: 'processing',
      items: 1,
      total: 45000,
      customer: 'John Smith',
      paymentMethod: 'Bank Transfer',
      itemsList: [
        { name: 'iPad Air', quantity: 1, price: 45000, image: 'https://via.placeholder.com/60x60?text=iPad' },
      ],
    },
    {
      id: 4,
      orderNumber: 'ORD-78948',
      date: '2024-01-12',
      status: 'pending',
      items: 4,
      total: 185000,
      customer: 'John Smith',
      paymentMethod: 'Credit Card',
      itemsList: [
        { name: 'Samsung TV 55"', quantity: 1, price: 150000, image: 'https://via.placeholder.com/60x60?text=TV' },
        { name: 'Soundbar', quantity: 1, price: 25000, image: 'https://via.placeholder.com/60x60?text=Sound' },
        { name: 'HDMI Cable', quantity: 2, price: 5000, image: 'https://via.placeholder.com/60x60?text=Cable' },
      ],
    },
    {
      id: 5,
      orderNumber: 'ORD-78949',
      date: '2024-01-10',
      status: 'cancelled',
      items: 2,
      total: 35000,
      customer: 'John Smith',
      paymentMethod: 'Credit Card',
      itemsList: [
        { name: 'Wireless Mouse', quantity: 1, price: 15000, image: 'https://via.placeholder.com/60x60?text=Mouse' },
        { name: 'Keyboard', quantity: 1, price: 20000, image: 'https://via.placeholder.com/60x60?text=Keyboard' },
      ],
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'items'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const getStatusColor = (status: Order['status']) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch(status) {
      case 'pending': return '⏳';
      case 'processing': return '⚙️';
      case 'shipped': return '🚚';
      case 'delivered': return '✅';
      case 'cancelled': return '❌';
      default: return '📦';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦ ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredOrders = orders
    .filter(order => filterStatus === 'all' || order.status === filterStatus)
    .sort((a, b) => {
      let aValue: number | string = a[sortBy];
      let bValue: number | string = b[sortBy];
      
      if (sortBy === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const toggleOrderDetails = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleReorder = (orderId: number) => {
    // In a real app, this would trigger a reorder action
    alert(`Reorder initiated for order ${orderId}`);
  };

  const handleCancelOrder = (orderId: number) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: 'cancelled' } : order
      ));
    }
  };

  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          My Orders
        </h1>
        <p className="text-gray-600">
          Track and manage your purchase history
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl font-bold text-gray-800">{orders.length}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl font-bold text-green-600">{formatCurrency(totalSpent)}</div>
          <div className="text-sm text-gray-600">Total Spent</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl font-bold text-blue-600">{formatCurrency(averageOrderValue)}</div>
          <div className="text-sm text-gray-600">Avg. Order Value</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl font-bold text-purple-600">
            {orders.filter(o => o.status === 'delivered').length}
          </div>
          <div className="text-sm text-gray-600">Delivered Orders</div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                filterStatus === 'all'
                  ? 'bg-danger text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Orders ({orders.length})
            </button>
            {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  filterStatus === status
                    ? 'bg-danger text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({orders.filter(o => o.status === status).length})
              </button>
            ))}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">Sort by:</div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
            >
              <option value="date">Date</option>
              <option value="total">Total Amount</option>
              <option value="items">Items Count</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors duration-200"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {filterStatus === 'all' 
                ? "You haven't placed any orders yet."
                : `No ${filterStatus} orders found.`}
            </p>
            <button className="mt-4 px-6 py-2 bg-danger text-white rounded hover:bg-red-600 transition-colors duration-200">
              Start Shopping
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Order Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-bold text-gray-800">{order.orderNumber}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">
                      Placed on {formatDate(order.date)} • {order.items} item{order.items !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">{formatCurrency(order.total)}</div>
                    <p className="text-sm text-gray-600">{order.paymentMethod}</p>
                  </div>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  {order.itemsList.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        <div className="text-xs text-gray-500">Item {index + 1}</div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.quantity} × {formatCurrency(item.price)}</p>
                      </div>
                    </div>
                  ))}
                  {order.itemsList.length > 3 && (
                    <div className="text-gray-500">
                      +{order.itemsList.length - 3} more items
                    </div>
                  )}
                </div>
              </div>

              {/* Order Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center space-x-4">
                    {order.trackingNumber && (
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span className="text-sm text-gray-600">
                          Tracking: <span className="font-mono">{order.trackingNumber}</span>
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => toggleOrderDetails(order.id)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {expandedOrder === order.id ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleReorder(order.id)}
                      className="px-4 py-2 bg-white border border-danger text-danger rounded hover:bg-red-50 transition-colors duration-200"
                      disabled={order.status === 'cancelled'}
                    >
                      Reorder
                    </button>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
                      >
                        Cancel Order
                      </button>
                    )}
                    <button className="px-4 py-2 bg-danger text-white rounded hover:bg-red-600 transition-colors duration-200">
                      Track Order
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Order Details */}
              {expandedOrder === order.id && (
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <h4 className="font-bold text-gray-800 mb-4">Order Details</h4>
                  <div className="space-y-4">
                    {order.itemsList.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <div className="text-xs text-gray-500">Item</div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{item.name}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">{formatCurrency(item.price * item.quantity)}</p>
                          <p className="text-sm text-gray-600">{formatCurrency(item.price)} each</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div className="text-gray-600">Subtotal</div>
                      <div className="font-medium">{formatCurrency(order.total)}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-gray-600">Shipping</div>
                      <div className="font-medium">₦ 2,500</div>
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg">
                      <div>Total</div>
                      <div>{formatCurrency(order.total + 2500)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary Section */}
      {filteredOrders.length > 0 && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4">Order Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-gray-800">{filteredOrders.length}</div>
              <div className="text-sm text-gray-600">Filtered Orders</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(filteredOrders.reduce((sum, order) => sum + order.total, 0))}
              </div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-blue-600">
                {filteredOrders.reduce((sum, order) => sum + order.items, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(filteredOrders.reduce((sum, order) => sum + order.total, 0) / filteredOrders.length)}
              </div>
              <div className="text-sm text-gray-600">Avg. Order</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredOrders.filter(o => o.status === 'pending' || o.status === 'processing').length}
              </div>
              <div className="text-sm text-gray-600">Active Orders</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrder;
