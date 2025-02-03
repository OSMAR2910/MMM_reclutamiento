// Importar Firebase Authentication
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { database, ref, set, onValue, remove, app, get } from "./firebase.js";

// Inicializar Firebase Auth
const auth = getAuth(app);

// Mapa de alertas con su ID y tiempo de visualización
const alertasConfig = {
  alertas: 2000,
  alertas_admin: 2000,
  alerta_1: 2000,
  alerta_2: 2000,
  alerta_3: 2000,
  alerta_4: 2000,
  alerta_5: 2000,
  alerta_6: 2000,
  alerta_7: 2000,
  alerta_8: 2000,
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
  // Obtener la fecha actual en UTC
  const fechaActual = new Date().toISOString().split('T')[0];

  // Asignar la fecha al input oculto
  document.getElementById('fecha_r').value = fechaActual;

  // Mostrar la fecha en la consola para verificar
  console.log("Fecha actual (UTC):", fechaActual);
  console.log("Valor de fecha_r:", document.getElementById('fecha_r').value);

  // Obtiene los valores del formulario
  const nombre = document.getElementById("nombre").value.trim(); // Eliminar espacios extras
  const puesto = document.getElementById("puesto").value;
  const horario = document.getElementById("horario").value;
  const numero = document.getElementById("numero").value;
  const fecha_r = document.getElementById("fecha_r").value; // Usamos el valor asignado
  const edad = document.getElementById("edad").value;
  const direccion = document.getElementById("direccion").value;
  const ciudad = document.getElementById("ciudad").value;
  const cp = document.getElementById("cp").value;
  const docu = document.getElementById("docu").value;
  const casa_suc = document.getElementById("casa_suc").value;
  const transporte = document.getElementById("transporte").value;
  const empleo = document.getElementById("empleo").value;
  const sexo = document.getElementById("sexo").value;
  const nacion = document.getElementById("nacion").value;
  const peso = document.getElementById("peso").value;
  const e_c = document.getElementById("e_c").value;
  const altura = document.getElementById("altura").value;

  // Validación: Verificar que todos los campos estén llenos
  if (
    !nombre ||
    !puesto ||
    !numero ||
    !edad ||
    !direccion ||
    !ciudad ||
    !cp ||
    !casa_suc ||
    !transporte ||
    !e_c ||
    !docu ||
    !empleo ||
    !horario ||
    !sexo ||
    !nacion ||
    !altura ||
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
    fecha_r, // Usamos la fecha asignada
    edad,
    direccion,
    ciudad,
    cp,
    e_c,
    docu,
    casa_suc,
    transporte,
    empleo,
    horario,
    sexo,
    nacion,
    peso,
    altura,
  };

  // Guardar en Firebase usando el nombre como clave
  set(ref(database, `vacantes/${nombre}`), formData)
    .then(() => {
      console.log("Formulario enviado exitosamente!");
      mostrarAlerta("alertas");
      mostrarAlerta("alerta_2");
      // Limpiar los campos del formulario (opcional)
       document.getElementById("myForm").reset();
    })
    .catch((error) => {
      console.error("Hubo un error: ", error.message);
      mostrarAlerta("alertas");
      mostrarAlerta("alerta_3");
    });
};

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
  
        const listItem = document.createElement("button");
        listItem.classList.add(
          esAsistieron
            ? "vacante_asistieron"
            : data.empleo === "Fijo" && data.horario === "Rotativo" && data.docu === "Si"
            ? "vacante_itemgreen"
            : "vacante_itemred"
        );
  
        const infoContainer = document.createElement("div");
        infoContainer.classList.add("vacante_info");
  
        const campos = [
          { label: "Fecha", value: data.fecha_r ? new Date(data.fecha_r).toLocaleDateString() : "No disponible" },
          { label: "Nombre", value: nombre, isName: true },
          { label: "Puesto", value: data.puesto || "No disponible" },
          { label: "Número", value: data.numero || "No disponible" },
          { label: "Edad", value: data.edad || "No disponible" },
          { label: "Sexo", value: data.sexo || "No disponible" },
          { label: "Horario", value: data.horario || "No disponible" },
          { label: "Empleo", value: data.empleo || "No disponible" },
          { label: "Ciudad", value: data.ciudad || "No disponible" },
          { label: "Dirección", value: data.direccion || "No disponible" },
          { label: "CP", value: data.cp || "No disponible" },
          { label: "Transporte", value: data.transporte || "No disponible" },
          { label: "Cas/Sucu", value: data.casa_suc || "No disponible" },
          { label: "E/C", value: data.e_c || "No disponible" },
          { label: "Nacionalidad", value: data.nacion || "No disponible" },
          { label: "Peso", value: data.peso || "No disponible" },
          { label: "Altura", value: data.altura || "No disponible" },
          { label: "Docu", value: data.docu || "No disponible" },
        ];
  
        campos.forEach((campo) => {
          const span = document.createElement("span");
          if (campo.isName) span.classList.add("dbname");
          span.innerHTML = `<strong>${campo.label}:</strong> ${campo.value}`;
          infoContainer.appendChild(span);
        });
  
        // Botón para descargar el PDF
        const btnDescargarPDF = crearBoton("", "btn-descargar-pdf", () =>
          descargarPDF(nombre, data)
        );
  
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
  
        // Coloca el botón de descargar PDF antes de 'vacante_info'
        listItem.appendChild(btnDescargarPDF);
        listItem.appendChild(infoContainer);
        listItem.appendChild(btnContainer);
  
        if (esAsistieron) {
          ulGreen.appendChild(listItem);
        } else {
          data.empleo === "Fijo" && data.horario === "Rotativo" && data.docu === "Si"
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
  
  // Función para descargar el PDF con la información de la vacante
  function descargarPDF(nombre, data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Establecer color de fondo suave
    doc.setFillColor(245, 245, 245);  // Fondo gris claro
    doc.rect(0, 0, 210, 297, 'F'); // Fondo completo
    
    // Colores personalizados
    const colorTitulo = [23, 72, 145];  // Azul oscuro
    const colorEtiquetas = [60, 60, 60];  // Gris oscuro para etiquetas
    const colorValores = [0, 0, 0];  // Negro para los valores
    const colorLinea = [0, 0, 0]; // Línea separadora color negro
    
    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...colorTitulo); // Azul oscuro para el título
    doc.text("Información del Vacante", 20, 20);
    
    // Línea separadora
    doc.setDrawColor(...colorLinea);
    doc.line(20, 22, 190, 22);
    
    let yPosition = 30; // Comienza a escribir debajo del título
    
    // Estilo de los campos (etiquetas)
    doc.setFontSize(12);
    const campoStyle = { font: "helvetica", size: 12, weight: "normal", color: colorEtiquetas };
    
    // Estilo de los valores (información)
    const valueStyle = { font: "helvetica", size: 12, weight: "normal", color: colorValores };
    
    // Contenido de los datos con estilos
    const content = [
      { label: "Fecha de llenado", value: data.fecha_r ? new Date(data.fecha_r).toLocaleDateString() : "No disponible" },
      { label: "Nombre", value: nombre, isName: true },
      { label: "Puesto", value: data.puesto || "No disponible" },
      { label: "Número", value: data.numero || "No disponible" },
      { label: "Edad", value: data.edad || "No disponible" },
      { label: "Sexo", value: data.sexo || "No disponible" },
      { label: "Nacionalidad", value: data.nacion || "No disponible" },
      { label: "Estado Civil", value: data.e_c || "No disponible" },
      { label: "Peso", value: data.peso || "No disponible" },
      { label: "Altura", value: data.altura || "No disponible" },
      { label: "Documentacion", value: data.docu || "No disponible" },
      { label: "Horario", value: data.horario || "No disponible" },
      { label: "Empleo", value: data.empleo || "No disponible" },
      { label: "Ciudad", value: data.ciudad || "No disponible" },
      { label: "Dirección", value: data.direccion || "No disponible" },
      { label: "CP", value: data.cp || "No disponible" },
      { label: "Transporte", value: data.transporte || "No disponible" },
      { label: "Cas/Sucu", value: data.casa_suc || "No disponible" },
    ];
    
    // Recorrer el contenido e imprimirlo con estilo
    content.forEach((item, index) => {
      // Etiqueta
      doc.setFont(campoStyle.font, campoStyle.weight);
      doc.setFontSize(campoStyle.size);
      doc.setTextColor(...campoStyle.color);
      doc.text(`${item.label}:`, 20, yPosition);
    
      // Valor
      doc.setFont(valueStyle.font, valueStyle.weight);
      doc.setFontSize(valueStyle.size);
      doc.setTextColor(...valueStyle.color);
      doc.text(item.value, 80, yPosition);
    
      // Aumentar la posición Y para el siguiente campo
      yPosition += 12;
    });
    
    // Línea separadora al final
    doc.setDrawColor(...colorLinea);
    doc.line(20, yPosition + 10, 190, yPosition + 10);
    
    // Agregar pie de página
    yPosition += 20;
    doc.setFontSize(10);
    doc.setTextColor(...colorTitulo); // Azul oscuro para el pie de página
    doc.text("Generado por el reclutador Web de MMM.", 20, yPosition);
    
    // Descargar el PDF con el nombre del vacante
    doc.save(`Vacante_${nombre}.pdf`);
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

  // Función que devuelve una Promesa para buscar la referencia anterior
  function buscarAntiguaRef() {
    return new Promise((resolve, reject) => {
      let encontrada = false;

      // Iteramos sobre las bases de datos
      bases.forEach((base) => {
        const refActual = ref(database, `${base}/${nombre}`);
        onValue(
          refActual,
          (snapshot) => {
            if (snapshot.exists() && !encontrada) {
              encontrada = true; // Marcamos como encontrada
              resolve(refActual); // Resolvemos la Promesa con la referencia encontrada
            }
          },
          { onlyOnce: true }
        );
      });

      // Si no se encuentra ninguna referencia después de revisar todas las bases
      setTimeout(() => {
        if (!encontrada) {
          resolve(null); // Resolvemos con null si no se encontró ninguna referencia
        }
      }, 500); // Ajusta este tiempo según sea necesario
    });
  }

  // Verificar si el dato ya existe en el contenedor de destino
  function verificarExistenciaEnDestino() {
    return new Promise((resolve, reject) => {
      get(nuevaRef).then((snapshot) => {
        if (snapshot.exists()) {
          resolve(true); // El dato ya existe en el destino
        } else {
          resolve(false); // El dato no existe en el destino
        }
      });
    });
  }

  // Usamos la Promesa para determinar antiguaRef
  buscarAntiguaRef().then((refEncontrada) => {
    antiguaRef = refEncontrada;

    if (!antiguaRef) {
      console.error("No se pudo determinar la referencia anterior.");
      return;
    }

    // Verificamos si el dato ya existe en el contenedor de destino
    verificarExistenciaEnDestino().then((existeEnDestino) => {
      if (existeEnDestino) {
        // Mostrar alerta indicando que el dato ya está en el contenedor
        mostrarAlerta("alertas_admin");
        mostrarAlerta("alerta_9");
        console.log(`El dato ${nombre} ya existe en el contenedor ${nuevaDB}.`);
      } else {
        // Mover el dato si no existe en el destino
        set(nuevaRef, data)
          .then(() => {
            remove(antiguaRef)
              .then(() => {
                mostrarAlerta("alertas_admin");
                mostrarAlerta("alerta_6");
                console.log(`Vacante ${nombre} movida a ${nuevaDB}`);
              })
              .catch((error) => {
                console.error(
                  "Error al eliminar de la base de datos anterior:",
                  error
                );
              });
          })
          .catch((error) => {
            console.error("Error al mover a la nueva base:", error);
          });
      }
    });
  });
}

