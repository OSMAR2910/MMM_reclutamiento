// Carga
window.onload = () => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.visibility = "hidden";
    loader.style.opacity = "0";
  }

  // Configuración inicial inmediata
  elements.home?.classList.add("agregar_dis");
  elements.chatbot?.classList.add("agregar_dis");

  // Inicializar la app
  initializeApp();
};

// Manejo del viewport y teclado (optimizado para tu SASS)
function updateChatbotDimensions() {
  const vh = (window.visualViewport?.height || window.innerHeight) * 0.01;
  const totalHeight = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  document.documentElement.style.setProperty('--full-height', `${totalHeight}px`);
}

function adjustChatbotPosition() {
  const chatbot = elements.chatbot;
  const chatInput = document.getElementById("chat_input");
  if (!chatbot || !chatInput) return;

  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  const keyboardHeight = window.innerHeight - viewportHeight;

  if (chatbot.classList.contains("max_chat")) {
    if (keyboardHeight > 0) {
      const offset = 10;
      chatbot.style.bottom = `${keyboardHeight}px`;
      chatbot.style.height = `${viewportHeight - keyboardHeight}px`;
      const inputRect = chatInput.getBoundingClientRect();
      const chatBox = document.getElementById("chat_box");
      if (inputRect.bottom > viewportHeight - keyboardHeight) {
        chatBox.scrollTo({
          top: chatBox.scrollHeight,
          behavior: "smooth"
        });
        chatInput.scrollIntoView({ block: "end", behavior: "smooth" });
      }
    } else {
      chatbot.style.bottom = "0";
      chatbot.style.height = "var(--full-height)";
    }
  }
}

function scrollChatToBottom() {
  const chatBox = document.getElementById("chat_box");
  if (!chatBox) return;

  requestAnimationFrame(() => {
    chatBox.scrollTo({
      top: chatBox.scrollHeight,
      behavior: "smooth"
    });
  });
}

// Debounce para evitar cálculos excesivos
function debounce(func, wait = 100) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Manejo de eventos del viewport y teclado
const handleViewportChanges = debounce(() => {
  requestAnimationFrame(() => {
    updateChatbotDimensions();
    adjustChatbotPosition();
    scrollChatToBottom();
  });
}, 50);

// Escuchar eventos relevantes
["resize", "orientationchange"].forEach((event) =>
  window.addEventListener(event, handleViewportChanges)
);

// Usar visualViewport para detectar cambios en el teclado
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", handleViewportChanges);
  window.visualViewport.addEventListener("scroll", handleViewportChanges);
} else {
  // Fallback para navegadores sin visualViewport
  window.addEventListener("scroll", handleViewportChanges);
}

// Manejo específico del teclado al enfocar el input
document.addEventListener("DOMContentLoaded", () => {
  const chatInput = document.getElementById("chat_input");
  if (chatInput) {
    chatInput.addEventListener("focus", handleViewportChanges);
    chatInput.addEventListener("blur", handleViewportChanges);
    chatInput.addEventListener("input", () => {
      setTimeout(scrollChatToBottom, 50);
    });
  }
});
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

// Mapa de alertas con su ID y tiempo de visualización
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
};

let timeoutAlarma;

const mostrarAlerta = (alertaId) => {
  const alerta = document.getElementById(alertaId);
  if (!alerta) {
    console.error(`No se encontró ninguna alerta con el ID: ${alertaId}`);
    return;
  }

  if (timeoutAlarma) clearTimeout(timeoutAlarma);

  document
    .querySelectorAll("[id^='alerta_']")
    .forEach((alarma) => (alarma.style.display = "none"));

  alerta.style.display = "flex";
  const tiempo = alertasConfig[alertaId] || 3000;

  timeoutAlarma = setTimeout(() => (alerta.style.display = "none"), tiempo);
  alerta.onclick = () => {
    alerta.style.display = "none";
    clearTimeout(timeoutAlarma);
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
  admin_manager: document.getElementById("pag5"), // Corregido
  aside: document.getElementById("aside"),
  chatbot: document.getElementById("chatbot"),
  pavo_cont: document.getElementById("pavo_cont"),
};

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
}

// Funciones para cada botón
function btn_home() {
  toggleView({ home: true });
  console.log("Botón Home clicado");
}

function btn_form() {
  toggleView({ header: true, form: true, aside: true });
  console.log("Botón Form clicado");
}

function btn_admin() {
  toggleView({ header: true, login: true, aside: true });
  console.log("Botón Admin clicado");
}

function admin_manager() {
  toggleView({ header: true, login_manager: true, aside: true });
  console.log("Botón Admin Manager clicado");
}

function btn_aptc() {
  toggleView({ header: true, ap_tc: true, aside: true });
  console.log("Botón APTC clicado");
}

// Obtener todos los formularios
const forms = document.querySelectorAll(".cont_inputform");
const exito = document.getElementById("exito_form");
let currentFormIndex = 0;

