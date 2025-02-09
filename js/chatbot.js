import { saveUnansweredMessage } from "./database.js";

let intents = [];
let isWelcomeMessageSent = false;

// Cargar intents desde el JSON
async function loadIntents() {
  try {
    const response = await fetch("./json/intents.json");
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    intents = data.intents || [];
    console.log("✅ Intents cargados correctamente:", intents);
  } catch (error) {
    console.error("❌ Error cargando intents.json:", error);
  }
}

// Normalizar texto (eliminar tildes y convertir a minúsculas)
function normalizeText(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Encontrar la mejor intención basada en palabras clave
function getBestIntent(message) {
  message = normalizeText(message);
  let bestMatch = null;
  let bestScore = 0;

  for (const intent of intents) {
    let score = 0;

    for (const keyword of intent.keywords) {
      const normalizedKeyword = normalizeText(keyword);
      if (message.includes(normalizedKeyword)) {
        score++; // Aumentamos el puntaje si hay coincidencia
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = intent;
    }
  }

  // Si no hay una coincidencia fuerte, devuelve null
  return bestScore > 0 ? bestMatch : null;
}

// Obtener la respuesta basada en la mejor intención detectada
function getResponse(message) {
  if (!intents.length) {
    console.error("⚠️ Intents no están cargados.");
    return "Lo siento, no puedo responder en este momento.";
  }

  const bestIntent = getBestIntent(message);

  if (bestIntent) {
    console.log(`✅ Coincidencia encontrada: '${bestIntent.tag}'`);
    return bestIntent.responses[Math.floor(Math.random() * bestIntent.responses.length)];
  }

  console.log("🚫 No encontré una respuesta adecuada.");
  saveUnansweredMessage(message);
  return "No estoy seguro de lo que quieres decir. ¿Podrías explicarlo de otra manera?";
}

// Enviar mensajes al chat
function sendMessage(sender, message, isBot = false) {
  const chatBox = document.getElementById("chat_box");
  const messageElement = document.createElement("div");
  messageElement.className = isBot ? "bot_message" : "user_message";

  if (isBot) {
    messageElement.innerHTML = `<span>Sr.Pavo Chava</span><p>${message}</p>`;
  } else {
    messageElement.innerHTML = `<p>${message}</p>`;
  }

  chatBox.appendChild(messageElement);
  scrollToBottom();
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

// Enviar mensaje de bienvenida solo una vez
function sendWelcomeMessage() {
  if (isWelcomeMessageSent) return;
  isWelcomeMessageSent = true;

  // Buscar el intent con el tag "Saludos"
  const saludosIntent = intents.find(intent => intent.tag === "Saludos");

  if (saludosIntent && saludosIntent.responses && saludosIntent.responses.length > 0) {
    // Seleccionar un saludo al azar
    const randomSaludo = saludosIntent.responses[Math.floor(Math.random() * saludosIntent.responses.length)];

    // Mostrar indicador de escritura
    showTypingIndicator();

    // Enviar el mensaje de bienvenida después de un retraso
    setTimeout(() => {
      document.querySelector(".typing")?.remove();
      sendMessage("bot", randomSaludo, true);
    }, 2000);
  } else {
    console.error("❌ No se encontró el tag 'Saludos' o no tiene respuestas.");
    sendMessage("bot", "¡Hola! ¿En qué puedo ayudarte? 😃", true); // Respuesta por defecto
  }
}

// Función para obtener una respuesta aleatoria del tag 'tienes_preguntas'
function getRandomTienesPreguntasResponse() {
  // Buscar el intent con el tag 'tienes_preguntas'
  const tienesPreguntasIntent = intents.find(intent => intent.tag === "tienes_preguntas");

  if (tienesPreguntasIntent && tienesPreguntasIntent.responses && tienesPreguntasIntent.responses.length > 0) {
    // Seleccionar una respuesta aleatoria
    const randomResponse = tienesPreguntasIntent.responses[Math.floor(Math.random() * tienesPreguntasIntent.responses.length)];
    return randomResponse;
  } else {
    console.error("❌ No se encontró el tag 'tienes_preguntas' o no tiene respuestas.");
    return "¿En qué puedo ayudarte?"; // Respuesta por defecto
  }
}

// Función para mostrar la respuesta en el elemento con ID 'pavo_msj'
function updatePavoMsj() {
  const pavoMsjElement = document.getElementById("pavo_msj");

  if (pavoMsjElement) {
    // Obtener una respuesta aleatoria del tag 'tienes_preguntas'
    const randomResponse = getRandomTienesPreguntasResponse();

    // Actualizar el contenido del elemento con la respuesta dentro de un <span>
    pavoMsjElement.innerHTML = `${randomResponse}`;
  } else {
    console.error("❌ No se encontró el elemento con ID 'pavo_msj'.");
  }
}

// Ejecutar la función cuando se carga el DOM
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Cargando intents...");
  await loadIntents(); // Cargar los intents
  console.log("Intents cargados.");

  // Actualizar el mensaje en 'pavo_msj' después de cargar los intents
  updatePavoMsj();
});

// Mantener el chat en la parte inferior
function scrollToBottom() {
  const chatBox = document.getElementById("chat_box");
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Manejo del botón de minimizar el chat
document.getElementById("chat_min").addEventListener("click", () => {
  const chatBox = document.getElementById("chatbot");
  const pavo = document.getElementById("pavo_cont");

  chatBox.classList.toggle("max_chat");

  if (chatBox.classList.contains("max_chat")) {
    pavo.style.display = 'none';
    sendWelcomeMessage();
    setTimeout(scrollToBottom, 0);
  } else {
    pavo.style.display = 'flex';
  }
});

// Evento de carga del chat
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Cargando intents...");
  await loadIntents();
  console.log("Intents cargados.");

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
});
