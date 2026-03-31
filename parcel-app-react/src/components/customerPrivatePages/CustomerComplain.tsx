import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { UseFetchJSON } from '../useFetch';

type Complaint = {
  id: number;
  complaint_subject: string;
  courier_involved: string;
  complaint_detail?: string;
  is_resolved?: boolean;
  is_satisfied?: boolean;
  created_at?: string;
  updated_at?: string;
};

type ComplaintState = {
  complaints: Complaint[];
};

const initialComplaints: ComplaintState = { complaints: [] };

const CustomerComplain: React.FC = () => {
  const loggedCus = JSON.parse(localStorage.getItem('logcus') || 'null');
  const [proderr, setProdErr] = useState<string>('');
  const [prodsus, setProdSus] = useState<string>('');
  const [shouldFetch, setShouldFetch] = useState<boolean>(true);

  const [complaintForm, setComplaintForm] = useState<any>({
    customer_email: loggedCus?.email ?? '',
    complaint_subject: '',
    courier_involved: '',
    complaint_detail: '',
    is_resolved: false,
    is_satisfied: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const { complaint_subject, courier_involved, complaint_detail } = complaintForm;

  const handleComplaintFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.name as string;
    const value = e.target.value;
    setComplaintForm({ ...complaintForm, [name]: value });
  };

  const handleComplaintFormSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (loggedCus && complaint_subject && courier_involved && complaint_detail) {
      const apiUrl = 'http://localhost:7000/parcel_backends/customer_complain/';
      UseFetchJSON(apiUrl, 'POST', complaintForm)
        .then((res: any) => {
          if (res.status === 'success') {
            setProdSus(res.data);
            setShouldFetch(true);
            // Reset form on success
            setComplaintForm({
              ...complaintForm,
              complaint_subject: '',
              courier_involved: '',
              complaint_detail: '',
            });
          } else {
            setProdErr(res.data);
          }
        })
        .catch((err: any) => console.log(err.message));
    } else {
      setProdErr('Please fill in all required fields');
    }
  };

  const reducer = (state: ComplaintState, action: any): ComplaintState => {
    switch (action.type) {
      case 'GET_COMPLAINTS': {
        const filteredComplaints = action.payload.filter((complaint: Complaint) => complaint.is_satisfied === false);
        return { ...state, complaints: filteredComplaints };
      }
      case 'UPDATE_COMPLAINT': {
        const modComplain = state.complaints.map((complain: Complaint) => {
          if (complain.id === action.payload.id) {
            const e = action.payload.e;
            const id = action.payload.id;
            const updateData = {
              is_satisfied: e.target.checked,
              updated_at: new Date().toISOString(),
            };
            const apiUrl = `http://localhost:7000/parcel_backends/update_complain/${id}/`;
            UseFetchJSON(apiUrl, 'PATCH', updateData)
              .then((res: any) => {
                if (res.status === 'success') setProdSus(res.data);
                else setProdErr(res.data);
              })
              .catch((err: any) => setProdErr(err.message));
            return { ...complain, is_satisfied: e.target.checked } as Complaint;
          }
          return { ...complain } as Complaint;
        });
        return { ...state, complaints: modComplain };
      }
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, initialComplaints);

  const getComplaints = useCallback((data: any[]) => dispatch({ type: 'GET_COMPLAINTS', payload: data }), []);

  const updateComplaint = (id: number, e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'UPDATE_COMPLAINT', payload: { id, e } });

  useEffect(() => {
    function fetchComplains() {
      const apiUrl = `http://localhost:7000/parcel_backends/get_dist_complain/${loggedCus?.email}/`;
      UseFetchJSON(apiUrl, 'GET')
        .then((res: any) => {
          const complaints = res.data;
          getComplaints(complaints);
        })
        .catch((err: any) => console.log(err.message));
    }

    if (shouldFetch) fetchComplains();
    setShouldFetch(false);
  }, [loggedCus?.email, getComplaints, shouldFetch]);

  const handleCloseAlert = () => {
    setProdErr('');
    setProdSus('');
  };

  return (
    <div className="bg-white w-full min-h-[30px] p-1.25 my-5 box-border rounded-sm shadow-md p-6">
      {/* Complaint Form */}
      <form onSubmit={handleComplaintFormSubmission} className="mb-8">
        <legend className="text-center uppercase font-bold text-danger text-xl mb-6">
          Submit a Complaint
        </legend>
        
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
        
        {/* Form Fields */}
        <div className="space-y-4">
          {/* Complaint Subject */}
          <div>
            <input 
              name="complaint_subject" 
              value={complaint_subject} 
              onChange={handleComplaintFormChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
              type="text" 
              placeholder="Complaint Subject" 
            />
          </div>
          
          {/* Courier Involved */}
          <div>
            <input 
              name="courier_involved" 
              value={courier_involved} 
              onChange={handleComplaintFormChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent"
              type="text" 
              placeholder="Courier's Full Name" 
            />
          </div>
          
          {/* Complaint Details */}
          <div>
            <textarea 
              name="complaint_detail" 
              value={complaint_detail} 
              onChange={handleComplaintFormChange} 
              className="w-full h-[200px] px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent resize-none"
              placeholder="Please provide detailed information about your complaint..." 
            />
          </div>
        </div>
        
        <br />
        
        {/* Submit Button */}
        <div>
          <button 
            type="submit" 
            className="bg-danger w-full text-white px-4 py-3 rounded hover:bg-red-600 transition-colors duration-200 font-medium"
          >
            Submit Complaint
          </button>
        </div>
      </form>
      
      <hr className="border-gray-300 my-8" />
      
      {/* Submitted Complaints */}
      <div>
        <h4 className="text-center uppercase font-bold text-danger text-xl mb-6">
          Your Submitted Complaints
        </h4>
        
        {state.complaints.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p className="text-gray-600">No complaints submitted yet</p>
            <p className="text-sm text-gray-500 mt-2">Your submitted complaints will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {state.complaints.map((complaint) => (
              <div 
                key={complaint.id}
                className="h-full border-[2px] border-orange-500 mb-2.5 rounded pt-1.75 flex flex-col justify-between pr-10 p-4 bg-orange-50 md:flex-row md:justify-between md:items-center shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* Left Column - Complaint Details */}
                <div className="mb-4 md:mb-0">
                  <ul className="list-none space-y-2">
                    <li>
                      <strong className="text-xl text-gray-900">{complaint.complaint_subject}</strong>
                    </li>
                    <li className="text-gray-700">
                      <span className="font-medium">Courier: </span>
                      <strong className="text-lg text-gray-900">{complaint.courier_involved}</strong>
                    </li>
                    <li className="text-gray-700">
                      <span className="font-medium">Status: </span>
                      <strong className={`text-lg ${complaint.is_resolved ? 'text-green-600' : 'text-red-600'}`}>
                        {complaint.is_resolved ? '✓ Resolved' : '⏳ Pending'}
                      </strong>
                    </li>
                  </ul>
                </div>
                
                {/* Right Column - Date and Actions */}
                <div>
                  <ul className="list-none space-y-2">
                    <li className="text-gray-700">
                      <span className="font-medium">Date: </span>
                      <strong className="text-gray-900">
                        {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : 'N/A'}
                      </strong>
                    </li>
                    
                    {/* Satisfaction Checkbox */}
                    {complaint.is_resolved && (
                      <li className="mt-4 flex items-center space-x-2">
                        <strong className="text-gray-900">Mark as Satisfied: </strong>
                        <input 
                          type="checkbox" 
                          checked={!!complaint.is_satisfied} 
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateComplaint(complaint.id, e)}
                          className="w-5 h-5 text-danger border-gray-300 rounded focus:ring-danger"
                          style={{ accentColor: 'rgb(219, 33, 76)' }}
                        />
                      </li>
                    )}
                    
                    {/* Complaint Detail Preview */}
                    {complaint.complaint_detail && (
                      <li className="mt-3">
                        <details className="text-gray-600">
                          <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                            View Details
                          </summary>
                          <p className="mt-2 p-2 bg-white border border-gray-200 rounded text-sm">
                            {complaint.complaint_detail}
                          </p>
                        </details>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Statistics */}
        {state.complaints.length > 0 && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded shadow-sm">
                <div className="text-2xl font-bold text-gray-800">{state.complaints.length}</div>
                <div className="text-sm text-gray-600">Total Complaints</div>
              </div>
              <div className="text-center p-3 bg-white rounded shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {state.complaints.filter(c => c.is_resolved).length}
                </div>
                <div className="text-sm text-gray-600">Resolved</div>
              </div>
              <div className="text-center p-3 bg-white rounded shadow-sm">
                <div className="text-2xl font-bold text-red-600">
                  {state.complaints.filter(c => !c.is_resolved).length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerComplain;
