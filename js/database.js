// Importar Firebase Authentication
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import {
  database,
  ref,
  set,
  onValue,
  remove,
  app,
  get
} from "./firebase.js";
import { personalizarSelect } from "./main.js";

// Inicializar Firebase Auth
const auth = getAuth(app);

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
function verificarDisplay(idElemento, alertaSiOculto, alertaSiVisible) {
  const elemento = document.getElementById(idElemento);

  if (!elemento) {
    console.error(`❌ No se encontró el elemento con ID: ${idElemento}`);
    return;
  }

  const estilo = window.getComputedStyle(elemento);
  if (estilo.display === "none") {
    mostrarAlerta(alertaSiOculto);
  } else {
    mostrarAlerta(alertaSiVisible);
  }
}
// Escribir datos
function enviar_form() {
  // Obtener la fecha actual en UTC
  const fechaActual = new Date().toISOString().split("T")[0];

  // Asignar la fecha al input oculto
  document.getElementById("fecha_r").value = fechaActual;

  // Mostrar la fecha en la consola para verificar
  console.log("Fecha actual (UTC):", fechaActual);
  console.log("Valor de fecha_r:", document.getElementById("fecha_r").value);

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
  const e_c = document.getElementById("e_c").value;
  const sucursal = document.getElementById("sucursal").value;
  const problema_t = document.getElementById("problema_t").value;
  const f_n = document.getElementById("f_n").value;

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
    !problema_t ||
    !f_n ||
    !sucursal
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
    problema_t,
    f_n,
    sucursal,
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
}
const label_btnEnviar = document.getElementById("label_enviar");
label_btnEnviar.addEventListener("click", enviar_form);
// Asigna la función al objeto global 'window'
window.enviar_form = enviar_form;
function getContainer(id) {
  const container = document.getElementById(id);
  return container ? container : null;
}

