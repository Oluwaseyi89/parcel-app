import React, { useState } from 'react';

type Notification = {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  icon: string;
};

const CustomerNotification: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'Order Shipped',
      message: 'Your order #ORD-78945 has been shipped and is on its way.',
      time: '10 minutes ago',
      type: 'success',
      read: false,
      icon: '🚚',
    },
    {
      id: 2,
      title: 'Payment Received',
      message: 'Payment for order #ORD-78945 has been successfully processed.',
      time: '2 hours ago',
      type: 'success',
      read: false,
      icon: '💰',
    },
    {
      id: 3,
      title: 'Delivery Update',
      message: 'Your delivery has been delayed due to weather conditions. New delivery window: Tomorrow 2-4 PM.',
      time: '1 day ago',
      type: 'warning',
      read: true,
      icon: '⚠️',
    },
    {
      id: 4,
      title: 'Courier Assigned',
      message: 'John D. has been assigned as your courier for order #ORD-78945.',
      time: '2 days ago',
      type: 'info',
      read: true,
      icon: '👤',
    },
    {
      id: 5,
      title: 'Order Confirmed',
      message: 'Your order #ORD-78945 has been confirmed and is being processed.',
      time: '3 days ago',
      type: 'success',
      read: true,
      icon: '✅',
    },
    {
      id: 6,
      title: 'Welcome to Parcel App',
      message: 'Thank you for registering with Parcel App! Get started by placing your first order.',
      time: '1 week ago',
      type: 'info',
      read: true,
      icon: '🎉',
    },
  ]);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showMarkAllRead, setShowMarkAllRead] = useState(true);

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    setShowMarkAllRead(false);
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setShowMarkAllRead(false);
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(notif => !notif.read)
    : notifications;

  const unreadCount = notifications.filter(notif => !notif.read).length;

  const getTypeColor = (type: Notification['type']) => {
    switch(type) {
      case 'success': return 'bg-green-100 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-100 border-red-200 text-red-800';
      case 'info': 
      default: return 'bg-blue-100 border-blue-200 text-blue-800';
    }
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch(type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': 
      default: return 'ℹ️';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Notifications
          </h1>
          <p className="text-gray-600">
            Stay updated with your orders and account activity
          </p>
        </div>
        
        {/* Stats and Actions */}
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          {showMarkAllRead && unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-danger text-white rounded hover:bg-red-600 transition-colors duration-200 text-sm"
            >
              Mark All as Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors duration-200 text-sm"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded font-medium transition-colors duration-200 ${
            filter === 'all'
              ? 'bg-danger text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded font-medium transition-colors duration-200 ${
            filter === 'unread'
              ? 'bg-danger text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                notification.read
                  ? 'bg-white border-gray-200'
                  : 'bg-blue-50 border-blue-100 shadow-sm'
              } hover:shadow-md`}
            >
              <div className="flex items-start">
                {/* Icon */}
                <div className="flex-shrink-0 mr-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                    notification.read ? 'bg-gray-100' : 'bg-white'
                  }`}>
                    {notification.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`font-semibold text-lg ${
                        notification.read ? 'text-gray-800' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </h3>
                      <p className="text-gray-600 mt-1">{notification.message}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getTypeColor(notification.type)}`}>
                      {getTypeIcon(notification.type)} {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>{notification.time}</span>
                      {!notification.read && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-danger text-white">
                          New
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Summary */}
      {notifications.length > 0 && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="font-bold text-gray-800 mb-4">Notification Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded shadow-sm">
              <div className="text-3xl font-bold text-gray-800">{notifications.length}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center p-4 bg-white rounded shadow-sm">
              <div className="text-3xl font-bold text-green-600">
                {notifications.filter(n => n.type === 'success').length}
              </div>
              <div className="text-sm text-gray-600">Success</div>
            </div>
            <div className="text-center p-4 bg-white rounded shadow-sm">
              <div className="text-3xl font-bold text-blue-600">
                {notifications.filter(n => n.type === 'info').length}
              </div>
              <div className="text-sm text-gray-600">Info</div>
            </div>
            <div className="text-center p-4 bg-white rounded shadow-sm">
              <div className="text-3xl font-bold text-red-600">{unreadCount}</div>
              <div className="text-sm text-gray-600">Unread</div>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">Notification Tips</h4>
            <p className="text-sm text-blue-700 mt-1">
              Notifications help you track order updates, payment confirmations, and delivery statuses. 
              Mark notifications as read to keep your inbox organized.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerNotification;
