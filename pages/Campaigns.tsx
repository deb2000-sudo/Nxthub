import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { Campaign, CampaignStatus, Department, Influencer } from '../types';
import { dataService } from '../services/dataService';
import { firebaseDepartmentsService, firebaseUsersService } from '../services/firebaseService';
import { getSession } from '../services/authService';
import { MOCK_USERS } from '../constants';
import SearchableSelect, { Option } from '../components/SearchableSelect';
import { Filter, Plus, Calendar, CheckCircle2, AlertCircle, ChevronDown, Lock, Search, X, Grid, List, Clock, IndianRupee, Briefcase, FileText, User, Pencil, Trash2, AlertTriangle } from 'lucide-react';

const Campaigns: React.FC = () => {
  const sessionUser = getSession();
  const role = sessionUser?.role || '';
  const userDept = sessionUser?.department;
  const currentUserEmail = sessionUser?.email || '';

  // Initialize state from dataService (async loading)
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [campaignsData, influencersData, departmentsData] = await Promise.all([
          dataService.getCampaigns(),
          dataService.getInfluencers(),
          firebaseDepartmentsService.getDepartments()
        ]);
        setCampaigns(campaignsData);
        setInfluencers(influencersData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  
  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('');

  // View Mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isConfirmCompletionOpen, setIsConfirmCompletionOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null); // For details view
  const [campaignToComplete, setCampaignToComplete] = useState<Campaign | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Status Change Modal State
  const [isStatusChangeModalOpen, setIsStatusChangeModalOpen] = useState(false);
  const [campaignToChangeStatus, setCampaignToChangeStatus] = useState<Campaign | null>(null);
  const [newStatus, setNewStatus] = useState<CampaignStatus | null>(null);
  const [statusChangeSummary, setStatusChangeSummary] = useState('');
  const [statusChangeError, setStatusChangeError] = useState('');

  // Campaign Summary Modal State
  const [isCampaignSummaryModalOpen, setIsCampaignSummaryModalOpen] = useState(false);
  const [campaignForSummary, setCampaignForSummary] = useState<Campaign | null>(null);

  // Completion Form Data
  const [compData, setCompData] = useState({
    date: new Date().toISOString().split('T')[0],
    summary: ''
  });
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleCreateClick = () => {
    setEditingCampaign(null);
    setIsCreateModalOpen(true);
  };

  const handleEditClick = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setIsCreateModalOpen(true);
  };

  // Helper function to check edit permissions
  const canEditCampaign = (campaign: Campaign): boolean => {
    // Super Admins and Admins have full access
    if (role === 'super_admin' || role === 'admin') return true;

    // Executives are read-only view
    if (role === 'executive') return false;
    
    // Managers can only edit if departments match (case-insensitive)
    if (role === 'manager') {
        if (!userDept || !campaign.department) return false;
        return userDept.toLowerCase() === campaign.department.toLowerCase();
    }

    return false;
  };

  const initiateStatusChange = (campaign: Campaign, status: CampaignStatus) => {
    // Prevent reversing approved/rejected/completed statuses
    if (campaign.status !== 'Pending' && (campaign.status === 'Approved' || campaign.status === 'Rejected' || campaign.status === 'Completed')) {
      setToast({ message: 'Cannot change status once it has been Approved, Rejected, or Completed.', type: 'error' });
      return;
    }

    // Only allow changing from Pending to Approved, Rejected, or Completed
    if (campaign.status !== 'Pending') {
      setToast({ message: 'Status can only be changed from Pending.', type: 'error' });
      return;
    }

    if (!canEditCampaign(campaign)) {
        setToast({ message: `Unauthorized: Read-only access.`, type: 'error' });
        return;
    }

    setCampaignToChangeStatus(campaign);
    setNewStatus(status);
    setStatusChangeSummary('');
    setStatusChangeError('');
    setIsStatusChangeModalOpen(true);
  };

  const handleStatusChange = async () => {
    if (!campaignToChangeStatus || !newStatus) return;

    // Validate summary is provided
    if (!statusChangeSummary.trim()) {
      setStatusChangeError('Summary is required for status change');
      return;
    }

    try {
      const updatedList = await dataService.updateCampaignStatus(
        campaignToChangeStatus.id, 
        newStatus,
        statusChangeSummary.trim(),
        currentUserEmail || undefined
      );
      setCampaigns(updatedList);
      setToast({ message: `Campaign status updated to ${newStatus}`, type: 'success' });
      
      // Update selected campaign if open
      if (selectedCampaign && selectedCampaign.id === campaignToChangeStatus.id) {
          const updatedCampaign = updatedList.find(c => c.id === campaignToChangeStatus.id);
          if (updatedCampaign) {
            setSelectedCampaign(updatedCampaign);
          }
      }

      // Close modal and reset state
      setIsStatusChangeModalOpen(false);
      setCampaignToChangeStatus(null);
      setNewStatus(null);
      setStatusChangeSummary('');
      setStatusChangeError('');
    } catch (error) {
      console.error('Error updating campaign status:', error);
      setToast({ message: 'Failed to update campaign status', type: 'error' });
    }
  };

  const initiateLogCompletion = (campaign: Campaign) => {
      if(canEditCampaign(campaign)) {
        setCampaignToComplete(campaign);
        // Reset form data when opening modal
        setCompData({ date: new Date().toISOString().split('T')[0], summary: '' });
        setDateError('');
        setIsCompletionModalOpen(true);
      } else {
        setToast({ message: `Unauthorized: Read-only access.`, type: 'error' });
      }
  }

  const handleDeleteRequest = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      try {
        const updatedList = await dataService.deleteCampaign(deleteTargetId);
        setCampaigns(updatedList);
        setIsDeleteModalOpen(false);
        setDeleteTargetId(null);
        setToast({ message: 'Campaign deleted successfully!', type: 'success' });
      } catch (error) {
        console.error('Error deleting campaign:', error);
        setToast({ message: 'Failed to delete campaign', type: 'error' });
      }
    }
  };

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case 'Approved': return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
      case 'Rejected': return 'text-red-500 border-red-500/30 bg-red-500/10';
      case 'Completed': return 'text-blue-500 border-blue-500/30 bg-blue-500/10';
      default: return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
    }
  };
  
  const getStatusBadge = (status: CampaignStatus) => {
      switch (status) {
        case 'Approved': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
        case 'Rejected': return 'bg-red-500/10 text-red-500 border border-red-500/20';
        case 'Completed': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
        default: return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
      }
  };

  const getInfluencerDetails = (id: string) => influencers.find(i => i.id === id);

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'All' || campaign.department === deptFilter;
    const matchesDate = !dateFilter || campaign.startDate === dateFilter;
    
    let matchesTab = true;
    if (activeTab === 'my') {
       matchesTab = !!(currentUserEmail && campaign.createdBy === currentUserEmail);
    }

    return matchesSearch && matchesDept && matchesDate && matchesTab;
  });

  const deptOptions: Option[] = [
    { value: 'All', label: 'All Departments' },
    ...departments.map(d => ({ value: d.name, label: d.name }))
  ];

  // --- Modal: Campaign Details ---
  const CampaignDetailsModal = ({ campaign, onClose }: { campaign: Campaign, onClose: () => void }) => {
    const influencer = getInfluencerDetails(campaign.influencerId);
    const editable = canEditCampaign(campaign);

    return (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <div 
            className="bg-black border border-dark-700 rounded-2xl w-full max-w-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-dark-700 bg-dark-900/50">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{campaign.name}</h2>
                    <div className="flex items-center gap-3">
                        <span className="px-2.5 py-0.5 rounded-md bg-dark-800 border border-dark-600 text-xs font-medium text-gray-300">
                           {campaign.department}
                        </span>
                        <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                        <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                            <Briefcase size={12} /> Influencer
                        </h3>
                        {influencer ? (
                            <div className="flex items-center gap-3">
                                <img src={influencer.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-dark-600" />
                                <div>
                                    <div className="text-white font-medium">{influencer.name}</div>
                                    <div className="text-xs text-primary-400">{influencer.handle}</div>
                                </div>
                            </div>
                        ) : (
                            <span className="text-gray-500 text-sm">Not assigned</span>
                        )}
                    </div>

                    <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                        <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                            <IndianRupee size={12} /> Financials
                        </h3>
                        <div className="text-2xl font-bold text-white">
                             ₹{campaign.budget.toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Total Budget</div>
                    </div>
                    
                    <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                        <button
                            onClick={() => {
                                setCampaignForSummary(campaign);
                                setIsCampaignSummaryModalOpen(true);
                            }}
                            className="w-full px-5 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold hover:from-primary-500 hover:to-primary-400 transition-all duration-200 shadow-lg shadow-primary-600/30 hover:shadow-xl hover:shadow-primary-600/40 flex items-center justify-center gap-2.5 text-sm group transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <FileText size={18} className="group-hover:scale-110 transition-transform duration-200" />
                            <span>View Campaign Summary</span>
                        </button>
                    </div>
                    
                    {/* Status Control */}
                    <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                         <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                            <CheckCircle2 size={12} /> Campaign Status
                        </h3>
                        {editable ? (
                            <div className="space-y-3">
                            <div className="relative">
                                <select
                                    value={campaign.status}
                                        onChange={(e) => {
                                          const selectedStatus = e.target.value as CampaignStatus;
                                          if (selectedStatus !== campaign.status) {
                                            initiateStatusChange(campaign, selectedStatus);
                                          }
                                        }}
                                        disabled={campaign.status !== 'Pending' && (campaign.status === 'Approved' || campaign.status === 'Rejected' || campaign.status === 'Completed')}
                                        className="w-full appearance-none pl-3 pr-8 py-2 text-sm font-medium rounded-lg border bg-dark-900 border-dark-600 text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                    {/* Only show Completed option if status is Approved or already Completed */}
                                    {(campaign.status === 'Approved' || campaign.status === 'Completed') && (
                                        <option value="Completed">Completed</option>
                                    )}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                            <div className="text-sm text-gray-400 italic">
                                Read-only access
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Deliverables Section */}
                <div>
                    <h3 className="text-white text-md font-bold mb-3 flex items-center gap-2">
                        <FileText size={16} className="text-primary-500" /> Deliverables
                    </h3>
                    <div className="bg-dark-900/30 rounded-xl p-4 border border-dark-700 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {campaign.deliverables || "No deliverables specified."}
                    </div>
                </div>

                {/* Completion Section */}
                {campaign.status === 'Completed' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <h3 className="text-white text-md font-bold mb-3 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-blue-500" /> Completion Report
                        </h3>
                        <div className="bg-blue-500/5 rounded-xl p-5 border border-blue-500/20">
                            <div className="flex items-center gap-4 mb-3 pb-3 border-b border-blue-500/10">
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Completed On</span>
                                <span className="text-sm text-white font-mono">{campaign.completionDate}</span>
                            </div>
                            <p className="text-gray-300 text-sm italic">
                                "{campaign.completionSummary}"
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-dark-700 bg-dark-900 flex justify-end gap-3">
                 <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-800 transition-colors text-sm font-medium">
                    Close
                 </button>
                 
                 {editable && campaign.status === 'Approved' && (
                     <button 
                        onClick={() => {
                            // Close details first then open completion modal
                            onClose();
                            initiateLogCompletion(campaign);
                        }}
                        className="px-5 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-500 transition-colors text-sm shadow-lg shadow-primary-600/20"
                     >
                        Complete Campaign
                     </button>
                 )}
            </div>
          </div>
        </div>
    );
  };

  // --- Modal: Campaign Summary ---
  const CampaignSummaryModal = ({ campaign, onClose }: { campaign: Campaign, onClose: () => void }) => {
    const [createdByUser, setCreatedByUser] = useState<{ name: string; department?: string } | null>(null);
    const [statusChangedByUser, setStatusChangedByUser] = useState<{ name: string; department?: string } | null>(null);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);

    useEffect(() => {
      const loadUserData = async () => {
        setIsLoadingUsers(true);
        try {
          // Load created by user
          if (campaign.createdBy) {
            try {
              const user = await firebaseUsersService.getUserByEmail(campaign.createdBy);
              if (user) {
                setCreatedByUser({ name: user.name, department: user.department });
              }
            } catch (error) {
              console.error('Error loading created by user:', error);
            }
          }

          // Load status changed by user
          if (campaign.statusChangedBy) {
            try {
              const user = await firebaseUsersService.getUserByEmail(campaign.statusChangedBy);
              if (user) {
                setStatusChangedByUser({ name: user.name, department: user.department });
              }
            } catch (error) {
              console.error('Error loading status changed by user:', error);
            }
          }
        } finally {
          setIsLoadingUsers(false);
        }
      };
      loadUserData();
    }, [campaign.createdBy, campaign.statusChangedBy]);

    const formatDateTime = (dateString?: string): string => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      } catch {
        return dateString;
      }
    };

    const formatDate = (dateString?: string): string => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      } catch {
        return dateString;
      }
    };

    return (
      <div 
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div 
          className="bg-black border border-dark-700 rounded-2xl w-full max-w-3xl overflow-hidden relative animate-in fade-in zoom-in duration-200 shadow-2xl flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-dark-700 bg-dark-900/50">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Campaign Summary</h2>
              <p className="text-gray-400 text-sm">{campaign.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
            {/* Campaign Creation */}
            {campaign.createdAt && (
              <div className="bg-dark-900/50 rounded-xl p-5 border border-dark-700">
                <h3 className="text-gray-500 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                  <Calendar size={14} /> Campaign Creation
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-2"></div>
                    <div className="flex-1">
                      <div className="text-white font-medium mb-1">Campaign Created</div>
                      <div className="text-sm text-gray-400">
                        <div className="mb-1">
                          <span className="text-gray-500">Date & Time:</span>{' '}
                          <span className="text-white">{formatDateTime(campaign.createdAt)}</span>
                        </div>
                        {campaign.createdBy && (
                          <div className="mb-1">
                            <span className="text-gray-500">Created By:</span>{' '}
                            <span className="text-white">
                              {isLoadingUsers ? 'Loading...' : (createdByUser?.name || campaign.createdBy)}
                            </span>
                            {createdByUser?.department && (
                              <span className="text-gray-500 ml-2">({createdByUser.department})</span>
                            )}
                          </div>
                        )}
                        {campaign.department && (
                          <div>
                            <span className="text-gray-500">Department:</span>{' '}
                            <span className="text-white">{campaign.department}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status Change History */}
            {campaign.statusChangeDate && (
              <div className="bg-dark-900/50 rounded-xl p-5 border border-dark-700">
                <h3 className="text-gray-500 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                  <CheckCircle2 size={14} /> Status Change History
                </h3>
                <div className="space-y-4">
                  {/* Pending to Approved/Rejected/Completed */}
                  {campaign.status !== 'Pending' && campaign.statusChangeDate && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div className="flex-1">
                        <div className="text-white font-medium mb-1">
                          Status Changed: Pending → {campaign.status}
                        </div>
                        <div className="text-sm text-gray-400">
                          <div className="mb-1">
                            <span className="text-gray-500">Date & Time:</span>{' '}
                            <span className="text-white">{formatDateTime(campaign.statusChangeDate)}</span>
                          </div>
                          {campaign.statusChangedBy && (
                            <div className="mb-1">
                              <span className="text-gray-500">Changed By:</span>{' '}
                              <span className="text-white">
                                {isLoadingUsers ? 'Loading...' : (statusChangedByUser?.name || campaign.statusChangedBy)}
                              </span>
                              {statusChangedByUser?.department && (
                                <span className="text-gray-500 ml-2">({statusChangedByUser.department})</span>
                              )}
                            </div>
                          )}
                          {campaign.statusChangeSummary && (
                            <div className="mt-2 pt-2 border-t border-dark-700">
                              <span className="text-gray-500">Summary:</span>
                              <div className="text-white mt-1 italic">{campaign.statusChangeSummary}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Completion (if status is Completed) */}
                  {campaign.status === 'Completed' && campaign.completionDate && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                      <div className="flex-1">
                        <div className="text-white font-medium mb-1">Campaign Completed</div>
                        <div className="text-sm text-gray-400">
                          <div>
                            <span className="text-gray-500">Completion Date:</span>{' '}
                            <span className="text-white">{formatDate(campaign.completionDate)}</span>
                          </div>
                          {campaign.completionSummary && (
                            <div className="mt-2 pt-2 border-t border-dark-700">
                              <span className="text-gray-500">Completion Summary:</span>
                              <div className="text-white mt-1 italic">{campaign.completionSummary}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline Overview */}
            <div className="bg-dark-900/50 rounded-xl p-5 border border-dark-700">
              <h3 className="text-gray-500 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                <Clock size={14} /> Timeline Overview
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Start Date:</span>
                  <span className="text-white font-medium">{formatDate(campaign.startDate)}</span>
                </div>
                {/* Show Approval Date if status is Approved */}
                {campaign.status === 'Approved' && campaign.statusChangeDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Approval Date:</span>
                    <span className="text-white font-medium">{formatDate(campaign.statusChangeDate)}</span>
                  </div>
                )}
                {/* Show Rejected Date if status is Rejected */}
                {campaign.status === 'Rejected' && campaign.statusChangeDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Rejected Date:</span>
                    <span className="text-white font-medium">{formatDate(campaign.statusChangeDate)}</span>
                  </div>
                )}
                {/* Show Completion Date if status is Completed */}
                {campaign.status === 'Completed' && campaign.completionDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Completion Date:</span>
                    <span className="text-white font-medium">{formatDate(campaign.completionDate)}</span>
                  </div>
                )}
                {/* Show End Date if campaign is completed and endDate exists */}
                {campaign.status === 'Completed' && campaign.endDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">End Date:</span>
                    <span className="text-white font-medium">{formatDate(campaign.endDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Show message if no timeline data exists */}
            {!campaign.createdAt && !campaign.statusChangeDate && (
              <div className="bg-dark-900/30 rounded-xl p-5 border border-dark-700 text-center">
                <p className="text-gray-400 text-sm">No timeline data available for this campaign.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-dark-700 bg-dark-900 flex justify-end">
            <button 
              onClick={onClose} 
              className="px-5 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-500 transition-colors text-sm shadow-lg shadow-primary-600/20"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Modal: Create Campaign ---
  const CreateCampaignModal = () => {
    const isEditMode = !!editingCampaign;

    // Helper function to convert ISO date to yyyy-MM-dd format for date input
    const formatDateForInput = (dateString: string | undefined): string => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) return '';
        // Return in yyyy-MM-dd format
        return date.toISOString().split('T')[0];
      } catch (error) {
        // If already in yyyy-MM-dd format, return as is
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateString;
        }
        return '';
      }
    };

    // Store original campaign data for comparison
    const getOriginalFormData = useMemo(() => {
      if (!editingCampaign || !isEditMode) return null;
      const formattedDate = formatDateForInput(editingCampaign.startDate);
      return {
        influencerId: editingCampaign.influencerId || '',
        name: editingCampaign.name || '',
        department: editingCampaign.department || '',
        amount: editingCampaign.budget?.toString() || '',
        date: formattedDate,
        deliverables: editingCampaign.deliverables || ''
      };
    }, [editingCampaign, isEditMode]);

    const [formData, setFormData] = useState({
      influencerId: editingCampaign?.influencerId || '',
      name: editingCampaign?.name || '',
      department: editingCampaign?.department || ((role === 'manager' || role === 'executive') && userDept ? userDept : ''),
      amount: editingCampaign?.budget?.toString() || '',
      date: formatDateForInput(editingCampaign?.startDate),
      deliverables: editingCampaign?.deliverables || ''
    });

    // Check if form has been modified
    const hasChanges = useMemo(() => {
      if (!isEditMode || !getOriginalFormData) return false;
      
      const original = getOriginalFormData;
      
      return (
        formData.influencerId !== original.influencerId ||
        formData.name !== original.name ||
        formData.department !== original.department ||
        formData.amount !== original.amount ||
        formData.date !== original.date ||
        formData.deliverables !== original.deliverables
      );
    }, [formData, getOriginalFormData, isEditMode]);

    // Reset form when editing campaign changes
    useEffect(() => {
      if (editingCampaign) {
        setFormData({
          influencerId: editingCampaign.influencerId || '',
          name: editingCampaign.name || '',
          department: editingCampaign.department || ((role === 'manager' || role === 'executive') && userDept ? userDept : ''),
          amount: editingCampaign.budget?.toString() || '',
          date: formatDateForInput(editingCampaign.startDate),
          deliverables: editingCampaign.deliverables || ''
        });
      } else {
        // Reset form when creating new campaign
        setFormData({
          influencerId: '',
          name: '',
          department: ((role === 'manager' || role === 'executive') && userDept ? userDept : ''),
          amount: '',
          date: '',
          deliverables: ''
        });
      }
    }, [editingCampaign, role, userDept]);

    const deptFormOptions: Option[] = departments.map(d => ({ value: d.name, label: d.name }));
    
    const influencerOptions: Option[] = influencers.map(inf => ({
        value: inf.id,
        label: `${inf.name} (${inf.handle})`
    }));

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.name || !formData.amount || !formData.date || !formData.department) {
        alert("Please fill in all required fields.");
        return;
      }

      const campaignData: Campaign = {
        id: editingCampaign ? editingCampaign.id : `c_${Date.now()}`,
        name: formData.name,
        influencerId: formData.influencerId, 
        department: formData.department,
        status: editingCampaign ? editingCampaign.status : 'Pending',
        budget: Number(formData.amount),
        startDate: formData.date,
        endDate: editingCampaign?.endDate || '', // Preserve existing endDate on edit, empty for new campaigns
        deliverables: formData.deliverables,
        createdBy: editingCampaign ? editingCampaign.createdBy : (currentUserEmail || undefined),
        createdAt: editingCampaign ? editingCampaign.createdAt : new Date().toISOString() // Set creation date only for new campaigns
      };

      try {
        let updatedList;
        if (editingCampaign) {
            updatedList = await dataService.updateCampaign(campaignData);
            setToast({ message: "Campaign updated successfully!", type: "success" });
        } else {
            updatedList = await dataService.addCampaign(campaignData);
            setToast({ message: "Campaign logged successfully!", type: "success" });
        }
        setCampaigns(updatedList);
        setIsCreateModalOpen(false);
        setEditingCampaign(null);
      } catch (error) {
        console.error('Error saving campaign:', error);
        setToast({ message: "Failed to save campaign", type: "error" });
      }
    };

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={() => {
            setIsCreateModalOpen(false);
            setEditingCampaign(null);
        }}
      >
        <div 
          className="bg-black border border-dark-700 rounded-xl w-full max-w-md relative animate-in fade-in zoom-in duration-200 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 pb-2">
             <div>
                 <h2 className="text-xl font-bold text-white">{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</h2>
                 <p className="text-gray-400 text-xs mt-1">{editingCampaign ? 'Update campaign details.' : 'Record a new campaign association with an influencer.'}</p>
             </div>
             <button onClick={() => {
                 setIsCreateModalOpen(false);
                 setEditingCampaign(null);
             }} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
             </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* Influencer Select */}
            <div>
               <label className="block text-sm font-medium text-gray-300 mb-1.5">Influencer</label>
               <SearchableSelect 
                  options={influencerOptions}
                  value={formData.influencerId}
                  onChange={(val) => setFormData({...formData, influencerId: val})}
                  placeholder="Select an influencer"
               />
            </div>

            {/* Campaign Name */}
            <div>
               <label className="block text-sm font-medium text-gray-300 mb-1.5">Campaign Name</label>
               <input 
                 type="text" 
                 required
                 value={formData.name}
                 onChange={(e) => setFormData({...formData, name: e.target.value})}
                 placeholder="e.g., Summer 2024 Launch" 
                 className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-all text-sm placeholder-gray-600" 
               />
            </div>

            {/* Department Field */}
            <div>
               <label className="block text-sm font-medium text-gray-300 mb-1.5">Department</label>
               {((role === 'manager' || role === 'executive') && userDept) ? (
                   <div className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-gray-400 text-sm cursor-not-allowed flex items-center justify-between">
                       <span>{userDept}</span>
                       <Lock size={14} className="opacity-50" />
                   </div>
               ) : (
                   <SearchableSelect 
                      options={deptFormOptions}
                      value={formData.department}
                      onChange={(val) => setFormData({...formData, department: val})}
                      placeholder="Select Department"
                   />
               )}
            </div>

            {/* Amount */}
            <div>
               <label className="block text-sm font-medium text-gray-300 mb-1.5">Amount (₹)</label>
               <input 
                 type="text" 
                 required
                 value={formData.amount}
                 onChange={(e) => {
                    const val = e.target.value;
                    // Only allow positive integers
                    if (val === '' || /^\d+$/.test(val)) {
                        setFormData({...formData, amount: val});
                    }
                 }}
                 placeholder="400000" 
                 className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-all text-sm placeholder-gray-600" 
               />
            </div>

            {/* Campaign Date */}
            <div>
               <label className="block text-sm font-medium text-gray-300 mb-1.5">Campaign Date</label>
               <div className="relative">
                 <input 
                     type="date" 
                     required
                     value={formData.date}
                     onChange={(e) => setFormData({...formData, date: e.target.value})}
                     className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-all text-sm [color-scheme:dark]" 
                 />
               </div>
            </div>
            
            {/* Deliverables */}
            <div>
               <label className="block text-sm font-medium text-gray-300 mb-1.5">Deliverables</label>
               <textarea
                 rows={3}
                 value={formData.deliverables}
                 onChange={(e) => setFormData({...formData, deliverables: e.target.value})}
                 placeholder="e.g., 2 Instagram posts, 1 YouTube video"
                 className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 resize-none text-sm placeholder-gray-600"
               />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
               <button type="button" onClick={() => {
                   setIsCreateModalOpen(false);
                   setEditingCampaign(null);
               }} className="px-4 py-2 rounded-lg text-white hover:bg-dark-800 transition-colors text-sm font-medium">Cancel</button>
               {/* Show Update Campaign button only when in edit mode AND there are changes, or when adding new campaign */}
               {(!isEditMode || hasChanges) && (
               <button type="submit" className="px-6 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-500 transition-colors text-sm shadow-lg shadow-primary-600/20">
                     {isEditMode ? 'Update Campaign' : 'Create Campaign'}
               </button>
               )}
            </div>
          </form>
        </div>
      </div>
    );
  };

  const handleConfirmAndComplete = async () => {
      if (!campaignToComplete) return;

      setIsConfirmCompletionOpen(false);

      try {
        const updatedList = await dataService.completeCampaign(campaignToComplete.id, compData.date, compData.summary);
        setCampaigns(updatedList);
        
        // Update selected campaign details immediately if open
        if (selectedCampaign && selectedCampaign.id === campaignToComplete.id) {
            const updatedCampaign = updatedList.find(c => c.id === campaignToComplete.id);
            if(updatedCampaign) setSelectedCampaign(updatedCampaign);
        }

        setToast({ message: "Campaign marked as Completed!", type: "success" });
        setCampaignToComplete(null);
        // Reset form data
        setCompData({ date: new Date().toISOString().split('T')[0], summary: '' });
        setDateError('');
      } catch (error) {
        console.error('Error completing campaign:', error);
        setToast({ message: "Failed to complete campaign", type: "error" });
      }
  };

  // Handlers for Completion Modal
  const handleCompletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaignToComplete) return;

    // Validate that completion date is not before start date
    const startDate = new Date(campaignToComplete.startDate);
    const endDate = new Date(compData.date);
    
    if (endDate < startDate) {
      setToast({ message: 'Completion date cannot be before campaign start date', type: 'error' });
      return;
    }

    // Show confirmation modal instead of directly completing
    setIsCompletionModalOpen(false);
    setIsConfirmCompletionOpen(true);
  };

  const handleCompletionClose = () => {
    setIsCompletionModalOpen(false);
    setCampaignToComplete(null);
    setCompData({ date: new Date().toISOString().split('T')[0], summary: '' });
    setDateError('');
  };

  // --- Modal: Confirm Completion ---
  const ConfirmCompletionModal = () => {
    return (
      <div 
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={() => {
          setIsConfirmCompletionOpen(false);
          setIsCompletionModalOpen(true); // Go back to form
        }}
      >
        <div 
          className="bg-dark-900 border border-dark-700 rounded-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200 shadow-2xl border-l-4 border-l-emerald-500"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Complete Campaign?</h3>
              <p className="text-gray-400 text-sm mt-1">
                Are you sure you want to mark <span className="text-white font-medium">"{campaignToComplete?.name}"</span> as completed? This action cannot be undone.
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 mt-6">
            <button 
              onClick={() => {
                setIsConfirmCompletionOpen(false);
                setIsCompletionModalOpen(true); // Go back to form
              }}
              className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmAndComplete}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors text-sm shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              Yes, Complete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-2xl border flex items-center gap-3 animation-fade-in ${
          toast.type === 'success' 
            ? 'bg-emerald-900/90 border-emerald-500 text-white' 
            : 'bg-red-900/90 border-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Campaigns</h1>
          <p className="text-gray-400">
             Viewing all campaigns as <span className="text-primary-400 font-semibold capitalize">{role}</span>
             {role === 'manager' && <span> in <span className="text-primary-400 font-semibold capitalize">{userDept}</span></span>}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
          {/* Search Input */}
          <div className="relative md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..." 
                className="bg-dark-800 border border-dark-700 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary-500 w-40 md:w-56 text-slate-200 placeholder-gray-600 transition-all"
              />
          </div>

          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${isFilterOpen ? 'bg-dark-700 border-primary-500 text-white' : 'bg-dark-800 border-dark-700 text-gray-300 hover:text-white hover:border-gray-500'}`}
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Filters</span>
          </button>
          
          <div className="flex bg-dark-800 rounded-lg border border-dark-700 p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-dark-700 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
              >
                <Grid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-dark-700 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
              >
                <List size={18} />
              </button>
          </div>

          {(role === 'manager' || role === 'executive' || role === 'admin' || role === 'super_admin') && (
              <button 
                onClick={handleCreateClick}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors shadow-lg shadow-primary-600/20"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Create Campaign</span>
              </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-dark-800 p-1 rounded-xl w-fit mb-6 border border-dark-700">
          <button 
             onClick={() => setActiveTab('all')}
             className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            All Campaigns
          </button>
          <button 
             onClick={() => setActiveTab('my')}
             className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'my' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <User size={16} />
            My Campaigns
          </button>
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4 mb-6 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 max-w-2xl">
                {/* Department Filter */}
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1.5">Department</label>
                   <SearchableSelect 
                     options={deptOptions}
                     value={deptFilter}
                     onChange={setDeptFilter}
                     placeholder="Filter by Department"
                   />
                </div>

                {/* Date Filter */}
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
                   <input 
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full bg-dark-800 border border-dark-700 text-sm rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-primary-500 [color-scheme:dark]"
                   />
                </div>
            </div>
        </div>
      )}

      {/* View Content */}
      {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCampaigns.map(campaign => (
                  <div 
                    key={campaign.id}
                    onClick={() => setSelectedCampaign(campaign)}
                    className="bg-dark-800 border border-dark-700 rounded-xl p-5 hover:border-primary-500 hover:shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)] hover:-translate-y-1 transition-all cursor-pointer group"
                  >
                      <div className="flex justify-between items-start mb-3">
                         <span className="px-2.5 py-1 rounded-md bg-dark-900 border border-dark-700 text-xs font-medium text-gray-300">
                            {campaign.department}
                         </span>
                         <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(campaign.status).replace('border', 'bg').split(' ')[0]}`}></div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-white mb-1 truncate">{campaign.name}</h3>
                      
                      <div className="flex items-center justify-between mt-auto">
                          <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                             {campaign.status}
                          </div>
                      </div>

                      {/* Edit and Delete Buttons on card for 'My Campaigns' tab */}
                      {activeTab === 'my' && (
                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClick(campaign);
                                  }}
                                  className="p-2 rounded-lg bg-dark-900/80 border border-dark-600 text-gray-400 hover:text-white hover:border-primary-500 hover:bg-primary-600 transition-all"
                                  title="Edit Campaign"
                              >
                                  <Pencil size={14} />
                              </button>
                              <button 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteRequest(campaign.id);
                                  }}
                                  className="p-2 rounded-lg bg-dark-900/80 border border-dark-600 text-gray-400 hover:text-white hover:border-red-500 hover:bg-red-600 transition-all"
                                  title="Delete Campaign"
                              >
                                  <Trash2 size={14} />
                              </button>
                          </div>
                      )}
                  </div>
              ))}
              {filteredCampaigns.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500">
                    <p className="text-lg font-medium mb-1">No campaigns found.</p>
                </div>
              )}
          </div>
      ) : (
          /* List View (Table) */
          <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-dark-900/50 text-gray-400 text-sm border-b border-dark-700">
                    <th className="px-6 py-4 font-semibold">Campaign Name</th>
                    <th className="px-6 py-4 font-semibold">Department</th>
                    <th className="px-6 py-4 font-semibold">Influencer</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold">Campaign Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                {filteredCampaigns.map((campaign) => {
                    const influencer = getInfluencerDetails(campaign.influencerId);
                    const editable = canEditCampaign(campaign);

                    return (
                    <tr 
                        key={campaign.id} 
                        className="hover:bg-dark-700/30 transition-colors group cursor-pointer"
                        onClick={() => setSelectedCampaign(campaign)}
                    >
                        <td className="px-6 py-4">
                        <div className="font-medium text-white">{campaign.name}</div>
                        </td>
                        <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-md bg-dark-900 border border-dark-700 text-xs font-medium text-gray-300">
                            {campaign.department}
                        </span>
                        </td>
                        <td className="px-6 py-4">
                        {influencer ? (
                            <div className="flex items-center gap-3">
                            <img src={influencer.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                            <div>
                                <div className="text-sm text-slate-200">{influencer.name}</div>
                                <div className="text-xs text-gray-500">{influencer.handle}</div>
                            </div>
                            </div>
                        ) : (
                            <span className="text-gray-500 text-sm">Unknown Influencer</span>
                        )}
                        </td>
                        <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar size={14} />
                            <span>{new Date(campaign.startDate).toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
                        </div>
                        </td>
                        <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-slate-200 font-mono">
                            <span className="text-gray-500 font-sans">₹</span>
                            {campaign.budget.toLocaleString('en-IN')}
                        </div>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        {editable ? (
                            <div className="relative inline-block w-36">
                            <select
                                value={campaign.status}
                                onChange={(e) => {
                                  const selectedStatus = e.target.value as CampaignStatus;
                                  if (selectedStatus !== campaign.status) {
                                    initiateStatusChange(campaign, selectedStatus);
                                  }
                                }}
                                disabled={campaign.status !== 'Pending' && (campaign.status === 'Approved' || campaign.status === 'Rejected' || campaign.status === 'Completed')}
                                className="w-full appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-full border bg-dark-900 border-dark-700 text-white focus:outline-none focus:border-primary-500 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                {/* Only show Completed option if status is Approved or already Completed */}
                                {(campaign.status === 'Approved' || campaign.status === 'Completed') && (
                                    <option value="Completed">Completed</option>
                                )}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                            </div>
                        ) : (
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusBadge(campaign.status)}`}>
                                {campaign.status}
                                <Lock size={10} className="opacity-50" />
                            </div>
                        )}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                                <div className="group/tooltip relative inline-block">
                                    {campaign.status === 'Pending' && editable ? (
                                        <button 
                                            onClick={() => initiateStatusChange(campaign, 'Approved')}
                                            className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white"
                                        >
                                            Approve
                                        </button>
                                    ) : campaign.status === 'Approved' && editable ? (
                                        <button 
                                            onClick={() => initiateLogCompletion(campaign)}
                                            className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors bg-primary-600/20 text-primary-400 hover:bg-primary-600 hover:text-white"
                                        >
                                            Complete
                                        </button>
                                    ) : campaign.status === 'Rejected' ? (
                                        <span className="text-xs font-medium px-3 py-1.5 rounded-md bg-dark-900 text-gray-500 cursor-not-allowed">
                                            No Action required
                                        </span>
                                    ) : campaign.status === 'Completed' ? (
                                        <span className="text-xs font-medium px-3 py-1.5 rounded-md bg-dark-900 text-gray-500 cursor-not-allowed">
                                            Completed
                                        </span>
                                    ) : (
                                        <button 
                                            disabled
                                            className="text-xs font-medium px-3 py-1.5 rounded-md bg-dark-900 text-gray-600 cursor-not-allowed"
                                        >
                                            {campaign.status === 'Pending' ? 'Approve' : 'Complete'}
                                        </button>
                                    )}
                                    
                                    {/* Tooltip explaining why it's disabled */}
                                    {(!editable && campaign.status !== 'Rejected' && campaign.status !== 'Completed') && (
                                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black border border-dark-700 text-gray-300 text-xs rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                                            {role === 'executive' ? 'Read-only: Observer Mode' : `Read-only: Owned by ${campaign.department}`}
                                        </div>
                                    )}
                                </div>

                                {activeTab === 'my' && (
                                    <>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditClick(campaign);
                                            }}
                                            className="p-1.5 rounded-md bg-dark-900 border border-dark-700 text-gray-400 hover:text-white hover:border-primary-500 hover:bg-primary-600 transition-colors"
                                            title="Edit"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteRequest(campaign.id);
                                            }}
                                            className="p-1.5 rounded-md bg-dark-900 border border-dark-700 text-gray-400 hover:text-white hover:border-red-500 hover:bg-red-600 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
            </div>
            {filteredCampaigns.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                    <p>No campaigns found matching your filters.</p>
                </div>
            )}
            
            <div className="px-6 py-4 bg-dark-900/30 border-t border-dark-700 flex items-center justify-between text-xs text-gray-500">
                <span>Showing {filteredCampaigns.length} entries</span>
                <div className="flex gap-2">
                    <button className="px-3 py-1 rounded border border-dark-700 hover:text-white disabled:opacity-50" disabled>Previous</button>
                    <button className="px-3 py-1 rounded border border-dark-700 hover:text-white disabled:opacity-50" disabled>Next</button>
                </div>
            </div>
          </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && <CreateCampaignModal />}
      
      {/* Completion Modal - Inline to prevent remounting */}
      {isCompletionModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={handleCompletionClose}
        >
          <div 
            className="bg-black border border-dark-700 rounded-xl w-full max-w-md relative animate-in fade-in zoom-in duration-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="flex items-center justify-between p-6 pb-2 border-b border-dark-700/50">
                 <div>
                     <h2 className="text-xl font-bold text-white">Complete Campaign</h2>
                     <p className="text-gray-400 text-xs mt-1">Finalize "{campaignToComplete?.name}"</p>
                 </div>
                 <button onClick={handleCompletionClose} className="text-gray-400 hover:text-white transition-colors">
                    <X size={20} />
                 </button>
             </div>

             <form onSubmit={handleCompletionSubmit} className="p-6 space-y-5">
                
                {/* Completion Date */}
                <div>
                   <label className="block text-sm font-medium text-gray-300 mb-1.5">Completion Date</label>
                   <div className="relative">
                     <input 
                         type="date" 
                         required
                         value={compData.date}
                         min={campaignToComplete?.startDate ? new Date(campaignToComplete.startDate).toISOString().split('T')[0] : undefined}
                         max={new Date().toISOString().split('T')[0]}
                         onChange={(e) => setCompData({...compData, date: e.target.value})}
                         className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:border-primary-600 focus:ring-primary-600 transition-all text-sm [color-scheme:dark]"
                     />
                     <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" size={16} />
                   </div>
                   {campaignToComplete?.startDate && (
                     <p className="text-gray-500 text-xs mt-1">
                       Campaign started on {new Date(campaignToComplete.startDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
                     </p>
                   )}
                </div>

                {/* Summary */}
                <div>
                   <label className="block text-sm font-medium text-gray-300 mb-1.5">Summary / Feedback</label>
                   <textarea
                     rows={4}
                     required
                     value={compData.summary}
                     onChange={(e) => setCompData({...compData, summary: e.target.value})}
                     placeholder="How did the campaign perform? Any key takeaways?"
                     className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 resize-none text-sm placeholder-gray-600"
                   />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                   <button type="button" onClick={handleCompletionClose} className="px-4 py-2 rounded-lg text-white hover:bg-dark-800 transition-colors text-sm font-medium">Cancel</button>
                   <button type="submit" className="px-6 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors text-sm shadow-lg shadow-emerald-600/20 flex items-center gap-2">
                       <CheckCircle2 size={16} />
                       Complete Campaign
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
      
      {isConfirmCompletionOpen && <ConfirmCompletionModal />}

      {/* Status Change Modal */}
      {isStatusChangeModalOpen && campaignToChangeStatus && newStatus && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => {
            setIsStatusChangeModalOpen(false);
            setCampaignToChangeStatus(null);
            setNewStatus(null);
            setStatusChangeSummary('');
            setStatusChangeError('');
          }}
        >
          <div 
            className="bg-dark-900 border border-dark-700 rounded-xl w-full max-w-md relative animate-in fade-in zoom-in duration-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 pb-2">
              <div>
                <h2 className="text-xl font-bold text-white">Change Campaign Status</h2>
                <p className="text-gray-400 text-xs mt-1">
                  Update status for "{campaignToChangeStatus.name}" to {newStatus}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsStatusChangeModalOpen(false);
                  setCampaignToChangeStatus(null);
                  setNewStatus(null);
                  setStatusChangeSummary('');
                  setStatusChangeError('');
                }} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleStatusChange();
              }} 
              className="p-6 space-y-5"
            >
              {/* Current Status */}
              <div className="bg-dark-800/50 rounded-lg p-3 border border-dark-700">
                <div className="text-xs text-gray-500 mb-1">Current Status</div>
                <div className="text-white font-medium">{campaignToChangeStatus.status}</div>
              </div>

              {/* New Status */}
              <div className="bg-primary-500/10 rounded-lg p-3 border border-primary-500/30">
                <div className="text-xs text-primary-400 mb-1">New Status</div>
                <div className="text-white font-medium">{newStatus}</div>
              </div>

              {/* Summary/Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Summary / Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={statusChangeSummary}
                  onChange={(e) => {
                    setStatusChangeSummary(e.target.value);
                    if (statusChangeError) setStatusChangeError('');
                  }}
                  placeholder={
                    newStatus === 'Approved' 
                      ? 'Please provide a reason for approving this campaign...'
                      : newStatus === 'Rejected'
                      ? 'Please provide a reason for rejecting this campaign...'
                      : 'Please provide a summary for completing this campaign...'
                  }
                  className={`w-full bg-dark-900 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-1 resize-none text-sm placeholder-gray-600 ${
                    statusChangeError 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : 'border-dark-700 focus:border-primary-600 focus:ring-primary-600'
                  }`}
                />
                {statusChangeError && (
                  <p className="text-red-500 text-xs mt-1">{statusChangeError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsStatusChangeModalOpen(false);
                    setCampaignToChangeStatus(null);
                    setNewStatus(null);
                    setStatusChangeSummary('');
                    setStatusChangeError('');
                  }} 
                  className="px-4 py-2 rounded-lg text-white hover:bg-dark-800 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-500 transition-colors text-sm shadow-lg shadow-primary-600/20"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div 
            className="bg-dark-900 border border-dark-700 rounded-xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200 shadow-2xl border-l-4 border-l-red-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Delete Campaign?</h3>
                    <p className="text-gray-400 text-sm mt-1">
                        Are you sure you want to delete this campaign? This action cannot be undone.
                    </p>
                </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
                <button 
                    onClick={() => setIsDeleteModalOpen(false)} 
                    className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-colors text-sm font-medium"
                >
                    Cancel
                </button>
                <button 
                    onClick={confirmDelete} 
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-sm shadow-lg shadow-red-600/20 flex items-center gap-2"
                >
                    <Trash2 size={16} />
                    Delete
                </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Detail View Modal */}
      {selectedCampaign && (
          <CampaignDetailsModal 
             campaign={selectedCampaign} 
             onClose={() => setSelectedCampaign(null)} 
          />
      )}

      {campaignForSummary && (
        <CampaignSummaryModal
            campaign={campaignForSummary}
            onClose={() => {
              setCampaignForSummary(null);
              setIsCampaignSummaryModalOpen(false);
            }}
        />
      )}
    </>
  );
};

export default Campaigns;