// Leer datos
function mostrarDatos() {
  const dataGreen = document.getElementById("data_green");
  const dataRed = document.getElementById("data_red");
  const dataCitas = document.getElementById("data_citas");
  const dataCitasManager = document.getElementById("data_citas_manager");
  const dataCitasnoAsistieron = document.getElementById("data_cita_no_asistieron");
  const dataCitasAsistieron = document.getElementById("data_cita_asistieron");
  const dataNosistieron = document.getElementById("data_no_asistieron");
  const dataAsistieron = document.getElementById("data_asistieron");
  const dataContratado = document.getElementById("data_contratado");
  const vacantesRef = ref(database, "vacantes/");
  const citasVacantesRef = ref(database, "citas_vacantes/");
  const asistieronRef = ref(database, "asistieron/");
  const no_asistieronRef = ref(database, "no_asistieron/");
  const contratadoRef = ref(database, "contratado/");
  let vacantesPrevias = new Set();

  // Mostrar vacantes generales (Fijas y Temporales)
  onValue(vacantesRef, (snapshot) => {
    renderizarVacantes(snapshot, dataGreen, dataRed);
  });

  // Mostrar vacantes en "Vacantes_citas_manager"
  onValue(citasVacantesRef, (snapshot) => {
      renderizarVacantes(snapshot, dataCitas, null, true);
    });

  // Mostrar vacantes en "Vacantes_citas_manager"
  onValue(citasVacantesRef, (snapshot) => {
    renderizarVacantes(snapshot, dataCitasManager, null, true);
  });

  // Mostrar vacantes en "Asistieron"
  onValue(asistieronRef, (snapshot) => {
    renderizarVacantes(snapshot, dataAsistieron, null, true);
  });

  // Mostrar vacantes en "Manager_Asistieron"
  onValue(asistieronRef, (snapshot) => {
    renderizarVacantes(snapshot, dataCitasAsistieron, null, true);
  });

  // Mostrar vacantes en "Nosistieron"
  onValue(no_asistieronRef, (snapshot) => {
    renderizarVacantes(snapshot, dataCitasnoAsistieron, null, true);
  });

  // Mostrar vacantes en "Manager_Nosistieron"
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
    const sucursalActual = sessionStorage.getItem("sucursal"); //Obtener la sucursal en sesión

    containerGreen.innerHTML = "";
    if (containerRed) containerRed.innerHTML = "";

    let vacantesActuales = new Set();

    if (snapshot.exists()) {
      const ulGreen = document.createElement("ul");
      const ulRed = document.createElement("ul");

      snapshot.forEach((childSnapshot) => {
        const nombre = childSnapshot.key;
        const data = childSnapshot.val() || {};

        // 📌 Si el contenedor es data_citas, filtramos por sucursal
        if (
          containerGreen.id === "data_citas_manager" ||
          containerGreen.id === "data_cita_no_asistieron" ||
          containerGreen.id === "data_cita_asistieron"
        ) {
          if (!sucursalActual || data.sucursal_cita !== sucursalActual) {
            return; // 🚀 Si la sucursal no coincide, no lo mostramos
          }
        }

        vacantesActuales.add(nombre);

        const listItem = document.createElement("button");
        // Asignar clase basada en el ID del contenedor
        let claseItem = "vacante_item"; // Clase base común

        if (containerGreen.id === "data_citas") {
          claseItem += "_citas";
        } else if (containerGreen.id === "data_citas_manager") {
          claseItem += "_citasManager";
        } else if (containerGreen.id === "data_cita_no_asistieron") {
          claseItem += "_citasManagerNoasistio";
        } else if (containerGreen.id === "data_cita_asistieron") {
          claseItem += "_citasManagerAsistio";
        } else if (containerGreen.id === "data_asistieron") {
          claseItem += "_asistieron";
        } else if (containerGreen.id === "data_no_asistieron") {
          claseItem += "_noasistieron";
        } else if (containerGreen.id === "data_contratado") {
          claseItem += "_contratado";
        } else {
          // Clase por defecto si no coincide con ningún ID específico
          claseItem += esAsistieron
            ? "_status"
            : data.empleo === "Fijo" &&
              data.horario === "Rotativo" &&
              data.docu === "Si" &&
              data.problema_t == "No"
            ? "_green"
            : "_red";
        }

        listItem.classList.add(claseItem);
        const infoContainer = document.createElement("div");
        infoContainer.classList.add("vacante_info");

        const campos =
          containerGreen.id === "data_citas" ||
          containerGreen.id === "data_citas_manager" ||
          containerGreen.id === "data_cita_no_asistieron" ||
          containerGreen.id === "data_cita_asistieron"
            ? [
                { label: "Nombre", value: nombre, isName: true },
                {
                  label: "Fecha Cita",
                  value: data.fecha_cita || "No disponible",
                },
                {
                  label: "Hora Cita",
                  value: data.hora_cita || "No disponible",
                },
                {
                  label: "Sucursal Cita",
                  value: data.sucursal_cita || "No disponible",
                },
                { label: "Puesto", value: data.puesto || "No disponible" },
                { label: "Número", value: data.numero || "No disponible" },
              ]
            : [
                {
                  label: "Fecha",
                  value: data.fecha_r
                    ? new Date(data.fecha_r).toLocaleDateString()
                    : "No disponible",
                },
                { label: "Nombre", value: nombre, isName: true },
                { label: "Puesto", value: data.puesto || "No disponible" },
                { label: "Sucursal", value: data.sucursal || "No disponible" },
                { label: "Número", value: data.numero || "No disponible" },
                { label: "Edad", value: data.edad || "No disponible" },
                { label: "F.Nacimiento", value: data.f_n || "No disponible" },
                { label: "Sexo", value: data.sexo || "No disponible" },
                {
                  label: "Nacionalidad",
                  value: data.nacion || "No disponible",
                },
                { label: "Estado Civil", value: data.e_c || "No disponible" },
                { label: "Documentacion", value: data.docu || "No disponible" },
                { label: "Horario", value: data.horario || "No disponible" },
                { label: "Empleo", value: data.empleo || "No disponible" },
                { label: "Ciudad", value: data.ciudad || "No disponible" },
                {
                  label: "Dirección",
                  value: data.direccion || "No disponible",
                },
                { label: "CP", value: data.cp || "No disponible" },
                {
                  label: "Transporte",
                  value: data.transporte || "No disponible",
                },
                { label: "Cas/Sucu", value: data.casa_suc || "No disponible" },
                {
                  label: "Problema/T",
                  value: data.problema_t || "No disponible",
                },
              ];

        campos.forEach((campo) => {
          const span = document.createElement("span");
          if (campo.isName) span.classList.add("dbname");
          span.innerHTML = `<strong>${campo.label}:</strong> ${campo.value}`;
          infoContainer.appendChild(span);
        });

        // 📌 Botón para descargar el PDF
        const btnContainer2 = document.createElement("div");
        btnContainer2.classList.add("btn_container2");

        const btnDescargarPDF = crearBoton("", "btn-descargar-pdf", () =>
          descargarPDF(nombre, data)
        );
        const btnAgendarCita = crearBoton("", "btn-agendar-cita", () =>
          abrirModalCita(nombre, data)
        );

        btnContainer2.append(btnDescargarPDF, btnAgendarCita);

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
        listItem.appendChild(btnContainer2);
        listItem.appendChild(infoContainer);
        listItem.appendChild(btnContainer);

        if (esAsistieron) {
          ulGreen.appendChild(listItem);
        } else {
          data.empleo === "Fijo" &&
          data.horario === "Rotativo" &&
          data.docu === "Si" &&
          data.problema_t == "No"
            ? ulGreen.appendChild(listItem)
            : ulRed.appendChild(listItem);
        }
      });

      fragmentGreen.appendChild(ulGreen);
      if (containerRed) fragmentRed.appendChild(ulRed);

      containerGreen.appendChild(fragmentGreen);
      if (containerRed) containerRed.appendChild(fragmentRed);
    } else {
      containerGreen.innerHTML = "<div class='no_data'></div>";
      if (containerRed) containerRed.innerHTML = "<div class='no_data'></div>";
    }

    vacantesPrevias = vacantesActuales;
  }

  // Función para descargar el PDF con la información de la vacante
  function descargarPDF(nombre, data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Establecer color de fondo suave
    doc.setFillColor(245, 245, 245); // Fondo gris claro
    doc.rect(0, 0, 210, 297, "F"); // Fondo completo

    // Colores personalizados
    const colorTitulo = [23, 72, 145]; // Azul oscuro
    const colorEtiquetas = [60, 60, 60]; // Gris oscuro para etiquetas
    const colorValores = [0, 0, 0]; // Negro para los valores
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
    const campoStyle = {
      font: "helvetica",
      size: 12,
      weight: "normal",
      color: colorEtiquetas,
    };

    // Estilo de los valores (información)
    const valueStyle = {
      font: "helvetica",
      size: 12,
      weight: "normal",
      color: colorValores,
    };

    // Contenido de los datos con estilos
    const content = [
      {
        label: "Fecha de llenado",
        value: data.fecha_r
          ? new Date(data.fecha_r).toLocaleDateString()
          : "No disponible",
      },
      { label: "Nombre", value: nombre, isName: true },
      { label: "Puesto", value: data.puesto || "No disponible" },
      { label: "Sucursal", value: data.sucursal || "No disponible" },
      { label: "Número", value: data.numero || "No disponible" },
      { label: "Edad", value: data.edad || "No disponible" },
      { label: "F.Nacimiento", value: data.f_n || "No disponible" },
      { label: "Sexo", value: data.sexo || "No disponible" },
      { label: "Nacionalidad", value: data.nacion || "No disponible" },
      { label: "Estado Civil", value: data.e_c || "No disponible" },
      { label: "Documentacion", value: data.docu || "No disponible" },
      { label: "Horario", value: data.horario || "No disponible" },
      { label: "Empleo", value: data.empleo || "No disponible" },
      { label: "Ciudad", value: data.ciudad || "No disponible" },
      { label: "Dirección", value: data.direccion || "No disponible" },
      { label: "CP", value: data.cp || "No disponible" },
      { label: "Transporte", value: data.transporte || "No disponible" },
      { label: "Cas/Sucu", value: data.casa_suc || "No disponible" },
      { label: "Problema/T", value: data.problema_t || "No disponible" },
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
    mostrarAlerta("alertas");
    verificarDisplay("pag5", "alerta_13", "alerta_18");
  }
  function abrirModalCita(nombre, data) {
    const modalContainer = document.getElementById("modal-container");
    const formAgendarCita = document.getElementById("form_agendar_cita");

    if (!modalContainer || !formAgendarCita) {
      console.error("❌ No se encontró el modal o el formulario.");
      return;
    }

    // Mostrar el modal
    modalContainer.style.display = "flex";

    // Limpiar eventos previos
    formAgendarCita.onsubmit = async (e) => {
      e.preventDefault();

      // Obtener valores del formulario
      const fechaCita = document.getElementById("fecha_cita").value;
      const horaCita = document.getElementById("hora_cita").value;
      const sucursalCita = document.getElementById("sucursal_cita").value;

      if (!fechaCita || !horaCita || !sucursalCita) {
        mostrarAlerta("alertas");
        mostrarAlerta("alerta_10"); // Mensaje de "Llena los campos"
        return;
      }

      // Guardar los datos en la base de datos
      const citasRef = ref(database, `citas_vacantes/${nombre}`);
      const nuevaCita = {
        ...data,
        fecha_cita: fechaCita,
        hora_cita: horaCita,
        sucursal_cita: sucursalCita,
      };

      try {
        await set(citasRef, nuevaCita);

        // Mover la vacante al apartado "citas_vacantes"
        const bases = ["vacantes", "asistieron", "no_asistieron", "contratado"];
        let antiguaRef = null;

        for (const base of bases) {
          const refActual = ref(database, `${base}/${nombre}`);
          const snapshot = await get(refActual);
          if (snapshot.exists()) {
            antiguaRef = refActual;
            break;
          }
        }

        if (antiguaRef) {
          await remove(antiguaRef);
        }

        console.log(`✅ Vacante ${nombre} movida a citas_vacantes.`);

        // Enviar mensaje de WhatsApp
        const numero = data.numero.replace(/\D/g, ""); // Formatear el número
        enviarMensajeWhatsApp(
          numero,
          nombre,
          fechaCita,
          horaCita,
          sucursalCita
        );

        mostrarAlerta("alertas");
        mostrarAlerta("alerta_12"); // Éxito
      } catch (error) {
        console.error("❌ Error al guardar la cita:", error);
        mostrarAlerta("alertas");
        mostrarAlerta("alerta_11"); // Error
      }

      // Cerrar el modal
      modalContainer.style.display = "none";
    };

    // Botón de cancelar
    document.getElementById("cancelar_cita").onclick = () => {
      modalContainer.style.display = "none";
      mostrarAlerta("alertas");
      mostrarAlerta("alerta_13"); // Cancelado
    };
  }
  function enviarMensajeWhatsApp(numero, nombre, fecha, hora, sucursal) {
    const mensaje = `Hola, ${nombre}. Tu cita ha sido agendada para el ${fecha} a las ${hora} en la sucursal ${sucursal}.`;
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  }
  // Mostrar sucursales disponibles con checkboxes
  mostrarSucursalesDisponibles();
}

