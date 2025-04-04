import { getUserRef, database, set, ref, get, onValue, auth, getAudioEnabled, setAudioEnabled } from './database.js';
import { initializeAudioForIOS } from './main.js';
import { checkUnlockedAvatars, checkUnlockedCategories, updateLockedAvatars, updateLockedCategories, syncLockedContent, setupLockedContentListener, LOCKED_CONTENT } from './lockedContent.js';
// Estado del juego
let errors = localStorage.getItem("playerErrors") ? parseInt(localStorage.getItem("playerErrors")) : 0;
let playerPoints = localStorage.getItem("playerPoints") ? parseInt(localStorage.getItem("playerPoints")) : 0;
let highScores = JSON.parse(localStorage.getItem("highScores")) || {};
let playerName = localStorage.getItem("playerName") || "JUGADOR";
let playerAvatar = localStorage.getItem("playerAvatar") || "default";
let currentCategory = localStorage.getItem("singlePlayerCategory") || "general";
export let unlockedCategories = {};
export let unlockedAvatars = {};
let isAnswersLocked = false; 
let avatarMap = {};
const correctAudio = new Audio("./effect/correcta_equipos.aac");
const incorrectAudio = new Audio("./effect/incorrecta.aac");

let currentQuestionId = null;

const actualizarCategoriaActiva = (categoria) => {
  currentCategory = categoria;
  const categoriaActivaElement = document.getElementById("categoria_activa");
  if (categoriaActivaElement) {
    categoriaActivaElement.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
  }
  console.log(`Categoría activa actualizada a: ${categoria}`);
};

// Inicializar audios
const initializeSinglePlayerAudio = () => {
  [correctAudio, incorrectAudio].forEach((audio, index) => {
    const name = index === 0 ? "correctAudio" : "incorrectAudio";
    audio.pause();
    audio.currentTime = 0;
    audio.load();
    audio.play().then(() => {
      audio.pause();
      console.log(`${name} preparado para modo single-player`);
    }).catch(err => console.error(`Error al preparar ${name}:`, err));
  });
};

