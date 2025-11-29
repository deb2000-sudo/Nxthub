import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc, // Added setDoc
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Campaign, Influencer, CampaignStatus, User, Role } from '../types';
import { MOCK_CAMPAIGNS, MOCK_INFLUENCERS, MOCK_USERS } from '../constants';

// Collection names
const COLLECTIONS = {
  CAMPAIGNS: 'campaigns',
  INFLUENCERS: 'influencers',
  USERS: 'users',
} as const;

// Helper to convert Firestore timestamp to ISO string
const timestampToISO = (timestamp: any): string => {
  if (timestamp?.toDate) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return timestamp || new Date().toISOString();
};

// Helper to convert ISO string to Firestore timestamp
const isoToTimestamp = (isoString: string): Timestamp => {
  return Timestamp.fromDate(new Date(isoString));
};

// Campaigns Service
export const firebaseCampaignsService = {
  async getCampaigns(): Promise<Campaign[]> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const campaignsRef = collection(db, COLLECTIONS.CAMPAIGNS);
      const q = query(campaignsRef, orderBy('lastUpdated', 'desc'));
      const querySnapshot: QuerySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Initialize with mock data if empty
        await this.initializeWithMockData();
        return MOCK_CAMPAIGNS;
      }
      
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        startDate: timestampToISO(doc.data().startDate),
        endDate: timestampToISO(doc.data().endDate),
        completionDate: doc.data().completionDate ? timestampToISO(doc.data().completionDate) : undefined,
        lastUpdated: doc.data().lastUpdated ? timestampToISO(doc.data().lastUpdated) : new Date().toISOString(),
      })) as Campaign[];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  },

  async getCampaignById(id: string): Promise<Campaign | null> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const campaignRef = doc(db, COLLECTIONS.CAMPAIGNS, id);
      const campaignSnap: DocumentSnapshot = await getDoc(campaignRef);
      
      if (!campaignSnap.exists()) {
        return null;
      }
      
      const data = campaignSnap.data();
      return {
        id: campaignSnap.id,
        ...data,
        startDate: timestampToISO(data.startDate),
        endDate: timestampToISO(data.endDate),
        completionDate: data.completionDate ? timestampToISO(data.completionDate) : undefined,
        lastUpdated: data.lastUpdated ? timestampToISO(data.lastUpdated) : new Date().toISOString(),
      } as Campaign;
    } catch (error) {
      console.error('Error fetching campaign:', error);
      throw error;
    }
  },

  async addCampaign(campaign: Campaign): Promise<Campaign> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const campaignData = {
        ...campaign,
        startDate: isoToTimestamp(campaign.startDate),
        endDate: isoToTimestamp(campaign.endDate),
        lastUpdated: Timestamp.now(),
      };
      
      // Remove id from data (Firestore will generate it)
      const { id, ...dataWithoutId } = campaignData;
      
      const docRef = await addDoc(collection(db, COLLECTIONS.CAMPAIGNS), dataWithoutId);
      
      return {
        ...campaign,
        id: docRef.id,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error adding campaign:', error);
      throw error;
    }
  },

  async updateCampaignStatus(id: string, status: CampaignStatus): Promise<Campaign> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const campaignRef = doc(db, COLLECTIONS.CAMPAIGNS, id);
      await updateDoc(campaignRef, {
        status,
        lastUpdated: Timestamp.now(),
      });
      
      const updated = await this.getCampaignById(id);
      if (!updated) throw new Error('Campaign not found after update');
      return updated;
    } catch (error) {
      console.error('Error updating campaign status:', error);
      throw error;
    }
  },

  async completeCampaign(id: string, date: string, summary: string): Promise<Campaign> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const campaignRef = doc(db, COLLECTIONS.CAMPAIGNS, id);
      await updateDoc(campaignRef, {
        status: 'Completed' as CampaignStatus,
        completionDate: isoToTimestamp(date),
        completionSummary: summary,
        lastUpdated: Timestamp.now(),
      });
      
      const updated = await this.getCampaignById(id);
      if (!updated) throw new Error('Campaign not found after update');
      return updated;
    } catch (error) {
      console.error('Error completing campaign:', error);
      throw error;
    }
  },

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const campaignRef = doc(db, COLLECTIONS.CAMPAIGNS, id);
      const updateData: any = {
        ...updates,
        lastUpdated: Timestamp.now(),
      };
      
      // Convert date strings to timestamps if present
      if (updates.startDate) updateData.startDate = isoToTimestamp(updates.startDate);
      if (updates.endDate) updateData.endDate = isoToTimestamp(updates.endDate);
      if (updates.completionDate) updateData.completionDate = isoToTimestamp(updates.completionDate);
      
      // Remove id from updates
      delete updateData.id;
      
      await updateDoc(campaignRef, updateData);
      
      const updated = await this.getCampaignById(id);
      if (!updated) throw new Error('Campaign not found after update');
      return updated;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  },

  async deleteCampaign(id: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const campaignRef = doc(db, COLLECTIONS.CAMPAIGNS, id);
      await deleteDoc(campaignRef);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  },

  async initializeWithMockData(): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      // Check if campaigns already exist
      const campaignsRef = collection(db, COLLECTIONS.CAMPAIGNS);
      const snapshot = await getDocs(campaignsRef);
      
      if (snapshot.empty) {
        // Add mock campaigns
        const batch = MOCK_CAMPAIGNS.map((campaign) => {
          const { id, ...data } = campaign;
          return addDoc(campaignsRef, {
            ...data,
            startDate: isoToTimestamp(campaign.startDate),
            endDate: isoToTimestamp(campaign.endDate),
            lastUpdated: campaign.lastUpdated ? isoToTimestamp(campaign.lastUpdated) : Timestamp.now(),
          });
        });
        
        await Promise.all(batch);
        console.log('✅ Initialized campaigns with mock data');
      }
    } catch (error) {
      console.error('Error initializing mock data:', error);
      throw error;
    }
  },
};

