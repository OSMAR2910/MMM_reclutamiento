import { saveUnansweredMessage } from "./database.js";

let intents = [];
let isWelcomeMessageSent = false;

async function loadIntents() {
  try {
    const response = await fetch("./json/intents.json");
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    intents = data.intents || [];
    console.log("✅ Intents cargados correctamente:", intents);
  } catch (error) {
    console.error("❌ Error cargando intents.json:", error);
    alert(`Error cargando intents.json: ${error.message}. Verifica la consola.`);
  }
}

function normalizeText(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function getResponse(message) {
  message = normalizeText(message);

  if (!intents.length) {
    console.error("⚠️ Intents no están cargados.");
    return "Lo siento, no puedo responder en este momento.";
  }

  for (const intent of intents) {
    console.log(`🔍 Intento detectar coincidencia en: ${intent.tag}`);
    if (intent.keywords.some(keyword => message.includes(normalizeText(keyword)))) {
      console.log(`✅ Coincidencia en '${intent.tag}'`);
      return intent.responses[Math.floor(Math.random() * intent.responses.length)];
    }
  }

  console.log("🚫 Ninguna coincidencia encontrada.");
  saveUnansweredMessage(message);
  return "Mmm, no sé a qué te refieres. ¿Podrías intentarlo de otra manera?";
}

function sendMessage(sender, message, isBot = false) {
  const chatBox = document.getElementById("chat_box");
  const messageElement = document.createElement("strong");
  messageElement.className = isBot ? "bot_message" : "user_message";

  if (isBot) {
    messageElement.innerHTML = `<span>Sr.Pavo Chava</span><p>${message}</p>`;
  } else {
    messageElement.innerHTML = `<p>${message}</p>`;
  }

  chatBox.appendChild(messageElement);
  scrollToBottom();
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
  if (isWelcomeMessageSent) return;
  isWelcomeMessageSent = true;
  showTypingIndicator();
  
  setTimeout(() => {
    document.querySelector(".typing")?.remove();
    sendMessage("bot", "¡Hola! ¿En qué puedo ayudarte? 😃", true);
  }, 2000);
}

function scrollToBottom() {
  const chatBox = document.getElementById("chat_box");
  chatBox.scrollTop = chatBox.scrollHeight;
}

document.getElementById("chat_min").addEventListener("click", () => {
  const chatBox = document.getElementById("chatbot");
  chatBox.classList.toggle("max_chat");

  if (chatBox.classList.contains("max_chat")) {
    sendWelcomeMessage();
    setTimeout(scrollToBottom, 0);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Cargando intents...");
  await loadIntents();
  console.log("✅ Intents cargados.");

  const form = document.getElementById("chat_form");
  const input = document.getElementById("chat_input");
  const sendButton = document.getElementById("chat_submit");
  const chatBox = document.getElementById("chat_box");

  if (!form || !input || !sendButton || !chatBox) {
    console.error("❌ Elementos del chat no encontrados.");
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