// Obtener preguntas mostradas desde localStorage
const getShownQuestions = (category) => {
  const key = `shownQuestions_${category}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

// Guardar preguntas mostradas en localStorage
const setShownQuestions = (category, shownQuestions) => {
  const key = `shownQuestions_${category}`;
  localStorage.setItem(key, JSON.stringify(shownQuestions));
};

// Reiniciar preguntas mostradas
const resetShownQuestions = (category) => {
  const key = `shownQuestions_${category}`;
  localStorage.removeItem(key);
  console.log(`Preguntas mostradas reiniciadas para categoría: ${category}`);
};

const loadAvatarsDynamically = async () => {
  try {
    const response = await fetch("../json/avatars.json");
    if (!response.ok) throw new Error("Error al cargar avatars.json");
    const data = await response.json();
    console.log("Avatares cargados dinámicamente:", data);
    return data;
  } catch (error) {
    console.error("Error al cargar avatares:", error);
    return { default: "img/avatars/default.png" };
  }
};

// singlePlayer.js (fragmento de setupAvatars)
export const setupAvatars = async (teams = ["player"], options = {}) => {
  console.log("Iniciando setupAvatars con equipos:", teams);
  const { mode1Selector = "avatar-", selectClass = "avatar-select", optionClass = "avatar-option", onAvatarChange = () => {} } = options;

  const loadedAvatars = await loadAvatarsDynamically();
  avatarMap = loadedAvatars;

  const playerRef = getUserRef("singlePlayer");
  if (playerRef) {
    const snapshot = await get(playerRef);
    const data = snapshot.val() || {};
    highScores = data.highScores || highScores;
    unlockedAvatars = checkUnlockedAvatars(highScores);
    playerAvatar = data.avatar || playerAvatar;
    localStorage.setItem("playerAvatar", playerAvatar);
    localStorage.setItem("highScores", JSON.stringify(highScores));
  }

  teams.forEach((teamId) => {
    const avatarImgMode1 = document.getElementById(`${mode1Selector}${teamId}`);
    const avatarSelect = document.getElementById(`${selectClass}-${teamId}`);

    if (!avatarImgMode1 || !avatarSelect) {
      console.error(`Faltan elementos: avatarImgMode1=${avatarImgMode1}, avatarSelect=${avatarSelect}`);
      return;
    }

    // Establecer el avatar inicial
    avatarImgMode1.src = loadedAvatars[playerAvatar] || loadedAvatars.default;
    avatarImgMode1.dataset.avatarId = playerAvatar;

    // Rellenar las opciones con imágenes
    avatarSelect.innerHTML = Object.entries(loadedAvatars)
      .map(([avatarId, avatarSrc]) => {
        const isUnlocked = unlockedAvatars[avatarId] || LOCKED_CONTENT.avatars[avatarId]?.unlocked || false;
        return `<img src="${avatarSrc}" data-avatar="${avatarId}" alt="${avatarId}" class="${optionClass} ${!isUnlocked ? 'locked' : ''}" ${!isUnlocked ? 'title="Bloqueado"' : ''}>`;
      })
      .join("");

    // Evento para mostrar/ocultar las opciones
    avatarImgMode1.addEventListener("click", (e) => {
      e.stopPropagation();
      avatarSelect.style.display = avatarSelect.style.display === "none" ? "flex" : "none";
      console.log("Mostrando/ocultando opciones de avatares");
    });

    // Evento para seleccionar un avatar
    avatarSelect.querySelectorAll(`.${optionClass}`).forEach((option) => {
      option.addEventListener("click", async (e) => {
        e.stopPropagation();
        const selectedAvatarId = option.dataset.avatar;
        const isUnlocked = unlockedAvatars[selectedAvatarId] || LOCKED_CONTENT.avatars[selectedAvatarId]?.unlocked || false;

        if (isUnlocked) {
          const avatarSrc = loadedAvatars[selectedAvatarId] || loadedAvatars.default;
          avatarImgMode1.src = avatarSrc;
          avatarImgMode1.dataset.avatarId = selectedAvatarId;
          playerAvatar = selectedAvatarId;
          localStorage.setItem("playerAvatar", playerAvatar);

          const playerAvatarRef = getUserRef("singlePlayer/avatar");
          try {
            await set(playerAvatarRef, selectedAvatarId);
            console.log(`Avatar actualizado a ${selectedAvatarId} en Firebase`);
            avatarSelect.style.display = "none";
            await updateFirebasePlayerData();
            onAvatarChange(teamId, selectedAvatarId, avatarSrc);
          } catch (err) {
            console.error(`Error al guardar avatar:`, err);
          }
        } else {
          option.classList.add("shake");
          setTimeout(() => option.classList.remove("shake"), 500);
          option.classList.add("locked");
          console.log(`Avatar ${selectedAvatarId} está bloqueado`);
        }
      });
    });

    // Listener en tiempo real para sincronizar desde Firebase
    const avatarRef = getUserRef(`singlePlayer/avatar`);
    if (avatarRef) {
      onValue(avatarRef, (snapshot) => {
        const firebaseAvatarId = snapshot.val() || "default";
        if (firebaseAvatarId !== playerAvatar) {
          playerAvatar = firebaseAvatarId;
          localStorage.setItem("playerAvatar", playerAvatar);
          const avatarSrc = loadedAvatars[playerAvatar] || loadedAvatars.default;
          avatarImgMode1.src = avatarSrc;
          avatarImgMode1.dataset.avatarId = playerAvatar;
          console.log(`Avatar sincronizado desde Firebase: ${playerAvatar}`);
        }
      });
    }
  });

  updateLockedAvatars(unlockedAvatars);
};

// Cargar pregunta aleatoria para modo single-player (renombrada)
export const cargarPreguntaAleatoriaSinglemode = () => {
  console.log("Cargando nueva pregunta para categoría:", currentCategory);
  fetch("../json/P&R_single.json")
    .then((response) => {
      if (!response.ok) throw new Error("Error al cargar P&R_single.json");
      return response.json();
    })
    .then((data) => {
      const preguntas = data.tags.filter((tag) => tag.categoria === currentCategory);
      if (!preguntas || preguntas.length === 0) {
        console.warn(`No hay preguntas para '${currentCategory}', usando 'general'`);
        currentCategory = "general";
        localStorage.setItem("singlePlayerCategory", currentCategory);
        return cargarPreguntaAleatoriaSinglemode();
      }

      const preguntasConIndices = preguntas.map((pregunta, index) => ({ ...pregunta, id: index }));
      let shownQuestions = getShownQuestions(currentCategory);

      if (shownQuestions.length >= preguntasConIndices.length) {
        console.log(`Todas las preguntas de '${currentCategory}' han sido respondidas, reiniciando...`);
        resetShownQuestions(currentCategory);
        shownQuestions = [];
      }

      const preguntasDisponibles = preguntasConIndices.filter((pregunta) => !shownQuestions.includes(pregunta.id));
      const randomIndex = Math.floor(Math.random() * preguntasDisponibles.length);
      const pregunta = preguntasDisponibles[randomIndex];
      currentQuestionId = pregunta.id;

      const preguntaElement = document.getElementById("pregunta-single");
      if (preguntaElement) preguntaElement.textContent = pregunta.pregunta;

      const respuestasCont = document.getElementById("respuestas__cont_single");
      if (respuestasCont) {
        const respuestasMezcladas = [...pregunta.respuestas];
        respuestasMezcladas.sort(() => Math.random() - 0.5);

        // Reactivar las opciones eliminando la clase disabled-dark de .respuesta_input.btn_label_res_single
        const inputsTexto = respuestasCont.querySelectorAll(".respuesta_input.btn_label_res_single");
        inputsTexto.forEach((input) => {
          input.classList.remove("disabled-dark");
        });

        // Actualizar los valores de los inputs
        const allInputsTexto = respuestasCont.querySelectorAll(".respuesta_input"); // Seleccionar todos los .respuesta_input para actualizar
        respuestasMezcladas.forEach((respuesta, index) => {
          if (index < allInputsTexto.length) {
            const inputTexto = allInputsTexto[index];
            const inputValor = respuestasCont.querySelectorAll(".respuesta_input_value")[index];
            if (inputTexto && inputValor) {
              inputTexto.id = `input_res${index + 1}_single`;
              inputTexto.value = respuesta.texto || "";
              inputTexto.dataset.correct = respuesta.correcta === true ? "true" : "false";
              inputTexto.dataset.points = respuesta.puntos || "0";
              inputValor.value = respuesta.puntos || "0";
              inputTexto.readOnly = true;
              inputValor.readOnly = true;
              // Asegurarse de que btn_label_res_single esté presente si es necesario
              inputTexto.classList.add("btn_label_res_single"); // Agregar la clase si no está presente
            }
          }
        });

        for (let i = respuestasMezcladas.length; i < allInputsTexto.length; i++) {
          const inputTexto = allInputsTexto[i];
          const inputValor = respuestasCont.querySelectorAll(".respuesta_input_value")[i];
          if (inputTexto && inputValor) {
            inputTexto.id = `input_res${i + 1}_single`;
            inputTexto.value = "";
            inputTexto.dataset.correct = "false";
            inputTexto.dataset.points = "0";
            inputValor.value = "";
            inputTexto.readOnly = true;
            inputValor.readOnly = true;
            inputTexto.classList.add("btn_label_res_single"); // Agregar la clase si no está presente
          }
        }
        setupAnswers();
      }
      setupPlayer();
    })
    .catch((error) => console.error("Error al procesar P&R_single.json:", error));
};

// Inicializar modo de un solo jugador
export const initializeSinglePlayerMode = async () => {
  console.log("Inicializando modo 1 Jugador");
  setAudioEnabled(true);
  initializeAudioForIOS();
  initializeSinglePlayerAudio();
  const adminCont = document.querySelector(".admincont");
  adminCont.classList.add("single-player-mode");
  adminCont.classList.remove("teams-mode");

  document.getElementById("single-player-section").style.display = "flex";
  document.getElementById("teams-section").style.display = "none";

  const playerRef = getUserRef("singlePlayer");
  if (playerRef) {
    const snapshot = await get(playerRef);
    const data = snapshot.val() || {};
    highScores = data.highScores || {};
    unlockedCategories = checkUnlockedCategories(highScores);
    unlockedAvatars = checkUnlockedAvatars(highScores);
    playerAvatar = data.avatar || playerAvatar;
    localStorage.setItem("highScores", JSON.stringify(highScores));
    localStorage.setItem("playerAvatar", playerAvatar);
    await set(ref(database, `usuarios/${auth.currentUser.uid}/singlePlayer/unlockedCategories`), unlockedCategories);
  }

  // Actualizar UI inmediatamente
  updateLockedCategories(unlockedCategories);
  await setupAvatars(["player"]);
  cargarPreguntaAleatoriaSinglemode();
  setupPlayer();
  setupHighScoreListener();
  setupLockedContentListener();

  // Inicializar círculos de progreso
  updateProgressCircles(highScores, unlockedAvatars, unlockedCategories);
};

const categoryNames = {
  "general": "General",
  "animales": "Animales",
  "historia": "Historia",
  "peliculas": "Películas",
  "geografia": "Geografía",
  "tecnologia": "Tecnología",
  "kpop": "Kpop",
  "peliculas_animadas": "P/Animadas",
  "misterios_y_leyendas": "M/Leyendas",
  "gastronomia_internacional": "Gastronomía",
  "musica": "Música",
  "ciencia_ficcion": "C/Ficción",
  "videojuegos": "Videojuegos",
  "superheroes": "Superhéroes"
};

// Configurar UI del jugador 
const setupPlayer = () => {
  const categoriaActivaDisplay = document.getElementById("categoria_activa");
  const playerPointsDisplay = document.getElementById("player-points");
  const errorsDisplay = document.getElementById("player-errors");
  const highScoreDisplay = document.getElementById("high-score");
  const progresoElement = document.querySelector(".progreso");

  if (!categoriaActivaDisplay || !playerPointsDisplay || !errorsDisplay || !highScoreDisplay || !progresoElement) {
    console.error("Elementos de UI no encontrados");
    return;
  }

  mostrarNombreUsuario();

  const readableCategory = categoryNames[currentCategory] || currentCategory;
  categoriaActivaDisplay.innerHTML = `<strong class="categoria" id="categoria_activa_din">${readableCategory}</strong>`;
  const currentHighScore = highScores[currentCategory] || 0;
  const level = calculateLevel(currentHighScore);
  playerPointsDisplay.innerHTML = `<div>Puntos</div> <strong>${playerPoints}</strong>`;
  errorsDisplay.innerHTML = `<div>Errores</div> <strong>${errors}/3</strong>`;
  highScoreDisplay.innerHTML = `<div>Récord</div> <strong>${currentHighScore}</strong>`;

  // Actualizar barra de progreso del nivel
  const nextLevelPoints = calculateNextLevelPoints(currentHighScore);
  const progressPercentage = (currentHighScore / nextLevelPoints) * 100;
  const nextLevel = calculateLevel(nextLevelPoints);
  progresoElement.querySelector(".current-level").textContent = level;
  progresoElement.querySelector(".next-level").textContent = nextLevel;
  progresoElement.querySelector(".progress-bar").style.width = `${progressPercentage}%`;

  // Actualizar círculos de progreso
  updateProgressCircles(highScores, unlockedAvatars, unlockedCategories);
};

//Función para actualizar los círculos de progreso
const updateProgressCircles = (highScores, unlockedAvatars, unlockedCategories) => {
  const avatarCircle = document.getElementById("avatar-progress-circle");
  const categoryCircle = document.getElementById("category-progress-circle");
  const avatarText = document.getElementById("avatar-progress-text");
  const categoryText = document.getElementById("category-progress-text");

  if (!avatarCircle || !categoryCircle || !avatarText || !categoryText) {
    console.error("Elementos de los círculos de progreso no encontrados");
    return;
  }

  const avatarData = calculateNextAvatarUnlock(highScores, unlockedAvatars);
  const categoryData = calculateNextCategoryUnlock(highScores, unlockedCategories);

  // Actualizar círculo de avatar
  if (avatarData.allUnlocked) {
    avatarText.textContent = "100%";
    setCircleProgress(avatarCircle, 100);
  } else {
    const avatarPercentage = Math.min(100, Math.round(avatarData.progress * 100));
    avatarText.textContent = `${avatarPercentage}%`;
    setCircleProgress(avatarCircle, avatarPercentage);
  }

  // Actualizar círculo de categoría
  if (categoryData.allUnlocked) {
    categoryText.textContent = "100%";
    setCircleProgress(categoryCircle, 100);
  } else {
    const categoryPercentage = Math.min(100, Math.round(categoryData.progress * 100));
    categoryText.textContent = `${categoryPercentage}%`;
    setCircleProgress(categoryCircle, categoryPercentage);
  }

  console.log("Progreso de avatares:", avatarData);
  console.log("Progreso de categorías:", categoryData);
};

const calculateNextAvatarUnlock = (highScores, unlockedAvatars) => {
  const lockedAvatars = Object.entries(LOCKED_CONTENT.avatars).filter(
    ([id, { unlocked }]) => !unlocked && !unlockedAvatars[id]
  );
  if (lockedAvatars.length === 0) {
    console.log("Todos los avatares están desbloqueados");
    return { pointsLeft: 0, allUnlocked: true, progress: 1 };
  }

  const nextAvatar = lockedAvatars.reduce((prev, curr) => {
    const prevCategoryScore = highScores[prev[1].category] || 0;
    const currCategoryScore = highScores[curr[1].category] || 0;
    const prevPointsLeft = Math.max(0, prev[1].pointsRequired - prevCategoryScore);
    const currPointsLeft = Math.max(0, curr[1].pointsRequired - currCategoryScore);
    return prevPointsLeft < currPointsLeft ? prev : curr;
  });

  const categoryHighScore = highScores[nextAvatar[1].category] || 0;
  const pointsRequired = nextAvatar[1].pointsRequired;
  const pointsLeft = Math.max(0, pointsRequired - categoryHighScore);
  const progress = Math.min(1, categoryHighScore / pointsRequired);

  console.log(`Próximo avatar a desbloquear: ${nextAvatar[0]} (${nextAvatar[1].category}), Puntos requeridos: ${pointsRequired}, Puntos actuales: ${categoryHighScore}, Faltan: ${pointsLeft}, Progreso: ${progress}`);

  return { pointsLeft, allUnlocked: false, progress };
};

const calculateNextCategoryUnlock = (highScores, unlockedCategories) => {
  const lockedCategories = Object.entries(LOCKED_CONTENT.categories).filter(
    ([id, { unlocked }]) => !unlocked && !unlockedCategories[id]
  );
  if (lockedCategories.length === 0) {
    console.log("Todas las categorías están desbloqueadas");
    return { pointsLeft: 0, allUnlocked: true, progress: 1 };
  }

  const nextCategory = lockedCategories.reduce((prev, curr) => {
    const prevCategoryScore = highScores[prev[1].category] || 0;
    const currCategoryScore = highScores[curr[1].category] || 0;
    const prevPointsLeft = Math.max(0, prev[1].pointsRequired - prevCategoryScore);
    const currPointsLeft = Math.max(0, curr[1].pointsRequired - currCategoryScore);
    return prevPointsLeft < currPointsLeft ? prev : curr;
  });

  const categoryHighScore = highScores[nextCategory[1].category] || 0;
  const pointsRequired = nextCategory[1].pointsRequired;
  const pointsLeft = Math.max(0, pointsRequired - categoryHighScore);
  const progress = Math.min(1, categoryHighScore / pointsRequired);

  console.log(`Próxima categoría a desbloquear: ${nextCategory[0]} (${nextCategory[1].category}), Puntos requeridos: ${pointsRequired}, Puntos actuales: ${categoryHighScore}, Faltan: ${pointsLeft}, Progreso: ${progress}`);

  return { pointsLeft, allUnlocked: false, progress };
};

const setCircleProgress = (circleElement, percentage) => {
  // Obtener el radio del círculo desde el atributo 'r'
  const radius = parseFloat(circleElement.getAttribute("r")) || 70; // Radio por defecto coincide con tu HTML
  const circumference = 2 * Math.PI * radius;

  // Establecer el stroke-dasharray para definir el "trazo completo"
  circleElement.style.strokeDasharray = `${circumference} ${circumference}`;

  // Calcular el offset para reflejar el porcentaje (0 = lleno, circumference = vacío)
  const offset = circumference - (percentage / 100) * circumference;
  circleElement.style.strokeDashoffset = offset;

  // Depuración
  console.log(`Círculo: ${circleElement.id}, Radio: ${radius}, Circunferencia: ${circumference}, Porcentaje: ${percentage}, Offset: ${offset}`);
};

// Calcular nivel basado en el récord
const calculateLevel = (highScore) => {
  if (highScore < 500) return "Curioso";
  if (highScore < 1000) return "Sabiondo";
  if (highScore < 1500) return "Erudito";
  if (highScore < 2000) return "Genio";
  if (highScore < 2500) return "Oráculo";
  return "Oráculo";
};

// Nueva función para calcular puntos necesarios para el siguiente nivel
const calculateNextLevelPoints = (highScore) => {
  if (highScore < 500) return 500;
  if (highScore < 1000) return 1000;
  if (highScore < 1500) return 1500;
  if (highScore < 2000) return 2000;
  if (highScore < 2500) return 2500;
  return 2500; // Límite superior para "Oráculo"
};

const mostrarNombreUsuario = () => {
  const nameUserElement = document.getElementById("nameuser");
  if (!nameUserElement) {
    console.error("Elemento #nameuser no encontrado en el DOM");
    return;
  }

  if (!auth.currentUser) {
    console.warn("No hay usuario autenticado, mostrando nombre por defecto");
    nameUserElement.textContent = playerName.toUpperCase(); // Usar playerName como respaldo
    return;
  }

  const userRef = ref(database, `usuarios/${auth.currentUser.uid}/infoUser/nombre`);
  get(userRef)
    .then((snapshot) => {
      const nombre = snapshot.val() || playerName; // Usar playerName si no hay nombre en Firebase
      nameUserElement.textContent = nombre.toUpperCase();
      console.log(`Nombre del usuario mostrado en #nameuser: ${nombre}`);
    })
    .catch((error) => {
      console.error("Error al obtener el nombre del usuario:", error);
      nameUserElement.textContent = playerName.toUpperCase(); // Fallback a playerName
    });
};

