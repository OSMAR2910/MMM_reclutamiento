import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { v4 as uuidv4 } from "https://unpkg.com/uuid@8.3.2/dist/esm-browser/index.js";
import { database, ref, set, update, onValue, remove, app, get } from "./firebase.js";
export { database, ref, set, update, onValue, remove, app, get };
import { toggleView} from "./main.js";
import { LOCKED_CONTENT, checkUnlockedAvatars, checkUnlockedCategories, updateLockedAvatars, updateLockedCategories } from './lockedContent.js';

// Inicializar Firebase Auth
export const auth = getAuth(app);
let currentUser = null;
export let hasInteracted = false;
export let isInitialLoad = true;
let alertaActivaTimeout = null;
let alertaActual = null;
let fontsLoaded = false;
let unsubscribeRespuestas = null;
let unsubscribeFamilias = null;
let temporizadorFrame = null;
let temporizadorInicio = null;

let localAudioEnabled = false;
// Exportar getAudioEnabled
export const getAudioEnabled = () => {
  console.log("getAudioEnabled llamado, valor actual:", localAudioEnabled);
  return localAudioEnabled;
};

// Exportar setAudioEnabled
export const setAudioEnabled = (value) => {
  localAudioEnabled = value;
  console.log("audioEnabled actualizado a:", localAudioEnabled);
};

// Este onAuthStateChanged solo configura datos cuando hay usuario, no afecta la carga inicial
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    if (user.emailVerified) {
      console.log("Usuario autenticado y verificado:", user.uid);
      configurarRespuestas();
      configurarFamilias();
      mostrarFamiliasEnTiempoReal();
      mostrarRespuestasEnTiempoReal();
    } else {
      console.log("Usuario autenticado pero no verificado:", user.uid);
    }
  } else {
    console.log("No hay usuario autenticado");
  }
});

// Obtener referencia con UID
export const getUserRef = (path) => {
  if (!currentUser) {
    console.warn("No hay usuario autenticado aún, operación omitida");
    return null;
  }
  return ref(database, `usuarios/${currentUser.uid}/${path}`);
};

// Limpiar respuestas Firebase
export const limpiarRespuestasFirebase = () => {
  const respuestasRef = getUserRef("respuestas");
  if (!respuestasRef) return Promise.resolve(); // Salir si no hay usuario
  return remove(respuestasRef)
    .then(() => console.log("Respuestas borradas"))
    .catch((error) => console.error("Error al borrar respuestas:", error));
};

export const actualizarCategoriaActiva = (categoria) => {
  const categoriaRef = getUserRef("estado/categoria");
  if (!categoriaRef) return;

  set(categoriaRef, categoria)
    .then(() => console.log(`Categoría activa actualizada a: ${categoria}`))
    .catch((error) => console.error("Error al actualizar categoría:", error));
};

export const preloadFonts = () => {
  if (fontsLoaded) {
    console.log("Fuentes ya precargadas, omitiendo...");
    return Promise.resolve();
  }

  const fontsToLoad = [
    { family: "BungeeShade", url: "/fonts/BungeeShade.ttf" },
    { family: "Nunito", url: "/fonts/Nunito-Regular.ttf" }
  ];

  const fontPromises = fontsToLoad.map(({ family, url }) => {
    const font = new FontFace(family, `url(${url})`, { style: "normal", weight: "400" });
    return font.load().then(() => {
      document.fonts.add(font);
      console.log(`Fuente ${family} cargada`);
    }).catch((error) => {
      console.error(`Error al cargar fuente ${family}:`, error);
    });
  });

  return Promise.all(fontPromises).then(() => {
    return document.fonts.ready.then(() => {
      fontsLoaded = true;
      console.log("Todas las fuentes precargadas y listas en document.fonts");
    });
  }).catch((error) => {
    console.error("Error al confirmar que las fuentes estén listas:", error);
    fontsLoaded = true; // Marcar como cargadas incluso si falla, para evitar bucles
  });
};

export const THEMES = {
  digo: {
  Blanco: "#ffffff", // Blanco puro (ya dado como Texto)
  Negro: "#1a2238", // Un azul muy oscuro, casi negro, para detalles o sombras
  Green: "#4caf50", // Verde suave para representar luces nocturnas o elementos naturales
  Amarillo: "#ffeb3b", // Amarillo brillante para evocar estrellas o luces
  Red: "#f44336", // Rojo vibrante para resaltar elementos importantes
  Transparente: "#8294c4", // Fondo con transparencia para efectos
  Principal: "#6073a6", // Fondo principal (ya dado como Fondo)
  Secundario: "#8294c4", // Un azul más claro para contraste, inspirado en el cielo nocturno
  Resalte: "#ffeb3b", // Amarillo brillante para resaltar (como estrellas)
  Fondo: "#6073a6", // Fondo del tema (ya dado)
  Texto: "#ffffff", // Color de texto principal (ya dado)
  Letra1: "BungeeShade", // Fuente principal (ya dada)
  Letra2: "Nunito" // Fuente secundaria (ya dada)
},
  oscuro: {
    Blanco: "#ffffff",
    Negro: "#0d0d0d",
    Green: "#1aaa60",
    Amarillo: "#fff3cc",
    Red: "#7e1d1e",
    Transparente: "#171616",
    Principal: "#171616",
    Secundario: "#ffffff",
    Resalte: "#9400d3",
    Fondo: "#171616",
    Texto: "#ffffff",
    Letra1: "BungeeShade", // Fuente principal (ya dada)
    Letra2: "Nunito" // Fuente secundaria (ya dada)
  },
  pastel: {
    Blanco: "#ffffff",
    Negro: "#333333",
    Green: "#a8e6cf",
    Amarillo: "#fff0f5",
    Red: "#ff9999",
    Transparente: "#f8b8d0",
    Principal: "#ffe6f0",
    Secundario: "#f8b8d0",
    Resalte: "#ffccd5",
    Fondo: "#ffe6f0",
    Texto: "#5c4b51",
    Letra1: "BungeeShade", // Fuente principal (ya dada)
    Letra2: "Nunito" // Fuente secundaria (ya dada)
  },
  retro: {
    Blanco: "#f5f5f5",
    Negro: "#2f2f2f",
    Green: "#66cc66",
    Amarillo: "#ffff99",
    Red: "#ff6666",
    Transparente: "#3c2f2f",
    Principal: "#3c2f2f",
    Secundario: "#f5f5f5",
    Resalte: "#ffcc00",
    Fondo: "#3c2f2f",
    Texto: "#f5f5f5",
    Letra1: "BungeeShade", // Fuente principal (ya dada)
    Letra2: "Nunito" // Fuente secundaria (ya dada)
  },
  neon: {
    Blanco: "#ffffff",
    Negro: "#000000",
    Green: "#00ff00",
    Amarillo: "#ffff00",
    Red: "#ff00ff",
    Transparente: "#1a1a1a",
    Principal: "#1a1a1a",
    Secundario: "#00ffff",
    Resalte: "#ff00ff",
    Fondo: "#1a1a1a",
    Texto: "#ffffff",
    Letra1: "BungeeShade", // Fuente principal (ya dada)
    Letra2: "Nunito" // Fuente secundaria (ya dada)
  },
  vintag: {
    Blanco: "#f5f0e1",
    Negro: "#3c2f2f",
    Green: "#6b8e23",
    Amarillo: "#ffeb99",
    Red: "#8b0000",
    Transparente: "#d9a66f",
    Principal: "#8c5523",
    Secundario: "#d9a66f",
    Resalte: "#ffcc99",
    Fondo: "#8c5523",
    Texto: "#f5f0e1",
    Letra1: "BungeeShade", // Fuente principal (ya dada)
    Letra2: "Nunito" // Fuente secundaria (ya dada)
  },
  arctic: {
    Blanco: "#ffffff",
    Negro: "#2e3440",
    Green: "#88c0d0",
    Amarillo: "#ebcb8b",
    Red: "#bf616a",
    Transparente: "#4c566a",
    Principal: "#4c566a",
    Secundario: "#d8dee9",
    Resalte: "#81a1c1",
    Fondo: "#4c566a",
    Texto: "#ffffff",
    Letra1: "BungeeShade", // Fuente principal (ya dada)
    Letra2: "Nunito" // Fuente secundaria (ya dada)
  },
  twilit: {
    Blanco: "#ffffff",
    Negro: "#1e1b2f",
    Green: "#54a0ff",
    Amarillo: "#ff9f43",
    Red: "#ff6b6b",
    Transparente: "#786fa6",
    Principal: "#2c2a4a",
    Secundario: "#786fa6",
    Resalte: "#feca57",
    Fondo: "#2c2a4a",
    Texto: "#ffffff",
    Letra1: "BungeeShade", // Fuente principal (ya dada)
    Letra2: "Nunito" // Fuente secundaria (ya dada)
  },
  Ghost: {
    Blanco: "#ffffff", // Blanco puro de la máscara
    Negro: "#000000", // Negro del fondo y detalles de la máscara
    Green: "#4a4a4a", // Gris oscuro de la túnica (usado como "Green" para mantener el formato)
    Amarillo: "#6b6b6b", // Gris más claro para sombras (usado como "Amarillo")
    Red: "#b0b0b0", // Gris medio para detalles (usado como "Red")
    Transparente: "#4a4a4a80", // Gris oscuro con transparencia
    Principal: "#1c2526", // Fondo principal (un gris muy oscuro, casi negro, para un aire misterioso)
    Secundario: "#4a4a4a", // Gris oscuro de la túnica como color secundario
    Resalte: "#b0b0b0", // Gris medio para resaltar elementos
    Fondo: "#1c2526", // Fondo del tema
    Texto: "#ffffff", // Texto blanco para contraste contra el fondo oscuro
    Mascota: "url('../img/themes/themeghost.png')",
    Letra1: "BungeeShade", // Fuente principal (ya dada)
    Letra2: "Nunito" // Fuente secundaria (ya dada)
},
koya: {
  Blanco: "#ffffff",
  Negro: "#1c2526",
  Green: "#66b3a6",
  Amarillo: "#f7e1a3",
  Red: "#ff6f61",
  Transparente: "#c9e1fb", // Celeste con transparencia
  Principal: "#a3cffa", // Fondo principal (azul claro de la imagen)
  Secundario: "#c9e1fb", // Azul más claro para contraste
  Resalte: "#6b9ac4", // Un azul más oscuro para resalte
  Fondo: "#a3cffa", // Fondo del tema
  Texto: "#1c2526", // Texto oscuro para contraste
  Mascota: "url('../img/themes/themekpop1.jpg')",
  Letra1: "BungeeShade", // Fuente principal (ya dada)
  Letra2: "Nunito" // Fuente secundaria (ya dada)
},
shooky: {
  Blanco: "#ffffff",
  Negro: "#2f1f17",
  Green: "#a8d5ba",
  Amarillo: "#f7d9a3",
  Red: "#ff6f61",
  Transparente: "#e8c4a2", // Marrón claro con transparencia
  Principal: "#d4a276", // Fondo principal (marrón claro de la galleta)
  Secundario: "#e8c4a2", // Marrón más claro para contraste
  Resalte: "#8b5a2b", // Marrón más oscuro para resalte
  Fondo: "#d4a276", // Fondo del tema
  Texto: "#2f1f17", // Texto oscuro para contraste
  Mascota: "url('../img/themes/themekpop2.jpg')",
  Letra1: "BungeeShade", // Fuente principal (ya dada)
  Letra2: "Nunito" // Fuente secundaria (ya dada)
}
};

