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

  // Inicializar la app con el valor actual de window.env
  initializeApp();
  // No need to call updateDesactiveMode here anymore
};

// Redimensionar y manejar viewport (optimizado para iOS)
function updateChatbotDimensions() {
  const vh = (window.visualViewport?.height || window.innerHeight) * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

function adjustFixedElements() {
  const chatbot = elements.chatbot;
  if (chatbot) {
    chatbot.style.bottom = window.visualViewport
      ? `${window.visualViewport.offsetTop + 20}px`
      : "20px";
  }
}

// Debounce para optimizar eventos de viewport
function debounce(func, wait = 16) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const handleViewportChanges = debounce(() => {
  requestAnimationFrame(() => {
    updateChatbotDimensions();
    adjustFixedElements();
  });
});

["load", "resize", "orientationchange", "scroll"].forEach((event) =>
  window.addEventListener(event, handleViewportChanges)
);

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

// Variable para almacenar el timeout actual
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
const elements = {
  header: document.getElementById("header"),
  home: document.getElementById("home"),
  form: document.getElementById("pag1"),
  login: document.getElementById("pag2"),
  admin: document.getElementById("pag3"),
  login_manager: document.getElementById("pag4"),
  admin_manager: document.getElementById("pag5"),
  aside: document.getElementById("aside"),
  chatbot: document.getElementById("chatbot"),
  ap_tc: document.getElementById("ap_tc"),
};

function toggleView({
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
}
function btn_form() {
  toggleView({ header: true, form: true, aside: true });
}
function btn_admin() {
  toggleView({ header: true, login: true, aside: true });
}
function admin_manager() {
  toggleView({ header: true, login_manager: true, aside: true });
}
function btn_admin_regreso() {
  location.reload();
}
function btn_aptc() {
  toggleView({ header: true, ap_tc: true, aside: true });
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

// Agregar funcionalidad para mostrar/ocultar contraseñas
document
  .querySelectorAll('.input-field input[type="password"]')
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

// Agregar barra de progreso
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

function enviar_fo() {
  if (!validateForm()) return;

  forms.forEach((form) => (form.style.display = "none"));
  label_btnEnviar.style.display = "none";
  document.getElementById("progreso").style.display = "none";
  exito.style.display = "flex";
}

label_btnNext?.addEventListener("click", showNextForm);
label_btnEnviar?.addEventListener("click", enviar_fo);

// Personalización de selects
document.querySelectorAll("select").forEach((select) => {
  const customSelect = document.createElement("div");
  customSelect.classList.add("custom-select", "input");

  const label = document.querySelector(`label[for='${select.id}']`);
  label?.classList.add("custom-label");

  const selectedDiv = document.createElement("div");
  selectedDiv.classList.add("select-selected");
  selectedDiv.textContent = select.options[select.selectedIndex].text;
  selectedDiv.setAttribute("tabindex", "0");

  const optionsDiv = document.createElement("div");
  optionsDiv.classList.add("select-items");

  Array.from(select.options).forEach((option, index) => {
    const optionDiv = document.createElement("div");
    optionDiv.textContent = option.text;
    if (option.disabled) optionDiv.classList.add("disabled");
    else {
      optionDiv.addEventListener("click", () => {
        select.selectedIndex = index;
        selectedDiv.textContent = option.text;
        select.dispatchEvent(new Event("change"));
        optionsDiv.style.display = "none";
        if (label) {
          label.style.display = "none";
        }
      });
    }
    optionsDiv.appendChild(optionDiv);
  });

  selectedDiv.addEventListener("focus", () => {
    optionsDiv.style.display = "block";
    if (label) {
      label.style.display = "flex";
    }
  });

  document.addEventListener("click", (event) => {
    if (!customSelect.contains(event.target)) {
      optionsDiv.style.display = "none";
      if (label && !select.value) {
        label.style.display = "none";
        label.style.display = "none";
      }
    }
  });

  customSelect.appendChild(selectedDiv);
  customSelect.appendChild(optionsDiv);
  select.parentNode.insertBefore(customSelect, select);
  select.style.display = "none";
});

// Función de checkboxes
document.addEventListener("DOMContentLoaded", () => {
  const checkboxes = [
    ...document.querySelectorAll('.estatus_vacantes input[type="checkbox"]'),
    ...document.querySelectorAll(
      '.estatus_citas_manager input[type="checkbox"]'
    ),
    ...document.querySelectorAll('.mensajes_usuarios input[type="checkbox"]'),
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

// Agregar número de país
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

// Al final, reemplaza tu `initializeApp`
function initializeApp() {
  initForm();
  initProgressBar();
  updateProgress();
  initializeCountryCode();
}
