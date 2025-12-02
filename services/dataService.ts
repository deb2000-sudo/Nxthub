import { Campaign, Influencer, CampaignStatus } from '../types';
import { MOCK_CAMPAIGNS, MOCK_INFLUENCERS } from '../constants';
import { USE_MOCK_DATA } from '../config/firebase';
import { 
  firebaseCampaignsService, 
  firebaseInfluencersService 
} from './firebaseService';

const CAMPAIGNS_KEY = 'nxthub_campaigns_data';
const INFLUENCERS_KEY = 'nxthub_influencers_data';

// LocalStorage helpers
const localStorageService = {
  // --- Campaigns ---
  getCampaigns: (): Campaign[] => {
    try {
      const stored = localStorage.getItem(CAMPAIGNS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error parsing campaigns from storage", e);
    }
    // Initialize with empty array if empty
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify([]));
    return [];
  },

  saveCampaigns: (campaigns: Campaign[]) => {
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
  },

  updateCampaignStatus: (id: string, status: CampaignStatus): Campaign[] => {
    const campaigns = localStorageService.getCampaigns();
    const updated = campaigns.map(c => c.id === id ? { 
      ...c, 
      status, 
      lastUpdated: new Date().toISOString() 
    } : c);
    localStorageService.saveCampaigns(updated);
    return updated;
  },

  addCampaign: (campaign: Campaign): Campaign[] => {
    const campaigns = localStorageService.getCampaigns();
    // Ensure lastUpdated is set on creation
    const newCampaign = { ...campaign, lastUpdated: new Date().toISOString() };
    const updated = [newCampaign, ...campaigns];
    localStorageService.saveCampaigns(updated);
    return updated;
  },

  completeCampaign: (id: string, date: string, summary: string): Campaign[] => {
    const campaigns = localStorageService.getCampaigns();
    const updated = campaigns.map(c => c.id === id ? { 
        ...c, 
        status: 'Completed' as CampaignStatus, 
        endDate: date, // Set endDate when completing
        completionDate: date, 
        completionSummary: summary,
        lastUpdated: new Date().toISOString()
    } : c);
    localStorageService.saveCampaigns(updated);
    return updated;
  },

  updateCampaign: (campaign: Campaign): Campaign[] => {
    const campaigns = localStorageService.getCampaigns();
    const updated = campaigns.map(c => c.id === campaign.id ? { ...campaign, lastUpdated: new Date().toISOString() } : c);
    localStorageService.saveCampaigns(updated);
    return updated;
  },

  deleteCampaign: (id: string): Campaign[] => {
    const campaigns = localStorageService.getCampaigns();
    const updated = campaigns.filter(c => c.id !== id);
    localStorageService.saveCampaigns(updated);
    return updated;
  },

  // --- Influencers ---
  getInfluencers: (): Influencer[] => {
    try {
      const stored = localStorage.getItem(INFLUENCERS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error parsing influencers from storage", e);
    }
    localStorage.setItem(INFLUENCERS_KEY, JSON.stringify([]));
    return [];
  },

  addInfluencer: (influencer: Influencer): Influencer[] => {
    const influencers = localStorageService.getInfluencers();
    const updated = [influencer, ...influencers];
    localStorage.setItem(INFLUENCERS_KEY, JSON.stringify(updated));
    return updated;
  },

  updateInfluencer: (updatedInfluencer: Influencer): Influencer[] => {
    const influencers = localStorageService.getInfluencers();
    const updated = influencers.map(i => i.id === updatedInfluencer.id ? updatedInfluencer : i);
    localStorage.setItem(INFLUENCERS_KEY, JSON.stringify(updated));
    return updated;
  },

  deleteInfluencer: (id: string): Influencer[] => {
    const influencers = localStorageService.getInfluencers();
    const updated = influencers.filter(i => i.id !== id);
    localStorage.setItem(INFLUENCERS_KEY, JSON.stringify(updated));
    return updated;
  }
};

// Unified data service that switches between Firebase and localStorage
export const dataService = {
  // --- Campaigns ---
  getCampaigns: async (): Promise<Campaign[]> => {
    if (USE_MOCK_DATA) {
      return localStorageService.getCampaigns();
    }
    try {
      return await firebaseCampaignsService.getCampaigns();
    } catch (error) {
      console.error('Firebase error:', error);
      throw error;
    }
  },

  saveCampaigns: (campaigns: Campaign[]) => {
    if (USE_MOCK_DATA) {
      localStorageService.saveCampaigns(campaigns);
    } else {
      console.warn('saveCampaigns: Use individual update methods for Firebase');
    }
  },

  updateCampaignStatus: async (id: string, status: CampaignStatus): Promise<Campaign[]> => {
    if (USE_MOCK_DATA) {
      return localStorageService.updateCampaignStatus(id, status);
    }
    try {
      await firebaseCampaignsService.updateCampaignStatus(id, status);
      return await firebaseCampaignsService.getCampaigns();
    } catch (error) {
      console.error('Firebase error, falling back to localStorage:', error);
      return localStorageService.updateCampaignStatus(id, status);
    }
  },

  addCampaign: async (campaign: Campaign): Promise<Campaign[]> => {
    if (USE_MOCK_DATA) {
      return localStorageService.addCampaign(campaign);
    }
    try {
      await firebaseCampaignsService.addCampaign(campaign);
      return await firebaseCampaignsService.getCampaigns();
    } catch (error) {
      console.error('Firebase error, falling back to localStorage:', error);
      return localStorageService.addCampaign(campaign);
    }
  },

  completeCampaign: async (id: string, date: string, summary: string): Promise<Campaign[]> => {
    if (USE_MOCK_DATA) {
      return localStorageService.completeCampaign(id, date, summary);
    }
    try {
      await firebaseCampaignsService.completeCampaign(id, date, summary);
      return await firebaseCampaignsService.getCampaigns();
    } catch (error) {
      console.error('Firebase error, falling back to localStorage:', error);
      return localStorageService.completeCampaign(id, date, summary);
    }
  },

  updateCampaign: async (campaign: Campaign): Promise<Campaign[]> => {
    if (USE_MOCK_DATA) {
      return localStorageService.updateCampaign(campaign);
    }
    try {
      await firebaseCampaignsService.updateCampaign(campaign.id, campaign);
      return await firebaseCampaignsService.getCampaigns();
    } catch (error) {
      console.error('Firebase error, falling back to localStorage:', error);
      return localStorageService.updateCampaign(campaign);
    }
  },

  deleteCampaign: async (id: string): Promise<Campaign[]> => {
    if (USE_MOCK_DATA) {
      return localStorageService.deleteCampaign(id);
    }
    try {
      await firebaseCampaignsService.deleteCampaign(id);
      return await firebaseCampaignsService.getCampaigns();
    } catch (error) {
      console.error('Firebase error, falling back to localStorage:', error);
      return localStorageService.deleteCampaign(id);
    }
  },

  // --- Influencers ---
  getInfluencers: async (): Promise<Influencer[]> => {
    if (USE_MOCK_DATA) {
      return localStorageService.getInfluencers();
    }
    try {
      return await firebaseInfluencersService.getInfluencers();
    } catch (error) {
      console.error('Firebase error:', error);
      throw error;
    }
  },

  addInfluencer: async (influencer: Influencer): Promise<Influencer[]> => {
    if (USE_MOCK_DATA) {
      return localStorageService.addInfluencer(influencer);
    }
    try {
      await firebaseInfluencersService.addInfluencer(influencer);
      return await firebaseInfluencersService.getInfluencers();
    } catch (error) {
      console.error('Firebase error, falling back to localStorage:', error);
      return localStorageService.addInfluencer(influencer);
    }
  },

  updateInfluencer: async (updatedInfluencer: Influencer): Promise<Influencer[]> => {
    if (USE_MOCK_DATA) {
      return localStorageService.updateInfluencer(updatedInfluencer);
    }
    try {
      await firebaseInfluencersService.updateInfluencer(updatedInfluencer.id, updatedInfluencer);
      return await firebaseInfluencersService.getInfluencers();
    } catch (error) {
      console.error('Firebase error, falling back to localStorage:', error);
      return localStorageService.updateInfluencer(updatedInfluencer);
    }
  },

  deleteInfluencer: async (id: string): Promise<Influencer[]> => {
    if (USE_MOCK_DATA) {
      return localStorageService.deleteInfluencer(id);
    }
    try {
      await firebaseInfluencersService.deleteInfluencer(id);
      return await firebaseInfluencersService.getInfluencers();
    } catch (error) {
      console.error('Firebase error, falling back to localStorage:', error);
      return localStorageService.deleteInfluencer(id);
    }
  }
};