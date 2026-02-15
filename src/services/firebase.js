import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAegPi7oQhz7uS2XBPNMaa0miTqMTMrSF4",
    authDomain: "media-tracker-b0346.firebaseapp.com",
    projectId: "media-tracker-b0346",
    storageBucket: "media-tracker-b0346.firebasestorage.app",
    messagingSenderId: "691477462122",
    appId: "1:691477462122:web:cdea94ef0eab2312e45e13"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
