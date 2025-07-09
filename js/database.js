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
  get,
  update,
} from "./firebase.js";
import {
  personalizarSelect,
  toggleView,
  elements,
  isStandalone,
  mostrarAlerta,
  setThemeColor,
} from "./main.js";
import { updateUnreadChatsCount } from "./chat_admin.js";
import { updateUnreadMessagesCount } from "./chat_manager.js";

// Inicializar Firebase Auth
const auth = getAuth(app);

let vacantesPrevias = new Set();
let previousVacantes = new Map();
let isAdmin = localStorage.getItem("isAdminLoggedIn") === "true";
let isManager = localStorage.getItem("isManagerLoggedIn") === "true";

const label_btnEnviar = document.getElementById("label_enviar");
const formElement = document.getElementById("myForm"); // Asegúrate de que este ID coincida con tu HTML

if (!label_btnEnviar) {
  console.error("El elemento con ID 'label_enviar' no se encontró en el DOM.");
} else {
  // Remover cualquier listener previo para evitar duplicados
  label_btnEnviar.removeEventListener("click", enviar_form_handler);

  // Definir la función handler por separado para poder removerla
  function enviar_form_handler(event) {
    event.preventDefault(); // Prevenir cualquier comportamiento por defecto (como submit)
    console.log("Botón clicado, ejecutando enviar_form...");
    enviar_form();
  }

  // Añadir el listener una sola vez
  label_btnEnviar.addEventListener("click", enviar_form_handler);
}

// Si el botón está dentro de un <form>, prevenir el submit por defecto
if (formElement) {
  formElement.addEventListener("submit", (event) => {
    event.preventDefault(); // Evitar que el formulario dispare un submit adicional
    console.log(
      "Evento submit prevenido, ejecutando enviar_form manualmente..."
    );
    enviar_form();
  });
}

// Modificar enviar_form con una bandera para evitar envíos duplicados
let isSubmitting = false;

