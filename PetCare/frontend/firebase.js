import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-bheSHZXD0gzOiez1GrKWtv9J8-yZf3E",
  authDomain: "petcare-1d07f.firebaseapp.com",
  projectId: "petcare-1d07f",
  messagingSenderId: "384102704546",
  appId: "1:384102704546:android:f8cac1bd78457e11a5fefb",
};

// Check if Firebase app is already initialized
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]; // Use the existing Firebase app instance
}

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Configure ActionCodeSettings for password reset
const actionCodeSettings = {
  url: 'https://petcare-1d07f.firebaseapp.com/password-reset.html',
  handleCodeInApp: true,
  iOS: {
    bundleId: 'com.yourcompany.petcare' // Replace with your actual iOS bundle ID
  },
  android: {
    packageName: 'com.yourcompany.petcare', // Replace with your actual Android package name
    installApp: true,
    minimumVersion: '12'
  },
  // dynamicLinkDomain is optional if you're not using Firebase Dynamic Links
  // dynamicLinkDomain: 'petcare.page.link'
};

export { auth, actionCodeSettings };