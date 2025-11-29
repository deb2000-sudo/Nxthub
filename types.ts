export type Role = 'manager' | 'executive' | 'admin' | 'super_admin';
export type CampaignStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string; // Optional because executives might not have one, or it applies to all
  avatar: string;
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
  lastPricePaid?: number;
  lastPromoDate?: string;
  lastPromoBy?: string;
  platforms?: {
    instagram?: string;
    youtube?: string;
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
}