function mostrarMensajesUsuarios() {
  console.log("Ejecutando mostrarMensajesUsuarios...");

  const dataMjUser = document.getElementById("data_mj_user");
  const filterInput = document.getElementById("user-filter");
  if (!dataMjUser) {
    console.error("Elemento 'data_mj_user' no encontrado en el DOM.");
    return;
  }
  if (!filterInput) {
    console.error("Elemento 'user-filter' no encontrado en el DOM.");
    return;
  }

  dataMjUser.innerHTML = "<p>Cargando mensajes...</p>";

  const chatMessagesRef = ref(database, "chatMessages");

  // Función para renderizar mensajes con filtro
  function renderMessages(snapshot, filterText = "") {
    dataMjUser.innerHTML = ""; // Limpiar contenedor de mensajes

    if (!snapshot.exists()) {
      dataMjUser.innerHTML = "<div class='no_data'></div>";
      return;
    }

    const userList = document.createElement("ul");

    snapshot.forEach((userSnapshot) => {
      const userName = userSnapshot.key;
      const userMessages = userSnapshot.val();

      // Filtrar por similitud con el texto ingresado
      if (
        !filterText ||
        userName.toLowerCase().includes(filterText.toLowerCase())
      ) {
        if (!userMessages) return;

        const userDiv = document.createElement("div");
        userDiv.classList.add("user-div");
        userDiv.textContent = userName;

        const messagesDiv = document.createElement("div");
        messagesDiv.classList.add("user-messages");

        Object.values(userMessages).forEach((session) => {
          if (!session.messages) return;

          Object.values(session.messages).forEach((msg) => {
            if (!msg.message || !msg.sender) return;

            const msgDiv = document.createElement("div");
            msgDiv.classList.add("message");

            const fecha = msg.timestamp
              ? new Date(msg.timestamp).toLocaleString()
              : "Sin fecha";

            msgDiv.innerHTML = `
              <span><strong>${msg.sender}:</strong> <p>${msg.message}</p><time>${fecha}</time></span>
            `;

            messagesDiv.appendChild(msgDiv);
          });
        });

        const userItem = document.createElement("button");
        userItem.appendChild(userDiv);
        userItem.appendChild(messagesDiv);

        userList.appendChild(userItem);
      }
    });

    if (userList.childElementCount === 0) {
      dataMjUser.innerHTML = "<div class='no_data'></div>";
    } else {
      dataMjUser.appendChild(userList);
    }
  }

  // Cargar mensajes iniciales
  onValue(chatMessagesRef, (snapshot) => {
    console.log("Datos recibidos desde Firebase:", snapshot.val());
    renderMessages(snapshot);
  }, (error) => {
    console.error("Error al leer de Firebase:", error);
    dataMjUser.innerHTML = "<div class='error'>Error al cargar mensajes</div>";
  });

  // Filtrar mensajes en tiempo real
  filterInput.addEventListener("input", (e) => {
    const filterText = e.target.value.trim();
    onValue(chatMessagesRef, (snapshot) => {
      renderMessages(snapshot, filterText);
    });
  });
}
// Función para mostrar sucursales disponibles en data_sucu_user con checkboxes
function mostrarSucursalesDisponibles() {
  const dataSucuUser = document.getElementById("data_sucu_user");
  const filterInput = document.getElementById("sucu_filter"); // Referencia al input de filtro

  if (!dataSucuUser) {
    console.error("Elemento 'data_sucu_user' no encontrado en el DOM.");
    return;
  }

  if (!filterInput) {
    console.error("Elemento 'sucu_filter' no encontrado en el DOM.");
    return;
  }

  dataSucuUser.innerHTML = "<p>Cargando sucursales...</p>";

  const disSucuRef = ref(database, "disSucu");

  // Función para renderizar las sucursales con filtro
  function renderizarSucursales(sucursales, filtro = '') {
    dataSucuUser.innerHTML = "";
    
    if (!sucursales) {
      dataSucuUser.innerHTML = "<div class='no_data'>No hay sucursales disponibles</div>";
      return;
    }

    const fragment = document.createDocumentFragment();
    const ul = document.createElement("ul");
    ul.classList.add("sucursal_list");

    Object.entries(sucursales)
      .filter(([nombre]) => nombre.toLowerCase().includes(filtro.toLowerCase()))
      .forEach(([nombre, disponible]) => {
        const li = document.createElement("li");
        li.classList.add("sucursal_item");

        const sucursalDiv = document.createElement("div");
        sucursalDiv.classList.add("sucursal_info");
        sucursalDiv.innerHTML = `<strong>${nombre}</strong>`;

        const checkboxId = `checkbox-${nombre}`;
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = checkboxId;
        checkbox.checked = disponible;
        checkbox.classList.add("sucursal_checkbox");

        const label = document.createElement("label");
        label.htmlFor = checkboxId;
        label.classList.add("sucursal_label");

        checkbox.addEventListener("change", () => {
          const nuevoEstado = checkbox.checked;
          const sucursalRef = ref(database, `disSucu/${nombre}`);

          set(sucursalRef, nuevoEstado)
            .then(() => {
              console.log(`Estado de ${nombre} actualizado a ${nuevoEstado}`);
              mostrarAlerta("alertas");
              mostrarAlerta("alerta_20");
            })
            .catch((error) => {
              console.error("Error al actualizar estado:", error);
              mostrarAlerta("alertas");
              mostrarAlerta("alerta_21");
            });
        });

        const checkboxContainer = document.createElement("div");
        checkboxContainer.classList.add("checkbox_container");
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);

        li.appendChild(sucursalDiv);
        li.appendChild(checkboxContainer);
        ul.appendChild(li);
      });

    fragment.appendChild(ul);
    dataSucuUser.appendChild(fragment);
  }

  // Cargar datos iniciales y agregar el filtro en tiempo real
  get(disSucuRef)
    .then((snapshot) => {
      const sucursales = snapshot.val();
      renderizarSucursales(sucursales); // Renderizado inicial

      // Escuchar cambios en el input de filtro
      filterInput.addEventListener('input', (e) => {
        renderizarSucursales(sucursales, e.target.value);
      });
    })
    .catch((error) => {
      console.error("Error al leer de Firebase:", error);
      dataSucuUser.innerHTML = "<div class='error'>Error al cargar sucursales</div>";
    });
}

