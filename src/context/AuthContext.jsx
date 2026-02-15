import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

// Admin credentials - change these to your own
const ADMIN_USERNAME = 'yigit';
const ADMIN_PASSWORD = 'yigit123';

export function AuthProvider({ children }) {
    const [isAdmin, setIsAdmin] = useState(() => {
        return sessionStorage.getItem('media_tracker_admin') === 'true';
    });

    const login = useCallback((username, password) => {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            setIsAdmin(true);
            sessionStorage.setItem('media_tracker_admin', 'true');
            return true;
        }
        return false;
    }, []);

    const logout = useCallback(() => {
        setIsAdmin(false);
        sessionStorage.removeItem('media_tracker_admin');
    }, []);

    return (
        <AuthContext.Provider value={{ isAdmin, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
