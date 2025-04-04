import { initializeThemeListener, loadInitialTheme, applyTheme, auth } from './database.js';
import { app, database, ref, get, remove, set } from './firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const actualizarEstado = (mensaje, esError = false) => {
  const contenedorEstado = document.getElementById("transfer-status");
  if (contenedorEstado) {
    contenedorEstado.innerHTML = `<h1>${mensaje}</h1>`;
  }
};

const limpiarSesionesCaducadas = () => {
  if (!auth.currentUser) return;
  const sesionesRef = ref(database, 'pending_sessions');
  get(sesionesRef)
    .then((snapshot) => {
      const sesiones = snapshot.val();
      if (sesiones) {
        const ahora = Date.now();
        Object.keys(sesiones).forEach((sessionID) => {
          const sesion = sesiones[sessionID];
          if (sesion.expires && sesion.expires < ahora) {
            remove(ref(database, `pending_sessions/${sessionID}`))
              .then(() => console.log(`Sesión caducada eliminada: ${sessionID}`))
              .catch((error) => console.error(`Error al eliminar sesión caducada ${sessionID}:`, error));
          }
        });
      }
    })
    .catch((error) => console.error("Error al leer pending_sessions para limpieza:", error));
};

document.addEventListener("DOMContentLoaded", () => {
  // Cargar tema inicial desde localStorage como fallback
  const savedTheme = localStorage.getItem("theme") || "oscuro";
  applyTheme(savedTheme); // Aplicar tema inicial inmediatamente

  const urlParams = new URLSearchParams(window.location.search);
  const sessionID = urlParams.get("sessionID");
  console.log("URL completa:", window.location.href);
  console.log("sessionID recibido:", sessionID);

  if (!sessionID) {
    actualizarEstado("Error: No se proporcionó un sessionID válido", true);
    setTimeout(() => {
      window.location.href = "/#home";
    }, 5000);
    return;
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Usuario autenticado detectado:", user.uid);
      limpiarSesionesCaducadas();

      // Cargar y sincronizar el tema del usuario autenticado
      loadInitialTheme().then((theme) => {
        console.log("Tema inicial cargado:", theme);
        initializeThemeListener(); // Activar el listener después de cargar el tema
      }).catch((error) => {
        console.error("Error al cargar tema inicial:", error);
        initializeThemeListener(); // Activar listener incluso si falla la carga inicial
      });

      const emailInput = document.getElementById("email");
      emailInput.value = user.email;

      const formulario = document.getElementById("transfer-form");
      formulario.addEventListener("submit", (e) => {
        e.preventDefault();
        const contrasena = document.getElementById("password").value;
        const sesionRef = ref(database, `pending_sessions/${sessionID}`);

        get(sesionRef)
          .then((snapshot) => {
            const datos = snapshot.val();
            console.log("Estado de la sesión antes de actualizar:", JSON.stringify(datos));
            if (!datos || datos.status !== "pending") {
              actualizarEstado("Error: La sesión no está pendiente o ha expirado", true);
              setTimeout(() => {
                window.location.href = "/#home";
              }, 5000);
              return;
            }

            signInWithEmailAndPassword(auth, user.email, contrasena)
              .then(() => {
                set(sesionRef, {
                  sessionID,
                  status: "authenticated",
                  email: user.email,
                  password: contrasena,
                  expires: Date.now() + 15 * 60 * 1000, // 15 minutos
                })
                  .then(() => {
                    console.log("Credenciales transferidas con éxito al nodo:", sesionRef.toString());
                    actualizarEstado("Sesión transferida correctamente");
                    setTimeout(() => {
                      window.location.href = "/#home";
                    }, 2000);
                  })
                  .catch((error) => {
                    console.error("Error al transferir sesión:", error);
                    actualizarEstado(`No se pudo transferir la sesión: ${error.message}`, true);
                  });
              })
              .catch((error) => {
                console.error("Contraseña incorrecta:", error.code, error.message);
                actualizarEstado("Contraseña incorrecta", true);
              });
          })
          .catch((error) => {
            console.error("Error al leer el estado de la sesión:", error);
            actualizarEstado("Error al verificar la sesión: " + error.message, true);
            setTimeout(() => {
              window.location.href = "/#home";
            }, 5000);
          });
      });
    } else {
      actualizarEstado("Error: Este dispositivo no está autenticado", true);
      setTimeout(() => {
        window.location.href = "/#login";
      }, 5000);
    }
  });
});