// Actualizar datos en Firebase
export const updateFirebasePlayerData = async () => {
  const playerData = {
    nombre: playerName,
    avatar: playerAvatar,
    highScores: highScores,
  };
  await syncLockedContent(highScores, playerAvatar); // Pasar playerAvatar
  const playerRef = getUserRef("singlePlayer");
  await set(playerRef, playerData);
  console.log("Datos completos actualizados en Firebase:", playerData);
};

export const setupHighScoreListener = () => {
  const playerRef = getUserRef("singlePlayer");
  if (playerRef) {
    onValue(playerRef, (snapshot) => {
      const data = snapshot.val() || {};
      highScores = data.highScores || {};
      playerName = data.nombre || playerName;
      playerAvatar = data.avatar || "default";
      unlockedAvatars = data.unlockedAvatars || checkUnlockedAvatars(highScores);
      unlockedCategories = data.unlockedCategories || checkUnlockedCategories(highScores);

      // Sincronizar con localStorage
      localStorage.setItem("highScores", JSON.stringify(highScores));
      localStorage.setItem("playerName", playerName);
      localStorage.setItem("playerAvatar", playerAvatar);

      // Actualizar UI
      updateLockedAvatars(unlockedAvatars);
      updateLockedCategories(unlockedCategories);
      setupPlayer();

      const avatarTrigger = document.getElementById("avatar-player");
      if (avatarTrigger) avatarTrigger.src = avatarMap[playerAvatar] || avatarMap["default"];
    }, (error) => {
      console.error("Error en listener de high scores:", error);
    });
  }
};

