// Importar Firebase
import { app, database, ref, push, set } from "./firebase.js";
import { isStandalone, setThemeColor } from "./main.js";

let intents = [];
let messageBuffer = [];
let userName = localStorage.getItem("userName") || "Humano";
let userIdName = localStorage.getItem("userIdName");

function generateRandomId() {
  return Math.random().toString(36).substring(2, 8);
}

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

function normalizeText(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

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

function getResponse(message) {
  if (!intents.length) {
    console.error("⚠️ Intents no están cargados.");
    return "Lo siento, no puedo responder en este momento.";
  }

  const bestIntent = getBestIntent(message);
  if (bestIntent) {
    let response = bestIntent.responses[Math.floor(Math.random() * bestIntent.responses.length)];
    return response.replace("${userName}", userName);
  } else {
    console.log("🚫 No encontré una respuesta adecuada para:", message);
    saveUnansweredMessage(message);
    return `¡Glu-glu! No estoy seguro de lo que quieres decir, ${userName}. ¿Podrías explicarlo de otra manera? ¡Prometo no picotear tu respuesta! 🦃✨`;
  }
}

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

function updateUserIdDisplay() {
  const userIdElement = document.getElementById("user_id_display");
  if (userIdElement) {
    userIdElement.innerHTML = "";
    userIdElement.textContent = userIdName ? `${userIdName}` : "Usuario no identificado";
  }
}

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

function showTypingIndicator() {
  const chatBox = document.getElementById("chat_box");
  const typingIndicator = document.createElement("p");
  typingIndicator.className = "typing";
  typingIndicator.innerText = "Sr. Pavo Chava escribiendo...";
  chatBox.appendChild(typingIndicator);
  scrollToBottom();
  return typingIndicator;
}

function sendWelcomeMessage() {
  if (!userIdName) return;

  const saludosIntent = intents.find(intent => intent.tag === "Saludos");
  if (saludosIntent && saludosIntent.responses && saludosIntent.responses.length > 0) {
    let randomSaludo = saludosIntent.responses[Math.floor(Math.random() * saludosIntent.responses.length)];
    randomSaludo = randomSaludo.replace("${userName}", userName);
    showTypingIndicator();
    setTimeout(() => {
      document.querySelector(".typing")?.remove();
      sendMessage("bot", randomSaludo, true);
    }, 2000);
  } else {
    sendMessage("bot", `¡Hola, ${userName}! ¿En qué puedo ayudarte? 😃`, true);
  }
}

function getRandomTienesPreguntasResponse() {
  const tienesPreguntasIntent = intents.find(intent => intent.tag === "tienes_preguntas");
  let response = tienesPreguntasIntent?.responses[Math.floor(Math.random() * tienesPreguntasIntent.responses.length)] || "¿En qué puedo ayudarte?";
  return response.replace("${userName}", userName);
}

function updatePavoMsj() {
  const pavoMsjElement = document.getElementById("pavo_msj");
  if (pavoMsjElement) {
    pavoMsjElement.innerHTML = `${getRandomTienesPreguntasResponse()}`;
  }
}

function handleNameForm() {
  const nameForm = document.getElementById("name_form");
  const userInfoContainer = document.getElementById("user_info_container");
  const chatForm = document.getElementById("chat_form");

  if (!userIdName) {
    userInfoContainer.style.display = "flex";
    chatForm.style.display = "none";
    nameForm.addEventListener("submit", (event) => {
      event.preventDefault();
      userName = document.getElementById("user_name").value.trim() || "Humano";
      userIdName = `${generateRandomId()}-${userName}`;
      localStorage.setItem("userIdName", userIdName);
      localStorage.setItem("userName", userName);
      userInfoContainer.style.display = "none";
      chatForm.style.display = "flex";
      updateUserIdDisplay();
      sendWelcomeMessage();
      maximizeChatbot();
    });
  } else {
    userInfoContainer.style.display = "none";
    chatForm.style.display = "flex";
    updateUserIdDisplay();
  }
}

function scrollToBottom() {
  const chatBox = document.getElementById("chat_box");
  setTimeout(() => {
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
  }, 100);
}

function adjustChatbotPosition() {
  const chatbot = document.getElementById("chatbot");
  const width = window.innerWidth;
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isIOS) {
    // Simplificar posición en iOS
    chatbot.style.bottom = "0";
    chatbot.style.top = "auto";
    chatbot.style.right = "0";
    chatbot.style.margin = "0";
  } else {
    // Mantener comportamiento original para Android y otros dispositivos
    if (width > 500) {
      chatbot.style.bottom = "20px";
      chatbot.style.top = "auto";
    } else {
      if (chatbot.classList.contains("max_chat")) {
        chatbot.style.top = "0";
        chatbot.style.bottom = "auto";
      } else {
        chatbot.style.bottom = "10px";
        chatbot.style.top = "auto";
      }
    }
  }
}

