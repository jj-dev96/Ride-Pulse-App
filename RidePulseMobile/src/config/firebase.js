import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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

// Initialize Firebase
let app;
let auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

const db = getFirestore(app);

export { auth, db, firebaseConfig };
