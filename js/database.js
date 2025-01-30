// Importar Firebase Authentication
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { database, ref, set, onValue, remove, app } from "./firebase.js";

// Inicializar Firebase Auth
const auth = getAuth(app);

// Mapa de alertas con su ID y tiempo de visualización
const alertasConfig = {
  alertas: 1500,
  alertas_admin: 1500,
  alerta_1: 1500,
  alerta_2: 1500,
  alerta_3: 1500, 
  alerta_4: 1500,
  alerta_5: 1500,
  alerta_6: 1500,
  alerta_7: 1500,
};

// Función genérica para mostrar y ocultar alertas
const mostrarAlerta = (alertaId) => {
  const alerta = document.getElementById(alertaId);
  const tiempo = alertasConfig[alertaId] || 3000; // Usar tiempo configurado o 3000ms por defecto

  alerta.style.display = "flex"; // Mostrar alerta

  setTimeout(() => {
    alerta.style.display = "none"; // Ocultar alerta después de un tiempo
  }, tiempo);
};

// Escribir datos
function enviar_form() {
  // Obtiene los valores del formulario
  const nombre = document.getElementById("nombre").value.trim(); // Eliminar espacios extras
  const puesto = document.getElementById("l_p_s").value;
  const r_f = document.getElementById("l_r_f").value;
  const numero = document.getElementById("numero").value;
  const fecha_r = document.getElementById("fecha_r").value;
  const edad = document.getElementById("edad").value;
  const direccion = document.getElementById("direccion").value;
  const ciudad = document.getElementById("l_ciu").value;
  const cp = document.getElementById("cp").value;
  const casa_suc = document.getElementById("casa_suc").value;
  const transporte = document.getElementById("transporte").value;
  const f_t = document.getElementById("l_f_t").value;
  const sexo = document.getElementById("l_sex").value;
  const nacion = document.getElementById("nacion").value;
  const peso = document.getElementById("peso").value;

  // Validación: Verificar que todos los campos estén llenos
  if (
    !nombre ||
    !puesto ||
    !numero ||
    !fecha_r ||
    !edad ||
    !direccion ||
    !ciudad ||
    !cp ||
    !casa_suc ||
    !transporte ||
    !f_t ||
    !r_f ||
    !sexo ||
    !nacion ||
    !peso
  ) {
    mostrarAlerta("alertas");
    mostrarAlerta("alerta_1");
    return; // Detiene la ejecución si algún campo está vacío
  }

  // Crear el objeto con los datos del formulario
  const formData = {
    puesto,
    numero,
    fecha_r,
    edad,
    direccion,
    ciudad,
    cp,
    casa_suc,
    transporte,
    f_t,
    r_f,
    sexo,
    nacion,
    peso,
  };

  // Guardar en Firebase usando el nombre como clave
  set(ref(database, `vacantes/${nombre}`), formData)
    .then(() => {
      console.log("Formulario enviado exitosamente!");
      mostrarAlerta("alertas");
      mostrarAlerta("alerta_2");
      // Limpiar los campos del formulario
      document.getElementById("myForm").reset();
    })
    .catch((error) => {
      console.error("Hubo un error: ", error.message);
      mostrarAlerta("alertas");
      mostrarAlerta("alerta_3");
    });
}

// Asigna la función al objeto global 'window'
window.enviar_form = enviar_form;

