import {
  iniciarSesion,
  registrarUsuario,
  initializeDatabase,
  cargarPreguntaAleatoria,
  actualizarCategoriaActiva,
  limpiarFamiliasFirebase,
  auth,
  getUserRef,
  remove,
  ref,
  set,
  inicializarQRLogin,
  applyTheme,
  THEMES,
  initializeThemeListener,
  loadInitialTheme,
  getAudioEnabled,
  setAudioEnabled,
  mostrarRespuestasEnTiempoReal,
  mostrarFamiliasEnTiempoReal
} from './database.js';
import { setupLockedContentListener } from './lockedContent.js';
import { initializeSinglePlayerMode, resetToTeamsMode, setupCategoryListener, cambiarCategoriaSinglePlayer, cargarPreguntaAleatoriaSinglemode } from './singlePlayer.js';
// Importar onAuthStateChanged directamente desde el CDN
import { onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// Registro del Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/js/service-worker.js', { type: 'module' });
      console.log('Service Worker registrado:', registration);

      // Solicitar permiso para notificaciones
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Permiso de notificaciones concedido');
        } else {
          console.log('Permiso de notificaciones denegado');
        }
      }
    } catch (error) {
      console.error('Error al registrar Service Worker:', error);
    }
  });
} else {
  console.log('Service Workers no soportados en este navegador');
}
let deferredPrompt;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('../js/service-worker.js', { scope: '/' });
      console.log('Service Worker registrado:', registration);
    } catch (error) {
      console.error('Error al registrar Service Worker:', error);
    }
  });
}
async function preloadOfflineData() {
  try {
    const response = await fetch("../json/P&R.json");
    const questions = await response.json();
    localStorage.setItem("offlineQuestions", JSON.stringify(questions));
    console.log("Preguntas precargadas para modo offline");
  } catch (error) {
    console.error("Error al precargar datos offline:", error);
  }
}

window.addEventListener("load", preloadOfflineData);

// Capturar el evento de instalación
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // Evitar que el navegador muestre el prompt automáticamente
  deferredPrompt = e; // Guardar el evento para usarlo después
  const installBtn = document.getElementById('install-btn');
  const cont_installBtn = document.getElementById('btn_install');
  if (installBtn) {
    installBtn.style.display = 'flex';
    cont_installBtn.style.display = 'flex'; // Mostrar el botón
    installBtn.addEventListener('click', async () => {
      installBtn.style.display = 'none';
      cont_installBtn.style.display = 'none';
      deferredPrompt.prompt(); // Mostrar el diálogo de instalación
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('Usuario aceptó instalar la PWA');
      } else {
        console.log('Usuario rechazó instalar la PWA');
      }
      deferredPrompt = null;
    });
  }
});

// Confirmar instalación
window.addEventListener('appinstalled', () => {
  console.log('PWA instalada correctamente');
});

navigator.serviceWorker.addEventListener("message", (event) => {
  if (event.data.type === "OFFLINE") {
    const offlineAlert = document.createElement("div");
    offlineAlert.className = "offline-alert";
    offlineAlert.textContent = event.data.message;
    document.body.appendChild(offlineAlert);
    setTimeout(() => offlineAlert.remove(), 5000); // Desaparece tras 5 segundos
  }
});

// Estilo básico para la alerta (agregar a css/style.css)
const offlineStyle = `
  .offline-alert {
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--tema-Secundario);
    color: var(--tema-Texto);
    font-family: var(--tema-Letra2);
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 1000;
  }
`;
document.head.insertAdjacentHTML("beforeend", `<style>${offlineStyle}</style>`);



export const initializeAudioForIOS = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.error("AudioContext no soportado en este navegador");
      return;
    }

    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = "sine"; // Tipo de onda (puede ser cualquier tipo)
    oscillator.frequency.setValueAtTime(0, context.currentTime); // Frecuencia 0 = silencio
    gainNode.gain.setValueAtTime(0, context.currentTime); // Volumen 0 = silencio

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      console.log("Audio inicializado para iOS usando AudioContext");
    }, 100); // Reproduce silencio por 100ms y luego para
  } catch (err) {
    console.error("Error al inicializar audio en iOS con AudioContext:", err);
  }
};

