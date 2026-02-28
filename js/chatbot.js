// chatbot.js
import { app, database, ref, push, set, get } from "./firebase.js";

let intents = [];
let messageBuffer = [];
let userName = localStorage.getItem("userName") || "Humano";
let userIdName = localStorage.getItem("userIdName");

function generateRandomId() {
  return Math.random().toString(36).substring(2, 8);
}

////////////Aqui nueva funcion con Claude

// ─── PEGAR ESTO en chatbot.js donde estaban las funciones borradas ────────────

// ── Configuración de umbrales ─────────────────────────────────────────────────
const SCORE = {
  HIGH: 8, // ≥8  → responde directo del JSON
  LOW: 3, // 3-7 → consulta caché Firebase
  CACHE_SIM: 0.72,
};

// ── normalizeText (reemplaza la que tenías, ahora también quita puntuación) ────
function normalizeText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[¿?¡!.,;:]/g, "")
    .trim();
}

// ── Levenshtein ───────────────────────────────────────────────────────────────
function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1,
            );
    }
  }
  return matrix[b.length][a.length];
}

function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  return (longer.length - levenshteinDistance(longer, shorter)) / longer.length;
}

// ── CAPA 2: getBestIntent optimizado ─────────────────────────────────────────
function getBestIntent(message) {
  const normalizedMsg = normalizeText(message);
  const msgWords = normalizedMsg.split(" ").filter((w) => w.length > 2);
  let best = null;
  let bestScore = 0;

  for (const intent of intents) {
    let score = 0;

    for (const keyword of intent.keywords) {
      const normalizedKw = normalizeText(keyword);

      // Coincidencia exacta de frase completa
      if (normalizedMsg === normalizedKw) {
        score += 12;
        continue;
      }

      // Frase contenida
      if (normalizedMsg.includes(normalizedKw)) {
        score += 6 + normalizedKw.length * 0.15;
        continue;
      }

      // Similitud Levenshtein
      const sim = calculateSimilarity(normalizedMsg, normalizedKw);
      if (sim > 0.85) score += 5;
      else if (sim > 0.7) score += 3;
      else if (sim > 0.55) score += 1.5;

      // Palabras individuales (las largas valen más)
      const kwWords = normalizedKw.split(" ").filter((w) => w.length > 2);
      for (const word of kwWords) {
        if (msgWords.includes(word)) score += 1 + (word.length > 5 ? 0.5 : 0);
      }
    }

    // Penalización mensajes muy cortos
    if (normalizedMsg.length < 4 && intent.tag !== "Saludos") score *= 0.4;

    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }

  return { intent: best, score: bestScore };
}

// ── CAPA 3: Caché Firebase ────────────────────────────────────────────────────
function messageFingerprint(message) {
  return normalizeText(message)
    .split(" ")
    .filter((w) => w.length > 2)
    .sort()
    .join("_")
    .substring(0, 80);
}

async function checkFirebaseCache(message) {
  try {
    const fingerprint = messageFingerprint(message);
    const cacheRef = ref(database, `intent_cache/${fingerprint}`);
    const snap = await get(cacheRef);
    if (snap.exists()) {
      const cached = snap.val();
      const sim = calculateSimilarity(
        normalizeText(message),
        normalizeText(cached.originalMessage),
      );
      if (sim >= SCORE.CACHE_SIM) {
        // Incrementar uso (no bloqueante)
        set(
          ref(database, `intent_cache/${fingerprint}/usedCount`),
          (cached.usedCount || 0) + 1,
        );
        console.log(`✅ Cache hit Firebase: ${cached.intentTag}`);
        return cached.intentTag;
      }
    }
  } catch (err) {
    console.warn("⚠️ Firebase cache error:", err);
  }
  return null;
}

async function saveToFirebaseCache(message, intentTag) {
  try {
    const fingerprint = messageFingerprint(message);
    await set(ref(database, `intent_cache/${fingerprint}`), {
      originalMessage: message,
      intentTag,
      usedCount: 1,
      savedAt: new Date().toISOString(),
    });
    console.log(`💾 Guardado en caché: "${message}" → ${intentTag}`);
  } catch (err) {
    console.warn("⚠️ No se pudo guardar en caché:", err);
  }
}