// Influencers Service
export const firebaseInfluencersService = {
  async getInfluencers(): Promise<Influencer[]> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const influencersRef = collection(db, COLLECTIONS.INFLUENCERS);
      const q = query(influencersRef, orderBy('name', 'asc'));
      const querySnapshot: QuerySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Initialize with mock data if empty
        await this.initializeWithMockData();
        return MOCK_INFLUENCERS;
      }
      
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Influencer[];
    } catch (error) {
      console.error('Error fetching influencers:', error);
      throw error;
    }
  },

  async getInfluencerById(id: string): Promise<Influencer | null> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const influencerRef = doc(db, COLLECTIONS.INFLUENCERS, id);
      const influencerSnap: DocumentSnapshot = await getDoc(influencerRef);
      
      if (!influencerSnap.exists()) {
        return null;
      }
      
      return {
        id: influencerSnap.id,
        ...influencerSnap.data(),
      } as Influencer;
    } catch (error) {
      console.error('Error fetching influencer:', error);
      throw error;
    }
  },

  async addInfluencer(influencer: Influencer): Promise<Influencer> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const { id, ...dataWithoutId } = influencer;
      const docRef = await addDoc(collection(db, COLLECTIONS.INFLUENCERS), dataWithoutId);
      
      return {
        ...influencer,
        id: docRef.id,
      };
    } catch (error) {
      console.error('Error adding influencer:', error);
      throw error;
    }
  },

  async updateInfluencer(id: string, updates: Partial<Influencer>): Promise<Influencer> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const influencerRef = doc(db, COLLECTIONS.INFLUENCERS, id);
      const { id: _, ...updateData } = updates;
      
      await updateDoc(influencerRef, updateData);
      
      const updated = await this.getInfluencerById(id);
      if (!updated) throw new Error('Influencer not found after update');
      return updated;
    } catch (error) {
      console.error('Error updating influencer:', error);
      throw error;
    }
  },

  async deleteInfluencer(id: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const influencerRef = doc(db, COLLECTIONS.INFLUENCERS, id);
      await deleteDoc(influencerRef);
    } catch (error) {
      console.error('Error deleting influencer:', error);
      throw error;
    }
  },

  async initializeWithMockData(): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const influencersRef = collection(db, COLLECTIONS.INFLUENCERS);
      const snapshot = await getDocs(influencersRef);
      
      if (snapshot.empty) {
        const batch = MOCK_INFLUENCERS.map((influencer) => {
          const { id, ...data } = influencer;
          return addDoc(influencersRef, data);
        });
        
        await Promise.all(batch);
        console.log('✅ Initialized influencers with mock data');
      }
    } catch (error) {
      console.error('Error initializing mock data:', error);
      throw error;
    }
  },
};

