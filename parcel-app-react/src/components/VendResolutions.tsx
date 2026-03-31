import React, { useState } from 'react';
import { MessageSquare, CheckCircle, AlertTriangle, Clock, Filter, Search, User, Package, DollarSign, Eye, Reply } from 'lucide-react';

type Resolution = {
  id: number;
  orderId: string;
  customerName: string;
  customerEmail: string;
  issueType: 'delivery' | 'quality' | 'payment' | 'other';
  issueDescription: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  productName: string;
  productImage: string;
  amount: number;
  vendorResponse?: string;
  adminResponse?: string;
  resolutionNotes?: string;
};

const VendResolutions = (): JSX.Element => {
  const [resolutions, setResolutions] = useState<Resolution[]>([
    {
      id: 1,
      orderId: 'ORD-78945',
      customerName: 'John Smith',
      customerEmail: 'john@example.com',
      issueType: 'delivery',
      issueDescription: 'Product arrived damaged. The packaging was torn and the product screen was cracked.',
      status: 'pending',
      priority: 'high',
      createdAt: '2024-01-15T10:30:00',
      updatedAt: '2024-01-15T10:30:00',
      productName: 'iPhone 15 Pro',
      productImage: 'https://via.placeholder.com/60x60?text=iPhone',
      amount: 105000,
    },
    {
      id: 2,
      orderId: 'ORD-78946',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah@example.com',
      issueType: 'quality',
      issueDescription: 'Product does not match the description. Received different model than ordered.',
      status: 'in_progress',
      priority: 'medium',
      createdAt: '2024-01-14T14:20:00',
      updatedAt: '2024-01-15T09:15:00',
      productName: 'MacBook Air',
      productImage: 'https://via.placeholder.com/60x60?text=MacBook',
      amount: 70000,
      vendorResponse: 'We have initiated quality check with our warehouse team.',
    },
    {
      id: 3,
      orderId: 'ORD-78947',
      customerName: 'Michael Brown',
      customerEmail: 'michael@example.com',
      issueType: 'payment',
      issueDescription: 'Double charged for the order. Payment was deducted twice from my account.',
      status: 'resolved',
      priority: 'urgent',
      createdAt: '2024-01-13T11:45:00',
      updatedAt: '2024-01-14T16:30:00',
      productName: 'iPad Air',
      productImage: 'https://via.placeholder.com/60x60?text=iPad',
      amount: 45000,
      vendorResponse: 'Refund processed for duplicate charge.',
      resolutionNotes: 'Refund completed. Customer confirmed receipt.',
    },
    {
      id: 4,
      orderId: 'ORD-78948',
      customerName: 'Emily Davis',
      customerEmail: 'emily@example.com',
      issueType: 'other',
      issueDescription: 'Missing accessories from the package. Charger and earphones were not included.',
      status: 'pending',
      priority: 'medium',
      createdAt: '2024-01-12T09:15:00',
      updatedAt: '2024-01-12T09:15:00',
      productName: 'Samsung TV 55"',
      productImage: 'https://via.placeholder.com/60x60?text=TV',
      amount: 150000,
    },
    {
      id: 5,
      orderId: 'ORD-78949',
      customerName: 'Robert Wilson',
      customerEmail: 'robert@example.com',
      issueType: 'delivery',
      issueDescription: 'Delivery delayed by 5 days. Expected delivery was Friday, arrived on Wednesday.',
      status: 'escalated',
      priority: 'low',
      createdAt: '2024-01-10T16:45:00',
      updatedAt: '2024-01-11T10:20:00',
      productName: 'Wireless Mouse',
      productImage: 'https://via.placeholder.com/60x60?text=Mouse',
      amount: 15000,
      vendorResponse: 'Courier service issue. We have escalated to logistics team.',
      adminResponse: 'Investigating with courier partner. Will provide compensation.',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedResolution, setSelectedResolution] = useState<Resolution | null>(null);
  const [vendorResponse, setVendorResponse] = useState<string>('');
  const [showResponseForm, setShowResponseForm] = useState<boolean>(false);

  const getStatusColor = (status: Resolution['status']) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'escalated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Resolution['status']) => {
    switch(status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <AlertTriangle className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'escalated': return <MessageSquare className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: Resolution['priority']) => {
    switch(priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIssueTypeColor = (type: Resolution['issueType']) => {
    switch(type) {
      case 'delivery': return 'bg-red-50 text-red-700';
      case 'quality': return 'bg-yellow-50 text-yellow-700';
      case 'payment': return 'bg-green-50 text-green-700';
      case 'other': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₦ ${amount.toLocaleString()}`;
  };

  const filteredResolutions = resolutions
    .filter(resolution => {
      if (filterStatus !== 'all' && resolution.status !== filterStatus) return false;
      if (filterPriority !== 'all' && resolution.priority !== filterPriority) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          resolution.orderId.toLowerCase().includes(query) ||
          resolution.customerName.toLowerCase().includes(query) ||
          resolution.productName.toLowerCase().includes(query) ||
          resolution.issueDescription.toLowerCase().includes(query)
        );
      }
      return true;
    });

  const handleSubmitResponse = (resolutionId: number) => {
    if (!vendorResponse.trim()) return;

    setResolutions(resolutions.map(res => {
      if (res.id === resolutionId) {
        return {
          ...res,
          status: 'in_progress' as const,
          vendorResponse: vendorResponse,
          updatedAt: new Date().toISOString(),
        };
      }
      return res;
    }));

    setVendorResponse('');
    setShowResponseForm(false);
    setSelectedResolution(null);
  };

  const handleMarkAsResolved = (resolutionId: number) => {
    setResolutions(resolutions.map(res => {
      if (res.id === resolutionId) {
        return {
          ...res,
          status: 'resolved' as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return res;
    }));
  };

  const pendingCount = resolutions.filter(r => r.status === 'pending').length;
  const highPriorityCount = resolutions.filter(r => r.priority === 'high' || r.priority === 'urgent').length;
  const resolvedCount = resolutions.filter(r => r.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
              <MessageSquare className="w-8 h-8 mr-3 text-danger" />
              Resolution Center
            </h1>
            <p className="text-gray-600 mt-2">
              Manage customer complaints and service requests
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Response Time</div>
              <div className="text-xl font-bold text-gray-800">24h</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Satisfaction Rate</div>
              <div className="text-xl font-bold text-green-600">94%</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800">{resolutions.length}</div>
                <div className="text-sm text-gray-600">Total Issues</div>
              </div>
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{highPriorityCount}</div>
                <div className="text-sm text-gray-600">High Priority</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
                <div className="text-sm text-gray-600">Resolved</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID, customer, or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full lg:w-96 focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resolutions List */}
      <div className="space-y-4">
        {filteredResolutions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No issues found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'No matching issues found for your search.' : 'All issues are currently resolved.'}
            </p>
          </div>
        ) : (
          filteredResolutions.map((resolution) => (
            <div
              key={resolution.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                  {/* Left Column */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(resolution.status)}`}>
                        {getStatusIcon(resolution.status)}
                        <span>{resolution.status.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(resolution.priority)}`}>
                        {resolution.priority.toUpperCase()}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getIssueTypeColor(resolution.issueType)}`}>
                        {resolution.issueType.toUpperCase()}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {resolution.productName}
                      </h3>
                      <p className="text-gray-600">{resolution.orderId} • {formatCurrency(resolution.amount)}</p>
                    </div>

                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{resolution.customerName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{formatDate(resolution.createdAt)}</span>
                      </div>
                    </div>

                    <p className="text-gray-700 line-clamp-2">
                      {resolution.issueDescription}
                    </p>
                  </div>

                  {/* Right Column - Actions */}
                  <div className="flex flex-col space-y-2 lg:pl-6 lg:border-l lg:border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedResolution(resolution);
                        setShowResponseForm(true);
                      }}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-danger text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                    >
                      <Reply className="w-4 h-4" />
                      <span>Respond</span>
                    </button>
                    
                    {resolution.status !== 'resolved' && (
                      <button
                        onClick={() => handleMarkAsResolved(resolution.id)}
                        className="flex items-center justify-center space-x-2 px-4 py-2 border border-green-500 text-green-500 rounded-lg hover:bg-green-50 transition-colors duration-200"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark Resolved</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => setSelectedResolution(resolution)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>

                {/* Vendor Response Preview */}
                {resolution.vendorResponse && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-blue-800">Your Response</div>
                        <div className="text-xs text-blue-600">{formatDate(resolution.updatedAt)}</div>
                      </div>
                    </div>
                    <p className="text-blue-700 text-sm">{resolution.vendorResponse}</p>
                  </div>
                )}

                {/* Admin Response */}
                {resolution.adminResponse && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-purple-800">Admin Response</div>
                        <div className="text-xs text-purple-600">{formatDate(resolution.updatedAt)}</div>
                      </div>
                    </div>
                    <p className="text-purple-700 text-sm">{resolution.adminResponse}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Response Modal */}
      {showResponseForm && selectedResolution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Respond to Issue
                </h3>
                <button
                  onClick={() => {
                    setShowResponseForm(false);
                    setSelectedResolution(null);
                    setVendorResponse('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Details
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-700">{selectedResolution.issueDescription}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Response *
                  </label>
                  <textarea
                    value={vendorResponse}
                    onChange={(e) => setVendorResponse(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent resize-none"
                    placeholder="Type your response to the customer..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowResponseForm(false);
                      setSelectedResolution(null);
                      setVendorResponse('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmitResponse(selectedResolution.id)}
                    className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                    disabled={!vendorResponse.trim()}
                  >
                    Submit Response
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-bold text-blue-800 mb-3 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Resolution Tips
        </h4>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
            <span className="text-blue-700">Respond within 24 hours to maintain high satisfaction rates</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
            <span className="text-blue-700">Be professional and empathetic in all communications</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
            <span className="text-blue-700">Escalate urgent issues to admin support when needed</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
            <span className="text-blue-700">Follow up with customers after resolution to ensure satisfaction</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default VendResolutions;