// ── CAPA 4: Claude via Netlify Function ───────────────────────────────────────
async function classifyWithClaude(message) {
  const intentList = intents.map((i) => i.tag).join(", ");
  try {
    const response = await fetch("/.netlify/functions/classify-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, intentList }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.intentTag || null;
  } catch (err) {
    console.error("❌ Claude classify error:", err);
    return null;
  }
}

// ── ORQUESTADOR: reemplaza getResponse() ─────────────────────────────────────
async function getResponse(message) {
  if (!intents.length) return "Lo siento, no puedo responder en este momento.";

  // CAPA 2: Levenshtein
  const { intent, score } = getBestIntent(message);
  console.log(`📊 Score Levenshtein: ${score.toFixed(1)}`);

  if (score >= SCORE.HIGH && intent) {
    console.log(`✅ CAPA 2 → ${intent.tag}`);
    return buildResponse(intent);
  }

  // CAPA 3: Caché Firebase
  if (score >= SCORE.LOW) {
    const cachedTag = await checkFirebaseCache(message);
    if (cachedTag) {
      const cachedIntent = intents.find((i) => i.tag === cachedTag);
      if (cachedIntent) {
        console.log(`✅ CAPA 3 → ${cachedTag}`);
        return buildResponse(cachedIntent);
      }
    }
  }

  // CAPA 4: Claude
  console.log(`🧠 CAPA 4 → Claude...`);
  const claudeTag = await classifyWithClaude(message);
  if (claudeTag) {
    const claudeIntent = intents.find((i) => i.tag === claudeTag);
    if (claudeIntent) {
      console.log(`✅ CAPA 4 → ${claudeTag}`);
      saveToFirebaseCache(message, claudeTag); // guardar para la próxima
      return buildResponse(claudeIntent);
    }
  }

  // FALLBACK
  saveUnansweredMessage(message);
  return `¡Glu-glu! No estoy seguro de lo que quieres decir, ${userName}. ¿Podrías explicarlo de otra manera? 🦃✨\n\nPuedes preguntarme sobre:\n• Vacantes disponibles 🏢\n• Requisitos para aplicar 📋\n• Sueldo y beneficios 💰\n• Horarios de trabajo ⏰\n• Sucursales disponibles 📍`;
}

function buildResponse(intent) {
  return intent.responses[
    Math.floor(Math.random() * intent.responses.length)
  ].replace("${userName}", userName);
}

async function loadIntents() {
  const cachedIntents = localStorage.getItem("intents");
  if (cachedIntents) {
    intents = JSON.parse(cachedIntents).intents || [];
    console.log("✅ Intents cargados desde caché:", intents);
    return;
  }

  try {
    // Primero intentamos cargar localmente
    try {
      const localResponse = await fetch("/json/intents.json");
      if (localResponse.ok) {
        const data = await localResponse.json();
        intents = data.intents || [];
        localStorage.setItem("intents", JSON.stringify(data));
        console.log("✅ Intents cargados localmente:", intents);
        return;
      }
    } catch (localError) {
      console.log("⚠️ No se pudo cargar localmente, intentando desde URL...");
    }

    // Si falla la carga local, intentamos desde la URL
    const response = await fetch(
      "https://mmm-rh.netlify.app/json/intents.json",
      {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      },
    );

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    intents = data.intents || [];
    localStorage.setItem("intents", JSON.stringify(data));
    console.log("✅ Intents cargados desde URL:", intents);
  } catch (error) {
    console.error("❌ Error cargando intents:", error);
    showError(
      "No se pudieron cargar las respuestas. Intenta de nuevo más tarde.",
    );
  }
}

async function saveMessagesToFirebase() {
  if (!userIdName || !messageBuffer.length) return;
  try {
    const userRef = ref(database, `chatMessages/${userIdName}`);
    await push(userRef, { messages: [...messageBuffer] });
    console.log(`✅ ${messageBuffer.length} mensajes guardados en Firebase`);
    messageBuffer = [];
  } catch (error) {
    console.error("❌ Error guardando mensajes en Firebase:", error);
  }
}

async function saveUnansweredMessage(message) {
  try {
    const messagesRef = ref(database, "mensajes_error");
    await set(push(messagesRef), {
      message,
      timestamp: new Date().toISOString(),
    });
    console.log("📌 Mensaje sin respuesta guardado:", message);
  } catch (error) {
    console.error("❌ Error guardando mensaje sin respuesta:", error);
  }
}

function sendMessage(sender, message, isBot = false) {
  const chatBox = document.getElementById("chat_box");
  const messageElement = document.createElement("div");
  messageElement.className = isBot ? "bot_message" : "user_message";
  messageElement.innerHTML = isBot
    ? `<span>Sr.Pavo Chava</span><p>${message}</p>`
    : `<p>${message}</p>`;

  messageBuffer.push({
    sender: isBot ? "Sr.Pavo Chava" : userIdName,
    message,
    timestamp: new Date().toISOString(),
  });

  chatBox.appendChild(messageElement);

  // Asegurar que el mensaje sea visible
  if (!isBot) {
    scrollToBottom();
  } else {
    // Para mensajes del bot, esperar a que se renderice
    setTimeout(scrollToBottom, 100);
  }

  if (messageBuffer.length >= 10) saveMessagesToFirebase();
}

function insertarEspaciadorInicial() {
  const chatBox = document.getElementById("chat_box");
  const espaciador = document.createElement("div");
  espaciador.style.height = "100%"; // o el espacio que necesites
  espaciador.className = "espaciador-inicial";
  chatBox.appendChild(espaciador);
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

function scrollToBottom() {
  const chatBox = document.getElementById("chat_box");
  if (chatBox) {
    const scrollOptions = {
      top: chatBox.scrollHeight,
      behavior: "smooth",
    };

    // En iOS, usar scrollTo con un pequeño delay para mejor compatibilidad
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      setTimeout(() => {
        chatBox.scrollTo(scrollOptions);
      }, 100);
    } else {
      chatBox.scrollTo(scrollOptions);
    }
  }
}

function sendWelcomeMessage() {
  if (!userIdName) return;
  const saludosIntent = intents.find((intent) => intent.tag === "Saludos");
  const message = saludosIntent
    ? saludosIntent.responses[
        Math.floor(Math.random() * saludosIntent.responses.length)
      ].replace("${userName}", userName)
    : `¡Hola, ${userName}! ¿En qué puedo ayudarte? 😃`;
  const typingIndicator = showTypingIndicator();
  setTimeout(() => {
    typingIndicator.remove();
    sendMessage("bot", message, true);
  }, 1500);
}

function getRandomTienesPreguntasResponse() {
  const tienesPreguntasIntent = intents.find(
    (intent) => intent.tag === "tienes_preguntas",
  );
  let response =
    tienesPreguntasIntent?.responses[
      Math.floor(Math.random() * tienesPreguntasIntent.responses.length)
    ] || "¿En qué puedo ayudarte?";
  return response.replace("${userName}", userName);
}

function updatePavoMsj() {
  const pavoMsjElement = document.getElementById("pavo_msj");
  if (pavoMsjElement) {
    pavoMsjElement.innerHTML = getRandomTienesPreguntasResponse();
  }
}

function toggleChatbot() {
  const chatbot = document.getElementById("chatbot");
  const pavoCont = document.getElementById("pavo_cont");
  const chatForm = document.getElementById("chat_form");
  const userInfoContainer = document.getElementById("user_info_container");
  const isMobile = window.innerWidth <= 500;

  if (chatbot.classList.contains("max_chat")) {
    // Minimizar
    chatbot.classList.remove("max_chat");
    chatbot.classList.add("chatbot_color");
    pavoCont.style.display = "flex";
    chatForm.style.display = "none";
    userInfoContainer.style.display = "none";
    updatePavoMsj();
  } else {
    // Maximizar
    chatbot.classList.add("max_chat");
    chatbot.classList.remove("chatbot_color");
    pavoCont.style.display = "none";
    chatForm.style.display = userIdName ? "flex" : "none";
    userInfoContainer.style.display = userIdName ? "none" : "flex";

    // En móviles, ajustar el viewport
    if (isMobile) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";
    }

    scrollToBottom();
    if (userIdName) sendWelcomeMessage();
  }
}

