// Carga
window.onload = () => {
    const loader = document.getElementById('loader');
    loader.style.visibility = 'hidden';
    loader.style.opacity = '0';
    loader.style.display = 'none';
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

  
//Login
// Seleccionar el formulario
const formulario = document.getElementById("formuariolog");

// Detectar el evento 'keydown' en el formulario
formulario.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault(); // Evita el comportamiento predeterminado de recargar la página
    document.getElementById("btn_log_admin").click(); // Simula un clic en el botón de envío
  }
});
// Función para cargar usuarios desde el archivo JSON
async function loadUsers() {
  const response = await fetch("json/Pass.json");
  const users = await response.json();
  return users;
}

// Función para autenticar usuario y contraseña
async function log_admin() {
  // Obtener los valores ingresados por el usuario
  const username = document.getElementById("user").value;
  const password = document.getElementById("pass").value;

  // Cargar los datos de usuarios desde el JSON
  const users = await loadUsers();

  // Buscar el usuario por nombre
  const user = users.find((user) => user.user === username);

  if (!user) {
    // Si no se encuentra el usuario
    setTimeout(function () {
      const formuariolog = document.getElementById("formuariolog");
      const error = document.getElementById("erroru");
      formuariolog.classList.remove("activolog");
      error.classList.add("activolog");
    }, 200);
    formuariolog.classList.add("animacionform");
    return;
  }

  // Verificar la contraseña
  if (user.pass === password) {
    setTimeout(function () {
      // Obtener referencias a los elementos
      const elements = {
        home: document.getElementById("home"),
        header: document.getElementById("header"),
        form: document.getElementById("pag1"),
        login: document.getElementById("pag2"),
        admin: document.getElementById("pag3"),
        aside: document.getElementById("aside")
      };
      
      // Función para añadir o remover una clase en un grupo de elementos
      const toggleClass = (elements, className, add = true) => {
        elements.forEach(element => {
          if (element) {
            add ? element.classList.add(className) : element.classList.remove(className);
          }
        });
      };
      
      // Función para modificar estilos de manera genérica
      const setStyle = (element, styles) => {
        if (element) {
          Object.assign(element.style, styles);
        }
      };
      
      // Gestionar clases y estilos según la vista activa
      toggleClass([elements.home, elements.form, elements.login, elements.aside], "agregar_dis", false);
      toggleClass([elements.admin], "agregar_dis", true);
      toggleClass([elements.header], "cambiar_nav", false);
      setStyle(elements.header, { display: "none" });
      const tidioChat = document.getElementById("tidio-chat-iframe");
      tidioChat.style.display = "none";
    }, 1000);
    const login = document.getElementById("Logincont");
    const logo = document.getElementById("Logo");
    login.classList.add("animacionlog");
    logo.classList.add("anilog");
  } else {
    // Si se encuentra el usuario pero la contraseña es incorrecta
    setTimeout(function () {
      const formuariolog = document.getElementById("formuariolog");
      const error = document.getElementById("errorp");
      formuariolog.classList.remove("activolog");
      error.classList.add("activolog");
    }, 200);
    formuariolog.classList.add("animacionform");
  }
}
