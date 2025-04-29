// chat_manager.js
import { app, database, ref, push, set, onValue, off } from "./firebase.js";

// Estado del chat
let selectedBranch = null; // Sucursal obtenida desde localStorage
const rhId = "RH_Admin"; // Identificador para RH
let processedMessages = new Set(); // Para rastrear mensajes procesados
let currentChatRef = null; // Para rastrear el listener actual

// Obtener la sucursal desde localStorage
function getBranchFromLocalStorage() {
  const branch = localStorage.getItem("sucursal");
  if (!branch) {
    console.error("Error: No se encontró la sucursal en localStorage");
    return null;
  }
  console.log(`Sucursal obtenida de localStorage: ${branch}`);
  return branch;
}

// Inicializar el chat del manager
document.addEventListener("DOMContentLoaded", () => {
  console.log("Inicializando chat_manager.js");

  // Verificar Firebase
  if (!database) {
    console.error("Error: Firebase database no está inicializado");
    return;
  }

  // Obtener la sucursal desde localStorage
  selectedBranch = getBranchFromLocalStorage();
  if (!selectedBranch) {
    const alerta = document.getElementById("alerta_1");
    if (alerta) {
      alerta.style.display = "flex";
      setTimeout(() => (alerta.style.display = "none"), 3000);
    }
    return;
  }

  // Mostrar la sucursal activa
  const sucursalActiva = document.getElementById("sucursal_activa");
  if (sucursalActiva) {
    sucursalActiva.textContent = selectedBranch.charAt(0).toUpperCase() + selectedBranch.slice(1);
  } else {
    console.error("Error: No se encontró el elemento #sucursal_activa");
  }

  // Cargar historial de chat al iniciar
  loadChatHistory();

  const chatManagerInput = document.getElementById("chat_manager");
  if (!chatManagerInput) {
    console.error("Error: No se encontró el elemento #chat_manager en el DOM");
    return;
  }

  chatManagerInput.addEventListener("change", (e) => {
    const chatManagerInfo = document.querySelector(".chat_manager_info");
    if (!chatManagerInfo) {
      console.error("Error: No se encontró el elemento .chat_manager_info en el DOM");
      return;
    }

    if (e.target.checked) {
      console.log("Panel de chat del manager visible");

      // Manejar envío de mensajes
      const form = document.getElementById("manager_chat_form");
      if (!form) {
        console.error("Error: No se encontró el elemento #manager_chat_form en el DOM");
        return;
      }

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const messageInput = document.getElementById("manager_chat_input");
        if (!messageInput) {
          console.error("Error: No se encontró el elemento #manager_chat_input en el DOM");
          return;
        }
        const message = messageInput.value.trim();
        if (!message) {
          console.warn("Mensaje vacío, no se enviará");
          return;
        }

        console.log(`Enviando mensaje: ${message}`);
        messageInput.disabled = true;
        sendMessage(selectedBranch, message);
        messageInput.value = "";
        messageInput.disabled = false;
        messageInput.focus();
      });
    }
  });
});

// Cargar historial de chat para la sucursal del manager
function loadChatHistory() {
  const chatBox = document.getElementById("data_chat_manager");
  if (!chatBox) {
    console.error("Error: No se encontró el elemento #data_chat_manager en el DOM");
    return;
  }

  // Limpiar el chat solo si no hay sucursal seleccionada
  if (!selectedBranch) {
    chatBox.innerHTML = "<p>No se ha seleccionado ninguna sucursal.</p>";
    return;
  }

  // Remover el listener previo si existe
  if (currentChatRef) {
    console.log(`Removiendo listener para ${currentChatRef.path}`);
    off(currentChatRef);
  }

  const chatRef = ref(database, `chatAdmin/rh_to_branch/${selectedBranch}`);
  currentChatRef = chatRef;

  onValue(chatRef, (snapshot) => {
    console.log(`onValue ejecutado para ${selectedBranch}`);
    const messages = snapshot.val();
    if (!messages) {
      console.log(`No hay mensajes para la sucursal ${selectedBranch}`);
      chatBox.innerHTML = "<p>No hay mensajes en esta conversación.</p>";
      return;
    }

    // Limpiar el chat solo la primera vez que se carga la sucursal
    if (!processedMessages.size) {
      console.log(`Limpiando chatBox para ${selectedBranch}`);
      chatBox.innerHTML = "";
    }

    const messageArray = Object.entries(messages).map(([id, msg]) => ({ id, ...msg }));
    // Ordenar mensajes por timestamp
    messageArray.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let newMessagesAdded = false;
    messageArray.forEach(({ id, sender, message, timestamp }) => {
      // Evitar procesar mensajes ya mostrados
      if (processedMessages.has(id)) {
        console.log(`Mensaje ID ${id} ya procesado, ignorando`);
        return;
      }

      console.log(`Procesando mensaje ID: ${id}, Sender: ${sender}, Timestamp: ${timestamp}`);

      const messageTime = new Date(timestamp).getTime();
      const currentTime = new Date().getTime();
      const timeDiff = (currentTime - messageTime) / 1000; // Diferencia en segundos
      console.log(`Time difference: ${timeDiff} seconds`);

      // Mostrar mensajes recibidos de otros usuarios con indicador si son recientes
      if (sender !== selectedBranch && timeDiff <= 1) {
        console.log("Mostrando indicador de escritura para mensaje nuevo");
        const typingIndicator = showTypingIndicator();
        setTimeout(() => {
          if (typingIndicator) typingIndicator.remove();
          displayMessage(chatBox, sender, message, id);
          processedMessages.add(id);
          console.log(`Mensaje ID ${id} añadido a processedMessages`);
          newMessagesAdded = true;
        }, 1000);
      } else {
        // Mostrar mensajes del historial o mensajes propios sin indicador
        displayMessage(chatBox, sender, message, id);
        processedMessages.add(id);
        console.log(`Mensaje ID ${id} añadido a processedMessages`);
        newMessagesAdded = true;
      }
    });

    // Desplazar al final solo si se añadieron nuevos mensajes
    if (newMessagesAdded) {
      scrollToBottom();
    }
  }, (error) => {
    console.error("Error al cargar mensajes de Firebase:", error);
    chatBox.innerHTML = "<p>Error al cargar los mensajes.</p>";
  });
}