// Leer datos
function mostrarDatos() {
  const dataGreen = document.getElementById("data_green");
  const dataRed = document.getElementById("data_red");
  const dataNosistieron = document.getElementById("data_no_asistieron");
  const dataAsistieron = document.getElementById("data_asistieron");
  const dataContratado = document.getElementById("data_contratado");
  const vacantesRef = ref(database, "vacantes/");
  const asistieronRef = ref(database, "asistieron/");
  const no_asistieronRef = ref(database, "no_asistieron/");
  const contratadoRef = ref(database, "contratado/");
  let vacantesPrevias = new Set();

  // Mostrar vacantes generales (Fijas y Temporales)
  onValue(vacantesRef, (snapshot) => {
    renderizarVacantes(snapshot, dataGreen, dataRed);
  });

  // Mostrar vacantes en "Asistieron"
  onValue(asistieronRef, (snapshot) => {
    renderizarVacantes(snapshot, dataAsistieron, null, true);
  });

  // Mostrar vacantes en "Nosistieron"
  onValue(no_asistieronRef, (snapshot) => {
    renderizarVacantes(snapshot, dataNosistieron, null, true);
  });

  // Mostrar vacantes en "Contratado"
  onValue(contratadoRef, (snapshot) => {
    renderizarVacantes(snapshot, dataContratado, null, true);
  });

  function renderizarVacantes(
    snapshot,
    containerGreen,
    containerRed,
    esAsistieron = false
  ) {
    const fragmentGreen = document.createDocumentFragment();
    const fragmentRed = document.createDocumentFragment();

    containerGreen.innerHTML = "";
    if (containerRed) containerRed.innerHTML = "";

    let vacantesActuales = new Set();

    if (snapshot.exists()) {
      const ulGreen = document.createElement("ul");
      const ulRed = document.createElement("ul");

      snapshot.forEach((childSnapshot) => {
        const nombre = childSnapshot.key;
        const data = childSnapshot.val() || {};

        vacantesActuales.add(nombre);

        // Mostrar notificación solo si la vacante es nueva y está en dataGreen (tipo "Fijo" y "Rotativo")
        if (!vacantesPrevias.has(nombre) && data.f_t === "Fijo" && data.r_f === "Rotativo") {
          mostrarNotificacion(`${nombre} es vacante para MMM`);
        }

        const listItem = document.createElement("button");
        listItem.classList.add(
          esAsistieron
            ? "vacante_asistieron"
            : data.f_t === "Fijo" && data.r_f === "Rotativo"
            ? "vacante_itemgreen"
            : "vacante_itemred"
        );

        const infoContainer = document.createElement("div");
        infoContainer.classList.add("vacante_info");

        const campos = [
          { label: "Nombre", value: nombre, isName: true },
          { label: "Puesto", value: data.puesto || "No disponible" },
          { label: "Número", value: data.numero || "No disponible" },
          { label: "Fecha Registro", value: data.fecha_r ? new Date(data.fecha_r).toLocaleDateString() : "No disponible"},
          { label: "Edad", value: data.edad || "No disponible" },
          { label: "Dirección", value: data.direccion || "No disponible" },
          { label: "Ciudad", value: data.ciudad || "No disponible" },
          { label: "CP", value: data.cp || "No disponible" },
          { label: "Casa/Sucursal", value: data.casa_suc || "No disponible" },
          { label: "Transporte", value: data.transporte || "No disponible" },
          { label: "F/T", value: data.f_t || "No disponible" },
          { label: "R/F", value: data.r_f || "No disponible" },
          { label: "Sexo", value: data.sexo || "No disponible" },
          { label: "Nacionalidad", value: data.nacion || "No disponible" },
          { label: "Peso", value: data.peso || "No disponible" },
        ];

        campos.forEach((campo) => {
          const span = document.createElement("span");
          if (campo.isName) span.classList.add("dbname");
          span.innerHTML = `<strong>${campo.label}:</strong> ${campo.value}`;
          infoContainer.appendChild(span);
        });

        // Botones con clases específicas pero sin ID
        const btnContainer = document.createElement("div");
        btnContainer.classList.add("btn-container");

        const btnNoAsistieron = crearBoton("", "btn-noAsistieron", () =>
          moverVacante(nombre, data, "no_asistieron")
        );
        const btnAsistieron = crearBoton("", "btn-asistieron", () =>
          moverVacante(nombre, data, "asistieron")
        );
        const btnContratado = crearBoton("", "btn-contratado", () =>
          moverVacante(nombre, data, "contratado")
        );
        const btnEliminar = crearBoton("", "btn-eliminar", () => {
          let base = "vacantes"; // Por defecto en vacantes
          if (containerGreen.id === "data_no_asistieron")
            base = "no_asistieron";
          if (containerGreen.id === "data_asistieron") base = "asistieron";
          if (containerGreen.id === "data_contratado") base = "contratado";
          eliminarVacante(nombre, base);
        });

        btnContainer.append(
          btnNoAsistieron,
          btnAsistieron,
          btnContratado,
          btnEliminar
        );

        listItem.appendChild(infoContainer);
        listItem.appendChild(btnContainer);

        if (esAsistieron) {
          ulGreen.appendChild(listItem);
        } else {
          data.f_t === "Fijo" && data.r_f === "Rotativo"
            ? ulGreen.appendChild(listItem)
            : ulRed.appendChild(listItem);
        }
      });

      fragmentGreen.appendChild(ulGreen);
      if (containerRed) fragmentRed.appendChild(ulRed);

      containerGreen.appendChild(fragmentGreen);
      if (containerRed) containerRed.appendChild(fragmentRed);
    } else {
      containerGreen.innerHTML = "<p>No hay datos disponibles</p>";
      if (containerRed)
        containerRed.innerHTML = "<p>No hay datos disponibles</p>";
    }

    vacantesPrevias = vacantesActuales;
  }
}

// Función para crear botones sin ID
function crearBoton(texto, clase, onClick) {
  const btn = document.createElement("button");
  btn.classList.add(clase);
  btn.textContent = texto;
  btn.onclick = onClick;
  return btn;
}

// Función para mover una vacante a otra base de datos
function moverVacante(nombre, data, nuevaDB) {
  const nuevaRef = ref(database, `${nuevaDB}/${nombre}`);
  const bases = ["vacantes", "asistieron", "no_asistieron", "contratado"];
  let antiguaRef;

  // Determinar la referencia anterior correcta
  for (let base of bases) {
    const refActual = ref(database, `${base}/${nombre}`);
    onValue(refActual, (snapshot) => {
      if (snapshot.exists()) {
        antiguaRef = refActual;
      }
    }, { onlyOnce: true });
  }

  // Esperar un pequeño tiempo para asegurarse de que antiguaRef se haya determinado
  setTimeout(() => {
    if (antiguaRef) {
      set(nuevaRef, data)
        .then(() => {
          remove(antiguaRef)
            .then(() => {
              mostrarAlerta("alertas_admin");
              mostrarAlerta("alerta_6");
              console.log(`Vacante ${nombre} movida a ${nuevaDB}`);
            })
            .catch((error) => {
              console.error("Error al eliminar de la base de datos anterior:", error);
            });
        })
        .catch((error) => {
          console.error("Error al mover a la nueva base:", error);
        });
    } else {
      console.error("No se pudo determinar la referencia anterior.");
    }
  }, 500);
}

