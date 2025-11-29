import { 
  collection, 
  getDocs, 
  addDoc,
  Timestamp 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth, USE_MOCK_DATA } from '../config/firebase';
import { MOCK_USERS, MOCK_CAMPAIGNS, MOCK_INFLUENCERS } from '../constants';
import { User, Campaign, Influencer } from '../types';
import { doc, setDoc } from 'firebase/firestore';

// Helper to convert ISO string to Firestore timestamp
const isoToTimestamp = (isoString: string): Timestamp => {
  return Timestamp.fromDate(new Date(isoString));
};

/**
 * Seed admin user with Firebase Authentication
 */
export const seedAdminUser = async (): Promise<void> => {
  if (USE_MOCK_DATA || !auth || !db) {
    console.log('⚠️ Skipping admin seeding - using mock data or Firebase not initialized');
    return;
  }

  try {
    const adminEmail = 'admin@brandnxtwave.co.in';
    const adminPassword = 'Nxtwave@123';

    // Check if admin user already exists in Firestore
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const existingAdmin = snapshot.docs.find(
      doc => doc.data().email === adminEmail
    );

    if (existingAdmin) {
      console.log('✅ Admin user already exists in Firestore');
      return;
    }

    // Create Firebase Auth user
    let authUser;
    try {
      authUser = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('✅ Admin Firebase Auth user created');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('✅ Admin Firebase Auth user already exists');
        // We can't get the UID without logging in, so we'll skip creating the Firestore doc
        // assuming it was created when the Auth user was created.
        // If the Firestore doc is missing but Auth exists, the user needs to be fixed manually
        // or via the Super Admin portal.
        return; 
      } else {
        throw error;
      }
    }

    // Create admin user document in Firestore
    const adminUserData: User = {
      id: authUser?.user.uid || 'super-admin-001',
      name: 'Super Admin',
      email: adminEmail,
      role: 'super_admin',
      avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff'
    };

    if (authUser?.user.uid) {
      await setDoc(doc(db, 'users', authUser.user.uid), adminUserData);
      console.log('✅ Admin user document created in Firestore');
    }
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    throw error;
  }
};

/**
 * Seed all collections with mock data if they're empty
 */
export const seedAllData = async (): Promise<void> => {
  if (USE_MOCK_DATA || !db) {
    console.log('⚠️ Skipping data seeding - using mock data or Firebase not initialized');
    return;
  }

  try {
    console.log('🌱 Starting data seeding...');

    // Seed Users - SKIPPED (Handled by Super Admin Portal with new structure)
    /*
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    if (usersSnapshot.empty) {
      console.log('📝 Seeding users...');
      // Filter out any users that might conflict with existing ones if needed
      // But since snapshot is empty, we just map
      const usersToSeed = MOCK_USERS.map((user) => {
        // Ensure we don't use the same ID as the hardcoded admin if it exists
        const { id, ...userData } = user;
        return userData;
      });
      
      const batch = usersToSeed.map((user) => addDoc(usersRef, user));
      await Promise.all(batch);
      console.log('✅ Users seeded');
    } else {
      console.log('✅ Users collection already has data');
    }
    */

    // Seed Influencers
    /*
    const influencersRef = collection(db, 'influencers');
    const influencersSnapshot = await getDocs(influencersRef);
    
    if (influencersSnapshot.empty) {
      console.log('📝 Seeding influencers...');
      const influencersToSeed = MOCK_INFLUENCERS.map(({ id, ...influencer }) => influencer);
      await Promise.all(
        influencersToSeed.map(influencer => addDoc(influencersRef, influencer))
      );
      console.log('✅ Influencers seeded successfully');
    } else {
      console.log('✅ Influencers collection already has data');
    }
    */

    // Seed Campaigns
    /*
    const campaignsRef = collection(db, 'campaigns');
    const campaignsSnapshot = await getDocs(campaignsRef);
    
    if (campaignsSnapshot.empty) {
      console.log('📝 Seeding campaigns...');
      const campaignsToSeed = MOCK_CAMPAIGNS.map(({ id, ...campaign }) => ({
        ...campaign,
        startDate: isoToTimestamp(campaign.startDate),
        endDate: isoToTimestamp(campaign.endDate),
        lastUpdated: campaign.lastUpdated ? isoToTimestamp(campaign.lastUpdated) : Timestamp.now(),
      }));
      await Promise.all(
        campaignsToSeed.map(campaign => addDoc(campaignsRef, campaign))
      );
      console.log('✅ Campaigns seeded successfully');
    } else {
      console.log('✅ Campaigns collection already has data');
    }
    */

    console.log('🎉 Data seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
};

import { firebaseUsersService } from './firebaseService';

/**
 * Initialize all data (admin user + collections)
 */
export const initializeDatabase = async (): Promise<void> => {
  if (USE_MOCK_DATA || !db || !auth) {
    console.log('⚠️ Database initialization skipped - using mock data');
    return;
  }

  try {
    // Initialize Users (New Structure)
    await firebaseUsersService.initializeWithMockData();
    
    // Initialize other collections
    await seedAllData();
    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
};

