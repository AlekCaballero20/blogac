import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

export const ADMIN_EMAIL = 'alekcaballeromusic@gmail.com';

const firebaseConfig = {
  apiKey: 'AIzaSyBsUUNU6gFZ3Ye_L-gsu69TfwB9ba48vhQ',
  authDomain: 'blog-ac-61893.firebaseapp.com',
  projectId: 'blog-ac-61893',
  storageBucket: 'blog-ac-61893.firebasestorage.app',
  messagingSenderId: '821557380563',
  appId: '1:821557380563:web:803ea68be093bc362edb26'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

export {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp
};
