// firebase.js
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    where,
    query,
    onSnapshot,
    orderBy
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAyIwUsGULHlU1AUfMe5x1XaVnijo0D-_Q",
    authDomain: "nus-kanbanboard.firebaseapp.com",
    projectId: "nus-kanbanboard",
    storageBucket: "nus-kanbanboard.firebasestorage.app",
    messagingSenderId: "597955614027",
    appId: "1:597955614027:web:6f55f3219a77a08aa504ce",
    measurementId: "G-1QQ604BP81"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
    db,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    where,
    query,
    onSnapshot,
    orderBy
};