function enviar_form() {
  if (isSubmitting) {
    console.log("Envío ya en progreso, evitando duplicado...");
    return;
  }

  isSubmitting = true;
  console.log("Iniciando envío del formulario...");

  const fechaActual = new Date().toISOString().split("T")[0];
  document.getElementById("fecha_r").value = fechaActual;
  document.getElementById("modDate").value = fechaActual;

  // Obtener valores del formulario
  const nombre = document.getElementById("nombre").value.trim();
  const puesto = document.getElementById("puesto").value;
  const horario = document.getElementById("horario").value;
  const numero = document.getElementById("numero").value.trim();
  const fecha_r = document.getElementById("fecha_r").value;
  const modDate = document.getElementById("modDate").value;
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
    nombre,
    puesto,
    horario,
    numero,
    fecha_r,
    modDate,
    edad,
    direccion,
    ciudad,
    cp,
    docu,
    casa_suc,
    transporte,
    empleo,
    sexo,
    nacion,
    e_c,
    sucursal,
    problema_t,
    f_n,
  });

  // Array para acumular errores
  const errores = [];

  // Función para validar y acumular errores
  const validarCampo = (condicion, mensaje, alertaId) => {
    if (condicion) {
      console.log(`Validación fallida: ${mensaje}`);
      errores.push({ mensaje, alertaId });
    }
  };

  // Ejecutar todas las validaciones con alertas específicas
  validarCampo(!nombre, "El nombre está vacío", "alertapreguntaerror_1");
  validarCampo(!puesto, "El puesto está vacío", "alertapreguntaerror_2");
  validarCampo(
    !numero.match(/^\+?[0-9]{10,15}$/) || !numero,
    "El número debe tener entre 10 y 15 dígitos, opcionalmente con + al inicio",
    "alertapreguntaerror_3"
  );
  validarCampo(
    !fecha_r.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/) || !fecha_r,
    "Fecha inválida",
    "alertapreguntaerror_4"
  );
  validarCampo(
    edad < 18 || edad > 100 || isNaN(edad),
    "Edad debe estar entre 18 y 100",
    "alertapreguntaerror_5"
  );
  validarCampo(
    !cp.match(/^[0-9]{5}$/) || !cp,
    "Código postal debe tener exactamente 5 dígitos",
    "alertapreguntaerror_6"
  );
  validarCampo(!direccion, "La dirección está vacía", "alertapreguntaerror_7");
  validarCampo(!ciudad, "La ciudad está vacía", "alertapreguntaerror_8");
  validarCampo(!casa_suc, "Casa/Sucursal está vacío", "alertapreguntaerror_9");
  validarCampo(!transporte, "Transporte está vacío", "alertapreguntaerror_10");
  validarCampo(!e_c, "Estado civil está vacío", "alertapreguntaerror_11");
  validarCampo(!docu, "Documentación está vacía", "alertapreguntaerror_12");
  validarCampo(!empleo, "Empleo está vacío", "alertapreguntaerror_13");
  validarCampo(!horario, "Horario está vacío", "alertapreguntaerror_14");
  validarCampo(!sexo, "Sexo está vacío", "alertapreguntaerror_15");
  validarCampo(!nacion, "Nacionalidad está vacía", "alertapreguntaerror_16");
  validarCampo(!problema_t, "Problema/T está vacío", "alertapreguntaerror_17");
  validarCampo(
    !f_n,
    "Fecha de nacimiento está vacía",
    "alertapreguntaerror_18"
  );
  validarCampo(!sucursal, "Sucursal está vacía", "alertapreguntaerror_19");

  // Verificar si hay errores
  if (errores.length > 0) {
    console.log("Errores encontrados:", errores);
    mostrarAlerta("alertas");
    errores.forEach((error) => mostrarAlerta(error.alertaId));
    isSubmitting = false; // Resetear si hay errores
    return;
  }

  // Si no hay errores, preparar y enviar los datos
  const formData = {
    nombre,
    puesto,
    numero,
    fecha_r,
    modDate,
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

  console.log("Datos preparados para enviar a Firebase:", formData);

  const timestamp = Date.now();
  const uniqueKey = `${nombre}_${timestamp}`;

  set(ref(database, `vacantes/${uniqueKey}`), formData)
    .then(() => {
      console.log(`Formulario enviado exitosamente con clave: ${uniqueKey}`);
      mostrarAlerta("alertas");
      mostrarAlerta("alerta_2"); // Éxito
      document.getElementById("myForm").reset();
      localStorage.setItem("formVac", "true");
      isSubmitting = false; // Resetear después de éxito
    })
    .catch((error) => {
      console.error("Error al enviar formulario:", error.message);
      mostrarAlerta("alertas");
      mostrarAlerta("alerta_3"); // Error
      isSubmitting = false; // Resetear después de error
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
    mostrarAlertaAdmin("alerta_1");
    document.getElementById("data_green").innerHTML =
      "<p>Necesitas iniciar sesión para ver los datos.</p>";
    document.getElementById("data_red").innerHTML =
      "<p>Necesitas iniciar sesión para ver los datos.</p>";
    return;
  }

  const contenedores = {
    dataGreen: document.getElementById("data_green"),
    dataRed: document.getElementById("data_red"),
    dataCitas: document.getElementById("data_citas"),
    dataCitasManager: document.getElementById("data_citas_manager"),
    dataCitasnoAsistieron: document.getElementById("data_cita_no_asistieron"),
    dataCitasAsistieron: document.getElementById("data_cita_asistieron"),
    dataNosistieron: document.getElementById("data_no_asistieron"),
    dataAsistieron: document.getElementById("data_asistieron"),
    dataContratado: document.getElementById("data_contratado"),
    dataBaja: document.getElementById("data_baja"),
  };

  const filtros = {
    filtroGreen: document.getElementById("filtro-green"),
    filtroRed: document.getElementById("filtro-red"),
    filtroCitas: document.getElementById("filtro-citas"),
    filtroNoAsistieron: document.getElementById("filtro-no-asistieron"),
    filtroAsistieron: document.getElementById("filtro-asistieron"),
    filtroContratado: document.getElementById("filtro-contratado"),
    filtroBaja: document.getElementById("filtro-baja"),
  };

  const vacantesRef = ref(database, "vacantes/");
  const citasVacantesRef = ref(database, "citas_vacantes/");
  const asistieronRef = ref(database, "asistieron/");
  const no_asistieronRef = ref(database, "no_asistieron/");
  const contratadoRef = ref(database, "contratado/");
  const bajaRef = ref(database, "baja/");

  // Función para manejar el filtrado
  function agregarFiltro(input, callbackRender) {
    if (input) {
      input.addEventListener("input", (e) => {
        const filtro = e.target.value.trim().toLowerCase();
        callbackRender(filtro);
      });
    }
  }

  // Vacantes (green y red) - Con filtro
  onValue(vacantesRef, (snapshot) => {
    const renderGreenRed = (filtro = "") =>
      renderizarVacantes(
        snapshot,
        contenedores.dataGreen,
        contenedores.dataRed,
        false,
        filtro
      );
    renderGreenRed();
    agregarFiltro(filtros.filtroGreen, renderGreenRed);
    agregarFiltro(filtros.filtroRed, renderGreenRed);
  });

  // Citas (admin) - Con filtro
  onValue(citasVacantesRef, (snapshot) => {
    const renderCitas = (filtro = "") =>
      renderizarVacantes(snapshot, contenedores.dataCitas, null, true, filtro);
    renderCitas();
    agregarFiltro(filtros.filtroCitas, renderCitas);
  });

  // Citas Manager - Sin filtro
  onValue(citasVacantesRef, (snapshot) => {
    renderizarVacantes(snapshot, contenedores.dataCitasManager, null, true, "");
  });

  // Asistieron (admin) - Con filtro
  onValue(asistieronRef, (snapshot) => {
    const renderAsistieron = (filtro = "") =>
      renderizarVacantes(
        snapshot,
        contenedores.dataAsistieron,
        null,
        true,
        filtro
      );
    renderAsistieron();
    agregarFiltro(filtros.filtroAsistieron, renderAsistieron);
  });

  // Asistieron Manager - Sin filtro
  onValue(asistieronRef, (snapshot) => {
    renderizarVacantes(
      snapshot,
      contenedores.dataCitasAsistieron,
      null,
      true,
      ""
    );
  });

  // No asistieron (admin) - Con filtro
  onValue(no_asistieronRef, (snapshot) => {
    const renderNoAsistieron = (filtro = "") =>
      renderizarVacantes(
        snapshot,
        contenedores.dataNosistieron,
        null,
        true,
        filtro
      );
    renderNoAsistieron();
    agregarFiltro(filtros.filtroNoAsistieron, renderNoAsistieron);
  });

  // No asistieron Manager - Sin filtro
  onValue(no_asistieronRef, (snapshot) => {
    renderizarVacantes(
      snapshot,
      contenedores.dataCitasnoAsistieron,
      null,
      true,
      ""
    );
  });
  // Contratados (admin) - Con filtro
  onValue(contratadoRef, (snapshot) => {
    const renderContratado = (filtro = "") =>
      renderizarVacantes(
        snapshot,
        contenedores.dataContratado,
        null,
        true,
        filtro
      );
    renderContratado();
    agregarFiltro(filtros.filtroContratado, renderContratado);
  });
  // Baja (admin) - Con filtro
  onValue(bajaRef, (snapshot) => {
    const renderBaja = (filtro = "") =>
      renderizarVacantes(snapshot, contenedores.dataBaja, null, true, filtro);
    renderBaja();
    agregarFiltro(filtros.filtroBaja, renderBaja);
  });

  function renderizarVacantes(
    snapshot,
    containerGreen,
    containerRed,
    esAsistieron = false,
    filtro = ""
  ) {
    const fragmentGreen = document.createDocumentFragment();
    const fragmentRed = document.createDocumentFragment();
    const sucursalActual = localStorage.getItem("sucursal");
    const isManagerLoggedIn =
      localStorage.getItem("isManagerLoggedIn") === "true";

    containerGreen.innerHTML = "";
    if (containerRed) containerRed.innerHTML = "";

    let vacantesActuales = new Set();
    let vacantesArray = []; // Array para almacenar las vacantes

    if (snapshot.exists()) {
      // Recolectar todas las vacantes en un array
      snapshot.forEach((childSnapshot) => {
        const uniqueKey = childSnapshot.key;
        const data = childSnapshot.val() || {};
        data.aptoStatus = data.aptoStatus || "Pendiente";
        data.nombre = data.nombre || "";
        vacantesArray.push({ uniqueKey, data });
      });

      // Ordenar las vacantes por fecha_r en orden descendente
      vacantesArray.sort((a, b) => {
        const fechaA = new Date(a.data.fecha_r || "1970-01-01");
        const fechaB = new Date(b.data.fecha_r || "1970-01-01");
        return fechaB - fechaA; // Orden descendente
      });

      const ulGreen = document.createElement("ul");
      const ulRed = document.createElement("ul");

      // Procesar las vacantes ordenadas
      vacantesArray.forEach(({ uniqueKey, data }) => {
        const nombre = data.nombre;

        // Normalizar filtro y analizar si tiene formato "campo:valor"
        const filtroNormalizado = filtro.trim().toLowerCase();
        let campoFiltro = null;
        let valorFiltro = filtroNormalizado;

        if (filtroNormalizado.includes(":")) {
          [campoFiltro, valorFiltro] = filtroNormalizado.split(":", 2);
          valorFiltro = valorFiltro.trim();
        }

        // Función para verificar coincidencia con fechas
        const coincideFecha = (fechaStr, filtroFecha) => {
          if (!fechaStr) return false;
          const fecha = new Date(fechaStr);
          const [dia, mes, anio] = filtroFecha.split("/").map(Number);
          const anioCompleto = anio < 100 ? 2000 + anio : anio;
          return (
            fecha.getDate() === dia &&
            fecha.getMonth() + 1 === mes &&
            fecha.getFullYear() === anioCompleto
          );
        };

        // Aplicar filtro
        let coincide = true;
        if (filtro) {
          if (campoFiltro) {
            switch (campoFiltro) {
              case "nombre":
                coincide = nombre.toLowerCase().includes(valorFiltro);
                break;
              case "edad":
                coincide = String(data.edad) === valorFiltro;
                break;
              case "puesto":
                coincide = (data.puesto || "")
                  .toLowerCase()
                  .includes(valorFiltro);
                break;
              case "horario":
                coincide = (data.horario || "")
                  .toLowerCase()
                  .includes(valorFiltro);
                break;
              case "numero":
                coincide = (data.numero || "")
                  .toLowerCase()
                  .includes(valorFiltro);
                break;
              case "fecha":
                coincide =
                  coincideFecha(data.fecha_r, valorFiltro) ||
                  coincideFecha(data.fecha_cita, valorFiltro);
                break;
              case "direccion":
                coincide = (data.direccion || "")
                  .toLowerCase()
                  .includes(valorFiltro);
                break;
              case "ciudad":
                coincide = (data.ciudad || "")
                  .toLowerCase()
                  .includes(valorFiltro);
                break;
              case "cp":
                coincide = (data.cp || "").toLowerCase().includes(valorFiltro);
                break;
              case "docu":
                coincide = (data.docu || "")
                  .toLowerCase()
                  .includes(valorFiltro);
                break;
              case "casa_suc":
                coincide = (data.casa_suc || "")
                  .toLowerCase()
                  .includes(valorFiltro);
                break;
              case "transporte":
                coincide = (data.transporte || "")
                  .toLowerCase()
                  .includes(valorFiltro);
                break;
              case "empleo":
                coincide = (data.empleo || "")
                  .toLowerCase()
                  .includes(valorFiltro);
                break;
              case "sexo":
                coincide = (data.sexo || "")
                  .toLowerCase()
                  .includes(valorFiltro);
                break;
              case "nacion":
                coincide = (data.nacion || "")
                  .toLowerCase()
                  .includes(valorFiltro);
                break;
              case "e_c":
                coincide = (data.e_c || "").toLowerCase().includes(valorFiltro);
                break;
              case "sucursal":
                coincide = (data.sucursal || data.sucursal_cita || "")
                  .toLowerCase()
                  .includes(valorFiltro);
                break;
              case "problema_t":
                coincide = (data.problema_t || "")
                  .toLowerCase()
                  .includes(valorFiltro);
                break;
              case "f_n":
                coincide = coincideFecha(data.f_n, valorFiltro);
                break;
              case "estatus":
                coincide = (data.aptoStatus || "")
                  .toLowerCase()
                  .includes(valorFiltro);
                break;
              default:
                coincide = JSON.stringify(data)
                  .toLowerCase()
                  .includes(filtroNormalizado);
            }
          } else {
            coincide =
              nombre.toLowerCase().includes(filtroNormalizado) ||
              String(data.edad).includes(filtroNormalizado) ||
              (data.puesto || "").toLowerCase().includes(filtroNormalizado) ||
              (data.horario || "").toLowerCase().includes(filtroNormalizado) ||
              (data.numero || "").toLowerCase().includes(filtroNormalizado) ||
              coincideFecha(data.fecha_r, filtroNormalizado) ||
              coincideFecha(data.fecha_cita, filtroNormalizado) ||
              (data.direccion || "")
                .toLowerCase()
                .includes(filtroNormalizado) ||
              (data.ciudad || "").toLowerCase().includes(filtroNormalizado) ||
              (data.cp || "").toLowerCase().includes(filtroNormalizado) ||
              (data.docu || "").toLowerCase().includes(filtroNormalizado) ||
              (data.casa_suc || "").toLowerCase().includes(filtroNormalizado) ||
              (data.transporte || "")
                .toLowerCase()
                .includes(filtroNormalizado) ||
              (data.empleo || "").toLowerCase().includes(filtroNormalizado) ||
              (data.sexo || "").toLowerCase().includes(filtroNormalizado) ||
              (data.nacion || "").toLowerCase().includes(filtroNormalizado) ||
              (data.e_c || "").toLowerCase().includes(filtroNormalizado) ||
              (data.sucursal || data.sucursal_cita || "")
                .toLowerCase()
                .includes(filtroNormalizado) ||
              (data.problema_t || "")
                .toLowerCase()
                .includes(filtroNormalizado) ||
              coincideFecha(data.f_n, filtroNormalizado) ||
              (data.aptoStatus || "").toLowerCase().includes(filtroNormalizado);
          }
        }

        if (!coincide) return;

        const esContenedorCitas = [
          "data_citas",
          "data_citas_manager",
          "data_cita_no_asistieron",
          "data_cita_asistieron",
        ].includes(containerGreen.id);

        if (
          isManagerLoggedIn &&
          esContenedorCitas &&
          sucursalActual &&
          data.sucursal_cita !== sucursalActual
        ) {
          return;
        }

        vacantesActuales.add(nombre);

        const listItem = document.createElement("button");
        let claseItem = "vacante_item";
        if (containerGreen.id === "data_citas") claseItem += "_citas";
        else if (containerGreen.id === "data_citas_manager")
          claseItem += "_citasManager";
        else if (containerGreen.id === "data_cita_no_asistieron")
          claseItem += "_citasManagerNoasistio";
        else if (containerGreen.id === "data_cita_asistieron")
          claseItem += "_citasManagerAsistio";
        else if (containerGreen.id === "data_asistieron")
          claseItem += "_asistieron";
        else if (containerGreen.id === "data_no_asistieron")
          claseItem += "_noasistieron";
        else if (containerGreen.id === "data_contratado")
          claseItem += "_contratado";
        else if (containerGreen.id === "data_baja") claseItem += "_baja";
        else
          claseItem += esAsistieron
            ? "_status"
            : data.empleo === "Fijo" &&
              data.horario === "Rotativo" &&
              data.docu === "Si" &&
              data.problema_t === "No"
            ? "_green"
            : "_red";

        listItem.classList.add(claseItem);

        const Itemnombre = document.createElement("div");
        Itemnombre.classList.add("Itemnombre");
        const Itemnombrespan = document.createElement("span");
        Itemnombrespan.innerHTML = `${data.nombre}`;
        Itemnombre.appendChild(Itemnombrespan);

        const Itemstatus = document.createElement("div");
        Itemstatus.classList.add("Itemstatus");
        const Itemstatusspan = document.createElement("span");
        Itemstatusspan.innerHTML = `${data.aptoStatus}`;
        const claseNormalizada = data.aptoStatus
          .toLowerCase()
          .replace(/\s+/g, "-");
        Itemstatusspan.classList.add(claseNormalizada);
        Itemstatus.appendChild(Itemstatusspan);

        const criteriosContainer = document.createElement("div");
        criteriosContainer.classList.add("criterios_container");

        const criteriosSpan = document.createElement("span");
        criteriosSpan.classList.add("criterios_count");

        let cumplenCount = 0;
        const criterios = [
          data.empleo === "Fijo",
          data.horario === "Rotativo",
          data.docu === "Si",
          data.problema_t === "No",
        ];
        cumplenCount = criterios.filter(Boolean).length;
        const totalPreguntas = 4;

        criteriosSpan.textContent = `${cumplenCount}/${totalPreguntas}`;
        criteriosSpan.classList.remove("muyBajo", "medio", "alto");
        criteriosSpan.classList.add(
          cumplenCount === 4 ? "alto" : cumplenCount >= 2 ? "medio" : "muyBajo"
        );
        criteriosContainer.appendChild(criteriosSpan);

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
                { label: "Estatus", value: data.aptoStatus, isApto: true },
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
                {
                  label: "Documentacion",
                  value: data.docu || "No disponible",
                },
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
                {
                  label: "Cas/Sucu",
                  value: data.casa_suc || "No disponible",
                },
                {
                  label: "Problema/T",
                  value: data.problema_t || "No disponible",
                },
                { label: "Estatus", value: data.aptoStatus, isApto: true },
              ];

        campos.forEach((campo) => {
          const span = document.createElement("span");
          if (campo.isName) span.classList.add("dbname");
          span.innerHTML = `<strong>${campo.label}:</strong> ${campo.value}`;
          infoContainer.appendChild(span);
        });

        const btnContainer2 = document.createElement("div");
        btnContainer2.classList.add("btn_container2");
        const btnDescargarPDF = crearBoton("", "btn-descargar-pdf", () =>
          descargarPDF(uniqueKey, data)
        );
        const btnAgendarCita = crearBoton("", "btn-agendar-cita", () =>
          abrirModalCita(uniqueKey, data)
        );
        btnContainer2.append(btnDescargarPDF, btnAgendarCita);

        const btnContainer = document.createElement("div");
        btnContainer.classList.add("btn-container");

        if (
          containerGreen.id === "data_citas_manager" ||
          containerGreen.id === "data_cita_no_asistieron" ||
          containerGreen.id === "data_cita_asistieron"
        ) {
          const aptoSelect = document.createElement("select");
          aptoSelect.classList.add("apto-select");
          aptoSelect.id = `apto-select-${nombre}`;
          const options = [
            { value: "Pendiente", text: "⏳" },
            { value: "Apto", text: "👍" },
            { value: "No apto", text: "👎" },
          ];
          options.forEach((opt) => {
            const option = document.createElement("option");
            option.value = opt.value;
            option.textContent = opt.text;
            if (data.aptoStatus === opt.value) option.selected = true;
            aptoSelect.appendChild(option);
          });
          aptoSelect.addEventListener("change", () =>
            updateAptoStatus(uniqueKey, aptoSelect.value, containerGreen.id)
          );
          btnContainer.appendChild(aptoSelect);
          personalizarSelect(aptoSelect);
        }

        const btnNoAsistieron = crearBoton("", "btn-noAsistieron", () =>
          moverVacante(uniqueKey, data, "no_asistieron")
        );
        const btnAsistieron = crearBoton("", "btn-asistieron", () =>
          moverVacante(uniqueKey, data, "asistieron")
        );
        const btnContratado = crearBoton("", "btn-contratado", () =>
          moverVacante(uniqueKey, data, "contratado")
        );
        const btnBaja = crearBoton("", "btn-baja", () =>
          moverVacante(uniqueKey, data, "baja")
        );

        const containerEliminar = document.createElement("div");
        containerEliminar.classList.add("containerEliminar");

        const btnEliminar = crearBoton("", "btn-eliminar", () => {
          let base = "vacantes";
          if (containerGreen.id === "data_no_asistieron")
            base = "no_asistieron";
          if (containerGreen.id === "data_asistieron") base = "asistieron";
          if (containerGreen.id === "data_contratado") base = "contratado";
          if (containerGreen.id === "data_baja") base = "baja";
          eliminarVacante(uniqueKey, base, data);
        });

        btnContainer.append(
          btnNoAsistieron,
          btnAsistieron,
          btnContratado,
          btnBaja
        );
        containerEliminar.append(btnEliminar);

        listItem.appendChild(btnContainer2);
        listItem.appendChild(Itemnombre);
        listItem.appendChild(infoContainer);
        listItem.appendChild(criteriosContainer);
        listItem.appendChild(Itemstatus);
        listItem.appendChild(btnContainer);
        listItem.appendChild(containerEliminar);

        if (esAsistieron) ulGreen.appendChild(listItem);
        else
          data.empleo === "Fijo" &&
          data.horario === "Rotativo" &&
          data.docu === "Si" &&
          data.problema_t === "No"
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
      case "data_citas_manager":
        rutaDB = `citas_vacantes/${uniqueKey}`;
        break;
      case "data_cita_no_asistieron":
        rutaDB = `no_asistieron/${uniqueKey}`;
        break;
      case "data_cita_asistieron":
        rutaDB = `asistieron/${uniqueKey}`;
        break;
      default:
        return;
    }

    const vacanteRef = ref(database, rutaDB);
    get(vacanteRef).then((snapshot) => {
      if (snapshot.exists()) {
        const datosActuales = snapshot.val();
        set(vacanteRef, { ...datosActuales, aptoStatus: nuevoEstado })
          .then(() => {
            console.log(
              `Estado apto actualizado a ${nuevoEstado} para ${uniqueKey}`
            );
            mostrarAlertaAdmin("alerta_18");
          })
          .catch((error) => {
            console.error("Error al actualizar el estado apto:", error);
            mostrarAlertaAdmin("alerta_19");
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
    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.setTextColor(255, 0, 0);
    doc.text("No se pudo generar el PDF debido a datos inválidos.", 30, 140);
    doc.save(`Vacante_${uniqueKey}.pdf`);
    return;
  }

  // Estilos alineados con generarEstadisticasPDF
  const colorFondo = [245, 245, 245]; // #F5F5F5
  const colorTitulo = [23, 72, 145]; // #174891
  const colorTexto = [60, 60, 60]; // #3C3C3C
  const colorRecuadro = [230, 230, 230]; // #E6E6E6
  const colorBorde = [200, 200, 200]; // #C8C8C8

  // Fondo de la página
  doc.setFillColor(...colorFondo);
  doc.rect(0, 0, 210, 297, "F");

  // Recuadro principal
  doc.setDrawColor(...colorBorde);
  doc.roundedRect(15, 15, 180, 270, 5, 5, "FD");

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(25);
  doc.setTextColor(...colorTitulo);
  doc.text("Información del Vacante", 105, 30, { align: "center" });

  // Subtítulo con fecha de generación
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...colorTexto);
  doc.text(
    `Generado el ${new Date().toLocaleDateString("es-ES")}`,
    105,
    40,
    { align: "center" }
  );
  doc.line(15, 45, 195, 45); // Línea divisoria

  // Recuadro para datos (altura aumentada para abarcar texto más grande)
  doc.setFillColor(...colorRecuadro);
  doc.roundedRect(20, 50, 170, 230, 3, 3, "F"); // Altura aumentada a 235 mm

  // Contenido
  let yPosition = 60;
  const campoStyle = {
    font: "helvetica",
    size: 15, // Aumentado de 12 a 14
    weight: "bold",
    color: colorTexto,
  };
  const valueStyle = {
    font: "helvetica",
    size: 14, // Aumentado de 12 a 13
    weight: "normal",
    color: [0, 0, 0], // #000000
  };

  const content = [
    {
      label: "Fecha de llenado",
      value: data.fecha_r
        ? new Date(data.fecha_r).toLocaleDateString()
        : "No disponible",
    },
    { label: "Nombre", value: data.nombre || "No disponible" },
    { label: "Puesto", value: data.puesto || "No disponible" },
    { label: "Sucursal", value: data.sucursal || "No disponible" },
    { label: "Número", value: data.numero || "No disponible" },
    { label: "Edad", value: data.edad ? String(data.edad) : "No disponible" },
    { label: "F.Nacimiento", value: data.f_n || "No disponible" },
    { label: "Sexo", value: data.sexo || "No disponible" },
    { label: "Nacionalidad", value: data.nacion || "No disponible" },
    { label: "Estado Civil", value: data.e_c || "No disponible" },
    { label: "Documentación", value: data.docu || "No disponible" },
    { label: "Horario", value: data.horario || "No disponible" },
    { label: "Empleo", value: data.empleo || "No disponible" },
    { label: "Ciudad", value: data.ciudad || "No disponible" },
    { label: "Dirección", value: data.direccion || "No disponible" },
    { label: "CP", value: data.cp ? String(data.cp) : "No disponible" },
    { label: "Transporte", value: data.transporte || "No disponible" },
    {
      label: "Cas/Sucu",
      value: data.casa_suc ? String(data.casa_suc) : "No disponible",
    },
    { label: "Problema/T", value: data.problema_t || "No disponible" },
    { label: "Estatus", value: data.aptoStatus || "No disponible" },
  ];

  // Ajustar el texto para evitar desbordamiento
  content.forEach((item) => {
    const valor = String(item.value || "No disponible");
    // Dividir el texto si es demasiado largo
    const maxWidth = 85; // Reducido ligeramente para el tamaño de fuente más grande
    const splitText = doc.splitTextToSize(valor, maxWidth);

    doc.setFont(campoStyle.font, campoStyle.weight);
    doc.setFontSize(campoStyle.size);
    doc.setTextColor(...campoStyle.color);
    doc.text(`${item.label}:`, 25, yPosition);

    doc.setFont(valueStyle.font, valueStyle.weight);
    doc.setFontSize(valueStyle.size);
    doc.setTextColor(...valueStyle.color);
    doc.text(splitText, 80, yPosition);

    // Ajustar yPosition según el número de líneas del texto
    const lineCount = splitText.length;
    yPosition += 11.3 * lineCount; // Espaciado ajustado a 11 mm por línea
  });

  // Pie de página (sin número de página)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...colorTexto);
  doc.text("Generado por el reclutador Web de MMM.", 30, 290);

  // Guardar el PDF
  const fileName = `Vacante_${data.nombre || "SinNombre"}.pdf`;
  doc.save(fileName);

  // Mostrar alerta de éxito
  mostrarAlertaAdmin("alerta_16");
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
        mostrarAlertaAdmin("alerta_10");
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

        mostrarAlertaAdmin("alerta_12"); // Éxito
      } catch (error) {
        console.error("❌ Error al guardar la cita:", error);
        mostrarAlertaAdmin("alerta_11"); // Error
      }

      // Cerrar el modal
      modalContainer.style.display = "none";
    };

    // Botón de cancelar
    document.getElementById("cancelar_cita").onclick = () => {
      modalContainer.style.display = "none";
      mostrarAlertaAdmin("alerta_15");
    };
  }
  function enviarMensajeWhatsApp(numero, nombre, fecha, hora, sucursal) {
    const mensaje = `Hola, ${nombre}:

    Queremos confirmarte que tu cita para la entrevista ha sido agendada para el ${fecha}, a las ${hora}, en nuestra sucursal de ${sucursal}.
    
    Te pedimos amablemente que asistas puntualmente y que traigas contigo toda la documentación requerida en regla. Si necesitas más información o tienes alguna duda, no dudes en contactarnos.
    
    Estamos muy contentos de conocerte y esperamos contar con tu valiosa participación en este proceso.
    
    ¡Nos vemos pronto!
    
    Saludos cordiales,
    RH MMM Pizza`;
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  }
  mostrarSucursalesDisponibles();
}

function mostrarMensajesUsuarios() {
  const auth = getAuth(app);
  if (!auth.currentUser) {
    document.getElementById("data_mj_user").innerHTML =
      "<p>Necesitas iniciar sesión para ver los mensajes.</p>";
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
  onValue(
    chatMessagesRef,
    (snapshot) => {
      console.log("Datos recibidos desde Firebase:", snapshot.val());
      renderMessages(snapshot);
    },
    (error) => {
      console.error("Error al leer de Firebase:", error);
      dataMjUser.innerHTML =
        "<div class='error'>Error al cargar mensajes</div>";
    }
  );

  // Filtrar mensajes en tiempo real
  filterInput.addEventListener("input", (e) => {
    const filterText = e.target.value.trim();
    onValue(chatMessagesRef, (snapshot) => {
      renderMessages(snapshot, filterText);
    });
  });
}

function mostrarSucursalesDisponibles() {
  const dataSucuUser = document.getElementById("data_sucu_user");
  const filterInput = document.getElementById("sucu_filter");

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

  // Variable para almacenar los datos más recientes de Firebase
  let sucursalesData = null;

  // Función para renderizar las sucursales con filtro
  function renderizarSucursales(sucursales, filtro = "") {
    dataSucuUser.innerHTML = "";

    if (!sucursales) {
      dataSucuUser.innerHTML = "<div class='no_data'></div>";
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

        // Evento para actualizar el estado en Firebase
        checkbox.addEventListener("change", () => {
          const nuevoEstado = checkbox.checked;
          const sucursalRef = ref(database, `disSucu/${nombre}`);

          set(sucursalRef, nuevoEstado)
            .then(() => {
              console.log(`Estado de ${nombre} actualizado a ${nuevoEstado}`);
              mostrarAlertaAdmin("alerta_13");
            })
            .catch((error) => {
              console.error("Error al actualizar estado:", error);
              mostrarAlertaAdmin("alerta_14");
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

  // Escuchar cambios en tiempo real desde Firebase
  onValue(
    disSucuRef,
    (snapshot) => {
      sucursalesData = snapshot.val();
      const currentFilter = filterInput.value.trim();
      renderizarSucursales(sucursalesData, currentFilter); // Renderizar con el filtro actual
    },
    (error) => {
      console.error("Error al leer de Firebase:", error);
      dataSucuUser.innerHTML =
        "<div class='error'>Error al cargar sucursales</div>";
    }
  );

  // Actualizar el filtro en tiempo real
  filterInput.addEventListener("input", (e) => {
    const filtro = e.target.value.trim();
    if (sucursalesData) {
      renderizarSucursales(sucursalesData, filtro); // Renderizar con los datos actuales y el nuevo filtro
    }
  });
}

function mostrarPuestosDisponibles() {
  const dataPuestosUser = document.getElementById("data_puestos_user");
  const filterInput = document.getElementById("puestos_filter");

  if (!dataPuestosUser) {
    console.error("Elemento 'data_puestos_user' no encontrado en el DOM.");
    return;
  }

  if (!filterInput) {
    console.error("Elemento 'puestos_filter' no encontrado en el DOM.");
    return;
  }

  dataPuestosUser.innerHTML = "<p>Cargando puestos...</p>";

  const disSucuRef = ref(database, "disSucu");
  const disPuestosRef = ref(database, "disPuestos");

  let puestosData = null;

  async function cargarPuestosJSON() {
    try {
      const response = await fetch("../json/puestos.json");
      if (!response.ok) {
        throw new Error("No se pudo cargar el archivo puestos.json");
      }
      puestosData = await response.json();
      console.log("Puestos cargados desde JSON:", puestosData);
    } catch (error) {
      console.error("Error al cargar puestos.json:", error);
      dataPuestosUser.innerHTML =
        "<div class='error'>Error al cargar puestos</div>";
    }
  }

  // Función para renderizar sucursales y puestos con filtro
  function renderizarPuestos(sucursales, puestosFirebase, filtro = "") {
    dataPuestosUser.innerHTML = "";

    if (!sucursales || !puestosData) {
      dataPuestosUser.innerHTML = "<div class='no_data'></div>";
      return;
    }

    const fragment = document.createDocumentFragment();
    const ul = document.createElement("ul");
    ul.classList.add("puestos_admin_list");

    // Filtrar y ordenar sucursales
    const sucursalesFiltradas = Object.entries(sucursales)
      .filter(
        ([nombre, disponible]) =>
          disponible && nombre.toLowerCase().includes(filtro.toLowerCase())
      )
      .sort((a, b) => a[0].localeCompare(b[0]));

    if (sucursalesFiltradas.length === 0) {
      dataPuestosUser.innerHTML = "<div class='no_data'></div>";
      return;
    }

    sucursalesFiltradas.forEach(([nombre]) => {
      const li = document.createElement("button");
      li.classList.add("puesto_admin_item");

      // Encabezado con el nombre de la sucursal
      const sucursalHeader = document.createElement("h3");
      sucursalHeader.classList.add("puesto_admin_sucursal");
      sucursalHeader.textContent =
        nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();

      // Contenedor para los puestos
      const puestosList = document.createElement("ul");
      puestosList.classList.add("puestos_admin_items");

      // Crear un elemento por cada puesto
      puestosData.puestos.forEach((puesto) => {
        const puestoLi = document.createElement("li");
        puestoLi.classList.add("puesto_admin_puesto");

        const checkboxId = `checkbox-${nombre}-${puesto.id}`;
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = checkboxId;
        checkbox.classList.add("puesto_admin_checkbox");

        // Obtener estado desde Firebase, default a false si no existe
        const puestoEstado = puestosFirebase?.[nombre]?.[puesto.id] ?? false;
        checkbox.checked = puestoEstado;

        // Nombre del puesto
        const puestoNombre = document.createElement("span");
        puestoNombre.classList.add("puesto_admin_nombre");
        puestoNombre.textContent = puesto.nombre;

        // Círculo clickeable (label vacío)
        const label = document.createElement("label");
        label.htmlFor = checkboxId;
        label.classList.add("puesto_admin_circle");
        label.classList.toggle("disponible", puestoEstado);
        label.classList.toggle("no_disponible", !puestoEstado);

        // Evento para actualizar el estado en Firebase
        checkbox.addEventListener("change", (e) => {
          const nuevoEstado = e.target.checked;
          const puestoRef = ref(database, `disPuestos/${nombre}/${puesto.id}`);

          set(puestoRef, nuevoEstado)
            .then(() => {
              console.log(
                `Estado de ${puesto.nombre} en ${nombre} actualizado a ${nuevoEstado}`
              );
              label.classList.toggle("disponible", nuevoEstado);
              label.classList.toggle("no_disponible", !nuevoEstado);
              mostrarAlertaAdmin("alerta_20");
            })
            .catch((error) => {
              console.error("Error al actualizar estado:", error);
              checkbox.checked = !nuevoEstado; // Revertir cambio en UI
              label.classList.toggle("disponible", !nuevoEstado);
              label.classList.toggle("no_disponible", nuevoEstado);
              mostrarAlertaAdmin("alerta_21");
            });
        });

        const puestoDiv = document.createElement("div");
        puestoDiv.classList.add("puesto_admin_container");
        puestoDiv.appendChild(checkbox);
        puestoDiv.appendChild(puestoNombre);
        puestoDiv.appendChild(label);

        puestoLi.appendChild(puestoDiv);
        puestosList.appendChild(puestoLi);
      });

      li.appendChild(sucursalHeader);
      li.appendChild(puestosList);
      ul.appendChild(li);
    });

    fragment.appendChild(ul);
    dataPuestosUser.appendChild(fragment);
  }

  // Cargar JSON y configurar listeners
  cargarPuestosJSON().then(() => {
    let currentSucursales = null;
    let currentPuestosFirebase = null;
    let currentFilter = filterInput.value.trim();

    // Escuchar cambios en disSucu
    onValue(
      disSucuRef,
      (snapshotSucu) => {
        currentSucursales = snapshotSucu.val();
        renderizarPuestos(
          currentSucursales,
          currentPuestosFirebase,
          currentFilter
        );
      },
      (error) => {
        console.error("Error al leer disSucu de Firebase:", error);
        dataPuestosUser.innerHTML =
          "<div class='error'>Error al cargar sucursales</div>";
      }
    );

    // Escuchar cambios en disPuestos
    onValue(
      disPuestosRef,
      (snapshotPuestos) => {
        currentPuestosFirebase = snapshotPuestos.val() || {};
        renderizarPuestos(
          currentSucursales,
          currentPuestosFirebase,
          currentFilter
        );
      },
      (error) => {
        console.error("Error al leer disPuestos de Firebase:", error);
        dataPuestosUser.innerHTML =
          "<div class='error'>Error al cargar puestos</div>";
      }
    );

    // Actualizar el filtro en tiempo real
    filterInput.addEventListener("input", (e) => {
      currentFilter = e.target.value.trim();
      renderizarPuestos(
        currentSucursales,
        currentPuestosFirebase,
        currentFilter
      );
    });
  });
}

function cargarSucursalesDisponibles() {
  const sucursalSelect = document.getElementById("sucursal");
  if (!sucursalSelect) {
    console.error("❌ No se encontró el select de sucursales.");
    return;
  }

  // Eliminar cualquier personalización previa
  const existingCustomSelect =
    sucursalSelect.parentNode.querySelector(".custom-select");
  if (existingCustomSelect) {
    existingCustomSelect.remove();
  }

  sucursalSelect.style.display = "";

  const disSucuRef = ref(database, "disSucu");

  onValue(disSucuRef, (snapshot) => {
    if (snapshot.exists()) {
      const sucursales = snapshot.val();
      console.log("🔹 Sucursales obtenidas de Firebase:", sucursales);

      // Limpiar opciones y agregar placeholder
      sucursalSelect.innerHTML =
        '<option value="" disabled selected>Sucursal</option>';

      // Agregar sucursales disponibles
      Object.entries(sucursales).forEach(([nombre, disponible]) => {
        if (disponible) {
          const option = document.createElement("option");
          option.value = nombre;
          option.textContent = nombre;
          sucursalSelect.appendChild(option);
        }
      });

      // Personalizar el select después de cargar las opciones
      setTimeout(() => {
        personalizarSelect(sucursalSelect);
      }, 50);

      // Restaurar sucursal guardada en localStorage si existe
      const sucursalGuardada = localStorage.getItem("sucursalSeleccionada");
      if (sucursalGuardada && sucursales[sucursalGuardada]) {
        sucursalSelect.value = sucursalGuardada;
        actualizarPuestosDisponibles(sucursalGuardada);
      }
    } else {
      console.warn("⚠️ No se encontraron sucursales en Firebase.");
      sucursalSelect.innerHTML =
        '<option value="" disabled selected>No hay sucursales disponibles</option>';
    }
  });

  // Evento para guardar la sucursal en localStorage y actualizar puestos
  sucursalSelect.addEventListener("change", () => {
    const sucursalSeleccionada = sucursalSelect.value;
    if (sucursalSeleccionada) {
      localStorage.setItem("sucursalSeleccionada", sucursalSeleccionada);
      console.log(`Sucursal seleccionada guardada: ${sucursalSeleccionada}`);
      actualizarPuestosDisponibles(sucursalSeleccionada);
    } else {
      localStorage.removeItem("sucursalSeleccionada");
      actualizarPuestosDisponibles(null);
    }
  });

  // Observar cambios en las opciones del select
  const observer = new MutationObserver(() => {
    personalizarSelect(sucursalSelect);
  });

  observer.observe(sucursalSelect, { childList: true });
}

function actualizarPuestosDisponibles(sucursal) {
  const puestoSelect = document.getElementById("puesto");
  if (!puestoSelect) {
    console.error("❌ No se encontró el select de puestos.");
    return;
  }

  // Limpiar personalización previa
  const existingCustomSelect =
    puestoSelect.parentNode.querySelector(".custom-select");
  if (existingCustomSelect) {
    existingCustomSelect.remove();
  }

  puestoSelect.style.display = "";

  // Limpiar opciones y agregar placeholder
  puestoSelect.innerHTML = '<option value="" disabled selected>Puesto</option>';

  if (!sucursal) {
    console.log("No hay sucursal seleccionada, limpiando puestos.");
    setTimeout(() => personalizarSelect(puestoSelect), 50);
    return;
  }

  const disPuestosRef = ref(database, `disPuestos/${sucursal}`);
  get(disPuestosRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const puestos = snapshot.val();
        console.log(`Puestos obtenidos para ${sucursal}:`, puestos);

        // Mapear los IDs de puestos a nombres (basado en puestos.json)
        fetch("../json/puestos.json")
          .then((response) => response.json())
          .then((puestosData) => {
            const puestosDisponibles = puestosData.puestos.filter(
              (puesto) => puestos[puesto.id] === true
            );
            puestosDisponibles.forEach((puesto) => {
              const option = document.createElement("option");
              option.value = puesto.nombre;
              option.textContent = puesto.nombre;
              puestoSelect.appendChild(option);
            });

            // Personalizar el select después de cargar las opciones
            setTimeout(() => personalizarSelect(puestoSelect), 50);
          })
          .catch((error) => {
            console.error("Error al cargar puestos.json:", error);
            puestoSelect.innerHTML =
              '<option value="" disabled selected>Error al cargar puestos</option>';
          });
      } else {
        console.warn(`No se encontraron puestos para la sucursal ${sucursal}.`);
        puestoSelect.innerHTML =
          '<option value="" disabled selected>No hay puestos disponibles</option>';
        setTimeout(() => personalizarSelect(puestoSelect), 50);
      }
    })
    .catch((error) => {
      console.error("Error al leer disPuestos de Firebase:", error);
      puestoSelect.innerHTML =
        '<option value="" disabled selected>Error al cargar puestos</option>';
      setTimeout(() => personalizarSelect(puestoSelect), 50);
    });
}

async function seleccionarMesYAno() {
  return new Promise((resolve, reject) => {
    const modal = document.getElementById("modal-month-year");
    const form = document.getElementById("form_select_month_year");
    const selectMonth = document.getElementById("select_month");
    const selectYear = document.getElementById("select_year");
    const confirmBtn = document.getElementById("confirm_month_year");
    const cancelBtn = document.getElementById("cancel_month_year");

    // Verificar que todos los elementos existan
    if (
      !modal ||
      !form ||
      !selectMonth ||
      !selectYear ||
      !confirmBtn ||
      !cancelBtn
    ) {
      console.error(
        "Elementos del modal de selección de mes/año no encontrados."
      );
      mostrarAlertaAdmin("alerta_24");
      reject(new Error("Elementos del modal no encontrados."));
      return;
    }

    // Verificar que los selects estén poblados
    if (selectMonth.options.length === 0 || selectYear.options.length === 0) {
      console.error("Los selects de mes o año están vacíos.");
      mostrarAlertaAdmin("alerta_24");
      reject(new Error("Selects de mes o año vacíos."));
      return;
    }

    // Mostrar el modal
    modal.style.display = "flex";
    modal.style.opacity = "1";
    selectMonth.style.display = "flex";
    selectYear.style.display = "flex";

    // Manejador de submit
    const submitHandler = (e) => {
      e.preventDefault();
      const monthValue = selectMonth.value.trim();
      const yearValue = selectYear.value.trim();

      console.log("Valores en submit - Mes:", monthValue, "Año:", yearValue);

      // Validar que los valores no estén vacíos
      if (!monthValue || !yearValue) {
        console.warn(
          "Campos vacíos detectados - Mes:",
          monthValue,
          "Año:",
          yearValue
        );
        mostrarAlertaAdmin("alerta_10");
        return;
      }

      const month = parseInt(monthValue, 10);
      const year = parseInt(yearValue, 10);

      // Validar que los valores sean números válidos
      if (isNaN(month) || isNaN(year)) {
        console.warn(
          "Mes o año no son números válidos - Mes:",
          monthValue,
          "Año:",
          yearValue
        );
        mostrarAlertaAdmin("alerta_10");
        return;
      }

      // Validar rango de año
      if (year < 2000 || year > 2050) {
        console.warn(`Año fuera de rango: ${year}`);
        mostrarAlertaAdmin("alerta_26");
        return;
      }

      // Validar rango de mes
      if (month < 1 || month > 12) {
        console.warn(`Mes fuera de rango: ${month}`);
        mostrarAlertaAdmin("alerta_10");
        return;
      }

      // Ocultar modal y resolver la promesa
      modal.style.display = "none";
      mostrarAlertaAdmin("alerta_27");
      resolve({ month, year });

      // Limpiar eventos
      form.removeEventListener("submit", submitHandler);
      cancelBtn.removeEventListener("click", cancelHandler);
    };

    // Manejador de cancelación
    const cancelHandler = () => {
      console.log("Selección de mes/año cancelada por el usuario.");
      modal.style.display = "none";
      mostrarAlertaAdmin("alerta_28");
      reject(new Error("Selección cancelada por el usuario."));

      // Limpiar eventos
      form.removeEventListener("submit", submitHandler);
      cancelBtn.removeEventListener("click", cancelHandler);
    };

    // Limpiar eventos previos
    form.removeEventListener("submit", submitHandler);
    cancelBtn.removeEventListener("click", cancelHandler);

    // Asignar eventos
    form.addEventListener("submit", submitHandler);
    confirmBtn.addEventListener("click", () => {
      console.log("Botón Confirmar clicado");
      form.dispatchEvent(new Event("submit"));
    });
    cancelBtn.addEventListener("click", cancelHandler);
  });
}

async function descargarResumenExcel() {
  const auth = getAuth(app);
  if (!auth.currentUser) {
    console.log("Usuario no autenticado, no se pueden descargar datos.");
    mostrarAlertaAdmin("alerta_1");
    return;
  }

  let month, year;
  try {
    ({ month, year } = await seleccionarMesYAno());
    console.log(
      `Valores recibidos en descargarResumenExcel - Mes: ${month}, Año: ${year}`
    ); // Depuración
  } catch (error) {
    console.log("Selección de mes/año cancelada:", error.message);
    mostrarAlertaAdmin("alerta_28"); // Cancelado
    return;
  }

  // Definir referencias a los nodos de Firebase
  const refs = {
    vacantes: ref(database, "vacantes/"),
    citas_vacantes: ref(database, "citas_vacantes/"),
    asistieron: ref(database, "asistieron/"),
    no_asistieron: ref(database, "no_asistieron/"),
    contratado: ref(database, "contratado/"),
    baja: ref(database, "baja/"),
  };

  let todasLasVacantes = [];

  // Función para procesar un snapshot
  function procesarSnapshot(snapshot, categoria) {
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const uniqueKey = childSnapshot.key;
        const data = childSnapshot.val() || {};
        const fechaStr = data.modDate || "";
        let fecha;

        try {
          fecha = new Date(fechaStr);
          if (isNaN(fecha.getTime())) {
            console.warn(`Fecha inválida en ${uniqueKey}: ${fechaStr}`);
            return;
          }
        } catch (error) {
          console.warn(
            `Error al parsear fecha en ${uniqueKey}: ${error.message}`
          );
          return;
        }

        // Filtrar por mes y año
        if (fecha.getMonth() + 1 === month && fecha.getFullYear() === year) {
          todasLasVacantes.push({
            Fecha_Registro: data.fecha_r
              ? new Date(data.fecha_r).toLocaleDateString("es-ES")
              : "No disponible",
            Fecha_Cita: data.fecha_cita
              ? new Date(data.fecha_cita).toLocaleDateString("es-ES")
              : "No disponible",
            Hora_Cita: data.hora_cita || "No disponible",
            Nombre: data.nombre || "No disponible",
            Sexo: data.sexo || "No disponible",
            Puesto: data.puesto || "No disponible",
            Sucursal: data.sucursal || data.sucursal_cita || "No disponible",
            Edad: data.edad || "No disponible",
            Número: data.numero || "No disponible",
            Empleo: data.empleo || "No disponible",
            Ciudad: data.ciudad || "No disponible",
            Categoría: categoria,
            Estatus: data.aptoStatus || "Pendiente",
          });
        }
      });
    }
  }

  try {
    await Promise.all([
      get(refs.vacantes).then((snapshot) =>
        procesarSnapshot(snapshot, "Pendientes")
      ),
      get(refs.citas_vacantes).then((snapshot) =>
        procesarSnapshot(snapshot, "Citas Vacantes")
      ),
      get(refs.asistieron).then((snapshot) =>
        procesarSnapshot(snapshot, "Asistieron")
      ),
      get(refs.no_asistieron).then((snapshot) =>
        procesarSnapshot(snapshot, "No Asistieron")
      ),
      get(refs.contratado).then((snapshot) =>
        procesarSnapshot(snapshot, "Contratado")
      ),
      get(refs.baja).then((snapshot) => procesarSnapshot(snapshot, "Baja")),
    ]);

    if (todasLasVacantes.length === 0) {
      console.log(`No hay vacantes para ${month}/${year}.`);
      mostrarAlertaAdmin("alerta_22");
      return;
    }

    // Crear hoja de trabajo
    const worksheet = XLSX.utils.json_to_sheet(todasLasVacantes, {
      header: [
        "Fecha_Registro",
        "Fecha_Cita",
        "Hora_Cita",
        "Nombre",
        "Sexo",
        "Puesto",
        "Sucursal",
        "Edad",
        "Número",
        "Empleo",
        "Ciudad",
        "Categoría",
        "Estatus",
      ],
    });

    // Ajustar ancho de columnas
    const colWidths = Object.keys(todasLasVacantes[0]).map((key) => ({
      wch: Math.max(
        key.length,
        ...todasLasVacantes.map((row) => String(row[key] || "").length)
      ),
    }));
    worksheet["!cols"] = colWidths;

    // Crear libro de trabajo
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vacantes");

    // Generar nombre del archivo
    const mesFormateado = new Date(year, month - 1).toLocaleString("es-ES", {
      month: "long",
    });
    const mesCapitalizado =
      mesFormateado.charAt(0).toUpperCase() + mesFormateado.slice(1);
    XLSX.writeFile(workbook, `Resumen_${mesCapitalizado}_${year}.xlsx`);

    console.log(`Archivo Excel generado para ${mesCapitalizado} ${year}.`);
    mostrarAlertaAdmin("alerta_23"); // Éxito
  } catch (error) {
    console.error("Error al generar Excel:", error);
    mostrarAlertaAdmin("alerta_24"); // Error
  }
}

// Registrar plugin ChartDataLabels
if (typeof Chart !== "undefined" && typeof ChartDataLabels !== "undefined") {
  Chart.register(ChartDataLabels);
}

// Variable para rastrear el gráfico actual
let currentChart = null;

// Función para generar gráfico de pastel
async function generarGraficoPastel(data, title, ctx) {
  return new Promise((resolve, reject) => {
    // Validar datos
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) {
      reject(new Error("No hay datos para generar el gráfico de pastel"));
      return;
    }

    // Destruir gráfico anterior si existe
    if (currentChart) {
      console.log("Destruyendo gráfico anterior en generarGraficoPastel");
      currentChart.destroy();
      currentChart = null;
    }

    // Crear el gráfico
    currentChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: [
          "Contratados",
          "Bajas",
          "Asistieron",
          "No Asistieron",
          "Citas",
          "Pendientes",
        ],
        datasets: [
          {
            data: [
              data.contratados,
              data.baja,
              data.asistieron,
              data.no_asistieron,
              data.citas,
              data.vacantes,
            ],
            backgroundColor: [
              "#4CAF50",
              "#F44336",
              "#2196F3",
              "#FFCA28",
              "#B0BEC5",
              "#1E88E5",
            ],
            borderColor: "#FFFFFF",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false, // Desactivar animaciones para renderizado inmediato
        plugins: {
          title: {
            display: true,
            text: title,
            font: { family: "Helvetica", size: 22, weight: "bold" },
            color: "#333333",
            padding: { top: 10, bottom: 20 },
          },
          legend: {
            display: true,
            position: "right",
            labels: {
              font: { family: "Helvetica", size: 14 },
              color: "#333333",
              padding: 15,
              usePointStyle: true,
              pointStyle: "circle",
            },
          },
          tooltip: {
            enabled: false, // Desactivar tooltips para PDF
          },
          datalabels: {
            display: true,
            color: "#FFFFFF",
            font: { family: "Helvetica", size: 12, weight: "bold" },
            formatter: (value, context) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return value > 0 ? `${percentage}%` : "";
            },
          },
        },
      },
    });

    // Capturar la imagen inmediatamente
    try {
      const image = ctx.canvas.toDataURL("image/png");
      console.log("Imagen de pastel generada:", image.substring(0, 50));
      currentChart.destroy();
      currentChart = null;
      resolve(image);
    } catch (error) {
      currentChart.destroy();
      currentChart = null;
      reject(error);
    }
  });
}

// Función para generar gráfico de barras
async function generarGraficoBarras(data, title, ctx) {
  return new Promise((resolve, reject) => {
    // Validar datos
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) {
      reject(new Error("No hay datos para generar el gráfico de barras"));
      return;
    }

    // Destruir gráfico anterior si existe
    if (currentChart) {
      console.log("Destruyendo gráfico anterior en generarGraficoBarras");
      currentChart.destroy();
      currentChart = null;
    }

    // Crear el gráfico
    currentChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          "Contratados",
          "Bajas",
          "Asistieron",
          "No Asistieron",
          "Citas",
          "Pendientes",
        ],
        datasets: [
          {
            label: "Estadísticas",
            data: [
              data.contratados,
              data.baja,
              data.asistieron,
              data.no_asistieron,
              data.citas,
              data.vacantes,
            ],
            backgroundColor: [
              "#4CAF50",
              "#F44336",
              "#2196F3",
              "#FFCA28",
              "#B0BEC5",
              "#1E88E5",
            ],
            borderColor: [
              "#388E3C",
              "#D32F2F",
              "#1976D2",
              "#FFB300",
              "#90A4AE",
              "#1565C0",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false, // Desactivar animaciones para renderizado inmediato
        plugins: {
          title: {
            display: true,
            text: title,
            font: { family: "Helvetica", size: 22, weight: "bold" },
            color: "#333333",
            padding: { top: 10, bottom: 20 },
          },
          legend: { display: false },
          tooltip: { enabled: false }, // Desactivar tooltips para PDF
          datalabels: {
            display: true,
            color: "#333333",
            font: { family: "Helvetica", size: 12, weight: "bold" },
            anchor: "end",
            align: "top",
            formatter: (value) => (value > 0 ? value : ""),
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Cantidad",
              font: { family: "Helvetica", size: 14, weight: "bold" },
              color: "#333333",
            },
            ticks: {
              font: { family: "Helvetica", size: 12 },
              color: "#333333",
            },
            grid: { color: "rgba(0, 0, 0, 0.1)" },
          },
          x: {
            title: {
              display: true,
              text: "Categoría",
              font: { family: "Helvetica", size: 14, weight: "bold" },
              color: "#333333",
            },
            ticks: {
              font: { family: "Helvetica", size: 12 },
              color: "#333333",
            },
            grid: { display: false },
          },
        },
        elements: { bar: { borderRadius: 4 } },
      },
    });

    // Capturar la imagen inmediatamente
    try {
      const image = ctx.canvas.toDataURL("image/png");
      console.log("Imagen de barras generada:", image.substring(0, 50));
      currentChart.destroy();
      currentChart = null;
      resolve(image);
    } catch (error) {
      currentChart.destroy();
      currentChart = null;
      reject(error);
    }
  });
}

