// Carga
window.onload = () => {
    const loader = document.getElementById('loader');
    loader.style.visibility = 'hidden';
    loader.style.opacity = '0';
    // Configuración inicial 
    elements.home.classList.add("agregar_dis");
};

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

