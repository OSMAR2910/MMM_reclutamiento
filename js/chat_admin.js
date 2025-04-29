// chat_admin.js
import { app, database, ref, push, set, onValue, off } from "./firebase.js";

// Estado del chat
let selectedBranch = null; // Sucursal seleccionada
const rhId = "RH_Admin"; // Identificador fijo para RH
let processedMessages = new Set(); // Para rastrear mensajes procesados
let currentChatRef = null; // Para rastrear el listener actual

// Actualizar estado de las flechas del carrusel
function updateCarouselArrows() {
  const carouselInner = document.getElementById("carousel-inner");
  const carouselLeft = document.getElementById("carousel-left");
  const carouselRight = document.getElementById("carousel-right");
  if (!carouselInner || !carouselLeft || !carouselRight) {
    console.error("Error: No se encontraron los elementos #carousel-inner, #carousel-left o #carousel-right");
    return;
  }
  carouselLeft.disabled = carouselInner.scrollLeft <= 0;
  carouselRight.disabled = carouselInner.scrollLeft + carouselInner.clientWidth >= carouselInner.scrollWidth;
}

// Cargar sucursales desde sucursales.json y generar botones
async function loadBranchesFromJson() {
  try {
    const response = await fetch("../json/sucursales.json");
    if (!response.ok) {
      throw new Error(`Error al cargar sucursales.json: ${response.statusText}`);
    }
    const data = await response.json();
    const branches = data.sucursalesValidas;

    const carouselInner = document.getElementById("carousel-inner");
    if (!carouselInner) {
      console.error("Error: No se encontró el elemento #carousel-inner en el DOM");
      return;
    }

    // Generar botones de sucursales
    carouselInner.innerHTML = ""; // Limpiar cualquier contenido previo
    branches.forEach(branch => {
      const button = document.createElement("button");
      button.id = `branch_${branch}`;
      button.className = "branch-button";
      button.dataset.branch = branch;

      // Crear contenedor para el texto y el badge
      const textSpan = document.createElement("span");
      textSpan.textContent = branch.charAt(0).toUpperCase() + branch.slice(1);
      const badgeSpan = document.createElement("span");
      badgeSpan.className = "unread-badge";
      badgeSpan.id = `unread_badge_${branch}`;
      badgeSpan.textContent = "0"; // Inicialmente 0, se actualizará después

      button.appendChild(textSpan);
      button.appendChild(badgeSpan);
      carouselInner.appendChild(button);
    });

    // Añadir eventos a los botones de sucursales
    carouselInner.querySelectorAll(".branch-button").forEach(button => {
      button.addEventListener("click", () => {
        console.log(`Sucursal seleccionada: ${button.dataset.branch}`);
        selectedBranch = button.dataset.branch;
        document.querySelectorAll(".branch-button").forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        processedMessages.clear(); // Limpiar mensajes procesados
        loadChatHistory();
        updateCarouselArrows();
      });
    });

    // Actualizar el contador de chats no contestados
    await updateUnreadChatsCount();
  } catch (error) {
    console.error("Error al cargar sucursales desde JSON:", error);
  }
}