// Mostrar un mensaje en el chat
function displayMessage(chatBox, sender, message, messageId) {
  console.log(`Renderizando mensaje ID: ${messageId}, Sender: ${sender}, Message: ${message}`);
  // Verificar si el mensaje ya existe en el DOM
  if (chatBox.querySelector(`[data-message-id="${messageId}"]`)) {
    console.log(`Mensaje ID ${messageId} ya existe en el DOM, ignorando`);
    return;
  }
  const messageElement = document.createElement("div");
  messageElement.className = sender === rhId ? "rh_message" : "branch_message";
  messageElement.dataset.messageId = messageId;
  const senderName = sender === rhId ? "RH" : sender.charAt(0).toUpperCase() + sender.slice(1);
  messageElement.innerHTML = `<span>${senderName}</span><p>${message}</p>`;
  chatBox.appendChild(messageElement);
}

// Mostrar indicador de escritura
function showTypingIndicator() {
  const chatBox = document.getElementById("data_chat_manager");
  if (!chatBox) {
    console.error("Error: No se encontró el elemento #data_chat_manager para el indicador de escritura");
    return null;
  }

  console.log("Creando indicador de escritura");
  const typingIndicator = document.createElement("p");
  typingIndicator.className = "typing";
  typingIndicator.innerText = "Escribiendo...";
  chatBox.appendChild(typingIndicator);
  scrollToBottom();
  return typingIndicator;
}

// Enviar mensaje
async function sendMessage(sender, message) {
  if (!selectedBranch) {
    console.warn("No se ha seleccionado ninguna sucursal");
    const alerta = document.getElementById("alerta_1");
    if (alerta) {
      alerta.style.display = "flex";
      setTimeout(() => (alerta.style.display = "none"), 3000);
    }
    return;
  }

  // Guardar mensaje en Firebase
  try {
    const chatRef = ref(database, `chatAdmin/rh_to_branch/${selectedBranch}`);
    const newMessageRef = await push(chatRef);
    await set(newMessageRef, {
      sender,
      message,
      timestamp: new Date().toISOString()
    });
    console.log(`Mensaje guardado en Firebase para ${selectedBranch}, ID: ${newMessageRef.key}`);
  } catch (error) {
    console.error("Error guardando mensaje en Firebase:", error);
    const alerta = document.getElementById("alerta_3");
    if (alerta) {
      alerta.style.display = "flex";
      setTimeout(() => (alerta.style.display = "none"), 3000);
    }
  }
}

// Desplazar el chat al final
function scrollToBottom() {
  const chatBox = document.getElementById("data_chat_manager");
  if (!chatBox) {
    console.error("Error: No se encontró el elemento #data_chat_manager para scroll");
    return;
  }

  // Verificar si el usuario está cerca del final
  const isNearBottom = chatBox.scrollHeight - chatBox.scrollTop <= chatBox.clientHeight + 50;
  if (isNearBottom) {
    console.log("Desplazando al final del chat");
    setTimeout(() => {
      chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
    }, 100);
  } else {
    console.log("Usuario está desplazándose arriba, no se fuerza el scroll");
  }
}