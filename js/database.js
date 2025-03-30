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
import { personalizarSelect, toggleView, elements, isStandalone } from "./main.js";

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
  console.log("Iniciando envío del formulario...");

  const fechaActual = new Date().toISOString().split("T")[0];
  document.getElementById("fecha_r").value = fechaActual;

  // Obtener valores del formulario
  const nombre = document.getElementById("nombre").value.trim();
  const puesto = document.getElementById("puesto").value;
  const horario = document.getElementById("horario").value;
  const numero = document.getElementById("numero").value.trim();
  const fecha_r = document.getElementById("fecha_r").value;
  const edad = parseInt(document.getElementById("edad").value, 10);
  const direccion = document.getElementById("direccion").value.trim();
  const ciudad = document.getElementById("ciudad").value.trim();
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

  console.log("Valores obtenidos del formulario:", {
    nombre, puesto, horario, numero, fecha_r, edad, direccion, ciudad, cp, docu,
    casa_suc, transporte, empleo, sexo, nacion, e_c, sucursal, problema_t, f_n
  });

  // Array para acumular errores
  const errores = [];

  // Función para validar y acumular errores
  const validarCampo = (condicion, mensaje) => {
    if (condicion) {
      console.log(`Validación fallida: ${mensaje}`);
      errores.push(mensaje);
    }
  };

  // Ejecutar todas las validaciones
  validarCampo(!nombre, "El nombre está vacío");
  validarCampo(!puesto, "El puesto está vacío");
  validarCampo(!numero.match(/^\+?[0-9]{10,15}$/), "El número debe tener entre 10 y 15 dígitos, opcionalmente con + al inicio");
  validarCampo(!fecha_r.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/), "Fecha inválida");
  validarCampo(edad < 18 || edad > 100 || isNaN(edad), "Edad debe estar entre 18 y 100");
  validarCampo(!cp.match(/^[0-9]{5}$/), "Código postal debe tener 5 dígitos");
  validarCampo(!direccion, "La dirección está vacía");
  validarCampo(!ciudad, "La ciudad está vacía");
  validarCampo(!casa_suc, "Casa/Sucursal está vacío");
  validarCampo(!transporte, "Transporte está vacío");
  validarCampo(!e_c, "Estado civil está vacío");
  validarCampo(!docu, "Documentación está vacía");
  validarCampo(!empleo, "Empleo está vacío");
  validarCampo(!horario, "Horario está vacío");
  validarCampo(!sexo, "Sexo está vacío");
  validarCampo(!nacion, "Nacionalidad está vacía");
  validarCampo(!problema_t, "Problema/T está vacío");
  validarCampo(!f_n, "Fecha de nacimiento está vacía");
  validarCampo(!sucursal, "Sucursal está vacía");

  // Verificar si hay errores
  if (errores.length > 0) {
    console.log("Errores encontrados:", errores);
    mostrarAlerta("alertas");
    mostrarAlerta("alerta_1"); // Mostrar alerta de campos incompletos
    return; // Detener el envío
  }

  // Si no hay errores, preparar y enviar los datos
  const formData = {
    nombre, puesto, numero, fecha_r, edad, direccion, ciudad, cp, e_c, docu,
    casa_suc, transporte, empleo, horario, sexo, nacion, problema_t, f_n, sucursal
  };

  console.log("Datos preparados para enviar a Firebase:", formData);

  const timestamp = Date.now();
  const uniqueKey = `${nombre}_${timestamp}`;

  set(ref(database, `vacantes/${uniqueKey}`), formData)
    .then(() => {
      console.log(`Formulario enviado exitosamente con clave: ${uniqueKey}`);
      mostrarAlerta("alertas");
      mostrarAlerta("alerta_2"); // Éxito
      document.getElementById("myForm").reset();
    })
    .catch((error) => {
      console.error("Error al enviar formulario:", error.message);
      mostrarAlerta("alertas");
      mostrarAlerta("alerta_3"); // Error
    });
}

