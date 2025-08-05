import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, type User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FB_API_KEY,
    authDomain: import.meta.env.VITE_FB_PROJECT_ID + ".firebaseapp.com",
    projectId: import.meta.env.VITE_FB_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FB_PROJECT_ID + ".firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FB_MESSAGING_ID,
    appId: import.meta.env.VITE_FB_APP_ID,
    measurementId: import.meta.env.VITE_FB_MEASUREMENT_ID
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseFirestore = getFirestore(firebaseApp);
export const firebaseAuth = getAuth(firebaseApp);

// Function to sign in a user with email and password
export const signIn = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        return userCredential.user;
    } catch (error) {
        throw new Error(error.message);
    }
}
// Function to sign in a test user
export const signInTestUser = async () => {
    const auth = getAuth(firebaseApp);
    try {
        const userCredential = await signInWithEmailAndPassword(auth, 'tester@piwad.com', 'piwad123');
        return userCredential.user;
    } catch (error) {
        throw new Error(error.message);
    }
};
// Function to sign in anonymously
export const signInAnon = async () => {
    const auth = getAuth(firebaseApp);
    try {
        const userCredential = await signInAnonymously(auth);
        return userCredential.user;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Utility to get current user and check if authenticated
export const getCurrentUser = () => {
    const auth = getAuth(firebaseApp);
    return auth.currentUser;
};

// Utility to listen to auth state changes (not needed in the components directly)
export const onAuthStateChangedListener = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(firebaseAuth, callback);
};