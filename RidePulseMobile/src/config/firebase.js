import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Configuration extracted from the provided google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyCBISp6yy0ibqVDETe9fvyRn_7atGStdQo",
  authDomain: "ridepulse-3772f.firebaseapp.com",
  projectId: "ridepulse-3772f",
  storageBucket: "ridepulse-3772f.firebasestorage.app",
  messagingSenderId: "420864136803",
  appId: "1:420864136803:android:f2d45761f7788f5e2b4a56"
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