export function loadPage(elements) {
  const loader = document.getElementById("loader");
  if (!loader) {
    console.error("No se encontró el elemento #loader");
    if (elements && elements.home) elements.home.style.display = "flex";
    else if (elements && elements.notFound) elements.notFound.style.display = "flex";
    return;
  }

  console.log("Iniciando loadPage");

  const domPromise = new Promise((resolve) => {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      console.log("DOM ya está cargado");
      resolve();
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        console.log("DOM completamente cargado");
        resolve();
      });
    }
  });

  // Combinar la carga del DOM con las fuentes y el tema
  Promise.all([domPromise, loadInitialTheme()])
    .then(([_, theme]) => {
      console.log("DOM y fuentes/tema cargados, mostrando contenido con tema:", theme);
      loader.style.transition = "opacity 0.3s ease";
      loader.style.opacity = "0";
      setTimeout(() => {
        loader.style.display = "none";
        if (elements && elements.home) elements.home.style.display = "flex";
        else if (elements && elements.notFound) elements.notFound.style.display = "flex";
      }, 300);
    })
    .catch((error) => {
      console.error("Error al cargar DOM o fuentes/tema:", error);
      // Mostrar contenido con tema por defecto si falla
      applyTheme("oscuro");
      loader.style.opacity = "0";
      setTimeout(() => {
        loader.style.display = "none";
        if (elements && elements.home) elements.home.style.display = "flex";
        else if (elements && elements.notFound) elements.notFound.style.display = "flex";
      }, 300);
    });

  const authPromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Estado de autenticación confirmado:", user ? user.uid : "sin usuario");
      unsubscribe();
      resolve();
    });
  });

  authPromise.then(() => {
    console.log("Autenticación cargada en segundo plano");
  }).catch((error) => {
    console.error("Error en carga de autenticación:", error);
  });
}

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

const requestFullScreen = () => {
  const element = document.documentElement;

  if (isIOS()) {
    document.body.style.height = `${window.visualViewport?.height || window.innerHeight}px`;
    document.body.style.overflow = "hidden";
    console.log("Pantalla completa simulada en iOS con altura ajustada");
  } else if (element.requestFullscreen) {
    element.requestFullscreen().catch((err) => console.error("Error:", err));
  }
};

const exitFullScreen = () => {
  if (isIOS()) {
    // Restaurar estado en iOS
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.width = "";
    document.body.style.height = "";
    document.body.style.overflow = "";
    console.log("Saliendo de pantalla completa simulada en iOS");
  } else if (document.fullscreenElement || document.webkitFullscreenElement) {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch((err) => console.error("Error al salir de pantalla completa:", err));
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen().catch((err) => console.error("Error al salir de pantalla completa:", err));
    }
  } else {
    console.log("No hay modo de pantalla completa activo");
  }
};

export const toggleView = (elements, { home = false, login = false, registrer = false, admin = false, view = false, selectMode = false }) => {
  requestAnimationFrame(() => {
    elements.home.style.display = home ? "flex" : "none";
    elements.login.style.display = login ? "flex" : "none";
    elements.registrer.style.display = registrer ? "flex" : "none";
    elements.admin.style.display = admin ? "flex" : "none";
    elements.view.style.display = view ? "flex" : "none";
    elements.selectMode.style.display = selectMode ? "flex" : "none";

    // Activar/desactivar listeners según la sección visible
    const isGameActive = admin || view;
    mostrarRespuestasEnTiempoReal(isGameActive);
    mostrarFamiliasEnTiempoReal(isGameActive);
  });
};

export const cerrarSesion = (elements) => {
  const estadoRef = getUserRef("estado"); // Ahora getUserRef está definido
  if (estadoRef) {
    remove(estadoRef)
      .then(() => console.log("Estado del usuario borrado"))
      .catch((error) => console.error("Error al borrar estado:", error));
  }
  signOut(auth)
    .then(() => {
      console.log("Sesión cerrada exitosamente");
      toggleView(elements, { home: true });
    })
    .catch((error) => {
      console.error("Error al cerrar sesión:", error);
    });
};