// Función principal para generar el PDF
async function generarEstadisticasPDF() {
  const auth = getAuth(app);
  if (!auth.currentUser) {
    console.log("Usuario no autenticado, no se pueden generar estadísticas.");
    mostrarAlertaAdmin("alerta_1");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let month, year;
  try {
    ({ month, year } = await seleccionarMesYAno());
    console.log(
      `Valores recibidos en generarEstadisticasPDF - Mes: ${month}, Año: ${year}`
    );
  } catch (error) {
    console.log("Selección de mes/año cancelada:", error.message);
    mostrarAlertaAdmin("alerta_28");
    return;
  }

  // Estilos
  const colorTitulo = [23, 72, 145];
  const colorTexto = [60, 60, 60];
  const colorFondo = [245, 245, 245];
  const colorRecuadro = [230, 230, 230];

  // Obtener datos de Firebase
  const refs = {
    vacantes: ref(database, "vacantes/"),
    citas_vacantes: ref(database, "citas_vacantes/"),
    asistieron: ref(database, "asistieron/"),
    no_asistieron: ref(database, "no_asistieron/"),
    contratado: ref(database, "contratado/"),
    baja: ref(database, "baja/"),
  };

  let estadisticasPorSucursal = {};
  let estadisticasTotales = {
    contratados: 0,
    asistieron: 0,
    no_asistieron: 0,
    citas: 0,
    vacantes: 0,
    baja: 0,
  };

  function procesarSnapshot(snapshot, categoria) {
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val() || {};
        const fechaStr = data.modDate || "";
        let fecha;

        try {
          fecha = new Date(fechaStr);
          if (isNaN(fecha.getTime())) return;
        } catch (error) {
          console.warn(`Error al parsear fecha: ${error.message}`);
          return;
        }

        if (fecha.getMonth() + 1 === month && fecha.getFullYear() === year) {
          const sucursal =
            data.sucursal || data.sucursal_cita || "Sin Sucursal";
          if (!estadisticasPorSucursal[sucursal]) {
            estadisticasPorSucursal[sucursal] = {
              contratados: 0,
              asistieron: 0,
              no_asistieron: 0,
              citas: 0,
              vacantes: 0,
              baja: 0,
            };
          }

          switch (categoria) {
            case "Contratado":
              estadisticasPorSucursal[sucursal].contratados++;
              estadisticasTotales.contratados++;
              break;
            case "Asistieron":
              estadisticasPorSucursal[sucursal].asistieron++;
              estadisticasTotales.asistieron++;
              break;
            case "No Asistieron":
              estadisticasPorSucursal[sucursal].no_asistieron++;
              estadisticasTotales.no_asistieron++;
              break;
            case "Citas Vacantes":
              estadisticasPorSucursal[sucursal].citas++;
              estadisticasTotales.citas++;
              break;
            case "Vacantes":
              estadisticasPorSucursal[sucursal].vacantes++;
              estadisticasTotales.vacantes++;
              break;
            case "Baja":
              estadisticasPorSucursal[sucursal].baja++;
              estadisticasTotales.baja++;
              break;
          }
        }
      });
    }
  }

  try {
    await Promise.all([
      get(refs.vacantes).then((snapshot) =>
        procesarSnapshot(snapshot, "Vacantes")
      ),
      get(refs.citas_vacantes).then((snapshot) =>
        procesarSnapshot(snapshot, "Citas Vacantes")
      ),
      get(refs.asistieron).then((snapshot) =>
        procesarSnapshot(snapshot, "Asistieron")
      ),
      get(refs.no_asistieron).then((snapshot) =>
        procesarSnapshot(snapshot, "No Asistieron")
      ),
      get(refs.contratado).then((snapshot) =>
        procesarSnapshot(snapshot, "Contratado")
      ),
      get(refs.baja).then((snapshot) => procesarSnapshot(snapshot, "Baja")),
    ]);

    if (Object.keys(estadisticasPorSucursal).length === 0) {
      console.log(`No hay datos para ${month}/${year}.`);
      mostrarAlertaAdmin("alerta_22");
      return;
    }
  } catch (error) {
    console.error("Error al obtener datos:", error);
    mostrarAlertaAdmin("alerta_24");
    return;
  }

  console.log("Estadísticas totales:", estadisticasTotales);
  console.log("Estadísticas por sucursal:", estadisticasPorSucursal);

  // Crear canvas para gráficos
  let canvas = document.getElementById("chartCanvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "chartCanvas";
    canvas.style.display = "none"; // Cambia a "block" para depuración
    canvas.width = 800;
    canvas.height = 500;
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext("2d");

  // Función para limpiar canvas
  function limpiarCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    // Asegurar que no haya gráfico activo
    if (currentChart) {
      console.log("Limpieza adicional: destruyendo gráfico activo");
      currentChart.destroy();
      currentChart = null;
    }
  }

  // Portada
  const mesFormateado = new Date(year, month - 1).toLocaleString("es-ES", {
    month: "long",
  });
  const mesCapitalizado =
    mesFormateado.charAt(0).toUpperCase() + mesFormateado.slice(1);
  doc.setFillColor(...colorFondo);
  doc.rect(0, 0, 210, 297, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(...colorTitulo);
  doc.text(`Estadísticas - ${mesCapitalizado} ${year}`, 105, 140, {
    align: "center",
    maxWidth: 160,
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.setTextColor(...colorTexto);
  doc.text("Reclutador Web MMM", 105, 160, { align: "center" });
  doc.setFontSize(12);
  doc.text(`Generado el ${new Date().toLocaleDateString("es-ES")}`, 105, 180, {
    align: "center",
  });

  // Resumen General
  doc.addPage();
  doc.setFillColor(...colorFondo);
  doc.rect(0, 0, 210, 297, "F");
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(15, 15, 180, 260, 5, 5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...colorTitulo);
  doc.text("Resumen General", 105, 30, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...colorTexto);
  doc.text(`Estadísticas globales para ${mesCapitalizado} ${year}`, 105, 40, {
    align: "center",
  });
  doc.line(15, 45, 195, 45);

  // Datos numéricos en un recuadro
  doc.setFillColor(...colorRecuadro);
  doc.roundedRect(20, 50, 170, 80, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...colorTexto);
  let yPosition = 60;
  const stats = [
    { label: "Total Contratados", value: estadisticasTotales.contratados },
    { label: "Total Bajas", value: estadisticasTotales.baja },
    { label: "Total Asistieron", value: estadisticasTotales.asistieron },
    { label: "Total No Asistieron", value: estadisticasTotales.no_asistieron },
    { label: "Total Citas", value: estadisticasTotales.citas },
    { label: "Total Pendientes", value: estadisticasTotales.vacantes },
  ];

  stats.forEach((stat) => {
    doc.setFont("helvetica", "normal");
    doc.text(`${stat.label}:`, 25, yPosition);
    doc.setFont("helvetica", "bold");
    doc.text(`${stat.value}`, 100, yPosition);
    yPosition += 12;
  });

  // Gráfico de pastel
  try {
    const total = Object.values(estadisticasTotales).reduce((a, b) => a + b, 0);
    if (total === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(12);
      doc.setTextColor(255, 0, 0);
      doc.text("No hay datos suficientes para el gráfico de pastel.", 30, 140);
    } else {
      limpiarCanvas();
      const pastelGeneral = await generarGraficoPastel(
        estadisticasTotales,
        `Distribución General - ${mesCapitalizado} ${year}`,
        ctx
      );
      console.log("Imagen de pastel:", pastelGeneral.substring(0, 50));
      doc.addImage(pastelGeneral, "PNG", 30, 140, 150, 100);
    }
  } catch (error) {
    console.error("Error al generar gráfico de pastel:", error);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.setTextColor(255, 0, 0);
    doc.text("No se pudo generar el gráfico de pastel.", 30, 140);
  }

  // Estadísticas por Sucursal
  const sucursales = Object.keys(estadisticasPorSucursal).sort();
  for (const sucursal of sucursales) {
    doc.addPage();
    doc.setFillColor(...colorFondo);
    doc.rect(0, 0, 210, 297, "F");
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(15, 15, 180, 260, 5, 5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...colorTitulo);
    doc.text(`Estadísticas - ${sucursal}`, 105, 30, {
      align: "center",
      maxWidth: 170,
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(...colorTexto);
    doc.text(`${mesCapitalizado} ${year}`, 105, 40, { align: "center" });
    doc.line(15, 45, 195, 45);

    // Datos numéricos en un recuadro
    doc.setFillColor(...colorRecuadro);
    doc.roundedRect(20, 50, 170, 80, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...colorTexto);
    yPosition = 60;
    const statsSucursal = [
      {
        label: "Contratados",
        value: estadisticasPorSucursal[sucursal].contratados,
      },
      { label: "Bajas", value: estadisticasPorSucursal[sucursal].baja },
      {
        label: "Asistieron",
        value: estadisticasPorSucursal[sucursal].asistieron,
      },
      {
        label: "No Asistieron",
        value: estadisticasPorSucursal[sucursal].no_asistieron,
      },
      { label: "Citas", value: estadisticasPorSucursal[sucursal].citas },
      {
        label: "Pendientes",
        value: estadisticasPorSucursal[sucursal].vacantes,
      },
    ];

    statsSucursal.forEach((stat) => {
      doc.setFont("helvetica", "normal");
      doc.text(`${stat.label}:`, 25, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(`${stat.value}`, 100, yPosition);
      yPosition += 12;
    });

    // Gráfico de barras
    try {
      const total = Object.values(estadisticasPorSucursal[sucursal]).reduce(
        (a, b) => a + b,
        0
      );
      if (total === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(12);
        doc.setTextColor(255, 0, 0);
        doc.text(
          `No hay datos suficientes para el gráfico de barras de ${sucursal}.`,
          30,
          140
        );
      } else {
        limpiarCanvas();
        const barrasSucursal = await generarGraficoBarras(
          estadisticasPorSucursal[sucursal],
          `Estadísticas de ${sucursal} - ${mesCapitalizado} ${year}`,
          ctx
        );
        console.log(
          "Imagen de barras para",
          sucursal,
          ":",
          barrasSucursal.substring(0, 50)
        );
        doc.addImage(barrasSucursal, "PNG", 30, 140, 150, 100);
      }
    } catch (error) {
      console.error(
        `Error al generar gráfico de barras para ${sucursal}:`,
        error
      );
      doc.setFont("helvetica", "italic");
      doc.setFontSize(12);
      doc.setTextColor(255, 0, 0);
      doc.text(
        `No se pudo generar el gráfico de barras para ${sucursal}.`,
        30,
        140
      );
    }
  }

  // Pie de página en todas las páginas
  for (let i = 1; i <= doc.getNumberOfPages(); i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...colorTexto);
    doc.text(`Página ${i} de ${doc.getNumberOfPages()}`, 180, 290, {
      align: "right",
    });
    doc.text("Reclutador Web MMM", 30, 290);
  }

  try {
    doc.save(`Estadisticas_${mesCapitalizado}_${year}.pdf`);
    console.log(`PDF generado para ${mesCapitalizado} ${year}.`);
    mostrarAlertaAdmin("alerta_25");
  } catch (error) {
    console.error("Error al guardar PDF:", error);
    mostrarAlertaAdmin("alerta_24");
  }
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
    "baja",
    "citas_vacantes",
  ];
  let antiguaRef = null;

  // Obtener la fecha actual
  const fechaActual = new Date().toISOString().split("T")[0];

  // Buscar la referencia anterior y actualizar modDate
  Promise.all(
    bases.map((base) =>
      get(ref(database, `${base}/${uniqueKey}`)).then((snapshot) => {
        if (snapshot.exists()) {
          antiguaRef = ref(database, `${base}/${uniqueKey}`);
          // Actualizar modDate en la base de datos original
          return update(antiguaRef, { modDate: fechaActual });
        }
      })
    )
  )
    .then(() => {
      if (!antiguaRef) {
        console.error(
          `❌ No se encontró la referencia anterior de "${uniqueKey}".`
        );
        mostrarAlertaAdmin("alertaMan_18");
        mostrarAlertaAdmin("alerta_5");
        return;
      }

      // Crear datos actualizados con el nuevo modDate
      const datosActualizados = { ...data, modDate: fechaActual };

      // Mover el dato si no existe en el destino
      get(nuevaRef).then((snapshot) => {
        if (snapshot.exists()) {
          console.warn(`⚠️ El vacante "${uniqueKey}" ya está en ${nuevaDB}.`);
          mostrarAlertaAdmin("alerta_9");
        } else {
          set(nuevaRef, datosActualizados)
            .then(() => remove(antiguaRef))
            .then(() => {
              console.log(`✅ Vacante "${uniqueKey}" movida a ${nuevaDB}`);
              mostrarAlertaAdmin("alerta_6");
              mostrarDatos();
            })
            .catch((error) => {
              console.error("❌ Error al mover vacante:", error);
              mostrarAlertaAdmin("alerta_5");
            });
        }
      });
    })
    .catch((error) => {
      console.error("❌ Error al actualizar o mover vacante:", error);
      mostrarAlertaAdmin("alerta_5");
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
function eliminarVacante(uniqueKey, base, data) {
  mostrarAlertaPersonalizada(
    `¿Estás seguro de eliminar al vacante "${data?.nombre || uniqueKey}"? 🧐`,
    (confirmado) => {
      if (!confirmado) {
        mostrarAlertaAdmin("alerta_8");
        return;
      }

      // Mapa de rutas según la base
      const rutas = {
        vacantes: `vacantes/${uniqueKey}`,
        asistieron: `asistieron/${uniqueKey}`,
        no_asistieron: `no_asistieron/${uniqueKey}`,
        contratado: `contratado/${uniqueKey}`,
        baja: `baja/${uniqueKey}`,
        citas_vacantes: `citas_vacantes/${uniqueKey}`,
      };

      const ruta = rutas[base] || `vacantes/${uniqueKey}`; // Default a vacantes
      console.log(`Intentando eliminar: ${ruta}`);

      const refVacante = ref(database, ruta);

      remove(refVacante)
        .then(() => {
          console.log(`Vacante eliminada de ${ruta}`);
          mostrarAlertaAdmin("alerta_7");
          mostrarDatos(); // Actualizar la interfaz después de eliminar
        })
        .catch((error) => {
          console.error("Error al eliminar vacante:", error);
          mostrarAlertaAdmin("alerta_5");
        });
    }
  );
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
  console.log(
    `Regresando al login ${isManager ? "manager" : "admin"} - Inicio`
  );

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

  // Forzar visibilidad del contenedor de login
  const loginContainer = isManager
    ? document.getElementById("Logincont_sucu")
    : document.getElementById("Logincont");
  if (loginContainer) {
    loginContainer.style.display = "flex";
    loginContainer.style.opacity = "1";
    console.log(
      `Contenedor ${
        isManager ? "Logincont_sucu" : "Logincont"
      } restaurado a display: flex`
    );
  }

  console.log("Llamando a mostrarBotonEntrar...");
  mostrarBotonEntrar(tipo);
  setThemeColor("#e36b2f");

  console.log(`Regresando al login ${isManager ? "manager" : "admin"} - Fin`);
}

async function mostrarTextoPavoPorDefecto() {
  const textWelcomeAdmin = document.getElementById("text_welcome_admin");
  const textWelcomeAdmin2 = document.getElementById("text_welcome_admin2");
  if (!textWelcomeAdmin) {
    console.error("Elemento #text_welcome_admin no encontrado.");
    return;
  }

  const alertasData = await cargarAlertasJSON();
  if (!alertasData || !alertasData.intents) {
    console.error("No se pudieron cargar los intents del JSON.");
    return;
  }

  const pavoIntent = alertasData.intents.find(
    (i) => i.tag === "palabras_pavo_admin"
  );
  if (!pavoIntent) {
    console.warn(
      "Intent con tag palabras_pavo_admin no encontrado en el JSON."
    );
    return;
  }

  const userName = localStorage.getItem("userNameAdmin") || "Humano";
  const pavoResponses = pavoIntent.responses;
  const randomPavo =
    pavoResponses[Math.floor(Math.random() * pavoResponses.length)];
  const mensajePavo = randomPavo.replace("${userName}", userName);
  textWelcomeAdmin.textContent = mensajePavo;
  textWelcomeAdmin2.textContent = mensajePavo;
  textWelcomeAdmin.style.display = "block";
  textWelcomeAdmin2.style.display = "block";
}

async function mostrarAlertaAdmin(alertaId) {
  const textWelcomeAdmin = document.getElementById("text_welcome_admin");
  const textWelcomeAdmin2 = document.getElementById("text_welcome_admin2");
  if (!textWelcomeAdmin) {
    console.error("Elemento #text_welcome_admin no encontrado.");
    return;
  }

  const alertasData = await cargarAlertasJSON();
  if (!alertasData || !alertasData.intents) {
    console.error("No se pudieron cargar los intents del JSON.");
    return;
  }

  // Mostrar mensaje específico si alertaId existe
  if (alertaId) {
    const intent = alertasData.intents.find((i) => i.tag === alertaId);
    if (intent) {
      const userName = localStorage.getItem("userNameAdmin") || "Humano";
      const responses = intent.responses;
      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];
      const mensaje = randomResponse.replace("${userName}", userName);
      textWelcomeAdmin.textContent = mensaje;
      textWelcomeAdmin.style.display = "block";
      textWelcomeAdmin2.textContent = mensaje;
      textWelcomeAdmin2.style.display = "block";

      // Volver a texto por defecto después de 3 segundos
      setTimeout(() => {
        mostrarTextoPavoPorDefecto();
      }, 3000);
    } else {
      console.warn(`Intent con tag ${alertaId} no encontrado en el JSON.`);
      mostrarTextoPavoPorDefecto();
    }
  } else {
    // Si no hay alertaId, mostrar texto por defecto
    mostrarTextoPavoPorDefecto();
  }
}

async function cargarAlertasJSON() {
  try {
    const response = await fetch("../json/pavoAdmin.json");
    if (!response.ok) {
      throw new Error("No se pudo cargar el archivo alertas.json");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al cargar alertas.json:", error);
    return null;
  }
}

function abrirModalUserInfo() {
  const modalUserInfo = document.getElementById("modal-user-info");
  const userNameDisplay = document.getElementById("user-name-display");
  const userNameDisplayCont = document.getElementById("user-name-display-cont");
  const employeeNumberDisplay = document.getElementById(
    "employee-number-display"
  );
  const employeeNumberDisplayCont = document.getElementById(
    "employee-number-display-cont"
  );
  const editNameBtn = document.getElementById("edit-name-btn");
  const editNameContainer = document.getElementById("edit-name-container");
  const editNameInput = document.getElementById("edit-name-input");
  const saveNameBtn = document.getElementById("save-name-btn");
  const cancelEditNameBtn = document.getElementById("cancel-edit-name-btn");
  const editEmployeeBtn = document.getElementById("edit-employee-btn");
  const editEmployeeContainer = document.getElementById(
    "edit-employee-container"
  );
  const editEmployeeInput = document.getElementById("edit-employee-input");
  const saveEmployeeBtn = document.getElementById("save-employee-btn");
  const cancelEditEmployeeBtn = document.getElementById(
    "cancel-edit-employee-btn"
  );
  const closeModalBtn = document.getElementById("close-user-modal");

  if (!modalUserInfo || !userNameDisplay || !employeeNumberDisplay) {
    console.error("❌ Elementos del modal de usuario no encontrados.");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    console.log("Usuario no autenticado, no se puede mostrar información.");
    return;
  }

  // Inicializar estados por defecto
  userNameDisplayCont.style.display = "flex";
  userNameDisplay.style.display = "flex";
  editNameBtn.style.display = "flex";
  editNameContainer.style.display = "none";
  employeeNumberDisplay.style.display = "flex";
  editEmployeeBtn.style.display = "flex";
  editEmployeeContainer.style.display = "none";

  // Cargar datos desde Firebase
  const userRef = ref(database, `users/${user.uid}`);
  get(userRef)
    .then((snapshot) => {
      const data = snapshot.val() || {};
      userNameDisplay.textContent = data.displayName || "No especificado";
      employeeNumberDisplay.textContent =
        data.employeeNumber || "No especificado";
      // Cargar nombre desde localStorage si existe, de lo contrario usar el de Firebase
      const storedName =
        localStorage.getItem("userNameAdmin") ||
        data.displayName ||
        "No especificado";
      userNameDisplay.textContent = storedName;
      modalUserInfo.style.display = "flex";
    })
    .catch((error) => {
      console.error("Error al cargar datos del usuario:", error);
    });

  // Manejar edición del nombre
  editNameBtn.onclick = () => {
    userNameDisplayCont.style.display = "none";
    userNameDisplay.style.display = "none";
    editNameBtn.style.display = "none";
    editNameContainer.style.display = "flex";
    editNameInput.value =
      userNameDisplay.textContent === "No especificado"
        ? ""
        : userNameDisplay.textContent;
    editNameInput.focus();
  };

  cancelEditNameBtn.onclick = () => {
    userNameDisplayCont.style.display = "flex";
    userNameDisplay.style.display = "flex";
    editNameBtn.style.display = "flex";
    editNameContainer.style.display = "none";
    editNameInput.value = "";
  };

  saveNameBtn.onclick = () => {
    const newName = editNameInput.value.trim();
    if (!newName) {
      return;
    }

    get(userRef)
      .then((snapshot) => {
        const currentData = snapshot.val() || {};
        return set(userRef, { ...currentData, displayName: newName });
      })
      .then(() => {
        console.log(`Nombre actualizado a ${newName}`);
        userNameDisplay.textContent = newName;
        localStorage.setItem("userNameAdmin", newName);
        userNameDisplayCont.style.display = "flex";
        userNameDisplay.style.display = "flex";
        editNameBtn.style.display = "flex";
        editNameContainer.style.display = "none";
        editNameInput.value = "";
        mostrarAlertaAdmin("alerta_2");
      })
      .catch((error) => {
        console.error("Error al actualizar el nombre:", error);
      });
  };

  // Manejar edición del número de empleado (sin cambios, asumiendo que funciona)
  editEmployeeBtn.onclick = () => {
    employeeNumberDisplayCont.style.display = "none";
    employeeNumberDisplay.style.display = "none";
    editEmployeeBtn.style.display = "none";
    editEmployeeContainer.style.display = "flex";
    editEmployeeInput.value =
      employeeNumberDisplay.textContent === "No especificado"
        ? ""
        : employeeNumberDisplay.textContent;
    editEmployeeInput.focus();
  };

  cancelEditEmployeeBtn.onclick = () => {
    employeeNumberDisplayCont.style.display = "flex";
    employeeNumberDisplay.style.display = "flex";
    editEmployeeBtn.style.display = "flex";
    editEmployeeContainer.style.display = "none";
    editEmployeeInput.value = "";
  };

  saveEmployeeBtn.onclick = () => {
    const newEmployeeNumber = editEmployeeInput.value.trim();
    if (!newEmployeeNumber) {
      mostrarAlerta("alertas");
      mostrarAlerta("alertapreguntaerror_1");
      return;
    }

    get(userRef)
      .then((snapshot) => {
        const currentData = snapshot.val() || {};
        return set(userRef, {
          ...currentData,
          employeeNumber: newEmployeeNumber,
        });
      })
      .then(() => {
        console.log(`Número de empleado actualizado a ${newEmployeeNumber}`);
        employeeNumberDisplay.textContent = newEmployeeNumber;
        employeeNumberDisplayCont.style.display = "flex";
        employeeNumberDisplay.style.display = "flex";
        editEmployeeBtn.style.display = "flex";
        editEmployeeContainer.style.display = "none";
        editEmployeeInput.value = "";
        mostrarAlertaAdmin("alerta_17");
      })
      .catch((error) => {
        console.error(
          "Error al actualizar пришлось el número de empleado:",
          error
        );
      });
  };

  // Cerrar el modal
  closeModalBtn.onclick = () => {
    modalUserInfo.style.display = "none";
    userNameDisplay.style.display = "inline";
    editNameBtn.style.display = "inline";
    editNameContainer.style.display = "none";
    editNameInput.value = "";
    employeeNumberDisplay.style.display = "inline";
    editEmployeeBtn.style.display = "inline";
    editEmployeeContainer.style.display = "none";
    editEmployeeInput.value = "";
  };
}

// Cargar nombre personalizado al iniciar sesión
onAuthStateChanged(auth, (user) => {
  if (user) {
    const userRef = ref(database, `users/${user.uid}`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.displayName) {
        console.log(`Nombre personalizado cargado: ${data.displayName}`);
        // Podrías actualizar otros elementos de la UI si es necesario
      }
    });
  }
});

// Variable global para almacenar las sucursales
let sucursalesData = null;

// Función para cargar el JSON
async function cargarSucursalesJSON() {
  try {
    const response = await fetch("../json/sucursales.json"); // Ajusta la ruta según tu estructura
    if (!response.ok) {
      throw new Error("No se pudo cargar el archivo sucursales.json");
    }
    sucursalesData = await response.json();
    console.log("Sucursales cargadas desde JSON:", sucursalesData);
  } catch (error) {
    console.error("Error al cargar sucursales.json:", error);
  }
}

// Modificación de iniciarSesion
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

  const mostrarError = (errorElement, mensaje) => {
    console.log(`Mostrando error: ${mensaje}`);
    form.classList.remove("activolog");
    errorElement.classList.add("activolog");
    form.classList.add("animacionform");

    setTimeout(() => {
      errorElement.classList.remove("activolog");
      form.classList.remove("animacionform");
      form.classList.add("activolog");
    }, 3000);
  };

  if (!userInput || !passInput) {
    console.log("Campos vacíos detectados");
    mostrarAlerta("alertas");
    mostrarAlerta("alerta_1");
    return;
  }

  console.log(
    `Intentando iniciar sesión con email: ${email}, contraseña: ${passInput}`
  );

  signInWithEmailAndPassword(auth, email, passInput)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("Inicio de sesión exitoso:", user.email);

      // Asegurarse de que sucursalesData esté cargado
      if (!sucursalesData) {
        console.error("Datos de sucursales no cargados aún");
        mostrarError(errorall, "Error interno: Sucursales no cargadas");
        return;
      }

      // Configurar almacenamiento local según el tipo de usuario
      if (isManager) {
        localStorage.removeItem("isAdminLoggedIn");
        if (!sucursalesData.sucursalesValidas.includes(userInput)) {
          console.log(`Usuario ${userInput} no válido para manager`);
          localStorage.removeItem("sucursal");
          mostrarError(erroru, "Usuario no válido para manager");
          return;
        }
        localStorage.setItem("sucursal", userInput);
        localStorage.setItem("isManagerLoggedIn", "true");
        localStorage.setItem("redirectAfterLogin", "manager");
      } else {
        localStorage.removeItem("isManagerLoggedIn");
        localStorage.removeItem("sucursal");
        if (sucursalesData.sucursalesInvalidas.includes(userInput)) {
          console.log(`Usuario ${userInput} no válido para admin`);
          mostrarError(erroru, "Usuario no válido para admin");
          return;
        }
        localStorage.setItem("isAdminLoggedIn", "true");
        localStorage.setItem("redirectAfterLogin", "admin");
      }

      // Mostrar animación y recargar la página
      login.classList.add("animacionlog");
      console.log("Animación iniciada, preparando recarga...");

      setTimeout(() => {
        console.log("Recargando página...");
        window.location.reload();
      }, 2000);
    })
    .catch((error) => {
      console.error("Error en inicio de sesión:", error.code, error.message);
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-email"
      ) {
        mostrarError(erroru, "Usuario no encontrado o email inválido");
      } else if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        mostrarError(errorp, "Contraseña incorrecta");
      } else {
        mostrarError(errorall, `Error desconocido: ${error.message}`);
      }
    })
    .finally(() => {
      console.log("Proceso de inicio de sesión finalizado");
    });
};

