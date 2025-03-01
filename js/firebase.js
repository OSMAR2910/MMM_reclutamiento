import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-analytics.js";
import { getDatabase, ref, set, push, onValue, remove, get, update } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD-1BSpVC3sjkCdiYkyyr7PJGmUJtTurIo",
    authDomain: "mmm-rh.firebaseapp.com",
    databaseURL: "https://mmm-rh-default-rtdb.firebaseio.com",
    projectId: "mmm-rh",
    storageBucket: "mmm-rh.firebasestorage.app",
    messagingSenderId: "104927050233",
    appId: "1:104927050233:web:fd801a96912816c0356528",
    measurementId: "G-Y7ZXV0XN0S"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const analytics = getAnalytics(app);
const auth = getAuth(app); // Inicializa la autenticación
// Exporta Firebase App y la base de datos
export { app, database, auth, ref, set, onValue, remove, get, update, push, analytics };