// Users Service
export const firebaseUsersService = {
  async getUsers(): Promise<User[]> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const users: User[] = [];
      const roles = ['admins', 'managers', 'executives'];

      for (const roleDoc of roles) {
        // Get the created_users subcollection
        const q = query(collection(db, COLLECTIONS.USERS, roleDoc, 'created_users'));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
          users.push({ id: doc.id, ...doc.data() } as User);
        });
      }
      
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    if (!db) throw new Error('Firestore not initialized');
    const searchEmail = email.toLowerCase();

    try {
      const roles = ['admins', 'managers', 'executives'];
      
      // 1. Check Root Documents (Default Users)
      for (const roleDoc of roles) {
        const docRef = doc(db, COLLECTIONS.USERS, roleDoc);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.email && data.email.toLowerCase() === searchEmail) {
             // Map document name to role (admins -> admin)
             const role = roleDoc.slice(0, -1) as Role; 
             return { id: roleDoc, ...data, role } as User;
          }
        }
      }

      // 2. Check Created Users Subcollections
      for (const roleDoc of roles) {
        const q = query(
          collection(db, COLLECTIONS.USERS, roleDoc, 'created_users'), 
          where('email', '==', searchEmail)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          return { id: doc.id, ...doc.data() } as User;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  },

  async updateUserRole(userId: string, role: Role, department?: string): Promise<void> {
    // Handled by addUser
  },

  async addUser(user: Omit<User, 'id'> & { password?: string }): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const searchEmail = user.email.toLowerCase();
      
      // Check if user exists to handle updates
      // We need to find WHERE the user is to update or move them
      let existingUser = null;
      let existingUserRef = null;
      let existingCollection = '';

      const roles = ['admins', 'managers', 'executives'];
      for (const roleDoc of roles) {
        const q = query(collection(db, COLLECTIONS.USERS, roleDoc, 'created_users'), where('email', '==', searchEmail));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          existingUser = snapshot.docs[0].data();
          existingUserRef = snapshot.docs[0].ref;
          existingCollection = roleDoc;
          break;
        }
      }

      const targetCollection = `${user.role}s`; // admin -> admins

      if (existingUserRef) {
        // User exists
        if (existingCollection !== targetCollection) {
          // Role changed: Delete from old, Add to new
          await deleteDoc(existingUserRef);
          const newDocRef = await addDoc(collection(db, COLLECTIONS.USERS, targetCollection, 'created_users'), {
            ...user,
            email: searchEmail,
            password: user.password || existingUser.password, // Keep old password if not provided
            createdAt: existingUser.createdAt || new Date().toISOString()
          });
          return newDocRef.id;
        } else {
          // Same role: Update existing
          const updateData: any = { ...user, email: searchEmail };
          if (user.password) updateData.password = user.password;
          await updateDoc(existingUserRef, updateData);
          return existingUserRef.id;
        }
      } else {
        // New User
        const docRef = await addDoc(collection(db, COLLECTIONS.USERS, targetCollection, 'created_users'), {
          ...user,
          email: searchEmail,
          createdAt: new Date().toISOString()
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('Error adding/updating user:', error);
      throw error;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      // We need to find the user by ID in any of the subcollections
      const roles = ['admins', 'managers', 'executives'];
      let deleted = false;

      for (const roleDoc of roles) {
        const docRef = doc(db, COLLECTIONS.USERS, roleDoc, 'created_users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          await deleteDoc(docRef);
          deleted = true;
          console.log(`Deleted user ${userId} from ${roleDoc}`);
          break;
        }
      }
      
      if (!deleted) {
         console.warn(`User ${userId} not found for deletion`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  async initializeWithMockData(): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      console.log('Initializing root user documents...');
      
      // 1. Admin Root Doc
      await setDoc(doc(db, COLLECTIONS.USERS, 'admins'), {
        email: 'admin@brandnxtwave.co.in',
        password: 'nxt@123',
        role: 'admin',
        name: 'Super Admin',
        createdAt: new Date().toISOString()
      });

      // 2. Manager Root Doc
      await setDoc(doc(db, COLLECTIONS.USERS, 'managers'), {
        email: 'manager@brandnxtwave.co.in',
        password: 'nxt@123',
        role: 'manager',
        department: 'Marketing',
        name: 'Default Manager',
        createdAt: new Date().toISOString()
      });

      // 3. Executive Root Doc
      await setDoc(doc(db, COLLECTIONS.USERS, 'executives'), {
        email: 'executive@brandnxtwave.co.in',
        password: 'nxt@123',
        role: 'executive',
        department: 'Marketing',
        name: 'Default Executive',
        createdAt: new Date().toISOString()
      });

      console.log('✅ Initialized root user documents');
    } catch (error) {
      console.error('Error initializing mock data:', error);
      throw error;
    }
  },
};


