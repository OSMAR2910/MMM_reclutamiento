// Carga
document.addEventListener("DOMContentLoaded", function () {
  var loader = document.getElementById("loader");
  var chatbot = document.getElementById("chatbot");
  if (loader) {
    loader.style.visibility = "hidden";
    loader.style.opacity = "0";
    chatbot.style.animation = "backInRight 1.5s ease-in-out forwards";
  }

  // Configuración inicial inmediata
  if (elements.home) elements.home.classList.add("agregar_dis");
  if (elements.chatbot) elements.chatbot.classList.add("agregar_dis");

  // Inicializar la app
  initializeApp();

  // Ajustar vista inicial según si es PWA instalada
  adjustViewForPWA();
});

// Descargar PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("../js/service-worker.js")
      .then((registration) => {
        console.log("Service Worker registrado con éxito:", registration);
      })
      .catch((error) => {
        console.log("Error al registrar el Service Worker:", error);
      });
  });
}

// Manejar la instalación de la PWA
let deferredPrompt;
const installButton = document.getElementById("installButton");

// Ocultar el botón por defecto hasta que la instalación esté disponible
if (installButton) {
  installButton.style.display = "none";

  // Escuchar el evento beforeinstallprompt
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.style.display = "flex";

    installButton.addEventListener("click", () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("El usuario aceptó instalar la PWA");
        } else {
          console.log("El usuario rechazó instalar la PWA");
        }
        deferredPrompt = null;
        installButton.style.display = "none";
      });
    });
  });

  // Detectar si la app ya está instalada y ajustar vista
  window.addEventListener("appinstalled", () => {
    console.log("La PWA fue instalada con éxito");
    installButton.style.display = "none";
    adjustViewForPWA(); // Ajustar vista inmediatamente después de la instalación
  });
}

// Función para verificar si la app está en modo standalone (PWA instalada)
export function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

// Función para ajustar la vista según si es PWA instalada
function adjustViewForPWA() {
  if (isStandalone()) {
    console.log("La app está instalada como PWA, ajustando vista a #pag2...");

    // Usar toggleView para mostrar solo #pag2 y ocultar elementos no deseados
    toggleView({
      home: false,
      header: false, 
      form: false,
      login: true,    
      login_manager: false,
      aside: false,   
      admin: false,
      admin_manager: false,
    });

    // Asegurar que los elementos específicos estén ocultos con estilo inline
    if (elements.header) elements.header.style.display = "none";
    if (elements.aside) elements.aside.style.display = "none";
    if (elements.chatbot) elements.chatbot.style.display = "none";
    if (elements.pavo_cont) elements.pavo_cont.style.display = "none";

    // Forzar que #pag2 sea visible
    if (elements.login) {
      elements.login.style.width = "100%";
      elements.login_manager.style.width = "100%";
    }
  } else {
    console.log("Ejecutando como web normal, manteniendo vista por defecto...");
  }
}

let maxViewportHeight = window.innerHeight;

function setRealViewportHeight(forceUpdate = false) {
  // Obtener la altura real del viewport
  const realHeight = window.visualViewport?.height || window.innerHeight;
  const currentHeight = getComputedStyle(document.documentElement).getPropertyValue('--main-vh') || '0px';
  const currentHeightNum = parseFloat(currentHeight);

  // Detectar si el teclado virtual está probablemente abierto
  const isInputFocused = document.activeElement.tagName === 'INPUT' || 
                        document.activeElement.tagName === 'TEXTAREA';
  const isKeyboardLikelyOpen = realHeight < maxViewportHeight * 0.9 && isInputFocused;

  // Solo actualizar maxViewportHeight si es un evento forzado (resize/orientación) y NO hay teclado
  if (forceUpdate && !isKeyboardLikelyOpen) {
    maxViewportHeight = realHeight;
  }

  // Establecer --main-vh solo si es necesario (y no hay teclado)
  if (!isKeyboardLikelyOpen && (!currentHeightNum || maxViewportHeight !== currentHeightNum)) {
    document.documentElement.style.setProperty('--main-vh', `${maxViewportHeight}px`);
  }

  // Manejar el espacio superior seguro
  const safeTop = window.visualViewport?.offsetTop || 0;
  document.documentElement.style.setProperty('--safe-top', `${safeTop}px`);
}

