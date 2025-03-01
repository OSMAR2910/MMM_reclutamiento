// Importar Firebase
import { app, database, ref, push, set } from "./firebase.js";

let intents = [];
let isWelcomeMessageSent = false;
let messageBuffer = [];
let userName = null;
let userIdName = localStorage.getItem("userIdName");

// Generar un ID aleatorio simple
function generateRandomId() {
  return Math.random().toString(36).substring(2, 8); // Genera un ID de 6 caracteres (ej. "abc123")
}

// Cargar intents desde Netlify
async function loadIntents() {
  try {
    const response = await fetch("https://mmm-rh.netlify.app/json/intents.json", {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    intents = data.intents || [];
    console.log("✅ Intents cargados correctamente:", intents);
  } catch (error) {
    console.error("❌ Error cargando intents.json:", error);
  }
}

// Normalizar texto
function normalizeText(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Obtener la mejor intención
function getBestIntent(message) {
  message = normalizeText(message);
  let bestMatch = null;
  let bestScore = 0;

  for (const intent of intents) {
    let score = 0;
    for (const keyword of intent.keywords) {
      const normalizedKeyword = normalizeText(keyword);
      if (message.includes(normalizedKeyword)) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = intent;
    }
  }
  return bestScore > 0 ? bestMatch : null;
}

// Obtener la respuesta
function getResponse(message) {
  if (!intents.length) {
    console.error("⚠️ Intents no están cargados.");
    return "Lo siento, no puedo responder en este momento.";
  }

  const bestIntent = getBestIntent(message);
  if (bestIntent) {
    return bestIntent.responses[Math.floor(Math.random() * bestIntent.responses.length)];
  } else {
    // Si no hay intención, guardamos el mensaje sin respuesta y devolvemos el mensaje predeterminado
    console.log("🚫 No encontré una respuesta adecuada para:", message);
    saveUnansweredMessage(message); // Llamamos a la función para guardar
    return "¡Glu-glu! No estoy seguro de lo que quieres decir, humano. ¿Podrías explicarlo de otra manera? ¡Prometo no picotear tu respuesta! 🦃✨";
  }
}

// Guardar mensajes en Firebase cada 10 mensajes
async function saveMessagesToFirebase() {
  if (!userIdName || messageBuffer.length === 0) {
    console.log("🚫 No se guardan mensajes: userIdName o buffer vacío", { userIdName, bufferLength: messageBuffer.length });
    return;
  }

  try {
    const userRef = ref(database, `chatMessages/${userIdName}`);
    await push(userRef, { messages: [...messageBuffer] });
    console.log(`✅ ${messageBuffer.length} mensajes añadidos al historial en Firebase para ${userIdName}`);
    messageBuffer = [];
  } catch (error) {
    console.error("❌ Error guardando mensajes en Firebase:", error);
  }
}

// Enviar mensajes al chat
function sendMessage(sender, message, isBot = false) {
  const chatBox = document.getElementById("chat_box");
  const messageElement = document.createElement("div");
  messageElement.className = isBot ? "bot_message" : "user_message";

  if (isBot) {
    messageElement.innerHTML = `<span>Sr.Pavo Chava</span><p>${message}</p>`;
    messageBuffer.push({ sender: "Sr.Pavo Chava", message, timestamp: new Date().toISOString() });
  } else {
    messageElement.innerHTML = `<p>${message}</p>`;
    messageBuffer.push({ sender: userIdName, message, timestamp: new Date().toISOString() });
  }

  console.log("📩 Mensaje añadido al buffer. Total:", messageBuffer.length, "Mensajes:", messageBuffer);
  if (messageBuffer.length >= 10) {
    console.log("📤 Guardando mensajes en Firebase...");
    saveMessagesToFirebase();
  }

  chatBox.appendChild(messageElement);
  scrollToBottom();
}

// Actualizar el nombre con ID en el chat
function updateUserIdDisplay() {
  const userIdElement = document.getElementById("user_id_display");
  if (userIdElement) {
    userIdElement.innerHTML = ""; // Limpiar el contenedor
    userIdElement.textContent = userIdName ? `${userIdName}` : "Usuario no identificado";
  }
}

// Función para guardar mensajes sin respuesta de chatbot
async function saveUnansweredMessage(message) {
  try {
    const messagesRef = ref(database, "mensajes_error");
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, {
      message: message,
      timestamp: new Date().toISOString(),
    });
    console.log("📌 Mensaje sin respuesta guardado en Firebase:", message);
  } catch (error) {
    console.error("❌ Error guardando mensaje sin respuesta en Firebase:", error);
  }
}

// Mostrar indicador de escritura
function showTypingIndicator() {
  const chatBox = document.getElementById("chat_box");
  const typingIndicator = document.createElement("p");
  typingIndicator.className = "typing";
  typingIndicator.innerText = "Sr. Pavo Chava escribiendo...";
  chatBox.appendChild(typingIndicator);
  scrollToBottom();
  return typingIndicator;
}

// Enviar mensaje de bienvenida
function sendWelcomeMessage() {
  if (isWelcomeMessageSent || !userIdName) return;
  isWelcomeMessageSent = true;

  const saludosIntent = intents.find(intent => intent.tag === "Saludos");
  if (saludosIntent && saludosIntent.responses && saludosIntent.responses.length > 0) {
    const randomSaludo = saludosIntent.responses[Math.floor(Math.random() * saludosIntent.responses.length)];
    showTypingIndicator();
    setTimeout(() => {
      document.querySelector(".typing")?.remove();
      sendMessage("bot", randomSaludo, true);
    }, 2000);
  } else {
    sendMessage("bot", "¡Hola! ¿En qué puedo ayudarte? 😃", true);
  }
}

// Obtener respuesta aleatoria para 'tienes_preguntas'
function getRandomTienesPreguntasResponse() {
  const tienesPreguntasIntent = intents.find(intent => intent.tag === "tienes_preguntas");
  return tienesPreguntasIntent?.responses[Math.floor(Math.random() * tienesPreguntasIntent.responses.length)] || "¿En qué puedo ayudarte?";
}

// Actualizar mensaje en 'pavo_msj'
function updatePavoMsj() {
  const pavoMsjElement = document.getElementById("pavo_msj");
  if (pavoMsjElement) {
    pavoMsjElement.innerHTML = `${getRandomTienesPreguntasResponse()}`;
  }
}

// Manejar el formulario de nombre y asignar ID
function handleNameForm() {
  const nameForm = document.getElementById("name_form");
  const userInfoContainer = document.getElementById("user_info_container");
  const chatForm = document.getElementById("chat_form");

  if (!userIdName) {
    userInfoContainer.style.display = "block";
    chatForm.style.display = "none";
    nameForm.addEventListener("submit", (event) => {
      event.preventDefault();
      userName = document.getElementById("user_name").value.trim();
      if (userName) {
        const randomId = generateRandomId();
        userIdName = `${randomId}-${userName}`;
        localStorage.setItem("userIdName", userIdName);
        userInfoContainer.style.display = "none";
        chatForm.style.display = "flex";
        updateUserIdDisplay();
        sendWelcomeMessage();
      }
    });
  } else {
    userInfoContainer.style.display = "none";
    chatForm.style.display = "flex";
    updateUserIdDisplay();
    sendWelcomeMessage();
  }
}

// Scroll al final del chat
function scrollToBottom() {
  const chatBox = document.getElementById("chat_box");
  setTimeout(() => {
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
  }, 100);
}

// Evento DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
  await loadIntents();
  updatePavoMsj();
  handleNameForm();

  const form = document.getElementById("chat_form");
  const input = document.getElementById("chat_input");
  const sendButton = document.getElementById("chat_submit");
  const chatBox = document.getElementById("chat_box");

  if (!form || !input || !sendButton || !chatBox) {
    console.error("Elementos del chat no encontrados.");
    return;
  }

  chatBox.innerHTML = localStorage.getItem("chatHistory") || "";

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const userMessage = input.value.trim();
    if (!userMessage) return;

    sendButton.disabled = true;
    sendMessage("user", userMessage);
    const typingIndicator = showTypingIndicator();

    setTimeout(() => {
      typingIndicator.remove();
      const botResponse = getResponse(userMessage);
      sendMessage("bot", botResponse, true);
      localStorage.setItem("chatHistory", chatBox.innerHTML);
      sendButton.disabled = false;
    }, 2000);

    input.value = "";
  });
  // Guardar mensajes pendientes al salir de la página
  window.addEventListener("beforeunload", () => {
    if (messageBuffer.length > 0) {
      saveMessagesToFirebase(); // Guardar los mensajes restantes
    }
  });
});

// Minimizar/maximizar chat
document.getElementById("chat_min").addEventListener("click", () => {
  const chatBox = document.getElementById("chatbot");
  const pavo = document.getElementById("pavo_cont");

  chatBox.classList.toggle("max_chat");
  void chatBox.offsetHeight;

  if (chatBox.classList.contains("max_chat")) {
    pavo.style.display = 'none';
    sendWelcomeMessage();
    setTimeout(scrollToBottom, 0);
  } else {
    pavo.style.display = 'flex';
  }
});