export function applyTheme(themeName) {
  const theme = THEMES[themeName] || THEMES.digo;
  let styleSheet = document.getElementById("dynamic-theme");

  if (!styleSheet) {
    styleSheet = document.createElement("style");
    styleSheet.id = "dynamic-theme";
    document.head.appendChild(styleSheet);
  }

  const css = `:root { ${Object.entries(theme).map(([key, value]) => `--tema-${key}: ${value};`).join('\n')} }`;
  if (styleSheet.textContent !== css) {
    styleSheet.textContent = css;
    console.log("Tema aplicado:", themeName);
  } else {
    console.log("Tema ya aplicado, omitiendo actualización:", themeName);
  }

  localStorage.setItem("theme", themeName);

  if (currentUser) {
    const themeRef = getUserRef("estado/theme");
    if (themeRef) {
      set(themeRef, themeName).catch((error) => console.error("Error al guardar tema:", error));
    }
  }
  updateMetaColors(theme);
}

// Función para actualizar los meta tags
function updateMetaColors(theme) {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  const metaMsNavButtonColor = document.querySelector('meta[name="msapplication-navbutton-color"]');
  const metaAppleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');

  // Usar el color 'Principal' o 'Fondo' del tema como ejemplo (puedes ajustarlo)
  const color = theme.Principal || theme.Fondo || "#1a2238"; // Valor por defecto si no existe

  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", color);
    console.log(`Meta theme-color actualizado a: ${color}`);
  }
  if (metaMsNavButtonColor) {
    metaMsNavButtonColor.setAttribute("content", color);
    console.log(`Meta msapplication-navbutton-color actualizado a: ${color}`);
  }
  if (metaAppleStatusBar) {
    // Nota: apple-mobile-web-app-status-bar-style no usa colores hex directamente,
    // sino valores como 'default', 'black', 'black-translucent', o un color aproximado.
    // Aquí usamos una lógica simple para mapearlo, pero podrías personalizarlo.
    const statusBarStyle = getAppleStatusBarStyle(color);
    metaAppleStatusBar.setAttribute("content", statusBarStyle);
    console.log(`Meta apple-mobile-web-app-status-bar-style actualizado a: ${statusBarStyle}`);
  }
}

// Función auxiliar para mapear colores a estilos de barra de estado de Apple
function getAppleStatusBarStyle(color) {
  // Ejemplo básico: puedes expandir esta lógica según tus necesidades
  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.replace("#", ""), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  };

  const { r, g, b } = hexToRgb(color);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000; // Fórmula de luminancia

  return brightness > 128 ? "default" : "black-translucent";
}
 
export function loadInitialTheme() {
  return new Promise((resolve) => {
    const savedLocalTheme = localStorage.getItem("theme") || "digo";

    preloadFonts().then(() => {
      if (currentUser) {
        const themeRef = getUserRef("estado/theme");
        if (themeRef) {
          get(themeRef).then((snapshot) => {
            const firebaseTheme = snapshot.val();
            const themeToApply = firebaseTheme || savedLocalTheme;
            applyTheme(themeToApply);
            localStorage.setItem("theme", themeToApply);
            resolve(themeToApply);
          }).catch((error) => {
            console.error("Error al leer tema de Firebase:", error);
            applyTheme(savedLocalTheme);
            resolve(savedLocalTheme);
          });
        } else {
          applyTheme(savedLocalTheme);
          resolve(savedLocalTheme);
        }
      } else {
        applyTheme(savedLocalTheme);
        resolve(savedLocalTheme);
      }
    }).catch((error) => {
      console.error("Error al precargar fuentes:", error);
      applyTheme(savedLocalTheme);
      resolve(savedLocalTheme);
    });
  });
}

export function initializeThemeListener() {
  const themeRef = getUserRef("estado/theme");
  if (!themeRef) {
    console.warn("No se pudo inicializar el listener de temas: no hay usuario autenticado");
    return;
  }

  console.log("Listener de temas inicializado para:", themeRef.toString());

  onValue(themeRef, (snapshot) => {
    const themeName = snapshot.val() || "digo";
    const currentTheme = localStorage.getItem("theme");

    console.log(`Tema recibido de Firebase: ${themeName}, Tema local actual: ${currentTheme}`);

    // Aplicar el tema siempre, sin importar si coincide con localStorage
    console.log(`Aplicando tema en tiempo real: ${themeName}`);
    applyTheme(themeName); // Aplica el tema recibido de Firebase
    localStorage.setItem("theme", themeName); // Sincroniza localStorage

    // Actualizar el selector de temas en la interfaz (si está presente)
    const themeOptions = document.querySelectorAll(".theme-option");
    if (themeOptions.length > 0) {
      themeOptions.forEach(opt => {
        const isSelected = opt.dataset.theme === themeName;
        opt.classList.toggle("selected", isSelected);
        console.log(`Opción ${opt.dataset.theme} seleccionada: ${isSelected}`);
      });
      console.log(`Tema actualizado en tiempo real a: ${themeName}`);
    } else {
      console.warn("No se encontraron opciones de tema en el DOM para actualizar");
    }
  }, (error) => {
    console.error("Error al escuchar tema:", error);
    applyTheme("digo"); // Fallback en caso de error
  });
}

export const detectarCambioCategoria = (callback) => {
  const categoriaRef = getUserRef("estado/categoria");
  if (!categoriaRef) return;

  onValue(categoriaRef, (snapshot) => {
    const categoriaActiva = snapshot.val() || "general";
    callback(categoriaActiva);
  });
};