// Inicializar al cargar
window.addEventListener('load', () => {
  maxViewportHeight = window.innerHeight; // Establecer altura inicial
  setRealViewportHeight();
});

// Debounce para el evento resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    setRealViewportHeight(true); // Forzar actualización en resize
  }, 100);
});

// Actualizar en cambio de orientación
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    setRealViewportHeight(true); // Forzar actualización en cambio de orientación
  }, 200);
});

// Sincronizar con visualViewport si está disponible
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    // Evitar actualizaciones si el teclado está probablemente abierto
    const isInputFocused = document.activeElement.tagName === 'INPUT' || 
                          document.activeElement.tagName === 'TEXTAREA';
    const realHeight = window.visualViewport.height;
    if (!isInputFocused || realHeight >= maxViewportHeight * 0.9) {
      setRealViewportHeight(true);
    }
  });
}

// Verificar si es un dispositivo táctil
const isTouchDevice = () =>
  "ontouchstart" in window ||
  navigator.maxTouchPoints > 0 ||
  window.matchMedia("(pointer: coarse)").matches;

if (!isTouchDevice()) {
  document.querySelectorAll("a, button, .js-link").forEach((el) => {
    el.addEventListener("touchstart", () =>
      el.classList.add("is-link-hovered")
    );
    el.addEventListener("touchend", () =>
      el.classList.remove("is-link-hovered")
    );
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
          el.addEventListener("mouseover", () =>
            toggleClass(classes.linkHovered, true)
          );
          el.addEventListener("mouseout", () =>
            toggleClass(classes.linkHovered, false)
          );
        });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mousedown", () =>
      toggleClass(classes.clicked, true)
    );
    document.addEventListener("mouseup", () =>
      toggleClass(classes.clicked, false)
    );
    document.addEventListener("mouseenter", () =>
      toggleClass(classes.hidden, false)
    );
    document.addEventListener("mouseleave", () =>
      toggleClass(classes.hidden, true)
    );

    handleLinkHoverEvents();
    document.body.classList.add(classes.customCursor);
  }
} else {
  document.body.classList.remove("has-custom-cursor");
}

const alertasConfig = {
  alertas: 2000,
  alerta_1: 2000,
  alerta_2: 2000,
  alerta_3: 2000,
  alerta_4: 2000,
  alerta_5: 2000,
  alerta_6: 2000,
  alerta_7: 2000,
  alerta_8: 2000,
  alerta_9: 2000,
  alerta_10: 2000,
  alerta_11: 2000,
  alerta_12: 2000,
  alerta_13: 2000,
  alerta_14: 2000,
  alerta_15: 2000,
  alerta_16: 2000,
  alerta_17: 2000,
  alerta_18: 2000,
  alerta_19: 2000,
  alerta_20: 2000,
  alerta_21: 2000,
  alerta_22: 2000,
  alerta_23: 2000,
  alerta_24: 2000,
  alerta_25: 2000,
  alertapreguntaerror_1: 2000,
  alertapreguntaerror_2: 2000,
  alertapreguntaerror_3: 2000,
  alertapreguntaerror_4: 2000,
  alertapreguntaerror_5: 2000,
  alertapreguntaerror_6: 2000,
  alertapreguntaerror_7: 2000,
  alertapreguntaerror_8: 2000,
  alertapreguntaerror_9: 2000,
  alertapreguntaerror_10: 2000,
  alertapreguntaerror_11: 2000,
  alertapreguntaerror_12: 2000,
  alertapreguntaerror_13: 2000,
  alertapreguntaerror_14: 2000,
  alertapreguntaerror_15: 2000,
  alertapreguntaerror_16: 2000,
  alertapreguntaerror_17: 2000,
  alertapreguntaerror_18: 2000,
  alertapreguntaerror_19: 2000,
};

// Función genérica para mostrar y ocultar alertas
const alertasCache = new Map();