// Configurar respuestas
const setupAnswers = () => {
  const respuestasCont = document.getElementById("respuestas__cont_single");
  if (respuestasCont) {
    const forms = respuestasCont.querySelectorAll("form");
    forms.forEach((form, index) => {
      const input = form.querySelector(".respuesta_input");
      if (input && input.id) {
        form.replaceWith(form.cloneNode(true));
        const newForm = respuestasCont.querySelectorAll("form")[index];
        newForm.addEventListener("click", (e) => {
          e.preventDefault();
          if (!isAnswersLocked) { // Solo procesar si no está bloqueado
            checkAnswer(input.id);
          }
        });
      }
    });
  }
};

// Verificar respuesta
const checkAnswer = (respuestaId) => {
  if (isAnswersLocked) return; // Salir si ya está bloqueado

  const respuestaInput = document.getElementById(respuestaId);
  if (!respuestaInput) {
    console.error(`No se encontró el elemento con ID ${respuestaId}`);
    return;
  }

  isAnswersLocked = true; // Bloquear respuestas inmediatamente

  const isCorrect = respuestaInput.dataset.correct === "true";
  const points = parseInt(respuestaInput.dataset.points) || 0;

  // Desactivar visualmente todos los .respuesta_input.btn_label_res_single
  const respuestasCont = document.getElementById("respuestas__cont_single");
  if (respuestasCont) {
    const inputsTexto = respuestasCont.querySelectorAll(".respuesta_input.btn_label_res_single");
    inputsTexto.forEach((input) => {
      input.classList.add("disabled-dark");
    });
  }

  if (isCorrect) {
    playerPoints += points;
    localStorage.setItem("playerPoints", playerPoints);
    document.getElementById("player-points").innerHTML = `<div>Puntos</div> <strong>${playerPoints}</strong>`;

    const currentHighScore = highScores[currentCategory] || 0;
    if (playerPoints > currentHighScore) {
      highScores[currentCategory] = playerPoints;
      localStorage.setItem("highScores", JSON.stringify(highScores));
      document.getElementById("high-score").innerHTML = `<div>Récord</div> <strong>${highScores[currentCategory]}</strong>`;
    }

    updateFirebasePlayerData();

    let shownQuestions = getShownQuestions(currentCategory);
    if (!shownQuestions.includes(currentQuestionId)) {
      shownQuestions.push(currentQuestionId);
      setShownQuestions(currentCategory, shownQuestions);
    }

    if (getAudioEnabled()) {
      stopCurrentAudio();
      correctAudio.play().catch(err => console.error("Error al reproducir audio correcto:", err));
    }

    setTimeout(() => {
      cargarPreguntaAleatoriaSinglemode();
      isAnswersLocked = false; // Desbloquear después del timeout
    }, 1000);
  } else {
    errors += 1;
    localStorage.setItem("playerErrors", errors);
    document.getElementById("player-errors").innerHTML = `<div>Errores</div> <strong>${errors}/3</strong>`;

    if (getAudioEnabled()) {
      stopCurrentAudio();
      incorrectAudio.play().catch(err => console.error("Error al reproducir audio incorrecto:", err));
    }

    setTimeout(async () => {
      if (errors >= 3) {
        await resetGame();
      } else {
        cargarPreguntaAleatoriaSinglemode();
      }
      isAnswersLocked = false; // Desbloquear después del timeout
    }, 1000);
  }
  setupPlayer();
};