// Actualizar mostrarBotonEntrar para mostrar el botón y redirigir sin recargar
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

  const updateUI = (user, useLocalStorage = false) => {
    const isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
    const isManagerLoggedIn =
      localStorage.getItem("isManagerLoggedIn") === "true";
    const currentUserType = isAdminLoggedIn
      ? "admin"
      : isManagerLoggedIn
      ? "manager"
      : null;

    const shouldShowButton = useLocalStorage
      ? currentUserType === tipo
      : user && currentUserType === tipo;

    if (shouldShowButton) {
      console.log(
        `Usuario autenticado detectado para ${tipo}: ${
          user ? user.email : "desde localStorage"
        }`
      );
      form.style.display = "none";
      loginContainer.style.display = "flex";
      loginContainer.style.opacity = "1";

      let entrarBtn = loginContainer.querySelector(".entrar-btn");
      if (!entrarBtn) {
        console.log(`Creando botón Entrar para ${tipo}...`);
        entrarBtn = document.createElement("button");
        entrarBtn.classList.add("entrar-btn");
        entrarBtn.textContent = "Entrar";
        entrarBtn.style.display = "block";
        entrarBtn.style.opacity = "1";
        entrarBtn.addEventListener("click", () => {
          console.log(`Botón Entrar clicado para ${tipo}`);

          // Redirigir sin recargar la página
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

          mostrarAlertaAdmin("alerta_4");
          setThemeColor("#2a4566");
          updateUnreadChatsCount();

          if (isManager) {
            updateUnreadMessagesCount();
            const sucursalActivaElement =
              document.getElementById("sucursal_activa");
            const sucursalGuardada = localStorage.getItem("sucursal");
            if (sucursalActivaElement && sucursalGuardada) {
              const sucursalFormateada =
                sucursalGuardada.charAt(0).toUpperCase() +
                sucursalGuardada.slice(1).toLowerCase();
              sucursalActivaElement.textContent = sucursalFormateada;
            }
          }

          mostrarDatos();
          mostrarMensajesUsuarios();
        });
        loginContainer.appendChild(entrarBtn);
      } else {
        entrarBtn.style.display = "block";
        entrarBtn.style.opacity = "1";
      }

      if (otherLoginContainer) {
        const otherEntrarBtn = otherLoginContainer.querySelector(".entrar-btn");
        if (otherEntrarBtn) otherEntrarBtn.style.display = "none";
        const otherLoginCont = otherLoginContainer.querySelector(".login-cont");
        if (otherLoginCont) otherLoginCont.style.display = "flex";
      }
    } else {
      console.log(`No hay usuario autenticado o tipo no coincide para ${tipo}`);
      form.style.display = "flex";
      const entrarBtn = loginContainer.querySelector(".entrar-btn");
      if (entrarBtn) entrarBtn.style.display = "none";
      loginContainer.style.display = "flex";
    }
  };

  // Renderizado inicial con localStorage
  const isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
  const isManagerLoggedIn =
    localStorage.getItem("isManagerLoggedIn") === "true";
  updateUI(null, true);

  // Actualizar con Firebase
  onAuthStateChanged(auth, (user) => {
    updateUI(user, false);
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
      isAdmin = false; // Resetear variable global
      isManager = false; // Resetear variable global
      console.log("Sesión cerrada con éxito.");
      window.location.reload();
    } catch (error) {
      console.error("Error al cerrar sesión:", error.message);
      alert("No se pudo cerrar sesión. Por favor, intenta de nuevo.");
    }
  });
});

