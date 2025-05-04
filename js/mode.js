import {
    database,
    ref,
    get
  } from "./firebase.js";

const LOCAL_STORAGE_KEY = 'lastDesactiveMode';

// Ensure window.env exists and set initial mode
window.env = window.env || {};
window.env.DESACTIVE_MODE = getInitialMode();

// Get initial mode from localStorage or default to "false"
function getInitialMode() {
    const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);
    return storedValue !== null ? storedValue : "false";
}

// Function to show deactivation screen
function showDesactiveScreen() {
    document.body.innerHTML = `
        <section class="desactivacion">
            <div class="mascota_triste"></div>
            <div class="desactiv_texto">
                <h1>Lo siento, esta página ha sido desactivada</h1>
                <p>Vuelva pronto.</p>
            </div>
        </section>
    `;
}

// Function to update mode from Firebase and enforce deactivation
async function updateDesactiveMode() {
    try {
        const modeRef = ref(database, 'mode');
        const snapshot = await get(modeRef);
        const modeValue = snapshot.exists() ? snapshot.val().toString() : "false";
        
        if (window.env.DESACTIVE_MODE !== modeValue) {
            window.env.DESACTIVE_MODE = modeValue;
            localStorage.setItem(LOCAL_STORAGE_KEY, modeValue);
            // Dispatch event to notify listeners of the mode change
            window.dispatchEvent(new CustomEvent('modeUpdated', { 
                detail: { mode: modeValue }
            }));
            
            // Enforce deactivation immediately if mode is "true"
            if (modeValue === "true") {
                showDesactiveScreen();
            }
        } else if (modeValue === "true") {
            // If mode is already "true", ensure the screen is shown
            showDesactiveScreen();
        }
    } catch (error) {
        console.error("Error al actualizar modo:", error);
    }
}

// Start polling and enforce mode immediately
(function startModePolling() {
    // Check mode immediately on load
    if (window.env.DESACTIVE_MODE === "true") {
        showDesactiveScreen();
    }
    updateDesactiveMode(); // Initial update
    setInterval(updateDesactiveMode, 30000); // Poll every 30 seconds
})();