export const setupCategorySelector = () => {
  const categoryItems = document.querySelectorAll(".data_categorias .category-item");
  if (categoryItems.length === 0) {
    console.warn("No se encontraron elementos .category-item en .data_categorias");
    return;
  }

  const updateCategoryUI = async () => {
    const playerRef = getUserRef("singlePlayer");
    let highScores = {};
    if (playerRef) {
      const snapshot = await get(playerRef);
      const data = snapshot.val() || {};
      highScores = data.highScores || {};
    }
    const unlockedCategories = checkUnlockedCategories(highScores);
    updateLockedCategories(unlockedCategories); // Actualizar UI con candados y estado
    return unlockedCategories;
  };

  // Actualizar UI al inicio
  updateCategoryUI();

  categoryItems.forEach((item) => {
    const categoriaSeleccionada = item.getAttribute("data-category");

    item.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const unlockedCategories = await updateCategoryUI(); // Obtener estado actualizado
      const isUnlocked = unlockedCategories[categoriaSeleccionada] || LOCKED_CONTENT.categories[categoriaSeleccionada]?.unlocked || false;

      if (!isUnlocked) {
        console.log(`La categoría ${categoriaSeleccionada} está bloqueada`);
        item.classList.add("shake");
        setTimeout(() => item.classList.remove("shake"), 500);
        return;
      }

      const adminCont = document.querySelector(".admincont");
      const isSinglePlayerMode = adminCont.classList.contains("single-player-mode");
      const isTeamsMode = adminCont.classList.contains("teams-mode");

      actualizarCategoriaActiva(categoriaSeleccionada);
      categoryItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      console.log(`Categoría seleccionada: ${categoriaSeleccionada}`);

      if (isSinglePlayerMode) {
        import('./singlePlayer.js').then(module => {
          module.cambiarCategoriaSinglePlayer(categoriaSeleccionada);
          module.cargarPreguntaAleatoriaSinglemode();
        });
      } else if (isTeamsMode) {
        cargarPreguntaAleatoria();
      }
    });
  });

  // Listener en tiempo real para mantener la UI actualizada
  const playerRef = getUserRef("singlePlayer");
  if (playerRef) {
    onValue(playerRef, (snapshot) => {
      const data = snapshot.val() || {};
      const highScores = data.highScores || {};
      updateLockedCategories(checkUnlockedCategories(highScores));
    });
  }
};

export const cargarPreguntaAleatoria = () => {
  limpiarRespuestasFirebase().then(() => {
    const isSinglePlayer = document.querySelector(".admincont").classList.contains("single-player-mode");
    const jsonFile = isSinglePlayer ? "../json/P&R_single.json" : "../json/P&R.json";

    fetch(jsonFile)
      .then((response) => {
        if (!response.ok) throw new Error(`Error al cargar ${jsonFile}`);
        return response.json();
      })
      .then((data) => {
        const categoriaRef = getUserRef("estado/categoria");
        if (!categoriaRef) {
          cargarPreguntaDesdeCategoria(data, "general", isSinglePlayer);
          return;
        }
        get(categoriaRef).then((snapshot) => {
          let categoriaActiva = snapshot.val() || "general";
          const playerRef = getUserRef("singlePlayer");
          get(playerRef).then(playerSnapshot => {
            const highScores = playerSnapshot.val()?.highScores || {};
            const unlockedCategories = checkUnlockedCategories(highScores);

            if (!unlockedCategories[categoriaActiva] && !LOCKED_CONTENT.categories[categoriaActiva]?.unlocked) {
              console.warn(`Categoría '${categoriaActiva}' bloqueada, usando 'general'`);
              categoriaActiva = "general";
              actualizarCategoriaActiva(categoriaActiva);
            }

            const tags = data.tags.filter((tag) => tag.categoria === categoriaActiva);
            if (!tags || tags.length === 0) {
              console.warn(`No hay preguntas para '${categoriaActiva}', usando 'general'`);
              categoriaActiva = "general";
              actualizarCategoriaActiva(categoriaActiva);
            }

            if (isSinglePlayer) {
              import('./singlePlayer.js').then(module => {
                module.cambiarCategoriaSinglePlayer(categoriaActiva);
                module.cargarPreguntaAleatoriaSinglemode();
              });
            } else {
              cargarPreguntaDesdeCategoria(data, categoriaActiva, isSinglePlayer);
              const asignadoRef = getUserRef("estado/puntosAsignados");
              if (asignadoRef) set(asignadoRef, false); // Reiniciar estado de asignación
            }
          });
        });
      })
      .catch((error) => console.error(`Error al procesar ${jsonFile}:`, error));
  });
};

const cargarPreguntaDesdeCategoria = (data, categoria, isSinglePlayer) => {
  const tags = data.tags.filter((tag) => tag.categoria === categoria);
  if (!tags || tags.length === 0) {
    console.error(`No se encontraron tags para la categoría: ${categoria}`);
    return;
  }
  const randomIndex = Math.floor(Math.random() * tags.length);
  const tagSeleccionado = tags[randomIndex];

  if (isSinglePlayer) {
    const preguntaElemento = document.getElementById("pregunta-single");
    if (preguntaElemento) preguntaElemento.textContent = tagSeleccionado.pregunta;
    import('./singlePlayer.js').then(module => {
      module.cargarPreguntaAleatoriaSinglemode();
    });
  } else {
    const preguntaElemento = document.getElementById("pregunta-teams");
    if (preguntaElemento) preguntaElemento.textContent = tagSeleccionado.pregunta;

    const respuestas = tagSeleccionado.respuestas;
    respuestas.forEach((respuesta, index) => {
      const inputTexto = document.getElementById(`input_res${index + 1}_teams`);
      const inputValor = document.getElementById(`res${index + 1}_value_teams`);
      if (inputTexto && inputValor) {
        inputTexto.value = respuesta.texto || "";
        inputValor.value = respuesta.puntos || "0";
      }
    });
    for (let i = respuestas.length; i < 5; i++) {
      const inputTexto = document.getElementById(`input_res${index + 1}_teams`);
      const inputValor = document.getElementById(`res${index + 1}_value_teams`);
      if (inputTexto && inputValor) {
        inputTexto.value = "";
        inputValor.value = "";
      }
    }
    setupTeamsForms(); // Configurar los formularios inmediatamente después de cargar las respuestas
  }

  const rondaRef = getUserRef("estado/ronda");
  if (rondaRef && hasInteracted) {
    set(rondaRef, true)
      .then(() => {
        console.log("Estado de ronda activado al cargar nueva pregunta");
        setTimeout(() => set(rondaRef, false), 3000);
      })
      .catch((error) => console.error("Error al alternar ronda:", error));
  }
};

// función para configurar los formularios del modo equipos
export const setupTeamsForms = () => {
  const respuestasCont = document.getElementById("respuestas__cont_teams");
  if (!respuestasCont) {
    console.error("Contenedor de respuestas no encontrado");
    return;
  }

  const forms = respuestasCont.querySelectorAll("form");
  if (forms.length === 0) {
    console.warn("No se encontraron formularios en respuestas__cont_teams");
    return;
  }

  forms.forEach((form, index) => {
    const inputTexto = form.querySelector(`#input_res${index + 1}_teams`);
    const inputValor = form.querySelector(`#res${index + 1}_value_teams`);

    if (!inputTexto || !inputValor) {
      console.error(`Inputs no encontrados para respuesta ${index + 1}`);
      return;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const texto = inputTexto.value.trim().toUpperCase();
      const valor = parseInt(inputValor.value) || 0;

      if (!texto || !valor) {
        console.warn(`Datos incompletos para respuesta ${index + 1}`);
        return;
      }

      const respuestaRef = getUserRef(`respuestas/res${index + 1}`);
      if (!respuestaRef) {
        console.error("Referencia a Firebase no obtenida");
        return;
      }

      set(respuestaRef, { texto, puntos: valor })
        .then(() => {
          console.log(`Respuesta ${index + 1} enviada: ${texto}, ${valor}`);
          inputTexto.value = "";
          inputValor.value = "";
        })
        .catch((error) => console.error("Error al enviar respuesta:", error));
    });
  });
};

// Preparar audio para iOS
export const initializeAudioForIOS = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    console.error("AudioContext no soportado en este navegador");
    return;
  }

  const audioContext = new AudioContext();
  if (audioContext.state === "suspended") {
    const unlock = () => {
      audioContext.resume().then(() => {
        console.log("Contexto de audio desbloqueado para iOS");
        // Pre-cargar audios después de desbloquear
        const audios = [AudioExito, Audioerror, AudioTriunfo, AudioRonda, AudioTemporizador];
        audios.forEach((audio, index) => {
          const name = ["AudioExito", "Audioerror", "AudioTriunfo", "AudioRonda", "AudioTemporizador"][index];
          audio.load();
          audio.play().then(() => {
            audio.pause();
            audio.currentTime = 0;
            console.log(`${name} preparado para iOS`);
          }).catch((err) => console.error(`Error al preparar ${name}:`, err));
        });
        document.removeEventListener("touchend", unlock);
      }).catch((err) => console.error("Error al desbloquear contexto de audio:", err));
    };
    document.addEventListener("touchend", unlock, { once: true });
  }
};

