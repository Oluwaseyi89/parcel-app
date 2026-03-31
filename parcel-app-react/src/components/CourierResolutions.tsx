const CourierResolutions = (): JSX.Element => {
  return (
    <div className="mt-20 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-4">
        Courier Resolutions Subtab
      </h1>
      <p className="text-gray-600 text-center mb-6">
        This section is currently under development. Check back soon!
      </p>
      
      <div className="max-w-md mx-auto p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-danger"></div>
        </div>
        <p className="text-center text-gray-700">
          Feature coming soon...
        </p>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
          <h3 className="font-semibold text-gray-800 mb-2">Issue Resolution</h3>
          <p className="text-sm text-gray-600">Track and resolve delivery issues</p>
        </div>
        
        <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
          <h3 className="font-semibold text-gray-800 mb-2">Customer Feedback</h3>
          <p className="text-sm text-gray-600">Review customer ratings and comments</p>
        </div>
        
        <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
          <h3 className="font-semibold text-gray-800 mb-2">Performance Metrics</h3>
          <p className="text-sm text-gray-600">View your delivery performance stats</p>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <button className="px-6 py-2 bg-danger text-white rounded hover:bg-red-600 transition-colors duration-200 font-medium">
          View Details
        </button>
        <p className="mt-4 text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default CourierResolutions;
