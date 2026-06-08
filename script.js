// ============================================
// CONFIGURACIÓN DE PHASER
// ============================================

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    canvas: document.getElementById('mapa-canvas'),
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [VillageScene],
    render: {
        type: Phaser.Canvas,
        pixelArt: true,
        antialias: false,
        willReadFrequently: true
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        fullscreenTarget: 'parent'
    }
};

// Crear el juego
const game = new Phaser.Game(config);

// Redimensionar cuando cambie la ventana (correctamente)
window.addEventListener('resize', () => {
    if (game.isRunning) {
        game.scale.resize(window.innerWidth, window.innerHeight);
    }
});