// Inicializar eventos del carrusel y chat
document.addEventListener("DOMContentLoaded", () => {
  console.log("Inicializando chat_admin.js");

  if (!database) {
    console.error("Error: Firebase database no está inicializado");
    return;
  }

  const chatAdminInput = document.getElementById("chat_admin");
  if (!chatAdminInput) {
    console.error("Error: No se encontró el elemento #chat_admin en el DOM");
    return;
  }

  // Función para inicializar el chat
  function initializeChat() {
    console.log("Panel de chat visible, inicializando eventos");

    // Cargar sucursales y actualizar contadores
    loadBranchesFromJson();

    // Asegurar que el contador se actualice al cargar
    updateUnreadChatsCount();

    // Manejar flechas de navegación
    const carouselInner = document.getElementById("carousel-inner");
    const carouselLeft = document.getElementById("carousel-left");
    const carouselRight = document.getElementById("carousel-right");
    if (!carouselInner || !carouselLeft || !carouselRight) {
      console.error("Error: No se encontraron los elementos #carousel-inner, #carousel-left o #carousel-right");
      return;
    }

    carouselLeft.addEventListener("click", () => {
      carouselInner.scrollBy({ left: -100, behavior: "smooth" });
      setTimeout(updateCarouselArrows, 300);
    });

    carouselRight.addEventListener("click", () => {
      carouselInner.scrollBy({ left: 100, behavior: "smooth" });
      setTimeout(updateCarouselArrows, 300);
    });

    carouselInner.addEventListener("scroll", updateCarouselArrows);

    // Manejar envío de mensajes
    const form = document.getElementById("admin_chat_form");
    if (!form) {
      console.error("Error: No se encontró el elemento #admin_chat_form en el DOM");
      return;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const messageInput = document.getElementById("admin_chat_input");
      if (!messageInput) {
        console.error("Error: No se encontró el elemento #admin_chat_input en el DOM");
        return;
      }
      const message = messageInput.value.trim();
      if (!message) {
        console.warn("Mensaje vacío, no se enviará");
        return;
      }

      console.log(`Enviando mensaje: ${message}`);
      messageInput.disabled = true;
      sendMessage(rhId, message);
      messageInput.value = "";
      messageInput.disabled = false;
      messageInput.focus();
    });

    // Listener global para detectar nuevos mensajes en cualquier sucursal
    const globalChatRef = ref(database, `chatAdmin/rh_to_branch`);
    onValue(globalChatRef, (snapshot) => {
      console.log("Cambio detectado en chatAdmin/rh_to_branch, actualizando indicadores");
      updateUnreadChatsCount();
    });
  }

  chatAdminInput.addEventListener("change", (e) => {
    const chatAdminInfo = document.querySelector(".chat_admin_info");
    if (!chatAdminInfo) {
      console.error("Error: No se encontró el elemento .chat_admin_info en el DOM");
      return;
    }

    if (e.target.checked) {
      initializeChat();
    }
  });

  // Si el chat ya está visible al cargar la página, inicializarlo
  if (chatAdminInput.checked) {
    initializeChat();
  }

  // Inicialización móvil
  if (window.innerWidth <= 500) {
    console.log("Inicialización móvil detectada");

    const carouselInner = document.getElementById("carousel-inner");
    const carouselLeft = document.getElementById("carousel-left");
    const carouselRight = document.getElementById("carousel-right");

    if (carouselInner && carouselLeft && carouselRight) {
      carouselLeft.addEventListener("click", () => {
        carouselInner.scrollBy({ left: -100, behavior: "smooth" });
        setTimeout(updateCarouselArrows, 300);
      });

      carouselRight.addEventListener("click", () => {
        carouselInner.scrollBy({ left: 100, behavior: "smooth" });
        setTimeout(updateCarouselArrows, 300);
      });

      carouselInner.addEventListener("scroll", updateCarouselArrows);
    }

    const form = document.getElementById("admin_chat_form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const messageInput = document.getElementById("admin_chat_input");
        if (!messageInput) return;

        const message = messageInput.value.trim();
        if (!message) return;

        messageInput.disabled = true;
        sendMessage(rhId, message);
        messageInput.value = "";
        messageInput.disabled = false;
        messageInput.focus();
      });
    }

    // Cargar sucursales y actualizar contadores para móviles
    loadBranchesFromJson();
    updateUnreadChatsCount();
  }
});

