import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '../services/firebase';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

const AVATARS = ['🧑‍💻', '👩‍🎨', '🧑‍🚀', '👩‍🔬', '🧙‍♂️', '🦊', '🐱', '🦉', '🎭', '🌟', '🔥', '💎'];

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                // Load profile from Firestore
                const profileSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (profileSnap.exists()) {
                    setProfile({ id: firebaseUser.uid, ...profileSnap.data() });
                } else {
                    // Create profile if it doesn't exist
                    const newProfile = {
                        displayName: firebaseUser.displayName || 'Kullanıcı',
                        email: firebaseUser.email,
                        avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
                        createdAt: new Date().toISOString(),
                    };
                    await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
                    setProfile({ id: firebaseUser.uid, ...newProfile });
                }
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    const login = useCallback(async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
    }, []);

    const register = useCallback(async (email, password, displayName, avatar) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        const profileData = {
            displayName,
            email,
            avatar: avatar || AVATARS[Math.floor(Math.random() * AVATARS.length)],
            createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', cred.user.uid), profileData);
        setProfile({ id: cred.user.uid, ...profileData });
    }, []);

    const logout = useCallback(async () => {
        await signOut(auth);
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            isLoggedIn: !!user,
            login,
            register,
            logout,
            AVATARS,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