function maximizeChatbot() {
  const chatbot = document.getElementById("chatbot");
  const pavo = document.getElementById("pavo_cont");
  const chatForm = document.getElementById("chat_form");
  if (!chatbot.classList.contains("max_chat")) {
    chatbot.classList.add("max_chat");
    chatForm.style.display = "flex";
    pavo.style.display = "none";
    chatbot.classList.remove("chatbot_color");
    adjustChatbotHeight();
    adjustChatbotPosition();
    sendWelcomeMessage();
    setThemeColor('#ffffff');
  }
}
 
function minimizeChatbot() {
  const chatbot = document.getElementById("chatbot");
  const pavo = document.getElementById("pavo_cont");
  const chatForm = document.getElementById("chat_form");
  if (chatbot.classList.contains("max_chat")) {
    chatbot.classList.remove("max_chat");
    chatbot.classList.add("chatbot_color");
    chatbot.style.height = "";
    chatbot.style.width = ""; 
    chatbot.style.top = "";
    chatbot.style.bottom = "";
    chatbot.style.right = "";
    chatbot.style.margin = "";
    chatbot.style.transform = "none";
    chatForm.style.display = "none";
    pavo.style.display = "flex";
    adjustChatbotPosition();
    setThemeColor('#e36b2f');
  }
}

function toggleChatbot() {
  const chatbot = document.getElementById("chatbot");
  if (chatbot.classList.contains("max_chat")) {
    minimizeChatbot();
  } else {
    maximizeChatbot();
  }
}

function adjustChatbotHeight() {
  const chatbot = document.getElementById("chatbot");
  const chatForm = document.getElementById("chat_form");
  if (!chatbot.classList.contains("max_chat")) return;

  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  const width = window.innerWidth;
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isIOS) {
    // Simplificar para iOS: dejar que el navegador maneje el teclado
    chatbot.style.position = "absolute"; // Cambiar a absolute para evitar conflictos con el teclado
    chatbot.style.top = "auto";
    chatbot.style.bottom = "0";
    chatbot.style.height = "auto"; // Permitir que el contenido determine la altura
    chatbot.style.width = "100%";
    chatbot.style.margin = "0";
    document.documentElement.style.setProperty("--keyboard-height", "0px");
    console.log("iOS: Comportamiento simplificado para teclado virtual");
  } else {
    // Mantener comportamiento original para Android y otros dispositivos
    if (width <= 500) {
      chatbot.style.height = `${viewportHeight}px`;
      chatbot.style.width = "100vw";
      document.documentElement.style.setProperty("--keyboard-height", "0px");
      console.log("Mobile Height (non-iOS):", viewportHeight);
    } else {
      chatbot.style.height = "70vh";
      chatbot.style.width = "20vw";
      chatbot.style.margin = "0";
      document.documentElement.style.setProperty("--keyboard-height", "0px");
      console.log("PC Height:", chatbot.style.height);
    }
  }

  chatForm.style.display = "flex";
  chatForm.style.position = "sticky";
  chatForm.style.bottom = "0";
  scrollToBottom();
}


function initializeChatbot() {
  const chatbot = document.getElementById("chatbot");
  chatbot.style.opacity = "1";
  chatbot.style.visibility = "visible";
  chatbot.classList.remove("max_chat");
  adjustChatbotPosition();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadIntents();
  updatePavoMsj();
  handleNameForm();

  const chatMinButton = document.getElementById("chat_min");
  if (isStandalone() && chatMinButton) {
    chatMinButton.style.display = "none";
  }
 
  initializeChatbot();
  chatMinButton.addEventListener("click", (e) => {
    e.preventDefault();
    toggleChatbot();
  });

  window.visualViewport?.addEventListener("resize", () => {
    adjustChatbotHeight();
    adjustChatbotPosition();
  });
  window.addEventListener("resize", () => {
    adjustChatbotHeight();
    adjustChatbotPosition();
  });

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

  window.addEventListener("beforeunload", () => {
    if (messageBuffer.length > 0) {
      saveMessagesToFirebase();
    }
  });
});