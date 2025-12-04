export type Role = 'manager' | 'executive' | 'admin' | 'super_admin';
export type CampaignStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'revoked';

export interface AccessRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  influencerId: string;
  influencerName: string;
  department: string;
  status: RequestStatus;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string; // Optional because executives might not have one, or it applies to all
  avatar: string;
}

export interface Department {
  id: string;
  name: string;
  hodName: string;
}

export interface Influencer {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  category: string;
  department?: string;
  // Extended details
  email?: string;
  mobile?: string;
  pan?: string;
  location?: string; // e.g., "Telugu" or City
  language?: string;
  type?: 'Person' | 'Meme Page' | 'Channel' | 'Agency';
  lastPricePaid?: number;
  lastPromoDate?: string;
  lastPromoBy?: string;
  platforms?: {
    instagram?: string;
    youtube?: string;
    instagramChannel?: string;
    youtubeChannel?: string;
  };
  createdBy?: string; // Email of the user who added this influencer
}

export interface Campaign {
  id: string;
  name: string;
  influencerId: string;
  department: string;
  status: CampaignStatus;
  budget: number;
  startDate: string;
  endDate: string;
  // Completion details
  completionDate?: string;
  rating?: number;
  completionSummary?: string;
  deliverables?: string;
  lastUpdated?: string; // Timestamp for sorting recent activity
  createdBy?: string; // Email of the user who created this campaign
  createdAt?: string; // Date when campaign was created
  // Status change tracking
  statusChangeDate?: string; // Date when status was changed from Pending
  statusChangeSummary?: string; // Summary/reason for status change
  statusChangedBy?: string; // Email of the user who changed the status
}