export const mostrarAlerta = (alertaId, tiempoDefault = 3000) => {
  let alerta = alertasCache.get(alertaId);
  if (!alerta) {
    alerta = document.getElementById(alertaId);
    if (!alerta) {
      console.error(`No se encontró alerta con ID: ${alertaId}`);
      return;
    }
    alertasCache.set(alertaId, alerta);
  }

  // Cancelar timeout previo
  if (alerta.timeoutId) clearTimeout(alerta.timeoutId);

  // Ocultar todas las alertas solo si es necesario
  if (alerta.style.display !== "flex") {
    document.querySelectorAll("[id^='alerta_']").forEach((a) => {
      if (a !== alerta && a.style.display !== "none") a.style.display = "none";
    });
  }

  alerta.style.display = "flex";
  const tiempo = alertasConfig[alertaId] || tiempoDefault;

  alerta.timeoutId = setTimeout(() => {
    alerta.style.display = "none";
    delete alerta.timeoutId;
  }, tiempo);

  // Evento de clic para cerrar
  alerta.onclick = () => {
    alerta.style.display = "none";
    clearTimeout(alerta.timeoutId);
    delete alerta.timeoutId;
  };
};

// Cambiar secciones navigation
export const elements = {
  header: document.getElementById("header"),
  home: document.getElementById("home"),
  form: document.getElementById("pag1"),
  login: document.getElementById("pag2"),
  admin: document.getElementById("pag3"),
  login_manager: document.getElementById("pag4"),
  admin_manager: document.getElementById("pag5"),
  ap_tc: document.getElementById("ap_tc"),
  aside: document.getElementById("aside"),
  chatbot: document.getElementById("chatbot"),
  pavo_cont: document.getElementById("pavo_cont"),
};

export function setThemeColor(color) {
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
      themeColorMeta.setAttribute('content', color);
  }
  // Opcional: Actualizar otras metas relacionadas para consistencia
  const msNavButtonColor = document.querySelector('meta[name="msapplication-navbutton-color"]');
  const appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (msNavButtonColor) {
      msNavButtonColor.setAttribute('content', color);
  }
  if (appleStatusBar) {
      appleStatusBar.setAttribute('content', color);
  }
}

export function toggleView({
  home = false,
  header = false,
  form = false,
  login = false,
  login_manager = false,
  aside = false,
  admin = false,
  admin_manager = false,
  ap_tc = false,
  chatbotcolor = false
}) {
  elements.home?.classList.toggle("agregar_dis", home);
  elements.header?.classList.toggle("cambiar_nav", header);
  elements.form?.classList.toggle("agregar_dis", form);
  elements.login?.classList.toggle("agregar_dis", login);
  elements.aside?.classList.toggle("agregar_dis", aside);
  elements.admin?.classList.toggle("agregar_dis", admin);
  elements.ap_tc?.classList.toggle("agregar_dis", ap_tc);
  elements.admin_manager?.classList.toggle("agregar_dis", admin_manager);
  elements.login_manager?.classList.toggle("agregar_dis", login_manager);
  elements.chatbot?.classList.toggle("chatbot_color", chatbotcolor);
}

// Funciones para cada botón
function btn_home() {
  toggleView({ home: true });
  console.log("Botón Home clicado");
}

function btn_form() {
  toggleView({ header: true, form: true, aside: true, chatbotcolor: true });
  console.log("Botón Form clicado");
}

function btn_admin() {
  toggleView({ header: true, login: true, aside: true, chatbotcolor: true });
  console.log("Botón Admin clicado");
}

function btn_admin2() {
  toggleView({ header: true, login: true, aside: true, chatbotcolor: true });
  console.log("Botón Admin2 clicado");
}

function admin_manager() {
  toggleView({ header: true, login_manager: true, aside: true, chatbotcolor: true  });
  console.log("Botón Admin Manager clicado");
}

function btn_aptc() {
  toggleView({ header: true, ap_tc: true, aside: true, chatbotcolor: true  });
  console.log("Botón APTC clicado");
}

// Obtener todos los formularios
const forms = document.querySelectorAll(".cont_inputform");
const exito = document.getElementById("exito_form");
let currentFormIndex = 0;