export const transferirSesionConQR = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionID = urlParams.get("sessionID");

  console.log("URL actual:", window.location.href);
  if (!sessionID) {
    console.error("No se encontró sessionID en la URL");
    return;
  }

  if (!auth.currentUser) {
    console.error("No hay usuario autenticado en este dispositivo");
    return;
  }

  const email = auth.currentUser.email;
  const password = prompt("Por favor, ingresa tu contraseña para transferir la sesión:");
  if (!password) {
    alert("Se requiere la contraseña para transferir la sesión.");
    return;
  }

  const sessionRef = ref(database, `pending_sessions/${sessionID}`);
  set(sessionRef, {
    sessionID,
    status: "authenticated",
    email: email,
    password: password,
    expires: Date.now() + 5 * 60 * 1000, // 5 minutos
  })
    .then(() => {
      console.log("Credenciales transferidas al dispositivo no autenticado");
      alert("Sesión transferida exitosamente");
      // No redirigir, dejar que el usuario continúe en el dispositivo autenticado
    })
    .catch((error) => {
      console.error("Error al transferir sesión:", error);
    });
};

const categoryItems = document.querySelectorAll(".category-item");
if (categoryItems.length > 0) {
  categoryItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      const categoriaSeleccionada = e.target.getAttribute("data-category");
      actualizarCategoriaActiva(categoriaSeleccionada);
      if (document.querySelector(".admincont").classList.contains("single-player-mode")) {
        cambiarCategoriaSinglePlayer(categoriaSeleccionada);
      } else {
        cargarPreguntaAleatoria(); // Solo para modo equipos
      }
      categoryItems.forEach((i) => i.classList.remove("active"));
      e.target.classList.add("active");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  const elements = {
    home: document.getElementById("home"),
    login: document.getElementById("login"),
    registrer: document.getElementById("registrer"),
    admin: document.getElementById("pag1"),
    view: document.getElementById("pag2"),
    selectMode: document.getElementById("selectMode"),
  };

  loadPage(elements);

  const realHeight = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty('--main-vh', `${realHeight}px`);

  if (label_btnEnviar) {
    label_btnEnviar.addEventListener("click", () => {
      console.log("Botón Enviar clicado, ejecutando enviar_fo con elements:", elements);
      enviar_fo(elements);
    });
  } else {
    console.error("Botón #label_enviar no encontrado");
  }

  // Configuración del botón "Siguiente"
  if (label_btnNext) {
    label_btnNext.addEventListener("click", showNextForm);
  } else {
    console.error("Botón #label_next no encontrado");
  }
  const emailInput = document.getElementById("reg_email");
  if (emailInput) {
    emailInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.toLowerCase(); 
    });
  } else {
    console.error("Campo #reg_email no encontrado");
  }
  const passInput = document.getElementById("reg_pass");
  if (passInput) {
    passInput.addEventListener("input", (e) => {
      const value = e.target.value;
      if (value.length < 6) {
        e.target.style.borderColor = "var(--tema-Red)"; // Rojo si < 6
      } else {
        e.target.style.borderColor = "var(--tema-Green)"; // Verde si >= 6
      }
    });
  } else {
    console.error("Campo #reg_pass no encontrado");
  }

// Configuración del selector de temas
const settingsInfo = document.querySelector(".temas_info");
if (settingsInfo) {
  const themeSelectorContainer = document.createElement("div");
  themeSelectorContainer.className = "theme-selector-container";

  Object.keys(THEMES).forEach(theme => {
    const themeOption = document.createElement("div");
    themeOption.className = "theme-option";
    themeOption.dataset.theme = theme;
    themeOption.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);

    themeOption.addEventListener("click", () => {
      const selectedTheme = themeOption.dataset.theme;
      applyTheme(selectedTheme);
      localStorage.setItem("theme", selectedTheme);

      document.querySelectorAll(".theme-option").forEach(opt => {
        opt.classList.remove("selected");
      });
      themeOption.classList.add("selected");
    });

    themeSelectorContainer.appendChild(themeOption);
  });

  settingsInfo.appendChild(themeSelectorContainer);

  const savedTheme = localStorage.getItem("theme") || "oscuro";
  applyTheme(savedTheme);
  const initialOption = themeSelectorContainer.querySelector(`[data-theme="${savedTheme}"]`);
  if (initialOption) initialOption.classList.add("selected");
}