// Función para eliminar una vacante con confirmación
function eliminarVacante(nombre, base) {
  if (confirm(`¿Estás seguro de eliminar la vacante "${nombre}"?`)) {
    let ruta = "";

    // Determinar la ruta correcta
    switch (base) {
      case "asistieron":
        ruta = `asistieron/${nombre}`;
        break;
      case "no_asistieron":
        ruta = `no_asistieron/${nombre}`;
        break;
      case "contratado":
        ruta = `contratado/${nombre}`;
        break;
      default:
        ruta = `vacantes/${nombre}`;
        break;
    }

    const refVacante = ref(database, ruta);

    console.log(`Intentando eliminar: ${ruta}`); // Debugging

    remove(refVacante)
      .then(() => {
        mostrarAlerta("alertas_admin");
        mostrarAlerta("alerta_7");
        console.log(`Vacante eliminada de ${ruta}`);
      })
      .catch((error) => console.error("Error al eliminar vacante:", error));
  }
}

// Función para mostrar una notificación cuando hay una nueva vacante
function mostrarNotificacion(mensaje) {
  if (Notification.permission === "granted") {
    new Notification(mensaje);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(mensaje);
      }
    });
  }
}

// Pedir permiso de notificaciones al cargar la página
if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Ejecutar la función automáticamente al cargar la página
document.addEventListener("DOMContentLoaded", mostrarDatos);

const formulario = document.getElementById("formuariolog");
if (formulario) {
    formulario.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            document.getElementById("btn_log_admin").click();
        }
    });
}

// Función de inicio de sesión
function login() {
  const userInput = document.getElementById("user").value.trim();
  const passInput = document.getElementById("pass").value.trim();
  const email = userInput + "@gmail.com";

  if (!userInput || !passInput) {
      mostrarAlerta("alertas");
      mostrarAlerta("alerta_1"); 
      return;
  }

  signInWithEmailAndPassword(auth, email, passInput)
      .then(() => {
          setTimeout(() => {
              const elements = {
                  home: document.getElementById("home"),
                  header: document.getElementById("header"),
                  form: document.getElementById("pag1"),
                  login: document.getElementById("pag2"),
                  admin: document.getElementById("pag3"),
                  aside: document.getElementById("aside"),
                  tidioChat: document.getElementById("tidio-chat-iframe"),
              };

              const toggleClass = (elements, className, add = true) => {
                  elements.forEach((element) => {
                      if (element) {
                          add ? element.classList.add(className) : element.classList.remove(className);
                      }
                  });
              };

              toggleClass([elements.home, elements.form, elements.login, elements.aside], "agregar_dis", false);
              toggleClass([elements.admin], "agregar_dis", true);
              toggleClass([elements.header], "cambiar_nav", false);

              elements.header.style.display = "none";
              if (elements.tidioChat) elements.tidioChat.style.display = "none";

              mostrarAlerta("alertas_admin");
              mostrarAlerta("alerta_4");
          }, 1000);

          document.getElementById("Logincont").classList.add("animacionlog");
          
          // Llama a la función para actualizar los datos
          mostrarDatos();

      })
      .catch((error) => {  
          console.log("Código de error:", error.code); // Muestra el error en consola

          const formuariolog = document.getElementById("formuariolog");
          const errorall = document.getElementById("errorall");
          const erroru = document.getElementById("erroru");
          const errorp = document.getElementById("errorp");

          const mostrarError = (errorElement) => {
              setTimeout(() => {
                  formuariolog.classList.remove("activolog");
                  errorElement.classList.add("activolog");
              }, 200);
              formuariolog.classList.add("animacionform");
          };

          if (error.code === "auth/user-not-found" || error.code === "auth/invalid-email") {
              mostrarError(erroru); // Usuario incorrecto
          } else if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
              mostrarError(errorp); // Contraseña incorrecta
          } else {
              mostrarError(errorall); // Otro error
          }
      });
}

// Asignar la función al botón de inicio de sesión
document.getElementById("btn_log_admin").addEventListener("click", login);

// Función para cerrar sesión
const logoutButton = document.getElementById("logoutButton");

// Agrega un evento de clic al botón
logoutButton.addEventListener("click", function() {
  signOut(auth).then(() => {
    // Acción después de cerrar sesión exitosamente
    console.log("Sesión cerrada con éxito.");
  }).catch((error) => {
    // Manejo de errores
    console.error("Error al cerrar sesión: ", error);
  });
});