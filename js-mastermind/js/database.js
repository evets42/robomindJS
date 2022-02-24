
function databaseSetup () {}// Import the functions you need from the SDKs you need
import {initializeApp} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js";

// https://firebase.google.com/docs/web/setup#available-libraries
import {getDatabase, ref, set, onValue, get, child, update, remove} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-database.js"

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC9sRbGfIkkWDNjjlRKh-4WNDuSGIgUsec",
    authDomain: "robomind-tracking.firebaseapp.com",
    databaseURL: "https://robomind-tracking-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "robomind-tracking",
    storageBucket: "robomind-tracking.appspot.com",
    messagingSenderId: "992842688045",
    appId: "1:992842688045:web:a7e89ab5e9419fb8adbaa4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase();
const dbRef = ref(db);