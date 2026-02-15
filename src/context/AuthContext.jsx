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
import { doc, setDoc, updateDoc, collection, onSnapshot, serverTimestamp, arrayUnion } from 'firebase/firestore';

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

// ─── ADMİN E-POSTASI (herkesle otomatik arkadaş) ────
const ADMIN_EMAIL = 'acarliyigit@gmail.com';
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

    // ─── Admin ile otomatik arkadaşlık ───────────────────
    useEffect(() => {
        if (!user || !profile) return;
        // Admin kendisiyle arkadaş olmaya çalışmasın
        if (user.email === ADMIN_EMAIL) {
            // Admin hesabı: tüm kullanıcılarla arkadaş ol
            const ensureAllFriends = async () => {
                const otherUsers = Object.keys(allUsers).filter(uid => uid !== user.uid);
                const myFriends = profile.friends || [];
                const missingFriends = otherUsers.filter(uid => !myFriends.includes(uid));
                if (missingFriends.length === 0) return;
                try {
                    const myRef = doc(db, 'users', user.uid);
                    for (const uid of missingFriends) {
                        await updateDoc(myRef, { friends: arrayUnion(uid) });
                        await updateDoc(doc(db, 'users', uid), { friends: arrayUnion(user.uid) });
                    }
                } catch (e) { console.error('Admin auto-friend error:', e); }
            };
            ensureAllFriends();
            return;
        }

        // Normal kullanıcı: admin ile arkadaş ol
        const adminEntry = Object.entries(allUsers).find(([_, u]) => u.email === ADMIN_EMAIL);
        if (!adminEntry) return;
        const [adminUid] = adminEntry;
        if (profile.friends?.includes(adminUid)) return;

        const addAdminFriend = async () => {
            try {
                await updateDoc(doc(db, 'users', user.uid), { friends: arrayUnion(adminUid) });
                await updateDoc(doc(db, 'users', adminUid), { friends: arrayUnion(user.uid) });
            } catch (e) { console.error('Auto-friend with admin error:', e); }
        };
        addAdminFriend();
    }, [user, profile, allUsers]);

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

    // Realtime profile listener — keeps profile in sync with Firestore changes
    // (friend requests, avatar/title edits by others, etc.)
    // NOT: Profil oluşturma SADECE register() içinde yapılır.
    // Burada getDoc + setDoc yapmıyoruz çünkü cache/offline sorunlarından
    // dolayı mevcut profili silip üzerine yazabiliyordu.
    useEffect(() => {
        let unsubProfile = null;

        const unsub = onAuthStateChanged(auth, (firebaseUser) => {
            // Unsubscribe from previous profile listener
            if (unsubProfile) { unsubProfile(); unsubProfile = null; }

            if (firebaseUser) {
                setUser(firebaseUser);

                // Sadece dinle — profil oluşturmayı register() halleder
                unsubProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
                    if (snap.exists()) {
                        setProfile({ id: firebaseUser.uid, ...snap.data() });
                    } else {
                        // Profil henüz yok (register sırasında olabilir)
                        // Burada yeni profil OLUŞTURMUYORUZ — sadece null bırakıyoruz
                        setProfile(null);
                    }
                    setLoading(false);
                });
            } else {
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            unsub();
            if (unsubProfile) unsubProfile();
        };
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
            title: 'Yeni Üye',
            friends: [],
            friendRequests: [],
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
