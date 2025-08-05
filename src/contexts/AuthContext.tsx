import { onAuthStateChanged, type User } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { firebaseAuth, signIn } from "../firebase";

// Create Auth Context
interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  signInUser: (username?: string, password?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
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
      await signIn(import.meta.env.VITE_FB_ANON_EMAIL, import.meta.env.VITE_FB_ANON_PASSWORD);
      const signedInUser = await signIn(import.meta.env.VITE_FB_ANON_EMAIL, import.meta.env.VITE_FB_ANON_PASSWORD);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };
  // Check the authentication state and user role
  useEffect(() => {
    onAuthStateChanged(firebaseAuth, async (signedInUser) => {
      if (signedInUser) {
        console.log("User is signed in:", signedInUser.email);
        setUser(signedInUser);
        const token = await signedInUser.getIdTokenResult();
        setIsAdmin(token.claims?.admin as boolean || false); // Set isAdmin based on token claims
      } else {
        console.log("No user signed in, signing in as anon user");
        await signInUser(); // Sign in as anon user
      }
      setIsLoading(false);
    });

    // Sign in the user on mount
    // (async () => await signInUser())();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, signInUser, signOutUser, isLoading }}>
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



