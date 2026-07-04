import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { EmailAuthProvider, getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDpTVbOlacCrkesCzY3XOw3s9PvVW188O8",
  authDomain: "hrnode-odoo.firebaseapp.com",
  projectId: "hrnode-odoo",
  storageBucket: "hrnode-odoo.firebasestorage.app",
  messagingSenderId: "70515569207",
  appId: "1:70515569207:web:c75dae33a285a4fda885b2"
};

// Initialize Firebase (safely for Next.js SSR)
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
const provider = new EmailAuthProvider();

export default {app, db, auth };
