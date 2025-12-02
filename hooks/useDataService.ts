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
    let isMounted = true;
    const loadCampaigns = async () => {
      try {
        if (isMounted) setLoading(true);
        const data = await dataService.getCampaigns();
        if (isMounted) {
          setCampaigns(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load campaigns'));
          console.error('Error loading campaigns:', err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCampaigns();
    return () => { isMounted = false; };
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
    let isMounted = true;
    const loadInfluencers = async () => {
      try {
        if (isMounted) setLoading(true);
        const data = await dataService.getInfluencers();
        if (isMounted) {
          setInfluencers(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load influencers'));
          console.error('Error loading influencers:', err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInfluencers();
    return () => { isMounted = false; };
  }, []);

  return { influencers, setInfluencers, loading, error };
};

