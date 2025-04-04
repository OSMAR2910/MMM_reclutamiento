import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-analytics.js";
import { getDatabase, ref, set, update, onValue, remove, get } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAGI6L3s8dBs8eEmb8KwTTJZogZrqmdWM0",
    authDomain: "mx-57723.firebaseapp.com",
    projectId: "mx-57723",
    storageBucket: "mx-57723.firebasestorage.app",
    messagingSenderId: "362115506422",
    appId: "1:362115506422:web:6a3a24d632616147bb4cd7",
    measurementId: "G-FD5DT45C9R"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const analytics = getAnalytics(app);
const auth = getAuth(app); // Inicializa la autenticación


// Exporta Firebase App y la base de datos
export { app, database, auth, ref, set, update, onValue, remove, get, analytics };