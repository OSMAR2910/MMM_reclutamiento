import DinoGame from './game/DinoGame.js'
// Mapa de alertas con su ID y tiempo de visualización
const alertasConfig = {
  alertasgame: 3000,
  alerta_10: 3000,
};

// Función genérica para mostrar y ocultar alertas
const mostrarAlerta = (alertaId) => {
  const alerta = document.getElementById(alertaId);
  const tiempo = alertasConfig[alertaId] || 3000; // Usar tiempo configurado o 3000ms por defecto

  alerta.style.display = "flex"; // Mostrar alerta

  setTimeout(() => {
    alerta.style.display = "none"; // Ocultar alerta después de un tiempo
  }, tiempo);
};
const game = new DinoGame() // El tamaño se calculará automáticamente

mostrarAlerta("alertasgame");
mostrarAlerta("alerta_10");

game.start().catch(console.error)


const isTouchDevice =
  'ontouchstart' in window ||
  navigator.maxTouchPoints > 0 ||
  navigator.msMaxTouchPoints > 0

if (isTouchDevice) {
  document.addEventListener('touchstart', ({ touches }) => {
    if (touches.length === 1) {
      game.onInput('jump')
    } else if (touches.length === 2) {
      game.onInput('duck')
    }
  })

  document.addEventListener('touchend', ({ touches }) => {
    game.onInput('stop-duck')
  })
} else {
  const keycodes = {
    // up, spacebar
    JUMP: { 38: 1, 32: 1 },
    // down
    DUCK: { 40: 1 },
  }

  document.addEventListener('keydown', ({ keyCode }) => {
    if (keycodes.JUMP[keyCode]) {
      game.onInput('jump')
    } else if (keycodes.DUCK[keyCode]) {
      game.onInput('duck')
    }
  })

  document.addEventListener('keyup', ({ keyCode }) => {
    if (keycodes.DUCK[keyCode]) {
      game.onInput('stop-duck')
    }
  })
}

game.start().catch(console.error)
