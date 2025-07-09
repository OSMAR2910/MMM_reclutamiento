// chatbot.js
import { app, database, ref, push, set } from "./firebase.js";

let intents = [];
let messageBuffer = [];
let userName = localStorage.getItem("userName") || "Humano";
let userIdName = localStorage.getItem("userIdName");
let lastIntentTag = null; // Para mantener contexto de conversación
let conversationContext = []; // Historial de intents recientes

function generateRandomId() {
  return Math.random().toString(36).substring(2, 8);
}

// Función de similitud de texto (distancia de Levenshtein simplificada)
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

// Distancia de Levenshtein para comparar similitud de strings
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Función para obtener contexto de conversación
function getConversationContext() {
  return conversationContext.slice(-3); // Últimos 3 intents
}

// Función para detectar si el mensaje es una continuación del contexto
function isContextContinuation(message, intentTag) {
  const context = getConversationContext();
  const contextKeywords = {
    'Preguntas_Empleo': ['requisitos', 'documentos', 'sueldo', 'beneficios', 'horarios', 'sucursal'],
    'Requisitos_Empleo': ['sueldo', 'beneficios', 'horarios', 'sucursal', 'aplicar', 'postular'],
    'Beneficios_Salario': ['horarios', 'sucursal', 'aplicar', 'postular', 'requisitos'],
    'Horarios_Trabajo': ['sucursal', 'aplicar', 'postular', 'requisitos', 'sueldo'],
    'Sucursales_Ubicacion': ['aplicar', 'postular', 'requisitos', 'sueldo', 'horarios']
  };
  
  const normalizedMessage = normalizeText(message);
  const relevantKeywords = contextKeywords[intentTag] || [];
  
  return relevantKeywords.some(keyword => 
    normalizedMessage.includes(keyword) || 
    calculateSimilarity(normalizedMessage, keyword) > 0.6
  );
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
    const response = await fetch("https://mmm-rh.netlify.app/json/intents.json", {
      method: "GET",
      mode: "cors",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    });
    
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    intents = data.intents || [];
    localStorage.setItem("intents", JSON.stringify(data));
    console.log("✅ Intents cargados desde URL:", intents);
  } catch (error) {
    console.error("❌ Error cargando intents:", error);
    showError("No se pudieron cargar las respuestas. Intenta de nuevo más tarde.");
  }
}

function normalizeText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Función mejorada para obtener el mejor intent
function getBestIntent(message) {
  const normalizedMessage = normalizeText(message);
  let bestMatch = null;
  let bestScore = 0;

  for (const intent of intents) {
    let score = 0;
    
    // 1. Análisis de similitud con cada keyword
    for (const keyword of intent.keywords) {
      const normalizedKeyword = normalizeText(keyword);
      
      // Coincidencia exacta (máxima puntuación)
      if (normalizedMessage === normalizedKeyword) {
        score += 10;
        continue;
      }
      
      // Coincidencia de frase completa
      if (normalizedMessage.includes(normalizedKeyword)) {
        score += 5;
        // Bonus por longitud de keyword (palabras más largas tienen más peso)
        score += normalizedKeyword.length * 0.2;
      }
      
      // Análisis de similitud para errores ortográficos y variaciones
      const similarity = calculateSimilarity(normalizedMessage, normalizedKeyword);
      if (similarity > 0.8) {
        score += 4; // Muy similar
      } else if (similarity > 0.6) {
        score += 2; // Similar
      } else if (similarity > 0.4) {
        score += 1; // Algo similar
      }
      
      // Bonus por palabras individuales en frases largas
      const messageWords = normalizedMessage.split(' ');
      const keywordWords = normalizedKeyword.split(' ');
      
      for (const word of keywordWords) {
        if (messageWords.includes(word) && word.length > 2) {
          score += 1;
        }
      }
    }

    // 2. Bonus por contexto de conversación
    if (lastIntentTag === intent.tag) {
      score += 3; // Mismo tema de conversación
    }
    
    // 3. Bonus por continuación de contexto
    if (isContextContinuation(message, intent.tag)) {
      score += 2;
    }
    
    // 4. Penalización por mensajes muy cortos (excepto saludos)
    if (normalizedMessage.length < 3 && intent.tag !== "Saludos") {
      score *= 0.5;
    }
    
    // 5. Bonus por intents específicos vs generales
    if (intent.tag === "Saludos" && normalizedMessage.length < 10) {
      score += 1; // Los saludos cortos son más probables
    }

    // Actualizar el mejor match si encontramos una puntuación más alta
    if (score > bestScore) {
      bestScore = score;
      bestMatch = intent;
    }
  }

  // Solo devolver un match si la puntuación es significativa
  const threshold = normalizedMessage.length < 5 ? 3 : 2;
  if (bestScore >= threshold) {
    // Actualizar contexto de conversación
    if (bestMatch) {
      lastIntentTag = bestMatch.tag;
      conversationContext.push(bestMatch.tag);
      // Mantener solo los últimos 5 intents
      if (conversationContext.length > 5) {
        conversationContext.shift();
      }
    }
    return bestMatch;
  }
  
  return null;
}

