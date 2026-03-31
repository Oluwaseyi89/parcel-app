import React, { useEffect, useReducer, memo, useCallback, useState } from 'react';
import { UseFetch, UseFetchJSON } from './useFetch';
import { Upload, Eye, Bell, Edit, Save, Trash2, Package, Tag, DollarSign, Hash, FileText, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';

const VendProducts: React.FC = () => {
  const [produpload, setProdUpload] = useState(false);
  const [viewprod, setViewProd] = useState(false);
  const [uploadnote, setUploadNote] = useState(false);
  const [prodphoto, setProdPhoto] = useState<any>(null);
  const [tempProd, setTempProd] = useState<any[]>([]);
  const [product, setProduct] = useState<any>({ 
    prod_name: '', 
    prod_model: '', 
    prod_price: '', 
    prod_qty: '', 
    prod_desc: '', 
    prod_disc: '' 
  });

  const [editprod, setEditProd] = useState<any>({ 
    edit_price: '', 
    edit_disc: '', 
    edit_qty: '' 
  });

  const [prodsus, setProdSus] = useState<string>('');
  const [proderr, setProdErr] = useState<string>('');

  const handleProdEditChange = useCallback((id: any, e: any) => {
    return dispatch({ type: 'CHANGE_PROD', payload: { id, e } });
  }, []);

  const handleProdDelete = useCallback((id: any) => {
    return dispatch({ type: 'DELETE_PROD', payload: id });
  }, []);

  const initialState = { products: null as any };

  const { prod_name, prod_model, prod_price, prod_qty, prod_desc, prod_disc } = product;
  
  const handleProdUpload = () => {
    setProdUpload(true);
    setViewProd(false);
    setUploadNote(false);
  };

  const handleEditClick = useCallback((id: any) => {
    return dispatch({ type: 'EDIT', payload: id });
  }, []);

  const getProducts = useCallback((data: any) => {
    return dispatch({ type: 'GET_PRODUCTS', payload: data });
  }, []);

  const handleSubmitClick = useCallback((id: any) => {
    return dispatch({ type: 'SUBMIT_EDITTED', payload: id });
  }, []);

  const reducer = (state: any, action: any) => {
    if (action.type === 'GET_PRODUCTS') {
      const adjData = action.payload.map((prod: any) => ({ 
        ...prod, 
        edit: false, 
        submit: false 
      }));
      return { ...state, products: adjData };
    }
    
    if (action.type === 'EDIT') {
      const editFrag = state.products.map((prod: any) => 
        prod.id === action.payload ? { ...prod, edit: true } : { ...prod }
      );
      return { ...state, products: editFrag };
    }
    
    if (action.type === 'DELETE_PROD') {
      const newProds = state.products.filter((prod: any) => prod.id !== action.payload);
      state.products.map((prod: any) => {
        if (prod.id === action.payload) {
          const apiUrl = `http://localhost:7000/parcel_product/del_product/${action.payload}/`;
          const data = UseFetchJSON(apiUrl, 'DELETE');
          data.then((res: any) => {
            if (res.status === 'success') setProdSus(res.data);
            else setProdErr('An error occured');
          }).catch((err: any) => console.log(err));
        }
        return null;
      });
      return { ...state, products: newProds };
    }
    
    if (action.type === 'SUBMIT_EDITTED') {
      const submitFrag = state.products.map((prod: any) => {
        if (prod.id === action.payload) {
          const { edit_price, edit_disc, edit_qty } = editprod;
          const updateData = { 
            prod_price: edit_price, 
            prod_qty: edit_qty, 
            prod_disc: edit_disc, 
            updated_at: new Date().toISOString() 
          };
          
          if (edit_price && edit_qty && edit_disc) {
            const apiUrl = `http://localhost:7000/parcel_product/update_product/${action.payload}/`;
            const data = UseFetchJSON(apiUrl, 'POST', updateData);
            data.then((res: any) => {
              if (res.status === 'success') {
                setProdSus(res.data);
                setEditProd({ ...editprod, edit_price: '', edit_disc: '', edit_qty: '' });
              } else if (res.status === 'error') setProdErr(res.data);
              else setProdErr('An error occured');
            }).catch((err: any) => setProdErr(err.message));
          } else {
            setProdErr('Some fields are empty, no changes made');
          }
          return { ...prod, edit: false };
        }
        return { ...prod };
      });
      return { ...state, products: submitFrag };
    }
    
    if (action.type === 'CHANGE_PROD') {
      const changeFrag = state.products.map((prod: any) => {
        if (prod.id === action.payload.id) {
          const e = action.payload.e;
          const name = e.target.name;
          const value = e.target.value;
          setEditProd({ ...editprod, [name]: value });
          return { 
            ...prod, 
            prod_price: editprod.edit_price, 
            prod_disc: editprod.edit_disc, 
            prod_qty: editprod.edit_qty 
          };
        }
        return { ...prod };
      });
      return { ...state, products: changeFrag };
    }
    
    return state;
  };

  const logvend = JSON.parse(localStorage.getItem('logvend') || 'null');

  const handleProductChange = (e: any) => {
    const name = e.target.name;
    const value = e.target.value;
    setProduct({ ...product, [name]: value });
  };

  const handleViewProd = () => {
    setProdUpload(false);
    setUploadNote(false);
    setViewProd(true);
  };

  const handleUploadNote = () => {
    setProdUpload(false);
    setUploadNote(true);
    setViewProd(false);
  };

  const handleCloseAlert = () => {
    setProdErr('');
    setProdSus('');
  };

  const handleProductSubmit = (e: any) => {
    e.preventDefault();
    if (prodphoto && prod_name && prod_model && prod_price && prod_desc && prod_disc) {
      const formData = new FormData();
      const full_path = document.getElementById('prod-file') as HTMLInputElement;
      const base_name = full_path?.files?.[0]?.name || 'product.jpg';
      const vendor_name = logvend.last_name + ' ' + logvend.first_name;
      
      formData.append('vendor_name', vendor_name);
      formData.append('vendor_phone', logvend.phone_no);
      formData.append('vendor_email', logvend.email);
      formData.append('vend_photo', logvend.vend_photo);
      formData.append('prod_cat', logvend.bus_category);
      formData.append('prod_name', prod_name);
      formData.append('prod_model', prod_model);
      formData.append('prod_photo', prodphoto, base_name);
      formData.append('prod_price', prod_price);
      formData.append('prod_qty', prod_qty);
      formData.append('prod_disc', prod_disc);
      formData.append('prod_desc', prod_desc);
      formData.append('img_base', base_name);
      formData.append('upload_date', new Date().toISOString());

      const apiUrl = 'http://localhost:7000/parcel_product/product_upload/';
      UseFetch(apiUrl, 'POST', formData)
        .then((res: any) => {
          if (res.status === 'success') setProdSus(res.data);
          else if (res.status === 'error') setProdErr(res.data);
          else setProdErr('An error occured');
        })
        .catch((err: any) => console.log(err));
    } else {
      setProdErr('Please fill in all required fields');
    }
  };

  const handlePhotoUpload = (e: any) => {
    if (e.target.files && e.target.files[0]) {
      const tmp_path = URL.createObjectURL(e.target.files[0]);
      const targetImg = document.getElementById('target-img') as HTMLImageElement;
      if (targetImg) {
        targetImg.src = tmp_path;
        targetImg.style.display = 'block';
      }
      setProdPhoto(e.target.files[0]);
    }
  };

  useEffect(() => {
    const fetchProducts = () => {
      const email = logvend.email;
      const apiUrl = `http://localhost:7000/parcel_product/get_dist_ven_product/${email}/`;
      UseFetchJSON(apiUrl, 'GET').then((res: any) => {
        getProducts(res.data);
      });
    };
    fetchProducts();
  }, [logvend.email, getProducts]);

  useEffect(() => {
    const email = logvend.email;
    const apiUrl = `http://localhost:7000/parcel_product/get_dist_temp_product/${email}/`;
    UseFetchJSON(apiUrl, 'GET').then((res: any) => setTempProd(res.data));
  }, [logvend.email]);

  const [state, dispatch] = useReducer(reducer, initialState as any);

  let notifications: any[] = [];
  if (state.products !== null) {
    const apprNote = { 
      status: 'success', 
      data: `You have ${state.products.length} approved products.` 
    };
    if (state.products.length > 0) notifications.push(apprNote);
  }
  
  if (tempProd !== null) {
    const unapprNote = { 
      status: 'error', 
      data: `You have ${tempProd.length} unapproved products` 
    };
    if (tempProd.length > 0) notifications.push(unapprNote);
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row justify-around w-full items-center mb-6">
        <button 
          onClick={handleProdUpload} 
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 mb-2 sm:mb-0 ${
            produpload 
              ? 'bg-danger text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Upload className="w-5 h-5" />
          <span>Upload Products</span>
        </button>
        
        <button 
          onClick={handleViewProd} 
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 mb-2 sm:mb-0 ${
            viewprod 
              ? 'bg-danger text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Eye className="w-5 h-5" />
          <span>View Products</span>
        </button>
        
        <button 
          onClick={handleUploadNote} 
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            uploadnote 
              ? 'bg-danger text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span>Upload Notifications</span>
        </button>
      </div>

      {/* Product Upload Form */}
      {produpload && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Package className="w-6 h-6 mr-2" />
            Upload New Product
          </h2>

          {/* Alerts */}
          {proderr && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-red-700">{proderr}</p>
                <button 
                  onClick={handleCloseAlert}
                  className="ml-auto text-red-400 hover:text-red-500"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>
          )}

          {prodsus && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r mb-6">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                <p className="text-green-700">{prodsus}</p>
                <button 
                  onClick={handleCloseAlert}
                  className="ml-auto text-green-400 hover:text-green-500"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleProductSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Image
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-danger transition-colors duration-200">
                  <div className="space-y-1 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="prod-file" className="relative cursor-pointer bg-white rounded-md font-medium text-danger hover:text-red-600">
                        <span>Upload a file</span>
                        <input 
                          id="prod-file" 
                          onChange={handlePhotoUpload} 
                          name="prod_img" 
                          type="file" 
                          className="sr-only" 
                          accept="image/*"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-48 h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 flex items-center justify-center">
                  {prodphoto ? (
                    <img 
                      id="target-img" 
                      alt="Product preview" 
                      className="w-full h-full object-cover"
                      style={{ display: 'block' }}
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Image Preview</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Read-only Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Category
                </label>
                <input 
                  name="prod_category" 
                  value={"Product Category: " + logvend.bus_category} 
                  type="text" 
                  readOnly 
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-700"
                />
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input 
                  onChange={handleProductChange} 
                  name="prod_name" 
                  value={prod_name} 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Enter product name"
                  required
                />
              </div>

              {/* Product Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Model *
                </label>
                <input 
                  onChange={handleProductChange} 
                  name="prod_model" 
                  value={prod_model} 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                  placeholder="Enter product model"
                  required
                />
              </div>

              {/* Price and Discount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₦) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      onChange={handleProductChange} 
                      name="prod_price" 
                      value={prod_price} 
                      type="number" 
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount (%) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      onChange={handleProductChange} 
                      name="prod_disc" 
                      value={prod_disc} 
                      type="number" 
                      min="0"
                      max="100"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    onChange={handleProductChange} 
                    name="prod_qty" 
                    value={prod_qty} 
                    type="number" 
                    min="1"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea 
                    onChange={handleProductChange} 
                    name="prod_desc" 
                    value={prod_desc} 
                    rows={4}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent resize-none"
                    placeholder="Describe your product..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full py-3 px-4 bg-danger text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium text-lg"
            >
              Upload Product
            </button>
          </form>
        </div>
      )}

      {/* View Products */}
      {viewprod && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <Package className="w-6 h-6 mr-2" />
              Your Products
            </h2>
            <div className="bg-gray-100 px-4 py-2 rounded-full">
              <span className="font-medium text-gray-700">
                {state.products?.length || 0} Products
              </span>
            </div>
          </div>

          {/* Alerts */}
          {proderr && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-red-700">{proderr}</p>
                <button 
                  onClick={handleCloseAlert}
                  className="ml-auto text-red-400 hover:text-red-500"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>
          )}

          {prodsus && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r mb-6">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                <p className="text-green-700">{prodsus}</p>
                <button 
                  onClick={handleCloseAlert}
                  className="ml-auto text-green-400 hover:text-green-500"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>
          )}

          {/* Products Grid */}
          {state.products && state.products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.products.map((prod: any, index: number) => (
                <ProductFragment 
                  key={prod.id || index}
                  index={index}
                  handleProdDelete={handleProdDelete}
                  editprod={editprod}
                  handleProdEditChange={handleProdEditChange}
                  prod={prod}
                  handleSubmitClick={handleSubmitClick}
                  handleEditClick={handleEditClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No products found
              </h3>
              <p className="text-gray-500 mb-6">
                You haven't uploaded any products yet.
              </p>
              <button 
                onClick={handleProdUpload}
                className="px-6 py-2 bg-danger text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Upload Your First Product
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload Notifications */}
      {uploadnote && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Bell className="w-6 h-6 mr-2" />
            Upload Status
          </h2>

          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((item: any, index: number) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    item.status === 'success' 
                      ? 'bg-green-50 border-green-400' 
                      : 'bg-red-50 border-red-400'
                  }`}
                >
                  <div className="flex items-center">
                    {item.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                    )}
                    <p className={`text-lg font-medium ${
                      item.status === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {item.data}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No notifications
                </h3>
                <p className="text-gray-500">
                  All your products are approved and up to date.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ProductFragment = memo(({ prod, index, editprod, handleProdDelete, handleProdEditChange, handleEditClick, handleSubmitClick }: any) => {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Product Image */}
      <div className="h-48 overflow-hidden bg-white">
        <img 
          className="w-full h-full object-cover"
          alt={prod.prod_name}
          src={prod.prod_photo}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Product+Image';
          }}
        />
      </div>

      {/* Product Details */}
      <div className="p-4">
        {/* Product Name and Model */}
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 text-lg truncate">{prod.prod_name}</h3>
          <p className="text-gray-600 text-sm truncate">{prod.prod_model}</p>
        </div>

        {/* Edit Mode Fields */}
        {prod.edit ? (
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Price (₦)</label>
              <input 
                name="edit_price" 
                onChange={(e) => handleProdEditChange(prod.id, e)} 
                type="number"
                value={editprod.edit_price || prod.prod_price}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                placeholder="New price"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Discount (%)</label>
              <input 
                name="edit_disc" 
                onChange={(e) => handleProdEditChange(prod.id, e)} 
                type="number"
                value={editprod.edit_disc || prod.prod_disc}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                placeholder="New discount"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
              <input 
                name="edit_qty" 
                onChange={(e) => handleProdEditChange(prod.id, e)} 
                type="number"
                value={editprod.edit_qty || prod.prod_qty}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                placeholder="New quantity"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Price:</span>
              <span className="font-medium text-gray-800">₦ {prod.prod_price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Discount:</span>
              <span className="font-medium text-red-600">{prod.prod_disc}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Quantity:</span>
              <span className="font-medium text-gray-800">{prod.prod_qty}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {!prod.edit ? (
            <button 
              onClick={() => handleEditClick(prod.id)}
              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 text-sm"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
          ) : (
            <>
              <button 
                onClick={() => handleSubmitClick(prod.id)}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200 text-sm"
              >
                <Save className="w-4 h-4" />
                <span>Update</span>
              </button>
              
              <button 
                onClick={() => handleProdDelete(prod.id)}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default VendProducts;
