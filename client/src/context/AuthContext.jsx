import { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import axios from 'axios';

// Firebase Config (Replace with environment variables in production)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const signup = async (email, password, name) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        return result.user;
    };

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const loginWithGoogle = async () => {
        console.log("Attempting Google Login...");
        try {
            const result = await signInWithPopup(auth, googleProvider);
            console.log("Login Success:", result.user);
            // Optional: Sync user to backend here or in useEffect
            return result.user;
        } catch (error) {
            console.error("Login failed", error);
            alert(`Login Failed: ${error.message}`);
            throw error;
        }
    };

    const logout = () => signOut(auth);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Get token for backend requests
                const token = await user.getIdToken();
                localStorage.setItem('token', token);

                // Sync with backend
                try {
                    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                    // Send name and picture from Firebase user object if available
                    await axios.post(`${API_URL}/api/auth/me`, {
                        name: user.displayName,
                        profilePic: user.photoURL
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log("Backend Sync Successful");
                } catch (e) {
                    console.error("Backend sync failed", e);
                }
            } else {
                localStorage.removeItem('token');
            }
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        signup,
        login,
        loginWithGoogle,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