// Asignar eventos
document.addEventListener("DOMContentLoaded", () => {
  const infoResumenBtn = document.getElementById("inforesumen");
  if (infoResumenBtn) {
    infoResumenBtn.addEventListener("click", descargarResumenExcel);
  } else {
    console.error("Elemento #inforesumen no encontrado en el DOM.");
  }
  const infoEstadisticasBtn = document.getElementById("infoestadisticas");
  if (infoEstadisticasBtn) {
    infoEstadisticasBtn.addEventListener("click", generarEstadisticasPDF);
  } else {
    console.error("Elemento #infoestadisticas no encontrado en el DOM.");
  }
  const infoUserAdminBtn = document.getElementById("infouserAdmin");
  if (infoUserAdminBtn) {
    infoUserAdminBtn.addEventListener("click", abrirModalUserInfo);
  } else {
    console.error("❌ Botón infouserAdmin no encontrado.");
  }
});
document.addEventListener("DOMContentLoaded", () => {
  asignarEventos("admin");
  asignarEventos("manager");
  cargarSucursalesDisponibles();
  cargarSucursalesJSON();
  mostrarPuestosDisponibles();

  // Llamar a mostrarBotonEntrar para ambos tipos al cargar la página
  mostrarBotonEntrar("admin");
  mostrarBotonEntrar("manager");

  const regreso1 = document.getElementById("regreso1");
  const regreso2 = document.getElementById("regreso2");

  if (regreso1)
    regreso1.addEventListener("click", () => regresarAlLogin("admin"));
  if (regreso2)
    regreso2.addEventListener("click", () => regresarAlLogin("manager"));

  mostrarTextoPavoPorDefecto();

  // Esperar a que Firebase autentique al usuario
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Usuario autenticado detectado:", user.email);
      const redirectAfterLogin = localStorage.getItem("redirectAfterLogin");
      if (redirectAfterLogin) {
        console.log(`Redirigiendo automáticamente a ${redirectAfterLogin}...`);
        redirectAfterLogin;
        const isManager = redirectAfterLogin === "manager";
        setThemeColor("#2a4566");

        // Cambiar la vista al panel correspondiente
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

        updateUnreadChatsCount();
        updateUnreadMessagesCount();

        if (elements.header) elements.header.style.display = "none";
        if (elements.pavo_cont) elements.pavo_cont.style.display = "none";
        if (elements.chatbot) elements.chatbot.style.display = "none";

        if (isManager) {
          const sucursalActivaElement =
            document.getElementById("sucursal_activa");
          const sucursalGuardada = localStorage.getItem("sucursal");
          if (sucursalActivaElement && sucursalGuardada) {
            const sucursalFormateada =
              sucursalGuardada.charAt(0).toUpperCase() +
              sucursalGuardada.slice(1).toLowerCase();
            sucursalActivaElement.textContent = sucursalFormateada;
          }
        }

        // Mostrar datos y mensajes solo cuando el usuario esté autenticado
        mostrarDatos();
        mostrarMensajesUsuarios();
        mostrarPuestosDisponibles();

        // Limpiar la intención de redirección
        localStorage.removeItem("redirectAfterLogin");
      }
    } else {
      console.log("No hay usuario autenticado al cargar la página.");
    }
  });
});