// Definición de audios
export const Audioerror = new Audio("./effect/incorrecta.aac");
export const AudioTriunfo = new Audio("./effect/triunfo.aac");
export const AudioRonda = new Audio("./effect/iniciarronda.aac");
export const AudioExito = new Audio("./effect/correcta_equipos.aac");
export const AudioTemporizador = new Audio("./effect/temporizador.aac");

[Audioerror, AudioTriunfo, AudioRonda, AudioTemporizador].forEach(
  (audio, index) => {
    const name = [
      "Audioerror",
      "AudioTriunfo",
      "AudioRonda",
      "AudioTemporizador",
    ][index];
    audio.addEventListener("loadeddata", () =>
      console.log(`${name} cargado correctamente`)
    );
    audio.addEventListener("error", (e) =>
      console.error(`Error al cargar ${name}:`, e.message || e)
    );
    audio.addEventListener("canplay", () =>
      console.log(`${name} listo para reproducirse`)
    );
    audio.load();
  }
);

export const mostrarAlerta = (alertaId, duration = 3000) => {
  const contenedorAlertas = document.getElementById("alertas");
  const nuevaAlerta = document.getElementById(alertaId);

  if (!contenedorAlertas || !nuevaAlerta) {
    console.error("Contenedor #alertas o alerta específica no encontrados");
    return;
  }

  if (alertaActual && alertaActual !== nuevaAlerta) {
    alertaActual.style.display = "none";
  }

  if (alertaActivaTimeout) {
    clearTimeout(alertaActivaTimeout);
    alertaActivaTimeout = null;
  }

  contenedorAlertas.style.display = "flex";
  nuevaAlerta.style.display = "flex";
  alertaActual = nuevaAlerta;

  if (alertaId === "alerta_5") {
    // El temporizador ahora se maneja en iniciarTemporizador
    return; // No establecer timeout aquí
  } else if (alertaId === "alerta_3" && getAudioEnabled()) {
    AudioTriunfo.play().catch((err) => console.error("Error al reproducir AudioTriunfo:", err));
  }

  if (duration > 0) {
    alertaActivaTimeout = setTimeout(() => {
      nuevaAlerta.style.display = "none";
      contenedorAlertas.style.display = "none";
      alertaActual = null;
      alertaActivaTimeout = null;
    }, duration);
  }
};

// Función debounce
const debounce = (func, wait = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Configurar respuestas
export const configurarRespuestas = () => {
  const respuestasCont = document.getElementById("respuestas__cont_teams");
  if (!respuestasCont) {
    console.error("Contenedor de respuestas no encontrado");
    return;
  }

  const forms = respuestasCont.querySelectorAll("form");
  if (forms.length === 0) {
    console.warn("No se encontraron formularios en respuestas__cont_teams");
    return;
  }

  forms.forEach((form, index) => {
    const inputTexto = form.querySelector(`#input_res${index + 1}_teams`);
    const inputValor = form.querySelector(`#res${index + 1}_value_teams`);

    if (!inputTexto || !inputValor) {
      console.error(`Inputs no encontrados para respuesta ${index + 1}`);
      return;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const texto = inputTexto.value.trim().toUpperCase();
      const valor = parseInt(inputValor.value) || 0;

      if (!texto || !valor) {
        console.warn(`Datos incompletos para respuesta ${index + 1}`);
        return;
      }

      const respuestaRef = getUserRef(`respuestas/res${index + 1}`);
      if (!respuestaRef) {
        console.error("Referencia a Firebase no obtenida");
        return;
      }

      set(respuestaRef, { texto, puntos: valor })
        .then(() => {
          console.log(`Respuesta ${index + 1} enviada: ${texto}, ${valor}`);
          inputTexto.value = "";
          inputValor.value = "";
        })
        .catch((error) => console.error("Error al enviar respuesta:", error));
    });
  });
};

// Enviar nombre de familia
const enviarFamilia = (nodo) => {
  const inputNombre = document.getElementById(`namefam${nodo}`);
  if (!inputNombre) {
    console.error(`Input namefam${nodo} no encontrado`);
    return;
  }

  // Forzar mayúsculas en tiempo real
  inputNombre.addEventListener("input", () => {
    inputNombre.value = inputNombre.value.toUpperCase();
  });

  const guardarEnFirebase = () => {
    const nombre = inputNombre.value.trim();
    if (!nombre) {
      console.warn(`Nombre vacío para fam${nodo}`);
      return;
    }

    const familiaRef = getUserRef(`familias/fam${nodo}`);
    if (!familiaRef) {
      console.error("Referencia a Firebase no obtenida");
      return;
    }

    get(familiaRef)
      .then((snapshot) => {
        const data = snapshot.val();
        const puntosActuales = data && data.puntos ? parseInt(data.puntos) : 0;

        update(familiaRef, { nombre, puntos: puntosActuales })
          .then(() => console.log(`Familia ${nodo} guardada: ${nombre}`))
          .catch((error) => console.error("Error al guardar familia:", error));
      })
      .catch((error) => console.error("Error al leer familia:", error));
  };

  const guardarConDebounce = debounce(guardarEnFirebase, 500);
  inputNombre.addEventListener("input", guardarConDebounce);
};

// Función para cargar avatares desde un archivo JSON
const loadAvatarsDynamically = async () => {
  try {
    const response = await fetch("../json/avatars.json");
    if (!response.ok) {
      throw new Error(`Error al cargar avatars.json: ${response.status}`);
    }
    const dynamicAvatars = await response.json();
    console.log("Avatares cargados desde JSON:", dynamicAvatars);
    return dynamicAvatars;
  } catch (err) {
    console.error("Error al cargar avatares dinámicos:", err);
    const fallbackAvatars = {
      default: "../img/avatars/default.png",
      av1: "../img/avatars/avatar1.png",
      av2: "../img/avatars/avatar2.png",
      av3: "../img/avatars/avatar3.png",
      av4: "../img/avatars/avatar4.png",
      av5: "../img/avatars/avatar5.png",
    };
    return fallbackAvatars;
  }
};

// Función para configurar avatares
export const setupAvatars = async (teams = ["fam1", "fam2"], options = {}) => {
  console.log("Iniciando setupAvatars con equipos:", teams);

  const {
    mode1Selector = "avatar-",
    mode2Selector = "av",
    selectClass = "avatar-select",
    optionClass = "avatar-option",
    onAvatarChange = () => {},
  } = options;

  const loadedAvatars = await loadAvatarsDynamically();
  const playerRef = getUserRef("singlePlayer");
  let unlockedAvatars = {};
  if (playerRef) {
    const snapshot = await get(playerRef);
    const data = snapshot.val();
    unlockedAvatars = data?.unlockedAvatars || checkUnlockedAvatars(data?.highScores || {});
  }

  teams.forEach((teamId) => {
    const avatarImgMode1 = document.getElementById(`${mode1Selector}${teamId}`);
    const avatarSelect = document.getElementById(`${selectClass}-${teamId}`);

    if (avatarImgMode1 && avatarSelect) {
      avatarSelect.outerHTML = `
        <div id="${selectClass}-${teamId}" class="${selectClass}" data-team="${teamId}" style="display: none;">
          ${Object.entries(loadedAvatars)
            .map(([avatarId, avatarSrc]) => {
              const isUnlocked = unlockedAvatars[avatarId] || LOCKED_CONTENT.avatars[avatarId]?.unlocked;
              return `<img src="${avatarSrc}" data-avatar="${avatarId}" alt="${avatarId}" class="${optionClass} ${!isUnlocked ? 'locked' : ''}" ${!isUnlocked ? 'title="Bloqueado"' : ''}>`;
            })
            .join("")}
        </div>
      `;
      const newAvatarSelect = document.getElementById(`${selectClass}-${teamId}`);

      avatarImgMode1.addEventListener("click", (e) => {
        e.stopPropagation();
        newAvatarSelect.style.display = newAvatarSelect.style.display === "none" ? "block" : "none";
      });

      newAvatarSelect.querySelectorAll(`.${optionClass}`).forEach((option) => {
        const isLocked = option.classList.contains('locked');
        option.addEventListener("click", (e) => {
          e.stopPropagation();
          const selectedAvatarId = option.dataset.avatar;
          if (!isLocked) {
            const avatarSrc = loadedAvatars[selectedAvatarId] || loadedAvatars.default;
            avatarImgMode1.src = avatarSrc;
            avatarImgMode1.dataset.avatarId = selectedAvatarId;

            const avatarRef = getUserRef(`familias/${teamId}/avatar`);
            set(avatarRef, selectedAvatarId)
              .then(() => {
                newAvatarSelect.style.display = "none";
                console.log(`Avatar de ${teamId} actualizado en Firebase: ${selectedAvatarId}`);
                onAvatarChange(teamId, selectedAvatarId, avatarSrc);
              })
              .catch((err) => console.error(`Error al guardar avatar de ${teamId}:`, err));
          } else {
            console.log(`Avatar ${selectedAvatarId} está bloqueado`);
            // Opcional: Mostrar mensaje al usuario
          }
        });
      });

      document.addEventListener("click", (e) => {
        if (!newAvatarSelect.contains(e.target) && e.target !== avatarImgMode1) {
          newAvatarSelect.style.display = "none";
        }
      }, { once: false });
    }

    const avatarImgMode1Display = document.getElementById(`${mode1Selector}${teamId}`);
    const avatarDivMode2Display = document.getElementById(`${mode2Selector}${teamId}`);

    const avatarRef = getUserRef(`familias/${teamId}/avatar`);
    if (avatarRef) {
      onValue(avatarRef, (snapshot) => {
        const avatarId = snapshot.val() || "default";
        const avatarSrc = loadedAvatars[avatarId] || loadedAvatars.default;

        if (avatarImgMode1Display) {
          avatarImgMode1Display.src = avatarSrc;
          avatarImgMode1Display.dataset.avatarId = avatarId;
        }

        if (avatarDivMode2Display) {
          avatarDivMode2Display.style.backgroundImage = `url("${avatarSrc}")`;
          avatarDivMode2Display.dataset.avatarId = avatarId;
        }
      });
    }
  });
};

