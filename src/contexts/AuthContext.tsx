import { onAuthStateChanged, type User } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { firebaseAuth, signIn } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

interface UserProfile {
  name?: string;
  role?: string;
  position?: string;
  email?: string;
}
// Create Auth Context
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  role: "admin" | "mechanic" | "driver" | "user";
  signInUser: (username?: string, password?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Function to sign in the test user
  async function signInUser(): Promise<void>;
  async function signInUser(username: string, password: string): Promise<void>;
  async function signInUser(username?: string, password?: string) {
    setIsLoading(true);
    try {
      let signedInUser;
      // If username and password are provided, sign in with user credentials
      if (username && password) {
        signedInUser = await signIn(username, password);
      }
      // If no credentials are provided, sign in with anon user
      else {
        signedInUser = await signIn(import.meta.env.VITE_FB_ANON_EMAIL, import.meta.env.VITE_FB_ANON_PASSWORD);
      }
    } catch (error) {
      console.error("Error signing in:", error);
      throw error; // Re-throw to handle in UI
    } finally {
      setIsLoading(false);
    }
  };

  // Function to sign out user (reset to anon user)
const signOutUser = async () => {
  try {
    setIsLoading(true);
    
    // Sign in as anonymous user
    await signIn(
      import.meta.env.VITE_FB_ANON_EMAIL,
      import.meta.env.VITE_FB_ANON_PASSWORD
    );

    
    setUser(null);
    setUserProfile(null);
    setIsAdmin(false);

    console.log("✅ Successfully signed out and switched to anonymous user");
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};
   // Function to fetch user profile from Firestore
const fetchUserProfile = async (uid: string) => {
    try {
      console.log("🔍 Fetching profile for UID:", uid);
      
      const userDoc = await getDoc(doc(db, "user", uid));
      
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        console.log("✅ Profile fetched successfully:", profileData);
        setUserProfile(profileData as UserProfile);
      } else {
        console.log("⚠️ No user document found for UID:", uid);
        setUserProfile(null);
      }
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
      setUserProfile(null);
    }
  };
   const getUserRole = (): "admin" | "mechanic" | "driver" | "user" => {
  if (isAdmin) return "admin";
  const profileRole = (userProfile?.role || "").toLowerCase().trim();
  if (["admin", "mechanic", "driver"].includes(profileRole)) {
    return profileRole as "admin" | "mechanic" | "driver";
  }
  return "user";
};

  // Check the authentication state and user role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (signedInUser) => {
      if (signedInUser) {
        console.log("👤 Signed in user:", signedInUser.email, "UID:", signedInUser.uid);
        
        setUser(signedInUser);
        
        const token = await signedInUser.getIdTokenResult();
        setIsAdmin(token.claims?.admin as boolean || false);

        // Fetch profile (isang beses lang)
        await fetchUserProfile(signedInUser.uid);
      } 
      else {
        console.log("No user signed in, signing in as anon user");
        await signInUser();
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe(); 
  }, []);

     
   return (
    <AuthContext.Provider 
      value={{ 
        user, 
        userProfile,           
        isAdmin, 
        role: getUserRole(),
        signInUser, 
        signOutUser, 
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access auth state in any component
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};