const label_btnEnviar = document.getElementById("label_enviar");
if (!label_btnEnviar) {
  console.error("El elemento con ID 'label_enviar' no se encontró en el DOM.");
} else {
  label_btnEnviar.addEventListener("click", () => {
    console.log("Botón clicado, ejecutando enviar_form...");
    enviar_form();
  });
}
window.enviar_form = enviar_form;
function getContainer(id) {
  const container = document.getElementById(id);
  return container ? container : null;
}

// Leer datos
function mostrarDatos() {
  const auth = getAuth(app);
  if (!auth.currentUser) {
    console.log("Usuario no autenticado, no se pueden mostrar datos.");
    document.getElementById("data_green").innerHTML = "<p>Necesitas iniciar sesión para ver los datos.</p>";
    document.getElementById("data_red").innerHTML = "<p>Necesitas iniciar sesión para ver los datos.</p>";
    return;
  }

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

  function renderizarVacantes(snapshot, containerGreen, containerRed, esAsistieron = false) {
    const fragmentGreen = document.createDocumentFragment();
    const fragmentRed = document.createDocumentFragment();
    const sucursalActual = localStorage.getItem("sucursal"); // Cambiado a localStorage
    const isManagerLoggedIn = localStorage.getItem("isManagerLoggedIn") === "true";
  
    console.log("Sucursal actual:", sucursalActual); // Depuración
    console.log("Es manager:", isManagerLoggedIn); // Depuración
    console.log("Contenedor:", containerGreen.id); // Depuración
  
    containerGreen.innerHTML = "";
    if (containerRed) containerRed.innerHTML = "";
  
    let vacantesActuales = new Set();
  
    if (snapshot.exists()) {
      const ulGreen = document.createElement("ul");
      const ulRed = document.createElement("ul");
  
      snapshot.forEach((childSnapshot) => {
        const uniqueKey = childSnapshot.key;
        const data = childSnapshot.val() || {};
        const nombre = data.nombre; 
        data.aptoStatus = data.aptoStatus || "Pendiente";
  
        // Filtrar por sucursal solo si es manager y es un contenedor de citas
        const esContenedorCitas = [
          "data_citas",
          "data_citas_manager",
          "data_cita_no_asistieron",
          "data_cita_asistieron",
        ].includes(containerGreen.id);
  
        if (isManagerLoggedIn && esContenedorCitas && sucursalActual && data.sucursal_cita !== sucursalActual) {
          console.log(`Omitiendo ${nombre} - Sucursal cita: ${data.sucursal_cita} no coincide con ${sucursalActual}`);
          return; // Saltar si la sucursal no coincide
        }
  
        vacantesActuales.add(nombre);
  
        const listItem = document.createElement("button");
        let claseItem = "vacante_item";
        if (containerGreen.id === "data_citas") claseItem += "_citas";
        else if (containerGreen.id === "data_citas_manager") claseItem += "_citasManager";
        else if (containerGreen.id === "data_cita_no_asistieron") claseItem += "_citasManagerNoasistio";
        else if (containerGreen.id === "data_cita_asistieron") claseItem += "_citasManagerAsistio";
        else if (containerGreen.id === "data_asistieron") claseItem += "_asistieron";
        else if (containerGreen.id === "data_no_asistieron") claseItem += "_noasistieron";
        else if (containerGreen.id === "data_contratado") claseItem += "_contratado";
        else claseItem += esAsistieron ? "_status" : (data.empleo === "Fijo" && data.horario === "Rotativo" && data.docu === "Si" && data.problema_t === "No") ? "_green" : "_red";
  
        listItem.classList.add(claseItem);
        const infoContainer = document.createElement("div");
        infoContainer.classList.add("vacante_info");
  
        const campos = (containerGreen.id === "data_citas" || containerGreen.id === "data_citas_manager" || containerGreen.id === "data_cita_no_asistieron" || containerGreen.id === "data_cita_asistieron") ?
          [
            { label: "Nombre", value: nombre, isName: true },
            { label: "Fecha Cita", value: data.fecha_cita || "No disponible" },
            { label: "Hora Cita", value: data.hora_cita || "No disponible" },
            { label: "Sucursal Cita", value: data.sucursal_cita || "No disponible" },
            { label: "Puesto", value: data.puesto || "No disponible" },
            { label: "Número", value: data.numero || "No disponible" },
            { label: "Estatus", value: data.aptoStatus, isApto: true }
          ] :
          [
            { label: "Fecha", value: data.fecha_r ? new Date(data.fecha_r).toLocaleDateString() : "No disponible" },
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
            { label: "Estatus", value: data.aptoStatus, isApto: true }
          ];
  
        campos.forEach((campo) => {
          const span = document.createElement("span");
          if (campo.isName) span.classList.add("dbname");
          span.innerHTML = `<strong>${campo.label}:</strong> ${campo.value}`;
          infoContainer.appendChild(span);
        });
  
        const btnContainer2 = document.createElement("div");
        btnContainer2.classList.add("btn_container2");
        const btnDescargarPDF = crearBoton("", "btn-descargar-pdf", () => descargarPDF(uniqueKey, data));
        const btnAgendarCita = crearBoton("", "btn-agendar-cita", () => abrirModalCita(uniqueKey, data));
        btnContainer2.append(btnDescargarPDF, btnAgendarCita);
  
        const btnContainer = document.createElement("div");
        btnContainer.classList.add("btn-container");
  
        // Add apto select/status
        if (containerGreen.id === "data_citas_manager" || containerGreen.id === "data_cita_no_asistieron" || containerGreen.id === "data_cita_asistieron") {
          const aptoSelect = document.createElement("select");
          aptoSelect.classList.add("apto-select");
          aptoSelect.id = `apto-select-${nombre}`;
          const options = [
            { value: "Pendiente", text: "🤷" },
            { value: "Apto", text: "👍" },
            { value: "No apto", text: "👎" }
          ];
          options.forEach(opt => {
            const option = document.createElement("option");
            option.value = opt.value;
            option.textContent = opt.text;
            if (data.aptoStatus === opt.value) option.selected = true;
            aptoSelect.appendChild(option);
          });
          aptoSelect.addEventListener("change", () => updateAptoStatus(uniqueKey, aptoSelect.value, containerGreen.id));
          btnContainer.appendChild(aptoSelect);
          personalizarSelect(aptoSelect);
        } 
  
        const btnNoAsistieron = crearBoton("", "btn-noAsistieron", () => moverVacante(uniqueKey, data, "no_asistieron"));
        const btnAsistieron = crearBoton("", "btn-asistieron", () => moverVacante(uniqueKey, data, "asistieron"));
        const btnContratado = crearBoton("", "btn-contratado", () => moverVacante(uniqueKey, data, "contratado"));
        const btnEliminar = crearBoton("", "btn-eliminar", () => {
          let base = "vacantes";
          if (containerGreen.id === "data_no_asistieron") base = "no_asistieron";
          if (containerGreen.id === "data_asistieron") base = "asistieron";
          if (containerGreen.id === "data_contratado") base = "contratado";
          eliminarVacante(uniqueKey, base);
        });
  
        btnContainer.append(btnNoAsistieron, btnAsistieron, btnContratado, btnEliminar);
  
        listItem.appendChild(btnContainer2);
        listItem.appendChild(infoContainer);
        listItem.appendChild(btnContainer);
  
        if (esAsistieron) ulGreen.appendChild(listItem);
        else (data.empleo === "Fijo" && data.horario === "Rotativo" && data.docu === "Si" && data.problema_t === "No") 
          ? ulGreen.appendChild(listItem) 
          : ulRed.appendChild(listItem);
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
  function updateAptoStatus(uniqueKey, nuevoEstado, containerId) {
    let rutaDB;
    switch (containerId) {
      case "data_citas_manager": rutaDB = `citas_vacantes/${uniqueKey}`; break;
      case "data_cita_no_asistieron": rutaDB = `no_asistieron/${uniqueKey}`; break;
      case "data_cita_asistieron": rutaDB = `asistieron/${uniqueKey}`; break;
      default: return;
    }
  
    const vacanteRef = ref(database, rutaDB);
    get(vacanteRef).then((snapshot) => {
      if (snapshot.exists()) {
        const datosActuales = snapshot.val();
        set(vacanteRef, { ...datosActuales, aptoStatus: nuevoEstado })
          .then(() => {
            console.log(`Estado apto actualizado a ${nuevoEstado} para ${uniqueKey}`);
            mostrarAlerta("alertas");
            mostrarAlerta("alerta_22");
          })
          .catch((error) => {
            console.error("Error al actualizar el estado apto:", error);
            mostrarAlerta("alertas");
            mostrarAlerta("alerta_23");
          });
      }
    });
  }
  function descargarPDF(uniqueKey, data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
  
    // Validar que 'data' sea un objeto válido
    if (!data || typeof data !== "object") {
      console.error("Datos inválidos para generar el PDF:", data);
      mostrarAlerta("alertas");
      mostrarAlerta("alerta_3"); // Error genérico
      return;
    }
  
    // Fondo y estilos
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, 210, 297, "F");
    const colorTitulo = [23, 72, 145];
    const colorEtiquetas = [60, 60, 60];
    const colorValores = [0, 0, 0];
    const colorLinea = [0, 0, 0];
  
    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...colorTitulo);
    doc.text("Información del Vacante", 20, 20);
    doc.setDrawColor(...colorLinea);
    doc.line(20, 22, 190, 22);
  
    // Contenido
    let yPosition = 30;
    doc.setFontSize(12);
    const campoStyle = { font: "helvetica", size: 12, weight: "normal", color: colorEtiquetas };
    const valueStyle = { font: "helvetica", size: 12, weight: "normal", color: colorValores };
  
    const content = [
      { label: "Fecha de llenado", value: data.fecha_r ? new Date(data.fecha_r).toLocaleDateString() : "No disponible" },
      { label: "Nombre", value: data.nombre || "No disponible" }, // Corregido: usar data.nombre
      { label: "Puesto", value: data.puesto || "No disponible" },
      { label: "Sucursal", value: data.sucursal || "No disponible" },
      { label: "Número", value: data.numero || "No disponible" },
      { label: "Edad", value: data.edad ? String(data.edad) : "No disponible" }, // Convertir a cadena
      { label: "F.Nacimiento", value: data.f_n || "No disponible" },
      { label: "Sexo", value: data.sexo || "No disponible" },
      { label: "Nacionalidad", value: data.nacion || "No disponible" },
      { label: "Estado Civil", value: data.e_c || "No disponible" },
      { label: "Documentacion", value: data.docu || "No disponible" },
      { label: "Horario", value: data.horario || "No disponible" },
      { label: "Empleo", value: data.empleo || "No disponible" },
      { label: "Ciudad", value: data.ciudad || "No disponible" },
      { label: "Dirección", value: data.direccion || "No disponible" },
      { label: "CP", value: data.cp ? String(data.cp) : "No disponible" }, // Convertir a cadena
      { label: "Transporte", value: data.transporte || "No disponible" },
      { label: "Cas/Sucu", value: data.casa_suc ? String(data.casa_suc) : "No disponible" }, // Convertir a cadena
      { label: "Problema/T", value: data.problema_t || "No disponible" },
      { label: "Estatus", value: data.aptoStatus || "No disponible" },
    ];
  
    content.forEach((item) => {
      // Asegurarse de que item.value sea una cadena
      const valor = String(item.value || "No disponible"); // Convertir a cadena explícitamente
  
      doc.setFont(campoStyle.font, campoStyle.weight);
      doc.setFontSize(campoStyle.size);
      doc.setTextColor(...campoStyle.color);
      doc.text(`${item.label}:`, 20, yPosition);
  
      doc.setFont(valueStyle.font, valueStyle.weight);
      doc.setFontSize(valueStyle.size);
      doc.setTextColor(...valueStyle.color);
      doc.text(valor, 80, yPosition);
  
      yPosition += 12;
    });
  
    // Línea y pie de página
    doc.setDrawColor(...colorLinea);
    doc.line(20, yPosition + 10, 190, yPosition + 10);
    yPosition += 20;
    doc.setFontSize(10);
    doc.setTextColor(...colorTitulo);
    doc.text("Generado por el reclutador Web de MMM.", 20, yPosition);
  
    // Guardar el PDF
    const fileName = `Vacante_${data.nombre || "SinNombre"}.pdf`;
    doc.save(fileName);
  
    // Mostrar alertas de éxito
    mostrarAlerta("alertas");
    verificarDisplay("pag5", "alerta_13", "alerta_18");
  }
  function abrirModalCita(uniqueKey, data) {
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
      const citasRef = ref(database, `citas_vacantes/${uniqueKey}`);
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
          const refActual = ref(database, `${base}/${uniqueKey}`);
          const snapshot = await get(refActual);
          if (snapshot.exists()) {
            antiguaRef = refActual;
            break;
          }
        }

        if (antiguaRef) {
          await remove(antiguaRef);
        }

        console.log(`✅ Vacante ${uniqueKey} movida a citas_vacantes.`);

        // Enviar mensaje de WhatsApp
        const numero = data.numero.replace(/\D/g, ""); // Formatear el número
        enviarMensajeWhatsApp(
          numero,
          data.nombre,
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
      mostrarAlerta("alerta_24"); // Cancelado
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
  const auth = getAuth(app);
  if (!auth.currentUser) {
    document.getElementById("data_mj_user").innerHTML = "<p>Necesitas iniciar sesión para ver los mensajes.</p>";
    return;
  }
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

//Función para crear botones dinámicamente
function crearBoton(texto, clase, onClick) {
  const btn = document.createElement("button");
  btn.classList.add(clase);
  btn.textContent = texto;
  btn.onclick = onClick;
  return btn;
}

function moverVacante(uniqueKey, data, nuevaDB) {
  console.log(`🔄 Moviendo vacante "${uniqueKey}" a ${nuevaDB}...`);

  const nuevaRef = ref(database, `${nuevaDB}/${uniqueKey}`);
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
      get(ref(database, `${base}/${uniqueKey}`)).then((snapshot) => {
        if (snapshot.exists()) {
          antiguaRef = ref(database, `${base}/${uniqueKey}`);
        }
      })
    )
  ).then(() => {
    if (!antiguaRef) {
      console.error(`❌ No se encontró la referencia anterior de "${uniqueKey}".`);
      mostrarAlerta("alertas");
      verificarDisplay("pag5", "alerta_5", "alerta_16");
      return;
    }

    // Mover el dato si no existe en el destino
    get(nuevaRef).then((snapshot) => {
      if (snapshot.exists()) {
        console.warn(`⚠️ El vacante "${uniqueKey}" ya está en ${nuevaDB}.`);
        mostrarAlerta("alertas");
        verificarDisplay("pag5", "alerta_9", "alerta_15");
      } else {
        set(nuevaRef, data)
          .then(() => remove(antiguaRef))
          .then(() => {
            console.log(`✅ Vacante "${uniqueKey}" movida a ${nuevaDB}`);
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
function eliminarVacante(uniqueKey, base) {
  mostrarAlertaPersonalizada(
    `¿Estás seguro de eliminar al vacante "${uniqueKey}"? 🧐`,
    (confirmado) => {
      if (!confirmado) {
        mostrarAlerta("alertas");
        mostrarAlerta("alerta_8"); // Mostrar alerta de éxito
        return;
      }

      // Definir las rutas posibles
      const rutas = {
        asistieron: `asistieron/${uniqueKey}`,
        no_asistieron: `no_asistieron/${uniqueKey}`,
        contratado: `contratado/${uniqueKey}`,
        data_citas: `data_citas/${uniqueKey}`,
        datamjUser: `chatMessages/${uniqueKey}`,
        default: `vacantes/${uniqueKey}`,
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
    if (!isNaN(prop) && value && value.nombre) { // Esto está bien porque usa data.nombre
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

function regresarAlLogin(tipo) {
  const isManager = tipo === "manager";
  console.log(`Regresando al login ${isManager ? "manager" : "admin"} - Inicio`);

  toggleView({
    home: false,
    header: true,
    form: false,
    login: !isManager,
    login_manager: isManager,
    aside: true,
    admin: false,
    admin_manager: false,
  });

  if (elements.header) {
    elements.header.style.display = "flex";
    console.log("Header restaurado a display: flex");
  }
  if (elements.pavo_cont) {
    elements.pavo_cont.style.display = "flex";
    console.log("Pavo_cont restaurado a display: flex");
  }
  if (elements.chatbot) {
    elements.chatbot.style.display = "flex";
    console.log("Chatbot restaurado a display: flex");
  }

  if (isStandalone()) {
    elements.header.style.display = "none"; 
    elements.chatbot.style.display = "none";
    elements.pavo_cont.style.display = "none";
  }

  // Forzar actualización del DOM con un pequeño retraso
  setTimeout(() => {
    console.log("Llamando a mostrarBotonEntrar después de retraso...");
    mostrarBotonEntrar(tipo);
  }, 100);

  console.log(`Regresando al login ${isManager ? "manager" : "admin"} - Fin`);
}

// Modificación de iniciarSesion para guardar la sesión
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
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("Inicio de sesión exitoso:", user.email);

      if (isManager) {
        localStorage.removeItem("isAdminLoggedIn");
        const sucursalesValidas = [
          "playas", "altamira", "libertad", "sierra", "cacho", "hipodromo",
          "santafe", "villafontana", "huertas", "monarca", "otay", "rosarito",
          "florido", "tecate", "sanysidro"
        ];
        if (!sucursalesValidas.includes(userInput)) {
          localStorage.removeItem("sucursal");
          mostrarError(erroru);
          return;
        }
        localStorage.setItem("sucursal", userInput);
        localStorage.setItem("isManagerLoggedIn", "true");

        // Actualizar el elemento sucursal_activa desde localStorage
        const sucursalActivaElement = document.getElementById("sucursal_activa");
        if (sucursalActivaElement) {
          const sucursalFormateada = userInput.charAt(0).toUpperCase() + userInput.slice(1).toLowerCase();
          sucursalActivaElement.textContent = sucursalFormateada;
        }
      } else {
        localStorage.removeItem("isManagerLoggedIn");
        localStorage.removeItem("sucursal");
        const sucursalesInvalidas = [
          "playas", "altamira", "libertad", "sierra", "cacho", "hipodromo",
          "santafe", "villafontana", "huertas", "monarca", "otay", "rosarito",
          "florido", "tecate", "sanysidro"
        ];
        if (sucursalesInvalidas.includes(userInput)) {
          mostrarError(erroru);
          return;
        }
        localStorage.setItem("isAdminLoggedIn", "true");
      }

      setTimeout(() => {
        toggleView({
          home: false,
          header: false,
          form: false,
          login: false,
          login_manager: false,
          aside: false,
          admin: !isManager,
          admin_manager: isManager,
        });
        if (elements.header) elements.header.style.display = "none";
        if (elements.pavo_cont) elements.pavo_cont.style.display = "none";
        if (elements.chatbot) elements.chatbot.style.display = "none";

        mostrarAlerta("alertas");
        mostrarAlerta(isManager ? "alerta_14" : "alerta_4");
      }, 1000);

      login.classList.add("animacionlog");
      mostrarDatos();
      mostrarMensajesUsuarios();
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

// Función para mostrar el botón "Entrar" si ya hay sesión
function mostrarBotonEntrar(tipo) {
  const isManager = tipo === "manager";
  const loginContainer = isManager
    ? document.getElementById("Logincont_sucu")
    : document.getElementById("Logincont");
  const form = isManager
    ? document.getElementById("Login-cont_manager")
    : document.getElementById("Login-cont");
  const otherLoginContainer = isManager
    ? document.getElementById("Logincont")
    : document.getElementById("Logincont_sucu");

  if (!loginContainer || !form) {
    console.error(`No se encontró el contenedor o formulario para ${tipo}`);
    return;
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log(`Usuario autenticado detectado: ${user.email}`);
      const isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
      const isManagerLoggedIn = localStorage.getItem("isManagerLoggedIn") === "true";
      const currentUserType = isAdminLoggedIn ? "admin" : isManagerLoggedIn ? "manager" : null;

      if (currentUserType === tipo) {
        if (form) form.style.display = "none";

        let entrarBtn = loginContainer.querySelector(".entrar-btn");
        if (!entrarBtn) {
          console.log(`Creando botón Entrar para ${tipo}...`);
          entrarBtn = document.createElement("button");
          entrarBtn.classList.add("entrar-btn");
          entrarBtn.textContent = "Entrar";
          entrarBtn.addEventListener("click", () => {
            console.log(`Botón Entrar clicado para ${tipo}`);
            toggleView({
              home: false,
              header: false,
              form: false,
              login: false,
              login_manager: false,
              aside: false,
              admin: !isManager,
              admin_manager: isManager,
            });
            if (elements.header) elements.header.style.display = "none";
            if (elements.pavo_cont) elements.pavo_cont.style.display = "none";
            if (elements.chatbot) elements.chatbot.style.display = "none";

            // Actualizar sucursal_activa desde localStorage al entrar
            if (isManager) {
              const sucursalActivaElement = document.getElementById("sucursal_activa");
              const sucursalGuardada = localStorage.getItem("sucursal");
              if (sucursalActivaElement && sucursalGuardada) {
                const sucursalFormateada = sucursalGuardada.charAt(0).toUpperCase() + sucursalGuardada.slice(1).toLowerCase();
                sucursalActivaElement.textContent = sucursalFormateada;
              }
            }

            mostrarDatos();
            mostrarMensajesUsuarios();
          });
          loginContainer.appendChild(entrarBtn);
        }
        if (entrarBtn) entrarBtn.style.display = "block";

        if (otherLoginContainer) {
          const otherEntrarBtn = otherLoginContainer.querySelector(".entrar-btn");
          if (otherEntrarBtn) otherEntrarBtn.style.display = "none";
          const otherLoginCont = otherLoginContainer.querySelector(".login-cont");
          if (otherLoginCont) otherLoginCont.style.display = "flex";
        }
      } else {
        if (form) form.style.display = "flex";
        const entrarBtn = loginContainer.querySelector(".entrar-btn");
        if (entrarBtn) entrarBtn.style.display = "none";
      }
    } else {
      console.log("No hay usuario autenticado, mostrando formulario...");
      if (form) form.style.display = "flex";
      const entrarBtn = loginContainer.querySelector(".entrar-btn");
      if (entrarBtn) entrarBtn.style.display = "none";
      localStorage.removeItem("isAdminLoggedIn");
      localStorage.removeItem("isManagerLoggedIn");
      localStorage.removeItem("sucursal");
    }
  });
}

// Función para cerrar sesión
const logoutButtons = document.querySelectorAll(
  "#logoutButton1, #logoutButton2"
);
logoutButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("isAdminLoggedIn");
      localStorage.removeItem("isManagerLoggedIn");
      localStorage.removeItem("sucursal");
      console.log("Sesión cerrada con éxito.");
      window.location.reload();
    } catch (error) {
      console.error("Error al cerrar sesión:", error.message);
      alert("No se pudo cerrar sesión. Por favor, intenta de nuevo.");
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  asignarEventos("admin");
  asignarEventos("manager");
  cargarSucursalesDisponibles();

  // Llamar a mostrarBotonEntrar para ambos tipos al cargar la página
  mostrarBotonEntrar("admin");
  mostrarBotonEntrar("manager");

  const regreso1 = document.getElementById("regreso1");
  const regreso2 = document.getElementById("regreso2");

  if (regreso1) regreso1.addEventListener("click", () => regresarAlLogin("admin"));
  if (regreso2) regreso2.addEventListener("click", () => regresarAlLogin("manager"));
});