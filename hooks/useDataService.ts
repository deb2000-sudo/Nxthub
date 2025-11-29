import { useState, useEffect } from 'react';
import { Campaign, Influencer } from '../types';
import { dataService } from '../services/dataService';

/**
 * Hook to load campaigns with async support
 */
export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        const data = await dataService.getCampaigns();
        setCampaigns(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load campaigns'));
        console.error('Error loading campaigns:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  return { campaigns, setCampaigns, loading, error };
};

/**
 * Hook to load influencers with async support
 */
export const useInfluencers = () => {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadInfluencers = async () => {
      try {
        setLoading(true);
        const data = await dataService.getInfluencers();
        setInfluencers(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load influencers'));
        console.error('Error loading influencers:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInfluencers();
  }, []);

  return { influencers, setInfluencers, loading, error };
};