// Escuchar autenticación y activar el listener de temas
onAuthStateChanged(auth, (user) => {
  if (user && user.emailVerified) {
    console.log("Usuario autenticado y verificado:", user.uid);
    initializeThemeListener(); // Activar el listener aquí
  } else {
    console.log("No hay usuario autenticado o no verificado");
  }
});

// Apartado para el temporizador
const timerSelect = document.getElementById("timer-duration");
    const savedTimerDuration = localStorage.getItem("timerDuration") || 13;
    timerSelect.value = savedTimerDuration;

    timerSelect.addEventListener("change", () => {
      const newDuration = parseInt(timerSelect.value);
      localStorage.setItem("timerDuration", newDuration);
      if (auth.currentUser) { // Usar auth.currentUser en lugar de currentUser
        const timerRef = getUserRef("estado/timerDuration");
        if (timerRef) {
          set(timerRef, newDuration)
            .then(() => console.log(`Duración del temporizador guardada: ${newDuration} segundos`))
            .catch((error) => console.error("Error al guardar duración:", error));
        }
      } else {
        console.log("No hay usuario autenticado, duración guardada solo localmente");
      }
    });

  // Verificar si la URL tiene sessionID antes de ejecutar transferirSesionConQR
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("sessionID")) {
    transferirSesionConQR();
  } else {
    console.log("No hay sessionID en la URL, omitiendo transferencia de sesión");
  }

  const formLogin = document.getElementById("form_log");
  const btnLogin = document.getElementById("btn_log_admin");
  if (formLogin && btnLogin) {
    formLogin.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        btnLogin.click();
      }
    });
    btnLogin.addEventListener("click", () => iniciarSesion(elements));
  }

  const formRegistrer = document.getElementById("form_registrer");
  const btnRegistrerAdmin = document.getElementById("btn_registrer_admin");
  if (formRegistrer && btnRegistrerAdmin) {
    formRegistrer.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        btnRegistrerAdmin.click();
      }
    });
    btnRegistrerAdmin.addEventListener("click", () => registrarUsuario(elements));
  }

  const btnJugar = document.getElementById("btn-jugar");
  const mode05Btn = document.getElementById("mode05");
  const mode1Btn = document.getElementById("mode1");
  const btn_limpiar_familias = document.getElementById("btn_limpiar_familias");
  const mode2Btn = document.getElementById("mode2");
  const btnLogin2 = document.getElementById("btn_login");
  const btnRegistrer = document.getElementById("btn_registrer");
  const btnsRegreso = document.querySelectorAll(".btnregreso");
  const btnLogout = document.querySelectorAll(".logout");
  const btnSinglePlayer = document.getElementById("1jugador");
  const btnTeams = document.getElementById("Equipos");

  if (btnJugar) {
    btnJugar.addEventListener("click", () => {
      console.log("Botón Jugar clicado");
      onAuthStateChanged(auth, (user) => {
        if (user && user.emailVerified) {
          console.log("Usuario autenticado y verificado, yendo a selectMode:", user.uid);
          toggleView(elements, { selectMode: true });
        } else {
          console.log("Usuario no autenticado o no verificado, yendo a login");
          toggleView(elements, { login: true });
          setTimeout(() => inicializarQRLogin(elements), 100);
        }
      });
    });
  }

  if (btn_limpiar_familias) {
    btn_limpiar_familias.addEventListener("click", () => {
      limpiarFamiliasFirebase();
    });
  }

  if (mode05Btn) {
    mode05Btn.addEventListener("click", () => {
      toggleView(elements, { admin: true });
      setAudioEnabled(true);
      requestFullScreen();
      initializeSinglePlayerMode();
      setupCategoryListener();
      setupLockedContentListener(); // Agregar listener
    });
  }

  if (mode1Btn) {
    mode1Btn.addEventListener("click", () => {
      toggleView(elements, { admin: true });
      setAudioEnabled(false);
      requestFullScreen();
      resetToTeamsMode();
      console.log("Modo 1 seleccionado: Audios bloqueados");
      initializeDatabase(getAudioEnabled); 
      cargarPreguntaAleatoria();
    });
  }

  if (mode2Btn) {
    mode2Btn.addEventListener("click", () => {
      toggleView(elements, { view: true });
      setAudioEnabled(true);
      requestFullScreen();
      console.log("Modo 2 seleccionado: Audios habilitados");
      initializeDatabase(getAudioEnabled);
      initializeAudioForIOS();
      // Forzar desbloqueo en iOS con una interacción simulada
      document.addEventListener("touchend", () => {
        initializeAudioForIOS();
      }, { once: true });
      // Asegurar que los listeners estén activos
      mostrarRespuestasEnTiempoReal(true);
      mostrarFamiliasEnTiempoReal(true);
    });
  }


  if (btnRegistrer) {
    btnRegistrer.addEventListener("click", () => {
      toggleView(elements, { registrer: true });
      initForm();
      initProgressBar();
      updateProgress();
      const sexoSelect = document.getElementById("sexo"); // Obtener el <select>
      if (sexoSelect) {
        personalizarSelect(sexoSelect); // Pasar el elemento a la función
      } else {
        console.error("El elemento <select> con id='sexo' no se encontró");
      }
      console.log("Botón Registrer clicado, mostrando registrer");
    });
  }

  const isMobile = window.innerWidth <= 500;

  if (btnSinglePlayer) {
    btnSinglePlayer.addEventListener("click", () => {
      if (isMobile) {
        initializeSinglePlayerMode();
        setupCategoryListener();
        setAudioEnabled(true);
      } else {
        console.log("Modo Single-Player solo disponible en dispositivos móviles.");
        // Opcional: mostrar un mensaje al usuario
        alert("El modo Single-Player solo está disponible en dispositivos móviles.");
      }
    });
  }

  if (btnTeams) {
    btnTeams.addEventListener("click", () => {
      resetToTeamsMode();
      setAudioEnabled(false);
      initializeDatabase(getAudioEnabled);
    });
  }

  if (btnLogin2) {
    btnLogin2.addEventListener("click", () => {
      toggleView(elements, { login: true });
      console.log("Botón login clicado, mostrando login");
      inicializarQRLogin(elements);
    });
  }
  
  if (btnsRegreso.length > 0) {
    btnsRegreso.forEach((btnRegreso) => {
      btnRegreso.addEventListener("click", (e) => {
        e.preventDefault();
        toggleView(elements, { selectMode: true });
        exitFullScreen();
        console.log("Regresando a selectMode, audioEnabled sigue siendo:", getAudioEnabled());
      });
    });
  }

  if (btnLogout.length > 0) {
    btnLogout.forEach((btnLogout) => {
      btnLogout.addEventListener("click", (e) => {
        e.preventDefault();
        cerrarSesion(elements);
        window.location.reload(); 
      });
    });
  }

  const checkboxes = [
    ...document.querySelectorAll('.admincont input[type="checkbox"]'),
  ];

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      if (this.checked) {
        checkboxes.forEach((otherCheckbox) => {
          if (otherCheckbox !== this) otherCheckbox.checked = false;
        });
      }
    });
  });
});

