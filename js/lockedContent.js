// lockedContent.js
import { getUserRef, set, get, onValue } from './database.js';

// Definición del contenido bloqueado

export const LOCKED_CONTENT = {
  avatars: {
    //gastronomia_internacional
    default: { unlocked: true }, // Avatar por defecto siempre desbloqueado
    //4 misterios_y_leyendas
    av1: { pointsRequired: 500, category: "misterios_y_leyendas" },
    av2: { pointsRequired: 1000, category: "misterios_y_leyendas" },
    av3: { pointsRequired: 500, category: "misterios_y_leyendas" },
    av4: { pointsRequired: 1000, category: "misterios_y_leyendas" },
    //4 peliculas
    av5: { pointsRequired: 500, category: "peliculas" },
    av6: { pointsRequired: 1000, category: "peliculas" },
    av7: { pointsRequired: 500, category: "peliculas" },
    av8: { pointsRequired: 1000, category: "peliculas" },
    //4 musica
    av23: { pointsRequired: 500, category: "musica" },
    av9: { pointsRequired: 1000, category: "musica" },
    av10: { pointsRequired: 500, category: "musica" },
    av11: { pointsRequired: 1000, category: "musica" },
    //4 animales
    av12: { pointsRequired: 500, category: "animales" },
    av13: { pointsRequired: 1000, category: "animales" },
    av14: { pointsRequired: 500, category: "animales" },
    av15: { pointsRequired: 1000, category: "animales" },
    //4 peliculas animadas
    av16: { pointsRequired: 500, category: "peliculas_animadas" },
    av17: { pointsRequired: 1000, category: "peliculas_animadas" },
    av18: { pointsRequired: 500, category: "peliculas_animadas" },
    av35: { pointsRequired: 500, category: "peliculas_animadas" },
    //4 kpop
    av19: { pointsRequired: 500, category: "kpop" },
    av20: { pointsRequired: 1000, category: "kpop" },
    av21: { pointsRequired: 500, category: "kpop" },
    av22: { pointsRequired: 1000, category: "kpop" },
    //4 videojuegos
    av24: { pointsRequired: 500, category: "videojuegos" },
    av25: { pointsRequired: 1000, category: "videojuegos" },
    av26: { pointsRequired: 500, category: "videojuegos" },
    av27: { pointsRequired: 1000, category: "videojuegos" },
    //4 superheroes
    av28: { pointsRequired: 500, category: "superheroes" },
    av29: { pointsRequired: 1000, category: "superheroes" },
    av30: { pointsRequired:  500, category: "superheroes" },
    av31: { pointsRequired:  1000, category: "superheroes" },
    //2 historia
    av33: { pointsRequired: 500, category: "historia" },
    av36: { pointsRequired: 1000, category: "historia" },
    //3 geografia
    av32: { pointsRequired: 500, category: "geografia" },
    av37: { pointsRequired: 1000, category: "geografia" },
    av38: { pointsRequired: 1000, category: "geografia" },
    //4 tecnologia
    av41: { pointsRequired: 500, category: "tecnologia" },
    av34: { pointsRequired: 1000, category: "tecnologia" },
    av39: { pointsRequired: 500, category: "tecnologia" },
    av40: { pointsRequired: 1000, category: "tecnologia" },
    //1 ciencia_ficcion
    av42: { pointsRequired: 1000, category: "ciencia_ficcion" }
  },
  categories: {
    general: { unlocked: true }, 
    animales: { pointsRequired: 1000, category: "general" },
    historia: { pointsRequired: 1000, category: "animales" },
    geografia: { pointsRequired: 1000, category: "historia" },
    tecnologia: { pointsRequired: 1000, category: "geografia" },
    ciencia_ficcion: { pointsRequired: 1000, category: "tecnologia" },
    peliculas: { unlocked: true }, 
    peliculas_animadas: { pointsRequired: 1000, category: "peliculas" },
    superheroes: { pointsRequired: 1000, category: "peliculas_animadas" },
    videojuegos: { pointsRequired: 1000, category: "superheroes" },
    musica: { unlocked: true }, 
    kpop: { pointsRequired: 1000, category: "musica" },
    gastronomia_internacional: { pointsRequired: 1000, category: "kpop" },
    misterios_y_leyendas: { pointsRequired: 1000, category: "gastronomia_internacional" }
  }
};