function getResponse(message) {
  if (!intents.length) return "Lo siento, no puedo responder en este momento.";
  
  const bestIntent = getBestIntent(message);
  if (bestIntent) {
    return bestIntent.responses[Math.floor(Math.random() * bestIntent.responses.length)].replace(
      "${userName}",
      userName
    );
  }
  
  // Respuesta mejorada cuando no entiende
  saveUnansweredMessage(message);
  
  // Sugerir temas basados en el contexto
  const context = getConversationContext();
  let suggestion = "";
  
  if (context.length > 0) {
    const lastContext = context[context.length - 1];
    const suggestions = {
      'Preguntas_Empleo': '¿Te gustaría saber sobre requisitos, sueldo o sucursales?',
      'Requisitos_Empleo': '¿Quieres conocer el sueldo, horarios o dónde aplicar?',
      'Beneficios_Salario': '¿Te interesa saber sobre horarios o sucursales disponibles?',
      'Horarios_Trabajo': '¿Quieres conocer las sucursales o cómo aplicar?',
      'Sucursales_Ubicacion': '¿Te gustaría saber cómo aplicar o los requisitos?'
    };
    suggestion = suggestions[lastContext] || "";
  }
  
  const baseResponse = `¡Glu-glu! No estoy seguro de lo que quieres decir, ${userName}. ¿Podrías explicarlo de otra manera? 🦃✨`;
  
  if (suggestion) {
    return `${baseResponse}\n\n${suggestion}`;
  }
  
  return `${baseResponse}\n\nPuedes preguntarme sobre:\n• Vacantes disponibles 🏢\n• Requisitos para aplicar 📋\n• Sueldo y beneficios 💰\n• Horarios de trabajo ⏰\n• Sucursales disponibles 📍`;
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
    await set(push(messagesRef), { message, timestamp: new Date().toISOString() });
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
    timestamp: new Date().toISOString() 
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
      behavior: 'smooth'
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
    ? saludosIntent.responses[Math.floor(Math.random() * saludosIntent.responses.length)].replace(
        "${userName}",
        userName
      )
    : `¡Hola, ${userName}! ¿En qué puedo ayudarte? 😃`;
  const typingIndicator = showTypingIndicator();
  setTimeout(() => {
    typingIndicator.remove();
    sendMessage("bot", message, true);
  }, 1500);
}

function getRandomTienesPreguntasResponse() {
  const tienesPreguntasIntent = intents.find((intent) => intent.tag === "tienes_preguntas");
  let response =
    tienesPreguntasIntent?.responses[Math.floor(Math.random() * tienesPreguntasIntent.responses.length)] ||
    "¿En qué puedo ayudarte?";
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
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
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
    const visualHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const isInputFocused = document.activeElement === input;
    isKeyboardOpen = visualHeight < fullViewportHeight * 0.95 && isInputFocused;

    if (isKeyboardOpen) {
      chatbot.classList.add('keyboard-visible');
      const keyboardHeight = fullViewportHeight - visualHeight;

      // Ajustar el viewport para iOS
      if (isIOS) {
        document.body.style.height = `${visualHeight}px`;
        document.body.style.overflow = 'hidden';
      }

      // Mantener el input visible
      if (input) {
        const rect = input.getBoundingClientRect();
        const offsetTop = rect.top + window.scrollY;
        const desiredScroll = offsetTop - (visualHeight - keyboardHeight - rect.height - 20); // Margen de 20px
        window.scrollTo({
          top: desiredScroll,
          behavior: 'smooth'
        });
      }

      // Asegurar que el chat esté en la parte inferior
      setTimeout(() => scrollToBottom(), 200);
    }
  }

  function handleKeyboardHide() {
    isKeyboardOpen = false;
    chatbot.classList.remove('keyboard-visible');
    fullViewportHeight = window.innerHeight;

    if (isIOS) {
      document.body.style.height = '';
      document.body.style.overflow = '';
    }

    setTimeout(() => scrollToBottom(), 200);
  }

  input.addEventListener("focus", handleKeyboardShow);
  input.addEventListener("blur", handleKeyboardHide);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', debounce(() => {
      const visualHeight = window.visualViewport.height;
      if (visualHeight < fullViewportHeight * 0.95 && document.activeElement === input) {
        handleKeyboardShow();
      } else {
        handleKeyboardHide();
      }
    }, 100));
  }

  window.addEventListener('resize', debounce(() => {
    const currentHeight = window.innerHeight;
    if (currentHeight < fullViewportHeight * 0.95 && document.activeElement === input) {
      handleKeyboardShow();
    } else {
      handleKeyboardHide();
    }
    fullViewportHeight = window.innerHeight;
  }, 100));

  if (isIOS) {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        fullViewportHeight = window.innerHeight;
        if (isKeyboardOpen) handleKeyboardShow();
      }, 200);
    });
  }

  document.body.addEventListener('touchmove', (e) => {
    if (isKeyboardOpen && !e.target.closest('#chat_box')) {
      e.preventDefault();
    }
  }, { passive: false });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadIntents();
  handleNameForm();
  updatePavoMsj();
  handleVirtualKeyboard()

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
      scrollToBottom();
    }, 1500);

    input.value = "";
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