const label_btnNext = document.getElementById("label_next");
const label_btnEnviar = document.getElementById("label_enviar");

// Función para inicializar el formulario
function initForm() {
  if (forms.length) {
    forms[currentFormIndex].style.display = "grid";
    label_btnNext.style.display = "flex";
    label_btnEnviar.style.display = "none"; // Asegurar que el botón de enviar esté oculto al inicio
  }
}

// Función para validar el formulario actual
function validateForm() {
  const inputs = forms[currentFormIndex].querySelectorAll("input, select, textarea");
  const errores = [];

  inputs.forEach((input) => {
    const value = input.value.trim();
    const id = input.id;

    // Validaciones específicas por campo con alertas únicas
    if (!value) {
      switch (id) {
        case "nombre": errores.push({ mensaje: "El nombre está vacío", alertaId: "alertapreguntaerror_1" }); break;
        case "puesto": errores.push({ mensaje: "El puesto está vacío", alertaId: "alertapreguntaerror_2" }); break;
        case "numero": errores.push({ mensaje: "El número está vacío", alertaId: "alertapreguntaerror_3" }); break;
        case "fecha_r": errores.push({ mensaje: "La fecha está vacía", alertaId: "alertapreguntaerror_4" }); break;
        case "edad": errores.push({ mensaje: "La edad está vacía", alertaId: "alertapreguntaerror_5" }); break;
        case "cp": errores.push({ mensaje: "El código postal está vacío", alertaId: "alertapreguntaerror_6" }); break;
        case "direccion": errores.push({ mensaje: "La dirección está vacía", alertaId: "alertapreguntaerror_7" }); break;
        case "ciudad": errores.push({ mensaje: "La ciudad está vacía", alertaId: "alertapreguntaerror_8" }); break;
        case "casa_suc": errores.push({ mensaje: "Casa/Sucursal está vacío", alertaId: "alertapreguntaerror_9" }); break;
        case "transporte": errores.push({ mensaje: "Transporte está vacío", alertaId: "alertapreguntaerror_10" }); break;
        case "e_c": errores.push({ mensaje: "Estado civil está vacío", alertaId: "alertapreguntaerror_11" }); break;
        case "docu": errores.push({ mensaje: "Documentación está vacía", alertaId: "alertapreguntaerror_12" }); break;
        case "empleo": errores.push({ mensaje: "Empleo está vacío", alertaId: "alertapreguntaerror_13" }); break;
        case "horario": errores.push({ mensaje: "Horario está vacío", alertaId: "alertapreguntaerror_14" }); break;
        case "sexo": errores.push({ mensaje: "Sexo está vacío", alertaId: "alertapreguntaerror_15" }); break;
        case "nacion": errores.push({ mensaje: "Nacionalidad está vacía", alertaId: "alertapreguntaerror_16" }); break;
        case "problema_t": errores.push({ mensaje: "Problema/T está vacío", alertaId: "alertapreguntaerror_17" }); break;
        case "f_n": errores.push({ mensaje: "Fecha de nacimiento está vacía", alertaId: "alertapreguntaerror_18" }); break;
        case "sucursal": errores.push({ mensaje: "Sucursal está vacía", alertaId: "alertapreguntaerror_19" }); break;
        default: errores.push({ mensaje: `El campo ${id} está vacío`, alertaId: "alerta_1" }); // Fallback genérico
      }
    } else {
      // Validaciones adicionales si el campo no está vacío
      if (id === "numero" && !value.match(/^\+?[0-9]{10,15}$/)) {
        errores.push({ mensaje: "El número debe tener entre 10 y 15 dígitos", alertaId: "alertapreguntaerror_3" });
      } else if (id === "cp" && !value.match(/^[0-9]{5}$/)) {
        errores.push({ mensaje: "Código postal debe tener exactamente 5 dígitos", alertaId: "alertapreguntaerror_6" });
      } else if (id === "edad" && (isNaN(value) || value < 18 || value > 100)) {
        errores.push({ mensaje: "Edad debe estar entre 18 y 100", alertaId: "alertapreguntaerror_5" });
      } else if (id === "fecha_r" && !value.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)) {
        errores.push({ mensaje: "Fecha inválida", alertaId: "alertapreguntaerror_4" });
      }
    }
  });

  if (errores.length > 0) {
    console.log("Errores encontrados:", errores);
    mostrarAlerta("alertas"); // Alerta genérica
    errores.forEach((error) => mostrarAlerta(error.alertaId)); // Mostrar alertas específicas
    return false; // Indicar que la validación falló
  }
  return true; // Validación exitosa
}