export const mostrarRespuestasEnTiempoReal = (isActive = true) => {
  const respuestasRef = getUserRef("respuestas");
  if (!respuestasRef) return;

  if (!isActive && unsubscribeRespuestas) {
    unsubscribeRespuestas();
    unsubscribeRespuestas = null;
    return;
  }

  if (isActive && !unsubscribeRespuestas) {
    unsubscribeRespuestas = onValue(respuestasRef, (snapshot) => {
      const data = snapshot.val() || {};
      let totalPuntos = 0;

      ["1", "2", "3", "4", "5"].forEach((resId) => {
        const elemento = document.getElementById(`res${resId}`);
        if (elemento && data[`res${resId}`]) {
          const { puntos = 0 } = data[`res${resId}`];
          elemento.innerHTML = `<span class="respuesta-texto">${data[`res${resId}`].texto}</span><span class="respuesta-valor">${puntos}</span>`;
          totalPuntos += Number(puntos);
        } else if (elemento) {
          elemento.innerHTML = "";
        }
      });

      const pointsElement = document.getElementById("points");
      if (pointsElement && parseInt(pointsElement.dataset.totalPuntos) !== totalPuntos) {
        pointsElement.textContent = totalPuntos;
        pointsElement.dataset.totalPuntos = totalPuntos;
        console.log(`Puntos actualizados en UI: ${totalPuntos}`);
      }
      if (!isInitialLoad && getAudioEnabled() && Object.keys(data).length > 0) {
        AudioExito.currentTime = 0;
        AudioExito.play().catch((err) => console.error("Error al reproducir sonido:", err));
      }
    }, (error) => console.error("Error en listener de respuestas:", error));
  }
};

export const mostrarFamiliasEnTiempoReal = (isActive = true) => {
  const familiasRef = getUserRef("familias");
  if (!familiasRef) {
    console.warn("No se pudo obtener referencia a familias");
    return;
  }

  if (!isActive && unsubscribeFamilias) {
    unsubscribeFamilias();
    unsubscribeFamilias = null;
    return;
  }

  if (isActive && !unsubscribeFamilias) {
    unsubscribeFamilias = onValue(familiasRef, (snapshot) => {
      const data = snapshot.val() || {};
      console.log("Familias recibidas:", data);

      ["1", "2"].forEach((famId) => {
        // Elementos originales para nombre y puntos
        const nombreElemento = document.getElementById(`fam${famId}`);
        const puntosElemento = document.getElementById(`point${famId}`);
        // Elementos de los botones de puntos
        const labelPointsElemento = document.getElementById(`label_points_fam${famId}`);

        if (!nombreElemento || !puntosElemento || !labelPointsElemento) {
          console.warn(`Elementos fam${famId}, point${famId} o label_points_fam${famId} no encontrados`);
          return;
        }

        const { nombre = "", puntos = "0" } = data[`fam${famId}`] || {};

        // Actualizar elemento original de nombre
        nombreElemento.textContent = nombre;
        // Actualizar elemento de puntos
        puntosElemento.textContent = puntos;
        // Actualizar label_points_fam con emojis de triunfo
        labelPointsElemento.textContent = `🏆 ${nombre} 🏆`;
      });
    }, (error) => console.error("Error en listener de familias:", error));
  }
};

// Asignar puntos a una familia
let isAssigning = false;
const asignarPuntosAFamilia = (familiaId) => {
  if (isAssigning) {
    console.warn(`Asignación en curso para fam${familiaId}, ignorando`);
    return;
  }
  isAssigning = true;

  const pointsElement = document.getElementById("points");
  if (!pointsElement) {
    isAssigning = false;
    return;
  }

  const totalPuntos = parseInt(pointsElement.dataset.totalPuntos) || 0;
  console.log(`Intentando asignar ${totalPuntos} puntos a fam${familiaId}`);

  if (totalPuntos === 0) {
    console.warn("No hay puntos para asignar");
    isAssigning = false;
    return;
  }

  const familiaRef = getUserRef(`familias/fam${familiaId}`);
  const triunfoRef = getUserRef("estado/triunfo");
  const asignadoRef = getUserRef("estado/puntosAsignados");

  if (!familiaRef || !triunfoRef || !asignadoRef) {
    isAssigning = false;
    return;
  }

  get(asignadoRef).then((snapshot) => {
    if (snapshot.val()) {
      console.warn(`Puntos ya asignados para fam${familiaId} en Firebase`);
      isAssigning = false;
      return;
    }

    get(familiaRef).then((snapshot) => {
      const data = snapshot.val() || {};
      const puntosActuales = parseInt(data.puntos) || 0;
      const nuevosPuntos = puntosActuales + totalPuntos;

      Promise.all([
        update(familiaRef, { puntos: nuevosPuntos, nombre: data.nombre || `Familia ${familiaId}` }),
        set(triunfoRef, true),
        set(asignadoRef, true),
        limpiarRespuestasFirebase(),
      ]).then(() => {
        console.log(`Puntos asignados correctamente a fam${familiaId}: ${nuevosPuntos} (desde ${puntosActuales} + ${totalPuntos})`);
        pointsElement.textContent = "0";
        pointsElement.dataset.totalPuntos = "0";
        setTimeout(() => {
          set(triunfoRef, false);
          set(asignadoRef, false);
          isAssigning = false;
        }, 4000);
      }).catch((error) => {
        console.error(`Error al asignar puntos:`, error);
        isAssigning = false;
      });
    });
  });
};

let botonesPuntosConfigurados = false;
export const configurarBotonesPuntosFamilias = () => {
  if (botonesPuntosConfigurados) return;
  const btnFam1 = document.getElementById("label_points_fam1");
  const btnFam2 = document.getElementById("label_points_fam2");
  if (!btnFam1 || !btnFam2) return;

  const asignarConDebounce1 = debounce(() => asignarPuntosAFamilia(1), 300);
  const asignarConDebounce2 = debounce(() => asignarPuntosAFamilia(2), 300);

  btnFam1.addEventListener("click", asignarConDebounce1);
  btnFam2.addEventListener("click", asignarConDebounce2);
  botonesPuntosConfigurados = true;
  console.log("Botones de puntos configurados");
};


// Limpiar datos de familias
export const limpiarFamiliasFirebase = () => {
  const familiasRef = getUserRef("familias");
  return remove(familiasRef)
    .then(() => {
      console.log("Familias borradas");
      ["1", "2"].forEach((famId) => {
        const nombreElemento = document.getElementById(`namefam${famId}`);
        const puntosElemento = document.getElementById(`point${famId}`);
        if (nombreElemento) nombreElemento.value = "";
        if (puntosElemento) puntosElemento.textContent = "0";
      });
    })
    .catch((error) => console.error("Error al borrar familias:", error));
};

// Configurar familias y botones de puntos
const configurarFamilias = () => {
  enviarFamilia("1");
  enviarFamilia("2");
  mostrarFamiliasEnTiempoReal(true);

  const btnPointsFam1 = document.getElementById("input_points_fam1");
  const btnPointsFam2 = document.getElementById("input_points_fam2");

  if (btnPointsFam1 && !btnPointsFam1.dataset.listener) {
    const asignarConDebounce1 = debounce((e) => {
      e.preventDefault();
      asignarPuntosAFamilia("1");
    }, 300);
    btnPointsFam1.addEventListener("click", asignarConDebounce1);
    btnPointsFam1.dataset.listener = "true";
  }
  if (btnPointsFam2 && !btnPointsFam2.dataset.listener) {
    const asignarConDebounce2 = debounce((e) => {
      e.preventDefault();
      asignarPuntosAFamilia("2");
    }, 300);
    btnPointsFam2.addEventListener("click", asignarConDebounce2);
    btnPointsFam2.dataset.listener = "true";
  }
};