// Cargar historial de chat para la sucursal seleccionada
function loadChatHistory() {
  const chatBox = document.getElementById("data_chat_admin");
  if (!chatBox) {
    console.error("Error: No se encontró el elemento #data_chat_admin en el DOM");
    return;
  }

  // Limpiar el chat solo si no hay sucursal seleccionada
  if (!selectedBranch) {
    chatBox.innerHTML = "<p>Por favor, selecciona una sucursal para chatear.</p>";
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
      if (sender !== rhId && timeDiff <= 1) {
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
  const chatBox = document.getElementById("data_chat_admin");
  if (!chatBox) {
    console.error("Error: No se encontró el elemento #data_chat_admin para el indicador de escritura");
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
    } else {
      console.error("Error: No se encontró el elemento #alerta_1");
    }
    return;
  }

  try {
    const chatRef = ref(database, `chatAdmin/rh_to_branch/${selectedBranch}`);
    const newMessageRef = await push(chatRef);
    await set(newMessageRef, {
      sender,
      message,
      timestamp: new Date().toISOString(),
    });
    console.log(`Mensaje guardado en Firebase para ${selectedBranch}, ID: ${newMessageRef.key}`);

    // Actualizar los indicadores
    await updateUnreadChatsCount();
  } catch (error) {
    console.error("Error guardando mensaje en Firebase:", error);
    const alerta = document.getElementById("alerta_3");
    if (alerta) {
      alerta.style.display = "flex";
      setTimeout(() => (alerta.style.display = "none"), 3000);
    } else {
      console.error("Error: No se encontró el elemento #alerta_3");
    }
  }
}

// Contar chats no contestados en todas las sucursales
export async function updateUnreadChatsCount() {
  try {
    // Cargar sucursales desde sucursales.json
    const response = await fetch("../json/sucursales.json");
    if (!response.ok) {
      throw new Error(`Error al cargar sucursales.json: ${response.statusText}`);
    }
    const data = await response.json();
    const branches = data.sucursalesValidas;

    let totalUnreadChats = 0;

    // Iterar sobre cada sucursal
    for (const branch of branches) {
      const chatRef = ref(database, `chatAdmin/rh_to_branch/${branch}`);
      const snapshot = await new Promise((resolve) => {
        onValue(chatRef, resolve, { onlyOnce: true });
      });

      let unreadCount = 0;
      const messages = snapshot.val();
      if (messages) {
        // Convertir mensajes a array y ordenar por timestamp
        const messageArray = Object.entries(messages).map(([id, msg]) => ({
          id,
          ...msg,
        }));
        messageArray.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        // Verificar si el último mensaje es de la sucursal (no de RH)
        const lastMessage = messageArray[messageArray.length - 1];
        if (lastMessage && lastMessage.sender !== rhId) {
          unreadCount = 1; // Consideramos el chat como no contestado
          totalUnreadChats++;
          console.log(`Chat no contestado detectado en sucursal: ${branch}`);
        }
      }

      // Actualizar el badge de la sucursal
      const badge = document.getElementById(`unread_badge_${branch}`);
      if (badge) {
        badge.textContent = unreadCount;
        // Usar classList para preservar clases existentes
        if (unreadCount > 0) {
          badge.classList.add("active");
        } else {
          badge.classList.remove("active");
        }
      } else {
        console.warn(`No se encontró el badge para la sucursal: ${branch}`);
      }
    }

    // Actualizar el indicador_total
    const indicadorTotal = document.getElementById("indicador_total");
    if (!indicadorTotal) {
      console.error("Error: No se encontró el elemento #indicador_total en el DOM");
      return;
    }
    indicadorTotal.textContent = totalUnreadChats;
    // Usar classList para agregar o quitar la clase active sin afectar otras clases
    if (totalUnreadChats > 0) {
      indicadorTotal.classList.add("active");
    } else {
      indicadorTotal.classList.remove("active");
    }
    console.log(`Total de chats no contestados: ${totalUnreadChats}`);
  } catch (error) {
    console.error("Error al contar chats no contestados:", error);
  }
}

// Desplazar el chat al final
function scrollToBottom() {
  const chatBox = document.getElementById("data_chat_admin");
  if (!chatBox) {
    console.error("Error: No se encontró el elemento #data_chat_admin para scroll");
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