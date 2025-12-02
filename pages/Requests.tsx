import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { firebaseRequestsService } from '../services/firebaseService';
import { getSession } from '../services/authService';
import { AccessRequest } from '../types';
import { Check, X, Clock, User, Shield } from 'lucide-react';

const Requests: React.FC = () => {
  const sessionUser = getSession();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use primitive values for dependency array to avoid infinite loops
  const userDept = sessionUser?.department;
  const userRole = sessionUser?.role;

  useEffect(() => {
    let isMounted = true;
    const loadRequests = async () => {
      if (userDept && (userRole === 'manager' || userRole === 'admin' || userRole === 'super_admin')) {
        try {
          const data = await firebaseRequestsService.getRequestsByDepartment(userDept);
          if (isMounted) {
            setRequests(data);
          }
        } catch (error) {
          console.error('Error loading requests:', error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      } else {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    loadRequests();
    return () => {
      isMounted = false;
    };
  }, [userDept, userRole]);

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected' | 'revoked') => {
    try {
      await firebaseRequestsService.updateRequestStatus(id, status);
      setRequests(prev => prev.map(req => 
        req.id === id ? { ...req, status } : req
      ));
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update request status.');
    }
  };

  if (!sessionUser || (sessionUser.role !== 'manager' && sessionUser.role !== 'admin' && sessionUser.role !== 'super_admin')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
        <Shield size={48} className="mb-4 text-gray-600" />
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const historyRequests = requests.filter(r => r.status !== 'pending');

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Access Requests</h1>
        <p className="text-gray-400">
          Manage access requests for <span className="text-primary-400 font-semibold">{sessionUser.department}</span> department.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading requests...</div>
      ) : (
        <div className="space-y-8">
          {/* Pending Requests Section */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="text-yellow-500" size={20} />
              Pending Requests
              <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-0.5 rounded-full ml-2">
                {pendingRequests.length}
              </span>
            </h2>
            
            {pendingRequests.length === 0 ? (
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-8 text-center text-gray-500">
                No pending requests at the moment.
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingRequests.map(request => (
                  <div key={request.id} className="bg-dark-800 border border-dark-700 rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-dark-700 rounded-full shrink-0">
                        <User size={20} className="text-gray-300 md:w-6 md:h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base md:text-lg font-medium text-white break-words">
                          <span className="font-bold">{request.requesterName || request.requesterEmail}</span> requested access to
                        </h3>
                        <p className="text-primary-400 font-medium mt-1 break-words">{request.influencerName}</p>
                        <p className="text-xs md:text-sm text-gray-500 mt-2">Requested on {new Date(request.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-3 shrink-0 w-full md:w-auto">
                      <button 
                        onClick={() => handleStatusUpdate(request.id, 'rejected')}
                        className="flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg border border-red-900/50 text-red-500 hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                      >
                        <X size={16} className="md:w-[18px] md:h-[18px]" />
                        <span className="hidden sm:inline">Reject</span>
                        <span className="sm:hidden">✕</span>
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(request.id, 'approved')}
                        className="flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 text-sm md:text-base"
                      >
                        <Check size={16} className="md:w-[18px] md:h-[18px]" />
                        <span className="hidden sm:inline">Approve</span>
                        <span className="sm:hidden">✓</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* History Section */}
          {historyRequests.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 text-gray-400">Request History</h2>
              
              {/* Mobile View - Cards */}
              <div className="block lg:hidden space-y-3">
                {historyRequests.map(request => (
                  <div key={request.id} className="bg-dark-800 border border-dark-700 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-medium">{request.requesterName || request.requesterEmail}</h3>
                        <p className="text-sm text-primary-400 mt-1">{request.influencerName}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(request.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${
                        request.status === 'approved' 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                          : request.status === 'revoked'
                            ? 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {request.status === 'approved' ? (
                        <button
                          onClick={() => handleStatusUpdate(request.id, 'rejected')}
                          className="flex-1 text-red-500 hover:text-red-400 text-sm font-medium flex items-center justify-center gap-1 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors border border-red-500/20"
                        >
                          <X size={14} /> Reject
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusUpdate(request.id, 'approved')}
                          className="flex-1 text-green-500 hover:text-green-400 text-sm font-medium flex items-center justify-center gap-1 px-3 py-2 rounded-lg hover:bg-green-500/10 transition-colors border border-green-500/20"
                        >
                          <Check size={14} /> Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden lg:block bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-dark-900/50 text-gray-400 text-sm border-b border-dark-700">
                      <th className="px-6 py-4 font-semibold">Requester</th>
                      <th className="px-6 py-4 font-semibold">Influencer</th>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {historyRequests.map(request => (
                      <tr key={request.id} className="hover:bg-dark-700/30 transition-colors">
                        <td className="px-6 py-4 text-white">{request.requesterName || request.requesterEmail}</td>
                        <td className="px-6 py-4 text-gray-300">{request.influencerName}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{new Date(request.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            request.status === 'approved' 
                              ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                              : request.status === 'revoked'
                                ? 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {request.status === 'approved' ? (
                            <button
                              onClick={() => handleStatusUpdate(request.id, 'rejected')}
                              className="text-red-500 hover:text-red-400 text-sm font-medium flex items-center gap-1 px-3 py-1 rounded hover:bg-red-500/10 transition-colors"
                              title="Reject Access"
                            >
                              <X size={14} /> Reject
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusUpdate(request.id, 'approved')}
                              className="text-green-500 hover:text-green-400 text-sm font-medium flex items-center gap-1 px-3 py-1 rounded hover:bg-green-500/10 transition-colors"
                              title="Grant Access"
                            >
                              <Check size={14} /> Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
};

export default Requests;
