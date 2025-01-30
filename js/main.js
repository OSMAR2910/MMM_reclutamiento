// Carga
window.onload = () => {
    const loader = document.getElementById('loader');
    loader.style.visibility = 'hidden';
    loader.style.opacity = '0';
    // Configuración inicial 
    elements.home.classList.add("agregar_dis");
};
//Obtener Anchura y Altura de la Ventana del Navegador
function obtenerTamañoVentana() {
  const anchuraVentana = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  const alturaVentana = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

  console.log(`Anchura de la ventana: ${anchuraVentana}px`);
  console.log(`Altura de la ventana: ${alturaVentana}px`);

  return { anchuraVentana, alturaVentana };
};
//Obtener Anchura y Altura del Documento Completo
obtenerTamañoVentana();
function obtenerTamañoDocumento() {
  const anchuraDocumento = Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.offsetWidth,
      document.documentElement.clientWidth
  );

  const alturaDocumento = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.documentElement.clientHeight
  );

  console.log(`Anchura del documento: ${anchuraDocumento}px`);
  console.log(`Altura del documento: ${alturaDocumento}px`);

  return { anchuraDocumento, alturaDocumento };
};
//Ajustar el Contenido Basado en el Tamaño 
function ajustarTamaño() {
  const { anchuraVentana, alturaVentana } = obtenerTamañoVentana();
  const { anchuraDocumento, alturaDocumento } = obtenerTamañoDocumento();

  // Aquí puedes ajustar los estilos o realizar operaciones basadas en el tamaño
  if (anchuraDocumento > anchuraVentana || alturaDocumento > alturaVentana) {
      document.body.style.overflow = "auto"; // Permitir scroll si el contenido es más grande que la ventana
  } else {
      document.body.style.overflow = "hidden"; // Ocultar scroll si el contenido cabe en la ventana
  }
}

// Llama a la función para ajustar el tamaño cuando la página se carga
window.addEventListener('load', ajustarTamaño);

// También puedes ajustar el tamaño cuando la ventana cambia de tamaño
window.addEventListener('resize', ajustarTamaño);



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
// Cambiar secciones navigation
// Obtener los elementos una sola vez para optimizar el rendimiento
const elements = {
    home: document.getElementById("home"),
    header: document.getElementById("header"),
    form: document.getElementById("pag1"),
    login: document.getElementById("pag2"),
    aside: document.getElementById("aside"),
    admin: document.getElementById("pag3"),
    tidioChat: document.getElementById("tidio-chat-iframe")
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