// Funciones de botones de estado
export const alternarError = () => {
  const errorRef = getUserRef("estado/error");
  if (!errorRef) return;
  hasInteracted = true;
  set(errorRef, true) // Siempre establecer en true para consistencia
    .then(() => {
      // Resetear a false después de un breve momento para permitir múltiples clics
      setTimeout(() => set(errorRef, false), 100);
    });
};

export const configurarBotonError = (audioEnabled) => {
  const btnError = document.getElementById("error");
  if (btnError) {
    btnError.addEventListener("click", (e) => {
      e.preventDefault();
      alternarError();
      if (audioEnabled()) Audioerror.play().catch((err) => console.error(err));
    });
  }
};

export const detectarCambioError = (audioEnabled) => {
  const errorRef = getUserRef("estado/error");
  if (!errorRef) return;
  let previousValue = null;
  onValue(errorRef, (snapshot) => {
    const errorActivo = snapshot.val();
    if (
      errorActivo &&
      errorActivo !== previousValue &&
      !isInitialLoad &&
      audioEnabled()
    ) {
      mostrarAlerta("alerta_2", 3000);
      Audioerror.play().catch((err) =>
        console.error("Error al reproducir Audioerror:", err)
      );
    }
    previousValue = errorActivo;
  });
};

export const detectarCambioTriunfo = (audioEnabled) => {
  const triunfoRef = getUserRef("estado/triunfo");
  if (!triunfoRef) return;

  onValue(triunfoRef, (snapshot) => {
    const triunfoActivo = snapshot.val();

    if (triunfoActivo && !isInitialLoad && audioEnabled()) {
      console.log("Mostrando alerta_3 por cambio en Firebase (triunfo = true)");
      // Detener cualquier audio previo para evitar solapamiento
      [Audioerror, AudioRonda, AudioTemporizador, AudioExito].forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      mostrarAlerta("alerta_3", 4000); // Mostrar alerta por 4 segundos
      AudioTriunfo.play().catch((err) => console.error("Error al reproducir AudioTriunfo:", err));

      // Reiniciar el estado a false después de la duración de la alerta
      setTimeout(() => {
        set(triunfoRef, false)
          .then(() => console.log("Estado triunfo reiniciado a false automáticamente"))
          .catch((error) => console.error("Error al reiniciar triunfo:", error));
      }, 4000);
    }
  }, (error) => {
    console.error("Error al escuchar triunfo:", error);
  });
};

export const detectarCambioRonda = (audioEnabled) => {
  const rondaRef = getUserRef("estado/ronda");
  if (!rondaRef) return;
  let previousValue = null;
  let isFirstRead = true;
  onValue(rondaRef, (snapshot) => {
    const rondaActiva = snapshot.val();
    if (isFirstRead) {
      previousValue = rondaActiva;
      isFirstRead = false;
      return;
    }
    if (
      rondaActiva !== previousValue &&
      !isInitialLoad &&
      audioEnabled() &&
      rondaActiva
    ) {
      mostrarAlerta("alerta_4", 3000);
      AudioRonda.play().catch((err) =>
        console.error("Error al reproducir AudioRonda:", err)
      );
    }
    previousValue = rondaActiva;
  });
};

const iniciarTemporizador = (duration) => {
  detenerTemporizador(); // Asegurarse de limpiar cualquier temporizador previo

  const temporizadorSpan = document.querySelector("#alerta_5 span") || document.createElement("span");
  const alertaTemporizador = document.getElementById("alerta_5");
  const contenedorAlertas = document.getElementById("alertas");

  if (!alertaTemporizador.contains(temporizadorSpan)) alertaTemporizador.appendChild(temporizadorSpan);

  temporizadorInicio = Date.now();
  const finTemporizador = temporizadorInicio + duration;

  if (getAudioEnabled()) {
    AudioTemporizador.loop = true;
    AudioTemporizador.play().catch((err) => console.error("Error al reproducir AudioTemporizador:", err));
  }

  const actualizarTemporizador = () => {
    const tiempoActual = Date.now();
    const tiempoRestante = Math.max(0, Math.round((finTemporizador - tiempoActual) / 1000));

    temporizadorSpan.textContent = tiempoRestante;

    if (tiempoRestante > 0) {
      temporizadorFrame = requestAnimationFrame(actualizarTemporizador);
    } else {
      detenerTemporizador();
    }
  };

  mostrarAlerta("alerta_5", duration); // Mostrar la alerta
  temporizadorFrame = requestAnimationFrame(actualizarTemporizador);
};

const detenerTemporizador = () => {
  if (temporizadorFrame) {
    cancelAnimationFrame(temporizadorFrame);
    temporizadorFrame = null;
  }
  if (alertaActivaTimeout) {
    clearTimeout(alertaActivaTimeout);
    alertaActivaTimeout = null;
  }
  if (getAudioEnabled()) {
    AudioTemporizador.loop = false;
    AudioTemporizador.pause();
    AudioTemporizador.currentTime = 0;
  }
  const alertaTemporizador = document.getElementById("alerta_5");
  const contenedorAlertas = document.getElementById("alertas");
  if (alertaTemporizador) alertaTemporizador.style.display = "none";
  if (contenedorAlertas) contenedorAlertas.style.display = "none";
  alertaActual = null;
  console.log("Temporizador detenido manualmente");
};

// Función para obtener la duración actual desde Firebase o localStorage
const getTimerDuration = () => {
  return new Promise((resolve) => {
    const timerRef = getUserRef("estado/timerDuration");
    if (timerRef) {
      get(timerRef).then((snapshot) => {
        const firebaseDuration = snapshot.val();
        const localDuration = parseInt(localStorage.getItem("timerDuration")) || 13;
        resolve(firebaseDuration || localDuration);
      }).catch(() => resolve(parseInt(localStorage.getItem("timerDuration")) || 13));
    } else {
      resolve(parseInt(localStorage.getItem("timerDuration")) || 13);
    }
  });
};

// Modificar alternarTemporizador para usar la duración dinámica
export const alternarTemporizador = () => {
  const temporizadorRef = getUserRef("estado/temporizador");
  if (!temporizadorRef) return;

  get(temporizadorRef).then((snapshot) => {
    const valorActual = snapshot.val() === null ? false : snapshot.val();
    const nuevoValor = !valorActual;

    getTimerDuration().then((duration) => {
      set(temporizadorRef, nuevoValor)
        .then(() => {
          hasInteracted = true;
          if (nuevoValor) {
            iniciarTemporizador(duration * 1000); // Convertir a milisegundos
          } else {
            detenerTemporizador();
          }
        })
        .catch((error) => console.error("Error al alternar temporizador:", error));
    });
  });
};

// Actualizar timerDuration en Firebase y localStorage
const timerSelect = document.getElementById("timer-duration");
if (timerSelect) {
  getTimerDuration().then((duration) => {
    timerSelect.value = duration; // Establecer valor inicial
    console.log(`Valor inicial del temporizador establecido: ${duration} segundos`);
  });

  timerSelect.addEventListener("change", () => {
    const newDuration = parseInt(timerSelect.value, 10);
    localStorage.setItem("timerDuration", newDuration);
    if (auth.currentUser) {
      const timerRef = getUserRef("estado/timerDuration");
      set(timerRef, newDuration)
        .then(() => console.log(`Duración del temporizador actualizada: ${newDuration} segundos`))
        .catch((error) => console.error("Error al guardar duración:", error));
    }
  });
} else {
  console.error("Elemento #timer-duration no encontrado en el DOM");
}

// Detectar cambios en timerDuration y ajustar el temporizador activo
export const detectarCambioTimerDuration = (audioEnabled) => {
  const timerDurationRef = getUserRef("estado/timerDuration");
  if (!timerDurationRef) return;

  onValue(timerDurationRef, (snapshot) => {
    const newDuration = snapshot.val() || 13;
    localStorage.setItem("timerDuration", newDuration); // Sincronizar localStorage
    const temporizadorRef = getUserRef("estado/temporizador");

    get(temporizadorRef).then((snapshot) => {
      const isActive = snapshot.val();
      if (isActive && temporizadorFrame) {
        // Si el temporizador está activo, reiniciarlo con la nueva duración
        detenerTemporizador();
        iniciarTemporizador(newDuration * 1000);
        console.log(`Temporizador reiniciado con nueva duración: ${newDuration} segundos`);
      }
    });
  });
};

