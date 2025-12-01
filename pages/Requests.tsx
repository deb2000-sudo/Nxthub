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

  useEffect(() => {
    const loadRequests = async () => {
      if (sessionUser?.department && (sessionUser.role === 'manager' || sessionUser.role === 'admin' || sessionUser.role === 'super_admin')) {
        try {
          const data = await firebaseRequestsService.getRequestsByDepartment(sessionUser.department);
          setRequests(data);
        } catch (error) {
          console.error('Error loading requests:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    loadRequests();
  }, [sessionUser]);

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
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
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
          <Shield size={48} className="mb-4 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const historyRequests = requests.filter(r => r.status !== 'pending');

  return (
    <Layout>
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
                  <div key={request.id} className="bg-dark-800 border border-dark-700 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-dark-700 rounded-full">
                        <User size={24} className="text-gray-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white">
                          <span className="font-bold">{request.requesterName || request.requesterEmail}</span> requested access to
                        </h3>
                        <p className="text-primary-400 font-medium mt-1">{request.influencerName}</p>
                        <p className="text-sm text-gray-500 mt-2">Requested on {new Date(request.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleStatusUpdate(request.id, 'rejected')}
                        className="px-4 py-2 rounded-lg border border-red-900/50 text-red-500 hover:bg-red-900/20 transition-colors flex items-center gap-2"
                      >
                        <X size={18} />
                        Reject
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(request.id, 'approved')}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors shadow-lg shadow-green-600/20 flex items-center gap-2"
                      >
                        <Check size={18} />
                        Approve
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
              <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-dark-900/50 text-gray-400 text-sm border-b border-dark-700">
                      <th className="px-6 py-4 font-semibold">Requester</th>
                      <th className="px-6 py-4 font-semibold">Influencer</th>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
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
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Requests;
