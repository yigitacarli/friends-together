import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '../services/firebase';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

const AVATARS = [
    '🧑‍💻', '👩‍🎨', '🧑‍🚀', '👩‍🔬', '🧙‍♂️', '🦊', '🐱', '🦉', '🎭', '🌟', '🔥', '💎',
    '🐶', '🦄', '🐲', '🍄', '🌍', '🌞', '🌙', '⚡', '⛄', '🍔', '🍕', '🍣',
    '🎸', '🎮', '🏀', '⚽', '🏎️', '✈️', '🚀', '🛸', '🗿', '🤖', '👾', '🤡'
];

const FUNNY_TITLES = [
    'Çaylak Üye', 'Dizi Maratoncusu', 'Film Gurmesi', 'Spoiler Canavarı',
    'Uyku Tutmayan', 'Keksever', 'Profesyonel Tembel', 'Meme Lordu',
    'Kaos Yöneticisi', 'Haftasonu Savaşçısı', 'Gece Kuşu', 'Kitap Kurdu',
    'Pixel Sanatçısı', 'Kod Büyücüsü', 'Kahve Bağımlısı'
];

// ─── DAVETİYE KODU ───────────────────────────────────
const INVITE_CODE = 'TRACKER2026';
// ──────────────────────────────────────────────────────

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allUsers, setAllUsers] = useState({});

    // Listen to all users for realtime updates
    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'users'), (snap) => {
            const usersMap = {};
            snap.docs.forEach(d => { usersMap[d.id] = d.data(); });
            setAllUsers(usersMap);
        });
        return unsub;
    }, []);

    // Heartbeat for presence (every 2 mins)
    useEffect(() => {
        if (!user) return;
        const updatePresence = async () => {
            try {
                await updateDoc(doc(db, 'users', user.uid), {
                    lastSeen: serverTimestamp()
                });
            } catch (e) {
                // ignore permission errors on logout etc
            }
        };

        updatePresence(); // initial
        const interval = setInterval(updatePresence, 2 * 60 * 1000); // every 2 mins
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const profileSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (profileSnap.exists()) {
                    setProfile({ id: firebaseUser.uid, ...profileSnap.data() });
                } else {
                    const newProfile = {
                        displayName: firebaseUser.displayName || 'Kullanıcı',
                        email: firebaseUser.email,
                        avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
                        title: 'Çaylak Üye',
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

    const register = useCallback(async (email, password, displayName, avatar, inviteCode) => {
        if (inviteCode !== INVITE_CODE) {
            throw { code: 'auth/invalid-invite-code', message: 'Geçersiz davet kodu!' };
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        const profileData = {
            displayName,
            email,
            avatar: avatar || AVATARS[Math.floor(Math.random() * AVATARS.length)],
            title: 'Çaylak Üye',
            createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', cred.user.uid), profileData);
        setProfile({ id: cred.user.uid, ...profileData });
    }, []);

    const updateUserProfile = useCallback(async (data) => {
        if (!user) return;
        await updateDoc(doc(db, 'users', user.uid), data);
        setProfile(prev => ({ ...prev, ...data }));
    }, [user]);

    const resetPassword = useCallback(async (email) => {
        await sendPasswordResetEmail(auth, email);
    }, []);

    const logout = useCallback(async () => {
        await signOut(auth);
    }, []);

    const isAdmin = user?.email === 'acarliyigit@gmail.com';

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            isLoggedIn: !!user,
            isAdmin, // Export admin status
            login,
            register,
            logout,
            resetPassword,
            updateUserProfile,
            getUser: (uid) => allUsers[uid] || null,
            isOnline: (uid) => {
                const u = allUsers[uid];
                if (!u?.lastSeen) return false;
                const last = u.lastSeen.toDate ? u.lastSeen.toDate() : new Date(u.lastSeen);
                const diff = (new Date() - last) / 1000;
                return diff < 5 * 60; // 5 minutes threshold
            },
            allUsers,
            AVATARS,
            FUNNY_TITLES,
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
