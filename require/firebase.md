// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyArMimRjL2_toIbcHKfJF_4CL_1kqsSAP8",
  authDomain: "com9-c5bf2.firebaseapp.com",
  databaseURL: "https://com9-c5bf2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "com9-c5bf2",
  storageBucket: "com9-c5bf2.firebasestorage.app",
  messagingSenderId: "892631175688",
  appId: "1:892631175688:web:9fbe7f71c0cdfea40eb7bd",
  measurementId: "G-H1D6JWV1KB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);