// Detectar cambios en el temporizador desde Firebase
export const detectarCambioTemporizador = (audioEnabled) => {
  const temporizadorRef = getUserRef("estado/temporizador");
  if (!temporizadorRef) return;
  let previousValue = null;

  onValue(temporizadorRef, (snapshot) => {
    const temporizadorActivo = snapshot.val();
    const duration = (parseInt(localStorage.getItem("timerDuration")) || 13) * 1000;

    if (temporizadorActivo && temporizadorActivo !== previousValue && !isInitialLoad && audioEnabled() && !temporizadorFrame) {
      console.log("Activando temporizador desde Firebase con duración:", duration / 1000, "segundos");
      iniciarTemporizador(duration);
    } else if (!temporizadorActivo && previousValue && temporizadorFrame) {
      console.log("Cancelando temporizador desde Firebase");
      detenerTemporizador();
    }
    previousValue = temporizadorActivo;
  });
};

export const configurarBotonTemporizador = (audioEnabled) => {
  const btnTemporizador = document.getElementById("temporizador");
  if (btnTemporizador) {
    btnTemporizador.addEventListener("click", (e) => {
      e.preventDefault();
      alternarTemporizador();
    });
  }
};

export const configurarBotonRecargar = () => {
  const btnRecargar = document.getElementById("recargar");
  if (btnRecargar) {
    btnRecargar.addEventListener("click", (e) => {
      e.preventDefault();
      hasInteracted = true; // Actualizar hasInteracted
      cargarPreguntaAleatoria();
    });
  }
};

// Generar sessionID para el dispositivo no autenticado
export const generarSessionID = () => {
  const sessionID = uuidv4();
  const sessionRef = ref(database, `pending_sessions/${sessionID}`);
  const expirationTime = Date.now() + 5 * 60 * 1000; // 5 minutos desde ahora

  return set(sessionRef, {
    sessionID,
    status: "pending",
    expires: expirationTime,
  })
    .then(() => {
      console.log("SessionID generado y guardado:", sessionID);
      // Programar la eliminación automática después de 5 minutos
      setTimeout(() => {
        remove(sessionRef)
          .then(() => console.log(`Session ${sessionID} eliminada automáticamente tras 5 minutos`))
          .catch((error) => console.error("Error al eliminar sesión automáticamente:", error));
      }, 5 * 60 * 1000); // 5 minutos en milisegundos
      return sessionID;
    })
    .catch((error) => {
      console.error("Error al guardar sessionID:", error);
      throw error;
    });
};

// Mostrar QR en la pantalla de login
export const mostrarQRLogin = (sessionID) => {
  const qrContainer = document.getElementById("qr-login-container");
  if (!qrContainer) {
    console.error("Contenedor QR no encontrado");
    return;
  }

  qrContainer.innerHTML = ""; // Limpiar contenido previo
  const qrUrl = `${window.location.origin}/html/transfer-session?sessionID=${sessionID}`;
  console.log("URL del QR:", qrUrl);

  let attempts = 0;
  const maxAttempts = 50; // Límite de 5 segundos (50 * 100ms)

  const generateQR = () => {
    // Obtener dimensiones actuales del contenedor
    const width = qrContainer.offsetWidth || qrContainer.clientWidth;
    const height = qrContainer.offsetHeight || qrContainer.clientHeight;

    if (width > 0 && height > 0) {
      console.log("Generando QR con tamaño detectado:", width, "x", height);
      new QRCode(qrContainer, {
        text: qrUrl,
        width: width, // Usar el ancho detectado
        height: height, // Usar la altura detectada
        colorDark: "#ffffff",
        colorLight: "#8294c4",
        correctLevel: QRCode.CorrectLevel.H,
      });
    } else if (attempts < maxAttempts) {
      attempts++;
      console.warn(
        `El contenedor QR aún no tiene tamaño (intento ${attempts}/${maxAttempts}), reintentando...`
      );
      setTimeout(generateQR, 100); // Reintentar después de 100ms
    } else {
      console.error(
        "No se pudo generar el QR: el contenedor no tiene dimensiones tras múltiples intentos."
      );
      qrContainer.innerHTML =
        "<p>Error: No se pudo generar el QR. Asegúrate de que el contenedor sea visible.</p>";
    }
  };

  // Forzar visibilidad del contenedor si no está visible
  if (
    window.getComputedStyle(qrContainer).display === "none" ||
    !qrContainer.offsetParent
  ) {
    qrContainer.style.display = "block"; // Asegurar que sea visible
  }

  // Ejecutar la generación del QR
  generateQR();
};

// Escuchar transferencia de idToken y autenticar (sin cambios)
export const escucharTransferenciaSesion = (sessionID, elements) => {
  const sessionRef = ref(database, `pending_sessions/${sessionID}`);
  console.log("Escuchando sesión en:", sessionRef.toString());

  const timeout = setTimeout(() => {
    console.error("Tiempo de espera agotado para la transferencia de sesión");
    remove(sessionRef)
      .then(() => console.log(`Session ${sessionID} eliminada por timeout`))
      .catch((error) => console.error("Error al eliminar sesión por timeout:", error));
    toggleView(elements, { login: true });
  }, 30000); // 30 segundos de espera máxima

  const unsubscribe = onValue(sessionRef, (snapshot) => {
    const data = snapshot.val();
    console.log("Datos de la sesión recibidos:", JSON.stringify(data));
    if (data && data.status === "authenticated" && data.email && data.password) {
      clearTimeout(timeout);
      unsubscribe(); // Detener el listener
      console.log("Intentando autenticar con email:", data.email);
      signInWithEmailAndPassword(auth, data.email, data.password)
        .then((userCredential) => {
          console.log("Autenticado con éxito en el dispositivo no autenticado:", userCredential.user.uid);
          toggleView(elements, { selectMode: true });
          const checkbox = document.getElementById("qr_login");
          if (checkbox) checkbox.checked = false; // Desmarcar el checkbox
          initializeAudioForIOS();
          configurarRespuestas();
          configurarFamilias();
          mostrarFamiliasEnTiempoReal();
          mostrarRespuestasEnTiempoReal();
          remove(sessionRef)
            .then(() => console.log(`Session ${sessionID} eliminada tras autenticación exitosa`))
            .catch((error) => console.error("Error al eliminar sesión tras autenticación:", error));
        })
        .catch((error) => {
          console.error("Error al autenticar en el dispositivo no autenticado:", error.code, error.message);
          toggleView(elements, { login: true });
          remove(sessionRef);
        });
    } else if (data && data.status === "pending") {
      console.log("Esperando autenticación para sessionID:", sessionID);
    } else {
      console.warn("Datos incompletos o estado no válido:", data);
    }
  }, (error) => {
    console.error("Error en el listener de la sesión:", error);
    clearTimeout(timeout);
    toggleView(elements, { login: true });
    remove(sessionRef);
  });
};

// Inicializar QR Login con el checkbox #qr_login
export const inicializarQRLogin = (elements) => {
  const qrContainer = document.getElementById("qr-login-container");
  const qrInfo = qrContainer.closest(".qr_login_info");
  const checkbox = document.getElementById("qr_login");

  if (!qrContainer || !qrInfo || !checkbox) {
    console.error("Elementos necesarios para QR Login no encontrados");
    return;
  }

  const toggleQRVisibility = (sessionID) => {
    if (checkbox.checked) {
      qrInfo.style.display = "flex";
      qrInfo.style.width = "100%";
      qrInfo.style.height = "200px";
      qrContainer.style.width = "100%";
      qrContainer.style.height = "100%";
      setTimeout(() => mostrarQRLogin(sessionID), 200);
      console.log("Iniciando listener para sessionID:", sessionID);
      escucharTransferenciaSesion(sessionID, elements); // Iniciar el listener
    } else {
      qrInfo.style.display = "none";
      qrContainer.innerHTML = "";
    }
  };

  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      generarSessionID()
        .then((sessionID) => {
          console.log("SessionID generado por checkbox:", sessionID);
          toggleQRVisibility(sessionID);
        })
        .catch((error) => {
          console.error("Error al generar sessionID desde checkbox:", error);
          checkbox.checked = false;
        });
    } else {
      qrInfo.style.display = "none";
      qrContainer.innerHTML = "";
    }
  });
};

window.addEventListener("resize", () => {
  const qrContainer = document.getElementById("qr-login-container");
  if (qrContainer && qrContainer.innerHTML !== "") {
  }
});