// Función para eliminar una vacante con confirmación
// Obtener referencias a los elementos
const overlay = document.getElementById("alert_eliminacion_vacante");
const mensajeElem = document.getElementById("message_eliminacion_vacante");
const btnConfirmar = document.getElementById("confirm_eli");
const btnCancelar = document.getElementById("cancel_eli");

// Función para mostrar la alerta personalizada
function mostrarAlertaPersonalizada(mensaje, callback) {
  mensajeElem.textContent = mensaje; // Cambiar el mensaje
  overlay.style.display = "flex"; // Mostrar alerta

  // Limpiar eventos previos para evitar duplicaciones
  btnConfirmar.onclick = () => {
    overlay.style.display = "none";
    callback(true);
  };

  btnCancelar.onclick = () => {
    overlay.style.display = "none";
    callback(false);
  };
}

// Función optimizada para eliminar vacantes
function eliminarVacante(nombre, base) {
  mostrarAlertaPersonalizada(`¿Estás seguro de eliminar al vacante "${nombre}"? 🧐`, (confirmado) => {
    if (!confirmado) {
      mostrarAlerta("alertas_admin");
      mostrarAlerta("alerta_8"); // Mostrar alerta de éxito
      return;
    }

    // Definir las rutas posibles
    const rutas = {
      asistieron: `asistieron/${nombre}`,
      no_asistieron: `no_asistieron/${nombre}`,
      contratado: `contratado/${nombre}`,
      default: `vacantes/${nombre}`,
    };

    // Obtener la ruta correcta
    const ruta = rutas[base] || rutas.default;

    console.log(`Intentando eliminar: ${ruta}`);

    // Referencia a la base de datos
    const refVacante = ref(database, ruta);

    // Eliminar la vacante
    remove(refVacante)
      .then(() => {
        console.log(`Vacante eliminada de ${ruta}`);
        mostrarAlerta("alertas_admin");
        mostrarAlerta("alerta_7"); // Mostrar alerta de éxito
      })
      .catch((error) => {
        console.error("Error al eliminar vacante:", error);
        mostrarAlerta("alertas_admin");
        mostrarAlerta("alerta_5"); // Mostrar alerta de error (debes definirla)
      });
  });
}