// Función para cargar y personalizar sucursales disponibles desde Firebase
function cargarSucursalesDisponibles() {
  const sucursalSelect = document.getElementById("sucursal");
  if (!sucursalSelect) {
    console.error("❌ No se encontró el select de sucursales.");
    return;
  }

  const disSucuRef = ref(database, "disSucu");

  // ✅ 1. Eliminar cualquier personalización previa para evitar duplicados
  const existingCustomSelect = sucursalSelect.parentNode.querySelector(".custom-select");
  if (existingCustomSelect) {
    existingCustomSelect.remove();
  }

  sucursalSelect.style.display = ""; // Asegurar visibilidad antes de personalizar

  onValue(disSucuRef, (snapshot) => {
    if (snapshot.exists()) {
      const sucursales = snapshot.val();
      console.log("🔹 Sucursales obtenidas de Firebase:", sucursales);

      // ✅ 2. Limpiar opciones dinámicas y agregar un placeholder
      sucursalSelect.innerHTML = '<option value="" disabled selected>Sucursal</option>';

      // ✅ 3. Agregar las sucursales disponibles
      Object.entries(sucursales).forEach(([nombre, disponible]) => {
        if (disponible) {
          const option = document.createElement("option");
          option.value = nombre;
          option.textContent = nombre;
          sucursalSelect.appendChild(option);
        }
      });

      // ✅ 4. Aplicar personalización después de que el select tenga opciones
      setTimeout(() => {
        personalizarSelect(sucursalSelect);
      }, 50);
    } else {
      console.warn("⚠️ No se encontraron sucursales en Firebase.");
      sucursalSelect.innerHTML = '<option value="" disabled selected>No hay sucursales disponibles</option>';
    }
  });

  // ✅ 5. Observar cambios en las opciones del select
  const observer = new MutationObserver(() => {
    personalizarSelect(sucursalSelect);
  });

  observer.observe(sucursalSelect, { childList: true });
}

