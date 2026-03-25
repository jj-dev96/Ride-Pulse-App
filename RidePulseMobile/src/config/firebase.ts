import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Configuration extracted from the provided google-services.json
const firebaseConfig = {
    apiKey: "AIzaSyDr8KEqVcfo5xJTtG-oXrUCk9LgTuZ81ow",
    authDomain: "rider-e9b8f.firebaseapp.com",
    projectId: "rider-e9b8f",
    storageBucket: "rider-e9b8f.firebasestorage.app",
    messagingSenderId: "835323615898",
    appId: "1:835323615898:android:d429c37af268a3231add23"
};

let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
        // @ts-ignore
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
} else {
    app = getApp();
    auth = getAuth(app);
}

const db: Firestore = getFirestore(app);

export { auth, db, firebaseConfig };
