// ============================================
// CONFIGURACIÓN DE PHASER
// ============================================

const config = {
    type: Phaser.Canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    transparent: true,
    canvas: document.createElement('canvas'),
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [VillageScene],
    render: {
        pixelArt: true,
        antialias: false,
        willReadFrequently: true,
        clearBeforeRender: true
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
    if (game && game.isRunning) {
        game.scale.resize(window.innerWidth, window.innerHeight);
    }
});