// 📌 Función para crear botones dinámicamente
function crearBoton(texto, clase, onClick) {
  const btn = document.createElement("button");
  btn.classList.add(clase);
  btn.textContent = texto;
  btn.onclick = onClick;
  return btn;
}

function moverVacante(nombre, data, nuevaDB) {
  console.log(`🔄 Moviendo vacante "${nombre}" a ${nuevaDB}...`);

  const nuevaRef = ref(database, `${nuevaDB}/${nombre}`);
  const bases = [
    "vacantes",
    "asistieron",
    "no_asistieron",
    "contratado",
    "citas_vacantes",
  ]; // Agregamos citas_vacantes
  let antiguaRef = null;

  // Buscar la referencia anterior en la base de datos
  Promise.all(
    bases.map((base) =>
      get(ref(database, `${base}/${nombre}`)).then((snapshot) => {
        if (snapshot.exists()) {
          antiguaRef = ref(database, `${base}/${nombre}`);
        }
      })
    )
  ).then(() => {
    if (!antiguaRef) {
      console.error(`❌ No se encontró la referencia anterior de "${nombre}".`);
      mostrarAlerta("alertas");
      verificarDisplay("pag5", "alerta_5", "alerta_16");
      return;
    }

    // Mover el dato si no existe en el destino
    get(nuevaRef).then((snapshot) => {
      if (snapshot.exists()) {
        console.warn(`⚠️ El vacante "${nombre}" ya está en ${nuevaDB}.`);
        mostrarAlerta("alertas");
        verificarDisplay("pag5", "alerta_9", "alerta_15");
      } else {
        set(nuevaRef, data)
          .then(() => remove(antiguaRef))
          .then(() => {
            console.log(`✅ Vacante "${nombre}" movida a ${nuevaDB}`);
            mostrarAlerta("alertas");
            verificarDisplay("pag5", "alerta_6", "alerta_15");
            mostrarDatos();
          })
          .catch((error) => console.error("❌ Error al mover vacante:", error));
      }
    });
  });
}