// Detener audio
const stopCurrentAudio = () => {
  [correctAudio, incorrectAudio].forEach(audio => {
    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
};

// Reiniciar juego
const resetGame = async () => {
  const progresoContenido = document.querySelector(".progreso-contenido");
  const progresoElement = document.querySelector(".progreso");

  if (!progresoContenido || !progresoElement) {
    console.error("Elementos .progreso-contenido o .progreso no encontrados");
  } else {
    // Actualizar círculos de progreso antes de mostrar
    updateProgressCircles(highScores, unlockedAvatars, unlockedCategories);

    // Aplicar estilo de "game over" y progreso activo
    progresoContenido.classList.add("game-over");
    progresoElement.classList.add("progreso-activo");

    // Esperar 4 segundos antes de reiniciar
    await new Promise(resolve => {
      setTimeout(() => {
        progresoContenido.classList.remove("game-over");
        progresoElement.classList.remove("progreso-activo");
        resolve();
      }, 4000);
    });
  }

  // Reiniciar estado del juego
  errors = 0;
  playerPoints = 0;
  localStorage.setItem("playerErrors", errors);
  localStorage.setItem("playerPoints", playerPoints);

  // Actualizar UI
  document.getElementById("player-points").innerHTML = `<div>Puntos</div> <strong>${playerPoints}</strong>`;
  document.getElementById("player-errors").innerHTML = `<div>Errores</div> <strong>${errors}/3</strong>`;

  // Sincronizar con Firebase
  await updateFirebasePlayerData();

  // Reiniciar preguntas mostradas
  resetShownQuestions(currentCategory);

  // Actualizar UI y cargar nueva pregunta
  setupPlayer();
  cargarPreguntaAleatoriaSinglemode();
};

// Cambiar categoría
export const cambiarCategoriaSinglePlayer = (categoria) => {
  currentCategory = categoria;
  localStorage.setItem("singlePlayerCategory", currentCategory);
  errors = 0;
  playerPoints = 0;
  localStorage.setItem("playerErrors", errors);
  localStorage.setItem("playerPoints", playerPoints);
  resetShownQuestions(currentCategory); // Opcional: reiniciar preguntas al cambiar categoría
  setupPlayer(); // Actualizar UI con nueva categoría
  cargarPreguntaAleatoriaSinglemode();
};

// Listener para categoría
export const setupCategoryListener = () => {
  const categoriaRef = getUserRef("estado/categoria");
  if (categoriaRef) {
    onValue(categoriaRef, (snapshot) => {
      const newCategory = snapshot.val() || "general";
      if (document.querySelector(".admincont").classList.contains("single-player-mode")) {
        // Validar si la categoría está desbloqueada
        const isUnlocked = unlockedCategories[newCategory] || LOCKED_CONTENT.categories[newCategory]?.unlocked || false;
        if (isUnlocked) {
          cambiarCategoriaSinglePlayer(newCategory);
          console.log(`Categoría cambiada desde Firebase: ${newCategory}`);
        } else {
          console.log(`Categoría ${newCategory} bloqueada, cambio desde Firebase ignorado`);
          // Restaurar a la categoría actual si el cambio no es válido
          actualizarCategoriaActiva(currentCategory);
        }
      }
    });
  }
};

export const loadSinglePlayerQuestion = (categoria) => {
  currentCategory = categoria; // Asegúrate de que currentCategory esté definida globalmente en singlePlayer.js
  document.getElementById("categoria_activa").textContent = categoria;
  import('./database.js').then(module => {
    module.cargarPreguntaAleatoria(); // Esto debería respetar la categoría actual
  });
};

// Restaurar modo equipos
export const resetToTeamsMode = () => {
  const adminCont = document.querySelector(".admincont");
  adminCont.classList.remove("single-player-mode");
  adminCont.classList.add("teams-mode");
  setAudioEnabled(false);
  console.log("Restaurado a modo Equipos");

  document.getElementById("single-player-section").style.display = "none";
  document.getElementById("teams-section").style.display = "block";

  // Actualizar la categoría activa en Firebase antes de cambiar
  const categoriaRef = getUserRef("estado/categoria");
  if (categoriaRef) {
    set(categoriaRef, currentCategory)
      .then(() => {
        console.log(`Categoría activa sincronizada para modo equipos: ${currentCategory}`);
        // Limpiar listeners de single-player
        const respuestasContSingle = document.getElementById("respuestas__cont_single");
        if (respuestasContSingle) {
          const formsSingle = respuestasContSingle.querySelectorAll("form");
          formsSingle.forEach(form => {
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
          });
        }

        // Cargar pregunta del modo equipos con la categoría activa
        import('./database.js').then(module => {
          module.cargarPreguntaAleatoria(); // Carga inicial
          module.setupTeamsForms();
          // No necesitamos setupTeamsCategorySelector aquí, ya está configurado
        });
      })
      .catch(error => console.error("Error al sincronizar categoría:", error));
  } else {
    console.warn("No se pudo actualizar la categoría, cargando 'general' por defecto");
    import('./database.js').then(module => {
      module.cargarPreguntaAleatoria();
      module.setupTeamsForms();
    });
  }
};