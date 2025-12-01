import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { MOCK_USERS } from '../constants';
import { User } from '../types';
import { USE_MOCK_DATA, auth } from '../config/firebase';
import { firebaseUsersService } from './firebaseService';

export const login = async (email: string, password?: string): Promise<{ success: boolean; user?: User; message?: string }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  let firebaseAuthSuccess = false;
  let firebaseUserUid = '';

  // 1. Try Firebase Authentication first
  if (!USE_MOCK_DATA && auth && password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      firebaseAuthSuccess = true;
      firebaseUserUid = userCredential.user.uid;
    } catch (error: any) {
      // Only log if it's NOT an invalid credential error (which is expected for non-firebase users)
      if (error.code !== 'auth/invalid-credential' && error.code !== 'auth/user-not-found') {
         console.log('Firebase auth failed:', error.code);
      }
    }
  }

  let user: User | null = null;

  if (USE_MOCK_DATA) {
    // Use mock data from constants (no password required in mock mode)
    user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  } else {
    // 3. Firestore Custom Auth (for users added via Super Admin Portal)
    if (!auth) {
      return { success: false, message: 'Authentication service not available' };
    }

    try {
      // Fetch user data from Firestore
      user = await firebaseUsersService.getUserByEmail(email);
      
      if (user) {
        // Check if password matches (Custom Auth)
        // Note: In a real app, passwords should be hashed. Here we compare plaintext as requested.
        const userData = user as any;
        if (password && userData.password && userData.password !== password) {
           return { success: false, message: 'Incorrect password' };
        }
      } else {
        // Bootstrap Check: Allow default admin to login if DB is empty/deleted
        if (email.toLowerCase() === 'admin@brandnxtwave.co.in' && password === 'nxt@123') {
          return {
            success: true,
            user: {
              id: 'bootstrap-admin',
              name: 'Super Admin',
              email: 'admin@brandnxtwave.co.in',
              role: 'admin',
              avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff'
            }
          };
        }

        if (firebaseAuthSuccess) {
           // User exists in Auth but not in Firestore (rare, but possible)
           return { success: false, message: 'User account not properly configured. Please contact admin.' };
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, message: 'Authentication failed. Please try again.' };
    }
  }

  if (!user) {
    return { success: false, message: 'User not found' };
  }

  // Requirement 2: Validate that the manager has a department assigned
  if (user.role === 'manager' && !user.department) {
    return { success: false, message: 'Configuration Error: Manager has no department assigned. Please contact admin.' };
  }

  return { success: true, user };
};

export const logout = async (): Promise<void> => {
  if (!USE_MOCK_DATA && auth) {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
  clearSession();
};

// Session Management
const SESSION_KEY = 'nxthub_session';

export const saveSession = (user: User) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

export const getSession = (): User | null => {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};
