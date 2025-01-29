// form.js
import { database, ref, push, set, onValue } from "./firebase.js";

// Mapa de alertas con su ID y tiempo de visualización
const alertasConfig = {
    alertas: 5000,
    alerta_1: 5000,
    alerta_2: 5000,
    alerta_3: 5000,
    alerta_4: 5000,
  };
  
  // Función genérica para mostrar y ocultar alertas
  const mostrarAlerta = (alertaId) => {
    const alerta = document.getElementById(alertaId);
    const tiempo = alertasConfig[alertaId] || 5000; // Usar tiempo configurado o 4000ms por defecto
  
    alerta.style.display = "flex"; // Mostrar alerta
  
    setTimeout(() => {
      alerta.style.display = "none"; // Ocultar alerta después de un tiempo
    }, tiempo);
  };
  //Escribir datos
  function enviar_form() {
    // Obtiene los valores del formulario
    const nombre = document.getElementById("nombre").value.trim(); // Eliminar espacios extras
    const puesto = document.getElementById("l_p_s").value;
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
      !nombre || !puesto || !numero || !fecha_r || !edad ||
      !direccion || !ciudad || !cp || !casa_suc || !transporte ||
      !f_t || !sexo || !nacion || !peso
    ) {
      mostrarAlerta("alertas");
      mostrarAlerta("alerta_1");
      return; // Detiene la ejecución si algún campo está vacío
    }
  
    // Crear el objeto con los datos del formulario
    const formData = {
      puesto, numero, fecha_r, edad, direccion, ciudad, cp,
      casa_suc, transporte, f_t, sexo, nacion, peso
    };
  
    // Guardar en Firebase usando el nombre como clave
    set(ref(database, `vacantes/${nombre}`), formData)
      .then(() => {
        console.log("Formulario enviado exitosamente!");
        mostrarAlerta("alertas");
        mostrarAlerta("alerta_2");
        // Limpiar los campos del formulario
        //document.getElementById("myForm").reset();
      })
      .catch((error) => {
        console.error("Hubo un error: ", error.message);
        mostrarAlerta("alertas");
        mostrarAlerta("alerta_3");
      });
  }
  
  // Asigna la función al objeto global 'window'
  window.enviar_form = enviar_form;

 //Leer datos
// Leer datos
function mostrarDatos() {
  const dataGreen = document.getElementById("data_green");
  const dataRed = document.getElementById("data_red");
  const vacantesRef = ref(database, "vacantes/");

  // Limpiar los contenedores antes de actualizar
  dataGreen.innerHTML = "";
  dataRed.innerHTML = "";

  // Escuchar cambios en la base de datos en tiempo real
  onValue(vacantesRef, (snapshot) => {
    if (snapshot.exists()) {
      const ulGreen = document.createElement("ul"); // Un <ul> para las vacantes "fijo"
      const ulRed = document.createElement("ul"); // Un <ul> para las vacantes "temporal"

      snapshot.forEach((childSnapshot) => {
        const nombre = childSnapshot.key; // El nombre ahora es la clave
        const data = childSnapshot.val() || {}; // Evitar undefined

        const listItem = document.createElement("li");
        listItem.classList.add("vacante_item");

        const infoContainer = document.createElement("div");
        infoContainer.classList.add("vacante_info");

        // Lista de campos asegurando que nunca sean `undefined`
        const campos = [
          { label: "Nombre", value: nombre },
          { label: "Puesto", value: data.puesto || "No disponible" },
          { label: "Número", value: data.numero || "No disponible" },
          { label: "Fecha Registro", value: data.fecha_r || "No disponible" },
          { label: "Edad", value: data.edad || "No disponible" },
          { label: "Dirección", value: data.direccion || "No disponible" },
          { label: "Ciudad", value: data.ciudad || "No disponible" },
          { label: "CP", value: data.cp || "No disponible" },
          { label: "Casa/Sucursal", value: data.casa_suc || "No disponible" },
          { label: "Transporte", value: data.transporte || "No disponible" },
          { label: "Tipo", value: data.f_t || "No disponible" },
          { label: "Sexo", value: data.sexo || "No disponible" },
          { label: "Nacionalidad", value: data.nacion || "No disponible" },
          { label: "Peso", value: data.peso || "No disponible" },
        ];

        // Crear elementos <span> dinámicamente
        campos.forEach((campo) => {
          const span = document.createElement("span");
          span.innerHTML = `<strong>${campo.label}:</strong> ${campo.value}`;
          infoContainer.appendChild(span);
        });

        // Agregar el div con la información al <li>
        listItem.appendChild(infoContainer);

        // Filtrar según el tipo 'l_f_t' (fijo/temporal)
        if (data.l_f_t === "temporal") {
          ulRed.appendChild(listItem); // Agregar al <ul> de vacantes temporales
        } else if (data.l_f_t === "fijo") {
          ulGreen.appendChild(listItem); // Agregar al <ul> de vacantes fijas
        }
      });

      // Agregar los <ul> filtrados a los contenedores respectivos
      dataGreen.appendChild(ulGreen);
      dataRed.appendChild(ulRed);

    } else {
      dataGreen.innerHTML = "<p>No hay vacantes fijas disponibles</p>";
      dataRed.innerHTML = "<p>No hay vacantes temporales disponibles</p>";
    }
  });
}

// Ejecutar la función automáticamente al cargar la página
document.addEventListener("DOMContentLoaded", mostrarDatos);