// Función para eliminar una vacante con confirmación
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
  mostrarAlertaPersonalizada(
    `¿Estás seguro de eliminar al vacante "${nombre}"? 🧐`,
    (confirmado) => {
      if (!confirmado) {
        mostrarAlerta("alertas");
        mostrarAlerta("alerta_8"); // Mostrar alerta de éxito
        return;
      }

      // Definir las rutas posibles
      const rutas = {
        asistieron: `asistieron/${nombre}`,
        no_asistieron: `no_asistieron/${nombre}`,
        contratado: `contratado/${nombre}`,
        data_citas: `data_citas/${nombre}`,
        datamjUser: `chatMessages/${nombre}`,
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
          mostrarAlerta("alertas");
          mostrarAlerta("alerta_7"); // Mostrar alerta de éxito
        })
        .catch((error) => {
          console.error("Error al eliminar vacante:", error);
          mostrarAlerta("alertas");
          mostrarAlerta("alerta_5"); // Mostrar alerta de error (debes definirla)
        });
    }
  );
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
  },
});

// Pedir permiso de notificaciones al cargar la página
if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Función modular para manejar Enter y Click
const asignarEventos = (tipo) => {
  const isManager = tipo === "manager";
  const form = isManager
    ? document.getElementById("form_log_manager")
    : document.getElementById("form_log");
  const btn = isManager
    ? document.getElementById("btn_log_manager")
    : document.getElementById("btn_log_admin");

  form.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      btn.click(); // Ejecuta el evento de click del botón correspondiente
    }
  });

  btn.addEventListener("click", () => iniciarSesion(tipo));
};