const label_btnNext = document.getElementById("label_next");
const label_btnEnviar = document.getElementById("label_enviar");

function initForm() {
  if (forms.length) {
    forms[currentFormIndex].style.display = "grid";
    label_btnNext.style.display = "flex";
  }
}

function validateForm() {
  const inputs = forms[currentFormIndex].querySelectorAll(
    "input, select, textarea"
  );
  for (const input of inputs) {
    if (!input.value.trim()) {
      mostrarAlerta("alertas");
      mostrarAlerta("alerta_1");
      return false;
    }
  }
  return true;
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

function showNextForm() {
  if (!validateForm()) return;

  forms[currentFormIndex].style.display = "none";
  currentFormIndex++;

  if (currentFormIndex === forms.length - 1) {
    label_btnNext.style.display = "none";
    label_btnEnviar.style.display = "flex";
  }

  forms[currentFormIndex].style.display = "grid";
  updateProgress();
}

const FORM_KEY = 'formVac';

function enviar_fo() {
  const isFormSubmitted = localStorage.getItem(FORM_KEY) === 'true';
  console.log('¿Formulario ya enviado?', isFormSubmitted);

  if (isFormSubmitted) {
    console.log('Mostrando estado de formulario ya enviado');
    forms.forEach((form) => {
      form.style.display = "none";
      console.log('Ocultando formulario:', form);
    });
    if (label_btnEnviar) label_btnEnviar.style.display = "none";
    if (document.getElementById("progreso")) document.getElementById("progreso").style.display = "none";
    if (exito) {
      exito.style.display = "flex";
      console.log('Mostrando mensaje de éxito');
    }
    mostrarAlerta("alerta_2");
    return;
  }

  if (!validateForm()) {
    console.log('Validación fallida');
    return;
  }

  console.log('Formulario válido, procesando envío');
  forms.forEach((form) => (form.style.display = "none"));
  if (label_btnEnviar) label_btnEnviar.style.display = "none";
  if (document.getElementById("progreso")) document.getElementById("progreso").style.display = "none";
  if (exito) exito.style.display = "flex";
  
  localStorage.setItem(FORM_KEY, 'true');
  console.log('Formulario guardado como enviado en localStorage');
}

label_btnNext?.addEventListener("click", showNextForm);
label_btnEnviar?.addEventListener("click", enviar_fo);

// Personalización de selects
function personalizarSelect(select) {
  // ✅ 1. Eliminar cualquier personalización previa antes de aplicar una nueva
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

  // ✅ 9. Agregar todo al DOM
  customSelect.appendChild(selectedDiv);
  customSelect.appendChild(optionsDiv);
  select.parentNode.insertBefore(customSelect, select);
  select.style.display = "none"; // Ocultar el select nativo
}

// Función de checkboxes
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  const checkboxes = [
    ...document.querySelectorAll('.disponibilidad_sucu input[type="checkbox"]'),
    ...document.querySelectorAll('.mensajes_usuarios input[type="checkbox"]'),
    ...document.querySelectorAll('.estatus_vacantes input[type="checkbox"]'),
    ...document.querySelectorAll('.estatus_citas_manager input[type="checkbox"]'),
    ...document.querySelectorAll('.settings input[type="checkbox"]')
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
  const btnAdminManager = document.getElementById("btnAdminManager");
  const btnAptc = document.getElementById("btnAptc");

  if (btnHome) btnHome.addEventListener("click", btn_home);
  if (btnForm) btnForm.addEventListener("click", btn_form);
  if (btnAdmin) btnAdmin.addEventListener("click", btn_admin);
  if (btnAdminManager) btnAdminManager.addEventListener("click", admin_manager);
  if (btnAptc) btnAptc.addEventListener("click", btn_aptc);

  // Verificación de que los botones existen
  console.log("btn_home:", btnHome);
  console.log("btn_form:", btnForm);
  console.log("btn_admin:", btnAdmin);
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
  console.log('Inicializando la aplicación');
  
  if (localStorage.getItem(FORM_KEY) === null) {
    localStorage.setItem(FORM_KEY, 'false');
    console.log('Estableciendo formVac como false por primera vez');
  }
  
  initForm();
  initProgressBar();
  updateProgress();
  initializeCountryCode();
  
  const isFormSubmitted = localStorage.getItem(FORM_KEY) === 'true';
  console.log('Estado inicial del formulario:', isFormSubmitted);
  
  if (isFormSubmitted) {
    console.log('Configurando vista para formulario ya enviado');
    forms.forEach((form) => (form.style.display = "none"));
    if (label_btnEnviar) label_btnEnviar.style.display = "none";
    if (label_btnNext) label_btnNext.style.display = "none";
    if (document.getElementById("progreso")) document.getElementById("progreso").style.display = "none";
    if (exito) {
      exito.style.display = "flex";
      console.log('Mostrando mensaje de éxito en inicialización');
    }
  }
}

// Exportar la función personalizarSelect para que database.js la use
export { personalizarSelect };