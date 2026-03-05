import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Configuration extracted from the provided google-services.json
const firebaseConfig = {
    apiKey: "AIzaSyC1Krp-eACRRNvc5LmSYhYxbbGU377SzXY",
    authDomain: "ridepulse-6e912.firebaseapp.com",
    projectId: "ridepulse-6e912",
    storageBucket: "ridepulse-6e912.firebasestorage.app",
    messagingSenderId: "861623260957",
    appId: "1:861623260957:android:24e665425ac237d75833f4"
};

let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
} else {
    app = getApp();
    auth = getAuth(app);
}

const db: Firestore = getFirestore(app);

export { auth, db, firebaseConfig };