const iniciarSesion = (tipo) => {
  const isManager = tipo === "manager";
  const login = isManager
    ? document.getElementById("Logincont_sucu")
    : document.getElementById("Logincont");
  const form = isManager
    ? document.getElementById("form_log_manager")
    : document.getElementById("form_log");
  const userInput = isManager
    ? document.getElementById("user_sucu").value.trim().toLowerCase()
    : document.getElementById("user").value.trim().toLowerCase();
  const passInput = isManager
    ? document.getElementById("pass_sucu").value.trim()
    : document.getElementById("pass").value.trim();
  const email = userInput + "@gmail.com";
  const erroru = isManager
    ? document.getElementById("erroru_sucu")
    : document.getElementById("erroru");
  const errorp = isManager
    ? document.getElementById("errorp_sucu")
    : document.getElementById("errorp");
  const errorall = isManager
    ? document.getElementById("errorall_sucu")
    : document.getElementById("errorall");

  const mostrarError = (errorElement) => {
    setTimeout(() => {
      form.classList.remove("activolog");
      errorElement.classList.add("activolog");
    }, 200);
    form.classList.add("animacionform");
  };

  if (!userInput || !passInput) {
    mostrarAlerta("alertas");
    mostrarAlerta("alerta_1");
    return;
  }

  signInWithEmailAndPassword(auth, email, passInput)
    .then(() => {
      if (isManager) {
        if (
            userInput !== "playas" && 
            userInput !== "altamira" && 
            userInput !== "libertad" && 
            userInput !== "sierra" && 
            userInput !== "cacho" && 
            userInput !== "hipodromo" && 
            userInput !== "santafe" && 
            userInput !== "villafontana" && 
            userInput !== "huertas" && 
            userInput !== "monarca" && 
            userInput !== "otay" && 
            userInput !== "rosarito" && 
            userInput !== "florido" && 
            userInput !== "tecate" && 
            userInput !== "sanysidro"
        ) {
            sessionStorage.removeItem("sucursal");
            mostrarError(erroru);
            return;
        }
        sessionStorage.setItem("sucursal", userInput);
    } else {
        if (
            userInput === "playas" || 
            userInput === "altamira" || 
            userInput === "libertad" || 
            userInput === "sierra" || 
            userInput === "cacho" || 
            userInput === "hipodromo" || 
            userInput === "santafe" || 
            userInput === "villafontana" || 
            userInput === "huertas" || 
            userInput === "monarca" || 
            userInput === "otay" || 
            userInput === "rosarito" || 
            userInput === "florido" || 
            userInput === "tecate" || 
            userInput === "sanysidro"
        ) {
            mostrarError(erroru);
            return;
        }
    }
      //Mostrar dependido el login
      if (isManager) {
        // Si es sucursal, continuar con la animación y redireccionamiento
        setTimeout(() => {
          const elements = {
            home: document.getElementById("home"),
            header: document.getElementById("header"),
            form: document.getElementById("pag1"),
            login: document.getElementById("pag2"),
            admin: document.getElementById("pag3"),
            login_manager: document.getElementById("pag4"),
            manager: document.getElementById("pag5"),
            aside: document.getElementById("aside"),
            chatbot: document.getElementById("chatbot"),
            pavo_cont: document.getElementById("pavo_cont"),
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
            [
              elements.home,
              elements.form,
              elements.login,
              elements.aside,
              elements.login_manager,
              elements.admin,
            ],
            "agregar_dis",
            false
          );
          toggleClass([elements.manager], "agregar_dis", true);
          toggleClass([elements.header], "cambiar_nav", false);

          elements.header.style.display = "none";
          elements.pavo_cont.style.display = "none";
          if (elements.chatbot) elements.chatbot.style.display = "none";

          mostrarAlerta("alertas");
          mostrarAlerta("alerta_14");
        }, 1000);

        // Añadir animación de salida
        login.classList.add("animacionlog");

        mostrarDatos();
        mostrarMensajesUsuarios()
      } else {
        // Si es sucursal, continuar con la animación y redireccionamiento
        setTimeout(() => {
          const elements = {
            home: document.getElementById("home"),
            header: document.getElementById("header"),
            form: document.getElementById("pag1"),
            login: document.getElementById("pag2"),
            admin: document.getElementById("pag3"),
            login_manager: document.getElementById("pag4"),
            manager: document.getElementById("pag5"),
            aside: document.getElementById("aside"),
            chatbot: document.getElementById("chatbot"),
            pavo_cont: document.getElementById("pavo_cont"),
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
            [
              elements.home,
              elements.form,
              elements.login,
              elements.aside,
              elements.login_manager,
              elements.manager,
            ],
            "agregar_dis",
            false
          );
          toggleClass([elements.admin], "agregar_dis", true);
          toggleClass([elements.header], "cambiar_nav", false);

          elements.header.style.display = "none";
          elements.pavo_cont.style.display = "none";
          if (elements.chatbot) elements.chatbot.style.display = "none";

          mostrarAlerta("alertas");
          mostrarAlerta("alerta_4");
        }, 1000);

        // Añadir animación de salida
        login.classList.add("animacionlog");

        mostrarDatos();
        mostrarMensajesUsuarios()
      }
    })
    .catch((error) => {
      console.log("Código de error:", error.code);

      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-email"
      ) {
        mostrarError(erroru);
      } else if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        mostrarError(errorp);
      } else {
        mostrarError(errorall);
      }
    });
};

// Función para cerrar sesión
const logoutButtons = document.querySelectorAll(
  "#logoutButton, #logoutButton2"
);
// Itera sobre los elementos y agrega el evento a cada uno
logoutButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await signOut(auth);
      console.log("Sesión cerrada con éxito.");
      window.location.reload();
    } catch (error) {
      console.error("Error al cerrar sesión:", error.message);
      alert("No se pudo cerrar sesión. Por favor, intenta de nuevo.");
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  // Asignar eventos a ambos formularios
  asignarEventos("admin");
  asignarEventos("manager");
  cargarSucursalesDisponibles();
});
