import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkunFPFcq7T-0CFvV7YTC3HPim4E3QLcQ",
  authDomain: "etkinlik-platformu-projem.firebaseapp.com",
  projectId: "etkinlik-platformu-projem",
  storageBucket: "etkinlik-platformu-projem.firebasestorage.app",
  messagingSenderId: "55935314101",
  appId: "1:55935314101:web:d177ee24a2c2419d5cb6fc",
  measurementId: "G-1JNHS438EV",
};

const app = initializeApp(firebaseConfig);

// Diğer dosyalarda kullanmak için Firebase hizmetlerini dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