// Verificar avatares desbloqueados
export const checkUnlockedAvatars = (highScores) => {
  const unlockedAvatars = {};
  Object.entries(LOCKED_CONTENT.avatars).forEach(([avatarId, { pointsRequired, category, unlocked }]) => {
    const categoryScore = highScores[category] || 0;
    unlockedAvatars[avatarId] = unlocked || categoryScore >= pointsRequired;
  });
  return unlockedAvatars;
};

// Verificar categorías desbloqueadas
export const checkUnlockedCategories = (highScores) => {
  const unlockedCategories = {};
  Object.entries(LOCKED_CONTENT.categories).forEach(([id, { pointsRequired, category, unlocked }]) => {
    const categoryScore = highScores[category] || 0;
    unlockedCategories[id] = unlocked || categoryScore >= pointsRequired;
  });
  return unlockedCategories;
};

// Actualizar UI de avatares
export const updateLockedAvatars = (unlockedAvatars) => {
  document.querySelectorAll(".avatar-option").forEach(option => {
    const avatarId = option.dataset.avatar;
    const isUnlocked = unlockedAvatars[avatarId] || LOCKED_CONTENT.avatars[avatarId]?.unlocked || false;
    option.classList.toggle("locked", !isUnlocked);
    option.style.position = "relative"; // Para posicionar el candado
    if (!isUnlocked) {
      if (!option.querySelector(".lock-icon")) {
        const lockIcon = document.createElement("span");
        lockIcon.className = "lock-icon";
        lockIcon.innerHTML = "🔒"; // Icono de candado
        lockIcon.style.position = "absolute";
        lockIcon.style.top = "5px";
        lockIcon.style.right = "5px";
        lockIcon.style.fontSize = "20px";
        lockIcon.style.color = "#fff";
        option.appendChild(lockIcon);
      }
      option.title = "Bloqueado";
    } else {
      const lockIcon = option.querySelector(".lock-icon");
      if (lockIcon) lockIcon.remove();
      option.title = "";
    }
  });
};

// Actualizar UI de categorías
export const updateLockedCategories = (unlockedCategories) => {
  document.querySelectorAll(".category-item").forEach(item => {
    const categoryId = item.getAttribute("data-category");
    const isUnlocked = unlockedCategories[categoryId] || LOCKED_CONTENT.categories[categoryId]?.unlocked || false;
    item.classList.toggle("locked", !isUnlocked);
    item.style.position = "relative"; // Para posicionar el candado

    if (!isUnlocked) {
      if (!item.querySelector(".lock-icon")) {
        const lockIcon = document.createElement("span");
        lockIcon.className = "lock-icon";
        lockIcon.innerHTML = "🔒"; // Icono de candado
        lockIcon.style.position = "absolute";
        lockIcon.style.top = "0";
        lockIcon.style.fontSize = "15px";
        lockIcon.style.color = "#fff";
        item.appendChild(lockIcon);
      }
      item.title = "Bloqueado";
      item.style.pointerEvents = "none"; // Deshabilitar interacción
    } else {
      const lockIcon = item.querySelector(".lock-icon");
      if (lockIcon) lockIcon.remove();
      item.title = "";
      item.style.pointerEvents = "auto"; // Habilitar interacción
    }
  });
};

// Sincronizar con Firebase
export const syncLockedContent = async (highScores, playerAvatar) => {
  const playerRef = getUserRef("singlePlayer");
  if (!playerRef) return;

  const unlockedAvatars = checkUnlockedAvatars(highScores);
  const unlockedCategories = checkUnlockedCategories(highScores);

  const playerData = {
    highScores,
    unlockedAvatars,
    unlockedCategories,
    avatar: playerAvatar, // Usar el parámetro pasado
  };

  try {
    await set(playerRef, playerData);
    console.log("Contenido bloqueado sincronizado en Firebase:", playerData);
    updateLockedAvatars(unlockedAvatars);
    updateLockedCategories(unlockedCategories);
  } catch (error) {
    console.error("Error al sincronizar contenido bloqueado:", error);
  }
};

// Listener en tiempo real
export const setupLockedContentListener = (callback) => {
  const playerRef = getUserRef("singlePlayer");
  if (!playerRef) return;

  onValue(playerRef, (snapshot) => {
    const data = snapshot.val() || {};
    const highScores = data.highScores || {};
    const unlockedAvatars = checkUnlockedAvatars(highScores);
    const unlockedCategories = checkUnlockedCategories(highScores);

    updateLockedAvatars(unlockedAvatars);
    updateLockedCategories(unlockedCategories);
    if (callback) callback({ unlockedAvatars, unlockedCategories });
  });
};