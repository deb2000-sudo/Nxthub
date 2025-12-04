import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { MOCK_USERS } from '../constants';
import { User } from '../types';
import { USE_MOCK_DATA, auth } from '../config/firebase';
import { firebaseUsersService } from './firebaseService';

export const login = async (email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Validate password is provided
  if (!password) {
    return { success: false, message: 'Password is required' };
  }

  let firebaseAuthSuccess = false;
  let firebaseUserUid = '';

  // 1. Try Firebase Authentication first
  if (!USE_MOCK_DATA && auth && password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      firebaseAuthSuccess = true;
      firebaseUserUid = userCredential.user.uid;
    } catch (error: any) {
      // Suppress Firebase auth errors - they're expected when using custom auth
      // Only log unexpected errors (not credential/user-not-found errors)
      if (error.code && 
          error.code !== 'auth/invalid-credential' && 
          error.code !== 'auth/user-not-found' &&
          error.code !== 'auth/wrong-password' &&
          error.code !== 'auth/invalid-email') {
         console.log('Firebase auth error:', error.code);
      }
      // Silently continue to custom auth flow
    }
  }

  let user: User | null = null;

  if (USE_MOCK_DATA) {
    // Use mock data from constants (password still required)
    user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    // In mock mode, we still validate that password was provided (already checked above)
  } else {
    // 3. Firestore Custom Auth (for users added via Super Admin Portal)
    if (!auth) {
      return { success: false, message: 'Authentication service not available' };
    }

    try {
      // Fetch user data from Firestore
      const userData = await firebaseUsersService.getUserByEmail(email);
      
      if (userData) {
        // Check if password matches (Custom Auth)
        // Note: In a real app, passwords should be hashed. Here we compare plaintext as requested.
        const userWithPassword = userData as any;
        if (password && userWithPassword.password && userWithPassword.password !== password) {
           return { success: false, message: 'Incorrect password' };
        }
        
        // Sanitize user object - remove password before returning
        const { password: _, ...sanitizedUser } = userWithPassword;
        user = sanitizedUser as User;
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
  // Create a safe session object without sensitive data (password, etc.)
  const safeSessionData: User = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    avatar: user.avatar
  };
  
  // Explicitly remove any password field if it exists
  const { password, ...sanitizedUser } = safeSessionData as any;
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(sanitizedUser));
};

export const getSession = (): User | null => {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return null;
  
  try {
    const parsed = JSON.parse(session);
    // Ensure password is never returned, even if it somehow exists in storage
    const { password, ...safeUser } = parsed;
    return safeUser as User;
  } catch (error) {
    console.error('Error parsing session:', error);
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};
