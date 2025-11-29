import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useLocation } from 'react-router-dom';
import { Users, Megaphone, CheckCircle2, Loader2 } from 'lucide-react';
import { CampaignStatus } from '../types';
import { useCampaigns, useInfluencers } from '../hooks/useDataService';

const Dashboard: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const role = params.get('role');
  const dept = params.get('department');

  // Load data from service (supports both Firebase and localStorage)
  const { campaigns: allCampaigns, loading: campaignsLoading } = useCampaigns();
  const { influencers: allInfluencers, loading: influencersLoading } = useInfluencers();
  
  const isLoading = campaignsLoading || influencersLoading;

  // Filter stats based on view
  const relevantCampaigns = role === 'manager' && dept 
    ? allCampaigns.filter(c => c.department.toLowerCase() === dept.toLowerCase())
    : allCampaigns;

  // Sort by lastUpdated (descending) so most recent changes appear first
  const sortedCampaigns = [...relevantCampaigns].sort((a, b) => {
    const dateA = new Date(a.lastUpdated || a.startDate).getTime();
    const dateB = new Date(b.lastUpdated || b.startDate).getTime();
    return dateB - dateA;
  });

  // Stats Calculations
  const totalInfluencers = allInfluencers.length;
  const totalCampaigns = relevantCampaigns.length;
  const approvedCampaigns = relevantCampaigns.filter(c => c.status === 'Approved').length;

  const getInfluencerName = (id: string) => {
    const influencer = allInfluencers.find(i => i.id === id);
    return influencer ? influencer.name : 'N/A';
  };

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'Rejected': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'Completed': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      default: return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-primary-500" size={32} />
            <p className="text-gray-400">Loading dashboard data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Dashboard Header with Viewing As Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
        
        <div className="flex items-center self-start md:self-auto gap-3">
          <span className="text-gray-400 text-sm font-medium">Viewing as:</span>
          <div className="px-4 py-1.5 rounded-full bg-dark-800/80 border border-dark-700 text-slate-200 text-sm font-semibold shadow-sm capitalize backdrop-blur-sm">
             {role === 'manager' && dept ? `${dept} Manager` : role || 'Guest'}
          </div>
        </div>
      </div>

      {/* Stats Cards - Glass Effect */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Total Influencers */}
        <div className="relative overflow-hidden bg-dark-800/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 group transition-all hover:bg-dark-800/60">
          <div className="flex justify-between items-start mb-4">
             <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Total Influencers</p>
                <h3 className="text-3xl font-bold text-white">{totalInfluencers}</h3>
             </div>
             <div className="p-3 bg-dark-700/50 rounded-xl text-gray-400 group-hover:text-primary-500 transition-colors">
                <Users size={20} />
             </div>
          </div>
        </div>

        {/* Card 2: Total Campaigns */}
        <div className="relative overflow-hidden bg-dark-800/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 group transition-all hover:bg-dark-800/60">
          <div className="flex justify-between items-start mb-4">
             <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Total Campaigns</p>
                <h3 className="text-3xl font-bold text-white">{totalCampaigns}</h3>
             </div>
             <div className="p-3 bg-dark-700/50 rounded-xl text-gray-400 group-hover:text-blue-500 transition-colors">
                <Megaphone size={20} />
             </div>
          </div>
        </div>

        {/* Card 3: Approved Campaigns */}
        <div className="relative overflow-hidden bg-dark-800/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 group transition-all hover:bg-dark-800/60">
          <div className="flex justify-between items-start mb-4">
             <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Approved Campaigns</p>
                <h3 className="text-3xl font-bold text-white">{approvedCampaigns}</h3>
             </div>
             <div className="p-3 bg-dark-700/50 rounded-xl text-gray-400 group-hover:text-emerald-500 transition-colors">
                <CheckCircle2 size={20} />
             </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table - Glass Effect */}
      <div className="bg-dark-800/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-bold text-white">Recent Campaign Activity</h2>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="text-gray-500 border-b border-white/5">
                        <th className="px-6 py-4 font-medium">Campaign</th>
                        <th className="px-6 py-4 font-medium">Influencer</th>
                        <th className="px-6 py-4 font-medium">Department</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {sortedCampaigns.map((campaign) => (
                        <tr key={campaign.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-200">{campaign.name}</td>
                            <td className="px-6 py-4 text-gray-400">{getInfluencerName(campaign.influencerId)}</td>
                            <td className="px-6 py-4">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-dark-900 border border-dark-700 text-gray-400">
                                    {campaign.department}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-gray-400">{campaign.startDate}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(campaign.status)}`}>
                                    {campaign.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {sortedCampaigns.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                No recent activity found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;