// Mostrar errores en la interfaz
const mostrarError = (seccion, tipo) => {
  const errores = {
    login: {
      all: "errorall",
      user: "erroru",
      pass: "errorp",
    },
    registrer: {
      all: "registrer_errorall",
      user: "registrer_erroru",
      pass: "registrer_errorp",
      exists: "registrer_errorue",
    },
  };
  const formularios = {
    login: "form_log",
    registrer: "form_registrer",
  };

  const errorId = errores[seccion][tipo];
  const formId = formularios[seccion];
  const errorElement = document.getElementById(errorId);
  const formElement = document.getElementById(formId);

  if (errorElement && formElement) {
    formElement.style.display = "none";
    errorElement.style.display = "flex";
    setTimeout(() => {
      errorElement.style.display = "none";
      formElement.style.display = "flex";
    }, 3000);
  }
};

// Función para verificar si el usuario ya existe en tiempo real
const verificarUsuarioExistente = (username, inputElement) => {
  const usersRef = ref(database, 'usuarios');
  let debounceTimeout;

  inputElement.addEventListener('input', () => {
    const currentUsername = inputElement.value.trim().toLowerCase();
    clearTimeout(debounceTimeout);
    inputElement.style.borderColor = '#ff0000'; // Rojo por defecto mientras verifica

    debounceTimeout = setTimeout(() => {
      get(usersRef).then((snapshot) => {
        const users = snapshot.val() || {};
        const usernameExists = Object.keys(users).some(userId => 
          users[userId]?.infoUser?.user === currentUsername
        );

        if (usernameExists) {
          inputElement.style.borderColor = '#ff0000'; // Rojo si existe
          inputElement.setCustomValidity('Este usuario ya existe');
        } else {
          inputElement.style.borderColor = '#00ff00'; // Verde si no existe
          inputElement.setCustomValidity('');
        }
      }).catch((error) => {
        console.error('Error al verificar usuario:', error);
        inputElement.style.borderColor = '#ff0000'; // Rojo en caso de error
      });
    }, 300); // Debounce de 300ms
  });
};

// Función modificada para registrar usuario
export const registrarUsuario = async (elements) => {
  console.log("Iniciando registrarUsuario");

  const nombreInput = document.getElementById("nombre");
  const edadInput = document.getElementById("edad");
  const sexoInput = document.getElementById("sexo");
  const userInputElement = document.getElementById("user");
  const emailInput = document.getElementById("reg_email");
  const passInputElement = document.getElementById("reg_pass");

  const nombre = nombreInput ? nombreInput.value.trim() : "";
  const edad = edadInput ? edadInput.value.trim() : "";
  const sexo = sexoInput ? sexoInput.value : "";
  const userInput = userInputElement ? userInputElement.value.trim().toLowerCase() : "";
  const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
  const passInput = passInputElement ? passInputElement.value.trim() : "";

  console.log("Datos capturados del formulario:", {
    nombre: nombre,
    edad: edad,
    sexo: sexo,
    user: userInput,
    email: email,
    pass: passInput
  });

  if (!nombre || !edad || !sexo || !userInput || !email || !passInput) {
    console.log("Faltan datos en el formulario:", { nombre, edad, sexo, user: userInput, email, pass: passInput });
    throw new Error("Todos los campos son obligatorios");
  }

  try {
    // Crear el usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, passInput);
    const user = userCredential.user;
    console.log("Usuario creado en Firebase Auth:", user.uid);

    // Usar el UID del usuario como clave en la base de datos
    const userRef = ref(database, `usuarios/${user.uid}`);
    
    // Preparar los datos del usuario
    const userData = {
      infoUser: {
        nombre,
        edad: parseInt(edad),
        sexo,
        user: userInput, // Guardamos el nombre de usuario como dato, no como clave
        email
      }
    };

    // Guardar los datos en Firebase Database usando el UID
    await set(userRef, userData);
    console.log("Datos guardados en Firebase Database con UID:", user.uid);

    // Enviar correo de verificación
    await sendEmailVerification(user);
    console.log("Correo de verificación enviado a:", email);

    // Mostrar alerta de verificación
    const verifyAlert = document.getElementById("verify-email-alert");
    if (verifyAlert) {
      verifyAlert.style.display = "block";
      const closeButton = document.getElementById("close-alert");
      if (closeButton) {
        return new Promise((resolve) => {
          closeButton.addEventListener("click", () => {
            verifyAlert.style.display = "none";
            resolve();
          }, { once: true });
        });
      } else {
        console.error("Botón #close-alert no encontrado");
        return Promise.resolve();
      }
    } else {
      console.error("Alerta #verify-email-alert no encontrada");
      return Promise.resolve();
    }
  } catch (error) {
    console.error("Error en registrarUsuario:", error.message);
    if (error.code === "auth/email-already-in-use") {
      console.log("El correo ya está registrado:", email);
      throw new Error("email-already-in-use");
    }
    throw error;
  }
};
// Modificar iniciarSesion para mantener compatibilidad
export const iniciarSesion = (elements) => {
  const email = document.getElementById("email").value.trim();
  const passInput = document.getElementById("pass").value.trim();

  if (!email || !passInput) {
    mostrarError("login", "all"); // Mostrar error genérico si faltan datos
    return;
  }

  signInWithEmailAndPassword(auth, email, passInput)
    .then((userCredential) => {
      const user = userCredential.user;
      if (user.emailVerified) {
        console.log("Inicio de sesión exitoso, email verificado:", user.uid);
        initializeAudioForIOS();
        document.getElementById("Logincont").classList.add("animacionlog");
        setTimeout(() => {
          toggleView(elements, { selectMode: true });
          configurarRespuestas();
          configurarFamilias();
          mostrarFamiliasEnTiempoReal();
          mostrarRespuestasEnTiempoReal();
        }, 1000);
      } else {
        console.log("Correo no verificado:", email);
        signOut(auth); // Cerrar sesión inmediatamente
        const notVerifiedAlert = document.getElementById("not-verified-alert");
        if (notVerifiedAlert) {
          notVerifiedAlert.style.display = "block";
          const closeButton = document.getElementById("close-not-verified-alert");
          if (closeButton) {
            closeButton.addEventListener("click", () => {
              notVerifiedAlert.style.display = "none";
              toggleView(elements, { home: true }); // Redirigir a home al cerrar
            }, { once: true });
          } else {
            console.error("Botón #close-not-verified-alert no encontrado");
            toggleView(elements, { home: true });
          }
        } else {
          console.error("Alerta #not-verified-alert no encontrada");
          toggleView(elements, { home: true });
        }
      }
    })
    .catch((error) => {
      console.error("Error al iniciar sesión:", error.code, error.message);
      switch (error.code) {
        case "auth/user-not-found":
          mostrarError("login", "user");
          break;
        case "auth/wrong-password":
          mostrarError("login", "pass");
          break;
        case "auth/invalid-email":
          mostrarError("login", "user");
          break;
        default:
          mostrarError("login", "all");
          break;
      }
    });
};

// Inicializar la verificación en tiempo real
document.addEventListener("DOMContentLoaded", () => {
  const userInput = document.getElementById("user");
  if (userInput) {
    verificarUsuarioExistente(userInput.value, userInput);
  }
});

export const setupTeamsCategoryListener = () => {
  const categoriaRef = getUserRef("estado/categoria");
  if (!categoriaRef) return;

  onValue(categoriaRef, (snapshot) => {
    const newCategory = snapshot.val() || "general";
    if (document.querySelector(".admincont").classList.contains("teams-mode")) {
      console.log(`Categoría cambiada en modo equipos desde Firebase: ${newCategory}`);
      cargarPreguntaAleatoria(); // Recargar con la nueva categoría
    }
  });
};

// Llamar esta función en initializeDatabase
export const initializeDatabase = (audioEnabled) => {
  if (!currentUser) {
    console.warn("No hay usuario autenticado, esperando autenticación...");
    onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        proceedWithInitialization(audioEnabled);
      }
    });
  } else {
    proceedWithInitialization(audioEnabled);
  }
};

const proceedWithInitialization = (audioEnabled) => {
  const estadoRef = getUserRef("estado");
  if (!estadoRef) return;

  setTimeout(() => {
    cargarPreguntaAleatoria();
    configurarBotonError(audioEnabled);
    configurarBotonTemporizador(audioEnabled);
    detectarCambioError(audioEnabled);
    detectarCambioTriunfo(audioEnabled);
    detectarCambioRonda(audioEnabled);
    detectarCambioTemporizador(audioEnabled);
    detectarCambioTimerDuration(audioEnabled);
    configurarBotonRecargar();
    setupAvatars(["fam1", "fam2"]);
    initializeThemeListener();
    configurarBotonesPuntosFamilias();
    setupTeamsCategoryListener(); // Mantener el listener para cambios en Firebase
    setupCategorySelector(); // Reemplazar setupTeamsCategorySelector
  }, 0);

  loadInitialTheme().then(() => {
    setTimeout(() => (isInitialLoad = false), 1000);
  });
};