function handleNameForm() {
  const nameForm = document.getElementById("name_form");
  const userInfoContainer = document.getElementById("user_info_container");
  const chatForm = document.getElementById("chat_form");
  const chatbot = document.getElementById("chatbot");

  if (!userIdName) {
    userInfoContainer.style.display = "flex";
    chatForm.style.display = "none";
    chatbot.classList.add("max_chat");
    chatbot.classList.remove("chatbot_color");
    scrollToBottom();
    nameForm.addEventListener("submit", (event) => {
      event.preventDefault();
      userName = document.getElementById("user_name").value.trim() || "Humano";
      userIdName = `${generateRandomId()}-${userName}`;
      localStorage.setItem("userIdName", userIdName);
      localStorage.setItem("userName", userName);
      userInfoContainer.style.display = "none";
      chatForm.style.display = "flex";
      document.getElementById("user_id_display").textContent = userIdName;
      scrollToBottom();
      sendWelcomeMessage();
    });
  } else {
    userInfoContainer.style.display = "none";
    chatForm.style.display = "flex";
    document.getElementById("user_id_display").textContent = userIdName;
    scrollToBottom();
  }
}

function handleVirtualKeyboard() {
  const chatForm = document.getElementById("chat_form");
  const chatBox = document.getElementById("chat_box");
  const input = document.getElementById("chat_input");
  const chatbot = document.getElementById("chatbot");
  let fullViewportHeight = window.innerHeight;
  let isKeyboardOpen = false;
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  let resizeTimeout;

  function debounce(func, wait) {
    return function (...args) {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  function handleKeyboardShow() {
    const visualHeight = window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight;
    const isInputFocused = document.activeElement === input;
    isKeyboardOpen = visualHeight < fullViewportHeight * 0.95 && isInputFocused;

    if (isKeyboardOpen) {
      chatbot.classList.add("keyboard-visible");
      const keyboardHeight = fullViewportHeight - visualHeight;

      // Ajustar el viewport para iOS
      if (isIOS) {
        document.body.style.height = `${visualHeight}px`;
        document.body.style.overflow = "hidden";
      }

      // Mantener el input visible
      if (input) {
        const rect = input.getBoundingClientRect();
        const offsetTop = rect.top + window.scrollY;
        const desiredScroll =
          offsetTop - (visualHeight - keyboardHeight - rect.height - 20); // Margen de 20px
        window.scrollTo({
          top: desiredScroll,
          behavior: "smooth",
        });
      }

      // Asegurar que el chat esté en la parte inferior
      setTimeout(() => scrollToBottom(), 200);
    }
  }

  function handleKeyboardHide() {
    isKeyboardOpen = false;
    chatbot.classList.remove("keyboard-visible");
    fullViewportHeight = window.innerHeight;

    if (isIOS) {
      document.body.style.height = "";
      document.body.style.overflow = "";
    }

    setTimeout(() => scrollToBottom(), 200);
  }

  input.addEventListener("focus", handleKeyboardShow);
  input.addEventListener("blur", handleKeyboardHide);

  if (window.visualViewport) {
    window.visualViewport.addEventListener(
      "resize",
      debounce(() => {
        const visualHeight = window.visualViewport.height;
        if (
          visualHeight < fullViewportHeight * 0.95 &&
          document.activeElement === input
        ) {
          handleKeyboardShow();
        } else {
          handleKeyboardHide();
        }
      }, 100),
    );
  }

  window.addEventListener(
    "resize",
    debounce(() => {
      const currentHeight = window.innerHeight;
      if (
        currentHeight < fullViewportHeight * 0.95 &&
        document.activeElement === input
      ) {
        handleKeyboardShow();
      } else {
        handleKeyboardHide();
      }
      fullViewportHeight = window.innerHeight;
    }, 100),
  );

  if (isIOS) {
    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        fullViewportHeight = window.innerHeight;
        if (isKeyboardOpen) handleKeyboardShow();
      }, 200);
    });
  }

  document.body.addEventListener(
    "touchmove",
    (e) => {
      if (isKeyboardOpen && !e.target.closest("#chat_box")) {
        e.preventDefault();
      }
    },
    { passive: false },
  );
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadIntents();
  handleNameForm();
  updatePavoMsj();
  handleVirtualKeyboard();

  const chatbot = document.getElementById("chatbot");
  const chatMinButton = document.getElementById("chat_min");
  const form = document.getElementById("chat_form");
  const input = document.getElementById("chat_input");
  const sendButton = document.getElementById("chat_submit");
  const chatBox = document.getElementById("chat_box");

  if (!form || !input || !sendButton || !chatBox || !chatMinButton) {
    console.error("Elementos del chatbot no encontrados.");
    return;
  }

  chatBox.innerHTML = localStorage.getItem("chatHistory") || "";
  insertarEspaciadorInicial();
  chatbot.classList.remove("max_chat");

  chatMinButton.addEventListener("click", (e) => {
    e.preventDefault();
    toggleChatbot();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const userMessage = input.value.trim();
    if (!userMessage) return;

    input.value = "";
    sendButton.disabled = true;
    sendMessage("user", userMessage);
    const typingIndicator = showTypingIndicator();

    const botResponse = await getResponse(userMessage);

    typingIndicator.remove();
    sendMessage("bot", botResponse, true);
    localStorage.setItem("chatHistory", chatBox.innerHTML);
    sendButton.disabled = false;
    scrollToBottom();
  });

  window.addEventListener("beforeunload", () => {
    if (messageBuffer.length > 0) saveMessagesToFirebase();
  });

  // Manejo del teclado virtual
  input.addEventListener("focus", () => {
    if (/iPhone|iPad|iPod|Android/.test(navigator.userAgent)) {
      setTimeout(() => {
        // No desplazar automáticamente, mantener el formulario visible
        const chatForm = document.getElementById("chat_form");
        if (chatForm) {
          chatForm.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }, 300);
    }
  });
});