document.querySelectorAll('.input-field input[type="password"]')
.forEach((input) => {
    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.textContent = "";
    toggleButton.classList.add("toggle-password");
    toggleButton.setAttribute("aria-label", "Toggle password visibility");
    input.parentNode.appendChild(toggleButton);

    toggleButton.addEventListener("click", () =>
      input.type === "password"
        ? (input.type = "text")
        : (input.type = "password")
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

function showNextForm() {
  if (!validateForm()) {
    console.log("Validación fallida, no se avanza al siguiente formulario");
    return; // No avanzar si hay errores
  }

  forms[currentFormIndex].style.display = "none";
  currentFormIndex++;

  if (currentFormIndex === forms.length - 1) {
    label_btnNext.style.display = "none";
    label_btnEnviar.style.display = "flex"; // Mostrar botón de enviar solo en el último paso
  } else {
    label_btnNext.style.display = "flex";
  }

  forms[currentFormIndex].style.display = "grid";
  updateProgress();
}

const FORM_KEY = "formVac";

function enviar_fo() {
  const isFormSubmitted = localStorage.getItem(FORM_KEY) === "true";
  console.log("¿Formulario ya enviado?", isFormSubmitted);

  if (isFormSubmitted) {
    console.log("Mostrando estado de formulario ya enviado");
    forms.forEach((form) => (form.style.display = "none"));
    if (label_btnEnviar) label_btnEnviar.style.display = "none";
    if (label_btnNext) label_btnNext.style.display = "none";
    if (document.getElementById("progreso")) document.getElementById("progreso").style.display = "none";
    if (exito) exito.style.display = "flex";
    mostrarAlerta("alerta_2"); // Éxito (formulario ya enviado)
    return;
  }

  if (!validateForm()) {
    console.log("Validación fallida en el envío final");
    return; // No enviar si hay errores
  }

  console.log("Formulario válido, procesando envío final");
  forms.forEach((form) => (form.style.display = "none"));
  if (label_btnEnviar) label_btnEnviar.style.display = "none";
  if (label_btnNext) label_btnNext.style.display = "none";
  if (document.getElementById("progreso")) document.getElementById("progreso").style.display = "none";
  if (exito) exito.style.display = "flex";

  // Llamar a enviar_form de database.js
  window.enviar_form();
}

label_btnNext?.addEventListener("click", showNextForm);
label_btnEnviar?.addEventListener("click", enviar_fo);

// Personalización de selects
export function personalizarSelect(select) {
  // 1. Eliminar cualquier personalización previa
  const existingCustomSelect = select.parentNode.querySelector(".custom-select");
  if (existingCustomSelect) {
    existingCustomSelect.remove();
  }

  // 2. Obtener el label asociado
  const label = document.querySelector(`label[for='${select.id}']`);
  if (label) {
    label.classList.add("custom-label");
    label.style.display = "none"; // Ocultar por defecto
  }

  // 3. Crear el contenedor personalizado
  const customSelect = document.createElement("div");
  customSelect.classList.add("custom-select", "input"); // Mantener clase 'input' para compatibilidad con CSS

  // 4. Crear el elemento que simula el select
  const selectedDiv = document.createElement("div");
  selectedDiv.classList.add("select-selected");
  selectedDiv.textContent =
    select.options[select.selectedIndex]?.text || "Selecciona una opción";
  selectedDiv.setAttribute("tabindex", "0"); // Hacerlo enfocable

  // 5. Contenedor para las opciones
  const optionsDiv = document.createElement("div");
  optionsDiv.classList.add("select-items");
  optionsDiv.style.display = "none"; // Asegurar que esté oculto por defecto

  let isClickInside = false; // Previene cierres prematuros

  // 6. Crear opciones dinámicamente
  Array.from(select.options).forEach((option, index) => {
    const optionDiv = document.createElement("div");
    optionDiv.textContent = option.text;
    optionDiv.dataset.value = option.value;

    if (option.disabled) {
      optionDiv.classList.add("disabled");
    } else {
      optionDiv.addEventListener("mousedown", (event) => {
        isClickInside = true;
        event.preventDefault(); // Evitar comportamiento no deseado

        select.selectedIndex = index;
        select.value = option.value;
        selectedDiv.textContent = option.text;
        optionsDiv.style.display = "none";
        select.dispatchEvent(new Event("change", { bubbles: true }));
        if (label) label.style.display = "none"; // Ocultar label tras selección
      });
    }
    optionsDiv.appendChild(optionDiv);
  });

  // 7. Manejar focus para mostrar el label y las opciones
  selectedDiv.addEventListener("focus", () => {
    optionsDiv.style.display = "block";
    if (label) {
      label.style.display = "flex";
      label.classList.add("active"); // Clase para animaciones
    }
    // Disparar focus en el select nativo para compatibilidad
    select.dispatchEvent(new Event("focus", { bubbles: true }));
  });

  // 8. Manejar clic para alternar opciones
  selectedDiv.addEventListener("click", (event) => {
    event.stopPropagation();
    const isVisible = optionsDiv.style.display === "block";
    optionsDiv.style.display = isVisible ? "none" : "block";
    if (label) {
      label.style.display = isVisible ? "none" : "flex";
      label.classList.toggle("active", !isVisible);
    }
  });

  // 9. Manejar blur para cerrar opciones y ocultar label
  selectedDiv.addEventListener("blur", () => {
    setTimeout(() => {
      if (!isClickInside) {
        optionsDiv.style.display = "none";
        if (label) {
          label.style.display = "none";
          label.classList.remove("active");
        }
      }
      isClickInside = false;
    }, 150); // Aumentado ligeramente para dar tiempo a mousedown
  });

  // 10. Cerrar opciones al hacer clic fuera
  document.addEventListener("click", (event) => {
    if (!customSelect.contains(event.target)) {
      optionsDiv.style.display = "none";
      if (label) {
        label.style.display = "none";
        label.classList.remove("active");
      }
    }
  });

  // 11. Actualizar texto al cambiar el select nativo
  select.addEventListener("change", () => {
    const selectedOption = select.options[select.selectedIndex];
    selectedDiv.textContent = selectedOption ? selectedOption.text : "Selecciona una opción";
  });

  // 12. Agregar al DOM
  customSelect.appendChild(selectedDiv);
  customSelect.appendChild(optionsDiv);
  select.parentNode.insertBefore(customSelect, select);
  select.style.display = "none"; // Ocultar select nativo
}

// Función de checkboxes
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  const checkboxes = [
    ...document.querySelectorAll('.disponibilidad_sucu input[type="checkbox"]'),
    ...document.querySelectorAll('.disponibilidad_puestos input[type="checkbox"]'),
    ...document.querySelectorAll('.mensajes_usuarios input[type="checkbox"]'),
    ...document.querySelectorAll('.estatus_vacantes input[type="checkbox"]'),
    ...document.querySelectorAll(
      '.estatus_citas_manager input[type="checkbox"]'
    ),
    ...document.querySelectorAll('.settings input[type="checkbox"]'),
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

  // Personalizar todos los selects al cargar la página
  document.querySelectorAll("select").forEach((select) => {
    personalizarSelect(select);
  });

  // Asignar eventos a los botones
  const btnHome = document.getElementById("btn_home");
  const btnForm = document.getElementById("btn_form");
  const btnAdmin = document.getElementById("btn_admin");
  const btnAdmin2 = document.getElementById("btnAdmin2");
  const btnAdminManager = document.getElementById("btnAdminManager");
  const btnAptc = document.getElementById("btnAptc");

  if (btnHome) btnHome.addEventListener("click", btn_home);
  if (btnForm) btnForm.addEventListener("click", btn_form);
  if (btnAdmin) btnAdmin.addEventListener("click", btn_admin);
  if (btnAdmin2) btnAdmin2.addEventListener("click", btn_admin2);
  if (btnAdminManager) btnAdminManager.addEventListener("click", admin_manager);
  if (btnAptc) btnAptc.addEventListener("click", btn_aptc);

  // Verificación de que los botones existen
  console.log("btn_home:", btnHome);
  console.log("btn_form:", btnForm);
  console.log("btn_admin:", btnAdmin);
  console.log("btn_admin:", btnAdmin2);
  console.log("btnAdminManager:", btnAdminManager);
  console.log("btnAptc:", btnAptc);
});
 
function initializeCountryCode() {
  const numeroInput = document.getElementById("numero");
  if (!numeroInput) return;

  const paises = [
    { code: "+52", flag: "🇲🇽" },
    { code: "+1", flag: "🇺🇸" },
  ];

  let codigoSeleccionado = "+52";
  const dropdown = document.createElement("div");
  dropdown.classList.add("custom-dropdown");

  const selectedCountry = document.createElement("div");
  selectedCountry.classList.add("selected");
  selectedCountry.textContent = `🇲🇽 +52`;
  selectedCountry.setAttribute("role", "button");
  selectedCountry.setAttribute("aria-expanded", "false");

  const dropdownList = document.createElement("ul");
  dropdownList.classList.add("dropdown-list");
  dropdownList.style.display = "none";

  paises.forEach((pais) => {
    const li = document.createElement("li");
    li.textContent = `${pais.flag} ${pais.code}`;
    li.dataset.code = pais.code;

    li.addEventListener("click", () => {
      codigoSeleccionado = pais.code;
      selectedCountry.textContent = li.textContent;
      dropdownList.style.display = "none";
      selectedCountry.setAttribute("aria-expanded", "false");
      if (!numeroInput.value.trim()) numeroInput.value = codigoSeleccionado;
    });

    dropdownList.appendChild(li);
  });

  selectedCountry.addEventListener("click", () => {
    const isExpanded = dropdownList.style.display === "block";
    dropdownList.style.display = isExpanded ? "none" : "block";
    selectedCountry.setAttribute("aria-expanded", !isExpanded);
  });

  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) {
      dropdownList.style.display = "none";
      selectedCountry.setAttribute("aria-expanded", "false");
    }
  });

  dropdown.appendChild(selectedCountry);
  dropdown.appendChild(dropdownList);
  numeroInput.parentNode.insertBefore(dropdown, numeroInput);

  numeroInput.addEventListener("input", function () {
    let numero = this.value.replace(/\D/g, "");
    if (numero.length === 0) this.value = codigoSeleccionado;
    else if (!numero.startsWith(codigoSeleccionado.replace("+", "")))
      this.value = codigoSeleccionado + numero;
  });

  numeroInput.addEventListener("blur", function () {
    if (!this.value.startsWith(codigoSeleccionado))
      this.value = codigoSeleccionado + this.value;
  });
}

function initializeApp() {
  console.log("Inicializando la aplicación");

  if (localStorage.getItem(FORM_KEY) === null) {
    localStorage.setItem(FORM_KEY, "false");
    console.log("Estableciendo formVac como false por primera vez");
  }

  initForm();
  initProgressBar();
  updateProgress();
  initializeCountryCode();

  const isFormSubmitted = localStorage.getItem(FORM_KEY) === "true";
  console.log("Estado inicial del formulario:", isFormSubmitted);

  if (isFormSubmitted) {
    console.log("Configurando vista para formulario ya enviado");
    forms.forEach((form) => (form.style.display = "none"));
    if (label_btnEnviar) label_btnEnviar.style.display = "none";
    if (label_btnNext) label_btnNext.style.display = "none";
    if (document.getElementById("progreso")) document.getElementById("progreso").style.display = "none";
    if (exito) {
      exito.style.display = "flex";
      console.log("Mostrando mensaje de éxito en inicialización");
    }
  }

  // Solicitar permiso para notificaciones
  if ('Notification' in window && navigator.serviceWorker) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Permiso de notificaciones concedido');
      } else {
        console.log('Permiso de notificaciones denegado');
      }
    });
  }
}