// Función para mostrar una notificación cuando hay un nuevo dato en data_green
function mostrarNotificacion(nombre) {
  if (Notification.permission === "granted") {
    new Notification("Nuevo vacante", { body: nombre });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("Nuevo vacante", { body: nombre });
      }
    });
  }
}

// Objeto/array original de data_green
let data_green = [];

// Crear un Proxy para detectar cambios en data_green
const dataGreenProxy = new Proxy(data_green, {
  set(target, prop, value) {
    target[prop] = value;

    // Si es una nueva entrada en el array y tiene un nombre
    if (!isNaN(prop) && value && value.nombre) {
      mostrarNotificacion(value.nombre);
    }

    return true;
  }
});


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
              add
                ? element.classList.add(className)
                : element.classList.remove(className);
            }
          });
        };

        toggleClass(
          [elements.home, elements.form, elements.login, elements.aside],
          "agregar_dis",
          false
        );
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

      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-email"
      ) {
        mostrarError(erroru); // Usuario incorrecto
      } else if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
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
logoutButton.addEventListener("click", function () {
  signOut(auth)
    .then(() => {
      // Acción después de cerrar sesión exitosamente
      console.log("Sesión cerrada con éxito.");
    })
    .catch((error) => {
      // Manejo de errores
      console.error("Error al cerrar sesión: ", error);
    });
});
