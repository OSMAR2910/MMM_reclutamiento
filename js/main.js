// Carga
window.onload = () => {
    const loader = document.getElementById('loader');
    loader.style.visibility = 'hidden';
    loader.style.opacity = '0';
    // Configuración inicial 
    elements.home.classList.add("agregar_dis");
    elements.chatbot.classList.add("agregar_dis");
};

// Obtener el ancho y alto del viewport
function getViewportSize() {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  console.log(`Ancho del viewport: ${viewportWidth}px`);
  console.log(`Alto del viewport: ${viewportHeight}px`);

  return { width: viewportWidth, height: viewportHeight };
}

// Llamar a la función cuando se carga la página
window.addEventListener('load', () => {
  const size = getViewportSize();
  console.log('Dimensiones iniciales:', size);
});

// Actualizar las dimensiones si el usuario cambia el tamaño de la ventana
window.addEventListener('resize', () => {
  const size = getViewportSize();
  console.log('Dimensiones actualizadas:', size);
});

// Verificar si es un dispositivo táctil
const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

if (!isTouchDevice()) {
    const cursorEl = document.querySelector('.js-cursor');
    const classes = {
        clicked: 'is-clicked',
        hidden: 'is-hidden',
        linkHovered: 'is-link-hovered',
        customCursor: 'has-custom-cursor'
    };

    const onMouseMove = (e) => {
        cursorEl.style.setProperty('--cursor-x', `${e.clientX}px`);
        cursorEl.style.setProperty('--cursor-y', `${e.clientY}px`);
    };

    const toggleClass = (className, add) => {
        cursorEl.classList[add ? 'add' : 'remove'](className);
    };

    const handleLinkHoverEvents = () => {
        document.querySelectorAll('a, button, .js-link, input[type="button"], input[type="submit"]').forEach(el => {
            el.addEventListener('mouseover', () => toggleClass(classes.linkHovered, true));
            el.addEventListener('mouseout', () => toggleClass(classes.linkHovered, false));
        });
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', () => toggleClass(classes.clicked, true));
    document.addEventListener('mouseup', () => toggleClass(classes.clicked, false));
    document.addEventListener('mouseenter', () => toggleClass(classes.hidden, false));
    document.addEventListener('mouseleave', () => toggleClass(classes.hidden, true));

    handleLinkHoverEvents();
    document.body.classList.add(classes.customCursor);
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

// Función genérica para mostrar y ocultar alertas
const mostrarAlerta = (alertaId) => {
  // Obtener la alerta específica por su ID
  const alerta = document.getElementById(alertaId);
  if (!alerta) {
    console.error(`No se encontró ninguna alerta con el ID: ${alertaId}`);
    return;
  }

  // Cancelar el timeout de la alarma anterior (si existe)
  if (timeoutAlarma) {
    clearTimeout(timeoutAlarma);
  }

  // Ocultar cualquier alarma visible
  const todasLasAlarmas = document.querySelectorAll("[id^='alerta_']");
  todasLasAlarmas.forEach((alarma) => {
    alarma.style.display = "none";
  });

  // Mostrar la alerta actual
  alerta.style.display = "flex";

  // Obtener el tiempo de visualización configurado o usar 3000ms por defecto
  const tiempo = alertasConfig[alertaId] || 3000;

  // Programar la ocultación de la alerta después del tiempo especificado
  timeoutAlarma = setTimeout(() => {
    alerta.style.display = "none";
  }, tiempo);

  // Agregar un evento de clic para ocultar la alarma al hacer clic en ella
  alerta.onclick = () => {
    alerta.style.display = "none";
    clearTimeout(timeoutAlarma); // Cancelar el timeout al hacer clic
  };
};
// Cambiar secciones navigation
// Obtener los elementos una sola vez para optimizar el rendimiento
const elements = {
    home: document.getElementById("home"),
    header: document.getElementById("header"),
    form: document.getElementById("pag1"),
    login: document.getElementById("pag2"),
    aside: document.getElementById("aside"),
    admin: document.getElementById("pag3"),
    chatbot: document.getElementById("chatbot")
  };
  // Función genérica para gestionar clases según la vista activa
  function toggleView({ home = false, header = false, form = false, login = false, aside = false , admin = false}) {
    elements.home.classList.toggle("agregar_dis", home);
    elements.header.classList.toggle("cambiar_nav", header);
    elements.form.classList.toggle("agregar_dis", form);
    elements.login.classList.toggle("agregar_dis", login);
    elements.aside.classList.toggle("agregar_dis", aside);
    elements.admin.classList.toggle("agregar_dis", admin);
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
  function btn_admin_regreso() {
    location.reload();
  }

  //funciones para fomulario
// Obtener todos los formularios
const forms = document.querySelectorAll('.cont_inputform');
const exito = document.getElementById('exito_form');
let currentFormIndex = 0;

// Obtener los botones
const label_btnNext = document.getElementById('label_next');
const label_btnEnviar = document.getElementById('label_enviar');

// Función para inicializar el formulario
function initForm() {
  // Mostrar el primer formulario por defecto
  forms[currentFormIndex].style.display = 'grid';
  // Mostrar el botón "Siguiente" después de cargar el primer formulario
  label_btnNext.style.display = 'flex';
}

// Función para validar que los inputs del formulario actual no estén vacíos
function validateForm() {
  const inputs = forms[currentFormIndex].querySelectorAll('input, select, textarea'); // Obtener todos los inputs del formulario actual
  for (let input of inputs) {
    if (!input.value.trim()) { // Verificar si el valor está vacío o contiene solo espacios
      mostrarAlerta("alertas");
      mostrarAlerta("alerta_1");
      return false; // Detener la validación y retornar falso
    }
  }
  return true; // Si todos los campos están completos, retornar verdadero
}

// Función para mostrar el siguiente formulario
function showNextForm() {
  // Validar que los campos del formulario actual no estén vacíos
  if (!validateForm()) {
    return; // Si la validación falla, detener la ejecución
  }

  // Ocultar el formulario actual
  forms[currentFormIndex].style.display = 'none';

  // Incrementar el índice para mostrar el siguiente formulario
  currentFormIndex++;

  // Verificar si estamos en el último formulario
  if (currentFormIndex === forms.length - 1) {
    // Si es el último formulario, ocultar el botón "Siguiente" y mostrar el botón "Enviar"
    label_btnNext.style.display = 'none';
    label_btnEnviar.style.display = 'flex';
  }

  // Mostrar el siguiente formulario
  forms[currentFormIndex].style.display = 'grid';
}

// Función para manejar el envío del formulario
function enviar_fo() {
  // Validar que los campos del último formulario no estén vacíos
  if (!validateForm()) {
    return; // Si la validación falla, detener la ejecución
  }

  // Ocultar todos los formularios
  forms.forEach(form => form.style.display = 'none');

  // Ocultar el botón "Enviar"
  label_btnEnviar.style.display = 'none';

  // Mostrar la página de éxito con display: flex
  exito.style.display = 'flex';
}

// Agregar evento al botón "Siguiente"
label_btnNext.addEventListener('click', showNextForm);

// Agregar evento al botón "Enviar"
label_btnEnviar.addEventListener('click', enviar_fo);

// Inicializar el formulario
initForm();