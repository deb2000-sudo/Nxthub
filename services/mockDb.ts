import { Campaign, Influencer, User } from '../types';
import { MOCK_CAMPAIGNS, MOCK_INFLUENCERS, MOCK_USERS } from '../constants';

const STORAGE_KEYS = {
  USERS: 'nxthub_users_data',
  INFLUENCERS: 'nxthub_influencers_data',
  CAMPAIGNS: 'nxthub_campaigns_data',
};

class MockDatabase {
  constructor() {
    this.initialize();
  }

  /**
   * Initialize local storage with mock data if empty
   */
  private initialize() {
    // Initialize Users
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.setItem(STORAGE_KEYS.USERS, MOCK_USERS);
    }

    // Initialize Influencers
    if (!localStorage.getItem(STORAGE_KEYS.INFLUENCERS)) {
      this.setItem(STORAGE_KEYS.INFLUENCERS, MOCK_INFLUENCERS);
    }

    // Initialize Campaigns
    if (!localStorage.getItem(STORAGE_KEYS.CAMPAIGNS)) {
      this.setItem(STORAGE_KEYS.CAMPAIGNS, MOCK_CAMPAIGNS);
    }
  }

  // --- Generic Helpers ---

  private getItem<T>(key: string): T[] {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error(`Error reading ${key} from MockDB`, error);
      return [];
    }
  }

  private setItem<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error writing ${key} to MockDB`, error);
    }
  }

  // --- Accessors (Getters & Setters) ---

  // Users
  get users(): User[] {
    return this.getItem<User>(STORAGE_KEYS.USERS);
  }

  set users(data: User[]) {
    this.setItem(STORAGE_KEYS.USERS, data);
  }

  // Influencers
  get influencers(): Influencer[] {
    return this.getItem<Influencer>(STORAGE_KEYS.INFLUENCERS);
  }

  set influencers(data: Influencer[]) {
    this.setItem(STORAGE_KEYS.INFLUENCERS, data);
  }

  // Campaigns
  get campaigns(): Campaign[] {
    return this.getItem<Campaign>(STORAGE_KEYS.CAMPAIGNS);
  }

  set campaigns(data: Campaign[]) {
    this.setItem(STORAGE_KEYS.CAMPAIGNS, data);
  }

  // --- CRUD Operations Helpers ---

  findUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findInfluencerById(id: string): Influencer | undefined {
    return this.influencers.find(i => i.id === id);
  }

  findCampaignById(id: string): Campaign | undefined {
    return this.campaigns.find(c => c.id === id);
  }
}

export const mockDb = new MockDatabase();
