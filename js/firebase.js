import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-analytics.js";
import { getDatabase, ref, set, push, onValue, remove, get } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

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

// Exporta Firebase App y la base de datos
export { app, database, ref, set, push, onValue, remove, get, analytics };