export const debounce = (func, wait = 10) => { // Reducir de 50ms a 10ms
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Detectar cuando un input tiene foco (teclado aparece)
document.querySelectorAll("input, textarea").forEach((input) => {
  input.addEventListener("focusin", () => {
    debouncedHandleViewportChanges(); // Ejecutar sin retraso adicional
  });
  input.addEventListener("focusout", () => {
    debouncedHandleViewportChanges();
  });
});

document.getElementById("form_log")?.addEventListener("focusin", () => {
  setTimeout(() => debouncedHandleViewportChanges(), 100);
});

export const isTouchDevice = () => {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  );
};

if (!isTouchDevice()) {
  document.querySelectorAll("a, button, .js-link").forEach((el) => {
    el.addEventListener("touchstart", () => el.classList.add("is-link-hovered"));
    el.addEventListener("touchend", () => el.classList.remove("is-link-hovered"));
  });

  const cursorEl = document.querySelector(".js-cursor");
  if (cursorEl) {
    const classes = {
      clicked: "is-clicked",
      hidden: "is-hidden",
      linkHovered: "is-link-hovered",
      customCursor: "has-custom-cursor",
    };

    const onMouseMove = (e) => {
      cursorEl.style.setProperty("--cursor-x", `${e.clientX}px`);
      cursorEl.style.setProperty("--cursor-y", `${e.clientY}px`);
    };

    const toggleClass = (className, add) =>
      cursorEl.classList[add ? "add" : "remove"](className);

    const handleLinkHoverEvents = () => {
      document
        .querySelectorAll(
          'a, button, .js-link, input[type="button"], input[type="submit"]'
        )
        .forEach((el) => {
          el.addEventListener("mouseover", () => toggleClass(classes.linkHovered, true));
          el.addEventListener("mouseout", () => toggleClass(classes.linkHovered, false));
        });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mousedown", () => toggleClass(classes.clicked, true));
    document.addEventListener("mouseup", () => toggleClass(classes.clicked, false));
    document.addEventListener("mouseenter", () => toggleClass(classes.hidden, false));
    document.addEventListener("mouseleave", () => toggleClass(classes.hidden, true));

    handleLinkHoverEvents();
    document.body.classList.add(classes.customCursor);
  }
} else {
  document.body.classList.remove("has-custom-cursor");
}

// Obtener todos los formularios
const forms = document.querySelectorAll(".cont_inputform");
let currentFormIndex = 0;

const label_btnNext = document.getElementById("label_next");
const label_btnEnviar = document.getElementById("label_enviar");

function initForm() {
  if (forms.length) {
    forms[currentFormIndex].style.display = "grid";
    label_btnNext.style.display = "flex";
  }
}

document.querySelectorAll('.input-field input[type="password"]').forEach((input) => {
  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.textContent = "";
  toggleButton.classList.add("toggle-password");
  toggleButton.setAttribute("aria-label", "Toggle password visibility");
  input.parentNode.appendChild(toggleButton);

  toggleButton.addEventListener("click", () =>
    input.type === "password" ? (input.type = "text") : (input.type = "password")
  );
});

function initProgressBar() {
  const contForm = document.querySelector(".cont_form");
  if (contForm) {
    const progressBar = document.createElement("div");
    progressBar.classList.add("progress-bar");
    progressBar.id = "progreso";
    progressBar.setAttribute("role", "progressbar");
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", "100");
    contForm.prepend(progressBar);
  }
}

function updateProgress() {
  const progreso = document.getElementById("progreso");
  if (progreso) {
    const progress = ((currentFormIndex + 1) / forms.length) * 90;
    progreso.style.width = `${progress}%`;
    progreso.setAttribute("aria-valuenow", Math.round(progress));
  }
}

function enviar_fo(elements) {
  console.log("Función enviar_fo ejecutada");

  if (!validateForm()) {
    console.log("Validación fallida en enviar_fo");
    return;
  }

  console.log("Formulario válido, procesando envío");

  registrarUsuario(elements)
    .then(() => {
      console.log("Registro exitoso, redirigiendo a home después de cerrar la alerta");
      forms.forEach((form) => (form.style.display = "none"));
      if (label_btnEnviar) label_btnEnviar.style.display = "none";
      if (document.getElementById("progreso")) document.getElementById("progreso").style.display = "none";
      toggleView(elements, { home: true });
    })
    .catch((error) => {
      console.error("Error en el registro:", error);
      if (error.message === "email-already-in-use") {
        const emailAlert = document.getElementById("email-in-use-alert");
        if (emailAlert) {
          emailAlert.style.display = "block";
          const closeButton = document.getElementById("close-email-alert");
          if (closeButton) {
            closeButton.addEventListener("click", () => {
              emailAlert.style.display = "none";
            }, { once: true });
          }
        }
      } else if (error.message === "username-in-use") {
        const usernameAlert = document.getElementById("username-in-use-alert");
        if (usernameAlert) {
          usernameAlert.style.display = "block";
          const closeButton = document.getElementById("close-username-alert");
          if (closeButton) {
            closeButton.addEventListener("click", () => {
              usernameAlert.style.display = "none";
            }, { once: true });
          }
        }
      } else {
        console.log("Otro error:", error.message);
      }
    });
}

function validateForm() {
  const inputs = forms[currentFormIndex].querySelectorAll("input, select, textarea");
  let isValid = true;
  inputs.forEach(input => {
    const value = input.value.trim();
    console.log(`${input.id}: "${value}"`);
    if (!value) {
      console.log("Campo vacío detectado:", input.id);
      isValid = false;
    } else if (input.id === "reg_pass" && value.length < 6) {
      console.log("La contraseña debe tener al menos 6 caracteres:", input.id);
      isValid = false;
    }
  });
  return isValid;
}

function showNextForm() {
  if (!validateForm()) {
    console.log("No se puede avanzar: faltan datos");
    return;
  }

  forms[currentFormIndex].style.display = "none";
  currentFormIndex++;

  if (currentFormIndex === forms.length - 1) {
    label_btnNext.style.display = "none";
    if (label_btnEnviar) label_btnEnviar.style.display = "flex";
    else console.error("label_btnEnviar no encontrado en showNextForm");
  }

  if (currentFormIndex < forms.length) {
    forms[currentFormIndex].style.display = "grid";
  }
  updateProgress();
}

// Personalización de selects
function personalizarSelect(select) {
  if (!select || !(select instanceof HTMLElement)) {
    console.error("El argumento 'select' no es un elemento DOM válido:", select);
    return;
  }

  const existingCustomSelect = select.parentNode.querySelector(".custom-select");
  if (existingCustomSelect) {
    existingCustomSelect.remove();
  }

  // ✅ 2. Obtener el label correcto
  const label = document.querySelector(`label[for='${select.id}']`);
  if (label) {
    label.classList.add("custom-label");
    label.style.display = "none"; // 🔥 Ocultar por defecto
  }

  // ✅ 3. Crear el contenedor personalizado para el select
  const customSelect = document.createElement("div");
  customSelect.classList.add("custom-select", "input");

  // ✅ 4. Crear el elemento visual que simula el select
  const selectedDiv = document.createElement("div");
  selectedDiv.classList.add("select-selected");
  selectedDiv.textContent = select.options[select.selectedIndex]?.text || "Selecciona una opción";
  selectedDiv.setAttribute("tabindex", "0");

  // ✅ 5. Contenedor para las opciones
  const optionsDiv = document.createElement("div");
  optionsDiv.classList.add("select-items");

  let isClickInside = false; // Previene que el blur cierre el menú antes de seleccionar

  // ✅ 6. Crear opciones dentro del select personalizado
  Array.from(select.options).forEach((option, index) => {
    const optionDiv = document.createElement("div");
    optionDiv.textContent = option.text;

    if (option.disabled) {
      optionDiv.classList.add("disabled");
    } else {
      optionDiv.addEventListener("mousedown", (event) => {
        isClickInside = true; // 🚀 Evita el cierre prematuro del menú
        event.preventDefault();

        select.selectedIndex = index;
        selectedDiv.textContent = option.text;
        select.dispatchEvent(new Event("change"));
        optionsDiv.style.display = "none";

        if (label) label.style.display = "none"; // 🔥 Ocultar label tras selección
      });
    }
    optionsDiv.appendChild(optionDiv);
  });

  // ✅ 7. Mostrar el label cuando el select tiene foco
  selectedDiv.addEventListener("focus", () => {
    optionsDiv.style.display = "block";
    if (label) label.style.display = "flex"; // 🔥 Mostrar el label correctamente
  });

  selectedDiv.addEventListener("click", () => {
    optionsDiv.style.display = "block";
    if (label) label.style.display = "flex"; // 🔥 Mostrar el label al hacer clic
  });

  // ✅ 8. Cerrar el menú solo si no se está seleccionando una opción
  selectedDiv.addEventListener("blur", () => {
    setTimeout(() => {
      if (!isClickInside) {
        optionsDiv.style.display = "none";
        if (label) label.style.display = "none";
      }
      isClickInside = false;
    }, 100);
  });

  document.addEventListener("click", (event) => {
    if (!customSelect.contains(event.target)) {
      optionsDiv.style.display = "none";
      if (label) label.style.display = "none";
    }
  });

  customSelect.appendChild(selectedDiv);
  customSelect.appendChild(optionsDiv);
  select.parentNode.insertBefore(customSelect, select);
  select.style.display = "none"; // Ocultar el select nativo
}