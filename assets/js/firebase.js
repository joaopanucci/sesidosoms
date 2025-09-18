// Import Firebase v9 modular from CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyDZNDV_eM5dhRYGu-euVqymZN6Q0br2DBA",
  authDomain: "sesidosoms.firebaseapp.com",
  projectId: "sesidosoms",
  storageBucket: "sesidosoms.firebasestorage.app",
  messagingSenderId: "932828334430",
  appId: "1:932828334430:web:02544c8138af68719ee7cf",
  measurementId: "G-H1MNREBYM4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

console.log('Firebase inicializado com sucesso');