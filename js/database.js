// form.js
import { database, ref, push, set } from "./firebase.js";

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
  
function enviar_form() {
  // Obtiene los valores del formulario
  const nombre = document.getElementById("nombre").value;
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
    nombre,
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
    sexo,
    nacion,
    peso,
  };

  // Crear una referencia única para los datos en 'formularios/nombre'
  const newRef = push(ref(database, `vacantes/${nombre}`));

  // Usar 'set' para guardar los datos en la referencia
  set(newRef, formData)
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
